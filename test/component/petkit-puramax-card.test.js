import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PetkitPuramaxCard } from '../../src/cards/puramax/petkit-puramax-card.js';

if (!customElements.get('petkit-puramax-card')) {
  customElements.define('petkit-puramax-card', PetkitPuramaxCard);
}

function baseConfig(overrides = {}) {
  return {
    type: 'custom:petkit-puramax-card',
    device_entities: {
      error: 'sensor.test_petkit_error',
      last_event: 'sensor.test_petkit_last_event',
      state: 'sensor.test_petkit_state',
    },
    cats: [{ name: 'Cat A', color: '#111111', last_visit_duration_entity: 'input_number.test_cat_a_duration' }],
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

  it('throws a specific error naming the missing cat field: name', () => {
    const card = makeCard();
    const cfg = baseConfig({ cats: [{ color: '#fff', last_visit_duration_entity: 'input_number.x' }] });
    expect(() => card.setConfig(cfg)).toThrow('cats[0].name is required');
  });

  it('throws a specific error naming the missing cat field: color', () => {
    const card = makeCard();
    const cfg = baseConfig({ cats: [{ name: 'A', last_visit_duration_entity: 'input_number.x' }] });
    expect(() => card.setConfig(cfg)).toThrow('cats[0].color is required');
  });

  it('throws a specific error naming the missing cat field: last_visit_duration_entity', () => {
    const card = makeCard();
    const cfg = baseConfig({ cats: [{ name: 'A', color: '#fff' }] });
    expect(() => card.setConfig(cfg)).toThrow('cats[0].last_visit_duration_entity is required');
  });

  it('identifies the correct index for a later invalid cat', () => {
    const card = makeCard();
    const cfg = baseConfig({
      cats: [
        { name: 'A', color: '#fff', last_visit_duration_entity: 'input_number.a' },
        { name: 'B', color: '#000' },
      ],
    });
    expect(() => card.setConfig(cfg)).toThrow('cats[1].last_visit_duration_entity is required');
  });

  it('accepts a fully valid config without throwing', () => {
    const card = makeCard();
    expect(() => card.setConfig(baseConfig())).not.toThrow();
  });
});

describe('PetkitPuramaxCard: getStubConfig', () => {
  it('returns an object that itself passes setConfig without throwing', () => {
    const card = makeCard();
    const stub = PetkitPuramaxCard.getStubConfig();
    expect(() => card.setConfig(stub)).not.toThrow();
  });

  it('uses obviously-placeholder entity ids, not real device data', () => {
    const stub = PetkitPuramaxCard.getStubConfig();
    expect(stub.cats[0].last_visit_duration_entity).toContain('example');
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
        { entity: 'sensor.consumable', name: 'Consumable', unit: '%' },
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

  it('renders one button per controls_row entry', async () => {
    const cfg = baseConfig({
      controls_row: [
        { name: 'Start', icon: 'mdi:play', action: 'press', entity: 'button.start' },
        { name: 'Stop', icon: 'mdi:stop', action: 'press', entity: 'button.stop' },
        { name: 'Toggle', icon: 'mdi:toggle-switch', action: 'toggle', entity: 'switch.x' },
      ],
    });
    card.setConfig(cfg);
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    const buttons = card.shadowRoot.querySelectorAll('.ctrl-btn');
    expect(buttons.length).toBe(3);
  });

  it('calls button.press via hass.callService when a "press" control is clicked', async () => {
    const cfg = baseConfig({
      controls_row: [{ name: 'Start', icon: 'mdi:play', action: 'press', entity: 'button.start_clean' }],
    });
    card.setConfig(cfg);
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    card.hass = hass;
    await flush();
    const btn = card.shadowRoot.getElementById('ctrl-0');
    btn.dispatchEvent(new Event('click', { bubbles: true }));
    expect(hass.callService).toHaveBeenCalledWith('button', 'press', { entity_id: 'button.start_clean' });
  });

  it('calls homeassistant.toggle via hass.callService when a "toggle" control is clicked', async () => {
    const cfg = baseConfig({
      controls_row: [{ name: 'Fan', icon: 'mdi:fan', action: 'toggle', entity: 'switch.fan' }],
    });
    card.setConfig(cfg);
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    card.hass = hass;
    await flush();
    const btn = card.shadowRoot.getElementById('ctrl-0');
    btn.dispatchEvent(new Event('click', { bubbles: true }));
    expect(hass.callService).toHaveBeenCalledWith('homeassistant', 'toggle', { entity_id: 'switch.fan' });
  });

  it('dispatches hass-more-info when a "more_info" control is clicked', async () => {
    const cfg = baseConfig({
      controls_row: [{ name: 'Details', icon: 'mdi:info', action: 'more_info', entity: 'sensor.detail' }],
    });
    card.setConfig(cfg);
    card.hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    await flush();
    const listener = vi.fn();
    card.addEventListener('hass-more-info', listener);
    const btn = card.shadowRoot.getElementById('ctrl-0');
    btn.dispatchEvent(new Event('click', { bubbles: true }));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({ entityId: 'sensor.detail' });
  });

  it('toggle_maintenance presses exit_entity when device state is "maintenance"', async () => {
    const cfg = baseConfig({
      controls_row: [
        {
          name: 'Maintenance',
          icon: 'mdi:wrench',
          action: 'toggle_maintenance',
          start_entity: 'button.maint_start',
          exit_entity: 'button.maint_exit',
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
    card.shadowRoot.getElementById('ctrl-0').dispatchEvent(new Event('click', { bubbles: true }));
    expect(hass.callService).toHaveBeenCalledWith('button', 'press', { entity_id: 'button.maint_exit' });
  });

  it('toggle_maintenance presses start_entity when device state is not "maintenance"', async () => {
    const cfg = baseConfig({
      controls_row: [
        {
          name: 'Maintenance',
          icon: 'mdi:wrench',
          action: 'toggle_maintenance',
          start_entity: 'button.maint_start',
          exit_entity: 'button.maint_exit',
        },
      ],
    });
    card.setConfig(cfg);
    const hass = makeHass({
      'sensor.test_petkit_error': { state: 'no_error' },
      'sensor.test_petkit_state': { state: 'idle' },
    });
    card.hass = hass;
    await flush();
    card.shadowRoot.getElementById('ctrl-0').dispatchEvent(new Event('click', { bubbles: true }));
    expect(hass.callService).toHaveBeenCalledWith('button', 'press', { entity_id: 'button.maint_start' });
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
});

// ---------------------------------------------------------------------------
// Regression: this project must stay 100% generic — no card or lib module
// should ever hardcode a concrete entity id (or any of the original
// production instance's specific values). Only `examples/` and test
// fixtures are allowed to reference example-shaped ids, and the one
// legitimate exception inside source is PetkitPuramaxCard.getStubConfig(),
// which is *required* to return placeholder ids so the card picker doesn't
// throw — it's excluded below by stripping its method body before scanning.
// ---------------------------------------------------------------------------
describe('regression: no hardcoded entity ids in logic/rendering source', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const srcDir = path.resolve(here, '../../src');
  const ENTITY_ID_PATTERN =
    /\b(input_number|input_boolean|input_text|sensor|binary_sensor|switch|button|light|climate|cover|fan|media_player|vacuum|remote|select|number|counter|automation|script|scene|weather|person|device_tracker)\.[a-z0-9_]+\b/;

  function listJsFiles(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...listJsFiles(full));
      else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
    }
    return out;
  }

  // Strips PetkitPuramaxCard.getStubConfig()'s method body (its one
  // legitimate placeholder-id block) out of the card source before scanning.
  function stripStubConfig(source) {
    const startMarker = 'static getStubConfig()';
    const start = source.indexOf(startMarker);
    if (start === -1) return source;
    const nextMethodMarker = 'setConfig(config)';
    const end = source.indexOf(nextMethodMarker, start);
    if (end === -1) return source;
    return source.slice(0, start) + source.slice(end);
  }

  it('src/lib/** never hardcodes a concrete entity id (it is meant to be fully device-agnostic)', () => {
    const libDir = path.join(srcDir, 'lib');
    for (const file of listJsFiles(libDir)) {
      const text = fs.readFileSync(file, 'utf8');
      const match = text.match(ENTITY_ID_PATTERN);
      expect(match, `${path.relative(srcDir, file)} contains a hardcoded entity id: ${match?.[0]}`).toBeNull();
    }
  });

  it('src/cards/**/*.js (excluding styles and the documented getStubConfig placeholder) never hardcodes a concrete entity id', () => {
    const cardsDir = path.join(srcDir, 'cards');
    for (const file of listJsFiles(cardsDir)) {
      if (file.endsWith('.styles.js')) continue;
      let text = fs.readFileSync(file, 'utf8');
      if (file.endsWith('petkit-puramax-card.js')) text = stripStubConfig(text);
      const match = text.match(ENTITY_ID_PATTERN);
      expect(match, `${path.relative(srcDir, file)} contains a hardcoded entity id: ${match?.[0]}`).toBeNull();
    }
  });

  it('sanity check: the entity-id pattern actually matches a known placeholder (proves the regex isn\'t vacuous)', () => {
    expect('input_number.example_cat_last_visit_duration').toMatch(ENTITY_ID_PATTERN);
  });
});
