"use client";

import { useMemo, useState } from "react";
import DataTable from "@/components/shared/Table/DataTable";
import { useGetDoctorAppointmentsQuery } from "@/store/apiSlice";
import type { AppointmentDto } from "@/types/api";

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<string, string> = {
  booked: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-amber-100 text-amber-700",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

const columns: {
  key: keyof AppointmentDto;
  label: string;
  render?: (row: AppointmentDto) => React.ReactNode;
}[] = [
  {
    key: "patient",
    label: "Patient Name",
    render: (row) =>
      (row as AppointmentDto & { patient?: { name?: string } }).patient?.name ??
      row.patientId,
  },
  {
    key: "date",
    label: "Appointment Date",
    render: (row) => new Date(row.date).toLocaleDateString(),
  },
  {
    key: "startTime",
    label: "Appointment Time",
    render: (row) => `${row.startTime} – ${row.endTime}`,
  },
  {
    key: "status",
    label: "Status",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: "remarks",
    label: "Remarks",
    render: (row) => (
      <span className="text-slate-500">{row.remarks ?? "—"}</span>
    ),
  },
];

export function DoctorAppointmentsListPage() {
  const { data, isLoading } = useGetDoctorAppointmentsQuery();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const all = data?.appointments ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((appt) => {
      const patientName = (
        appt as AppointmentDto & { patient?: { name?: string } }
      ).patient?.name?.toLowerCase();
      return (
        patientName?.includes(q) ??
        appt.date.includes(q) ??
        appt.status.includes(q)
      );
    });
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted">Loading appointments…</p>
      </div>
    );
  }

  return (
    <DataTable<AppointmentDto>
      title="Appointments"
      data={paged}
      columns={columns}
      page={safePage}
      totalPages={totalPages}
      onPageChange={(p) => setPage(p)}
      onSearch={(v) => {
        setSearch(v);
        setPage(1);
      }}
    />
  );
}
