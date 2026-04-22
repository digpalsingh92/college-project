"use client";

import { SearchButton } from "@/helpers/icons";
import { useState } from "react";

export default function TableSearch({
  onSearch,
  placeholder = "Search records",
  value,
}: {
  onSearch: (value: string) => void;
  placeholder?: string;
  value?: string;
}) {
  const [internalValue, setInternalValue] = useState("");
  const inputValue = value ?? internalValue;

  return (
    <div className="mb-4 h-[40px] w-full flex items-center relative ">
      <input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => {
          if (value === undefined) {
            setInternalValue(e.target.value);
          }
          onSearch(e.target.value);
        }}
        className="w-full rounded-xl h-[40px] bg-[#f0f4f2] border-none text-[#769480] px-3 py-2 pl-10 focus:ring-2 focus:ring-emerald-500 focus:ring-offset"
      />

      <div className="absolute top-1/2 left-3 -translate-y-1/2 text-muted">
        <SearchButton />
      </div>
    </div>
  );
}
