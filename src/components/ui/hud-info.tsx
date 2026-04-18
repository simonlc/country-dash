import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface HudInfoProps {
  title?: ReactNode;
  value: ReactNode;
  className?: string;
}

export function HudInfo({ className, title, value }: HudInfoProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {title && (
        <div className="uppercase text-sm font-bold text-muted tracking-widest">
          {title}
        </div>
      )}
      <div className="text-md font-medium">{value}</div>
    </div>
  );
}
