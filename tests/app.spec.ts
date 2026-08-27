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

test('rejects a poisoned JSON import without persisting it or throwing a page error', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.goto('/');
  const poisoned = JSON.stringify({
    format: 'session-layout-capsule', version: 1, exportedAt: '2026-08-27T00:00:00.000Z', layouts: [{
      id: 'invalid-layout', name: 'Poison capsule', description: '', createdAt: '2026-08-27T00:00:00.000Z', updatedAt: '2026-08-27T00:00:00.000Z', items: [{
        id: 'bad-link', kind: 'link', title: 'Broken link', url: 'not a valid URL', detail: '', createdAt: '2026-08-27T00:00:00.000Z'
      }]
    }]
  });
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toMatch(/Layout 1, item 1.*web address/);
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Import JSON' }).click();
  await page.locator('#import-file').setInputFiles({ name: 'poisoned-capsule.json', mimeType: 'application/json', buffer: Buffer.from(poisoned) });
  await expect(page.getByText('Poison capsule')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Your shelf is quiet' })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const url of ['ftp://example.com', 'mailto:stage@example.com', 'file:///tmp/cues.txt', 'javascript:alert(1)']) {
  test(`rejects explicit unsupported launch URL ${url} in the workbench`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Make a capsule' }).click();
    await page.getByLabel('Session name').fill('Protocol guard');
    await page.getByRole('button', { name: 'Open the workbench' }).click();
    await page.getByLabel('Label').fill('Unsafe target');
    await page.getByLabel('Web address').fill(url);
    await page.getByRole('button', { name: 'Add piece' }).click();
    await expect(page.getByRole('alert')).toHaveText('Use an http or https link.');
    await expect(page.getByText('Unsafe target', { exact: true })).toHaveCount(0);
  });
}

test('reopens the cached shell and local state offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => caches.keys())).toContain('capsule-v1.0.3-shell');
  await page.reload();
  await page.waitForLoadState('networkidle');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.getByText('Offline — your saved capsules still work.')).toBeVisible();
});
