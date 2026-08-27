import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createItem, createLayout, decodeLayout, encodeLayout, formatClock, moveItem, normalizeUrl, validateImport } from './model';

beforeEach(() => {
  let sequence = 0;
  vi.stubGlobal('crypto', { randomUUID: () => `id-${++sequence}` });
});

describe('layout model', () => {
  it('creates a trimmed local layout', () => {
    const layout = createLayout('  Night set  ', '  projector cues ');
    expect(layout.name).toBe('Night set');
    expect(layout.description).toBe('projector cues');
    expect(layout.items).toEqual([]);
  });

  it('normalizes safe launch URLs and rejects non-web protocols', () => {
    expect(normalizeUrl('example.com/panel')).toBe('https://example.com/panel');
    expect(() => normalizeUrl('javascript:alert(1)')).toThrow();
  });

  it('clamps timer durations to the supported range', () => {
    expect(createItem('timer', 'Long break', '', '', 900).duration).toBe(180);
    expect(createItem('timer', 'Quick reset', '', '', 0).duration).toBe(1);
  });

  it('moves pieces without mutating the original layout', () => {
    const layout = createLayout('Set');
    layout.items = [createItem('note', 'One', ''), createItem('note', 'Two', '')];
    const moved = moveItem(layout, layout.items[1].id, -1);
    expect(moved.items.map((item) => item.title)).toEqual(['Two', 'One']);
    expect(layout.items.map((item) => item.title)).toEqual(['One', 'Two']);
  });

  it('round-trips a unicode capsule handoff with a fresh local id', () => {
    const layout = createLayout('Synth soirée 🎛️');
    layout.items.push(createItem('midi', 'Scène', 'Canal 4'));
    const decoded = decodeLayout(encodeLayout(layout));
    expect(decoded.name).toBe('Synth soirée 🎛️ (shared)');
    expect(decoded.items[0].detail).toBe('Canal 4');
    expect(decoded.id).not.toBe(layout.id);
  });

  it('rejects files that are not a versioned capsule export', () => {
    expect(() => validateImport({ layouts: [] })).toThrow(/Session Layout Capsule/);
    expect(validateImport({ format: 'session-layout-capsule', version: 1, exportedAt: '2026-08-27T00:00:00.000Z', layouts: [] }).layouts).toEqual([]);
  });

  it('rejects a poisoned imported link before it can be persisted', () => {
    const poisoned = {
      format: 'session-layout-capsule', version: 1, exportedAt: '2026-08-27T00:00:00.000Z', layouts: [{
        id: 'invalid-layout', name: 'Poison capsule', description: '', createdAt: '2026-08-27T00:00:00.000Z', updatedAt: '2026-08-27T00:00:00.000Z', items: [{
          id: 'bad-link', kind: 'link', title: 'Broken link', url: 'not a valid URL', detail: '', createdAt: '2026-08-27T00:00:00.000Z'
        }]
      }]
    };
    expect(() => validateImport(poisoned)).toThrow(/Layout 1, item 1/);
    expect(() => validateImport(poisoned)).toThrow(/web address/);
  });

  it('validates every imported piece field and reconstructs safe records', () => {
    const layout = {
      id: 'layout-1', name: '  Valid layout  ', description: '', createdAt: '2026-08-27T00:00:00.000Z', updatedAt: '2026-08-27T00:00:00.000Z', items: [
        { id: 'link-1', kind: 'link', title: '  Browser  ', url: 'example.com', detail: '', createdAt: '2026-08-27T00:00:00.000Z', ignored: 'discard me' },
        { id: 'midi-1', kind: 'midi', title: 'Pad bank', detail: 'Bank A', createdAt: '2026-08-27T00:00:00.000Z' },
        { id: 'timer-1', kind: 'timer', title: 'Break', detail: '', duration: 5, createdAt: '2026-08-27T00:00:00.000Z' },
        { id: 'note-1', kind: 'note', title: 'Reminder', detail: '', createdAt: '2026-08-27T00:00:00.000Z' }
      ]
    };
    const imported = validateImport({ format: 'session-layout-capsule', version: 1, exportedAt: '2026-08-27T00:00:00.000Z', layouts: [layout] });
    expect(imported.layouts[0].name).toBe('Valid layout');
    expect(imported.layouts[0].items[0]).toEqual(expect.objectContaining({ url: 'https://example.com/' }));
    expect(imported.layouts[0].items[0]).not.toHaveProperty('ignored');
    for (const invalidItem of [
      { ...layout.items[0], kind: 'unknown' },
      { ...layout.items[0], url: 'javascript:alert(1)' },
      { ...layout.items[2], duration: 181 },
      { ...layout.items[3], createdAt: 'not-a-date' },
      { ...layout.items[3], createdAt: '2026-08-27' }
    ]) {
      expect(() => validateImport({ format: 'session-layout-capsule', version: 1, exportedAt: '2026-08-27T00:00:00.000Z', layouts: [{ ...layout, items: [invalidItem] }] })).toThrow();
    }
  });

  it('rejects a poisoned QR/share capsule before assigning it a local ID', () => {
    const encoded = btoa(JSON.stringify({
      id: 'shared-layout', name: 'Shared', description: '', createdAt: '2026-08-27T00:00:00.000Z', updatedAt: '2026-08-27T00:00:00.000Z', items: [{
        id: 'bad-link', kind: 'link', title: 'Broken', detail: '', url: 'not a valid URL', createdAt: '2026-08-27T00:00:00.000Z'
      }]
    })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(() => decodeLayout(encoded)).toThrow(/Shared capsule, item 1/);
  });

  it('formats restore clocks', () => {
    expect(formatClock(125)).toBe('02:05');
  });
});
