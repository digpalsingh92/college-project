"use client";

import React from "react";
import { User, Activity, AlertCircle, ChevronLeft, ChevronRight, Phone } from "lucide-react";
import { cn } from "@/helpers/cn";

interface PatientDetailsStepProps {
  patientName: string;
  setPatientName: (name: string) => void;
  patientEmail: string;
  setPatientEmail: (email: string) => void;
  patientPhone: string;
  setPatientPhone: (phone: string) => void;
  patientAge: string;
  setPatientAge: (age: string) => void;
  patientGender: string;
  setPatientGender: (gender: string) => void;
  patientAddress: string;
  setPatientAddress: (address: string) => void;
  issue: string;
  setIssue: (issue: string) => void;
  emergencyName: string;
  setEmergencyName: (name: string) => void;
  emergencyPhone: string;
  setEmergencyPhone: (phone: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function PatientDetailsStep({
  patientName,
  setPatientName,
  patientEmail,
  setPatientEmail,
  patientPhone,
  setPatientPhone,
  patientAge,
  setPatientAge,
  patientGender,
  setPatientGender,
  patientAddress,
  setPatientAddress,
  issue,
  setIssue,
  emergencyName,
  setEmergencyName,
  emergencyPhone,
  setEmergencyPhone,
  onBack,
  onNext,
}: PatientDetailsStepProps) {

  const charCount = issue.length;
  const isCloseToLimit = charCount > 480;

  const isFormValid = Boolean(
    patientName.trim() &&
    patientEmail.trim() &&
    patientPhone.trim() &&
    patientAge.trim() &&
    patientGender &&
    issue.trim()
  );

  const handleContinue = () => {
    if (isFormValid) {
      onNext();
    }
  };

  return (
    <div className="flex flex-col gap-8">
      
      {/* Section: Personal Details */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <User className="h-5 w-5 text-primary shrink-0" />
          <h2 className="text-base font-bold text-slate-800 font-headline-sm">Personal Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 font-label-sm" htmlFor="fullName">
              Full Name *
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-body-md text-sm text-slate-800 placeholder:text-slate-300 font-medium"
            />
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 font-label-sm" htmlFor="email">
              Email Address *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="jane.doe@example.com"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-body-md text-sm text-slate-800 placeholder:text-slate-300 font-medium"
            />
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 font-label-sm" htmlFor="phone">
              Phone Number *
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-body-md text-sm text-slate-800 placeholder:text-slate-300 font-medium"
            />
          </div>

          {/* Age & Gender Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 font-label-sm" htmlFor="age">
                Age *
              </label>
              <input
                id="age"
                name="age"
                type="number"
                required
                min="0"
                max="150"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="32"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-body-md text-sm text-slate-800 placeholder:text-slate-300 font-medium"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 font-label-sm" htmlFor="gender">
                Gender *
              </label>
              <select
                id="gender"
                name="gender"
                required
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-body-md text-sm text-slate-800 font-semibold"
              >
                <option value="" disabled>Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Address (Full width) */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 font-label-sm" htmlFor="address">
              Residential Address
            </label>
            <textarea
              id="address"
              name="address"
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
              placeholder="123 Medical Way, Apt 4B, Healthville, ST 12345"
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-body-md text-sm text-slate-800 placeholder:text-slate-300 font-medium resize-none"
            />
          </div>
        </div>
      </div>

      {/* Section: Medical Context */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <Activity className="h-5 w-5 text-primary shrink-0" />
          <h2 className="text-base font-bold text-slate-800 font-headline-sm">Visit Details</h2>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 font-label-sm" htmlFor="reason">
            Reason for Visit *
          </label>
          <textarea
            id="reason"
            name="reason"
            required
            maxLength={500}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="Briefly describe your symptoms or reason for the appointment..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-body-md text-sm text-slate-800 placeholder:text-slate-300 font-medium resize-y"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              {isCloseToLimit && (
                <>
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span className="text-red-500 font-bold">Close to 500 characters limit</span>
                </>
              )}
            </span>
            <p className={cn(
              "text-xs font-bold font-label-sm",
              isCloseToLimit ? "text-red-500 animate-pulse" : "text-slate-400"
            )}>
              {charCount} / 500
            </p>
          </div>
        </div>
      </div>

      {/* Section: Emergency Contact */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <Phone className="h-5 w-5 text-primary shrink-0" />
          <h2 className="text-base font-bold text-slate-800 font-headline-sm">Emergency Contact</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
          {/* Emergency Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 font-label-sm" htmlFor="ecName">
              Contact Name
            </label>
            <input
              id="ecName"
              name="ecName"
              type="text"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-body-md text-sm text-slate-800 placeholder:text-slate-300 font-medium"
            />
          </div>

          {/* Emergency Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 font-label-sm" htmlFor="ecPhone">
              Contact Phone
            </label>
            <input
              id="ecPhone"
              name="ecPhone"
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="(555) 987-6543"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all font-body-md text-sm text-slate-800 placeholder:text-slate-300 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-6 py-3 font-semibold text-xs text-slate-500 hover:text-slate-850 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100 font-label-md flex items-center justify-center gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        
        <button
          type="button"
          disabled={!isFormValid}
          onClick={handleContinue}
          className={cn(
            "w-full sm:w-auto px-8 py-3 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 font-headline-sm text-sm border border-transparent",
            isFormValid
              ? "bg-primary text-white hover:bg-surface-tint hover:shadow-xs active:scale-[0.98]"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          <span>Continue to Payment</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}
