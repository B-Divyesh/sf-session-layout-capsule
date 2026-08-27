import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('creates a capsule and completes the restore checklist', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Put every side tool back in its place.');
  await page.getByRole('button', { name: 'Make a capsule' }).click();
  await page.getByLabel('Session name').fill('Rooftop visuals');
  await page.getByLabel('What is it for? (optional)').fill('Friday performance setup');
  await page.getByRole('button', { name: 'Open the workbench' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rooftop visuals');

  await page.getByLabel('Label').fill('Projection controls');
  await page.getByLabel('Web address').fill('example.com/controls');
  await page.getByLabel('Setup detail (optional)').fill('Place on the right display');
  await page.getByRole('button', { name: 'Add piece' }).click();
  await expect(page.getByText('Projection controls')).toBeVisible();

  await page.getByRole('button', { name: 'Start restore' }).click();
  await page.getByText('Mark ready').click();
  await expect(page.getByRole('heading', { name: 'The stage is ready' })).toBeVisible();
  await page.getByRole('button', { name: 'Finish restore' }).click();
  await expect(page.getByRole('heading', { name: 'Rooftop visuals', exact: true })).toBeVisible();
});

test('has no serious accessibility violations on the empty shelf', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).exclude('.hero-art').analyze();
  const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
  expect(serious).toEqual([]);
});

test('reopens the cached shell and local state offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.getByText('Offline — your saved capsules still work.')).toBeVisible();
});
