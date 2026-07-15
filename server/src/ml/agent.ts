import { Annotation, messagesStateReducer, StateGraph, MemorySaver } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { AIMessage, BaseMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { ChatMistralAI } from "@langchain/mistralai";
import { config } from "../config/config.js";
import { predictWaitingTime } from "./inference.js";
import { predictDisease } from "./disease-inference.js";
import { estimatePrice } from "./price-inference.js";
import { estimateBedAvailability } from "./bed-inference.js";
import { planSurgery } from "./surgery-planner.js";
import { analyzeSlots } from "./slots-analysis.js";
import { getAllDoctors, getDoctorAvailability } from "../modules/doctors/doctors.service.js";

// Define custom State containing messages and structured data channel
export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  data: Annotation<Record<string, any>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
});

// ── Tool Definitions ──

const predictDiseaseTool = tool(
  async (input) => {
    try {
      const result = await predictDisease(input);
      return JSON.stringify(result);
    } catch (e: any) {
      return JSON.stringify({ error: `Symptom check model error: ${e.message || e}` });
    }
  },
  {
    name: "predict_disease",
    description: "Assess likelihood of a disease based on key symptoms (fever, cough, fatigue, difficulty breathing), age, gender, blood pressure, and cholesterol levels.",
    schema: z.object({
      fever: z.boolean().describe("Whether the patient currently has a fever"),
      cough: z.boolean().describe("Whether the patient has a persistent cough"),
      fatigue: z.boolean().describe("Whether the patient is experiencing fatigue/weakness"),
      difficultyBreathing: z.boolean().describe("Whether the patient has trouble breathing"),
      age: z.number().describe("The patient's age in years"),
      gender: z.enum(["male", "female"]).describe("The patient's gender"),
      bloodPressure: z.enum(["normal", "high", "low"]).describe("The patient's blood pressure level"),
      cholesterolLevel: z.enum(["normal", "high", "low"]).describe("The patient's cholesterol level"),
    }),
  }
);

const predictWaitingTimeTool = tool(
  async (input) => {
    try {
      const result = await predictWaitingTime({
        ...input,
        reminderSent: input.reminderSent as "Yes" | "No",
      });
      return JSON.stringify(result);
    } catch (e: any) {
      return JSON.stringify({ error: `Waiting time prediction model error: ${e.message || e}` });
    }
  },
  {
    name: "predict_waiting_time",
    description: "Predict the average and p90 waiting time, cancellation risk, and no-show risk in a specific department.",
    schema: z.object({
      department: z.string().describe("The clinic/department name (e.g. Cardiology, Orthopedics, Ophthalmology)"),
      appointmentType: z.string().describe("Type of appointment (e.g. Consultation, Follow-up)"),
      scheduledHour: z.number().describe("Hour of appointment in 24h format (e.g. 10 for 10:00 AM, 14 for 2:00 PM)"),
      reminderSent: z.enum(["Yes", "No"]).describe("Whether a SMS/email reminder is sent to the patient"),
      previousNoShows: z.number().describe("Number of previous no-shows for this patient"),
    }),
  }
);

const estimatePriceTool = tool(
  async (input) => {
    try {
      const result = await estimatePrice(input);
      return JSON.stringify(result);
    } catch (e: any) {
      return JSON.stringify({ error: `Pricing estimate model error: ${e.message || e}` });
    }
  },
  {
    name: "estimate_price",
    description: "Estimate the minimum, maximum, and average price range for a specific medical procedure or treatment.",
    schema: z.object({
      procedure: z.string().describe("The medical procedure or surgery name (e.g. Cataract Surgery, Hernia Repair)"),
      condition: z.string().optional().describe("Optional underlying clinical condition"),
    }),
  }
);

const estimateBedAvailabilityTool = tool(
  async (input) => {
    try {
      const result = await estimateBedAvailability(input);
      return JSON.stringify(result);
    } catch (e: any) {
      return JSON.stringify({ error: `Bed status lookup error: ${e.message || e}` });
    }
  },
  {
    name: "estimate_bed_availability",
    description: "Fetch real-time bed count, available beds, occupancy rate, and ICU beds in a specific department.",
    schema: z.object({
      department: z.string().optional().describe("The department name. Omit to fetch total hospital bed availability."),
    }),
  }
);

const planSurgeryTool = tool(
  async (input) => {
    try {
      const result = await planSurgery(input);
      return JSON.stringify(result);
    } catch (e: any) {
      return JSON.stringify({ error: `Surgery planner calculation error: ${e.message || e}` });
    }
  },
  {
    name: "plan_surgery",
    description: "Perform comprehensive surgery planning, aggregating estimated cost ranges, duration, recovery days, wait times, and bed availability.",
    schema: z.object({
      surgeryType: z.string().describe("The surgery type (e.g. Knee Replacement, Cataract, Appendectomy)"),
      patientAge: z.number().describe("The patient's age"),
      conditions: z.array(z.string()).optional().describe("Optional pre-existing medical conditions"),
    }),
  }
);

const searchDoctorsTool = tool(
  async (input) => {
    try {
      const doctors = await getAllDoctors();
      const query = input.search?.toLowerCase() || "";
      const filtered = doctors.filter((doc) => {
        const nameMatch = doc.name.toLowerCase().includes(query);
        const specMatch = doc.doctorProfile?.specialization.toLowerCase().includes(query);
        return nameMatch || specMatch;
      });

      return JSON.stringify({
        doctors: filtered.map((d) => ({
          id: d.id,
          name: d.name,
          specialization: d.doctorProfile?.specialization ?? "General",
          experience: d.doctorProfile?.experience ?? 0,
          consultationFee: d.doctorProfile?.consultationFee ?? 0,
        })),
      });
    } catch (e: any) {
      return JSON.stringify({ error: `Failed to search doctors: ${e.message || e}` });
    }
  },
  {
    name: "search_doctors",
    description: "Search active doctors in the hospital by name or specialization. Returns doctor names, IDs, specializations, and fee schedules.",
    schema: z.object({
      search: z.string().optional().describe("Fuzzy search term for specialization or doctor's name"),
    }),
  }
);

const getDoctorAvailabilityTool = tool(
  async (input) => {
    try {
      const availability = await getDoctorAvailability(input.doctorId, { date: input.date });
      return JSON.stringify(availability);
    } catch (e: any) {
      return JSON.stringify({ error: `Failed to fetch availability: ${e.message || e}` });
    }
  },
  {
    name: "get_doctor_availability",
    description: "Lookup available appointment slots for a specific doctor ID on a target date (YYYY-MM-DD).",
    schema: z.object({
      doctorId: z.string().describe("The doctor's unique user ID"),
      date: z.string().describe("Date to query availability for, format YYYY-MM-DD"),
    }),
  }
);

const analyzeTimeSlotsTool = tool(
  async (input) => {
    try {
      const analysis = await analyzeSlots(input.doctorId, input.date);
      return JSON.stringify(analysis);
    } catch (e: any) {
      return JSON.stringify({ error: `Failed to analyze slots: ${e.message || e}` });
    }
  },
  {
    name: "analyze_time_slots",
    description: "Analyze doctor appointment slots for a target date (YYYY-MM-DD). Predicts slot-specific waiting times, no-show adjusted queues, and recommends the best/worst slots.",
    schema: z.object({
      doctorId: z.string().describe("The doctor's unique user ID"),
      date: z.string().describe("Date to analyze, format YYYY-MM-DD"),
    }),
  }
);

// Map of tools for execution node
const toolMap: Record<string, any> = {
  predict_disease: predictDiseaseTool,
  predict_waiting_time: predictWaitingTimeTool,
  estimate_price: estimatePriceTool,
  estimate_bed_availability: estimateBedAvailabilityTool,
  plan_surgery: planSurgeryTool,
  search_doctors: searchDoctorsTool,
  get_doctor_availability: getDoctorAvailabilityTool,
  analyze_time_slots: analyzeTimeSlotsTool,
};

// ── Graph Nodes ──

async function chatbotNode(state: typeof AgentState.State) {
  const mistralKey = config.mistralApiKey;
  if (!mistralKey) {
    return {
      messages: [
        new AIMessage({
          content: "MISTRAL_API_KEY is not defined in the server environment. Please define it in your backend environment variables to enable the AI assistant.",
        }),
      ],
    };
  }

  const model = new ChatMistralAI({
    apiKey: mistralKey,
    modelName: "ministral-3b-2512",
    temperature: 0.1,
  });

  const systemMessage = new SystemMessage(
    "You are Antigravity, a premium hospital AI assistant integrated with clinical, billing, and operational prediction models.\n" +
    "You have access to tools that check symptoms (predict_disease), estimate procedure costs (estimate_price), analyze wait times (predict_waiting_time), check bed counts (estimate_bed_availability), perform comprehensive surgical planning (plan_surgery), search doctors (search_doctors), retrieve slot availability (get_doctor_availability), and analyze time slots (analyze_time_slots).\n" +
    "IMPORTANT INSTRUCTIONS:\n" +
    "1. You are a READ-ONLY assistant. You CANNOT write to the database (you cannot book, cancel, or reschedule appointments). If a user requests a write action, first help them find slot availability or doctor information, and then conversationally direct them to use the client dashboard or schedule tabs to finalize the action.\n" +
    "2. If you execute a tool, do NOT summarize all raw statistics extensively in your text reply unless requested, as the UI will render structured cards for the results automatically. Present the key conclusion and highlight any recommendations.\n" +
    "3. Keep your answers clear, supportive, and formatted in clean markdown."
  );

  const messagesWithSystem = [systemMessage, ...state.messages];
  const boundModel = model.bindTools(Object.values(toolMap));
  const response = await boundModel.invoke(messagesWithSystem);

  return {
    messages: [response],
  };
}

async function toolsNode(state: typeof AgentState.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  const toolCalls = (lastMessage as any)?.tool_calls;
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
    return {};
  }

  const newMessages: BaseMessage[] = [];
  const accumulatedData: Record<string, any> = {};

  for (const call of toolCalls) {
    const matchedTool = toolMap[call.name];
    if (matchedTool) {
      try {
        const rawResult = await matchedTool.invoke(call.args);
        
        let parsed: any = null;
        try {
          parsed = JSON.parse(rawResult);
        } catch {
          // Response is not JSON
        }

        if (parsed && typeof parsed === "object") {
          // If the parsed object has an error property, still add it but don't pollute data
          if (!parsed.error) {
            Object.assign(accumulatedData, parsed);
          }
        } else {
          accumulatedData[call.name] = rawResult;
        }

        newMessages.push(new ToolMessage({
          content: rawResult,
          name: call.name,
          tool_call_id: call.id || "",
        }));
      } catch (e: any) {
        newMessages.push(new ToolMessage({
          content: `Error executing tool: ${e.message || e}`,
          name: call.name,
          tool_call_id: call.id || "",
        }));
      }
    } else {
      newMessages.push(new ToolMessage({
        content: `Error: Tool ${call.name} not found.`,
        name: call.name,
        tool_call_id: call.id || "",
      }));
    }
  }

  return {
    messages: newMessages,
    data: accumulatedData,
  };
}

function route(state: typeof AgentState.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  const toolCalls = (lastMessage as any)?.tool_calls;
  if (Array.isArray(toolCalls) && toolCalls.length > 0) {
    return "tools";
  }
  return "__end__";
}

// ── Compile Graph ──

const workflow = new StateGraph(AgentState)
  .addNode("chatbot", chatbotNode)
  .addNode("tools", toolsNode)
  .addEdge("__start__", "chatbot")
  .addConditionalEdges("chatbot", route)
  .addEdge("tools", "chatbot");

const memory = new MemorySaver();

export const agent = workflow.compile({ checkpointer: memory });
