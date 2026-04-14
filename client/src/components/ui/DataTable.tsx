"use client";

import { ReactNode } from "react";
import { Table, TableProps } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { useTable, TableFilterConfig } from "@/hooks/useTable";

interface DataTableProps<T> {
  columns: Array<TableProps<T>["columns"][number]>;
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  loading?: boolean;
  emptyState?: ReactNode;
  className?: string;
  searchPlaceholder?: string;
  searchPredicate?: (row: T, query: string) => boolean;
  filters?: Array<TableFilterConfig<T>>;
  pageSize?: number;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyState,
  className,
  searchPlaceholder = "Search...",
  searchPredicate,
  filters = [],
  pageSize = 5,
}: DataTableProps<T>) {
  const {
    query,
    setQuery,
    page,
    setPage,
    totalRows,
    totalPages,
    visibleFrom,
    visibleTo,
    paginatedRows,
    filterValues,
    setFilterValue,
    clearFilters,
  } = useTable({
    data,
    filters,
    searchPredicate,
    initialPageSize: pageSize,
  });

  const hasControls = Boolean(searchPredicate) || filters.length > 0;
  const resolvedEmptyState =
    emptyState ?? (data.length > 0 ? "No matching records found for current filters." : "No records found.");

  return (
    <div className="space-y-4">
      {hasControls ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {searchPredicate ? (
              <div className="md:col-span-2 lg:col-span-2">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="table-search">
                  Search
                </label>
                <input
                  id="table-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            ) : null}

            {filters.map((filter) => (
              <div key={filter.id}>
                <label
                  className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
                  htmlFor={`table-filter-${filter.id}`}
                >
                  {filter.label}
                </label>
                <select
                  id={`table-filter-${filter.id}`}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={filterValues[filter.id] ?? filter.initialValue ?? "all"}
                  onChange={(event) => setFilterValue(filter.id, event.target.value)}
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        </div>
      ) : null}

      <Table
        columns={columns}
        data={paginatedRows}
        keyExtractor={keyExtractor}
        loading={loading}
        className={className}
        emptyState={resolvedEmptyState}
      />

      {!loading && totalRows > 0 ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <p>
            Showing {visibleFrom}-{visibleTo} of {totalRows}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(Math.min(totalPages, page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export type { DataTableProps };
