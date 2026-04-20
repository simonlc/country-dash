import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Menu } from './Menu';

describe('ThemeMenu', () => {
  afterEach(() => {
    cleanup();
    document.documentElement.dir = 'ltr';
  });

  it('supports keyboard activation for menu actions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Menu />);

    const menuTrigger = screen.getByRole('button', { name: /^menu$/i });
    await user.click(menuTrigger);
    const refocusButton = await screen.findByRole('menuitem', {
      name: /refocus country/i,
    });
    refocusButton.focus();
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(
        screen.queryByRole('menuitem', { name: /refocus country/i }),
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^menu$/i }));
    await user.click(await screen.findByRole('menuitem', { name: /^about$/i }));
    expect(await screen.findByRole('dialog')).toBeVisible();
  });

  it('keeps menu and language controls functional in RTL', async () => {
    const user = userEvent.setup();
    document.documentElement.dir = 'rtl';

    renderWithProviders(<Menu />);

    await user.click(screen.getByRole('button', { name: /^menu$/i }));
    await user.click(await screen.findByRole('menuitem', { name: /^retry$/i }));
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: /^retry$/i })).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^menu$/i }));
    await user.click(await screen.findByRole('menuitem', { name: /^quit$/i }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /^quit$/i,
      }),
    );
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^menu$/i }));
    await user.click(
      await screen.findByRole('menuitem', { name: /select language/i }),
    );
    expect(
      await screen.findByRole('dialog', { name: /select language/i }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: /english/i })).toBeVisible();
  });
});
