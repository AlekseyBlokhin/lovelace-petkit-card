/**
 * Visual config editor for petkit-puramax-card.
 *
 * No new runtime dependency: this composes native Home Assistant frontend
 * elements (globally available by tag name, standard practice for custom
 * card editors — no import needed): `ha-form` for scalar fields,
 * `ha-expansion-panel`/`ha-svg-icon` for section headers (matching the
 * "Content"/"Features"/"Interactions" pattern native cards like Area Card
 * use), `ha-sortable` for drag-to-reorder, `ha-icon-button-prev` for the
 * sub-page back button, and `ha-icon-button`/`ha-icon` for row actions.
 *
 * The 5 `ICON_*` constants below are raw SVG path data copied from
 * `@mdi/js` (MIT) rather than taken on as an npm dependency, to keep this
 * project's zero-runtime-dependency build -- `ha-svg-icon`/`ha-form`'s
 * `iconPath` schema field both need a path string, not an `mdi:name`
 * string (unlike the plain `<ha-icon icon="mdi:...">` used elsewhere here).
 *
 * `ha-form`'s `expandable` schema type DOES nest the bound data object by
 * default -- both "Content" and "Analytics & alerts" below use
 * `flatten: true` since their fields (title/device_id/show_*,
 * decline_threshold_pct/etc.) are real top-level config keys, only
 * visually grouped, not nested under `cfg.content`/`cfg.alerts`. The main
 * form binds directly to `this._config`, so keys outside MAIN_SCHEMA
 * (cats/info_row/controls_row/device_entities) round-trip untouched via
 * ha-form's own data merge.
 *
 * info_row/controls_row follow the same pattern as HA's own Entities Card:
 * the list view shows a draggable icon+name summary per row (Edit/Delete
 * buttons, `ha-sortable` reorder) plus a persistent "add an entity" picker
 * at the bottom -- picking an entity there appends a new row directly (no
 * separate blank draft row). Clicking Edit doesn't expand the row inline;
 * it swaps the editor's entire visible content to a single full-field
 * sub-page with a back button (`_detailEditor`/`_renderDetail()`), the same
 * interaction shape as HA's real `hui-sub-element-editor` (Area Card
 * Features, Entities Card rows) -- that internal component isn't reliably
 * instantiable from a third-party card (it's lazily defined and its `type`
 * enum is fixed to HA's own built-in editors), so this replicates the
 * pattern with the same stable building block it itself uses
 * (`ha-icon-button-prev`) rather than the component itself.
 */

// Raw @mdi/js path data -- see the class-level comment for why these are
// inlined instead of an `@mdi/js` dependency.
const ICON_CONTENT = 'M4,9H20V11H4V9M4,13H14V15H4V13Z'; // mdiTextShort
const ICON_CATS =
  'M8.35,3C9.53,2.83 10.78,4.12 11.14,5.9C11.5,7.67 10.85,9.25 9.67,9.43C8.5,9.61 7.24,8.32 6.87,6.54C6.5,4.77 7.17,3.19 8.35,3M15.5,3C16.69,3.19 17.35,4.77 17,6.54C16.62,8.32 15.37,9.61 14.19,9.43C13,9.25 12.35,7.67 12.72,5.9C13.08,4.12 14.33,2.83 15.5,3M3,7.6C4.14,7.11 5.69,8 6.5,9.55C7.26,11.13 7,12.79 5.87,13.28C4.74,13.77 3.2,12.89 2.41,11.32C1.62,9.75 1.9,8.08 3,7.6M21,7.6C22.1,8.08 22.38,9.75 21.59,11.32C20.8,12.89 19.26,13.77 18.13,13.28C17,12.79 16.74,11.13 17.5,9.55C18.31,8 19.86,7.11 21,7.6M19.33,18.38C19.37,19.32 18.65,20.36 17.79,20.75C16,21.57 13.88,19.87 11.89,19.87C9.9,19.87 7.76,21.64 6,20.75C5,20.26 4.31,18.96 4.44,17.88C4.62,16.39 6.41,15.59 7.47,14.5C8.88,13.09 9.88,10.44 11.89,10.44C13.89,10.44 14.95,13.05 16.3,14.5C17.41,15.72 19.26,16.75 19.33,18.38Z'; // mdiPaw
const ICON_CHIPS =
  'M3 11H11V3H3M5 5H9V9H5M13 21H21V13H13M15 15H19V19H15M3 21H11V13H3M5 15H9V19H5M13 3V11H21V3M19 9H15V5H19Z'; // mdiViewGridOutline
const ICON_CONTROLS =
  'M13 5C15.21 5 17 6.79 17 9C17 10.5 16.2 11.77 15 12.46V11.24C15.61 10.69 16 9.89 16 9C16 7.34 14.66 6 13 6S10 7.34 10 9C10 9.89 10.39 10.69 11 11.24V12.46C9.8 11.77 9 10.5 9 9C9 6.79 10.79 5 13 5M20 20.5C19.97 21.32 19.32 21.97 18.5 22H13C12.62 22 12.26 21.85 12 21.57L8 17.37L8.74 16.6C8.93 16.39 9.2 16.28 9.5 16.28H9.7L12 18V9C12 8.45 12.45 8 13 8S14 8.45 14 9V13.47L15.21 13.6L19.15 15.79C19.68 16.03 20 16.56 20 17.14V20.5M20 2H4C2.9 2 2 2.9 2 4V12C2 13.11 2.9 14 4 14H8V12L4 12L4 4H20L20 12H18V14H20V13.96L20.04 14C21.13 14 22 13.09 22 12V4C22 2.9 21.11 2 20 2Z'; // mdiGestureTapButton
const ICON_ANALYTICS = 'M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z'; // mdiChartBar
const ICON_DRAG_HANDLE = 'M21 11H3V9H21V11M21 13H3V15H21V13Z'; // mdiDragHorizontalVariant

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

// "My Cat"/"blue" rather than an "Example ..."/hex placeholder: a fresh row
// is meant to look like a real (if generic) starting point, not a fill-in-
// the-blank template, and `blue` reads directly off HA's own color picker
// instead of an opaque hex code -- see src/lib/color.js for how a named
// palette color like this resolves to real CSS at render time.
const DEFAULT_NEW_CAT = { name: 'My Cat', color: 'blue' };

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

const CONTROL_ACTIONS = ['press', 'toggle_maintenance', 'toggle', 'more_info'];

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

// `toggle_maintenance` has no plain `entity` field -- `start_entity` is its
// primary target, so a row configured that way still counts as "set" and
// is shown as a normal summary row rather than looking unconfigured.
function controlPrimaryEntity(spec) {
  return (spec && (spec.entity || spec.start_entity)) || '';
}

const MAIN_SCHEMA = [
  {
    name: 'content',
    type: 'expandable',
    // No real `cfg.content` object -- these are top-level config keys, only
    // visually grouped here (same reasoning as `alerts` below).
    flatten: true,
    title: 'Content',
    iconPath: ICON_CONTENT,
    schema: [
      { name: 'title', label: 'Title', selector: { text: {} } },
      { name: 'device_id', label: 'PetKit device', selector: { device: { filter: { integration: 'petkit' } } } },
      { name: 'show_state', label: 'Show state', selector: { boolean: {} } },
      { name: 'show_history', label: 'Show history (visit chart)', selector: { boolean: {} } },
      { name: 'show_working_records', label: 'Show Working Records', selector: { boolean: {} } },
      { name: 'show_analytics', label: 'Show Analytics', selector: { boolean: {} } },
    ],
  },
  {
    name: 'alerts',
    type: 'expandable',
    flatten: true,
    title: 'Analytics & alerts',
    iconPath: ICON_ANALYTICS,
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
    // Which row is showing its full-field sub-page instead of the normal
    // multi-section list view -- `{ kind: 'info' | 'control', index }` or
    // `null`. Pure UI state, unrelated to config.
    this._detailEditor = null;
  }

  // The dashboard host calls `setConfig()` again on every `config-changed`
  // round-trip we ourselves fire -- i.e. on every value edit, not just when
  // a genuinely different card config is assigned. A full `_render()` there
  // would rebuild every `ha-expansion-panel`/`ha-form` from scratch on
  // every keystroke's round-trip, collapsing panels and stealing focus.
  // Only do that full rebuild when the config's *structure* actually
  // changed (a row was added/removed, or a controls_row action changed its
  // visible sub-fields); otherwise just push the new data onto the
  // existing forms.
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
  // the common case of a plain value edit (add/remove/reorder, and Edit/
  // Done navigation, still go through a full render).
  _updateFormsInPlace() {
    if (this._detailEditor) {
      const { kind, index } = this._detailEditor;
      const list = this._config[kind === 'info' ? 'info_row' : 'controls_row'] || [];
      if (this._detailForm && list[index]) this._detailForm.data = list[index];
      return;
    }
    if (this._mainForm) this._mainForm.data = this._mainFormData();
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
  // just refresh its text/icon in place.
  _refreshRowRef(ref, spec, kind) {
    if (!ref || !spec) return;
    if (ref.labelEl) ref.labelEl.textContent = this._summaryLabel(spec, kind);
    if (ref.iconEl) ref.iconEl.setAttribute('icon', spec.icon || (kind === 'info' ? DEFAULT_INFO_ICON : DEFAULT_CONTROL_ICON));
  }

  _summaryLabel(spec, kind) {
    if (spec.name) return spec.name;
    if (kind === 'info') return spec.entity || '';
    return controlPrimaryEntity(spec) || spec.action || '';
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._config) return;
    this._formEls = [];
    if (this._detailEditor) {
      this._renderDetail();
    } else {
      this._renderList();
    }
  }

  // ---------- sub-page detail editor (Edit on a chip/control row) ----------

  _renderDetail() {
    const { kind, index } = this._detailEditor;
    const key = kind === 'info' ? 'info_row' : 'controls_row';
    const list = this._config[key] || [];
    const spec = list[index];
    if (!spec) {
      // The row vanished from under us (shouldn't normally happen) -- fall
      // back to the list view instead of rendering a dead sub-page.
      this._detailEditor = null;
      this._renderList();
      return;
    }
    const schema = kind === 'info' ? INFO_ROW_SCHEMA : controlsRowSchema(spec.action);
    const title = kind === 'info' ? 'Edit status chip' : 'Edit control';
    this.shadowRoot.innerHTML = `
      <style>
        .detail-header { display: flex; align-items: center; gap: 8px; padding: 4px 0 12px; }
        .detail-title { font-size: 1.1em; font-weight: 500; color: var(--primary-text-color); }
      </style>
      <div class="detail-header">
        <ha-icon-button-prev></ha-icon-button-prev>
        <span class="detail-title">${title}</span>
      </div>
      <div id="detail-body"></div>
    `;
    this.shadowRoot
      .querySelector('ha-icon-button-prev')
      .addEventListener('click', () => this._closeDetail());

    const form = /** @type {any} */ (document.createElement('ha-form'));
    form.schema = schema;
    form.data = spec;
    form.hass = this._hass;
    form.computeLabel = (schemaItem) => schemaItem.label || schemaItem.name;
    form.addEventListener('value-changed', (/** @type {CustomEvent} */ ev) => {
      ev.stopPropagation();
      this._updateRowAt(kind, index, ev.detail.value);
    });
    this._formEls.push(form);
    this._detailForm = form;
    this.shadowRoot.getElementById('detail-body').appendChild(form);
  }

  _closeDetail() {
    this._detailEditor = null;
    this._render();
  }

  _updateRowAt(kind, index, newSpec) {
    const key = kind === 'info' ? 'info_row' : 'controls_row';
    const list = [...(this._config[key] || [])];
    const prevAction = kind === 'control' ? list[index] && list[index].action : null;
    list[index] = newSpec;
    this._fireConfigChanged({ ...this._config, [key]: list });
    // The action determines which sub-fields are shown; if it changed, the
    // sub-page's own form needs a genuinely different schema right away
    // (can't wait for the host's echoed setConfig(), which only pushes
    // `.data` in place onto the existing form). Refresh the structure
    // fingerprint too, so that echoed round-trip (carrying this same
    // action) doesn't also trigger a redundant full-editor rebuild right
    // behind this one.
    if (kind === 'control' && newSpec.action !== prevAction) {
      this._renderDetail();
      this._lastStructureKey = this._structureKey(this._config);
    }
  }

  // ---------- normal multi-section list view ----------

  _renderList() {
    const prevExpanded = this._capturePanelExpanded();
    this._catNameForms = [];
    this._catColorForms = [];
    const catCount = (this._config.cats || []).length;
    const infoCount = (this._config.info_row || []).length;
    const controlCount = (this._config.controls_row || []).length;
    this.shadowRoot.innerHTML = `
      <style>
        .editor { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
        ha-expansion-panel { --expansion-panel-summary-padding: 0 16px; border-radius: var(--ha-card-border-radius, 12px); }
        ha-expansion-panel h3[slot="header"] { margin: 0; font-size: 1em; font-weight: 500; }
        ha-svg-icon[slot="leading-icon"] { color: var(--secondary-text-color); }
        .panel-body { display: flex; flex-direction: column; gap: 4px; padding: 4px 16px 16px; }
        .row { display: flex; align-items: center; gap: 4px; }
        .row ha-form { flex: 1 1 auto; min-width: 0; }
        .handle { display: flex; cursor: grab; color: var(--secondary-text-color); flex: 0 0 auto; touch-action: none; }
        .handle:active { cursor: grabbing; }
        .summary-row { padding: 0 4px; }
        .summary-row ha-icon { color: var(--secondary-text-color); flex: 0 0 auto; }
        .summary-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--primary-text-color); }
        #cats-rows { display: flex; flex-direction: column; gap: 12px; }
        .cat-item { display: flex; flex-direction: column; gap: 4px; }
        #info-rows, #controls-rows { display: flex; flex-direction: column; gap: 4px; margin-bottom: 4px; }
        .add-row-form ha-form { display: block; }
        .empty-hint { color: var(--secondary-text-color); font-size: 0.85em; padding: 4px 0 8px; }
        .add-row { display: flex; justify-content: flex-start; margin-top: 4px; }
        .add-btn {
          display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
          border: 1px solid var(--divider-color, #ccc); border-radius: 8px;
          background: none; color: var(--primary-color); padding: 8px 14px;
          font-size: 0.85em; font-weight: 500; font-family: inherit;
        }
        .add-btn:hover { background: rgba(var(--rgb-primary-color, 3,169,244), 0.08); }
        .add-btn:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
      </style>
      <div class="editor">
        <div id="main-section"></div>

        <ha-expansion-panel outlined>
          <ha-svg-icon slot="leading-icon" id="cats-icon"></ha-svg-icon>
          <h3 slot="header">Cats (${catCount})</h3>
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

        <ha-expansion-panel outlined>
          <ha-svg-icon slot="leading-icon" id="chips-icon"></ha-svg-icon>
          <h3 slot="header">Status chips (${infoCount})</h3>
          <div class="panel-body">
            ${infoCount === 0 ? '<div class="empty-hint">No status chips configured yet.</div>' : ''}
            <div id="info-rows"></div>
            <div class="add-row-form" id="add-info-row"></div>
          </div>
        </ha-expansion-panel>

        <ha-expansion-panel outlined>
          <ha-svg-icon slot="leading-icon" id="controls-icon"></ha-svg-icon>
          <h3 slot="header">Controls (${controlCount})</h3>
          <div class="panel-body">
            ${controlCount === 0 ? '<div class="empty-hint">No control buttons configured yet.</div>' : ''}
            <div id="controls-rows"></div>
            <div class="add-row-form" id="add-control-row"></div>
          </div>
        </ha-expansion-panel>
      </div>
    `;
    // `ha-svg-icon`'s `path` is a JS property (SVG path data), not settable
    // as a plain HTML attribute in the template string above.
    (/** @type {any} */ (this.shadowRoot.getElementById('cats-icon'))).path = ICON_CATS;
    (/** @type {any} */ (this.shadowRoot.getElementById('chips-icon'))).path = ICON_CHIPS;
    (/** @type {any} */ (this.shadowRoot.getElementById('controls-icon'))).path = ICON_CONTROLS;

    this._renderMainForm();
    this._renderCats();
    this._renderInfoRows();
    this._renderControlsRows();
    this._renderAddPicker('add-info-row', 'Add a status chip', (entityId) => this._addInfoRowFromEntity(entityId));
    this._renderAddPicker('add-control-row', 'Add a control', (entityId) => this._addControlRowFromEntity(entityId));
    this.shadowRoot.getElementById('add-cat').addEventListener('click', () => this._addCat());
    this._restorePanelExpanded(prevExpanded);
    this._lastStructureKey = this._structureKey(this._config);
  }

  // Builds a row's trailing "remove"/"edit" affordance as a native icon
  // button (matching how HA's own settings lists act on an item) instead of
  // a hand-styled text button.
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

  _dragHandle() {
    const handle = document.createElement('div');
    handle.className = 'handle';
    const icon = /** @type {any} */ (document.createElement('ha-svg-icon'));
    icon.path = ICON_DRAG_HANDLE;
    handle.appendChild(icon);
    return handle;
  }

  // `ha-sortable` wraps exactly one child container and reorders that
  // container's children by drag; `handle-selector` restricts drag
  // initiation to `.handle` elements so it never fights with clicking a
  // row's own Edit/Delete buttons.
  _createSortableList(onMoved) {
    const sortable = /** @type {any} */ (document.createElement('ha-sortable'));
    sortable.setAttribute('handle-selector', '.handle');
    sortable.addEventListener('item-moved', (/** @type {CustomEvent} */ ev) => {
      ev.stopPropagation();
      onMoved(ev.detail.oldIndex, ev.detail.newIndex);
    });
    const list = document.createElement('div');
    sortable.appendChild(list);
    return { sortable, list };
  }

  _renderCats() {
    const container = this.shadowRoot.getElementById('cats-rows');
    container.innerHTML = '';
    const cats = this._config.cats || [];
    const { sortable, list } = this._createSortableList((oldIndex, newIndex) => this._moveCat(oldIndex, newIndex));
    cats.forEach((cat, index) => {
      const item = document.createElement('div');
      item.className = 'cat-item';

      const nameRow = document.createElement('div');
      nameRow.className = 'row';
      nameRow.appendChild(this._dragHandle());
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
      list.appendChild(item);
    });
    container.appendChild(sortable);
  }

  _updateCat(index, newCat) {
    const cats = [...(this._config.cats || [])];
    cats[index] = newCat;
    this._fireConfigChanged({ ...this._config, cats });
  }

  _moveCat(oldIndex, newIndex) {
    const cats = (this._config.cats || []).concat();
    cats.splice(newIndex, 0, cats.splice(oldIndex, 1)[0]);
    this._fireConfigChanged({ ...this._config, cats });
    this._render();
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

  // ---------- info_row / controls_row: draggable summary list + Edit sub-page ----------

  _renderInfoRows() {
    const container = this.shadowRoot.getElementById('info-rows');
    container.innerHTML = '';
    this._infoRowRefs = [];
    const rows = this._config.info_row || [];
    const { sortable, list } = this._createSortableList((oldIndex, newIndex) => this._moveInfoRow(oldIndex, newIndex));
    rows.forEach((spec, index) => {
      const { el, ref } = this._buildSummaryRow({
        spec,
        kind: 'info',
        onEdit: () => this._openDetail('info', index),
        onRemove: () => this._removeInfoRow(index),
      });
      this._infoRowRefs[index] = ref;
      list.appendChild(el);
    });
    container.appendChild(sortable);
  }

  _openDetail(kind, index) {
    this._detailEditor = { kind, index };
    this._render();
  }

  _addInfoRowFromEntity(entityId) {
    const infoRow = [...(this._config.info_row || []), { entity: entityId, name: '', icon: this._defaultIconFor(entityId, DEFAULT_INFO_ICON) }];
    this._fireConfigChanged({ ...this._config, info_row: infoRow });
    this._render();
  }

  _moveInfoRow(oldIndex, newIndex) {
    const infoRow = (this._config.info_row || []).concat();
    infoRow.splice(newIndex, 0, infoRow.splice(oldIndex, 1)[0]);
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
    this._controlRowRefs = [];
    const rows = this._config.controls_row || [];
    const { sortable, list } = this._createSortableList((oldIndex, newIndex) => this._moveControlRow(oldIndex, newIndex));
    rows.forEach((spec, index) => {
      const { el, ref } = this._buildSummaryRow({
        spec,
        kind: 'control',
        onEdit: () => this._openDetail('control', index),
        onRemove: () => this._removeControlRow(index),
      });
      this._controlRowRefs[index] = ref;
      list.appendChild(el);
    });
    container.appendChild(sortable);
  }

  _addControlRowFromEntity(entityId) {
    const controlsRow = [
      ...(this._config.controls_row || []),
      { entity: entityId, name: '', icon: this._defaultIconFor(entityId, DEFAULT_CONTROL_ICON), action: 'press' },
    ];
    this._fireConfigChanged({ ...this._config, controls_row: controlsRow });
    this._render();
  }

  _moveControlRow(oldIndex, newIndex) {
    const controlsRow = (this._config.controls_row || []).concat();
    controlsRow.splice(newIndex, 0, controlsRow.splice(oldIndex, 1)[0]);
    this._fireConfigChanged({ ...this._config, controls_row: controlsRow });
    this._render();
  }

  _removeControlRow(index) {
    const controlsRow = (this._config.controls_row || []).filter((_spec, i) => i !== index);
    this._fireConfigChanged({ ...this._config, controls_row: controlsRow });
    this._render();
  }

  // Picking an entity in HA is the strongest, most universally-available
  // signal for "what icon does this represent" -- most integrations set an
  // explicit icon on their entities (PetKit's own entities do). Falls back
  // to this section's generic default rather than leaving it unset, since
  // the card itself falls back the same way if `icon` is ever missing.
  _defaultIconFor(entityId, fallback) {
    const stateObj = this._hass && this._hass.states && this._hass.states[entityId];
    return (stateObj && stateObj.attributes && stateObj.attributes.icon) || fallback;
  }

  _buildSummaryRow({ spec, kind, onEdit, onRemove }) {
    const row = document.createElement('div');
    row.className = 'row summary-row';
    row.appendChild(this._dragHandle());
    const icon = document.createElement('ha-icon');
    icon.setAttribute('icon', spec.icon || (kind === 'info' ? DEFAULT_INFO_ICON : DEFAULT_CONTROL_ICON));
    const label = document.createElement('span');
    label.className = 'summary-label';
    label.textContent = this._summaryLabel(spec, kind);
    row.appendChild(icon);
    row.appendChild(label);
    row.appendChild(this._editIconButton(onEdit));
    row.appendChild(this._removeIconButton(onRemove));
    return { el: row, ref: { iconEl: icon, labelEl: label } };
  }

  // A single always-present entity picker (not an "Add" button that first
  // inserts a blank draft row) -- picking an entity appends a fully-formed
  // row directly, the same shape as HA's own Entities Card "Add entity".
  _renderAddPicker(containerId, label, onPick) {
    const container = this.shadowRoot.getElementById(containerId);
    const form = /** @type {any} */ (document.createElement('ha-form'));
    form.schema = [{ name: 'entity', label, selector: { entity: {} } }];
    form.data = {};
    form.hass = this._hass;
    form.computeLabel = (schemaItem) => schemaItem.label || schemaItem.name;
    form.addEventListener('value-changed', (/** @type {CustomEvent} */ ev) => {
      ev.stopPropagation();
      const entityId = ev.detail.value.entity;
      if (entityId) onPick(entityId);
    });
    this._formEls.push(form);
    container.appendChild(form);
  }

  // The `show_*` toggles default to true when absent from config (the card
  // shows every section unless explicitly turned off) -- but a boolean
  // selector with no value bound to it renders as an unchecked/"off"
  // toggle, which would show every toggle off on a config that (correctly)
  // renders everything. Filling in the effective true/false explicitly here
  // keeps what the editor displays honest; it doesn't touch `this._config`
  // itself, only what's handed to the form, so it costs nothing until the
  // user actually changes something in this form (at which point ha-form's
  // own merged value-changed payload naturally bakes in whichever of these
  // were showing, same as any other field).
  _mainFormData() {
    const cfg = this._config;
    return {
      ...cfg,
      show_state: cfg.show_state !== false,
      show_history: cfg.show_history !== false,
      show_working_records: cfg.show_working_records !== false,
      show_analytics: cfg.show_analytics !== false,
    };
  }

  _renderMainForm() {
    const container = this.shadowRoot.getElementById('main-section');
    // `ha-form` is a Home Assistant frontend element, not in any published
    // DOM type — its properties are set dynamically, hence the `any` cast.
    const form = /** @type {any} */ (document.createElement('ha-form'));
    form.schema = MAIN_SCHEMA;
    // Keys outside MAIN_SCHEMA (cats/info_row/controls_row/device_entities)
    // round-trip untouched via ha-form's own data merge; `content`/`alerts`
    // are read/written correctly on their own since both are `flatten`.
    form.data = this._mainFormData();
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
