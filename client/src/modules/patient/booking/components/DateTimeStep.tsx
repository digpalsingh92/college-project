"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Check, MapPin, Video, Moon, Sun } from "lucide-react";
import { cn } from "@/helpers/cn";

interface SlotType {
  time: string;
  startTime: string;
  endTime: string;
  estimatedWaitTime?: number;
  waitLevel?: "low" | "moderate" | "high";
}

interface DateTimeStepProps {
  date: string;
  setDate: (date: string) => void;
  startTime: string;
  endTime: string;
  setStartTime: (time: string) => void;
  setEndTime: (time: string) => void;
  slots: SlotType[];
  loadingSlots: boolean;
  recommendedSlot?: string | null;
  avoidSlot?: string | null;
  onBack: () => void;
  onNext: () => void;
  doctorId: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function DateTimeStep({
  date,
  setDate,
  startTime,
  endTime,
  setStartTime,
  setEndTime,
  slots,
  loadingSlots,
  recommendedSlot,
  avoidSlot,
  onBack,
  onNext,
  doctorId,
}: DateTimeStepProps) {
  // Parse date or default to current date
  const selectedDate = useMemo(() => (date ? new Date(date) : new Date()), [date]);
  
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Calculate calendar parameters
  const firstDayOfMonth = useMemo(() => new Date(currentYear, currentMonth, 1).getDay(), [currentMonth, currentYear]);
  const daysInMonth = useMemo(() => new Date(currentYear, currentMonth + 1, 0).getDate(), [currentMonth, currentYear]);
  const daysInPrevMonth = useMemo(() => new Date(currentYear, currentMonth, 0).getDate(), [currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // Helper to split slots into morning/afternoon
  const isMorning = (timeStr: string) => {
    const cleanTime = timeStr.toLowerCase();
    if (cleanTime.includes("am")) return true;
    if (cleanTime.includes("pm")) return false;
    const hr = parseInt(timeStr.split(":")[0], 10);
    return hr < 12;
  };

  const morningSlots = useMemo(() => slots.filter((s) => isMorning(s.time)), [slots]);
  const afternoonSlots = useMemo(() => slots.filter((s) => !isMorning(s.time)), [slots]);

  return (
    <div className="flex flex-col gap-6">
      {/* Calendar & Time Slots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Calendar */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 font-headline-sm">
                  {MONTHS[currentMonth]} {currentYear}
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Weekday Names */}
              <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <span key={day} className="text-xs font-semibold text-slate-400 py-2 font-label-sm">
                    {day}
                  </span>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1 text-center font-body-md text-sm">
                {/* Previous month padding days */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => {
                  const dayNum = daysInPrevMonth - firstDayOfMonth + 1 + i;
                  return (
                    <div key={`prev-${dayNum}`} className="py-2 text-slate-300 font-medium">
                      {dayNum}
                    </div>
                  );
                })}

                {/* Active month days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const cellDate = new Date(currentYear, currentMonth, dayNum);
                  
                  const isPast = cellDate < today;
                  const isSelected = date === dateStr;

                  return (
                    <button
                      key={`day-${dayNum}`}
                      type="button"
                      disabled={isPast}
                      onClick={() => {
                        setDate(dateStr);
                        setStartTime("");
                        setEndTime("");
                      }}
                      className={cn(
                        "py-2 rounded-full relative font-semibold transition-all duration-200 flex items-center justify-center h-9 w-9 mx-auto focus:outline-none focus:ring-2 focus:ring-emerald-500",
                        isSelected
                          ? "bg-primary text-white shadow-xs"
                          : isPast
                            ? "text-slate-300 cursor-not-allowed"
                            : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <span>{dayNum}</span>
                      {!isPast && !isSelected && (
                        <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 text-[11px] font-semibold text-slate-400 text-center flex items-center justify-center gap-1.5 font-label-sm">
              Select a date with available slots marked with <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full" />
            </div>
          </div>
        </div>

        {/* Right Column: Time Slots */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Morning Slots */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Sun className="h-5 w-5 text-primary shrink-0" />
              <h4 className="text-base font-bold text-slate-800 font-headline-sm">Morning</h4>
            </div>

            {loadingSlots ? (
              <div className="py-6 text-center text-sm text-slate-400 font-semibold">Loading available slots...</div>
            ) : !doctorId || !date ? (
              <div className="py-6 text-center text-sm text-slate-400 font-semibold">Please select a doctor and date first.</div>
            ) : morningSlots.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-400 font-semibold">No morning slots available for this date.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {morningSlots.map((slot) => {
                  const selected = slot.startTime === startTime && slot.endTime === endTime;
                  const isRec = recommendedSlot === slot.time;
                  const isAv = avoidSlot === slot.time;

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => {
                        setStartTime(slot.startTime);
                        setEndTime(slot.endTime);
                      }}
                      className={cn(
                        "py-2.5 px-3 rounded-lg border font-semibold text-xs tracking-wide transition-all duration-200 relative overflow-hidden flex flex-col justify-center items-center gap-0.5",
                        selected
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                          : isRec
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400"
                            : isAv
                              ? "border-red-200 bg-red-50 text-red-800 hover:border-red-400"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-primary hover:text-primary"
                      )}
                    >
                      <span className="font-headline-sm">{slot.time}</span>
                      {slot.estimatedWaitTime !== undefined && (
                        <span className={cn(
                          "text-[9px] font-medium tracking-tight",
                          selected
                            ? "text-primary/80"
                            : isRec
                              ? "text-emerald-600"
                              : isAv
                                ? "text-red-600"
                                : "text-slate-400"
                        )}>
                          Wait: {slot.estimatedWaitTime} min
                        </span>
                      )}
                      
                      {selected && (
                        <>
                          <span className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-r-[12px] border-t-transparent border-r-primary" />
                          <Check className="absolute top-0.5 right-0.5 h-2 w-2 text-white stroke-[4]" />
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Afternoon Slots */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Moon className="h-5 w-5 text-primary shrink-0" />
              <h4 className="text-base font-bold text-slate-800 font-headline-sm">Afternoon</h4>
            </div>

            {loadingSlots ? (
              <div className="py-6 text-center text-sm text-slate-400 font-semibold">Loading available slots...</div>
            ) : !doctorId || !date ? (
              <div className="py-6 text-center text-sm text-slate-400 font-semibold">Please select a doctor and date first.</div>
            ) : afternoonSlots.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-400 font-semibold">No afternoon slots available for this date.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {afternoonSlots.map((slot) => {
                  const selected = slot.startTime === startTime && slot.endTime === endTime;
                  const isRec = recommendedSlot === slot.time;
                  const isAv = avoidSlot === slot.time;

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => {
                        setStartTime(slot.startTime);
                        setEndTime(slot.endTime);
                      }}
                      className={cn(
                        "py-2.5 px-3 rounded-lg border font-semibold text-xs tracking-wide transition-all duration-200 relative overflow-hidden flex flex-col justify-center items-center gap-0.5",
                        selected
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                          : isRec
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400"
                            : isAv
                              ? "border-red-200 bg-red-50 text-red-800 hover:border-red-400"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-primary hover:text-primary"
                      )}
                    >
                      <span className="font-headline-sm">{slot.time}</span>
                      {slot.estimatedWaitTime !== undefined && (
                        <span className={cn(
                          "text-[9px] font-medium tracking-tight",
                          selected
                            ? "text-primary/80"
                            : isRec
                              ? "text-emerald-600"
                              : isAv
                                ? "text-red-600"
                                : "text-slate-400"
                        )}>
                          Wait: {slot.estimatedWaitTime} min
                        </span>
                      )}

                      {selected && (
                        <>
                          <span className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-r-[12px] border-t-transparent border-r-primary" />
                          <Check className="absolute top-0.5 right-0.5 h-2 w-2 text-white stroke-[4]" />
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Action Bar (Sticky or bottom card) */}
      <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-4 bg-white/80 backdrop-blur-xs py-4 px-1">
        <button
          type="button"
          onClick={onBack}
          className="font-semibold text-xs text-slate-500 hover:text-slate-800 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-1.5 font-label-md"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-4">
          {startTime && date && (
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-bold text-slate-400 font-label-sm uppercase tracking-wider">Selected Slot</p>
              <p className="text-sm font-extrabold text-primary font-headline-sm">
                {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, {startTime}
              </p>
            </div>
          )}
          
          <button
            type="button"
            disabled={!date || !startTime}
            onClick={onNext}
            className={cn(
              "font-bold py-3 px-8 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 font-headline-sm text-sm border border-transparent",
              date && startTime
                ? "bg-primary text-white hover:bg-surface-tint hover:shadow-xs active:scale-[0.98]"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            Next Step
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
