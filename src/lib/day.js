/**
 * Local-calendar-day helpers, all with an injectable clock (`now`) so they
 * are deterministic and testable. The original hand-authored card called
 * `new Date()` directly inside these functions, which made them impossible
 * to unit test — that's fixed here as a real behavioral improvement, not
 * just a refactor for its own sake.
 */

/**
 * Returns the [start, end) local-midnight bounds of the calendar day at
 * `offset` days from `now`'s calendar day. `offset: 0` is "today",
 * `offset: -1` is "yesterday", etc.
 *
 * @param {number} offset
 * @param {Date} [now]
 * @returns {{ start: Date, end: Date }}
 */
export function dayBounds(offset, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() + offset);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/**
 * Human label for the day at `offset` days from `now`'s calendar day:
 * "Today", "Yesterday", or a short weekday/month/day string.
 *
 * @param {number} offset
 * @param {Date} [now]
 * @returns {string}
 */
export function dayLabel(offset, now = new Date()) {
  if (offset === 0) return 'Today';
  if (offset === -1) return 'Yesterday';
  const { start } = dayBounds(offset, now);
  return start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Stable per-local-calendar-day bucket key for a timestamp, used to group
 * history points by day regardless of time-of-day.
 *
 * @param {number} timestampMs
 * @returns {string}
 */
export function dayKey(timestampMs) {
  const d = new Date(timestampMs);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
