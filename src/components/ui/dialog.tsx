import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
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
  const accessibleTitle = typeof title === 'string' ? title : 'Dialog';

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[1300] bg-black/35" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            dialogPanelVariants({ fullScreen, size }),
            'fixed z-[1300]',
            fullScreen ? 'inset-0' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          )}
        >
          <DialogPrimitive.Title className="sr-only">{accessibleTitle}</DialogPrimitive.Title>
          {title ? (
            <header className="px-5 pt-5">
              {typeof title === 'string' ? (
                <h2 className="m-0 text-xl font-semibold">{title}</h2>
              ) : (
                <div>{title}</div>
              )}
            </header>
          ) : null}
          <div className="px-5 pb-4 pt-4">{children}</div>
          {actions ? (
            <footer className="flex flex-wrap justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
              {actions}
            </footer>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
