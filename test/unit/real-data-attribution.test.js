/**
 * Regression tests against REAL captured PetKit PURAMAX history (three
 * full days, downloaded directly from a live instance's `total_use`/
 * `last_used_by`/`last_event` sensors -- see test/fixtures/*.json). Cat
 * names are anonymized ("Cat A" / "Cat B") but every timestamp, delta, and
 * raw device value is real, unmodified data.
 *
 * `test/fixtures/ground-truth.json` is an INDEPENDENT derivation of "which
 * cat, per visit" -- built from `last_event`'s own narration text
 * ("Cat A used the litter box") with carry-forward for repeat visits, NOT
 * from `last_used_by`/`attributeCats` (what the card's graphics path
 * actually uses). The two are different signals; agreement between them is
 * a real check, not a circular one. These expected values must never be
 * adjusted to make the implementation pass -- if a mismatch ever appears
 * here, the bug is in the code, not the fixture.
 *
 * 2026-07-16 is the day the user reported real attribution bugs on:
 *   - 06:15 local: really an unidentified ("Unknown") visit, was shown as
 *     the previous known cat (Cat A) -- see the `catChangeEvents`
 *     regression for `UNKNOWN_CAT_STATE`.
 *   - 10:32 local: really Cat B, was shown as Cat A -- a ~90s write-order
 *     lag on `last_used_by`, exceeding the old fixed tolerance window --
 *     see the `attributeCats` write-order-lag regressions in
 *     history.test.js.
 *   - 14:05 local: really an unidentified ("Unknown") visit, was shown as
 *     the previous known cat (Cat A) -- same root cause as 06:15.
 * 2026-07-14 and 2026-07-15 were already correct before this fix and serve
 * as regression coverage: the redesigned algorithm must not change their
 * (already correct) results.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { deltaEvents, catChangeEvents, attributeCats, UNKNOWN_CAT_LABEL } from '../../src/lib/history.js';

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
const KNOWN_NAMES = ['Cat A', 'Cat B'];

function loadFixture(day) {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, `${day}.json`), 'utf-8'));
}

function loadGroundTruth() {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, 'ground-truth.json'), 'utf-8'));
}

function reconstruct(fixture) {
  const durationEvents = deltaEvents(fixture.total_use, { minDelta: 0, maxDelta: 1800 });
  const catEvents = catChangeEvents(fixture.last_used_by, KNOWN_NAMES);
  return attributeCats(durationEvents, catEvents);
}

// Ground truth timestamps are epoch SECONDS with sub-second precision
// (matching the fixtures' `lu`); attributeCats works in epoch ms.
function toMs(epochSeconds) {
  return Math.round(epochSeconds * 1000);
}

const DAYS = ['2026-07-14', '2026-07-15', '2026-07-16'];
const groundTruth = loadGroundTruth();

describe('real-data attribution regression (three full days of live PetKit PURAMAX history)', () => {
  DAYS.forEach((day) => {
    describe(day, () => {
      const fixture = loadFixture(day);
      const expected = groundTruth[day].visits;
      const actual = reconstruct(fixture);

      it(`reconstructs exactly ${expected.length} real visits (total count)`, () => {
        expect(actual.length).toBe(expected.length);
      });

      it('matches ground truth for every visit: timestamp, duration, and attributed cat', () => {
        // Rounded to whole milliseconds on both sides -- the underlying `lu`
        // values carry sub-millisecond float precision that doesn't survive
        // a JSON round-trip identically, and doesn't matter for a "which
        // visit is this" comparison (the smallest real gap between any two
        // points in this data is many seconds).
        const actualSimplified = actual.map((e) => ({
          ts: Math.round(e.ts),
          duration: e.value,
          cat: e.cat,
        }));
        const expectedSimplified = expected.map((e) => ({
          ts: toMs(e.ts),
          duration: e.duration,
          cat: e.cat,
        }));
        expect(actualSimplified).toEqual(expectedSimplified);
      });

      it('every visit timestamp falls within this calendar day (sane chart point positions)', () => {
        // Loose sanity check on "points for graphics": each real visit's ts
        // must land somewhere on this date (Europe/Prague), not spill into
        // a neighboring day due to a UTC/local mixup.
        actual.forEach((e) => {
          const d = new Date(e.ts);
          const iso = d.toISOString().slice(0, 10);
          // The fixture query window is local-midnight to local-midnight
          // (see fetch_history.py), so allow the UTC date to be either the
          // nominal day or the day before (Prague is UTC+2 in July).
          expect([day, shiftDate(day, -1)]).toContain(iso);
        });
      });
    });
  });

  describe('2026-07-16: the three specifically reported misattributions are now fixed', () => {
    const fixture = loadFixture('2026-07-16');
    const actual = reconstruct(fixture);
    const byLocalTime = (hh, mm, ss) =>
      actual.find((e) => {
        const d = new Date(e.ts);
        // Fixture timestamps are real UTC; Prague is UTC+2 in July.
        const local = new Date(d.getTime() + 2 * 3600 * 1000);
        return local.getUTCHours() === hh && local.getUTCMinutes() === mm && local.getUTCSeconds() === ss;
      });

    it('06:15 local: unidentified visit, no longer shown as the previous known cat', () => {
      const visit = byLocalTime(6, 15, 22);
      expect(visit).toBeDefined();
      expect(visit.cat).toBe(UNKNOWN_CAT_LABEL);
    });

    it('10:32 local: correctly attributed to Cat B (was wrongly shown as Cat A)', () => {
      const visit = byLocalTime(10, 32, 40);
      expect(visit).toBeDefined();
      expect(visit.cat).toBe('Cat B');
    });

    it('14:05 local: unidentified visit, no longer shown as the previous known cat', () => {
      const visit = byLocalTime(14, 5, 32);
      expect(visit).toBeDefined();
      expect(visit.cat).toBe(UNKNOWN_CAT_LABEL);
    });
  });
});

function shiftDate(isoDay, deltaDays) {
  const d = new Date(`${isoDay}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}
