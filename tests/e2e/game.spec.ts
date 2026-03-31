import { expect, test } from '@playwright/test';

test('loads the game and starts a round', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Start/i })).toBeVisible();
  await page.getByRole('button', { name: /^Start$/i }).click();
  await expect(page.getByText(/Guess the highlighted country/i)).toBeVisible();
});
