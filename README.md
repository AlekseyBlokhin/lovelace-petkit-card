# lovelace-petkit-card

[![CI](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/ci.yml/badge.svg)](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/ci.yml)
[![HACS validation](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/hacs-validate.yml/badge.svg)](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/hacs-validate.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/AlekseyBlokhin/lovelace-petkit-card/blob/main/LICENSE)

## Table of Contents

- [What it does](#what-it-does)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Via HACS (custom repository)](#via-hacs-custom-repository)
  - [Manual installation](#manual-installation)
- [Adding the card](#adding-the-card)
- [Configuration reference](#configuration-reference)
  - [Top-level keys](#top-level-keys)
  - [`device_entities`](#device_entities)
  - [`cats[]`](#cats)
  - [`info_row[]`](#info_row)
  - [`controls_row[]`](#controls_row)
- [Supported devices](#supported-devices)
- [License](#license)

A Home Assistant Lovelace custom card for PETKIT smart litter boxes: device
status, controls, and per-cat visit analytics — reconstructed entirely from
sensors your existing PetKit integration already provides, with nothing
extra to set up.

![The PETKIT PURAMAX card showing status chips, controls, the per-cat visit chart, Working Records, and Analytics](docs/media/card-overview.png)

## What it does

- Device status chips (top-right state badge included) and control
  buttons, both fully config-driven (`info_row` / `controls_row` arrays —
  add, remove, or reorder them purely in YAML, no code changes). A chip/
  control with no `name`/`icon` set shows the entity's own live name/icon,
  the same defaults a built-in card would use. Tapping a status chip opens
  that entity's native Home Assistant more-info dialog; controls use the
  same `tap_action`/`hold_action`/`double_tap_action` config every
  built-in card's interactions do, and can be conditionally shown via a
  native `visibility` condition (e.g. a Start/Exit Maintenance pair, each
  visible only in one device state).
- Point it at your PetKit device once (`device_id`, picked from a native
  device selector) and it auto-detects the sensors it needs from the
  device's own entity registry — no hunting down and typing in five entity
  ids by hand — plus a starter set of status chips and controls built from
  whatever that device actually has.
- A day-switchable per-cat visit chart (a 0-24h "stem plot"). A visit the
  device itself couldn't identify a cat for plots as a neutral gray
  "Unknown" stem rather than being dropped.
- A [Working Records](./docs/ARCHITECTURE.md#how-working-records-works)
  timeline — a verbatim log of the device's recent activity and
  maintenance events, straight from PETKIT.
- Today / 3-day-avg / 7-day-avg per-cat
  [Analytics](./docs/ARCHITECTURE.md#how-the-chart-usage-line-and-analytics-work),
  with a decline/spike warning banner.
- A per-cat "no visit in N hours" alert banner (configurable, default 8h),
  independent of the decline banner's rolling-average comparison — it won't
  miss a gradual decline the way a percentage-vs-average check can, since
  it's an absolute time check. Optionally pushes a notification too, via any
  `notify.*` entity you configure.
- A real visual config editor — drag the card onto a dashboard and
  configure it with forms, no YAML required to get started. It looks and
  behaves just like Home Assistant's own settings pages: a "Content"
  section up front (title, device, and toggles for which sections show),
  drag-to-reorder cats/status chips/controls, and the same add-an-entity /
  Edit-opens-a-sub-page flow as the built-in Entities Card.

## Prerequisites

A PetKit Home Assistant integration, already installed and configured,
exposing your device's entities — either
[`RobertD502/home-assistant-petkit`](https://github.com/RobertD502/home-assistant-petkit)
or
[`Jezza34000/homeassistant_petkit`](https://github.com/Jezza34000/homeassistant_petkit).
This card only reads entities; it doesn't talk to PetKit's API itself, and
doesn't care which of the two integrations provided them.

## Installation

### Via HACS (custom repository)

[![Open your Home Assistant instance and add this repository.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=AlekseyBlokhin&repository=lovelace-petkit-card&category=dashboard)

This card isn't in the default HACS store yet, so add it as a custom
repository (or use the one-click badge above):

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
and configure it with the visual editor, or add it via YAML. This is the
smallest valid configuration — every other key (see
[Configuration reference](#configuration-reference) below) takes its
documented default:

```yaml
type: custom:petkit-puramax-card
device_id: <your PetKit device>
cats:
  - name: Whiskers
    color: "#4fc3f7"
```

`device_id` (pick it from a native device picker in the visual editor)
auto-detects `total_use`/`last_used_by`/`error`/`last_event`/`state` from
your PetKit device's own entity registry — no need to look up and type in
each entity id by hand. If you'd rather wire them up explicitly (or the
auto-detection misses one), skip `device_id` and use `device_entities`
instead:

```yaml
type: custom:petkit-puramax-card
device_entities:
  total_use: sensor.petkit_puramax_total_use
cats:
  - name: Whiskers
    color: "#4fc3f7"
```

For status chips, control buttons, a second cat, custom event labels, and
alerts, see the [Configuration reference](#configuration-reference) below,
or a full example at
[`examples/dashboard-config.yaml`](./examples/dashboard-config.yaml).

## Configuration reference

### Top-level keys

| Key | Required | Type | Default | Description |
|---|---|---|---|---|
| `type` | yes | string | — | Must be `custom:petkit-puramax-card`. |
| `title` | no | string | `"PETKIT PURAMAX"` | Card header title. |
| `show_state` | no | boolean | `true` | Shows [`device_entities.state`](#device_entities) top-right of the header (e.g. "Idle"). Tapping it opens that entity's native more-info dialog, same as a status chip. |
| `show_history` | no | boolean | `true` | Shows the day-switchable visit chart and its "Usage `<Day>`" line. |
| `show_working_records` | no | boolean | `true` | Shows the [Working Records](./docs/ARCHITECTURE.md#how-working-records-works) timeline. |
| `show_analytics` | no | boolean | `true` | Shows the [Analytics](./docs/ARCHITECTURE.md#how-the-chart-usage-line-and-analytics-work) section, including the decline/spike and "no visit" banners. |
| `device_id` | one of `device_id`/`device_entities.total_use` required | device id | — | Your PetKit device (native device picker in the visual editor). Auto-detects `device_entities.{total_use,last_used_by,error,last_event,state}` from the device's entity registry, by matching each sensor's stable `translation_key` — works regardless of what you've renamed the `entity_id`/friendly name to. Any key also set explicitly in `device_entities` overrides the auto-detected one. If a required sensor (`total_use`, or `last_used_by` when there's more than one cat) can't be auto-detected and isn't overridden, the card shows an in-card error naming the missing sensor. |
| `device_entities` | one of `device_id`/`device_entities.total_use` required | object | — | See [`device_entities`](#device_entities) below. Optional (and acts only as an override on top of `device_id`'s auto-detection) once `device_id` is set. |
| `event_labels` | no | object (`{state: label}`) | `{}` | Merged over the built-in PURAMAX event-label map (config wins). Purely cosmetic renaming of a known raw `last_event` value to nicer text (e.g. `auto_cleaning_completed` → "Auto cleaning done") — never decides whether a row is shown, only how it's captioned. Any raw value with no entry here (including every visit narration) is shown completely verbatim. YAML-only — no visual editor field. |
| `event_exclude` | no | array of strings | `["unavailable", "unknown", "no_events_yet"]` | Raw `last_event` state values hidden from [Working Records](./docs/ARCHITECTURE.md#how-working-records-works) entirely, matched case-insensitively against the exact raw state (never a substring/pattern — a real "Unknown used the litter box" visit is never affected, since its raw text isn't the bare word "unknown"). Replaces the default list rather than merging with it. YAML-only — no visual editor field. |
| `unknown_cat_color` | no | string (CSS color) | `#9e9e9e` | Chart/Usage-line color for a visit the device itself couldn't identify a cat for ([`device_entities.last_used_by`](#device_entities) reporting PURAMAX's `unknown_pet` placeholder). Unrelated to [Working Records](./docs/ARCHITECTURE.md#how-working-records-works), which never inspects visit identity. YAML-only — no visual editor field. |
| `cats` | yes | array, min 1 | — | One entry per cat. See [`cats[]`](#cats) below. |
| `info_row` | no | array | `[]` | Status chips, in order. See [`info_row[]`](#info_row) below. |
| `controls_row` | no | array | `[]` | Buttons, in order. See [`controls_row[]`](#controls_row) below. |
| `decline_threshold_pct` | no | number, 0-100 | `60` | [Analytics](./docs/ARCHITECTURE.md#how-the-chart-usage-line-and-analytics-work) warns when today's total is below this percent of the 7-day average (or symmetrically above `200 - this`). |
| `no_visit_alert_hours` | no | number, 1-168 | `8` | Shows a per-cat "hasn't used the litter box" banner once a cat's most recent visit is at least this many hours ago. An absolute check, not relative to history — won't drift the way a rolling-average comparison can. |
| `notify_service` | no | entity id (`notify` domain) | — | If set, also calls this notify entity/service (once per overdue episode, not on every re-render) when a cat crosses `no_visit_alert_hours`. This only fires while the card is actually loaded in a browser/companion-app tab — for a guarantee independent of whether a dashboard is open, pair it with (or use instead) a native HA automation. |

### `device_entities`

Every key here is auto-detected once `device_id` is set (see above) — only
set a key explicitly if you want to override what was auto-detected, or
you're not using `device_id` at all.

| Key | Required | Type | Default | Description |
|---|---|---|---|---|
| `total_use` | yes, unless auto-detected via `device_id` | entity id | — | The sensor that bumps by one visit's duration on every use (shared across all cats, e.g. PetKit's "Total use"). Its history is the data source for every visit's duration, for all cats combined. |
| `last_used_by` | required if >1 cat, unless auto-detected via `device_id` | entity id | — | The sensor reporting which cat used the box most recently (e.g. PetKit's "Last used by"). Only needed to disambiguate cats when there's more than one — with a single cat every visit is trivially theirs. |
| `error` | no | entity id | — | Sensor reporting the device's current error/status code. |
| `last_event` | no | entity id | — | Sensor reporting the device's most recent maintenance/cleaning event. |
| `state` | no | entity id | — | Sensor reporting the device's current operating state (used by the `toggle_maintenance` control action). |

### `cats[]`

One entry per cat.

| Key | Required | Type | Default | Description |
|---|---|---|---|---|
| `name` | yes | string | — | Display name. Must exactly match this cat's value as reported by [`device_entities.last_used_by`](#device_entities) — that's how a reconstructed visit gets attributed back to this cat. Not required to match when there's only one cat. |
| `color` | yes | string (CSS color, or a named HA palette color like `blue`/`deep-orange`) | — | Chart/legend color for this cat. Picked via HA's native color selector in the visual editor, which writes a human-readable palette name (not a hex code) when you pick a swatch — resolved to the matching theme color at render time. |

Configuring more than one cat gives each their own chart stem color and
their own Analytics row:

![The PETKIT PURAMAX card configured with two cats, showing per-cat colored chart stems and two rows in the Analytics table](docs/media/multi-cat-support.png)

Example with two cats configured — each gets its own chart color and
Analytics row.

### `info_row[]`

Status chips, in order.

| Key | Required | Type | Default | Description |
|---|---|---|---|---|
| `entity` | yes | entity id | — | Entity whose state is displayed. |
| `name` | no | string | the entity's own friendly name | Chip label. Only ever an *override* — leave it unset to show the entity's own name, the same as any built-in card would. |
| `icon` | no | string (mdi icon) | the entity's own icon | Chip icon. Only ever an *override* — leave it unset to show a live `ha-state-icon` resolved from the entity (registry override, its own `icon` attribute, or HA's domain-icon table), not a fixed generic icon. |
| `unit` | no | string | — | Appended to the raw state, e.g. `%`. |
| `value_map` | no | object (`{state: label}`) | — | Maps a raw state to a display string (takes precedence over `unit`). YAML-only — no visual editor field. |
| `warn_below` | no | number | — | Chip renders in a "warn" style if the numeric state is below this. |
| `warn_above` | no | number | — | Chip renders in a "warn" style if the numeric state is above this. |
| `warn_state` | no | string | — | Chip renders in a "warn" style if the raw state exactly equals this. |

### `controls_row[]`

Buttons, in order. Uses the same interaction vocabulary as any built-in
card (`tap_action`/`hold_action`/`double_tap_action`, the native
[`ui_action` selector](https://www.home-assistant.io/dashboards/actions/))
instead of a bespoke action list, so anything a built-in card's tap action
can do — including calling any service with a native confirmation dialog —
this card's controls can too.

| Key | Required | Type | Default | Description |
|---|---|---|---|---|
| `entity` | yes | entity id | — | The control's primary entity: the toggle target for a `toggle` tap_action, what lights up the button when its state is `on`, and the fallback for `more-info`. |
| `name` | no | string | the entity's own friendly name | Button label. Override only, same as `info_row.name`. |
| `icon` | no | string (mdi icon) | the entity's own icon | Button icon. Override only, same as `info_row.icon`. |
| `tap_action` | no | [action config](https://www.home-assistant.io/dashboards/actions/) | `{action: more-info}` on `entity` | What a tap does — `perform-action` (call any service, e.g. `button.press`), `toggle`, `navigate`, `url`, `more-info`, `none`, each with an optional native `confirmation: {text: ...}` dialog. |
| `hold_action` | no | action config | — | What a press-and-hold does. |
| `double_tap_action` | no | action config | — | What a double-tap does. |
| `visibility` | no | array of [conditions](https://www.home-assistant.io/dashboards/cards/#card-and-badge-visibility) | always visible | Hides this control unless every condition passes (`state`/`numeric_state`/`and`/`or`/`not` — see [ARCHITECTURE.md](./docs/ARCHITECTURE.md)). YAML-only — no visual editor field yet. This is how a device with a "only makes sense in state X" pair of buttons (e.g. Start/Exit Maintenance) is expressed: two ordinary rows, each visible in exactly one state, that together read as a single control that changes what it shows. |

Highlighting a toggle-style control (e.g. an "Auto cleaning" switch) so it
visually looks "on" is automatic whenever the control's own `entity` state
is `on` — no config needed for that part.

`cats` has a repeating-row visual editor (drag to reorder, Delete button).
`info_row`/`controls_row` follow the same pattern as the built-in Entities
Card: pick an entity in the always-present picker at the bottom of the list
to add a row (only `entity` is set — no name/icon/action baked in), drag to
reorder, and click a row's Edit (pencil) button to open a full-page
sub-editor for its other fields (Delete removes it directly from the list).
`value_map`, `event_labels`, `event_exclude`, `unknown_cat_color`, and
`controls_row[].visibility` are YAML-only, since the visual editor doesn't
yet have a clean widget for an arbitrary object/array there.

For the algorithm details behind the per-cat chart and Analytics — how
visit duration/identity is reconstructed from raw sensor history — see
[How the chart, Usage line, and Analytics work](./docs/ARCHITECTURE.md#how-the-chart-usage-line-and-analytics-work).
For why Working Records is deliberately never cross-referenced with that
reconstruction, see
[How Working Records works](./docs/ARCHITECTURE.md#how-working-records-works).

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
