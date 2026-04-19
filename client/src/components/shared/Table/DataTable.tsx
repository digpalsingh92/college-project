"use client";

import { ReactNode } from "react";
import TableCard from "./TableCard";
import TableSearch from "./TableSearch";
import TablePagination from "./TablePagination";
import { Button } from "@/components/ui/Button";

type Column<T> = {
  key: keyof T;
  label: string;
  render?: (row: T) => React.ReactNode;
};

type Action<T> = {
  label: string;
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;
  className?: string;
};

type Props<T> = {
  title: string;
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  page: number;
  totalPages: number;
  limit?: number;
  loading?: boolean;
  errorMessage?: string | null;
  emptyState?: ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  filterSlot?: ReactNode;
  keyExtractor?: (row: T, index: number) => string;
  onRetry?: () => void;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSearch: (value: string) => void;
};

export default function DataTable<T>({
  title,
  data,
  columns,
  actions,
  page,
  totalPages,
  limit = 10,
  loading = false,
  errorMessage,
  emptyState,
  searchPlaceholder,
  searchValue,
  filterSlot,
  keyExtractor,
  onRetry,
  onPageChange,
  onLimitChange = () => {},
  onSearch,
}: Props<T>) {
  const hasData = data.length > 0;

  return (
    <TableCard title={title}>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-md">
          <TableSearch
            onSearch={onSearch}
            placeholder={searchPlaceholder}
            value={searchValue}
          />
        </div>
        {filterSlot ? <div className="flex flex-wrap items-center gap-2">{filterSlot}</div> : null}
      </div>

      {errorMessage ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{errorMessage}</span>
          {onRetry ? (
            <Button size="sm" variant="outline" type="button" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full shadow">
          <thead className="bg-[#f3f9f2]">
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className="px-4.75 py-3.5 text-center">
                  {col.label}
                </th>
              ))}
              {actions && <th className="p-3">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={actions ? columns.length + 1 : columns.length}
                  className="p-6 text-center text-sm text-slate-500"
                >
                  Loading data...
                </td>
              </tr>
            ) : hasData ? (
              data.map((row, i) => (
                <tr
                  key={keyExtractor ? keyExtractor(row, i) : String(i)}
                  className="border-t border-[#EAE6EA] hover:bg-gray-50"
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4.75 py-3.5 text-center">
                      {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                    </td>
                  ))}

                  {actions && (
                    <td className="p-3">
                      <div className="flex flex-wrap justify-center gap-2">
                      {actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => action.onClick(row)}
                          disabled={action.disabled?.(row)}
                          className={`text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 ${action.className ?? ""}`}
                        >
                          {action.label}
                        </button>
                      ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={actions ? columns.length + 1 : columns.length} className="p-4 text-center">
                  {emptyState ?? "No data found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        page={page}
        totalPages={Math.max(1, totalPages)}
        limit={limit}
        onChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </TableCard>
  );
}
