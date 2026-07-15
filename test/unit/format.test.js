import { describe, it, expect } from 'vitest';
import { formatDuration, formatClockDuration, formatHoursAgo, escapeHtml } from '../../src/lib/format.js';

describe('formatDuration', () => {
  it('formats 0 seconds as "0s"', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('formats values under 60s with no minute component', () => {
    expect(formatDuration(1)).toBe('1s');
    expect(formatDuration(59)).toBe('59s');
  });

  it('formats exactly 60s as "1m00s"', () => {
    expect(formatDuration(60)).toBe('1m00s');
  });

  it('formats 61s as "1m01s"', () => {
    expect(formatDuration(61)).toBe('1m01s');
  });

  it('formats a large duration with zero-padded seconds', () => {
    expect(formatDuration(3661)).toBe('61m01s');
  });

  it('pads single-digit seconds within a minute', () => {
    expect(formatDuration(65)).toBe('1m05s');
  });

  it('rounds fractional seconds before formatting', () => {
    expect(formatDuration(59.6)).toBe('1m00s');
    expect(formatDuration(59.4)).toBe('59s');
  });

  it('treats null/undefined/NaN as 0', () => {
    expect(formatDuration(null)).toBe('0s');
    expect(formatDuration(undefined)).toBe('0s');
  });

  it('never produces a negative-looking string for 0', () => {
    expect(formatDuration(-0)).toBe('0s');
  });
});

describe('formatClockDuration', () => {
  it('formats 0 seconds as "00\'00\\""', () => {
    expect(formatClockDuration(0)).toBe('00\'00"');
  });

  it('formats 30 seconds as "00\'30\\""', () => {
    expect(formatClockDuration(30)).toBe('00\'30"');
  });

  it('zero-pads a single-digit seconds component', () => {
    expect(formatClockDuration(65)).toBe('01\'05"');
  });

  it('formats exactly 10 minutes as "10\'00\\""', () => {
    expect(formatClockDuration(600)).toBe('10\'00"');
  });

  it('never rolls minutes over into hours, even past 60 minutes', () => {
    expect(formatClockDuration(3661)).toBe('61\'01"');
  });

  it('treats null/undefined/NaN as 0', () => {
    expect(formatClockDuration(null)).toBe('00\'00"');
    expect(formatClockDuration(undefined)).toBe('00\'00"');
  });
});

describe('formatHoursAgo', () => {
  it('shows "under 1h" for less than a full hour', () => {
    expect(formatHoursAgo(0.5)).toBe('under 1h');
  });

  it('shows a whole-hour count, rounded down, under 48h', () => {
    expect(formatHoursAgo(9.9)).toBe('9h');
    expect(formatHoursAgo(47.9)).toBe('47h');
  });

  it('switches to days at 48h and above', () => {
    expect(formatHoursAgo(48)).toBe('2d');
    expect(formatHoursAgo(71)).toBe('2d');
    expect(formatHoursAgo(72)).toBe('3d');
  });
});

describe('escapeHtml', () => {
  it('escapes the five HTML metacharacters', () => {
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('>')).toBe('&gt;');
    expect(escapeHtml('"')).toBe('&quot;');
    expect(escapeHtml("'")).toBe('&#39;');
  });

  it('neutralizes a script-tag injection attempt', () => {
    const malicious = '<img src=x onerror=alert(1)>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<img');
    expect(escaped).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('neutralizes an attribute-breakout attempt (e.g. a state value used as an icon/color)', () => {
    const malicious = '" onerror="alert(1)';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('"');
  });

  it('leaves plain text untouched', () => {
    expect(escapeHtml('no_error')).toBe('no_error');
    expect(escapeHtml('42%')).toBe('42%');
  });

  it('coerces non-string values to strings before escaping', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(null)).toBe('null');
  });
});
