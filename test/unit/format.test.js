import { describe, it, expect } from 'vitest';
import { formatDuration } from '../../src/lib/format.js';

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
