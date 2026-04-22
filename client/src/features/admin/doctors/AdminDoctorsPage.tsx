"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import DataTable from "@/components/shared/Table/DataTable";
import { Modal } from "@/components/ui/Modal";
import type { DoctorAnalyticsRow } from "@/types/api";
import { useGetAdminDoctorAnalyticsQuery } from "@/store/apiSlice";

export function AdminDoctorsPage() {
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorAnalyticsRow | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, isError, refetch } = useGetAdminDoctorAnalyticsQuery(
    {
      page,
      limit,
      search,
    },
    { refetchOnMountOrArgChange: true }
  );

  const rows = useMemo(() => data?.doctors ?? [], [data]);

  const columns: Array<{ key: keyof DoctorAnalyticsRow; label: string; render?: (row: DoctorAnalyticsRow) => React.ReactNode }> = [
    { key: "name", label: "Doctor Name" },
    { key: "specialization", label: "Specialization" },
    { key: "totalAppointments", label: "Total Appointments" },
    {
      key: "upcomingAppointments",
      label: "Upcoming Appointments",
      render: (row) => (
        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          {row.upcomingAppointments}
        </span>
      ),
    },
  ];

  const actions = [
    { label: "View", onClick: (row: DoctorAnalyticsRow) => setSelectedDoctor(row) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Doctor Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Track appointment throughput by doctor and specialization.</p>
        </div>
        <Button className="shrink-0" variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <DataTable
        title="Doctors Overview"
        data={rows}
        columns={columns}
        actions={actions}
        page={page}
        totalPages={data?.totalPages ?? 1}
        limit={limit}
        loading={isLoading || isFetching}
        errorMessage={isError ? "Unable to load doctor analytics." : null}
        emptyState="No doctors match your search."
        searchPlaceholder="Search by doctor or specialization"
        searchValue={search}
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

      <Modal open={!!selectedDoctor} onClose={() => setSelectedDoctor(null)} title="Doctor Profile">
        {selectedDoctor && (
          <div className="space-y-4 pt-4">
            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">Name</p>
              <p className="text-slate-900 font-medium">{selectedDoctor.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">Specialization</p>
              <p className="text-slate-900">{selectedDoctor.specialization}</p>
            </div>
            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">Total Appointments</p>
              <p className="text-slate-900">{selectedDoctor.totalAppointments}</p>
            </div>
            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">Upcoming Appointments</p>
              <p className="text-slate-900">{selectedDoctor.upcomingAppointments}</p>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <Button onClick={() => setSelectedDoctor(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
