# Real device fixtures

`2026-07-14.json`, `2026-07-15.json`, `2026-07-16.json`, `2026-07-24.json`, `2026-07-25.json` are
real, unmodified `total_use`/`last_used_by`/`last_event` history captured directly from a live
PetKit PURAMAX device (one full local day each), with the owner's cats' real names replaced by
`Cat A`/`Cat B` — no other value is altered. Timestamps are compact `{s, lu}` points (`lu` = epoch
seconds), matching the shape `history/history_during_period` returns.

**Leading-point convention:** production fetches `total_use`/`last_event` with
`include_start_time_state: false` (see `buildHistoryRequest` in `src/lib/history.js`), so a real
card never sees a synthetic "value at query start" point for those two series. These fixtures were
captured via the plain REST history endpoint instead (for convenience), which always includes such
a point regardless — it's stripped from `total_use`/`last_event` before committing a fixture so the
data matches what production actually receives. `last_used_by` genuinely IS fetched with
`include_start_time_state: true` in production (the carry-forward baseline exception), so its
leading point is real and kept.

## `ground-truth.json`

Two independently-derived fields per day, checked against the actual implementation by
`test/component/real-data-golden.test.js` (whole-day, rendered-card level) and
`test/unit/real-data-golden.test.js`:

- **`aggregate`** / **`working_records`** — produced by a standalone Python reference
  implementation (not committed to the repo; re-derive from the fixture JSON + the algorithm
  description in `docs/ARCHITECTURE.md`'s "How Working Records works" section if it ever needs
  regenerating), then hand-verified against the raw fixture data for every real bug this suite
  exists to catch (see the `REGRESSION` comments in `test/unit/history.test.js` for the specific
  cases).
- **`visits`** (2026-07-14/15/16/24/25 only, checked by `test/unit/real-data-attribution.test.js`)
  — a SEPARATE, independent derivation of "which cat, per visit": built from `last_event`'s own
  narration text ("Cat A used the litter box") with carry-forward, NOT from
  `last_used_by`/`attributeCats` (what the card's chart/Working Records reconstruction actually
  uses). Agreement between the two is a real cross-check, not a circular one.

**These expected values must never be adjusted to make an implementation change pass.** If a test
against `ground-truth.json` ever fails, that means the CODE regressed — diagnose the actual
discrepancy against the raw fixture data first (pull the relevant time window and read the raw
`total_use`/`last_used_by`/`last_event` points directly). Only touch `ground-truth.json` itself if
the independent derivation was actually wrong (e.g. a bug in how it was computed), and say so
explicitly in the commit message when that happens.
