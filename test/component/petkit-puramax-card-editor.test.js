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
    controls_row: [
      {
        name: 'Start',
        icon: 'mdi:play',
        entity: 'button.start',
        tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.start' } },
      },
    ],
    ...overrides,
  };
}

function makeEditor() {
  return /** @type {PetkitPuramaxCardEditor} */ (document.createElement('petkit-puramax-card-editor'));
}

function mainForm(editor) {
  return editor.shadowRoot.querySelector('#main-section ha-form');
}

function contentTitleForm(editor) {
  return editor.shadowRoot.querySelector('#content-panel .panel-body > ha-form');
}

function contentToggleForms(editor) {
  return editor.shadowRoot.querySelectorAll('#content-panel .content-toggles ha-form');
}

function alertsForm(editor) {
  return editor.shadowRoot.querySelector('#alerts-panel ha-form');
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

  it('puts device_id in its own top-level form, outside "Content" entirely', () => {
    const schema = mainForm(editor).schema;
    expect(schema).toHaveLength(1);
    expect(schema[0].name).toBe('device_id');
    expect(schema[0].label).toBe('PetKit device');
    expect(schema[0].selector).toEqual({ device: { filter: { integration: 'petkit' } } });
  });

  it('"Content" and "Analytics & alerts" are hand-built ha-expansion-panels, not ha-form expandable groups', () => {
    // Same shell every other section (Cats/Status chips/Controls) uses --
    // this is what keeps all five sections' shape/spacing consistent,
    // since ha-form's own `expandable` type hardcodes its own corner
    // radius and grid row-gap with no exposed override (see the class
    // header comment in the source).
    expect(editor.shadowRoot.querySelector('#content-panel').tagName).toBe('HA-EXPANSION-PANEL');
    expect(editor.shadowRoot.querySelector('#content-panel').hasAttribute('outlined')).toBe(true);
    expect(editor.shadowRoot.querySelector('#alerts-panel').tagName).toBe('HA-EXPANSION-PANEL');
    expect(editor.shadowRoot.querySelector('#alerts-panel').hasAttribute('outlined')).toBe(true);
  });

  it('gives Content and Analytics & alerts each an mdi icon (native icon, not emoji)', () => {
    const contentIcon = editor.shadowRoot.querySelector('#content-panel ha-svg-icon[slot="leading-icon"]');
    const alertsIcon = editor.shadowRoot.querySelector('#alerts-panel ha-svg-icon[slot="leading-icon"]');
    expect(typeof contentIcon.path).toBe('string');
    expect(contentIcon.path.length).toBeGreaterThan(0);
    expect(typeof alertsIcon.path).toBe('string');
    expect(alertsIcon.path.length).toBeGreaterThan(0);
  });

  it('binds the Content title field to the full config', () => {
    expect(contentTitleForm(editor).schema).toEqual([{ name: 'title', label: 'Title', selector: { text: {} } }]);
    expect(contentTitleForm(editor).data.title).toBe('My Litter Box');
  });

  it('renders the 4 show_* toggles as one small ha-form each, in a compact grid container', () => {
    // One ha-form per boolean field (not ha-form's own `type: grid`
    // sub-schema, whose row-gap isn't overridable -- see source comment),
    // laid out via the `.content-toggles` CSS grid this stylesheet owns.
    const forms = contentToggleForms(editor);
    expect(forms).toHaveLength(4);
    expect([...forms].map((f) => f.schema[0].name)).toEqual([
      'show_state',
      'show_history',
      'show_working_records',
      'show_analytics',
    ]);
    [...forms].forEach((f) => expect(f.schema[0].selector).toEqual({ boolean: {} }));
    const container = editor.shadowRoot.querySelector('#content-panel .content-toggles');
    expect(container).not.toBeNull();
    [...forms].forEach((f) => expect(container.contains(f)).toBe(true));
  });

  it('shows every show_* toggle as ON when the config omits them (the card\'s own default)', () => {
    // A boolean selector with nothing bound renders as an unchecked/"off"
    // toggle -- since the card treats a missing show_* key as true (shows
    // the section), the form must be handed an explicit `true` for display,
    // or every toggle would misleadingly look off on a config that's
    // actually showing everything.
    const forms = contentToggleForms(editor);
    [...forms].forEach((f) => expect(f.data[f.schema[0].name]).toBe(true));
  });

  it('reflects an explicit show_* = false without overriding it back to true', () => {
    const withHidden = makeEditor();
    withHidden.setConfig(baseConfig({ show_analytics: false }));
    const forms = contentToggleForms(withHidden);
    const analyticsForm = [...forms].find((f) => f.schema[0].name === 'show_analytics');
    const stateForm = [...forms].find((f) => f.schema[0].name === 'show_state');
    expect(analyticsForm.data.show_analytics).toBe(false);
    expect(stateForm.data.show_state).toBe(true);
  });

  it('does not expose a device_entities field anywhere in the visual editor (YAML/code-editor only)', () => {
    expect(mainForm(editor).schema.map((s) => s.name)).not.toContain('device_entities');
    expect(contentTitleForm(editor).schema.map((s) => s.name)).not.toContain('device_entities');
    expect(alertsForm(editor).schema.map((s) => s.name)).not.toContain('device_entities');
  });

  it('binds the alerts fields (decline threshold, no-visit hours, notify service) to the full config', () => {
    const names = alertsForm(editor).schema.map((s) => s.name);
    expect(names).toEqual(['decline_threshold_pct', 'no_visit_alert_hours', 'notify_service']);
    expect(alertsForm(editor).data.decline_threshold_pct).toBe(55);
  });

  it('does not expose unknown_cat_color in the visual editor (YAML-only)', () => {
    expect(alertsForm(editor).schema.find((s) => s.name === 'unknown_cat_color')).toBeUndefined();
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

  it('picking an entity in the info_row add-picker appends a row with ONLY entity set -- no name/icon baked in', () => {
    editor.hass = { states: { 'sensor.new_chip': { attributes: { icon: 'mdi:water-percent', friendly_name: 'New chip' } } } };
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    fireValueChanged(addInfoRowForm(editor), { entity: 'sensor.new_chip' });
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.info_row[1]).toEqual({ entity: 'sensor.new_chip' });
  });

  it('picking an entity in the controls_row add-picker appends a row with ONLY entity set -- no name/icon/tap_action baked in', () => {
    editor.hass = { states: { 'button.new': { attributes: { icon: 'mdi:broom' } } } };
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    fireValueChanged(addControlRowForm(editor), { entity: 'button.new' });
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.controls_row[1]).toEqual({ entity: 'button.new' });
  });

  it("a summary row's icon is a live ha-state-icon bound to the entity's state, not a fixed default", () => {
    editor.hass = { states: { 'sensor.consumable': { attributes: {} } } };
    editor.setConfig(baseConfig());
    const icon = /** @type {any} */ (infoRows(editor)[0].querySelector('ha-state-icon'));
    expect(icon).not.toBeNull();
    expect(icon.stateObj).toEqual({ attributes: {} });
    expect(icon.icon).toBeUndefined();
  });

  it("an explicit spec.icon is passed to ha-state-icon as an override, alongside the live stateObj", () => {
    editor.hass = { states: { 'sensor.consumable': { attributes: {} } } };
    editor.setConfig(baseConfig({ info_row: [{ entity: 'sensor.consumable', name: 'Consumable', icon: 'mdi:custom' }] }));
    const icon = /** @type {any} */ (infoRows(editor)[0].querySelector('ha-state-icon'));
    expect(icon.icon).toBe('mdi:custom');
  });

  it("a summary row falls back to the entity's live friendly_name when no name is configured", () => {
    editor.hass = { states: { 'sensor.consumable': { attributes: { friendly_name: 'Consumable remaining' } } } };
    editor.setConfig(baseConfig({ info_row: [{ entity: 'sensor.consumable' }] }));
    const primary = infoRows(editor)[0].querySelector('.summary-label-primary');
    expect(primary.textContent).toBe('Consumable remaining');
  });

  it('shows a muted "Area → Device" secondary line when the entity registry has that context', () => {
    editor.hass = {
      states: { 'sensor.consumable': { attributes: {} } },
      entities: { 'sensor.consumable': { entity_id: 'sensor.consumable', device_id: 'dev1', area_id: 'bathroom' } },
      devices: { dev1: { id: 'dev1', name: 'PETKIT PURAMAX' } },
      areas: { bathroom: { area_id: 'bathroom', name: 'Bathroom' } },
    };
    editor.setConfig(baseConfig({ info_row: [{ entity: 'sensor.consumable' }] }));
    const secondary = infoRows(editor)[0].querySelector('.summary-label-secondary');
    expect(secondary.textContent).toBe('Bathroom → PETKIT PURAMAX');
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
          { name: 'A', entity: 'button.a', tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.a' } } },
          { name: 'B', entity: 'button.b', tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.b' } } },
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

  it("a control with a visibility condition (e.g. one half of a Start/Exit Maintenance pair) still renders a normal summary row", () => {
    editor.setConfig(
      baseConfig({
        controls_row: [
          {
            name: 'Start Maintenance',
            entity: 'button.maint_start',
            tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.maint_start' } },
            visibility: [{ condition: 'state', entity: 'sensor.state', state_not: 'maintenance_mode' }],
          },
        ],
      }),
    );
    expect(controlsRows(editor)[0].querySelector('.summary-label-primary').textContent).toBe('Start Maintenance');
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
    expect(schema.map((s) => s.name)).toEqual(['entity', 'name', 'icon', 'warn_below', 'warn_above', 'warn_state']);
    expect(detailForm(editor).data).toEqual(baseConfig().info_row[0]);
  });

  it('clicking Edit on a control shows entity/name/icon plus the native tap/hold/double-tap action selectors', () => {
    click(controlsRows(editor)[0].querySelector('.edit-btn'));
    expect(editor.shadowRoot.querySelector('.detail-title').textContent).toBe('Edit control');
    const schema = detailForm(editor).schema;
    expect(schema.map((s) => s.name)).toEqual(['entity', 'name', 'icon', 'tap_action', 'hold_action', 'double_tap_action']);
    expect(schema.find((s) => s.name === 'tap_action').selector).toEqual({ ui_action: {} });
  });

  it("a control's visibility field (YAML-only) round-trips untouched through the sub-page, same as any other unlisted key", () => {
    editor.setConfig(
      baseConfig({
        controls_row: [
          {
            name: 'Start Maintenance',
            entity: 'button.maint_start',
            tap_action: { action: 'perform-action', perform_action: 'button.press', target: { entity_id: 'button.maint_start' } },
            visibility: [{ condition: 'state', entity: 'sensor.state', state_not: 'maintenance_mode' }],
          },
        ],
      }),
    );
    click(controlsRows(editor)[0].querySelector('.edit-btn'));
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    fireValueChanged(detailForm(editor), { ...editor._config.controls_row[0], name: 'Renamed' });
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.controls_row[0].visibility).toEqual([{ condition: 'state', entity: 'sensor.state', state_not: 'maintenance_mode' }]);
    expect(config.controls_row[0].name).toBe('Renamed');
  });

  it('editing a field in the sub-page fires config-changed with the updated row', () => {
    click(infoRows(editor)[0].querySelector('.edit-btn'));
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    fireValueChanged(detailForm(editor), { ...baseConfig().info_row[0], name: 'Renamed chip' });
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.info_row[0].name).toBe('Renamed chip');
  });

  it("editing a control's tap_action does not rebuild the sub-page (the schema is fixed, not action-dependent)", () => {
    click(controlsRows(editor)[0].querySelector('.edit-btn'));
    const before = detailForm(editor);
    fireValueChanged(before, { name: 'Start', icon: 'mdi:play', entity: 'switch.a', tap_action: { action: 'toggle' } });
    const after = detailForm(editor);
    expect(after).toBe(before);
    expect(after.schema.map((s) => s.name)).toEqual(['entity', 'name', 'icon', 'tap_action', 'hold_action', 'double_tap_action']);
  });

  it('clicking the back button returns to the normal list view', () => {
    click(infoRows(editor)[0].querySelector('.edit-btn'));
    expect(mainForm(editor)).toBeNull();
    click(backButton(editor));
    expect(mainForm(editor)).not.toBeNull();
    expect(infoRows(editor).length).toBe(1);
  });

  it('preserves panel expanded state across a round-trip into the Edit sub-page and back', () => {
    // The list view and the detail sub-page are two entirely different
    // templates at the same render position -- switching between them
    // disposes the old ha-expansion-panel elements and builds fresh ones,
    // unlike a plain value/structural edit that stays on the list view
    // (see the other describe block above, and the class header comment on
    // `_openDetail`/`_closeDetail`). Panel order: Content, Analytics &
    // alerts, Cats, Status chips, Controls.
    const panels = editor.shadowRoot.querySelectorAll('ha-expansion-panel');
    panels[3].expanded = true; // Status chips
    panels[4].expanded = true; // Controls

    click(infoRows(editor)[0].querySelector('.edit-btn'));
    click(backButton(editor));

    const after = editor.shadowRoot.querySelectorAll('ha-expansion-panel');
    expect(after[3].expanded).toBe(true);
    expect(after[4].expanded).toBe(true);
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
    // Panel order: Content, Analytics & alerts, Cats, Status chips, Controls.
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
    // Panel order: Content, Analytics & alerts, Cats, Status chips, Controls.
    const panels = editor.shadowRoot.querySelectorAll('ha-expansion-panel');
    panels[2].expanded = true; // the Cats panel
    panels[3].expanded = true; // Status chips -- unrelated to the add-cat structural change

    click(editor.shadowRoot.getElementById('add-cat'));

    const after = editor.shadowRoot.querySelectorAll('ha-expansion-panel');
    expect(after[2].expanded).toBe(true);
    expect(after[3].expanded).toBe(true);
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
