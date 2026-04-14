"use client";

import { useMemo, useState } from "react";

export interface TableFilterOption {
  label: string;
  value: string;
}

export interface TableFilterConfig<T> {
  id: string;
  label: string;
  options: TableFilterOption[];
  initialValue?: string;
  predicate: (row: T, value: string) => boolean;
}

interface UseTableParams<T> {
  data: T[];
  filters?: Array<TableFilterConfig<T>>;
  searchPredicate?: (row: T, query: string) => boolean;
  initialPageSize?: number;
}

interface UseTableResult<T> {
  query: string;
  setQuery: (value: string) => void;
  page: number;
  setPage: (value: number) => void;
  pageSize: number;
  totalRows: number;
  totalPages: number;
  visibleFrom: number;
  visibleTo: number;
  rows: T[];
  paginatedRows: T[];
  filterValues: Record<string, string>;
  setFilterValue: (filterId: string, value: string) => void;
  clearFilters: () => void;
}

function getInitialFilterValues<T>(filters: Array<TableFilterConfig<T>>): Record<string, string> {
  return filters.reduce<Record<string, string>>((acc, filter) => {
    const defaultValue = filter.initialValue ?? filter.options[0]?.value ?? "all";
    acc[filter.id] = defaultValue;
    return acc;
  }, {});
}

export function useTable<T>({
  data,
  filters = [],
  searchPredicate,
  initialPageSize = 5,
}: UseTableParams<T>): UseTableResult<T> {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => getInitialFilterValues(filters));

  const rows = useMemo(() => {
    return data.filter((row) => {
      const passesSearch = searchPredicate
        ? searchPredicate(row, query.trim().toLowerCase())
        : true;

      if (!passesSearch) {
        return false;
      }

      return filters.every((filter) => {
        const filterValue = filterValues[filter.id] ?? filter.initialValue ?? "all";
        if (filterValue === "all") {
          return true;
        }

        return filter.predicate(row, filterValue);
      });
    });
  }, [data, filterValues, filters, query, searchPredicate]);

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / initialPageSize));
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * initialPageSize;
    return rows.slice(start, start + initialPageSize);
  }, [currentPage, initialPageSize, rows]);

  const visibleFrom = totalRows === 0 ? 0 : (currentPage - 1) * initialPageSize + 1;
  const visibleTo = totalRows === 0 ? 0 : Math.min(currentPage * initialPageSize, totalRows);

  const handleSetQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const setFilterValue = (filterId: string, value: string) => {
    setFilterValues((prev) => ({
      ...prev,
      [filterId]: value,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setQuery("");
    setFilterValues(getInitialFilterValues(filters));
    setPage(1);
  };

  const handleSetPage = (value: number) => {
    setPage(Math.max(1, Math.min(value, totalPages)));
  };

  return {
    query,
    setQuery: handleSetQuery,
    page: currentPage,
    setPage: handleSetPage,
    pageSize: initialPageSize,
    totalRows,
    totalPages,
    visibleFrom,
    visibleTo,
    rows,
    paginatedRows,
    filterValues,
    setFilterValue,
    clearFilters,
  };
}
