import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

export function Spinner({ size = 'md', text }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <Loader2 className={`${sizeMap[size]} animate-spin text-blue-500`} />
      {text && <span className="text-[#8892a4] text-sm">{text}</span>}
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
      <Spinner size="lg" text="Loading…" />
    </div>
  );
}
