import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface HudInfoProps {
  title?: ReactNode;
  value: ReactNode;
  className?: string | undefined;
  titleClassName?: string | undefined;
  valueClassName?: string | undefined;
}

export function HudInfo({
  className,
  title,
  titleClassName,
  value,
  valueClassName,
}: HudInfoProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      {title && (
        <div
          className={cn(
            'text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted',
            titleClassName,
          )}
        >
          {title}
        </div>
      )}
      <div className={cn('text-md font-medium leading-tight', valueClassName)}>
        {value}
      </div>
    </div>
  );
}
