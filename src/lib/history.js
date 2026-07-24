/**
 * Home Assistant `history/history_during_period` WebSocket request/response
 * helpers, generic across any entities (not visit- or cat-specific) so any
 * future card can reuse them.
 */

/**
 * Builds the WS payload for a `history/history_during_period` call.
 *
 * `include_start_time_state` is hardcoded to `false` here — deliberately,
 * and it must stay that way. Without it, Home Assistant injects a synthetic
 * point per entity stamped at exactly `start_time`, representing "whatever
 * the state was when the query window opened" (e.g. local midnight for a
 * single-day chart). A downstream consumer with no filter for this treats
 * it as a real event. This is the fix for a real production incident (the
 * "midnight phantom-visit bug"): every night, each cat's chart/analytics
 * showed one extra fake "visit" at exactly 00:00, re-stamping the previous
 * day's actual last value as if it had just happened again. See
 * `history.test.js` for the regression test that pins this down.
 *
 * `includeStartTimeState` defaults to `false` for the reason above. The one
 * legitimate exception is an identity/label sensor (e.g. "last used by")
 * queried purely for carry-forward attribution rather than plotted as an
 * event itself — there, the synthetic start-of-window point is exactly the
 * "whatever the value was when the window opened" baseline you want, so
 * pass `includeStartTimeState: true` for that specific query.
 *
 * @param {object} params
 * @param {Date|string} params.startTime
 * @param {Date|string} params.endTime
 * @param {string[]} params.entityIds
 * @param {boolean} [params.includeStartTimeState]
 * @returns {object} WS payload for `hass.callWS(...)`.
 */
export function buildHistoryRequest({ startTime, endTime, entityIds, includeStartTimeState = false }) {
  const start = startTime instanceof Date ? startTime.toISOString() : startTime;
  const end = endTime instanceof Date ? endTime.toISOString() : endTime;
  return {
    type: 'history/history_during_period',
    start_time: start,
    end_time: end,
    entity_ids: entityIds,
    minimal_response: false,
    no_attributes: true,
    include_start_time_state: includeStartTimeState,
  };
}

/**
 * Normalizes a single raw history point from a `history_during_period`
 * response into `{ state, ts }`, or `null` if there's no point at all.
 *
 * The HA history WS response uses compact keys (`s` = state, `lu` = last
 * updated, epoch seconds) rather than the verbose REST shape
 * (`state`/`last_changed`, ISO strings) — this consolidates handling both
 * shapes in one place, which the original hand-authored card duplicated
 * inline in four places.
 *
 * Deliberately does NOT `parseFloat` the state or validate the timestamp —
 * some callers (e.g. `catChangeEvents`) need the raw state string (a cat's
 * name, or PURAMAX's `unknown_pet` placeholder), not a number.
 * `parseHistoryPoint` below layers the numeric parsing/validation on top of
 * this for callers that need a duration/counter value.
 *
 * @param {{ s?: string, state?: string, lu?: number, last_changed?: string }} point
 * @returns {{ state: string|undefined, ts: number|null } | null}
 */
export function rawStateAndTs(point) {
  if (!point) return null;
  const state = point.s ?? point.state;
  const ts = point.lu ? point.lu * 1000 : point.last_changed ? Date.parse(point.last_changed) : null;
  return { state, ts };
}

/**
 * Parses a single history point from a `history_during_period` response
 * into `{ value, ts }`, or `null` if it can't be parsed.
 *
 * @param {{ s?: string, state?: string, lu?: number, last_changed?: string }} point
 * @returns {{ value: number, ts: number } | null}
 */
export function parseHistoryPoint(point) {
  const raw = rawStateAndTs(point);
  if (!raw) return null;
  const value = parseFloat(raw.state);
  const { ts } = raw;
  if (!Number.isFinite(value) || !ts || Number.isNaN(ts)) return null;
  return { value, ts };
}

/**
 * Converts a single entity's raw history array (as found at
 * `response[entity_id]`) into a sorted-by-nothing array of `{ value, ts }`
 * events, optionally filtering out non-positive values (used to discard a
 * device's own counter resets, e.g. a midnight reset to 0).
 *
 * @param {Array<object>} historyForEntity
 * @param {{ filterPositive?: boolean }} [options]
 * @returns {Array<{ value: number, ts: number }>}
 */
export function pointsToEvents(historyForEntity, { filterPositive = true } = {}) {
  if (!Array.isArray(historyForEntity)) return [];
  const events = [];
  for (const point of historyForEntity) {
    const parsed = parseHistoryPoint(point);
    if (!parsed) continue;
    if (filterPositive && parsed.value <= 0) continue;
    events.push(parsed);
  }
  return events;
}

/**
 * Turns a running-total counter's history (e.g. a device's cumulative
 * "total use" sensor, which bumps by one visit's duration on every use) into
 * per-visit `{ value, ts }` events, where `value` is the delta between
 * consecutive readings rather than the raw cumulative value.
 *
 * Only deltas strictly between `minDelta` and `maxDelta` are kept, so a
 * daily counter reset-to-zero (a large negative or zero delta) and a bogus
 * jump (e.g. a multi-day gap from the device having been offline) aren't
 * read as a single implausible visit. Unparseable points (`unavailable`,
 * etc., via `parseHistoryPoint`) are dropped before computing deltas, so a
 * transient coordinator hiccup between two real readings doesn't corrupt
 * the delta between them.
 *
 * A positive delta immediately undone by the very next reading (the value
 * drops back to EXACTLY its pre-delta level) is also discarded -- this is a
 * real, observed device/write glitch (confirmed against live history: two
 * phantom "visits" that never happened in the PetKit app, each reverted by
 * the next reading within seconds), not a counter reset (which drops to
 * near zero, not back to an arbitrary prior reading) and not a real visit
 * (a genuine `total_use` increment is permanent). See `history.test.js` for
 * the real captured data this was diagnosed from.
 *
 * @param {Array<object>} historyForEntity
 * @param {{ minDelta?: number, maxDelta?: number }} [options]
 * @returns {Array<{ value: number, ts: number }>}
 */
export function deltaEvents(historyForEntity, { minDelta = 0, maxDelta = Infinity } = {}) {
  if (!Array.isArray(historyForEntity)) return [];
  const points = historyForEntity
    .map(parseHistoryPoint)
    .filter(Boolean)
    .sort((a, b) => a.ts - b.ts);
  const events = [];
  for (let i = 1; i < points.length; i++) {
    const delta = points[i].value - points[i - 1].value;
    if (delta <= minDelta || delta >= maxDelta) continue;
    const next = points[i + 1];
    if (next && next.value === points[i - 1].value) continue;
    events.push({ value: delta, ts: points[i].ts });
  }
  return events;
}

/**
 * Reduces a "last event" sensor's raw history into the events actually
 * worth showing, matching the sensor's own semantics: it holds whatever
 * event most recently happened, so two consecutive appearances of the
 * identical text are the SAME underlying event still being reported, not a
 * second occurrence of it -- unless something else genuinely happened in
 * between.
 *
 * `hiddenStates` (matched case-insensitively) marks placeholder/noise
 * states -- e.g. `unavailable`, or a caller's own exclude list -- that are
 * dropped from the output entirely AND are the ONLY thing allowed to
 * trigger a merge: a repeat is only ever a MERGE CANDIDATE when the point
 * immediately before it (in raw arrival order, before any filtering) was
 * one of these hidden states -- i.e. exactly the "flickered to a hidden
 * state and recovered to the same value" signature.
 *
 * A merge candidate is not automatically merged, though: real captured data
 * (2026-07-16) shows a genuine case of two SEPARATE real visits by the same
 * cat, 5.5 minutes apart, sharing identical narration text with an
 * unrelated `unavailable` blip between them -- indistinguishable from a
 * true flicker-repeat using this sensor's own text/timing alone (true
 * flicker chains span anywhere from seconds to hours, so no time-gap
 * threshold can separate the two cases). `options.confirmedEventTimestamps`
 * -- typically the SAME day's `total_use`-derived visit timestamps the
 * caller already has on hand for the chart, e.g. `deltaEvents(...)` output
 * -- resolves the ambiguity: a merge candidate is only actually merged when
 * NEITHER side has its own independent confirmed-event timestamp nearby (a
 * device-status flicker like `maintenance_mode`, which total_use knows
 * nothing about, always merges normally); if BOTH the earlier and later
 * occurrence land near their own confirmed timestamp, they're kept as two
 * separate rows. This is a narrow, binary "did something independently
 * verifiable happen here" check, not the kind of full merge/re-synthesis
 * (replacing last_event's own text with a computed sentence, matching every
 * row 1:1 against total_use) that caused real bugs before (issues #13, #14,
 * #16) -- omitting `confirmedEventTimestamps` falls back to the simpler
 * text-only rule.
 *
 * REGRESSION: this exact dedup existed before (added after a live-confirmed
 * duplicate-row bug, refined twice more to fix a tracking edge case where a
 * value suppressed by an unrelated rule left the flicker-tracker stale) but
 * was dropped when Working Records was reworked to render `last_event`
 * verbatim, and never carried forward. Confirmed live 2026-07-24: this
 * sensor flickers to `unavailable` every ~30s-2min and republishes the
 * identical event text for as long as it remains the true last event -- one
 * observed run repeated 43 times over ~2 hours for what was really one
 * visit. See `history.test.js` for the real captured sequences (both the
 * flicker-repeat case and the genuinely-separate-visits case).
 *
 * @param {Array<object>} historyForEntity
 * @param {string[]} hiddenStates - raw state values to drop from the output
 *   and treat as transparent flicker noise (matched case-insensitively).
 * @param {{ confirmedEventTimestamps?: number[], confirmToleranceMs?: number }} [options]
 * @returns {Array<{ state: string, ts: number }>} ascending by ts, one
 *   entry per real event.
 */
export function dedupeFlickerRepeats(historyForEntity, hiddenStates, options = {}) {
  if (!Array.isArray(historyForEntity)) return [];
  const hiddenSet = new Set(hiddenStates.map((s) => String(s).toLowerCase()));
  const { confirmedEventTimestamps = [], confirmToleranceMs = 10000 } = options;
  const hasConfirmedEventNear = (ts) => confirmedEventTimestamps.some((c) => Math.abs(c - ts) <= confirmToleranceMs);

  const points = historyForEntity
    .map(rawStateAndTs)
    .filter((p) => p && p.state != null && p.ts != null && !Number.isNaN(p.ts))
    .sort((a, b) => a.ts - b.ts);

  const events = [];
  let lastKeptState = null;
  let lastKeptTs = null;
  let prevWasHidden = false;
  for (const { state, ts } of points) {
    if (hiddenSet.has(String(state).toLowerCase())) {
      prevWasHidden = true;
      continue;
    }
    const isMergeCandidate = prevWasHidden && state === lastKeptState;
    const bothIndependentlyConfirmed = isMergeCandidate && hasConfirmedEventNear(lastKeptTs) && hasConfirmedEventNear(ts);
    const isFlickerRecovery = isMergeCandidate && !bothIndependentlyConfirmed;
    prevWasHidden = false;
    if (isFlickerRecovery) continue;
    lastKeptState = state;
    lastKeptTs = ts;
    events.push({ state, ts });
  }
  return events;
}

/**
 * Fills in a real confirmed visit that `last_event` never got its OWN raw
 * history point for at all -- distinct from (and complementary to)
 * `dedupeFlickerRepeats`'s job of deciding whether an EXISTING repeated raw
 * point is a new event or not. `last_event` only gets a new history point
 * when its value actually CHANGES; two consecutive real visits with
 * identical narration text (typically the same cat visiting again shortly
 * after) and no `unavailable` flicker in between produce NO second history
 * point whatsoever -- there's nothing for `dedupeFlickerRepeats` to even
 * see, let alone merge or keep.
 *
 * REGRESSION (reported live 2026-07-24): total_use confirmed two real
 * visits by the same cat about a minute apart (+43s at 16:03:15, +46s at
 * 16:04:17 UTC); `last_event` only had a single raw point, for the first
 * one -- its value was already "Cat A used the litter box" from that first
 * visit, so the second, identical-text visit never changed it and HA's
 * recorder never wrote anything for it. Working Records showed only one
 * row where the chart (which reconstructs visits from `total_use`
 * independently, and already carries an unresolved identity/cat forward
 * across a repeat visit exactly the same way -- see `attributeCats`) showed
 * two.
 *
 * Uses the same territory-bounded nearest-neighbor technique as
 * `attributeCats` (bounded by the midpoint to each neighboring EVENT in
 * `events`, so a confirmed timestamp can never be pulled across a
 * neighboring kept row no matter how far it has to reach): for each kept
 * event, the nearest confirmed timestamp in its territory is treated as the
 * one that's already represented by that row; every OTHER confirmed
 * timestamp in the same territory is a real, independently-verified repeat
 * with no history point of its own, and gets its own new row -- same text,
 * its own real confirmed timestamp. A territory with zero or one confirmed
 * timestamps (the common case -- most `last_event` values, e.g.
 * `maintenance_mode`, have nothing to do with `total_use` at all) is left
 * untouched.
 *
 * @param {Array<{ state: string, ts: number }>} events - ascending by ts,
 *   e.g. `dedupeFlickerRepeats`'s own output.
 * @param {number[]} confirmedEventTimestamps
 * @returns {Array<{ state: string, ts: number }>} ascending by ts.
 */
export function expandConfirmedRepeats(events, confirmedEventTimestamps) {
  if (!Array.isArray(events) || events.length === 0) return events || [];
  if (!Array.isArray(confirmedEventTimestamps) || confirmedEventTimestamps.length === 0) return events;

  const confirmed = [...confirmedEventTimestamps].sort((a, b) => a - b);
  const n = events.length;
  const expanded = [];

  for (let i = 0; i < n; i++) {
    const ts = events[i].ts;
    const lowerBound = i === 0 ? -Infinity : (events[i - 1].ts + ts) / 2;
    const upperBound = i === n - 1 ? Infinity : (ts + events[i + 1].ts) / 2;
    const inTerritory = confirmed.filter((c) => c >= lowerBound && c < upperBound);

    expanded.push(events[i]);
    if (inTerritory.length <= 1) continue;

    let nearestIdx = 0;
    let nearestDist = Infinity;
    inTerritory.forEach((c, idx) => {
      const dist = Math.abs(c - ts);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    });
    inTerritory.forEach((c, idx) => {
      if (idx === nearestIdx) return;
      expanded.push({ state: events[i].state, ts: c });
    });
  }

  expanded.sort((a, b) => a.ts - b.ts);
  return expanded;
}

/**
 * PetKit PURAMAX firmware's own placeholder identity value on `last_used_by`
 * for a visit whose cat it couldn't recognize (as opposed to `unavailable`/
 * `no_record_yet`, which mean "no assertion at all", not "asserting
 * unknown"). Verified live: this is written in real time, in lockstep with
 * `total_use` (sub-millisecond gap, same as any other identity write) --
 * it is a real, meaningful identity value, not noise.
 *
 * @type {string}
 */
export const UNKNOWN_CAT_STATE = 'unknown_pet';

/** The identity `catChangeEvents` reports for `UNKNOWN_CAT_STATE`. @type {string} */
export const UNKNOWN_CAT_LABEL = 'Unknown';

/**
 * Extracts identity-change events from an identity/label sensor's history
 * (e.g. a device's "last used by" sensor), keeping points whose state is
 * either one of `knownNames` or `UNKNOWN_CAT_STATE` (mapped to
 * `UNKNOWN_CAT_LABEL`). Devices commonly write OTHER transient placeholder
 * states (`unavailable`, `no_record_yet`, ...) between real values on every
 * coordinator refresh -- those aren't an identity assertion at all and are
 * dropped here rather than passed on to `attributeCats`.
 *
 * REGRESSION (reported live, 2026-07-16): `UNKNOWN_CAT_STATE` used to be
 * dropped right along with the genuine noise states above, because it
 * isn't a member of `knownNames` -- so a real "the device couldn't
 * identify this cat" assertion silently vanished, and carry-forward
 * attribution just kept whatever configured cat was attributed to the
 * PREVIOUS visit instead. Two real visits that day were misattributed this
 * way (06:15 and 14:05 local, both really unidentified, both shown as the
 * previous known cat). See `history.test.js` for the fixtures taken from
 * this device's real history.
 *
 * @param {Array<{ s?: string, state?: string, lu?: number, last_changed?: string }>} historyForEntity
 * @param {string[]} knownNames
 * @returns {Array<{ cat: string, ts: number }>}
 */
export function catChangeEvents(historyForEntity, knownNames) {
  if (!Array.isArray(historyForEntity)) return [];
  const nameSet = new Set(knownNames);
  const events = [];
  for (const point of historyForEntity) {
    const { state, ts } = rawStateAndTs(point);
    let cat;
    if (nameSet.has(state)) cat = state;
    else if (state === UNKNOWN_CAT_STATE) cat = UNKNOWN_CAT_LABEL;
    else continue;
    if (!ts || Number.isNaN(ts)) continue;
    events.push({ cat, ts });
  }
  events.sort((a, b) => a.ts - b.ts);
  return events;
}

/**
 * Attributes each duration event (a real `total_use` visit) to a cat, using
 * nearest-neighbor matching against `catChangeEvents` rather than a forward
 * carry-forward-plus-fixed-tolerance window.
 *
 * REGRESSION (reported live, 2026-07-16): a real `last_used_by` write can
 * lag its matching `total_use` write by far more than a few seconds -- one
 * captured case lagged by ~90s (vs. the ~1.1s worst case measured
 * previously, which is where the old fixed 15s tolerance came from). But a
 * tolerance wide enough to always catch a ~90s lag is unsafe on its own:
 * real gaps between consecutive DIFFERENT visits can be much smaller than
 * that (an ~11s gap between two real visits was also captured), so a wide
 * fixed window risks reaching past the correct visit and stealing a
 * later/different visit's own identity write.
 *
 * The safe fix is adaptive, not a bigger constant: each duration event
 * only ever considers `catChangeEvents` within its own "territory" -- the
 * time span from the midpoint to the PREVIOUS duration event, to the
 * midpoint to the NEXT one. Every cat-change event falls into exactly one
 * territory (whichever duration event it's chronologically closest to),
 * so an event can never be pulled across a neighboring real visit no
 * matter how large its own lag turns out to be, while a visit with no
 * competing neighbor nearby can still reach arbitrarily far (in either
 * direction) to find its own lagged identity write. Within a territory,
 * the cat-change event nearest the visit's own timestamp wins; if a
 * territory has none at all, the visit carries forward whatever cat was
 * last resolved (same "repeat visit by the same cat" semantics as before
 * -- most PetKit integrations don't emit a new `last_used_by` state when
 * the same cat visits again immediately).
 *
 * `catEvents` must already be sorted by `ts` ascending (as returned by
 * `catChangeEvents`). `durationEvents` is assumed sorted by `ts` ascending
 * too, so a single forward pass with one pointer suffices.
 *
 * @param {Array<{ value: number, ts: number }>} durationEvents
 * @param {Array<{ cat: string, ts: number }>} catEvents
 * @returns {Array<{ value: number, ts: number, cat: string|null }>}
 */
export function attributeCats(durationEvents, catEvents) {
  const n = durationEvents.length;
  const resolved = new Array(n).fill(null);
  let ceIdx = 0;
  let carried = null;
  for (let i = 0; i < n; i++) {
    const ts = durationEvents[i].ts;
    const lowerBound = i === 0 ? -Infinity : (durationEvents[i - 1].ts + ts) / 2;
    const upperBound = i === n - 1 ? Infinity : (ts + durationEvents[i + 1].ts) / 2;

    // Cat-change events strictly before this territory belong to an
    // earlier (already-resolved) territory or seed the very first one --
    // just fold them into the carried-forward value as we pass.
    while (ceIdx < catEvents.length && catEvents[ceIdx].ts < lowerBound) {
      carried = catEvents[ceIdx].cat;
      ceIdx++;
    }

    // Within this territory, this visit's own attribution is whichever
    // cat-change event lands NEAREST its own timestamp (may be before or
    // after); `carried` still advances to the chronologically LAST one in
    // the territory, for the next visit to inherit if it has none of its
    // own.
    let nearest = null;
    let nearestDist = Infinity;
    while (ceIdx < catEvents.length && catEvents[ceIdx].ts < upperBound) {
      const dist = Math.abs(catEvents[ceIdx].ts - ts);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = catEvents[ceIdx].cat;
      }
      carried = catEvents[ceIdx].cat;
      ceIdx++;
    }
    resolved[i] = nearest !== null ? nearest : carried;
  }
  return durationEvents.map((e, i) => ({ ...e, cat: resolved[i] }));
}

