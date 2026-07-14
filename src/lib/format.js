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
