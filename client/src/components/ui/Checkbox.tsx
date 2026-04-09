"use client";

import { InputHTMLAttributes, useId } from "react";
import { cn } from "@/helpers/cn";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export function Checkbox({ id, label, className, ...props }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <div className="inline-flex items-center gap-2">
      <input
        id={checkboxId}
        type="checkbox"
        className={cn("h-4 w-4 rounded border border-border", className)}
        aria-checked={props.checked}
        {...props}
      />
      {label ? (
        <label htmlFor={checkboxId} className="text-sm text-foreground">
          {label}
        </label>
      ) : null}
    </div>
  );
}
