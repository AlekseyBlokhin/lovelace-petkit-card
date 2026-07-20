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

// Name form is nested inside the cat's `.row` (alongside the drag handle
// and Delete); the color form is the cat-item's other direct child ha-form,
// deliberately outside `.row` so Delete never ends up between the two.
function catNameForms(editor) {
  return editor.shadowRoot.querySelectorAll('#cats-rows .cat-item .row ha-form');
}

function catColorForms(editor) {
  return editor.shadowRoot.querySelectorAll('#cats-rows .cat-item > ha-form');
}

function infoRows(editor) {
  return editor.shadowRoot.querySelectorAll('#info-rows .summary-row');
}

function controlsRows(editor) {
  return editor.shadowRoot.querySelectorAll('#controls-rows .summary-row');
}

function addInfoRowForm(editor) {
  return editor.shadowRoot.querySelector('#add-info-row ha-form');
}

function addControlRowForm(editor) {
  return editor.shadowRoot.querySelector('#add-control-row ha-form');
}

function detailForm(editor) {
  return editor.shadowRoot.querySelector('#detail-body ha-form');
}

function backButton(editor) {
  return editor.shadowRoot.querySelector('ha-icon-button-prev');
}

function fireValueChanged(form, value) {
  form.dispatchEvent(new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true }));
}

function fireItemMoved(sortableEl, oldIndex, newIndex) {
  sortableEl.dispatchEvent(
    new CustomEvent('item-moved', { detail: { oldIndex, newIndex }, bubbles: true, composed: true }),
  );
}

function click(el) {
  el.dispatchEvent(new Event('click', { bubbles: true }));
}

describe('PetkitPuramaxCardEditor: Content section', () => {
  let editor;

  beforeEach(() => {
    editor = makeEditor();
    editor.setConfig(baseConfig());
  });

  it('groups title/device_id/show_* under a "Content" group, first in the schema', () => {
    const schema = mainForm(editor).schema;
    expect(schema[0].name).toBe('content');
    expect(schema[0].title).toBe('Content');
    expect(schema[0].flatten).toBe(true);
    const names = schema[0].schema.map((s) => s.name);
    expect(names).toEqual(['title', 'device_id', 'show_state', 'show_history', 'show_working_records', 'show_analytics']);
  });

  it('gives the Content group an mdi iconPath (native icon, not emoji)', () => {
    const contentGroup = mainForm(editor).schema.find((s) => s.name === 'content');
    expect(typeof contentGroup.iconPath).toBe('string');
    expect(contentGroup.iconPath.length).toBeGreaterThan(0);
  });

  it('gives device_id a plain label with no explanatory subtitle, filtered to the petkit integration', () => {
    const contentGroup = mainForm(editor).schema.find((s) => s.name === 'content');
    const deviceField = contentGroup.schema.find((s) => s.name === 'device_id');
    expect(deviceField.label).toBe('PetKit device');
    expect(deviceField.selector).toEqual({ device: { filter: { integration: 'petkit' } } });
  });

  it('exposes the show_* toggles as boolean selectors', () => {
    const contentGroup = mainForm(editor).schema.find((s) => s.name === 'content');
    for (const name of ['show_state', 'show_history', 'show_working_records', 'show_analytics']) {
      const field = contentGroup.schema.find((s) => s.name === name);
      expect(field.selector).toEqual({ boolean: {} });
    }
  });

  it('shows every show_* toggle as ON when the config omits them (the card\'s own default)', () => {
    // A boolean selector with nothing bound renders as an unchecked/"off"
    // toggle -- since the card treats a missing show_* key as true (shows
    // the section), the form must be handed an explicit `true` for display,
    // or every toggle would misleadingly look off on a config that's
    // actually showing everything.
    const data = mainForm(editor).data;
    expect(data.show_state).toBe(true);
    expect(data.show_history).toBe(true);
    expect(data.show_working_records).toBe(true);
    expect(data.show_analytics).toBe(true);
  });

  it('reflects an explicit show_* = false without overriding it back to true', () => {
    const withHidden = makeEditor();
    withHidden.setConfig(baseConfig({ show_analytics: false }));
    expect(mainForm(withHidden).data.show_analytics).toBe(false);
    expect(mainForm(withHidden).data.show_state).toBe(true);
  });

  it('does not expose a device_entities group in the visual editor (YAML/code-editor only)', () => {
    const names = mainForm(editor).schema.map((s) => s.name);
    expect(names).not.toContain('device_entities');
  });

  it('marks the alerts group as flatten, with its own mdi iconPath', () => {
    const alertsGroup = mainForm(editor).schema.find((s) => s.name === 'alerts');
    expect(alertsGroup.flatten).toBe(true);
    expect(typeof alertsGroup.iconPath).toBe('string');
    expect(alertsGroup.iconPath.length).toBeGreaterThan(0);
  });
});

describe('PetkitPuramaxCardEditor: Cats', () => {
  let editor;

  beforeEach(() => {
    editor = makeEditor();
    editor.setConfig(baseConfig());
  });

  it('renders two ha-forms per cat: name (with drag handle + Delete) and color', () => {
    expect(catNameForms(editor).length).toBe(2);
    expect(catColorForms(editor).length).toBe(2);
    expect(catNameForms(editor)[0].data).toEqual(baseConfig().cats[0]);
    expect(catColorForms(editor)[0].data).toEqual(baseConfig().cats[0]);
  });

  it('puts a cat\'s Delete button in the same row as Name, not between Name and Color', () => {
    const item = editor.shadowRoot.querySelector('#cats-rows .cat-item');
    const nameRow = item.querySelector('.row');
    expect(nameRow.querySelector('ha-form')).not.toBeNull();
    expect(nameRow.querySelector('.remove-btn')).not.toBeNull();
    const colorForm = item.querySelector(':scope > ha-form');
    expect(colorForm).not.toBeNull();
    expect(nameRow.contains(colorForm)).toBe(false);
  });

  it('gives each cat row a drag handle for reordering', () => {
    const item = editor.shadowRoot.querySelector('#cats-rows .cat-item');
    expect(item.querySelector('.handle')).not.toBeNull();
  });

  it('reorders cats when the sortable list fires item-moved', () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    const sortable = editor.shadowRoot.querySelector('#cats-rows ha-sortable');
    fireItemMoved(sortable, 0, 1);
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.cats.map((c) => c.name)).toEqual(['Cat B', 'Cat A']);
  });

  it('adds a new cat with a friendly default name and human-readable color', () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    click(editor.shadowRoot.getElementById('add-cat'));
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.cats[2]).toEqual({ name: 'My Cat', color: 'blue' });
  });

  it('removing a cat via its icon button still fires config-changed correctly', () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    editor.shadowRoot.querySelector('#cats-rows .remove-btn').dispatchEvent(new Event('click', { bubbles: true }));
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.cats.length).toBe(1);
  });

  it('does not throw when removing down to zero cats', () => {
    editor.setConfig(baseConfig({ cats: [{ name: 'Only', color: '#fff' }] }));
    const removeBtn = editor.shadowRoot.querySelector('#cats-rows .remove-btn');
    expect(() => click(removeBtn)).not.toThrow();
    expect(catNameForms(editor).length).toBe(0);
  });

  it("updates a single cat's name in place when its name-row form changes", () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    const forms = catNameForms(editor);
    fireValueChanged(forms[1], { name: 'Renamed' });
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.cats[0]).toEqual(baseConfig().cats[0]);
    expect(config.cats[1]).toEqual({ name: 'Renamed', color: '#222' });
  });

  it("updates a single cat's color in place when its color form changes", () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    const forms = catColorForms(editor);
    fireValueChanged(forms[1], { color: '#abcdef' });
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.cats[1]).toEqual({ name: 'Cat B', color: '#abcdef' });
  });
});

describe('PetkitPuramaxCardEditor: status chips / controls list view', () => {
  let editor;

  beforeEach(() => {
    editor = makeEditor();
    editor.setConfig(baseConfig());
  });

  it('shows one summary row per configured info_row/controls_row entry, with a drag handle', () => {
    const infoRow = infoRows(editor)[0];
    expect(infoRow.querySelector('.handle')).not.toBeNull();
    expect(infoRow.querySelector('.summary-label').textContent).toBe('Consumable');
    expect(infoRow.querySelector('.edit-btn')).not.toBeNull();
    expect(infoRow.querySelector('.remove-btn')).not.toBeNull();

    const controlRow = controlsRows(editor)[0];
    expect(controlRow.querySelector('.summary-label').textContent).toBe('Start');
  });

  it('exposes an always-present "add an entity" picker instead of a blank draft row', () => {
    expect(addInfoRowForm(editor).schema).toEqual([{ name: 'entity', label: 'Add a status chip', selector: { entity: {} } }]);
    expect(addControlRowForm(editor).schema).toEqual([{ name: 'entity', label: 'Add a control', selector: { entity: {} } }]);
  });

  it('picking an entity in the info_row add-picker appends a new summary row, auto-filling its icon from the entity', () => {
    editor.hass = { states: { 'sensor.new_chip': { attributes: { icon: 'mdi:water-percent' } } } };
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    fireValueChanged(addInfoRowForm(editor), { entity: 'sensor.new_chip' });
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.info_row[1]).toEqual({ entity: 'sensor.new_chip', name: '', icon: 'mdi:water-percent' });
  });

  it('falls back to the generic default icon when the entity has none set', () => {
    editor.hass = { states: { 'sensor.new_chip': { attributes: {} } } };
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    fireValueChanged(addInfoRowForm(editor), { entity: 'sensor.new_chip' });
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.info_row[1].icon).toBe('mdi:information-outline');
  });

  it('picking an entity in the controls_row add-picker appends a new "press" row, auto-filling its icon', () => {
    editor.hass = { states: { 'button.new': { attributes: { icon: 'mdi:broom' } } } };
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    fireValueChanged(addControlRowForm(editor), { entity: 'button.new' });
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.controls_row[1]).toEqual({ entity: 'button.new', name: '', icon: 'mdi:broom', action: 'press' });
  });

  it('reorders status chips when the sortable list fires item-moved', () => {
    editor.setConfig(
      baseConfig({
        info_row: [
          { entity: 'sensor.a', name: 'A' },
          { entity: 'sensor.b', name: 'B' },
        ],
      }),
    );
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    const sortable = editor.shadowRoot.querySelector('#info-rows ha-sortable');
    fireItemMoved(sortable, 0, 1);
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.info_row.map((r) => r.name)).toEqual(['B', 'A']);
  });

  it('reorders controls when the sortable list fires item-moved', () => {
    editor.setConfig(
      baseConfig({
        controls_row: [
          { name: 'A', action: 'press', entity: 'button.a' },
          { name: 'B', action: 'press', entity: 'button.b' },
        ],
      }),
    );
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    const sortable = editor.shadowRoot.querySelector('#controls-rows ha-sortable');
    fireItemMoved(sortable, 0, 1);
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.controls_row.map((r) => r.name)).toEqual(['B', 'A']);
  });

  it('a toggle_maintenance row (no plain entity field) still shows a real summary label via start_entity', () => {
    editor.setConfig(
      baseConfig({
        controls_row: [
          { name: '', icon: 'mdi:wrench', action: 'toggle_maintenance', start_entity: 'button.start', exit_entity: 'button.exit' },
        ],
      }),
    );
    expect(controlsRows(editor)[0].querySelector('.summary-label').textContent).toBe('button.start');
  });

  it('removing a row via its icon button fires config-changed correctly', () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    click(infoRows(editor)[0].querySelector('.remove-btn'));
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.info_row.length).toBe(0);
  });
});

describe('PetkitPuramaxCardEditor: Edit sub-page navigation', () => {
  let editor;

  beforeEach(() => {
    editor = makeEditor();
    editor.setConfig(baseConfig());
  });

  it('clicking Edit on a status chip swaps the whole editor to a single full-field sub-page with a back button', () => {
    click(infoRows(editor)[0].querySelector('.edit-btn'));
    expect(mainForm(editor)).toBeNull();
    expect(editor.shadowRoot.querySelector('#cats-rows')).toBeNull();
    expect(backButton(editor)).not.toBeNull();
    expect(editor.shadowRoot.querySelector('.detail-title').textContent).toBe('Edit status chip');
    const schema = detailForm(editor).schema;
    expect(schema.map((s) => s.name)).toEqual(['entity', 'name', 'icon', 'unit', 'warn_below', 'warn_above', 'warn_state']);
    expect(detailForm(editor).data).toEqual(baseConfig().info_row[0]);
  });

  it('clicking Edit on a control shows the action-appropriate full field set', () => {
    click(controlsRows(editor)[0].querySelector('.edit-btn'));
    expect(editor.shadowRoot.querySelector('.detail-title').textContent).toBe('Edit control');
    const schema = detailForm(editor).schema;
    expect(schema.map((s) => s.name)).toEqual(['name', 'icon', 'action', 'entity', 'confirm']);
  });

  it('shows start/exit/state entity fields (no plain entity field) when editing a toggle_maintenance row', () => {
    editor.setConfig(
      baseConfig({
        controls_row: [
          { name: 'M', icon: 'mdi:wrench', action: 'toggle_maintenance', start_entity: 'button.start', exit_entity: 'button.exit' },
        ],
      }),
    );
    click(controlsRows(editor)[0].querySelector('.edit-btn'));
    const names = detailForm(editor).schema.map((s) => s.name);
    expect(names).toContain('start_entity');
    expect(names).toContain('exit_entity');
    expect(names).toContain('state_entity');
    expect(names).not.toContain('entity');
  });

  it('editing a field in the sub-page fires config-changed with the updated row', () => {
    click(infoRows(editor)[0].querySelector('.edit-btn'));
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    fireValueChanged(detailForm(editor), { ...baseConfig().info_row[0], name: 'Renamed chip' });
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.info_row[0].name).toBe('Renamed chip');
  });

  it('re-renders the sub-page with a new schema when a control\'s action field changes', () => {
    click(controlsRows(editor)[0].querySelector('.edit-btn'));
    const before = detailForm(editor);
    fireValueChanged(before, { name: 'Start', icon: 'mdi:play', action: 'toggle', entity: 'switch.a' });
    const after = detailForm(editor);
    expect(after).not.toBe(before);
    expect(after.schema.map((s) => s.name)).toEqual(['name', 'icon', 'action', 'entity']);
  });

  it('clicking the back button returns to the normal list view', () => {
    click(infoRows(editor)[0].querySelector('.edit-btn'));
    expect(mainForm(editor)).toBeNull();
    click(backButton(editor));
    expect(mainForm(editor)).not.toBeNull();
    expect(infoRows(editor).length).toBe(1);
  });

  it('a value-only setConfig round-trip while in the sub-page updates the form in place, not a rebuild', () => {
    click(infoRows(editor)[0].querySelector('.edit-btn'));
    const before = detailForm(editor);
    editor.setConfig(baseConfig({ info_row: [{ ...baseConfig().info_row[0], name: 'Renamed chip' }] }));
    expect(detailForm(editor)).toBe(before);
    expect(detailForm(editor).data.name).toBe('Renamed chip');
    // still on the sub-page, not bounced back to the list
    expect(backButton(editor)).not.toBeNull();
  });
});

describe('PetkitPuramaxCardEditor: setConfig value-only updates do not collapse expansion panels', () => {
  it('keeps the same ha-expansion-panel node identity when setConfig is called again with only a value changed', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig());
    const panelsBefore = Array.from(editor.shadowRoot.querySelectorAll('ha-expansion-panel'));

    editor.setConfig(baseConfig({ title: 'Renamed' }));

    const panelsAfter = Array.from(editor.shadowRoot.querySelectorAll('ha-expansion-panel'));
    expect(panelsAfter).toEqual(panelsBefore);
  });

  it("preserves each panel's expanded state across a value-only setConfig call", () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig());
    const panels = editor.shadowRoot.querySelectorAll('ha-expansion-panel');
    panels[0].expanded = true;
    panels[1].expanded = false;
    panels[2].expanded = true;

    editor.setConfig(baseConfig({ decline_threshold_pct: 80 }));

    const after = editor.shadowRoot.querySelectorAll('ha-expansion-panel');
    expect(after[0].expanded).toBe(true);
    expect(after[1].expanded).toBe(false);
    expect(after[2].expanded).toBe(true);
  });

  it("updates existing forms' data in place instead of rebuilding, for a value-only setConfig call", () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig());
    const before = mainForm(editor);
    const beforeCatForms = catNameForms(editor);

    editor.setConfig(baseConfig({ title: 'Renamed' }));

    expect(mainForm(editor)).toBe(before);
    expect(mainForm(editor).data.title).toBe('Renamed');
    expect(catNameForms(editor)[0]).toBe(beforeCatForms[0]);
    expect(catNameForms(editor)[1]).toBe(beforeCatForms[1]);
  });

  it("refreshes a summary row's label in place for a value-only setConfig call", () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig());
    const rowBefore = infoRows(editor)[0];

    editor.setConfig(baseConfig({ info_row: [{ entity: 'sensor.consumable', name: 'Renamed chip' }] }));

    const rowAfter = infoRows(editor)[0];
    expect(rowAfter).toBe(rowBefore);
    expect(rowAfter.querySelector('.summary-label').textContent).toBe('Renamed chip');
  });

  it('still preserves panel expanded state across a structural change (add cat)', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig());
    const panels = editor.shadowRoot.querySelectorAll('ha-expansion-panel');
    panels[0].expanded = true; // the Cats panel
    panels[1].expanded = true; // Status chips -- unrelated to the add-cat structural change

    click(editor.shadowRoot.getElementById('add-cat'));

    const after = editor.shadowRoot.querySelectorAll('ha-expansion-panel');
    expect(after[0].expanded).toBe(true);
    expect(after[1].expanded).toBe(true);
  });
});

describe('PetkitPuramaxCardEditor: hass updates do not rebuild the DOM (scroll/focus regression)', () => {
  it('keeps the same ha-form node identity across repeated hass assignments', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig());
    editor.hass = { states: {} };
    const before = mainForm(editor);
    const beforeCatForms = catNameForms(editor);

    // Simulate the real-world pattern this bug came from: `hass` is
    // reassigned on essentially every state change anywhere in HA, not just
    // when the user edits this card -- many times in a row, unrelated to
    // any config change.
    for (let i = 0; i < 5; i++) {
      editor.hass = { states: { [`sensor.tick_${i}`]: { state: 'x' } } };
    }

    expect(mainForm(editor)).toBe(before);
    expect(catNameForms(editor)[0]).toBe(beforeCatForms[0]);
    expect(catNameForms(editor)[1]).toBe(beforeCatForms[1]);
  });

  it('still propagates the latest hass onto existing forms', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig());
    const hass = { states: { 'sensor.foo': { state: 'bar' } } };
    editor.hass = hass;
    expect(mainForm(editor).hass).toBe(hass);
    expect(catNameForms(editor)[0].hass).toBe(hass);
  });

  it('propagates hass onto the sub-page form while it is open', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig());
    click(infoRows(editor)[0].querySelector('.edit-btn'));
    const hass = { states: { 'sensor.foo': { state: 'bar' } } };
    editor.hass = hass;
    expect(detailForm(editor).hass).toBe(hass);
  });
});
