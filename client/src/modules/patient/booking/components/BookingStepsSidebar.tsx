"use client";

import React from "react";
import { cn } from "@/helpers/cn";
import { 
  User, 
  CalendarDays, 
  UserCog, 
  CreditCard, 
  CheckCircle2 
} from "lucide-react";
import type { DoctorListItem } from "@/types/api";

interface BookingStepsSidebarProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  selectedDoctor?: DoctorListItem | null;
}

export function BookingStepsSidebar({ 
  currentStep, 
  onStepClick, 
  selectedDoctor 
}: BookingStepsSidebarProps) {
  const steps = [
    { label: "Select Doctor", icon: User },
    { label: "Date & Time", icon: CalendarDays },
    { label: "Patient Details", icon: UserCog },
    { label: "Payment Method", icon: CreditCard },
    { label: "Confirm Appointment", icon: CheckCircle2 },
  ];

  return (
    <aside className="bg-surface-container-low border-r border-outline-variant hidden md:flex flex-col gap-4 p-6 w-[280px] shrink-0 h-full overflow-y-auto">
      <div className="mb-6 pl-4">
        <h2 className="font-headline-md text-headline-md font-extrabold text-primary">Mediso</h2>
        <p className="font-label-sm text-label-sm text-secondary mt-1">Appointment Booking</p>
      </div>
      
      <nav className="flex flex-col gap-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const active = currentStep === i;
          const done = currentStep > i;
          
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                if (i < currentStep) {
                  onStepClick(i);
                }
              }}
              disabled={i > currentStep}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold transition-all duration-300 font-label-md text-label-md",
                active
                  ? "bg-primary text-on-primary rounded-full shadow-xs"
                  : done
                    ? "text-primary hover:bg-surface-container-high rounded-lg cursor-pointer"
                    : "text-secondary opacity-60 cursor-default"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Selected Doctor Info Footer */}
      {selectedDoctor && (
        <div className="mt-auto pt-6 border-t border-outline-variant/30 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary border border-primary/20">
            <span className="font-extrabold text-xs tracking-tight">
              {selectedDoctor.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-xs text-slate-800 truncate font-headline-sm">{selectedDoctor.name}</p>
            <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5 font-label-sm">
              {selectedDoctor.doctorProfile?.specialization || "General Medicine"}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

