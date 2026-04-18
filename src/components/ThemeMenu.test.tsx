import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Menu } from './Menu';

describe('ThemeMenu', () => {
  afterEach(() => {
    cleanup();
    document.documentElement.dir = 'ltr';
  });

  it('supports keyboard activation for menu actions', async () => {
    const user = userEvent.setup();
    const onAbout = vi.fn();
    const onQuit = vi.fn();
    const onRefocus = vi.fn();
    const onRestart = vi.fn();

    renderWithProviders(
      <Menu
        onAbout={onAbout}
        onQuit={onQuit}
        onRefocus={onRefocus}
        onRestart={onRestart}
      />,
    );

    const menuTrigger = screen.getByRole('button', { name: /^menu$/i });
    await user.click(menuTrigger);
    const refocusButton = screen.getByRole('menuitem', {
      name: /refocus country/i,
    });
    refocusButton.focus();
    await user.keyboard('{Enter}');

    expect(onRefocus).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /^menu$/i }));
    await user.click(screen.getByRole('menuitem', { name: /^about$/i }));

    expect(onAbout).toHaveBeenCalledTimes(1);
  });

  it('keeps menu and language controls functional in RTL', async () => {
    const user = userEvent.setup();
    const onAbout = vi.fn();
    const onQuit = vi.fn();
    const onRefocus = vi.fn();
    const onRestart = vi.fn();
    document.documentElement.dir = 'rtl';

    renderWithProviders(
      <Menu
        onAbout={onAbout}
        onQuit={onQuit}
        onRefocus={onRefocus}
        onRestart={onRestart}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^menu$/i }));
    await user.click(screen.getByRole('menuitem', { name: /^retry$/i }));

    expect(onRestart).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /^menu$/i }));
    await user.click(screen.getByRole('menuitem', { name: /^quit$/i }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /^quit$/i,
      }),
    );

    expect(onQuit).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^menu$/i }));
    await user.click(
      screen.getByRole('menuitem', { name: /select language/i }),
    );
    expect(
      await screen.findByRole('dialog', { name: /select language/i }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: /english/i })).toBeVisible();
  });
});
