import { describe, it, expect } from 'vitest';
import { computeChipDisplay } from '../../src/lib/chips.js';

describe('computeChipDisplay', () => {
  it('displays the given translated value verbatim', () => {
    expect(computeChipDisplay({}, '42', '42')).toEqual({ display: '42', warn: false });
  });

  it('displays HA-formatted text (unit/translation already applied upstream)', () => {
    expect(computeChipDisplay({}, '73', '73 %')).toEqual({ display: '73 %', warn: false });
  });

  it('shows "—" when the translated value is null/undefined/empty', () => {
    expect(computeChipDisplay({}, null, null).display).toBe('—');
    expect(computeChipDisplay({}, undefined, undefined).display).toBe('—');
    expect(computeChipDisplay({}, '', '').display).toBe('—');
  });

  it('warns based on the RAW value, independent of the translated display text', () => {
    // Translated text could read "OK"/"Problem" while the raw state driving
    // the threshold check is still the plain on/off/numeric string.
    expect(computeChipDisplay({ warn_below: 10 }, '5', '5 %').warn).toBe(true);
    expect(computeChipDisplay({ warn_below: 10 }, '15', '15 %').warn).toBe(false);
  });

  it('warns when numeric raw value is above warn_above', () => {
    expect(computeChipDisplay({ warn_above: 90 }, '95', '95 %').warn).toBe(true);
    expect(computeChipDisplay({ warn_above: 90 }, '80', '80 %').warn).toBe(false);
  });

  it('combines warn_below and warn_above (either can trigger warn)', () => {
    const spec = { warn_below: 10, warn_above: 90 };
    expect(computeChipDisplay(spec, '5', '5').warn).toBe(true);
    expect(computeChipDisplay(spec, '95', '95').warn).toBe(true);
    expect(computeChipDisplay(spec, '50', '50').warn).toBe(false);
  });

  it('warns on an exact warn_state match against the RAW value', () => {
    expect(computeChipDisplay({ warn_state: 'on' }, 'on', 'Full').warn).toBe(true);
    expect(computeChipDisplay({ warn_state: 'on' }, 'off', 'Normal').warn).toBe(false);
  });

  it('does not warn on non-numeric raw values with only warn_below/warn_above set', () => {
    expect(computeChipDisplay({ warn_below: 10 }, 'unavailable', 'Unavailable').warn).toBe(false);
  });
});
