/**
 * Visual config editor for petkit-puramax-card.
 *
 * Composes native Home Assistant frontend elements (globally available by
 * tag name, standard practice for custom card editors — no import needed):
 * `ha-form` for scalar fields, `ha-expansion-panel`/`ha-svg-icon` for
 * section headers (matching the "Content"/"Features"/"Interactions"
 * pattern native cards like Area Card use), `ha-sortable` for
 * drag-to-reorder, `ha-icon-button-prev` for the sub-page back button, and
 * `ha-icon-button`/`ha-icon` for row actions. `@mdi/js` is this project's
 * one real dependency (bundled at build time, so it costs nothing at
 * runtime) -- `ha-svg-icon`/`ha-form`'s `iconPath` schema field both need
 * real SVG path data, not an `mdi:name` string.
 *
 * `ha-form`'s `expandable` schema type DOES nest the bound data object by
 * default -- both "Content" and "Analytics & alerts" below use
 * `flatten: true` since their fields (title/show_*, decline_threshold_pct/
 * etc.) are real top-level config keys, only visually grouped, not nested
 * under `cfg.content`/`cfg.alerts`. `device_id` sits outside "Content"
 * entirely, as its own top-level field -- picking the device is the first
 * decision a new card needs, not one more row inside a collapsed section.
 * The main form binds directly to `this._config`, so keys outside
 * MAIN_SCHEMA (cats/info_row/controls_row/device_entities/
 * unknown_cat_color) round-trip untouched via ha-form's own data merge.
 *
 * info_row/controls_row follow the same pattern as HA's own Entities Card:
 * the list view shows a draggable icon+name summary per row (Edit/Delete
 * buttons, `ha-sortable` reorder) plus a persistent "add an entity" picker
 * at the bottom -- picking an entity there appends a new row directly (no
 * separate blank draft row, and no icon/name baked in -- both stay unset so
 * the card resolves them live from the entity, exactly like leaving them
 * unset in hand-written YAML would). Clicking Edit doesn't expand the row
 * inline; it swaps the editor's entire visible content to a single
 * full-field sub-page with a back button (`_detailEditor`/
 * `_renderDetail()`), the same interaction shape as HA's real
 * `hui-sub-element-editor` (Area Card Features, Entities Card rows) --
 * that internal component isn't reliably instantiable from a third-party
 * card (it's lazily defined and its `type` enum is fixed to HA's own
 * built-in editors), so this replicates the pattern with the same stable
 * building block it itself uses (`ha-icon-button-prev`) rather than the
 * component itself.
 *
 * `controls_row`'s `tap_action`/`hold_action`/`double_tap_action` use the
 * native `ui_action` selector (the same one every built-in card's
 * interactions use) instead of a bespoke action enum -- `visibility`
 * (native card/badge condition syntax: state/numeric_state/and/or/not, see
 * `src/lib/visibility.js`) is what replaces the old special-cased
 * `toggle_maintenance` action: two ordinary buttons, each visible only in
 * one state, read by the user as a single control that changes what it
 * shows. `visibility` itself is YAML-only for now (same reasoning as
 * `value_map`/`event_labels`/`unknown_cat_color`: no clean `ha-form` widget
 * for an arbitrary nested condition array yet).
 */

import { mdiTextShort, mdiPaw, mdiViewGridOutline, mdiGestureTapButton, mdiChartBar, mdiDragHorizontalVariant } from '@mdi/js';

const ICON_CONTENT = mdiTextShort;
const ICON_CATS = mdiPaw;
const ICON_CHIPS = mdiViewGridOutline;
const ICON_CONTROLS = mdiGestureTapButton;
const ICON_ANALYTICS = mdiChartBar;
const ICON_DRAG_HANDLE = mdiDragHorizontalVariant;

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

// `value_map` (mapping a raw entity state to a display string) has no clean
// ha-form widget for an arbitrary object-of-strings, so it stays YAML-only
// for v1 (documented in the README) and is intentionally left out here.
//
// `name`/`icon` are both optional overrides -- left unset, the card
// resolves them live from the entity itself (its own friendly name / icon,
// the same defaults any built-in card would show), so a fresh row never
// bakes the entity_id in as a fake "name".
const INFO_ROW_SCHEMA = [
  { name: 'entity', label: 'Entity', selector: { entity: {} } },
  { name: 'name', label: "Name (optional — overrides the entity's own name)", selector: { text: {} } },
  { name: 'icon', label: "Icon (optional — overrides the entity's own icon)", selector: { icon: {} } },
  { name: 'unit', label: 'Unit', selector: { text: {} } },
  { name: 'warn_below', label: 'Warn below', selector: { number: { mode: 'box' } } },
  { name: 'warn_above', label: 'Warn above', selector: { number: { mode: 'box' } } },
  { name: 'warn_state', label: 'Warn state', selector: { text: {} } },
];

// `tap_action`/`hold_action`/`double_tap_action` use the native `ui_action`
// selector -- the same vocabulary (perform-action/toggle/navigate/url/
// more-info/none, with a native `confirmation` dialog) every built-in
// card's interactions use, instead of a bespoke `action` enum. There's no
// more `toggle_maintenance`-style special case: a device with a
// start/exit-button pair (or any other "only makes sense in state X" case)
// is just two ordinary rows, each with its own `visibility` -- see the
// class header comment and `src/lib/visibility.js`. `visibility` is
// YAML-only for now (no clean `ha-form` widget yet for an arbitrary nested
// condition array), so it isn't listed here, but it round-trips untouched
// via the same "keys outside this schema pass through" behavior every
// other YAML-only field already relies on.
const CONTROLS_ROW_SCHEMA = [
  { name: 'entity', label: 'Entity', selector: { entity: {} } },
  { name: 'name', label: "Name (optional — overrides the entity's own name)", selector: { text: {} } },
  { name: 'icon', label: "Icon (optional — overrides the entity's own icon)", selector: { icon: {} } },
  { name: 'tap_action', label: 'Tap action', selector: { ui_action: {} } },
  { name: 'hold_action', label: 'Hold action', selector: { ui_action: {} } },
  { name: 'double_tap_action', label: 'Double-tap action', selector: { ui_action: {} } },
];

const MAIN_SCHEMA = [
  // Outside "Content" entirely, and first -- which PetKit device this card
  // is for is the first decision a new card needs, not one more row inside
  // a section you have to expand first.
  { name: 'device_id', label: 'PetKit device', selector: { device: { filter: { integration: 'petkit' } } } },
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
      {
        // A nameless `grid` group is pure layout (no data-nesting effect,
        // same as the cats name/color grid used to be) -- lays the 4
        // toggles out 2-per-row instead of each taking a full-width row,
        // which was a lot of dead vertical space for a plain on/off value.
        type: 'grid',
        schema: [
          { name: 'show_state', label: 'Show state', selector: { boolean: {} } },
          { name: 'show_history', label: 'Show history (visit chart)', selector: { boolean: {} } },
          { name: 'show_working_records', label: 'Show Working Records', selector: { boolean: {} } },
          { name: 'show_analytics', label: 'Show Analytics', selector: { boolean: {} } },
        ],
      },
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
      // unknown_cat_color is deliberately NOT here -- YAML-only (same
      // reasoning as value_map/event_labels/event_exclude/device_entities).
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

  // Row counts fingerprint whether the config changed *structurally*. A
  // value-only edit keeps the same fingerprint -- see `setConfig()`, which
  // skips the full rebuild in that case so `ha-expansion-panel`s don't
  // lose their open/closed state on every keystroke's round-trip through
  // the dashboard host.
  _structureKey(config) {
    return JSON.stringify({
      cats: (config.cats || []).length,
      info_row: (config.info_row || []).length,
      controls_row: (config.controls_row || []).length,
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
    (this._infoRowRefs || []).forEach((ref, i) => this._refreshRowRef(ref, infoRows[i]));
    const controlsRows = this._config.controls_row || [];
    (this._controlRowRefs || []).forEach((ref, i) => this._refreshRowRef(ref, controlsRows[i]));
  }

  // A summary row has no input to lose focus from, so it's always safe to
  // just refresh its icon/label in place. info_row and controls_row rows
  // are both entity-based now (no more per-kind fallback needed).
  _refreshRowRef(ref, spec) {
    if (!ref || !spec) return;
    if (ref.labelEl) this._fillSummaryLabel(ref.labelEl, spec);
    if (ref.iconEl) {
      ref.iconEl.icon = spec.icon || undefined;
      ref.iconEl.stateObj = this._hass && this._hass.states ? this._hass.states[spec.entity] : undefined;
    }
  }

  // Primary line: the configured name, else the entity's own live friendly
  // name, else the bare entity id as a last resort. Secondary (muted) line:
  // "Area → Device", the same context an entity picker's own selected-value
  // chip shows -- so a row looks the same whether you're looking at the
  // list view or its Edit sub-page's entity field.
  _fillSummaryLabel(container, spec) {
    container.innerHTML = '';
    const primary = document.createElement('div');
    primary.className = 'summary-label-primary';
    primary.textContent = this._resolvedName(spec);
    container.appendChild(primary);
    const context = this._entityContext(spec.entity);
    if (context) {
      const secondary = document.createElement('div');
      secondary.className = 'summary-label-secondary';
      secondary.textContent = context;
      container.appendChild(secondary);
    }
  }

  _resolvedName(spec) {
    if (spec.name) return spec.name;
    const stateObj = this._hass && this._hass.states ? this._hass.states[spec.entity] : null;
    return (stateObj && stateObj.attributes && stateObj.attributes.friendly_name) || spec.entity || '';
  }

  _entityContext(entityId) {
    const hass = this._hass;
    if (!hass || !entityId || !hass.entities) return null;
    const entry = hass.entities[entityId];
    if (!entry) return null;
    const device = entry.device_id && hass.devices ? hass.devices[entry.device_id] : null;
    const areaId = entry.area_id || (device && device.area_id);
    const area = areaId && hass.areas ? hass.areas[areaId] : null;
    const deviceName = device && (device.name_by_user || device.name);
    const areaName = area && area.name;
    if (areaName && deviceName) return `${areaName} → ${deviceName}`;
    return areaName || deviceName || null;
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
    const schema = kind === 'info' ? INFO_ROW_SCHEMA : CONTROLS_ROW_SCHEMA;
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
    list[index] = newSpec;
    this._fireConfigChanged({ ...this._config, [key]: list });
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
        /* No border-radius override here -- ha-form's own internal
           "Content"/"Analytics & alerts" expandable groups render their
           own ha-expansion-panel with HA's default corner radius; an
           override on ONLY these editor-owned panels (Cats/Status chips/
           Controls) can't reach inside ha-form's shadow DOM to match it,
           so it's left at the native default everywhere for a consistent
           look across all five sections. */
        ha-expansion-panel { --expansion-panel-summary-padding: 0 16px; }
        ha-expansion-panel h3[slot="header"] { margin: 0; font-size: 1em; font-weight: 500; }
        ha-svg-icon[slot="leading-icon"] { color: var(--secondary-text-color); }
        .panel-body { display: flex; flex-direction: column; gap: 4px; padding: 4px 16px 16px; }
        .row { display: flex; align-items: center; gap: 4px; }
        .row ha-form { flex: 1 1 auto; min-width: 0; }
        .handle { display: flex; cursor: grab; color: var(--secondary-text-color); flex: 0 0 auto; touch-action: none; }
        .handle:active { cursor: grabbing; }
        .summary-row { padding: 0 4px; }
        .summary-row ha-state-icon { color: var(--secondary-text-color); flex: 0 0 auto; }
        .summary-label { flex: 1 1 auto; min-width: 0; }
        .summary-label-primary { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--primary-text-color); }
        .summary-label-secondary { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--secondary-text-color); font-size: 0.85em; }
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

  // No `name`/`icon` baked in -- left unset, exactly like hand-writing
  // just `entity:` in YAML, so the card resolves both live from the entity.
  _addInfoRowFromEntity(entityId) {
    const infoRow = [...(this._config.info_row || []), { entity: entityId }];
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
        onEdit: () => this._openDetail('control', index),
        onRemove: () => this._removeControlRow(index),
      });
      this._controlRowRefs[index] = ref;
      list.appendChild(el);
    });
    container.appendChild(sortable);
  }

  // No `name`/`icon`/`tap_action` baked in either -- an unset tap_action
  // falls back to `more-info` (see src/lib/actions.js), the same default
  // any entity gets when tapped with no explicit action configured.
  _addControlRowFromEntity(entityId) {
    const controlsRow = [...(this._config.controls_row || []), { entity: entityId }];
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

  // Icon: a real `ha-state-icon` (not a fixed generic default) resolves the
  // entity's own icon the same way any built-in card would -- registry
  // override, `attributes.icon`, or HA's own domain-icon table -- unless
  // `spec.icon` overrides it. Label: name/friendly_name/entity_id plus a
  // muted "Area → Device" line, matching the entity picker's own
  // selected-value chip (see `_fillSummaryLabel`).
  _buildSummaryRow({ spec, onEdit, onRemove }) {
    const row = document.createElement('div');
    row.className = 'row summary-row';
    row.appendChild(this._dragHandle());
    const icon = /** @type {any} */ (document.createElement('ha-state-icon'));
    icon.icon = spec.icon || undefined;
    icon.stateObj = this._hass && this._hass.states ? this._hass.states[spec.entity] : undefined;
    const label = document.createElement('div');
    label.className = 'summary-label';
    this._fillSummaryLabel(label, spec);
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
