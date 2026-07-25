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

Working Records shows one row per real, distinct thing PETKIT reported,
built in three steps: `event_exclude` filtering, `dedupeFlickerRepeats`
(flicker dedup), then `reconcileVisitRecords` (visit reconciliation against
`total_use`). A row's TEXT is either `last_event`'s own raw value (run
through `hass.formatEntityState(stateObj, value)`, the same documented
custom-card API the real frontend uses — so a firmware code like
`manual_odor_failed_batt` renders via the integration's own `strings.json`
translation, untouched if PETKIT doesn't translate it) or, for a visit
`last_event` never reported at all, the exact same narration phrasing
PETKIT already uses everywhere else ("`<cat>` used the litter box") — never
a computed/invented sentence with content `last_event` didn't itself assert
somewhere.

1. **`event_exclude`** (an explicit, configurable list of raw values,
   default `["unavailable", "unknown", "no_events_yet"]`) hides those raw
   values entirely.
2. **`dedupeFlickerRepeats`** (`src/lib/history.js`) collapses a value that
   reappears immediately after one of the `event_exclude` states back into
   its original row. This sensor flickers to a hidden state (typically
   `unavailable`) roughly every 30s–2min and republishes the identical event
   text for as long as it remains the true last event — a real captured run
   repeated the same value 43 times over ~2 hours for one visit. Without
   this, every republish renders as its own duplicate row. The merge only
   fires when the point *immediately preceding* the repeat (in raw arrival
   order) was itself a hidden state; two genuinely separate real events
   sharing identical text with nothing hidden between them are never
   merged. This step is deliberately text-only, with no awareness of
   `total_use` — see step 3 for why that turned out to still be necessary,
   and why it lives in a separate function rather than folded in here.
3. **`reconcileVisitRecords`** (`src/lib/history.js`) resolves `last_event`'s
   deeper unreliability for VISIT narration specifically, using
   `this._chartVisits` — the ALREADY-RELIABLE `total_use`/`last_used_by`
   reconstruction that independently drives the chart (`attributeCats`) —
   as the source of truth for how many visits happened and when. Two real,
   confirmed failure modes drove this:
   - Two GENUINELY separate real visits sharing identical text with an
     unrelated hidden-state blip between them (real case, 2026-07-16, 5.5
     minutes apart) are indistinguishable from a true flicker chain using
     `last_event`'s own text/timing alone — no time-gap threshold works,
     since flicker chains span anywhere from seconds to hours in real data.
   - `last_event` can report NOTHING AT ALL for a real visit — not a
     repeat, not a flicker, just silence (real cases, 2026-07-24/25: a
     visit was immediately followed by an unrelated device-status event
     that overwrote `last_event` before the visit's own narration was ever
     asserted). An earlier fix for this (`expandConfirmedRepeats`, since
     removed) tried to recover such visits by expanding an EXISTING kept
     `last_event` row's own midpoint-bounded territory — but that territory
     is bounded by whichever `last_event` ROWS happen to be adjacent,
     regardless of their own text, so the very unrelated device-status row
     that caused the problem could cut the territory short before reaching
     the visit, silently dropping it.

   `reconcileVisitRecords` avoids both failure modes by resolving each
   confirmed visit independently rather than through any existing row's
   territory: for each visit (chronological order), the nearest
   not-yet-claimed `dedupeFlickerRepeats` point whose text EXACTLY equals
   that visit's own expected phrase ("`<cat>` used the litter box"), within
   a tolerance, is used verbatim (own real text and timestamp); if none
   qualifies, a row is synthesized with that same phrase at the visit's own
   `total_use` timestamp. Matching only ever considers a point whose text
   already matches the SPECIFIC visit's own expected phrase — never "the
   nearest point regardless of what it says" — so an unrelated real
   device-status event occurring moments before or after a visit is never
   mistaken for that visit's own narration, and each `last_event` point can
   be claimed by at most one visit. Every point NOT claimed by any visit is
   a genuinely distinct device-status event and passes through unchanged.

This is still narrower than the full merge/re-synthesis (replacing every
row's text, matching every row 1:1 against `total_use`) that caused the
earliest bugs in this area: it never touches an EXISTING row's own text,
and only ever adds a row using PETKIT's own established phrasing when
`total_use` has independently confirmed a visit that `last_event` has no
data for at all.

See `test/fixtures/README.md` for how this is validated against complete
real device-history fixtures (not just a couple of hand-picked visits) —
`test/component/real-data-golden.test.js` checks the FULL ordered Working
Records list for five real captured days against independently-derived
expected values.
