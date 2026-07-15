# lovelace-petkit-card

[![CI](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/ci.yml/badge.svg)](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/ci.yml)
[![HACS validation](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/hacs-validate.yml/badge.svg)](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/hacs-validate.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

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
  entities needed.
- A merged Working Records timeline (visits + device events).
- Today / 3-day-avg / 7-day-avg per-cat analytics, with a decline/spike
  warning banner.
- A real visual config editor (drag the card onto a dashboard and configure
  it with forms — no YAML required to get started).

## Prerequisites

- **A PetKit Home Assistant integration**, already installed and configured, exposing your device's entities — either [`RobertD502/home-assistant-petkit`](https://github.com/RobertD502/home-assistant-petkit) or [`Jezza34000/homeassistant_petkit`](https://github.com/Jezza34000/homeassistant_petkit). This card only reads entities; it doesn't talk to PetKit's API itself, and doesn't care which of the two integrations provided them.
- **No helper entities and no companion automation.** The card reads directly from your integration's own "total use" and (if you have more than one cat) "last used by" sensors.
- **No other custom Lovelace cards are required.** This card and its visual editor are self-contained — built only on Home Assistant's own built-in `ha-form`/`ha-icon` elements, zero runtime npm dependencies (`package.json` has none). You don't need `card-mod`, `auto-entities`, or anything else installed for it to work.

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
| `event_labels` | no | object (`{state: label}`) | `{}` | Merged over the built-in PURAMAX event-label map (config wins). Lets you relabel or add event states without editing the card. Set a state's value to `null` to hide it from Working Records entirely — see note below. YAML-only — no visual editor field. |
| `cats` | yes | array, min 1 | — | One entry per cat. See below. |
| `cats[].name` | yes | string | — | Display name. Must exactly match this cat's value as reported by `device_entities.last_used_by` — that's how a reconstructed visit gets attributed back to this cat. Not required to match when there's only one cat. |
| `cats[].color` | yes | string (CSS color) | — | Chart/legend color for this cat. |
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

`cats`, `info_row`, and `controls_row` all have a repeating-row visual
editor (add/remove buttons); `value_map` and `event_labels` are YAML-only
for v1 since an arbitrary object-of-strings has no clean `ha-form` widget.

Set any event's value to `null` in `event_labels` to hide it from Working
Records entirely — this is the general mechanism for filtering out noisy
states (the defaults already hide `no_events_yet`, `unavailable`, and
`unknown` this way).

## How per-cat visit reconstruction works

There's no helper entity and no companion automation to set up — the card
derives every visit's duration and cat identity purely from history it
already fetches:

1. **Duration**: `device_entities.total_use` is a running counter that
   bumps by one visit's duration on every use. The delta between
   consecutive history readings *is* that visit's duration. Non-positive or
   implausibly large deltas (a daily counter reset, or a multi-hour gap from
   the device having been offline) are filtered out rather than read as a
   real visit.
2. **Identity** (only fetched/needed with more than one cat):
   `device_entities.last_used_by` reports which cat used the box most
   recently, but most PetKit integrations only write a *new* state when the
   identity actually changes — two visits by the same cat in a row don't
   produce a second history point. The card attributes each duration event
   to whichever cat was most recently reported *at or before* that event's
   timestamp (carry-forward), which correctly handles repeat visits by the
   same cat without needing an exact-timestamp match.

Because this only ever reads already-settled history (never live state at
the instant of a visit), there's no race condition to guard against — that
was a real problem for the automation-based approach this replaced, where
`last_used_by` could still be updating from a previous visit at the exact
moment a new one was read live.

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
