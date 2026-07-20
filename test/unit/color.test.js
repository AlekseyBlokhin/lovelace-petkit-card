import { describe, it, expect } from 'vitest';
import { resolveCssColor } from '../../src/lib/color.js';

describe('resolveCssColor', () => {
  it('resolves a named HA theme-palette color to its CSS custom property', () => {
    expect(resolveCssColor('deep-orange')).toBe('var(--deep-orange-color)');
    expect(resolveCssColor('blue')).toBe('var(--blue-color)');
  });

  it('passes a raw hex color through unchanged', () => {
    expect(resolveCssColor('#4fc3f7')).toBe('#4fc3f7');
  });

  it('passes an arbitrary CSS color string through unchanged', () => {
    expect(resolveCssColor('rgb(1,2,3)')).toBe('rgb(1,2,3)');
    expect(resolveCssColor('rebeccapurple')).toBe('rebeccapurple');
  });

  it('passes through falsy values unchanged', () => {
    expect(resolveCssColor(undefined)).toBeUndefined();
    expect(resolveCssColor('')).toBe('');
  });
});
