import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-normal rounded-sm text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]',
  {
    variants: {
      tone: {
        danger: '',
        primary: '',
      },
      size: {
        sm: 'min-h-10 px-4 py-1.5',
        md: 'min-h-11 px-5 py-2',
        lg: 'min-h-12 px-6 py-3',
      },
      variant: {
        contained: 'border border-transparent bg-primary text-primary-foreground',
        outlined: 'border border-primary/40 bg-transparent text-foreground',
        text: 'border border-transparent bg-transparent text-muted',
      },
    },
    defaultVariants: {
      tone: 'primary',
      size: 'md',
      variant: 'text',
    },
    compoundVariants: [
      {
        className: 'bg-[color:#d54b41] text-white',
        tone: 'danger',
        variant: 'contained',
      },
      {
        className: 'border-[color:color-mix(in_srgb,#d54b41_40%,transparent)] text-[#d54b41]',
        tone: 'danger',
        variant: 'outlined',
      },
      {
        className: 'text-[#d54b41]',
        tone: 'danger',
        variant: 'text',
      },
    ],
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  startIcon?: ReactNode;
}

export function Button({
  children,
  className,
  size,
  startIcon,
  tone,
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ size, tone, variant }), className)}
      {...props}
    >
      {startIcon ? <span className="inline-flex shrink-0">{startIcon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
