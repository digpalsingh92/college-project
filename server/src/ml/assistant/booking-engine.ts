/**
 * Booking Engine
 *
 * Handles appointment booking queries with follow-up questions for missing info.
 */

export interface BookingEngineResult {
  step: "needs_info" | "info_provided";
  message: string;
  requiredFields: string[];
  providedFields: Record<string, string | undefined>;
}

export function runBookingEngine(query: string, department?: string): BookingEngineResult {
  const date = /\btomorrow\b/i.test(query) ? "tomorrow"
    : /\btoday\b/i.test(query) ? "today"
    : /\bnext week\b/i.test(query) ? "next week"
    : query.match(/\b(\d{4}-\d{2}-\d{2})\b/)?.[1] ?? undefined;

  const doctorName = query.match(/\bdr\.?\s+([a-z]+(?:\s+[a-z]+)?)\b/i)?.[1] ?? undefined;

  const requiredFields: string[] = [];
  if (!department) requiredFields.push("department or specialization");
  if (!date) requiredFields.push("preferred date");

  const providedFields: Record<string, string | undefined> = { department, date, doctorName };

  if (requiredFields.length > 0) {
    return {
      step: "needs_info",
      message: `To book an appointment, I'll need: ${requiredFields.join(", ")}. You can also browse available doctors from the Appointments section.`,
      requiredFields,
      providedFields,
    };
  }

  return {
    step: "info_provided",
    message: `I can help you book an appointment${doctorName ? ` with Dr. ${doctorName}` : ""}${department ? ` in ${department}` : ""}${date ? ` for ${date}` : ""}. Please navigate to the Appointments page to complete your booking.`,
    requiredFields: [],
    providedFields,
  };
}
