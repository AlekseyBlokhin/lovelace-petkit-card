import { describe, it, expect, vi } from 'vitest';
import { formatState, formatHistoricalState, resolveEntityName } from '../../src/lib/ha-helpers.js';

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

describe('formatHistoricalState', () => {
  it('returns the value unchanged when it is nullish', () => {
    expect(formatHistoricalState({ states: {} }, 'sensor.x', null)).toBe(null);
  });

  it('returns the raw value when the entity is missing from hass.states', () => {
    expect(formatHistoricalState({ states: {} }, 'sensor.missing', 'raw_code')).toBe('raw_code');
  });

  it('formats a past value against the entity\'s current stateObj via hass.formatEntityState', () => {
    const stateObj = { state: 'current text', attributes: {} };
    const hass = {
      states: { 'sensor.last_event': stateObj },
      formatEntityState: vi.fn().mockReturnValue('Translated text'),
    };
    expect(formatHistoricalState(hass, 'sensor.last_event', 'raw_code')).toBe('Translated text');
    expect(hass.formatEntityState).toHaveBeenCalledWith(stateObj, 'raw_code');
  });

  it('falls back to the raw value when hass has no formatEntityState (e.g. a plain test mock)', () => {
    const hass = { states: { 'sensor.last_event': { state: 'x' } } };
    expect(formatHistoricalState(hass, 'sensor.last_event', 'raw_code')).toBe('raw_code');
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
