/**
 * Pure computation for a single config-driven status chip: formats its
 * display value and decides whether it should render in a "warn" state.
 * Extracted from the original card's `_renderInfoChip`, which mixed this
 * logic with DOM string-building.
 *
 * @param {object} spec - one entry of the `info_row` config array.
 * @param {string} [spec.entity]
 * @param {string} [spec.name]
 * @param {string} [spec.icon]
 * @param {string} [spec.unit]
 * @param {Record<string, string>} [spec.value_map]
 * @param {number} [spec.warn_below]
 * @param {number} [spec.warn_above]
 * @param {string} [spec.warn_state]
 * @param {string|null} rawValue - the entity's current state, or null if unavailable.
 * @returns {{ display: string, warn: boolean }}
 */
export function computeChipDisplay(spec, rawValue) {
  let display = rawValue;

  if (spec.value_map && rawValue in spec.value_map) {
    display = spec.value_map[rawValue];
  } else if (rawValue !== null && spec.unit) {
    display = `${rawValue}${spec.unit}`;
  }

  if (display === null || display === undefined) display = '—';

  const num = parseFloat(rawValue);
  let warn = false;
  if (spec.warn_below !== undefined && Number.isFinite(num)) warn = num < spec.warn_below;
  if (spec.warn_above !== undefined && Number.isFinite(num)) warn = warn || num > spec.warn_above;
  if (spec.warn_state !== undefined) warn = warn || rawValue === spec.warn_state;

  return { display, warn };
}
