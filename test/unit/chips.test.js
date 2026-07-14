import { describe, it, expect } from 'vitest';
import { computeChipDisplay } from '../../src/lib/chips.js';

describe('computeChipDisplay', () => {
  it('displays the raw value with no formatting when no unit/value_map given', () => {
    expect(computeChipDisplay({}, '42')).toEqual({ display: '42', warn: false });
  });

  it('appends unit when spec.unit is set', () => {
    expect(computeChipDisplay({ unit: '%' }, '73')).toEqual({ display: '73%', warn: false });
  });

  it('does not append unit when value is null', () => {
    expect(computeChipDisplay({ unit: '%' }, null)).toEqual({ display: '—', warn: false });
  });

  it('maps raw value through value_map when present', () => {
    const spec = { value_map: { on: 'Running', off: 'Idle' } };
    expect(computeChipDisplay(spec, 'on')).toEqual({ display: 'Running', warn: false });
  });

  it('value_map takes precedence over unit', () => {
    const spec = { value_map: { on: 'Running' }, unit: 'x' };
    expect(computeChipDisplay(spec, 'on')).toEqual({ display: 'Running', warn: false });
  });

  it('falls back to raw value when value_map does not contain the key', () => {
    const spec = { value_map: { on: 'Running' } };
    expect(computeChipDisplay(spec, 'off').display).toBe('off');
  });

  it('shows "—" for null/undefined display', () => {
    expect(computeChipDisplay({}, null).display).toBe('—');
    expect(computeChipDisplay({}, undefined).display).toBe('—');
  });

  it('warns when numeric value is below warn_below', () => {
    expect(computeChipDisplay({ warn_below: 10 }, '5').warn).toBe(true);
    expect(computeChipDisplay({ warn_below: 10 }, '15').warn).toBe(false);
  });

  it('warns when numeric value is above warn_above', () => {
    expect(computeChipDisplay({ warn_above: 90 }, '95').warn).toBe(true);
    expect(computeChipDisplay({ warn_above: 90 }, '80').warn).toBe(false);
  });

  it('combines warn_below and warn_above (either can trigger warn)', () => {
    const spec = { warn_below: 10, warn_above: 90 };
    expect(computeChipDisplay(spec, '5').warn).toBe(true);
    expect(computeChipDisplay(spec, '95').warn).toBe(true);
    expect(computeChipDisplay(spec, '50').warn).toBe(false);
  });

  it('warns on an exact warn_state string match', () => {
    expect(computeChipDisplay({ warn_state: 'error' }, 'error').warn).toBe(true);
    expect(computeChipDisplay({ warn_state: 'error' }, 'ok').warn).toBe(false);
  });

  it('does not warn on non-numeric values with only warn_below/warn_above set', () => {
    expect(computeChipDisplay({ warn_below: 10 }, 'unavailable').warn).toBe(false);
  });
});
