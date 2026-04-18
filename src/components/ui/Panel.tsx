import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const panelVariants = cva(
  'rounded-t-xl md:rounded-xl mx-auto md:mb-6 pointer-events-auto inline-size-full text-center',
  {
    variants: {
      compact: {
        false: 'px-4 py-4 md:px-[19px] md:py-[19px]',
        true: 'px-[7px] py-[6px] md:px-[19px] md:py-[19px]',
      },
      flat: {
        false: '',
        true: 'bg-none shadow-none',
      },
      maxWidth: {
        '560': 'md:max-w-[560px]',
        '720': 'md:max-w-[720px]',
      },
      surface: {
        elevated: 'surface-elevated',
        panel: 'surface-panel',
      },
    },
    defaultVariants: {
      compact: false,
      flat: false,
      maxWidth: '560',
      surface: 'elevated',
    },
  },
);

interface PanelProps {
  children: ReactNode;
  className?: string;
  compact?: VariantProps<typeof panelVariants>['compact'];
  flat?: VariantProps<typeof panelVariants>['flat'];
  maxWidth?: 560 | 720;
  surface?: VariantProps<typeof panelVariants>['surface'];
}

export function Panel({
  children,
  className,
  compact = false,
  flat = false,
  maxWidth = 560,
  surface = 'elevated',
}: PanelProps) {
  return (
    <section
      className={cn(
        panelVariants({
          compact,
          flat,
          maxWidth: String(maxWidth) as '560' | '720',
          surface,
        }),
        className,
      )}
    >
      <div className="grid gap-2">{children}</div>
    </section>
  );
}
