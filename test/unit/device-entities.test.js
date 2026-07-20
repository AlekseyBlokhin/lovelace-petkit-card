import { describe, it, expect } from 'vitest';
import { resolveDeviceEntities } from '../../src/lib/device-entities.js';

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
