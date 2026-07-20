/**
 * Optional display-relabeling for `device_entities.last_event` state
 * values, as reported by PETKIT PURAMAX firmware. Purely cosmetic renaming
 * of a KNOWN exact raw value to nicer text (`auto_cleaning_completed` ->
 * "Auto cleaning done") -- never used to hide, exclude, or otherwise decide
 * WHETHER a row is shown (see `DEFAULT_EVENT_EXCLUDE` for that). An
 * optional `event_labels` config object is shallow-merged over this map
 * (config wins); any raw value with no entry here (including every visit
 * narration, e.g. "Whiskers used the litter box") is shown completely
 * verbatim, exactly as PETKIT reported it -- Working Records never runs raw
 * state text through any pattern/regex to detect, reinterpret, or reformat
 * it.
 *
 * @type {Record<string, string>}
 */
export const DEFAULT_EVENT_LABELS = {
  maintenance_mode: 'Maintenance mode',
  manual_odor_completed: 'Manual odor removal done',
  auto_cleaning_completed: 'Auto cleaning done',
};

/**
 * Default `event_exclude` list: raw `last_event` state values hidden from
 * Working Records entirely, matched case-insensitively against the exact
 * raw state value (a plain equality check, never a substring/pattern match
 * -- so this can never accidentally hide a real "Unknown used the litter
 * box" visit narration, whose raw state is a completely different string
 * from the bare `unknown` special-state this targets). Covers the two
 * generic HA special-states (`unavailable`/`unknown`, which can show up on
 * ANY entity during a restart or connectivity blip) plus PURAMAX's own
 * "nothing has happened yet" placeholder. User-overridable via the
 * `event_exclude` config array (replaces this default, not merged with it
 * -- pass your own full list if you want to keep these plus more).
 *
 * @type {string[]}
 */
export const DEFAULT_EVENT_EXCLUDE = ['unavailable', 'unknown', 'no_events_yet'];

/**
 * Fallback color for a chart/analytics visit whose `last_used_by` value was
 * `UNKNOWN_CAT_STATE` (see `src/lib/history.js`) -- the device's own "I
 * couldn't identify this cat" assertion. A neutral gray, matching how the
 * PetKit app itself displays an unidentified visit -- override via the
 * `unknown_cat_color` config key if it doesn't match your app's exact
 * shade. Unrelated to Working Records, which never inspects `last_event`
 * text closely enough to know which cat (if any) a row is about.
 *
 * @type {string}
 */
export const DEFAULT_UNKNOWN_CAT_COLOR = '#9e9e9e';

/** Default card title shown when config doesn't set one. */
export const DEFAULT_TITLE = 'PETKIT PURAMAX';

/** Default decline/spike alert threshold, as a percent (0-100). */
export const DEFAULT_DECLINE_THRESHOLD_PCT = 60;

/** Default "no visit in N hours" alert threshold, in hours. */
export const DEFAULT_NO_VISIT_ALERT_HOURS = 8;

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
 * sits: `left` clears the y-axis label column, `bottom` reserves a thin
 * band below the plot for the x-axis label row.
 *
 * `left` is the SINGLE source of truth for the y-axis label column's width
 * too: `_renderChartArea()` sets `.axis-label-y`'s inline `width` to
 * `(padding.left / CHART_WIDTH) * 100` (a percentage of the chart, exactly
 * matching where `xFor` places hour-0 on the x-axis), rather than the
 * stylesheet guessing an independent fixed CSS px for that column. A fixed
 * px there previously only "roughly" lined up with this padding at one
 * specific rendered card width (px is real screen pixels; this padding is
 * SVG viewBox units, which scale with the card's actual rendered width) --
 * they diverged at every other width, which is what let a visit at/near
 * hour 0 (midnight) render its stem under the label text. Deriving both
 * from this one value keeps them aligned at any card width; if you need
 * more/less clearance, change `left` here and both sides move together.
 */
export const CHART_PADDING = { left: 46, right: 10, top: 10, bottom: 28 };
