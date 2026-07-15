import { describe, it, expect } from 'vitest';
import { bucketByDay, summarize, detectAnomaly } from '../../src/lib/analytics.js';

const dayKeyFn = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

describe('bucketByDay', () => {
  it('groups events by day key, summing values and counting', () => {
    const events = [
      { value: 30, ts: new Date(2026, 6, 15, 8).getTime() },
      { value: 45, ts: new Date(2026, 6, 15, 20).getTime() },
      { value: 20, ts: new Date(2026, 6, 14, 9).getTime() },
    ];
    const byDay = bucketByDay(events, { dayKeyFn });
    expect(byDay['2026-6-15']).toEqual({ count: 2, total: 75 });
    expect(byDay['2026-6-14']).toEqual({ count: 1, total: 20 });
  });

  it('returns an empty object for no events', () => {
    expect(bucketByDay([], { dayKeyFn })).toEqual({});
    expect(bucketByDay(undefined, { dayKeyFn })).toEqual({});
  });
});

describe('summarize', () => {
  it('returns null averages when there is no past history (0 days)', () => {
    const byDay = { today: { count: 2, total: 50 } };
    const result = summarize(byDay, 'today');
    expect(result.todayCount).toBe(2);
    expect(result.todayTotal).toBe(50);
    expect(result.avg3dVisits).toBeNull();
    expect(result.avg3dTotal).toBeNull();
    expect(result.avg7dVisits).toBeNull();
    expect(result.avg7dTotal).toBeNull();
    expect(result.daysOfHistory).toBe(0);
  });

  it('averages over exactly 1 day of past history', () => {
    const byDay = {
      today: { count: 2, total: 50 },
      d1: { count: 4, total: 100 },
    };
    const result = summarize(byDay, 'today');
    expect(result.daysOfHistory).toBe(1);
    expect(result.avg3dVisits).toBe(4);
    expect(result.avg3dTotal).toBe(100);
    expect(result.avg7dVisits).toBe(4);
    expect(result.avg7dTotal).toBe(100);
  });

  it('averages over exactly 2 days of past history', () => {
    const byDay = {
      today: { count: 1, total: 10 },
      d1: { count: 2, total: 40 },
      d2: { count: 4, total: 80 },
    };
    const result = summarize(byDay, 'today');
    expect(result.daysOfHistory).toBe(2);
    expect(result.avg3dVisits).toBe(3); // (2+4)/2
    expect(result.avg3dTotal).toBe(60); // (40+80)/2
  });

  it('with 3+ days, avg3d only uses the most recent 3 (sorted by key)', () => {
    const byDay = {
      today: { count: 0, total: 0 },
      a1: { count: 1, total: 10 },
      a2: { count: 2, total: 20 },
      a3: { count: 3, total: 30 },
      a4: { count: 4, total: 40 },
    };
    const result = summarize(byDay, 'today');
    expect(result.daysOfHistory).toBe(4);
    // sorted keys: a1,a2,a3,a4 -> last 3 = a2,a3,a4
    expect(result.avg3dVisits).toBe((2 + 3 + 4) / 3);
    expect(result.avg3dTotal).toBe((20 + 30 + 40) / 3);
    // avg7d uses all 4 since fewer than 7 exist
    expect(result.avg7dVisits).toBe((1 + 2 + 3 + 4) / 4);
    expect(result.avg7dTotal).toBe((10 + 20 + 30 + 40) / 4);
  });

  it('avg7d only uses the most recent 7 when more exist', () => {
    const byDay = { today: { count: 0, total: 0 } };
    for (let i = 1; i <= 9; i++) {
      byDay[`d${i.toString().padStart(2, '0')}`] = { count: i, total: i * 10 };
    }
    const result = summarize(byDay, 'today');
    expect(result.daysOfHistory).toBe(9);
    // last 7 sorted keys: d03..d09 -> counts 3..9
    const expectedVisits = (3 + 4 + 5 + 6 + 7 + 8 + 9) / 7;
    expect(result.avg7dVisits).toBeCloseTo(expectedVisits, 10);
  });

  it('defaults todayCount/todayTotal to 0 when today has no bucket yet', () => {
    const byDay = { d1: { count: 1, total: 10 } };
    const result = summarize(byDay, 'today');
    expect(result.todayCount).toBe(0);
    expect(result.todayTotal).toBe(0);
  });

  describe('*AvgDuration fields (average duration per visit, refs #10)', () => {
    it('todayAvgDuration is todayTotal / todayCount when there were visits today', () => {
      const byDay = { today: { count: 4, total: 100 } };
      const result = summarize(byDay, 'today');
      expect(result.todayAvgDuration).toBe(25);
    });

    it('todayAvgDuration is null (not 0) when there were no visits today', () => {
      const byDay = { d1: { count: 1, total: 10 } };
      const result = summarize(byDay, 'today');
      expect(result.todayCount).toBe(0);
      expect(result.todayAvgDuration).toBeNull();
    });

    it('avg3dDuration/avg7dDuration are null when there is no past history (0 days)', () => {
      const byDay = { today: { count: 2, total: 50 } };
      const result = summarize(byDay, 'today');
      expect(result.avg3dDuration).toBeNull();
      expect(result.avg7dDuration).toBeNull();
    });

    it('is a WEIGHTED average across the window, not the mean of each day\'s own average', () => {
      // Day 1: one 100s visit (that day's own average = 100).
      // Day 2: four visits totaling 40s (that day's own average = 10).
      // A naive mean-of-daily-averages would give (100 + 10) / 2 = 55.
      // The correct weighted average is (100 + 40) / (1 + 4) = 28.
      const byDay = {
        today: { count: 0, total: 0 },
        d1: { count: 1, total: 100 },
        d2: { count: 4, total: 40 },
      };
      const result = summarize(byDay, 'today');
      expect(result.avg3dDuration).toBe(28);
      expect(result.avg3dDuration).not.toBe(55);
    });

    it('avg3dDuration only uses the most recent 3 days (matching avg3dTotal\'s window)', () => {
      const byDay = {
        today: { count: 0, total: 0 },
        a1: { count: 10, total: 1000 }, // outside the last-3 window, must be excluded
        a2: { count: 1, total: 20 },
        a3: { count: 1, total: 10 },
        a4: { count: 1, total: 30 },
      };
      const result = summarize(byDay, 'today');
      // last 3 sorted keys: a2,a3,a4 -> total (20+10+30)=60 over count 3 = 20
      expect(result.avg3dDuration).toBe(20);
    });

    it('avg7dDuration only uses the most recent 7 days, weighted (fewer-than-window case covered by avg3d tests above)', () => {
      const byDay = { today: { count: 0, total: 0 } };
      for (let i = 1; i <= 9; i++) {
        // counts vary so a naive per-day-average mean would differ from the weighted result
        byDay[`d${i.toString().padStart(2, '0')}`] = { count: i, total: i * 10 };
      }
      const result = summarize(byDay, 'today');
      // last 7 sorted keys: d03..d09 -> counts 3..9, totals 30..90
      const totalDuration = [3, 4, 5, 6, 7, 8, 9].reduce((s, i) => s + i * 10, 0);
      const totalCount = [3, 4, 5, 6, 7, 8, 9].reduce((s, i) => s + i, 0);
      expect(result.avg7dDuration).toBeCloseTo(totalDuration / totalCount, 10);
      // Since every day here has the same per-visit duration (10s), the
      // weighted average happens to equal 10 too -- assert that directly for
      // a concrete, readable expectation.
      expect(result.avg7dDuration).toBeCloseTo(10, 10);
    });
  });
});

describe('detectAnomaly', () => {
  const base = { todayTotal: 50, avg7dTotal: 100, daysOfHistory: 5, thresholdPct: 60, hourOfDay: 20 };

  it('returns null when daysOfHistory < 3', () => {
    expect(detectAnomaly({ ...base, daysOfHistory: 2 })).toBeNull();
  });

  it('returns null when hourOfDay < 18', () => {
    expect(detectAnomaly({ ...base, hourOfDay: 17 })).toBeNull();
  });

  it('returns null when avg7dTotal is falsy (0 or null)', () => {
    expect(detectAnomaly({ ...base, avg7dTotal: 0 })).toBeNull();
    expect(detectAnomaly({ ...base, avg7dTotal: null })).toBeNull();
  });

  it('returns "low" when today is well below the threshold fraction of average', () => {
    // threshold 60% of 100 = 60; today 50 < 60
    expect(detectAnomaly({ ...base, todayTotal: 50 })).toBe('low');
  });

  it('returns "high" when today is well above the mirrored threshold', () => {
    // (2 - 0.6) * 100 = 140; today 150 > 140
    expect(detectAnomaly({ ...base, todayTotal: 150 })).toBe('high');
  });

  it('returns null when today is within the normal band', () => {
    expect(detectAnomaly({ ...base, todayTotal: 100 })).toBeNull();
  });

  it('is gated exactly at hourOfDay 18 (inclusive)', () => {
    expect(detectAnomaly({ ...base, hourOfDay: 18, todayTotal: 50 })).toBe('low');
  });

  it('is gated exactly at daysOfHistory 3 (inclusive)', () => {
    expect(detectAnomaly({ ...base, daysOfHistory: 3, todayTotal: 50 })).toBe('low');
  });
});
