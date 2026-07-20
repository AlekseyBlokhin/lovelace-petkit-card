/**
 * Card CSS, ported verbatim from the original hand-authored card's `_css()`.
 * Kept as its own module (excluded from coverage) since it's presentational
 * data, not logic.
 */
export const CARD_STYLES = `
  /* Shared design tokens -- every gap/padding/border-radius below reuses one
     of these instead of repeating its own literal, so there's a single place
     to see (and change) the spacing/radius scale this card uses. Values are
     unchanged from what was previously hard-coded per rule; this is a pure
     naming pass, not a re-design. */
  :host {
    --pk-space-3xs: 2px;
    --pk-space-2xs: 4px;
    --pk-space-xs: 6px;
    --pk-space-sm: 8px;
    --pk-space-md: 10px;
    --pk-space-lg: 12px;
    --pk-space-xl: 14px;
    --pk-space-2xl: 16px;
    --pk-radius-sm: 6px;
    --pk-radius-md: 8px;
    --pk-radius-lg: 10px;
    /* Analytics table column widths, shared by every cat's table (see
       .col-name/.col-stat below) so columns line up across cats regardless
       of how long any one cat's numbers happen to render. */
    --pk-analytics-name-col: 34%;
    --pk-analytics-stat-col: 22%;
  }
  ha-card { padding: var(--pk-space-2xl); display: flex; flex-direction: column; gap: var(--pk-space-xl); }
  .header { display: flex; align-items: center; justify-content: space-between; }
  .title { font-size: 1.2em; font-weight: 500; color: var(--primary-text-color); }
  .status-row { display: flex; flex-wrap: wrap; gap: var(--pk-space-sm); }
  .chip { display: flex; align-items: center; gap: var(--pk-space-xs); background: var(--secondary-background-color); border-radius: var(--pk-radius-lg); padding: var(--pk-space-xs) var(--pk-space-md); flex: 1 1 auto; min-width: 100px; }
  .chip.warn { background: rgba(var(--rgb-state-warning-color, 255,152,0), 0.15); }
  .chip.warn ha-icon { color: var(--warning-color); }
  .chip.tappable { cursor: pointer; }
  .chip.tappable:hover, .chip.tappable:focus-visible { background: var(--divider-color); outline: none; }
  .chip-label { font-size: 0.7em; color: var(--secondary-text-color); }
  .chip-value { font-size: 0.95em; color: var(--primary-text-color); font-weight: 500; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .controls-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--pk-space-sm); }
  ha-control-button.ctrl-btn {
    width: 100%;
    height: auto;
    --control-button-padding: var(--pk-space-md) var(--pk-space-2xs);
    --control-button-border-radius: var(--pk-radius-lg);
    --control-button-background-color: var(--secondary-background-color);
    --control-button-background-opacity: 1;
    --control-button-icon-color: var(--state-icon-color, var(--primary-color));
    --mdc-icon-size: 24px;
  }
  ha-control-button.ctrl-btn:hover {
    --control-button-background-color: var(--divider-color);
  }
  .ctrl-btn-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--pk-space-2xs);
    font-size: 0.75em;
  }
  .ctrl-btn-content span {
    color: var(--primary-text-color);
  }
  .chart-section { display: flex; flex-direction: column; gap: 0; }
  .chart-header { display: flex; align-items: center; justify-content: center; gap: var(--pk-space-2xl); margin-bottom: var(--pk-space-xs); }
  .nav-btn { background: none; border: none; color: var(--primary-text-color); font-size: 1em; cursor: pointer; padding: var(--pk-space-2xs) var(--pk-space-md); border-radius: var(--pk-radius-md); }
  .nav-btn:hover { background: var(--secondary-background-color); }
  .nav-btn:disabled { opacity: 0.3; cursor: default; }
  .day-label { font-weight: 500; color: var(--primary-text-color); min-width: 140px; text-align: center; }
  .chart-wrap { position: relative; }
  /* height:auto (not a fixed px) is deliberate: the SVG's viewBox aspect
     ratio (CHART_WIDTH:CHART_HEIGHT) doesn't match a typical narrow card's
     rendered width, so a fixed height here made the browser letterbox the
     content -- large empty bands above and below the actual chart, inside
     what looked like a single reserved box. height:auto lets the rendered
     height follow the viewBox aspect ratio at the actual rendered width, so
     the element's box always matches its content with no dead space. */
  .chart-svg { width: 100%; height: auto; display: block; }
  /* Solid hairlines, never dashed, per this project's dataviz guidance
     (gridlines are recessive chart furniture, not a plotted series). */
  .grid-line-v { stroke: var(--divider-color); stroke-width: 1; }
  .grid-line-h { stroke: var(--divider-color); stroke-width: 1; opacity: 0.5; }
  /* Axis tick labels: real HTML elements absolutely positioned over
     .chart-wrap (see the xAxisLabels/yAxisLabels comment in
     _renderChartArea), NOT SVG text. A normal, fixed CSS font-size here
     means the on-screen text size no longer depends on the SVG viewBox's
     scale factor at the card's current rendered width -- that dependency
     was the root cause of two prior "wrong size" regressions (issue #5).
     0.7em matches this card's existing muted/secondary-text convention
     (see .chip-label). */
  .axis-label { position: absolute; transform: translateX(-50%); font-size: 0.7em; color: var(--secondary-text-color); font-weight: 500; white-space: nowrap; }
  .axis-label-y {
    position: absolute;
    left: 0;
    /* width is set inline per-render (see _renderChartArea's yAxisLabels),
       as a percentage of the chart derived from the SAME CHART_PADDING.left
       viewBox units the SVG plot itself uses -- NOT a fixed CSS px guessed
       to "roughly" match it. A fixed px here (the previous approach) is a
       real CSS pixel value that doesn't scale with the SVG's viewBox, while
       CHART_PADDING.left is a viewBox unit that DOES scale with the card's
       rendered width -- the two could only ever coincide at one specific
       card width, and diverged everywhere else. That divergence is exactly
       why stems for a visit at/near hour 0 (midnight) could render under
       this label's text: the plot's left edge (xFor at hour 0) sits inside
       where the fixed-px label column still was. Deriving width from
       padding.left instead means the label's right edge and the plot's
       left edge are always the same position, at any card width -- see
       CHART_PADDING.left's own comment in petkit-puramax-card.const.js.
       box-sizing:border-box + padding-right below keep the actual text
       clear of that boundary by one more step (breathing room). */
    transform: translateY(-50%);
    font-size: 0.7em;
    color: var(--secondary-text-color);
    text-align: right;
    padding-right: var(--pk-space-2xs);
    white-space: nowrap;
    box-sizing: border-box;
  }
  .visit-point { pointer-events: none; }
  .visit-hit { cursor: pointer; pointer-events: stroke; }
  .chart-tooltip { position: absolute; pointer-events: none; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 6px; padding: 4px 8px; font-size: 0.75em; color: var(--primary-text-color); box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap; z-index: 10; opacity: 0; transition: opacity 0.1s; transform: translate(-50%, -110%); }
  .chart-tooltip.visible { opacity: 1; }
  .empty-note { text-align: center; color: var(--secondary-text-color); font-size: 0.85em; padding: 8px; }
  .section-title { font-weight: 500; color: var(--primary-text-color); margin-bottom: 4px; font-size: 1em; }
  .usage-section { display: flex; flex-direction: column; gap: 0; }
  /* Component-internal spacer between the usage line and the chart below it
     -- deliberately smaller than the 14px ha-card uses between top-level
     sections (that gap is between sections; this one is within one
     section, see issue #8). .chart-section itself stays at gap:0 since
     chart-header's own margin-bottom already spaces it from usage-section. */
  .chart-area { margin-top: 8px; }
  .usage-row { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
  .stat-value { font-size: 1em; font-weight: 600; color: var(--primary-text-color); }
  .usage-cats { display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.85em; color: var(--secondary-text-color); justify-content: flex-end; }
  .usage-cat { display: flex; align-items: center; gap: 4px; }
  .records-list { display: flex; flex-direction: column; gap: 6px; max-height: 150px; overflow-y: auto; }
  .record-row { display: flex; align-items: center; gap: 8px; font-size: 0.85em; color: var(--primary-text-color); }
  .record-time { color: var(--secondary-text-color); min-width: 46px; }
  .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--pk-space-lg); }
  /* table-layout: fixed + explicit .col-name/.col-stat widths (below) is
     what actually keeps every cat's columns aligned. table-layout's default
     (auto) sizes each table's columns from ITS OWN cells' content, so two
     cats with differently-long numbers (e.g. "16.3" vs "4.3", "1m06s" vs
     "58s") ended up with differently-positioned column boundaries even
     though every table sits in an identically-sized grid cell. Fixed layout
     ignores content width and just splits the table's own width by the
     shared percentages below, so as long as every table is the same width
     (guaranteed by .analytics-grid's equal-width grid tracks), every cat's
     columns land in exactly the same place. */
  .cat-analytics table { width: 100%; table-layout: fixed; font-size: 0.8em; color: var(--primary-text-color); border-collapse: collapse; }
  .col-name { width: var(--pk-analytics-name-col); }
  .col-stat { width: var(--pk-analytics-stat-col); }
  .cat-analytics td { padding: var(--pk-space-3xs) var(--pk-space-2xs); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cat-analytics tr:first-child td { color: var(--secondary-text-color); font-size: 0.9em; }
  .cat-name-cell { display: flex; align-items: center; gap: var(--pk-space-xs); font-weight: 500; color: var(--primary-text-color) !important; font-size: 0.9em; overflow: hidden; text-overflow: ellipsis; }
  .warn-banner { display: flex; align-items: center; gap: var(--pk-space-sm); background: rgba(var(--rgb-state-warning-color, 255,152,0), 0.15); color: var(--warning-color); border-radius: var(--pk-radius-md); padding: var(--pk-space-sm) var(--pk-space-md); font-size: 0.85em; margin-bottom: var(--pk-space-sm); }
  .no-visit-banner { display: flex; align-items: center; gap: var(--pk-space-sm); background: rgba(var(--rgb-state-error-color, 244,67,54), 0.15); color: var(--error-color); border-radius: var(--pk-radius-md); padding: var(--pk-space-sm) var(--pk-space-md); font-size: 0.85em; margin-bottom: var(--pk-space-sm); }
`;
