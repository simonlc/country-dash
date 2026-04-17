import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from './theme-provider';

const panelVariants = cva(
  'pointer-events-auto inline-size-full text-center',
  {
    variants: {
      compact: {
        false: 'px-4 py-4 md:px-[19px] md:py-[19px]',
        true: 'px-[7px] py-[6px] md:px-[19px] md:py-[19px]',
      },
      edgeAttachment: {
        bottom: 'rounded-t-sm rounded-b-none md:rounded-sm pb-[calc(16px+env(safe-area-inset-bottom))] md:pb-[19px]',
        none: 'rounded-sm',
        top: 'rounded-b-sm rounded-t-none md:rounded-md',
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
      edgeAttachment: 'none',
      flat: false,
      maxWidth: '560',
      surface: 'elevated',
    },
  },
);

const panelContentGapVariants = cva('grid', {
  variants: {
    spacing: {
      compact: 'gap-2',
      roomy: 'gap-4',
    },
  },
  defaultVariants: {
    spacing: 'roomy',
  },
});

interface PanelProps {
  children: ReactNode;
  className?: string;
  compact?: VariantProps<typeof panelVariants>['compact'];
  edgeAttachment?: 'bottom' | 'none' | 'top';
  flat?: VariantProps<typeof panelVariants>['flat'];
  maxWidth?: 560 | 720;
  spacing?: 'compact' | 'roomy';
  surface?: VariantProps<typeof panelVariants>['surface'];
}

export function Panel({
  children,
  className,
  compact = false,
  edgeAttachment = 'none',
  flat = false,
  maxWidth = 560,
  spacing = 'roomy',
  surface = 'elevated',
}: PanelProps) {
  const isDesktop = useMediaQuery('(min-width: 900px)');
  const mobileAttachmentClass = isDesktop
    ? 'md:rounded-sm'
    : edgeAttachment === 'top'
      ? 'rounded-b-sm rounded-t-none'
      : edgeAttachment === 'bottom'
        ? 'rounded-t-sm rounded-b-none'
        : 'rounded-sm';

  return (
    <section
      className={cn(
        panelVariants({
          compact,
          edgeAttachment,
          flat,
          maxWidth: String(maxWidth) as '560' | '720',
          surface,
        }),
        mobileAttachmentClass,
        'mx-auto md:mb-6',
        className,
      )}
    >
      <div className={panelContentGapVariants({ spacing })}>{children}</div>
    </section>
  );
}
