import { describe, it, expect } from 'vitest';
import { formatDuration, escapeHtml } from '../../src/lib/format.js';

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
