"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import DataTable from "@/components/shared/Table/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useCancelAppointmentMutation, useGetAdminAppointmentsQuery } from "@/store/apiSlice";
import type { AppointmentDto } from "@/types/api";
import { cn } from "@/helpers/cn";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

type AppointmentStatusFilter = "" | "booked" | "completed" | "cancelled";

export function AdminAppointmentsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatusFilter>("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useGetAdminAppointmentsQuery(
    {
      page,
      limit,
      search,
      status: statusFilter || undefined,
      date: dateFilter || undefined,
    },
    { refetchOnMountOrArgChange: true }
  );
  const [cancelAppointment, { isLoading: isCancelling }] = useCancelAppointmentMutation();

  const rows = useMemo(() => data?.appointments ?? [], [data]);

  const columns: Array<{ key: keyof AppointmentDto; label: string; render?: (row: AppointmentDto) => React.ReactNode }> = [
    {
      key: "doctor",
      label: "Doctor",
      render: (row) => row.doctor?.name ?? "--",
    },
    {
      key: "patient",
      label: "Patient",
      render: (row) => row.patient?.name ?? "--",
    },
    {
      key: "date",
      label: "Date",
      render: (row) => formatDate(row.date),
    },
    {
      key: "startTime",
      label: "Time",
      render: (row) => row.startTime,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
            row.status === "booked" && "bg-amber-50 text-amber-700",
            row.status === "completed" && "bg-emerald-50 text-emerald-700",
            row.status === "cancelled" && "bg-slate-100 text-slate-600",
            row.status === "no_show" && "bg-rose-50 text-rose-700"
          )}
        >
          {row.status}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "View",
      onClick: (row: AppointmentDto) => setSelectedAppointment(row),
    },
    {
      label: isCancelling ? "Cancelling..." : "Cancel",
      disabled: (row: AppointmentDto) => row.status !== "booked" || isCancelling,
      className: "text-red-600",
      onClick: async (row: AppointmentDto) => {
        try {
          await cancelAppointment(row.id).unwrap();
          toast.success("Appointment cancelled.");
          refetch();
        } catch {
          toast.error("Failed to cancel appointment.");
        }
      },
    },
  ];

  const filterSlot = (
    <>
      <select
        value={statusFilter}
        onChange={(event) => {
          setStatusFilter(event.target.value as AppointmentStatusFilter);
          setPage(1);
        }}
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
      >
        <option value="">All Status</option>
        <option value="booked">Booked</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <input
        type="date"
        value={dateFilter}
        onChange={(event) => {
          setDateFilter(event.target.value);
          setPage(1);
        }}
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
      />

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          setStatusFilter("");
          setDateFilter("");
          setPage(1);
        }}
      >
        Reset
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Appointments Table</h1>
        <p className="mt-1 text-sm text-slate-500">Monitor system-wide appointments by doctor, patient, status, and date.</p>
      </div>

      <DataTable
        title="Appointments"
        data={rows}
        columns={columns}
        actions={actions}
        page={page}
        totalPages={data?.totalPages ?? 1}
        limit={limit}
        loading={isLoading || isFetching}
        errorMessage={isError ? "Unable to load appointments." : null}
        emptyState="No appointments match your current filters."
        searchPlaceholder="Search by doctor or patient"
        searchValue={search}
        filterSlot={filterSlot}
        keyExtractor={(row) => row.id}
        onPageChange={(nextPage) => setPage(nextPage)}
        onLimitChange={(nextLimit) => {
          setLimit(nextLimit);
          setPage(1);
        }}
        onRetry={() => refetch()}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      <Modal
        open={Boolean(selectedAppointment)}
        onClose={() => setSelectedAppointment(null)}
        title="Appointment Details"
      >
        {selectedAppointment ? (
          <div className="space-y-3">
            <p><span className="font-medium">Doctor:</span> {selectedAppointment.doctor?.name ?? "--"}</p>
            <p><span className="font-medium">Patient:</span> {selectedAppointment.patient?.name ?? "--"}</p>
            <p><span className="font-medium">Date:</span> {formatDate(selectedAppointment.date)}</p>
            <p><span className="font-medium">Time:</span> {selectedAppointment.startTime}</p>
            <p><span className="font-medium">Status:</span> {selectedAppointment.status}</p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
