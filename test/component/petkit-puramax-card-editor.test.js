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

// Name form is nested inside the cat's `.row` (alongside Delete); the color
// form is the cat-item's other direct child ha-form, deliberately outside
// `.row` so Delete never ends up between the two.
function catNameForms(editor) {
  return editor.shadowRoot.querySelectorAll('#cats-rows .cat-item .row ha-form');
}

function catColorForms(editor) {
  return editor.shadowRoot.querySelectorAll('#cats-rows .cat-item > ha-form');
}

function infoRows(editor) {
  return editor.shadowRoot.querySelectorAll('#info-rows > .row');
}

function controlsRows(editor) {
  return editor.shadowRoot.querySelectorAll('#controls-rows > .row');
}

function fireValueChanged(form, value) {
  form.dispatchEvent(new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true }));
}

function click(el) {
  el.dispatchEvent(new Event('click', { bubbles: true }));
}

describe('PetkitPuramaxCardEditor: initial render reflects config', () => {
  let editor;

  beforeEach(() => {
    editor = makeEditor();
    editor.setConfig(baseConfig());
  });

  it('binds the main ha-form directly to the config object (no manual flatten)', () => {
    const form = mainForm(editor);
    expect(form).not.toBeNull();
    expect(form.data).toEqual(baseConfig());
  });

  it('puts title first and device_id second in the main form schema', () => {
    const names = mainForm(editor).schema.map((s) => s.name);
    expect(names[0]).toBe('title');
    expect(names[1]).toBe('device_id');
  });

  it('gives device_id a plain label with no explanatory subtitle, filtered to the petkit integration', () => {
    const deviceField = mainForm(editor).schema.find((s) => s.name === 'device_id');
    expect(deviceField.label).toBe('PetKit device');
    expect(deviceField.selector).toEqual({ device: { filter: { integration: 'petkit' } } });
  });

  it('does not expose a device_entities group in the visual editor (YAML/code-editor only)', () => {
    const names = mainForm(editor).schema.map((s) => s.name);
    expect(names).not.toContain('device_entities');
  });

  it('marks the alerts group as flatten (it has no real backing object in config)', () => {
    const alertsGroup = mainForm(editor).schema.find((s) => s.name === 'alerts');
    expect(alertsGroup.flatten).toBe(true);
  });

  it('renders two ha-forms per cat: name (with Delete) and color', () => {
    expect(catNameForms(editor).length).toBe(2);
    expect(catColorForms(editor).length).toBe(2);
    expect(catNameForms(editor)[0].data).toEqual(baseConfig().cats[0]);
    expect(catColorForms(editor)[0].data).toEqual(baseConfig().cats[0]);
  });

  it('renders an already-configured info_row entry as a collapsed summary row, not the full form', () => {
    const rows = infoRows(editor);
    expect(rows.length).toBe(1);
    expect(rows[0].classList.contains('summary-row')).toBe(true);
    expect(rows[0].querySelector('.summary-label').textContent).toBe('Consumable');
    expect(rows[0].querySelector('ha-form')).toBeNull();
  });

  it('renders an already-configured controls_row entry as a collapsed summary row, not the full form', () => {
    const rows = controlsRows(editor);
    expect(rows.length).toBe(1);
    expect(rows[0].classList.contains('summary-row')).toBe(true);
    expect(rows[0].querySelector('.summary-label').textContent).toBe('Start');
    expect(rows[0].querySelector('ha-form')).toBeNull();
  });

  it('renders a new (entity-less) info_row entry as a minimal entity-only form', () => {
    const withBlank = makeEditor();
    withBlank.setConfig(baseConfig({ info_row: [{ entity: '', name: '', icon: 'mdi:information-outline' }] }));
    const rows = infoRows(withBlank);
    expect(rows.length).toBe(1);
    expect(rows[0].classList.contains('summary-row')).toBe(false);
    const form = rows[0].querySelector('ha-form');
    expect(form.schema.map((s) => s.name)).toEqual(['entity']);
  });

  it('renders no array rows for an empty/absent config', () => {
    const empty = makeEditor();
    empty.setConfig({ type: 'custom:petkit-puramax-card' });
    expect(catNameForms(empty).length).toBe(0);
    expect(infoRows(empty).length).toBe(0);
    expect(controlsRows(empty).length).toBe(0);
  });

  it('includes no_visit_alert_hours and notify_service in the main form data', () => {
    const withAlerts = makeEditor();
    withAlerts.setConfig(baseConfig({ no_visit_alert_hours: 12, notify_service: 'notify.mobile_app_x' }));
    expect(mainForm(withAlerts).data).toMatchObject({
      no_visit_alert_hours: 12,
      notify_service: 'notify.mobile_app_x',
    });
  });

  it('includes unknown_cat_color in the main form data and round-trips it back into config on change', () => {
    const withColor = makeEditor();
    withColor.setConfig(baseConfig({ unknown_cat_color: '#ff00ff' }));
    expect(mainForm(withColor).data).toMatchObject({ unknown_cat_color: '#ff00ff' });

    fireValueChanged(mainForm(withColor), { ...withColor._config, unknown_cat_color: '#00ff00' });
    expect(withColor._config.unknown_cat_color).toBe('#00ff00');
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
    click(editor.shadowRoot.getElementById('add-cat'));
    const catsPanel = editor.shadowRoot.querySelector('ha-expansion-panel');
    expect(catsPanel.getAttribute('header')).toBe('Cats (3)');
  });

  it('uses a native ha-icon-button (not a text "Remove" button) for removing a cat', () => {
    const removeBtn = editor.shadowRoot.querySelector('#cats-rows .remove-btn');
    expect(removeBtn.tagName.toLowerCase()).toBe('ha-icon-button');
    expect(removeBtn.querySelector('ha-icon').getAttribute('icon')).toBe('mdi:delete-outline');
  });

  it('puts a cat\'s Delete button in the same row as Name, not between Name and Color', () => {
    const item = editor.shadowRoot.querySelector('#cats-rows .cat-item');
    const nameRow = item.querySelector('.row');
    expect(nameRow.querySelector('ha-form[schema]') || nameRow.querySelector('ha-form')).not.toBeNull();
    expect(nameRow.querySelector('.remove-btn')).not.toBeNull();
    // Color form is a sibling of the name row, not inside it -- Delete can
    // never end up visually between Name and Color regardless of how the
    // name/color forms wrap at narrow widths.
    const colorForm = item.querySelector(':scope > ha-form');
    expect(colorForm).not.toBeNull();
    expect(nameRow.contains(colorForm)).toBe(false);
  });

  it('removing a cat via its icon button still fires config-changed correctly', () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    editor.shadowRoot.querySelector('#cats-rows .remove-btn').dispatchEvent(new Event('click', { bubbles: true }));
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.cats.length).toBe(1);
  });

  it('exposes notify_service as an entity selector scoped to the notify domain', () => {
    const alertsGroup = mainForm(editor).schema.find((s) => s.name === 'alerts');
    const notifyField = alertsGroup.schema.find((s) => s.name === 'notify_service');
    expect(notifyField.selector).toEqual({ entity: { domain: 'notify' } });
  });

  it('exposes unknown_cat_color as a native color selector, not a plain text field', () => {
    const alertsGroup = mainForm(editor).schema.find((s) => s.name === 'alerts');
    const colorField = alertsGroup.schema.find((s) => s.name === 'unknown_cat_color');
    expect(colorField.selector).toEqual({ ui_color: {} });
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

  it("passes the main form's emitted value straight through, preserving device_entities untouched", () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);

    // device_entities is no longer in MAIN_SCHEMA, so a real ha-form emits
    // it back unchanged as part of its full merged data object -- simulate
    // that directly, same as cats/info_row/controls_row already do.
    fireValueChanged(mainForm(editor), {
      ...editor._config,
      title: 'New Title',
      device_id: 'abc123',
      decline_threshold_pct: 70,
    });

    expect(listener).toHaveBeenCalledTimes(1);
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.title).toBe('New Title');
    expect(config.device_id).toBe('abc123');
    expect(config.device_entities).toEqual(baseConfig().device_entities);
    expect(config.decline_threshold_pct).toBe(70);
  });

  it('dispatches config-changed as a bubbling, composed custom event (HA standard shape)', () => {
    let captured = null;
    editor.addEventListener('config-changed', (ev) => {
      captured = ev;
    });
    fireValueChanged(mainForm(editor), editor._config);
    expect(captured.bubbles).toBe(true);
    expect(captured.composed).toBe(true);
    expect(captured.detail.config).toBeDefined();
  });

  it('preserves cats/info_row/controls_row when only the main form changes', () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    fireValueChanged(mainForm(editor), { ...editor._config, title: 'Changed' });
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.cats).toEqual(baseConfig().cats);
    expect(config.info_row).toEqual(baseConfig().info_row);
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

describe('PetkitPuramaxCardEditor: cats array add/remove', () => {
  let editor;

  beforeEach(() => {
    editor = makeEditor();
    editor.setConfig(baseConfig());
  });

  it('adds a new blank cat row when "+ Add cat" is clicked', () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    click(editor.shadowRoot.getElementById('add-cat'));
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.cats.length).toBe(3);
    expect(config.cats[2].name).toBe('');
    // the editor re-renders itself after mutating, so the DOM reflects it immediately
    expect(catNameForms(editor).length).toBe(3);
  });

  it('removes the correct cat row when its Remove button is clicked', () => {
    const listener = vi.fn();
    editor.addEventListener('config-changed', listener);
    const rows = editor.shadowRoot.querySelectorAll('#cats-rows .cat-item');
    const removeBtn = rows[0].querySelector('.remove-btn');
    click(removeBtn);
    const { config } = listener.mock.calls[0][0].detail;
    expect(config.cats.length).toBe(1);
    expect(config.cats[0].name).toBe('Cat B');
    expect(catNameForms(editor).length).toBe(1);
  });

  it('does not throw when removing down to zero cats', () => {
    editor.setConfig(baseConfig({ cats: [{ name: 'Only', color: '#fff' }] }));
    const removeBtn = editor.shadowRoot.querySelector('#cats-rows .remove-btn');
    expect(() => click(removeBtn)).not.toThrow();
    expect(catNameForms(editor).length).toBe(0);
  });
});

describe('PetkitPuramaxCardEditor: status chips / controls collapse-to-summary UX', () => {
  it('typing an entity into a minimal info_row form collapses it to a summary row', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig({ info_row: [{ entity: '', name: '', icon: 'mdi:information-outline' }] }));
    const form = infoRows(editor)[0].querySelector('ha-form');
    fireValueChanged(form, { entity: 'sensor.new_chip' });
    const rows = infoRows(editor);
    expect(rows.length).toBe(1);
    expect(rows[0].classList.contains('summary-row')).toBe(true);
    expect(rows[0].querySelector('.summary-label').textContent).toBe('sensor.new_chip');
  });

  it('clicking Edit on an info_row summary row reveals the full field set', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig());
    const summaryRow = infoRows(editor)[0];
    click(summaryRow.querySelector('.edit-btn'));
    const rows = infoRows(editor);
    expect(rows[0].classList.contains('summary-row')).toBe(false);
    const schema = rows[0].querySelector('ha-form').schema;
    expect(schema.map((s) => s.name)).toEqual(['entity', 'name', 'icon', 'unit', 'warn_below', 'warn_above', 'warn_state']);
  });

  it('clicking Done on an expanded info_row folds it back to a summary row', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig());
    click(infoRows(editor)[0].querySelector('.edit-btn'));
    expect(infoRows(editor)[0].classList.contains('summary-row')).toBe(false);
    click(infoRows(editor)[0].querySelector('.collapse-btn'));
    expect(infoRows(editor)[0].classList.contains('summary-row')).toBe(true);
  });

  it('a new controls_row entry starts as a minimal entity-only form', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig({ controls_row: [] }));
    click(editor.shadowRoot.getElementById('add-control-row'));
    const rows = controlsRows(editor);
    expect(rows.length).toBe(1);
    expect(rows[0].classList.contains('summary-row')).toBe(false);
    expect(rows[0].querySelector('ha-form').schema.map((s) => s.name)).toEqual(['entity']);
  });

  it('picking an entity for a new controls_row entry collapses it to a summary row', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig({ controls_row: [] }));
    click(editor.shadowRoot.getElementById('add-control-row'));
    const form = controlsRows(editor)[0].querySelector('ha-form');
    fireValueChanged(form, { entity: 'button.new' });
    const rows = controlsRows(editor);
    expect(rows[0].classList.contains('summary-row')).toBe(true);
    expect(rows[0].querySelector('.summary-label').textContent).toBe('button.new');
  });

  it('a toggle_maintenance row (no plain entity field) still collapses to a summary once start_entity is set', () => {
    const editor = makeEditor();
    editor.setConfig(
      baseConfig({
        controls_row: [
          { name: 'Maint', icon: 'mdi:wrench', action: 'toggle_maintenance', start_entity: 'button.start', exit_entity: 'button.exit' },
        ],
      }),
    );
    const rows = controlsRows(editor);
    expect(rows[0].classList.contains('summary-row')).toBe(true);
    expect(rows[0].querySelector('.summary-label').textContent).toBe('Maint');
  });

  it('clicking Edit on a controls_row summary row reveals the action-appropriate full field set', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig());
    click(controlsRows(editor)[0].querySelector('.edit-btn'));
    const schema = controlsRows(editor)[0].querySelector('ha-form').schema;
    expect(schema.map((s) => s.name)).toEqual(['name', 'icon', 'action', 'entity', 'confirm']);
  });

  it('removing a collapsed row while another is expanded keeps the expanded one open (index reindexing)', () => {
    const editor = makeEditor();
    editor.setConfig(
      baseConfig({
        info_row: [
          { entity: 'sensor.a', name: 'A' },
          { entity: 'sensor.b', name: 'B' },
        ],
      }),
    );
    // Expand the second row, then remove the first -- the second row (now
    // at index 0) should still be expanded, not the (deleted) first one.
    click(infoRows(editor)[1].querySelector('.edit-btn'));
    click(infoRows(editor)[0].querySelector('.remove-btn'));
    const rows = infoRows(editor);
    expect(rows.length).toBe(1);
    expect(rows[0].classList.contains('summary-row')).toBe(false);
    expect(rows[0].querySelector('ha-form').data.name).toBe('B');
  });
});

describe('PetkitPuramaxCardEditor: setConfig value-only updates do not collapse expansion panels', () => {
  // This is the actual bug: the dashboard host calls setConfig() again on
  // every config-changed round-trip we fire ourselves -- i.e. on every
  // value edit, not just when a genuinely different config is assigned. A
  // full rebuild there recreates every ha-expansion-panel from scratch,
  // losing its open/closed state.
  it('keeps the same ha-expansion-panel node identity when setConfig is called again with only a value changed', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig());
    const panelsBefore = Array.from(editor.shadowRoot.querySelectorAll('ha-expansion-panel'));

    editor.setConfig(baseConfig({ title: 'Renamed' }));

    const panelsAfter = Array.from(editor.shadowRoot.querySelectorAll('ha-expansion-panel'));
    expect(panelsAfter).toEqual(panelsBefore);
  });

  it('preserves each panel\'s expanded state across a value-only setConfig call', () => {
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

  it('updates existing forms\' data in place instead of rebuilding, for a value-only setConfig call', () => {
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

  it('refreshes a collapsed summary row\'s label in place for a value-only setConfig call', () => {
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

  it('does still do a full rebuild when a controls_row action change alters its visible sub-fields', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig({ controls_row: [{ name: 'A', icon: 'mdi:a', action: 'press', entity: 'button.a' }] }));
    click(controlsRows(editor)[0].querySelector('.edit-btn'));
    const before = controlsRows(editor)[0].querySelector('ha-form');

    editor.setConfig(baseConfig({ controls_row: [{ name: 'A', icon: 'mdi:a', action: 'toggle', entity: 'switch.a' }] }));

    const after = controlsRows(editor)[0].querySelector('ha-form');
    expect(after).not.toBe(before);
    expect(after.schema.map((s) => s.name)).toEqual(['name', 'icon', 'action', 'entity']);
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
});

describe('PetkitPuramaxCardEditor: controls_row per-action fields', () => {
  it('shows entity + confirm fields for a "press" action row', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig({ controls_row: [{ name: 'A', icon: 'mdi:a', action: 'press', entity: 'button.a' }] }));
    click(controlsRows(editor)[0].querySelector('.edit-btn'));
    const schema = controlsRows(editor)[0].querySelector('ha-form').schema;
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
    click(controlsRows(editor)[0].querySelector('.edit-btn'));
    const schema = controlsRows(editor)[0].querySelector('ha-form').schema;
    const names = schema.map((s) => s.name);
    expect(names).toContain('start_entity');
    expect(names).toContain('exit_entity');
    expect(names).toContain('state_entity');
    expect(names).not.toContain('entity');
  });

  it('re-renders the row with the new schema when the action field changes', () => {
    const editor = makeEditor();
    editor.setConfig(baseConfig({ controls_row: [{ name: 'A', icon: 'mdi:a', action: 'press', entity: 'button.a' }] }));
    click(controlsRows(editor)[0].querySelector('.edit-btn'));
    const form = controlsRows(editor)[0].querySelector('ha-form');
    fireValueChanged(form, { name: 'A', icon: 'mdi:a', action: 'toggle', entity: 'switch.a' });
    const newSchema = controlsRows(editor)[0].querySelector('ha-form').schema;
    expect(newSchema.map((s) => s.name)).toEqual(['name', 'icon', 'action', 'entity']);
  });
});
