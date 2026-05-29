"use client";

import React from "react";
import { Stethoscope, CalendarDays, User, ArrowRight, Hourglass, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/helpers/cn";
import type { DoctorListItem } from "@/types/api";

interface ConfirmAppointmentStepProps {
  selectedDoctor: DoctorListItem | null;
  date: string;
  startTime: string;
  endTime: string;
  appointmentType: "IN_PERSON" | "VIDEO";
  patientName: string;
  patientAge: string;
  patientPhone: string;
  patientEmail: string;
  patientGender: string;
  patientAddress: string;
  issue: string;
  paymentMethod: "CARD" | "UPI" | "INSURANCE" | "NET_BANKING" | "CASH";
  cardNumber: string;
  upiId: string;
  insuranceProvider: string;
  selectedBank: string;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}

export function ConfirmAppointmentStep({
  selectedDoctor,
  date,
  startTime,
  endTime,
  appointmentType,
  patientName,
  patientAge,
  patientPhone,
  patientEmail,
  patientGender,
  patientAddress,
  issue,
  paymentMethod,
  cardNumber,
  upiId,
  insuranceProvider,
  selectedBank,
  onBack,
  onSubmit,
  submitting,
}: ConfirmAppointmentStepProps) {

  // Price calculations
  const docFee = selectedDoctor?.doctorProfile?.consultationFee ?? 500;
  const platformFee = 50;
  const totalAmount = docFee + platformFee;

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })
    : "No date selected";

  const getPaymentSummaryText = () => {
    if (paymentMethod === "CARD") {
      return `Visa ending in ${cardNumber.slice(-4) || "4242"}`;
    }
    if (paymentMethod === "UPI") {
      return `UPI VPA: ${upiId || "user@upi"}`;
    }
    if (paymentMethod === "INSURANCE") {
      return `Insurance: ${insuranceProvider || "Star Health"}`;
    }
    if (paymentMethod === "NET_BANKING") {
      return `${selectedBank.toUpperCase()} Net Banking`;
    }
    if (paymentMethod === "CASH") {
      return "Pay Cash at Hospital";
    }
    return "Payment Method Not Specified";
  };

  const getPaymentSummaryLabel = () => {
    if (paymentMethod === "CARD") return "Credit / Debit Card";
    if (paymentMethod === "UPI") return "UPI / QR Code";
    if (paymentMethod === "INSURANCE") return "Pay via Insurance";
    if (paymentMethod === "NET_BANKING") return "Net Banking";
    if (paymentMethod === "CASH") return "Cash at Hospital";
    return "Payment Method";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
      
      {/* Left Column: Summary Cards */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* Doctor Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-xs transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-headline-sm">
              <Stethoscope className="h-5 w-5 text-primary shrink-0" />
              Doctor Details
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
              <span className="font-extrabold text-sm tracking-tight">
                {selectedDoctor?.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "MD"}
              </span>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-slate-900 font-headline-sm">{selectedDoctor?.name || "Medical Provider"}</div>
              <div className="text-xs font-semibold text-slate-400 mt-1 font-label-md">
                {selectedDoctor?.doctorProfile?.specialization || "General Medicine"}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center gap-1 font-label-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Mediso Central Wing, Suite 402
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-xs transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-headline-sm">
              <CalendarDays className="h-5 w-5 text-primary shrink-0" />
              Appointment Details
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 font-label-sm mb-0.5">Date</div>
              <div className="text-xs font-semibold text-slate-800 font-body-md">{formattedDate}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 font-label-sm mb-0.5">Time</div>
              <div className="text-xs font-semibold text-slate-800 font-body-md">{startTime ? `${startTime} (EST)` : "No time selected"}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 font-label-sm mb-0.5">Consultation Type</div>
              <div className="text-xs font-semibold text-slate-800 font-body-md">
                {appointmentType === "IN_PERSON" ? "In-Person Consultation" : "Video Consultation"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 font-label-sm mb-0.5">Estimated Duration</div>
              <div className="text-xs font-semibold text-slate-800 font-body-md">45 Minutes</div>
            </div>
          </div>
        </div>

        {/* Patient Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-xs transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-headline-sm">
              <User className="h-5 w-5 text-primary shrink-0" />
              Patient Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 font-label-sm mb-0.5">Full Name</div>
              <div className="text-xs font-semibold text-slate-800 font-body-md">{patientName}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 font-label-sm mb-0.5">Age &amp; Gender</div>
              <div className="text-xs font-semibold text-slate-800 font-body-md">
                {patientAge} Years • {patientGender.toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 font-label-sm mb-0.5">Contact Phone</div>
              <div className="text-xs font-semibold text-slate-800 font-body-md">{patientPhone}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 font-label-sm mb-0.5">Email</div>
              <div className="text-xs font-semibold text-slate-800 font-body-md">{patientEmail}</div>
            </div>
            {patientAddress && (
              <div className="md:col-span-2 border-t border-slate-50 pt-2">
                <div className="text-[10px] font-bold text-slate-400 font-label-sm mb-0.5">Residential Address</div>
                <div className="text-xs font-semibold text-slate-700 leading-relaxed font-body-md">{patientAddress}</div>
              </div>
            )}
            <div className="md:col-span-2 border-t border-slate-50 pt-2">
              <div className="text-[10px] font-bold text-slate-400 font-label-sm mb-0.5">Medical Issue / Reason for Visit</div>
              <div className="text-xs font-semibold text-slate-700 leading-relaxed font-body-md bg-slate-50 rounded-xl border border-slate-100 p-3.5 italic">
                “{issue}”
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Right Column: Status & Payment */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Quick Info Widget */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-150 pb-2">
            <div className="text-[9px] font-bold text-slate-400 font-label-sm uppercase tracking-wider">Appointment ID Preview</div>
            <div className="text-[10px] font-bold font-mono text-slate-500 bg-slate-200/50 py-0.5 px-2 rounded-sm">
              #MD-8492A
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Hourglass className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 font-label-sm">Estimated Wait Time</div>
              <div className="text-sm font-bold text-slate-800 font-headline-sm">5 - 10 mins</div>
            </div>
          </div>
        </div>

        {/* Payment Method Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-headline-sm">
              <CreditCard className="h-5 w-5 text-primary shrink-0" />
              Payment Details
            </h2>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <CreditCard className="h-6 w-6 text-slate-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate font-label-md">
                {getPaymentSummaryLabel()}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 truncate mt-0.5 font-label-sm">
                {getPaymentSummaryText()}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
              <span>Consultation Fee</span>
              <span className="text-slate-800 font-bold">₹{docFee}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
              <span>Platform Fee</span>
              <span className="text-slate-800 font-bold">₹{platformFee}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-800 pt-2 border-t border-slate-50 font-headline-sm">
              <span>Total</span>
              <span className="text-primary font-extrabold text-base font-headline-md">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={submitting}
            onClick={onSubmit}
            className={cn(
              "w-full bg-primary hover:bg-surface-tint text-on-primary font-bold py-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-sm font-headline-sm border border-transparent",
              submitting ? "cursor-not-allowed opacity-80" : "active:scale-[0.98]"
            )}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : null}
            <span>Confirm Appointment</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={onBack}
            className="w-full bg-transparent border border-slate-200 text-slate-500 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors text-xs font-label-md"
          >
            Go Back
          </button>

          <p className="text-[10px] leading-relaxed text-slate-400 text-center mt-4 font-label-sm">
            By confirming, you agree to Mediso's{" "}
            <a className="text-primary underline font-bold" href="#">Terms of Service</a> &amp;{" "}
            <a className="text-primary underline font-bold" href="#">Cancellation Policy</a>.
          </p>
        </div>

      </div>

    </div>
  );
}
