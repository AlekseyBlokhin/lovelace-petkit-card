# lovelace-petkit-card

[![CI](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/ci.yml/badge.svg)](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/ci.yml)
[![HACS validation](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/hacs-validate.yml/badge.svg)](https://github.com/AlekseyBlokhin/lovelace-petkit-card/actions/workflows/hacs-validate.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A Home Assistant Lovelace custom card for PETKIT smart litter boxes: device
status, controls, and per-cat visit analytics — computed entirely
client-side from plain `input_number` entity history, no accumulator or
`statistics` helper entities required.

Recommended repo topics (for whoever manages the GitHub repo settings):
`home-assistant`, `hacs`, `lovelace`, `lovelace-card`, `custom-card`,
`petkit`, `litter-box`.

<!-- screenshot placeholder: add a real screenshot here after the first install -->

## What it does

- Device status chips and control buttons, both fully config-driven
  (`info_row` / `controls_row` arrays — add, remove, or reorder them purely
  in YAML, no code changes).
- A day-switchable per-cat visit chart (a 0-24h "stem plot"), built from
  each cat's own `last_visit_duration` `input_number` history — no
  accumulator entities needed.
- A merged Working Records timeline (visits + device events).
- Today / 3-day-avg / 7-day-avg per-cat analytics, with a decline/spike
  warning banner.
- A real visual config editor (drag the card onto a dashboard and configure
  it with forms — no YAML required to get started).

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
| `device_entities.error` | no | entity id | — | Sensor reporting the device's current error/status code. |
| `device_entities.last_event` | no | entity id | — | Sensor reporting the device's most recent maintenance/cleaning event. |
| `device_entities.state` | no | entity id | — | Sensor reporting the device's current operating state (used by the `toggle_maintenance` control action). |
| `event_labels` | no | object (`{state: label}`) | `{}` | Merged over the built-in PURAMAX event-label map (config wins). Lets you relabel or add event states without editing the card. YAML-only — no visual editor field. |
| `cats` | yes | array, min 1 | — | One entry per cat. See below. |
| `cats[].name` | yes | string | — | Display name. |
| `cats[].color` | yes | string (CSS color) | — | Chart/legend color for this cat. |
| `cats[].last_visit_duration_entity` | yes | entity id (`input_number`) | — | This cat's per-visit duration source. Its own state *history* is the data source for both the chart and the analytics — see the companion automation Blueprint (documented further down) for how to populate it. |
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

## Automation Blueprint: per-cat visit tracking

Each `cats[].last_visit_duration_entity` needs *something* to write a
per-visit duration into that `input_number` — the card itself is entirely
read-only against history. The included Blueprint does that: it watches a
shared "total use" sensor, waits briefly for the device's "last used by"
sensor to settle (see the race-condition note below), and writes the
computed delta into the matching cat's `input_number`. This replaces
hand-authoring that logic as a one-off automation.

[![Open your Home Assistant instance and show the blueprint import dialog with a specific blueprint pre-filled.](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FAlekseyBlokhin%2Flovelace-petkit-card%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fpetkit_per_cat_visit_tracker.yaml)

Or manually: **Settings → Automations & Scenes → Blueprints → Import
Blueprint**, paste
`https://github.com/AlekseyBlokhin/lovelace-petkit-card/blob/main/blueprints/automation/petkit_per_cat_visit_tracker.yaml`,
then create one automation from it per litter box.

### Blueprint inputs

| Input | Description |
|---|---|
| **Total Use sensor** | The sensor that bumps by one visit's duration on every use (shared across all cats). |
| **Last Used By sensor** | The sensor reporting which cat used the box most recently. |
| **Cat name to duration helper mapping** | One row per cat: *Cat name* must exactly match this cat's value as reported by the Last Used By sensor; *Duration helper* is the `input_number` (one of your `cats[].last_visit_duration_entity` values) this cat's visit duration gets written to. This is a variable-length list (an `object` selector with `multiple: true`), not a fixed number of cat slots — add as many rows as you have cats. |
| **Settle delay** (default 3s) | How long to wait after Total Use changes before reading Last Used By. Some PetKit integrations report these as two separate state-changed events from the same event, and Last Used By can lag Total Use by up to ~1s — reading it too early risks crediting a visit to the *previous* cat. |
| **Max valid visit duration** (default 1800s) | Deltas above this (or non-positive, e.g. the device's own midnight counter reset) are ignored rather than recorded as a visit. |

The Blueprint runs in `queued` mode so back-to-back visits from different
cats aren't dropped, and binds every `!input` a template needs to a
`variables:` entry first — `!input` is a YAML tag, not a template value,
and can't be referenced directly inside `{{ }}`.

## Supported devices

Today this card only supports the **PETKIT PURAMAX** — the maintainer only
owns that device, and the config schema (`device_entities`, event
vocabulary) is written against its sensors.

Other PETKIT devices are very welcome, but need community-contributed data
to support: please open a
[New device support request](https://github.com/AlekseyBlokhin/lovelace-petkit-card/issues/new?template=new-device-support.yml)
with your device's entities and example states/attributes. See
[CONTRIBUTING.md](./CONTRIBUTING.md) for details on what's needed and how a
new device card would be added to this repo.

## Roadmap / future work

The underlying PetKit Home Assistant integrations
([`RobertD502/home-assistant-petkit`](https://github.com/RobertD502/home-assistant-petkit)
and the actively-maintained
[`Jezza34000/homeassistant_petkit`](https://github.com/Jezza34000/homeassistant_petkit))
already fetch full per-visit records (cat, duration, timestamp) from the
PetKit cloud API internally, but don't currently expose them as Home
Assistant entities — only current/most-recent aggregate values. That's why
this project needs the companion automation Blueprint to reconstruct
per-cat visit history from state-change timestamps.

If either upstream integration adds an Event Entity per visit (with cat,
duration, and timestamp as event data) in the future, this Blueprint —
and the manual per-cat `input_number` plumbing it drives — could
eventually be retired in favor of reading that event stream directly. This
is future work / an upstream contribution opportunity, not something this
repo currently implements.

## License

MIT — see [LICENSE](./LICENSE).
