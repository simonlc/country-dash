import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface IconBadgeProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'danger' | 'primary' | 'success';
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
        'grid min-h-11 min-w-11 place-items-center rounded-full p-2',
        tone === 'primary'
          ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)]'
          : tone === 'success'
            ? 'bg-[var(--color-success)] text-[var(--color-success-contrast)]'
            : 'bg-[#d54b41] text-white',
        className,
      )}
    />
  );
}
