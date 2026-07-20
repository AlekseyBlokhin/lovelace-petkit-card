/**
 * Minimal hand-port of Home Assistant's own card/badge `visibility`
 * condition evaluator (`checkConditionsMet()` in home-assistant/frontend's
 * `src/panels/lovelace/common/validate-condition.ts`) -- lets a
 * `controls_row` entry hide/show itself based on live entity state using
 * the exact same condition vocabulary/semantics as any native card's
 * `visibility:` config, instead of a bespoke mechanism.
 *
 * Only `state`/`numeric_state`/`and`/`or`/`not` are implemented (the
 * subset relevant to a device-status card); `screen`/`user`/`time`/
 * `location`/`view_columns` conditions are out of scope here and are
 * treated as met (matching HA's own "missing conditions array" fallback
 * for `and`/`not`, applied uniformly for simplicity, so an unsupported
 * condition type doesn't silently hide a control).
 *
 * @typedef {object} VisibilityCondition
 * @property {string} condition - "state" | "numeric_state" | "and" | "or" | "not"
 * @property {string} [entity]
 * @property {string} [attribute]
 * @property {string|string[]} [state]
 * @property {string|string[]} [state_not]
 * @property {number} [above]
 * @property {number} [below]
 * @property {VisibilityCondition[]} [conditions]
 */

const UNKNOWN = 'unknown';

function ensureArray(value) {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value : [value];
}

function entityValue(hass, entity, attribute) {
  const stateObj = hass && hass.states && entity ? hass.states[entity] : undefined;
  if (!stateObj) return UNKNOWN;
  return attribute ? stateObj.attributes?.[attribute] : stateObj.state;
}

/**
 * @param {any} hass
 * @param {VisibilityCondition} condition
 * @returns {boolean}
 */
function checkCondition(hass, condition) {
  switch (condition.condition) {
    case 'state': {
      const value = entityValue(hass, condition.entity, condition.attribute);
      const wanted = ensureArray(condition.state);
      const notWanted = ensureArray(condition.state_not);
      if (!wanted && !notWanted) return false;
      if (wanted && !wanted.includes(value)) return false;
      if (notWanted && notWanted.includes(value)) return false;
      return true;
    }
    case 'numeric_state': {
      const raw = entityValue(hass, condition.entity, condition.attribute);
      const value = Number(raw);
      if (Number.isNaN(value)) return false;
      if (condition.above != null && !(value > condition.above)) return false;
      if (condition.below != null && !(value < condition.below)) return false;
      return true;
    }
    case 'and':
      return checkConditionsMet(condition.conditions, hass);
    case 'or':
      return !condition.conditions || condition.conditions.length === 0 ? true : condition.conditions.some((c) => checkCondition(hass, c));
    case 'not':
      return !checkConditionsMet(condition.conditions, hass);
    default:
      // Unsupported condition type (screen/user/time/location/...) --
      // treated as met rather than silently hiding the control.
      return true;
  }
}

/**
 * Top-level `visibility` array elements are ANDed together, matching HA's
 * own semantics.
 *
 * @param {VisibilityCondition[]|undefined} conditions
 * @param {any} hass
 * @returns {boolean}
 */
export function checkConditionsMet(conditions, hass) {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => checkCondition(hass, c));
}
