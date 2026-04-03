import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { HowToPlayDialog } from './HowToPlayDialog';
import { IntroDialog } from './IntroDialog';

const { showModalMock } = vi.hoisted(() => ({
  showModalMock: vi.fn(),
}));

vi.mock('@ebay/nice-modal-react', () => ({
  __esModule: true,
  default: {
    create: <T,>(component: T) => component,
    Provider: ({ children }: { children: ReactNode }) => children,
    show: showModalMock,
  },
  create: <T,>(component: T) => component,
  useModal: () => ({
    hide: () => Promise.resolve(),
    visible: true,
  }),
}));

describe('IntroDialog', () => {
  beforeEach(() => {
    cleanup();
    showModalMock.mockReset();
  });

  it('opens the how to play popup from the intro header', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <IntroDialog
        categoryCounts={{
          africa: 54,
          asia: 48,
          caribbean: 13,
          europe: 44,
          islandNations: 22,
          microstates: 6,
          middleEast: 14,
          northAmerica: 23,
          oceania: 14,
          southAmerica: 12,
        }}
        id="intro-dialog"
        counts={{ large: 12, mixed: 60, small: 18 }}
        dailyResult={null}
        onStartDaily={vi.fn()}
        onStartRandom={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /how to play/i }));

    expect(showModalMock).toHaveBeenCalledWith(HowToPlayDialog);
  });

  it('shows a separate daily challenge panel and locks it when complete', () => {
    renderWithProviders(
      <IntroDialog
        categoryCounts={{
          africa: 54,
          asia: 48,
          caribbean: 13,
          europe: 44,
          islandNations: 22,
          microstates: 6,
          middleEast: 14,
          northAmerica: 23,
          oceania: 14,
          southAmerica: 12,
        }}
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

    expect(screen.getByText(/^Daily Challenge$/i)).toBeVisible();
    expect(screen.getByText(/^Completed$/i)).toBeVisible();
    expect(screen.getByText(/^4\/5$/i)).toBeVisible();
    expect(screen.getByText(/Completed for today/i)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /play today's daily/i }),
    ).not.toBeInTheDocument();
  });

  it('treats size and category as a single pool selector', async () => {
    const user = userEvent.setup();
    const onStartRandom = vi.fn();

    renderWithProviders(
      <IntroDialog
        categoryCounts={{
          africa: 54,
          asia: 48,
          caribbean: 13,
          europe: 44,
          islandNations: 22,
          microstates: 6,
          middleEast: 14,
          northAmerica: 23,
          oceania: 14,
          southAmerica: 12,
        }}
        id="intro-dialog"
        counts={{ large: 12, mixed: 60, small: 18 }}
        dailyResult={null}
        onStartDaily={vi.fn()}
        onStartRandom={onStartRandom}
      />,
    );

    await user.click(
      screen.getByRole('button', {
        name: /^Capitals$/i,
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: /Micro Countries 6 countries Category pool Tiny targets and high-precision geography\./i,
      }),
    );
    await user.click(
      screen.getByRole('button', { name: /start micro countries/i }),
    );

    expect(onStartRandom).toHaveBeenCalledWith({
      mode: 'capitals',
      regionFilter: 'microstates',
      countrySizeFilter: 'mixed',
    });

    expect(screen.getAllByText(/Country Dash/i).length).toBeGreaterThan(0);
    await user.click(
      screen.getByRole('button', {
        name: /Quick Run 18 countries 18 countries with lower difficulty\./i,
      }),
    );
    await user.click(
      screen.getByRole('button', { name: /start quick run/i }),
    );

    expect(onStartRandom).toHaveBeenLastCalledWith({
      mode: 'capitals',
      regionFilter: null,
      countrySizeFilter: 'small',
    });
  });
});
