"use client";

import { cn } from "@/helpers/cn";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";

export interface TableActionItem {
  id: string;
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
}

interface TableActionsProps {
  actions: TableActionItem[];
  size?: ButtonSize;
  className?: string;
}

export function TableActions({ actions, size = "sm", className }: TableActionsProps) {
  if (!actions.length) {
    return <span className="text-muted">-</span>;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {actions.map((action) => (
        <Button
          key={action.id}
          type="button"
          size={size}
          variant={action.variant ?? "outline"}
          onClick={action.onClick}
          disabled={action.disabled}
          loading={action.loading}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

export type { TableActionsProps };
