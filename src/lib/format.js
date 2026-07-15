/**
 * Formats a duration in seconds as a compact human string.
 *
 * - Under 60s: "Ns" (e.g. "42s").
 * - 60s and above: "MmSSs" (e.g. "1m00s", "12m05s").
 *
 * Mirrors the original hand-authored card's `_fmtDuration`.
 *
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  const total = Math.round(seconds || 0);
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m${s.toString().padStart(2, '0')}s`;
}

/**
 * Formats a duration in seconds as PETKIT-app-style "MM'SS\"" (e.g.
 * 0 -> "00'00\"", 90 -> "01'30\""). Both components are always zero-padded
 * to 2 digits and minutes never roll over into hours (a single visit is
 * never long enough for that to matter, and the official PETKIT app itself
 * never shows an hour component for a visit duration).
 *
 * Distinct from formatDuration() (this card's own "Xm00s" style, used
 * elsewhere on the card) -- this one specifically matches the vocabulary the
 * official PETKIT app uses, requested for the chart's y-axis specifically.
 *
 * @param {number} seconds
 * @returns {string}
 */
export function formatClockDuration(seconds) {
  const total = Math.round(seconds || 0);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}'${s.toString().padStart(2, '0')}"`;
}

/**
 * Escapes a value for safe interpolation into HTML text or attribute
 * context. The card builds its DOM via raw `innerHTML` template strings, and
 * several of those strings interpolate live HA entity *state* values (e.g. a
 * generic `info_row` entity's raw state, or a device event's raw state as a
 * fallback label) alongside config-provided text — neither is guaranteed
 * free of `<`, `>`, `&`, or quote characters, so every such value must be
 * escaped before it reaches an `innerHTML` string.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
