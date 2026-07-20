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
 * default -- a group named e.g. `alerts` (flattened here, see below) reads/
 * writes its sub-fields against `data.alerts` unless `flatten: true` opts
 * out. The main form binds directly to `this._config`, so keys outside
 * MAIN_SCHEMA (cats/info_row/controls_row/device_entities) round-trip
 * untouched via ha-form's own data merge -- `device_entities` is
 * deliberately NOT in MAIN_SCHEMA (YAML/code-editor only, see the README),
 * so this works the same way as any other unlisted key.
 *
 * `info_row`/`controls_row` rows follow the same collapsed-by-default
 * pattern as HA's own "Entities" card editor: a brand-new row shows only an
 * entity picker; once an entity is set it collapses to a one-line icon+name
 * summary with an Edit (pencil) button that reveals the full field set, and
 * a Done (check) button that folds it back. This is UI-only state
 * (`_expandedInfoRows`/`_expandedControlRows`, index-keyed `Set`s) --
 * unrelated to `_structureKey`, which only decides whether the *host's*
 * echoed `setConfig()` round-trip needs a full DOM rebuild.
 */

// `name` must exactly match this cat's value as reported by
// `device_entities.last_used_by` (e.g. the PetKit integration's "Last used
// by" sensor) -- that's how the card attributes reconstructed visits back
// to a specific cat, with no per-cat helper entity needed.
const CAT_NAME_SCHEMA = [{ name: 'name', label: 'Name', selector: { text: {} } }];

// `color` uses the native `ui_color` selector (a real HA color-picker
// widget, not a hand-rolled swatch). Kept in its own ha-form (not a `grid`
// alongside name) so the Delete button always sits next to Name -- a single
// grid-schema form wraps to two lines on narrow widths, which used to leave
// Delete visually stranded between Name and Color once Color wrapped below.
const CAT_COLOR_SCHEMA = [{ name: 'color', label: 'Color', selector: { ui_color: {} } }];

const DEFAULT_NEW_CAT = { name: '', color: '#4fc3f7' };

// Shown only until an entity is picked (see `_buildInfoRow`) -- the rest of
// info_row's fields (name/icon/unit/warn_*) only appear once you click Edit
// on the resulting summary row.
const INFO_ROW_MINIMAL_SCHEMA = [{ name: 'entity', label: 'Entity', selector: { entity: {} } }];

const DEFAULT_INFO_ICON = 'mdi:information-outline';

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

const DEFAULT_NEW_INFO_ROW = { entity: '', name: '', icon: DEFAULT_INFO_ICON };

const CONTROL_ACTIONS = ['press', 'toggle_maintenance', 'toggle', 'more_info'];

// Shown only until a primary entity is picked (see `_buildControlRow`) --
// same reasoning as INFO_ROW_MINIMAL_SCHEMA. `toggle_maintenance` rows (the
// one action with no plain `entity` field) can only be reached via Edit on
// an already-summarized row, same as picking any other non-default action.
const CONTROLS_ROW_MINIMAL_SCHEMA = [{ name: 'entity', label: 'Entity', selector: { entity: {} } }];

const DEFAULT_CONTROL_ICON = 'mdi:gesture-tap-button';

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

const DEFAULT_NEW_CONTROL_ROW = { name: '', icon: DEFAULT_CONTROL_ICON, action: 'press', entity: '' };

function hasInfoEntity(spec) {
  return !!(spec && spec.entity);
}

// `toggle_maintenance` has no plain `entity` field -- `start_entity` is its
// primary target, so a row configured that way still counts as "set" and
// collapses to a summary instead of being stuck showing the minimal
// entity-only picker forever.
function hasControlPrimary(spec) {
  return !!(spec && (spec.entity || spec.start_entity));
}

// Keeps expanded-row UI state (a `Set` of indices) correct after a row is
// deleted: everything after the removed index shifts down by one, and the
// removed index itself (if present) is dropped.
function reindexAfterRemoval(set, removedIndex) {
  const next = new Set();
  set.forEach((i) => {
    if (i < removedIndex) next.add(i);
    else if (i > removedIndex) next.add(i - 1);
  });
  return next;
}

const MAIN_SCHEMA = [
  { name: 'title', label: 'Title', selector: { text: {} } },
  {
    name: 'device_id',
    label: 'PetKit device',
    selector: { device: { filter: { integration: 'petkit' } } },
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
  constructor() {
    super();
    // Which info_row/controls_row indices are showing their full field set
    // instead of the collapsed icon+name summary -- pure UI state, not part
    // of config, so it survives `setConfig()` round-trips untouched.
    this._expandedInfoRows = new Set();
    this._expandedControlRows = new Set();
  }

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

  // Pushes updated data onto already-built form/summary nodes in place, the
  // same no-rebuild approach the `hass` setter above already uses -- for
  // the common case of a plain value edit (add/remove, and an info/controls
  // row changing mode, still go through a full render).
  _updateFormsInPlace() {
    if (this._mainForm) this._mainForm.data = this._config;
    const cats = this._config.cats || [];
    (this._catNameForms || []).forEach((form, i) => {
      if (cats[i]) form.data = cats[i];
    });
    (this._catColorForms || []).forEach((form, i) => {
      if (cats[i]) form.data = cats[i];
    });
    const infoRows = this._config.info_row || [];
    (this._infoRowRefs || []).forEach((ref, i) => this._refreshRowRef(ref, infoRows[i], 'info'));
    const controlsRows = this._config.controls_row || [];
    (this._controlRowRefs || []).forEach((ref, i) => this._refreshRowRef(ref, controlsRows[i], 'control'));
  }

  // A summary row has no input to lose focus from, so it's always safe to
  // just refresh its text/icon in place; a minimal/full row's live ha-form
  // gets its data pushed the same way the rest of this editor already does.
  _refreshRowRef(ref, spec, kind) {
    if (!ref || !spec) return;
    if (ref.form) ref.form.data = spec;
    if (ref.labelEl) ref.labelEl.textContent = this._summaryLabel(spec, kind);
    if (ref.iconEl) ref.iconEl.setAttribute('icon', this._summaryIcon(spec, kind));
  }

  _summaryLabel(spec, kind) {
    if (spec.name) return spec.name;
    if (kind === 'info') return spec.entity || '';
    return spec.entity || spec.start_entity || spec.action || '';
  }

  _summaryIcon(spec, kind) {
    return spec.icon || (kind === 'info' ? DEFAULT_INFO_ICON : DEFAULT_CONTROL_ICON);
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._config) return;
    const prevExpanded = this._capturePanelExpanded();
    this._formEls = [];
    this._catNameForms = [];
    this._catColorForms = [];
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
        .summary-row { padding: 0 4px; }
        .summary-row ha-icon { color: var(--secondary-text-color); flex: 0 0 auto; }
        .summary-label {
          flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; color: var(--primary-text-color);
        }
        #cats-rows { display: flex; flex-direction: column; gap: 12px; }
        .cat-item { display: flex; flex-direction: column; gap: 4px; }
        #info-rows, #controls-rows { display: flex; flex-direction: column; gap: 4px; }
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

  // Trailing row affordances as native icon buttons (matching how HA's own
  // settings lists act on an item) instead of hand-styled text buttons.
  _iconButton(icon, label, className, onClick) {
    const btn = /** @type {any} */ (document.createElement('ha-icon-button'));
    btn.className = className;
    btn.label = label;
    const iconEl = document.createElement('ha-icon');
    iconEl.setAttribute('icon', icon);
    btn.appendChild(iconEl);
    btn.addEventListener('click', onClick);
    return btn;
  }

  _removeIconButton(onClick) {
    return this._iconButton('mdi:delete-outline', 'Remove', 'remove-btn', onClick);
  }

  _editIconButton(onClick) {
    return this._iconButton('mdi:pencil-outline', 'Edit', 'edit-btn', onClick);
  }

  _collapseIconButton(onClick) {
    return this._iconButton('mdi:check', 'Done', 'collapse-btn', onClick);
  }

  _renderCats() {
    const container = this.shadowRoot.getElementById('cats-rows');
    container.innerHTML = '';
    const cats = this._config.cats || [];
    cats.forEach((cat, index) => {
      const item = document.createElement('div');
      item.className = 'cat-item';
      item.dataset.index = String(index);

      const nameRow = document.createElement('div');
      nameRow.className = 'row';
      const nameForm = /** @type {any} */ (document.createElement('ha-form'));
      nameForm.schema = CAT_NAME_SCHEMA;
      nameForm.data = cat;
      nameForm.hass = this._hass;
      nameForm.computeLabel = (schemaItem) => schemaItem.label || schemaItem.name;
      nameForm.addEventListener('value-changed', (/** @type {CustomEvent} */ ev) => {
        ev.stopPropagation();
        this._updateCat(index, { ...this._config.cats[index], ...ev.detail.value });
      });
      this._formEls.push(nameForm);
      this._catNameForms.push(nameForm);
      nameRow.appendChild(nameForm);
      nameRow.appendChild(this._removeIconButton(() => this._removeCat(index)));

      const colorForm = /** @type {any} */ (document.createElement('ha-form'));
      colorForm.schema = CAT_COLOR_SCHEMA;
      colorForm.data = cat;
      colorForm.hass = this._hass;
      colorForm.computeLabel = (schemaItem) => schemaItem.label || schemaItem.name;
      colorForm.addEventListener('value-changed', (/** @type {CustomEvent} */ ev) => {
        ev.stopPropagation();
        this._updateCat(index, { ...this._config.cats[index], ...ev.detail.value });
      });
      this._formEls.push(colorForm);
      this._catColorForms.push(colorForm);

      item.appendChild(nameRow);
      item.appendChild(colorForm);
      container.appendChild(item);
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

  // ---------- info_row: minimal (pick entity) -> summary -> full (Edit) ----------

  _renderInfoRows() {
    const container = this.shadowRoot.getElementById('info-rows');
    container.innerHTML = '';
    this._infoRowRefs = [];
    const rows = this._config.info_row || [];
    rows.forEach((spec, index) => {
      const { el, ref } = this._buildInfoRow(spec, index);
      this._infoRowRefs[index] = ref;
      container.appendChild(el);
    });
  }

  _buildInfoRow(spec, index) {
    if (!hasInfoEntity(spec)) {
      return this._buildMinimalRow({
        schema: INFO_ROW_MINIMAL_SCHEMA,
        spec,
        onChange: (value) => {
          this._updateInfoRow(index, { ...spec, ...value });
          this._renderInfoRows();
        },
        onRemove: () => this._removeInfoRow(index),
      });
    }
    if (this._expandedInfoRows.has(index)) {
      return this._buildFullRow({
        schema: INFO_ROW_SCHEMA,
        spec,
        onChange: (value) => this._updateInfoRow(index, value),
        onCollapse: () => {
          this._expandedInfoRows.delete(index);
          this._renderInfoRows();
        },
        onRemove: () => this._removeInfoRow(index),
      });
    }
    return this._buildSummaryRow({
      spec,
      kind: 'info',
      onEdit: () => {
        this._expandedInfoRows.add(index);
        this._renderInfoRows();
      },
      onRemove: () => this._removeInfoRow(index),
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
    this._expandedInfoRows = reindexAfterRemoval(this._expandedInfoRows, index);
    this._fireConfigChanged({ ...this._config, info_row: infoRow });
    this._render();
  }

  // ---------- controls_row: minimal (pick entity) -> summary -> full (Edit) ----------

  _renderControlsRows() {
    const container = this.shadowRoot.getElementById('controls-rows');
    container.innerHTML = '';
    this._controlRowRefs = [];
    const rows = this._config.controls_row || [];
    rows.forEach((spec, index) => {
      const { el, ref } = this._buildControlRow(spec, index);
      this._controlRowRefs[index] = ref;
      container.appendChild(el);
    });
  }

  _buildControlRow(spec, index) {
    if (!hasControlPrimary(spec)) {
      return this._buildMinimalRow({
        schema: CONTROLS_ROW_MINIMAL_SCHEMA,
        spec,
        onChange: (value) => {
          this._updateControlRow(index, { ...spec, ...value });
          this._renderControlsRows();
        },
        onRemove: () => this._removeControlRow(index),
      });
    }
    if (this._expandedControlRows.has(index)) {
      return this._buildFullRow({
        schema: controlsRowSchema(spec.action),
        spec,
        onChange: (value) => this._updateControlRow(index, value),
        onCollapse: () => {
          this._expandedControlRows.delete(index);
          this._renderControlsRows();
        },
        onRemove: () => this._removeControlRow(index),
      });
    }
    return this._buildSummaryRow({
      spec,
      kind: 'control',
      onEdit: () => {
        this._expandedControlRows.add(index);
        this._renderControlsRows();
      },
      onRemove: () => this._removeControlRow(index),
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
    this._expandedControlRows = reindexAfterRemoval(this._expandedControlRows, index);
    this._fireConfigChanged({ ...this._config, controls_row: controlsRow });
    this._render();
  }

  // ---------- shared row builders (info_row + controls_row) ----------

  _buildMinimalRow({ schema, spec, onChange, onRemove }) {
    const row = document.createElement('div');
    row.className = 'row';
    const form = /** @type {any} */ (document.createElement('ha-form'));
    form.schema = schema;
    form.data = spec;
    form.hass = this._hass;
    form.computeLabel = (schemaItem) => schemaItem.label || schemaItem.name;
    form.addEventListener('value-changed', (/** @type {CustomEvent} */ ev) => {
      ev.stopPropagation();
      onChange(ev.detail.value);
    });
    this._formEls.push(form);
    row.appendChild(form);
    row.appendChild(this._removeIconButton(onRemove));
    return { el: row, ref: { mode: 'minimal', form } };
  }

  _buildFullRow({ schema, spec, onChange, onCollapse, onRemove }) {
    const row = document.createElement('div');
    row.className = 'row';
    const form = /** @type {any} */ (document.createElement('ha-form'));
    form.schema = schema;
    form.data = spec;
    form.hass = this._hass;
    form.computeLabel = (schemaItem) => schemaItem.label || schemaItem.name;
    form.addEventListener('value-changed', (/** @type {CustomEvent} */ ev) => {
      ev.stopPropagation();
      onChange(ev.detail.value);
    });
    this._formEls.push(form);
    row.appendChild(form);
    row.appendChild(this._collapseIconButton(onCollapse));
    row.appendChild(this._removeIconButton(onRemove));
    return { el: row, ref: { mode: 'full', form } };
  }

  _buildSummaryRow({ spec, kind, onEdit, onRemove }) {
    const row = document.createElement('div');
    row.className = 'row summary-row';
    const icon = document.createElement('ha-icon');
    icon.setAttribute('icon', this._summaryIcon(spec, kind));
    const label = document.createElement('span');
    label.className = 'summary-label';
    label.textContent = this._summaryLabel(spec, kind);
    row.appendChild(icon);
    row.appendChild(label);
    row.appendChild(this._editIconButton(onEdit));
    row.appendChild(this._removeIconButton(onRemove));
    return { el: row, ref: { mode: 'summary', iconEl: icon, labelEl: label } };
  }

  _renderMainForm() {
    const container = this.shadowRoot.getElementById('main-section');
    // `ha-form` is a Home Assistant frontend element, not in any published
    // DOM type — its properties are set dynamically, hence the `any` cast.
    const form = /** @type {any} */ (document.createElement('ha-form'));
    form.schema = MAIN_SCHEMA;
    // Bound directly to the full config -- `ha-form` reads/writes `alerts`
    // (flattened) correctly on its own (see the class header comment). Keys
    // outside MAIN_SCHEMA (cats/info_row/controls_row/device_entities)
    // round-trip untouched via ha-form's own data merge.
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
