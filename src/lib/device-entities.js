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
