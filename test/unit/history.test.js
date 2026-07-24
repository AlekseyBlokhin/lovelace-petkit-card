import { describe, it, expect } from 'vitest';
import {
  buildHistoryRequest,
  rawStateAndTs,
  parseHistoryPoint,
  pointsToEvents,
  deltaEvents,
  catChangeEvents,
  attributeCats,
  dedupeFlickerRepeats,
  UNKNOWN_CAT_STATE,
  UNKNOWN_CAT_LABEL,
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

describe('rawStateAndTs', () => {
  it('parses the compact WS shape (s/lu), leaving state as a raw string', () => {
    expect(rawStateAndTs({ s: 'Cat A', lu: 1752570000 })).toEqual({ state: 'Cat A', ts: 1752570000000 });
  });

  it('parses the verbose REST shape (state/last_changed), leaving state as a raw string', () => {
    const iso = '2026-07-15T12:00:00.000Z';
    expect(rawStateAndTs({ state: 'unknown_pet', last_changed: iso })).toEqual({
      state: 'unknown_pet',
      ts: Date.parse(iso),
    });
  });

  it('prefers compact keys when both are present', () => {
    const result = rawStateAndTs({ s: 'Cat A', state: 'Cat B', lu: 1000, last_changed: '2020-01-01T00:00:00Z' });
    expect(result.state).toBe('Cat A');
    expect(result.ts).toBe(1000000);
  });

  it('does not numify or validate the state -- non-numeric strings pass through untouched', () => {
    expect(rawStateAndTs({ s: 'unavailable', lu: 1000 })).toEqual({ state: 'unavailable', ts: 1000000 });
  });

  it('returns ts: null when there is no timestamp field at all', () => {
    expect(rawStateAndTs({ s: '10' })).toEqual({ state: '10', ts: null });
  });

  it('returns a NaN ts (not null) for an unparseable last_changed string, unlike parseHistoryPoint', () => {
    const result = rawStateAndTs({ s: '10', last_changed: 'not-a-date' });
    expect(result.state).toBe('10');
    expect(Number.isNaN(result.ts)).toBe(true);
  });

  it('returns null for null/undefined input', () => {
    expect(rawStateAndTs(null)).toBeNull();
    expect(rawStateAndTs(undefined)).toBeNull();
  });

  it('returns state: undefined when neither s nor state is present', () => {
    expect(rawStateAndTs({ lu: 1000 })).toEqual({ state: undefined, ts: 1000000 });
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

  // --------------------------------------------------------------------
  // REGRESSION (refs #15): phantom visits from a transient counter glitch that
  // self-corrects (reported live, 2026-07-16 -- two visits shown on the
  // chart, neither present in the PetKit app). Real captured data:
  //   22:36:20 -> 59, 23:21:53.94 -> 104 (+45, read as a visit),
  //   23:22:12.23 -> 59 (19s later, EXACTLY back to the pre-delta value)
  // and separately:
  //   01:29:53 -> 244, 01:47:13.98 -> 294 (+50, read as a visit),
  //   01:47:25.25 -> 244 (12s later, EXACTLY back to the pre-delta value)
  // A real total_use increment is permanent; it only ever drops via a full
  // counter reset (to near zero), never a partial "undo" back to an
  // arbitrary prior reading. `lu` values below are epoch seconds as
  // returned raw by the WS API (not yet *1000'd) -- deltaEvents does that
  // internally via parseHistoryPoint.
  // --------------------------------------------------------------------
  describe('REGRESSION: a self-correcting glitch is not read as a visit', () => {
    it('discards a positive delta that the very next reading undoes exactly (real captured case 1)', () => {
      const hist = [
        { s: '59', lu: 1783968980 },
        { s: '104', lu: 1783971713.943688 },
        { s: '59', lu: 1783971732.227337 },
      ];
      expect(deltaEvents(hist)).toEqual([]);
    });

    it('discards a positive delta that the very next reading undoes exactly (real captured case 2)', () => {
      const hist = [
        { s: '244', lu: 1783985393 },
        { s: '294', lu: 1783986433.977865 },
        { s: '244', lu: 1783986445.247189 },
      ];
      expect(deltaEvents(hist)).toEqual([]);
    });

    it('still keeps a real visit that is followed by ANOTHER real (larger) visit, not an exact undo', () => {
      const hist = [
        { s: '59', lu: 1000 },
        { s: '104', lu: 2000 }, // +45, real
        { s: '150', lu: 3000 }, // +46, real -- does not undo the previous reading
      ];
      expect(deltaEvents(hist)).toEqual([
        { value: 45, ts: 2000000 },
        { value: 46, ts: 3000000 },
      ]);
    });

    it('does not confuse a genuine full counter reset (drops to near zero) with a glitch-undo', () => {
      // A real visit followed by the device's own daily reset-to-zero must
      // still count -- only an exact return to the specific PRE-delta
      // reading is treated as a glitch, not any drop at all.
      const hist = [
        { s: '900', lu: 1000 },
        { s: '945', lu: 2000 }, // +45, real visit
        { s: '0', lu: 3000 }, // daily reset, unrelated value, not an undo
      ];
      expect(deltaEvents(hist)).toEqual([{ value: 45, ts: 2000000 }]);
    });

    it('only inspects the immediately following reading, not a later one', () => {
      // If the "undo" isn't the very next point, the delta is real and
      // kept -- this only catches the specific back-to-back glitch
      // signature actually observed, not any later coincidental return to
      // an old value.
      const hist = [
        { s: '59', lu: 1000 },
        { s: '104', lu: 2000 }, // +45
        { s: '150', lu: 3000 }, // +46, a real visit in between
        { s: '59', lu: 4000 }, // drops back to 59 eventually, but not immediately after the +45
      ];
      const result = deltaEvents(hist, { minDelta: 0, maxDelta: 1800 });
      expect(result.map((e) => e.value)).toEqual([45, 46]);
    });
  });
});

describe('catChangeEvents', () => {
  it('keeps only points whose state is a known cat name', () => {
    const hist = [
      { s: 'no_record_yet', lu: 1000 },
      { s: 'Cat A', lu: 2000 },
      { s: 'unavailable', lu: 2500 },
      { s: 'Cat B', lu: 3000 },
    ];
    expect(catChangeEvents(hist, ['Cat A', 'Cat B'])).toEqual([
      { cat: 'Cat A', ts: 2000000 },
      { cat: 'Cat B', ts: 3000000 },
    ]);
  });

  it('drops device placeholder states even if not explicitly named (anything not a known cat)', () => {
    const hist = [{ s: 'no_record_yet', lu: 1000 }];
    expect(catChangeEvents(hist, ['Cat A', 'Cat B'])).toEqual([]);
  });

  // --------------------------------------------------------------------
  // REGRESSION (reported live, 2026-07-16): UNKNOWN_CAT_STATE
  // ('unknown_pet') used to be dropped right along with genuine noise
  // states (unavailable, no_record_yet) because it isn't a member of
  // `knownNames` -- so a real "the device couldn't identify this cat"
  // assertion silently vanished, and carry-forward attribution just kept
  // whatever configured cat was attributed to the PREVIOUS visit instead.
  // Two real visits on this device were misattributed this way in one day.
  // --------------------------------------------------------------------
  it('REGRESSION: keeps UNKNOWN_CAT_STATE as a real identity event (mapped to UNKNOWN_CAT_LABEL), not dropped as noise', () => {
    const hist = [
      { s: 'Cat A', lu: 1000 },
      { s: UNKNOWN_CAT_STATE, lu: 2000 },
      { s: 'Cat B', lu: 3000 },
    ];
    expect(catChangeEvents(hist, ['Cat A', 'Cat B'])).toEqual([
      { cat: 'Cat A', ts: 1000000 },
      { cat: UNKNOWN_CAT_LABEL, ts: 2000000 },
      { cat: 'Cat B', ts: 3000000 },
    ]);
  });

  it('sorts output by timestamp', () => {
    const hist = [
      { s: 'Cat B', lu: 3000 },
      { s: 'Cat A', lu: 1000 },
    ];
    expect(catChangeEvents(hist, ['Cat A', 'Cat B'])).toEqual([
      { cat: 'Cat A', ts: 1000000 },
      { cat: 'Cat B', ts: 3000000 },
    ]);
  });

  it('returns an empty array for missing/non-array input', () => {
    expect(catChangeEvents(undefined, ['Cat A'])).toEqual([]);
    expect(catChangeEvents(null, ['Cat A'])).toEqual([]);
  });
});

describe('attributeCats', () => {
  it('attributes an event to the nearest cat-change event before its timestamp when there is only one duration event', () => {
    const durationEvents = [{ value: 50, ts: 2000 }];
    const catEvents = [{ cat: 'Cat A', ts: 1000 }];
    expect(attributeCats(durationEvents, catEvents)).toEqual([{ value: 50, ts: 2000, cat: 'Cat A' }]);
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
    const catEvents = [{ cat: 'Cat A', ts: 900 }];
    expect(attributeCats(durationEvents, catEvents)).toEqual([
      { value: 46, ts: 1000, cat: 'Cat A' },
      { value: 59, ts: 2000, cat: 'Cat A' },
      { value: 27, ts: 2100, cat: 'Cat A' },
    ]);
  });

  it('attributes to null when there is no cat-change event at all (nothing to carry forward)', () => {
    const durationEvents = [{ value: 50, ts: 500 }];
    expect(attributeCats(durationEvents, [])).toEqual([{ value: 50, ts: 500, cat: null }]);
  });

  it('a lone duration event can still reach an identity write far away in time, since nothing else competes for it', () => {
    // With no neighboring duration event on either side, this visit's
    // "territory" is unbounded -- there's no risk of stealing a different
    // visit's own identity write, since there IS no other visit. This
    // replaces the old fixed-tolerance design, which would have given up
    // and returned null here even though this cat-change event is
    // unambiguously the only candidate for this visit.
    const durationEvents = [{ value: 50, ts: 500 }];
    const catEvents = [{ cat: 'Cat A', ts: 500 + 20 * 60 * 1000 }]; // 20 minutes later
    expect(attributeCats(durationEvents, catEvents)[0].cat).toBe('Cat A');
  });

  it('switches attribution forward as soon as a later cat-change event is closer to the next visit', () => {
    const durationEvents = [
      { value: 10, ts: 1000 },
      { value: 20, ts: 30000 },
    ];
    const catEvents = [
      { cat: 'Cat A', ts: 500 },
      { cat: 'Cat B', ts: 20000 },
    ];
    expect(attributeCats(durationEvents, catEvents)).toEqual([
      { value: 10, ts: 1000, cat: 'Cat A' },
      { value: 20, ts: 30000, cat: 'Cat B' },
    ]);
  });

  it('REGRESSION: reproduces a real captured sequence (mixed exact-match and carry-forward visits)', () => {
    // Shape taken from a live PetKit PURAMAX's total_use/last_used_by
    // history over one day: some visits land a cat-change event a few ms
    // after them (see the write-order-lag block below), others (same cat
    // repeating) don't and must carry forward. Spacing between
    // different-cat visits is realistic (60-120s, matching real observed
    // gaps), not compressed to sub-second synthetic values.
    const durationEvents = [
      { value: 119, ts: 60000 }, // Cat A (own event lands 5ms later)
      { value: 133, ts: 180000 }, // Cat A (carry-forward, no change event)
      { value: 34, ts: 300000 }, // Cat B (own event lands 8ms later)
      { value: 46, ts: 420000 }, // Cat A (own event lands 10ms later)
      { value: 59, ts: 480000 }, // Cat A (carry-forward)
      { value: 27, ts: 540000 }, // Cat A (carry-forward)
    ];
    const catEvents = [
      { cat: 'Cat A', ts: 60005 },
      { cat: 'Cat B', ts: 300008 },
      { cat: 'Cat A', ts: 420010 },
    ];
    expect(attributeCats(durationEvents, catEvents).map((e) => e.cat)).toEqual([
      'Cat A',
      'Cat A',
      'Cat B',
      'Cat A',
      'Cat A',
      'Cat A',
    ]);
  });

  // --------------------------------------------------------------------
  // REGRESSION: the "one visit behind" attribution bug (reported live,
  // 2026-07-15). Root cause, confirmed against this device's real history
  // pulled directly over the WS API (`lu` carries full sub-second
  // precision): for a single physical visit, `total_use` (the duration
  // signal) is usually written a few milliseconds -- occasionally much
  // more, see the block below -- BEFORE `last_used_by` (the identity
  // signal), never at the exact same instant, and never the other way
  // around. Real captured pairs (epoch seconds, full precision, from this
  // device -- cat names replaced with Cat A/Cat B):
  //   duration 1783906193.202 / cat-event Cat B@1783906193.210 (+0.008s)
  //   duration 1783907233.978 / cat-event Cat A@1783907235.097 (+1.119s)
  //   duration 1784145166.203 / cat-event Cat A@1784145166.203 (+0.001s)
  // --------------------------------------------------------------------
  describe('REGRESSION: attribution write-order lag (identity write lands after the duration write)', () => {
    it('attributes a visit correctly even when its own cat-change event lands 8ms after it', () => {
      const durationEvents = [{ value: 32, ts: 1783906193202 }];
      const catEvents = [{ cat: 'Cat B', ts: 1783906193210 }];
      expect(attributeCats(durationEvents, catEvents)[0].cat).toBe('Cat B');
    });

    it('attributes a visit correctly even when its own cat-change event lands 1.1s after it', () => {
      const durationEvents = [{ value: 50, ts: 1783907233978 }];
      const catEvents = [{ cat: 'Cat A', ts: 1783907235097 }];
      expect(attributeCats(durationEvents, catEvents)[0].cat).toBe('Cat A');
    });

    it('does NOT attribute a visit to a cat-change event that is only 1ms after it as the PREVIOUS cat (the actual reported bug)', () => {
      // Before the fix: strict `catEvents[idx].ts <= event.ts` excludes a
      // cat-change event that lands even 1ms late, so the visit inherits
      // whatever cat was current *before* it -- here, a stale "Cat B" from
      // hours earlier -- even though the real-time signal for THIS visit
      // (Cat A) is sitting right there, 1ms later.
      const durationEvents = [{ value: 121, ts: 1784145166203 }];
      const catEvents = [
        { cat: 'Cat B', ts: 1783906193210 }, // stale, hours earlier
        { cat: 'Cat A', ts: 1784145166203 },
      ];
      expect(attributeCats(durationEvents, catEvents)[0].cat).toBe('Cat A');
    });

    it('REGRESSION: reproduces the exact reported symptom -- two consecutive same-cat visits misattributed as two different cats', () => {
      // User report: two visits close to each other were actually both by
      // the same cat, but got shown as two different cats. Mechanism: the
      // first of the two real same-cat visits has a same-visit cat-change
      // event lagging a few ms behind it; a strict "at or before" match
      // misses it and the visit inherits the stale prior cat from long
      // before. Net wrong result would be Cat B, Cat A; correct is Cat A,
      // Cat A.
      const durationEvents = [
        { value: 46, ts: 1000000 }, // visit A: really Cat A
        { value: 59, ts: 1030000 }, // visit B: really Cat A, 30s later, no new identity write
      ];
      const catEvents = [
        { cat: 'Cat B', ts: 500000 }, // stale, from a much earlier visit
        { cat: 'Cat A', ts: 1000005 }, // A's own identity write, 5ms late
      ];
      expect(attributeCats(durationEvents, catEvents).map((e) => e.cat)).toEqual(['Cat A', 'Cat A']);
    });

    // ------------------------------------------------------------------
    // REGRESSION (reported live, 2026-07-16): a real `last_used_by` write
    // can lag its matching `total_use`/`last_event` write by far more than
    // a second -- one captured case lagged by ~90s. A tolerance window
    // wide enough to always cover that is unsafe on its own: real gaps
    // between two DIFFERENT consecutive visits can be much smaller than
    // that (an ~11s gap between two real visits was also captured
    // elsewhere in this device's history), so a wide fixed window risks
    // reaching past the correct visit and stealing a later, different
    // visit's own identity write. The territory-based design handles both
    // at once: a visit with no competing neighbor nearby can reach
    // arbitrarily far for its own lagged write, while a visit close to
    // its neighbor is bounded by the midpoint between them, so it can
    // never steal that neighbor's write no matter how far away its own
    // territory extends on the OTHER side.
    // ------------------------------------------------------------------
    it('REGRESSION: resolves a ~90s write-order lag correctly when the next visit is far enough away not to compete for it', () => {
      // Real captured shape (anonymized): a visit at t=0 (really Cat B)
      // whose own last_used_by write doesn't land until +90s -- but the
      // NEXT real visit isn't until +47 minutes later, so there's no
      // competition for that write.
      const durationEvents = [
        { value: 28, ts: 1000000 }, // really Cat B, own identity write lags 90s
        { value: 174, ts: 1000000 + 47 * 60 * 1000 }, // next real visit, ~47 min later
      ];
      const catEvents = [
        { cat: 'Cat A', ts: 1000000 - 5 * 60 * 1000 }, // stale, from 5 min earlier (a previous visit)
        { cat: 'Cat B', ts: 1000000 + 90 * 1000 }, // B's own identity write, 90s late
      ];
      expect(attributeCats(durationEvents, catEvents).map((e) => e.cat)).toEqual(['Cat B', 'Cat B']);
    });

    it('REGRESSION: does NOT let a lagged identity write bleed into a close, genuinely different neighboring visit', () => {
      // Same ~90s lag as above, but this time a second, DIFFERENT visit
      // happens only 30s after the first one -- closer to the lagged
      // write than the first visit's own timestamp is. The territory
      // boundary (the midpoint between the two visits) must send the
      // lagged write to the second visit, not the first, even though the
      // first visit is the one it was "really" meant for in a naive
      // reading -- this is the safety trade-off inherent to nearest-
      // neighbor matching without a third data source, documented in
      // README.md's "How the chart, Usage line, and Analytics work".
      const durationEvents = [
        { value: 28, ts: 1000000 },
        { value: 41, ts: 1030000 }, // only 30s later
      ];
      const catEvents = [{ cat: 'Cat B', ts: 1000000 + 90000 }]; // 90s after the first visit, 60s after the second
      const result = attributeCats(durationEvents, catEvents);
      expect(result[1].cat).toBe('Cat B'); // claimed by the visit it's actually nearest to
    });

    it('does not carry a cat-change event across a closer neighboring visit even when it is the only one available', () => {
      const durationEvents = [
        { value: 56, ts: 1000000 },
        { value: 84, ts: 1019000 }, // 19s later
      ];
      const catEvents = [{ cat: 'Cat A', ts: 1020000 }]; // 1s after the second visit -- clearly nearer to it
      const result = attributeCats(durationEvents, catEvents);
      expect(result[0].cat).toBeNull();
      expect(result[1].cat).toBe('Cat A');
    });
  });
});

describe('dedupeFlickerRepeats', () => {
  const HIDDEN = ['unavailable', 'unknown', 'no_events_yet'];

  it('collapses a value that flickers to a hidden state and recovers to itself, keeping the first occurrence', () => {
    const hist = [
      { s: 'Cat A used the litter box', lu: 1000 },
      { s: 'unavailable', lu: 1010 },
      { s: 'Cat A used the litter box', lu: 1020 },
    ];
    expect(dedupeFlickerRepeats(hist, HIDDEN)).toEqual([{ state: 'Cat A used the litter box', ts: 1000000 }]);
  });

  it('does NOT merge two genuinely separate real events with identical text and nothing hidden between them', () => {
    const hist = [
      { s: 'auto_cleaning_completed', lu: 1000 },
      { s: 'auto_cleaning_completed', lu: 2000 },
    ];
    expect(dedupeFlickerRepeats(hist, HIDDEN)).toEqual([
      { state: 'auto_cleaning_completed', ts: 1000000 },
      { state: 'auto_cleaning_completed', ts: 2000000 },
    ]);
  });

  it('does not merge a repeat that is preceded by a genuinely different real value rather than a hidden one', () => {
    const hist = [
      { s: 'Cat A used the litter box', lu: 1000 },
      { s: 'manual_odor_completed', lu: 1500 },
      { s: 'Cat A used the litter box', lu: 2000 },
    ];
    expect(dedupeFlickerRepeats(hist, HIDDEN)).toEqual([
      { state: 'Cat A used the litter box', ts: 1000000 },
      { state: 'manual_odor_completed', ts: 1500000 },
      { state: 'Cat A used the litter box', ts: 2000000 },
    ]);
  });

  it('drops hidden states from the output entirely', () => {
    const hist = [
      { s: 'unavailable', lu: 1000 },
      { s: 'Cat A used the litter box', lu: 2000 },
      { s: 'unknown', lu: 2500 },
    ];
    expect(dedupeFlickerRepeats(hist, HIDDEN)).toEqual([{ state: 'Cat A used the litter box', ts: 2000000 }]);
  });

  it('sorts input by timestamp regardless of arrival order before deduping', () => {
    const hist = [
      { s: 'Cat A used the litter box', lu: 2000 },
      { s: 'unavailable', lu: 1500 },
      { s: 'Cat A used the litter box', lu: 1000 },
    ];
    expect(dedupeFlickerRepeats(hist, HIDDEN)).toEqual([{ state: 'Cat A used the litter box', ts: 1000000 }]);
  });

  it('returns an empty array for missing/non-array input', () => {
    expect(dedupeFlickerRepeats(undefined, HIDDEN)).toEqual([]);
    expect(dedupeFlickerRepeats([], HIDDEN)).toEqual([]);
  });

  // --------------------------------------------------------------------
  // REGRESSION (reported live 2026-07-24): Working Records showed dozens of
  // duplicate rows for a single real visit. `sensor.petkit_puramax_last_event`
  // flickers to `unavailable` roughly every 30s-2min and republishes the
  // identical event text for as long as it remains the true last event; a
  // real captured sequence repeated the same value 43 times over ~2 hours
  // for one visit. This dedup existed before (added after an earlier
  // live-confirmed duplicate-row bug) but was dropped when Working Records
  // was reworked to render `last_event` verbatim, and never carried
  // forward. Fixture below is a trimmed real captured sequence (cat names
  // replaced with placeholders); real timestamps in epoch seconds.
  // --------------------------------------------------------------------
  it('REGRESSION: collapses a real multi-hour flicker run into a single row', () => {
    const hist = [
      { s: 'Cat B used the litter box', lu: 1753304168 },
      { s: 'unavailable', lu: 1753305115 },
      { s: 'Cat B used the litter box', lu: 1753305345 },
      { s: 'unavailable', lu: 1753305701 },
      { s: 'Cat B used the litter box', lu: 1753305732 },
      { s: 'unavailable', lu: 1753306045 },
      { s: 'Cat B used the litter box', lu: 1753306183 },
      { s: 'unavailable', lu: 1753306297 },
      { s: 'Cat B used the litter box', lu: 1753306338 },
      { s: 'unavailable', lu: 1753306408 },
      { s: 'Cat B used the litter box', lu: 1753306438 },
    ];
    expect(dedupeFlickerRepeats(hist, HIDDEN)).toEqual([{ state: 'Cat B used the litter box', ts: 1753304168000 }]);
  });

  describe('confirmedEventTimestamps (disambiguating a flicker-repeat from two real identical-text visits)', () => {
    it('still merges an ordinary flicker-repeat when no confirmed timestamps are supplied at all (default text-only rule)', () => {
      const hist = [
        { s: 'Cat A used the litter box', lu: 1000 },
        { s: 'unavailable', lu: 1010 },
        { s: 'Cat A used the litter box', lu: 1020 },
      ];
      expect(dedupeFlickerRepeats(hist, HIDDEN)).toEqual([{ state: 'Cat A used the litter box', ts: 1000000 }]);
    });

    it('still merges when confirmed timestamps exist but land near neither side of the repeat (e.g. a device-status flicker total_use knows nothing about)', () => {
      const hist = [
        { s: 'maintenance_mode', lu: 1000 },
        { s: 'unavailable', lu: 1010 },
        { s: 'maintenance_mode', lu: 1020 },
      ];
      expect(
        dedupeFlickerRepeats(hist, HIDDEN, { confirmedEventTimestamps: [500000] }),
      ).toEqual([{ state: 'maintenance_mode', ts: 1000000 }]);
    });

    it('does NOT merge when BOTH sides of the repeat land near their own confirmed timestamp -- two real visits, not one', () => {
      const hist = [
        { s: 'Cat A used the litter box', lu: 1000 },
        { s: 'unavailable', lu: 1010 },
        { s: 'Cat A used the litter box', lu: 1020 },
      ];
      expect(
        dedupeFlickerRepeats(hist, HIDDEN, { confirmedEventTimestamps: [1000000, 1020000] }),
      ).toEqual([
        { state: 'Cat A used the litter box', ts: 1000000 },
        { state: 'Cat A used the litter box', ts: 1020000 },
      ]);
    });

    it('still merges when only ONE side has a nearby confirmed timestamp', () => {
      const hist = [
        { s: 'Cat A used the litter box', lu: 1000 },
        { s: 'unavailable', lu: 1010 },
        { s: 'Cat A used the litter box', lu: 1020 },
      ];
      expect(
        dedupeFlickerRepeats(hist, HIDDEN, { confirmedEventTimestamps: [1000000] }),
      ).toEqual([{ state: 'Cat A used the litter box', ts: 1000000 }]);
    });

    it('honors a custom confirmToleranceMs instead of the 10s default', () => {
      const hist = [
        { s: 'Cat A used the litter box', lu: 1000 },
        { s: 'unavailable', lu: 1010 },
        { s: 'Cat A used the litter box', lu: 1020 },
      ];
      // Both confirmed timestamps sit 8s from their respective occurrence
      // (1000000/1020000): within the 10s default tolerance (confirmed, no
      // merge) but outside a tightened 5s tolerance (unconfirmed, merges).
      const confirmedEventTimestamps = [992000, 1028000];
      expect(dedupeFlickerRepeats(hist, HIDDEN, { confirmedEventTimestamps })).toEqual([
        { state: 'Cat A used the litter box', ts: 1000000 },
        { state: 'Cat A used the litter box', ts: 1020000 },
      ]);
      expect(
        dedupeFlickerRepeats(hist, HIDDEN, { confirmedEventTimestamps, confirmToleranceMs: 5000 }),
      ).toEqual([{ state: 'Cat A used the litter box', ts: 1000000 }]);
    });

    // ------------------------------------------------------------------
    // REGRESSION (real captured case, 2026-07-16): two genuinely separate
    // real visits by Cat A, 5.5 minutes apart, sharing identical narration
    // text with an unrelated `unavailable` blip between them. Confirmed via
    // this device's own `total_use` counter, which independently recorded a
    // real increment within ~1s of EACH occurrence (48 and 153, respectively)
    // -- proof these are two real visits, not one flickering value. A prior
    // version of this card's test suite asserted this exact case must never
    // be collapsed; the current text-only rule alone would wrongly merge it
    // (see the sibling REGRESSION test above for the opposite, far more
    // common case this dedup exists to fix). Real timestamps in epoch
    // seconds.
    // ------------------------------------------------------------------
    it('REGRESSION: keeps two real same-text visits separated only by an unrelated unavailable blip', () => {
      const hist = [
        { s: 'Cat A used the litter box', lu: 1784171571.292725 },
        { s: 'unavailable', lu: 1784171872.012611 },
        { s: 'Cat A used the litter box', lu: 1784171902.253726 },
      ];
      const confirmedEventTimestamps = [1784171571291.657, 1784171902252.968]; // total_use delta timestamps (ms)
      expect(dedupeFlickerRepeats(hist, HIDDEN, { confirmedEventTimestamps })).toEqual([
        { state: 'Cat A used the litter box', ts: 1784171571292.725 },
        { state: 'Cat A used the litter box', ts: 1784171902253.726 },
      ]);
    });
  });
});

