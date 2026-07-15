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
