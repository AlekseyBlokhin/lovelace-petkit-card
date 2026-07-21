/**
 * Visual config editor for petkit-puramax-card.
 *
 * A `LitElement`, like the card itself: `render()` declares the whole
 * editor from `this._config`/`this._hass`/`this._detailEditor` on every
 * update, and Lit's own diffing patches only what changed. This is what
 * lets almost all of the pre-Lit version's hand-written bookkeeping be
 * deleted outright rather than ported: there's no more `_structureKey`/
 * `_updateFormsInPlace` (deciding "rebuild everything" vs "push new data
 * onto existing forms"), no more `_capturePanelExpanded`/
 * `_restorePanelExpanded` (saving/restoring `ha-expansion-panel.expanded`
 * around a rebuild), and no more `_formEls` tracking array -- Lit's own
 * re-render already reuses existing DOM nodes (and whatever local state
 * they hold, like a panel's `expanded` property) whenever the template
 * shape at a given position doesn't change, which is exactly the guarantee
 * all of that hand-written code existed to provide.
 *
 * Every mutating entry point (`setConfig`, the `hass` setter, and every
 * config-mutation method below) ends by calling `_flush()`, which forces
 * Lit's normally-async render to happen synchronously (via Lit's own public
 * `performUpdate()` -- see its doc comment: "can be done in rare cases when
 * you need to update synchronously"). This matches this editor's pre-Lit
 * behavior exactly, where the dashboard host's `config-changed`/`setConfig`
 * round-trip could always assume the DOM already reflected the latest
 * config the instant a call returned.
 *
 * Composes native Home Assistant frontend elements (globally available by
 * tag name, standard practice for custom card editors — no import needed):
 * `ha-form` for scalar fields, `ha-expansion-panel`/`ha-svg-icon` for
 * section headers (matching the "Content"/"Features"/"Interactions"
 * pattern native cards like Area Card use), `ha-sortable` for
 * drag-to-reorder, `ha-icon-button-prev` for the sub-page back button, and
 * `ha-icon-button`/`ha-icon` for row actions. `@mdi/js` is this project's
 * one real dependency besides `lit` (bundled at build time, so it costs
 * nothing at runtime) -- `ha-svg-icon`/`ha-form`'s `iconPath` schema field
 * both need real SVG path data, not an `mdi:name` string.
 *
 * All five sections ("Content", "Analytics & alerts", "Cats", "Status
 * chips", "Controls") are hand-built `ha-expansion-panel[outlined]`
 * elements, direct siblings in this editor's own shadow root -- NOT
 * `ha-form`'s built-in `type: 'expandable'` schema wrapper. That was tried
 * first, but `ha-form`'s own internal `ha-form-expandable` hardcodes its
 * OWN `--ha-card-border-radius` (8px) and its grid sub-type hardcodes a
 * fixed 24px row-gap -- neither is reachable from outside (no exposed CSS
 * part, no fallback-respecting `var()`, confirmed live), so two of five
 * "sections" always looked like a different, denser component glued
 * together with no gap, instead of five consistent cards. Building all five
 * the same way (this editor's own flex `gap`, this editor's own
 * `--ha-card-border-radius`) is what actually gets a consistent shape, not
 * a CSS override fighting a component that doesn't expose one. Each
 * section's `ha-form`(s) still bind straight to `this._config` (or, for
 * "Content"'s toggle grid, one small `ha-form` per boolean field in a plain
 * CSS grid `_content-toggles` controls the spacing/size of -- see
 * `_renderContentSection()`), so keys outside any of these schemas
 * (cats/info_row/controls_row/device_entities/unknown_cat_color) still
 * round-trip untouched via each `ha-form`'s own data merge.
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
 * `value_map`/`unknown_cat_color`: no clean `ha-form` widget
 * for an arbitrary nested condition array yet).
 */

import { LitElement, html, nothing } from 'lit';
import { mdiTextShort, mdiPaw, mdiViewGridOutline, mdiGestureTapButton, mdiChartBar, mdiDragHorizontalVariant } from '@mdi/js';
import { resolveEntityName } from '../../lib/ha-helpers.js';
import { EDITOR_STYLES } from './petkit-puramax-card-editor.styles.js';

const ICON_CONTENT = mdiTextShort;
const ICON_CATS = mdiPaw;
const ICON_CHIPS = mdiViewGridOutline;
const ICON_CONTROLS = mdiGestureTapButton;
const ICON_ANALYTICS = mdiChartBar;
const ICON_DRAG_HANDLE = mdiDragHorizontalVariant;

const computeLabel = (schemaItem) => schemaItem.label || schemaItem.name;

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

// `name`/`icon` are both optional overrides -- left unset, the card
// resolves them live from the entity itself (its own registry display name /
// icon, the same defaults any built-in card would show), so a fresh row
// never bakes the entity_id in as a fake "name". No "(optional...)" suffix
// on the label either -- overriding a default is the expected behavior of
// any unset optional field, not something that needs spelling out (no other
// HA card does this).
const INFO_ROW_SCHEMA = [
  { name: 'entity', label: 'Entity', selector: { entity: {} } },
  { name: 'name', label: 'Name', selector: { text: {} } },
  { name: 'icon', label: 'Icon', selector: { icon: {} } },
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
  { name: 'name', label: 'Name', selector: { text: {} } },
  { name: 'icon', label: 'Icon', selector: { icon: {} } },
  { name: 'tap_action', label: 'Tap action', selector: { ui_action: {} } },
  { name: 'hold_action', label: 'Hold action', selector: { ui_action: {} } },
  { name: 'double_tap_action', label: 'Double-tap action', selector: { ui_action: {} } },
];

// Outside "Content" entirely, and first -- which PetKit device this card is
// for is the first decision a new card needs, not one more row inside a
// section you have to expand first.
const DEVICE_SCHEMA = [{ name: 'device_id', label: 'PetKit device', selector: { device: { filter: { integration: 'petkit' } } } }];

const CONTENT_TITLE_SCHEMA = [{ name: 'title', label: 'Title', selector: { text: {} } }];

// Each rendered as its OWN small `ha-form` inside `_content-toggles` (a
// plain CSS grid this stylesheet controls), not `ha-form`'s own `type:
// 'grid'` sub-schema -- see the class header comment for why (that type's
// 24px row-gap is hardcoded, unreachable from outside).
const CONTENT_TOGGLE_SCHEMA = [
  { name: 'show_state', label: 'Show state', selector: { boolean: {} } },
  { name: 'show_history', label: 'Show history (visit chart)', selector: { boolean: {} } },
  { name: 'show_working_records', label: 'Show Working Records', selector: { boolean: {} } },
  { name: 'show_analytics', label: 'Show Analytics', selector: { boolean: {} } },
];

const ALERTS_SCHEMA = [
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
  // unknown_cat_color is deliberately NOT here -- YAML-only (same reasoning
  // as value_map/event_exclude/device_entities).
];

export class PetkitPuramaxCardEditor extends LitElement {
  static styles = EDITOR_STYLES;

  static properties = {
    _config: { state: true },
    _detailEditor: { state: true },
  };

  constructor() {
    super();
    // Which row is showing its full-field sub-page instead of the normal
    // multi-section list view -- `{ kind: 'info' | 'control', index }` or
    // `null`. Pure UI state, unrelated to config.
    this._detailEditor = null;
  }

  setConfig(config) {
    this._config = config || {};
    this._flush();
  }

  set hass(hass) {
    this._hass = hass;
    this._flush();
  }

  get hass() {
    return this._hass;
  }

  // Forces Lit's normally-async render to happen synchronously -- see the
  // class header comment for why.
  _flush() {
    this.requestUpdate();
    if (this.isUpdatePending) this.performUpdate();
  }

  _fireConfigChanged(newConfig) {
    this._config = newConfig;
    this._flush();
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        bubbles: true,
        composed: true,
        detail: { config: newConfig },
      }),
    );
  }

  // Primary line: the configured name, else the entity's own short registry
  // display name (matching the card's own default -- see
  // `resolveEntityName`), else the bare entity id as a last resort.
  // Secondary (muted) line: "Area → Device", the same context an entity
  // picker's own selected-value chip shows -- so a row looks the same
  // whether you're looking at the list view or its Edit sub-page's entity
  // field.
  _resolvedName(spec) {
    if (spec.name) return spec.name;
    return resolveEntityName(this._hass, spec.entity) || spec.entity || '';
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

  render() {
    if (!this._config) return nothing;
    return this._detailEditor ? this._renderDetail() : this._renderList();
  }

  // ---------- sub-page detail editor (Edit on a chip/control row) ----------

  _renderDetail() {
    const { kind, index } = this._detailEditor;
    const key = kind === 'info' ? 'info_row' : 'controls_row';
    const list = this._config[key] || [];
    const spec = list[index];
    if (!spec) {
      // The row vanished from under us (shouldn't normally happen) -- fall
      // back to the list view instead of rendering a dead sub-page. Can't
      // mutate reactive state synchronously mid-render, so this is
      // deferred a tick; the list view below is rendered directly in the
      // meantime so nothing dead shows even for that one frame.
      queueMicrotask(() => {
        this._detailEditor = null;
        this._flush();
      });
      return this._renderList();
    }
    const schema = kind === 'info' ? INFO_ROW_SCHEMA : CONTROLS_ROW_SCHEMA;
    const title = kind === 'info' ? 'Edit status chip' : 'Edit control';
    return html`
      <div class="detail-header">
        <ha-icon-button-prev @click=${() => this._closeDetail()}></ha-icon-button-prev>
        <span class="detail-title">${title}</span>
      </div>
      <div id="detail-body">
        <ha-form
          .hass=${this._hass}
          .schema=${schema}
          .data=${spec}
          .computeLabel=${computeLabel}
          @value-changed=${(ev) => {
            ev.stopPropagation();
            this._updateRowAt(kind, index, ev.detail.value);
          }}
        ></ha-form>
      </div>
    `;
  }

  _closeDetail() {
    this._detailEditor = null;
    this._flush();
    // Restore below, not deleted -- see the capture in `_openDetail()` for
    // why this one case still needs it even with Lit's diffing.
    this._restorePanelExpanded(this._capturedPanelExpanded);
    this._capturedPanelExpanded = null;
  }

  _updateRowAt(kind, index, newSpec) {
    const key = kind === 'info' ? 'info_row' : 'controls_row';
    const list = [...(this._config[key] || [])];
    list[index] = newSpec;
    this._fireConfigChanged({ ...this._config, [key]: list });
  }

  // Lit's diffing reuses existing DOM nodes (and whatever local state they
  // hold, like `ha-expansion-panel.expanded`) whenever the template SHAPE
  // at a given position doesn't change between renders -- which is true for
  // every plain config edit (add/remove/reorder/value change), and is what
  // lets the rest of this class skip the capture/restore bookkeeping the
  // pre-Lit version needed everywhere. It is NOT true here: the list view
  // and the detail sub-page are two entirely different templates at the
  // same render position, so switching between them necessarily disposes
  // the old subtree (including its `ha-expansion-panel`s) and builds a
  // fresh one -- confirmed live (headless verification caught this; no
  // existing test covered the list→detail→back round-trip specifically).
  // Capturing here (still in list view) and restoring in `_closeDetail()`
  // (right after the fresh panels exist again) is the smallest fix for
  // that one genuine exception, not a wholesale revival of the old
  // always-capture pattern.
  _capturePanelExpanded() {
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

  _openDetail(kind, index) {
    this._capturedPanelExpanded = this._capturePanelExpanded();
    this._detailEditor = { kind, index };
    this._flush();
  }

  // ---------- normal multi-section list view ----------

  _renderList() {
    const catCount = (this._config.cats || []).length;
    const infoCount = (this._config.info_row || []).length;
    const controlCount = (this._config.controls_row || []).length;
    return html`
      <div class="editor">
        <div id="main-section">${this._renderMainForm()}</div>

        ${this._renderContentSection()}
        ${this._renderAlertsSection()}

        <ha-expansion-panel outlined>
          <ha-svg-icon slot="leading-icon" .path=${ICON_CATS}></ha-svg-icon>
          <h3 slot="header">Cats (${catCount})</h3>
          <div class="panel-body">
            ${catCount === 0 ? html`<div class="empty-hint">No cats configured yet.</div>` : nothing}
            <div id="cats-rows">${this._renderCatsRows()}</div>
            <div class="add-row">
              <button class="add-btn" id="add-cat" type="button" @click=${() => this._addCat()}>
                <ha-icon icon="mdi:plus"></ha-icon>Add cat
              </button>
            </div>
          </div>
        </ha-expansion-panel>

        <ha-expansion-panel outlined>
          <ha-svg-icon slot="leading-icon" .path=${ICON_CHIPS}></ha-svg-icon>
          <h3 slot="header">Status chips (${infoCount})</h3>
          <div class="panel-body">
            ${infoCount === 0 ? html`<div class="empty-hint">No status chips configured yet.</div>` : nothing}
            <div id="info-rows">
              ${this._renderRowsList(
                'info_row',
                (i) => this._openDetail('info', i),
                (i) => this._removeInfoRow(i),
                (o, n) => this._moveInfoRow(o, n),
              )}
            </div>
            <div class="add-row-form" id="add-info-row">
              ${this._renderAddPicker('Add a status chip', (entityId) => this._addInfoRowFromEntity(entityId))}
            </div>
          </div>
        </ha-expansion-panel>

        <ha-expansion-panel outlined>
          <ha-svg-icon slot="leading-icon" .path=${ICON_CONTROLS}></ha-svg-icon>
          <h3 slot="header">Controls (${controlCount})</h3>
          <div class="panel-body">
            ${controlCount === 0 ? html`<div class="empty-hint">No control buttons configured yet.</div>` : nothing}
            <div id="controls-rows">
              ${this._renderRowsList(
                'controls_row',
                (i) => this._openDetail('control', i),
                (i) => this._removeControlRow(i),
                (o, n) => this._moveControlRow(o, n),
              )}
            </div>
            <div class="add-row-form" id="add-control-row">
              ${this._renderAddPicker('Add a control', (entityId) => this._addControlRowFromEntity(entityId))}
            </div>
          </div>
        </ha-expansion-panel>
      </div>
    `;
  }

  _dragHandleTemplate() {
    return html`
      <div class="handle">
        <ha-svg-icon .path=${ICON_DRAG_HANDLE}></ha-svg-icon>
      </div>
    `;
  }

  // Matches how HA's own settings lists act on an item -- a native icon
  // button, not a hand-styled text button.
  _iconButtonTemplate(icon, label, className, onClick) {
    return html`
      <ha-icon-button class=${className} .label=${label} @click=${onClick}>
        <ha-icon icon=${icon}></ha-icon>
      </ha-icon-button>
    `;
  }

  _renderCatsRows() {
    const cats = this._config.cats || [];
    return html`
      <ha-sortable
        handle-selector=".handle"
        @item-moved=${(ev) => {
          ev.stopPropagation();
          this._moveCat(ev.detail.oldIndex, ev.detail.newIndex);
        }}
      >
        <div>
          ${cats.map(
            (cat, index) => html`
              <div class="cat-item">
                <div class="row">
                  ${this._dragHandleTemplate()}
                  <ha-form
                    .hass=${this._hass}
                    .schema=${CAT_NAME_SCHEMA}
                    .data=${cat}
                    .computeLabel=${computeLabel}
                    @value-changed=${(ev) => {
                      ev.stopPropagation();
                      this._updateCat(index, { ...this._config.cats[index], ...ev.detail.value });
                    }}
                  ></ha-form>
                  ${this._iconButtonTemplate('mdi:delete-outline', 'Remove', 'remove-btn', () => this._removeCat(index))}
                </div>
                <ha-form
                  .hass=${this._hass}
                  .schema=${CAT_COLOR_SCHEMA}
                  .data=${cat}
                  .computeLabel=${computeLabel}
                  @value-changed=${(ev) => {
                    ev.stopPropagation();
                    this._updateCat(index, { ...this._config.cats[index], ...ev.detail.value });
                  }}
                ></ha-form>
              </div>
            `,
          )}
        </div>
      </ha-sortable>
    `;
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
  }

  _addCat() {
    const cats = [...(this._config.cats || []), { ...DEFAULT_NEW_CAT }];
    this._fireConfigChanged({ ...this._config, cats });
  }

  _removeCat(index) {
    const cats = (this._config.cats || []).filter((_cat, i) => i !== index);
    this._fireConfigChanged({ ...this._config, cats });
  }

  // ---------- info_row / controls_row: draggable summary list + Edit sub-page ----------

  _renderRowsList(key, onEdit, onRemove, onMove) {
    const rows = this._config[key] || [];
    return html`
      <ha-sortable
        handle-selector=".handle"
        @item-moved=${(ev) => {
          ev.stopPropagation();
          onMove(ev.detail.oldIndex, ev.detail.newIndex);
        }}
      >
        <div>
          ${rows.map((spec, index) => this._summaryRowTemplate(spec, () => onEdit(index), () => onRemove(index)))}
        </div>
      </ha-sortable>
    `;
  }

  // Icon: a real `ha-state-icon` (not a fixed generic default) resolves the
  // entity's own icon the same way any built-in card would -- registry
  // override, `attributes.icon`, or HA's own domain-icon table -- unless
  // `spec.icon` overrides it. Label: name/friendly_name/entity_id plus a
  // muted "Area → Device" line, matching the entity picker's own
  // selected-value chip.
  _summaryRowTemplate(spec, onEdit, onRemove) {
    const context = this._entityContext(spec.entity);
    return html`
      <div class="row summary-row">
        ${this._dragHandleTemplate()}
        <ha-state-icon
          .icon=${spec.icon || undefined}
          .stateObj=${this._hass && this._hass.states ? this._hass.states[spec.entity] : undefined}
        ></ha-state-icon>
        <div class="summary-label"><div class="summary-label-primary">${this._resolvedName(spec)}</div>${
          context ? html`<div class="summary-label-secondary">${context}</div>` : nothing
        }</div>
        ${this._iconButtonTemplate('mdi:pencil-outline', 'Edit', 'edit-btn', onEdit)}
        ${this._iconButtonTemplate('mdi:delete-outline', 'Remove', 'remove-btn', onRemove)}
      </div>
    `;
  }

  // A single always-present entity picker (not an "Add" button that first
  // inserts a blank draft row) -- picking an entity appends a fully-formed
  // row directly, the same shape as HA's own Entities Card "Add entity".
  _renderAddPicker(label, onPick) {
    return html`
      <ha-form
        .hass=${this._hass}
        .schema=${[{ name: 'entity', label, selector: { entity: {} } }]}
        .data=${{}}
        .computeLabel=${computeLabel}
        @value-changed=${(ev) => {
          ev.stopPropagation();
          const entityId = ev.detail.value.entity;
          if (entityId) onPick(entityId);
        }}
      ></ha-form>
    `;
  }

  // No `name`/`icon` baked in -- left unset, exactly like hand-writing
  // just `entity:` in YAML, so the card resolves both live from the entity.
  _addInfoRowFromEntity(entityId) {
    const infoRow = [...(this._config.info_row || []), { entity: entityId }];
    this._fireConfigChanged({ ...this._config, info_row: infoRow });
  }

  _moveInfoRow(oldIndex, newIndex) {
    const infoRow = (this._config.info_row || []).concat();
    infoRow.splice(newIndex, 0, infoRow.splice(oldIndex, 1)[0]);
    this._fireConfigChanged({ ...this._config, info_row: infoRow });
  }

  _removeInfoRow(index) {
    const infoRow = (this._config.info_row || []).filter((_spec, i) => i !== index);
    this._fireConfigChanged({ ...this._config, info_row: infoRow });
  }

  // No `name`/`icon`/`tap_action` baked in either -- an unset tap_action
  // falls back to `more-info` (see src/lib/actions.js), the same default
  // any entity gets when tapped with no explicit action configured.
  _addControlRowFromEntity(entityId) {
    const controlsRow = [...(this._config.controls_row || []), { entity: entityId }];
    this._fireConfigChanged({ ...this._config, controls_row: controlsRow });
  }

  _moveControlRow(oldIndex, newIndex) {
    const controlsRow = (this._config.controls_row || []).concat();
    controlsRow.splice(newIndex, 0, controlsRow.splice(oldIndex, 1)[0]);
    this._fireConfigChanged({ ...this._config, controls_row: controlsRow });
  }

  _removeControlRow(index) {
    const controlsRow = (this._config.controls_row || []).filter((_spec, i) => i !== index);
    this._fireConfigChanged({ ...this._config, controls_row: controlsRow });
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

  // Shared by every small per-section/per-field `ha-form` below -- each one
  // binds straight to the full config (via `_mainFormData()`) and emits it
  // back merged with just its own schema's change, same "keys outside this
  // schema round-trip untouched" behavior as any other `ha-form` here.
  _onMainFieldChanged(ev) {
    ev.stopPropagation();
    this._fireConfigChanged(ev.detail.value);
  }

  _renderMainForm() {
    return html`
      <ha-form
        .hass=${this._hass}
        .schema=${DEVICE_SCHEMA}
        .data=${this._mainFormData()}
        .computeLabel=${computeLabel}
        @value-changed=${(ev) => this._onMainFieldChanged(ev)}
      ></ha-form>
    `;
  }

  // Hand-built `ha-expansion-panel[outlined]`, a sibling of Cats/Status
  // chips/Controls below (not `ha-form`'s `type: 'expandable'`) -- see the
  // class header comment for why. The 4 show_* toggles are laid out via
  // `_content-toggles` (this stylesheet's own compact CSS grid), one small
  // `ha-form` per toggle, rather than `ha-form`'s own `type: 'grid'`
  // sub-schema, whose row-gap/field size aren't reachable from outside.
  _renderContentSection() {
    const data = this._mainFormData();
    return html`
      <ha-expansion-panel outlined id="content-panel">
        <ha-svg-icon slot="leading-icon" .path=${ICON_CONTENT}></ha-svg-icon>
        <h3 slot="header">Content</h3>
        <div class="panel-body">
          <ha-form
            .hass=${this._hass}
            .schema=${CONTENT_TITLE_SCHEMA}
            .data=${data}
            .computeLabel=${computeLabel}
            @value-changed=${(ev) => this._onMainFieldChanged(ev)}
          ></ha-form>
          <div class="content-toggles">
            ${CONTENT_TOGGLE_SCHEMA.map(
              (field) => html`
                <ha-form
                  .hass=${this._hass}
                  .schema=${[field]}
                  .data=${data}
                  .computeLabel=${computeLabel}
                  @value-changed=${(ev) => this._onMainFieldChanged(ev)}
                ></ha-form>
              `,
            )}
          </div>
        </div>
      </ha-expansion-panel>
    `;
  }

  _renderAlertsSection() {
    return html`
      <ha-expansion-panel outlined id="alerts-panel">
        <ha-svg-icon slot="leading-icon" .path=${ICON_ANALYTICS}></ha-svg-icon>
        <h3 slot="header">Analytics &amp; alerts</h3>
        <div class="panel-body">
          <ha-form
            .hass=${this._hass}
            .schema=${ALERTS_SCHEMA}
            .data=${this._mainFormData()}
            .computeLabel=${computeLabel}
            @value-changed=${(ev) => this._onMainFieldChanged(ev)}
          ></ha-form>
        </div>
      </ha-expansion-panel>
    `;
  }
}
