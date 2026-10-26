import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home page renders and is accessible', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect((await page.title()).trim()).not.toBe('');
  await expect(page.locator('h1')).toHaveCount(1);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
