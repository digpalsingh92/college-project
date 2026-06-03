"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  Activity,
  Lock,
  Unlock,
  Search,
  Plus,
  User,
  Loader2,
  X,
  Cpu,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import DataTable from "@/components/shared/Table/DataTable";
import {
  useGetHospitalResourcesQuery,
  useGetHospitalResourceAllocationsQuery,
  useGetAdminPatientsQuery,
  useAllocateHospitalResourceMutation,
  useReleaseHospitalResourceMutation,
  useGetResourceUnitsQuery,
} from "@/store/apiSlice";
import { cn } from "@/helpers/cn";
import { toast } from "sonner";
import { useLiveOperationsTelemetry } from "@/hooks/useLiveOperationsTelemetry";

function TimeElapsed({ time }: { time: string }) {
  const [elapsed, setElapsed] = useState("");
  
  useEffect(() => {
    const update = () => {
      const diffMs = Date.now() - new Date(time).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) {
        setElapsed("Just now");
      } else if (diffMins < 60) {
        setElapsed(`${diffMins}m ago`);
      } else {
        const hours = Math.floor(diffMins / 60);
        setElapsed(`${hours}h ${diffMins % 60}m ago`);
      }
    };
    update();
    const interval = setInterval(update, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [time]);

  return <span className="font-semibold text-slate-700">{elapsed}</span>;
}

type AllocationRow = {
  id: string;
  allocatedFrom: string;
  notes: string | null;
  resource?: {
    resourceType?: { name?: string; category?: string };
  };
  resourceUnit?: { unitNumber?: string };
  patient?: { name?: string; email?: string };
};

export function DoctorResourcesPage() {
  // Activate live real-time Websocket listeners for cache syncs
  useLiveOperationsTelemetry();

  // Resource blocker states
  const [patientSearch, setPatientSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);
  const [selectedResource, setSelectedResource] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [allocPage, setAllocPage] = useState(1);
  const [allocLimit, setAllocLimit] = useState(10);
  const [allocSearch, setAllocSearch] = useState("");
  const [releasingId, setReleasingId] = useState<string | null>(null);

  // Selected resource for detailed census inspection
  const [inspectResourceId, setInspectResourceId] = useState("");

  // Debounce patient search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(patientSearch);
    }, 250);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Queries & Mutations for resources
  const { data: resourcesResponse, isLoading: resourcesLoading } = useGetHospitalResourcesQuery({ limit: 100 });
  const { data: allocationsResponse, isLoading: allocationsLoading } = useGetHospitalResourceAllocationsQuery();
  const { data: patientsData } = useGetAdminPatientsQuery(
    { search: debouncedSearch, limit: 10 },
    { skip: !dropdownOpen && patientSearch === "" }
  );

  // Load specific resource units dynamically
  const { data: unitsResponse, isLoading: unitsLoading } = useGetResourceUnitsQuery(inspectResourceId, { skip: !inspectResourceId });
  const units = unitsResponse?.data ?? [];

  // Load units for the allocator form when a resource is selected
  const { data: allocateUnitsResponse, isLoading: allocateUnitsLoading } = useGetResourceUnitsQuery(
    selectedResource,
    { skip: !selectedResource }
  );
  const allocateUnits = allocateUnitsResponse?.data ?? [];
  const availableUnits = allocateUnits.filter(
    (unit: any) => unit.isActive && unit.occupancyStatus === "VACANT"
  );

  // Reset unit selection when resource category changes
  useEffect(() => {
    setSelectedUnitId("");
  }, [selectedResource]);

  const [allocateResource, { isLoading: isAllocating }] = useAllocateHospitalResourceMutation();
  const [releaseResource] = useReleaseHospitalResourceMutation();

  const resources = resourcesResponse?.data ?? [];
  const allocations = allocationsResponse?.data ?? [];
  const patientsList = patientsData?.patients ?? [];

  // Set default inspected resource to the first available category
  useEffect(() => {
    if (resources.length > 0 && !inspectResourceId) {
      setInspectResourceId(resources[0].id);
    }
  }, [resources, inspectResourceId]);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error("Please select a patient first.");
      return;
    }
    if (!selectedResource) {
      toast.error("Please select a resource or machine first.");
      return;
    }
    if (!selectedUnitId) {
      toast.error("Please select a specific unit to block.");
      return;
    }

    try {
      await allocateResource({
        resourceId: selectedResource,
        unitId: selectedUnitId,
        patientId: selectedPatient.id,
        notes: clinicalNotes,
      }).unwrap();
      
      toast.success("Resource successfully locked / occupied!");
      // Reset form
      setSelectedPatient(null);
      setSelectedResource("");
      setSelectedUnitId("");
      setClinicalNotes("");
      setPatientSearch("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to occupy resource.");
    }
  };

  const handleRelease = async (allocationId: string) => {
    setReleasingId(allocationId);
    try {
      await releaseResource({ allocationId }).unwrap();
      toast.success("Resource released and returned to pool!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to release resource.");
    } finally {
      setReleasingId(null);
    }
  };

  const filteredAllocations = useMemo(() => {
    const query = allocSearch.trim().toLowerCase();
    if (!query) return allocations as AllocationRow[];

    return (allocations as AllocationRow[]).filter((alloc) => {
      const resourceName = alloc.resource?.resourceType?.name?.toLowerCase() ?? "";
      const unitNumber = alloc.resourceUnit?.unitNumber?.toLowerCase() ?? "";
      const patientName = alloc.patient?.name?.toLowerCase() ?? "";
      const patientEmail = alloc.patient?.email?.toLowerCase() ?? "";
      const notes = alloc.notes?.toLowerCase() ?? "";

      return (
        resourceName.includes(query) ||
        unitNumber.includes(query) ||
        patientName.includes(query) ||
        patientEmail.includes(query) ||
        notes.includes(query)
      );
    });
  }, [allocations, allocSearch]);

  const allocTotalPages = Math.max(1, Math.ceil(filteredAllocations.length / allocLimit));
  const paginatedAllocations = filteredAllocations.slice(
    (allocPage - 1) * allocLimit,
    allocPage * allocLimit
  );

  useEffect(() => {
    setAllocPage(1);
  }, [allocSearch, allocLimit]);

  const allocationColumns = useMemo(
    () => [
      {
        key: "resource" as const,
        label: "Resource Asset",
        render: (row: AllocationRow) => (
          <div className="flex items-center justify-center gap-2">
            <span className="p-1 rounded-md bg-slate-100 text-slate-600">
              <Activity className="h-3.5 w-3.5" />
            </span>
            <div className="text-left">
              <span className="font-semibold text-slate-800">
                {row.resource?.resourceType?.name || "Resource"}
              </span>
              {row.resourceUnit?.unitNumber && (
                <span className="ml-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  {row.resourceUnit.unitNumber}
                </span>
              )}
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                {row.resource?.resourceType?.category}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "patient" as const,
        label: "Patient Name",
        render: (row: AllocationRow) => (
          <div className="text-left">
            <span className="font-semibold text-slate-700">
              {row.patient?.name || "Consultation Patient"}
            </span>
            <span className="block text-xs text-slate-400">
              {row.patient?.email || "No email"}
            </span>
          </div>
        ),
      },
      {
        key: "allocatedFrom" as const,
        label: "Time Occupied",
        render: (row: AllocationRow) => (
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <TimeElapsed time={row.allocatedFrom} />
          </div>
        ),
      },
      {
        key: "notes" as const,
        label: "Clinical Indication",
        render: (row: AllocationRow) => (
          <span className="block max-w-xs truncate text-xs italic text-slate-600 mx-auto">
            {row.notes || <span className="text-slate-400">—</span>}
          </span>
        ),
      },
      {
        key: "id" as const,
        label: "Actions",
        render: (row: AllocationRow) => (
          <button
            type="button"
            onClick={() => handleRelease(row.id)}
            disabled={releasingId === row.id}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-all duration-150 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {releasingId === row.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Unlock className="h-3 w-3" />
            )}
            Release
          </button>
        ),
      },
    ],
    [releasingId]
  );

  // ── Calculate dynamic statistics based 100% on current API data ──
  const totalAssetsCount = resources.length;
  const totalCapacityUnits = resources.reduce((acc, r) => acc + (r.totalUnits || 0), 0);
  const activeOccupationsCount = allocations.length;
  
  // Calculate resources under maintenance or offline
  const maintenanceCount = resources.filter((r: any) => r.status === "MAINTENANCE").length;
  const inactiveCount = resources.filter((r: any) => r.status === "INACTIVE").length;
  const offlineResourcesCount = maintenanceCount + inactiveCount;

  // Available free units pool
  const freeUnitsPool = resources.reduce((acc, r) => {
    // If resource is under maintenance or inactive, count available units as 0
    if (r.status === "MAINTENANCE" || r.status === "INACTIVE") return acc;
    return acc + (r.availableUnits || 0);
  }, 0);

  const selectedResourceItem = resources.find((r: any) => r.id === inspectResourceId);

  const getStatusBadge = (status: string, availableUnits: number) => {
    const s = status?.toUpperCase();
    if (s === "MAINTENANCE") {
      return (
        <span className="px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-amber-50 text-amber-700 border-amber-100">
          Maintenance
        </span>
      );
    }
    if (s === "INACTIVE") {
      return (
        <span className="px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-slate-100 text-slate-600 border-slate-200">
          Inactive
        </span>
      );
    }
    if (availableUnits <= 0) {
      return (
        <span className="px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-rose-50 text-rose-700 border-rose-100 animate-pulse">
          Saturated
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-100">
        Active & Vacant
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── Welcome Banner ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Resource Blocker & Live Telemetry
          </h1>
          <p className="text-sm text-slate-500">
            Block diagnostic equipment, OTs, or clinical beds in real-time during walk-in patient consultations.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-100 shadow-sm shrink-0 self-start md:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Sync Active
        </div>
      </div>

      {/* ── Real-time API Driven Stat strip ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat
          icon={<Cpu className="h-5 w-5 text-blue-500" />}
          label="Total Categories"
          value={totalAssetsCount}
          bg="bg-blue-50 border border-blue-100/60"
        />
        <MiniStat
          icon={<Lock className="h-5 w-5 text-rose-500" />}
          label="Active Occupations"
          value={activeOccupationsCount}
          bg="bg-rose-50 border border-rose-100/60"
        />
        <MiniStat
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          label="Offline / Maintenance"
          value={offlineResourcesCount}
          bg="bg-amber-50 border border-amber-100/60"
        />
        <MiniStat
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          label="Available Pools"
          value={freeUnitsPool}
          bg="bg-emerald-50 border border-emerald-100/60"
        />
      </div>

      {/* ── Resource Blocker & Live Telemetry Section ── */}
      <div className="grid grid-cols-1 gap-6">


        {/* Dynamic Blocker Form */}
        <Card padding="md" className="lg:col-span-2 border border-slate-100 shadow-md bg-white">
          <CardHeader
            title="On-Demand Resource Allocator"
            description="Block clinical beds, diagnostic machines, or OTs during active consultation"
          />
          
          <form onSubmit={handleAllocate} className="mt-4 space-y-4">
            
            {/* Patient Selector */}
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Assign to Patient <span className="text-rose-500">*</span>
              </label>

              {selectedPatient ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    <div>
                      <span className="text-sm font-semibold text-slate-800">{selectedPatient.name}</span>
                      <span className="text-xs text-slate-500 ml-2">(Consultation Lock)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setPatientSearch("");
                    }}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setDropdownOpen(true);
                      }}
                      onFocus={() => setDropdownOpen(true)}
                      placeholder="Search patient by name or email..."
                      className="w-full h-11 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                    />
                  </div>

                  {dropdownOpen && (
                    <div className="absolute z-30 w-full mt-1.5 bg-white border border-slate-100 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                      {patientsList.length === 0 ? (
                        <div className="p-4 text-sm text-slate-400 text-center">
                          {debouncedSearch ? "No patients matching search query" : "Type to search patients..."}
                        </div>
                      ) : (
                        <div className="p-1.5 space-y-0.5">
                          {patientsList.map((p: any) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedPatient({ id: p.id, name: p.name });
                                setDropdownOpen(false);
                              }}
                              className="w-full flex items-center justify-between text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-700 rounded-lg transition-colors"
                            >
                              <div>
                                <p className="font-semibold">{p.name}</p>
                                <p className="text-xs text-slate-400">{p.status} Patient</p>
                              </div>
                              <Plus className="h-4 w-4 text-slate-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Grid for Selector and notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Resource selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Select Resource / Machine <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-sm bg-white"
                >
                  <option value="">-- Choose available asset --</option>
                  {resources.map((res: any) => {
                    const isDisabled = res.availableUnits <= 0 || res.status === "MAINTENANCE" || res.status === "INACTIVE";
                    let stateSuffix = `(${res.availableUnits} free)`;
                    if (res.status === "MAINTENANCE") stateSuffix = "— UNDER MAINTENANCE";
                    else if (res.status === "INACTIVE") stateSuffix = "— OFFLINE/INACTIVE";
                    else if (res.availableUnits <= 0) stateSuffix = "— SATURATED";

                    return (
                      <option 
                        key={res.id} 
                        value={res.id}
                        disabled={isDisabled}
                      >
                        {res.name} {stateSuffix}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Action Button container */}
              <div className="flex items-end">
                <Button
                  type="submit"
                  loading={isAllocating}
                  disabled={!selectedUnitId}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="h-4 w-4" />
                  Lock & Occupy Resource
                </Button>
              </div>

            </div>

            {/* Unit selector — shown after resource is picked */}
            {selectedResource && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Select Unit to Block <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Choose an active, vacant unit ID below to reserve for this patient.
                </p>

                {allocateUnitsLoading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                    Loading available units...
                  </div>
                ) : availableUnits.length === 0 ? (
                  <div className="py-4 px-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl">
                    No active vacant units available for this resource.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {availableUnits.map((unit: any) => {
                      const isSelected = selectedUnitId === unit.id;
                      return (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => setSelectedUnitId(unit.id)}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold shadow-sm transition-all",
                            isSelected
                              ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100/70 hover:border-emerald-200"
                          )}
                        >
                          <span className="truncate">{unit.unitNumber}</span>
                          <span className="flex h-1.5 w-1.5 relative shrink-0 ml-1">
                            {!isSelected && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            )}
                            <span
                              className={cn(
                                "relative inline-flex rounded-full h-1.5 w-1.5",
                                isSelected ? "bg-white" : "bg-emerald-500"
                              )}
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Clinical Notes */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Clinical Indication & Notes
              </label>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Reason for immediate block (e.g. 'Suspected fracture, ordering x-ray', 'High fever, placing on Bed 4')"
                rows={2}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-sm"
              />
            </div>

          </form>
        </Card>

      </div>

      {/* ── Active Allocations Feed ── */}
      <div className="space-y-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Active Occupations & Blocked Resources
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Physical assets currently reserved for active diagnostic tests or consultations
          </p>
        </div>

        <DataTable<AllocationRow>
          title="Allocation Records"
          data={paginatedAllocations}
          columns={allocationColumns}
          page={allocPage}
          totalPages={allocTotalPages}
          limit={allocLimit}
          loading={allocationsLoading}
          searchPlaceholder="Search by resource, unit, patient, or notes..."
          searchValue={allocSearch}
          keyExtractor={(row) => row.id}
          onPageChange={setAllocPage}
          onLimitChange={(nextLimit) => {
            setAllocLimit(nextLimit);
            setAllocPage(1);
          }}
          onSearch={setAllocSearch}
          emptyState={
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Unlock className="h-8 w-8 mb-2 text-slate-300" />
              <p className="text-sm font-semibold">No active allocations</p>
              <p className="text-xs text-slate-400 mt-1">
                All hospital beds, OTs, and machines are currently vacant.
              </p>
            </div>
          }
        />
      </div>

    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl px-5 py-4 shadow-sm hover:shadow transition-shadow ${bg}`}>
      <div className="p-2.5 rounded-xl bg-white/90 shadow-sm shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}
