import { cva, type VariantProps } from 'class-variance-authority';
import { useEffect, useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const dialogPanelVariants = cva(
  'grid overflow-hidden border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] shadow-2xl',
  {
    variants: {
      fullScreen: {
        false: 'w-[min(100%,calc(100vw-32px))] max-h-[calc(100vh-32px)] rounded-md',
        true: 'inset-0 h-[100dvh] w-full rounded-none',
      },
      size: {
        lg: 'max-w-[960px]',
        md: 'max-w-[640px]',
        sm: 'max-w-[420px]',
      },
    },
    defaultVariants: {
      fullScreen: false,
      size: 'md',
    },
  },
);

interface DialogProps {
  actions?: ReactNode;
  children: ReactNode;
  fullScreen?: boolean;
  onClose: () => void;
  open: boolean;
  size?: VariantProps<typeof dialogPanelVariants>['size'];
  title?: ReactNode;
}

export function Dialog({
  actions,
  children,
  fullScreen = false,
  onClose,
  open,
  size = 'md',
  title,
}: DialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[1300] grid place-items-center bg-black/35 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        aria-labelledby={title ? titleId : undefined}
        aria-modal="true"
        className={cn(dialogPanelVariants({ fullScreen, size }))}
        role="dialog"
      >
        {title ? (
          <header className="px-5 pt-5" id={titleId}>
            {typeof title === 'string' ? (
              <h2 className="m-0 text-xl font-semibold">{title}</h2>
            ) : (
              title
            )}
          </header>
        ) : null}
        <div className="px-5 pb-4 pt-4">{children}</div>
        {actions ? (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
            {actions}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
