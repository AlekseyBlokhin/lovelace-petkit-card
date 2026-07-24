import { LitElement, html, svg, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { formatDuration, formatHoursAgo } from '../../lib/format.js';
import { dayBounds, dayLabel, dayKey } from '../../lib/day.js';
import {
  buildHistoryRequest,
  deltaEvents,
  catChangeEvents,
  attributeCats,
  dedupeFlickerRepeats,
  expandConfirmedRepeats,
  UNKNOWN_CAT_LABEL,
} from '../../lib/history.js';
import { niceStep, buildScales, buildGridLines } from '../../lib/chart-math.js';
import { bucketByDay, summarize, detectAnomaly, detectNoVisitAlert, perCatMap } from '../../lib/analytics.js';
import { computeChipDisplay } from '../../lib/chips.js';
import {
  getState,
  formatState,
  formatHistoricalState,
  resolveEntityName,
  fireMoreInfo,
  callService,
  flushLitUpdate,
} from '../../lib/ha-helpers.js';
import {
  resolveDeviceEntities,
  resolveDefaultInfoRow,
  resolveDefaultControlsRow,
  requiredDeviceEntityField,
} from '../../lib/device-entities.js';
import { resolveCssColor } from '../../lib/color.js';
import { createTapHandlers } from '../../lib/actions.js';
import { checkConditionsMet } from '../../lib/visibility.js';
import { CARD_STYLES } from './petkit-puramax-card.styles.js';
import {
  DEFAULT_TITLE,
  DEFAULT_EVENT_EXCLUDE,
  DEFAULT_UNKNOWN_CAT_COLOR,
  DEFAULT_DECLINE_THRESHOLD_PCT,
  DEFAULT_NO_VISIT_ALERT_HOURS,
  MAX_VALID_VISIT_SECONDS,
  CHART_WIDTH,
  CHART_HEIGHT,
  CHART_PADDING,
} from './petkit-puramax-card.const.js';

/**
 * PETKIT PURAMAX litter box card: device status, controls, a day-switchable
 * per-cat visit chart, a Working Records timeline, and today/3d-avg/7d-avg
 * analytics with a decline/spike warning. Two independent data sources feed
 * two independent parts of the UI:
 *  - The chart, Usage line, and Analytics are derived client-side from the
 *    device's own `total_use` (a running counter that bumps by one visit's
 *    duration on every use) and, when there's more than one cat,
 *    `last_used_by` (which cat used it most recently) sensors — no
 *    accumulator/statistics/per-cat helper entities needed. See
 *    `_fetchVisits()` for how a duration+identity per visit is derived from
 *    those two generic sensors.
 *  - Working Records is `device_entities.last_event`'s own history, shown
 *    as Home Assistant itself would display each value — see
 *    `_renderRecordsSection()` for why it's deliberately NOT
 *    cross-referenced with the reconstruction above.
 *
 * A `LitElement`: `render()` declares the whole card from current state on
 * every update, and Lit's own diffing patches only what changed (auto
 * escaping text/attribute interpolations, `.prop=` bindings for live object
 * references like `ha-state-icon.stateObj`, and the `repeat()` directive for
 * `controls_row` since its visible set can change every `hass` tick). HA's
 * real Lovelace host, like every other Lit-based custom card, doesn't
 * require synchronous rendering — but this card's own `hass`
 * setter/`setConfig()`/day-nav flow force a synchronous flush (via Lit's
 * public `performUpdate()`) anyway, purely so the DOM reflects a change the
 * instant the call returns, matching this card's previous (pre-Lit)
 * behavior exactly.
 */
export class PetkitPuramaxCard extends LitElement {
  static styles = CARD_STYLES;

  static properties = {
    _config: { state: true },
    _dayOffset: { state: true },
    _chartVisits: { state: true },
    _chartEventHist: { state: true },
    _analytics: { state: true },
    _configErrorMsg: { state: true },
  };

  static getConfigElement() {
    return document.createElement('petkit-puramax-card-editor');
  }

  // Returns a minimal-but-valid example config so dragging this card from
  // HA's card picker doesn't immediately throw in setConfig (which requires
  // `device_id` or `device_entities`, and a non-empty `cats`). No entity ids
  // are ever hardcoded here (there'd be nothing real to point them at) --
  // `device_id` is auto-detected from `hass` when a PetKit device is already
  // set up (matching the entity registry's own `platform: 'petkit'`, the
  // same signal `resolveDeviceEntities` keys off of), or left empty
  // otherwise; `_configError()` then explains what's still needed once the
  // card actually mounts. `info_row`/`controls_row` are similarly populated
  // from whatever real entities that device has (a device without a Pura
  // Air module, for instance, just gets fewer default chips) rather than
  // hardcoded either.
  static getStubConfig(hass) {
    const petkitEntity =
      hass && hass.entities ? Object.values(hass.entities).find((e) => e.platform === 'petkit') : null;
    const deviceId = petkitEntity ? petkitEntity.device_id : '';
    const deviceEntities = resolveDeviceEntities(hass, deviceId);
    const infoRow = resolveDefaultInfoRow(hass, deviceId);
    const controlsRow = resolveDefaultControlsRow(hass, deviceId, deviceEntities.state);
    return {
      type: 'custom:petkit-puramax-card',
      title: 'PETKIT PURAMAX',
      device_id: deviceId,
      ...(infoRow.length ? { info_row: infoRow } : {}),
      ...(controlsRow.length ? { controls_row: controlsRow } : {}),
      cats: [
        {
          name: 'My Cat',
          color: 'blue',
        },
      ],
    };
  }

  constructor() {
    super();
    this._dayOffset = 0;
    this._chartVisits = [];
    this._chartEventHist = [];
    this._analytics = null;
    this._configErrorMsg = null;
    this._tapHandlersByIndex = new Map();
  }

  setConfig(config) {
    if (!config) {
      throw new Error('petkit-puramax-card: config is required');
    }
    // `device_id` lets total_use/last_used_by/error/last_event/state be
    // auto-detected from the device's entity registry (see
    // `resolveDeviceEntities`) instead of hand-typed -- so once the config
    // has opted into it (the key is present at all, even as `''` -- see
    // `getStubConfig`, which leaves it empty when no device was
    // auto-detected), `device_entities` is optional and its presence/
    // contents can only be fully validated once `hass` (and its entity
    // registry) is available; see `_configError()`, checked on first build.
    const usesDeviceId = config.device_id !== undefined;
    if (!usesDeviceId && !config.device_entities) {
      throw new Error('petkit-puramax-card: "device_entities" is required in config (or set "device_id")');
    }
    // The real Lovelace host passes a frozen config object -- never mutate
    // `config` itself (a plain-object stand-in in tests can mask this, but
    // `config.device_entities = ...` throws for real against a frozen one).
    const deviceEntities = config.device_entities || {};
    // See `requiredDeviceEntityField()` for the shared rule -- this is its
    // config-parse-time call site (checked against hand-written
    // `device_entities`, before `config.cats` is validated below, so it's
    // called once here without `cats` -- the total_use half of the rule
    // doesn't depend on it -- and once more after cats is confirmed a valid
    // array, to also cover the last_used_by half).
    if (!usesDeviceId && requiredDeviceEntityField(deviceEntities) === 'total_use') {
      throw new Error('petkit-puramax-card: "device_entities.total_use" is required in config (or set "device_id")');
    }
    if (!config.cats) {
      throw new Error('petkit-puramax-card: "cats" is required in config');
    }
    if (!Array.isArray(config.cats) || config.cats.length < 1) {
      throw new Error('petkit-puramax-card: "cats" must be a non-empty array');
    }
    // With a single cat, every visit is trivially theirs -- no need to know
    // which cat used the box, so last_used_by isn't required until there's
    // an actual ambiguity to resolve.
    if (!usesDeviceId && requiredDeviceEntityField(deviceEntities, config.cats) === 'last_used_by') {
      throw new Error(
        'petkit-puramax-card: "device_entities.last_used_by" is required in config when more than one cat is configured (or set "device_id")',
      );
    }
    config.cats.forEach((cat, i) => {
      if (!cat || !cat.name) {
        throw new Error(`petkit-puramax-card: cats[${i}].name is required`);
      }
      if (!cat.color) {
        throw new Error(`petkit-puramax-card: cats[${i}].color is required`);
      }
    });

    this._config = { ...config, device_entities: deviceEntities };
    this._dayOffset = 0;
    this._analytics = null;
    this._chartVisits = [];
    this._chartEventHist = [];
    this._tapHandlersByIndex = new Map();
    this._deviceEntities = this._resolveDeviceEntities();
    this._flush();
  }

  // Explicit `device_entities` always wins over what's auto-detected from
  // `device_id` -- so an integration this card doesn't know the
  // translation_keys for, or a future upstream rename, degrades to "set it
  // manually" rather than silently resolving to the wrong entity.
  _resolveDeviceEntities() {
    return {
      ...resolveDeviceEntities(this._hass, this._config.device_id),
      ...this._config.device_entities,
    };
  }

  // Only meaningful once the config has opted into `device_id` mode (the
  // key is present, even as `''` -- see `getStubConfig`) -- the plain
  // `device_entities`-only path is already fully validated synchronously in
  // `setConfig`.
  _configError() {
    if (this._config.device_id === undefined) return null;
    const noDeviceSelected = !this._config.device_id;
    // See `requiredDeviceEntityField()` for the shared rule -- this is its
    // hass-time call site, checked against `device_entities` after
    // `device_id` auto-detection has resolved it.
    const missingField = requiredDeviceEntityField(this._deviceEntities, this._config.cats);
    if (missingField === 'total_use') {
      return noDeviceSelected
        ? 'A PetKit device is required. Select one in the card editor, or set "device_entities.total_use" manually.'
        : 'Could not auto-detect a "total use" sensor on the selected device. Set "device_entities.total_use" in the config to override.';
    }
    if (missingField === 'last_used_by') {
      return noDeviceSelected
        ? 'A PetKit device is required (or set "device_entities.last_used_by" manually) since more than one cat is configured.'
        : 'Could not auto-detect a "last used by" sensor on the selected device (required for more than one cat). Set "device_entities.last_used_by" in the config to override.';
    }
    return null;
  }

  set hass(hass) {
    const prevHass = this._hass;
    this._hass = hass;
    this._deviceEntities = this._resolveDeviceEntities();
    if (!this._built) {
      this._built = true;
      this._build();
    } else {
      this._maybeRefreshOnNewVisit(prevHass);
    }
    this._flush();
  }

  get hass() {
    return this._hass;
  }

  // See `flushLitUpdate()` in ha-helpers.js for why this exists -- shared
  // with the editor's own identical `_flush()`.
  _flush() {
    flushLitUpdate(this);
  }

  getCardSize() {
    return 14;
  }

  _build() {
    const err = this._configError();
    this._configErrorMsg = err;
    if (err) return;
    this._loadDay();
    this._loadAnalytics();
    this._startNoVisitTimer();
  }

  connectedCallback() {
    super.connectedCallback();
    if (this._hass && !this._built) {
      this._built = true;
      this._build();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._noVisitTimer) {
      clearInterval(this._noVisitTimer);
      this._noVisitTimer = null;
    }
  }

  // The "no visit in N hours" alert must keep advancing purely from time
  // passing, not just when a new visit re-triggers `_loadAnalytics()` --
  // otherwise a cat that's overdue would only get flagged the next time
  // something else happens to change `total_use`. A cheap periodic recheck
  // against the already-fetched `lastVisitTs` (no new WS call) covers that.
  _startNoVisitTimer() {
    if (this._noVisitTimer) return;
    this._noVisitTimer = setInterval(() => this._checkNoVisitAlerts(), 5 * 60 * 1000);
  }

  // A visit bumps the device's total_use sensor. If that happens live, the
  // chart/records (when viewing today) and the analytics table are both
  // stale until re-fetched — so watch for it and refresh.
  _maybeRefreshOnNewVisit(prevHass) {
    if (!prevHass) return;
    const eid = this._deviceEntities.total_use;
    const prev = prevHass.states[eid];
    const curr = this._hass.states[eid];
    const changed = curr && (!prev || prev.last_changed !== curr.last_changed);
    if (changed) {
      if (this._dayOffset === 0) this._loadDay();
      this._loadAnalytics();
    }
  }

  // ---------- helpers ----------
  _s(entityId, fallback) {
    return getState(this._hass, entityId, fallback);
  }

  // Reconstructs per-visit { value: duration, ts, cat } events for a window
  // from two generic device sensors, requiring no per-cat helper entities:
  //  - device_entities.total_use: a running counter that bumps by one
  //    visit's duration on every use (all cats combined). Consecutive-point
  //    deltas ARE the per-visit durations.
  //  - device_entities.last_used_by: which cat used it most recently. Only
  //    fetched/needed when there's more than one cat -- with a single cat
  //    every visit is trivially theirs. Attribution is nearest-neighbor
  //    matching (see `attributeCats`), not an exact-timestamp match, since
  //    most PetKit integrations don't emit a new last_used_by state when
  //    the same cat visits twice in a row, and its write for a given visit
  //    can lag total_use's by anywhere from milliseconds to (rarely)
  //    minutes -- see `attributeCats` in history.js for the measured data
  //    and why a fixed tolerance window can't safely cover both.
  async _fetchVisits({ start, end }) {
    const cfg = this._config;
    const de = this._deviceEntities;
    const totalUseReq = buildHistoryRequest({
      startTime: start,
      endTime: end,
      entityIds: [de.total_use],
    });
    const requests = [this._hass.callWS(totalUseReq)];
    if (cfg.cats.length > 1) {
      // include_start_time_state:true here is deliberate and safe (see the
      // doc comment on buildHistoryRequest): this is an identity sensor
      // used only for carry-forward attribution, not a duration being
      // charted, so a synthetic "value when the window opened" point is
      // exactly the baseline needed to attribute the day's first visit(s)
      // if the same cat continued from before the window.
      const lastUsedByReq = buildHistoryRequest({
        startTime: start,
        endTime: end,
        entityIds: [de.last_used_by],
        includeStartTimeState: true,
      });
      requests.push(this._hass.callWS(lastUsedByReq));
    }

    let totalUseResult = {};
    let lastUsedByResult = {};
    try {
      const [totalUse, lastUsedBy] = await Promise.all(requests);
      totalUseResult = totalUse || {};
      lastUsedByResult = lastUsedBy || {};
    } catch (_e) {
      // leave both as {}
    }

    const durationEvents = deltaEvents(totalUseResult[de.total_use], {
      minDelta: 0,
      maxDelta: MAX_VALID_VISIT_SECONDS,
    });

    let attributed;
    if (cfg.cats.length > 1) {
      const knownNames = cfg.cats.map((c) => c.name);
      const catEvents = catChangeEvents(lastUsedByResult[de.last_used_by], knownNames);
      attributed = attributeCats(durationEvents, catEvents);
    } else {
      attributed = durationEvents.map((e) => ({ ...e, cat: cfg.cats[0].name }));
    }

    const catsByName = new Map(cfg.cats.map((c) => [c.name, c]));
    // A duration event with no resolvable cat (e.g. the very first visit
    // ever, before any last_used_by value has been recorded) still
    // represents a real visit -- kept (with `cat: null`) rather than
    // silently dropped, so callers that need "did a visit happen at all"
    // (e.g. total daily counts) don't undercount. `UNKNOWN_CAT_LABEL`
    // (PURAMAX's own "the device couldn't identify this cat" assertion,
    // as opposed to no assertion at all) maps to a fixed pseudo-cat object
    // instead, so it gets consistent gray styling and a usage-line entry --
    // see `_unknownCat()`.
    return attributed.map((e) => ({
      cat: e.cat === UNKNOWN_CAT_LABEL ? this._unknownCat() : catsByName.get(e.cat) || null,
      duration: e.value,
      ts: e.ts,
    }));
  }

  // Fixed pseudo-cat object for a visit the device itself couldn't
  // identify (`UNKNOWN_CAT_STATE`/`UNKNOWN_CAT_LABEL` -- see history.js).
  // Deliberately NOT one of `cfg.cats`, so it's naturally excluded from
  // per-named-cat Analytics (which iterates `cfg.cats`) while still
  // participating in the chart (gray stem) and the usage-line legend on
  // days it occurs -- see `_renderChartSection`.
  _unknownCat() {
    return { name: UNKNOWN_CAT_LABEL, color: this._config.unknown_cat_color || DEFAULT_UNKNOWN_CAT_COLOR };
  }

  // ---------- data loading ----------
  // Deliberately no "Loading…" interstitial: `_dayOffset` (and its
  // day-label/nav-button rendering) update immediately, but `_chartVisits`/
  // `_chartEventHist` are only reassigned once the fetch actually resolves
  // -- until then, `render()` keeps showing whatever they held before, so
  // paging through days quickly never flashes a placeholder frame.
  async _loadDay() {
    if (!this._hass) return;
    const de = this._deviceEntities;
    const { start, end } = dayBounds(this._dayOffset);
    let visits = [];
    let eventHist = [];
    try {
      const [visitsResult, eventResult] = await Promise.all([
        this._fetchVisits({ start, end }),
        de.last_event
          ? this._hass.callWS(buildHistoryRequest({ startTime: start, endTime: end, entityIds: [de.last_event] }))
          : Promise.resolve({}),
      ]);
      visits = visitsResult;
      eventHist = (eventResult || {})[de.last_event] || [];
    } catch (_e) {
      visits = [];
      eventHist = [];
    }
    this._chartVisits = visits;
    this._chartEventHist = eventHist;
    this._flush();
  }

  async _loadAnalytics() {
    if (!this._hass) return;
    const cfg = this._config;
    const now = new Date();
    // 7 raw days of visit reconstruction covers both the 3d and 7d windows
    // — no accumulator/statistics entities needed, everything is derived
    // client-side.
    const start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    let visits = [];
    try {
      visits = await this._fetchVisits({ start, end: now });
    } catch (_e) {
      visits = [];
    }

    const todayKey = dayKey(now.getTime());
    const perCat = perCatMap(cfg.cats, (cat) => {
      const events = visits.filter((v) => v.cat === cat).map((v) => ({ value: v.duration, ts: v.ts }));
      const byDay = bucketByDay(events, { dayKeyFn: dayKey });
      const lastVisitTs = events.length ? Math.max(...events.map((e) => e.ts)) : null;
      return { ...summarize(byDay, todayKey), lastVisitTs };
    });
    this._analytics = perCat;
    this._checkNoVisitAlerts();
    this._flush();
  }

  // Recomputes each cat's overdue-for-a-visit state against the current
  // time (no new fetch -- reuses `lastVisitTs` from the last `_loadAnalytics()`
  // fetch), fires a notification on the moment a cat first becomes overdue,
  // and clears the "already notified" flag once they've visited again.
  //
  // This only ever runs while the card is actually mounted and rendering --
  // a frontend card, unlike a backend automation, cannot alert you while no
  // browser/companion-app tab has it loaded. `notify_service` is best used
  // alongside, not instead of, a native HA automation if you need a
  // guarantee independent of whether the dashboard is open.
  _checkNoVisitAlerts() {
    if (!this._analytics || !this._built) return;
    const cfg = this._config;
    const thresholdHours = cfg.no_visit_alert_hours ?? DEFAULT_NO_VISIT_ALERT_HOURS;
    const now = Date.now();
    if (!this._notifiedCats) this._notifiedCats = new Set();
    cfg.cats.forEach((cat) => {
      const a = this._analytics[cat.name];
      if (!a) return;
      const result = detectNoVisitAlert({ lastVisitTs: a.lastVisitTs, now, thresholdHours });
      a.noVisitAlert = result;
      const alreadyNotified = this._notifiedCats.has(cat.name);
      if (result.alerting && !alreadyNotified) {
        this._notifiedCats.add(cat.name);
        this._sendNoVisitNotification(cat, result);
      } else if (!result.alerting && alreadyNotified) {
        this._notifiedCats.delete(cat.name);
      }
    });
    this._flush();
  }

  _sendNoVisitNotification(cat, result) {
    const service = this._config.notify_service;
    if (!service || !this._hass) return;
    const dotIndex = service.indexOf('.');
    if (dotIndex === -1) return;
    const domain = service.slice(0, dotIndex);
    const serviceName = service.slice(dotIndex + 1);
    if (domain !== 'notify' || !serviceName) return;
    const message =
      result.hoursSince == null
        ? `${cat.name} hasn't used the litter box yet in the tracked history.`
        : `${cat.name} hasn't used the litter box in over ${Math.floor(result.hoursSince)}h.`;
    callService(this._hass, 'notify', serviceName, { message, title: 'Litter box alert' });
  }

  _changeDay(delta) {
    this._dayOffset += delta;
    if (this._dayOffset > 0) this._dayOffset = 0;
    this._flush();
    this._loadDay();
  }

  // ---------- icon/name resolution ----------
  // Resolves the icon/name a chip or control shows when its config leaves
  // `icon`/`name` unset: the entity's own current icon/registry display
  // name, never baked into config -- `icon`/`name` in config only ever
  // override. A real `ha-state-icon` (`.stateObj` bound directly, a live
  // object reference -- impossible to express as a plain HTML attribute,
  // which is why the pre-Lit version needed a manual post-render DOM pass
  // for this) resolves the entity's own icon the same way any built-in card
  // would, instead of this card guessing a single generic fallback for
  // every entity domain.
  _iconTemplate(icon, entityId) {
    if (icon) return html`<ha-icon icon=${icon}></ha-icon>`;
    if (entityId) return html`<ha-state-icon .stateObj=${this._hass?.states?.[entityId]}></ha-state-icon>`;
    return html`<ha-icon icon="mdi:information-outline"></ha-icon>`;
  }

  // `resolveEntityName` returns the same short, entity-relative name HA's
  // own device/entity pages show (e.g. "Wastebin"), not the combined
  // device+entity `friendly_name` ("PETKIT PURAMAX Wastebin") -- redundant
  // here since the card's own title already names the device once.
  _entityLabel(name, entityId) {
    if (name) return name;
    return resolveEntityName(this._hass, entityId);
  }

  // One gesture-tracking slot (hold-timestamp/double-tap-timestamp state,
  // see `createTapHandlers`) per `controls_row` index, created lazily and
  // kept for the card's lifetime -- `repeat()`'s per-spec key is what keeps
  // a control at a given index bound to the same slot across re-renders,
  // the same identity guarantee a real DOM node would need for an
  // imperative `addEventListener` to only run once. Declarative
  // `@pointerdown=`/`@click=` bindings in the template below let Lit itself
  // keep the listener current across renders, so there's no
  // querySelectorAll/"already bound" bookkeeping needed at all.
  _tapHandlersFor(i) {
    let handlers = this._tapHandlersByIndex.get(i);
    if (!handlers) {
      handlers = createTapHandlers(() => {
        const spec = (this._config.controls_row || [])[i] || {};
        return {
          hass: this._hass,
          tapAction: spec.tap_action,
          holdAction: spec.hold_action,
          doubleTapAction: spec.double_tap_action,
          fallbackEntity: spec.entity,
        };
      });
      this._tapHandlersByIndex.set(i, handlers);
    }
    return handlers;
  }

  // ---------- render ----------
  render() {
    if (this._configErrorMsg) {
      return html`<ha-card><div style="padding: 16px;"><ha-alert alert-type="error">${this._configErrorMsg}</ha-alert></div></ha-card>`;
    }
    if (!this._config) return nothing;
    const cfg = this._config;
    return html`
      <ha-card>
        <div class="header">
          <div class="title">${cfg.title || DEFAULT_TITLE}</div>
          ${cfg.show_state !== false ? this._renderStateBadge() : nothing}
        </div>
        <div class="status-row" id="status-row">${this._renderStatusRow()}</div>
        <div class="controls-row" id="controls-row">${this._renderControlsRow()}</div>
        ${cfg.show_history !== false ? this._renderChartSection() : nothing}
        ${cfg.show_analytics !== false ? this._renderAnalyticsSection() : nothing}
        ${cfg.show_working_records !== false ? this._renderRecordsSection() : nothing}
      </ha-card>
    `;
  }

  // Top-right of the header, tappable like a status chip. `device_entities.state`
  // has no other visible use on the card today.
  _renderStateBadge() {
    const de = this._deviceEntities;
    const stateValue = this._s(de.state, null);
    const openState = () => {
      if (de.state) fireMoreInfo(this, de.state);
    };
    return html`<div
      class="state-badge"
      id="state-badge"
      ?hidden=${!stateValue}
      tabindex="0"
      @click=${openState}
      @keydown=${(ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          openState();
        }
      }}
    >${stateValue ? stateValue.replace(/_/g, ' ') : ''}</div>`;
  }

  // Fully config-driven — add/remove/reorder chips via `info_row` in YAML.
  _renderStatusRow() {
    const cfg = this._config;
    const de = this._deviceEntities;
    const errorState = this._s(de.error, 'no_error');
    // `unavailable`/`unknown` mean "the entity hasn't reported a value" (a
    // coordinator hiccup, same flicker documented for last_event/
    // last_used_by elsewhere in this file), never "there is a real error" --
    // showing an "Error: unavailable" chip would be actively misleading.
    const hasError = errorState && !['no_error', 'unavailable', 'unknown'].includes(errorState.toLowerCase());
    const infoRow = cfg.info_row || [];
    return html`
      ${infoRow.map((spec) => this._renderInfoChip(spec))}
      ${hasError ? this._chipTemplate('mdi:alert', 'Error', errorState.replace(/_/g, ' '), true, de.error) : nothing}
    `;
  }

  _renderInfoChip(spec) {
    const rawValue = this._s(spec.entity, null);
    const translatedValue = formatState(this._hass, spec.entity, null);
    const { display, warn } = computeChipDisplay(spec, rawValue, translatedValue);
    return this._chipTemplate(spec.icon, this._entityLabel(spec.name, spec.entity), display, warn, spec.entity);
  }

  _chipTemplate(icon, label, value, warn, entityId) {
    const open = () => {
      if (entityId) fireMoreInfo(this, entityId);
    };
    return html`
      <div
        class="chip ${warn ? 'warn' : ''} ${entityId ? 'tappable' : ''}"
        data-entity=${entityId || nothing}
        tabindex=${entityId ? '0' : nothing}
        @click=${entityId ? open : nothing}
        @keydown=${entityId
          ? (ev) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                open();
              }
            }
          : nothing}
      >
        ${this._iconTemplate(icon, entityId)}
        <div class="chip-text"><div class="chip-label">${label}</div><div class="chip-value">${value}</div></div>
      </div>
    `;
  }

  // controls_row: fully config-driven — add/remove/reorder buttons via
  // `controls_row` in YAML. `visibility` can change which controls are
  // currently shown as device state changes (e.g. a "Start
  // maintenance"/"Exit maintenance" pair); `repeat()`, keyed by each spec's
  // original index, gives minimal keyed DOM patching for that for free —
  // no manual "did the visible set change" bookkeeping needed.
  _renderControlsRow() {
    const cfg = this._config;
    const controls = cfg.controls_row || [];
    const visible = controls
      .map((spec, i) => ({ spec, i }))
      .filter(({ spec }) => checkConditionsMet(spec.visibility, this._hass));
    return repeat(
      visible,
      ({ i }) => i,
      ({ spec, i }) => {
        const label = this._entityLabel(spec.name, spec.entity);
        const active = this._s(spec.entity, null) === 'on';
        const handlers = this._tapHandlersFor(i);
        return html`
          <ha-control-button
            class="ctrl-btn ${active ? 'ctrl-btn-active' : ''}"
            id="ctrl-${i}"
            label=${label}
            @pointerdown=${() => handlers.onPointerDown()}
            @click=${(ev) => handlers.onClick(ev.currentTarget)}
          >
            <div class="ctrl-btn-content">
              ${this._iconTemplate(spec.icon, spec.entity)}
              <span>${label}</span>
            </div>
          </ha-control-button>
        `;
      },
    );
  }

  _renderChartSection() {
    return html`
      <div class="chart-section">
        <div class="chart-header">
          <button class="nav-btn" id="prev-day" @click=${() => this._changeDay(-1)}>&#9664;</button>
          <div class="day-label" id="day-label">${dayLabel(this._dayOffset)}</div>
          <button class="nav-btn" id="next-day" ?disabled=${this._dayOffset >= 0} @click=${() => this._changeDay(1)}>
            &#9654;
          </button>
        </div>
        <div class="usage-section">
          <div id="usage-body">${this._renderUsageBody()}</div>
        </div>
        <div class="chart-area" id="chart-area">${this._renderChartArea()}</div>
      </div>
    `;
  }

  // The total_use/last_used_by reconstruction drives the chart, the Usage
  // line, and Analytics -- `visits` here is every visit with a resolved
  // identity (a configured cat, or the Unknown pseudo-cat), which is all of
  // them except a visit from before any identity was ever recorded
  // (cat: null, vanishingly rare -- the very first visit ever).
  _visits() {
    return (this._chartVisits || []).filter((v) => v.cat).sort((a, b) => a.ts - b.ts);
  }

  _renderChartArea() {
    const visits = this._visits();
    const width = CHART_WIDTH;
    const height = CHART_HEIGHT;
    const padding = CHART_PADDING;
    const rawMaxDur = Math.max(60, ...visits.map((v) => v.duration));
    const yStep = niceStep(rawMaxDur);
    const niceMax = Math.ceil(rawMaxDur / yStep) * yStep;
    const { start } = dayBounds(this._dayOffset);
    const { xFor, yFor } = buildScales({ dayStart: start, niceMax, width, height, padding });
    const { vertical, horizontal } = buildGridLines({ niceMax, yStep, width, height, padding });

    // Axis tick labels as absolutely-positioned HTML overlays inside
    // .chart-wrap, positioned as a percentage of the wrap's box computed
    // from the same viewBox coordinates the SVG uses -- NOT SVG text (see
    // petkit-puramax-card.const.js's CHART_PADDING comment for why: a real,
    // fixed CSS font-size here means the on-screen text size no longer
    // depends on the SVG viewBox's scale factor at the card's current
    // rendered width).
    const xAxisLabelTop = ((height - padding.bottom) / height) * 100;
    const yAxisLabelWidth = (padding.left / width) * 100;

    return html`
      <div class="chart-wrap">
        <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
          ${horizontal.map(
            (h) => svg`<line x1="${padding.left}" y1="${h.y}" x2="${width - padding.right}" y2="${h.y}" class="grid-line-h" />`,
          )}
          ${vertical.map(
            (v) => svg`<line x1="${v.x}" y1="${padding.top}" x2="${v.x}" y2="${height - padding.bottom}" class="grid-line-v" />`,
          )}
          ${visits.map((v, i) => {
            const x = xFor(v.ts);
            const y = yFor(v.duration);
            const bottom = height - padding.bottom;
            const stemColor = resolveCssColor(v.cat.color);
            return svg`
              <line x1="${x}" y1="${bottom}" x2="${x}" y2="${y}" stroke="${stemColor}" stroke-width="2" />
              <circle class="visit-point" cx="${x}" cy="${y}" r="5" fill="${stemColor}" />
              <line class="visit-hit" data-idx="${i}" x1="${x}" y1="${bottom}" x2="${x}" y2="${y}" stroke="transparent" stroke-width="16"
                @mouseenter=${(ev) => this._showChartTooltip(ev, v)}
                @mouseleave=${() => this._hideChartTooltip()}
              />
            `;
          })}
        </svg>
        ${vertical.map(
          (v) => html`<div class="axis-label" style="left:${(v.x / width) * 100}%;top:${xAxisLabelTop}%">${v.label}</div>`,
        )}
        ${horizontal.map(
          (h) => html`<div class="axis-label-y" style="top:${(h.y / height) * 100}%;width:${yAxisLabelWidth}%">${h.label}</div>`,
        )}
        <div class="chart-tooltip" id="chart-tooltip"></div>
      </div>
      ${visits.length === 0 ? html`<div class="empty-note">No visits recorded this day</div>` : nothing}
    `;
  }

  // Positions at the top of the stem (the dot), regardless of where along
  // the line was hovered. Imperative (not reactive state) on purpose: a
  // transient hover effect doesn't need to survive a re-render, and
  // querying the already-rendered tooltip node directly avoids plumbing
  // hover state through a reactive property for no benefit.
  _showChartTooltip(ev, v) {
    const tooltip = this.shadowRoot.getElementById('chart-tooltip');
    if (!tooltip) return;
    const timeStr = new Date(v.ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    tooltip.textContent = `${timeStr} · ${v.cat.name} · ${formatDuration(v.duration)}`;
    const hitRect = ev.currentTarget.getBoundingClientRect();
    const wrapRect = this.shadowRoot.querySelector('.chart-wrap').getBoundingClientRect();
    tooltip.style.left = `${hitRect.left - wrapRect.left + hitRect.width / 2}px`;
    tooltip.style.top = `${hitRect.top - wrapRect.top}px`;
    tooltip.classList.add('visible');
  }

  _hideChartTooltip() {
    const tooltip = this.shadowRoot.getElementById('chart-tooltip');
    if (tooltip) tooltip.classList.remove('visible');
  }

  // Driven by the SAME data as the chart (`_visits()`), so it always
  // matches the day currently shown (not a separate live device sensor).
  // `visits` already includes Unknown (it has a real `.color`/`.name`, just
  // not one of `cfg.cats`, so it also plots as a gray stem on the chart) --
  // but the usage-line "legend" row is built only from `cfg.cats` PLUS an
  // Unknown entry that's added only when this day actually had one (never a
  // permanent zero-count slot).
  _renderUsageBody() {
    const cfg = this._config;
    const visits = this._visits();
    const perCat = perCatMap(cfg.cats, () => ({ count: 0 }));
    let unknownCount = 0;
    let unknownColor = DEFAULT_UNKNOWN_CAT_COLOR;
    visits.forEach((v) => {
      if (v.cat.name === UNKNOWN_CAT_LABEL) {
        unknownCount += 1;
        unknownColor = v.cat.color;
      } else {
        perCat[v.cat.name].count += 1;
      }
    });
    const totalCount = visits.length;
    return html`
      <div class="usage-row">
        <div class="stat-value">${totalCount} time${totalCount === 1 ? '' : 's'}</div>
        <div class="usage-cats">
          ${cfg.cats.map(
            (cat) => html`
              <span class="usage-cat"
                ><span class="dot" style="background:${resolveCssColor(cat.color)}"></span>${cat.name}: ${perCat[cat.name].count}</span
              >
            `,
          )}
          ${unknownCount > 0
            ? html`<span class="usage-cat"
                ><span class="dot" style="background:${resolveCssColor(unknownColor)}"></span>${UNKNOWN_CAT_LABEL}: ${unknownCount}</span
              >`
            : nothing}
        </div>
      </div>
    `;
  }

  // Working Records has exactly ONE source of truth, and it's `last_event`
  // -- rendered as Home Assistant itself would show that value (via
  // `hass.formatEntityState`, which reads the PETKIT integration's own
  // `strings.json` enum translations), never a hand-maintained relabeling
  // map and never interpreted through a pattern/regex. Every DISTINCT event
  // PETKIT reports is shown, in arrival order; `event_exclude` hides an
  // explicit, configurable list of raw values entirely, and doubles as the
  // signal `dedupeFlickerRepeats` uses to collapse a value that flickers to
  // a hidden state and recovers to itself back into its original row (see
  // that function -- this sensor re-emits the identical value for as long
  // as it remains the true last event, so a naive one-row-per-history-point
  // view would show dozens of duplicate rows for a single real event).
  // The ONLY cross-reference to the total_use/last_used_by reconstruction
  // is `this._chartVisits`' own timestamps, passed through as
  // `confirmedEventTimestamps` to two narrow, binary "did an independently
  // verified visit happen near here" checks -- never a full merge/
  // re-synthesis (replacing last_event's own text, matching every row 1:1
  // against total_use) like the approach that caused real bugs before (see
  // git history / issues #13, #14, #16):
  //  - `dedupeFlickerRepeats` uses it to tell a genuine flicker-repeat apart
  //    from two separate real visits that happen to share identical text
  //    (confirmed real case, 2026-07-16).
  //  - `expandConfirmedRepeats` uses it to add back a real visit that
  //    `last_event` never got its own history point for AT ALL, because its
  //    value didn't change and nothing flickered (confirmed real case,
  //    2026-07-24 -- see that function's doc comment).
  // Neither ever changes what an EXISTING row says, only whether a
  // same-text repeat counts as new / how many rows a run of identical text
  // becomes.
  _renderRecordsSection() {
    const cfg = this._config;
    const eventHist = this._chartEventHist || [];
    const lastEventEntity = this._deviceEntities.last_event;
    const excludeList = (cfg.event_exclude || DEFAULT_EVENT_EXCLUDE).map((s) => String(s).toLowerCase());
    const confirmedEventTimestamps = (this._chartVisits || []).map((v) => v.ts);
    const dedupedEvents = dedupeFlickerRepeats(eventHist, excludeList, { confirmedEventTimestamps });
    const records = expandConfirmedRepeats(dedupedEvents, confirmedEventTimestamps).map(({ state, ts }) => ({
      ts,
      icon: 'mdi:information-outline',
      color: 'var(--secondary-text-color)',
      text: formatHistoricalState(this._hass, lastEventEntity, state),
    }));
    records.sort((a, b) => b.ts - a.ts);

    return html`
      <div class="records-section">
        <div class="section-title">Working Records</div>
        <div class="records-list" id="records-list">
          ${records.length === 0
            ? html`<div class="empty-note">No records for this day</div>`
            : records.map(
                (r) => html`
                  <div class="record-row">
                    <div class="record-time">${new Date(r.ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                    <ha-icon icon=${r.icon} style="color:${r.color}"></ha-icon>
                    <div class="record-text">${r.text}</div>
                  </div>
                `,
              )}
        </div>
      </div>
    `;
  }

  _renderAnalyticsSection() {
    if (!this._analytics) return nothing;
    const cfg = this._config;
    const thresholdPct = cfg.decline_threshold_pct || DEFAULT_DECLINE_THRESHOLD_PCT;
    const hourOfDay = new Date().getHours();
    const warnings = [];
    const catTables = cfg.cats.map((cat) => {
      const a = this._analytics[cat.name] || {};
      const anomaly = detectAnomaly({
        todayTotal: a.todayTotal,
        avg7dTotal: a.avg7dTotal,
        daysOfHistory: a.daysOfHistory,
        thresholdPct,
        hourOfDay,
      });
      if (anomaly === 'low') {
        warnings.push(`${cat.name}'s usage today is well below their recent average — worth a check.`);
      } else if (anomaly === 'high') {
        warnings.push(`${cat.name}'s usage today is well above their recent average — worth a check.`);
      }
      return html`
        <div class="cat-analytics">
          <table>
            <colgroup>
              <col class="col-name" /><col class="col-stat" /><col class="col-stat" /><col class="col-stat" />
            </colgroup>
            <tr>
              <td class="cat-name-cell"><span class="dot" style="background:${resolveCssColor(cat.color)}"></span>${cat.name}</td>
              <td>Today</td>
              <td>3d avg</td>
              <td>7d avg</td>
            </tr>
            <tr>
              <td>Visits</td>
              <td>${a.todayCount ?? 0}</td>
              <td>${a.avg3dVisits !== null && a.avg3dVisits !== undefined ? a.avg3dVisits.toFixed(1) : '—'}</td>
              <td>${a.avg7dVisits !== null && a.avg7dVisits !== undefined ? a.avg7dVisits.toFixed(1) : '—'}</td>
            </tr>
            <tr>
              <td>Duration</td>
              <td>${a.todayAvgDuration ? formatDuration(a.todayAvgDuration) : '—'}</td>
              <td>${a.avg3dDuration ? formatDuration(a.avg3dDuration) : '—'}</td>
              <td>${a.avg7dDuration ? formatDuration(a.avg7dDuration) : '—'}</td>
            </tr>
          </table>
        </div>
      `;
    });

    const overdueCats = cfg.cats.filter((cat) => this._analytics[cat.name]?.noVisitAlert?.alerting);

    return html`
      <div class="analytics-section">
        <div class="section-title">Analytics</div>
        <div id="no-visit-banner">
          ${overdueCats.map((cat) => {
            const { hoursSince } = this._analytics[cat.name].noVisitAlert;
            const since = hoursSince == null ? 'no visits recorded yet' : `last seen ${formatHoursAgo(hoursSince)} ago`;
            return html`<div class="no-visit-banner"><ha-icon icon="mdi:cat-alert"></ha-icon>${cat.name} hasn't used the litter box recently (${since}).</div>`;
          })}
        </div>
        <div id="decline-banner">
          ${warnings.map((w) => html`<div class="warn-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${w}</div>`)}
        </div>
        <div class="analytics-grid" id="analytics-grid">${catTables}</div>
      </div>
    `;
  }
}
