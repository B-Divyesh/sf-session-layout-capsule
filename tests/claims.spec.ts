import { expect, test } from '@playwright/test';
import type { Browser, BrowserContext, Page } from '@playwright/test';

async function createRealLayout(page: Page, name: string): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create a layout' }).click();
  await page.getByLabel('Session name').fill(name);
  await page.getByRole('button', { name: 'Create layout' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
}

async function openSampleEditor(page: Page): Promise<void> {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Edit Rooftop visuals rehearsal' }).click();
  await expect(page).toHaveURL('/demo/layout/demo-rooftop-visuals/edit');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rooftop visuals rehearsal');
}

async function openSampleRestore(page: Page): Promise<void> {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(page).toHaveURL('/demo/layout/demo-rooftop-visuals/restore');
  await expect(page.getByRole('checkbox')).toHaveCount(4);
}

async function completeSampleRestore(page: Page): Promise<void> {
  await openSampleRestore(page);
  const checkboxes = page.getByRole('checkbox');
  for (let index = 0; index < 4; index += 1) await checkboxes.nth(index).check();
}

async function newTouchContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ baseURL: 'http://127.0.0.1:4173', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
}

test('@claim:local-data Normal use stores layouts locally and makes no cross-origin requests', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await openSampleEditor(page);
  await page.getByRole('button', { name: 'Move Place the spectrum window earlier' }).click();
  await page.reload();
  const databases = await page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name));
  expect(databases).toContain('demo:session-layout-capsule');
  expect(databases).not.toContain('session-layout-capsule');
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:layout-items Saves and reorders all four layout item types', async ({ page }) => {
  await openSampleEditor(page);
  await expect(page.locator('.piece-card')).toHaveCount(4);
  expect(await page.locator('.piece-copy > p').allTextContents()).toEqual(['Launch link', 'MIDI cue', 'Timer · 2 min', 'Note']);
  await page.getByRole('button', { name: 'Move Place the spectrum window earlier' }).click();
  await page.reload();
  const labels = await page.locator('.piece-card h3').allTextContents();
  expect(labels).toEqual(['Open visual preview', 'Load Launchpad lighting bank', 'Place the spectrum window', 'Warm up the projector']);
});

test('@claim:restore-progress Tracks restore progress against a two-minute target', async ({ page }) => {
  await openSampleRestore(page);
  await expect(page.getByText('Target: under 02:00')).toBeVisible();
  await page.getByRole('button', { name: 'Start 2 min timer' }).click();
  await expect(page.getByRole('button', { name: /01:5[89]/ })).toBeVisible();
  const boxes = await page.getByRole('checkbox').all();
  await boxes[0].check();
  await expect(page.getByText('1 of 4 ready')).toBeVisible();
  for (let index = 1; index < boxes.length; index += 1) await boxes[index].check();
  await expect(page.getByRole('heading', { name: 'Layout restored' })).toBeVisible();
  await expect(page.getByText(/All items were marked ready in 00:/)).toBeVisible();
});

test('@claim:qr-handoff Creates a printable QR and imports its local handoff link', async ({ page, context, browser }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.addInitScript(() => { window.print = () => sessionStorage.setItem('print-called', 'yes'); });
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Print or share Rooftop visuals rehearsal' }).click();
  const qr = page.getByRole('img', { name: 'QR code containing the Rooftop visuals rehearsal layout' });
  await expect(qr).toHaveAttribute('src', /^data:image\/png;base64,/);
  expect(await qr.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(640);
  await page.getByRole('button', { name: 'Print QR handoff' }).click();
  expect(await page.evaluate(() => sessionStorage.getItem('print-called'))).toBe('yes');
  await page.getByRole('button', { name: 'Copy handoff link' }).click();
  const handoff = await page.evaluate(() => navigator.clipboard.readText());
  expect(handoff).toContain('/demo?capsule=');
  const receiver = await browser.newContext({ baseURL: 'http://127.0.0.1:4173' });
  const receiverPage = await receiver.newPage();
  await receiverPage.goto(handoff);
  await expect(receiverPage.getByText('Rooftop visuals rehearsal (shared)', { exact: true })).toBeVisible();
  await receiver.close();
});

test('@claim:json-backup Exports versioned JSON and imports it after reset', async ({ page }) => {
  await page.goto('/demo');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete Rooftop visuals rehearsal' }).click();
  await page.getByRole('button', { name: 'Create your first layout' }).click();
  await page.getByLabel('Session name').fill('JSON backup proof');
  await page.getByRole('button', { name: 'Create layout' }).click();
  await page.getByRole('link', { name: 'Saved layouts' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all as JSON' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const exported = JSON.parse(await (await import('node:fs/promises')).readFile(path!, 'utf8')) as { format: string; version: number; layouts: Array<{ name: string }> };
  expect(exported).toMatchObject({ format: 'session-layout-capsule', version: 1 });
  expect(exported.layouts.map((layout) => layout.name)).toContain('JSON backup proof');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('JSON backup proof', { exact: true })).toHaveCount(0);
  await page.locator('#import-file').setInputFiles(path!);
  await expect(page.getByText('JSON backup proof', { exact: true })).toBeVisible();
});

test('@claim:session-persistence Keeps saved changes across reloads and a new tab', async ({ page, context }) => {
  await openSampleEditor(page);
  await page.getByRole('button', { name: 'Edit name and note' }).click();
  await page.getByLabel('Session name').fill('Persistent rehearsal layout');
  await page.getByRole('button', { name: 'Save details' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Persistent rehearsal layout');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Persistent rehearsal layout' })).toBeVisible();
  const secondPage = await context.newPage();
  await secondPage.goto('/demo');
  await expect(secondPage.getByText('Persistent rehearsal layout', { exact: true })).toBeVisible();
});

test('@claim:installable-pwa Meets Chromium installability checks', async ({ page }) => {
  await page.goto('/demo');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  const session = await page.context().newCDPSession(page);
  await session.send('Page.enable');
  const manifest = await session.send('Page.getAppManifest') as { data?: string };
  expect(JSON.parse(manifest.data || '{}')).toMatchObject({ display: 'standalone', name: 'Session Layout Capsule' });
  const result = await session.send('Page.getInstallabilityErrors') as { installabilityErrors: unknown[] };
  expect(result.installabilityErrors).toEqual([]);
});

test('@claim:offline-reload Opens the populated demo offline after the first visit', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173' });
  const page = await context.newPage();
  await page.goto('/demo');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Rooftop visuals rehearsal', { exact: true })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.getByText('Offline — saved layouts are available.')).toBeVisible();
  await context.close();
});

test('@claim:recovery-states Explains empty, invalid, and storage recovery paths', async ({ page, browser }) => {
  await openSampleEditor(page);
  await page.getByLabel('Label').fill('Broken link');
  await page.getByLabel('Web address').fill('http://');
  await page.getByRole('button', { name: 'Add item' }).click();
  await expect(page.getByRole('alert')).toHaveText('Enter a complete http or https web address.');
  await page.getByRole('link', { name: 'Saved layouts' }).click();
  await page.locator('#import-file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.getByRole('alert')).toContainText('Choose a Session Layout Capsule JSON export.');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete Rooftop visuals rehearsal' }).click();
  await expect(page.getByRole('heading', { name: 'No saved layouts' })).toBeVisible();

  const blocked = await browser.newContext({ baseURL: 'http://127.0.0.1:4173' });
  await blocked.addInitScript(() => { IDBFactory.prototype.open = function (): IDBOpenDBRequest { throw new Error('Storage blocked.'); }; });
  const blockedPage = await blocked.newPage();
  await blockedPage.goto('/demo');
  await expect(blockedPage.getByRole('heading', { name: 'Your saved layouts could not be opened' })).toBeVisible();
  await expect(blockedPage.getByRole('button', { name: 'Try again' })).toBeVisible();
  await blocked.close();
});

test('@claim:keyboard-touch Completes key actions with a keyboard and touch at 390 px', async ({ browser }) => {
  const context = await newTouchContext(browser);
  const page = await context.newPage();
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  const sampleAction = page.getByRole('link', { name: 'Try it with sample data' });
  await sampleAction.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/demo');
  const edit = page.getByRole('button', { name: 'Edit Rooftop visuals rehearsal' });
  await edit.scrollIntoViewIfNeeded();
  const box = await edit.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await edit.tap();
  await expect(page).toHaveURL('/demo/layout/demo-rooftop-visuals/edit');
  await page.getByRole('radio', { name: 'Launch link' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: 'MIDI cue' })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await context.close();
});

test('@claim:demo-isolation Keeps sample edits out of real layouts and resets the sample', async ({ page }) => {
  await createRealLayout(page, 'Do not change this layout');
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await page.getByRole('button', { name: 'Edit Rooftop visuals rehearsal' }).click();
  await expect(page).toHaveURL('/demo/layout/demo-rooftop-visuals/edit');
  await page.getByRole('button', { name: 'Edit name and note' }).click();
  await page.getByLabel('Session name').fill('Temporary sample edit');
  await page.getByRole('button', { name: 'Save details' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Temporary sample edit');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('Temporary sample edit', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Rooftop visuals rehearsal', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page.getByText('Do not change this layout', { exact: true })).toBeVisible();
  await expect(page.getByText('Rooftop visuals rehearsal', { exact: true })).toHaveCount(0);
});

test('@claim:free-core Completes the restore workflow without an account or payment', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await completeSampleRestore(page);
  await expect(page.getByRole('heading', { name: 'Layout restored' })).toBeVisible();
  await page.getByRole('button', { name: 'Finish restore' }).click();
  await expect(page.getByText('Restore checklist completed.')).toBeVisible();
  expect(requests.some((url) => /login|checkout|billing|payment/i.test(url))).toBe(false);
});
