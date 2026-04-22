"use client";

import { useState } from "react";
import { Download, Plus } from "lucide-react";
import DataTable from "@/components/shared/Table/DataTable";
import { Button } from "@/components/ui/Button";
import { exportToCsv } from "@/helpers/exportCsv";
import { 
  useGetHospitalResourcesQuery, 
  useCreateHospitalResourceMutation,
  useUpdateHospitalResourceMutation
} from "@/store/apiSlice";
import { toast } from "sonner";
import { cn } from "@/helpers/cn";

interface AdminResourcePageProps {
  title: string;
  description: string;
  category: "BED" | "OT" | "LAB" | "MACHINE";
  exportFilename: string;
}

export function AdminResourcePage({ title, description, category, exportFilename }: AdminResourcePageProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const { data: response, isLoading, refetch } = useGetHospitalResourcesQuery({
    category,
    search
  });

  const [createResource, { isLoading: isCreating }] = useCreateHospitalResourceMutation();
  const [updateResource] = useUpdateHospitalResourceMutation();

  const resources = response?.data || [];

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "VACANT" ? "OCCUPIED" : "VACANT";
      await updateResource({ id, status: nextStatus }).unwrap();
      toast.success(`Resource marked as ${nextStatus.toLowerCase()}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const columns: any[] = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    { key: "basePrice", label: "Base Price ($)" },
    {
      key: "status",
      label: "Status",
      render: (row: any) => {
        const isOccupied = row.status === "OCCUPIED";
        const isVacant = row.status === "VACANT";
        
        return (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                row.status === "ACTIVE" && "bg-emerald-50 text-emerald-700",
                isOccupied && "bg-amber-50 text-amber-700",
                isVacant && "bg-blue-50 text-blue-700",
                row.status === "INACTIVE" && "bg-slate-100 text-slate-600"
              )}
            >
              {row.status}
            </span>
            {(isOccupied || isVacant) && (
              <button
                onClick={() => handleToggleStatus(row.id, row.status)}
                className="text-[10px] font-medium text-slate-500 hover:text-blue-600 hover:underline"
              >
                Mark as {isOccupied ? "Vacant" : "Occupancy"}
              </button>
            )}
          </div>
        );
      },
    },
    { key: "createdAt", label: "Created At", render: (row: any) => new Date(row.createdAt).toLocaleDateString() },
  ];

  const handleExport = () => {
    if (resources.length === 0) {
      toast.error("No data to export.");
      return;
    }
    exportToCsv(exportFilename, resources);
  };

  const handleSeedMockData = async () => {
    try {
      const mockNames = {
        BED: ["ICU Bed", "General Ward", "Private Room", "Pediatric Bed", "Maternity Bed"],
        OT: ["Cardiology OT", "Neurology OT", "General Surgery OT", "Orthopedic OT", "Emergency OT"],
        LAB: ["Pathology Lab", "Hematology Lab", "Microbiology Lab", "Biochemistry Lab", "Genetics Lab"],
        MACHINE: ["MRI Scanner", "CT Scanner", "X-Ray Machine", "Ultrasound", "Ventilator"]
      };
      
      const toAdd = mockNames[category];
      for (const name of toAdd) {
        await createResource({
          name: `${name} ${Math.floor(Math.random() * 100)}`,
          category,
          basePrice: Math.floor(Math.random() * 1000) + 100,
          status: Math.random() > 0.5 ? "VACANT" : "OCCUPIED",
          description: `Automatically seeded ${category} resource`
        }).unwrap();
      }
      toast.success(`Successfully seeded 5 ${category}s`);
      refetch();
    } catch (err: any) {
      toast.error("Failed to seed data");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSeedMockData} variant="outline" disabled={isCreating} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Seed Dummy Data
          </Button>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV for ML
          </Button>
        </div>
      </div>

      <DataTable
        title={`${title} List`}
        data={resources}
        columns={columns}
        page={page}
        totalPages={1}
        loading={isLoading || isCreating}
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
    </div>
  );
}
