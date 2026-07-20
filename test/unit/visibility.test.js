import { describe, it, expect } from 'vitest';
import { checkConditionsMet } from '../../src/lib/visibility.js';

function hass(states) {
  return { states };
}

describe('checkConditionsMet', () => {
  it('returns true for an empty/absent conditions array (nothing to hide behind)', () => {
    expect(checkConditionsMet(undefined, hass({}))).toBe(true);
    expect(checkConditionsMet([], hass({}))).toBe(true);
  });

  it('state: passes when the entity state is in the wanted list', () => {
    const h = hass({ 'sensor.x': { state: 'maintenance' } });
    expect(checkConditionsMet([{ condition: 'state', entity: 'sensor.x', state: 'maintenance' }], h)).toBe(true);
    expect(checkConditionsMet([{ condition: 'state', entity: 'sensor.x', state: ['idle', 'maintenance'] }], h)).toBe(true);
    expect(checkConditionsMet([{ condition: 'state', entity: 'sensor.x', state: 'idle' }], h)).toBe(false);
  });

  it('state_not: passes when the entity state is NOT in the excluded list', () => {
    const h = hass({ 'sensor.x': { state: 'idle' } });
    expect(checkConditionsMet([{ condition: 'state', entity: 'sensor.x', state_not: 'maintenance' }], h)).toBe(true);
    expect(checkConditionsMet([{ condition: 'state', entity: 'sensor.x', state_not: 'idle' }], h)).toBe(false);
  });

  it('state: a missing entity is treated as state "unknown"', () => {
    const h = hass({});
    expect(checkConditionsMet([{ condition: 'state', entity: 'sensor.missing', state: 'unknown' }], h)).toBe(true);
    expect(checkConditionsMet([{ condition: 'state', entity: 'sensor.missing', state_not: 'idle' }], h)).toBe(true);
  });

  it('state: with neither state nor state_not set, the condition is never met', () => {
    const h = hass({ 'sensor.x': { state: 'idle' } });
    expect(checkConditionsMet([{ condition: 'state', entity: 'sensor.x' }], h)).toBe(false);
  });

  it('numeric_state: uses strict (exclusive) above/below bounds', () => {
    const h = hass({ 'sensor.n': { state: '5' } });
    expect(checkConditionsMet([{ condition: 'numeric_state', entity: 'sensor.n', above: 4 }], h)).toBe(true);
    expect(checkConditionsMet([{ condition: 'numeric_state', entity: 'sensor.n', above: 5 }], h)).toBe(false);
    expect(checkConditionsMet([{ condition: 'numeric_state', entity: 'sensor.n', below: 6 }], h)).toBe(true);
    expect(checkConditionsMet([{ condition: 'numeric_state', entity: 'sensor.n', below: 5 }], h)).toBe(false);
  });

  it('numeric_state: a non-numeric state never passes', () => {
    const h = hass({ 'sensor.n': { state: 'unavailable' } });
    expect(checkConditionsMet([{ condition: 'numeric_state', entity: 'sensor.n', above: 0 }], h)).toBe(false);
  });

  it('top-level array elements are ANDed together', () => {
    const h = hass({ 'sensor.a': { state: 'on' }, 'sensor.b': { state: 'off' } });
    expect(
      checkConditionsMet(
        [
          { condition: 'state', entity: 'sensor.a', state: 'on' },
          { condition: 'state', entity: 'sensor.b', state: 'on' },
        ],
        h,
      ),
    ).toBe(false);
    expect(
      checkConditionsMet(
        [
          { condition: 'state', entity: 'sensor.a', state: 'on' },
          { condition: 'state', entity: 'sensor.b', state: 'off' },
        ],
        h,
      ),
    ).toBe(true);
  });

  it('and/or/not compose nested conditions with the expected semantics', () => {
    const h = hass({ 'sensor.a': { state: 'on' }, 'sensor.b': { state: 'off' } });
    const a_on = { condition: 'state', entity: 'sensor.a', state: 'on' };
    const b_on = { condition: 'state', entity: 'sensor.b', state: 'on' };
    expect(checkConditionsMet([{ condition: 'or', conditions: [a_on, b_on] }], h)).toBe(true);
    expect(checkConditionsMet([{ condition: 'and', conditions: [a_on, b_on] }], h)).toBe(false);
    expect(checkConditionsMet([{ condition: 'not', conditions: [b_on] }], h)).toBe(true);
  });

  it('an unsupported condition type is treated as met, not as hiding the control', () => {
    expect(checkConditionsMet([{ condition: 'screen', media_query: '(min-width: 1px)' }], hass({}))).toBe(true);
  });
});
