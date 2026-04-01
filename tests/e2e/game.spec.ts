import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText(value: string) {
          localStorage.setItem('copied-share-text', value);
          return Promise.resolve();
        },
      },
    });
  });
});

test('starts a random run and accepts a typed incorrect answer', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /Start Standard Run/i }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Start Standard Run/i }).click();
  await expect(page.getByText(/Guess the highlighted country/i)).toBeVisible();

  const input = page.getByRole('combobox', { name: /Guess the country/i });
  await input.fill('Atlantis');
  await input.press('Enter');

  await expect(page.getByRole('alert')).toContainText('Incorrect');
  await expect(page.getByText(/You guessed: Atlantis/i)).toBeVisible();
});

test('completes the daily challenge once and then locks it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Play today's daily/i }).click();

  for (let round = 0; round < 5; round += 1) {
    const input = page.getByRole('combobox', { name: /Guess the country/i });
    await input.fill(`Atlantis ${round}`);
    await input.press('Enter');

    const advance = page
      .getByRole('button', { name: /Next|Finish/i })
      .last();
    await advance.click();
  }

  await expect(page.getByRole('button', { name: /Main menu/i })).toBeVisible();
  await page.getByRole('button', { name: /Copy results/i }).click();
  await expect(page.getByRole('button', { name: /Copied/i })).toBeVisible();
  await expect
    .poll(async () => page.evaluate(() => window.localStorage.getItem('copied-share-text')))
    .toContain('🧭 Country Guesser Daily');
  await page.getByRole('button', { name: /Main menu/i }).click();
  await expect(page.getByText(/Completed for today\./i)).toBeVisible();
});
