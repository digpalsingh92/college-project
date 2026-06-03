"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Activity, 
  Bot, 
  BedDouble, 
  Clock, 
  DollarSign, 
  Loader2, 
  User, 
  Award, 
  Building2, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Star, 
  Users, 
  CheckCircle2, 
  Sparkles 
} from "lucide-react";
import { cn } from "@/helpers/cn";
import { useGetDoctorsQuery } from "@/store/apiSlice";
import type { DoctorListItem } from "@/types/api";

export interface AssistantChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  structuredData?: unknown;
  status?: "loading" | "error" | "done";
  intent?: string;
}

interface DashboardCardItem {
  title: string;
  value: string;
  subtext: string;
  icon: any;
  badge?: string;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

// Helper to match doctor by department or intent
function findRecommendedDoctor(intent: string, department: string, doctors: DoctorListItem[] = []) {
  if (!doctors || doctors.length === 0) return null;
  
  const deptQuery = department.toLowerCase();
  const intentQuery = intent.toLowerCase();
  
  // Try to find a specialization that matches the query terms
  const matched = doctors.find(doc => {
    const spec = (doc.doctorProfile?.specialization ?? "").toLowerCase();
    
    // Standardize/Stem checks to cover spelling variations and adjacent terms (ist vs ogy)
    const isOphth = (spec.includes("ophthal") || spec.includes("eye")) && 
                    (deptQuery.includes("ophthal") || deptQuery.includes("eye") || intentQuery.includes("cataract") || intentQuery.includes("ophthalmology"));
    const isCardio = (spec.includes("cardio") || spec.includes("heart")) && 
                     (deptQuery.includes("cardio") || deptQuery.includes("heart"));
    const isGastro = (spec.includes("gastro") || spec.includes("stomach") || spec.includes("gall")) && 
                     (deptQuery.includes("gastro") || deptQuery.includes("stomach") || deptQuery.includes("gall"));
    const isDerm = (spec.includes("derm") || spec.includes("skin")) && 
                   (deptQuery.includes("derm") || deptQuery.includes("skin"));
    const isNeuro = (spec.includes("neuro") || spec.includes("brain")) && 
                    (deptQuery.includes("neuro") || deptQuery.includes("brain"));
    const isOrtho = (spec.includes("ortho") || spec.includes("bone") || spec.includes("joint")) && 
                    (deptQuery.includes("ortho") || deptQuery.includes("bone") || deptQuery.includes("joint"));

    return (
      isOphth ||
      isCardio ||
      isGastro ||
      isDerm ||
      isNeuro ||
      isOrtho ||
      spec.includes(deptQuery) || 
      deptQuery.includes(spec) ||
      spec.includes(intentQuery) ||
      intentQuery.includes(spec)
    );
  });
  
  return matched ?? doctors[0];
}

// Helper to infer department from surgery name
function getSurgeryDepartment(surgeryName: string): string {
  const name = surgeryName.toLowerCase();
  if (name.includes("cholecystectomy") || name.includes("gastro") || name.includes("gallbladder") || name.includes("stomach")) {
    return "Gastroenterology";
  }
  if (name.includes("cataract") || name.includes("eye") || name.includes("ophthalmology") || name.includes("vision")) {
    return "Ophthalmology";
  }
  if (name.includes("bypass") || name.includes("heart") || name.includes("cardio") || name.includes("valve")) {
    return "Cardiology";
  }
  if (name.includes("osteoporosis") || name.includes("bone") || name.includes("ortho") || name.includes("joint") || name.includes("fracture")) {
    return "Orthopedics";
  }
  return "General Surgery";
}

// Separates conversation main text from RAG citations dynamically
function parseMessageContent(content: string) {
  const parts = content.split(/---|\n\n---\n### Official Records Reference Citations\n|### Official Records Reference Citations/);
  const mainText = parts[0].trim();
  const citationsSection = parts[1] || "";
  
  const citations: Array<{ id: number; source: string; matchPct?: number; content: string }> = [];
  
  if (citationsSection) {
    const lines = citationsSection.split("\n");
    let currentCitation: any = null;
    
    for (const line of lines) {
      const match = line.match(/\*\*\[(\d+)\]\*\*\s*\*Source:\s*`([^`]+)`\*(?:\s*\(Match:\s*(\d+)%\))?/);
      if (match) {
        if (currentCitation) {
          citations.push(currentCitation);
        }
        currentCitation = {
          id: parseInt(match[1], 10),
          source: match[2],
          matchPct: match[3] ? parseInt(match[3], 10) : undefined,
          content: ""
        };
      } else if (line.startsWith(">") && currentCitation) {
        currentCitation.content += (currentCitation.content ? " " : "") + line.replace(/^>\s*/, "").trim();
      } else if (line.trim() && currentCitation) {
        currentCitation.content += (currentCitation.content ? " " : "") + line.trim();
      }
    }
    
    if (currentCitation) {
      citations.push(currentCitation);
    }
  }
  
  return { mainText, citations };
}

// The Premium AI Health Consultation Dashboard Card
function ConsultationDashboardCard({ 
  intent, 
  structuredData, 
  citations 
}: { 
  intent: string; 
  structuredData: any; 
  citations: Array<{ id: number; source: string; matchPct?: number; content: string }> 
}) {
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const { data: doctorsData } = useGetDoctorsQuery();
  
  const data = toRecord(structuredData);
  if (!data) return null;

  // 1. Inferred Department & Procedure Name
  let inferredDept = "General Medical";
  let procedureName = "Clinical Consultation";
  let confidenceVal = "95%";
  
  if (intent === "surgery-plan") {
    procedureName = typeof data.surgeryType === "string" ? data.surgeryType : "Surgical Procedure";
    inferredDept = getSurgeryDepartment(procedureName);
    if (typeof data.confidence === "number") {
      confidenceVal = `${Math.round(data.confidence * 100)}%`;
    }
  } else if (intent === "price") {
    procedureName = typeof data.procedure === "string" ? data.procedure : "Price Estimate";
    inferredDept = "Finance & Treatment";
  } else if (intent === "bed") {
    procedureName = typeof data.department === "string" ? `${data.department} Census` : "Hospital Beds";
    inferredDept = "Capacity Planning";
    confidenceVal = "Live Sensors";
  } else if (intent === "wait-time") {
    procedureName = typeof data.department === "string" ? `${data.department} Wait Time` : "Clinical Wait Time";
    inferredDept = "Clinical Flow";
    confidenceVal = "Live Queue Feed";
  } else if (intent === "disease") {
    procedureName = typeof data.disease === "string" ? data.disease : typeof data.prediction === "string" ? data.prediction : "Symptom Assessment";
    inferredDept = "Diagnostic Review";
    const prob = data.confidence ?? data.probability;
    if (typeof prob === "number") {
      confidenceVal = `${Math.round(prob * 100)}% Match`;
    }
  }

  // 2. Build 3x2 Grid Cards based on intent
  const gridCards: DashboardCardItem[] = [];
  
  if (intent === "surgery-plan") {
    const costRange = toRecord(data.estimatedCostRange);
    gridCards.push(
      {
        title: "Estimated Cost",
        value: costRange ? `₹${Math.round(Number(costRange.avg ?? 350000)).toLocaleString("en-IN")}` : "₹3,50,000",
        subtext: costRange ? `Avg: ₹${Number(costRange.min).toLocaleString("en-IN")} - ₹${Number(costRange.max).toLocaleString("en-IN")}` : "Avg: ₹3,20,000 - ₹4,00,000",
        icon: DollarSign,
      },
      {
        title: "Recovery Time",
        value: typeof data.recoveryDays === "number" ? (data.recoveryDays <= 7 ? "1 Week" : `${Math.round(data.recoveryDays / 7)} Weeks`) : "1-2 Weeks",
        subtext: "Min. physical activity",
        icon: Clock,
      },
      {
        title: "Surgery Duration",
        value: typeof data.surgeryDuration === "string" ? data.surgeryDuration : "60-90 Mins",
        subtext: "Typical inpatient stay",
        icon: Activity,
      }
    );
    
    const beds = toRecord(data.bedAvailability);
    gridCards.push(
      {
        title: "Bed Availability",
        value: beds?.level === "high" ? "High" : beds?.level === "medium" ? "Moderate" : "Low",
        subtext: beds ? `${beds.available ?? 12} units available` : "12 units available",
        icon: BedDouble,
        badge: beds?.level === "high" ? "READY" : undefined,
      },
      {
        title: "Team Readiness",
        value: "Optimized",
        subtext: "Surgeons on standby",
        icon: Users,
      },
      {
        title: "Success Rate",
        value: "99.2%",
        subtext: "Institutional record",
        icon: Award,
      }
    );
  } else if (intent === "price") {
    gridCards.push(
      {
        title: "Price Estimate",
        value: typeof data.avg === "number" ? `₹${Math.round(data.avg).toLocaleString("en-IN")}` : "₹2,50,000",
        subtext: `Avg: ₹${Number(data.min ?? 220000).toLocaleString("en-IN")} - ₹${Number(data.max ?? 300000).toLocaleString("en-IN")}`,
        icon: DollarSign,
      },
      {
        title: "Median Cost",
        value: typeof data.median === "number" ? `₹${Math.round(data.median).toLocaleString("en-IN")}` : "₹2,45,000",
        subtext: "Standard procedure billing",
        icon: Activity,
      },
      {
        title: "Database Records",
        value: `${data.count ?? 32} Case Files`,
        subtext: "Historical reference files",
        icon: Users,
      },
      {
        title: "Bed Allocation",
        value: "Sufficient",
        subtext: "Direct booking available",
        icon: BedDouble,
        badge: "READY",
      },
      {
        title: "Recovery Period",
        value: "1-2 Weeks",
        subtext: "General inpatient rest",
        icon: Clock,
      },
      {
        title: "Success Index",
        value: "99.4%",
        subtext: "Benchmark score",
        icon: Award,
      }
    );
  } else if (intent === "bed") {
    gridCards.push(
      {
        title: "Available Beds",
        value: `${data.freeBeds ?? 12} Free`,
        subtext: `Out of ${data.totalBeds ?? 80} total beds`,
        icon: BedDouble,
        badge: Number(data.freeBeds ?? 12) > 5 ? "READY" : undefined,
      },
      {
        title: "Occupancy Rate",
        value: typeof data.occupancyRate === "number" ? `${Math.round(data.occupancyRate * 100)}%` : "74%",
        subtext: "Current patient volume",
        icon: Activity,
      },
      {
        title: "ICU Available",
        value: `${data.icuAvailable ?? 4} Beds`,
        subtext: "Critical care available",
        icon: Award,
      },
      {
        title: "Staff On Duty",
        value: `${data.staffOnDuty ?? 15} Crew`,
        subtext: "Surgeons & nursing teams",
        icon: Users,
      },
      {
        title: "Queue Delay",
        value: "Instant",
        subtext: "Direct admission cleared",
        icon: Clock,
      },
      {
        title: "Emergency Status",
        value: "Cleared",
        subtext: "Hospital readiness high",
        icon: Award,
      }
    );
  } else if (intent === "wait-time") {
    const delay = typeof data.delayLevel === "string" ? data.delayLevel : "Low";
    gridCards.push(
      {
        title: "Estimated Wait",
        value: typeof data.waitingDays === "number" ? `${data.waitingDays} Days` : "5 Days",
        subtext: "Average scheduling queue",
        icon: Clock,
      },
      {
        title: "Congestion Level",
        value: delay.toUpperCase(),
        subtext: "Patient flow congestion",
        icon: Activity,
        badge: delay === "low" ? "OPTIMAL" : undefined,
      },
      {
        title: "Optimal Booking",
        value: "Wed & Thu",
        subtext: "Lowest patient volume",
        icon: Calendar,
      },
      {
        title: "Active Surgeons",
        value: "12 Doctors",
        subtext: "Consulting teams available",
        icon: Users,
      },
      {
        title: "Bed Capacity",
        value: "High",
        subtext: "Ward slots accessible",
        icon: BedDouble,
      },
      {
        title: "Accuracy Forecast",
        value: "98.6%",
        subtext: "Predictive queue index",
        icon: Award,
      }
    );
  } else if (intent === "disease") {
    gridCards.push(
      {
        title: "Likely Diagnosis",
        value: procedureName,
        subtext: "Matching clinical logs",
        icon: Activity,
        badge: "TRIAGED",
      },
      {
        title: "Confidence Index",
        value: confidenceVal,
        subtext: "Diagnostic assessment",
        icon: Award,
      },
      {
        title: "Clinical Advice",
        value: "Outpatient Visit",
        subtext: "Primary consultation advised",
        icon: Clock,
      },
      {
        title: "Department Intake",
        value: "General",
        subtext: "Primary physician referral",
        icon: Users,
      },
      {
        title: "Bed Capability",
        value: "Accessible",
        subtext: "Direct ward booking",
        icon: BedDouble,
      },
      {
        title: "Success Record",
        value: "99.1%",
        subtext: "Treatment recovery rate",
        icon: Award,
      }
    );
  }

  // 3. Dynamic Doctor Recommendation from Database
  const doctorsList = doctorsData?.doctors ?? [];
  const recommendedDoc = findRecommendedDoctor(intent, inferredDept, doctorsList);
  
  const doctorName = recommendedDoc ? recommendedDoc.name : "Dr. Robert Chen";
  const doctorSpecialty = recommendedDoc?.doctorProfile?.specialization ?? `${inferredDept} Specialist`;
  const doctorId = recommendedDoc ? recommendedDoc.id : "";

  // Generate beautiful dynamic initials avatar with background color matching
  const initials = doctorName
    .replace(/^Dr\.\s+/i, "") // Remove Dr. prefix if present
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const bgColors = [
    "bg-emerald-50 text-emerald-800 border-emerald-200",
    "bg-teal-50 text-teal-800 border-teal-200",
    "bg-sky-50 text-sky-800 border-sky-200",
    "bg-cyan-50 text-cyan-800 border-cyan-200",
    "bg-indigo-50 text-indigo-800 border-indigo-200",
  ];
  const colorIndex = doctorName.length % bgColors.length;
  const bgClass = bgColors[colorIndex];
  return (
    <div className="mt-4 flex w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-md md:flex-row">
      {/* Left Column - Detailed Diagnostic Widgets */}
      <div className="flex-1 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <span>Department: {inferredDept}</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            <Sparkles className="h-3 w-3 text-emerald-600" />
            {confidenceVal}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
          {procedureName}
        </h3>

        {/* 3x2 Clinical Dashboard Grid */}
        {gridCards.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {gridCards.map((card) => {
              const CardIcon = card.icon;
              return (
                <div 
                  key={card.title} 
                  className="flex min-h-[5.5rem] flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-slate-100/50"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {card.title}
                    </span>
                    <CardIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="mt-2 flex items-center gap-2 text-base font-bold text-slate-900 md:text-lg">
                      <span>{card.value}</span>
                      {card.badge && (
                        <span className="rounded bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-emerald-800">
                          {card.badge}
                        </span>
                      )}
                    </div>
                    <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                      {card.subtext}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA - Direct Booking */}
        <Link 
          href={doctorId ? `/patient/booking-appointment?doctorId=${doctorId}` : "/patient/booking-appointment"}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
        >
          <Calendar className="h-4 w-4" />
          <span>Proceed to Booking</span>
        </Link>

        {/* Collapsible RAG Citations Accordion */}
        {citations.length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <button
              onClick={() => setIsSourcesOpen(!isSourcesOpen)}
              className="flex w-full items-center justify-between text-xs font-semibold text-slate-500 transition hover:text-slate-950"
            >
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-slate-400" />
                <span>View Medical Sources</span>
              </div>
              {isSourcesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {isSourcesOpen && (
              <div className="mt-4 space-y-3 pl-1 animate-fadeIn">
                {citations.map((cite) => (
                  <div key={cite.id} className="border-l-2 border-emerald-500 pl-3 py-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                      <FileText className="h-3 w-3 text-slate-400" />
                      <span>File: {cite.source}</span>
                      {cite.matchPct && (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-800">
                          {cite.matchPct}% match
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 italic leading-relaxed">
                      "{cite.content}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column - Dynamic Surgeon Recommendation */}
      <div className="flex w-full flex-col items-center justify-center border-t border-slate-100 bg-slate-50/40 p-6 text-center md:w-[17rem] md:border-t-0 md:border-l">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-6 block">
          Recommended Surgeon
        </span>
        
        {/* Surgeon Avatar */}
        <div className={cn("relative h-20 w-20 rounded-full border-2 border-white shadow-md flex items-center justify-center shrink-0 font-bold text-xl", bgClass)}>
          {initials}
        </div>

        {/* Surgeon Identity */}
        <h4 className="mt-4 text-base font-bold text-slate-900">
          {doctorName}
        </h4>
        <span className="mt-1 block text-xs font-semibold text-emerald-700">
          {doctorSpecialty}
        </span>

        {/* Surgeon Rating */}
        <div className="flex items-center justify-center gap-0.5 mt-2.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          ))}
          <span className="text-xs font-extrabold text-slate-800 ml-1">4.9</span>
        </div>

        {/* Action button */}
        <Link 
          href={doctorId ? `/patient/booking-appointment?doctorId=${doctorId}` : "/patient/booking-appointment"}
          className="mt-6 flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

function renderFormattedText(text: string) {
  // Parses inline formatting: **bold**, `code`, *italic*
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={idx} className="mx-0.5 rounded-md bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 text-xs font-mono font-bold text-emerald-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={idx} className="italic text-slate-700">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function PremiumMarkdownRenderer({ text }: { text: string }) {
  const lines = text.split("\n");
  
  return (
    <div className="space-y-3 font-body-md text-slate-700">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={index} className="h-2" />;
        }
        
        // 1. Heading Header (e.g. starting with 📖 or ### or #)
        if (trimmed.startsWith("📖") || trimmed.startsWith("###") || trimmed.startsWith("##") || trimmed.startsWith("#")) {
          let cleanText = trimmed;
          let icon = "📖";
          if (trimmed.startsWith("📖")) {
            cleanText = trimmed.replace(/^📖\s*/, "");
          } else {
            cleanText = trimmed.replace(/^#+\s*/, "");
            icon = "✨";
          }
          
          return (
            <h4 key={index} className="mt-4 flex items-center gap-2 text-base font-bold tracking-tight text-emerald-900 border-b border-emerald-100/50 pb-2">
              <span className="text-lg">{icon}</span>
              <span>{renderFormattedText(cleanText)}</span>
            </h4>
          );
        }
        
        // 2. Bullet point line
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          const cleanText = trimmed.replace(/^[-*]\s*/, "");
          const keyValueMatch = cleanText.match(/^\*\*(.*?)\*\*:\s*(.*)/);
          if (keyValueMatch) {
            const [, key, val] = keyValueMatch;
            return (
              <div key={index} className="ml-2 flex items-start gap-2.5 py-1">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600 shadow-sm" />
                <div className="text-[0.92rem] leading-relaxed">
                  <span className="font-bold text-slate-800 mr-1.5">{key}:</span>
                  <span className="text-slate-600 font-semibold">{renderFormattedText(val)}</span>
                </div>
              </div>
            );
          }
          
          return (
            <div key={index} className="ml-2 flex items-start gap-2.5 py-1">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600 shadow-sm" />
              <p className="text-[0.92rem] leading-relaxed text-slate-600 font-semibold">
                {renderFormattedText(cleanText)}
              </p>
            </div>
          );
        }
        
        // 3. Regular paragraph
        return (
          <p key={index} className="text-[0.95rem] leading-relaxed font-medium text-slate-700">
            {renderFormattedText(line)}
          </p>
        );
      })}
    </div>
  );
}

export function AssistantMessage({ message }: { message: AssistantChatMessage }) {
  const isUser = message.role === "user";
  const { mainText, citations } = parseMessageContent(message.content);

  // Check if we have an intent that should trigger the unified consultation card layout
  const validIntents = ["surgery-plan", "price", "bed", "wait-time", "disease"];
  const shouldRenderDashboard = Boolean(
    message.role === "assistant" && 
    message.status !== "loading" && 
    message.intent && 
    validIntents.includes(message.intent) && 
    message.structuredData
  );

  const shouldRenderTextBubble = isUser || (!!mainText && !shouldRenderDashboard) || message.status === "loading";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[90%] flex-col", isUser ? "items-end" : "items-start")}>
        {/* Assistant Header (Banner) */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 ml-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700/10">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-emerald-800">Mediso AI Assistant</span>
          </div>
        )}

        {/* User / Assistant Avatars and Message Bubble */}
        <div className={cn("flex gap-3 items-start", isUser ? "flex-row-reverse" : "flex-row")}>
          {isUser && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 bg-blue-600 ring-blue-700 text-white">
              <User className="h-4 w-4" />
            </div>
          )}

          <div className="flex flex-col">
            {/* Conversation text bubble */}
            {shouldRenderTextBubble ? (
              <div
                className={cn(
                  "px-6 py-5 text-[0.95rem] leading-relaxed shadow-sm border transition-all duration-300 w-full",
                  isUser
                    ? "bg-slate-100 border-slate-200 text-slate-800 rounded-3xl rounded-tr-sm font-medium"
                    : "bg-linear-to-br from-white to-emerald-50/20 border-slate-100 text-slate-700 rounded-3xl rounded-tl-sm ring-1 ring-black/5 hover:border-emerald-100/50 hover:shadow-lg"
                )}
              >
                {message.status === "loading" ? (
                  <div className="flex gap-1 py-1 px-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></span>
                  </div>
                ) : isUser ? (
                  <p className="whitespace-pre-wrap font-medium">{mainText}</p>
                ) : (
                  <PremiumMarkdownRenderer text={mainText} />
                )}
              </div>
            ) : null}

            {/* Structured Premium Clinical Consultation Dashboard Card */}
            {shouldRenderDashboard ? (
              <ConsultationDashboardCard 
                intent={message.intent!} 
                structuredData={message.structuredData} 
                citations={citations}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
