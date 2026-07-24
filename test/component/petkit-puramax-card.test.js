import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PetkitPuramaxCard } from '../../src/cards/puramax/petkit-puramax-card.js';
import { dayBounds } from '../../src/lib/day.js';
import { CHART_WIDTH, CHART_PADDING } from '../../src/cards/puramax/petkit-puramax-card.const.js';
import { formatDuration } from '../../src/lib/format.js';

if (!customElements.get('petkit-puramax-card')) {
  customElements.define('petkit-puramax-card', PetkitPuramaxCard);
}

function baseConfig(overrides = {}) {
  return {
    type: 'custom:petkit-puramax-card',
    device_entities: {
      total_use: 'sensor.test_petkit_total_use',
      error: 'sensor.test_petkit_error',
      last_event: 'sensor.test_petkit_last_event',
      state: 'sensor.test_petkit_state',
    },
    cats: [{ name: 'Cat A', color: '#111111' }],
    ...overrides,
  };
}

function makeHass(states = {}) {
  return {
    states,
    callWS: vi.fn().mockResolvedValue({}),
    callService: vi.fn(),
  };
}

async function flush() {
  // Let the fire-and-forget _loadDay()/_loadAnalytics() async chains settle.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function makeCard() {
  return /** @type {PetkitPuramaxCard} */ (document.createElement('petkit-puramax-card'));
}

describe('PetkitPuramaxCard: setConfig validation', () => {
  it('throws a specific error when config is missing', () => {
    const card = makeCard();
    expect(() => card.setConfig(undefined)).toThrow('petkit-puramax-card: config is required');
  });

  it('throws a specific error when device_entities is missing', () => {
    const card = makeCard();
    const cfg = baseConfig();
    delete cfg.device_entities;
    expect(() => card.setConfig(cfg)).toThrow('petkit-puramax-card: "device_entities" is required in config');
  });

  it('throws a specific error when cats is missing', () => {
    const card = makeCard();
    const cfg = baseConfig();
    delete cfg.cats;
    expect(() => card.setConfig(cfg)).toThrow('petkit-puramax-card: "cats" is required in config');
  });

  it('throws a specific error when cats is an empty array', () => {
    const card = makeCard();
    expect(() => card.setConfig(baseConfig({ cats: [] }))).toThrow(
      'petkit-puramax-card: "cats" must be a non-empty array',
    );
  });

  it('throws a specific error when device_entities.total_use is missing', () => {
    const card = makeCard();
    const cfg = baseConfig();
    delete cfg.device_entities.total_use;
    expect(() => card.setConfig(cfg)).toThrow('petkit-puramax-card: "device_entities.total_use" is required in config');
  });

  it('throws a specific error naming the missing cat field: name', () => {
    const card = makeCard();
    const cfg = baseConfig({ cats: [{ color: '#fff' }] });
    expect(() => card.setConfig(cfg)).toThrow('cats[0].name is required');
  });

  it('throws a specific error naming the missing cat field: color', () => {
    const card = makeCard();
    const cfg = baseConfig({ cats: [{ name: 'A' }] });
    expect(() => card.setConfig(cfg)).toThrow('cats[0].color is required');
  });

  it('identifies the correct index for a later invalid cat', () => {
    const card = makeCard();
    const cfg = baseConfig({
      device_entities: { ...baseConfig().device_entities, last_used_by: 'sensor.test_petkit_last_used_by' },
      cats: [
        { name: 'A', color: '#fff' },
        { name: 'B' },
      ],
    });
    expect(() => card.setConfig(cfg)).toThrow('cats[1].color is required');
  });

  it('does not require device_entities.last_used_by with a single cat', () => {
    const card = makeCard();
    expect(() => card.setConfig(baseConfig())).not.toThrow();
  });

  it('throws a specific error when device_entities.last_used_by is missing with more than one cat', () => {
    const card = makeCard();
    const cfg = baseConfig({ cats: [{ name: 'A', color: '#fff' }, { name: 'B', color: '#000' }] });
    expect(() => card.setConfig(cfg)).toThrow(
      'petkit-puramax-card: "device_entities.last_used_by" is required in config when more than one cat is configured',
    );
  });

  it('accepts a valid multi-cat config once last_used_by is set', () => {
    const card = makeCard();
    const cfg = baseConfig({
      device_entities: { ...baseConfig().device_entities, last_used_by: 'sensor.test_petkit_last_used_by' },
      cats: [{ name: 'A', color: '#fff' }, { name: 'B', color: '#000' }],
    });
    expect(() => card.setConfig(cfg)).not.toThrow();
  });

  it('accepts a fully valid config without throwing', () => {
    const card = makeCard();
    expect(() => card.setConfig(baseConfig())).not.toThrow();
  });

  it('does not mutate a frozen config object (the real Lovelace host freezes it)', () => {
    // Regression: setConfig() used to do `config.device_entities = ... || {}`
    // directly on the incoming config to default a missing device_entities,
    // which throws against a real (frozen) Lovelace config object -- plain
    // mutable test objects don't catch this, only a frozen one does.
    const card = makeCard();
    const cfg = Object.freeze({
      type: 'custom:petkit-puramax-card',
      device_id: 'dev1',
      cats: [{ name: 'A', color: '#fff' }],
    });
    expect(() => card.setConfig(cfg)).not.toThrow();
  });
});

describe('PetkitPuramaxCard: getStubConfig', () => {
  it('returns an object that itself passes setConfig without throwing, with no hass', () => {
    const card = makeCard();
    const stub = PetkitPuramaxCard.getStubConfig();
    expect(() => card.setConfig(stub)).not.toThrow();
  });

  it('hardcodes no entity ids and no device_entities at all', () => {
    const stub = PetkitPuramaxCard.getStubConfig();
    expect(stub.device_entities).toBeUndefined();
  });

  it('leaves device_id empty when hass has no PetKit device', () => {
    const stub = PetkitPuramaxCard.getStubConfig({ entities: {} });
    expect(stub.device_id).toBe('');
  });

  it('auto-detects device_id from the entity registry when a PetKit device exists', () => {
    const hass = {
      entities: {
        'sensor.other_thing': { entity_id: 'sensor.other_thing', device_id: 'dev-unrelated', platform: 'other' },
        'sensor.petkit_total_use': { entity_id: 'sensor.petkit_total_use', device_id: 'dev-petkit', platform: 'petkit' },
      },
    };
    const stub = PetkitPuramaxCard.getStubConfig(hass);
    expect(stub.device_id).toBe('dev-petkit');
  });

  it('uses a friendly default cat name and a human-readable color', () => {
    const stub = PetkitPuramaxCard.getStubConfig();
    expect(stub.cats).toEqual([{ name: 'My Cat', color: 'blue' }]);
  });
});

describe('PetkitPuramaxCard: device_id resolution', () => {
  const DEVICE_ID = 'dev1';

  function deviceEntities(overrides = {}) {
    const specs = {
      'sensor.petkit_total_use': 'total_use',
      'sensor.petkit_last_used_by': 'last_used_by',
      'sensor.petkit_error': 'error',
      'sensor.petkit_last_event': 'max_last_event',
      'sensor.petkit_state': 'max_work_state',
      ...overrides,
    };
    const entities = {};
    for (const [entityId, translationKey] of Object.entries(specs)) {
      if (translationKey === null) continue;
      entities[entityId] = { entity_id: entityId, device_id: DEVICE_ID, translation_key: translationKey };
    }
    return entities;
  }

  function makeHassWithRegistry(states, entities) {
    return { ...makeHass(states), entities };
  }

  it('accepts a device_id-only config (no device_entities) without throwing', () => {
    const card = makeCard();
    expect(() =>
      card.setConfig({ type: 'custom:petkit-puramax-card', device_id: DEVICE_ID, cats: [{ name: 'A', color: '#fff' }] }),
    ).not.toThrow();
  });

  it('resolves device_entities from the entity registry via translation_key and uses them', async () => {
    const card = makeCard();
    card.setConfig({ type: 'custom:petkit-puramax-card', device_id: DEVICE_ID, cats: [{ name: 'A', color: '#fff' }] });
    const hass = makeHassWithRegistry(
      { 'sensor.petkit_error': { state: 'no_error' } },
      deviceEntities(),
    );
    card.hass = hass;
    await flush();
    expect(card.shadowRoot.querySelector('ha-alert')).toBeNull();
    const calledEntityIds = hass.callWS.mock.calls.flatMap((call) => call[0].entity_ids || []);
    expect(calledEntityIds).toContain('sensor.petkit_total_use');
  });

  it('renders an in-card error when device_id cannot resolve a total_use sensor', async () => {
    const card = makeCard();
    card.setConfig({ type: 'custom:petkit-puramax-card', device_id: DEVICE_ID, cats: [{ name: 'A', color: '#fff' }] });
    card.hass = makeHassWithRegistry({}, {});
    await flush();
    const alert = card.shadowRoot.querySelector('ha-alert');
    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain('Could not auto-detect');
  });

  it('renders an in-card error when more than one cat is configured but last_used_by cannot be resolved', async () => {
    const card = makeCard();
    card.setConfig({
      type: 'custom:petkit-puramax-card',
      device_id: DEVICE_ID,
      cats: [
        { name: 'A', color: '#fff' },
        { name: 'B', color: '#000' },
      ],
    });
    card.hass = makeHassWithRegistry({}, deviceEntities({ 'sensor.petkit_last_used_by': null }));
    await flush();
    const alert = card.shadowRoot.querySelector('ha-alert');
    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain('last used by');
  });

  it('an explicit device_entities entry overrides the auto-detected one', async () => {
    const card = makeCard();
    card.setConfig({
      type: 'custom:petkit-puramax-card',
      device_id: DEVICE_ID,
      device_entities: { total_use: 'sensor.manual_override_total_use' },
      cats: [{ name: 'A', color: '#fff' }],
    });
    const hass = makeHassWithRegistry({ 'sensor.petkit_error': { state: 'no_error' } }, deviceEntities());
    card.hass = hass;
    await flush();
    expect(card.shadowRoot.querySelector('ha-alert')).toBeNull();
    const calledEntityIds = hass.callWS.mock.calls.flatMap((call) => call[0].entity_ids || []);
    expect(calledEntityIds).toContain('sensor.manual_override_total_use');
    expect(calledEntityIds).not.toContain('sensor.petkit_total_use');
  });

  it('accepts an explicitly-empty device_id (e.g. a stub with no auto-detected device) without throwing', () => {
    const card = makeCard();
    expect(() =>
      card.setConfig({ type: 'custom:petkit-puramax-card', device_id: '', cats: [{ name: 'A', color: '#fff' }] }),
    ).not.toThrow();
  });

  it('renders a "device is required" error (not a generic detection-failure one) when device_id is empty', async () => {
    const card = makeCard();
    card.setConfig({ type: 'custom:petkit-puramax-card', device_id: '', cats: [{ name: 'A', color: '#fff' }] });
    card.hass = makeHass({});
    await flush();
    const alert = card.shadowRoot.querySelector('ha-alert');
    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain('A PetKit device is required');
  });
});

describe('PetkitPuramaxCard: rendering', () => {
  let card;

  beforeEach(() => {
    card = makeCard();
  });

  it('renders one chip per info_row entry when there is no device error', async () => {
    const cfg = baseConfig({
      info_row: [
        { entity: 'sensor.consumable', name: 'Consumable' },
        { entity: 'sensor.bin', name: 'Bin' },
      ],
    });
    card.setConfig(cfg);
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.consumable': { state: '80' },
      'sensor.bin': { state: 'ok' },
    });
    await flush();
    const chips = card.shadowRoot.querySelectorAll('.chip');
    expect(chips.length).toBe(2);
  });

  it('adds one extra chip for a device error', async () => {
    const cfg = baseConfig({ info_row: [{ entity: 'sensor.consumable', name: 'Consumable' }] });
    card.setConfig(cfg);
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'bin_full' },
      'sensor.consumable': { state: '80' },
    });
    await flush();
    const chips = card.shadowRoot.querySelectorAll('.chip');
    expect(chips.length).toBe(2);
    expect(card.shadowRoot.querySelector('.chip.warn')).not.toBeNull();
  });

  // REGRESSION (reported live): the error entity going `unavailable` (a
  // coordinator hiccup, same flicker documented for last_event/last_used_by)
  // rendered an "Error: unavailable" chip -- actively misleading, since
  // unavailable means "no assertion at all," not "there is a real error."
  it.each(['unavailable', 'unknown', 'Unavailable', 'UNKNOWN'])(
    'does NOT show an Error chip when the error entity itself is "%s"',
    async (state) => {
      const cfg = baseConfig();
      card.setConfig(cfg);
      card.hass = makeHass({ 'sensor.test_petkit_error': { state } });
      await flush();
      expect(card.shadowRoot.querySelector('.chip.warn')).toBeNull();
      const chips = Array.from(card.shadowRoot.querySelectorAll('.chip-label')).map((el) => el.textContent);
      expect(chips).not.toContain('Error');
    },
  );

  it('escapes a malicious entity state value instead of injecting it into the DOM (XSS regression)', async () => {
    // info_row can point at ANY entity, not just PETKIT's own narrow-enum
    // sensors -- a state value is untrusted input as far as this card is
    // concerned, and must never reach innerHTML unescaped.
    const cfg = baseConfig({ info_row: [{ entity: 'sensor.untrusted', name: 'Untrusted' }] });
    card.setConfig(cfg);
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.untrusted': { state: '<img src=x onerror=alert(1)>' },
    });
    await flush();
    // No injected element should have been parsed into the live DOM...
    expect(card.shadowRoot.querySelector('img')).toBeNull();
    // ...and the escaped text should still be visible as literal text.
    const chipValue = card.shadowRoot.querySelector('.chip-value');
    expect(chipValue.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('escapes an HTML-breakout attempt in a device error state without adding extra elements', async () => {
    const cfg = baseConfig();
    card.setConfig(cfg);
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: '"><b>pwned</b>' },
    });
    await flush();
    const warnChips = card.shadowRoot.querySelectorAll('.chip.warn');
    // Exactly one warn chip -- an unescaped payload here would have broken
    // out of the chip-value div and injected a sibling <b> element/extra chip.
    expect(warnChips.length).toBe(1);
    expect(card.shadowRoot.querySelector('.chip-value b')).toBeNull();
    expect(warnChips[0].querySelector('.chip-value').textContent).toBe('"><b>pwned</b>');
  });

  it('falls back to the entity\'s friendly_name (not the raw entity_id) for a chip with no configured name', async () => {
    const cfg = baseConfig({ info_row: [{ entity: 'sensor.consumable' }] });
    card.setConfig(cfg);
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.consumable': { state: '80', attributes: { friendly_name: 'Consumable remaining' } },
    });
    await flush();
    expect(card.shadowRoot.querySelector('.chip-label').textContent).toBe('Consumable remaining');
  });

  it('an explicit name still overrides the entity\'s friendly_name', async () => {
    const cfg = baseConfig({ info_row: [{ entity: 'sensor.consumable', name: 'My Chip' }] });
    card.setConfig(cfg);
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.consumable': { state: '80', attributes: { friendly_name: 'Consumable remaining' } },
    });
    await flush();
    expect(card.shadowRoot.querySelector('.chip-label').textContent).toBe('My Chip');
  });

  it('prefers the entity registry\'s short display name over the combined device+entity friendly_name', async () => {
    // hass.entities mirrors HA's entity registry -- its `.name` is the same
    // short, entity-relative name shown on a device's own page (e.g.
    // "Wastebin"), unlike `friendly_name` (e.g. "PETKIT PURAMAX Wastebin"),
    // which is redundant once the card's own title already names the device.
    const cfg = baseConfig({ info_row: [{ entity: 'sensor.consumable' }] });
    card.setConfig(cfg);
    const hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.consumable': { state: '80', attributes: { friendly_name: 'PETKIT PURAMAX Consumable' } },
    });
    hass.entities = { 'sensor.consumable': { name: 'Consumable' } };
    card.hass = hass;
    await flush();
    expect(card.shadowRoot.querySelector('.chip-label').textContent).toBe('Consumable');
  });

  it('shows the entity\'s HA-translated state, not the raw state, when hass.formatEntityState is available', async () => {
    const cfg = baseConfig({ info_row: [{ entity: 'binary_sensor.wastebin', name: 'Waste Bin' }] });
    card.setConfig(cfg);
    const hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'binary_sensor.wastebin': { state: 'off', attributes: { device_class: 'problem' } },
    });
    hass.formatEntityState = vi.fn().mockReturnValue('OK');
    card.hass = hass;
    await flush();
    expect(card.shadowRoot.querySelector('.chip-value').textContent).toBe('OK');
  });

  it('falls back to the raw state for the chip value when hass has no formatEntityState (plain mock hass)', async () => {
    const cfg = baseConfig({ info_row: [{ entity: 'sensor.consumable', name: 'Consumable' }] });
    card.setConfig(cfg);
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.consumable': { state: '80' },
    });
    await flush();
    expect(card.shadowRoot.querySelector('.chip-value').textContent).toBe('80');
  });

  it('still warns off the entity\'s RAW state, independent of its translated display text', async () => {
    const cfg = baseConfig({ info_row: [{ entity: 'binary_sensor.wastebin', name: 'Waste Bin', warn_state: 'on' }] });
    card.setConfig(cfg);
    const hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'binary_sensor.wastebin': { state: 'on', attributes: { device_class: 'problem' } },
    });
    hass.formatEntityState = vi.fn().mockReturnValue('Problem');
    card.hass = hass;
    await flush();
    const chip = card.shadowRoot.querySelector('.chip');
    expect(chip.classList.contains('warn')).toBe(true);
    expect(chip.querySelector('.chip-value').textContent).toBe('Problem');
  });

  it('renders a live ha-state-icon (not a fixed generic icon) for a chip with no configured icon', async () => {
    const cfg = baseConfig({ info_row: [{ entity: 'sensor.consumable' }] });
    card.setConfig(cfg);
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.consumable': { state: '80', attributes: {} },
    });
    await flush();
    const stateIcon = card.shadowRoot.querySelector('.chip ha-state-icon');
    expect(stateIcon).not.toBeNull();
    expect(/** @type {any} */ (stateIcon).stateObj).toEqual({ state: '80', attributes: {} });
    expect(card.shadowRoot.querySelector('.chip ha-icon')).toBeNull();
  });

  it('an explicit icon still overrides the live entity icon (plain ha-icon, not ha-state-icon)', async () => {
    const cfg = baseConfig({ info_row: [{ entity: 'sensor.consumable', icon: 'mdi:custom' }] });
    card.setConfig(cfg);
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.consumable': { state: '80', attributes: { icon: 'mdi:from-entity' } },
    });
    await flush();
    expect(card.shadowRoot.querySelector('.chip ha-icon').getAttribute('icon')).toBe('mdi:custom');
    expect(card.shadowRoot.querySelector('.chip ha-state-icon')).toBeNull();
  });

  it('a control with no configured name/icon falls back to the entity\'s friendly_name and a live ha-state-icon', async () => {
    const cfg = baseConfig({ controls_row: [{ entity: 'switch.auto_clean', tap_action: { action: 'toggle' } }] });
    card.setConfig(cfg);
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'switch.auto_clean': { state: 'off', attributes: { friendly_name: 'Auto cleaning' } },
    });
    await flush();
    const btn = card.shadowRoot.getElementById('ctrl-0');
    expect(btn.getAttribute('label')).toBe('Auto cleaning');
    expect(btn.querySelector('ha-state-icon')).not.toBeNull();
  });

  it('dispatches hass-more-info when a status chip is clicked', async () => {
    const cfg = baseConfig({ info_row: [{ entity: 'sensor.consumable', name: 'Consumable' }] });
    card.setConfig(cfg);
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.consumable': { state: '80' },
    });
    await flush();
    const listener = vi.fn();
    card.addEventListener('hass-more-info', listener);
    const chip = card.shadowRoot.querySelector('.chip[data-entity="sensor.consumable"]');
    chip.dispatchEvent(new Event('click', { bubbles: true }));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({ entityId: 'sensor.consumable' });
  });

  it('dispatches hass-more-info when the device-error chip is clicked', async () => {
    const cfg = baseConfig();
    card.setConfig(cfg);
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'bin_full' } });
    await flush();
    const listener = vi.fn();
    card.addEventListener('hass-more-info', listener);
    const chip = card.shadowRoot.querySelector('.chip.warn[data-entity="sensor.test_petkit_error"]');
    chip.dispatchEvent(new Event('click', { bubbles: true }));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({ entityId: 'sensor.test_petkit_error' });
  });

  it('a status chip survives a live-value re-render and stays tappable', async () => {
    // statusRow.innerHTML is rebuilt on every _updateLiveValues() call (see
    // the chip-tap wiring's own comment) -- the click listener must be
    // delegated to the stable container, not attached per-chip, or a chip
    // rebuilt after the first hass update would go dead.
    const cfg = baseConfig({ info_row: [{ entity: 'sensor.consumable', name: 'Consumable' }] });
    card.setConfig(cfg);
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.consumable': { state: '80' },
    });
    await flush();
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.consumable': { state: '81' },
    });
    await flush();
    const listener = vi.fn();
    card.addEventListener('hass-more-info', listener);
    const chip = card.shadowRoot.querySelector('.chip[data-entity="sensor.consumable"]');
    chip.dispatchEvent(new Event('click', { bubbles: true }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('renders one button per visible controls_row entry', async () => {
    const cfg = baseConfig({
      controls_row: [
        { name: 'Start', icon: 'mdi:play', entity: 'button.start', tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.start' } } },
        { name: 'Stop', icon: 'mdi:stop', entity: 'button.stop', tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.stop' } } },
        { name: 'Toggle', icon: 'mdi:toggle-switch', entity: 'switch.x', tap_action: { action: 'toggle' } },
      ],
    });
    card.setConfig(cfg);
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    const buttons = card.shadowRoot.querySelectorAll('.ctrl-btn');
    expect(buttons.length).toBe(3);
  });

  it('a perform-action tap_action calls hass.callService with the domain/service split from perform_action', async () => {
    const cfg = baseConfig({
      controls_row: [
        {
          name: 'Start',
          icon: 'mdi:play',
          entity: 'button.start_clean',
          tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.start_clean' } },
        },
      ],
    });
    card.setConfig(cfg);
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    card.hass = hass;
    await flush();
    const btn = card.shadowRoot.getElementById('ctrl-0');
    btn.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    btn.dispatchEvent(new Event('click', { bubbles: true }));
    expect(hass.callService).toHaveBeenCalledWith('button', 'press', { entity_id: 'button.start_clean' });
  });

  it('a toggle tap_action calls the entity\'s own domain-specific turn_on/turn_off directly, not homeassistant.toggle', () => {
    // Matches HA's real frontend toggle behavior (see src/lib/actions.js) --
    // NOT the generic backend homeassistant.toggle service, which silently
    // no-ops for domains (like button, used by several of this card's own
    // default controls) that never register a service literally named
    // "toggle".
    const cfg = baseConfig({
      controls_row: [{ name: 'Fan', icon: 'mdi:fan', entity: 'switch.fan', tap_action: { action: 'toggle' } }],
    });
    card.setConfig(cfg);
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' }, 'switch.fan': { state: 'off' } });
    card.hass = hass;
    const btn = card.shadowRoot.getElementById('ctrl-0');
    btn.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    btn.dispatchEvent(new Event('click', { bubbles: true }));
    expect(hass.callService).toHaveBeenCalledWith('switch', 'turn_on', { entity_id: 'switch.fan' });
  });

  it('highlights a toggle-style control (ctrl-btn-active) whenever its entity is currently "on"', async () => {
    const cfg = baseConfig({
      controls_row: [{ name: 'Auto cleaning', entity: 'switch.auto_clean', tap_action: { action: 'toggle' } }],
    });
    card.setConfig(cfg);
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' }, 'switch.auto_clean': { state: 'on' } });
    await flush();
    expect(card.shadowRoot.getElementById('ctrl-0').classList.contains('ctrl-btn-active')).toBe(true);
  });

  it('does not highlight a control whose entity is "off"', async () => {
    const cfg = baseConfig({
      controls_row: [{ name: 'Auto cleaning', entity: 'switch.auto_clean', tap_action: { action: 'toggle' } }],
    });
    card.setConfig(cfg);
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' }, 'switch.auto_clean': { state: 'off' } });
    await flush();
    expect(card.shadowRoot.getElementById('ctrl-0').classList.contains('ctrl-btn-active')).toBe(false);
  });

  it('dispatches hass-more-info when a more-info tap_action control is clicked', async () => {
    const cfg = baseConfig({
      controls_row: [{ name: 'Details', icon: 'mdi:info', entity: 'sensor.detail', tap_action: { action: 'more-info' } }],
    });
    card.setConfig(cfg);
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    const listener = vi.fn();
    card.addEventListener('hass-more-info', listener);
    const btn = card.shadowRoot.getElementById('ctrl-0');
    btn.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    btn.dispatchEvent(new Event('click', { bubbles: true }));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({ entityId: 'sensor.detail' });
  });

  it('a visibility-gated "Exit Maintenance" control shows only while the device is in maintenance', async () => {
    const cfg = baseConfig({
      controls_row: [
        {
          name: 'Start Maintenance',
          entity: 'button.maint_start',
          tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.maint_start' } },
          visibility: [{ condition: 'state', entity: 'sensor.test_petkit_state', state_not: 'maintenance' }],
        },
        {
          name: 'Exit Maintenance',
          entity: 'button.maint_exit',
          tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.maint_exit' } },
          visibility: [{ condition: 'state', entity: 'sensor.test_petkit_state', state: 'maintenance' }],
        },
      ],
    });
    card.setConfig(cfg);
    const hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.test_petkit_state': { state: 'maintenance' },
    });
    card.hass = hass;
    await flush();
    const buttons = card.shadowRoot.querySelectorAll('.ctrl-btn');
    expect(buttons.length).toBe(1);
    expect(buttons[0].getAttribute('label')).toBe('Exit Maintenance');
    buttons[0].dispatchEvent(new Event('pointerdown', { bubbles: true }));
    buttons[0].dispatchEvent(new Event('click', { bubbles: true }));
    expect(hass.callService).toHaveBeenCalledWith('button', 'press', { entity_id: 'button.maint_exit' });
  });

  it('the visible control set updates live when the gating entity state changes', async () => {
    const cfg = baseConfig({
      controls_row: [
        {
          name: 'Start Maintenance',
          entity: 'button.maint_start',
          tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.maint_start' } },
          visibility: [{ condition: 'state', entity: 'sensor.test_petkit_state', state_not: 'maintenance' }],
        },
        {
          name: 'Exit Maintenance',
          entity: 'button.maint_exit',
          tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.maint_exit' } },
          visibility: [{ condition: 'state', entity: 'sensor.test_petkit_state', state: 'maintenance' }],
        },
      ],
    });
    card.setConfig(cfg);
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.test_petkit_state': { state: 'idle' },
    });
    await flush();
    expect(card.shadowRoot.querySelector('.ctrl-btn').getAttribute('label')).toBe('Start Maintenance');

    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.test_petkit_state': { state: 'maintenance' },
    });
    await flush();
    expect(card.shadowRoot.querySelectorAll('.ctrl-btn').length).toBe(1);
    expect(card.shadowRoot.querySelector('.ctrl-btn').getAttribute('label')).toBe('Exit Maintenance');
  });

  it('shows the configured title, defaulting to "PETKIT PURAMAX"', async () => {
    card.setConfig(baseConfig());
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    expect(card.shadowRoot.querySelector('.title').textContent).toBe('PETKIT PURAMAX');
  });

  it('uses a custom title when configured', async () => {
    card.setConfig(baseConfig({ title: 'My Litter Box' }));
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    expect(card.shadowRoot.querySelector('.title').textContent).toBe('My Litter Box');
  });

  it('getCardSize returns a fixed layout size', () => {
    expect(card.getCardSize()).toBe(14);
  });

  it('shows the resolved device state top-right in the header, and it is tappable', async () => {
    card.setConfig(baseConfig());
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.test_petkit_state': { state: 'auto_cleaning' },
    });
    await flush();
    const badge = card.shadowRoot.querySelector('.state-badge');
    expect(badge.hidden).toBe(false);
    expect(badge.textContent).toBe('auto cleaning');
    const listener = vi.fn();
    card.addEventListener('hass-more-info', listener);
    badge.dispatchEvent(new Event('click', { bubbles: true }));
    expect(listener.mock.calls[0][0].detail).toEqual({ entityId: 'sensor.test_petkit_state' });
  });

  it('hides the state badge when the state entity has no value', async () => {
    card.setConfig(baseConfig());
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    expect(card.shadowRoot.querySelector('.state-badge').hidden).toBe(true);
  });

  it('omits the state badge entirely when show_state is false', async () => {
    card.setConfig(baseConfig({ show_state: false }));
    card.hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.test_petkit_state': { state: 'idle' },
    });
    await flush();
    expect(card.shadowRoot.querySelector('.state-badge')).toBeNull();
  });

  it('hides the History (chart) section when show_history is false, without breaking Working Records', async () => {
    card.setConfig(baseConfig({ show_history: false }));
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    expect(card.shadowRoot.querySelector('.chart-section')).toBeNull();
    expect(card.shadowRoot.querySelector('.records-section')).not.toBeNull();
  });

  it('hides the Analytics section when show_analytics is false', async () => {
    card.setConfig(baseConfig({ show_analytics: false }));
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    expect(card.shadowRoot.querySelector('.analytics-section')).toBeNull();
  });

  it('hides the Working Records section when show_working_records is false, without breaking the chart', async () => {
    card.setConfig(baseConfig({ show_working_records: false }));
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    expect(card.shadowRoot.querySelector('.records-section')).toBeNull();
    expect(card.shadowRoot.querySelector('.chart-section')).not.toBeNull();
  });

  it('shows every section by default (all show_* toggles default true)', async () => {
    card.setConfig(baseConfig());
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    expect(card.shadowRoot.querySelector('.chart-section')).not.toBeNull();
    expect(card.shadowRoot.querySelector('.analytics-section')).not.toBeNull();
    expect(card.shadowRoot.querySelector('.records-section')).not.toBeNull();
  });

  it('resolves a named HA theme color (not just raw hex) for a cat, e.g. in the Analytics dot', async () => {
    card.setConfig(baseConfig({ cats: [{ name: 'Cat A', color: 'deep-orange' }] }));
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    const dot = card.shadowRoot.querySelector('.cat-name-cell .dot');
    expect(dot.getAttribute('style')).toContain('var(--deep-orange-color)');
  });

  it('renders the cat name and color dot inside the analytics table\'s top-left cell, not a separate title line', async () => {
    card.setConfig(baseConfig());
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    // The old standalone title line is gone...
    expect(card.shadowRoot.querySelector('.cat-analytics-title')).toBeNull();
    // ...and the name + dot now live inside the table's first cell.
    const nameCell = card.shadowRoot.querySelector('.cat-analytics table .cat-name-cell');
    expect(nameCell).not.toBeNull();
    expect(nameCell.textContent).toBe('Cat A');
    expect(nameCell.querySelector('.dot')).not.toBeNull();
  });

  it('escapes a malicious cat name/color in the analytics table cell (XSS regression)', async () => {
    card.setConfig(
      baseConfig({
        cats: [
          {
            name: '<b>evil</b>',
            color: '"><img src=x onerror=alert(1)>',
          },
        ],
      }),
    );
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    expect(card.shadowRoot.querySelector('.cat-analytics img')).toBeNull();
    expect(card.shadowRoot.querySelector('.cat-analytics b')).toBeNull();
    const nameCell = card.shadowRoot.querySelector('.cat-name-cell');
    expect(nameCell.textContent).toBe('<b>evil</b>');
  });

  it('gives every cat\'s analytics table the same shared column-width classes, so columns line up regardless of how long any one cat\'s numbers render (refs table-misalignment bug)', async () => {
    const card = makeCard();
    card.setConfig(
      baseConfig({
        device_entities: { ...baseConfig().device_entities, last_used_by: 'sensor.test_petkit_last_used_by' },
        cats: [
          { name: 'Cat A', color: '#111111' },
          { name: 'Cat B', color: '#222222' },
        ],
      }),
    );
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    const tables = card.shadowRoot.querySelectorAll('.cat-analytics table');
    expect(tables.length).toBe(2);
    tables.forEach((table) => {
      const colClasses = Array.from(table.querySelectorAll('colgroup col')).map((c) => c.className);
      // Same classes, same order, in every table -- widths come from the
      // shared .col-name/.col-stat CSS rules (petkit-puramax-card.styles.js,
      // --pk-analytics-name-col/--pk-analytics-stat-col), never computed
      // per-table from that cat's own cell content.
      expect(colClasses).toEqual(['col-name', 'col-stat', 'col-stat', 'col-stat']);
    });
  });

  it('Analytics "Duration" row shows the weighted average visit duration, not the total (refs #10)', async () => {
    // Two synthetic past days for the device's total_use counter (a
    // cumulative running total, not a per-visit value -- consecutive-point
    // deltas are the reconstructed visit durations):
    //  - yesterday: one 100s visit (that day's own average = 100)
    //  - 2 days ago: four 10s visits, total 40s (that day's own average = 10)
    // A "total" row would show 1m10s (100+40) for 3d/7d avg; a naive
    // mean-of-daily-averages would show 55s; the correct weighted average is
    // (100+40)/(1+4) = 28s.
    const startOfToday = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const yesterday9am = new Date(startOfToday);
    yesterday9am.setDate(yesterday9am.getDate() - 1);
    yesterday9am.setHours(9, 0, 0, 0);
    const twoDaysAgo9am = new Date(startOfToday);
    twoDaysAgo9am.setDate(twoDaysAgo9am.getDate() - 2);
    twoDaysAgo9am.setHours(9, 0, 0, 0);

    const points = [
      // 2 days ago: counter resets to 0, then four +10 deltas.
      { s: '0', lu: Math.floor(twoDaysAgo9am.getTime() / 1000) },
      { s: '10', lu: Math.floor(twoDaysAgo9am.getTime() / 1000) + 60 },
      { s: '20', lu: Math.floor(twoDaysAgo9am.getTime() / 1000) + 120 },
      { s: '30', lu: Math.floor(twoDaysAgo9am.getTime() / 1000) + 180 },
      { s: '40', lu: Math.floor(twoDaysAgo9am.getTime() / 1000) + 240 },
      // yesterday: counter resets to 0, then one +100 delta.
      { s: '0', lu: Math.floor(yesterday9am.getTime() / 1000) },
      { s: '100', lu: Math.floor(yesterday9am.getTime() / 1000) + 60 },
    ];

    card.setConfig(baseConfig());
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_total_use': points });
    card.hass = hass;
    await flush();

    const rows = card.shadowRoot.querySelectorAll('.cat-analytics table tr');
    expect(rows.length).toBe(3);
    const durationCells = rows[2].querySelectorAll('td');
    expect(durationCells[0].textContent).toBe('Duration');
    // No visits today -> "—", not "0s".
    expect(durationCells[1].textContent).toBe('—');
    expect(durationCells[2].textContent).toBe('28s'); // 3d avg, weighted
    expect(durationCells[3].textContent).toBe('28s'); // 7d avg, weighted (only 2 days exist)
    expect(durationCells[2].textContent).not.toBe('1m10s'); // would be the (wrong) total-based value
  });
});

describe('PetkitPuramaxCard: Working Records event filtering (refs #11)', () => {
  it('hides unavailable/unknown/no_events_yet by default (DEFAULT_EVENT_EXCLUDE), showing only real device events', async () => {
    const cfg = baseConfig();
    const card = makeCard();
    card.setConfig(cfg);
    const today9am = new Date();
    today9am.setHours(9, 0, 0, 0);
    const lastEventHistory = [
      { s: 'no_events_yet', lu: Math.floor(today9am.getTime() / 1000) },
      { s: 'unavailable', lu: Math.floor(today9am.getTime() / 1000) + 60 },
      { s: 'unknown', lu: Math.floor(today9am.getTime() / 1000) + 120 },
      { s: 'maintenance_mode', lu: Math.floor(today9am.getTime() / 1000) + 180 },
    ];
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_last_event': lastEventHistory });
    card.hass = hass;
    await flush();

    const rows = card.shadowRoot.querySelectorAll('.record-row');
    expect(rows.length).toBe(1);
    expect(rows[0].querySelector('.record-text').textContent).toBe('maintenance_mode');
  });

  it('a user can replace the exclude list via event_exclude config to hide a different/additional raw state', async () => {
    const cfg = baseConfig({ event_exclude: ['some_noisy_state'] });
    const card = makeCard();
    card.setConfig(cfg);
    const today9am = new Date();
    today9am.setHours(9, 0, 0, 0);
    const lastEventHistory = [
      { s: 'some_noisy_state', lu: Math.floor(today9am.getTime() / 1000) },
      { s: 'maintenance_mode', lu: Math.floor(today9am.getTime() / 1000) + 60 },
    ];
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_last_event': lastEventHistory });
    card.hass = hass;
    await flush();

    const rows = card.shadowRoot.querySelectorAll('.record-row');
    expect(rows.length).toBe(1);
    expect(rows[0].querySelector('.record-text').textContent).toBe('maintenance_mode');
  });

  it('event_exclude matches case-insensitively against the exact raw state, never a substring/pattern', async () => {
    // Confirms the exclude list can never accidentally hide a real
    // "Unknown used the litter box" visit narration just because it
    // contains the word "unknown" -- only an EXACT match to the bare
    // special-state is excluded.
    const cfg = baseConfig();
    const card = makeCard();
    card.setConfig(cfg);
    const today9am = new Date();
    today9am.setHours(9, 0, 0, 0);
    const lastEventHistory = [
      { s: 'UNAVAILABLE', lu: Math.floor(today9am.getTime() / 1000) }, // different case, still excluded
      { s: 'Unknown used the litter box', lu: Math.floor(today9am.getTime() / 1000) + 60 }, // NOT excluded
    ];
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_last_event': lastEventHistory });
    card.hass = hass;
    await flush();

    const rows = card.shadowRoot.querySelectorAll('.record-row');
    expect(rows.length).toBe(1);
    expect(rows[0].querySelector('.record-text').textContent).toBe('Unknown used the litter box');
  });
});

describe('PetkitPuramaxCard: Working Records is last_event verbatim, with no synthesis or pattern-matching (refs #13, #14, #16)', () => {
  // Working Records used to merge total_use-derived visits AND last_event's
  // own narration, dedupe-reconciling the two -- fragile, and it kept
  // producing new bugs (issues #13, #14). It was then changed to a single
  // source (total_use/last_used_by) with a COMPUTED "<cat> just spent Ns"
  // sentence, replacing last_event's own real text -- but that's still not
  // what PETKIT actually reported. Working Records now shows last_event's
  // raw history completely verbatim: no computed re-phrasing, no pattern
  // used to detect "is this a visit." Duration is intentionally not shown
  // here (it's in the chart tooltip/Usage line instead, which still use the
  // total_use/last_used_by reconstruction independently). The one narrow
  // exception: `total_use`'s own visit timestamps (already fetched for the
  // chart) are consulted as a binary "did a real visit independently happen
  // here" check, purely to tell a flicker-repeat of the same text apart from
  // two genuinely separate real visits sharing that text -- see
  // `dedupeFlickerRepeats` and the two tests below. This never replaces a
  // row's own text/content, unlike the reconciliation that caused #13/#14.

  it('shows a visit narration completely verbatim, with no duration and no re-phrasing', async () => {
    const cfg = baseConfig();
    const card = makeCard();
    card.setConfig(cfg);
    const today9am = new Date();
    today9am.setHours(9, 0, 0, 0);
    const lastEventHistory = [{ s: 'Cat A used the litter box', lu: Math.floor(today9am.getTime() / 1000) }];
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockImplementation((req) => {
      if (req.entity_ids.includes('sensor.test_petkit_last_event')) {
        return Promise.resolve({ 'sensor.test_petkit_last_event': lastEventHistory });
      }
      return Promise.resolve({});
    });
    card.hass = hass;
    await flush();

    const rows = card.shadowRoot.querySelectorAll('.record-row');
    expect(rows.length).toBe(1);
    expect(rows[0].querySelector('.record-text').textContent).toBe('Cat A used the litter box');
  });

  it('shows an "Unknown used the litter box" narration verbatim too (device failed to identify the cat)', async () => {
    const cfg = baseConfig();
    const card = makeCard();
    card.setConfig(cfg);
    const today9am = new Date();
    today9am.setHours(9, 0, 0, 0);
    const lastEventHistory = [{ s: 'Unknown used the litter box', lu: Math.floor(today9am.getTime() / 1000) }];
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockImplementation((req) => {
      if (req.entity_ids.includes('sensor.test_petkit_last_event')) {
        return Promise.resolve({ 'sensor.test_petkit_last_event': lastEventHistory });
      }
      return Promise.resolve({});
    });
    card.hass = hass;
    await flush();

    const rows = card.shadowRoot.querySelectorAll('.record-row');
    expect(rows.length).toBe(1);
    expect(rows[0].querySelector('.record-text').textContent).toBe('Unknown used the litter box');
  });

  it('does not require or read total_use at all -- Working Records is independent of the chart/analytics reconstruction', async () => {
    const cfg = baseConfig();
    const card = makeCard();
    card.setConfig(cfg);
    const today9am = new Date();
    today9am.setHours(9, 0, 0, 0);
    const visitTs = Math.floor(today9am.getTime() / 1000);
    // total_use has NO matching delta at all near this narration -- under
    // the old "cross-reference total_use" design this row would have been
    // dropped; verbatim last_event has no such dependency.
    const totalUsePoints = [{ s: '0', lu: visitTs - 3600 }];
    const lastEventHistory = [{ s: 'Cat A used the litter box', lu: visitTs }];
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockImplementation((req) => {
      if (req.entity_ids.includes('sensor.test_petkit_total_use')) {
        return Promise.resolve({ 'sensor.test_petkit_total_use': totalUsePoints });
      }
      if (req.entity_ids.includes('sensor.test_petkit_last_event')) {
        return Promise.resolve({ 'sensor.test_petkit_last_event': lastEventHistory });
      }
      return Promise.resolve({});
    });
    card.hass = hass;
    await flush();

    const rows = card.shadowRoot.querySelectorAll('.record-row');
    expect(rows.length).toBe(1);
    expect(rows[0].querySelector('.record-text').textContent).toBe('Cat A used the litter box');
  });

  it('a visit unattributable to any configured cat (last_used_by "unknown_pet") still plots as a gray chart stem, not just a record', async () => {
    const cfg = baseConfig({
      device_entities: { ...baseConfig().device_entities, last_used_by: 'sensor.test_petkit_last_used_by' },
      cats: [
        { name: 'Cat A', color: '#111111' },
        { name: 'Cat B', color: '#222222' },
      ],
    });
    const card = makeCard();
    card.setConfig(cfg);
    const today9am = new Date();
    today9am.setHours(9, 0, 0, 0);
    const visitTs = Math.floor(today9am.getTime() / 1000);
    const totalUsePoints = [
      { s: '0', lu: visitTs - 60 },
      { s: '43', lu: visitTs },
    ];
    const lastUsedByPoints = [{ s: 'unknown_pet', lu: visitTs }];
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockImplementation((req) => {
      if (req.entity_ids.includes('sensor.test_petkit_total_use')) {
        return Promise.resolve({ 'sensor.test_petkit_total_use': totalUsePoints });
      }
      if (req.entity_ids.includes('sensor.test_petkit_last_used_by')) {
        return Promise.resolve({ 'sensor.test_petkit_last_used_by': lastUsedByPoints });
      }
      return Promise.resolve({});
    });
    card.hass = hass;
    await flush();

    // Plots as a gray "Unknown" stem (not dropped) but does not count
    // toward any named cat's Usage total.
    expect(card.shadowRoot.querySelectorAll('.visit-point').length).toBe(1);
    const usageText = card.shadowRoot.getElementById('usage-body').textContent;
    expect(usageText).toContain('1 time');
    expect(usageText).toContain('Unknown: 1');
    expect(usageText).toContain('Cat A: 0');
    expect(usageText).toContain('Cat B: 0');
  });

  it('collapses a same-text repeat across an unavailable gap when total_use confirms no second visit actually happened', async () => {
    // The common case: last_event flickered to unavailable and recovered to
    // the same narration text with no matching total_use increment near the
    // second occurrence -- it's the SAME visit still being reported, not a
    // new one, so it renders as a single row.
    const cfg = baseConfig();
    const card = makeCard();
    card.setConfig(cfg);
    const today9am = new Date();
    today9am.setHours(9, 0, 0, 0);
    const t0 = Math.floor(today9am.getTime() / 1000);
    const lastEventHistory = [
      { s: 'Cat A used the litter box', lu: t0 },
      { s: 'unavailable', lu: t0 + 60 },
      { s: 'Cat A used the litter box', lu: t0 + 120 },
    ];
    const totalUsePoints = [
      { s: '0', lu: t0 - 60 },
      { s: '43', lu: t0 }, // one real visit, matching only the FIRST occurrence
    ];
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockImplementation((req) => {
      if (req.entity_ids.includes('sensor.test_petkit_total_use')) {
        return Promise.resolve({ 'sensor.test_petkit_total_use': totalUsePoints });
      }
      if (req.entity_ids.includes('sensor.test_petkit_last_event')) {
        return Promise.resolve({ 'sensor.test_petkit_last_event': lastEventHistory });
      }
      return Promise.resolve({});
    });
    card.hass = hass;
    await flush();

    const rows = card.shadowRoot.querySelectorAll('.record-row');
    const texts = Array.from(rows).map((r) => r.querySelector('.record-text').textContent);
    expect(texts.filter((t) => t === 'Cat A used the litter box').length).toBe(1);
  });

  it('shows two rows for the same repeated text across an unavailable gap when total_use independently confirms two real visits', async () => {
    // REGRESSION: a real captured case (2026-07-16) had two genuinely
    // separate "Cat A used the litter box" visits with an unavailable blip
    // in between and identical text on both sides -- a text-equality-based
    // flicker-dedupe alone would wrongly collapse this into one row,
    // silently dropping a real visit. Working Records disambiguates using
    // `total_use`'s own independent visit reconstruction (already fetched
    // for the chart) purely as a binary "did a real visit happen here"
    // check -- since total_use shows a real increment matching BOTH
    // occurrences here, both rows are kept.
    const cfg = baseConfig();
    const card = makeCard();
    card.setConfig(cfg);
    const today9am = new Date();
    today9am.setHours(9, 0, 0, 0);
    const t0 = Math.floor(today9am.getTime() / 1000);
    const lastEventHistory = [
      { s: 'Cat A used the litter box', lu: t0 },
      { s: 'unavailable', lu: t0 + 60 },
      { s: 'Cat A used the litter box', lu: t0 + 120 }, // a real, separate second visit
    ];
    const totalUsePoints = [
      { s: '0', lu: t0 - 60 },
      { s: '48', lu: t0 }, // real visit #1
      { s: '153', lu: t0 + 120 }, // real visit #2
    ];
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockImplementation((req) => {
      if (req.entity_ids.includes('sensor.test_petkit_total_use')) {
        return Promise.resolve({ 'sensor.test_petkit_total_use': totalUsePoints });
      }
      if (req.entity_ids.includes('sensor.test_petkit_last_event')) {
        return Promise.resolve({ 'sensor.test_petkit_last_event': lastEventHistory });
      }
      return Promise.resolve({});
    });
    card.hass = hass;
    await flush();

    const rows = card.shadowRoot.querySelectorAll('.record-row');
    const texts = Array.from(rows).map((r) => r.querySelector('.record-text').textContent);
    expect(texts.filter((t) => t === 'Cat A used the litter box').length).toBe(2);
  });

  it('shows a real visit total_use confirms even when last_event never got its own history point for it at all', async () => {
    // REGRESSION (reported live 2026-07-24): total_use confirmed two real
    // visits by the same cat about a minute apart. last_event only had ONE
    // history point for them -- its value was already the exact same text
    // from the first visit, so the second, identical-text visit never
    // changed it and HA's recorder never wrote a second point. No
    // unavailable flicker involved at all; there's nothing to merge/not
    // merge here, the data for the second visit simply doesn't exist in
    // last_event's own stream. Working Records must borrow the count from
    // total_use's independent reconstruction (which already handles this
    // correctly for the chart) to show both.
    const cfg = baseConfig();
    const card = makeCard();
    card.setConfig(cfg);
    const today9am = new Date();
    today9am.setHours(9, 0, 0, 0);
    const t0 = Math.floor(today9am.getTime() / 1000);
    const lastEventHistory = [{ s: 'Cat A used the litter box', lu: t0 }]; // ONE raw point for two real visits
    const totalUsePoints = [
      { s: '0', lu: t0 - 60 },
      { s: '43', lu: t0 }, // real visit #1 -- matches the last_event point
      { s: '46', lu: t0 + 62 }, // real visit #2 -- no matching last_event point at all
    ];
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockImplementation((req) => {
      if (req.entity_ids.includes('sensor.test_petkit_total_use')) {
        return Promise.resolve({ 'sensor.test_petkit_total_use': totalUsePoints });
      }
      if (req.entity_ids.includes('sensor.test_petkit_last_event')) {
        return Promise.resolve({ 'sensor.test_petkit_last_event': lastEventHistory });
      }
      return Promise.resolve({});
    });
    card.hass = hass;
    await flush();

    const rows = card.shadowRoot.querySelectorAll('.record-row');
    const texts = Array.from(rows).map((r) => r.querySelector('.record-text').textContent);
    expect(texts.filter((t) => t === 'Cat A used the litter box').length).toBe(2);
  });

  it('does not fabricate an extra row for a device-status event that total_use knows nothing about', async () => {
    // total_use only tracks litter-box visits -- a repeated device-status
    // event (e.g. maintenance_mode) must never gain a synthesized row just
    // because some unrelated real visit happens to land in its territory.
    const cfg = baseConfig();
    const card = makeCard();
    card.setConfig(cfg);
    const today9am = new Date();
    today9am.setHours(9, 0, 0, 0);
    const t0 = Math.floor(today9am.getTime() / 1000);
    const lastEventHistory = [{ s: 'maintenance_mode', lu: t0 }];
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockImplementation((req) => {
      if (req.entity_ids.includes('sensor.test_petkit_last_event')) {
        return Promise.resolve({ 'sensor.test_petkit_last_event': lastEventHistory });
      }
      return Promise.resolve({});
    });
    card.hass = hass;
    await flush();

    const rows = card.shadowRoot.querySelectorAll('.record-row');
    expect(rows.length).toBe(1);
  });

  it('renders last_event history through hass.formatEntityState (HA\'s own translation), not a hand-rolled label map', async () => {
    // REGRESSION: a hand-maintained event->label map (`DEFAULT_EVENT_LABELS`)
    // used to relabel a *known subset* of raw firmware codes and show every
    // other one (e.g. `manual_odor_failed_batt`) completely raw. Home
    // Assistant already translates every PETKIT `last_event` enum value via
    // the integration's own `strings.json` -- Working Records now defers to
    // that (`hass.formatEntityState(stateObj, value)`, the same documented
    // custom-card API used for the info-row chips) instead of duplicating
    // and inevitably falling behind that vocabulary.
    const cfg = baseConfig();
    const card = makeCard();
    card.setConfig(cfg);
    const today9am = new Date();
    today9am.setHours(9, 0, 0, 0);
    const t0 = Math.floor(today9am.getTime() / 1000);
    const lastEventHistory = [
      { s: 'manual_odor_failed_batt', lu: t0 },
      { s: 'Cat A used the litter box', lu: t0 + 60 },
    ];
    const lastEventStateObj = { state: 'Cat A used the litter box', attributes: {} };
    const hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.test_petkit_last_event': lastEventStateObj,
    });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_last_event': lastEventHistory });
    hass.formatEntityState = vi.fn((stateObj, value) =>
      value === 'manual_odor_failed_batt'
        ? 'Manual odor removal failed. Please make sure the Odor Removal Device has sufficient battery.'
        : value,
    );
    card.hass = hass;
    await flush();

    const rows = card.shadowRoot.querySelectorAll('.record-row');
    const texts = Array.from(rows).map((r) => r.querySelector('.record-text').textContent);
    expect(texts).toContain('Manual odor removal failed. Please make sure the Odor Removal Device has sufficient battery.');
    expect(texts).toContain('Cat A used the litter box');
    expect(hass.formatEntityState).toHaveBeenCalledWith(lastEventStateObj, 'manual_odor_failed_batt');
  });

  it('shows the raw last_event value verbatim when hass has no formatEntityState (plain mock hass)', async () => {
    const cfg = baseConfig();
    const card = makeCard();
    card.setConfig(cfg);
    const today9am = new Date();
    today9am.setHours(9, 0, 0, 0);
    const t0 = Math.floor(today9am.getTime() / 1000);
    const lastEventHistory = [{ s: 'auto_cleaning_completed', lu: t0 }];
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_last_event': lastEventHistory });
    card.hass = hass;
    await flush();

    const rows = card.shadowRoot.querySelectorAll('.record-row');
    const texts = Array.from(rows).map((r) => r.querySelector('.record-text').textContent);
    expect(texts).toContain('auto_cleaning_completed');
  });
});

describe('PetkitPuramaxCard: no-visit alert', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function pointsWithLastVisit(hoursAgo, now) {
    const lastVisitMs = now.getTime() - hoursAgo * 3600000;
    // A day-old baseline reading plus the actual last-visit delta, both
    // safely inside the 7-day analytics window.
    const baselineMs = lastVisitMs - 3600000;
    return [
      { s: '0', lu: Math.floor(baselineMs / 1000) },
      { s: '50', lu: Math.floor(lastVisitMs / 1000) },
    ];
  }

  it('shows a no-visit banner and notifies once when a cat is overdue past the default 8h threshold', async () => {
    const now = new Date(2026, 6, 15, 20, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const card = makeCard();
    card.setConfig(baseConfig({ notify_service: 'notify.mobile_app_test' }));
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_total_use': pointsWithLastVisit(9, now) });
    card.hass = hass;
    await flush();

    const banner = card.shadowRoot.querySelector('.no-visit-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('Cat A');
    expect(hass.callService).toHaveBeenCalledTimes(1);
    expect(hass.callService).toHaveBeenCalledWith(
      'notify',
      'mobile_app_test',
      expect.objectContaining({ message: expect.stringContaining('Cat A') }),
    );
  });

  it('shows no banner and does not notify when the cat visited within the threshold', async () => {
    const now = new Date(2026, 6, 15, 20, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const card = makeCard();
    card.setConfig(baseConfig({ notify_service: 'notify.mobile_app_test' }));
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_total_use': pointsWithLastVisit(2, now) });
    card.hass = hass;
    await flush();

    expect(card.shadowRoot.querySelector('.no-visit-banner')).toBeNull();
    expect(hass.callService).not.toHaveBeenCalled();
  });

  it('honors a configured no_visit_alert_hours threshold', async () => {
    const now = new Date(2026, 6, 15, 20, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const card = makeCard();
    card.setConfig(baseConfig({ no_visit_alert_hours: 1 }));
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_total_use': pointsWithLastVisit(2, now) });
    card.hass = hass;
    await flush();

    expect(card.shadowRoot.querySelector('.no-visit-banner')).not.toBeNull();
  });

  it('shows the banner without ever calling a notify service when none is configured', async () => {
    const now = new Date(2026, 6, 15, 20, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const card = makeCard();
    card.setConfig(baseConfig());
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_total_use': pointsWithLastVisit(9, now) });
    card.hass = hass;
    await flush();

    expect(card.shadowRoot.querySelector('.no-visit-banner')).not.toBeNull();
    expect(hass.callService).not.toHaveBeenCalled();
  });

  it('does not re-notify on every periodic recheck while still overdue', async () => {
    const now = new Date(2026, 6, 15, 20, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const card = makeCard();
    card.setConfig(baseConfig({ notify_service: 'notify.mobile_app_test' }));
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_total_use': pointsWithLastVisit(9, now) });
    card.hass = hass;
    await flush();
    expect(hass.callService).toHaveBeenCalledTimes(1);

    // Advance past two 5-minute periodic rechecks with no new visit.
    await vi.advanceTimersByTimeAsync(11 * 60 * 1000);
    expect(hass.callService).toHaveBeenCalledTimes(1);
  });

  it('alerts with "no visits recorded" and notifies when there is no visit at all in the fetched window', async () => {
    const now = new Date(2026, 6, 15, 20, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const card = makeCard();
    card.setConfig(baseConfig({ notify_service: 'notify.mobile_app_test' }));
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({});
    card.hass = hass;
    await flush();

    const banner = card.shadowRoot.querySelector('.no-visit-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('no visits recorded yet');
    expect(hass.callService).toHaveBeenCalledTimes(1);
  });
});

describe('PetkitPuramaxCard: decline/spike (usage anomaly) alert', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // A week of steady ~60s/day usage (6 past days, one visit each), so the
  // 7-day average is well-established (daysOfHistory >= 3, avg7dTotal set)
  // by the time "today" is evaluated.
  function weekOfSteadyVisits(now, { todayDeltaSeconds = 0 } = {}) {
    const points = [];
    const { start } = dayBounds(-7, now);
    points.push({ s: '0', lu: Math.floor(start.getTime() / 1000) });
    let cumulative = 0;
    for (let offset = -6; offset <= -1; offset++) {
      const { start: dayStart } = dayBounds(offset, now);
      cumulative += 60;
      points.push({ s: String(cumulative), lu: Math.floor((dayStart.getTime() + 9 * 3600 * 1000) / 1000) });
    }
    if (todayDeltaSeconds > 0) {
      const { start: todayStart } = dayBounds(0, now);
      cumulative += todayDeltaSeconds;
      points.push({ s: String(cumulative), lu: Math.floor((todayStart.getTime() + 9 * 3600 * 1000) / 1000) });
    }
    return points;
  }

  it('warns when today\'s usage is well below the 7-day average, after 18:00', async () => {
    const now = new Date(2026, 6, 21, 20, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const card = makeCard();
    card.setConfig(baseConfig());
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_total_use': weekOfSteadyVisits(now) });
    card.hass = hass;
    await flush();

    const banner = card.shadowRoot.querySelector('#decline-banner .warn-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('Cat A');
    expect(banner.textContent).toContain('below');
  });

  it('warns when today\'s usage is well above the 7-day average, after 18:00', async () => {
    const now = new Date(2026, 6, 21, 20, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const card = makeCard();
    card.setConfig(baseConfig());
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_total_use': weekOfSteadyVisits(now, { todayDeltaSeconds: 600 }) });
    card.hass = hass;
    await flush();

    const banner = card.shadowRoot.querySelector('#decline-banner .warn-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('Cat A');
    expect(banner.textContent).toContain('above');
  });

  it('shows no banner when today is within the normal band', async () => {
    const now = new Date(2026, 6, 21, 20, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const card = makeCard();
    card.setConfig(baseConfig());
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_total_use': weekOfSteadyVisits(now, { todayDeltaSeconds: 60 }) });
    card.hass = hass;
    await flush();

    expect(card.shadowRoot.querySelector('#decline-banner .warn-banner')).toBeNull();
  });

  it('stays gated off before 18:00 local time even with a real decline', async () => {
    const now = new Date(2026, 6, 21, 10, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const card = makeCard();
    card.setConfig(baseConfig());
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_total_use': weekOfSteadyVisits(now) });
    card.hass = hass;
    await flush();

    expect(card.shadowRoot.querySelector('#decline-banner .warn-banner')).toBeNull();
  });

  it('honors a configured decline_threshold_pct', async () => {
    const now = new Date(2026, 6, 21, 20, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    // 30s today vs a 60s/day average is 50% -- within the default 60%
    // threshold's low band (would warn), but NOT below a much stricter 20%
    // threshold (30/60 = 50% > 20%).
    const card = makeCard();
    card.setConfig(baseConfig({ decline_threshold_pct: 20 }));
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_total_use': weekOfSteadyVisits(now, { todayDeltaSeconds: 30 }) });
    card.hass = hass;
    await flush();

    expect(card.shadowRoot.querySelector('#decline-banner .warn-banner')).toBeNull();
  });
});

describe('PetkitPuramaxCard: chart axis labels (HTML overlay, not SVG text)', () => {
  let card;

  beforeEach(() => {
    card = makeCard();
  });

  it('renders x-axis tick labels as HTML elements in zero-padded HH:00 format, skipping 00:00/24:00', async () => {
    card.setConfig(baseConfig());
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    const labels = Array.from(card.shadowRoot.querySelectorAll('.axis-label')).map((el) => el.textContent);
    expect(labels).toEqual(['04:00', '08:00', '12:00', '16:00', '20:00']);
  });

  it('renders y-axis tick labels as HTML elements in PETKIT MM\'SS" format, including the 00\'00" origin tick', async () => {
    card.setConfig(baseConfig());
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    const labels = Array.from(card.shadowRoot.querySelectorAll('.axis-label-y')).map((el) => el.textContent);
    expect(labels[0]).toBe('00\'00"');
    expect(labels.every((l) => /^\d{2}'\d{2}"$/.test(l))).toBe(true);
  });

  it('keeps axis label text out of the SVG entirely (moved to the HTML overlay per issue #5)', async () => {
    card.setConfig(baseConfig());
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    const svg = card.shadowRoot.querySelector('.chart-svg');
    expect(svg.querySelectorAll('text').length).toBe(0);
  });

  it('positions x-axis labels via left percentage and y-axis labels via top percentage (viewBox-derived)', async () => {
    card.setConfig(baseConfig());
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    const xLabel = card.shadowRoot.querySelector('.axis-label');
    expect(xLabel.style.left).toMatch(/%$/);
    const yLabel = card.shadowRoot.querySelector('.axis-label-y');
    expect(yLabel.style.top).toMatch(/%$/);
  });

  it('sizes the y-axis label column from CHART_PADDING.left (not a fixed px), so it never overlaps a stem at hour 0 (refs midnight-overlap bug)', async () => {
    card.setConfig(baseConfig());
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    const yLabel = card.shadowRoot.querySelector('.axis-label-y');
    expect(yLabel.style.width).toBe(`${(CHART_PADDING.left / CHART_WIDTH) * 100}%`);
  });

  it('renders gridlines as solid hairlines (no stroke-dasharray)', async () => {
    card.setConfig(baseConfig());
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    const hLine = card.shadowRoot.querySelector('.grid-line-h');
    expect(hLine.getAttribute('stroke-dasharray')).toBeNull();
  });
});

describe('PetkitPuramaxCard: multi-cat visit reconstruction (total_use + last_used_by)', () => {
  it('attributes chart stems to the correct cat via carry-forward, including a same-cat repeat visit with no last_used_by change', async () => {
    const { start } = dayBounds(0);
    const t = (mins) => Math.floor((start.getTime() + mins * 60000) / 1000);

    const cfg = baseConfig({
      device_entities: {
        ...baseConfig().device_entities,
        last_used_by: 'sensor.test_petkit_last_used_by',
      },
      cats: [
        { name: 'Cat A', color: '#111111' },
        { name: 'Cat B', color: '#222222' },
      ],
    });
    const card = makeCard();
    card.setConfig(cfg);

    const totalUsePoints = [
      { s: '0', lu: t(0) },
      { s: '50', lu: t(10) }, // Cat A (exact last_used_by match)
      { s: '80', lu: t(20) }, // Cat A again -- no last_used_by change to match
      { s: '100', lu: t(30) }, // Cat B (exact last_used_by match)
    ];
    const lastUsedByPoints = [
      { s: 'Cat A', lu: t(10) },
      { s: 'Cat B', lu: t(30) },
    ];

    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockImplementation((req) => {
      if (req.entity_ids.includes('sensor.test_petkit_total_use')) {
        return Promise.resolve({ 'sensor.test_petkit_total_use': totalUsePoints });
      }
      if (req.entity_ids.includes('sensor.test_petkit_last_used_by')) {
        return Promise.resolve({ 'sensor.test_petkit_last_used_by': lastUsedByPoints });
      }
      return Promise.resolve({});
    });
    card.hass = hass;
    await flush();

    const usageBody = card.shadowRoot.getElementById('usage-body');
    expect(usageBody.textContent).toContain('3 times');
    expect(usageBody.textContent).toContain('Cat A: 2');
    expect(usageBody.textContent).toContain('Cat B: 1');

    const stems = card.shadowRoot.querySelectorAll('.visit-point');
    expect(stems.length).toBe(3);
  });

  it('with a single cat, every visit is attributed without ever fetching last_used_by', async () => {
    const card = makeCard();
    card.setConfig(baseConfig());

    const totalUsePoints = [
      { s: '0', lu: Math.floor(dayBounds(0).start.getTime() / 1000) },
      { s: '50', lu: Math.floor(dayBounds(0).start.getTime() / 1000) + 600 },
    ];
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockImplementation((req) => {
      expect(req.entity_ids).not.toContain('sensor.test_petkit_last_used_by');
      if (req.entity_ids.includes('sensor.test_petkit_total_use')) {
        return Promise.resolve({ 'sensor.test_petkit_total_use': totalUsePoints });
      }
      return Promise.resolve({});
    });
    card.hass = hass;
    await flush();

    const usageBody = card.shadowRoot.getElementById('usage-body');
    expect(usageBody.textContent).toContain('1 time');
  });
});

describe('PetkitPuramaxCard: no flicker while a day-switch fetch is in flight', () => {
  it('keeps the previous day\'s chart on screen instead of clearing to a loading placeholder', async () => {
    const cfg = baseConfig();
    const card = makeCard();
    card.setConfig(cfg);

    // A controllable, never-auto-resolving callWS so we can inspect the DOM
    // mid-fetch, i.e. exactly the window that used to flash "Loading…".
    let resolveFirst;
    const firstFetch = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const hass = {
      states: { 'sensor.test_petkit_error': { state: 'no_error' } },
      // Default resolves instantly so the concurrent _loadAnalytics() fetch
      // (triggered by the same `hass` setter) doesn't hang -- only the
      // specific call under test (_loadDay's, queued below) is held open.
      callWS: vi.fn().mockResolvedValue({}).mockReturnValueOnce(firstFetch),
      callService: vi.fn(),
    };
    card.hass = hass;

    // Still mid-flight: no "Loading…" text should ever have been rendered,
    // and no element carries the (now-removed) .loading class.
    expect(card.shadowRoot.querySelector('.loading')).toBeNull();
    expect(card.shadowRoot.textContent).not.toContain('Loading');

    resolveFirst({});
    await flush();

    // Now trigger a day change with a fetch that again never resolves during
    // this assertion window -- the chart area/usage/records must still show
    // *something other than a loading placeholder* the instant the click
    // fires, not a cleared/blank flash.
    let resolveSecond;
    hass.callWS.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSecond = resolve;
      }),
    );
    card.shadowRoot.getElementById('prev-day').dispatchEvent(new Event('click', { bubbles: true }));

    expect(card.shadowRoot.querySelector('.loading')).toBeNull();
    expect(card.shadowRoot.textContent).not.toContain('Loading');
    // The chart area keeps its prior real content (an empty-note, since
    // there were no visits) rather than being blanked out mid-fetch.
    expect(card.shadowRoot.getElementById('chart-area').innerHTML.trim()).not.toBe('');

    resolveSecond({});
    await flush();
    expect(card.shadowRoot.querySelector('.loading')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Regression: this project must stay 100% generic — no card or lib module
// should ever hardcode a concrete entity id (or any of the original
// production instance's specific values). Only `examples/` and test
// fixtures are allowed to reference example-shaped ids. This used to need a
// carve-out for PetkitPuramaxCard.getStubConfig() (which returned
// placeholder entity ids so the card picker didn't throw) -- it no longer
// hardcodes anything at all (device_id is auto-detected from `hass`, or left
// empty), so the scan below covers every file with no exceptions.
// ---------------------------------------------------------------------------
describe('regression: no hardcoded entity ids in logic/rendering source', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const srcDir = path.resolve(here, '../../src');
  const ENTITY_ID_PATTERN_SOURCE =
    '\\b(input_number|input_boolean|input_text|sensor|binary_sensor|switch|button|light|climate|cover|fan|media_player|vacuum|remote|select|number|counter|automation|script|scene|weather|person|device_tracker)\\.[a-z0-9_]+\\b';
  const ENTITY_ID_PATTERN = new RegExp(ENTITY_ID_PATTERN_SOURCE);

  // The pattern above can't distinguish "domain.object_id" (a real, per-
  // instance entity id -- what this check is actually for) from
  // "domain.service_name" (a generic HA service-call identifier, the same
  // for every installation, e.g. inside a `perform_action` value) -- both
  // happen to share the same dotted-lowercase shape. `button.press` is the
  // one known collision in this codebase (src/lib/device-entities.js's
  // default controls_row, calling the button domain's generic press
  // service) -- explicitly allowed here rather than weakening the pattern
  // itself, which would blind this check to a real hardcoded button.* id.
  // Uses its own fresh global-flag RegExp instance (not `ENTITY_ID_PATTERN`
  // itself, which the separate sanity-check test below matches against) so
  // there's no shared `lastIndex` state to worry about between the two.
  const ALLOWED_NON_ENTITY_MATCHES = new Set(['button.press']);

  function findHardcodedEntityId(text) {
    const matches = text.match(new RegExp(ENTITY_ID_PATTERN_SOURCE, 'g')) || [];
    return matches.find((m) => !ALLOWED_NON_ENTITY_MATCHES.has(m)) || null;
  }

  function listJsFiles(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...listJsFiles(full));
      else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
    }
    return out;
  }

  it('src/lib/** never hardcodes a concrete entity id (it is meant to be fully device-agnostic)', () => {
    const libDir = path.join(srcDir, 'lib');
    for (const file of listJsFiles(libDir)) {
      const text = fs.readFileSync(file, 'utf8');
      const match = findHardcodedEntityId(text);
      expect(match, `${path.relative(srcDir, file)} contains a hardcoded entity id: ${match}`).toBeNull();
    }
  });

  it('src/cards/**/*.js (excluding styles) never hardcodes a concrete entity id', () => {
    const cardsDir = path.join(srcDir, 'cards');
    for (const file of listJsFiles(cardsDir)) {
      if (file.endsWith('.styles.js')) continue;
      const text = fs.readFileSync(file, 'utf8');
      const match = findHardcodedEntityId(text);
      expect(match, `${path.relative(srcDir, file)} contains a hardcoded entity id: ${match}`).toBeNull();
    }
  });

  it('sanity check: the entity-id pattern actually matches a known placeholder (proves the regex isn\'t vacuous)', () => {
    expect('input_number.example_cat_last_visit_duration').toMatch(ENTITY_ID_PATTERN);
  });
});

// ---------------------------------------------------------------------------
describe('PetkitPuramaxCard: chart tooltip (hover a .visit-hit line)', () => {
  // `_showChartTooltip`/`_hideChartTooltip` mutate `#chart-tooltip` directly
  // (textContent/style/classList) rather than going through Lit's reactive
  // render -- a transient hover effect, imperative on purpose (see the
  // doc comment on `_showChartTooltip` in petkit-puramax-card.js). None of
  // the render-assertion-style tests elsewhere in this file happen to
  // exercise `mouseenter`/`mouseleave` on `.visit-hit`, so this is dedicated
  // coverage for that path.
  async function makeCardWithOneVisit() {
    const card = makeCard();
    card.setConfig(baseConfig());
    const visitTs = dayBounds(0).start.getTime() + 600 * 1000; // 10 min after local midnight
    const totalUsePoints = [
      { s: '0', lu: Math.floor(dayBounds(0).start.getTime() / 1000) },
      { s: '50', lu: Math.floor(visitTs / 1000) }, // one visit, duration 50s
    ];
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockImplementation((req) => {
      if (req.entity_ids.includes('sensor.test_petkit_total_use')) {
        return Promise.resolve({ 'sensor.test_petkit_total_use': totalUsePoints });
      }
      return Promise.resolve({});
    });
    card.hass = hass;
    await flush();
    return { card, visitTs };
  }

  it('mouseenter on the .visit-hit line fills in the tooltip text and marks it visible', async () => {
    const { card, visitTs } = await makeCardWithOneVisit();
    const hit = card.shadowRoot.querySelector('.visit-hit');
    expect(hit).not.toBeNull();
    const tooltip = card.shadowRoot.getElementById('chart-tooltip');
    expect(tooltip.classList.contains('visible')).toBe(false);

    hit.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    const expectedTime = new Date(visitTs).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    expect(tooltip.textContent).toBe(`${expectedTime} · Cat A · ${formatDuration(50)}`);
    expect(tooltip.classList.contains('visible')).toBe(true);
  });

  it('positions the tooltip via style.left/style.top computed from the hit target (parseable px, not just unset)', async () => {
    const { card } = await makeCardWithOneVisit();
    const hit = card.shadowRoot.querySelector('.visit-hit');

    hit.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    const tooltip = card.shadowRoot.getElementById('chart-tooltip');
    // happy-dom has no real layout engine, so exact pixel positions aren't
    // meaningful here -- just assert both are set to a parseable `px` value
    // (i.e. the imperative getBoundingClientRect()-based positioning code
    // actually ran), not exact geometry.
    expect(tooltip.style.left).toMatch(/^-?\d+(\.\d+)?px$/);
    expect(tooltip.style.top).toMatch(/^-?\d+(\.\d+)?px$/);
  });

  it('mouseleave hides the tooltip again', async () => {
    const { card } = await makeCardWithOneVisit();
    const hit = card.shadowRoot.querySelector('.visit-hit');
    const tooltip = card.shadowRoot.getElementById('chart-tooltip');

    hit.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    expect(tooltip.classList.contains('visible')).toBe(true);

    hit.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(tooltip.classList.contains('visible')).toBe(false);
  });
});
