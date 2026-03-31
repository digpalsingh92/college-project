import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  className?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon: Icon, className, action }: EmptyStateProps) {
  return (
    <div className={cn('surface-card flex flex-col items-center justify-center rounded-2xl p-8 text-center', className)}>
      {Icon ? (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f83c2]/15 text-[#80d7ff]">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-[#eaf1ff]">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-[#9ab2d7]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
