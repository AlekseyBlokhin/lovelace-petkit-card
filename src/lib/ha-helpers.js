/**
 * Thin helpers for reading Home Assistant state and calling services from a
 * card. Kept separate from rendering so cards can be tested against a
 * plain mock `hass` object instead of a real Home Assistant frontend.
 *
 * `hass` is intentionally typed `any` here: the real Home Assistant
 * frontend's `hass` object is large and its shape isn't published as a
 * package type, so modeling it fully in JSDoc isn't worth it for a handful
 * of thin accessors — these functions only ever touch `states`,
 * `callService`, and `callWS`.
 */

/**
 * Reads an entity's current state string, or `fallback` if the entity id
 * is falsy, `hass` is missing, or the entity doesn't exist.
 *
 * @param {any} hass
 * @param {string} [entityId]
 * @param {*} [fallback]
 * @returns {string|*}
 */
export function getState(hass, entityId, fallback) {
  if (!entityId || !hass || !hass.states || !hass.states[entityId]) return fallback;
  return hass.states[entityId].state;
}

/**
 * Reads an entity's current state, formatted the same way the real Home
 * Assistant frontend would show it (translated on/off-style text, units
 * appended, numeric precision applied) via `hass.formatEntityState` -- the
 * documented custom-card API for this (added specifically so cards don't
 * need to hand-roll unit/value-label formatting). Falls back to the raw
 * state string when `hass` doesn't expose that function (e.g. a plain mock
 * `hass` in a test), so this degrades gracefully rather than throwing.
 *
 * @param {any} hass
 * @param {string} [entityId]
 * @param {*} [fallback]
 * @returns {string|*}
 */
export function formatState(hass, entityId, fallback) {
  if (!entityId || !hass || !hass.states || !hass.states[entityId]) return fallback;
  const stateObj = hass.states[entityId];
  if (typeof hass.formatEntityState === 'function') return hass.formatEntityState(stateObj);
  return stateObj.state;
}

/**
 * Formats a PAST state value for an entity (e.g. one point from a
 * `history_during_period` query) the same way the real Home Assistant
 * frontend would show it, via `hass.formatEntityState(stateObj, state)` --
 * the same documented custom-card API `formatState` uses above, but with
 * its optional second argument: this is how the real frontend itself
 * formats a historical value that differs from the entity's current live
 * state (e.g. in history graphs/logbook), letting an integration's own
 * `strings.json` enum translations (e.g. a PETKIT firmware event code ->
 * "Manual odor removal failed. Please make sure the Odor Removal Device
 * has sufficient battery") apply to old points too, not just the live
 * state. Falls back to the raw `value` unchanged when `hass` doesn't
 * expose `formatEntityState` or the entity isn't in `hass.states` (e.g. a
 * plain mock `hass` in a test), so this degrades gracefully rather than
 * throwing.
 *
 * @param {any} hass
 * @param {string} entityId
 * @param {string} value
 * @returns {string}
 */
export function formatHistoricalState(hass, entityId, value) {
  if (value == null) return value;
  const stateObj = entityId && hass && hass.states ? hass.states[entityId] : null;
  if (!stateObj || typeof hass.formatEntityState !== 'function') return value;
  return hass.formatEntityState(stateObj, value);
}

/**
 * Resolves the short, entity-relative display name Home Assistant itself
 * shows for an entity (e.g. "Wastebin" on a device's own page), rather than
 * `attributes.friendly_name` (e.g. "PETKIT PURAMAX Wastebin", the
 * device+entity name combined) -- redundant when the entity is already
 * shown in a context that names the device once (a card title, a device
 * page). `hass.entities[entityId].name` is the entity registry's own
 * pre-computed display name (custom name if the user renamed it, else the
 * integration-provided name), the same field HA's own device/entity list
 * pages read. Falls back to `friendly_name`, then the bare entity id, for
 * entities missing from the registry snapshot (e.g. a mock `hass` in a
 * test) or lacking a registry name entirely.
 *
 * @param {any} hass
 * @param {string} [entityId]
 * @returns {string}
 */
export function resolveEntityName(hass, entityId) {
  if (!entityId) return '';
  const registryName = hass && hass.entities && hass.entities[entityId] && hass.entities[entityId].name;
  if (registryName) return registryName;
  const stateObj = hass && hass.states ? hass.states[entityId] : null;
  return (stateObj && stateObj.attributes && stateObj.attributes.friendly_name) || entityId;
}

/**
 * Reads an entity's current state as a number, or `fallback` if missing or
 * not parseable as a finite number.
 *
 * @param {any} hass
 * @param {string} [entityId]
 * @param {*} [fallback]
 * @returns {number|*}
 */
export function getNumber(hass, entityId, fallback) {
  const raw = getState(hass, entityId, undefined);
  const num = parseFloat(raw);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Dispatches Home Assistant's standard `hass-more-info` event to open the
 * more-info dialog for an entity.
 *
 * @param {HTMLElement} el
 * @param {string} entityId
 */
export function fireMoreInfo(el, entityId) {
  const event = new CustomEvent('hass-more-info', {
    bubbles: true,
    composed: true,
    detail: { entityId },
  });
  el.dispatchEvent(event);
}

/**
 * Calls a Home Assistant service.
 *
 * @param {any} hass
 * @param {string} domain
 * @param {string} service
 * @param {object} [data]
 */
export function callService(hass, domain, service, data) {
  hass.callService(domain, service, data);
}

/**
 * Presses a `button` domain entity.
 *
 * @param {any} hass
 * @param {string} [entityId]
 */
export function pressButton(hass, entityId) {
  if (!entityId) return;
  callService(hass, 'button', 'press', { entity_id: entityId });
}
