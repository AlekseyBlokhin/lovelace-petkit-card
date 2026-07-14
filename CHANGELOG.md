# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `petkit-puramax-card`: device status chips, controls, day-switchable
  per-cat visit chart, Working Records timeline, and today/3d-avg/7d-avg
  analytics with a decline/spike warning — fully config-driven `info_row`
  and `controls_row`.
- Visual config editor (`petkit-puramax-card-editor`) with a top-level
  scalar-field form and repeating-row editors for `cats`, `info_row`, and
  `controls_row`.
- `blueprints/automation/petkit_per_cat_visit_tracker.yaml`: automation
  Blueprint that splits a shared per-visit duration sensor into a per-cat
  `input_number`, replacing hand-authoring that automation.
- Pure, unit-tested logic modules under `src/lib/` (`format`, `day`,
  `history`, `chart-math`, `analytics`, `chips`, `ha-helpers`), extracted
  from and improving on the original hand-authored single-file card.
