# lovelace-petkit-card

[![CI](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/ci.yml/badge.svg)](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/ci.yml)
[![HACS validation](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/hacs-validate.yml/badge.svg)](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/hacs-validate.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/AlekseyBlokhin/lovelace-petkit-card/blob/main/LICENSE)

A Home Assistant Lovelace custom card for PETKIT smart litter boxes: device
status, controls, and per-cat visit analytics — computed entirely
client-side from the device's own `total_use` and `last_used_by` sensor
history. No helper entities and no companion automation are needed at all;
the card reconstructs every visit's duration and cat identity straight from
sensors your PetKit integration already provides.

<!-- screenshot placeholder: add a real screenshot here after the first install -->

## What it does

- Device status chips and control buttons, both fully config-driven
  (`info_row` / `controls_row` arrays — add, remove, or reorder them purely
  in YAML, no code changes).
- A day-switchable per-cat visit chart (a 0-24h "stem plot"), reconstructed
  from the device's `total_use`/`last_used_by` sensors — no per-cat helper
  entities needed. A visit the device itself couldn't identify a cat for
  plots as a neutral gray "Unknown" stem rather than being dropped.
- A Working Records timeline: the device's own `last_event` history, shown
  verbatim — the literal text PETKIT reported, not a computed
  re-phrasing. No duration (that's in the chart/Usage line instead), and no
  attempt to detect or reinterpret a "visit" row via pattern-matching --
  see *How Working Records works* below.
- Today / 3-day-avg / 7-day-avg per-cat analytics, with a decline/spike
  warning banner.
- A per-cat "no visit in N hours" alert banner (configurable, default 8h),
  independent of the decline banner's rolling-average comparison — it won't
  miss a gradual decline the way a percentage-vs-average check can, since
  it's an absolute time check. Optionally pushes a notification too, via any
  `notify.*` entity you configure.
- A real visual config editor (drag the card onto a dashboard and configure
  it with forms — no YAML required to get started), built entirely from
  Home Assistant's own native frontend elements (`ha-form`,
  `ha-expansion-panel`, `ha-icon-button`, a real color-picker for cat
  colors) so it looks and behaves like Home Assistant's own settings pages.

## Prerequisites

- **A PetKit Home Assistant integration**, already installed and configured, exposing your device's entities — either [`RobertD502/home-assistant-petkit`](https://github.com/RobertD502/home-assistant-petkit) or [`Jezza34000/homeassistant_petkit`](https://github.com/Jezza34000/homeassistant_petkit). This card only reads entities; it doesn't talk to PetKit's API itself, and doesn't care which of the two integrations provided them.
- **No helper entities and no companion automation.** The card reads directly from your integration's own "total use" and (if you have more than one cat) "last used by" sensors.
- **No other custom Lovelace cards are required.** This card and its visual editor are self-contained — built only on Home Assistant's own built-in frontend elements (`ha-form`, `ha-icon`, `ha-expansion-panel`, `ha-icon-button`), zero runtime npm dependencies (`package.json` has none). You don't need `card-mod`, `auto-entities`, or anything else installed for it to work.

## Installation

### Via HACS (custom repository)

This card isn't in the default HACS store yet, so add it as a custom
repository:

1. In Home Assistant, go to **HACS → the 3-dot menu (top right) → Custom
   repositories**.
2. Add `https://github.com/AlekseyBlokhin/lovelace-petkit-card` with
   category **Dashboard** (Lovelace plugin).
3. Find **PETKIT PURAMAX Card** in HACS and click **Download**.
4. Home Assistant should auto-register the Lovelace resource. If it
   doesn't, add it manually: **Settings → Dashboards → the 3-dot menu →
   Resources → Add Resource**, URL `/hacsfiles/lovelace-petkit-card/petkit-puramax-card.js`,
   type **JavaScript Module**.
5. Reload the frontend (or hard-refresh the browser).

### Manual installation

1. Download `petkit-puramax-card.js` from the
   [latest release](https://github.com/AlekseyBlokhin/lovelace-petkit-card/releases/latest).
2. Copy it to `<config>/www/petkit-puramax-card.js`.
3. Add it as a Lovelace resource: **Settings → Dashboards → the 3-dot menu
   → Resources → Add Resource**, URL `/local/petkit-puramax-card.js`, type
   **JavaScript Module**.
4. Reload the frontend.

## Adding the card

Either drag **PETKIT PURAMAX Card** from the card picker onto a dashboard
and configure it with the visual editor, or add it via YAML:

```yaml
type: custom:petkit-puramax-card
```

(then fill in `device_entities` and `cats` — see the reference below, or a
full example at [`examples/dashboard-config.yaml`](./examples/dashboard-config.yaml)).

## Configuration reference

| Key | Required | Type | Default | Description |
|---|---|---|---|---|
| `type` | yes | string | — | Must be `custom:petkit-puramax-card`. |
| `title` | no | string | `"PETKIT PURAMAX"` | Card header title. |
| `device_entities` | yes | object | — | See below. |
| `device_entities.total_use` | yes | entity id | — | The sensor that bumps by one visit's duration on every use (shared across all cats, e.g. PetKit's "Total use"). Its history is the data source for every visit's duration, for all cats combined. |
| `device_entities.last_used_by` | required if >1 cat | entity id | — | The sensor reporting which cat used the box most recently (e.g. PetKit's "Last used by"). Only needed to disambiguate cats when there's more than one — with a single cat every visit is trivially theirs. |
| `device_entities.error` | no | entity id | — | Sensor reporting the device's current error/status code. |
| `device_entities.last_event` | no | entity id | — | Sensor reporting the device's most recent maintenance/cleaning event. |
| `device_entities.state` | no | entity id | — | Sensor reporting the device's current operating state (used by the `toggle_maintenance` control action). |
| `event_labels` | no | object (`{state: label}`) | `{}` | Merged over the built-in PURAMAX event-label map (config wins). Purely cosmetic renaming of a known raw `last_event` value to nicer text (e.g. `auto_cleaning_completed` → "Auto cleaning done") — never decides whether a row is shown, only how it's captioned. Any raw value with no entry here (including every visit narration) is shown completely verbatim. YAML-only — no visual editor field. |
| `event_exclude` | no | array of strings | `["unavailable", "unknown", "no_events_yet"]` | Raw `last_event` state values hidden from Working Records entirely, matched case-insensitively against the exact raw state (never a substring/pattern — a real "Unknown used the litter box" visit is never affected, since its raw text isn't the bare word "unknown"). Replaces the default list rather than merging with it. YAML-only — no visual editor field. |
| `unknown_cat_color` | no | string (CSS color) | `#9e9e9e` | Chart/Usage-line color for a visit the device itself couldn't identify a cat for (`last_used_by` reporting PURAMAX's `unknown_pet` placeholder). Unrelated to Working Records, which never inspects visit identity. |
| `cats` | yes | array, min 1 | — | One entry per cat. See below. |
| `cats[].name` | yes | string | — | Display name. Must exactly match this cat's value as reported by `device_entities.last_used_by` — that's how a reconstructed visit gets attributed back to this cat. Not required to match when there's only one cat. |
| `cats[].color` | yes | string (CSS color) | — | Chart/legend color for this cat. Picked via HA's native color selector in the visual editor. |
| `info_row` | no | array | `[]` | Status chips, in order. See below. |
| `info_row[].entity` | yes | entity id | — | Entity whose state is displayed. |
| `info_row[].name` | no | string | entity id | Chip label. |
| `info_row[].icon` | no | string (mdi icon) | `mdi:information-outline` | Chip icon. |
| `info_row[].unit` | no | string | — | Appended to the raw state, e.g. `%`. |
| `info_row[].value_map` | no | object (`{state: label}`) | — | Maps a raw state to a display string (takes precedence over `unit`). YAML-only — no visual editor field. |
| `info_row[].warn_below` | no | number | — | Chip renders in a "warn" style if the numeric state is below this. |
| `info_row[].warn_above` | no | number | — | Chip renders in a "warn" style if the numeric state is above this. |
| `info_row[].warn_state` | no | string | — | Chip renders in a "warn" style if the raw state exactly equals this. |
| `controls_row` | no | array | `[]` | Buttons, in order. See below. |
| `controls_row[].name` | no | string | — | Button label. |
| `controls_row[].icon` | no | string (mdi icon) | `mdi:help` | Button icon. |
| `controls_row[].action` | yes | `press` \| `toggle_maintenance` \| `toggle` \| `more_info` | — | What the button does. |
| `controls_row[].entity` | action-dependent | entity id | — | Required for `press`, `toggle`, `more_info`. |
| `controls_row[].confirm` | no | string | — | If set, `press` shows a confirmation dialog with this text first. |
| `controls_row[].start_entity` | action-dependent | entity id (`button`) | — | Required for `toggle_maintenance`: pressed when not currently in maintenance mode. |
| `controls_row[].exit_entity` | action-dependent | entity id (`button`) | — | Required for `toggle_maintenance`: pressed when currently in maintenance mode. |
| `controls_row[].state_entity` | no | entity id | `device_entities.state` | Overrides which entity `toggle_maintenance` reads to decide its current mode. |
| `decline_threshold_pct` | no | number, 0-100 | `60` | Analytics warns when today's total is below this percent of the 7-day average (or symmetrically above `200 - this`). |
| `no_visit_alert_hours` | no | number, 1-168 | `8` | Shows a per-cat "hasn't used the litter box" banner once a cat's most recent visit is at least this many hours ago. An absolute check, not relative to history — won't drift the way a rolling-average comparison can. |
| `notify_service` | no | entity id (`notify` domain) | — | If set, also calls this notify entity/service (once per overdue episode, not on every re-render) when a cat crosses `no_visit_alert_hours`. This only fires while the card is actually loaded in a browser/companion-app tab — for a guarantee independent of whether a dashboard is open, pair it with (or use instead) a native HA automation. |

`cats`, `info_row`, and `controls_row` all have a repeating-row visual
editor (add/remove buttons); `value_map`, `event_labels`, and
`event_exclude` are YAML-only since an arbitrary object/array has no clean
`ha-form` widget.

## How the chart, Usage line, and Analytics work

There's no helper entity and no companion automation to set up — these are
derived purely from `total_use`/`last_used_by` history the card already
fetches (Working Records does NOT use this reconstruction at all — see the
next section):

1. **Duration**: `device_entities.total_use` is a running counter that
   bumps by one visit's duration on every use. The delta between
   consecutive history readings *is* that visit's duration. Non-positive or
   implausibly large deltas (a daily counter reset, or a multi-hour gap from
   the device having been offline) are filtered out rather than read as a
   real visit.
2. **Identity** (only fetched/needed with more than one cat):
   `device_entities.last_used_by` reports which cat used the box most
   recently — either a configured cat's name, or PURAMAX's own
   `unknown_pet` placeholder when the device couldn't identify the cat
   (kept as a real "Unknown" identity, not dropped as noise). Most PetKit
   integrations only write a *new* state when the identity actually
   changes — two visits by the same cat in a row don't produce a second
   history point — so attribution is nearest-neighbor matching, not an
   exact-timestamp match: each visit is bounded to a "territory" (the
   midpoint to the previous real visit, to the midpoint to the next one)
   and takes whichever identity write lands nearest its own timestamp
   within that span, or carries forward the last resolved identity if its
   territory has none of its own. This correctly handles both repeat
   visits by the same cat and a real write-order quirk where
   `last_used_by`'s write for a visit can lag `total_use`'s by anywhere
   from milliseconds to (rarely) well over a minute — a fixed tolerance
   window can't safely cover that whole range (a wide-enough window risks
   stealing a *different*, nearby real visit's own identity write instead),
   but a territory bounded by real neighboring visits can, without ever
   reaching across one. See `attributeCats` in `src/lib/history.js` for the
   real captured data this was measured from.
3. **Glitch filtering**: a positive `total_use` delta that the very next
   reading undoes exactly (the value returns to precisely its pre-delta
   level, usually within seconds) is discarded rather than read as a real
   visit — a genuine increment is permanent and never reverts like that.

A visit attributed to "Unknown" plots as a neutral gray chart stem and
appears in the Usage line's legend on any day it occurs, but never counts
toward a configured cat's Analytics totals (those are inherently
per-named-cat views).

## How Working Records works

Working Records is `device_entities.last_event`'s own history, shown
**verbatim** — the exact text PETKIT reported, in arrival order. The only
filtering is `event_exclude` (an explicit, configurable list of raw values
to hide entirely) and `event_labels` (a purely cosmetic exact-match
rename). There is no pattern-matching against the text to detect "is this a
visit," no synthesized re-phrasing, and no cross-reference back to the
`total_use`/`last_used_by` reconstruction above — merging two
independently-computed views of "what happened" and reconciling them with
dedupe logic is exactly what caused a string of real bugs in earlier
versions of this card (duplicate rows, phantom rows, a real visit silently
collapsed by a dedupe heuristic that couldn't tell it apart from a
connectivity-blip artifact). A single, unmodified stream has none of that
to get wrong — trade-off accepted: a Working Records visit row has no
duration (still visible via the chart tooltip and the Usage line, which use
the `total_use` reconstruction instead).

## Supported devices

Today this card only supports the **PETKIT PURAMAX** — that's the only
device I own, and the config schema (`device_entities`, event vocabulary)
is written against its sensors.

Other PETKIT devices are very welcome, but need community-contributed data
to support: please open a
[New device support request](https://github.com/AlekseyBlokhin/lovelace-petkit-card/issues/new?template=new-device-support.yml)
with your device's entities and example states/attributes. See
[CONTRIBUTING.md](./CONTRIBUTING.md) for details on what's needed and how a
new device card would be added to this repo.

## License

MIT — see [LICENSE](./LICENSE).
