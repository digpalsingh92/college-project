"use client";

import { Button } from "@/components/ui/Button";

interface TableActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
}

export function TableActions({
  onView,
  onEdit,
  onDelete,
  viewLabel = "View",
  editLabel = "Edit",
  deleteLabel = "Delete",
}: TableActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {onView ? (
        <Button variant="outline" size="sm" onClick={onView}>
          {viewLabel}
        </Button>
      ) : null}
      {onEdit ? (
        <Button variant="secondary" size="sm" onClick={onEdit}>
          {editLabel}
        </Button>
      ) : null}
      {onDelete ? (
        <Button variant="danger" size="sm" onClick={onDelete}>
          {deleteLabel}
        </Button>
      ) : null}
    </div>
  );
}
