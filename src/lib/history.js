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
 * Parses a single history point from a `history_during_period` response
 * into `{ value, ts }`, or `null` if it can't be parsed.
 *
 * The HA history WS response uses compact keys (`s` = state, `lu` = last
 * updated, epoch seconds) rather than the verbose REST shape
 * (`state`/`last_changed`, ISO strings) — this consolidates handling both,
 * which the original hand-authored card duplicated inline in four places.
 *
 * @param {{ s?: string, state?: string, lu?: number, last_changed?: string }} point
 * @returns {{ value: number, ts: number } | null}
 */
export function parseHistoryPoint(point) {
  if (!point) return null;
  const rawValue = point.s ?? point.state;
  const value = parseFloat(rawValue);
  const ts = point.lu ? point.lu * 1000 : point.last_changed ? Date.parse(point.last_changed) : null;
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
    if (delta > minDelta && delta < maxDelta) {
      events.push({ value: delta, ts: points[i].ts });
    }
  }
  return events;
}

/**
 * Extracts identity-change events from an identity/label sensor's history
 * (e.g. a device's "last used by" sensor), keeping only points whose state
 * is one of `knownNames`. Devices commonly write transient placeholder
 * states (`unavailable`, `no_record_yet`, ...) between real values on every
 * coordinator refresh — those aren't a change of identity and are dropped
 * here rather than passed on to `attributeCats`.
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
    const state = point.s ?? point.state;
    if (!nameSet.has(state)) continue;
    const ts = point.lu ? point.lu * 1000 : point.last_changed ? Date.parse(point.last_changed) : null;
    if (!ts || Number.isNaN(ts)) continue;
    events.push({ cat: state, ts });
  }
  events.sort((a, b) => a.ts - b.ts);
  return events;
}

/**
 * How far AFTER a duration event's own timestamp a cat-change event may
 * still land and be treated as belonging to that same visit, rather than
 * the next one.
 *
 * This exists because of a real, consistently-observed write-order lag on
 * PetKit PURAMAX: for a single physical visit, the device/integration
 * writes `total_use` (the duration signal) fractionally BEFORE
 * `last_used_by`/`last_event` (the identity signal) -- never at the exact
 * same instant, and never the other way around. Measured against three
 * days of this device's real history (`lu` timestamps carry full
 * sub-second precision over the WS API, they are NOT truncated to whole
 * seconds): the gap for a matching same-visit pair was consistently a few
 * milliseconds, with one outlier at ~1.1s. The smallest gap seen between
 * two genuinely DIFFERENT visits was ~68s (litter box visits physically
 * can't happen close together -- the shortest real visit duration observed
 * was 27s, before any cooldown/cleaning cycle). 15s sits comfortably
 * between those two numbers.
 *
 * A strict "cat-change event at or BEFORE this duration event" carry
 * forward (no tolerance) misses the visit's own identity write every
 * time, because that write's timestamp is always slightly later --
 * shifting every attribution back by one visit. This was a real, reported
 * bug (a cat's real last visit showing as the previous cat, and two
 * same-cat visits in a row showing as two different cats) that went
 * uncaught because the original test fixtures used exact-timestamp
 * matches, which never occurs in real data. See `history.test.js` for the
 * regression fixtures taken from live captured timestamps.
 *
 * @type {number}
 */
export const CAT_ATTRIBUTION_TOLERANCE_MS = 15000;

/**
 * Attributes each duration event to a cat via carry-forward (last
 * observation carried forward): the cat in effect is whichever
 * `catChangeEvents` entry most recently occurred at or before that event's
 * timestamp (plus `toleranceMs`, see `CAT_ATTRIBUTION_TOLERANCE_MS`). This
 * is deliberately not an exact-timestamp match — when the same cat visits
 * twice in a row, most PetKit integrations don't emit a new "last used by"
 * state (the value didn't change), so there's no change event to match
 * against the second visit; the correct answer for it is still "whoever
 * the last known cat was."
 *
 * `catEvents` must already be sorted by `ts` ascending (as returned by
 * `catChangeEvents`). `durationEvents` is assumed sorted by `ts` ascending
 * too, so a single forward pass with one pointer suffices.
 *
 * @param {Array<{ value: number, ts: number }>} durationEvents
 * @param {Array<{ cat: string, ts: number }>} catEvents
 * @param {{ toleranceMs?: number }} [options]
 * @returns {Array<{ value: number, ts: number, cat: string|null }>}
 */
export function attributeCats(durationEvents, catEvents, { toleranceMs = CAT_ATTRIBUTION_TOLERANCE_MS } = {}) {
  let idx = 0;
  let current = null;
  return durationEvents.map((event) => {
    while (idx < catEvents.length && catEvents[idx].ts <= event.ts + toleranceMs) {
      current = catEvents[idx].cat;
      idx++;
    }
    return { ...event, cat: current };
  });
}

/**
 * How close a `last_event` "narration" point (e.g. a raw state of
 * `"<cat> used the litter box"`) may be to an already-reconstructed
 * `total_use`-derived visit for the same cat and still count as describing
 * that same physical visit, for de-duplication purposes. Reuses
 * `CAT_ATTRIBUTION_TOLERANCE_MS`'s reasoning/magnitude -- it's the same
 * device writing both signals for the same event, so the same real-world
 * write-order-lag bound applies.
 *
 * @type {number}
 */
export const VISIT_NARRATION_DEDUPE_TOLERANCE_MS = CAT_ATTRIBUTION_TOLERANCE_MS;

/**
 * Whether a `last_event` point narrating a specific cat's visit (raw state
 * exactly `"<cat.name> used the litter box"`) duplicates a visit already
 * present in `visits` (as returned by a card's `_fetchVisits`/similar) for
 * that same cat, within `toleranceMs`.
 *
 * Two different device sensors (`total_use` and `last_event`) each
 * independently report the same real visit -- `total_use`'s reconstruction
 * is richer (it carries duration), so when both exist for the same visit,
 * the `last_event` narration is the redundant one and should be dropped
 * from a merged timeline rather than shown as a second row.
 *
 * @param {object} params
 * @param {number} params.ts - the last_event point's timestamp (ms).
 * @param {string} params.rawState - the last_event point's raw state string.
 * @param {Array<{ cat: { name: string }, ts: number }>} params.visits
 * @param {Array<{ name: string }>} params.cats
 * @param {number} [params.toleranceMs]
 * @returns {boolean}
 */
export function isDuplicateVisitNarration({
  ts,
  rawState,
  visits,
  cats,
  toleranceMs = VISIT_NARRATION_DEDUPE_TOLERANCE_MS,
}) {
  const cat = cats.find((c) => rawState === `${c.name} used the litter box`);
  if (!cat) return false;
  return visits.some((v) => v.cat.name === cat.name && Math.abs(v.ts - ts) <= toleranceMs);
}
