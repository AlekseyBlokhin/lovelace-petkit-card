/**
 * Default labels for `device_entities.last_event` state values, as reported
 * by PETKIT PURAMAX firmware. This is PURAMAX-specific vocabulary — an
 * architecture audit found it hardcoded inline in the card's DOM-rendering
 * code, which meant a different PETKIT device (or a future firmware
 * version with new event names) couldn't be supported without editing the
 * card. It's now a config-overridable default: an optional `event_labels`
 * config object is shallow-merged over this map (config wins).
 *
 * A value of `null` means "don't show a Working Records row for this event"
 * (used for the device's own "nothing has happened yet" placeholder state,
 * and for the generic HA special-states `unavailable`/`unknown`, which can
 * show up on any entity, e.g. during a restart or a brief connectivity
 * blip, and are noise rather than a real device event). A user can hide any
 * other noisy state the same way via their own `event_labels` config.
 *
 * @type {Record<string, string|null>}
 */
export const DEFAULT_EVENT_LABELS = {
  maintenance_mode: 'Maintenance mode',
  manual_odor_completed: 'Manual odor removal done',
  auto_cleaning_completed: 'Auto cleaning done',
  no_events_yet: null,
  unavailable: null,
  unknown: null,
};

/** Default card title shown when config doesn't set one. */
export const DEFAULT_TITLE = 'PETKIT PURAMAX';

/** Default decline/spike alert threshold, as a percent (0-100). */
export const DEFAULT_DECLINE_THRESHOLD_PCT = 60;

/**
 * Upper bound (seconds) on a plausible single-visit duration, used when
 * reconstructing visits from a device's cumulative "total use" counter.
 * Deltas at or above this (e.g. a multi-hour gap from the device having
 * been offline) are treated as not a real single visit rather than an
 * implausibly long one.
 */
export const MAX_VALID_VISIT_SECONDS = 1800;

/** Chart layout constants (pixels, in the SVG's own viewBox coordinate space). */
export const CHART_WIDTH = 600;
export const CHART_HEIGHT = 240;
/**
 * `left`/`bottom` reserve room for the HTML axis-label overlays (see
 * `_renderChartArea()`), NOT for SVG text anymore -- axis label text moved
 * out of the SVG entirely (issue #5) so it can use a real, fixed CSS
 * font-size instead of a viewBox-scaled one. These paddings only need to
 * keep the plotted gridlines/stems clear of where the HTML label overlay
 * sits: `left` clears the fixed-width y-axis label column (see
 * `.axis-label-y` in petkit-puramax-card.styles.js, sized for the widest
 * "MM'SS\"" label), `bottom` reserves a thin band below the plot for the
 * x-axis label row. Both are approximations tuned for this card's typical
 * ~280-320px rendered width (see the `.chart-svg` comment) -- since the
 * HTML labels no longer scale with card width, alignment is not pixel-exact
 * at every card width, only "close enough by eye" at the typical size.
 */
export const CHART_PADDING = { left: 46, right: 10, top: 10, bottom: 28 };
