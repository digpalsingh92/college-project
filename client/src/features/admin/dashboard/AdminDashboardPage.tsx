"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Building2, CalendarDays, ClipboardSignature, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import DataTable from "@/components/shared/Table/DataTable";
import { StatCard } from "@/components/shared/StatCard";
import {
  useGetAdminAppointmentInsightsQuery,
  useGetDoctorsQuery,
} from "@/store/apiSlice";
import { cn } from "@/helpers/cn";

const AdminChartsPanel = dynamic(
  () => import("./AdminChartsPanel").then((m) => ({ default: m.AdminChartsPanel })),
  {
    ssr: false,
    loading: () => <div className="grid gap-6 lg:grid-cols-3"><div className="h-72 animate-pulse rounded-xl bg-slate-100 lg:col-span-2" /><div className="h-72 animate-pulse rounded-xl bg-slate-100" /></div>,
  }
);

interface PendingRow {
  id: string;
  name: string;
  type: "clinic" | "doctor";
  location: string;
  submitted: string;
  actions?: any;
}

const pendingRows: PendingRow[] = [
  {
    id: "1",
    name: "Riverside Clinic",
    type: "clinic",
    location: "Portland, OR",
    submitted: "Apr 2, 2026",
  },
  {
    id: "2",
    name: "Dr. Sarah Chen",
    type: "doctor",
    location: "Boston, MA",
    submitted: "Apr 1, 2026",
  },
  {
    id: "3",
    name: "Northside Health",
    type: "clinic",
    location: "Austin, TX",
    submitted: "Mar 30, 2026",
  },
];

function TypeBadge({ type }: { type: PendingRow["type"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        type === "clinic" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"
      )}
    >
      {type}
    </span>
  );
}

export function AdminDashboardPage() {
  const { data: doctorsData } = useGetDoctorsQuery();
  const { data: appointmentInsights } = useGetAdminAppointmentInsightsQuery();
  const doctorCount = doctorsData?.doctors?.length ?? 0;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const filteredPending = pendingRows.filter(
    (row) => row.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Array<{ key: keyof PendingRow; label: string; render?: (row: PendingRow) => React.ReactNode }> = [
    { key: "name", label: "Name" },
    {
      key: "type",
      label: "Type",
      render: (row) => <TypeBadge type={row.type} />,
    },
    { key: "location", label: "Location" },
    { key: "submitted", label: "Date submitted" },
    {
      key: "actions",
      label: "Actions",
      render: () => (
        <div className="flex flex-wrap gap-2 justify-center">
          <Button size="sm" variant="dangerSoft" type="button">
            Reject
          </Button>
          <Button size="sm" variant="successSoft" type="button">
            Approve
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total doctors"
          value={doctorCount}
          trend="Live from API"
          trendPositive
          icon={Building2}
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Estimated patients"
          value={appointmentInsights?.expectedPatients ?? "--"}
          trend="Based on active appointments"
          icon={Users}
          iconClassName="bg-teal-100 text-teal-600"
        />
        <StatCard
          title="Total appointments"
          value={appointmentInsights?.totalAppointments ?? "--"}
          trend="System-wide booked total"
          icon={CalendarDays}
          iconClassName="bg-violet-100 text-violet-600"
        />
        <StatCard
          title="Predicted no-shows"
          value={appointmentInsights?.predictedNoShows ?? "--"}
          trend="Forecast for upcoming bookings"
          trendPositive={false}
          icon={ClipboardSignature}
          iconClassName="bg-amber-100 text-amber-600"
        />
      </div>

      <AdminChartsPanel />

      <DataTable
        title="Pending approvals"
        data={filteredPending}
        columns={columns}
        page={page}
        totalPages={1}
        onPageChange={setPage}
        onSearch={setSearch}
      />
    </div>
  );
}
