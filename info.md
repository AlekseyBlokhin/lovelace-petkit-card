A Home Assistant Lovelace custom card for PETKIT smart litter boxes: device
status, controls, and per-cat visit analytics — computed entirely
client-side from the device's own `total_use`/`last_used_by` sensor
history. No helper entities and no companion automation required.

Currently supports the **PETKIT PURAMAX**. See the README's "Supported
devices" section for how to request support for other PETKIT devices.

## Features

- Config-driven status chips and control buttons (`info_row` /
  `controls_row` — add, remove, or reorder purely in YAML).
- A day-switchable per-cat visit chart, a Working Records timeline, and
  today/3d-avg/7d-avg analytics with a decline/spike warning.
- A real visual config editor — no YAML required to get started.
- Per-cat visit data reconstructed straight from the device's own sensors —
  no helper entities, no companion automation to set up.

See the full [README](https://github.com/AlekseyBlokhin/lovelace-petkit-card#readme)
for installation and the complete configuration reference.
