import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PetkitPuramaxCard } from '../../src/cards/puramax/petkit-puramax-card.js';
import { dayBounds } from '../../src/lib/day.js';
import { CHART_WIDTH, CHART_PADDING } from '../../src/cards/puramax/petkit-puramax-card.const.js';

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
});

describe('PetkitPuramaxCard: getStubConfig', () => {
  it('returns an object that itself passes setConfig without throwing', () => {
    const card = makeCard();
    const stub = PetkitPuramaxCard.getStubConfig();
    expect(() => card.setConfig(stub)).not.toThrow();
  });

  it('uses obviously-placeholder entity ids, not real device data', () => {
    const stub = PetkitPuramaxCard.getStubConfig();
    expect(stub.device_entities.total_use).toContain('example');
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
    expect(rows[0].querySelector('.record-text').textContent).toBe('Maintenance mode');
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
    expect(rows[0].querySelector('.record-text').textContent).toBe('Maintenance mode');
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
  // used to detect "is this a visit," no cross-reference to total_use at
  // all. Duration is intentionally not shown here (it's in the chart
  // tooltip/Usage line instead, which still use the total_use/last_used_by
  // reconstruction independently).

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

  it('shows two rows for the same repeated text with no dedupe of any kind, even across an unavailable gap', async () => {
    // REGRESSION: a real captured case (2026-07-16) had two genuinely
    // separate "Cat A used the litter box" visits with an unavailable blip
    // in between and identical text on both sides -- a text-equality-based
    // flicker-dedupe would have wrongly collapsed this into one row,
    // silently dropping a real visit. Working Records applies no dedupe of
    // any kind, so both real rows always show.
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
    const texts = Array.from(rows).map((r) => r.querySelector('.record-text').textContent);
    expect(texts.filter((t) => t === 'Cat A used the litter box').length).toBe(2);
  });

  it('event_labels relabels a known status state but never touches a visit narration', async () => {
    const cfg = baseConfig();
    const card = makeCard();
    card.setConfig(cfg);
    const today9am = new Date();
    today9am.setHours(9, 0, 0, 0);
    const t0 = Math.floor(today9am.getTime() / 1000);
    const lastEventHistory = [
      { s: 'auto_cleaning_completed', lu: t0 },
      { s: 'Cat A used the litter box', lu: t0 + 60 },
    ];
    const hass = makeHass({ 'sensor.test_petkit_error': { state: 'no_error' } });
    hass.callWS = vi.fn().mockResolvedValue({ 'sensor.test_petkit_last_event': lastEventHistory });
    card.hass = hass;
    await flush();

    const rows = card.shadowRoot.querySelectorAll('.record-row');
    const texts = Array.from(rows).map((r) => r.querySelector('.record-text').textContent);
    expect(texts).toContain('Auto cleaning done');
    expect(texts).toContain('Cat A used the litter box');
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
