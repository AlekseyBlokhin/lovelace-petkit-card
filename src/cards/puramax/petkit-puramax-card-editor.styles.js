/**
 * Editor CSS (both the normal list view and the Edit sub-page share one
 * shadow root, so one stylesheet covers both). A Lit `css` tagged template
 * (construable stylesheet, assigned to `static styles` on the editor)
 * rather than a plain string injected via a per-template `<style>` tag.
 */
import { css } from 'lit';

export const EDITOR_STYLES = css`
  .editor { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
  /* "Content" and "Analytics & alerts" are now hand-built
     ha-expansion-panel siblings too (not ha-form's own internal
     expandable), so this one rule shapes all five sections identically --
     see the class header comment for why that's necessary. */
  ha-expansion-panel { --expansion-panel-summary-padding: 0 16px; }
  ha-expansion-panel h3[slot="header"] { margin: 0; font-size: 1em; font-weight: 500; }
  ha-svg-icon[slot="leading-icon"] { color: var(--secondary-text-color); }
  .panel-body { display: flex; flex-direction: column; gap: 4px; padding: 4px 16px 16px; }
  /* Content's 4 show_* toggles: one small ha-form per field (see the class
     header comment), laid out in a compact 2-column grid this stylesheet
     controls directly -- ha-form's own grid sub-schema type hardcodes a
     24px row-gap with no exposed override, which read as an oversized gap
     between the two toggle rows. The --mdc-switch-* custom properties
     shrink the native ha-switch itself; font-size shrinks its label --
     both real, live properties MWC's switch/formfield already expose, not
     a card_mod-style guess at internal markup. */
  .content-toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 0 8px; }
  .content-toggles ha-form {
    font-size: 0.85em;
    --mdc-switch-track-height: 12px;
    --mdc-switch-track-width: 28px;
    --mdc-switch-thumb-height: 16px;
  }
  .row { display: flex; align-items: center; gap: 4px; }
  .row ha-form { flex: 1 1 auto; min-width: 0; }
  .handle { display: flex; cursor: grab; color: var(--secondary-text-color); flex: 0 0 auto; touch-action: none; }
  .handle:active { cursor: grabbing; }
  .summary-row { padding: 0 4px; }
  .summary-row ha-state-icon { color: var(--secondary-text-color); flex: 0 0 auto; }
  .summary-label { flex: 1 1 auto; min-width: 0; }
  .summary-label-primary { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--primary-text-color); }
  .summary-label-secondary { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--secondary-text-color); font-size: 0.85em; }
  #cats-rows { display: flex; flex-direction: column; gap: 12px; }
  .cat-item { display: flex; flex-direction: column; gap: 4px; }
  #info-rows, #controls-rows { display: flex; flex-direction: column; gap: 4px; margin-bottom: 4px; }
  .add-row-form ha-form { display: block; }
  .empty-hint { color: var(--secondary-text-color); font-size: 0.85em; padding: 4px 0 8px; }
  .add-row { display: flex; justify-content: flex-start; margin-top: 4px; }
  .add-btn {
    display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
    border: 1px solid var(--divider-color, #ccc); border-radius: 8px;
    background: none; color: var(--primary-color); padding: 8px 14px;
    font-size: 0.85em; font-weight: 500; font-family: inherit;
  }
  .add-btn:hover { background: rgba(var(--rgb-primary-color, 3,169,244), 0.08); }
  .add-btn:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }

  .detail-header { display: flex; align-items: center; gap: 8px; padding: 4px 0 12px; }
  .detail-title { font-size: 1.1em; font-weight: 500; color: var(--primary-text-color); }
`;
