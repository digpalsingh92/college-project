"use client";

import { useState } from "react";
import DataTable from "@/components/shared/Table/DataTable";
import { useGetDoctorAppointmentsQuery } from "@/store/apiSlice";
import type { AppointmentDto } from "@/types/api";

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
    label: "Time",
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Each unique { page, limit } combo is a separate cached RTK-Query request
  const { data, isLoading, isFetching } = useGetDoctorAppointmentsQuery({ page, limit });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted">Loading appointments…</p>
      </div>
    );
  }

  return (
    <DataTable<AppointmentDto>
      title={`My Appointments${isFetching ? " …" : ""}`}
      data={data?.appointments ?? []}
      columns={columns}
      page={data?.page ?? page}
      totalPages={data?.totalPages ?? 1}
      limit={limit}
      onPageChange={(p) => setPage(p)}
      onLimitChange={(l) => {
        setLimit(l);
        setPage(1);
      }}
      onSearch={() => {
        // Search resets to page 1; full-text search is client-side on the current page.
        // For server-side search, add a search param to the API in a future iteration.
        setPage(1);
      }}
    />
  );
}
