/**
 * Visual config editor for petkit-puramax-card.
 *
 * No new runtime dependency: this composes native Home Assistant frontend
 * elements (globally available by tag name, standard practice for custom
 * card editors — no import needed): `ha-form` for scalar fields,
 * `ha-expansion-panel` to group each repeating-row section the way HA's own
 * settings pages group lists, and `ha-icon-button`/`ha-icon` for row
 * actions instead of plain text buttons.
 *
 * `ha-form`'s `expandable` schema type DOES nest the bound data object by
 * default -- a group named e.g. `device_entities` reads/writes its
 * sub-fields against `data.device_entities`, matching this card's real
 * config shape exactly, so the main form binds directly to `this._config`
 * with no manual flatten/reconstruct step. `flatten: true` is the opt-out
 * for a group with no real backing object -- used below for `alerts`,
 * which is a purely visual grouping over otherwise-top-level config keys
 * (`decline_threshold_pct` etc. aren't actually nested under `cfg.alerts`).
 */

// `name` must exactly match this cat's value as reported by
// `device_entities.last_used_by` (e.g. the PetKit integration's "Last used
// by" sensor) -- that's how the card attributes reconstructed visits back
// to a specific cat, with no per-cat helper entity needed.
//
// `color` uses the native `ui_color` selector (a real HA color-picker
// widget, not a hand-rolled swatch) rather than a plain hex-text field.
// Wrapped in a nameless `grid` group so `ha-form` lays the two fields out
// side-by-side instead of stacking them -- a nameless grid entry has no
// data-nesting effect (see the MAIN_SCHEMA comment below), it's pure layout.
const CAT_SCHEMA = [
  {
    type: 'grid',
    schema: [
      { name: 'name', label: 'Name', selector: { text: {} } },
      { name: 'color', label: 'Color', selector: { ui_color: {} } },
    ],
  },
];

const DEFAULT_NEW_CAT = { name: '', color: '#4fc3f7' };

// `value_map` (mapping a raw entity state to a display string) has no clean
// ha-form widget for an arbitrary object-of-strings, so it stays YAML-only
// for v1 (documented in the README) and is intentionally left out here.
const INFO_ROW_SCHEMA = [
  { name: 'entity', label: 'Entity', selector: { entity: {} } },
  { name: 'name', label: 'Name', selector: { text: {} } },
  { name: 'icon', label: 'Icon', selector: { icon: {} } },
  { name: 'unit', label: 'Unit', selector: { text: {} } },
  { name: 'warn_below', label: 'Warn below', selector: { number: { mode: 'box' } } },
  { name: 'warn_above', label: 'Warn above', selector: { number: { mode: 'box' } } },
  { name: 'warn_state', label: 'Warn state', selector: { text: {} } },
];

const DEFAULT_NEW_INFO_ROW = { entity: '', name: '', icon: 'mdi:information-outline' };

const CONTROL_ACTIONS = ['press', 'toggle_maintenance', 'toggle', 'more_info'];

const CONTROLS_ROW_BASE_SCHEMA = [
  { name: 'name', label: 'Name', selector: { text: {} } },
  { name: 'icon', label: 'Icon', selector: { icon: {} } },
  { name: 'action', label: 'Action', selector: { select: { options: CONTROL_ACTIONS, mode: 'dropdown' } } },
];

// Only the sub-fields relevant to a row's current `action` are shown, so
// picking e.g. "press" doesn't clutter the row with toggle_maintenance's
// start/exit/state entity fields.
const CONTROLS_ROW_ACTION_SCHEMA = {
  press: [
    { name: 'entity', label: 'Entity', selector: { entity: {} } },
    { name: 'confirm', label: 'Confirm text (optional)', selector: { text: {} } },
  ],
  toggle: [{ name: 'entity', label: 'Entity', selector: { entity: {} } }],
  more_info: [{ name: 'entity', label: 'Entity', selector: { entity: {} } }],
  toggle_maintenance: [
    { name: 'start_entity', label: 'Start entity', selector: { entity: { domain: 'button' } } },
    { name: 'exit_entity', label: 'Exit entity', selector: { entity: { domain: 'button' } } },
    { name: 'state_entity', label: 'State entity (optional)', selector: { entity: {} } },
  ],
};

function controlsRowSchema(action) {
  return [...CONTROLS_ROW_BASE_SCHEMA, ...(CONTROLS_ROW_ACTION_SCHEMA[action] || [])];
}

const DEFAULT_NEW_CONTROL_ROW = { name: '', icon: 'mdi:gesture-tap-button', action: 'press', entity: '' };

const MAIN_SCHEMA = [
  {
    name: 'device_id',
    label: 'PetKit device (auto-detects the sensors below)',
    selector: { device: { filter: { integration: 'petkit' } } },
  },
  { name: 'title', label: 'Title', selector: { text: {} } },
  {
    name: 'device_entities',
    type: 'expandable',
    title: 'Device entities (overrides)',
    schema: [
      {
        name: 'total_use',
        label: 'Total use sensor (required unless a device is selected above)',
        selector: { entity: {} },
      },
      {
        name: 'last_used_by',
        label: 'Last used by sensor (required if more than one cat, unless auto-detected)',
        selector: { entity: {} },
      },
      { name: 'error', label: 'Error sensor (auto-detected, or override)', selector: { entity: {} } },
      { name: 'last_event', label: 'Last event sensor (auto-detected, or override)', selector: { entity: {} } },
      { name: 'state', label: 'State sensor (auto-detected, or override)', selector: { entity: {} } },
    ],
  },
  {
    name: 'alerts',
    type: 'expandable',
    // No real `cfg.alerts` object -- these are top-level config keys, only
    // visually grouped here. Without `flatten`, ha-form would look for a
    // (nonexistent) nested `data.alerts` object and nothing would preselect.
    flatten: true,
    title: 'Analytics & alerts',
    schema: [
      {
        name: 'decline_threshold_pct',
        label: 'Decline/spike alert threshold (%)',
        selector: { number: { min: 10, max: 100, mode: 'box' } },
      },
      {
        name: 'no_visit_alert_hours',
        label: 'Warn if no visit in (hours)',
        selector: { number: { min: 1, max: 168, mode: 'box' } },
      },
      {
        name: 'notify_service',
        label: 'Push a notification too (optional)',
        selector: { entity: { domain: 'notify' } },
      },
      {
        name: 'unknown_cat_color',
        label: 'Unidentified-visit color (chart & analytics)',
        selector: { ui_color: {} },
      },
    ],
  },
];

export class PetkitPuramaxCardEditor extends HTMLElement {
  // The dashboard host calls `setConfig()` again on every `config-changed`
  // round-trip we ourselves fire -- i.e. on every value edit, not just when
  // a genuinely different card config is assigned. A full `_render()` there
  // would rebuild every `ha-expansion-panel` from scratch on every
  // keystroke's round-trip, collapsing them back closed each time. Only do
  // that full rebuild when the config's *structure* actually changed (a row
  // was added/removed, or a controls_row action changed its visible
  // sub-fields); otherwise just push the new data onto the existing forms.
  setConfig(config) {
    const newConfig = config || {};
    const needsFullRender = !this.shadowRoot || this._structureKey(newConfig) !== this._lastStructureKey;
    this._config = newConfig;
    if (needsFullRender) {
      this._render();
    } else {
      this._updateFormsInPlace();
    }
  }

  // `hass` is re-set constantly -- on essentially every state change
  // anywhere in the whole HA instance, not just when this card's own
  // entities change -- so a full `_render()` (innerHTML rebuild) here would
  // tear down and recreate every `ha-form`/`<input>` on practically every
  // keystroke the user makes elsewhere in the dialog, which stole focus and
  // reset the dialog's scroll position to the top after each character
  // typed. Propagate the new `hass` onto the already-built forms in place
  // instead; only `setConfig`/row add-remove (genuine structural changes)
  // rebuild the DOM.
  set hass(hass) {
    this._hass = hass;
    (this._formEls || []).forEach((form) => {
      form.hass = hass;
    });
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    this._render();
  }

  _fireConfigChanged(newConfig) {
    this._config = newConfig;
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        bubbles: true,
        composed: true,
        detail: { config: newConfig },
      }),
    );
  }

  // Row counts (plus each controls_row entry's `action`, since that
  // determines which sub-fields are visible) fingerprint whether the config
  // changed *structurally*. A value-only edit keeps the same fingerprint --
  // see `setConfig()`, which skips the full rebuild in that case so
  // `ha-expansion-panel`s don't lose their open/closed state on every
  // keystroke's round-trip through the dashboard host.
  _structureKey(config) {
    return JSON.stringify({
      cats: (config.cats || []).length,
      info_row: (config.info_row || []).length,
      controls_row: (config.controls_row || []).map((c) => (c && c.action) || null),
    });
  }

  _capturePanelExpanded() {
    if (!this.shadowRoot) return null;
    const panels = /** @type {any} */ (this.shadowRoot.querySelectorAll('ha-expansion-panel'));
    return panels.length ? Array.from(panels).map((p) => /** @type {any} */ (p).expanded) : null;
  }

  _restorePanelExpanded(prevExpanded) {
    if (!prevExpanded) return;
    const panels = /** @type {any} */ (this.shadowRoot.querySelectorAll('ha-expansion-panel'));
    panels.forEach((/** @type {any} */ panel, i) => {
      if (prevExpanded[i] !== undefined) panel.expanded = prevExpanded[i];
    });
  }

  // Pushes updated data onto already-built form nodes in place, the same
  // no-rebuild approach the `hass` setter above already uses -- for the
  // common case of a plain value edit (add/remove still goes through a full
  // `_render()`, since section counts genuinely changed).
  _updateFormsInPlace() {
    if (this._mainForm) this._mainForm.data = this._config;
    const cats = this._config.cats || [];
    (this._catForms || []).forEach((form, i) => {
      if (cats[i]) form.data = cats[i];
    });
    const infoRows = this._config.info_row || [];
    (this._infoForms || []).forEach((form, i) => {
      if (infoRows[i]) form.data = infoRows[i];
    });
    const controlsRows = this._config.controls_row || [];
    (this._controlForms || []).forEach((form, i) => {
      if (controlsRows[i]) form.data = controlsRows[i];
    });
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._config) return;
    const prevExpanded = this._capturePanelExpanded();
    this._formEls = [];
    this._catForms = [];
    this._infoForms = [];
    this._controlForms = [];
    const catCount = (this._config.cats || []).length;
    const infoCount = (this._config.info_row || []).length;
    const controlCount = (this._config.controls_row || []).length;
    this.shadowRoot.innerHTML = `
      <style>
        .editor { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
        ha-expansion-panel { --expansion-panel-summary-padding: 0 16px; border-radius: var(--ha-card-border-radius, 12px); }
        .panel-body { display: flex; flex-direction: column; gap: 4px; padding: 4px 16px 16px; }
        .row { display: flex; align-items: center; gap: 4px; }
        .row ha-form { flex: 1 1 auto; min-width: 0; }
        .add-row { display: flex; justify-content: flex-start; margin-top: 4px; }
        .add-btn {
          display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
          border: 1px solid var(--divider-color, #ccc); border-radius: 8px;
          background: none; color: var(--primary-color); padding: 8px 14px;
          font-size: 0.85em; font-weight: 500; font-family: inherit;
        }
        .add-btn:hover { background: rgba(var(--rgb-primary-color, 3,169,244), 0.08); }
        .add-btn:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
        .empty-hint { color: var(--secondary-text-color); font-size: 0.85em; padding: 4px 0 8px; }
      </style>
      <div class="editor">
        <div id="main-section"></div>

        <ha-expansion-panel outlined header="Cats (${catCount})">
          <div class="panel-body">
            ${catCount === 0 ? '<div class="empty-hint">No cats configured yet.</div>' : ''}
            <div id="cats-rows"></div>
            <div class="add-row">
              <button class="add-btn" id="add-cat" type="button">
                <ha-icon icon="mdi:plus"></ha-icon>Add cat
              </button>
            </div>
          </div>
        </ha-expansion-panel>

        <ha-expansion-panel outlined header="Status chips (${infoCount})">
          <div class="panel-body">
            ${infoCount === 0 ? '<div class="empty-hint">No status chips configured yet.</div>' : ''}
            <div id="info-rows"></div>
            <div class="add-row">
              <button class="add-btn" id="add-info-row" type="button">
                <ha-icon icon="mdi:plus"></ha-icon>Add chip
              </button>
            </div>
          </div>
        </ha-expansion-panel>

        <ha-expansion-panel outlined header="Controls (${controlCount})">
          <div class="panel-body">
            ${controlCount === 0 ? '<div class="empty-hint">No control buttons configured yet.</div>' : ''}
            <div id="controls-rows"></div>
            <div class="add-row">
              <button class="add-btn" id="add-control-row" type="button">
                <ha-icon icon="mdi:plus"></ha-icon>Add control
              </button>
            </div>
          </div>
        </ha-expansion-panel>
      </div>
    `;
    this._renderMainForm();
    this._renderCats();
    this._renderInfoRows();
    this._renderControlsRows();
    this._restorePanelExpanded(prevExpanded);
    this._lastStructureKey = this._structureKey(this._config);
    this.shadowRoot.getElementById('add-cat').addEventListener('click', () => this._addCat());
    this.shadowRoot.getElementById('add-info-row').addEventListener('click', () => this._addInfoRow());
    this.shadowRoot.getElementById('add-control-row').addEventListener('click', () => this._addControlRow());
  }

  // Builds a row's trailing "remove" affordance as a native icon button
  // (matching how HA's own settings lists remove an item) instead of a
  // hand-styled text button.
  _removeIconButton(onClick) {
    const btn = /** @type {any} */ (document.createElement('ha-icon-button'));
    btn.className = 'remove-btn';
    btn.label = 'Remove';
    const icon = document.createElement('ha-icon');
    icon.setAttribute('icon', 'mdi:delete-outline');
    btn.appendChild(icon);
    btn.addEventListener('click', onClick);
    return btn;
  }

  _renderCats() {
    const container = this.shadowRoot.getElementById('cats-rows');
    container.innerHTML = '';
    const cats = this._config.cats || [];
    cats.forEach((cat, index) => {
      const row = document.createElement('div');
      row.className = 'row';
      row.dataset.index = String(index);

      const form = /** @type {any} */ (document.createElement('ha-form'));
      form.schema = CAT_SCHEMA;
      form.data = cat;
      form.hass = this._hass;
      form.computeLabel = (schemaItem) => schemaItem.label || schemaItem.name;
      form.addEventListener('value-changed', (/** @type {CustomEvent} */ ev) => {
        ev.stopPropagation();
        this._updateCat(index, ev.detail.value);
      });
      this._formEls.push(form);
      this._catForms.push(form);

      row.appendChild(form);
      row.appendChild(this._removeIconButton(() => this._removeCat(index)));
      container.appendChild(row);
    });
  }

  _updateCat(index, newCat) {
    const cats = [...(this._config.cats || [])];
    cats[index] = newCat;
    this._fireConfigChanged({ ...this._config, cats });
  }

  _addCat() {
    const cats = [...(this._config.cats || []), { ...DEFAULT_NEW_CAT }];
    this._fireConfigChanged({ ...this._config, cats });
    this._render();
  }

  _removeCat(index) {
    const cats = (this._config.cats || []).filter((_cat, i) => i !== index);
    this._fireConfigChanged({ ...this._config, cats });
    this._render();
  }

  _renderInfoRows() {
    const container = this.shadowRoot.getElementById('info-rows');
    container.innerHTML = '';
    const rows = this._config.info_row || [];
    rows.forEach((spec, index) => {
      const row = document.createElement('div');
      row.className = 'row';
      row.dataset.index = String(index);

      const form = /** @type {any} */ (document.createElement('ha-form'));
      form.schema = INFO_ROW_SCHEMA;
      form.data = spec;
      form.hass = this._hass;
      form.computeLabel = (schemaItem) => schemaItem.label || schemaItem.name;
      form.addEventListener('value-changed', (/** @type {CustomEvent} */ ev) => {
        ev.stopPropagation();
        this._updateInfoRow(index, ev.detail.value);
      });
      this._formEls.push(form);
      this._infoForms.push(form);

      row.appendChild(form);
      row.appendChild(this._removeIconButton(() => this._removeInfoRow(index)));
      container.appendChild(row);
    });
  }

  _updateInfoRow(index, newSpec) {
    const infoRow = [...(this._config.info_row || [])];
    infoRow[index] = newSpec;
    this._fireConfigChanged({ ...this._config, info_row: infoRow });
  }

  _addInfoRow() {
    const infoRow = [...(this._config.info_row || []), { ...DEFAULT_NEW_INFO_ROW }];
    this._fireConfigChanged({ ...this._config, info_row: infoRow });
    this._render();
  }

  _removeInfoRow(index) {
    const infoRow = (this._config.info_row || []).filter((_spec, i) => i !== index);
    this._fireConfigChanged({ ...this._config, info_row: infoRow });
    this._render();
  }

  _renderControlsRows() {
    const container = this.shadowRoot.getElementById('controls-rows');
    container.innerHTML = '';
    this._controlForms = [];
    const rows = this._config.controls_row || [];
    rows.forEach((spec, index) => {
      const row = document.createElement('div');
      row.className = 'row';
      row.dataset.index = String(index);

      const form = /** @type {any} */ (document.createElement('ha-form'));
      form.schema = controlsRowSchema(spec.action);
      form.data = spec;
      form.hass = this._hass;
      form.computeLabel = (schemaItem) => schemaItem.label || schemaItem.name;
      form.addEventListener('value-changed', (/** @type {CustomEvent} */ ev) => {
        ev.stopPropagation();
        this._updateControlRow(index, ev.detail.value);
      });
      this._formEls.push(form);
      this._controlForms.push(form);

      row.appendChild(form);
      row.appendChild(this._removeIconButton(() => this._removeControlRow(index)));
      container.appendChild(row);
    });
  }

  _updateControlRow(index, newSpec) {
    const controlsRow = [...(this._config.controls_row || [])];
    const prevAction = controlsRow[index] && controlsRow[index].action;
    controlsRow[index] = newSpec;
    this._fireConfigChanged({ ...this._config, controls_row: controlsRow });
    // The action determines which sub-fields are shown; if it changed,
    // re-render this section so the row's schema picks up the new fields,
    // and refresh the structure fingerprint so the dashboard host's echoed
    // setConfig() (which will carry this same action) doesn't also trigger
    // a redundant full-editor rebuild right behind this partial one.
    if (newSpec.action !== prevAction) {
      this._renderControlsRows();
      this._lastStructureKey = this._structureKey(this._config);
    }
  }

  _addControlRow() {
    const controlsRow = [...(this._config.controls_row || []), { ...DEFAULT_NEW_CONTROL_ROW }];
    this._fireConfigChanged({ ...this._config, controls_row: controlsRow });
    this._render();
  }

  _removeControlRow(index) {
    const controlsRow = (this._config.controls_row || []).filter((_spec, i) => i !== index);
    this._fireConfigChanged({ ...this._config, controls_row: controlsRow });
    this._render();
  }

  _renderMainForm() {
    const container = this.shadowRoot.getElementById('main-section');
    // `ha-form` is a Home Assistant frontend element, not in any published
    // DOM type — its properties are set dynamically, hence the `any` cast.
    const form = /** @type {any} */ (document.createElement('ha-form'));
    form.schema = MAIN_SCHEMA;
    // Bound directly to the full config -- `ha-form` nests `device_entities`
    // and reads/writes `alerts` (flattened) correctly on its own (see the
    // class header comment). Keys outside MAIN_SCHEMA (cats/info_row/
    // controls_row) round-trip untouched via ha-form's own data merge.
    form.data = this._config;
    form.hass = this._hass;
    form.computeLabel = (schemaItem) => schemaItem.label || schemaItem.name;
    form.addEventListener('value-changed', (/** @type {CustomEvent} */ ev) => {
      ev.stopPropagation();
      this._fireConfigChanged(ev.detail.value);
    });
    this._formEls.push(form);
    this._mainForm = form;
    container.appendChild(form);
  }
}

export { MAIN_SCHEMA };
