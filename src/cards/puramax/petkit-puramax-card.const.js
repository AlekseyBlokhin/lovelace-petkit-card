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

/** Chart layout constants (pixels, in the SVG's own viewBox coordinate space). */
export const CHART_WIDTH = 600;
export const CHART_HEIGHT = 240;
export const CHART_PADDING = { left: 64, right: 10, top: 10, bottom: 26 };
