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
  if (/\s/.test(trimmed)) throw new Error('Enter a complete http or https web address.');
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error('Enter a complete http or https web address.');
  }
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
  if (!isRecord(value)) throw new Error('That file does not contain a capsule export.');
  const input = value as Partial<CapsuleExport>;
  if (input.format !== 'session-layout-capsule' || input.version !== 1 || !Array.isArray(input.layouts)) {
    throw new Error('Choose a Session Layout Capsule JSON export (version 1).');
  }
  const exportedAt = requireTimestamp(input.exportedAt, 'Export timestamp');
  const layouts = input.layouts.map((layout, index) => validateLayout(layout, `Layout ${index + 1}`));
  requireUniqueIds(layouts, 'layout');
  return { format: 'session-layout-capsule', version: 1, exportedAt, layouts };
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
  const value = validateLayout(JSON.parse(new TextDecoder().decode(bytes)), 'Shared capsule');
  return { ...value, id: makeId(), name: `${value.name} (shared)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

function validateLayout(value: unknown, label: string): Layout {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
  const id = requireText(value.id, `${label} ID`);
  const name = requireText(value.name, `${label} name`);
  const description = requireString(value.description, `${label} description`);
  const createdAt = requireTimestamp(value.createdAt, `${label} created timestamp`);
  const updatedAt = requireTimestamp(value.updatedAt, `${label} updated timestamp`);
  if (!Array.isArray(value.items)) throw new Error(`${label} items must be a list.`);
  const items = value.items.map((item, index) => validateItem(item, `${label}, item ${index + 1}`));
  requireUniqueIds(items, `${label} item`);
  return { id, name, description, createdAt, updatedAt, items };
}

function validateItem(value: unknown, label: string): SessionItem {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
  const id = requireText(value.id, `${label} ID`);
  const title = requireText(value.title, `${label} label`);
  const detail = requireString(value.detail, `${label} setup detail`);
  const createdAt = requireTimestamp(value.createdAt, `${label} created timestamp`);
  const kind = value.kind;
  if (kind !== 'link' && kind !== 'midi' && kind !== 'timer' && kind !== 'note') {
    throw new Error(`${label} has an unsupported piece type.`);
  }

  const item: SessionItem = { id, kind, title, detail, createdAt };
  if (kind === 'link') {
    if (typeof value.url !== 'string' || !value.url.trim()) throw new Error(`${label} needs a web address.`);
    try {
      item.url = normalizeUrl(value.url);
    } catch {
      throw new Error(`${label} web address must be a complete http or https URL.`);
    }
  }
  if (kind === 'timer') {
    const duration = value.duration;
    if (typeof duration !== 'number' || !Number.isInteger(duration) || duration < 1 || duration > 180) {
      throw new Error(`${label} timer duration must be a whole number from 1 to 180 minutes.`);
    }
    item.duration = duration;
  }
  return item;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new Error(`${field} must be text.`);
  return value;
}

function requireText(value: unknown, field: string): string {
  const text = requireString(value, field).trim();
  if (!text) throw new Error(`${field} is required.`);
  return text;
}

function requireTimestamp(value: unknown, field: string): string {
  const timestamp = requireText(value, field);
  const isoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
  if (!isoDateTime.test(timestamp) || Number.isNaN(Date.parse(timestamp))) throw new Error(`${field} must be a valid ISO date and time.`);
  return timestamp;
}

function requireUniqueIds(records: Array<{ id: string }>, label: string): void {
  if (new Set(records.map((record) => record.id)).size !== records.length) {
    throw new Error(`Each ${label} needs its own ID.`);
  }
}

export const formatDate = (iso: string): string => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));

export const formatClock = (seconds: number): string => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.max(0, seconds % 60).toString().padStart(2, '0')}`;
