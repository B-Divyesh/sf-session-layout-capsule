import type { CapsuleExport, ItemKind, Layout, SessionItem } from './types';

export const kindLabels: Record<ItemKind, string> = {
  link: 'Launch link',
  midi: 'MIDI cue',
  timer: 'Timer',
  note: 'Note'
};

export const makeId = (): string => crypto.randomUUID();

export function createLayout(name: string, description = ''): Layout {
  const now = new Date().toISOString();
  return { id: makeId(), name: name.trim(), description: description.trim(), items: [], createdAt: now, updatedAt: now };
}

export function createItem(kind: ItemKind, title: string, detail: string, url = '', duration = 5): SessionItem {
  const item: SessionItem = { id: makeId(), kind, title: title.trim(), detail: detail.trim(), createdAt: new Date().toISOString() };
  if (kind === 'link') item.url = normalizeUrl(url);
  if (kind === 'timer') item.duration = Math.max(1, Math.min(180, Math.round(duration)));
  return item;
}

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Use an http or https link.');
  return parsed.href;
}

export function moveItem(layout: Layout, itemId: string, direction: -1 | 1): Layout {
  const items = [...layout.items];
  const from = items.findIndex((item) => item.id === itemId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= items.length) return layout;
  [items[from], items[to]] = [items[to], items[from]];
  return { ...layout, items, updatedAt: new Date().toISOString() };
}

export function validateImport(value: unknown): CapsuleExport {
  if (!value || typeof value !== 'object') throw new Error('That file does not contain a capsule export.');
  const input = value as Partial<CapsuleExport>;
  if (input.format !== 'session-layout-capsule' || input.version !== 1 || !Array.isArray(input.layouts)) {
    throw new Error('Choose a Session Layout Capsule JSON export (version 1).');
  }
  for (const layout of input.layouts) {
    if (!layout || typeof layout.id !== 'string' || typeof layout.name !== 'string' || !Array.isArray(layout.items)) {
      throw new Error('One or more layouts in that file are incomplete.');
    }
  }
  return input as CapsuleExport;
}

export function encodeLayout(layout: Layout): string {
  const bytes = new TextEncoder().encode(JSON.stringify(layout));
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeLayout(encoded: string): Layout {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const value = JSON.parse(new TextDecoder().decode(bytes)) as Layout;
  if (!value.id || !value.name || !Array.isArray(value.items)) throw new Error('The shared capsule is incomplete.');
  return { ...value, id: makeId(), name: `${value.name} (shared)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export const formatDate = (iso: string): string => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));

export const formatClock = (seconds: number): string => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.max(0, seconds % 60).toString().padStart(2, '0')}`;
