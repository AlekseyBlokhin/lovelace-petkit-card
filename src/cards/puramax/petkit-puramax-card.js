import { formatDuration, formatHoursAgo, escapeHtml } from '../../lib/format.js';
import { dayBounds, dayLabel, dayKey } from '../../lib/day.js';
import { buildHistoryRequest, deltaEvents, catChangeEvents, attributeCats, UNKNOWN_CAT_LABEL } from '../../lib/history.js';
import { niceStep, buildScales, buildGridLines } from '../../lib/chart-math.js';
import { bucketByDay, summarize, detectNoVisitAlert } from '../../lib/analytics.js';
import { computeChipDisplay } from '../../lib/chips.js';
import { getState, fireMoreInfo, callService, pressButton } from '../../lib/ha-helpers.js';
import { resolveDeviceEntities } from '../../lib/device-entities.js';
import { CARD_STYLES } from './petkit-puramax-card.styles.js';
import {
  DEFAULT_TITLE,
  DEFAULT_EVENT_LABELS,
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
 *    verbatim — see `_renderChartArea()`'s Working Records section for why
 *    it's deliberately NOT cross-referenced with the reconstruction above.
 *
 * DOM/lifecycle only — all math lives in `src/lib/*`.
 */
export class PetkitPuramaxCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('petkit-puramax-card-editor');
  }

  // Returns a minimal-but-valid example config so dragging this card from
  // HA's card picker doesn't immediately throw in setConfig (which requires
  // `device_entities` and a non-empty `cats`). Every id here is an obvious
  // placeholder the user is expected to replace with their own entities.
  static getStubConfig() {
    return {
      type: 'custom:petkit-puramax-card',
      title: 'PETKIT PURAMAX',
      device_entities: {
        error: 'sensor.example_petkit_error',
        last_event: 'sensor.example_petkit_last_event',
        state: 'sensor.example_petkit_state',
        total_use: 'sensor.example_petkit_total_use',
      },
      cats: [
        {
          name: 'Example Cat',
          color: '#4fc3f7',
        },
      ],
    };
  }

  setConfig(config) {
    if (!config) {
      throw new Error('petkit-puramax-card: config is required');
    }
    // `device_id` lets total_use/last_used_by/error/last_event/state be
    // auto-detected from the device's entity registry (see
    // `resolveDeviceEntities`) instead of hand-typed -- so when it's set,
    // `device_entities` is optional and its presence/contents can only be
    // fully validated once `hass` (and its entity registry) is available;
    // see `_configError()`, checked on first build.
    if (!config.device_id && !config.device_entities) {
      throw new Error('petkit-puramax-card: "device_entities" is required in config (or set "device_id")');
    }
    // The real Lovelace host passes a frozen config object -- never mutate
    // `config` itself (a plain-object stand-in in tests can mask this, but
    // `config.device_entities = ...` throws for real against a frozen one).
    const deviceEntities = config.device_entities || {};
    if (!config.device_id && !deviceEntities.total_use) {
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
    if (!config.device_id && config.cats.length > 1 && !deviceEntities.last_used_by) {
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
    this._chartData = null;
    this._loadingChart = false;
    this._loadingAnalytics = false;
    this._deviceEntities = this._resolveDeviceEntities();
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
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

  // Only meaningful when `device_id` is set -- the non-device_id path is
  // already fully validated synchronously in `setConfig`.
  _configError() {
    if (!this._config.device_id) return null;
    if (!this._deviceEntities.total_use) {
      return 'Could not auto-detect a "total use" sensor on the selected device. Set "device_entities.total_use" in the config to override.';
    }
    if (this._config.cats.length > 1 && !this._deviceEntities.last_used_by) {
      return 'Could not auto-detect a "last used by" sensor on the selected device (required for more than one cat). Set "device_entities.last_used_by" in the config to override.';
    }
    return null;
  }

  _renderError(message) {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<ha-card><div style="padding: 16px;"><ha-alert alert-type="error">${escapeHtml(message)}</ha-alert></div></ha-card>`;
  }

  set hass(hass) {
    const prevHass = this._hass;
    this._hass = hass;
    this._deviceEntities = this._resolveDeviceEntities();
    if (!this._built) {
      this._built = true;
      this._build();
      return;
    }
    this._updateLiveValues();
    this._maybeRefreshOnNewVisit(prevHass);
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    return 14;
  }

  _build() {
    const err = this._configError();
    if (err) {
      this._renderError(err);
      return;
    }
    this._render();
    this._loadDay();
    this._loadAnalytics();
    this._startNoVisitTimer();
  }

  connectedCallback() {
    if (this._hass && !this._built) {
      this._built = true;
      this._build();
    }
  }

  disconnectedCallback() {
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
  // days it occurs -- see `_renderChartArea`.
  _unknownCat() {
    return { name: UNKNOWN_CAT_LABEL, color: this._config.unknown_cat_color || DEFAULT_UNKNOWN_CAT_COLOR };
  }

  // ---------- data loading ----------
  async _loadDay() {
    if (!this._hass) return;
    this._loadingChart = true;
    this._renderChartArea();
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
    this._loadingChart = false;
    this._renderChartArea();
  }

  async _loadAnalytics() {
    if (!this._hass) return;
    this._loadingAnalytics = true;
    this._renderAnalyticsArea();
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
    const perCat = {};
    cfg.cats.forEach((cat) => {
      const events = visits.filter((v) => v.cat === cat).map((v) => ({ value: v.duration, ts: v.ts }));
      const byDay = bucketByDay(events, { dayKeyFn: dayKey });
      const lastVisitTs = events.length ? Math.max(...events.map((e) => e.ts)) : null;
      perCat[cat.name] = { ...summarize(byDay, todayKey), lastVisitTs };
    });
    this._analytics = perCat;
    this._loadingAnalytics = false;
    this._checkNoVisitAlerts();
    this._renderAnalyticsArea();
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
    this._renderAnalyticsArea();
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

  // ---------- render ----------
  _render() {
    const cfg = this._config;
    this.shadowRoot.innerHTML = `
      <style>${CARD_STYLES}</style>
      <ha-card>
        <div class="header">
          <div class="title">${cfg.title || DEFAULT_TITLE}</div>
        </div>
        <div class="status-row" id="status-row"></div>
        <div class="controls-row" id="controls-row"></div>
        <div class="chart-section">
          <div class="chart-header">
            <button class="nav-btn" id="prev-day">&#9664;</button>
            <div class="day-label" id="day-label"></div>
            <button class="nav-btn" id="next-day">&#9654;</button>
          </div>
          <div class="usage-section">
            <div id="usage-body"></div>
          </div>
          <div class="chart-area" id="chart-area"></div>
        </div>
        <div class="analytics-section">
          <div class="section-title">Analytics</div>
          <div id="no-visit-banner"></div>
          <div id="decline-banner"></div>
          <div class="analytics-grid" id="analytics-grid"></div>
        </div>
        <div class="records-section">
          <div class="section-title">Working Records</div>
          <div class="records-list" id="records-list"></div>
        </div>
      </ha-card>
    `;
    this.shadowRoot.getElementById('prev-day').addEventListener('click', () => this._changeDay(-1));
    this.shadowRoot.getElementById('next-day').addEventListener('click', () => this._changeDay(1));
    this._updateLiveValues();
    this._renderChartArea();
    this._renderAnalyticsArea();
  }

  _changeDay(delta) {
    this._dayOffset += delta;
    if (this._dayOffset > 0) this._dayOffset = 0;
    this._loadDay();
  }

  _updateLiveValues() {
    if (!this._built) return;
    const cfg = this._config;
    const de = this._deviceEntities;

    // status row: fully config-driven — add/remove/reorder chips via `info_row` in YAML
    const statusRow = this.shadowRoot.getElementById('status-row');
    if (statusRow) {
      const errorState = this._s(de.error, 'no_error');
      const hasError = errorState && errorState !== 'no_error';
      const infoRow = cfg.info_row || [];
      statusRow.innerHTML = [
        ...infoRow.map((spec) => this._renderInfoChip(spec)),
        hasError ? this._chip('mdi:alert', 'Error', errorState.replace(/_/g, ' '), true, de.error) : '',
      ].join('');
      if (!statusRow.dataset.bound) {
        statusRow.dataset.bound = '1';
        // Delegated (not per-chip) so it survives `statusRow.innerHTML` being
        // rebuilt on every live-value update above.
        const openChip = (ev) => {
          const chip = ev.target.closest('.chip[data-entity]');
          if (chip) fireMoreInfo(this, chip.dataset.entity);
        };
        statusRow.addEventListener('click', openChip);
        statusRow.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            openChip(ev);
          }
        });
      }
    }

    // controls row: fully config-driven — add/remove/reorder buttons via `controls_row` in YAML
    const controlsRow = this.shadowRoot.getElementById('controls-row');
    if (controlsRow && !controlsRow.dataset.bound) {
      const controls = cfg.controls_row || [];
      controlsRow.innerHTML = controls
        .map(
          (spec, i) => `
      <ha-control-button class="ctrl-btn" id="ctrl-${i}" label="${escapeHtml(spec.name || '')}">
        <div class="ctrl-btn-content">
          <ha-icon icon="${escapeHtml(spec.icon || 'mdi:help')}"></ha-icon>
          <span>${escapeHtml(spec.name || '')}</span>
        </div>
      </ha-control-button>
    `,
        )
        .join('');
      controlsRow.dataset.bound = '1';
      controls.forEach((spec, i) => {
        this.shadowRoot.getElementById(`ctrl-${i}`).addEventListener('click', () => this._runControlAction(spec));
      });
    }
  }

  _renderInfoChip(spec) {
    const rawValue = this._s(spec.entity, null);
    const { display, warn } = computeChipDisplay(spec, rawValue);
    return this._chip(spec.icon || 'mdi:information-outline', spec.name || spec.entity, display, warn, spec.entity);
  }

  _runControlAction(spec) {
    switch (spec.action) {
      case 'press': {
        if (spec.confirm) {
          if (window.confirm(spec.confirm)) pressButton(this._hass, spec.entity);
        } else {
          pressButton(this._hass, spec.entity);
        }
        break;
      }
      case 'toggle_maintenance': {
        const stateEntity = spec.state_entity || this._deviceEntities.state;
        const state = this._s(stateEntity, '');
        if (state === 'maintenance') pressButton(this._hass, spec.exit_entity);
        else pressButton(this._hass, spec.start_entity);
        break;
      }
      case 'toggle': {
        callService(this._hass, 'homeassistant', 'toggle', { entity_id: spec.entity });
        break;
      }
      case 'more_info': {
        fireMoreInfo(this, spec.entity);
        break;
      }
      default:
        break;
    }
  }

  _chip(icon, label, value, warn, entityId) {
    // icon/label are config-provided, value is often a live entity state --
    // escape all three, since none are guaranteed free of HTML metacharacters.
    // Tappable (opens the entity's native more-info dialog, like a built-in
    // badge/entity row) whenever it's backed by a real entity.
    const tapAttrs = entityId ? ` data-entity="${escapeHtml(entityId)}" tabindex="0"` : '';
    return `
      <div class="chip ${warn ? 'warn' : ''} ${entityId ? 'tappable' : ''}"${tapAttrs}>
        <ha-icon icon="${escapeHtml(icon)}"></ha-icon>
        <div class="chip-text"><div class="chip-label">${escapeHtml(label)}</div><div class="chip-value">${escapeHtml(value)}</div></div>
      </div>`;
  }

  _renderChartArea() {
    if (!this._built) return;
    const dayLabelEl = this.shadowRoot.getElementById('day-label');
    if (dayLabelEl) dayLabelEl.textContent = dayLabel(this._dayOffset);
    const nextBtn = /** @type {HTMLButtonElement|null} */ (this.shadowRoot.getElementById('next-day'));
    if (nextBtn) nextBtn.disabled = this._dayOffset >= 0;

    const area = this.shadowRoot.getElementById('chart-area');
    const recordsList = this.shadowRoot.getElementById('records-list');
    const usageBody = this.shadowRoot.getElementById('usage-body');
    if (!area) return;

    // Deliberately no "Loading…" interstitial: clearing the chart/usage/
    // records content to a placeholder and back on every fetch caused a
    // visible flicker when paging through days quickly (the fetch usually
    // resolves faster than a human can perceive a placeholder frame as
    // anything but a flash). Instead, leave whatever's already on screen
    // alone until the new data actually arrives, then swap it in directly.
    if (this._loadingChart) return;

    const cfg = this._config;
    // The total_use/last_used_by reconstruction drives the chart, the Usage
    // line, and Analytics -- `visits` here is every visit with a resolved
    // identity (a configured cat, or the Unknown pseudo-cat), which is all
    // of them except a visit from before any identity was ever recorded
    // (cat: null, vanishingly rare -- the very first visit ever). Working
    // Records is intentionally NOT built from this data at all; see its own
    // comment below for why.
    const visits = (this._chartVisits || []).filter((v) => v.cat).sort((a, b) => a.ts - b.ts);

    // Chart: 0-24h stem plot
    const width = CHART_WIDTH;
    const height = CHART_HEIGHT;
    const padding = CHART_PADDING;
    const rawMaxDur = Math.max(60, ...visits.map((v) => v.duration));
    const yStep = niceStep(rawMaxDur);
    const niceMax = Math.ceil(rawMaxDur / yStep) * yStep;
    const { start } = dayBounds(this._dayOffset);
    const { xFor, yFor } = buildScales({ dayStart: start, niceMax, width, height, padding });
    const { vertical, horizontal } = buildGridLines({ niceMax, yStep, width, height, padding });

    // Gridlines only -- tick label *text* lives in HTML overlays below, not
    // in the SVG (see the axis label overlay comment above `area.innerHTML`
    // and issue #5: SVG text font-size is in viewBox user-units, not real
    // CSS px, so it can't be given a stable on-screen size).
    const vGridLines = vertical
      .map((v) => `<line x1="${v.x}" y1="${padding.top}" x2="${v.x}" y2="${height - padding.bottom}" class="grid-line-v" />`)
      .join('');

    const hGridLines = horizontal
      .map((h) => `<line x1="${padding.left}" y1="${h.y}" x2="${width - padding.right}" y2="${h.y}" class="grid-line-h" />`)
      .join('');

    // Axis tick labels as absolutely-positioned HTML overlays inside
    // `.chart-wrap`, positioned as a percentage of the wrap's box computed
    // from the same viewBox coordinates the SVG uses. This works because
    // `.chart-wrap`'s rendered box exactly matches the SVG's box (same
    // aspect ratio, width:100%) -- see `.chart-svg`'s height:auto comment in
    // the stylesheet. Real, fixed CSS font-size (`.axis-label`/
    // `.axis-label-y` in the stylesheet) means these no longer grow/shrink
    // with card width the way SVG-text font-size did.
    const xAxisLabelTop = ((height - padding.bottom) / height) * 100;
    const xAxisLabels = vertical
      .map((v) => `<div class="axis-label" style="left:${(v.x / width) * 100}%;top:${xAxisLabelTop}%">${v.label}</div>`)
      .join('');

    // width here is derived from the SAME padding.left the SVG plot itself
    // uses for its left inset (see the .axis-label-y comment in the
    // stylesheet for why this -- not a fixed CSS px -- is what keeps a
    // stem at/near hour 0 from rendering under this label's text).
    const yAxisLabelWidth = (padding.left / width) * 100;
    const yAxisLabels = horizontal
      .map((h) => `<div class="axis-label-y" style="top:${(h.y / height) * 100}%;width:${yAxisLabelWidth}%">${h.label}</div>`)
      .join('');

    const stems = visits
      .map((v, i) => {
        const x = xFor(v.ts);
        const y = yFor(v.duration);
        const bottom = height - padding.bottom;
        return `<line x1="${x}" y1="${bottom}" x2="${x}" y2="${y}" stroke="${v.cat.color}" stroke-width="2" />
              <circle class="visit-point" cx="${x}" cy="${y}" r="5" fill="${v.cat.color}" />
              <line class="visit-hit" data-idx="${i}" x1="${x}" y1="${bottom}" x2="${x}" y2="${y}" stroke="transparent" stroke-width="16" />`;
      })
      .join('');

    area.innerHTML = `
      <div class="chart-wrap">
        <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
          ${hGridLines}
          ${vGridLines}
          ${stems || ''}
        </svg>
        ${xAxisLabels}
        ${yAxisLabels}
        <div class="chart-tooltip" id="chart-tooltip"></div>
      </div>
      ${visits.length === 0 ? '<div class="empty-note">No visits recorded this day</div>' : ''}
    `;

    const tooltip = this.shadowRoot.getElementById('chart-tooltip');
    const chartWrap = area.querySelector('.chart-wrap');
    const visitHits = /** @type {NodeListOf<HTMLElement>} */ (area.querySelectorAll('.visit-hit'));
    visitHits.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        const v = visits[parseInt(el.dataset.idx, 10)];
        const timeStr = new Date(v.ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        tooltip.textContent = `${timeStr} · ${v.cat.name} · ${formatDuration(v.duration)}`;
        // position at the top of the stem (the dot), regardless of where along the line was hovered
        const hitRect = el.getBoundingClientRect();
        const wrapRect = chartWrap.getBoundingClientRect();
        tooltip.style.left = `${hitRect.left - wrapRect.left + hitRect.width / 2}px`;
        tooltip.style.top = `${hitRect.top - wrapRect.top}px`;
        tooltip.classList.add('visible');
      });
      el.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
      });
    });

    // Usage section: driven by the SAME data as the chart (`visits`, above),
    // so it always matches the day currently shown (not a separate live
    // device sensor). `visits` already includes Unknown (it has a real
    // `.color`/`.name`, just not one of `cfg.cats`, so it also plots as a
    // gray stem on the chart above) -- but the usage-line "legend" row is
    // built only from `cfg.cats` PLUS an Unknown entry that's added only
    // when this day actually had one (never a permanent zero-count slot).
    if (usageBody) {
      const perCat = {};
      cfg.cats.forEach((cat) => {
        perCat[cat.name] = { count: 0 };
      });
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
      const catLine =
        cfg.cats
          .map((cat) => {
            const p = perCat[cat.name];
            return `<span class="usage-cat"><span class="dot" style="background:${cat.color}"></span>${cat.name}: ${p.count}</span>`;
          })
          .join('') +
        (unknownCount > 0
          ? `<span class="usage-cat"><span class="dot" style="background:${unknownColor}"></span>${UNKNOWN_CAT_LABEL}: ${unknownCount}</span>`
          : '');
      usageBody.innerHTML = `
        <div class="usage-row">
          <div class="stat-value">${totalCount} time${totalCount === 1 ? '' : 's'}</div>
          <div class="usage-cats">${catLine}</div>
        </div>
      `;
    }

    // Working Records has exactly ONE source of truth, and it's `last_event`
    // -- rendered VERBATIM, never a computed re-phrasing and never
    // interpreted through a pattern/regex. Every row PETKIT reports is
    // shown, in the exact words it used, in arrival order; the only
    // filtering is an explicit, configurable list of raw values to hide
    // entirely (`event_exclude`) -- no guessing at "is this a duplicate" or
    // "is this a visit." There is also deliberately no cross-reference back
    // to the total_use/last_used_by reconstruction that drives the chart/
    // usage/analytics above: merging two independently-computed views of
    // "what happened" and reconciling them with dedupe logic is exactly
    // what caused a string of real bugs before (see git history / issues
    // #13, #14, #16) -- a single, unmodified stream has no reconciliation
    // to get wrong. Trade-off accepted: a Working Records visit row carries
    // no duration (that's still visible via the chart tooltip and the
    // Usage section above).
    const eventHist = this._chartEventHist || [];
    const eventLabels = this._eventLabels();
    const excludeList = (cfg.event_exclude || DEFAULT_EVENT_EXCLUDE).map((s) => String(s).toLowerCase());
    const records = eventHist
      .map((point) => {
        const val = point.s ?? point.state;
        const ts = point.lu ? point.lu * 1000 : point.last_changed ? Date.parse(point.last_changed) : null;
        if (!val || !ts || excludeList.includes(val.toLowerCase())) return null;
        return { ts, icon: 'mdi:information-outline', color: 'var(--secondary-text-color)', text: eventLabels[val] || val };
      })
      .filter(Boolean);
    records.sort((a, b) => b.ts - a.ts);

    if (recordsList) {
      if (records.length === 0) {
        recordsList.innerHTML = '<div class="empty-note">No records for this day</div>';
      } else {
        recordsList.innerHTML = records
          .map(
            (r) => `
          <div class="record-row">
            <div class="record-time">${new Date(r.ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
            <ha-icon icon="${escapeHtml(r.icon)}" style="color:${escapeHtml(r.color)}"></ha-icon>
            <div class="record-text">${escapeHtml(r.text)}</div>
          </div>
        `,
          )
          .join('');
      }
    }
  }

  // Merges any config-provided `event_labels` over the PURAMAX firmware
  // defaults (config wins), so a different device/firmware vocabulary can
  // be supported purely via config, with no card changes.
  _eventLabels() {
    return { ...DEFAULT_EVENT_LABELS, ...(this._config.event_labels || {}) };
  }

  _renderAnalyticsArea() {
    if (!this._built) return;
    const grid = this.shadowRoot.getElementById('analytics-grid');
    const banner = this.shadowRoot.getElementById('decline-banner');
    const noVisitBanner = this.shadowRoot.getElementById('no-visit-banner');
    if (!grid) return;
    // Same no-flicker rationale as _renderChartArea (see its comment): keep
    // whatever's already rendered until fresh analytics resolve. On first
    // mount that just means the grid stays empty for a moment, which reads
    // as a normal load rather than a flashing placeholder.
    if (this._loadingAnalytics || !this._analytics) return;
    const cfg = this._config;
    const threshold = (cfg.decline_threshold_pct || DEFAULT_DECLINE_THRESHOLD_PCT) / 100;
    const warnings = [];
    grid.innerHTML = cfg.cats
      .map((cat) => {
        const a = this._analytics[cat.name] || {};
        if (a.daysOfHistory >= 3 && a.avg7dTotal && new Date().getHours() >= 18) {
          if (a.todayTotal < threshold * a.avg7dTotal) {
            warnings.push(`${cat.name}'s usage today is well below their recent average — worth a check.`);
          } else if (a.todayTotal > (2 - threshold) * a.avg7dTotal) {
            warnings.push(`${cat.name}'s usage today is well above their recent average — worth a check.`);
          }
        }
        return `
        <div class="cat-analytics">
          <table>
            <colgroup>
              <col class="col-name" /><col class="col-stat" /><col class="col-stat" /><col class="col-stat" />
            </colgroup>
            <tr><td class="cat-name-cell"><span class="dot" style="background:${escapeHtml(cat.color)}"></span>${escapeHtml(cat.name)}</td><td>Today</td><td>3d avg</td><td>7d avg</td></tr>
            <tr><td>Visits</td><td>${a.todayCount ?? 0}</td><td>${a.avg3dVisits !== null && a.avg3dVisits !== undefined ? a.avg3dVisits.toFixed(1) : '—'}</td><td>${a.avg7dVisits !== null && a.avg7dVisits !== undefined ? a.avg7dVisits.toFixed(1) : '—'}</td></tr>
            <tr><td>Duration</td><td>${a.todayAvgDuration ? formatDuration(a.todayAvgDuration) : '—'}</td><td>${a.avg3dDuration ? formatDuration(a.avg3dDuration) : '—'}</td><td>${a.avg7dDuration ? formatDuration(a.avg7dDuration) : '—'}</td></tr>
          </table>
        </div>
      `;
      })
      .join('');
    if (banner) {
      banner.innerHTML = warnings.length
        ? warnings.map((w) => `<div class="warn-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${w}</div>`).join('')
        : '';
    }
    if (noVisitBanner) {
      const overdueCats = cfg.cats.filter((cat) => this._analytics[cat.name]?.noVisitAlert?.alerting);
      noVisitBanner.innerHTML = overdueCats.length
        ? overdueCats
            .map((cat) => {
              const { hoursSince } = this._analytics[cat.name].noVisitAlert;
              const since = hoursSince == null ? 'no visits recorded yet' : `last seen ${formatHoursAgo(hoursSince)} ago`;
              return `<div class="no-visit-banner"><ha-icon icon="mdi:cat-alert"></ha-icon>${escapeHtml(cat.name)} hasn't used the litter box recently (${escapeHtml(since)}).</div>`;
            })
            .join('')
        : '';
    }
  }
}
