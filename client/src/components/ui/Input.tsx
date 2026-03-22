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
        {label && <label className="text-sm font-medium text-[#8892a4]">{label}</label>}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8892a4]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full h-11 bg-[#0a0e1a] border border-[#1e2d4a] rounded-xl text-[#e8eaf0] placeholder:text-[#8892a4] text-sm transition-all duration-200',
              'focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20',
              leftIcon ? 'pl-10 pr-4' : 'px-4',
              error && 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
