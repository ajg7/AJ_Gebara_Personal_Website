import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.describe('placeholder homepage', () => {
  test('serves HTML with charset, viewport, title and description', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('text/html');
    await expect(page.locator('meta[charset]')).toHaveAttribute('charset', /utf-8/i);
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
    await expect(page).toHaveTitle('AJ Gebara');
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description?.trim().length ?? 0).toBeGreaterThan(0);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('loads Tailwind through global.css', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toHaveCSS('margin-top', '0px');
    const bodyFont = await page.locator('body').evaluate((el) => getComputedStyle(el).fontSize);
    await expect(h1).toHaveCSS('font-size', bodyFont);
  });

  test('loads with no console errors or failed requests', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('requestfailed', (req) => errors.push(`failed: ${req.url()}`));
    page.on('response', (res) => res.status() >= 400 && errors.push(`${res.status()}: ${res.url()}`));
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(errors).toEqual([]);
  });

  test('has no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('every image has alt text', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('img:not([alt])')).toHaveCount(0);
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`passes axe in ${colorScheme} color scheme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/');
      const results = await new AxeBuilder({ page }).withTags(axeTags).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe('routing', () => {
  test('unknown routes return 404', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist/');
    expect(response?.status()).toBe(404);
  });

  test('build writes the homepage to dist/index.html', () => {
    expect(existsSync('dist/index.html')).toBe(true);
  });
});
