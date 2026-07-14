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

const MAIN_SCHEMA = [
  { name: 'title', selector: { text: {} } },
  {
    name: 'device_entities',
    type: 'expandable',
    title: 'Device entities',
    schema: [
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
      </style>
      <div class="editor">
        <div id="main-section"></div>
      </div>
    `;
    this._renderMainForm();
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
