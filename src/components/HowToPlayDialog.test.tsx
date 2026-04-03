import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { HowToPlayDialog } from './HowToPlayDialog';

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

describe('HowToPlayDialog', () => {
  it('explains what the game is and how to play', () => {
    renderWithProviders(<HowToPlayDialog id="how-to-play-dialog" />);

    expect(
      screen.getByRole('heading', { name: /^Country Dash$/i }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: /^What the game is$/i }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: /^How to play$/i }),
    ).toBeVisible();
    expect(screen.getByRole('heading', { name: /^Modes$/i })).toBeVisible();
    expect(
      screen.getByText(/Identify the highlighted country on the globe/i),
    ).toBeVisible();
  });
});
