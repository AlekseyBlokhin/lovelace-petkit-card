/**
 * Editor CSS (both the normal list view and the Edit sub-page share one
 * shadow root, so one stylesheet covers both). A Lit `css` tagged template
 * (construable stylesheet, assigned to `static styles` on the editor)
 * rather than a plain string injected via a per-template `<style>` tag.
 */
import { css } from 'lit';

export const EDITOR_STYLES = css`
  .editor { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
  /* No border-radius override here -- ha-form's own internal
     "Content"/"Analytics & alerts" expandable groups render their own
     ha-expansion-panel with HA's default corner radius; an override on
     ONLY these editor-owned panels (Cats/Status chips/Controls) can't
     reach inside ha-form's shadow DOM to match it, so it's left at the
     native default everywhere for a consistent look across all five
     sections. */
  ha-expansion-panel { --expansion-panel-summary-padding: 0 16px; }
  ha-expansion-panel h3[slot="header"] { margin: 0; font-size: 1em; font-weight: 500; }
  ha-svg-icon[slot="leading-icon"] { color: var(--secondary-text-color); }
  .panel-body { display: flex; flex-direction: column; gap: 4px; padding: 4px 16px 16px; }
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
