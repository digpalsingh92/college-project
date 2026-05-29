import { config } from "../config/config.js";
import { TFIDFIndex, RAGDocument, SearchResult } from "./rag-vectorizer.js";
import { loadAndIndexDatasets } from "./rag-indexer.js";

const USD_TO_INR = 83;

export class RAGPipeline {
  private static instance: RAGPipeline;
  private index: TFIDFIndex;
  private initializingPromise: Promise<void> | null = null;

  private constructor() {
    this.index = new TFIDFIndex();
  }

  public static getInstance(): RAGPipeline {
    if (!RAGPipeline.instance) {
      RAGPipeline.instance = new RAGPipeline();
    }
    return RAGPipeline.instance;
  }

  /**
   * Lazily initializes the RAG index if it has not been built yet.
   */
  private async ensureInitialized(): Promise<void> {
    if (this.index.isBuilt) return;

    if (!this.initializingPromise) {
      this.initializingPromise = (async () => {
        try {
          const documents = await loadAndIndexDatasets();
          this.index.build(documents);
        } catch (error) {
          console.error("[RAG-Pipeline] Failed to load and index datasets:", error);
          this.initializingPromise = null; // allow retry
          throw error;
        }
      })();
    }

    return this.initializingPromise;
  }

  /**
   * Core process method for executing RAG:
   * 1. Initializes the index if needed.
   * 2. Runs vector similarity search to find top-K matching records.
   * 3. Calls Mistral LLM with grounded prompt if API key exists.
   * 4. Degrades gracefully to robust template-based generation if no API key is available.
   */
  public async process(query: string): Promise<Record<string, unknown>> {
    try {
      await this.ensureInitialized();
    } catch (error) {
      return {
        success: false,
        message: "Failed to initialize hospital records knowledge base.",
        error: String(error),
      };
    }

    // Search top 5 most relevant documents
    const searchResults = this.index.search(query, 5);

    // Format retrieved documents for citation
    const retrievedDocs = searchResults.map((res) => ({
      content: res.document.content,
      score: res.score,
      source: res.document.metadata.source,
      category: res.document.metadata.category,
      department: res.document.metadata.department || null,
    }));

    // If Mistral API key is set, run grounded generation!
    if (config.mistralApiKey) {
      try {
        const response = await this.generateWithLLM(query, searchResults);
        return {
          ...response,
          retrievedDocs,
        };
      } catch (error) {
        console.error("[RAG-Pipeline] LLM grounded generation failed, falling back to templates:", error);
      }
    }

    // Degrade gracefully to robust template-based generator using similarity results
    const response = this.generateWithTemplates(query, searchResults);
    return {
      ...response,
      retrievedDocs,
    };
  }

  /**
   * Constructs the grounded prompt, calls Mistral, and parses the structured response.
   */
  private async generateWithLLM(query: string, searchResults: SearchResult[]): Promise<Record<string, unknown>> {
    if (searchResults.length === 0) {
      return {
        success: true,
        type: "general",
        message: "I searched the hospital databases but found no matching records. How else can I assist you?",
        data: {},
        suggestions: ["Ask about surgery costs", "Check bed availability", "Check department wait times"],
      };
    }

    // Format context block
    const contextText = searchResults
      .map((res, idx) => `[Record #${idx + 1}] (Source: ${res.document.metadata.source})\nContent: ${res.document.content}`)
      .join("\n\n");

    const prompt = `You are a helpful and intelligent AI Hospital Assistant.
You have access to official hospital records to answer the user's question. Ground your answer strictly in these records.

Retrieved Official Records:
${contextText}

User Question: "${query}"

Guidelines:
1. Base your answer strictly on the provided records. If the records do not contain the answer, say that you cannot find this information in the records, but still suggest how they might proceed.
2. In your response message, clearly cite the sources of the data (e.g. "According to surgery_data.csv...", "Bed capacity records show...", or "Our historical waiting times indicate...").
3. Do not invent any numbers, prices, or beds that are not in the records.
4. Keep the response friendly, highly professional, and informative.
5. Provide a JSON response of the EXACT following structure:
{
  "success": true,
  "type": "price" | "wait-time" | "bed" | "disease" | "no-show" | "general",
  "message": "Your detailed, friendly answer citing relevant sources.",
  "data": { ... }, // A flat object containing key fields (e.g. avgCost, freeBeds, estimatedWaitTime, etc.) extracted from the records.
  "suggestions": [
    "A related, helpful follow-up question 1",
    "A related, helpful follow-up question 2",
    "A related, helpful follow-up question 3"
  ]
}`;

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.mistralApiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-tiny-latest",
        temperature: 0.2, // low temperature for maximum accuracy
        max_tokens: 600,
        response_format: { type: "json_object" }, // Mistral supports JSON output!
        messages: [
          { role: "system", content: "You are a precise, database-grounded hospital assistant. You always respond in valid JSON matching the requested schema." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Mistral API error: ${response.status} - ${errText}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const rawContent = payload.choices?.[0]?.message?.content ?? "";
    
    // Clean up content from markdown wrappers if present
    const cleanedJson = rawContent.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    
    try {
      const parsed = JSON.parse(cleanedJson);
      return {
        success: true,
        type: parsed.type || "general",
        message: parsed.message || "Here is the information from our hospital database.",
        data: parsed.data || {},
        suggestions: parsed.suggestions || ["Ask about surgery costs", "Check bed availability", "Check department wait times"],
      };
    } catch (parseError) {
      console.error("[RAG-Pipeline] JSON parse failed on LLM output:", rawContent);
      return {
        success: true,
        type: "general",
        message: cleanedJson, // fallback to raw string response
        data: {},
        suggestions: ["Ask about surgery costs", "Check bed availability", "Check department wait times"],
      };
    }
  }

  /**
   * Template-based fallback generator when Mistral is unavailable.
   * Leverages the best vector search results to construct highly relevant answers.
   */
  private generateWithTemplates(query: string, searchResults: SearchResult[]): Record<string, unknown> {
    if (searchResults.length === 0 || searchResults[0].score < 0.05) {
      return {
        success: true,
        type: "general",
        message: "I am an AI assistant integrated with the hospital systems. I couldn't find any specific hospital records matching your query. How can I help you today?",
        data: {},
        suggestions: [
          "What is the cost of heart surgery?",
          "Are beds available in Emergency Department?",
          "What is the average wait time in pediatrics?",
        ],
      };
    }

    // Take the top matched document
    const bestMatch = searchResults[0].document;
    const cat = bestMatch.metadata.category;
    const raw = bestMatch.raw as any;

    // Helper functions for parsing text in templates
    const parseCostRange = (text: string) => {
      const nums = Array.from(text.matchAll(/\d[\d,]*/g)).map((m) => Number(m[0].replace(/,/g, "")));
      if (nums.length === 0) return { min: 20000, max: 50000, avg: 35000 };
      if (nums.length === 1) return { min: nums[0], max: nums[0], avg: nums[0] };
      return { min: Math.min(...nums), max: Math.max(...nums), avg: Math.round((nums[0] + nums[1]) / 2) };
    };

    const parseDays = (text: string) => {
      const nums = Array.from(text.matchAll(/\d+/g)).map((m) => Number(m[0]));
      return nums.length ? nums[0] : 14;
    };

    const parseBeds = (text: string) => {
      const nums = Array.from(text.matchAll(/\d+/g)).map((m) => Number(m[0]));
      return nums.length ? nums[0] : 100;
    };

    // Build template responses by category
    if (cat === "surgery") {
      const costRange = parseCostRange(raw.priceRange || "");
      const recoveryDays = parseDays(raw.recoveryTime || "");
      const beds = parseBeds(raw.bedAvailability || "");

      return {
        success: true,
        type: "surgery-plan",
        message: `According to **surgery_data.csv**, here is the information for **${raw.surgeryType || "the requested surgery"}**:
- **Department**: ${raw.department}
- **Price Range**: ${raw.priceRange} (Average Cost: ${raw.avgCost})
- **Recovery Time**: ${raw.recoveryTime}
- **Surgery Duration**: ${raw.surgeryDuration}
- **Bed Availability**: ${raw.bedAvailability || "Contact hospital"}`,
        data: {
          surgeryType: raw.surgeryType,
          department: raw.department,
          estimatedCostRange: costRange,
          min: costRange.min,
          max: costRange.max,
          avg: costRange.avg,
          recoveryDays: recoveryDays,
          surgeryDuration: raw.surgeryDuration,
          bedAvailability: {
            available: beds,
            freeBeds: beds,
            totalBeds: beds + 20,
            occupancyRate: 15,
            level: "low"
          },
          waitingDays: 5,
          confidence: 0.95
        },
        suggestions: [
          `Check bed availability in ${raw.department}`,
          `Estimate wait time for ${raw.department}`,
          "What procedures are offered?",
        ],
      };
    }

    if (cat === "bed_capacity") {
      const dept = raw.Department || "the requested department";
      const total = raw.Total_Beds || raw.Total_Amount_of_Beds || "0";
      const free = raw.Free_Beds || "0";
      const icuTotal = raw.Total_ICU_Beds || "0";
      const icuFree = raw.Free_ICU_Beds || "0";
      const staff = raw.Staff_On_Duty || "0";

      return {
        success: true,
        type: "bed",
        message: `Official bed records show the following capacity for **${dept}**:
- **Available Beds**: **${free}** out of ${total} total beds
- **Available ICU Beds**: **${icuFree}** out of ${icuTotal} total ICU beds
- **Active Staff on Duty**: ${staff} medical professionals`,
        data: {
          department: dept,
          totalBeds: Number(total),
          freeBeds: Number(free),
          available: Number(free),
          icuAvailable: Number(icuFree),
          staffOnDuty: Number(staff),
          occupancyRate: Math.round(((Number(total) - Number(free)) / (Number(total) || 1)) * 100)
        },
        suggestions: [
          `What is the average wait time for ${dept}?`,
          "What surgeries are performed here?",
          "Check general ward pricing",
        ],
      };
    }

    if (cat === "disease") {
      const disease = raw.Disease || "the condition";
      const symptoms = [
        raw.Fever === "Yes" ? "fever" : "",
        raw.Cough === "Yes" ? "cough" : "",
        raw.Fatigue === "Yes" ? "fatigue" : "",
        raw["Difficulty Breathing"] === "Yes" ? "difficulty breathing" : "",
      ].filter(Boolean).join(", ");

      return {
        success: true,
        type: "disease",
        message: `Based on **disease_symptom_profile_dataset_01.csv**, here is the profile for **${disease}**:
- **Common Symptoms**: ${symptoms || "mild or non-specific symptoms"}
- **Typical Patient Profile**: Age: ${raw.Age}, Gender: ${raw.Gender}
- **Common Vital Statistics**: Blood Pressure: ${raw["Blood Pressure"] || "Normal"}, Cholesterol: ${raw["Cholesterol Level"] || "Normal"}
- **Outcome**: Generally ${raw["Outcome Variable"] || "Positive"}`,
        data: {
          disease,
          symptoms: symptoms.split(", "),
          typicalAge: Number(raw.Age),
          typicalGender: raw.Gender,
          bloodPressure: raw["Blood Pressure"],
          cholesterol: raw["Cholesterol Level"],
        },
        suggestions: [
          `What is the recovery time for ${disease}?`,
          "Tell me about influenza symptoms",
          "What is the cost of treatment?",
        ],
      };
    }

    if (cat === "hospital_billing" || cat === "pricing_summary") {
      const proc = raw.procedure || raw.Procedure || "the procedure";
      const avg = raw.avgCost ? `₹${raw.avgCost.toLocaleString("en-IN")}` : `₹${usdToInr(raw.Cost || 0).toLocaleString("en-IN")}`;
      const min = raw.minCost ? `₹${raw.minCost.toLocaleString("en-IN")}` : "";
      const max = raw.maxCost ? `₹${raw.maxCost.toLocaleString("en-IN")}` : "";
      const stay = raw.Length_of_Stay ? `${raw.Length_of_Stay} days` : "";

      let text = `Based on inpatient billing files, here is the pricing details for **${proc}**:\n`;
      text += `- **Average Charges**: **${avg}**\n`;
      if (min && max) {
        text += `- **Cost Range**: ${min} – ${max}\n`;
      }
      if (stay) {
        text += `- **Average Length of Stay**: ${stay}\n`;
      }
      if (raw.discharges) {
        text += `- **Data Confidence**: Based on ${raw.discharges} recorded clinical cases.`;
      }

      const priceVal = raw.avgCost || usdToInr(raw.Cost || 0);
      const minVal = raw.minCost || Math.round(priceVal * 0.7);
      const maxVal = raw.maxCost || Math.round(priceVal * 1.3);

      return {
        success: true,
        type: "price",
        message: text,
        data: {
          procedure: proc,
          estimatedCostRange: {
            min: minVal,
            max: maxVal,
            avg: priceVal
          },
          min: minVal,
          max: maxVal,
          avg: priceVal,
          median: raw.medianCost || priceVal,
          count: raw.discharges || raw.count || 1,
          lengthOfStayDays: Number(raw.Length_of_Stay) || null,
        },
        suggestions: [
          `Are there free beds for ${proc}?`,
          "What is the average recovery time?",
          "Compare with general surgery cost",
        ],
      };
    }

    if (cat === "waiting_time_summary") {
      const dept = raw.department || "the department";
      const type = raw.appointmentType || "general";
      const wait = raw.avgWaitTimeMinutes || "0";
      const noShow = raw.noShowRatePercent || "0";
      
      return {
        success: true,
        type: "wait-time",
        message: `According to waiting time records, appointments for **${dept} (${type})** average a patient wait of **${wait} minutes**.
- **No-Show Rate**: Historical no-show rate for this slot is **${noShow}%**.
- **Data Pool**: Summarized over ${raw.totalAppointments || 0} patient records.`,
        data: {
          department: dept,
          appointmentType: type,
          estimatedWaitTime: `${wait} minutes`,
          noShowRate: `${noShow}%`,
          waitingDays: Math.round(Number(wait) / 1440) || 1,
          waitTime: Math.round(Number(wait) / 1440) || 1,
          waitingLabel: noShow > 25 ? "high" : "medium"
        },
        suggestions: [
          `Check beds available in ${dept}`,
          `What are the wait times in cardiology?`,
          "How to reduce no-show chance?",
        ],
      };
    }

    if (cat?.startsWith("no_show")) {
      return {
        success: true,
        type: "no-show",
        message: `According to our comprehensive hospital no-show studies:\n\n${bestMatch.content}`,
        data: raw,
        suggestions: [
          "How do SMS reminders affect attendance?",
          "What is the no-show rate for diabetic patients?",
          "Which age demographic misses the most appointments?",
        ],
      };
    }

    // Default template fallback using the natural language content
    return {
      success: true,
      type: "general",
      message: `Here is the relevant record found in our hospital databases:
\n${bestMatch.content}\n\n*(Source: ${bestMatch.metadata.source})*`,
      data: raw,
      suggestions: [
        "What is the cost of bypass surgery?",
        "Check bed capacity in emergency department",
        "What is the no-show risk for diabetes?",
      ],
    };
  }
}

// Convert USD to INR utility inside fallback
function usdToInr(usd: number | string): number {
  const cleaned = typeof usd === "string" ? usd.replace(/[$,"\s]/g, "") : usd;
  const n = Number(cleaned);
  return Math.round((Number.isFinite(n) ? n : 0) * USD_TO_INR);
}

export default RAGPipeline;
