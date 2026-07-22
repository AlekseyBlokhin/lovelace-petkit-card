/**
 * Auto-resolves `device_entities.*` from a single `device_id` by matching
 * the entity registry's `translation_key` (stable regardless of what the
 * user renames the `entity_id`/friendly name to) against the keys each
 * supported PetKit integration is known to use for that sensor. Verified
 * against this card's two documented integrations:
 *  - RobertD502/home-assistant-petkit: total_use, last_used_by, error,
 *    max_last_event, max_work_state.
 *  - Jezza34000/homeassistant_petkit: total_time, last_used_by,
 *    error_message, litter_last_event, litter_state.
 * Best-effort convenience only -- an explicit `device_entities` entry in
 * config always overrides whatever this resolves (see the caller), so an
 * unlisted integration or a future upstream rename degrades to "set it
 * manually" rather than silently pointing at the wrong entity.
 */
const FIELD_TRANSLATION_KEYS = {
  total_use: ['total_use', 'total_time'],
  last_used_by: ['last_used_by'],
  error: ['error', 'error_message'],
  last_event: ['max_last_event', 'litter_last_event'],
  state: ['max_work_state', 'litter_state'],
};

/**
 * @param {any} hass
 * @param {string} [deviceId]
 * @returns {Partial<Record<keyof typeof FIELD_TRANSLATION_KEYS, string>>}
 */
export function resolveDeviceEntities(hass, deviceId) {
  const resolved = {};
  if (!deviceId || !hass || !hass.entities) return resolved;

  const deviceSensors = Object.values(hass.entities).filter(
    (entity) => entity.device_id === deviceId && entity.entity_id.startsWith('sensor.'),
  );

  for (const [field, candidateKeys] of Object.entries(FIELD_TRANSLATION_KEYS)) {
    const match = deviceSensors.find((entity) => candidateKeys.includes(entity.translation_key));
    if (match) resolved[field] = match.entity_id;
  }

  return resolved;
}

/**
 * The single required-field rule shared by the card's two independent
 * validation call sites: `setConfig()` (config-parse time, before `hass`
 * exists, checking `config.device_entities` as hand-written) and
 * `_configError()` (hass-time, checking `device_entities` after `device_id`
 * auto-detection has resolved it). Both need the exact same two rules --
 * `total_use` must always resolve, and `last_used_by` must resolve too once
 * more than one cat is configured (with a single cat, every visit is
 * trivially theirs, so there's no identity ambiguity to resolve) -- so the
 * rule itself lives here once; each call site builds its own throw-message /
 * display-string around whichever field name this returns, since the two
 * need different wording for the same underlying condition (one is a hard
 * `throw` for someone hand-writing YAML, the other a softer "could not
 * auto-detect" for a device already selected in the editor).
 *
 * Checked in this order (matching both call sites' existing check order):
 * `total_use` first, `last_used_by` second.
 *
 * @param {{ total_use?: string, last_used_by?: string }} [deviceEntities]
 * @param {Array<object>} [cats]
 * @returns {'total_use'|'last_used_by'|null}
 */
export function requiredDeviceEntityField(deviceEntities, cats) {
  if (!deviceEntities || !deviceEntities.total_use) return 'total_use';
  if (Array.isArray(cats) && cats.length > 1 && !deviceEntities.last_used_by) return 'last_used_by';
  return null;
}

function findByTranslationKey(hass, deviceId, translationKey) {
  if (!deviceId || !hass || !hass.entities) return undefined;
  return Object.values(hass.entities).find((entity) => entity.device_id === deviceId && entity.translation_key === translationKey);
}

// A reasonable default set of status chips for a brand-new card -- verified
// against this card's own live RobertD502-integration test device (not
// confirmed against Jezza34000, which may use different translation_keys
// for these, same caveat as `resolveDeviceEntities`). Only `entity` is set
// (no `name`): the card resolves each chip's own display name live from the
// entity's friendly_name, exactly like a manually-added chip does.
const DEFAULT_INFO_ROW_KEYS = ['wastebin', 'litter_weight', 'times_used', 'pura_air_battery'];

/**
 * @param {any} hass
 * @param {string} [deviceId]
 * @returns {Array<{entity: string}>}
 */
export function resolveDefaultInfoRow(hass, deviceId) {
  const rows = [];
  for (const key of DEFAULT_INFO_ROW_KEYS) {
    const match = findByTranslationKey(hass, deviceId, key);
    if (match) rows.push({ entity: match.entity_id });
  }
  return rows;
}

/**
 * A reasonable default control set for a brand-new card: Clean Now/Pause
 * Cleaning and Start/Exit Maintenance are each a visibility-gated pair (see
 * `src/lib/visibility.js`) rather than one button with special-cased
 * behavior -- only visible while `stateEntityId` is available to gate on,
 * since without it there'd be no way to tell the two apart and both would
 * show at once. State values (`cleaning_litter_box`/`maintenance_mode`)
 * verified live against this card's own RobertD502-integration test
 * device's actual history, not guessed.
 *
 * @param {any} hass
 * @param {string} [deviceId]
 * @param {string} [stateEntityId]
 * @returns {Array<object>}
 */
export function resolveDefaultControlsRow(hass, deviceId, stateEntityId) {
  const rows = [];
  // `button`/`input_button` entities have no on/off state -- `press` is the
  // only service they support. HA's own frontend `tap_action: toggle`
  // already special-cases this (calls `press` directly, bypassing the
  // on/off dichotomy entirely -- see `toggleEntity()` in
  // `src/lib/actions.js`), so a plain `{action: 'toggle'}` is both simpler
  // and exactly as correct as spelling out `perform-action`+`button.press`.
  const toggleAction = { action: 'toggle' };

  const cleanStart = findByTranslationKey(hass, deviceId, 'start_cleaning');
  const cleanPause = findByTranslationKey(hass, deviceId, 'pause_cleaning');
  if (cleanStart) {
    rows.push({
      entity: cleanStart.entity_id,
      name: 'Clean Now',
      tap_action: toggleAction,
      ...(cleanPause && stateEntityId
        ? { visibility: [{ condition: 'state', entity: stateEntityId, state_not: 'cleaning_litter_box' }] }
        : {}),
    });
  }
  if (cleanPause && stateEntityId) {
    rows.push({
      entity: cleanPause.entity_id,
      name: 'Pause Cleaning',
      tap_action: toggleAction,
      visibility: [{ condition: 'state', entity: stateEntityId, state: 'cleaning_litter_box' }],
    });
  }

  const maintStart = findByTranslationKey(hass, deviceId, 'start_maintenance');
  const maintExit = findByTranslationKey(hass, deviceId, 'exit_maintenance');
  if (maintStart) {
    rows.push({
      entity: maintStart.entity_id,
      name: 'Start Maintenance',
      tap_action: toggleAction,
      ...(maintExit && stateEntityId
        ? { visibility: [{ condition: 'state', entity: stateEntityId, state_not: 'maintenance_mode' }] }
        : {}),
    });
  }
  if (maintExit && stateEntityId) {
    rows.push({
      entity: maintExit.entity_id,
      name: 'Exit Maintenance',
      tap_action: toggleAction,
      visibility: [{ condition: 'state', entity: stateEntityId, state: 'maintenance_mode' }],
    });
  }

  const dumpLitter = findByTranslationKey(hass, deviceId, 'dump_litter');
  if (dumpLitter) {
    rows.push({ entity: dumpLitter.entity_id, name: 'Dump Litter', tap_action: toggleAction });
  }

  const autoCleaning = findByTranslationKey(hass, deviceId, 'auto_cleaning');
  if (autoCleaning) {
    rows.push({ entity: autoCleaning.entity_id, name: 'Auto cleaning', tap_action: toggleAction });
  }

  return rows;
}
