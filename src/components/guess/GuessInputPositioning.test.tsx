import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { GuessInput } from './GuessInput';

const { popoverContentMock } = vi.hoisted(() => ({
  popoverContentMock: vi.fn(),
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <>{children}</>,
  PopoverContent: (props: Record<string, unknown>) => {
    popoverContentMock(props);
    return <div data-testid="popover-content">{props.children as ReactNode}</div>;
  },
}));

describe('GuessInput desktop positioning', () => {
  it('pins desktop suggestions below the input without side flipping', () => {
    renderWithProviders(
      <GuessInput
        onSubmit={vi.fn()}
        options={[
          { isocode: 'DO', isocode3: 'DOM', nameEn: 'Dominican Republic' },
          { isocode: 'DM', isocode3: 'DMA', nameEn: 'Dominica' },
        ]}
        variant="country"
      />,
    );

    expect(screen.getByRole('combobox')).toBeVisible();
    const popoverProps = popoverContentMock.mock.calls[0]?.[0] as
      | {
          collisionAvoidance?: {
            align?: string;
            fallbackAxisSide?: string;
            side?: string;
          };
          side?: string;
        }
      | undefined;

    expect(popoverProps?.side).toBe('bottom');
    expect(popoverProps?.collisionAvoidance).toEqual({
      align: 'shift',
      fallbackAxisSide: 'none',
      side: 'none',
    });
  });
});
