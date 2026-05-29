"use client";

import React, { useMemo, useRef, useState, useEffect, type ComponentType } from "react";
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
  Clock,
  Search,
  X,
  MapPin,
  ArrowRight,
  Star,
  Clock3
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

type DoctorCategory = "All Specialists" | "Cardiologist" | "Dermatologist" | "Neurologist" | "Gastroenterologist";
const filters: DoctorCategory[] = ["All Specialists", "Cardiologist", "Dermatologist", "Neurologist", "Gastroenterologist"];

type DoctorCard = {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  rating: string;
  reviews: number;
  hospital: string;
  availability: string;
  availabilityTone: "today" | "tomorrow";
  selected?: boolean;
};

function DoctorAvatar({ name, active = false }: { name: string; active?: boolean }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(1, 3)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full shrink-0",
        active ? "ring-2 ring-[#006c49]/20" : "ring-1 ring-slate-200"
      )}
    >
      <div className="flex h-full w-full items-center justify-center bg-[#006c49]/10 text-base font-bold text-[#006c49]">
        {initials}
      </div>
      <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
    </div>
  );
}

function DoctorCardView({ doctor, isSelected, onSelect }: { doctor: DoctorCard; isSelected?: boolean; onSelect?: () => void }) {
  const selected = Boolean(isSelected);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.();
      }}
      className={cn(
        "relative flex h-full flex-col gap-4 rounded-xl border bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)] cursor-pointer group transition-all duration-300 text-left",
        selected
          ? "border-2 border-[#006c49] shadow-[0_8px_12px_rgba(0,0,0,0.08)] scale-[1.02]"
          : "border-slate-200 hover:-translate-y-0.5 hover:border-[#006c49]/50 hover:shadow-[0_8px_12px_rgba(0,0,0,0.08)]"
      )}
      aria-pressed={selected}
    >
      {selected ? (
        <div className="absolute top-4 right-4 bg-[#006c49] text-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm z-10">
          <Check className="h-4 w-4 stroke-[3px]" />
        </div>
      ) : null}

      <div className="flex items-center gap-4 pr-8">
        <DoctorAvatar name={doctor.name} active={selected} />
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-[#006c49] transition-colors">{doctor.name}</h3>
          <p className="text-sm font-semibold text-[#006c49]">{doctor.specialization}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5 text-slate-400" />
            Experience
          </span>
          <span className="text-sm font-bold text-slate-800">{doctor.experience}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            Rating
          </span>
          <span className="text-sm font-bold text-slate-800">
            {doctor.rating} ({doctor.reviews} reviews)
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span>{doctor.hospital}</span>
        </div>

        <div className={cn(
          "mt-2 inline-flex w-max items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
          doctor.availabilityTone === "today"
            ? "bg-[#006c49]/10 text-[#006c49]"
            : "bg-slate-100 text-slate-500"
        )}>
          <span className={cn(
            "h-2 w-2 rounded-full",
            doctor.availabilityTone === "today" ? "bg-[#006c49] animate-pulse" : "bg-slate-400"
          )} />
          {doctor.availability}
        </div>
      </div>

      <button
        type="button"
        className={cn(
          "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all duration-200",
          selected
            ? "bg-[#006c49] text-white hover:bg-[#005236]"
            : "border border-[#006c49] bg-transparent text-[#006c49] hover:bg-[#006c49] hover:text-white"
        )}
      >
        {selected ? "Selected" : "Select Doctor"}
      </button>
    </article>
  );
}

export function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Read doctor pre-selection from assistant click
  const queryDoctorId = searchParams.get("doctorId");

  const [activeFilter, setActiveFilter] = useState<DoctorCategory>("All Specialists");
  const [searchTerm, setSearchTerm] = useState("");

  // Retrieve all doctors for tab count statistics
  const { data: allDoctorsData } = useGetDoctorsQuery();

  // Retrieve filtered doctors reactively from the backend API
  const { data: doctorsData, isLoading: doctorsLoading } = useGetDoctorsQuery({
    search: searchTerm.trim() || undefined,
    specialization: activeFilter === "All Specialists" ? undefined : activeFilter,
  });

  const doctorCounts = useMemo(() => {
    const list = allDoctorsData?.doctors ?? [];
    return filters.map((filter) => {
      const count =
        filter === "All Specialists"
          ? list.length
          : list.filter((d) => d.doctorProfile?.specialization === filter).length;

      return { filter, count };
    });
  }, [allDoctorsData]);

  const visibleDoctors: DoctorCard[] = useMemo(() => {
    const list = doctorsData?.doctors ?? [];
    return list.map((doc) => {
      const ratingVal = 4.5 + (doc.name.length % 5) * 0.1;
      const reviewsCount = 50 + (doc.name.length % 10) * 15;
      const isToday = doc.name.length % 2 === 0;

      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.doctorProfile?.specialization ?? "General Physician",
        experience: `${doc.doctorProfile?.experience ?? 5} Years`,
        rating: ratingVal.toFixed(1),
        reviews: reviewsCount,
        hospital: doc.name.length % 3 === 0 ? "Mediso Skin Center" : "Mediso General Hospital",
        availability: isToday ? "Available Today" : "Available Tomorrow",
        availabilityTone: isToday ? "today" : "tomorrow",
      };
    });
  }, [doctorsData]);

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

  // Auto-select first available doctor on load or query refilter
  useEffect(() => {
    if (step === 0 && visibleDoctors.length > 0) {
      const isStillVisible = visibleDoctors.some((d) => d.id === doctorId);
      if (!isStillVisible) {
        setDoctorId(visibleDoctors[0].id);
      }
    }
  }, [visibleDoctors, doctorId, step]);

  const { data: slotPredictions, isFetching: loadingSlots } = useGetAppointmentSlotsQuery(
    {
      doctorId,
      date,
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
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto items-start py-4">
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
 
        <div className="w-full">
          <form onSubmit={handleBook} className="space-y-6">
            
            {/* Step 0: Select Doctor */}
            {step === 0 && (
              <div className="space-y-6">
                {/* Search & Filter Bar */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col lg:flex-row gap-4 items-center shadow-sm">
                  <div className="relative w-full flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      type="text"
                      placeholder="Search by name or specialization..."
                      className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] transition-colors"
                    />
                    {searchTerm.length > 0 ? (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  <div className="flex gap-2 max-w-[320px] sm:max-w-[440px] overflow-x-auto flex-nowrap hide-scrollbar shrink-0 py-1">
                    {doctorCounts.map(({ filter, count }) => {
                      const active = activeFilter === filter;

                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setActiveFilter(filter)}
                          className={cn(
                            "whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-full border transition-all flex items-center gap-2",
                            active
                              ? "border-[#006c49]/20 bg-[#006c49]/10 text-[#006c49]"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <span>{filter}</span>
                          <span className="ml-1 rounded-full bg-slate-100 px-2 text-xs text-slate-600">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {doctorsLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm flex flex-col items-center justify-center w-full">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#006c49] border-t-transparent mb-4" />
                    <p className="text-lg font-semibold text-slate-900">Loading healthcare providers...</p>
                    <p className="mt-1 text-sm text-slate-500">Searching Mediso database.</p>
                  </div>
                ) : (
                  <>
                    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {visibleDoctors.map((doctor) => (
                        <DoctorCardView
                          key={doctor.id}
                          doctor={doctor}
                          isSelected={doctorId === doctor.id}
                          onSelect={() => {
                            setDoctorId(doctor.id);
                            setDate("");
                            setStartTime("");
                            setEndTime("");
                          }}
                        />
                      ))}
                    </section>

                    {visibleDoctors.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm w-full">
                        <p className="text-lg font-semibold text-slate-900">No doctors matched your search.</p>
                        <p className="mt-2 text-sm text-slate-600">Try a different specialization or clear the search field.</p>
                      </div>
                    ) : null}
                  </>
                )}
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
              <div className="flex justify-between items-center pt-6 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    router.push("/patient/appointments");
                  }}
                >
                  Cancel
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    if (doctorId) {
                      setStep(1);
                    } else {
                      alert("Please select a doctor to continue.");
                    }
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-bold shadow-sm transition-all duration-200",
                    doctorId
                      ? "bg-[#006c49] text-white hover:bg-[#005236]"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  )}
                >
                  <span>Continue to Date &amp; Time</span>
                  <ArrowRight className="h-4 w-4 stroke-[3px]" />
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
