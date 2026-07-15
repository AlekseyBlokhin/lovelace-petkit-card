import { describe, it, expect } from 'vitest';
import { niceStep, buildScales, buildGridLines } from '../../src/lib/chart-math.js';

describe('niceStep', () => {
  it('picks the smallest listed step where rawMax/step <= 5', () => {
    expect(niceStep(50)).toBe(10); // 50/10 = 5
    expect(niceStep(10)).toBe(10); // 10/10 = 1
  });

  it('matches the documented example: 137s -> step 30', () => {
    expect(niceStep(137)).toBe(30); // 137/15=9.1>5, 137/30=4.57<=5
  });

  it('steps up through the full ladder', () => {
    expect(niceStep(1)).toBe(10);
    expect(niceStep(60)).toBe(15); // 60/10=6>5, 60/15=4<=5
    expect(niceStep(300)).toBe(60); // 300/30=10>5, 300/60=5<=5
    expect(niceStep(600)).toBe(120);
    expect(niceStep(900)).toBe(180);
    expect(niceStep(1500)).toBe(300);
    expect(niceStep(3000)).toBe(600);
    expect(niceStep(4500)).toBe(900);
    expect(niceStep(9000)).toBe(1800);
    expect(niceStep(18000)).toBe(3600);
  });

  it('falls back to a computed step above the largest listed step (3600)', () => {
    // rawMax large enough that even /3600 > 5
    const rawMax = 20000; // 20000/3600 = 5.55 > 5, so falls through to fallback
    const result = niceStep(rawMax);
    expect(result).toBe(Math.ceil(rawMax / 5 / 60) * 60);
    expect(result).toBeGreaterThan(3600);
  });
});

describe('buildScales', () => {
  const padding = { left: 40, right: 10, top: 10, bottom: 26 };
  const width = 600;
  const height = 240;
  const dayStart = new Date(2026, 6, 15, 0, 0, 0);

  it('xFor maps the start of day to the left padding edge', () => {
    const { xFor } = buildScales({ dayStart, niceMax: 300, width, height, padding });
    expect(xFor(dayStart.getTime())).toBeCloseTo(padding.left, 5);
  });

  it('xFor maps end of day (24h later) to the right edge', () => {
    const { xFor } = buildScales({ dayStart, niceMax: 300, width, height, padding });
    const endOfDay = dayStart.getTime() + 24 * 3600000;
    expect(xFor(endOfDay)).toBeCloseTo(width - padding.right, 5);
  });

  it('xFor maps noon to the horizontal midpoint of the plot area', () => {
    const { xFor } = buildScales({ dayStart, niceMax: 300, width, height, padding });
    const noon = dayStart.getTime() + 12 * 3600000;
    const plotWidth = width - padding.left - padding.right;
    expect(xFor(noon)).toBeCloseTo(padding.left + plotWidth / 2, 5);
  });

  it('yFor maps 0 duration to the bottom of the plot area', () => {
    const { yFor } = buildScales({ dayStart, niceMax: 300, width, height, padding });
    expect(yFor(0)).toBeCloseTo(height - padding.bottom, 5);
  });

  it('yFor maps niceMax duration to the top of the plot area', () => {
    const { yFor } = buildScales({ dayStart, niceMax: 300, width, height, padding });
    expect(yFor(300)).toBeCloseTo(padding.top, 5);
  });

  it('yFor does not divide by zero when niceMax is 0', () => {
    const { yFor } = buildScales({ dayStart, niceMax: 0, width, height, padding });
    expect(Number.isFinite(yFor(0))).toBe(true);
  });
});

describe('buildGridLines', () => {
  const padding = { left: 40, right: 10, top: 10, bottom: 26 };
  const width = 600;
  const height = 240;

  it('produces exactly 5 vertical lines at 4/8/12/16/20h in zero-padded HH:00 format, skipping 0/24h', () => {
    const { vertical } = buildGridLines({ niceMax: 150, yStep: 30, width, height, padding });
    expect(vertical.map((v) => v.hour)).toEqual([4, 8, 12, 16, 20]);
    expect(vertical.map((v) => v.label)).toEqual(['04:00', '08:00', '12:00', '16:00', '20:00']);
  });

  it('vertical line x positions are monotonically increasing', () => {
    const { vertical } = buildGridLines({ niceMax: 150, yStep: 30, width, height, padding });
    for (let i = 1; i < vertical.length; i++) {
      expect(vertical[i].x).toBeGreaterThan(vertical[i - 1].x);
    }
  });

  it('produces horizontal lines from 0 to niceMax inclusive, spaced by yStep, labeled in MM\'SS" format', () => {
    const { horizontal } = buildGridLines({ niceMax: 150, yStep: 30, width, height, padding });
    expect(horizontal.map((h) => h.value)).toEqual([0, 30, 60, 90, 120, 150]);
    expect(horizontal.map((h) => h.label)).toEqual(["00'00\"", "00'30\"", "01'00\"", "01'30\"", "02'00\"", "02'30\""]);
  });

  it('horizontal line y positions decrease as value increases (higher value = higher on screen)', () => {
    const { horizontal } = buildGridLines({ niceMax: 150, yStep: 30, width, height, padding });
    for (let i = 1; i < horizontal.length; i++) {
      expect(horizontal[i].y).toBeLessThan(horizontal[i - 1].y);
    }
  });

  it('returns no horizontal lines when yStep is 0', () => {
    const { horizontal } = buildGridLines({ niceMax: 0, yStep: 0, width, height, padding });
    expect(horizontal).toEqual([]);
  });
});
