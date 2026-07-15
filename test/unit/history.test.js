import { describe, it, expect } from 'vitest';
import {
  buildHistoryRequest,
  parseHistoryPoint,
  pointsToEvents,
  deltaEvents,
  catChangeEvents,
  attributeCats,
} from '../../src/lib/history.js';

describe('buildHistoryRequest', () => {
  it('REGRESSION: always sets include_start_time_state to false', () => {
    // Prevents the "midnight phantom-visit bug": without this flag, HA
    // injects a synthetic point at exactly start_time (e.g. local midnight)
    // representing the state when the query window opened, which gets
    // misread by consumers as a real visit/event. This must never be
    // true or omitted (HA's default is true).
    const req = buildHistoryRequest({
      startTime: new Date(2026, 6, 15),
      endTime: new Date(2026, 6, 16),
      entityIds: ['input_number.example'],
    });
    expect(req.include_start_time_state).toBe(false);
  });

  it('accepts includeStartTimeState:true for identity/label sensors that need a carry-forward baseline', () => {
    // The one legitimate exception to the rule above: a sensor queried only
    // for carry-forward attribution (e.g. "which cat used it last"), never
    // charted as an event itself, where the synthetic start-of-window point
    // IS the desired baseline rather than a phantom event.
    const req = buildHistoryRequest({
      startTime: new Date(2026, 6, 15),
      endTime: new Date(2026, 6, 16),
      entityIds: ['sensor.example'],
      includeStartTimeState: true,
    });
    expect(req.include_start_time_state).toBe(true);
  });

  it('sets the correct WS message type', () => {
    const req = buildHistoryRequest({
      startTime: new Date(),
      endTime: new Date(),
      entityIds: ['input_number.example'],
    });
    expect(req.type).toBe('history/history_during_period');
  });

  it('accepts Date objects and serializes to ISO strings', () => {
    const start = new Date(2026, 6, 15, 0, 0, 0);
    const end = new Date(2026, 6, 16, 0, 0, 0);
    const req = buildHistoryRequest({ startTime: start, endTime: end, entityIds: [] });
    expect(req.start_time).toBe(start.toISOString());
    expect(req.end_time).toBe(end.toISOString());
  });

  it('accepts pre-formatted ISO strings as-is', () => {
    const req = buildHistoryRequest({
      startTime: '2026-07-15T00:00:00.000Z',
      endTime: '2026-07-16T00:00:00.000Z',
      entityIds: ['sensor.x'],
    });
    expect(req.start_time).toBe('2026-07-15T00:00:00.000Z');
    expect(req.end_time).toBe('2026-07-16T00:00:00.000Z');
  });

  it('passes entity_ids through and requests no_attributes for a lean payload', () => {
    const req = buildHistoryRequest({
      startTime: new Date(),
      endTime: new Date(),
      entityIds: ['input_number.a', 'input_number.b'],
    });
    expect(req.entity_ids).toEqual(['input_number.a', 'input_number.b']);
    expect(req.no_attributes).toBe(true);
    expect(req.minimal_response).toBe(false);
  });
});

describe('parseHistoryPoint', () => {
  it('parses the compact WS shape (s/lu)', () => {
    expect(parseHistoryPoint({ s: '42', lu: 1752570000 })).toEqual({ value: 42, ts: 1752570000000 });
  });

  it('parses the verbose REST shape (state/last_changed)', () => {
    const iso = '2026-07-15T12:00:00.000Z';
    expect(parseHistoryPoint({ state: '17.5', last_changed: iso })).toEqual({
      value: 17.5,
      ts: Date.parse(iso),
    });
  });

  it('prefers compact keys when both are present', () => {
    const result = parseHistoryPoint({ s: '5', state: '999', lu: 1000, last_changed: '2020-01-01T00:00:00Z' });
    expect(result.value).toBe(5);
    expect(result.ts).toBe(1000000);
  });

  it('returns null for a non-numeric state', () => {
    expect(parseHistoryPoint({ s: 'unavailable', lu: 1000 })).toBeNull();
  });

  it('returns null when there is no timestamp', () => {
    expect(parseHistoryPoint({ s: '10' })).toBeNull();
  });

  it('returns null for null/undefined input', () => {
    expect(parseHistoryPoint(null)).toBeNull();
    expect(parseHistoryPoint(undefined)).toBeNull();
  });

  it('returns null for an unparseable last_changed string', () => {
    expect(parseHistoryPoint({ s: '10', last_changed: 'not-a-date' })).toBeNull();
  });
});

describe('pointsToEvents', () => {
  it('converts a history array into value/ts events', () => {
    const hist = [
      { s: '30', lu: 1000 },
      { s: '45', lu: 2000 },
    ];
    expect(pointsToEvents(hist)).toEqual([
      { value: 30, ts: 1000000 },
      { value: 45, ts: 2000000 },
    ]);
  });

  it('filters out non-positive values by default (e.g. a midnight counter reset)', () => {
    const hist = [
      { s: '0', lu: 1000 },
      { s: '-5', lu: 1500 },
      { s: '30', lu: 2000 },
    ];
    expect(pointsToEvents(hist)).toEqual([{ value: 30, ts: 2000000 }]);
  });

  it('keeps non-positive values when filterPositive is false', () => {
    const hist = [{ s: '0', lu: 1000 }];
    expect(pointsToEvents(hist, { filterPositive: false })).toEqual([{ value: 0, ts: 1000000 }]);
  });

  it('drops unparseable points silently', () => {
    const hist = [{ s: 'unavailable', lu: 1000 }, { s: '10', lu: 2000 }];
    expect(pointsToEvents(hist)).toEqual([{ value: 10, ts: 2000000 }]);
  });

  it('returns an empty array for missing/non-array input', () => {
    expect(pointsToEvents(undefined)).toEqual([]);
    expect(pointsToEvents(null)).toEqual([]);
    expect(pointsToEvents('not-an-array')).toEqual([]);
  });

  it('returns an empty array for an empty history', () => {
    expect(pointsToEvents([])).toEqual([]);
  });
});

describe('deltaEvents', () => {
  it('computes the delta between consecutive readings as each event\'s value', () => {
    const hist = [
      { s: '100', lu: 1000 },
      { s: '150', lu: 2000 },
      { s: '210', lu: 3000 },
    ];
    expect(deltaEvents(hist)).toEqual([
      { value: 50, ts: 2000000 },
      { value: 60, ts: 3000000 },
    ]);
  });

  it('filters out a daily counter reset (large negative delta) by default', () => {
    const hist = [
      { s: '900', lu: 1000 },
      { s: '0', lu: 2000 },
      { s: '119', lu: 3000 },
    ];
    expect(deltaEvents(hist)).toEqual([{ value: 119, ts: 3000000 }]);
  });

  it('filters out deltas at or above maxDelta (e.g. a multi-hour offline gap)', () => {
    const hist = [
      { s: '0', lu: 1000 },
      { s: '5000', lu: 2000 },
      { s: '5030', lu: 3000 },
    ];
    expect(deltaEvents(hist, { maxDelta: 1800 })).toEqual([{ value: 30, ts: 3000000 }]);
  });

  it('drops unavailable/unparseable points before computing deltas, so a transient blip does not corrupt the surrounding delta', () => {
    // REGRESSION (real device behavior, verified against live PetKit history):
    // a coordinator hiccup writes "unavailable" then re-resolves to the SAME
    // value, unrelated to any real visit. If that "unavailable" point were
    // diffed against instead of skipped, it would either throw off the delta
    // or introduce a spurious near-zero event.
    const hist = [
      { s: '119', lu: 1000 },
      { s: 'unavailable', lu: 1500 },
      { s: '119', lu: 2000 },
      { s: '252', lu: 3000 },
    ];
    expect(deltaEvents(hist)).toEqual([{ value: 133, ts: 3000000 }]);
  });

  it('sorts input by timestamp before diffing, regardless of arrival order', () => {
    const hist = [
      { s: '210', lu: 3000 },
      { s: '100', lu: 1000 },
      { s: '150', lu: 2000 },
    ];
    expect(deltaEvents(hist)).toEqual([
      { value: 50, ts: 2000000 },
      { value: 60, ts: 3000000 },
    ]);
  });

  it('returns an empty array when fewer than 2 points are available', () => {
    expect(deltaEvents([{ s: '100', lu: 1000 }])).toEqual([]);
    expect(deltaEvents([])).toEqual([]);
    expect(deltaEvents(undefined)).toEqual([]);
  });
});

describe('catChangeEvents', () => {
  it('keeps only points whose state is a known cat name', () => {
    const hist = [
      { s: 'no_record_yet', lu: 1000 },
      { s: 'Sky', lu: 2000 },
      { s: 'unavailable', lu: 2500 },
      { s: 'Deya', lu: 3000 },
    ];
    expect(catChangeEvents(hist, ['Sky', 'Deya'])).toEqual([
      { cat: 'Sky', ts: 2000000 },
      { cat: 'Deya', ts: 3000000 },
    ]);
  });

  it('drops device placeholder states even if not explicitly named (anything not a known cat)', () => {
    const hist = [{ s: 'no_record_yet', lu: 1000 }];
    expect(catChangeEvents(hist, ['Sky', 'Deya'])).toEqual([]);
  });

  it('sorts output by timestamp', () => {
    const hist = [
      { s: 'Deya', lu: 3000 },
      { s: 'Sky', lu: 1000 },
    ];
    expect(catChangeEvents(hist, ['Sky', 'Deya'])).toEqual([
      { cat: 'Sky', ts: 1000000 },
      { cat: 'Deya', ts: 3000000 },
    ]);
  });

  it('returns an empty array for missing/non-array input', () => {
    expect(catChangeEvents(undefined, ['Sky'])).toEqual([]);
    expect(catChangeEvents(null, ['Sky'])).toEqual([]);
  });
});

describe('attributeCats', () => {
  it('attributes an event to the most recent cat-change event at or before its timestamp', () => {
    const durationEvents = [{ value: 50, ts: 2000 }];
    const catEvents = [{ cat: 'Sky', ts: 1000 }];
    expect(attributeCats(durationEvents, catEvents)).toEqual([{ value: 50, ts: 2000, cat: 'Sky' }]);
  });

  it('carries the cat forward across events with NO matching change event (same cat visits twice in a row)', () => {
    // REGRESSION: this is the core reason attribution can't be an
    // exact-timestamp match. Most PetKit integrations don't emit a new
    // "last used by" state when the same cat visits again immediately, so
    // the second visit has no cat-change event of its own -- it must carry
    // forward the last known value.
    const durationEvents = [
      { value: 46, ts: 1000 },
      { value: 59, ts: 2000 },
      { value: 27, ts: 2100 },
    ];
    const catEvents = [{ cat: 'Sky', ts: 900 }];
    expect(attributeCats(durationEvents, catEvents)).toEqual([
      { value: 46, ts: 1000, cat: 'Sky' },
      { value: 59, ts: 2000, cat: 'Sky' },
      { value: 27, ts: 2100, cat: 'Sky' },
    ]);
  });

  it('attributes events with no preceding cat-change event to null (unknown -- nothing to carry forward)', () => {
    const durationEvents = [{ value: 50, ts: 500 }];
    const catEvents = [{ cat: 'Sky', ts: 1000 }];
    expect(attributeCats(durationEvents, catEvents)).toEqual([{ value: 50, ts: 500, cat: null }]);
  });

  it('switches attribution forward as soon as a later cat-change event is reached', () => {
    const durationEvents = [
      { value: 10, ts: 1000 },
      { value: 20, ts: 3000 },
    ];
    const catEvents = [
      { cat: 'Sky', ts: 500 },
      { cat: 'Deya', ts: 2000 },
    ];
    expect(attributeCats(durationEvents, catEvents)).toEqual([
      { value: 10, ts: 1000, cat: 'Sky' },
      { value: 20, ts: 3000, cat: 'Deya' },
    ]);
  });

  it('REGRESSION: reproduces a real captured sequence (mixed exact-match and carry-forward visits)', () => {
    // Taken from a live PetKit PURAMAX's total_use/last_used_by history over
    // one day: some visits land an exact-timestamp cat-change event, others
    // (same cat repeating) don't and must carry forward.
    const durationEvents = [
      { value: 119, ts: 1000 }, // Sky (exact)
      { value: 133, ts: 2000 }, // Sky (carry-forward, no change event)
      { value: 34, ts: 3000 }, // Deya (exact)
      { value: 46, ts: 4000 }, // Sky (exact)
      { value: 59, ts: 5000 }, // Sky (carry-forward)
      { value: 27, ts: 5100 }, // Sky (carry-forward, 100ms later)
    ];
    const catEvents = [
      { cat: 'Sky', ts: 1000 },
      { cat: 'Deya', ts: 3000 },
      { cat: 'Sky', ts: 4000 },
    ];
    expect(attributeCats(durationEvents, catEvents).map((e) => e.cat)).toEqual([
      'Sky',
      'Sky',
      'Deya',
      'Sky',
      'Sky',
      'Sky',
    ]);
  });
});
