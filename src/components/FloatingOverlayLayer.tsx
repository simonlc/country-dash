import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FloatingOverlayLayerProps {
  align: 'start' | 'end';
  children: ReactNode;
  keyboardInset?: boolean;
  maxWidth: 'hud' | 'status';
}

export function FloatingOverlayLayer({
  align,
  children,
  keyboardInset = false,
  maxWidth,
}: FloatingOverlayLayerProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 flex justify-center',
        align === 'start'
          ? 'items-start pt-0 md:pt-4'
          : 'items-end pb-0 md:pb-6',
        align === 'end' && keyboardInset
          ? 'pb-[max(env(keyboard-inset-height,0px),var(--keyboard-fallback-inset,0px))] md:pb-6'
          : null,
        'ps-[max(env(safe-area-inset-left),0px)] pe-[max(env(safe-area-inset-right),0px)] md:px-2',
      )}
    >
      <div className={cn('w-full', maxWidth === 'hud' ? 'max-w-[1240px]' : 'max-w-[860px]')}>
        {children}
      </div>
    </div>
  );
}
