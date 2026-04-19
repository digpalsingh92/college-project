"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import DataTable from "@/components/shared/Table/DataTable";
import { Button } from "@/components/ui/Button";
import type { PatientAnalyticsRow } from "@/types/api";
import { useGetAdminPatientsQuery } from "@/store/apiSlice";

function formatDate(value: string | null): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function AdminPatientsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch } = useGetAdminPatientsQuery({
    page,
    limit,
    search,
  });

  const columns: any[] = [
    { key: "name", label: "Patient Name" },
    { key: "totalBookings", label: "Total Bookings" },
    {
      key: "lastAppointment",
      label: "Last Visit",
      render: (row: any) => formatDate(row.lastAppointment),
    },
    {
      key: "status",
      label: "Status",
      render: (row: any) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            row.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ];

  const actions = [
    { label: "View", onClick: (row: any) => alert(`View ${row.name}`) },
    { label: "Suspend", onClick: (row: any) => alert(`Suspend ${row.name}`) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Patients</h1>
        <p className="text-sm text-slate-500 mt-1">View and manage registered patients.</p>
      </div>

      <DataTable
        title="Patients List"
        data={data?.patients || []}
        columns={columns}
        actions={actions}
        page={page}
        totalPages={data?.totalPages || 1}
        loading={isLoading || isFetching}
        onPageChange={setPage}
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
    </div>
  );
}
