import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ align = 'start', className, sideOffset = 6, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      align={align}
      className={cn(
        'surface-elevated z-[1300] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-sm border border-[var(--surface-panel-border)] p-0 shadow-[0_14px_32px_rgba(0,0,0,0.22)]',
        className,
      )}
      ref={ref}
      sideOffset={sideOffset}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
