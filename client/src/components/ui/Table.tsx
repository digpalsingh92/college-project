import { ReactNode } from "react";
import { cn } from "@/helpers/cn";
import { TableColumn } from "@/types";

interface TableProps<T> {
  columns: Array<TableColumn<T>>;
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  loading?: boolean;
  emptyState?: ReactNode;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyState = "No records found.",
  className,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted shadow-sm">
        Loading data...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted shadow-sm">
        {emptyState}
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, index) => (
            <tr
              key={keyExtractor(row, index)}
              className="bg-white transition-colors hover:bg-slate-50/80"
            >
              {columns.map((column) => (
                <td key={String(column.key)} className="px-4 py-3 text-foreground">
                  {column.render
                    ? column.render(row)
                    : String(row[column.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type { TableProps };
