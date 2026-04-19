"use client";

import TableCard from "./TableCard";
import TableSearch from "./TableSearch";
import TablePagination from "./TablePagination";

type Column<T> = {
  key: keyof T;
  label: string;
  render?: (row: T) => React.ReactNode;
};

type Action<T> = {
  label: string;
  onClick: (row: T) => void;
};

type Props<T> = {
  title: string;
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  page: number;
  totalPages: number;
  limit?: number;
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
  onPageChange,
  onLimitChange = () => {},
  onSearch,
}: Props<T>) {
  return (
    <TableCard title={title}>
      <TableSearch onSearch={onSearch} />

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
            {data.length > 0 ? (
              data.map((row, i) => (
                <tr key={i} className="border-t border-[#EAE6EA] hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4.75 py-3.5 text-center">
                      {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                    </td>
                  ))}

                  {actions && (
                    <td className="flex gap-2 p-3">
                      {actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => action.onClick(row)}
                          className="text-blue-600 hover:underline"
                        >
                          {action.label}
                        </button>
                      ))}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={actions ? columns.length + 1 : columns.length} className="p-4 text-center">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination page={page} totalPages={totalPages} limit={limit} onChange={onPageChange} onLimitChange={onLimitChange} />
    </TableCard>
  );
}
