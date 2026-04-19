type Props = {
  page: number;
  totalPages: number;
  limit: number;
  onChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export default function TablePagination({
  page,
  totalPages,
  limit,
  onChange,
  onLimitChange,
}: Props) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
      {/* Left Side: Limit Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Show:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="cursor-pointer rounded-xl border-2 border-[#bee4b4] px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#bee4b4]/50"
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>

      {/* Right Side: Navigation Controls */}
      <div className="flex items-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="rounded-xl border-2 border-[#bee4b4] px-4 py-2 transition-colors 
                     hover:bg-[#e1f3d8] disabled:cursor-not-allowed 
                     disabled:border-gray-300 disabled:bg-transparent disabled:text-gray-400"
        >
          Back
        </button>

        <span className="min-w-[80px] text-center font-medium">
          {page} <span className="text-gray-400">/</span> {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className="rounded-xl border-2 border-[#bee4b4] px-4 py-2 transition-colors 
                     hover:bg-[#e1f3d8] disabled:cursor-not-allowed 
                     disabled:border-gray-300 disabled:bg-transparent disabled:text-gray-400"
        >
          Next
        </button>
      </div>
    </div>
  );
}