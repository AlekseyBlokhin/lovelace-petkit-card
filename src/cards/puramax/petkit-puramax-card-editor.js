/**
 * Visual config editor for petkit-puramax-card.
 *
 * No new runtime dependency: this composes native `<ha-form>` elements
 * (globally available in the Home Assistant frontend by tag name, standard
 * practice for custom card editors — no import needed) for scalar fields.
 *
 * `ha-form`'s `expandable` schema type only groups fields visually, it does
 * NOT nest the bound data object. Since `device_entities` is nested in the
 * real config, this editor's internal working model for the main form is
 * kept FLAT (`device_entities_error`, `device_entities_last_event`,
 * `device_entities_state`) and is flattened/re-nested at the boundary
 * (`_flattenMain`/`_onMainFormChanged`) rather than binding `ha-form`
 * directly to a nested object.
 */

// `name` must exactly match this cat's value as reported by
// `device_entities.last_used_by` (e.g. the PetKit integration's "Last used
// by" sensor) -- that's how the card attributes reconstructed visits back
// to a specific cat, with no per-cat helper entity needed.
const CAT_SCHEMA = [
  { name: 'name', label: 'Name', selector: { text: {} } },
  { name: 'color', label: 'Color', selector: { text: {} } },
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
  { name: 'title', selector: { text: {} } },
  {
    name: 'device_entities',
    type: 'expandable',
    title: 'Device entities',
    schema: [
      {
        name: 'device_entities_total_use',
        label: 'Total use sensor (required)',
        selector: { entity: {} },
      },
      {
        name: 'device_entities_last_used_by',
        label: 'Last used by sensor (required if more than one cat)',
        selector: { entity: {} },
      },
      { name: 'device_entities_error', label: 'Error sensor', selector: { entity: {} } },
      { name: 'device_entities_last_event', label: 'Last event sensor', selector: { entity: {} } },
      { name: 'device_entities_state', label: 'State sensor', selector: { entity: {} } },
    ],
  },
  {
    name: 'decline_threshold_pct',
    label: 'Decline/spike alert threshold (%)',
    selector: { number: { min: 10, max: 100, mode: 'box' } },
  },
];

export class PetkitPuramaxCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
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

  _flattenMain() {
    const cfg = this._config || {};
    const de = cfg.device_entities || {};
    return {
      title: cfg.title,
      device_entities_total_use: de.total_use,
      device_entities_last_used_by: de.last_used_by,
      device_entities_error: de.error,
      device_entities_last_event: de.last_event,
      device_entities_state: de.state,
      decline_threshold_pct: cfg.decline_threshold_pct,
    };
  }

  _onMainFormChanged(flatValue) {
    const cfg = { ...this._config };
    cfg.title = flatValue.title;
    cfg.device_entities = {
      ...(cfg.device_entities || {}),
      total_use: flatValue.device_entities_total_use,
      last_used_by: flatValue.device_entities_last_used_by,
      error: flatValue.device_entities_error,
      last_event: flatValue.device_entities_last_event,
      state: flatValue.device_entities_state,
    };
    cfg.decline_threshold_pct = flatValue.decline_threshold_pct;
    this._fireConfigChanged(cfg);
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._config) return;
    this.shadowRoot.innerHTML = `
      <style>
        .editor { display: flex; flex-direction: column; gap: 16px; padding: 8px 0; }
        .section-title { font-weight: 500; margin-bottom: 4px; }
        .row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .row ha-form { flex: 1 1 auto; }
        .remove-btn, .add-btn { cursor: pointer; border: 1px solid var(--divider-color, #ccc); border-radius: 6px; background: none; padding: 6px 10px; font-size: 0.85em; }
        .remove-btn:hover, .add-btn:hover { background: var(--secondary-background-color, #eee); }
      </style>
      <div class="editor">
        <div id="main-section"></div>
        <div class="section">
          <div class="section-title">Cats</div>
          <div id="cats-rows"></div>
          <button class="add-btn" id="add-cat" type="button">+ Add cat</button>
        </div>
        <div class="section">
          <div class="section-title">Info row (status chips)</div>
          <div id="info-rows"></div>
          <button class="add-btn" id="add-info-row" type="button">+ Add chip</button>
        </div>
        <div class="section">
          <div class="section-title">Controls row (buttons)</div>
          <div id="controls-rows"></div>
          <button class="add-btn" id="add-control-row" type="button">+ Add control</button>
        </div>
      </div>
    `;
    this._renderMainForm();
    this._renderCats();
    this._renderInfoRows();
    this._renderControlsRows();
    this.shadowRoot.getElementById('add-cat').addEventListener('click', () => this._addCat());
    this.shadowRoot.getElementById('add-info-row').addEventListener('click', () => this._addInfoRow());
    this.shadowRoot.getElementById('add-control-row').addEventListener('click', () => this._addControlRow());
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

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.type = 'button';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => this._removeCat(index));

      row.appendChild(form);
      row.appendChild(removeBtn);
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

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.type = 'button';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => this._removeInfoRow(index));

      row.appendChild(form);
      row.appendChild(removeBtn);
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

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.type = 'button';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => this._removeControlRow(index));

      row.appendChild(form);
      row.appendChild(removeBtn);
      container.appendChild(row);
    });
  }

  _updateControlRow(index, newSpec) {
    const controlsRow = [...(this._config.controls_row || [])];
    const prevAction = controlsRow[index] && controlsRow[index].action;
    controlsRow[index] = newSpec;
    this._fireConfigChanged({ ...this._config, controls_row: controlsRow });
    // The action determines which sub-fields are shown; if it changed,
    // re-render this section so the row's schema picks up the new fields.
    if (newSpec.action !== prevAction) this._renderControlsRows();
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
    form.data = this._flattenMain();
    form.hass = this._hass;
    form.computeLabel = (schemaItem) => schemaItem.label || schemaItem.name;
    form.addEventListener('value-changed', (/** @type {CustomEvent} */ ev) => {
      ev.stopPropagation();
      this._onMainFormChanged(ev.detail.value);
    });
    container.appendChild(form);
  }
}

export { MAIN_SCHEMA };
