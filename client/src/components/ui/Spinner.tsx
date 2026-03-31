import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

export function Spinner({ size = 'md', text }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-8" role="status" aria-live="polite" aria-busy="true">
      <Loader2 className={`${sizeMap[size]} animate-spin text-[#26c5b4]`} />
      {text && <span className="text-sm text-[#9ab2d7]">{text}</span>}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent">
      <Spinner size="lg" text="Loading…" />
    </div>
  );
}
