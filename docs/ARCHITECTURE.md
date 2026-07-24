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

Working Records is `device_entities.last_event`'s own history, shown as
Home Assistant itself would display each value — each raw point is run
through `hass.formatEntityState(stateObj, value)`, the same documented
custom-card API the real frontend uses to format a historical value against
an entity's current translation (so a PETKIT firmware event code like
`manual_odor_failed_batt` renders using the integration's own `strings.json`
translation, not a hand-maintained relabeling map — a raw value the
integration doesn't translate is shown exactly as PETKIT reported it,
untouched). There is no pattern-matching against the text to detect "is
this a visit" and no synthesized re-phrasing — a row's TEXT never comes
from anything but its own raw `last_event` value. A single stream deduped
only against its own flicker noise has none of the cross-source
reconciliation that caused a string of real bugs in earlier versions of
this card (fully replacing a row's text with a computed sentence, matching
every row 1:1 against `total_use`) — trade-off accepted: a Working Records
visit row has no duration (still visible via the chart tooltip and the
Usage line, which use the `total_use` reconstruction instead).

Two things filter/collapse the raw `last_event` stream:

- **`event_exclude`** (an explicit, configurable list of raw values,
  default `["unavailable", "unknown", "no_events_yet"]`) hides those raw
  values entirely.
- **`dedupeFlickerRepeats`** (`src/lib/history.js`) collapses a value that
  reappears immediately after one of the `event_exclude` states back into
  its original row. This sensor flickers to a hidden state (typically
  `unavailable`) roughly every 30s–2min and republishes the identical event
  text for as long as it remains the true last event — a real captured run
  repeated the same value 43 times over ~2 hours for one visit. Without
  this, every republish renders as its own duplicate row. The merge only
  fires when the point *immediately preceding* the repeat (in raw arrival
  order) was itself a hidden state.

  That alone isn't quite safe: real captured data (2026-07-16) shows two
  GENUINELY separate real visits by the same cat, 5.5 minutes apart, sharing
  identical text with an unrelated hidden-state blip between them — no
  time-gap threshold can tell this apart from a true flicker chain, since
  those span anywhere from seconds to hours in real data. `_renderRecordsSection`
  passes `this._chartVisits`' own timestamps in as
  `confirmedEventTimestamps` — the same `total_use`-derived visit
  reconstruction already computed for the chart, reused here purely as a
  narrow, binary "did an independently verified visit happen near each
  side of this repeat" check. A merge candidate only actually merges when
  *neither* side has its own nearby confirmed timestamp (which is true for
  ordinary device-status flicker, since `total_use` only tracks litter-box
  visits); if *both* sides are independently confirmed, they're kept as two
  rows. This is deliberately narrower than the reconciliation approach that
  caused the earlier bugs above: it never touches a row's text or duration,
  and it only ever affects the flicker-recovery merge decision.

- **`expandConfirmedRepeats`** (`src/lib/history.js`) solves a different
  problem: a real visit that `last_event` never got a history point for AT
  ALL. `last_event` only gets a new point when its value actually changes —
  two consecutive real visits with identical narration text (typically the
  same cat visiting again shortly after) and no `unavailable` flicker
  between them produce NO second history point whatsoever, so there's
  nothing for `dedupeFlickerRepeats` to even see. Real captured case
  (2026-07-24): `total_use` confirmed two real visits by the same cat about
  a minute apart; `last_event` had exactly one raw point, for the first one.
  `expandConfirmedRepeats` runs on `dedupeFlickerRepeats`'s output using the
  same territory-bounded nearest-neighbor technique as `attributeCats`
  (bounded by the midpoint to each neighboring row, so a confirmed timestamp
  can never be pulled across a neighboring row no matter how far it has to
  reach): the confirmed timestamp nearest a kept row's own ts is treated as
  already represented by it; any OTHER confirmed timestamp in the same
  territory gets its own new row, reusing that row's exact text. A territory
  with zero or one confirmed timestamp (the common case — most `last_event`
  values have nothing to do with `total_use` at all) is untouched.

Both of these are narrow, binary cross-checks against `total_use`'s own
visit reconstruction (already fetched for the chart) — never the kind of
full merge/re-synthesis (replacing a row's text, matching every row 1:1)
that caused the earlier bugs. Neither ever invents new text; they only
decide how many rows a run of identical `last_event` text becomes.
