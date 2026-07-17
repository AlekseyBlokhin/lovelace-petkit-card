/**
 * Golden whole-day tests at the RENDERED CARD level: the actual
 * PetkitPuramaxCard, mounted with a mocked `hass.callWS` that returns full
 * real captured sensor history for one day (see test/fixtures/*.json), is
 * checked against one comprehensive expected outcome for that entire
 * day -- the Usage line's per-cat/Unknown counts, the chart's stem count,
 * and the FULL ordered list of Working Records row text (compared as a
 * whole array, not spot-checked).
 *
 * This exercises the real DOM-rendering code path (`_renderChartArea`),
 * not just the underlying `src/lib/*` functions covered by
 * test/unit/real-data-*.test.js -- a bug in how the card wires the library
 * output into the DOM (e.g. the Unknown pseudo-cat's usage-line entry, or
 * the Working Records exclude-list filtering) would be caught here even if
 * every library-level unit test passed.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PetkitPuramaxCard } from '../../src/cards/puramax/petkit-puramax-card.js';

if (!customElements.get('petkit-puramax-card')) {
  customElements.define('petkit-puramax-card', PetkitPuramaxCard);
}

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
const DAYS = ['2026-07-14', '2026-07-15', '2026-07-16'];

function loadFixture(day) {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, `${day}.json`), 'utf-8'));
}

const groundTruth = JSON.parse(readFileSync(join(FIXTURES_DIR, 'ground-truth.json'), 'utf-8'));

const ENTITY_IDS = {
  total_use: 'sensor.golden_total_use',
  last_used_by: 'sensor.golden_last_used_by',
  last_event: 'sensor.golden_last_event',
  error: 'sensor.golden_error',
};

function goldenConfig() {
  return {
    type: 'custom:petkit-puramax-card',
    device_entities: { ...ENTITY_IDS },
    cats: [
      { name: 'Cat A', color: '#111111' },
      { name: 'Cat B', color: '#222222' },
    ],
  };
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function makeGoldenHass(fixture) {
  return {
    states: { [ENTITY_IDS.error]: { state: 'no_error' } },
    // The mock ignores the requested start/end window entirely and always
    // returns the full fixture for whichever entity was asked about --
    // both _loadDay's "today" request and _loadAnalytics's "last 7 days"
    // request land on the same real one-day dataset, which is fine since
    // this test only asserts on the day-view chart/usage/records, not the
    // Analytics table.
    callWS: vi.fn().mockImplementation((req) => {
      const result = {};
      req.entity_ids.forEach((eid) => {
        if (eid === ENTITY_IDS.total_use) result[eid] = fixture.total_use;
        if (eid === ENTITY_IDS.last_used_by) result[eid] = fixture.last_used_by;
        if (eid === ENTITY_IDS.last_event) result[eid] = fixture.last_event;
      });
      return Promise.resolve(result);
    }),
    callService: vi.fn(),
  };
}

describe('golden whole-day rendered-card tests (full real sensor data -> rendered DOM)', () => {
  DAYS.forEach((day) => {
    it(`${day}: Usage line matches the golden per-cat/Unknown counts exactly`, async () => {
      const fixture = loadFixture(day);
      const expected = groundTruth[day].aggregate;
      const card = /** @type {PetkitPuramaxCard} */ (document.createElement('petkit-puramax-card'));
      card.setConfig(goldenConfig());
      card.hass = makeGoldenHass(fixture);
      await flush();

      const usageText = card.shadowRoot.getElementById('usage-body').textContent;
      expect(usageText).toContain(`${expected.total_count} time${expected.total_count === 1 ? '' : 's'}`);
      expect(usageText).toContain(`Cat A: ${expected.per_cat_count['Cat A'] || 0}`);
      expect(usageText).toContain(`Cat B: ${expected.per_cat_count['Cat B'] || 0}`);
      if (expected.unknown_count > 0) {
        expect(usageText).toContain(`Unknown: ${expected.unknown_count}`);
      } else {
        expect(usageText).not.toContain('Unknown:');
      }

      const stems = card.shadowRoot.querySelectorAll('.visit-point');
      expect(stems.length).toBe(expected.total_count);
    });

    it(`${day}: Working Records shows the FULL golden ordered list of real last_event text, nothing more, nothing less`, async () => {
      const fixture = loadFixture(day);
      const expectedRecords = groundTruth[day].working_records;
      const card = /** @type {PetkitPuramaxCard} */ (document.createElement('petkit-puramax-card'));
      card.setConfig(goldenConfig());
      card.hass = makeGoldenHass(fixture);
      await flush();

      const rows = card.shadowRoot.querySelectorAll('.record-row');
      const actualTexts = Array.from(rows).map((r) => r.querySelector('.record-text').textContent);
      const expectedTexts = expectedRecords.map((r) => r.text);
      expect(actualTexts).toEqual(expectedTexts);
    });
  });

  it('2026-07-16: the Unknown pseudo-cat plots as its own chart stems and appears in Working Records verbatim', async () => {
    const fixture = loadFixture('2026-07-16');
    const card = /** @type {PetkitPuramaxCard} */ (document.createElement('petkit-puramax-card'));
    card.setConfig(goldenConfig());
    card.hass = makeGoldenHass(fixture);
    await flush();

    const usageText = card.shadowRoot.getElementById('usage-body').textContent;
    expect(usageText).toContain('Unknown: 2');

    const recordTexts = Array.from(card.shadowRoot.querySelectorAll('.record-row .record-text')).map(
      (el) => el.textContent,
    );
    expect(recordTexts).toContain('Unknown used the litter box');
  });
});
