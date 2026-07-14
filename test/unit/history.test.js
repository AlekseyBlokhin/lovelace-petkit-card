import { describe, it, expect } from 'vitest';
import { buildHistoryRequest, parseHistoryPoint, pointsToEvents } from '../../src/lib/history.js';

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
