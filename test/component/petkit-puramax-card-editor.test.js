import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PetkitPuramaxCardEditor } from '../../src/cards/puramax/petkit-puramax-card-editor.js';

if (!customElements.get('petkit-puramax-card-editor')) {
  customElements.define('petkit-puramax-card-editor', PetkitPuramaxCardEditor);
}

function baseConfig(overrides = {}) {
  return {
    type: 'custom:petkit-puramax-card',
    title: 'My Litter Box',
    device_entities: {
      total_use: 'sensor.total_use',
      last_used_by: 'sensor.last_used_by',
      error: 'sensor.error',
      last_event: 'sensor.last_event',
      state: 'sensor.state',
    },
    decline_threshold_pct: 55,
    cats: [
      { name: 'Cat A', color: '#111' },
      { name: 'Cat B', color: '#222' },
    ],
    info_row: [{ entity: 'sensor.consumable', name: 'Consumable' }],
    controls_row: [{ name: 'Start', icon: 'mdi:play', action: 'press', entity: 'button.start' }],
    ...overrides,
  };
}

function makeEditor() {
  return /** @type {PetkitPuramaxCardEditor} */ (document.createElement('petkit-puramax-card-editor'));
}

function mainForm(editor) {
  return editor.shadowRoot.querySelector('#main-section ha-form');
}

function catForms(editor) {
  return editor.shadowRoot.querySelectorAll('#cats-rows ha-form');
}

function infoRowForms(editor) {
  return editor.shadowRoot.querySelectorAll('#info-rows ha-form');
}

function controlsRowForms(editor) {
  return editor.shadowRoot.querySelectorAll('#controls-rows ha-form');
}

function fireValueChanged(form, value) {
  form.dispatchEvent(new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true }));
}

describe('PetkitPuramaxCardEditor: initial render reflects config', () => {
  let editor;

  beforeEach(() => {
    editor = makeEditor();
    editor.setConfig(baseConfig());
  });

  it('binds the main ha-form to a flattened representation of the config', () => {
    const form = mainForm(editor);
    expect(form).not.toBeNull();
    expect(form.data).toEqual({
      title: 'My Litter Box',
      device_entities_total_use: 'sensor.total_use',
      device_entities_last_used_by: 'sensor.last_used_by',
      device_entities_error: 'sensor.error',
      device_entities_last_event: 'sensor.last_event',
      device_entities_state: 'sensor.state',
      decline_threshold_pct: 55,
    });
  });

  it('renders one ha-form row per cat', () => {
    expect(catForms(editor).length).toBe(2);
    expect(catForms(editor)[0].data).toEqual(baseConfig().cats[0]);
    expect(catForms(editor)[1].data).toEqual(baseConfig().cats[1]);
  });

  it('renders one ha-form row per info_row entry', () => {
    expect(infoRowForms(editor).length).toBe(1);
    expect(infoRowForms(editor)[0].data).toEqual(baseConfig().info_row[0]);
  });

  it('renders one ha-form row per controls_row entry', () => {
    expect(controlsRowForms(editor).length).toBe(1);
    expect(controlsRowForms(editor)[0].data).toEqual(baseConfig().controls_row[0]);
  });

  it('renders no array rows for an empty/absent config', () => {
    const empty = makeEditor();
    empty.setConfig({ type: 'custom:petkit-puramax-card' });
    expect(catForms(empty).length).toBe(0);
    expect(infoRowForms(empty).length).toBe(0);
    expect(controlsRowForms(empty).length).toBe(0);
  });

  it('includes no_visit_alert_hours and notify_service in the flattened main form data', () => {
    const withAlerts = makeEditor();
    withAlerts.setConfig(baseConfig({ no_visit_alert_hours: 12, notify_service: 'notify.mobile_app_x' }));
    expect(mainForm(withAlerts).data).toMatchObject({
      no_visit_alert_hours: 12,
      notify_service: 'notify.mobile_app_x',
    });
  });
});

describe('PetkitPuramaxCardEditor: native HA chrome', () => {
  let editor;

  beforeEach(() => {
    editor = makeEditor();
    editor.setConfig(baseConfig());
  });

  it('groups each repeating-row section in a native ha-expansion-panel with a row-count header', () => {
    const panels = editor.shadowRoot.querySelectorAll('ha-expansion-panel');
    expect(panels.length).toBe(3);
    const headers = Array.from(panels).map((p) => p.getAttribute('header'));
    expect(headers).toEqual(['Cats (2)', 'Status chips (1)', 'Controls (1)']);
  });

  it('updates the panel header count after adding a cat', () => {
    editor.shadowRoot.getElementById('add-cat').dispatchEvent(new Event('click', { bubbles: true }));
    const catsPanel = editor.shadowRoot.querySelector('ha-expansion-panel');
    expect(catsPanel.getAttribute('header')).toBe('Cats (3)');
  });

  it('uses a native ha-icon-button (not a text "Remove" button) for removing a row', () => {
    const removeBtn = editor.shadowRoot.querySelector('#cats-rows .remove-btn');
    expect(removeBtn.tagName.toLowerCase()).toBe('ha-icon-button');
    expect(removeBtn.querySelector('ha-icon').getAttribute('icon')).toBe('mdi:delete-outline');
  });

  it('removing a row via its icon button still fires config-changed correctly', () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    editor.shadowRoot.querySelector('#cats-rows .remove-btn').dispatchEvent(new Event('click', { bubbles: true }));
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.cats.length).toBe(1);
  });

  it('uses the native ui_color selector for a cat\'s color field, not a plain text field', () => {
    const schema = catForms(editor)[0].schema;
    const colorField = schema.find((s) => s.name === 'color');
    expect(colorField.selector).toEqual({ ui_color: {} });
  });

  it('exposes notify_service as an entity selector scoped to the notify domain', () => {
    const alertsGroup = mainForm(editor).schema.find((s) => s.name === 'alerts');
    const notifyField = alertsGroup.schema.find((s) => s.name === 'notify_service');
    expect(notifyField.selector).toEqual({ entity: { domain: 'notify' } });
  });

  it('exposes no_visit_alert_hours as a bounded number field', () => {
    const alertsGroup = mainForm(editor).schema.find((s) => s.name === 'alerts');
    const hoursField = alertsGroup.schema.find((s) => s.name === 'no_visit_alert_hours');
    expect(hoursField.selector).toEqual({ number: { min: 1, max: 168, mode: 'box' } });
  });

  it('shows an empty-state hint instead of a blank panel body when a section has no rows', () => {
    const empty = makeEditor();
    empty.setConfig({ type: 'custom:petkit-puramax-card' });
    const hints = Array.from(empty.shadowRoot.querySelectorAll('.empty-hint')).map((el) => el.textContent);
    expect(hints.length).toBe(3);
    expect(hints[0]).toContain('No cats configured');
  });
});

describe('PetkitPuramaxCardEditor: editing fields fires config-changed', () => {
  let editor;

  beforeEach(() => {
    editor = makeEditor();
    editor.setConfig(baseConfig());
  });

  it('re-nests device_entities_* fields back under device_entities on config-changed', () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);

    fireValueChanged(mainForm(editor), {
      title: 'New Title',
      device_entities_total_use: 'sensor.total_use',
      device_entities_last_used_by: 'sensor.last_used_by',
      device_entities_error: 'sensor.new_error',
      device_entities_last_event: 'sensor.last_event',
      device_entities_state: 'sensor.state',
      decline_threshold_pct: 70,
    });

    expect(listener).toHaveBeenCalledTimes(1);
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.title).toBe('New Title');
    expect(config.device_entities).toEqual({
      total_use: 'sensor.total_use',
      last_used_by: 'sensor.last_used_by',
      error: 'sensor.new_error',
      last_event: 'sensor.last_event',
      state: 'sensor.state',
    });
    expect(config.decline_threshold_pct).toBe(70);
  });

  it('dispatches config-changed as a bubbling, composed custom event (HA standard shape)', () => {
    let captured = null;
    editor.addEventListener('config-changed', (ev) => {
      captured = ev;
    });
    fireValueChanged(mainForm(editor), editor._flattenMain());
    expect(captured.bubbles).toBe(true);
    expect(captured.composed).toBe(true);
    expect(captured.detail.config).toBeDefined();
  });

  it('preserves cats/info_row/controls_row when only the main form changes', () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    fireValueChanged(mainForm(editor), editor._flattenMain());
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.cats).toEqual(baseConfig().cats);
    expect(config.info_row).toEqual(baseConfig().info_row);
  });

  it('updates a single cat in place when its row form changes', () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    const forms = catForms(editor);
    fireValueChanged(forms[1], { name: 'Renamed', color: '#222' });
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.cats[0]).toEqual(baseConfig().cats[0]);
    expect(config.cats[1].name).toBe('Renamed');
  });
});

describe('PetkitPuramaxCardEditor: cats array add/remove', () => {
  let editor;

  beforeEach(() => {
    editor = makeEditor();
    editor.setConfig(baseConfig());
  });

  it('adds a new blank cat row when "+ Add cat" is clicked', () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    editor.shadowRoot.getElementById('add-cat').dispatchEvent(new Event('click', { bubbles: true }));
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.cats.length).toBe(3);
    expect(config.cats[2].name).toBe('');
    // the editor re-renders itself after mutating, so the DOM reflects it immediately
    expect(catForms(editor).length).toBe(3);
  });

  it('removes the correct cat row when its Remove button is clicked', () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    const rows = editor.shadowRoot.querySelectorAll('#cats-rows .row');
    const removeBtn = rows[0].querySelector('.remove-btn');
    removeBtn.dispatchEvent(new Event('click', { bubbles: true }));
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.cats.length).toBe(1);
    expect(config.cats[0].name).toBe('Cat B');
    expect(catForms(editor).length).toBe(1);
  });

  it('does not throw when removing down to zero cats', () => {
    editor.setConfig(baseConfig({ cats: [{ name: 'Only', color: '#fff' }] }));
    const removeBtn = editor.shadowRoot.querySelector('#cats-rows .remove-btn');
    expect(() => removeBtn.dispatchEvent(new Event('click', { bubbles: true }))).not.toThrow();
    expect(catForms(editor).length).toBe(0);
  });
});

describe('PetkitPuramaxCardEditor: hass updates do not rebuild the DOM (scroll/focus regression)', () => {
  it('keeps the same ha-form node identity across repeated hass assignments', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig());
    editor.hass = { states: {} };
    const before = mainForm(editor);
    const beforeCatForms = catForms(editor);

    // Simulate the real-world pattern this bug came from: `hass` is
    // reassigned on essentially every state change anywhere in HA, not just
    // when the user edits this card -- many times in a row, unrelated to
    // any config change.
    for (let i = 0; i < 5; i++) {
      editor.hass = { states: { [`sensor.tick_${i}`]: { state: 'x' } } };
    }

    expect(mainForm(editor)).toBe(before);
    expect(catForms(editor)[0]).toBe(beforeCatForms[0]);
    expect(catForms(editor)[1]).toBe(beforeCatForms[1]);
  });

  it('still propagates the latest hass onto existing forms', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig());
    const hass = { states: { 'sensor.foo': { state: 'bar' } } };
    editor.hass = hass;
    expect(mainForm(editor).hass).toBe(hass);
    expect(catForms(editor)[0].hass).toBe(hass);
  });
});

describe('PetkitPuramaxCardEditor: controls_row per-action fields', () => {
  it('shows entity + confirm fields for a "press" action row', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig({ controls_row: [{ name: 'A', icon: 'mdi:a', action: 'press', entity: 'button.a' }] }));
    const schema = controlsRowForms(editor)[0].schema;
    const names = schema.map((s) => s.name);
    expect(names).toContain('entity');
    expect(names).toContain('confirm');
    expect(names).not.toContain('start_entity');
  });

  it('shows start/exit/state entity fields for a "toggle_maintenance" action row', () => {
    const editor = makeEditor();
    editor.setConfig(
      baseConfig({
        controls_row: [
          {
            name: 'M',
            icon: 'mdi:wrench',
            action: 'toggle_maintenance',
            start_entity: 'button.start',
            exit_entity: 'button.exit',
          },
        ],
      }),
    );
    const schema = controlsRowForms(editor)[0].schema;
    const names = schema.map((s) => s.name);
    expect(names).toContain('start_entity');
    expect(names).toContain('exit_entity');
    expect(names).toContain('state_entity');
    expect(names).not.toContain('entity');
  });

  it('re-renders the row with the new schema when the action field changes', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig({ controls_row: [{ name: 'A', icon: 'mdi:a', action: 'press', entity: 'button.a' }] }));
    const form = controlsRowForms(editor)[0];
    fireValueChanged(form, { name: 'A', icon: 'mdi:a', action: 'toggle', entity: 'switch.a' });
    const newSchema = controlsRowForms(editor)[0].schema;
    expect(newSchema.map((s) => s.name)).toEqual(['name', 'icon', 'action', 'entity']);
  });
});
