/**
 * Pure client-side analytics over a stream of `{ value, ts }` events (e.g.
 * litter box visits), bucketed by calendar day. No accumulator/statistics
 * helper entities needed — everything here derives from raw history.
 */

/**
 * Groups events into per-day `{ count, total }` buckets.
 *
 * @param {Array<{ value: number, ts: number }>} events
 * @param {{ dayKeyFn: (ts: number) => string }} options
 * @returns {Record<string, { count: number, total: number }>}
 */
export function bucketByDay(events, { dayKeyFn }) {
  const byDay = {};
  for (const event of events || []) {
    const key = dayKeyFn(event.ts);
    if (!byDay[key]) byDay[key] = { count: 0, total: 0 };
    byDay[key].count += 1;
    byDay[key].total += event.value;
  }
  return byDay;
}

/**
 * Summarizes a per-day bucket map into today/3d-avg/7d-avg figures.
 *
 * Averages over an empty set of days are `null` (not `0`), matching the
 * original card's "—" display for "not enough history yet" rather than
 * implying a real zero average.
 *
 * @param {Record<string, { count: number, total: number }>} byDay
 * @param {string} todayKey
 * @returns {{
 *   todayCount: number, todayTotal: number,
 *   avg3dVisits: number|null, avg3dTotal: number|null,
 *   avg7dVisits: number|null, avg7dTotal: number|null,
 *   daysOfHistory: number,
 * }}
 */
export function summarize(byDay, todayKey) {
  const pastDays = Object.keys(byDay)
    .filter((key) => key !== todayKey)
    .sort();
  const last3 = pastDays.slice(-3);
  const last7 = pastDays.slice(-7);

  const avg = (keys, field) =>
    keys.length ? keys.reduce((sum, key) => sum + byDay[key][field], 0) / keys.length : null;

  const today = byDay[todayKey];

  return {
    todayCount: today ? today.count : 0,
    todayTotal: today ? today.total : 0,
    avg3dVisits: avg(last3, 'count'),
    avg3dTotal: avg(last3, 'total'),
    avg7dVisits: avg(last7, 'count'),
    avg7dTotal: avg(last7, 'total'),
    daysOfHistory: pastDays.length,
  };
}

/**
 * Flags an unusually low or high total for today versus the 7-day average,
 * gated so it doesn't fire on thin history or early in the day (before
 * there's been a fair chance to accumulate a typical day's total).
 *
 * @param {object} params
 * @param {number} params.todayTotal
 * @param {number|null} params.avg7dTotal
 * @param {number} params.daysOfHistory
 * @param {number} params.thresholdPct - 0-100, e.g. 60 means "below 60% or above 140% of average".
 * @param {number} params.hourOfDay - 0-23, current local hour.
 * @returns {'low'|'high'|null}
 */
export function detectAnomaly({ todayTotal, avg7dTotal, daysOfHistory, thresholdPct, hourOfDay }) {
  if (daysOfHistory < 3) return null;
  if (!avg7dTotal) return null;
  if (hourOfDay < 18) return null;

  const threshold = thresholdPct / 100;
  if (todayTotal < threshold * avg7dTotal) return 'low';
  if (todayTotal > (2 - threshold) * avg7dTotal) return 'high';
  return null;
}
