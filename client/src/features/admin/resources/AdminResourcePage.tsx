"use client";

import { useState, useCallback } from "react";
import {
  Download,
  Plus,
  Eye,
  Trash2,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DataTable from "@/components/shared/Table/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { exportToCsv } from "@/helpers/exportCsv";
import {
  useGetHospitalResourcesQuery,
  useCreateHospitalResourceMutation,
  useUpdateHospitalResourceMutation,
  useDeleteHospitalResourceMutation,
  useLazyGetResourceUnitsQuery,
  useUpdateResourceUnitMutation,
} from "@/store/apiSlice";
import { toast } from "sonner";
import { cn } from "@/helpers/cn";

interface AdminResourcePageProps {
  title: string;
  description: string;
  category: "BED" | "OT" | "LAB" | "MACHINE";
  exportFilename: string;
}

type ResourceRow = {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  description: string | null;
  status: string;
  totalUnits: number;
  availableUnits: number;
  resourceTypeId: string;
  createdAt: string;
  updatedAt: string;
  activeCount?: number;
  inactiveCount?: number;
  occupiedCount?: number;
  vacantCount?: number;
};

type UnitRow = {
  id: string;
  unitNumber: string;
  isActive: boolean;
  occupancyStatus: "OCCUPIED" | "VACANT";
  resourceId: string;
  createdAt: string;
  updatedAt: string;
};

const UNITS_PER_PAGE = 20;

export function AdminResourcePage({
  title,
  description,
  category,
  exportFilename,
}: AdminResourcePageProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  // ── Modals ──
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unitsOpen, setUnitsOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ResourceRow | null>(
    null
  );

  // ── Add form state ──
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formTotalUnits, setFormTotalUnits] = useState("1");

  // ── Units state ──
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [unitsResourceName, setUnitsResourceName] = useState("");
  const [unitsPage, setUnitsPage] = useState(1);

  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useGetHospitalResourcesQuery({ category, search, page, limit });

  const [createResource, { isLoading: isCreating }] =
    useCreateHospitalResourceMutation();
  const [_updateResource] = useUpdateHospitalResourceMutation();
  const [deleteResource, { isLoading: isDeleting }] =
    useDeleteHospitalResourceMutation();
  const [fetchUnits, { isFetching: isLoadingUnits }] =
    useLazyGetResourceUnitsQuery();
  const [updateUnit] = useUpdateResourceUnitMutation();

  const resources: ResourceRow[] = response?.data || [];

  // ── Handlers ──
  const resetForm = () => {
    setFormName("");
    setFormPrice("");
    setFormDesc("");
    setFormTotalUnits("1");
  };

  const handleAdd = async () => {
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }
    const price = Number(formPrice);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid price");
      return;
    }
    const totalUnits = Math.max(1, Math.floor(Number(formTotalUnits) || 1));

    try {
      await createResource({
        name: formName.trim(),
        category,
        basePrice: price,
        description: formDesc.trim() || undefined,
        status: "ACTIVE",
      }).unwrap();
      toast.success(
        `${category === "BED" ? "Bed" : "Machine"} added successfully (${totalUnits} units)`
      );
      setAddOpen(false);
      resetForm();
      refetch();
    } catch {
      toast.error("Failed to add resource");
    }
  };

  const handleDelete = async () => {
    if (!selectedResource) return;
    try {
      await deleteResource(selectedResource.id).unwrap();
      toast.success("Resource deleted successfully");
      setDeleteOpen(false);
      setSelectedResource(null);
      refetch();
    } catch {
      toast.error("Failed to delete resource");
    }
  };

  const openUnitsModal = useCallback(
    async (row: ResourceRow) => {
      setSelectedResource(row);
      setUnitsResourceName(row.name);
      setUnitsPage(1);
      setUnitsOpen(true);

      try {
        const result = await fetchUnits(row.id).unwrap();
        setUnits(result.data || []);
      } catch {
        toast.error("Failed to load units");
        setUnits([]);
      }
    },
    [fetchUnits]
  );

  const handleUnitToggleActive = async (unit: UnitRow) => {
    const newActive = !unit.isActive;
    // Optimistic update
    setUnits((prev) =>
      prev.map((u) => (u.id === unit.id ? { ...u, isActive: newActive } : u))
    );
    try {
      await updateUnit({ unitId: unit.id, isActive: newActive }).unwrap();
      // Refetch parent list for updated summaries
      refetch();
    } catch {
      // Rollback
      setUnits((prev) =>
        prev.map((u) =>
          u.id === unit.id ? { ...u, isActive: !newActive } : u
        )
      );
      toast.error("Failed to update unit");
    }
  };

  const handleUnitOccupancyChange = async (
    unit: UnitRow,
    newStatus: "OCCUPIED" | "VACANT"
  ) => {
    if (newStatus === unit.occupancyStatus) return;
    // Optimistic update
    setUnits((prev) =>
      prev.map((u) =>
        u.id === unit.id ? { ...u, occupancyStatus: newStatus } : u
      )
    );
    try {
      await updateUnit({
        unitId: unit.id,
        occupancyStatus: newStatus,
      }).unwrap();
      refetch();
    } catch {
      // Rollback
      setUnits((prev) =>
        prev.map((u) =>
          u.id === unit.id
            ? { ...u, occupancyStatus: unit.occupancyStatus }
            : u
        )
      );
      toast.error("Failed to update unit");
    }
  };

  // ── Columns ──
  const columns: any[] = [
    {
      key: "name",
      label: "Name",
      render: (row: ResourceRow) => (
        <span className="font-medium text-slate-900">{row.name}</span>
      ),
    },
    {
      key: "basePrice",
      label: "Base Price",
      render: (row: ResourceRow) => (
        <span className="tabular-nums font-medium text-slate-700">
          ₹{row.basePrice.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "totalUnits",
      label: "Total",
      render: (row: ResourceRow) => (
        <span className="tabular-nums text-slate-700">{row.totalUnits}</span>
      ),
    },
    {
      key: "activeInactive",
      label: "Active / Inactive",
      render: (row: ResourceRow) => (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            {row.activeCount ?? row.totalUnits} active
          </span>
          {(row.inactiveCount ?? 0) > 0 && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/20">
              {row.inactiveCount} inactive
            </span>
          )}
        </div>
      ),
    },
    {
      key: "occupancy",
      label: "Occupied / Vacant",
      render: (row: ResourceRow) => (
        <div className="flex items-center gap-1.5">
          {(row.occupiedCount ?? 0) > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
              {row.occupiedCount} occupied
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
            {row.vacantCount ?? row.availableUnits} vacant
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (row: ResourceRow) => (
        <span className="text-sm text-slate-500 tabular-nums">
          {new Date(row.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  // ── Actions ──
  const actions = [
    {
      label: "View",
      onClick: (row: ResourceRow) => {
        setSelectedResource(row);
        setViewOpen(true);
      },
      className: "",
      icon: <Eye className="h-3.5 w-3.5" />,
      variant: "view" as const,
    },
    {
      label: "Manage Units",
      onClick: (row: ResourceRow) => openUnitsModal(row),
      className: "",
      icon: <Settings2 className="h-3.5 w-3.5" />,
      variant: "status" as const,
    },
    {
      label: "Delete",
      onClick: (row: ResourceRow) => {
        setSelectedResource(row);
        setDeleteOpen(true);
      },
      className: "",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      variant: "delete" as const,
    },
  ];

  const handleExport = () => {
    if (resources.length === 0) {
      toast.error("No data to export.");
      return;
    }
    exportToCsv(exportFilename, resources);
  };

  const resourceLabel = category === "BED" ? "Bed" : "Machine";

  // ── Paginated units ──
  const totalUnitPages = Math.ceil(units.length / UNITS_PER_PAGE);
  const paginatedUnits = units.slice(
    (unitsPage - 1) * UNITS_PER_PAGE,
    unitsPage * UNITS_PER_PAGE
  );

  // Unit summary from local state
  const unitSummary = units.reduce(
    (acc, u) => {
      if (u.isActive) {
        acc.active++;
        if (u.occupancyStatus === "OCCUPIED") acc.occupied++;
        else acc.vacant++;
      } else {
        acc.inactive++;
      }
      return acc;
    },
    { active: 0, inactive: 0, occupied: 0, vacant: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setAddOpen(true)}
            variant="admin"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New {resourceLabel}
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <DataTable
        title={`${title} List`}
        data={resources}
        columns={columns}
        actions={actions.map((a) => ({
          label: a.label,
          onClick: a.onClick,
          className: a.className,
          icon: a.icon,
          variant: a.variant,
        }))}
        page={page}
        totalPages={response?.totalPages ?? 1}
        limit={limit}
        loading={isLoading || isFetching || isCreating}
        onPageChange={setPage}
        onLimitChange={(nextLimit) => {
          setLimit(nextLimit);
          setPage(1);
        }}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      {/* ── Add Resource Modal ── */}
      <Modal
        open={addOpen}
        title={`Add New ${resourceLabel}`}
        onClose={() => {
          setAddOpen(false);
          resetForm();
        }}
      >
        <div className="space-y-4">
          <Input
            id="resource-name"
            label="Name"
            placeholder={
              category === "BED"
                ? "e.g. Cardiology Ward"
                : "e.g. MRI Scanner"
            }
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <Input
            id="resource-price"
            label="Base Price (₹)"
            type="number"
            placeholder="e.g. 2500"
            min={0}
            value={formPrice}
            onChange={(e) => setFormPrice(e.target.value)}
          />
          <Input
            id="resource-total-units"
            label="Total Units"
            type="number"
            placeholder="e.g. 10"
            min={1}
            value={formTotalUnits}
            onChange={(e) => setFormTotalUnits(e.target.value)}
          />
          <div className="flex w-full flex-col gap-1.5">
            <label
              htmlFor="resource-description"
              className="text-sm font-medium text-foreground"
            >
              Description
            </label>
            <textarea
              id="resource-description"
              rows={3}
              placeholder="Optional description..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button variant="admin" loading={isCreating} onClick={handleAdd}>
              Add {resourceLabel}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── View Resource Modal ── */}
      <Modal
        open={viewOpen}
        title="Resource Details"
        onClose={() => {
          setViewOpen(false);
          setSelectedResource(null);
        }}
      >
        {selectedResource && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Name" value={selectedResource.name} />
              <DetailItem label="Category" value={selectedResource.category} />
              <DetailItem
                label="Base Price"
                value={`₹${selectedResource.basePrice.toLocaleString("en-IN")}`}
              />
              <DetailItem
                label="Total Units"
                value={String(selectedResource.totalUnits)}
              />
            </div>

            {/* Unit breakdown */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-3">
                Unit Breakdown
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm text-slate-700">
                    <strong>{selectedResource.activeCount ?? 0}</strong> Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                  <span className="text-sm text-slate-700">
                    <strong>{selectedResource.inactiveCount ?? 0}</strong>{" "}
                    Inactive
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-sm text-slate-700">
                    <strong>{selectedResource.occupiedCount ?? 0}</strong>{" "}
                    Occupied
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="text-sm text-slate-700">
                    <strong>{selectedResource.vacantCount ?? 0}</strong> Vacant
                  </span>
                </div>
              </div>
            </div>

            {selectedResource.description && (
              <DetailItem
                label="Description"
                value={selectedResource.description}
                fullWidth
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <DetailItem
                label="Created"
                value={new Date(selectedResource.createdAt).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              />
              <DetailItem
                label="Last Updated"
                value={new Date(selectedResource.updatedAt).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              />
            </div>
            <DetailItem
              label="Resource ID"
              value={selectedResource.id}
              fullWidth
              mono
            />
          </div>
        )}
      </Modal>

      {/* ── Manage Units Modal ── */}
      <Modal
        open={unitsOpen}
        title={`Manage Units — ${unitsResourceName}`}
        onClose={() => {
          setUnitsOpen(false);
          setSelectedResource(null);
          setUnits([]);
        }}
        wide
      >
        <div className="space-y-4">
          {/* Summary badges */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-xs font-medium text-slate-500 mr-1">
              Summary:
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              {unitSummary.active} Active
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/20">
              {unitSummary.inactive} Inactive
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
              {unitSummary.occupied} Occupied
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
              {unitSummary.vacant} Vacant
            </span>
            <span className="ml-auto text-xs text-slate-400">
              {units.length} total units
            </span>
          </div>

          {/* Units table */}
          {isLoadingUnits ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            </div>
          ) : units.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-400">
              No units found for this resource.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Unit ID
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Active / Inactive
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Occupancy
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedUnits.map((unit) => (
                      <tr
                        key={unit.id}
                        className={cn(
                          "transition-colors",
                          !unit.isActive && "bg-slate-50/60 opacity-60"
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2">
                            <span className="font-mono text-xs font-medium text-slate-800">
                              {unit.unitNumber}
                            </span>
                            {!unit.isActive && (
                              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                                Disabled
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            {/* Toggle slider */}
                            <button
                              onClick={() => handleUnitToggleActive(unit)}
                              className={cn(
                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                                unit.isActive
                                  ? "bg-emerald-500"
                                  : "bg-slate-300"
                              )}
                              role="switch"
                              aria-checked={unit.isActive}
                              aria-label={`Toggle ${unit.unitNumber} active`}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                  unit.isActive
                                    ? "translate-x-5"
                                    : "translate-x-0"
                                )}
                              />
                            </button>
                            <span
                              className={cn(
                                "ml-2 text-xs font-medium",
                                unit.isActive
                                  ? "text-emerald-700"
                                  : "text-slate-500"
                              )}
                            >
                              {unit.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <select
                              value={unit.occupancyStatus}
                              onChange={(e) =>
                                handleUnitOccupancyChange(
                                  unit,
                                  e.target.value as "OCCUPIED" | "VACANT"
                                )
                              }
                              disabled={!unit.isActive}
                              className={cn(
                                "h-8 rounded-md border px-2.5 text-xs font-medium outline-none transition-all focus:ring-2 focus:ring-offset-1",
                                unit.occupancyStatus === "OCCUPIED"
                                  ? "border-amber-200 bg-amber-50 text-amber-700 focus:ring-amber-400"
                                  : "border-blue-200 bg-blue-50 text-blue-700 focus:ring-blue-400",
                                !unit.isActive &&
                                  "cursor-not-allowed opacity-50"
                              )}
                            >
                              <option value="OCCUPIED">Occupied</option>
                              <option value="VACANT">Vacant</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Unit pagination */}
              {totalUnitPages > 1 && (
                <div className="flex items-center justify-between px-1 pt-1">
                  <span className="text-xs text-slate-500">
                    Page {unitsPage} of {totalUnitPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setUnitsPage((p) => Math.max(1, p - 1))
                      }
                      disabled={unitsPage <= 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        setUnitsPage((p) =>
                          Math.min(totalUnitPages, p + 1)
                        )
                      }
                      disabled={unitsPage >= totalUnitPages}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setUnitsOpen(false);
                setSelectedResource(null);
                setUnits([]);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        open={deleteOpen}
        title="Confirm Deletion"
        onClose={() => {
          setDeleteOpen(false);
          setSelectedResource(null);
        }}
      >
        {selectedResource && (
          <div className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Are you sure you want to delete this resource?
                  </p>
                  <p className="mt-1 text-sm text-red-600">
                    <strong>{selectedResource.name}</strong> and all its{" "}
                    {selectedResource.totalUnits} units will be permanently
                    removed. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteOpen(false);
                  setSelectedResource(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={isDeleting}
                onClick={handleDelete}
              >
                Delete Resource
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ── Small helper for the view modal ── */
function DetailItem({
  label,
  value,
  fullWidth = false,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-0.5">
        {label}
      </p>
      <div
        className={cn(
          "text-sm text-slate-800",
          mono && "font-mono text-xs break-all text-slate-500"
        )}
      >
        {value}
      </div>
    </div>
  );
}
