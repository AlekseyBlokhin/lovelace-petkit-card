/**
 * Pure math for the 0-24h per-day "stem plot" chart: axis scaling and
 * gridline positions. No DOM/SVG string-building here — that stays in the
 * card, this module only returns plain data.
 */
import { formatClockDuration } from './format.js';

const NICE_STEPS = [10, 15, 30, 60, 120, 180, 300, 600, 900, 1800, 3600];

/**
 * Picks a "nice" y-axis step (seconds) so a chart maxing out at `rawMax`
 * ends up with roughly 3-6 gridlines, e.g. 137s -> step 30 -> niceMax 150.
 * Ported verbatim from the original card's `_niceStep`.
 *
 * @param {number} rawMax
 * @returns {number}
 */
export function niceStep(rawMax) {
  for (const step of NICE_STEPS) {
    if (rawMax / step <= 5) return step;
  }
  return Math.ceil(rawMax / 5 / 60) * 60;
}

/**
 * @typedef {{ left: number, right: number, top: number, bottom: number }} Padding
 */

/**
 * Builds `xFor(ts)`/`yFor(duration)` scale functions for the day chart.
 *
 * @param {object} params
 * @param {Date} params.dayStart - local midnight of the day being charted.
 * @param {number} params.niceMax - the y-axis max (seconds), from `niceStep`.
 * @param {number} params.width
 * @param {number} params.height
 * @param {Padding} params.padding
 * @returns {{ xFor: (ts: number) => number, yFor: (duration: number) => number }}
 */
export function buildScales({ dayStart, niceMax, width, height, padding }) {
  const { left, right, top, bottom } = padding;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const dayStartMs = dayStart.getTime();

  const xFor = (ts) => {
    const hours = (ts - dayStartMs) / 3600000;
    return left + (hours / 24) * plotWidth;
  };

  const yFor = (duration) => {
    if (!niceMax) return height - bottom;
    return height - bottom - (duration / niceMax) * plotHeight;
  };

  return { xFor, yFor };
}

/**
 * Builds plain-data gridline descriptors for both axes: vertical
 * time-of-day lines at 4/8/12/16/20h (the 0/24h tick is deliberately
 * skipped -- it would sit right at the origin corner and collide visually
 * with the y-axis's own "00'00"" label there), and horizontal duration
 * lines every `yStep` up to `niceMax`.
 *
 * @param {object} params
 * @param {number} params.niceMax
 * @param {number} params.yStep
 * @param {number} params.width
 * @param {number} params.height
 * @param {Padding} params.padding
 * @returns {{
 *   vertical: Array<{ hour: number, x: number, label: string }>,
 *   horizontal: Array<{ value: number, y: number, label: string }>,
 * }}
 */
export function buildGridLines({ niceMax, yStep, width, height, padding }) {
  const { left, right, top, bottom } = padding;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const vertical = [4, 8, 12, 16, 20].map((hour) => ({
    hour,
    x: left + (hour / 24) * plotWidth,
    label: `${hour.toString().padStart(2, '0')}:00`,
  }));

  const horizontal = [];
  if (yStep > 0) {
    for (let value = 0; value <= niceMax; value += yStep) {
      const y = niceMax ? height - bottom - (value / niceMax) * plotHeight : height - bottom;
      horizontal.push({ value, y, label: formatClockDuration(value) });
    }
  }

  return { vertical, horizontal };
}
