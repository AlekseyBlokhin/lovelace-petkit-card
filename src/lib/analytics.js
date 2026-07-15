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
 * `*Total` fields are the sum of visit durations over the window (used by
 * `detectAnomaly()` for the decline/spike banner, which is legitimately
 * about total time-in-box). `*AvgDuration` fields are the average length of
 * a single visit over the same window -- for the multi-day windows this is
 * a *weighted* average (total duration across the window's days divided by
 * total visit count across those same days), not a mean of each day's own
 * average, so a day with many visits isn't drowned out by a day with few.
 *
 * @param {Record<string, { count: number, total: number }>} byDay
 * @param {string} todayKey
 * @returns {{
 *   todayCount: number, todayTotal: number, todayAvgDuration: number|null,
 *   avg3dVisits: number|null, avg3dTotal: number|null, avg3dDuration: number|null,
 *   avg7dVisits: number|null, avg7dTotal: number|null, avg7dDuration: number|null,
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

  // Weighted average visit duration across a window: sum of durations over
  // sum of counts, not a mean of each day's own average.
  const avgDuration = (keys) => {
    if (!keys.length) return null;
    const totalDuration = keys.reduce((sum, key) => sum + byDay[key].total, 0);
    const totalCount = keys.reduce((sum, key) => sum + byDay[key].count, 0);
    return totalCount > 0 ? totalDuration / totalCount : null;
  };

  const today = byDay[todayKey];
  const todayCount = today ? today.count : 0;
  const todayTotal = today ? today.total : 0;

  return {
    todayCount,
    todayTotal,
    todayAvgDuration: todayCount > 0 ? todayTotal / todayCount : null,
    avg3dVisits: avg(last3, 'count'),
    avg3dTotal: avg(last3, 'total'),
    avg3dDuration: avgDuration(last3),
    avg7dVisits: avg(last7, 'count'),
    avg7dTotal: avg(last7, 'total'),
    avg7dDuration: avgDuration(last7),
    daysOfHistory: pastDays.length,
  };
}

/**
 * Flags a cat as overdue for a litter box visit: no visit in at least
 * `thresholdHours`, checked against wall-clock time rather than the 7-day
 * rolling average used by `detectAnomaly()`. This is deliberately an
 * absolute check, not a relative one -- a gradual multi-day decline drags a
 * rolling average down with it and can go unnoticed by a percentage-based
 * comparison, whereas "no visit in N hours" can't drift.
 *
 * `lastVisitTs === null` (no visit at all within however far back the
 * caller looked) always alerts, regardless of `thresholdHours`.
 *
 * @param {object} params
 * @param {number|null} params.lastVisitTs - epoch ms of the most recent visit, or null if none found.
 * @param {number|Date} params.now
 * @param {number} params.thresholdHours
 * @returns {{ alerting: boolean, hoursSince: number|null }}
 */
export function detectNoVisitAlert({ lastVisitTs, now, thresholdHours }) {
  const nowMs = now instanceof Date ? now.getTime() : now;
  if (lastVisitTs == null) return { alerting: true, hoursSince: null };
  const hoursSince = (nowMs - lastVisitTs) / 3600000;
  return { alerting: hoursSince >= thresholdHours, hoursSince };
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
