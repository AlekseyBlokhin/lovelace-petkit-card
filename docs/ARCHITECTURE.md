## How the chart, Usage line, and Analytics work

There's no helper entity and no companion automation to set up — these are
derived purely from `total_use`/`last_used_by` history the card already
fetches (Working Records uses a different approach — see the next section):

1. **Duration**: `device_entities.total_use` is a running counter that
   bumps by one visit's duration on every use. The delta between
   consecutive history readings *is* that visit's duration. Non-positive or
   implausibly large deltas (a daily counter reset, or a multi-hour gap from
   the device having been offline) are filtered out rather than read as a
   real visit. A positive delta that the very next reading undoes exactly
   (the value returns to precisely its pre-delta level) is also filtered —
   a genuine increment is permanent and never reverts like that.
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
   territory has none of its own. This handles both a repeat visit by the
   same cat and an identity write that lands somewhat later than the
   `total_use` write for the same visit, without ever letting one visit's
   identity get attributed to a neighboring visit instead. See
   `attributeCats` in `src/lib/history.js` for the algorithm.

A visit attributed to "Unknown" plots as a neutral gray chart stem and
appears in the Usage line's legend on any day it occurs, but never counts
toward a configured cat's Analytics totals (those are inherently
per-named-cat views).

## How Working Records works

Working Records shows one row per real, distinct thing PETKIT reported. A
row's text is either `last_event`'s own raw value — run through
`hass.formatEntityState(stateObj, value)`, the same documented custom-card
API the real frontend uses, so a firmware code like `manual_odor_failed_batt`
renders via the integration's own `strings.json` translation — or, for a
real visit that `last_event` itself never reported, the same narration
phrasing PETKIT uses for every other visit ("`<cat>` used the litter box").
A row's text is never a computed or invented sentence.

The list is built in three steps:

1. **`event_exclude`** (an explicit, configurable list of raw values,
   default `["unavailable", "unknown", "no_events_yet"]`) hides those raw
   values entirely.
2. **`dedupeFlickerRepeats`** (`src/lib/history.js`) collapses a value that
   reappears immediately after one of the `event_exclude` states back into
   its original row. `last_event` periodically flickers to a hidden state
   (typically `unavailable`) and republishes the identical text for as long
   as it remains the true last event, so without this step a single real
   event can render as many duplicate rows. The merge only fires when the
   point *immediately preceding* the repeat (in raw arrival order) was
   itself a hidden state; two separate real events that happen to share
   identical text with nothing hidden between them are never merged. This
   step only ever compares `last_event` against itself — see step 3 for the
   part of the problem text-only comparison can't solve on its own.
3. **`reconcileVisitRecords`** (`src/lib/history.js`) cross-checks each real
   visit against `this._chartVisits` — the `total_use`/`last_used_by`
   reconstruction described above, which independently and reliably knows
   how many visits happened and when. For each visit (chronological order),
   the nearest not-yet-claimed `last_event` point whose text exactly matches
   that visit's expected phrase, within a tolerance, is used verbatim (its
   own real text and timestamp); if no point qualifies, a row is synthesized
   with that same phrase at the visit's own `total_use` timestamp. Matching
   only ever considers a point whose text already matches the specific
   visit's own expected phrase, never just "the nearest point" — so an
   unrelated device-status event near a visit is never mistaken for that
   visit's own narration — and each `last_event` point can be claimed by at
   most one visit. Every point not claimed by a visit is a distinct
   device-status event and passes through unchanged.

   This step exists because `last_event`'s own text and timing aren't
   always enough to tell "one event, flickering" apart from "two separate
   events with identical text" (both patterns occur in real device history,
   spanning anywhere from seconds to hours), and because `last_event`
   sometimes never reports a real visit at all — e.g. when an unrelated
   device-status event happens moments later and overwrites it first.
   Reconciling against the chart's own reconstruction — which has no such
   gaps — resolves both cases without needing to guess from text/timing
   alone.

`reconcileVisitRecords` only ever adds a row in PETKIT's own established
phrasing when `total_use` has independently confirmed a visit `last_event`
has no data for; it never rewrites or removes an existing row's own text.

See `test/fixtures/README.md` for how this is validated against complete
real device-history fixtures — `test/component/real-data-golden.test.js`
checks the full ordered Working Records list for five real captured days
against independently-derived expected values.
