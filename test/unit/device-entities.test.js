import { describe, it, expect } from 'vitest';
import { resolveDeviceEntities, resolveDefaultInfoRow, resolveDefaultControlsRow } from '../../src/lib/device-entities.js';

function hassWithEntities(entities) {
  return { entities };
}

describe('resolveDeviceEntities', () => {
  it('returns nothing when deviceId is not given', () => {
    expect(resolveDeviceEntities(hassWithEntities({}), undefined)).toEqual({});
  });

  it('returns nothing when hass/hass.entities is missing', () => {
    expect(resolveDeviceEntities(undefined, 'dev1')).toEqual({});
    expect(resolveDeviceEntities({}, 'dev1')).toEqual({});
  });

  it('resolves every field by translation_key for RobertD502/home-assistant-petkit', () => {
    const hass = hassWithEntities({
      'sensor.petkit_total_use': { entity_id: 'sensor.petkit_total_use', device_id: 'dev1', translation_key: 'total_use' },
      'sensor.petkit_last_used_by': {
        entity_id: 'sensor.petkit_last_used_by',
        device_id: 'dev1',
        translation_key: 'last_used_by',
      },
      'sensor.petkit_error': { entity_id: 'sensor.petkit_error', device_id: 'dev1', translation_key: 'error' },
      'sensor.petkit_last_event': {
        entity_id: 'sensor.petkit_last_event',
        device_id: 'dev1',
        translation_key: 'max_last_event',
      },
      'sensor.petkit_state': { entity_id: 'sensor.petkit_state', device_id: 'dev1', translation_key: 'max_work_state' },
    });
    expect(resolveDeviceEntities(hass, 'dev1')).toEqual({
      total_use: 'sensor.petkit_total_use',
      last_used_by: 'sensor.petkit_last_used_by',
      error: 'sensor.petkit_error',
      last_event: 'sensor.petkit_last_event',
      state: 'sensor.petkit_state',
    });
  });

  it('resolves every field by translation_key for Jezza34000/homeassistant_petkit', () => {
    const hass = hassWithEntities({
      'sensor.petkit_total_time': { entity_id: 'sensor.petkit_total_time', device_id: 'dev1', translation_key: 'total_time' },
      'sensor.petkit_last_used_by': {
        entity_id: 'sensor.petkit_last_used_by',
        device_id: 'dev1',
        translation_key: 'last_used_by',
      },
      'sensor.petkit_error_message': {
        entity_id: 'sensor.petkit_error_message',
        device_id: 'dev1',
        translation_key: 'error_message',
      },
      'sensor.petkit_litter_last_event': {
        entity_id: 'sensor.petkit_litter_last_event',
        device_id: 'dev1',
        translation_key: 'litter_last_event',
      },
      'sensor.petkit_litter_state': {
        entity_id: 'sensor.petkit_litter_state',
        device_id: 'dev1',
        translation_key: 'litter_state',
      },
    });
    expect(resolveDeviceEntities(hass, 'dev1')).toEqual({
      total_use: 'sensor.petkit_total_time',
      last_used_by: 'sensor.petkit_last_used_by',
      error: 'sensor.petkit_error_message',
      last_event: 'sensor.petkit_litter_last_event',
      state: 'sensor.petkit_litter_state',
    });
  });

  it('ignores entities belonging to a different device', () => {
    const hass = hassWithEntities({
      'sensor.other_total_use': {
        entity_id: 'sensor.other_total_use',
        device_id: 'dev2',
        translation_key: 'total_use',
      },
    });
    expect(resolveDeviceEntities(hass, 'dev1')).toEqual({});
  });

  it('ignores a non-sensor entity even with a matching translation_key', () => {
    // e.g. PURAMAX's Pura Air liquid exists as BOTH a binary_sensor and a
    // sensor with the same translation_key -- only the sensor domain is a
    // valid match for any of this card's device_entities fields.
    const hass = hassWithEntities({
      'binary_sensor.petkit_total_use': {
        entity_id: 'binary_sensor.petkit_total_use',
        device_id: 'dev1',
        translation_key: 'total_use',
      },
    });
    expect(resolveDeviceEntities(hass, 'dev1')).toEqual({});
  });

  it('returns only the fields it could resolve, omitting the rest', () => {
    const hass = hassWithEntities({
      'sensor.petkit_total_use': { entity_id: 'sensor.petkit_total_use', device_id: 'dev1', translation_key: 'total_use' },
    });
    expect(resolveDeviceEntities(hass, 'dev1')).toEqual({ total_use: 'sensor.petkit_total_use' });
  });
});

describe('resolveDefaultInfoRow', () => {
  function makeEntity(entityId, translationKey) {
    return { entity_id: entityId, device_id: 'dev1', translation_key: translationKey };
  }

  it('resolves the 4 default chips by translation_key, in a fixed order, with only entity set', () => {
    const hass = hassWithEntities({
      'binary_sensor.petkit_wastebin': makeEntity('binary_sensor.petkit_wastebin', 'wastebin'),
      'sensor.petkit_litter_weight': makeEntity('sensor.petkit_litter_weight', 'litter_weight'),
      'sensor.petkit_times_used': makeEntity('sensor.petkit_times_used', 'times_used'),
      'sensor.petkit_pura_air_battery': makeEntity('sensor.petkit_pura_air_battery', 'pura_air_battery'),
    });
    expect(resolveDefaultInfoRow(hass, 'dev1')).toEqual([
      { entity: 'binary_sensor.petkit_wastebin' },
      { entity: 'sensor.petkit_litter_weight' },
      { entity: 'sensor.petkit_times_used' },
      { entity: 'sensor.petkit_pura_air_battery' },
    ]);
  });

  it('omits pura_air_battery (an add-on module) when the device does not have it, without erroring', () => {
    const hass = hassWithEntities({
      'binary_sensor.petkit_wastebin': makeEntity('binary_sensor.petkit_wastebin', 'wastebin'),
      'sensor.petkit_litter_weight': makeEntity('sensor.petkit_litter_weight', 'litter_weight'),
      'sensor.petkit_times_used': makeEntity('sensor.petkit_times_used', 'times_used'),
    });
    expect(resolveDefaultInfoRow(hass, 'dev1')).toEqual([
      { entity: 'binary_sensor.petkit_wastebin' },
      { entity: 'sensor.petkit_litter_weight' },
      { entity: 'sensor.petkit_times_used' },
    ]);
  });

  it('returns an empty array when there is no device_id', () => {
    expect(resolveDefaultInfoRow(hassWithEntities({}), undefined)).toEqual([]);
  });
});

describe('resolveDefaultControlsRow', () => {
  function makeEntity(entityId, translationKey) {
    return { entity_id: entityId, device_id: 'dev1', translation_key: translationKey };
  }

  it('builds Clean Now/Pause Cleaning and Start/Exit Maintenance as visibility-gated pairs', () => {
    const hass = hassWithEntities({
      'button.start_clean': makeEntity('button.start_clean', 'start_cleaning'),
      'button.pause_clean': makeEntity('button.pause_clean', 'pause_cleaning'),
      'button.start_maint': makeEntity('button.start_maint', 'start_maintenance'),
      'button.exit_maint': makeEntity('button.exit_maint', 'exit_maintenance'),
    });
    const rows = resolveDefaultControlsRow(hass, 'dev1', 'sensor.state');
    expect(rows).toEqual([
      {
        entity: 'button.start_clean',
        name: 'Clean Now',
        tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.start_clean' } },
        visibility: [{ condition: 'state', entity: 'sensor.state', state_not: 'cleaning_litter_box' }],
      },
      {
        entity: 'button.pause_clean',
        name: 'Pause Cleaning',
        tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.pause_clean' } },
        visibility: [{ condition: 'state', entity: 'sensor.state', state: 'cleaning_litter_box' }],
      },
      {
        entity: 'button.start_maint',
        name: 'Start Maintenance',
        tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.start_maint' } },
        visibility: [{ condition: 'state', entity: 'sensor.state', state_not: 'maintenance_mode' }],
      },
      {
        entity: 'button.exit_maint',
        name: 'Exit Maintenance',
        tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.exit_maint' } },
        visibility: [{ condition: 'state', entity: 'sensor.state', state: 'maintenance_mode' }],
      },
    ]);
  });

  it('adds Dump Litter as a plain press with no visibility condition', () => {
    const hass = hassWithEntities({ 'button.dump': makeEntity('button.dump', 'dump_litter') });
    expect(resolveDefaultControlsRow(hass, 'dev1', 'sensor.state')).toEqual([
      {
        entity: 'button.dump',
        name: 'Dump Litter',
        tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.dump' } },
      },
    ]);
  });

  it('adds Auto cleaning as a toggle (no target entity in tap_action -- the control\'s own entity is the toggle target)', () => {
    const hass = hassWithEntities({ 'switch.auto_clean': makeEntity('switch.auto_clean', 'auto_cleaning') });
    expect(resolveDefaultControlsRow(hass, 'dev1', 'sensor.state')).toEqual([
      { entity: 'switch.auto_clean', name: 'Auto cleaning', tap_action: { action: 'toggle' } },
    ]);
  });

  it('falls back to an ungated Clean Now (omitting Pause) when there is no state entity to gate visibility on', () => {
    const hass = hassWithEntities({
      'button.start_clean': makeEntity('button.start_clean', 'start_cleaning'),
      'button.pause_clean': makeEntity('button.pause_clean', 'pause_cleaning'),
    });
    const rows = resolveDefaultControlsRow(hass, 'dev1', undefined);
    // Without a state entity there's no way to tell the pair apart --
    // rather than showing both permanently (or neither), Clean Now stays as
    // a plain always-visible button and Pause Cleaning (which only makes
    // sense while actually cleaning) is left out.
    expect(rows).toEqual([
      {
        entity: 'button.start_clean',
        name: 'Clean Now',
        tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.start_clean' } },
      },
    ]);
  });

  it('returns an empty array when there is no device_id', () => {
    expect(resolveDefaultControlsRow(hassWithEntities({}), undefined, 'sensor.state')).toEqual([]);
  });
});
