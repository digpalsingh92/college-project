'use client';
import { cn } from '@/utils';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variants: Record<string, string> = {
  primary: 'bg-gradient-to-r from-[#1f9d8f] to-[#1f83c2] hover:brightness-110 text-white shadow-lg shadow-[#1f83c2]/20 border border-transparent',
  secondary: 'bg-gradient-to-r from-[#1479b0] to-[#225ea5] hover:brightness-110 text-white shadow-lg shadow-[#225ea5]/20 border border-transparent',
  danger: 'bg-[#f56565]/15 hover:bg-[#f56565]/25 text-[#ffb3b3] border border-[#f56565]/40',
  ghost: 'hover:bg-white/5 text-[#94a7c8] hover:text-[#eaf1ff] border border-transparent',
  outline: 'border border-[#25395f] hover:border-[#26c5b4]/50 text-[#eaf1ff] hover:bg-[#1f9d8f]/10',
};

const sizes: Record<string, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-xl',
  md: 'h-11 px-4.5 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-2xl',
};

export function Button({ variant = 'primary', size = 'md', loading, disabled, children, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold tracking-[0.01em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 glow-btn',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
