"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  useGetDoctorAppointmentsQuery,
  useUpdateAppointmentByDoctorMutation,
} from "@/store/apiSlice";
import type { AppointmentDto } from "@/types/api";

type VisitStatus = "pending" | "ongoing" | "completed" | "no_show" | "cancelled";

type VisitDraft = {
  id: string;
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: VisitStatus;
  persistedStatus: VisitStatus;
  remarks: string;
  savedAt: string | null;
  patient: {
    name: string;
  };
};

const FINAL_STATUSES: VisitStatus[] = ["completed", "cancelled"];

const TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  pending: ["pending", "ongoing", "completed", "no_show", "cancelled"],
  ongoing: ["ongoing", "completed", "no_show", "cancelled"],
  completed: ["completed"],
  no_show: ["no_show", "pending", "ongoing"],
  cancelled: ["cancelled"],
};

function parseTimeLabelToMinutes(label: string): number {
  const match = label.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return 0;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3];
  const normalizedHours = hours % 12 + (period === "PM" ? 12 : 0);
  return normalizedHours * 60 + minutes;
}

function minutesToTimeLabel(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

function formatStatus(status: VisitStatus): string {
  return status.replace("_", " ");
}

function toApiStatus(status: VisitStatus): "booked" | "completed" | "no_show" | "cancelled" {
  if (status === "pending" || status === "ongoing") {
    return "booked";
  }

  return status;
}

const mapAppointmentToDraft = (appointment: AppointmentDto): VisitDraft => {
  const mappedStatus: VisitStatus =
    appointment.status === "booked" ? "pending" : (appointment.status as VisitStatus);

  const patientName =
    (appointment as AppointmentDto & { patient?: { name?: string } }).patient?.name ?? appointment.patientId;

  return {
    id: appointment.id,
    patientId: appointment.patientId,
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: mappedStatus,
    persistedStatus: mappedStatus,
    remarks: appointment.remarks ?? "",
    savedAt: null,
    patient: {
      name: patientName,
    },
  };
};

export function DoctorAppointmentUpdatesPage() {
  const { data, isLoading } = useGetDoctorAppointmentsQuery();
  const [updateAppointmentByDoctor, { isLoading: isSavingUpdate }] = useUpdateAppointmentByDoctorMutation();
  const [rows, setRows] = useState<VisitDraft[]>([]);
  const [activeSaveId, setActiveSaveId] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.appointments) return;
    setRows(data.appointments.map(mapAppointmentToDraft));
  }, [data]);

  const summary = useMemo(() => {
    return {
      pending: rows.filter((item) => item.status === "pending").length,
      completed: rows.filter((item) => item.status === "completed").length,
      noShow: rows.filter((item) => item.status === "no_show").length,
    };
  }, [rows]);

  function formatStatus(status: VisitStatus): string {
  const formatted = status.replace("_", " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

  const updateRow = (id: string, patch: Partial<VisitDraft>) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (FINAL_STATUSES.includes(row.persistedStatus)) return row;
        return { ...row, ...patch, savedAt: null };
      })
    );
  };

  const saveRow = async (id: string) => {
    const target = rows.find((row) => row.id === id);
    if (!target) return;

    setActiveSaveId(id);
    try {
      await updateAppointmentByDoctor({
        id,
        data: {
          status: toApiStatus(target.status),
          remarks: target.remarks,
        },
      }).unwrap();

      setRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                persistedStatus: target.status,
                savedAt: new Date().toISOString(),
              }
            : row
        )
      );
    } catch {
      // Shared API layer handles toast messaging.
    } finally {
      setActiveSaveId(null);
    }
  };

  const rescheduleNoShow = (id: string) => {
    setRows((prev) => {
      const target = prev.find((row) => row.id === id);
      if (!target || target.status !== "no_show") return prev;

      const startMinutes = parseTimeLabelToMinutes(target.startTime);
      const endMinutes = parseTimeLabelToMinutes(target.endTime);
      const duration = Math.max(endMinutes - startMinutes, 30);

      const targetDay = new Date(target.date);
      const sameDayRows = prev
        .filter((row) => row.id !== id && new Date(row.date).toDateString() === targetDay.toDateString())
        .sort((a, b) => parseTimeLabelToMinutes(a.startTime) - parseTimeLabelToMinutes(b.startTime));

      let nextStart = endMinutes;
      while (
        sameDayRows.some((row) => {
          const rowStart = parseTimeLabelToMinutes(row.startTime);
          const rowEnd = parseTimeLabelToMinutes(row.endTime);
          return rowStart < nextStart + duration && rowEnd > nextStart;
        })
      ) {
        nextStart += 30;
      }

      return prev.map((row) => {
        if (row.id !== id) return row;

        return {
          ...row,
          status: "pending",
          persistedStatus: "no_show",
          startTime: minutesToTimeLabel(nextStart),
          endTime: minutesToTimeLabel(nextStart + duration),
          remarks: row.remarks
            ? `${row.remarks} | Rescheduled to next available time.`
            : "Rescheduled to next available time.",
          savedAt: null,
        };
      });
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Visit Updates"
          description="Mark booked visits as pending, completed, no-show, or cancelled and keep quick remarks for each visit."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile label="Pending" value={summary.pending} />
          <StatTile label="Completed" value={summary.completed} />
          <StatTile label="No-Show" value={summary.noShow} />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Appointment Status Board"
          description="Use this board to track visit outcomes and internal notes during the day."
        />

        {isLoading ? (
          <p className="text-sm text-muted">Loading appointments...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted">No doctor appointments available right now.</p>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg border border-slate-200 p-4">
                <div className="grid gap-3 md:grid-cols-5">
                  <div>
                    <p className="text-xs text-muted">Date</p>
                    <p className="text-sm font-medium text-foreground">{new Date(row.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Time</p>
                    <p className="text-sm font-medium text-foreground">
                      {row.startTime} - {row.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Patient Name</p>
                    <p className="truncate text-sm font-medium text-foreground">{row.patient.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted" htmlFor={`status-${row.id}`}>
                      Status
                    </label>
                    <select
                      id={`status-${row.id}`}
                      value={row.status}
                      onChange={(event) => updateRow(row.id, { status: event.target.value as VisitStatus })}
                      disabled={FINAL_STATUSES.includes(row.persistedStatus)}
                      className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      {TRANSITIONS[row.status].map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {formatStatus(statusOption)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    {FINAL_STATUSES.includes(row.persistedStatus) ? (
                      <span className="text-sm text-muted">No changes allowed</span>
                    ) : row.status === "no_show" ? (
                      <div className="flex w-full flex-col gap-2">
                        <Button
                          type="button"
                          className="w-full"
                          variant="secondary"
                          onClick={() => rescheduleNoShow(row.id)}
                        >
                          Reschedule
                        </Button>
                        <Button
                          type="button"
                          className="w-full"
                          loading={isSavingUpdate && activeSaveId === row.id}
                          onClick={() => void saveRow(row.id)}
                        >
                          Save update
                        </Button>
                      </div>
                    ) : row.status === "pending" || row.status === "ongoing" || row.status === "completed" || row.status === "cancelled" ? (
                      <Button
                        type="button"
                        className="w-full"
                        loading={isSavingUpdate && activeSaveId === row.id}
                        onClick={() => void saveRow(row.id)}
                      >
                        Save update
                      </Button>
                    ) : (
                      <span className="text-sm text-muted">No changes allowed</span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs text-muted" htmlFor={`remarks-${row.id}`}>
                    Remarks
                  </label>
                  <input
                    id={`remarks-${row.id}`}
                    value={row.remarks}
                    onChange={(event) => updateRow(row.id, { remarks: event.target.value })}
                    disabled={FINAL_STATUSES.includes(row.persistedStatus)}
                    placeholder="Add quick notes, follow-up advice, or reasons for no-show"
                    className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {row.savedAt ? (
                  <p className="mt-2 text-xs text-emerald-700">
                    Update saved at {new Date(row.savedAt).toLocaleTimeString()}.
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted">Unsaved changes</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
