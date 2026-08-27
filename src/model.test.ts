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
    expect(validateImport({ format: 'session-layout-capsule', version: 1, exportedAt: '', layouts: [] }).layouts).toEqual([]);
  });

  it('formats restore clocks', () => {
    expect(formatClock(125)).toBe('02:05');
  });
});
