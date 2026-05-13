"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CalendarDays, ClipboardSignature, Users, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import DataTable from "@/components/shared/Table/DataTable";
import { StatCard } from "@/components/shared/StatCard";
import {
  useGetAdminAppointmentInsightsQuery,
  useGetDoctorsQuery,
} from "@/store/apiSlice";
import { cn } from "@/helpers/cn";
import { toast } from "sonner";

const AdminChartsPanel = dynamic(
  () => import("./AdminChartsPanel").then((m) => ({ default: m.AdminChartsPanel })),
  {
    ssr: false,
    loading: () => <div className="grid gap-6 lg:grid-cols-3"><div className="h-72 animate-pulse rounded-xl bg-slate-100 lg:col-span-2" /><div className="h-72 animate-pulse rounded-xl bg-slate-100" /></div>,
  }
);

interface DoctorRow {
  id: string;
  name: string;
  email: string;
  specialization: string;
  createdAt: string;
  actions?: any;
}

function SpecializationBadge({ specialization }: { specialization?: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    cardiology: { bg: "bg-red-50", text: "text-red-700" },
    orthopedics: { bg: "bg-orange-50", text: "text-orange-700" },
    dermatology: { bg: "bg-pink-50", text: "text-pink-700" },
    neurology: { bg: "bg-purple-50", text: "text-purple-700" },
    general: { bg: "bg-blue-50", text: "text-blue-700" },
  };

  const spec = specialization?.toLowerCase() || "general";
  const color = colors[spec] || colors.general;

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        color.bg,
        color.text
      )}
    >
      {specialization || "General"}
    </span>
  );
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function AdminDashboardPage() {
  const { data: doctorsData, isLoading: doctorsLoading } = useGetDoctorsQuery();
  const { data: appointmentInsights } = useGetAdminAppointmentInsightsQuery();
  const doctorCount = doctorsData?.doctors?.length ?? 0;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Transform doctor data to table rows
  const doctors: DoctorRow[] = (doctorsData?.doctors ?? []).map((doc) => ({
    id: doc.id,
    name: doc.name,
    email: doc.email,
    specialization: doc.doctorProfile?.specialization || "General Medicine",
    createdAt: doc.createdAt,
  }));

  const filteredDoctors = doctors.filter(
    (row) =>
      row.name.toLowerCase().includes(search.toLowerCase()) ||
      row.email.toLowerCase().includes(search.toLowerCase()) ||
      row.specialization.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Array<{ key: keyof DoctorRow; label: string; render?: (row: DoctorRow) => React.ReactNode }> = [
    { key: "name", label: "Name" },
    {
      key: "specialization",
      label: "Specialization",
      render: (row) => <SpecializationBadge specialization={row.specialization} />,
    },
    { key: "email", label: "Email" },
    {
      key: "createdAt",
      label: "Registered",
      render: (row) => <span className="text-sm text-slate-600">{formatDate(row.createdAt)}</span>,
    },
    // {
    //   key: "actions",
    //   label: "Actions",
    //   render: (row) => (
    //     <div className="flex flex-wrap gap-2 justify-center">
    //       <Button
    //         size="sm"
    //         variant="successSoft"
    //         type="button"
    //         onClick={() => toast.success(`Approved ${row.name}`)}
    //         className="flex items-center gap-1"
    //       >
    //         <CheckCircle2 className="w-4 h-4" />
    //         Approve
    //       </Button>
    //       <Button
    //         size="sm"
    //         variant="dangerSoft"
    //         type="button"
    //         onClick={() => toast.error(`Rejected ${row.name}`)}
    //         className="flex items-center gap-1"
    //       >
    //         <XCircle className="w-4 h-4" />
    //         Reject
    //       </Button>
    //     </div>
    //   ),
    // },
  ];

  const totalPages = Math.ceil(filteredDoctors.length / 10);
  const paginatedDoctors = filteredDoctors.slice((page - 1) * 10, page * 10);

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total doctors"
          value={doctorCount}
          trend="Active in system"
          trendPositive
          icon={Users}
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

      {/* Doctors List */}
      <DataTable
        title={`All Doctors (${doctorCount})`}
        data={paginatedDoctors}
        columns={columns}
        page={page}
        totalPages={Math.max(1, totalPages)}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={doctorsLoading}
      />
    </div>
  );
}
