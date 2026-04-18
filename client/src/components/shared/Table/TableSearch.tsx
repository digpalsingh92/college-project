  "use client";

import { SearchButton } from "@/helpers/icons";
import { useState } from "react";

export default function TableSearch({
  onSearch,
}: {
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <div className="mb-4 h-[40px] w-full flex items-center relative ">
      <input
        type="text"
        placeholder="Search by patient name, date, or status"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onSearch(e.target.value);
        }}
        className="w-full rounded-xl h-[40px] bg-[#f0f4f2] border-none text-[#769480] px-3 py-2 pl-10 focus:ring-2 focus:ring-emerald-500 focus:ring-offset"
      />

      <div className="absolute top-1/2 left-3 -translate-y-1/2 text-muted">
        <SearchButton/>
      </div>
    </div>
  );
}
