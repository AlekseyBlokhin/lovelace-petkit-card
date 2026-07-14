import { describe, it, expect } from 'vitest';
import { dayBounds, dayLabel, dayKey } from '../../src/lib/day.js';

// Fixed reference instant: 2026-07-15T14:30:00 local time.
const NOW = new Date(2026, 6, 15, 14, 30, 0);

describe('dayBounds', () => {
  it('returns local midnight-to-midnight for offset 0 ("today")', () => {
    const { start, end } = dayBounds(0, NOW);
    expect(start).toEqual(new Date(2026, 6, 15, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 6, 16, 0, 0, 0, 0));
  });

  it('shifts backward for negative offsets', () => {
    const { start, end } = dayBounds(-1, NOW);
    expect(start).toEqual(new Date(2026, 6, 14, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 6, 15, 0, 0, 0, 0));
  });

  it('shifts forward for positive offsets', () => {
    const { start, end } = dayBounds(2, NOW);
    expect(start).toEqual(new Date(2026, 6, 17, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 6, 18, 0, 0, 0, 0));
  });

  it('is deterministic for a given injected now (no reliance on real clock)', () => {
    const a = dayBounds(0, NOW);
    const b = dayBounds(0, NOW);
    expect(a.start.getTime()).toBe(b.start.getTime());
  });

  it('handles month/year rollover correctly', () => {
    const newYearsEve = new Date(2026, 11, 31, 23, 0, 0);
    const { start, end } = dayBounds(1, newYearsEve);
    expect(start).toEqual(new Date(2027, 0, 1, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2027, 0, 2, 0, 0, 0, 0));
  });
});

describe('dayLabel', () => {
  it('labels offset 0 as "Today"', () => {
    expect(dayLabel(0, NOW)).toBe('Today');
  });

  it('labels offset -1 as "Yesterday"', () => {
    expect(dayLabel(-1, NOW)).toBe('Yesterday');
  });

  it('labels other offsets with a weekday/month/day string', () => {
    const label = dayLabel(-3, NOW);
    expect(label).not.toBe('Today');
    expect(label).not.toBe('Yesterday');
    expect(typeof label).toBe('string');
    expect(label.length).toBeGreaterThan(0);
  });
});

describe('dayKey', () => {
  it('produces the same key for two timestamps on the same local day', () => {
    const morning = new Date(2026, 6, 15, 1, 0, 0).getTime();
    const night = new Date(2026, 6, 15, 23, 59, 0).getTime();
    expect(dayKey(morning)).toBe(dayKey(night));
  });

  it('produces different keys across a day boundary', () => {
    const justBefore = new Date(2026, 6, 15, 23, 59, 59).getTime();
    const justAfter = new Date(2026, 6, 16, 0, 0, 1).getTime();
    expect(dayKey(justBefore)).not.toBe(dayKey(justAfter));
  });

  it('is stable/reproducible for the same timestamp', () => {
    const ts = new Date(2026, 6, 15, 12, 0, 0).getTime();
    expect(dayKey(ts)).toBe(dayKey(ts));
  });
});
