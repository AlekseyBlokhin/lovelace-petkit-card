import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runAction, bindActionHandlers } from '../../src/lib/actions.js';

function makeHass() {
  return { callService: vi.fn(), user: { id: 'user1' } };
}

function makeEl() {
  const el = document.createElement('div');
  return el;
}

describe('runAction', () => {
  it('defaults to more-info on the fallback entity when no action config is given', () => {
    const el = makeEl();
    const listener = vi.fn();
    el.addEventListener('hass-more-info', listener);
    runAction(el, makeHass(), undefined, 'sensor.fallback');
    expect(listener.mock.calls[0][0].detail).toEqual({ entityId: 'sensor.fallback' });
  });

  it('more-info: prefers the action config\'s own entity over the fallback', () => {
    const el = makeEl();
    const listener = vi.fn();
    el.addEventListener('hass-more-info', listener);
    runAction(el, makeHass(), { action: 'more-info', entity: 'sensor.explicit' }, 'sensor.fallback');
    expect(listener.mock.calls[0][0].detail).toEqual({ entityId: 'sensor.explicit' });
  });

  it('toggle: calls homeassistant.toggle on the target entity', () => {
    const hass = makeHass();
    runAction(makeEl(), hass, { action: 'toggle' }, 'switch.x');
    expect(hass.callService).toHaveBeenCalledWith('homeassistant', 'toggle', { entity_id: 'switch.x' });
  });

  it('perform-action: splits the domain.service and merges data + target', () => {
    const hass = makeHass();
    runAction(makeEl(), hass, {
      action: 'perform-action',
      perform_action: 'button.press',
      target: { entity_id: 'button.start' },
    });
    expect(hass.callService).toHaveBeenCalledWith('button', 'press', { entity_id: 'button.start' });
  });

  it('perform-action: honors the deprecated service/service_data aliases', () => {
    const hass = makeHass();
    runAction(makeEl(), hass, { action: 'call-service', service: 'button.press', service_data: { entity_id: 'button.a' } });
    expect(hass.callService).toHaveBeenCalledWith('button', 'press', { entity_id: 'button.a' });
  });

  it('none: does nothing', () => {
    const hass = makeHass();
    runAction(makeEl(), hass, { action: 'none' }, 'sensor.x');
    expect(hass.callService).not.toHaveBeenCalled();
  });

  it('confirmation: blocks the action when the user does not confirm', () => {
    const hass = makeHass();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    runAction(makeEl(), hass, { action: 'toggle', entity: 'switch.x', confirmation: { text: 'Sure?' } });
    expect(hass.callService).not.toHaveBeenCalled();
    expect(confirmSpy).toHaveBeenCalledWith('Sure?');
    confirmSpy.mockRestore();
  });

  it('confirmation: proceeds when the user confirms', () => {
    const hass = makeHass();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    runAction(makeEl(), hass, { action: 'toggle', entity: 'switch.x', confirmation: { text: 'Sure?' } });
    expect(hass.callService).toHaveBeenCalledWith('homeassistant', 'toggle', { entity_id: 'switch.x' });
    vi.restoreAllMocks();
  });

  it('confirmation: skips the prompt entirely for an exempt user', () => {
    const hass = makeHass();
    const confirmSpy = vi.spyOn(window, 'confirm');
    runAction(makeEl(), hass, {
      action: 'toggle',
      entity: 'switch.x',
      confirmation: { text: 'Sure?', exemptions: [{ user: 'user1' }] },
    });
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(hass.callService).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});

describe('bindActionHandlers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function click(el) {
    el.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    el.dispatchEvent(new Event('click', { bubbles: true }));
  }

  it('a plain tap runs tapAction when no hold/double-tap is configured', () => {
    const hass = makeHass();
    const el = makeEl();
    bindActionHandlers(el, () => ({ hass, tapAction: { action: 'toggle', entity: 'switch.x' } }));
    click(el);
    expect(hass.callService).toHaveBeenCalledWith('homeassistant', 'toggle', { entity_id: 'switch.x' });
  });

  it('holding past the threshold runs holdAction instead of tapAction', () => {
    const hass = makeHass();
    const el = makeEl();
    bindActionHandlers(el, () => ({
      hass,
      tapAction: { action: 'toggle', entity: 'switch.tap' },
      holdAction: { action: 'toggle', entity: 'switch.hold' },
    }));
    el.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    vi.advanceTimersByTime(600);
    el.dispatchEvent(new Event('click', { bubbles: true }));
    expect(hass.callService).toHaveBeenCalledWith('homeassistant', 'toggle', { entity_id: 'switch.hold' });
    expect(hass.callService).not.toHaveBeenCalledWith('homeassistant', 'toggle', { entity_id: 'switch.tap' });
  });

  it('a quick tap (below the hold threshold) with holdAction configured still runs tapAction', () => {
    const hass = makeHass();
    const el = makeEl();
    bindActionHandlers(el, () => ({
      hass,
      tapAction: { action: 'toggle', entity: 'switch.tap' },
      holdAction: { action: 'toggle', entity: 'switch.hold' },
    }));
    click(el);
    expect(hass.callService).toHaveBeenCalledWith('homeassistant', 'toggle', { entity_id: 'switch.tap' });
  });

  it('two quick taps run doubleTapAction instead of two tapActions', () => {
    const hass = makeHass();
    const el = makeEl();
    bindActionHandlers(el, () => ({
      hass,
      tapAction: { action: 'toggle', entity: 'switch.tap' },
      doubleTapAction: { action: 'toggle', entity: 'switch.double' },
    }));
    click(el);
    click(el);
    expect(hass.callService).toHaveBeenCalledWith('homeassistant', 'toggle', { entity_id: 'switch.double' });
    expect(hass.callService).not.toHaveBeenCalledWith('homeassistant', 'toggle', { entity_id: 'switch.tap' });
  });

  it('a single tap with doubleTapAction configured still eventually runs tapAction, after the wait window', () => {
    const hass = makeHass();
    const el = makeEl();
    bindActionHandlers(el, () => ({
      hass,
      tapAction: { action: 'toggle', entity: 'switch.tap' },
      doubleTapAction: { action: 'toggle', entity: 'switch.double' },
    }));
    click(el);
    expect(hass.callService).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(hass.callService).toHaveBeenCalledWith('homeassistant', 'toggle', { entity_id: 'switch.tap' });
  });

  it('reads getConfig fresh on every interaction, not a stale snapshot', () => {
    const hass = makeHass();
    const el = makeEl();
    let entity = 'switch.first';
    bindActionHandlers(el, () => ({ hass, tapAction: { action: 'toggle', entity } }));
    click(el);
    entity = 'switch.second';
    click(el);
    expect(hass.callService).toHaveBeenNthCalledWith(1, 'homeassistant', 'toggle', { entity_id: 'switch.first' });
    expect(hass.callService).toHaveBeenNthCalledWith(2, 'homeassistant', 'toggle', { entity_id: 'switch.second' });
  });
});
