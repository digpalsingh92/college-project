import { cn } from '@/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton rounded-xl', className)} aria-hidden="true" />;
}

export function StatSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="surface-card rounded-2xl p-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-3 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
