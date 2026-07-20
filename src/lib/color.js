/**
 * Resolves a color value from HA's `ui_color` selector into something valid
 * to use directly in inline CSS/SVG (`style="..."`, `stroke="..."`, etc.).
 *
 * Picking a *named* palette swatch in `ha-color-picker` (e.g. "Deep orange")
 * writes the literal kebab-case token `"deep-orange"` into config, not a hex
 * value -- that's only resolvable through the CSS custom property HA's own
 * theme defines for it (`var(--deep-orange-color)`), the same way HA's own
 * frontend does it (`computeCssColor()` in
 * home-assistant/frontend's `src/common/color/compute-color.ts`). A raw
 * hex/rgb/CSS-name value (from typing a custom color instead of picking a
 * swatch) is already valid CSS and passes through unchanged.
 *
 * @type {Set<string>}
 */
const THEME_COLORS = new Set([
  'primary',
  'accent',
  'red',
  'pink',
  'purple',
  'deep-purple',
  'indigo',
  'blue',
  'light-blue',
  'cyan',
  'teal',
  'green',
  'light-green',
  'lime',
  'yellow',
  'amber',
  'orange',
  'deep-orange',
  'brown',
  'light-grey',
  'grey',
  'dark-grey',
  'blue-grey',
  'black',
  'white',
]);

/**
 * @param {string} [color]
 * @returns {string}
 */
export function resolveCssColor(color) {
  if (!color) return color;
  return THEME_COLORS.has(color) ? `var(--${color}-color)` : color;
}
