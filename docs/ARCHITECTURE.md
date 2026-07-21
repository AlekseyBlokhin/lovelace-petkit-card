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
untouched). The only filtering is `event_exclude` (an explicit, configurable
list of raw values to hide entirely). There is no pattern-matching against
the text to detect "is this a visit," no synthesized re-phrasing, and no
cross-reference back to the
`total_use`/`last_used_by` reconstruction above — merging two
independently-computed views of "what happened" and reconciling them with
dedupe logic is exactly what caused a string of real bugs in earlier
versions of this card (duplicate rows, phantom rows, a real visit silently
collapsed by a dedupe heuristic that couldn't tell it apart from a
connectivity-blip artifact). A single, unmodified stream has none of that
to get wrong — trade-off accepted: a Working Records visit row has no
duration (still visible via the chart tooltip and the Usage line, which use
the `total_use` reconstruction instead).
