import QRCode from 'qrcode';
import './styles.css';
import { clearLayouts, deleteLayout, listLayouts, replaceLayouts, saveLayout, useDemoStorage } from './db';
import { createItem, createLayout, decodeLayout, encodeLayout, formatClock, formatDate, kindLabels, moveItem, validateImport } from './model';
import type { CapsuleExport, ItemKind, Layout, SessionItem } from './types';

type View = 'library' | 'edit' | 'restore' | 'not-found';

const root = document.querySelector<HTMLDivElement>('#app')!;
const isDemo = location.pathname === '/demo' || location.pathname.startsWith('/demo/');
const routeBase = isDemo ? '/demo' : '';
const BUILD_ID = 'v1.1.0';

let layouts: Layout[] = [];
let active: Layout | null = null;
let view: View = 'library';
let completed = new Set<string>();
let restoreStarted = 0;
let elapsedSeconds = 0;
let elapsedInterval = 0;
let timerInterval = 0;
const timers = new Map<string, number>();
let editingItemId: string | null = null;
let noticeTimer = 0;

useDemoStorage(isDemo);

const escapeHtml = (value: string): string => value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
const itemIcon = (kind: ItemKind): string => ({ link: '↗', midi: '⌁', timer: '◷', note: '≡' })[kind];
const appPath = (layout: Layout, target: 'edit' | 'restore'): string => `${routeBase}/layout/${encodeURIComponent(layout.id)}/${target}`;

function sampleLayout(): Layout {
  return {
    id: 'demo-rooftop-visuals',
    name: 'Rooftop visuals rehearsal',
    description: 'Browser, controller, projector, and placement checks for Friday night.',
    createdAt: '2026-09-06T12:00:00.000Z',
    updatedAt: '2026-09-06T12:00:00.000Z',
    items: [
      { id: 'demo-link', kind: 'link', title: 'Open visual preview', detail: 'Put the preview on the right display.', url: 'https://example.com/visual-preview', createdAt: '2026-09-06T12:00:00.000Z' },
      { id: 'demo-midi', kind: 'midi', title: 'Load Launchpad lighting bank', detail: 'Channel 10 · Bank C · blue confirmation pad', createdAt: '2026-09-06T12:01:00.000Z' },
      { id: 'demo-timer', kind: 'timer', title: 'Warm up the projector', detail: 'Check focus when the timer ends.', duration: 2, createdAt: '2026-09-06T12:02:00.000Z' },
      { id: 'demo-note', kind: 'note', title: 'Place the spectrum window', detail: 'Upper-left corner at half width. Keep the chat panel visible.', createdAt: '2026-09-06T12:03:00.000Z' }
    ]
  };
}

function shell(content: string): void {
  const homeHref = isDemo ? '/demo' : '/';
  root.innerHTML = `
    <header class="site-header">
      <a class="brand-link" href="${homeHref}" data-route>
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>Session Layout Capsule</span>
      </a>
      <nav class="site-nav" aria-label="Main navigation">
        <a href="/" ${isDemo ? 'data-leave-demo' : 'aria-current="page"'}>Home</a>
        <a href="/demo" ${isDemo ? 'aria-current="page" data-route' : ''}>Demo</a>
        <a href="/privacy/" ${isDemo ? 'data-leave-demo' : ''}>Privacy</a>
      </nav>
    </header>
    ${isDemo ? `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved</strong><div><button data-action="reset-demo">Reset demo</button><button data-action="start-real">Start for real</button></div></aside>` : ''}
    <div id="offline-banner" class="offline-banner" role="status" ${navigator.onLine ? 'hidden' : ''}>Offline — saved layouts are available.</div>
    <main id="main">${content}</main>
    <footer>
      <p>Restore links, MIDI cues, timers, and notes from one local checklist.</p>
      <nav aria-label="Footer navigation"><a href="/privacy/" ${isDemo ? 'data-leave-demo' : ''}>Privacy</a><a href="/terms/" ${isDemo ? 'data-leave-demo' : ''}>Terms</a></nav>
      <p><a href="https://sociobot.in" rel="external">Built by Param Factory</a> · ${BUILD_ID}</p>
      <p>Paper-cut artwork was generated for this product.</p>
    </footer>
    <div class="route-status" id="route-status" role="status" aria-live="polite"></div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <div class="update-toast" id="update-toast" hidden><span>An update is ready.</span><button data-action="update">Update now</button></div>`;
  bindGlobal();
}

function bindGlobal(): void {
  root.querySelectorAll<HTMLAnchorElement>('[data-route]').forEach((link) => link.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void navigate(link.pathname);
  }));
  root.querySelectorAll<HTMLAnchorElement>('[data-leave-demo]').forEach((link) => link.addEventListener('click', async (event) => {
    event.preventDefault();
    await clearLayouts();
    location.href = link.pathname === '/' ? `/?mode=real&session=${crypto.randomUUID()}` : link.href;
  }));
  root.querySelector('[data-action="update"]')?.addEventListener('click', () => location.reload());
  root.querySelector('[data-action="retry"]')?.addEventListener('click', () => location.reload());
  root.querySelector('[data-action="reset-demo"]')?.addEventListener('click', async () => {
    await replaceLayouts([sampleLayout()]);
    await navigate('/demo', true);
    showNotice('Sample data reset.');
  });
  root.querySelector('[data-action="start-real"]')?.addEventListener('click', async () => {
    await clearLayouts();
    location.href = `/?mode=real&session=${crypto.randomUUID()}`;
  });
}

function setRouteMeta(title: string, canonicalPath: string): void {
  document.title = title;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `${location.origin}${canonicalPath}`);
}

function announceRoute(): void {
  const heading = root.querySelector<HTMLElement>('h1');
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
  const status = root.querySelector<HTMLElement>('#route-status');
  if (status) status.textContent = `${heading.textContent || 'Page'} loaded`;
}

async function navigate(path: string, replace = false): Promise<void> {
  if (replace) history.replaceState({}, '', path);
  else history.pushState({}, '', path);
  await renderRoute(true);
}

function showNotice(message: string): void {
  const toast = document.querySelector<HTMLElement>('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => toast.classList.remove('show'), 2800);
}

function landingSections(): string {
  return `
    <section class="how-it-works" aria-labelledby="how-title">
      <p class="eyebrow">How it works</p>
      <h2 id="how-title">Restore a session in three steps</h2>
      <ol>
        <li><strong>Save the setup.</strong><span>Add each link, MIDI cue, timer, and note in order.</span></li>
        <li><strong>Open the checklist.</strong><span>Use the saved order when you return to the project.</span></li>
        <li><strong>Mark each item ready.</strong><span>The timer and progress count show what remains.</span></li>
      </ol>
    </section>
    <section class="limits" aria-labelledby="limits-title">
      <div><p class="eyebrow">Browser limits and privacy</p><h2 id="limits-title">You place windows and connect hardware</h2></div>
      <div><p>The app opens web links and records your setup instructions. It cannot move desktop windows or configure MIDI hardware.</p><p>Layouts stay in this browser. Export JSON when you need a backup.</p></div>
    </section>`;
}

function libraryView(): void {
  view = 'library';
  active = null;
  stopClocks();
  shell(`
    <section class="hero ${isDemo ? 'demo-hero' : ''}" aria-labelledby="page-title">
      <div class="hero-copy">
        <p class="eyebrow">${isDemo ? 'Sample rehearsal setup' : 'Local restore checklist'}</p>
        <h1 id="page-title">${isDemo ? 'Restore a sample creative session layout' : 'Save and restore your creative session layout'}</h1>
        <p class="lede">${isDemo ? 'A complete four-item setup is ready. Try restore, edit the order, or print its QR handoff.' : "Home producers and live visualists reopen each project's side tools as a clear setup checklist."}</p>
        ${isDemo ? '<p class="next-step">Choose <strong>Restore</strong> on the sample layout below.</p>' : `
        <div class="hero-actions">
          <a class="button primary" href="/demo">Try it with sample data</a>
          <button class="button secondary" data-action="new">Create a layout</button>
          <button class="text-button" data-action="import">Import JSON</button>
          <input id="import-file" type="file" accept="application/json,.json" hidden />
        </div>
        <p class="next-step">The sample opens a filled rehearsal checklist. It does not change your layouts.</p>
        <ul class="plain-facts" aria-label="Product facts"><li>Free to use.</li><li>Stored in this browser.</li><li>Works offline after your first visit.</li></ul>
        <p class="form-error import-error" id="import-error" role="alert"></p>`}
      </div>
      <figure class="hero-art paper-frame">
        <picture>
          <source srcset="/assets/session-diorama.avif" type="image/avif" />
          <source srcset="/assets/session-diorama.webp" type="image/webp" />
          <img src="/assets/session-diorama.png" width="900" height="600" fetchpriority="high" decoding="async" alt="Cut-paper cards represent a link, MIDI cue, timer, and setup note." />
        </picture>
        <figcaption>The layout keeps four setup item types in one order.</figcaption>
      </figure>
    </section>
    <section class="library" aria-labelledby="library-title">
      <div class="section-heading">
        <div><p class="eyebrow">${isDemo ? 'Sample data' : 'Your data'}</p><h2 id="library-title">Saved layouts</h2></div>
        ${!isDemo && layouts.length ? '<div class="section-heading-actions"><button class="text-button" data-action="export-all">Export all as JSON <span aria-hidden="true">↓</span></button></div>' : ''}
      </div>
      ${renderLayoutList()}
      ${isDemo ? `<div class="demo-data-actions"><button class="text-button" data-action="import">Import JSON</button><input id="import-file" type="file" accept="application/json,.json" hidden />${layouts.length ? '<button class="text-button" data-action="export-all">Export all as JSON <span aria-hidden="true">↓</span></button>' : ''}</div><p class="form-error import-error" id="import-error" role="alert"></p>` : ''}
    </section>
    ${isDemo ? '' : landingSections()}
    ${newLayoutDialog()}`);
  setRouteMeta(isDemo ? 'Demo — Session Layout Capsule' : 'Session Layout Capsule — Save and restore layouts', isDemo ? '/demo' : '/');
  bindLibrary();
}

function renderLayoutList(): string {
  if (!layouts.length) return `
    <div class="empty-state">
      <div class="empty-stack" aria-hidden="true"><i></i><i></i><i>＋</i></div>
      <div><h3>No saved layouts</h3><p>Your links, MIDI cues, timers, and notes will appear here after you create a layout.</p><button class="button secondary" data-action="new">Create your first layout</button></div>
    </div>`;
  return `<ul class="layout-grid">${layouts.map((layout, index) => `
    <li class="layout-card" style="--card-index:${index}">
      <div class="registration-tab" aria-hidden="true"></div>
      <p class="card-count">${layout.items.length} ${layout.items.length === 1 ? 'item' : 'items'}</p>
      <h3>${escapeHtml(layout.name)}</h3>
      <p>${escapeHtml(layout.description || 'No layout note added.')}</p>
      <div class="kind-row" aria-label="Contents">${(['link','midi','timer','note'] as ItemKind[]).map((kind) => {
        const count = layout.items.filter((item) => item.kind === kind).length;
        return count ? `<span title="${kindLabels[kind]}">${itemIcon(kind)} ${count}</span>` : '';
      }).join('')}</div>
      <p class="updated">Edited ${formatDate(layout.updatedAt)}</p>
      <div class="card-actions">
        <button class="button primary compact" data-action="restore" data-id="${layout.id}" ${layout.items.length ? '' : 'disabled'}>Restore</button>
        <button class="icon-button" data-action="edit" data-id="${layout.id}" aria-label="Edit ${escapeHtml(layout.name)}">✎</button>
        <button class="icon-button" data-action="share" data-id="${layout.id}" aria-label="Print or share ${escapeHtml(layout.name)}">⌁</button>
        <button class="icon-button danger-icon" data-action="delete" data-id="${layout.id}" aria-label="Delete ${escapeHtml(layout.name)}">×</button>
      </div>
    </li>`).join('')}</ul>`;
}

function newLayoutDialog(): string {
  return `<dialog id="new-dialog" aria-labelledby="new-title">
    <form id="new-form" method="dialog" class="dialog-sheet">
      <button class="dialog-close" type="button" data-action="cancel-new" aria-label="Close">×</button>
      <p class="eyebrow">New layout</p><h2 id="new-title">Name this layout</h2>
      <label>Session name<input name="name" required maxlength="60" autocomplete="off" placeholder="Friday rooftop set" /></label>
      <label>What is it for? <span>(optional)</span><textarea name="description" maxlength="180" rows="3" placeholder="The visual and cue setup for the live set"></textarea></label>
      <div class="dialog-actions"><button class="button secondary" type="button" data-action="cancel-new">Cancel</button><button class="button primary" type="submit">Create layout</button></div>
    </form>
  </dialog>`;
}

function bindLibrary(): void {
  root.querySelectorAll('[data-action="new"]').forEach((button) => button.addEventListener('click', () => {
    const dialog = root.querySelector<HTMLDialogElement>('#new-dialog')!;
    dialog.showModal();
    window.setTimeout(() => dialog.querySelector<HTMLInputElement>('input')?.focus(), 0);
  }));
  root.querySelectorAll('[data-action="cancel-new"]').forEach((button) => button.addEventListener('click', () => root.querySelector<HTMLDialogElement>('#new-dialog')?.close()));
  root.querySelector('#new-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    const name = String(data.get('name') || '').trim();
    if (!name) return;
    const layout = createLayout(name, String(data.get('description') || ''));
    await saveLayout(layout);
    root.querySelector<HTMLDialogElement>('#new-dialog')?.close();
    await navigate(appPath(layout, 'edit'));
  });
  root.querySelector('[data-action="import"]')?.addEventListener('click', () => root.querySelector<HTMLInputElement>('#import-file')?.click());
  root.querySelector('#import-file')?.addEventListener('change', importFile);
  root.querySelector('[data-action="export-all"]')?.addEventListener('click', exportAll);
  root.querySelectorAll<HTMLElement>('.layout-card [data-id]').forEach((button) => button.addEventListener('click', async () => {
    const layout = layouts.find((candidate) => candidate.id === button.dataset.id);
    if (!layout) return;
    const action = button.dataset.action;
    if (action === 'edit') await navigate(appPath(layout, 'edit'));
    if (action === 'restore') await navigate(appPath(layout, 'restore'));
    if (action === 'share') await showShare(layout);
    if (action === 'delete' && confirm(`Delete “${layout.name}”? Export it first if you need a backup.`)) {
      await deleteLayout(layout.id);
      layouts = await listLayouts();
      libraryView();
      showNotice('Layout deleted.');
    }
  }));
}

function editorView(): void {
  if (!active) return notFoundView();
  view = 'edit';
  stopClocks();
  const layout = active;
  const editing = layout.items.find((item) => item.id === editingItemId);
  shell(`
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${routeBase || '/'}" data-route>← Saved layouts</a><span aria-hidden="true">/</span><span>Edit</span></nav>
    <section class="workbench" aria-labelledby="editor-title">
      <div class="editor-heading">
        <div><p class="eyebrow">Edit layout</p><h1 id="editor-title">${escapeHtml(layout.name)}</h1><p>${escapeHtml(layout.description || 'Add the tools and instructions needed for this session.')}</p><button class="text-button edit-details" data-action="edit-details">Edit name and note</button></div>
        <div class="editor-actions"><span class="save-state" id="save-state">Saved locally</span><button class="button primary" data-action="start-restore" ${layout.items.length ? '' : 'disabled'}>Start restore</button></div>
      </div>
      <div class="boundary-note"><span aria-hidden="true">!</span><div><strong>The browser cannot place external windows.</strong><p>This checklist opens web links and records each placement or hardware step.</p></div></div>
      <div class="bench-grid">
        <section class="piece-list" aria-labelledby="items-title">
          <div class="list-heading"><h2 id="items-title">Layout items</h2><span>${layout.items.length} total</span></div>
          ${renderItems(layout.items)}
        </section>
        <aside class="add-piece" aria-labelledby="add-title">
          <p class="eyebrow">${editing ? 'Edit item' : 'Add item'}</p><h2 id="add-title">${editing ? `Edit ${kindLabels[editing.kind].toLowerCase()}` : 'New layout item'}</h2>
          <form id="item-form">
            <fieldset><legend>Item type</legend><div class="type-picker">${(['link','midi','timer','note'] as ItemKind[]).map((kind) => `<label><input type="radio" name="kind" value="${kind}" ${(editing?.kind || 'link') === kind ? 'checked' : ''} /><span><b aria-hidden="true">${itemIcon(kind)}</b>${kindLabels[kind]}</span></label>`).join('')}</div></fieldset>
            <label>Label<input name="title" maxlength="70" required value="${escapeHtml(editing?.title || '')}" placeholder="What should be ready?" /></label>
            <label id="url-field" ${editing && editing.kind !== 'link' ? 'hidden' : ''}>Web address<input name="url" type="text" inputmode="url" value="${escapeHtml(editing?.url || '')}" placeholder="https://example.com" /></label>
            <label id="duration-field" ${editing?.kind === 'timer' ? '' : 'hidden'}>Minutes<input name="duration" type="number" min="1" max="180" value="${editing?.duration || 5}" /></label>
            <label>Setup detail <span>(optional)</span><textarea name="detail" maxlength="240" rows="4" placeholder="Position, preset, bank, channel, or reminder">${escapeHtml(editing?.detail || '')}</textarea></label>
            <p class="form-error" id="form-error" role="alert"></p>
            <div class="form-actions">${editing ? '<button type="button" class="button secondary" data-action="cancel-edit">Cancel</button>' : ''}<button class="button primary" type="submit">${editing ? 'Save changes' : 'Add item'}</button></div>
          </form>
        </aside>
      </div>
    </section>
    <dialog id="details-dialog" aria-labelledby="details-title"><form id="details-form" class="dialog-sheet"><button class="dialog-close" type="button" data-action="cancel-details" aria-label="Close">×</button><p class="eyebrow">Layout details</p><h2 id="details-title">Edit name and note</h2><label>Session name<input name="name" required maxlength="60" value="${escapeHtml(layout.name)}" /></label><label>What is it for? <span>(optional)</span><textarea name="description" maxlength="180" rows="3">${escapeHtml(layout.description)}</textarea></label><div class="dialog-actions"><button class="button secondary" type="button" data-action="cancel-details">Cancel</button><button class="button primary" type="submit">Save details</button></div></form></dialog>`);
  setRouteMeta('Edit layout — Session Layout Capsule', appPath(layout, 'edit'));
  bindEditor();
}

function renderItems(items: SessionItem[]): string {
  if (!items.length) return `<div class="pieces-empty"><span aria-hidden="true">＋</span><h3>No layout items</h3><p>Add a link, MIDI cue, timer, or note with the form.</p></div>`;
  return `<ol class="piece-cards">${items.map((item, index) => `
    <li class="piece-card kind-${item.kind}">
      <span class="piece-number">${String(index + 1).padStart(2, '0')}</span><span class="piece-icon" aria-hidden="true">${itemIcon(item.kind)}</span>
      <div class="piece-copy"><p>${kindLabels[item.kind]}${item.duration ? ` · ${item.duration} min` : ''}</p><h3>${escapeHtml(item.title)}</h3>${item.url ? `<span>${escapeHtml(new URL(item.url).hostname)}</span>` : ''}${item.detail ? `<span>${escapeHtml(item.detail)}</span>` : ''}</div>
      <div class="piece-actions">
        <button class="mini-button" data-action="up" data-id="${item.id}" aria-label="Move ${escapeHtml(item.title)} earlier" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button class="mini-button" data-action="down" data-id="${item.id}" aria-label="Move ${escapeHtml(item.title)} later" ${index === items.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="mini-button" data-action="edit-item" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.title)}">✎</button>
        <button class="mini-button danger-icon" data-action="delete-item" data-id="${item.id}" aria-label="Remove ${escapeHtml(item.title)}">×</button>
      </div>
    </li>`).join('')}</ol>`;
}

function bindEditor(): void {
  root.querySelector('[data-action="start-restore"]')?.addEventListener('click', () => active && void navigate(appPath(active, 'restore')));
  root.querySelector('[data-action="cancel-edit"]')?.addEventListener('click', () => { editingItemId = null; editorView(); });
  root.querySelector('[data-action="edit-details"]')?.addEventListener('click', () => {
    const dialog = root.querySelector<HTMLDialogElement>('#details-dialog')!;
    dialog.showModal();
    window.setTimeout(() => dialog.querySelector<HTMLInputElement>('input')?.focus(), 0);
  });
  root.querySelectorAll('[data-action="cancel-details"]').forEach((button) => button.addEventListener('click', () => root.querySelector<HTMLDialogElement>('#details-dialog')?.close()));
  root.querySelector('#details-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!active) return;
    const data = new FormData(event.currentTarget as HTMLFormElement);
    active.name = String(data.get('name') || '').trim();
    active.description = String(data.get('description') || '').trim();
    if (!active.name) return;
    await persistActive();
    root.querySelector<HTMLDialogElement>('#details-dialog')?.close();
    editorView();
    showNotice('Layout details saved.');
  });
  root.querySelectorAll<HTMLInputElement>('input[name="kind"]').forEach((input) => input.addEventListener('change', () => {
    root.querySelector<HTMLElement>('#url-field')!.hidden = input.value !== 'link';
    root.querySelector<HTMLElement>('#duration-field')!.hidden = input.value !== 'timer';
  }));
  root.querySelector('#item-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!active) return;
    const data = new FormData(event.currentTarget as HTMLFormElement);
    const kind = String(data.get('kind')) as ItemKind;
    try {
      const item = createItem(kind, String(data.get('title') || ''), String(data.get('detail') || ''), String(data.get('url') || ''), Number(data.get('duration') || 5));
      if (kind === 'link' && !item.url) throw new Error('Add the web address you want to launch.');
      if (editingItemId) {
        const original = active.items.find((candidate) => candidate.id === editingItemId)!;
        item.id = original.id;
        item.createdAt = original.createdAt;
        active.items = active.items.map((candidate) => candidate.id === editingItemId ? item : candidate);
      } else active.items.push(item);
      editingItemId = null;
      await persistActive();
      editorView();
      showNotice('Layout item saved.');
    } catch (error) {
      root.querySelector('#form-error')!.textContent = error instanceof Error ? error.message : 'Check this item and try again.';
    }
  });
  root.querySelectorAll<HTMLElement>('.piece-actions [data-id]').forEach((button) => button.addEventListener('click', async () => {
    if (!active) return;
    const id = button.dataset.id!;
    if (button.dataset.action === 'up') active = moveItem(active, id, -1);
    if (button.dataset.action === 'down') active = moveItem(active, id, 1);
    if (button.dataset.action === 'edit-item') {
      editingItemId = id;
      editorView();
      root.querySelector('#add-title')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (button.dataset.action === 'delete-item') {
      const item = active.items.find((candidate) => candidate.id === id)!;
      if (!confirm(`Remove “${item.title}” from this layout?`)) return;
      active.items = active.items.filter((candidate) => candidate.id !== id);
    }
    await persistActive();
    editorView();
  }));
}

function restoreView(): void {
  if (!active) return notFoundView();
  view = 'restore';
  editingItemId = null;
  if (!restoreStarted) {
    completed = new Set();
    timers.clear();
    elapsedSeconds = 0;
    restoreStarted = Date.now();
    elapsedInterval = window.setInterval(() => { elapsedSeconds = Math.floor((Date.now() - restoreStarted) / 1000); updateClock(); }, 1000);
    timerInterval = window.setInterval(tickTimers, 1000);
  }
  const done = completed.size;
  const total = active.items.length;
  shell(`
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${appPath(active, 'edit')}" data-route>← Edit layout</a><span aria-hidden="true">/</span><span>Restore</span></nav>
    <section class="restore" aria-labelledby="restore-title">
      <div class="restore-heading"><div><p class="eyebrow">Restore checklist</p><h1 id="restore-title">Restore “${escapeHtml(active.name)}”</h1><p>Open links, place windows, and mark each item ready.</p></div><div class="session-clock"><span>Elapsed</span><strong id="elapsed">${formatClock(elapsedSeconds)}</strong><small>Target: under 02:00</small></div></div>
      <div class="progress-wrap"><div class="progress-copy"><strong id="progress-label">${done} of ${total} ready</strong><span>${done === total && total ? 'All items are ready.' : 'Complete one item at a time.'}</span></div><progress id="progress" value="${done}" max="${total}">${done} of ${total}</progress></div>
      <ol class="restore-list">${active.items.map((item, index) => restoreCard(item, index)).join('')}</ol>
      <div class="finish-panel ${done === total && total ? 'ready' : ''}" id="finish-panel"><span aria-hidden="true">${done === total && total ? '✓' : '!'}</span><div><h2>${done === total && total ? 'Layout restored' : 'Complete the external setup yourself'}</h2><p>${done === total && total ? `All items were marked ready in ${formatClock(elapsedSeconds)}.` : 'The app cannot place desktop windows or configure external hardware.'}</p></div>${done === total && total ? '<button class="button primary" data-action="finish">Finish restore</button>' : ''}</div>
    </section>`);
  setRouteMeta('Restore layout — Session Layout Capsule', appPath(active, 'restore'));
  bindRestore();
}

function restoreCard(item: SessionItem, index: number): string {
  const isDone = completed.has(item.id);
  const remaining = timers.get(item.id);
  return `<li class="restore-card kind-${item.kind} ${isDone ? 'complete' : ''}" data-card-id="${item.id}">
    <div class="restore-index">${String(index + 1).padStart(2, '0')}</div>
    <div class="restore-icon" aria-hidden="true">${isDone ? '✓' : itemIcon(item.kind)}</div>
    <div class="restore-copy"><p>${kindLabels[item.kind]}</p><h2>${escapeHtml(item.title)}</h2>${item.detail ? `<span>${escapeHtml(item.detail)}</span>` : ''}${item.url ? `<span>${escapeHtml(new URL(item.url).hostname)}</span>` : ''}</div>
    <div class="restore-actions">
      ${item.kind === 'link' ? `<a class="button secondary compact" href="${escapeHtml(item.url || '#')}" target="_blank" rel="noopener" data-launch-id="${item.id}">Open link ↗</a>` : ''}
      ${item.kind === 'timer' ? `<button class="button secondary compact timer-button" data-action="timer" data-id="${item.id}">${remaining === undefined ? `Start ${item.duration} min timer` : remaining > 0 ? formatClock(remaining) : 'Timer done'}</button>` : ''}
      <label class="check-button"><input type="checkbox" data-action="complete" data-id="${item.id}" ${isDone ? 'checked' : ''} /><span>${isDone ? 'Ready' : 'Mark ready'}</span></label>
    </div>
  </li>`;
}

function bindRestore(): void {
  root.querySelector('[data-action="finish"]')?.addEventListener('click', () => {
    stopClocks();
    void navigate(routeBase || '/').then(() => showNotice('Restore checklist completed.'));
  });
  root.querySelectorAll<HTMLInputElement>('[data-action="complete"]').forEach((box) => box.addEventListener('change', () => {
    if (box.checked) completed.add(box.dataset.id!);
    else completed.delete(box.dataset.id!);
    restoreView();
  }));
  root.querySelectorAll<HTMLElement>('[data-launch-id]').forEach((link) => link.addEventListener('click', () => showNotice('Link opened. Place its window, then mark it ready.')));
  root.querySelectorAll<HTMLElement>('[data-action="timer"]').forEach((button) => button.addEventListener('click', () => {
    const item = active?.items.find((candidate) => candidate.id === button.dataset.id);
    if (!item?.duration) return;
    if (!timers.has(item.id) || timers.get(item.id) === 0) timers.set(item.id, item.duration * 60);
    restoreView();
  }));
}

function tickTimers(): void {
  let changed = false;
  timers.forEach((remaining, id) => {
    if (remaining > 0) { timers.set(id, remaining - 1); changed = true; }
    if (remaining === 1) showNotice('A setup timer finished.');
  });
  if (changed && view === 'restore') {
    root.querySelectorAll<HTMLElement>('.timer-button').forEach((button) => {
      const remaining = timers.get(button.dataset.id!);
      if (remaining !== undefined) button.textContent = remaining > 0 ? formatClock(remaining) : 'Timer done';
    });
  }
}

function updateClock(): void {
  const clock = root.querySelector('#elapsed');
  if (clock) clock.textContent = formatClock(elapsedSeconds);
}

function stopClocks(): void {
  window.clearInterval(elapsedInterval);
  window.clearInterval(timerInterval);
  elapsedInterval = 0;
  timerInterval = 0;
  restoreStarted = 0;
}

async function persistActive(): Promise<void> {
  if (!active) return;
  active.updatedAt = new Date().toISOString();
  await saveLayout(active);
}

function exportAll(): void {
  const data: CapsuleExport = { format: 'session-layout-capsule', version: 1, exportedAt: new Date().toISOString(), layouts };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `session-layout-capsules-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  showNotice('JSON backup downloaded.');
}

async function importFile(event: Event): Promise<void> {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const errorRegion = root.querySelector<HTMLElement>('#import-error');
  try {
    if (file.size > 2_000_000) throw new Error('That file is over 2 MB. Choose a smaller JSON export.');
    let parsed: unknown;
    try { parsed = JSON.parse(await file.text()); }
    catch { throw new Error('That file is not valid JSON. Choose a Session Layout Capsule JSON export.'); }
    const imported = validateImport(parsed);
    const merged = new Map(layouts.map((layout) => [layout.id, layout]));
    imported.layouts.forEach((layout) => {
      const existing = merged.get(layout.id);
      if (!existing || layout.updatedAt > existing.updatedAt) merged.set(layout.id, layout);
    });
    await replaceLayouts([...merged.values()]);
    layouts = await listLayouts();
    libraryView();
    showNotice(`${imported.layouts.length} layout${imported.layouts.length === 1 ? '' : 's'} imported.`);
  } catch (error) {
    if (errorRegion) errorRegion.textContent = error instanceof Error ? error.message : 'That file could not be imported. Choose a valid JSON export.';
  }
  input.value = '';
}

async function showShare(layout: Layout): Promise<void> {
  const encoded = encodeLayout(layout);
  const shareUrl = `${location.origin}${isDemo ? '/demo' : '/'}?capsule=${encoded}`;
  if (shareUrl.length > 2600) {
    showNotice('This layout is too large for a QR code. Export JSON instead.');
    return;
  }
  const dataUrl = await QRCode.toDataURL(shareUrl, { width: 640, margin: 2, color: { dark: '#17241F', light: '#FFF9EA' }, errorCorrectionLevel: 'M' });
  const dialog = document.createElement('dialog');
  dialog.className = 'share-dialog';
  dialog.innerHTML = `<div class="dialog-sheet printable"><button class="dialog-close" aria-label="Close">×</button><p class="eyebrow">QR handoff</p><h2>${escapeHtml(layout.name)}</h2><p>This QR contains the layout. Scan it to copy the layout into another browser.</p><img src="${dataUrl}" width="320" height="320" alt="QR code containing the ${escapeHtml(layout.name)} layout" /><p class="qr-count">${layout.items.length} items · saved ${formatDate(layout.updatedAt)}</p><div class="dialog-actions"><button class="button secondary" data-copy>Copy handoff link</button><button class="button primary" data-print>Print QR handoff</button></div></div>`;
  document.body.append(dialog);
  dialog.showModal();
  const close = (): void => { dialog.close(); dialog.remove(); };
  dialog.querySelector<HTMLButtonElement>('.dialog-close')!.onclick = close;
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  dialog.querySelector<HTMLButtonElement>('[data-copy]')!.onclick = async () => { await navigator.clipboard.writeText(shareUrl); showNotice('Handoff link copied.'); };
  dialog.querySelector<HTMLButtonElement>('[data-print]')!.onclick = () => { dialog.classList.add('print-target'); window.print(); dialog.classList.remove('print-target'); };
}

function renderFatal(message: string): void {
  shell(`<section class="fatal"><p class="eyebrow">Storage error</p><h1>Your saved layouts could not be opened</h1><p>${escapeHtml(message)}</p><button class="button primary" data-action="retry">Try again</button><p class="muted">If private browsing blocks storage, open the app in a regular browser window.</p></section>`);
  setRouteMeta('Storage error — Session Layout Capsule', location.pathname);
}

function notFoundView(): void {
  view = 'not-found';
  active = null;
  stopClocks();
  shell(`<section class="not-found"><p class="eyebrow">Page not found</p><h1>This layout page does not exist</h1><p>The link may be old, or the layout may have been deleted from this browser.</p><a class="button primary" href="${routeBase || '/'}" data-route>Open saved layouts</a></section>`);
  setRouteMeta('Page not found — Session Layout Capsule', location.pathname);
}

async function receiveSharedCapsule(): Promise<boolean> {
  const encoded = new URLSearchParams(location.search).get('capsule');
  if (!encoded) return false;
  try {
    const layout = decodeLayout(encoded);
    await saveLayout(layout);
    history.replaceState({}, '', routeBase || '/');
    layouts = await listLayouts();
    libraryView();
    showNotice(`“${layout.name}” added to saved layouts.`);
    return true;
  } catch (error) {
    history.replaceState({}, '', routeBase || '/');
    libraryView();
    const message = error instanceof Error ? error.message : 'That handoff link could not be opened.';
    showNotice(`${message} Open a valid Capsule handoff link.`);
    return true;
  }
}

async function renderRoute(moveFocus: boolean): Promise<void> {
  try {
    layouts = await listLayouts();
    if (isDemo && layouts.length === 0) {
      await replaceLayouts([sampleLayout()]);
      layouts = await listLayouts();
    }
    if (await receiveSharedCapsule()) {
      if (moveFocus) announceRoute();
      return;
    }
    const path = location.pathname.replace(/\/$/, '') || '/';
    const homePath = routeBase || '/';
    if (path === homePath) libraryView();
    else {
      const prefix = isDemo ? '/demo' : '';
      const match = path.match(new RegExp(`^${prefix}/layout/([^/]+)/(edit|restore)$`));
      if (!match) notFoundView();
      else {
        const layout = layouts.find((candidate) => candidate.id === decodeURIComponent(match[1]));
        if (!layout) notFoundView();
        else {
          const previousId = active?.id;
          active = structuredClone(layout);
          if (match[2] === 'edit') editorView();
          else {
            if (previousId !== active.id || view !== 'restore') stopClocks();
            restoreView();
          }
        }
      }
    }
    if (moveFocus) announceRoute();
  } catch (error) {
    renderFatal(error instanceof Error ? error.message : 'Something went wrong while opening the app.');
  }
}

function bindConnectivity(): void {
  window.addEventListener('online', () => {
    document.querySelector<HTMLElement>('#offline-banner')?.setAttribute('hidden', '');
    showNotice('Back online. Your saved layouts stayed available.');
  });
  window.addEventListener('offline', () => document.querySelector<HTMLElement>('#offline-banner')?.removeAttribute('hidden'));
}

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const hadController = Boolean(navigator.serviceWorker.controller);
  const registration = await navigator.serviceWorker.register('/sw.js');
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'CAPSULE_UPDATED' && hadController) document.querySelector<HTMLElement>('#update-toast')?.removeAttribute('hidden');
  });
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) document.querySelector<HTMLElement>('#update-toast')?.removeAttribute('hidden');
    });
  });
}

async function init(): Promise<void> {
  bindConnectivity();
  window.addEventListener('popstate', () => { void renderRoute(true); });
  window.addEventListener('pageshow', (event) => { if (event.persisted) void renderRoute(false); });
  if (!isDemo && new URLSearchParams(location.search).get('mode') === 'real') history.replaceState({}, '', '/');
  await renderRoute(false);
  try { await registerServiceWorker(); }
  catch { showNotice('Offline setup is unavailable. Reload while connected to try again.'); }
}

void init();
