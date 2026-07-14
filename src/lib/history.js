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
 * @param {object} params
 * @param {Date|string} params.startTime
 * @param {Date|string} params.endTime
 * @param {string[]} params.entityIds
 * @returns {object} WS payload for `hass.callWS(...)`.
 */
export function buildHistoryRequest({ startTime, endTime, entityIds }) {
  const start = startTime instanceof Date ? startTime.toISOString() : startTime;
  const end = endTime instanceof Date ? endTime.toISOString() : endTime;
  return {
    type: 'history/history_during_period',
    start_time: start,
    end_time: end,
    entity_ids: entityIds,
    minimal_response: false,
    no_attributes: true,
    // See the doc comment above — must always be false.
    include_start_time_state: false,
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
