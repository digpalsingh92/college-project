'use client';
import { cn } from '@/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-[#9db0cf]">{label}</label>}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a7c8]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'h-11 w-full rounded-xl border border-[#2a3d62] bg-[#e8f0fe] text-sm text-[#9db0cf] placeholder:text-[#9db0cf] transition-all duration-200',
              'focus:border-[#26c5b4]/70 focus:outline-none focus:ring-2 focus:ring-[#26c5b4]/25',
              leftIcon ? 'pl-10 pr-4' : 'px-4',
              error && 'border-[#f56565]/70 focus:border-[#f56565]/70 focus:ring-[#f56565]/30',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[#ffadad]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
