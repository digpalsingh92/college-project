import { Request, Response } from "express";
import { config } from "../config/config.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { predictWaitingTime } from "../ml/inference.js";
import { RAGPipeline } from "../ml/rag-pipeline.js";

export const askAssistantController = async (req: Request, res: Response): Promise<void> => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({
      success: false,
      message: "Valid message string is required."
    });
    return;
  }

  const lowered = message.toLowerCase();
  const ragPipeline = RAGPipeline.getInstance();

  try {
    const ragResponse = await ragPipeline.process(message);

    if (ragResponse.success) {
      res.status(200).json(ragResponse);
      return;
    }
  } catch (error) {
    console.error("RAG Pipeline error:", error);
  }

  // If Mistral API key is available, use Mistral AI
  if (config.mistralApiKey) {
    try {
      const mistralResponse = await fetchMistralResponse(message);

      // Try to extract structured data from the response
      const responseData = parseMistralResponse(mistralResponse, lowered);

      // Verify LLM response against structured sources (model + CSVs)
      const verified = await verifyResponse(responseData, lowered);

      res.status(200).json(verified);
      return;
    } catch (error) {
      console.error("Mistral AI error:", error);
    }
  }

  // Fallback: Simple keyword matching for demo (when no API key or API fails)
  if (lowered.includes("cost") || lowered.includes("price") || lowered.includes("fee")) {
    res.status(200).json({
      success: true,
      type: "price",
      data: {
        priceRange: "₹20K – ₹40K",
      },
    });
    return;
  }

  if (lowered.includes("wait") || lowered.includes("long") || lowered.includes("time")) {
    res.status(200).json({
      success: true,
      type: "wait-time",
      data: {
        waitTime: "3 days",
      },
    });
    return;
  }

  if (lowered.includes("bed") || lowered.includes("room")) {
    res.status(200).json({
      success: true,
      type: "bed",
      data: {
        bedsAvailable: "Available (12 open)",
      },
    });
    return;
  }

  // Fallback response
  res.status(200).json({
    success: true,
    type: "general",
    message: "I am an AI assistant integrated with the hospital systems. How can I help you today?",
  });
};

const MISTRAL_MODEL = "mistral-tiny-latest";

const fetchMistralResponse = async (userMessage: string): Promise<string> => {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.mistralApiKey}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are a helpful AI Hospital Assistant.
          You help patients with questions about hospital services, costs, wait times, bed availability, and general information.

Response guidelines:
- For cost/price questions: Provide estimated price ranges in Indian Rupees (INR/₹)
- For wait time questions: Provide estimated wait times in days or hours
- For bed availability: Provide bed availability status
- For general questions: Provide helpful, informative answers
- Always respond in a clear, friendly, and professional manner
- Keep responses concise but informative
- If you don't have specific information, say so and suggest contacting the hospital directly

Return your response as a JSON object with the following structure:
{
  "type": "price" | "wait-time" | "bed" | "general",
  "message": "Your response to the user",
  "data": { ... } // Optional additional data
}`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Mistral API error: ${response.status} - ${errorBody}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content ?? "";
  return content;
};

const parseMistralResponse = (response: string, originalMessage: string): any => {
  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(response);

    // Validate the structure
    if (parsed.type && parsed.message) {
      return {
        success: true,
        type: parsed.type,
        message: parsed.message,
        data: parsed.data || {},
      };
    }

    // If it's JSON but doesn't have the expected structure, format it
    return {
      success: true,
      type: "general",
      message: parsed.message || JSON.stringify(parsed),
      data: {},
    };
  } catch {
    // If not valid JSON, return as a general message
    return {
      success: true,
      type: "general",
      message: response || "I am an AI assistant integrated with the hospital systems. How can I help you today?",
      data: {},
    };
  }
};
// -- Verification helpers --
const surgeryCanonical = (surgery: string | null) => {
  if (!surgery) return null;
  const s = surgery.toLowerCase();
  if (s.includes("cataract") || s.includes("eye")) return "cataract";
  if (s.includes("heart") || s.includes("cardiac")) return "heart";
  if (s.includes("knee")) return "knee replacement";
  if (s.includes("hip")) return "hip replacement";
  if (s.includes("general") || s.includes("appendix") || s.includes("gallbladder")) return "general";
  return surgery;
};

const parsePriceRange = (text: string | undefined) => {
  if (!text) return null;
  const nums = Array.from(text.matchAll(/\d[\d,]*/g)).map((m) => Number(m[0].replace(/,/g, "")));
  if (nums.length === 0) return null;
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: Math.min(...nums), max: Math.max(...nums) };
};

const loadBedCsv = async () => {
  const csvPath = path.resolve(process.cwd(), "src", "Datasets", "bed_capacity_dataset_02.csv");
  try {
    const raw = await readFile(csvPath, "utf-8");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const header = lines[0].split(",").map((h) => h.trim());
    const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));
    return { header, rows };
  } catch {
    return null;
  }
};

const findBedForDepartment = async (department: string) => {
  const csv = await loadBedCsv();
  if (!csv) return null;
  const idxDept = csv.header.findIndex((h) => /department/i.test(h));
  const idxFree = csv.header.findIndex((h) => /Free_Beds|FreeBeds|Free Beds/i.test(h));
  if (idxDept === -1 || idxFree === -1) return null;
  for (const row of csv.rows) {
    if (row[idxDept] && row[idxDept].toLowerCase().includes(department.toLowerCase())) {
      const free = Number(row[idxFree]) || 0;
      return { freeBeds: free, raw: row };
    }
  }
  return null;
};

const getSurgeryData = (surgeryType: string | null) => {
  const surgeryDatabase: Record<string, any> = {
    cataract: {
      priceRange: "₹20,000 - ₹50,000",
      avgCost: "₹35,000",
      waitTime: "7 days",
      recoveryTime: "14-21 days",
      duration: "1-2 hours",
      confidence: "95%",
      bedsAvailable: "1200+ beds",
      department: "Ophthalmology",
    },
    heart: {
      priceRange: "₹2,00,000 - ₹5,00,000",
      avgCost: "₹3,50,000",
      waitTime: "14-21 days",
      recoveryTime: "30-60 days",
      duration: "3-6 hours",
      confidence: "90%",
      bedsAvailable: "50+ beds",
      department: "Cardiology",
    },
    "knee replacement": {
      priceRange: "₹1,50,000 - ₹3,00,000",
      avgCost: "₹2,25,000",
      waitTime: "10-15 days",
      recoveryTime: "45-90 days",
      duration: "2-3 hours",
      confidence: "92%",
      bedsAvailable: "30+ beds",
      department: "Orthopedics",
    },
    "hip replacement": {
      priceRange: "₹1,80,000 - ₹3,50,000",
      avgCost: "₹2,65,000",
      waitTime: "12-20 days",
      recoveryTime: "60-120 days",
      duration: "2-4 hours",
      confidence: "91%",
      bedsAvailable: "25+ beds",
      department: "Orthopedics",
    },
  };

  return surgeryType && surgeryDatabase[surgeryType]
    ? surgeryDatabase[surgeryType]
    : {
        priceRange: "₹20K – ₹40K",
        waitTime: "3-7 days",
        recoveryTime: "Variable",
        duration: "Variable",
        confidence: "80%",
        bedsAvailable: "Contact hospital",
      };
};

const verifyResponse = async (responseData: any, originalMessage: string) => {
  try {
    const type = responseData.type || "general";
    const surgery = surgeryCanonical(responseData.surgeryType || null) || null;
    const verification: any = { verified: true, notes: [] };

    // Price verification: compare reported range to internal surgery data
    if (type === "price" || (responseData.data && responseData.data.priceRange)) {
      const reported = parsePriceRange(responseData.data?.priceRange || responseData.message);
      const reference = parsePriceRange(getSurgeryData(surgery).priceRange);
      if (reported && reference) {
        // if ranges are disjoint or wildly different, flag
        if (reported.max < reference.min * 0.6 || reported.min > reference.max * 1.6) {
          verification.verified = false;
          verification.notes.push("Price range differs from internal estimates");
          verification.modelPriceRange = getSurgeryData(surgery).priceRange;
        }
      }
    }

    // Wait-time verification: compare to `predictWaitingTime` from model
    if (type === "wait-time" || responseData.data?.estimatedWaitTime) {
      const department = responseData.data?.department || getSurgeryData(surgery).department;
      try {
        const modelPred = await predictWaitingTime({
          department,
          appointmentType: "surgery",
          scheduledHour: 10,
          reminderSent: "No",
          previousNoShows: 0,
        });

        const modelHours = Math.round(modelPred.predictedWaitingTimeMinutes / 60);
        const reportedText = responseData.data?.estimatedWaitTime || responseData.data?.waitTime || responseData.message;
        const reportedNums = Array.from(String(reportedText).matchAll(/\d+/g)).map((m) => Number(m[0]));
        const reportedHours = reportedNums.length ? reportedNums[0] : null;
        if (reportedHours && Math.abs(reportedHours - modelHours) > 48) {
          verification.verified = false;
          verification.notes.push("Reported wait time diverges from model estimate");
          verification.modelEstimateHours = modelHours;
        }
      } catch (e) {
        verification.notes.push("Could not run model-based wait-time check");
      }
    }

    // Bed verification: check CSV for free beds
    if (type === "bed" || responseData.data?.bedsAvailable) {
      const department = responseData.data?.department || getSurgeryData(surgery).department || "";
      const bedInfo = await findBedForDepartment(department);
      if (bedInfo) {
        // If LLM claims many beds but CSV shows none, flag
        const reportedNums = Array.from(String(responseData.data?.bedsAvailable || "").matchAll(/\d+/g)).map((m) => Number(m[0]));
        const reported = reportedNums.length ? reportedNums[0] : null;
        if (reported !== null && reported > 0 && bedInfo.freeBeds === 0) {
          verification.verified = false;
          verification.notes.push("LLM reported beds but real-time CSV shows none free");
          verification.csvFreeBeds = bedInfo.freeBeds;
        }
      }
    }

    return { ...responseData, verification };
  } catch (err) {
    return { ...responseData, verification: { verified: false, notes: ["Verification failed"] } };
  }
};
