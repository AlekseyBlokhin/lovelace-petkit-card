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
