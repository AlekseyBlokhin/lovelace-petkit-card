import { describe, it, expect, vi } from 'vitest';
import { formatState, resolveEntityName } from '../../src/lib/ha-helpers.js';

describe('formatState', () => {
  it('returns fallback when the entity is missing', () => {
    expect(formatState({ states: {} }, 'sensor.missing', 'FALLBACK')).toBe('FALLBACK');
  });

  it('uses hass.formatEntityState when available', () => {
    const stateObj = { state: 'off', attributes: { device_class: 'problem' } };
    const hass = {
      states: { 'binary_sensor.wastebin': stateObj },
      formatEntityState: vi.fn().mockReturnValue('OK'),
    };
    expect(formatState(hass, 'binary_sensor.wastebin', null)).toBe('OK');
    expect(hass.formatEntityState).toHaveBeenCalledWith(stateObj);
  });

  it('falls back to the raw state when hass has no formatEntityState (e.g. a plain test mock)', () => {
    const hass = { states: { 'sensor.total': { state: '2.2' } } };
    expect(formatState(hass, 'sensor.total', null)).toBe('2.2');
  });
});

describe('resolveEntityName', () => {
  it('returns empty string for a falsy entity id', () => {
    expect(resolveEntityName({}, undefined)).toBe('');
  });

  it('prefers the entity registry\'s short display name over friendly_name', () => {
    const hass = {
      entities: { 'binary_sensor.wastebin': { name: 'Wastebin' } },
      states: { 'binary_sensor.wastebin': { attributes: { friendly_name: 'PETKIT PURAMAX Wastebin' } } },
    };
    expect(resolveEntityName(hass, 'binary_sensor.wastebin')).toBe('Wastebin');
  });

  it('falls back to friendly_name when the registry has no entry', () => {
    const hass = {
      entities: {},
      states: { 'binary_sensor.wastebin': { attributes: { friendly_name: 'PETKIT PURAMAX Wastebin' } } },
    };
    expect(resolveEntityName(hass, 'binary_sensor.wastebin')).toBe('PETKIT PURAMAX Wastebin');
  });

  it('falls back to friendly_name when hass has no entities registry at all', () => {
    const hass = { states: { 'sensor.x': { attributes: { friendly_name: 'X Sensor' } } } };
    expect(resolveEntityName(hass, 'sensor.x')).toBe('X Sensor');
  });

  it('falls back to the bare entity id when nothing else is available', () => {
    expect(resolveEntityName({ states: {} }, 'sensor.unknown')).toBe('sensor.unknown');
  });
});
