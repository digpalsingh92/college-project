"use client";

import { useState } from "react";
import {
  Download,
  Plus,
  Eye,
  Trash2,
  ArrowRightLeft,
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
};

const STATUS_OPTIONS = [
  "ACTIVE",
  "INACTIVE",
  "MAINTENANCE",
  "OCCUPIED",
  "VACANT",
] as const;

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  OCCUPIED: "bg-amber-50 text-amber-700 ring-amber-600/20",
  VACANT: "bg-blue-50 text-blue-700 ring-blue-600/20",
  INACTIVE: "bg-slate-100 text-slate-600 ring-slate-500/20",
  MAINTENANCE: "bg-purple-50 text-purple-700 ring-purple-600/20",
};

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
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ResourceRow | null>(
    null
  );

  // ── Add form state ──
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStatus, setFormStatus] = useState<string>("ACTIVE");

  // ── Status change state ──
  const [newStatus, setNewStatus] = useState<string>("");

  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useGetHospitalResourcesQuery({ category, search, page, limit });

  const [createResource, { isLoading: isCreating }] =
    useCreateHospitalResourceMutation();
  const [updateResource, { isLoading: isUpdating }] =
    useUpdateHospitalResourceMutation();
  const [deleteResource, { isLoading: isDeleting }] =
    useDeleteHospitalResourceMutation();

  const resources: ResourceRow[] = response?.data || [];

  // ── Handlers ──
  const resetForm = () => {
    setFormName("");
    setFormPrice("");
    setFormDesc("");
    setFormStatus("ACTIVE");
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

    try {
      await createResource({
        name: formName.trim(),
        category,
        basePrice: price,
        description: formDesc.trim() || undefined,
        status: formStatus,
      }).unwrap();
      toast.success(
        `${category === "BED" ? "Bed" : "Machine"} added successfully`
      );
      setAddOpen(false);
      resetForm();
      refetch();
    } catch {
      toast.error("Failed to add resource");
    }
  };

  const handleStatusChange = async () => {
    if (!selectedResource || !newStatus) return;
    try {
      await updateResource({
        id: selectedResource.id,
        status: newStatus,
      }).unwrap();
      toast.success(`Status updated to ${newStatus}`);
      setStatusOpen(false);
      setSelectedResource(null);
      setNewStatus("");
      refetch();
    } catch {
      toast.error("Failed to update status");
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
          ${row.basePrice.toLocaleString()}
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
      key: "availableUnits",
      label: "Available",
      render: (row: ResourceRow) => (
        <span className="tabular-nums text-slate-700">
          {row.availableUnits}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: ResourceRow) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
            statusColors[row.status] ||
              "bg-slate-100 text-slate-600 ring-slate-500/20"
          )}
        >
          {row.status}
        </span>
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
      label: "Status",
      onClick: (row: ResourceRow) => {
        setSelectedResource(row);
        setNewStatus(row.status);
        setStatusOpen(true);
      },
      className: "",
      icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
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

  // ── Action button renderer ──
  const actionRenderer = (row: ResourceRow) => (
    <div className="flex items-center justify-center gap-1.5">
      {actions.map((action, idx) => {
        const baseStyles =
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer";

        const variantStyles = {
          view: "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800",
          status:
            "bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800",
          delete:
            "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700",
        };

        return (
          <button
            key={idx}
            onClick={() => action.onClick(row)}
            className={cn(baseStyles, variantStyles[action.variant])}
            title={action.label}
          >
            {action.icon}
            {action.label}
          </button>
        );
      })}
    </div>
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
            label="Base Price ($)"
            type="number"
            placeholder="e.g. 2500"
            min={0}
            value={formPrice}
            onChange={(e) => setFormPrice(e.target.value)}
          />
          <div className="flex w-full flex-col gap-1.5">
            <label
              htmlFor="resource-status"
              className="text-sm font-medium text-foreground"
            >
              Status
            </label>
            <select
              id="resource-status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
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
                value={`$${selectedResource.basePrice.toLocaleString()}`}
              />
              <DetailItem
                label="Status"
                value={
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                      statusColors[selectedResource.status] ||
                        "bg-slate-100 text-slate-600 ring-slate-500/20"
                    )}
                  >
                    {selectedResource.status}
                  </span>
                }
              />
              <DetailItem
                label="Total Units"
                value={String(selectedResource.totalUnits)}
              />
              <DetailItem
                label="Available Units"
                value={String(selectedResource.availableUnits)}
              />
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

      {/* ── Change Status Modal ── */}
      <Modal
        open={statusOpen}
        title="Change Status"
        onClose={() => {
          setStatusOpen(false);
          setSelectedResource(null);
          setNewStatus("");
        }}
      >
        {selectedResource && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Changing status for{" "}
                <strong className="text-slate-900">
                  {selectedResource.name}
                </strong>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-500">Current:</span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                    statusColors[selectedResource.status] ||
                      "bg-slate-100 text-slate-600 ring-slate-500/20"
                  )}
                >
                  {selectedResource.status}
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-1.5">
              <label
                htmlFor="new-status"
                className="text-sm font-medium text-foreground"
              >
                New Status
              </label>
              <select
                id="new-status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusOpen(false);
                  setSelectedResource(null);
                  setNewStatus("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="admin"
                loading={isUpdating}
                onClick={handleStatusChange}
                disabled={newStatus === selectedResource.status}
              >
                Update Status
              </Button>
            </div>
          </div>
        )}
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
                    <strong>{selectedResource.name}</strong> will be permanently
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
