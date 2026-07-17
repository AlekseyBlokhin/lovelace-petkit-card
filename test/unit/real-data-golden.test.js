/**
 * Golden whole-day tests: FULL real captured sensor history for a given
 * date goes in, ONE comprehensive expected outcome for that entire day
 * comes out and is compared. This is deliberately a different shape of
 * test from real-data-attribution.test.js (which checks the reconstructed
 * event LIST visit-by-visit) -- here the assertion is a single aggregate
 * summary (total count, per-cat counts, per-cat total duration, unknown
 * count/duration) independently computed from the same real data by
 * test/fixtures/build (see ground-truth.json's `aggregate` key), so a bug
 * that shifts one visit's cat but happens to leave the per-visit list
 * "plausible" would still be caught by a wrong day-level total.
 *
 * Expected values come from `test/fixtures/ground-truth.json`, generated
 * once from real captured history and never hand-tuned to make the
 * implementation pass -- if this ever fails, the bug is in the code.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { deltaEvents, catChangeEvents, attributeCats, UNKNOWN_CAT_LABEL } from '../../src/lib/history.js';

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
const KNOWN_NAMES = ['Cat A', 'Cat B'];
const DAYS = ['2026-07-14', '2026-07-15', '2026-07-16'];

function loadFixture(day) {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, `${day}.json`), 'utf-8'));
}

const groundTruth = JSON.parse(readFileSync(join(FIXTURES_DIR, 'ground-truth.json'), 'utf-8'));

function reconstructAggregate(fixture) {
  const durationEvents = deltaEvents(fixture.total_use, { minDelta: 0, maxDelta: 1800 });
  const catEvents = catChangeEvents(fixture.last_used_by, KNOWN_NAMES);
  const attributed = attributeCats(durationEvents, catEvents);

  const perCatCount = {};
  const perCatDuration = {};
  let unknownCount = 0;
  let unknownDuration = 0;
  let totalDuration = 0;
  attributed.forEach((e) => {
    totalDuration += e.value;
    if (e.cat === UNKNOWN_CAT_LABEL) {
      unknownCount += 1;
      unknownDuration += e.value;
    } else if (e.cat !== null) {
      perCatCount[e.cat] = (perCatCount[e.cat] || 0) + 1;
      perCatDuration[e.cat] = (perCatDuration[e.cat] || 0) + e.value;
    }
  });

  return {
    total_count: attributed.length,
    total_duration: Math.round(totalDuration * 1000) / 1000,
    per_cat_count: perCatCount,
    per_cat_duration: Object.fromEntries(
      Object.entries(perCatDuration).map(([k, v]) => [k, Math.round(v * 1000) / 1000]),
    ),
    unknown_count: unknownCount,
    unknown_duration: Math.round(unknownDuration * 1000) / 1000,
  };
}

describe('golden whole-day reconstruction (full real sensor data -> one aggregate outcome)', () => {
  DAYS.forEach((day) => {
    it(`${day}: matches the golden aggregate exactly (total count, per-cat counts, per-cat durations, unknown count/duration)`, () => {
      const fixture = loadFixture(day);
      const actual = reconstructAggregate(fixture);
      expect(actual).toEqual(groundTruth[day].aggregate);
    });
  });

  it('2026-07-16 golden aggregate captures the reported bugs being fixed: 2 Unknown visits, Cat B correctly at 4 (not 3)', () => {
    // Before the fix: the two Unknown visits (06:15, 14:05) would have
    // inflated whichever cat was "current" at the time (Cat A, in the real
    // data) instead of counting as Unknown, and the 10:32 write-order-lag
    // visit would have stayed Cat A instead of moving to Cat B -- so the
    // OLD (buggy) aggregate would have shown unknown_count: 0, Cat A too
    // high, Cat B at 3 instead of 4. This pins the corrected numbers down
    // explicitly, not just via a generic equality check above.
    const expected = groundTruth['2026-07-16'].aggregate;
    expect(expected.unknown_count).toBe(2);
    expect(expected.per_cat_count['Cat B']).toBe(4);
    expect(expected.total_count).toBe(19);
  });
});
