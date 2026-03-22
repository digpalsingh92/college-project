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
  primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20',
  secondary: 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20',
  danger: 'bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30',
  ghost: 'hover:bg-white/5 text-[#8892a4] hover:text-white',
  outline: 'border border-[#1e2d4a] hover:border-blue-500/50 text-[#e8eaf0] hover:bg-blue-500/10',
};

const sizes: Record<string, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
};

export function Button({ variant = 'primary', size = 'md', loading, disabled, children, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed glow-btn',
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
