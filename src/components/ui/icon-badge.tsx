import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface IconBadgeProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'danger' | 'primary';
}

export function IconBadge({
  className,
  tone = 'primary',
  ...props
}: IconBadgeProps) {
  return (
    <div
      {...props}
      className={cn(
        'grid min-h-11 min-w-11 place-items-center rounded-sm p-2',
        tone === 'primary'
          ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)]'
          : 'bg-[#d54b41] text-white',
        className,
      )}
    />
  );
}
