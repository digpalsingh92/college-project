"use client";

import { AssistantChat } from "@/modules/patient/surgery/AssistantChat";

export function SurgeryPlannerPage() {
  return (
    <div className="h-[calc(100vh-7rem)] md:h-[calc(100vh-8rem)]">
      <AssistantChat />
    </div>
  );
}
