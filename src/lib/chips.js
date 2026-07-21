/**
 * Pure computation for a single config-driven status chip: decides its
 * display text and whether it should render in a "warn" state. Extracted
 * from the original card's `_renderInfoChip`, which mixed this logic with
 * DOM string-building.
 *
 * Display text is the entity's own HA-translated state (formatted upstream
 * via `hass.formatEntityState` -- see `resolveEntityName`/`formatState` in
 * `ha-helpers.js`), not computed here -- HA already knows an entity's unit
 * and how to phrase its state (e.g. a `device_class: problem` binary_sensor
 * renders "OK"/"Problem"), so a config-level `unit`/`value_map` would only
 * ever fight with or duplicate that. The warn check stays keyed off the
 * entity's RAW state on purpose: warn thresholds compare real numbers/exact
 * state strings, not display text a user could reword via translations.
 *
 * @param {object} spec - one entry of the `info_row` config array.
 * @param {string} [spec.entity]
 * @param {string} [spec.name]
 * @param {string} [spec.icon]
 * @param {number} [spec.warn_below]
 * @param {number} [spec.warn_above]
 * @param {string} [spec.warn_state]
 * @param {string|null} rawValue - the entity's current raw state, or null if unavailable.
 * @param {string|null} [translatedValue] - the entity's HA-formatted display state.
 * @returns {{ display: string, warn: boolean }}
 */
export function computeChipDisplay(spec, rawValue, translatedValue) {
  const display = translatedValue === null || translatedValue === undefined || translatedValue === '' ? '—' : translatedValue;

  const num = parseFloat(rawValue);
  let warn = false;
  if (spec.warn_below !== undefined && Number.isFinite(num)) warn = num < spec.warn_below;
  if (spec.warn_above !== undefined && Number.isFinite(num)) warn = warn || num > spec.warn_above;
  if (spec.warn_state !== undefined) warn = warn || rawValue === spec.warn_state;

  return { display, warn };
}
