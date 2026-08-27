import QRCode from 'qrcode';
import './styles.css';
import { deleteLayout, listLayouts, replaceLayouts, saveLayout } from './db';
import { createItem, createLayout, decodeLayout, encodeLayout, formatClock, formatDate, kindLabels, moveItem, validateImport } from './model';
import type { CapsuleExport, ItemKind, Layout, SessionItem } from './types';

type View = 'library' | 'edit' | 'restore';

const root = document.querySelector<HTMLDivElement>('#app')!;
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

const escapeHtml = (value: string): string => value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
const itemIcon = (kind: ItemKind): string => ({ link: '↗', midi: '⌁', timer: '◷', note: '≡' })[kind];

function shell(content: string): void {
  root.innerHTML = `
    <header class="site-header">
      <button class="brand-button" data-action="home" aria-label="Go to capsule library">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>Session Layout Capsule</span>
      </button>
      <div class="local-badge"><span aria-hidden="true">●</span> Saved on this device</div>
    </header>
    <div id="offline-banner" class="offline-banner" role="status" ${navigator.onLine ? 'hidden' : ''}>Offline — your saved capsules still work.</div>
    <main id="main">${content}</main>
    <footer>
      <span>Local-first. No account, tracking, or cloud.</span>
      <nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav>
      <span>Paper-stage artwork generated for this product.</span>
    </footer>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <div class="update-toast" id="update-toast" hidden><span>A fresh version is ready.</span><button data-action="update">Update now</button></div>`;
  bindGlobal();
}

function bindGlobal(): void {
  root.querySelector('[data-action="home"]')?.addEventListener('click', () => goHome());
  root.querySelector('[data-action="update"]')?.addEventListener('click', () => location.reload());
}

function showNotice(message: string): void {
  const toast = document.querySelector<HTMLElement>('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => toast.classList.remove('show'), 2800);
}

function libraryView(): void {
  view = 'library';
  active = null;
  stopClocks();
  shell(`
    <section class="hero" aria-labelledby="page-title">
      <div class="hero-copy">
        <p class="eyebrow"><span></span> Your rehearsal, reset</p>
        <h1 id="page-title">Put every side tool back in its place.</h1>
        <p class="lede">Save the links, MIDI cues, timers, and notes that orbit your project. Reopen them as a calm checklist—without pretending a browser can move your windows.</p>
        <div class="hero-actions">
          <button class="button primary" data-action="new">Make a capsule <span aria-hidden="true">＋</span></button>
          <button class="button secondary" data-action="import">Import JSON</button>
          <input id="import-file" type="file" accept="application/json,.json" hidden />
        </div>
        <p class="privacy-note"><span aria-hidden="true">⌂</span> Everything stays in this browser unless you export it.</p>
      </div>
      <figure class="hero-art paper-frame">
        <picture>
          <source srcset="/assets/session-diorama.avif" type="image/avif" />
          <source srcset="/assets/session-diorama.webp" type="image/webp" />
          <img src="/assets/session-diorama.png" width="900" height="600" fetchpriority="high" decoding="async" alt="A cut-paper rehearsal desk with layered cue cards, a timer, pad grid, notes, and looping paper cables." />
        </picture>
        <figcaption>One little stage for everything around the project.</figcaption>
      </figure>
    </section>
    <section class="library" aria-labelledby="library-title">
      <div class="section-heading">
        <div><p class="eyebrow">Capsule shelf</p><h2 id="library-title">Saved layouts</h2></div>
        ${layouts.length ? '<button class="text-button" data-action="export-all">Export all <span aria-hidden="true">↓</span></button>' : ''}
      </div>
      ${renderLayoutList()}
    </section>
    ${newLayoutDialog()}`);
  bindLibrary();
}

function renderLayoutList(): string {
  if (!layouts.length) return `
    <div class="empty-state">
      <div class="empty-stack" aria-hidden="true"><i></i><i></i><i>＋</i></div>
      <div><h3>Your shelf is quiet</h3><p>Start with the side tools you always rebuild before a session. Your first capsule can be just one link or cue.</p><button class="button secondary" data-action="new">Create the first capsule</button></div>
    </div>`;
  return `<ul class="layout-grid">${layouts.map((layout, index) => `
    <li class="layout-card" style="--card-index:${index}">
      <div class="registration-tab" aria-hidden="true"></div>
      <p class="card-count">${layout.items.length} ${layout.items.length === 1 ? 'piece' : 'pieces'}</p>
      <h3>${escapeHtml(layout.name)}</h3>
      <p>${escapeHtml(layout.description || 'No session note yet.')}</p>
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
      <button class="dialog-close" value="cancel" aria-label="Close">×</button>
      <p class="eyebrow">Fresh paper</p><h2 id="new-title">Name this capsule</h2>
      <label>Session name<input name="name" required maxlength="60" autocomplete="off" placeholder="Friday rooftop set" /></label>
      <label>What is it for? <span>(optional)</span><textarea name="description" maxlength="180" rows="3" placeholder="The visual and cue setup around the live set"></textarea></label>
      <div class="dialog-actions"><button class="button secondary" value="cancel">Cancel</button><button class="button primary" value="default" type="submit">Open the workbench</button></div>
    </form>
  </dialog>`;
}

function bindLibrary(): void {
  root.querySelectorAll('[data-action="new"]').forEach((button) => button.addEventListener('click', () => {
    const dialog = root.querySelector<HTMLDialogElement>('#new-dialog')!;
    dialog.showModal();
    window.setTimeout(() => dialog.querySelector<HTMLInputElement>('input')?.focus(), 0);
  }));
  root.querySelector('#new-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    const name = String(data.get('name') || '').trim();
    if (!name) return;
    active = createLayout(name, String(data.get('description') || ''));
    await saveLayout(active);
    (root.querySelector('#new-dialog') as HTMLDialogElement).close();
    editorView();
  });
  root.querySelector('[data-action="import"]')?.addEventListener('click', () => root.querySelector<HTMLInputElement>('#import-file')?.click());
  root.querySelector('#import-file')?.addEventListener('change', importFile);
  root.querySelector('[data-action="export-all"]')?.addEventListener('click', exportAll);
  root.querySelectorAll<HTMLElement>('[data-id]').forEach((button) => button.addEventListener('click', async () => {
    const layout = layouts.find((candidate) => candidate.id === button.dataset.id);
    if (!layout) return;
    const action = button.dataset.action;
    if (action === 'edit') { active = structuredClone(layout); editorView(); }
    if (action === 'restore') { active = structuredClone(layout); restoreView(); }
    if (action === 'share') await showShare(layout);
    if (action === 'delete' && confirm(`Delete “${layout.name}”? This cannot be undone unless you exported it.`)) {
      await deleteLayout(layout.id); await reload(); showNotice('Capsule deleted.');
    }
  }));
}

function editorView(): void {
  if (!active) return libraryView();
  view = 'edit';
  const layout = active;
  const editing = layout.items.find((item) => item.id === editingItemId);
  shell(`
    <nav class="crumbs" aria-label="Breadcrumb"><button data-action="back">← Capsule shelf</button><span aria-hidden="true">/</span><span>Edit</span></nav>
    <section class="workbench" aria-labelledby="editor-title">
      <div class="editor-heading">
        <div><p class="eyebrow">Layout workbench</p><h1 id="editor-title">${escapeHtml(layout.name)}</h1><p>${escapeHtml(layout.description || 'Build the small stage around your main project.')}</p></div>
        <div class="editor-actions"><span class="save-state" id="save-state">Saved locally</span><button class="button primary" data-action="start-restore" ${layout.items.length ? '' : 'disabled'}>Start restore →</button></div>
      </div>
      <div class="boundary-note"><span aria-hidden="true">✦</span><div><strong>A cue sheet, not a window manager.</strong><p>Capsule can launch web links and remember intent. You still place external apps and panels where you want them.</p></div></div>
      <div class="bench-grid">
        <section class="piece-list" aria-labelledby="pieces-title">
          <div class="list-heading"><h2 id="pieces-title">Stage pieces</h2><span>${layout.items.length} total</span></div>
          ${renderItems(layout.items)}
        </section>
        <aside class="add-piece" aria-labelledby="add-title">
          <p class="eyebrow">${editing ? 'Revise a piece' : 'Add to the stage'}</p><h2 id="add-title">${editing ? `Edit ${kindLabels[editing.kind].toLowerCase()}` : 'New piece'}</h2>
          <form id="item-form">
            <fieldset><legend>Piece type</legend><div class="type-picker">${(['link','midi','timer','note'] as ItemKind[]).map((kind) => `<label><input type="radio" name="kind" value="${kind}" ${(editing?.kind || 'link') === kind ? 'checked' : ''} /><span><b aria-hidden="true">${itemIcon(kind)}</b>${kindLabels[kind]}</span></label>`).join('')}</div></fieldset>
            <label>Label<input name="title" maxlength="70" required value="${escapeHtml(editing?.title || '')}" placeholder="${editing?.kind === 'midi' ? 'Launchpad scene 3' : 'What should you see?'}" /></label>
            <label id="url-field" ${editing && editing.kind !== 'link' ? 'hidden' : ''}>Web address<input name="url" type="text" inputmode="url" value="${escapeHtml(editing?.url || '')}" placeholder="https://…" /></label>
            <label id="duration-field" ${editing?.kind === 'timer' ? '' : 'hidden'}>Minutes<input name="duration" type="number" min="1" max="180" value="${editing?.duration || 5}" /></label>
            <label>Setup detail <span>(optional)</span><textarea name="detail" maxlength="240" rows="4" placeholder="Position, preset, bank, channel, or reminder…">${escapeHtml(editing?.detail || '')}</textarea></label>
            <p class="form-error" id="form-error" role="alert"></p>
            <div class="form-actions">${editing ? '<button type="button" class="button secondary" data-action="cancel-edit">Cancel</button>' : ''}<button class="button primary" type="submit">${editing ? 'Save changes' : 'Add piece'}</button></div>
          </form>
        </aside>
      </div>
    </section>`);
  bindEditor();
}

function renderItems(items: SessionItem[]): string {
  if (!items.length) return `<div class="pieces-empty"><span aria-hidden="true">＋</span><h3>Add the first thing you reach for</h3><p>A browser tool, a MIDI setting, a countdown, or a note is enough to begin.</p></div>`;
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
  root.querySelector('[data-action="back"]')?.addEventListener('click', () => goHome());
  root.querySelector('[data-action="start-restore"]')?.addEventListener('click', () => restoreView());
  root.querySelector('[data-action="cancel-edit"]')?.addEventListener('click', () => { editingItemId = null; editorView(); });
  root.querySelectorAll<HTMLInputElement>('input[name="kind"]').forEach((input) => input.addEventListener('change', () => {
    root.querySelector<HTMLElement>('#url-field')!.hidden = input.value !== 'link';
    root.querySelector<HTMLElement>('#duration-field')!.hidden = input.value !== 'timer';
  }));
  root.querySelector('#item-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!active) return;
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const kind = String(data.get('kind')) as ItemKind;
    try {
      const item = createItem(kind, String(data.get('title') || ''), String(data.get('detail') || ''), String(data.get('url') || ''), Number(data.get('duration') || 5));
      if (kind === 'link' && !item.url) throw new Error('Add the web address you want to launch.');
      if (editingItemId) {
        const original = active.items.find((candidate) => candidate.id === editingItemId)!;
        item.id = original.id; item.createdAt = original.createdAt;
        active.items = active.items.map((candidate) => candidate.id === editingItemId ? item : candidate);
      } else active.items.push(item);
      editingItemId = null;
      await persistActive();
      editorView(); showNotice('Piece saved locally.');
    } catch (error) { root.querySelector('#form-error')!.textContent = error instanceof Error ? error.message : 'Check this piece and try again.'; }
  });
  root.querySelectorAll<HTMLElement>('.piece-actions [data-id]').forEach((button) => button.addEventListener('click', async () => {
    if (!active) return;
    const id = button.dataset.id!;
    if (button.dataset.action === 'up') active = moveItem(active, id, -1);
    if (button.dataset.action === 'down') active = moveItem(active, id, 1);
    if (button.dataset.action === 'edit-item') { editingItemId = id; editorView(); root.querySelector('#add-title')?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (button.dataset.action === 'delete-item') {
      const item = active.items.find((candidate) => candidate.id === id)!;
      if (!confirm(`Remove “${item.title}” from this capsule?`)) return;
      active.items = active.items.filter((candidate) => candidate.id !== id);
    }
    await persistActive(); editorView();
  }));
}

function restoreView(): void {
  if (!active) return libraryView();
  view = 'restore';
  editingItemId = null;
  if (!restoreStarted) {
    completed = new Set(); timers.clear(); elapsedSeconds = 0; restoreStarted = Date.now();
    elapsedInterval = window.setInterval(() => { elapsedSeconds = Math.floor((Date.now() - restoreStarted) / 1000); updateClock(); }, 1000);
    timerInterval = window.setInterval(tickTimers, 1000);
  }
  const done = completed.size;
  const total = active.items.length;
  shell(`
    <nav class="crumbs" aria-label="Breadcrumb"><button data-action="exit-restore">← Exit restore</button><span aria-hidden="true">/</span><span>${escapeHtml(active.name)}</span></nav>
    <section class="restore" aria-labelledby="restore-title">
      <div class="restore-heading"><div><p class="eyebrow">Restore pass</p><h1 id="restore-title">Reset “${escapeHtml(active.name)}”</h1><p>Work down the cue sheet. Open links, place windows, confirm each piece.</p></div><div class="session-clock"><span>Elapsed</span><strong id="elapsed">${formatClock(elapsedSeconds)}</strong><small>Goal: under 02:00</small></div></div>
      <div class="progress-wrap"><div class="progress-copy"><strong id="progress-label">${done} of ${total} ready</strong><span>${done === total && total ? 'Stage reset.' : 'One piece at a time.'}</span></div><progress id="progress" value="${done}" max="${total}">${done} of ${total}</progress></div>
      <ol class="restore-list">${active.items.map((item, index) => restoreCard(item, index)).join('')}</ol>
      <div class="finish-panel ${done === total && total ? 'ready' : ''}" id="finish-panel"><span aria-hidden="true">${done === total && total ? '✓' : '⌁'}</span><div><h2>${done === total && total ? 'The stage is ready' : 'Your browser stops at the edge'}</h2><p>${done === total && total ? `Restored in ${formatClock(elapsedSeconds)}. Open the main project and make some noise.` : 'Capsule remembers and launches. Window placement and external hardware stay in your hands.'}</p></div>${done === total && total ? '<button class="button primary" data-action="finish">Finish restore</button>' : ''}</div>
    </section>`);
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
      ${item.kind === 'link' ? `<a class="button secondary compact" href="${escapeHtml(item.url || '#')}" target="_blank" rel="noopener" data-launch-id="${item.id}">Launch ↗</a>` : ''}
      ${item.kind === 'timer' ? `<button class="button secondary compact timer-button" data-action="timer" data-id="${item.id}">${remaining === undefined ? `Start ${item.duration} min` : remaining > 0 ? formatClock(remaining) : 'Timer done'}</button>` : ''}
      <label class="check-button"><input type="checkbox" data-action="complete" data-id="${item.id}" ${isDone ? 'checked' : ''} /><span>${isDone ? 'Ready' : 'Mark ready'}</span></label>
    </div>
  </li>`;
}

function bindRestore(): void {
  root.querySelector('[data-action="exit-restore"]')?.addEventListener('click', () => { stopClocks(); editorView(); });
  root.querySelector('[data-action="finish"]')?.addEventListener('click', () => { stopClocks(); goHome('Restore complete. Your stage is ready.'); });
  root.querySelectorAll<HTMLInputElement>('[data-action="complete"]').forEach((box) => box.addEventListener('change', () => {
    if (box.checked) completed.add(box.dataset.id!); else completed.delete(box.dataset.id!);
    restoreView();
  }));
  root.querySelectorAll<HTMLElement>('[data-launch-id]').forEach((link) => link.addEventListener('click', () => showNotice('Link opened in a new tab. Place it, then mark ready.')));
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
    if (remaining === 1) showNotice('A setup timer has finished.');
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
  window.clearInterval(elapsedInterval); window.clearInterval(timerInterval);
  elapsedInterval = 0; timerInterval = 0; restoreStarted = 0;
}

async function persistActive(): Promise<void> {
  if (!active) return;
  active.updatedAt = new Date().toISOString();
  await saveLayout(active);
}

async function goHome(message = ''): Promise<void> {
  editingItemId = null; stopClocks(); await reload(); if (message) showNotice(message);
}

async function reload(): Promise<void> {
  try { layouts = await listLayouts(); libraryView(); }
  catch (error) { renderFatal(error instanceof Error ? error.message : 'Your local capsule shelf could not be opened.'); }
}

function exportAll(): void {
  const data: CapsuleExport = { format: 'session-layout-capsule', version: 1, exportedAt: new Date().toISOString(), layouts };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `session-layout-capsules-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
  URL.revokeObjectURL(url); showNotice('JSON backup downloaded.');
}

async function importFile(event: Event): Promise<void> {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0]; if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error('That file is over 2 MB. Choose a smaller capsule export.');
    const imported = validateImport(JSON.parse(await file.text()));
    const merged = new Map(layouts.map((layout) => [layout.id, layout]));
    imported.layouts.forEach((layout) => {
      const existing = merged.get(layout.id);
      if (!existing || layout.updatedAt > existing.updatedAt) merged.set(layout.id, layout);
    });
    await replaceLayouts([...merged.values()]); await reload(); showNotice(`${imported.layouts.length} capsule${imported.layouts.length === 1 ? '' : 's'} imported.`);
  } catch (error) { alert(error instanceof Error ? error.message : 'That file could not be imported.'); }
  input.value = '';
}

async function showShare(layout: Layout): Promise<void> {
  const encoded = encodeLayout(layout);
  const shareUrl = `${location.origin}/?capsule=${encoded}`;
  if (shareUrl.length > 2600) { alert('This capsule is too detailed for a dependable QR code. Export the JSON backup instead.'); return; }
  const dataUrl = await QRCode.toDataURL(shareUrl, { width: 640, margin: 2, color: { dark: '#17241F', light: '#FFF9EA' }, errorCorrectionLevel: 'M' });
  const dialog = document.createElement('dialog'); dialog.className = 'share-dialog';
  dialog.innerHTML = `<div class="dialog-sheet printable"><button class="dialog-close" aria-label="Close">×</button><p class="eyebrow">Portable handoff</p><h2>${escapeHtml(layout.name)}</h2><p>Scan to copy this capsule into another browser. The data lives inside the QR—no cloud involved.</p><img src="${dataUrl}" width="320" height="320" alt="QR code containing the ${escapeHtml(layout.name)} capsule" /><p class="qr-count">${layout.items.length} pieces · saved ${formatDate(layout.updatedAt)}</p><div class="dialog-actions"><button class="button secondary" data-copy>Copy link</button><button class="button primary" data-print>Print handoff</button></div></div>`;
  document.body.append(dialog); dialog.showModal(); dialog.querySelector<HTMLButtonElement>('.dialog-close')!.onclick = () => { dialog.close(); dialog.remove(); };
  dialog.addEventListener('click', (event) => { if (event.target === dialog) { dialog.close(); dialog.remove(); } });
  dialog.querySelector<HTMLButtonElement>('[data-copy]')!.onclick = async () => { await navigator.clipboard.writeText(shareUrl); showNotice('Share link copied.'); };
  dialog.querySelector<HTMLButtonElement>('[data-print]')!.onclick = () => { dialog.classList.add('print-target'); window.print(); dialog.classList.remove('print-target'); };
}

function renderFatal(message: string): void {
  shell(`<section class="fatal"><p class="eyebrow">Shelf unavailable</p><h1>Your capsules could not be opened.</h1><p>${escapeHtml(message)}</p><button class="button primary" onclick="location.reload()">Try again</button><p class="muted">If private browsing blocks storage, open Capsule in a regular browser window.</p></section>`);
}

async function receiveSharedCapsule(): Promise<boolean> {
  const encoded = new URLSearchParams(location.search).get('capsule');
  if (!encoded) return false;
  try {
    const layout = decodeLayout(encoded); await saveLayout(layout);
    history.replaceState({}, '', '/');
    layouts = await listLayouts(); libraryView(); showNotice(`“${layout.name}” added to your shelf.`); return true;
  } catch (error) {
    history.replaceState({}, '', '/');
    alert(error instanceof Error ? error.message : 'That shared capsule could not be opened.'); return false;
  }
}

function bindConnectivity(): void {
  window.addEventListener('online', () => { document.querySelector<HTMLElement>('#offline-banner')?.setAttribute('hidden', ''); showNotice('Back online. Your local data was here all along.'); });
  window.addEventListener('offline', () => document.querySelector<HTMLElement>('#offline-banner')?.removeAttribute('hidden'));
}

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.register('/sw.js');
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'CAPSULE_UPDATED' && navigator.serviceWorker.controller) document.querySelector<HTMLElement>('#update-toast')?.removeAttribute('hidden');
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
  try {
    layouts = await listLayouts();
    if (!await receiveSharedCapsule()) libraryView();
    await registerServiceWorker();
  } catch (error) { renderFatal(error instanceof Error ? error.message : 'Something went wrong while opening the app.'); }
}

void init();
