import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'relative overflow-hidden rounded-sm shadow-none',
  {
    variants: {
      tone: {
        accent: 'bg-[var(--surface-display-accent-bg)] border border-[var(--surface-display-accent-border)]',
        default: '',
        elevated: 'surface-elevated border border-[var(--surface-panel-border)]',
        muted: 'bg-[var(--surface-display-neutral-bg)] border border-[var(--surface-display-neutral-border)]',
        outlined: 'bg-[var(--color-card)] border border-[var(--color-border)]',
      },
    },
    defaultVariants: {
      tone: 'default',
    },
  },
);

interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, tone, ...props }: CardProps) {
  return <div {...props} className={cn(cardVariants({ tone }), className)} />;
}
