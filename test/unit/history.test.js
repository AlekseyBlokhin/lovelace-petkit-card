import { describe, it, expect } from 'vitest';
import {
  buildHistoryRequest,
  parseHistoryPoint,
  pointsToEvents,
  deltaEvents,
  catChangeEvents,
  attributeCats,
  CAT_ATTRIBUTION_TOLERANCE_MS,
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
  it('attributes an event to the most recent cat-change event at or before its timestamp', () => {
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

  it('attributes events with no preceding or near-following cat-change event to null (unknown -- nothing to carry forward)', () => {
    // The cat-change event here is well past CAT_ATTRIBUTION_TOLERANCE_MS
    // after the duration event, so it can't be this event's own (lagged)
    // identity write either -- it must belong to some later, different
    // visit, not this one.
    const durationEvents = [{ value: 50, ts: 500 }];
    const catEvents = [{ cat: 'Cat A', ts: 500 + CAT_ATTRIBUTION_TOLERANCE_MS + 1000 }];
    expect(attributeCats(durationEvents, catEvents)).toEqual([{ value: 50, ts: 500, cat: null }]);
  });

  it('switches attribution forward as soon as a later cat-change event is reached', () => {
    // Timestamps use realistic real-world spacing (tens of seconds+, not
    // the sub-second gaps a naive synthetic fixture might use) -- with
    // CAT_ATTRIBUTION_TOLERANCE_MS in play, two events closer together
    // than the tolerance window are no longer a meaningful test of
    // "switches forward", since the later cat-change event would
    // legitimately be pulled into the earlier visit too. See the
    // write-order-lag regression block below for why that tolerance
    // exists.
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
    // after them (as always -- see the write-order-lag block below),
    // others (same cat repeating) don't and must carry forward. Spacing
    // between different-cat visits is realistic (60-120s, matching real
    // observed gaps), not compressed to sub-second synthetic values.
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
  // precision, it is NOT truncated to whole seconds as earlier assumed):
  // for a single physical visit, `total_use` (the duration signal) is
  // ALWAYS written a few milliseconds -- occasionally over a second --
  // BEFORE `last_used_by`/`last_event` (the identity signal), never at
  // the exact same instant. The tests above only ever used an EXACT
  // timestamp match or a change event strictly earlier, which never
  // happens in real data -- that's why this shipped uncaught. Real
  // captured pairs (epoch seconds, full precision, from this device --
  // cat names replaced with Cat A/Cat B):
  //   duration 1783906193.202 / cat-event Cat B@1783906193.210 (+0.008s)
  //   duration 1783907233.978 / cat-event Cat A@1783907235.097 (+1.119s)
  //   duration 1784145166.203 / cat-event Cat A@1784145166.203 (+0.001s)
  // The largest real same-visit gap seen was ~1.1s; the smallest real gap
  // between two genuinely different visits was ~68s (a full litter box
  // visit takes tens of seconds minimum). CAT_ATTRIBUTION_TOLERANCE_MS
  // (15s) sits between those two numbers.
  // --------------------------------------------------------------------
  describe('REGRESSION: attribution write-order lag (identity write lands after the duration write)', () => {
    it('attributes a visit correctly even when its own cat-change event lands 8ms after it', () => {
      const durationEvents = [{ value: 32, ts: 1783906193202 }];
      const catEvents = [{ cat: 'Cat B', ts: 1783906193210 }];
      expect(attributeCats(durationEvents, catEvents)[0].cat).toBe('Cat B');
    });

    it('attributes a visit correctly even when its own cat-change event lands 1.1s after it (largest observed real gap)', () => {
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
      // event lagging a few ms behind it (as always); without tolerance,
      // that write gets missed and the visit inherits the stale prior cat
      // (from long before). The device doesn't re-emit last_used_by for
      // the second visit (same cat as last time), so it just carries
      // forward -- but by then `current` has already been correctly
      // updated by the (late) cat-change event, since that event happens
      // to land before the second visit. Net old-algorithm result:
      // Cat B, Cat A. Correct result: Cat A, Cat A.
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

    it('does not pull a cat-change event more than 15s past a visit forward into that visit\'s attribution', () => {
      // A cat-change event 20s after a visit is outside the tolerance
      // window -- it must NOT be treated as that visit's own identity
      // write. The visit instead carries forward whatever cat was already
      // current (here, none yet -- so null), and the later event is left
      // for whichever visit it actually belongs to.
      const durationEvents = [{ value: 56, ts: 1000000 }];
      const catEvents = [{ cat: 'Cat A', ts: 1020000 }]; // 20s after, past the 15s window
      expect(attributeCats(durationEvents, catEvents)[0].cat).toBeNull();
    });

    it('a cat-change event just outside the tolerance window is correctly picked up by the NEXT visit instead', () => {
      const durationEvents = [
        { value: 56, ts: 1000000 }, // too early to claim the cat-change event below
        { value: 84, ts: 1019000 }, // 19s later -- the event (at 1020000) is within 15s of THIS visit
      ];
      const catEvents = [{ cat: 'Cat A', ts: 1020000 }];
      const result = attributeCats(durationEvents, catEvents);
      expect(result[0].cat).toBeNull();
      expect(result[1].cat).toBe('Cat A');
    });

    it('exposes the tolerance as a named, overridable constant', () => {
      expect(CAT_ATTRIBUTION_TOLERANCE_MS).toBe(15000);
      const durationEvents = [{ value: 50, ts: 1000 }];
      const catEvents = [{ cat: 'Cat A', ts: 1000 + CAT_ATTRIBUTION_TOLERANCE_MS + 1 }];
      // Just past the default tolerance -> not this visit's.
      expect(attributeCats(durationEvents, catEvents)[0].cat).toBeNull();
      // A custom, smaller tolerance can be passed explicitly.
      const catEvents2 = [{ cat: 'Cat A', ts: 1005 }];
      expect(attributeCats(durationEvents, catEvents2, { toleranceMs: 2 })[0].cat).toBeNull();
      expect(attributeCats(durationEvents, catEvents2, { toleranceMs: 10 })[0].cat).toBe('Cat A');
    });
  });
});

