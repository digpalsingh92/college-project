type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export default function TablePagination({
  page,
  totalPages,
  onChange,
}: Props) {
  return (
    <div className="mt-4 flex justify-end gap-2">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="rounded border px-3 py-1"
      >
        Prev
      </button>

      <span className="px-3 py-1">
        {page} / {totalPages}
      </span>

      <button
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded border px-3 py-1"
      >
        Next
      </button>
    </div>
  );
}
