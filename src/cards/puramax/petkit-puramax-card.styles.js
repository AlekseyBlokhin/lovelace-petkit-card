/**
 * Card CSS, ported verbatim from the original hand-authored card's `_css()`.
 * Kept as its own module (excluded from coverage) since it's presentational
 * data, not logic.
 */
export const CARD_STYLES = `
  ha-card { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
  .header { display: flex; align-items: center; justify-content: space-between; }
  .title { font-size: 1.2em; font-weight: 500; color: var(--primary-text-color); }
  .status-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip { display: flex; align-items: center; gap: 6px; background: var(--secondary-background-color); border-radius: 10px; padding: 6px 10px; flex: 1 1 auto; min-width: 100px; }
  .chip.warn { background: rgba(var(--rgb-state-warning-color, 255,152,0), 0.15); }
  .chip.warn ha-icon { color: var(--warning-color); }
  .chip-label { font-size: 0.7em; color: var(--secondary-text-color); }
  .chip-value { font-size: 0.95em; color: var(--primary-text-color); font-weight: 500; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .controls-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .ctrl-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; background: var(--secondary-background-color); border: none; border-radius: 10px; padding: 10px 4px; color: var(--primary-text-color); cursor: pointer; font-size: 0.75em; }
  .ctrl-btn:hover { background: var(--divider-color); }
  .ctrl-btn ha-icon { color: var(--state-icon-color, var(--primary-color)); }
  .chart-section { display: flex; flex-direction: column; gap: 0; }
  .chart-header { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 6px; }
  .nav-btn { background: none; border: none; color: var(--primary-text-color); font-size: 1em; cursor: pointer; padding: 4px 10px; border-radius: 8px; }
  .nav-btn:hover { background: var(--secondary-background-color); }
  .nav-btn:disabled { opacity: 0.3; cursor: default; }
  .day-label { font-weight: 500; color: var(--primary-text-color); min-width: 140px; text-align: center; }
  .chart-wrap { position: relative; }
  .chart-svg { width: 100%; height: 240px; }
  .grid-line-v { stroke: var(--divider-color); stroke-width: 1; }
  .grid-line-h { stroke: var(--divider-color); stroke-width: 1; stroke-dasharray: 2,3; opacity: 0.5; }
  .axis-label { font-size: 13px; fill: var(--secondary-text-color); text-anchor: middle; font-weight: 500; }
  .axis-label-y { font-size: 11px; fill: var(--secondary-text-color); text-anchor: end; }
  .visit-point { pointer-events: none; }
  .visit-hit { cursor: pointer; pointer-events: stroke; }
  .chart-tooltip { position: absolute; pointer-events: none; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 6px; padding: 4px 8px; font-size: 0.75em; color: var(--primary-text-color); box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap; z-index: 10; opacity: 0; transition: opacity 0.1s; transform: translate(-50%, -110%); }
  .chart-tooltip.visible { opacity: 1; }
  .analytics-section { margin-top: -8px; }
  .empty-note { text-align: center; color: var(--secondary-text-color); font-size: 0.85em; padding: 8px; }
  .section-title { font-weight: 500; color: var(--primary-text-color); margin-bottom: 4px; font-size: 1em; }
  .usage-section { display: flex; flex-direction: column; gap: 0; }
  .usage-row { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
  .stat-value { font-size: 1em; font-weight: 600; color: var(--primary-text-color); }
  .usage-cats { display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.85em; color: var(--secondary-text-color); justify-content: flex-end; }
  .usage-cat { display: flex; align-items: center; gap: 4px; }
  .records-list { display: flex; flex-direction: column; gap: 6px; max-height: 150px; overflow-y: auto; }
  .record-row { display: flex; align-items: center; gap: 8px; font-size: 0.85em; color: var(--primary-text-color); }
  .record-time { color: var(--secondary-text-color); min-width: 46px; }
  .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
  .cat-analytics-title { display: flex; align-items: center; gap: 6px; font-weight: 500; margin-bottom: 6px; color: var(--primary-text-color); }
  .cat-analytics table { width: 100%; font-size: 0.8em; color: var(--primary-text-color); border-collapse: collapse; }
  .cat-analytics td { padding: 2px 4px; }
  .cat-analytics tr:first-child td { color: var(--secondary-text-color); font-size: 0.9em; }
  .warn-banner { display: flex; align-items: center; gap: 8px; background: rgba(var(--rgb-state-warning-color, 255,152,0), 0.15); color: var(--warning-color); border-radius: 8px; padding: 8px 10px; font-size: 0.85em; margin-bottom: 8px; }
  .loading { color: var(--secondary-text-color); font-size: 0.85em; padding: 8px; text-align: center; }
`;
