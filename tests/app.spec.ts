import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function openEditor(page: import('@playwright/test').Page, name = 'Rooftop visuals'): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a layout' }).click();
  await page.getByLabel('Session name').fill(name);
  await page.getByLabel('What is it for? (optional)').fill('Friday performance setup');
  await page.getByRole('button', { name: 'Create layout' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
}

async function addItem(page: import('@playwright/test').Page, kind: 'Launch link' | 'MIDI cue' | 'Timer' | 'Note', title: string): Promise<void> {
  await page.getByRole('radio', { name: kind }).check();
  await page.getByLabel('Label').fill(title);
  if (kind === 'Launch link') await page.getByLabel('Web address').fill('example.com/controls');
  if (kind === 'Timer') await page.getByLabel('Minutes').fill('2');
  await page.getByLabel('Setup detail (optional)').fill('Place it on the right display.');
  await page.getByRole('button', { name: 'Add item' }).click();
}

test('creates all item types and completes the restore checklist', async ({ page }) => {
  await openEditor(page);
  await expect(page).toHaveURL(/\/layout\/[^/]+\/edit$/);
  await expect(page).toHaveTitle('Edit layout — Session Layout Capsule');

  await addItem(page, 'Launch link', 'Projection controls');
  await addItem(page, 'MIDI cue', 'Launchpad bank C');
  await addItem(page, 'Timer', 'Projector warm-up');
  await addItem(page, 'Note', 'Place spectrum window');

  await page.getByRole('button', { name: 'Start restore' }).click();
  await expect(page).toHaveURL(/\/restore$/);
  for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
  await expect(page.getByRole('heading', { name: 'Layout restored' })).toBeVisible();
  await page.getByRole('button', { name: 'Finish restore' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Rooftop visuals', exact: true })).toBeVisible();
});

test('keeps demo changes separate and resets them before real use', async ({ page }) => {
  await openEditor(page, 'Real layout marker');
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await page.getByRole('button', { name: 'Edit Rooftop visuals rehearsal' }).click();
  await page.getByRole('button', { name: 'Edit name and note' }).click();
  await page.getByLabel('Session name').fill('Changed demo layout');
  await page.getByRole('button', { name: 'Save details' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Changed demo layout');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('Rooftop visuals rehearsal', { exact: true })).toBeVisible();
  await expect(page.getByText('Changed demo layout', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Real layout marker', { exact: true })).toBeVisible();
  await expect(page.getByText('Rooftop visuals rehearsal', { exact: true })).toHaveCount(0);
});

test('uses URL routes, titles, history, focus, and announcements', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Edit Rooftop visuals rehearsal' }).click();
  await expect(page).toHaveURL('/demo/layout/demo-rooftop-visuals/edit');
  await expect(page).toHaveTitle('Edit layout — Session Layout Capsule');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.locator('#route-status')).toContainText('Rooftop visuals rehearsal loaded');
  await page.getByRole('button', { name: 'Start restore' }).click();
  await expect(page).toHaveURL('/demo/layout/demo-rooftop-visuals/restore');
  await expect(page).toHaveTitle('Restore layout — Session Layout Capsule');
  await page.goBack();
  await expect(page).toHaveURL('/demo/layout/demo-rooftop-visuals/edit');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});

test('shows a designed recovery page for unknown routes', async ({ page }) => {
  await page.goto('/definitely-missing');
  await expect(page).toHaveTitle('Page not found — Session Layout Capsule');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This layout page does not exist');
  await expect(page.getByRole('link', { name: 'Open saved layouts' })).toBeVisible();
});

test('shows a plain recovery message for malformed JSON', async ({ page }) => {
  await page.goto('/');
  await page.locator('#import-file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.getByRole('alert')).toHaveText('That file is not valid JSON. Choose a Session Layout Capsule JSON export.');
  await expect(page.getByRole('heading', { name: 'No saved layouts' })).toBeVisible();
});

test('rejects a poisoned JSON import without persisting it or throwing a page error', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.goto('/');
  const poisoned = JSON.stringify({
    format: 'session-layout-capsule', version: 1, exportedAt: '2026-08-27T00:00:00.000Z', layouts: [{
      id: 'invalid-layout', name: 'Poison layout', description: '', createdAt: '2026-08-27T00:00:00.000Z', updatedAt: '2026-08-27T00:00:00.000Z', items: [{
        id: 'bad-link', kind: 'link', title: 'Broken link', url: 'not a valid URL', detail: '', createdAt: '2026-08-27T00:00:00.000Z'
      }]
    }]
  });
  await page.locator('#import-file').setInputFiles({ name: 'poisoned.json', mimeType: 'application/json', buffer: Buffer.from(poisoned) });
  await expect(page.getByRole('alert')).toContainText('Layout 1, item 1 web address');
  await expect(page.getByText('Poison layout')).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const url of ['ftp://example.com', 'mailto:stage@example.com', 'file:///tmp/cues.txt', 'javascript:alert(1)']) {
  test(`rejects explicit unsupported launch URL ${url}`, async ({ page }) => {
    await openEditor(page, 'Protocol guard');
    await page.getByLabel('Label').fill('Unsafe target');
    await page.getByLabel('Web address').fill(url);
    await page.getByRole('button', { name: 'Add item' }).click();
    await expect(page.getByRole('alert')).toHaveText('Use an http or https link.');
    await expect(page.getByText('Unsafe target', { exact: true })).toHaveCount(0);
  });
}

test('shows a usable storage recovery screen', async ({ page }) => {
  await page.addInitScript(() => {
    IDBFactory.prototype.open = function (): IDBOpenDBRequest { throw new Error('Storage was blocked for this test.'); };
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your saved layouts could not be opened' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});

test('manages dialog focus and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a layout' }).click();
  await expect(page.getByLabel('Session name')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Create a layout' })).toBeFocused();
  const duration = await page.getByRole('button', { name: 'Create a layout' }).evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.001);
});

for (const path of ['/', '/demo', '/privacy/', '/terms/', '/offline.html', '/404.html']) {
  test(`has no serious accessibility violations at ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);
  });
}
