import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameHud } from '@/components/GameHud';
import { renderWithProviders } from '@/test/render';

describe('GameHud', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the full desktop HUD by default', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: query.includes('pointer: coarse') ? false : false,
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    );

    renderWithProviders(<GameHud />);

    expect(screen.getByText('Country Dash')).toBeVisible();
    expect(screen.getByText('0:00:00')).toBeVisible();
  });

  it('renders the compact mobile HUD on narrow viewports', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: query.includes('max-width: 899.95px'),
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    );

    renderWithProviders(<GameHud />);

    await waitFor(() => {
      expect(screen.queryByText('Country Dash')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('0:00:00')).not.toBeInTheDocument();
    expect(screen.getByText('1/0')).toBeVisible();
    expect(screen.getByLabelText(/^miss:/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /^menu$/i })).toBeVisible();
  });
});
