"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarClock,
  CalendarOff,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/helpers/cn";
import { useAppSelector } from "@/store/hooks";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  useCreateDoctorScheduleMutation,
  useDeleteDoctorScheduleMutation,
  useDeleteDoctorUnavailabilityMutation,
  useAddDoctorUnavailabilityMutation,
  useGetDoctorSchedulesQuery,
  useGetDoctorUnavailabilitiesQuery,
  useUpdateDoctorScheduleMutation,
} from "@/store/apiSlice";
import type { DayOfWeek, ScheduleDto, UnavailabilityDto } from "@/types/api";

const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_ABBR: Record<DayOfWeek, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const DAY_COLOR: Record<DayOfWeek, string> = {
  MONDAY: "bg-blue-50 text-blue-700 border-blue-200",
  TUESDAY: "bg-violet-50 text-violet-700 border-violet-200",
  WEDNESDAY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  THURSDAY: "bg-amber-50 text-amber-700 border-amber-200",
  FRIDAY: "bg-rose-50 text-rose-700 border-rose-200",
  SATURDAY: "bg-orange-50 text-orange-700 border-orange-200",
  SUNDAY: "bg-slate-50 text-slate-600 border-slate-200",
};

const DAY_BY_JS_INDEX: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function getTodayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

function getDayOfWeekFromIsoDate(isoDate: string): DayOfWeek {
  const jsDay = new Date(`${isoDate}T00:00:00`).getDay();
  return DAY_BY_JS_INDEX[jsDay];
}

/** Group schedules by day */
function groupByDay(schedules: ScheduleDto[]): Record<DayOfWeek, ScheduleDto[]> {
  const grouped = {} as Record<DayOfWeek, ScheduleDto[]>;
  for (const d of DAYS) grouped[d] = [];
  for (const s of schedules) grouped[s.dayOfWeek].push(s);
  return grouped;
}

// ─── Sub‑components ──────────────────────────────────────────────────────────

interface ScheduleFormProps {
  doctorId: string;
  onClose: () => void;
}

function CreateScheduleForm({ doctorId, onClose }: ScheduleFormProps) {
  const today = getTodayIsoDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotDuration, setSlotDuration] = useState(30);
  const [create, { isLoading }] = useCreateDoctorScheduleMutation();

  const day = getDayOfWeekFromIsoDate(selectedDate);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startTime || !endTime) return;
    try {
      await create({ doctorId, dayOfWeek: day, startTime, endTime, slotDurationMinutes: slotDuration }).unwrap();
      toast.success("Schedule created successfully!", {
        description: `${formatDate(selectedDate)} (${DAY_ABBR[day]}): ${startTime} - ${endTime}`,
      });
      onClose();
    } catch {
      /* errors handled by runRequest in apiSlice */
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date picker */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Date</label>
        <input
          type="date"
          value={selectedDate}
          min={today}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          required
        />
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Slot will be applied for <span className="font-semibold">{formatDate(selectedDate)}</span> ({DAY_ABBR[day]}).
        </div>
      </div>

      {/* Time range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Start time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">End time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            required
          />
        </div>
      </div>

      {/* Slot duration */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Appointment slot duration</label>
        <div className="flex gap-2">
          {[15, 20, 30, 45, 60].map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => setSlotDuration(min)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                slotDuration === min
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
              )}
            >
              {min}m
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          Create schedule
        </Button>
      </div>
    </form>
  );
}

// ─── Edit schedule modal ──────────────────────────────────────────────────────

interface EditScheduleFormProps {
  schedule: ScheduleDto;
  onClose: () => void;
}

function EditScheduleForm({ schedule, onClose }: EditScheduleFormProps) {
  const [day, setDay] = useState<DayOfWeek>(schedule.dayOfWeek);
  const [startTime, setStartTime] = useState(schedule.startTime);
  const [endTime, setEndTime] = useState(schedule.endTime);
  const [update, { isLoading }] = useUpdateDoctorScheduleMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await update({ scheduleId: schedule.id, data: { dayOfWeek: day, startTime, endTime } }).unwrap();
      toast.success("Schedule updated!", {
        description: `${DAY_ABBR[day]}: ${startTime} – ${endTime}`,
      });
      onClose();
    } catch {
      /* errors handled by runRequest in apiSlice */
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Day of week</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                day === d
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
              )}
            >
              {DAY_ABBR[d]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Start time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">End time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

// ─── Add Unavailability form ──────────────────────────────────────────────────

interface AddUnavailabilityFormProps {
  doctorId: string;
  onClose: () => void;
}

function AddUnavailabilityForm({ doctorId, onClose }: AddUnavailabilityFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [reason, setReason] = useState("");
  const [add, { isLoading }] = useAddDoctorUnavailabilityMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await add({ doctorId, date, startTime, endTime, reason: reason || undefined }).unwrap();
      toast.success("Exception added!", {
        description: `Blocked ${formatDate(date)}: ${startTime} – ${endTime}`,
      });
      onClose();
    } catch {
      /* errors handled by runRequest in apiSlice */
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date picker */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Date</label>
        <input
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
          required
        />
        <p className="text-xs text-muted">Select the specific date you want to block off</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">From</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">To</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            required
          />
        </div>
      </div>

      <Input
        label="Reason (optional)"
        placeholder="e.g. Emergency case, personal appointment…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={200}
      />

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
        >
          Block time
        </Button>
      </div>
    </form>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  subtitle?: string;
  accentColor?: "emerald" | "rose";
  onClose: () => void;
  children: React.ReactNode;
}

function SlideModal({ title, subtitle, accentColor = "emerald", onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* panel */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl",
          "animate-in slide-in-from-bottom-4 duration-300"
        )}
      >
        {/* header */}
        <div
          className={cn(
            "flex items-start justify-between rounded-t-2xl px-6 py-5",
            accentColor === "emerald"
              ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100"
              : "bg-gradient-to-r from-rose-50 to-red-50 border-b border-rose-100"
          )}
        >
          <div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Schedule row ─────────────────────────────────────────────────────────────

interface ScheduleRowProps {
  schedule: ScheduleDto;
  onEdit: (s: ScheduleDto) => void;
}

function ScheduleRow({ schedule, onEdit }: ScheduleRowProps) {
  const [deleteSchedule, { isLoading: deleting }] = useDeleteDoctorScheduleMutation();

  async function handleDelete() {
    if (!confirm("Delete this schedule slot? This action cannot be undone.")) return;
    try {
      await deleteSchedule(schedule.id).unwrap();
      toast.success("Schedule deleted");
    } catch {
      /* handled */
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md">
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
          DAY_COLOR[schedule.dayOfWeek]
        )}
      >
        {DAY_ABBR[schedule.dayOfWeek]}
      </span>
      <div className="flex flex-1 items-center gap-2 text-sm text-foreground">
        <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="font-semibold">{schedule.startTime}</span>
        <span className="text-muted">–</span>
        <span className="font-semibold">{schedule.endTime}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onEdit(schedule)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
          title="Edit"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Unavailability Row ───────────────────────────────────────────────────────

interface UnavailabilityRowProps {
  record: UnavailabilityDto;
}

function UnavailabilityRow({ record }: UnavailabilityRowProps) {
  const [deleteUnavailability, { isLoading: deleting }] = useDeleteDoctorUnavailabilityMutation();

  async function handleDelete() {
    if (!confirm("Remove this exception? The time slot will become available again.")) return;
    try {
      await deleteUnavailability(record.id).unwrap();
      toast.success("Exception removed — time is available again");
    } catch {
      /* handled */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-3 shadow-sm">
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className="text-sm font-semibold text-rose-800">{formatDate(record.date)}</span>
        <span className="flex items-center gap-1.5 text-xs text-rose-600">
          <Clock className="h-3 w-3" />
          {record.startTime} – {record.endTime}
          {record.reason && (
            <>
              <span className="text-rose-400">·</span>
              <span className="truncate max-w-[200px]">{record.reason}</span>
            </>
          )}
        </span>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-100 hover:text-rose-700 transition-colors disabled:opacity-50"
        title="Remove exception"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DoctorSchedulesPage() {
  const doctorId = useAppSelector((s) => s.auth.user?.id) ?? "";

  const { data: schedulesData, isLoading: schedulesLoading } = useGetDoctorSchedulesQuery(doctorId, {
    skip: !doctorId,
  });
  const { data: unavailData, isLoading: unavailLoading } = useGetDoctorUnavailabilitiesQuery(doctorId, {
    skip: !doctorId,
  });

  const schedules = schedulesData?.schedules ?? [];
  const unavailabilities = unavailData?.unavailabilities ?? [];
  const grouped = groupByDay(schedules);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ScheduleDto | null>(null);
  const [addUnavailOpen, setAddUnavailOpen] = useState(false);

  // Collapsible days
  const [collapsedDays, setCollapsedDays] = useState<Set<DayOfWeek>>(new Set());
  const toggleDay = (d: DayOfWeek) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const activeDays = DAYS.filter((d) => grouped[d].length > 0);
  const totalSlots = schedules.length;
  const upcomingExceptions = unavailabilities.filter(
    (u: UnavailabilityDto) => new Date(u.date) >= new Date(new Date().toDateString())
  );

  return (
    <>
      {/* ── Modals ── */}
      {createOpen && (
        <SlideModal
          title="New schedule slot"
          subtitle="Choose date and hours; weekday is set automatically"
          onClose={() => setCreateOpen(false)}
        >
          <CreateScheduleForm doctorId={doctorId} onClose={() => setCreateOpen(false)} />
        </SlideModal>
      )}
      {editTarget && (
        <SlideModal
          title="Edit schedule"
          subtitle="Update the time range for this slot"
          onClose={() => setEditTarget(null)}
        >
          <EditScheduleForm schedule={editTarget} onClose={() => setEditTarget(null)} />
        </SlideModal>
      )}
      {addUnavailOpen && (
        <SlideModal
          title="Block a time slot"
          subtitle="Mark yourself unavailable for a specific date & time"
          accentColor="rose"
          onClose={() => setAddUnavailOpen(false)}
        >
          <AddUnavailabilityForm doctorId={doctorId} onClose={() => setAddUnavailOpen(false)} />
        </SlideModal>
      )}

      {/* ── Page content ── */}
      <div className="space-y-8">
        {/* Hero header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Schedules</h1>
            <p className="mt-1 text-sm text-muted">
              Manage your weekly availability and block time for exceptions
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => setAddUnavailOpen(true)}
              variant="outline"
              className="flex items-center gap-2 border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <CalendarOff className="h-4 w-4" />
              Add exception
            </Button>
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New schedule
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatBadge
            icon={<CalendarClock className="h-5 w-5 text-emerald-600" />}
            label="Weekly slots"
            value={totalSlots}
            bg="bg-emerald-50"
          />
          <StatBadge
            icon={<CalendarOff className="h-5 w-5 text-rose-500" />}
            label="Upcoming exceptions"
            value={upcomingExceptions.length}
            bg="bg-rose-50"
          />
          <StatBadge
            icon={<Clock className="h-5 w-5 text-blue-500" />}
            label="Active days"
            value={activeDays.length}
            bg="bg-blue-50"
          />
        </div>

        {/* Weekly schedule */}
        <Card>
          <CardHeader
            title="Weekly availability"
            description="Your recurring schedule — appointments will be bookable during these hours"
            action={
              <Button
                size="sm"
                type="button"
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add slot
              </Button>
            }
          />

          {schedulesLoading ? (
            <ScheduleSkeleton />
          ) : schedules.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="h-10 w-10 text-slate-300" />}
              title="No schedule yet"
              description="Click 'New schedule' to set your weekly availability"
            />
          ) : (
            <div className="space-y-3">
              {DAYS.map((day) => {
                const slots = grouped[day];
                if (slots.length === 0) return null;
                const collapsed = collapsedDays.has(day);
                return (
                  <div key={day} className="rounded-xl border border-border overflow-hidden">
                    {/* Day header */}
                    <button
                      type="button"
                      onClick={() => toggleDay(day)}
                      className="flex w-full items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
                            DAY_COLOR[day]
                          )}
                        >
                          {day.charAt(0) + day.slice(1).toLowerCase()}
                        </span>
                        <span className="text-xs text-muted">
                          {slots.length} slot{slots.length !== 1 && "s"}
                        </span>
                      </div>
                      {collapsed ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                    {/* Slots */}
                    {!collapsed && (
                      <div className="divide-y divide-border bg-white">
                        {slots.map((s) => (
                          <div key={s.id} className="px-4 py-2">
                            <ScheduleRow schedule={s} onEdit={setEditTarget} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Exceptions / Unavailabilities */}
        <Card>
          <CardHeader
            title="Exceptions & blocks"
            description="Specific dates when you're unavailable — overrides regular schedule"
            action={
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => setAddUnavailOpen(true)}
                className="flex items-center gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Block time
              </Button>
            }
          />

          {unavailLoading ? (
            <ScheduleSkeleton />
          ) : unavailabilities.length === 0 ? (
            <EmptyState
              icon={<CalendarOff className="h-10 w-10 text-slate-300" />}
              title="No exceptions yet"
              description="Got an emergency or important case? Block specific time slots here"
            />
          ) : (
            <div className="space-y-3">
              {unavailabilities.map((u: UnavailabilityDto) => (
                <UnavailabilityRow key={u.id} record={u} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

// ─── tiny helpers ─────────────────────────────────────────────────────────────

function StatBadge({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl px-4 py-4", bg)}>
      {icon}
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      {icon}
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-xs text-muted max-w-xs">{description}</p>
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}
