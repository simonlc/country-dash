import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { IntroDialog } from './IntroDialog';

vi.mock('@ebay/nice-modal-react', () => ({
  __esModule: true,
  default: {
    create: <T,>(component: T) => component,
    Provider: ({ children }: { children: ReactNode }) => children,
  },
  create: <T,>(component: T) => component,
  useModal: () => ({
    hide: () => Promise.resolve(),
    visible: true,
  }),
}));

describe('IntroDialog', () => {
  it('shows a separate daily challenge panel and locks it when complete', () => {
    renderWithProviders(
      <IntroDialog
        id="intro-dialog"
        counts={{ large: 1, mixed: 3, small: 1 }}
        dailyResult={{
          completedAt: '2026-03-31T12:00:00.000Z',
          correctCount: 4,
          date: '2026-03-31',
          rounds: [],
          seed: '2026-03-31',
          totalCount: 5,
        }}
        onStartDaily={vi.fn()}
        onStartRandom={vi.fn()}
      />,
    );

    expect(screen.getByText(/Daily Challenge/i)).toBeVisible();
    expect(screen.getByText(/Daily challenge: completed 4\/5/i)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /play today's daily/i }),
    ).not.toBeInTheDocument();
  });

  it('treats size and category as a single pool selector', async () => {
    const user = userEvent.setup();
    const onStartRandom = vi.fn();

    renderWithProviders(
      <IntroDialog
        id="intro-dialog"
        counts={{ large: 12, mixed: 60, small: 18 }}
        dailyResult={null}
        onStartDaily={vi.fn()}
        onStartRandom={onStartRandom}
      />,
    );

    await user.click(
      screen.getByRole('button', {
        name: /^Speedrun$/i,
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: /Micro Countries Category pool Tiny targets and high-precision geography\./i,
      }),
    );
    await user.click(
      screen.getByRole('button', { name: /play micro countries/i }),
    );

    expect(onStartRandom).toHaveBeenCalledWith({
      mode: 'speedrun',
      regionFilter: 'microstates',
      countrySizeFilter: 'mixed',
    });

    expect(screen.getAllByText(/Pick a pool/i).length).toBeGreaterThan(0);
    await user.click(
      screen.getByRole('button', {
        name: /Quick Run 18 countries 18 random countries with lower difficulty\./i,
      }),
    );
    await user.click(
      screen.getByRole('button', { name: /play quick run/i }),
    );

    expect(onStartRandom).toHaveBeenLastCalledWith({
      mode: 'speedrun',
      regionFilter: null,
      countrySizeFilter: 'small',
    });
  });
});
