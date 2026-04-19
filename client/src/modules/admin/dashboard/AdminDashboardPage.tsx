"use client";

import dynamic from "next/dynamic";
import { Building2, CalendarDays, ClipboardSignature, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { StatCard } from "@/components/shared/StatCard";
import { TableColumn } from "@/types";
import {
  useGetAdminAppointmentInsightsQuery,
  useGetDoctorsQuery,
  usePredictResourceAllocationMutation,
  usePredictWaitingTimeMutation,
  useReloadPredictionModelMutation,
  useTrainPredictionModelMutation,
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
  const [datasetPath, setDatasetPath] = useState("");
  const { data: doctorsData } = useGetDoctorsQuery();
  const { data: appointmentInsights } = useGetAdminAppointmentInsightsQuery();
  const doctorCount = doctorsData?.doctors?.length ?? 0;

  const [train, { isLoading: training }] = useTrainPredictionModelMutation();
  const [reload, { isLoading: reloading }] = useReloadPredictionModelMutation();
  const [waiting, { isLoading: waitingLoading }] = usePredictWaitingTimeMutation();
  const [resource, { isLoading: resourceLoading }] = usePredictResourceAllocationMutation();

  const columns: Array<TableColumn<PendingRow>> = [
    { key: "name", header: "Name" },
    {
      key: "type",
      header: "Type",
      render: (row) => <TypeBadge type={row.type} />,
    },
    { key: "location", header: "Location" },
    { key: "submitted", header: "Date submitted" },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <div className="flex flex-wrap gap-2">
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
          title="Total appointments"
          value={appointmentInsights?.totalAppointments ?? "--"}
          trend="Live total from appointments"
          icon={CalendarDays}
          iconClassName="bg-violet-100 text-violet-600"
        />
        <StatCard
          title="Doctors on platform"
          value={doctorCount}
          trend="Live from API"
          trendPositive
          icon={Building2}
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Expected patients"
          value={appointmentInsights?.expectedPatients ?? "--"}
          trend="Upcoming shows after no-show prediction"
          icon={Users}
          iconClassName="bg-teal-100 text-teal-600"
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

      <Card padding="md">
        <CardHeader
          title="Model & predictions"
          description="Train ML models and run sample inference (requires admin JWT)."
        />
        <div className="flex flex-wrap items-end gap-3">
          <Input
            className="max-w-xs"
            placeholder="Optional dataset path"
            value={datasetPath}
            onChange={(e) => setDatasetPath(e.target.value)}
          />
          <Button
            variant="admin"
            loading={training}
            disabled={training}
            type="button"
            onClick={() => train(datasetPath.trim() ? { datasetPath: datasetPath.trim() } : {})}
          >
            Train model
          </Button>
          <Button variant="secondary" loading={reloading} disabled={reloading} type="button" onClick={() => reload()}>
            Reload model
          </Button>
          <Button
            size="sm"
            variant="outline"
            loading={waitingLoading}
            type="button"
            onClick={() =>
              waiting({
                department: "Cardiology",
                appointmentType: "follow-up",
                scheduledHour: 10,
                reminderSent: "Yes",
                previousNoShows: 0,
              })
            }
          >
            Waiting time sample
          </Button>
          <Button
            size="sm"
            variant="outline"
            loading={resourceLoading}
            type="button"
            onClick={() =>
              resource({
                department: "ER",
                scheduledHour: 14,
                expectedAppointments: 12,
              })
            }
          >
            Resource sample
          </Button>
        </div>
      </Card>

      <Card padding="md">
        <CardHeader
          title="Pending approvals"
          description="Recent registration requests — sample data for UI alignment"
        />
        <Table columns={columns} data={pendingRows} keyExtractor={(row) => row.id} />
      </Card>
    </div>
  );
}
