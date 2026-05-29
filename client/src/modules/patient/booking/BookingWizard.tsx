"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Stethoscope, 
  CreditCard, 
  Calendar, 
  User, 
  Award, 
  Activity, 
  BedDouble, 
  Users, 
  Clock 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SlotCard } from "@/components/SlotCard";
import type { AppointmentSlotsResponse, DoctorListItem } from "@/types/api";
import {
  useCreateAppointmentMutation,
  useGetDoctorsQuery,
  useGetAppointmentSlotsQuery,
} from "@/store/apiSlice";
import { cn } from "@/helpers/cn";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BookingStepsSidebar } from "./components/BookingStepsSidebar";
import { DateTimeStep } from "./components/DateTimeStep";
import { PatientDetailsStep } from "./components/PatientDetailsStep";
import { PaymentMethodStep } from "./components/PaymentMethodStep";
import { ConfirmAppointmentStep } from "./components/ConfirmAppointmentStep";

export function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Read doctor pre-selection from assistant click
  const queryDoctorId = searchParams.get("doctorId");

  const { data: doctorsData, isLoading: doctorsLoading } = useGetDoctorsQuery();
  const [createAppointment, { isLoading: creating }] = useCreateAppointmentMutation();

  const [step, setStep] = useState<number>(queryDoctorId ? 1 : 0);
  const [doctorId, setDoctorId] = useState(queryDoctorId || "");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [patientName, setPatientName] = useState(user?.name ?? "");
  const [patientEmail, setPatientEmail] = useState(user?.email ?? "");
  const [patientAge, setPatientAge] = useState("");
  const [issue, setIssue] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [appointmentType, setAppointmentType] = useState<"IN_PERSON" | "VIDEO">("IN_PERSON");
  const [selectedBank, setSelectedBank] = useState("");
  const slotRailRef = useRef<HTMLDivElement | null>(null);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "UPI" | "INSURANCE" | "NET_BANKING" | "CASH">("CARD");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState(user?.name ?? "");
  const [upiId, setUpiId] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insurancePolicy, setInsurancePolicy] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Sync auth fields if they load late
  useEffect(() => {
    if (user?.name && !patientName) setPatientName(user.name);
    if (user?.email && !patientEmail) setPatientEmail(user.email);
    if (user?.name && !cardName) setCardName(user.name);
  }, [user]);

  // Sync doctor selection from search params
  useEffect(() => {
    if (queryDoctorId) {
      setDoctorId(queryDoctorId);
      setStep(1);
    }
  }, [queryDoctorId]);

  const { data: slotPredictions, isFetching: loadingSlots } = useGetAppointmentSlotsQuery(
    {
      doctorId,
      date,
      appointmentType,
    },
    {
      skip: !doctorId || !date,
    }
  );

  const slots = (slotPredictions?.slots ?? []) as AppointmentSlotsResponse["slots"];
  const selectedDoctor = (doctorsData?.doctors ?? []).find((d: DoctorListItem) => d.id === doctorId) ?? null;

  const isStep1Complete = Boolean(doctorId);
  const isStep2Complete = Boolean(date && startTime && endTime);
  const isStep3Complete = Boolean(
    patientName.trim() &&
    patientEmail.trim() &&
    patientPhone.trim() &&
    patientAge.trim() &&
    patientGender &&
    issue.trim()
  );

  const isPaymentComplete = useMemo(() => {
    if (paymentMethod === "CARD") {
      return cardNumber.trim().length >= 15 && cardExpiry.trim().length >= 5 && cardCvc.trim().length >= 3 && cardName.trim().length > 0;
    }
    if (paymentMethod === "UPI") {
      return upiId.trim().includes("@") && upiId.trim().length >= 5;
    }
    if (paymentMethod === "INSURANCE") {
      return insuranceProvider.trim().length > 0 && insurancePolicy.trim().length > 0;
    }
    if (paymentMethod === "NET_BANKING") {
      return selectedBank.length > 0;
    }
    if (paymentMethod === "CASH") {
      return true;
    }
    return false;
  }, [paymentMethod, cardNumber, cardExpiry, cardCvc, cardName, upiId, insuranceProvider, insurancePolicy, selectedBank]);

  const canSubmit = isStep1Complete && isStep2Complete && isStep3Complete && isPaymentComplete;

  async function handleBook(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      await createAppointment({
        doctorId,
        date,
        startTime,
        endTime,
        patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
        remarks: `[Type: ${appointmentType === "IN_PERSON" ? "In-person" : "Video"}] ${issue.trim()}`,
        paymentMethod,
        paymentStatus: paymentMethod === "INSURANCE" ? "INSURANCE_CLAIMED" : paymentMethod === "CASH" ? "PENDING" : "PAID",
        amountPaid: selectedDoctor?.doctorProfile?.consultationFee ?? 0.0,
        insuranceProvider: paymentMethod === "INSURANCE" ? insuranceProvider : undefined,
        insurancePolicy: paymentMethod === "INSURANCE" ? insurancePolicy : undefined,
      }).unwrap();

      toast.success("Appointment scheduled successfully!");
      router.push("/patient/appointments");
    } catch {
      /* Handled by API middleware toasters */
    }
  }

  function nextStep() {
    if (step === 0 && !isStep1Complete) return;
    if (step === 1 && !isStep2Complete) return;
    if (step === 2 && !isStep3Complete) return;
    if (step === 3 && !isPaymentComplete) return;

    if (step === 3) {
      setIsProcessingPayment(true);
      setTimeout(() => {
        setIsProcessingPayment(false);
        setStep(4);
      }, 2000);
      return;
    }

    setStep((prev) => Math.min(4, prev + 1));
  }

  function previousStep() {
    setStep((prev) => Math.max(0, prev - 1));
  }

  function scrollSlots(direction: "left" | "right") {
    if (!slotRailRef.current) return;
    const amount = direction === "left" ? -320 : 320;
    slotRailRef.current.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-5xl mx-auto items-start py-4">
      <BookingStepsSidebar currentStep={step} onStepClick={setStep} selectedDoctor={selectedDoctor} />

      {/* Main Flow Content Container */}
      <div className="flex-1 w-full space-y-6">
        {step === 0 && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Select Doctor
            </h2>
            <p className="mt-1 text-sm text-muted">
              Choose a healthcare provider
            </p>
          </div>
        )}
 
        <div className={cn(
          "overflow-hidden",
          step === 0 ? "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" : ""
        )}>
          {step === 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-800 font-headline-sm">Appointment Booking Flow</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">Complete the fields below to schedule your healthcare consultation.</p>
            </div>
          )}
          <form onSubmit={handleBook} className={cn(step === 0 ? "space-y-6" : "")}>
            
            {/* Step 0: Select Doctor */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {doctorsLoading ? (
                    <p className="text-sm text-muted">Loading providers…</p>
                  ) : (
                    (doctorsData?.doctors ?? []).map((d: DoctorListItem) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setDoctorId(d.id);
                          setDate("");
                          setStartTime("");
                          setEndTime("");
                          setStep(1);
                        }}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all",
                          doctorId === d.id
                            ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-200"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/30"
                        )}
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <Stethoscope className="h-6 w-6" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 truncate">{d.name}</p>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">{d.doctorProfile?.specialization ?? "General Provider"}</p>
                          <p className="text-sm font-extrabold text-emerald-800 mt-1">₹{d.doctorProfile?.consultationFee ?? 500}</p>
                        </div>
                        <span className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wider">
                          Select
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
                        {/* Step 1: Date & Time */}
            {step === 1 && (
              <DateTimeStep
                date={date}
                setDate={setDate}
                startTime={startTime}
                setStartTime={setStartTime}
                endTime={endTime}
                setEndTime={setEndTime}
                slots={slots}
                loadingSlots={loadingSlots}
                recommendedSlot={slotPredictions?.recommendedSlot}
                avoidSlot={slotPredictions?.avoidSlot}
                appointmentType={appointmentType}
                setAppointmentType={setAppointmentType}
                onBack={previousStep}
                onNext={nextStep}
                doctorId={doctorId}
              />
            )}

            {/* Step 2: Patient Details */}
            {step === 2 && (
              <PatientDetailsStep
                patientName={patientName}
                setPatientName={setPatientName}
                patientEmail={patientEmail}
                setPatientEmail={setPatientEmail}
                patientPhone={patientPhone}
                setPatientPhone={setPatientPhone}
                patientAge={patientAge}
                setPatientAge={setPatientAge}
                patientGender={patientGender}
                setPatientGender={setPatientGender}
                patientAddress={patientAddress}
                setPatientAddress={setPatientAddress}
                issue={issue}
                setIssue={setIssue}
                emergencyName={emergencyName}
                setEmergencyName={setEmergencyName}
                emergencyPhone={emergencyPhone}
                setEmergencyPhone={setEmergencyPhone}
                onBack={previousStep}
                onNext={nextStep}
              />
            )}

            {/* Step 3: Payment Method */}
            {step === 3 && (
              <PaymentMethodStep
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                cardNumber={cardNumber}
                setCardNumber={setCardNumber}
                cardExpiry={cardExpiry}
                setCardExpiry={setCardExpiry}
                cardCvc={cardCvc}
                setCardCvc={setCardCvc}
                cardName={cardName}
                setCardName={setCardName}
                upiId={upiId}
                setUpiId={setUpiId}
                insuranceProvider={insuranceProvider}
                setInsuranceProvider={setInsuranceProvider}
                insurancePolicy={insurancePolicy}
                setInsurancePolicy={setInsurancePolicy}
                selectedBank={selectedBank}
                setSelectedBank={setSelectedBank}
                selectedDoctor={selectedDoctor}
                date={date}
                startTime={startTime}
                endTime={endTime}
                isProcessingPayment={isProcessingPayment}
                onBack={previousStep}
                onNext={nextStep}
              />
            )}
 
            {/* Step 4: Review & Confirm */}
            {step === 4 && (
              <ConfirmAppointmentStep
                selectedDoctor={selectedDoctor}
                date={date}
                startTime={startTime}
                endTime={endTime}
                appointmentType={appointmentType}
                patientName={patientName}
                patientAge={patientAge}
                patientPhone={patientPhone}
                patientEmail={patientEmail}
                patientGender={patientGender}
                patientAddress={patientAddress}
                issue={issue}
                paymentMethod={paymentMethod}
                cardNumber={cardNumber}
                upiId={upiId}
                insuranceProvider={insuranceProvider}
                selectedBank={selectedBank}
                onBack={previousStep}
                onSubmit={handleBook}
                submitting={creating}
              />
            )}
 
            {/* Navigation buttons */}
            {step === 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    router.push("/patient/appointments");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
