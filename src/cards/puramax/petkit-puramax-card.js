import { formatDuration, formatHoursAgo, escapeHtml } from '../../lib/format.js';
import { dayBounds, dayLabel, dayKey } from '../../lib/day.js';
import { buildHistoryRequest, deltaEvents, catChangeEvents, attributeCats } from '../../lib/history.js';
import { niceStep, buildScales, buildGridLines } from '../../lib/chart-math.js';
import { bucketByDay, summarize, detectNoVisitAlert } from '../../lib/analytics.js';
import { computeChipDisplay } from '../../lib/chips.js';
import { getState, fireMoreInfo, callService, pressButton } from '../../lib/ha-helpers.js';
import { CARD_STYLES } from './petkit-puramax-card.styles.js';
import {
  DEFAULT_TITLE,
  DEFAULT_EVENT_LABELS,
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
 * analytics with a decline/spike warning. All per-cat analytics are derived
 * client-side from the device's own `total_use` (a running counter that
 * bumps by one visit's duration on every use) and, when there's more than
 * one cat, `last_used_by` (which cat used it most recently) sensors — no
 * accumulator/statistics/per-cat helper entities needed. See
 * `_reconstructVisits()` for how a duration+identity per visit is derived
 * from those two generic sensors.
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
    if (!config.device_entities) {
      throw new Error('petkit-puramax-card: "device_entities" is required in config');
    }
    if (!config.device_entities.total_use) {
      throw new Error('petkit-puramax-card: "device_entities.total_use" is required in config');
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
    if (config.cats.length > 1 && !config.device_entities.last_used_by) {
      throw new Error(
        'petkit-puramax-card: "device_entities.last_used_by" is required in config when more than one cat is configured',
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

    this._config = config;
    this._dayOffset = 0;
    this._analytics = null;
    this._chartData = null;
    this._loadingChart = false;
    this._loadingAnalytics = false;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }

  set hass(hass) {
    const prevHass = this._hass;
    this._hass = hass;
    if (!this._built) {
      this._built = true;
      this._render();
      this._loadDay();
      this._loadAnalytics();
      this._startNoVisitTimer();
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

  connectedCallback() {
    if (this._hass && !this._built) {
      this._built = true;
      this._render();
      this._loadDay();
      this._loadAnalytics();
      this._startNoVisitTimer();
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
    const eid = this._config.device_entities.total_use;
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
  //    every visit is trivially theirs. Attribution is carry-forward (see
  //    `attributeCats`), not an exact-timestamp match, since most PetKit
  //    integrations don't emit a new last_used_by state when the same cat
  //    visits twice in a row.
  //
  // Unlike the automation this replaces, there's no race condition to guard
  // against here: history is only ever read well after both sensors have
  // already settled, whereas the automation's race was about reading LIVE
  // state immediately at trigger time, before a lagging second write landed.
  async _fetchVisits({ start, end }) {
    const cfg = this._config;
    const totalUseReq = buildHistoryRequest({
      startTime: start,
      endTime: end,
      entityIds: [cfg.device_entities.total_use],
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
        entityIds: [cfg.device_entities.last_used_by],
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

    const durationEvents = deltaEvents(totalUseResult[cfg.device_entities.total_use], {
      minDelta: 0,
      maxDelta: MAX_VALID_VISIT_SECONDS,
    });

    let attributed;
    if (cfg.cats.length > 1) {
      const knownNames = cfg.cats.map((c) => c.name);
      const catEvents = catChangeEvents(lastUsedByResult[cfg.device_entities.last_used_by], knownNames);
      attributed = attributeCats(durationEvents, catEvents);
    } else {
      attributed = durationEvents.map((e) => ({ ...e, cat: cfg.cats[0].name }));
    }

    const catsByName = new Map(cfg.cats.map((c) => [c.name, c]));
    // A duration event with no resolvable cat (e.g. the very first visit
    // ever, before any last_used_by value has been recorded) can't be
    // rendered against a specific cat and is dropped rather than guessed.
    return attributed
      .filter((e) => catsByName.has(e.cat))
      .map((e) => ({ cat: catsByName.get(e.cat), duration: e.value, ts: e.ts }));
  }

  // ---------- data loading ----------
  async _loadDay() {
    if (!this._hass) return;
    this._loadingChart = true;
    this._renderChartArea();
    const cfg = this._config;
    const { start, end } = dayBounds(this._dayOffset);
    let visits = [];
    let eventHist = [];
    try {
      const [visitsResult, eventResult] = await Promise.all([
        this._fetchVisits({ start, end }),
        cfg.device_entities.last_event
          ? this._hass.callWS(
              buildHistoryRequest({ startTime: start, endTime: end, entityIds: [cfg.device_entities.last_event] }),
            )
          : Promise.resolve({}),
      ]);
      visits = visitsResult;
      eventHist = (eventResult || {})[cfg.device_entities.last_event] || [];
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
    const de = cfg.device_entities;

    // status row: fully config-driven — add/remove/reorder chips via `info_row` in YAML
    const statusRow = this.shadowRoot.getElementById('status-row');
    if (statusRow) {
      const errorState = this._s(de.error, 'no_error');
      const hasError = errorState && errorState !== 'no_error';
      const infoRow = cfg.info_row || [];
      statusRow.innerHTML = [
        ...infoRow.map((spec) => this._renderInfoChip(spec)),
        hasError ? this._chip('mdi:alert', 'Error', errorState.replace(/_/g, ' '), true) : '',
      ].join('');
    }

    // controls row: fully config-driven — add/remove/reorder buttons via `controls_row` in YAML
    const controlsRow = this.shadowRoot.getElementById('controls-row');
    if (controlsRow && !controlsRow.dataset.bound) {
      const controls = cfg.controls_row || [];
      controlsRow.innerHTML = controls
        .map(
          (spec, i) => `
        <button class="ctrl-btn" id="ctrl-${i}"><ha-icon icon="${spec.icon || 'mdi:help'}"></ha-icon><span>${spec.name || ''}</span></button>
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
    return this._chip(spec.icon || 'mdi:information-outline', spec.name || spec.entity, display, warn);
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
        const stateEntity = spec.state_entity || this._config.device_entities.state;
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

  _chip(icon, label, value, warn) {
    // icon/label are config-provided, value is often a live entity state --
    // escape all three, since none are guaranteed free of HTML metacharacters.
    return `
      <div class="chip ${warn ? 'warn' : ''}">
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
    const visits = (this._chartVisits || []).slice().sort((a, b) => a.ts - b.ts);

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

    const yAxisLabels = horizontal
      .map((h) => `<div class="axis-label-y" style="top:${(h.y / height) * 100}%">${h.label}</div>`)
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

    // Usage section: driven by the SAME data as the chart, so it always
    // matches the day currently shown (not a separate live device sensor).
    if (usageBody) {
      const perCat = {};
      cfg.cats.forEach((cat) => {
        perCat[cat.name] = { count: 0 };
      });
      visits.forEach((v) => {
        perCat[v.cat.name].count += 1;
      });
      const totalCount = visits.length;
      const catLine = cfg.cats
        .map((cat) => {
          const p = perCat[cat.name];
          return `<span class="usage-cat"><span class="dot" style="background:${cat.color}"></span>${cat.name}: ${p.count}</span>`;
        })
        .join('');
      usageBody.innerHTML = `
        <div class="usage-row">
          <div class="stat-value">${totalCount} time${totalCount === 1 ? '' : 's'}</div>
          <div class="usage-cats">${catLine}</div>
        </div>
      `;
    }

    // Working records: merge visit events + last_event changes
    const records = visits.map((v) => ({
      ts: v.ts,
      icon: 'mdi:cat',
      color: v.cat.color,
      text: `${v.cat.name} just spent ${formatDuration(v.duration)} in the litter box`,
    }));
    const eventHist = this._chartEventHist || [];
    const eventLabels = this._eventLabels();
    // Coordinators/integrations occasionally flicker an entity to
    // unavailable/unknown and back to whatever value it held before the
    // blip -- that recovery is a re-assertion of the same event, not a new
    // one, so it must not become a second Working Records row. Comparing
    // only against the immediately preceding point would miss this (the
    // preceding point is the hidden "unavailable" itself), so track the
    // last real value shown instead and skip an exact repeat of it.
    let lastShownVal = null;
    eventHist.forEach((point) => {
      const val = point.s ?? point.state;
      const ts = point.lu ? point.lu * 1000 : point.last_changed ? Date.parse(point.last_changed) : null;
      if (!val || !ts) return;
      if (val in eventLabels && eventLabels[val] === null) return;
      if (val === lastShownVal) return;
      lastShownVal = val;
      const label = eventLabels[val] || val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      records.push({ ts, icon: 'mdi:information-outline', color: 'var(--secondary-text-color)', text: label });
    });
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
