/**
 * Minimal hand-port of Home Assistant's own action dispatch
 * (`handleAction()` in home-assistant/frontend's
 * `src/panels/lovelace/common/handle-action.ts`) for a config-driven
 * `tap_action`/`hold_action`/`double_tap_action` (the native `ui_action`
 * selector's value shape) -- lets `controls_row` reuse the exact same
 * action vocabulary every built-in card uses instead of a bespoke `action`
 * enum, so `perform-action`/`toggle`/`navigate`/`url`/`more-info`/`none`
 * all work the same way here as anywhere else in HA.
 *
 * Native `confirmation` (a sibling field on the action config itself, not
 * per-action-type) is honored the same way HA does: skipped if the
 * current user is in `exemptions`, otherwise confirmed before dispatch.
 *
 * @typedef {object} ActionConfig
 * @property {string} action - "perform-action" | "call-service" | "toggle" | "navigate" | "url" | "more-info" | "none" | "fire-dom-event"
 * @property {string} [entity]
 * @property {string} [perform_action] - "domain.service", e.g. the button domain's "press" service
 * @property {string} [service] - deprecated alias for perform_action
 * @property {{entity_id?: string|string[], device_id?: string|string[], area_id?: string|string[]}} [target]
 * @property {Record<string, unknown>} [data]
 * @property {Record<string, unknown>} [service_data] - deprecated alias for data
 * @property {string} [navigation_path]
 * @property {boolean} [navigation_replace]
 * @property {string} [url_path]
 * @property {{text?: string, exemptions?: {user: string}[]}} [confirmation]
 */

import { fireMoreInfo, callService } from './ha-helpers.js';

// Matches home-assistant/frontend's own `STATES_OFF` (`src/common/const.ts`).
const STATES_OFF = ['closed', 'locked', 'off'];

/**
 * Mirrors HA frontend's own `toggleEntity()`/`turnOnOffEntity()`
 * (`src/panels/lovelace/common/entity/toggle-entity.ts` +
 * `turn-on-off-entity.ts`) -- calls the entity's domain-specific service
 * directly, the same way a native HA card's `tap_action: toggle` does.
 * Deliberately NOT the generic backend `homeassistant.toggle` service: that
 * service (`homeassistant/components/homeassistant/__init__.py`,
 * `async_handle_turn_service`) only forwards to a domain if the domain has
 * literally registered a service named `toggle`, which most domains --
 * including `button`, used by several of this card's default controls --
 * never do, so calling it against those entities silently no-ops (a
 * backend warning log, no actual action) even though the exact same
 * `{action: 'toggle'}` config works from a native HA card.
 *
 * @param {any} hass
 * @param {string} entityId
 */
function toggleEntity(hass, entityId) {
  const domain = entityId.split('.', 1)[0];
  const serviceDomain = domain === 'group' ? 'homeassistant' : domain;
  const stateObj = hass.states[entityId];
  const turnOn = !stateObj || STATES_OFF.includes(stateObj.state);
  let service;
  switch (domain) {
    case 'lock':
      service = turnOn ? 'unlock' : 'lock';
      break;
    case 'cover':
      service = turnOn ? 'open_cover' : 'close_cover';
      break;
    case 'button':
    case 'input_button':
      service = 'press';
      break;
    case 'scene':
      service = 'turn_on';
      break;
    case 'valve':
      service = turnOn ? 'open_valve' : 'close_valve';
      break;
    default:
      service = turnOn ? 'turn_on' : 'turn_off';
  }
  callService(hass, serviceDomain, service, { entity_id: entityId });
}

/**
 * @param {any} hass
 * @param {ActionConfig} [actionConfig]
 * @returns {boolean}
 */
function isConfirmationExempt(hass, actionConfig) {
  const exemptions = actionConfig?.confirmation?.exemptions;
  if (!exemptions || !hass?.user?.id) return false;
  return exemptions.some((e) => e.user === hass.user.id);
}

/**
 * Runs a `tap_action`/`hold_action`/`double_tap_action` config against a
 * live `hass`, the same vocabulary/semantics as HA's own `handleAction()`.
 * Defaults to `more-info` (targeting `fallbackEntity`) when `actionConfig`
 * is unset, matching HA's own default action.
 *
 * @param {HTMLElement} el - dispatches `hass-more-info` from this element
 * @param {any} hass
 * @param {ActionConfig|undefined} actionConfig
 * @param {string} [fallbackEntity]
 */
export function runAction(el, hass, actionConfig, fallbackEntity) {
  const config = actionConfig || { action: 'more-info' };
  if (config.confirmation && !isConfirmationExempt(hass, config)) {
    const text = config.confirmation.text || 'Are you sure?';
    if (!window.confirm(text)) return;
  }
  switch (config.action) {
    case 'more-info': {
      const entityId = config.entity || fallbackEntity;
      if (entityId) fireMoreInfo(el, entityId);
      return;
    }
    case 'toggle': {
      const entityId = config.entity || fallbackEntity;
      if (entityId) toggleEntity(hass, entityId);
      return;
    }
    case 'perform-action':
    case 'call-service': {
      const service = config.perform_action || config.service;
      if (!service) return;
      const dotIndex = service.indexOf('.');
      if (dotIndex === -1) return;
      const domain = service.slice(0, dotIndex);
      const serviceName = service.slice(dotIndex + 1);
      const data = { ...(config.data || config.service_data || {}), ...(config.target || {}) };
      callService(hass, domain, serviceName, data);
      return;
    }
    case 'navigate': {
      if (!config.navigation_path) return;
      window.history.pushState(null, '', config.navigation_path);
      window.dispatchEvent(new CustomEvent('location-changed', { bubbles: false, composed: true, detail: { replace: !!config.navigation_replace } }));
      return;
    }
    case 'url': {
      if (config.url_path) window.open(config.url_path);
      return;
    }
    case 'none':
    default:
      return;
  }
}

const HOLD_MS = 500;
const DOUBLE_TAP_MS = 250;

/**
 * Wires up `click` (used for both tap and hold-detection -- it fires
 * uniformly for mouse and touch input, unlike hand-rolling pointerup/down)
 * plus a `pointerdown` timestamp to distinguish a tap from a hold, and a
 * short delay to distinguish a single tap from the first half of a double
 * tap. Only sets up the timers a given row's config actually needs
 * (`holdAction`/`doubleTapAction` are commonly unset).
 *
 * `getConfig` is a function, not a snapshot -- called fresh on every
 * interaction, so a single bound element keeps working correctly across
 * config updates that only change `.data`/highlight state without
 * rebuilding the DOM node itself.
 *
 * @param {HTMLElement} el
 * @param {() => {hass: any, tapAction?: ActionConfig, holdAction?: ActionConfig, doubleTapAction?: ActionConfig, fallbackEntity?: string}} getConfig
 */
export function bindActionHandlers(el, getConfig) {
  let downAt = 0;
  let lastTapAt = 0;
  el.addEventListener('pointerdown', () => {
    downAt = Date.now();
  });
  el.addEventListener('click', () => {
    const { hass, tapAction, holdAction, doubleTapAction, fallbackEntity } = getConfig();
    if (holdAction && Date.now() - downAt >= HOLD_MS) {
      runAction(el, hass, holdAction, fallbackEntity);
      return;
    }
    const now = Date.now();
    if (doubleTapAction && now - lastTapAt < DOUBLE_TAP_MS) {
      lastTapAt = 0;
      runAction(el, hass, doubleTapAction, fallbackEntity);
      return;
    }
    lastTapAt = now;
    if (doubleTapAction) {
      // Give a potential second tap a chance to arrive and cancel this one.
      setTimeout(() => {
        if (Date.now() - lastTapAt >= DOUBLE_TAP_MS) runAction(el, hass, tapAction, fallbackEntity);
      }, DOUBLE_TAP_MS);
    } else {
      runAction(el, hass, tapAction, fallbackEntity);
    }
  });
}
