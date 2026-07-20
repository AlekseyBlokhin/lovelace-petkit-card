function g(r){let C=Math.round(r||0);if(C<60)return`${C}s`;let H=Math.floor(C/60),V=C%60;return`${H}m${V.toString().padStart(2,"0")}s`}function z(r){let C=Math.round(r||0),H=Math.floor(C/60),V=C%60;return`${H.toString().padStart(2,"0")}'${V.toString().padStart(2,"0")}"`}function K(r){let C=Math.floor(r);return C<1?"under 1h":C<48?`${C}h`:`${Math.floor(C/24)}d`}function v(r){return String(r).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function B(r,C=new Date){let H=new Date(C.getFullYear(),C.getMonth(),C.getDate());H.setDate(H.getDate()+r);let V=new Date(H);return V.setDate(V.getDate()+1),{start:H,end:V}}function $(r,C=new Date){if(r===0)return"Today";if(r===-1)return"Yesterday";let{start:H}=B(r,C);return H.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"})}function _(r){let C=new Date(r);return`${C.getFullYear()}-${C.getMonth()}-${C.getDate()}`}function b({startTime:r,endTime:C,entityIds:H,includeStartTimeState:V=!1}){let L=r instanceof Date?r.toISOString():r,M=C instanceof Date?C.toISOString():C;return{type:"history/history_during_period",start_time:L,end_time:M,entity_ids:H,minimal_response:!1,no_attributes:!0,include_start_time_state:V}}function _1(r){if(!r)return null;let C=r.s??r.state,H=parseFloat(C),V=r.lu?r.lu*1e3:r.last_changed?Date.parse(r.last_changed):null;return!Number.isFinite(H)||!V||Number.isNaN(V)?null:{value:H,ts:V}}function q(r,{minDelta:C=0,maxDelta:H=1/0}={}){if(!Array.isArray(r))return[];let V=r.map(_1).filter(Boolean).sort((M,e)=>M.ts-e.ts),L=[];for(let M=1;M<V.length;M++){let e=V[M].value-V[M-1].value;if(e<=C||e>=H)continue;let t=V[M+1];t&&t.value===V[M-1].value||L.push({value:e,ts:V[M].ts})}return L}var E1="unknown_pet",s="Unknown";function j(r,C){if(!Array.isArray(r))return[];let H=new Set(C),V=[];for(let L of r){let M=L.s??L.state,e;if(H.has(M))e=M;else if(M===E1)e=s;else continue;let t=L.lu?L.lu*1e3:L.last_changed?Date.parse(L.last_changed):null;!t||Number.isNaN(t)||V.push({cat:e,ts:t})}return V.sort((L,M)=>L.ts-M.ts),V}function X(r,C){let H=r.length,V=new Array(H).fill(null),L=0,M=null;for(let e=0;e<H;e++){let t=r[e].ts,i=e===0?-1/0:(r[e-1].ts+t)/2,o=e===H-1?1/0:(t+r[e+1].ts)/2;for(;L<C.length&&C[L].ts<i;)M=C[L].cat,L++;let a=null,d=1/0;for(;L<C.length&&C[L].ts<o;){let A=Math.abs(C[L].ts-t);A<d&&(d=A,a=C[L].cat),M=C[L].cat,L++}V[e]=a!==null?a:M}return r.map((e,t)=>({...e,cat:V[t]}))}var N1=[10,15,30,60,120,180,300,600,900,1800,3600];function Y(r){for(let C of N1)if(r/C<=5)return C;return Math.ceil(r/5/60)*60}function J({dayStart:r,niceMax:C,width:H,height:V,padding:L}){let{left:M,right:e,top:t,bottom:i}=L,o=H-M-e,a=V-t-i,d=r.getTime();return{xFor:m=>{let l=(m-d)/36e5;return M+l/24*o},yFor:m=>C?V-i-m/C*a:V-i}}function C1({niceMax:r,yStep:C,width:H,height:V,padding:L}){let{left:M,right:e,top:t,bottom:i}=L,o=H-M-e,a=V-t-i,d=[4,8,12,16,20].map(p=>({hour:p,x:M+p/24*o,label:`${p.toString().padStart(2,"0")}:00`})),A=[];if(C>0)for(let p=0;p<=r;p+=C){let m=r?V-i-p/r*a:V-i;A.push({value:p,y:m,label:z(p)})}return{vertical:d,horizontal:A}}function H1(r,{dayKeyFn:C}){let H={};for(let V of r||[]){let L=C(V.ts);H[L]||(H[L]={count:0,total:0}),H[L].count+=1,H[L].total+=V.value}return H}function V1(r,C){let H=Object.keys(r).filter(a=>a!==C).sort(),V=H.slice(-3),L=H.slice(-7),M=(a,d)=>a.length?a.reduce((A,p)=>A+r[p][d],0)/a.length:null,e=a=>{if(!a.length)return null;let d=a.reduce((p,m)=>p+r[m].total,0),A=a.reduce((p,m)=>p+r[m].count,0);return A>0?d/A:null},t=r[C],i=t?t.count:0,o=t?t.total:0;return{todayCount:i,todayTotal:o,todayAvgDuration:i>0?o/i:null,avg3dVisits:M(V,"count"),avg3dTotal:M(V,"total"),avg3dDuration:e(V),avg7dVisits:M(L,"count"),avg7dTotal:M(L,"total"),avg7dDuration:e(L),daysOfHistory:H.length}}function L1({lastVisitTs:r,now:C,thresholdHours:H}){let V=C instanceof Date?C.getTime():C;if(r==null)return{alerting:!0,hoursSince:null};let L=(V-r)/36e5;return{alerting:L>=H,hoursSince:L}}function M1(r,C){let H=C;r.value_map&&C in r.value_map?H=r.value_map[C]:C!==null&&r.unit&&(H=`${C}${r.unit}`),H==null&&(H="\u2014");let V=parseFloat(C),L=!1;return r.warn_below!==void 0&&Number.isFinite(V)&&(L=V<r.warn_below),r.warn_above!==void 0&&Number.isFinite(V)&&(L=L||V>r.warn_above),r.warn_state!==void 0&&(L=L||C===r.warn_state),{display:H,warn:L}}function r1(r,C,H){return!C||!r||!r.states||!r.states[C]?H:r.states[C].state}function k(r,C){let H=new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:C}});r.dispatchEvent(H)}function w(r,C,H,V){r.callService(C,H,V)}var W1={total_use:["total_use","total_time"],last_used_by:["last_used_by"],error:["error","error_message"],last_event:["max_last_event","litter_last_event"],state:["max_work_state","litter_state"]};function E(r,C){let H={};if(!C||!r||!r.entities)return H;let V=Object.values(r.entities).filter(L=>L.device_id===C&&L.entity_id.startsWith("sensor."));for(let[L,M]of Object.entries(W1)){let e=V.find(t=>M.includes(t.translation_key));e&&(H[L]=e.entity_id)}return H}function u(r,C,H){if(!(!C||!r||!r.entities))return Object.values(r.entities).find(V=>V.device_id===C&&V.translation_key===H)}var I1=["wastebin","litter_weight","times_used","pura_air_battery"];function e1(r,C){let H=[];for(let V of I1){let L=u(r,C,V);L&&H.push({entity:L.entity_id})}return H}function t1(r,C,H){let V=[],L=d=>({action:"perform-action",perform_action:"button.press",target:{entity_id:d}}),M=u(r,C,"start_cleaning"),e=u(r,C,"pause_cleaning");M&&V.push({entity:M.entity_id,name:"Clean Now",tap_action:L(M.entity_id),...e&&H?{visibility:[{condition:"state",entity:H,state_not:"cleaning_litter_box"}]}:{}}),e&&H&&V.push({entity:e.entity_id,name:"Pause Cleaning",tap_action:L(e.entity_id),visibility:[{condition:"state",entity:H,state:"cleaning_litter_box"}]});let t=u(r,C,"start_maintenance"),i=u(r,C,"exit_maintenance");t&&V.push({entity:t.entity_id,name:"Start Maintenance",tap_action:L(t.entity_id),...i&&H?{visibility:[{condition:"state",entity:H,state_not:"maintenance_mode"}]}:{}}),i&&H&&V.push({entity:i.entity_id,name:"Exit Maintenance",tap_action:L(i.entity_id),visibility:[{condition:"state",entity:H,state:"maintenance_mode"}]});let o=u(r,C,"dump_litter");o&&V.push({entity:o.entity_id,name:"Dump Litter",tap_action:L(o.entity_id)});let a=u(r,C,"auto_cleaning");return a&&V.push({entity:a.entity_id,name:"Auto cleaning",tap_action:{action:"toggle"}}),V}var G1=new Set(["primary","accent","red","pink","purple","deep-purple","indigo","blue","light-blue","cyan","teal","green","light-green","lime","yellow","amber","orange","deep-orange","brown","light-grey","grey","dark-grey","blue-grey","black","white"]);function y(r){return r&&(G1.has(r)?`var(--${r}-color)`:r)}function Q1(r,C){let H=C?.confirmation?.exemptions;return!H||!r?.user?.id?!1:H.some(V=>V.user===r.user.id)}function P(r,C,H,V){let L=H||{action:"more-info"};if(L.confirmation&&!Q1(C,L)){let M=L.confirmation.text||"Are you sure?";if(!window.confirm(M))return}switch(L.action){case"more-info":{let M=L.entity||V;M&&k(r,M);return}case"toggle":{let M=L.entity||V;M&&w(C,"homeassistant","toggle",{entity_id:M});return}case"perform-action":case"call-service":{let M=L.perform_action||L.service;if(!M)return;let e=M.indexOf(".");if(e===-1)return;let t=M.slice(0,e),i=M.slice(e+1),o={...L.data||L.service_data||{},...L.target||{}};w(C,t,i,o);return}case"navigate":{if(!L.navigation_path)return;window.history.pushState(null,"",L.navigation_path),window.dispatchEvent(new CustomEvent("location-changed",{bubbles:!1,composed:!0,detail:{replace:!!L.navigation_replace}}));return}case"url":{L.url_path&&window.open(L.url_path);return}default:return}}var U1=500,N=250;function i1(r,C){let H=0,V=0;r.addEventListener("pointerdown",()=>{H=Date.now()}),r.addEventListener("click",()=>{let{hass:L,tapAction:M,holdAction:e,doubleTapAction:t,fallbackEntity:i}=C();if(e&&Date.now()-H>=U1){P(r,L,e,i);return}let o=Date.now();if(t&&o-V<N){V=0,P(r,L,t,i);return}V=o,t?setTimeout(()=>{Date.now()-V>=N&&P(r,L,M,i)},N):P(r,L,M,i)})}var z1="unknown";function o1(r){if(r!=null)return Array.isArray(r)?r:[r]}function A1(r,C,H){let V=r&&r.states&&C?r.states[C]:void 0;return V?H?V.attributes?.[H]:V.state:z1}function a1(r,C){switch(C.condition){case"state":{let H=A1(r,C.entity,C.attribute),V=o1(C.state),L=o1(C.state_not);return!(!V&&!L||V&&!V.includes(H)||L&&L.includes(H))}case"numeric_state":{let H=A1(r,C.entity,C.attribute),V=Number(H);return!(Number.isNaN(V)||C.above!=null&&!(V>C.above)||C.below!=null&&!(V<C.below))}case"and":return T(C.conditions,r);case"or":return!C.conditions||C.conditions.length===0?!0:C.conditions.some(H=>a1(r,H));case"not":return!T(C.conditions,r);default:return!0}}function T(r,C){return!r||r.length===0?!0:r.every(H=>a1(C,H))}var d1=`
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
  .header { display: flex; align-items: center; justify-content: space-between; gap: var(--pk-space-sm); }
  .title { font-size: 1.2em; font-weight: 500; color: var(--primary-text-color); }
  .state-badge {
    font-size: 0.75em; color: var(--secondary-text-color); background: var(--secondary-background-color);
    border-radius: var(--pk-radius-lg); padding: var(--pk-space-2xs) var(--pk-space-sm);
    cursor: pointer; text-transform: capitalize; white-space: nowrap; flex: 0 0 auto;
  }
  .state-badge:hover, .state-badge:focus-visible { background: var(--divider-color); outline: none; }
  .state-badge[hidden] { display: none; }
  .status-row { display: flex; flex-wrap: wrap; gap: var(--pk-space-sm); }
  .chip { display: flex; align-items: center; gap: var(--pk-space-xs); background: var(--secondary-background-color); border-radius: var(--pk-radius-lg); padding: var(--pk-space-xs) var(--pk-space-md); flex: 1 1 auto; min-width: 80px; }
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
  /* Highlights a toggle-style control (e.g. "Auto cleaning") whenever its
     own entity is currently "on" -- reuses the same custom properties the
     button already exposes for hover, just with the theme's primary color. */
  ha-control-button.ctrl-btn.ctrl-btn-active {
    --control-button-background-color: var(--primary-color);
    --control-button-background-opacity: 0.2;
    --control-button-icon-color: var(--primary-color);
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
`;var p1={maintenance_mode:"Maintenance mode",manual_odor_completed:"Manual odor removal done",auto_cleaning_completed:"Auto cleaning done"},m1=["unavailable","unknown","no_events_yet"],W="#9e9e9e",n1="PETKIT PURAMAX",v1=60,x1=8,l1=1800,Z1=600,S1=240,u1={left:46,right:10,top:10,bottom:28};var F=class extends HTMLElement{static getConfigElement(){return document.createElement("petkit-puramax-card-editor")}static getStubConfig(C){let H=C&&C.entities?Object.values(C.entities).find(t=>t.platform==="petkit"):null,V=H?H.device_id:"",L=E(C,V),M=e1(C,V),e=t1(C,V,L.state);return{type:"custom:petkit-puramax-card",title:"PETKIT PURAMAX",device_id:V,...M.length?{info_row:M}:{},...e.length?{controls_row:e}:{},cats:[{name:"My Cat",color:"blue"}]}}setConfig(C){if(!C)throw new Error("petkit-puramax-card: config is required");let H=C.device_id!==void 0;if(!H&&!C.device_entities)throw new Error('petkit-puramax-card: "device_entities" is required in config (or set "device_id")');let V=C.device_entities||{};if(!H&&!V.total_use)throw new Error('petkit-puramax-card: "device_entities.total_use" is required in config (or set "device_id")');if(!C.cats)throw new Error('petkit-puramax-card: "cats" is required in config');if(!Array.isArray(C.cats)||C.cats.length<1)throw new Error('petkit-puramax-card: "cats" must be a non-empty array');if(!H&&C.cats.length>1&&!V.last_used_by)throw new Error('petkit-puramax-card: "device_entities.last_used_by" is required in config when more than one cat is configured (or set "device_id")');C.cats.forEach((L,M)=>{if(!L||!L.name)throw new Error(`petkit-puramax-card: cats[${M}].name is required`);if(!L.color)throw new Error(`petkit-puramax-card: cats[${M}].color is required`)}),this._config={...C,device_entities:V},this._dayOffset=0,this._analytics=null,this._chartData=null,this._loadingChart=!1,this._loadingAnalytics=!1,this._deviceEntities=this._resolveDeviceEntities(),this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}_resolveDeviceEntities(){return{...E(this._hass,this._config.device_id),...this._config.device_entities}}_configError(){if(this._config.device_id===void 0)return null;let C=!this._config.device_id;return this._deviceEntities.total_use?this._config.cats.length>1&&!this._deviceEntities.last_used_by?C?'A PetKit device is required (or set "device_entities.last_used_by" manually) since more than one cat is configured.':'Could not auto-detect a "last used by" sensor on the selected device (required for more than one cat). Set "device_entities.last_used_by" in the config to override.':null:C?'A PetKit device is required. Select one in the card editor, or set "device_entities.total_use" manually.':'Could not auto-detect a "total use" sensor on the selected device. Set "device_entities.total_use" in the config to override.'}_renderError(C){this.shadowRoot||this.attachShadow({mode:"open"}),this.shadowRoot.innerHTML=`<ha-card><div style="padding: 16px;"><ha-alert alert-type="error">${v(C)}</ha-alert></div></ha-card>`}set hass(C){let H=this._hass;if(this._hass=C,this._deviceEntities=this._resolveDeviceEntities(),!this._built){this._built=!0,this._build();return}this._updateLiveValues(),this._maybeRefreshOnNewVisit(H)}get hass(){return this._hass}getCardSize(){return 14}_build(){let C=this._configError();if(C){this._renderError(C);return}this._render(),this._loadDay(),this._loadAnalytics(),this._startNoVisitTimer()}connectedCallback(){this._hass&&!this._built&&(this._built=!0,this._build())}disconnectedCallback(){this._noVisitTimer&&(clearInterval(this._noVisitTimer),this._noVisitTimer=null)}_startNoVisitTimer(){this._noVisitTimer||(this._noVisitTimer=setInterval(()=>this._checkNoVisitAlerts(),300*1e3))}_maybeRefreshOnNewVisit(C){if(!C)return;let H=this._deviceEntities.total_use,V=C.states[H],L=this._hass.states[H];L&&(!V||V.last_changed!==L.last_changed)&&(this._dayOffset===0&&this._loadDay(),this._loadAnalytics())}_s(C,H){return r1(this._hass,C,H)}async _fetchVisits({start:C,end:H}){let V=this._config,L=this._deviceEntities,M=b({startTime:C,endTime:H,entityIds:[L.total_use]}),e=[this._hass.callWS(M)];if(V.cats.length>1){let A=b({startTime:C,endTime:H,entityIds:[L.last_used_by],includeStartTimeState:!0});e.push(this._hass.callWS(A))}let t={},i={};try{let[A,p]=await Promise.all(e);t=A||{},i=p||{}}catch{}let o=q(t[L.total_use],{minDelta:0,maxDelta:l1}),a;if(V.cats.length>1){let A=V.cats.map(m=>m.name),p=j(i[L.last_used_by],A);a=X(o,p)}else a=o.map(A=>({...A,cat:V.cats[0].name}));let d=new Map(V.cats.map(A=>[A.name,A]));return a.map(A=>({cat:A.cat===s?this._unknownCat():d.get(A.cat)||null,duration:A.value,ts:A.ts}))}_unknownCat(){return{name:s,color:this._config.unknown_cat_color||W}}async _loadDay(){if(!this._hass)return;this._loadingChart=!0,this._renderChartArea();let C=this._deviceEntities,{start:H,end:V}=B(this._dayOffset),L=[],M=[];try{let[e,t]=await Promise.all([this._fetchVisits({start:H,end:V}),C.last_event?this._hass.callWS(b({startTime:H,endTime:V,entityIds:[C.last_event]})):Promise.resolve({})]);L=e,M=(t||{})[C.last_event]||[]}catch{L=[],M=[]}this._chartVisits=L,this._chartEventHist=M,this._loadingChart=!1,this._renderChartArea()}async _loadAnalytics(){if(!this._hass)return;this._loadingAnalytics=!0,this._renderAnalyticsArea();let C=this._config,H=new Date,V=new Date(H.getTime()-168*3600*1e3),L=[];try{L=await this._fetchVisits({start:V,end:H})}catch{L=[]}let M=_(H.getTime()),e={};C.cats.forEach(t=>{let i=L.filter(d=>d.cat===t).map(d=>({value:d.duration,ts:d.ts})),o=H1(i,{dayKeyFn:_}),a=i.length?Math.max(...i.map(d=>d.ts)):null;e[t.name]={...V1(o,M),lastVisitTs:a}}),this._analytics=e,this._loadingAnalytics=!1,this._checkNoVisitAlerts(),this._renderAnalyticsArea()}_checkNoVisitAlerts(){if(!this._analytics||!this._built)return;let C=this._config,H=C.no_visit_alert_hours??x1,V=Date.now();this._notifiedCats||(this._notifiedCats=new Set),C.cats.forEach(L=>{let M=this._analytics[L.name];if(!M)return;let e=L1({lastVisitTs:M.lastVisitTs,now:V,thresholdHours:H});M.noVisitAlert=e;let t=this._notifiedCats.has(L.name);e.alerting&&!t?(this._notifiedCats.add(L.name),this._sendNoVisitNotification(L,e)):!e.alerting&&t&&this._notifiedCats.delete(L.name)}),this._renderAnalyticsArea()}_sendNoVisitNotification(C,H){let V=this._config.notify_service;if(!V||!this._hass)return;let L=V.indexOf(".");if(L===-1)return;let M=V.slice(0,L),e=V.slice(L+1);if(M!=="notify"||!e)return;let t=H.hoursSince==null?`${C.name} hasn't used the litter box yet in the tracked history.`:`${C.name} hasn't used the litter box in over ${Math.floor(H.hoursSince)}h.`;w(this._hass,"notify",e,{message:t,title:"Litter box alert"})}_render(){let C=this._config;this.shadowRoot.innerHTML=`
      <style>${d1}</style>
      <ha-card>
        <div class="header">
          <div class="title">${C.title||n1}</div>
          ${C.show_state!==!1?'<div class="state-badge" id="state-badge" hidden></div>':""}
        </div>
        <div class="status-row" id="status-row"></div>
        <div class="controls-row" id="controls-row"></div>
        ${C.show_history!==!1?`
        <div class="chart-section">
          <div class="chart-header">
            <button class="nav-btn" id="prev-day">&#9664;</button>
            <div class="day-label" id="day-label"></div>
            <button class="nav-btn" id="next-day">&#9654;</button>
          </div>
          <div class="usage-section">
            <div id="usage-body"></div>
          </div>
          <div class="chart-area" id="chart-area"></div>
        </div>`:""}
        ${C.show_analytics!==!1?`
        <div class="analytics-section">
          <div class="section-title">Analytics</div>
          <div id="no-visit-banner"></div>
          <div id="decline-banner"></div>
          <div class="analytics-grid" id="analytics-grid"></div>
        </div>`:""}
        ${C.show_working_records!==!1?`
        <div class="records-section">
          <div class="section-title">Working Records</div>
          <div class="records-list" id="records-list"></div>
        </div>`:""}
      </ha-card>
    `;let H=this.shadowRoot.getElementById("prev-day"),V=this.shadowRoot.getElementById("next-day");H&&H.addEventListener("click",()=>this._changeDay(-1)),V&&V.addEventListener("click",()=>this._changeDay(1)),this._updateLiveValues(),this._renderChartArea(),this._renderAnalyticsArea()}_changeDay(C){this._dayOffset+=C,this._dayOffset>0&&(this._dayOffset=0),this._loadDay()}_updateLiveValues(){if(!this._built)return;let C=this._config,H=this._deviceEntities,V=this.shadowRoot.getElementById("state-badge");if(V){let e=this._s(H.state,null);if(V.hidden=!e,e&&(V.textContent=e.replace(/_/g," "),V.dataset.entity=H.state),!V.dataset.bound){V.dataset.bound="1",V.setAttribute("tabindex","0");let t=()=>{V.dataset.entity&&k(this,V.dataset.entity)};V.addEventListener("click",t),V.addEventListener("keydown",i=>{(i.key==="Enter"||i.key===" ")&&(i.preventDefault(),t())})}}let L=this.shadowRoot.getElementById("status-row");if(L){let e=this._s(H.error,"no_error"),t=e&&e!=="no_error",i=C.info_row||[];if(L.innerHTML=[...i.map(o=>this._renderInfoChip(o)),t?this._chip("mdi:alert","Error",e.replace(/_/g," "),!0,H.error):""].join(""),this._bindStateIcons(L),!L.dataset.bound){L.dataset.bound="1";let o=a=>{let d=a.target.closest(".chip[data-entity]");d&&k(this,d.dataset.entity)};L.addEventListener("click",o),L.addEventListener("keydown",a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),o(a))})}}let M=this.shadowRoot.getElementById("controls-row");if(M){let t=(C.controls_row||[]).map((o,a)=>({spec:o,i:a})).filter(({spec:o})=>T(o.visibility,this._hass)),i=t.map(o=>o.i).join(",");M.dataset.visKey!==i&&(M.dataset.visKey=i,M.innerHTML=t.map(({spec:o,i:a})=>`
      <ha-control-button class="ctrl-btn" id="ctrl-${a}" label="${v(this._entityLabel(o.name,o.entity))}">
        <div class="ctrl-btn-content">
          ${this._iconMarkup(o.icon,o.entity)}
          <span>${v(this._entityLabel(o.name,o.entity))}</span>
        </div>
      </ha-control-button>
    `).join(""),this._bindStateIcons(M),t.forEach(({spec:o,i:a})=>{let d=this.shadowRoot.getElementById(`ctrl-${a}`);i1(d,()=>({hass:this._hass,tapAction:o.tap_action,holdAction:o.hold_action,doubleTapAction:o.double_tap_action,fallbackEntity:o.entity}))})),t.forEach(({spec:o,i:a})=>{let d=this.shadowRoot.getElementById(`ctrl-${a}`);d&&d.classList.toggle("ctrl-btn-active",this._s(o.entity,null)==="on")})}}_iconMarkup(C,H){return C?`<ha-icon icon="${v(C)}"></ha-icon>`:H?`<ha-state-icon data-icon-entity="${v(H)}"></ha-state-icon>`:'<ha-icon icon="mdi:information-outline"></ha-icon>'}_bindStateIcons(C){C.querySelectorAll("ha-state-icon[data-icon-entity]").forEach(H=>{H.stateObj=this._hass&&this._hass.states?this._hass.states[H.dataset.iconEntity]:void 0})}_entityLabel(C,H){if(C)return C;let V=this._hass&&this._hass.states?this._hass.states[H]:null;return V&&V.attributes&&V.attributes.friendly_name||H||""}_renderInfoChip(C){let H=this._s(C.entity,null),{display:V,warn:L}=M1(C,H);return this._chip(C.icon,this._entityLabel(C.name,C.entity),V,L,C.entity)}_chip(C,H,V,L,M){let e=M?` data-entity="${v(M)}" tabindex="0"`:"";return`
      <div class="chip ${L?"warn":""} ${M?"tappable":""}"${e}>
        ${this._iconMarkup(C,M)}
        <div class="chip-text"><div class="chip-label">${v(H)}</div><div class="chip-value">${v(V)}</div></div>
      </div>`}_renderChartArea(){if(!this._built)return;let C=this.shadowRoot.getElementById("day-label");C&&(C.textContent=$(this._dayOffset));let H=this.shadowRoot.getElementById("next-day");H&&(H.disabled=this._dayOffset>=0);let V=this.shadowRoot.getElementById("chart-area"),L=this.shadowRoot.getElementById("records-list"),M=this.shadowRoot.getElementById("usage-body");if(this._loadingChart)return;let e=this._config,t=(this._chartVisits||[]).filter(A=>A.cat).sort((A,p)=>A.ts-p.ts);if(V){let A=Z1,p=S1,m=u1,l=Math.max(60,...t.map(n=>n.duration)),c=Y(l),x=Math.ceil(l/c)*c,{start:D}=B(this._dayOffset),{xFor:k1,yFor:w1}=J({dayStart:D,niceMax:x,width:A,height:p,padding:m}),{vertical:G,horizontal:Q}=C1({niceMax:x,yStep:c,width:A,height:p,padding:m}),y1=G.map(n=>`<line x1="${n.x}" y1="${m.top}" x2="${n.x}" y2="${p-m.bottom}" class="grid-line-v" />`).join(""),B1=Q.map(n=>`<line x1="${m.left}" y1="${n.y}" x2="${A-m.right}" y2="${n.y}" class="grid-line-h" />`).join(""),b1=(p-m.bottom)/p*100,P1=G.map(n=>`<div class="axis-label" style="left:${n.x/A*100}%;top:${b1}%">${n.label}</div>`).join(""),T1=m.left/A*100,F1=Q.map(n=>`<div class="axis-label-y" style="top:${n.y/p*100}%;width:${T1}%">${n.label}</div>`).join(""),R1=t.map((n,O)=>{let Z=k1(n.ts),S=w1(n.duration),f=p-m.bottom,U=y(n.cat.color);return`<line x1="${Z}" y1="${f}" x2="${Z}" y2="${S}" stroke="${U}" stroke-width="2" />
              <circle class="visit-point" cx="${Z}" cy="${S}" r="5" fill="${U}" />
              <line class="visit-hit" data-idx="${O}" x1="${Z}" y1="${f}" x2="${Z}" y2="${S}" stroke="transparent" stroke-width="16" />`}).join("");V.innerHTML=`
      <div class="chart-wrap">
        <svg viewBox="0 0 ${A} ${p}" class="chart-svg">
          ${B1}
          ${y1}
          ${R1||""}
        </svg>
        ${P1}
        ${F1}
        <div class="chart-tooltip" id="chart-tooltip"></div>
      </div>
      ${t.length===0?'<div class="empty-note">No visits recorded this day</div>':""}
    `;let h=this.shadowRoot.getElementById("chart-tooltip"),D1=V.querySelector(".chart-wrap");V.querySelectorAll(".visit-hit").forEach(n=>{n.addEventListener("mouseenter",()=>{let O=t[parseInt(n.dataset.idx,10)],Z=new Date(O.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"});h.textContent=`${Z} \xB7 ${O.cat.name} \xB7 ${g(O.duration)}`;let S=n.getBoundingClientRect(),f=D1.getBoundingClientRect();h.style.left=`${S.left-f.left+S.width/2}px`,h.style.top=`${S.top-f.top}px`,h.classList.add("visible")}),n.addEventListener("mouseleave",()=>{h.classList.remove("visible")})})}if(M){let A={};e.cats.forEach(x=>{A[x.name]={count:0}});let p=0,m=W;t.forEach(x=>{x.cat.name===s?(p+=1,m=x.cat.color):A[x.cat.name].count+=1});let l=t.length,c=e.cats.map(x=>{let D=A[x.name];return`<span class="usage-cat"><span class="dot" style="background:${y(x.color)}"></span>${x.name}: ${D.count}</span>`}).join("")+(p>0?`<span class="usage-cat"><span class="dot" style="background:${y(m)}"></span>${s}: ${p}</span>`:"");M.innerHTML=`
        <div class="usage-row">
          <div class="stat-value">${l} time${l===1?"":"s"}</div>
          <div class="usage-cats">${c}</div>
        </div>
      `}let i=this._chartEventHist||[],o=this._eventLabels(),a=(e.event_exclude||m1).map(A=>String(A).toLowerCase()),d=i.map(A=>{let p=A.s??A.state,m=A.lu?A.lu*1e3:A.last_changed?Date.parse(A.last_changed):null;return!p||!m||a.includes(p.toLowerCase())?null:{ts:m,icon:"mdi:information-outline",color:"var(--secondary-text-color)",text:o[p]||p}}).filter(Boolean);d.sort((A,p)=>p.ts-A.ts),L&&(d.length===0?L.innerHTML='<div class="empty-note">No records for this day</div>':L.innerHTML=d.map(A=>`
          <div class="record-row">
            <div class="record-time">${new Date(A.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</div>
            <ha-icon icon="${v(A.icon)}" style="color:${v(A.color)}"></ha-icon>
            <div class="record-text">${v(A.text)}</div>
          </div>
        `).join(""))}_eventLabels(){return{...p1,...this._config.event_labels||{}}}_renderAnalyticsArea(){if(!this._built)return;let C=this.shadowRoot.getElementById("analytics-grid"),H=this.shadowRoot.getElementById("decline-banner"),V=this.shadowRoot.getElementById("no-visit-banner");if(!C||this._loadingAnalytics||!this._analytics)return;let L=this._config,M=(L.decline_threshold_pct||v1)/100,e=[];if(C.innerHTML=L.cats.map(t=>{let i=this._analytics[t.name]||{};return i.daysOfHistory>=3&&i.avg7dTotal&&new Date().getHours()>=18&&(i.todayTotal<M*i.avg7dTotal?e.push(`${t.name}'s usage today is well below their recent average \u2014 worth a check.`):i.todayTotal>(2-M)*i.avg7dTotal&&e.push(`${t.name}'s usage today is well above their recent average \u2014 worth a check.`)),`
        <div class="cat-analytics">
          <table>
            <colgroup>
              <col class="col-name" /><col class="col-stat" /><col class="col-stat" /><col class="col-stat" />
            </colgroup>
            <tr><td class="cat-name-cell"><span class="dot" style="background:${v(y(t.color))}"></span>${v(t.name)}</td><td>Today</td><td>3d avg</td><td>7d avg</td></tr>
            <tr><td>Visits</td><td>${i.todayCount??0}</td><td>${i.avg3dVisits!==null&&i.avg3dVisits!==void 0?i.avg3dVisits.toFixed(1):"\u2014"}</td><td>${i.avg7dVisits!==null&&i.avg7dVisits!==void 0?i.avg7dVisits.toFixed(1):"\u2014"}</td></tr>
            <tr><td>Duration</td><td>${i.todayAvgDuration?g(i.todayAvgDuration):"\u2014"}</td><td>${i.avg3dDuration?g(i.avg3dDuration):"\u2014"}</td><td>${i.avg7dDuration?g(i.avg7dDuration):"\u2014"}</td></tr>
          </table>
        </div>
      `}).join(""),H&&(H.innerHTML=e.length?e.map(t=>`<div class="warn-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${t}</div>`).join(""):""),V){let t=L.cats.filter(i=>this._analytics[i.name]?.noVisitAlert?.alerting);V.innerHTML=t.length?t.map(i=>{let{hoursSince:o}=this._analytics[i.name].noVisitAlert,a=o==null?"no visits recorded yet":`last seen ${K(o)} ago`;return`<div class="no-visit-banner"><ha-icon icon="mdi:cat-alert"></ha-icon>${v(i.name)} hasn't used the litter box recently (${v(a)}).</div>`}).join(""):""}}};var s1="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z";var c1="M21 11H3V9H21V11M21 13H3V15H21V13Z";var h1="M13 5C15.21 5 17 6.79 17 9C17 10.5 16.2 11.77 15 12.46V11.24C15.61 10.69 16 9.89 16 9C16 7.34 14.66 6 13 6S10 7.34 10 9C10 9.89 10.39 10.69 11 11.24V12.46C9.8 11.77 9 10.5 9 9C9 6.79 10.79 5 13 5M20 20.5C19.97 21.32 19.32 21.97 18.5 22H13C12.62 22 12.26 21.85 12 21.57L8 17.37L8.74 16.6C8.93 16.39 9.2 16.28 9.5 16.28H9.7L12 18V9C12 8.45 12.45 8 13 8S14 8.45 14 9V13.47L15.21 13.6L19.15 15.79C19.68 16.03 20 16.56 20 17.14V20.5M20 2H4C2.9 2 2 2.9 2 4V12C2 13.11 2.9 14 4 14H8V12L4 12L4 4H20L20 12H18V14H20V13.96L20.04 14C21.13 14 22 13.09 22 12V4C22 2.9 21.11 2 20 2Z";var O1="M8.35,3C9.53,2.83 10.78,4.12 11.14,5.9C11.5,7.67 10.85,9.25 9.67,9.43C8.5,9.61 7.24,8.32 6.87,6.54C6.5,4.77 7.17,3.19 8.35,3M15.5,3C16.69,3.19 17.35,4.77 17,6.54C16.62,8.32 15.37,9.61 14.19,9.43C13,9.25 12.35,7.67 12.72,5.9C13.08,4.12 14.33,2.83 15.5,3M3,7.6C4.14,7.11 5.69,8 6.5,9.55C7.26,11.13 7,12.79 5.87,13.28C4.74,13.77 3.2,12.89 2.41,11.32C1.62,9.75 1.9,8.08 3,7.6M21,7.6C22.1,8.08 22.38,9.75 21.59,11.32C20.8,12.89 19.26,13.77 18.13,13.28C17,12.79 16.74,11.13 17.5,9.55C18.31,8 19.86,7.11 21,7.6M19.33,18.38C19.37,19.32 18.65,20.36 17.79,20.75C16,21.57 13.88,19.87 11.89,19.87C9.9,19.87 7.76,21.64 6,20.75C5,20.26 4.31,18.96 4.44,17.88C4.62,16.39 6.41,15.59 7.47,14.5C8.88,13.09 9.88,10.44 11.89,10.44C13.89,10.44 14.95,13.05 16.3,14.5C17.41,15.72 19.26,16.75 19.33,18.38Z";var f1="M4,9H20V11H4V9M4,13H14V15H4V13Z";var g1="M3 11H11V3H3M5 5H9V9H5M13 21H21V13H13M15 15H19V19H15M3 21H11V13H3M5 15H9V19H5M13 3V11H21V3M19 9H15V5H19Z";var K1=f1,$1=O1,q1=g1,j1=h1,X1=s1,Y1=c1,J1=[{name:"name",label:"Name",selector:{text:{}}}],C2=[{name:"color",label:"Color",selector:{ui_color:{}}}],H2={name:"My Cat",color:"blue"},V2=[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"name",label:"Name (optional \u2014 overrides the entity's own name)",selector:{text:{}}},{name:"icon",label:"Icon (optional \u2014 overrides the entity's own icon)",selector:{icon:{}}},{name:"unit",label:"Unit",selector:{text:{}}},{name:"warn_below",label:"Warn below",selector:{number:{mode:"box"}}},{name:"warn_above",label:"Warn above",selector:{number:{mode:"box"}}},{name:"warn_state",label:"Warn state",selector:{text:{}}}],L2=[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"name",label:"Name (optional \u2014 overrides the entity's own name)",selector:{text:{}}},{name:"icon",label:"Icon (optional \u2014 overrides the entity's own icon)",selector:{icon:{}}},{name:"tap_action",label:"Tap action",selector:{ui_action:{}}},{name:"hold_action",label:"Hold action",selector:{ui_action:{}}},{name:"double_tap_action",label:"Double-tap action",selector:{ui_action:{}}}],M2=[{name:"device_id",label:"PetKit device",selector:{device:{filter:{integration:"petkit"}}}},{name:"content",type:"expandable",flatten:!0,title:"Content",iconPath:K1,schema:[{name:"title",label:"Title",selector:{text:{}}},{type:"grid",schema:[{name:"show_state",label:"Show state",selector:{boolean:{}}},{name:"show_history",label:"Show history (visit chart)",selector:{boolean:{}}},{name:"show_working_records",label:"Show Working Records",selector:{boolean:{}}},{name:"show_analytics",label:"Show Analytics",selector:{boolean:{}}}]}]},{name:"alerts",type:"expandable",flatten:!0,title:"Analytics & alerts",iconPath:X1,schema:[{name:"decline_threshold_pct",label:"Decline/spike alert threshold (%)",selector:{number:{min:10,max:100,mode:"box"}}},{name:"no_visit_alert_hours",label:"Warn if no visit in (hours)",selector:{number:{min:1,max:168,mode:"box"}}},{name:"notify_service",label:"Push a notification too (optional)",selector:{entity:{domain:"notify"}}}]}],R=class extends HTMLElement{constructor(){super(),this._detailEditor=null}setConfig(C){let H=C||{},V=!this.shadowRoot||this._structureKey(H)!==this._lastStructureKey;this._config=H,V?this._render():this._updateFormsInPlace()}set hass(C){this._hass=C,(this._formEls||[]).forEach(H=>{H.hass=C})}get hass(){return this._hass}connectedCallback(){this._render()}_fireConfigChanged(C){this._config=C,this.dispatchEvent(new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:C}}))}_structureKey(C){return JSON.stringify({cats:(C.cats||[]).length,info_row:(C.info_row||[]).length,controls_row:(C.controls_row||[]).length})}_capturePanelExpanded(){if(!this.shadowRoot)return null;let C=this.shadowRoot.querySelectorAll("ha-expansion-panel");return C.length?Array.from(C).map(H=>H.expanded):null}_restorePanelExpanded(C){if(!C)return;this.shadowRoot.querySelectorAll("ha-expansion-panel").forEach((V,L)=>{C[L]!==void 0&&(V.expanded=C[L])})}_updateFormsInPlace(){if(this._detailEditor){let{kind:L,index:M}=this._detailEditor,e=this._config[L==="info"?"info_row":"controls_row"]||[];this._detailForm&&e[M]&&(this._detailForm.data=e[M]);return}this._mainForm&&(this._mainForm.data=this._mainFormData());let C=this._config.cats||[];(this._catNameForms||[]).forEach((L,M)=>{C[M]&&(L.data=C[M])}),(this._catColorForms||[]).forEach((L,M)=>{C[M]&&(L.data=C[M])});let H=this._config.info_row||[];(this._infoRowRefs||[]).forEach((L,M)=>this._refreshRowRef(L,H[M]));let V=this._config.controls_row||[];(this._controlRowRefs||[]).forEach((L,M)=>this._refreshRowRef(L,V[M]))}_refreshRowRef(C,H){!C||!H||(C.labelEl&&this._fillSummaryLabel(C.labelEl,H),C.iconEl&&(C.iconEl.icon=H.icon||void 0,C.iconEl.stateObj=this._hass&&this._hass.states?this._hass.states[H.entity]:void 0))}_fillSummaryLabel(C,H){C.innerHTML="";let V=document.createElement("div");V.className="summary-label-primary",V.textContent=this._resolvedName(H),C.appendChild(V);let L=this._entityContext(H.entity);if(L){let M=document.createElement("div");M.className="summary-label-secondary",M.textContent=L,C.appendChild(M)}}_resolvedName(C){if(C.name)return C.name;let H=this._hass&&this._hass.states?this._hass.states[C.entity]:null;return H&&H.attributes&&H.attributes.friendly_name||C.entity||""}_entityContext(C){let H=this._hass;if(!H||!C||!H.entities)return null;let V=H.entities[C];if(!V)return null;let L=V.device_id&&H.devices?H.devices[V.device_id]:null,M=V.area_id||L&&L.area_id,e=M&&H.areas?H.areas[M]:null,t=L&&(L.name_by_user||L.name),i=e&&e.name;return i&&t?`${i} \u2192 ${t}`:i||t||null}_render(){this.shadowRoot||this.attachShadow({mode:"open"}),this._config&&(this._formEls=[],this._detailEditor?this._renderDetail():this._renderList())}_renderDetail(){let{kind:C,index:H}=this._detailEditor,V=C==="info"?"info_row":"controls_row",M=(this._config[V]||[])[H];if(!M){this._detailEditor=null,this._renderList();return}let e=C==="info"?V2:L2,t=C==="info"?"Edit status chip":"Edit control";this.shadowRoot.innerHTML=`
      <style>
        .detail-header { display: flex; align-items: center; gap: 8px; padding: 4px 0 12px; }
        .detail-title { font-size: 1.1em; font-weight: 500; color: var(--primary-text-color); }
      </style>
      <div class="detail-header">
        <ha-icon-button-prev></ha-icon-button-prev>
        <span class="detail-title">${t}</span>
      </div>
      <div id="detail-body"></div>
    `,this.shadowRoot.querySelector("ha-icon-button-prev").addEventListener("click",()=>this._closeDetail());let i=document.createElement("ha-form");i.schema=e,i.data=M,i.hass=this._hass,i.computeLabel=o=>o.label||o.name,i.addEventListener("value-changed",o=>{o.stopPropagation(),this._updateRowAt(C,H,o.detail.value)}),this._formEls.push(i),this._detailForm=i,this.shadowRoot.getElementById("detail-body").appendChild(i)}_closeDetail(){this._detailEditor=null,this._render()}_updateRowAt(C,H,V){let L=C==="info"?"info_row":"controls_row",M=[...this._config[L]||[]];M[H]=V,this._fireConfigChanged({...this._config,[L]:M})}_renderList(){let C=this._capturePanelExpanded();this._catNameForms=[],this._catColorForms=[];let H=(this._config.cats||[]).length,V=(this._config.info_row||[]).length,L=(this._config.controls_row||[]).length;this.shadowRoot.innerHTML=`
      <style>
        .editor { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
        /* No border-radius override here -- ha-form's own internal
           "Content"/"Analytics & alerts" expandable groups render their
           own ha-expansion-panel with HA's default corner radius; an
           override on ONLY these editor-owned panels (Cats/Status chips/
           Controls) can't reach inside ha-form's shadow DOM to match it,
           so it's left at the native default everywhere for a consistent
           look across all five sections. */
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
      </style>
      <div class="editor">
        <div id="main-section"></div>

        <ha-expansion-panel outlined>
          <ha-svg-icon slot="leading-icon" id="cats-icon"></ha-svg-icon>
          <h3 slot="header">Cats (${H})</h3>
          <div class="panel-body">
            ${H===0?'<div class="empty-hint">No cats configured yet.</div>':""}
            <div id="cats-rows"></div>
            <div class="add-row">
              <button class="add-btn" id="add-cat" type="button">
                <ha-icon icon="mdi:plus"></ha-icon>Add cat
              </button>
            </div>
          </div>
        </ha-expansion-panel>

        <ha-expansion-panel outlined>
          <ha-svg-icon slot="leading-icon" id="chips-icon"></ha-svg-icon>
          <h3 slot="header">Status chips (${V})</h3>
          <div class="panel-body">
            ${V===0?'<div class="empty-hint">No status chips configured yet.</div>':""}
            <div id="info-rows"></div>
            <div class="add-row-form" id="add-info-row"></div>
          </div>
        </ha-expansion-panel>

        <ha-expansion-panel outlined>
          <ha-svg-icon slot="leading-icon" id="controls-icon"></ha-svg-icon>
          <h3 slot="header">Controls (${L})</h3>
          <div class="panel-body">
            ${L===0?'<div class="empty-hint">No control buttons configured yet.</div>':""}
            <div id="controls-rows"></div>
            <div class="add-row-form" id="add-control-row"></div>
          </div>
        </ha-expansion-panel>
      </div>
    `,this.shadowRoot.getElementById("cats-icon").path=$1,this.shadowRoot.getElementById("chips-icon").path=q1,this.shadowRoot.getElementById("controls-icon").path=j1,this._renderMainForm(),this._renderCats(),this._renderInfoRows(),this._renderControlsRows(),this._renderAddPicker("add-info-row","Add a status chip",M=>this._addInfoRowFromEntity(M)),this._renderAddPicker("add-control-row","Add a control",M=>this._addControlRowFromEntity(M)),this.shadowRoot.getElementById("add-cat").addEventListener("click",()=>this._addCat()),this._restorePanelExpanded(C),this._lastStructureKey=this._structureKey(this._config)}_iconButton(C,H,V,L){let M=document.createElement("ha-icon-button");M.className=V,M.label=H;let e=document.createElement("ha-icon");return e.setAttribute("icon",C),M.appendChild(e),M.addEventListener("click",L),M}_removeIconButton(C){return this._iconButton("mdi:delete-outline","Remove","remove-btn",C)}_editIconButton(C){return this._iconButton("mdi:pencil-outline","Edit","edit-btn",C)}_dragHandle(){let C=document.createElement("div");C.className="handle";let H=document.createElement("ha-svg-icon");return H.path=Y1,C.appendChild(H),C}_createSortableList(C){let H=document.createElement("ha-sortable");H.setAttribute("handle-selector",".handle"),H.addEventListener("item-moved",L=>{L.stopPropagation(),C(L.detail.oldIndex,L.detail.newIndex)});let V=document.createElement("div");return H.appendChild(V),{sortable:H,list:V}}_renderCats(){let C=this.shadowRoot.getElementById("cats-rows");C.innerHTML="";let H=this._config.cats||[],{sortable:V,list:L}=this._createSortableList((M,e)=>this._moveCat(M,e));H.forEach((M,e)=>{let t=document.createElement("div");t.className="cat-item";let i=document.createElement("div");i.className="row",i.appendChild(this._dragHandle());let o=document.createElement("ha-form");o.schema=J1,o.data=M,o.hass=this._hass,o.computeLabel=d=>d.label||d.name,o.addEventListener("value-changed",d=>{d.stopPropagation(),this._updateCat(e,{...this._config.cats[e],...d.detail.value})}),this._formEls.push(o),this._catNameForms.push(o),i.appendChild(o),i.appendChild(this._removeIconButton(()=>this._removeCat(e)));let a=document.createElement("ha-form");a.schema=C2,a.data=M,a.hass=this._hass,a.computeLabel=d=>d.label||d.name,a.addEventListener("value-changed",d=>{d.stopPropagation(),this._updateCat(e,{...this._config.cats[e],...d.detail.value})}),this._formEls.push(a),this._catColorForms.push(a),t.appendChild(i),t.appendChild(a),L.appendChild(t)}),C.appendChild(V)}_updateCat(C,H){let V=[...this._config.cats||[]];V[C]=H,this._fireConfigChanged({...this._config,cats:V})}_moveCat(C,H){let V=(this._config.cats||[]).concat();V.splice(H,0,V.splice(C,1)[0]),this._fireConfigChanged({...this._config,cats:V}),this._render()}_addCat(){let C=[...this._config.cats||[],{...H2}];this._fireConfigChanged({...this._config,cats:C}),this._render()}_removeCat(C){let H=(this._config.cats||[]).filter((V,L)=>L!==C);this._fireConfigChanged({...this._config,cats:H}),this._render()}_renderInfoRows(){let C=this.shadowRoot.getElementById("info-rows");C.innerHTML="",this._infoRowRefs=[];let H=this._config.info_row||[],{sortable:V,list:L}=this._createSortableList((M,e)=>this._moveInfoRow(M,e));H.forEach((M,e)=>{let{el:t,ref:i}=this._buildSummaryRow({spec:M,onEdit:()=>this._openDetail("info",e),onRemove:()=>this._removeInfoRow(e)});this._infoRowRefs[e]=i,L.appendChild(t)}),C.appendChild(V)}_openDetail(C,H){this._detailEditor={kind:C,index:H},this._render()}_addInfoRowFromEntity(C){let H=[...this._config.info_row||[],{entity:C}];this._fireConfigChanged({...this._config,info_row:H}),this._render()}_moveInfoRow(C,H){let V=(this._config.info_row||[]).concat();V.splice(H,0,V.splice(C,1)[0]),this._fireConfigChanged({...this._config,info_row:V}),this._render()}_removeInfoRow(C){let H=(this._config.info_row||[]).filter((V,L)=>L!==C);this._fireConfigChanged({...this._config,info_row:H}),this._render()}_renderControlsRows(){let C=this.shadowRoot.getElementById("controls-rows");C.innerHTML="",this._controlRowRefs=[];let H=this._config.controls_row||[],{sortable:V,list:L}=this._createSortableList((M,e)=>this._moveControlRow(M,e));H.forEach((M,e)=>{let{el:t,ref:i}=this._buildSummaryRow({spec:M,onEdit:()=>this._openDetail("control",e),onRemove:()=>this._removeControlRow(e)});this._controlRowRefs[e]=i,L.appendChild(t)}),C.appendChild(V)}_addControlRowFromEntity(C){let H=[...this._config.controls_row||[],{entity:C}];this._fireConfigChanged({...this._config,controls_row:H}),this._render()}_moveControlRow(C,H){let V=(this._config.controls_row||[]).concat();V.splice(H,0,V.splice(C,1)[0]),this._fireConfigChanged({...this._config,controls_row:V}),this._render()}_removeControlRow(C){let H=(this._config.controls_row||[]).filter((V,L)=>L!==C);this._fireConfigChanged({...this._config,controls_row:H}),this._render()}_buildSummaryRow({spec:C,onEdit:H,onRemove:V}){let L=document.createElement("div");L.className="row summary-row",L.appendChild(this._dragHandle());let M=document.createElement("ha-state-icon");M.icon=C.icon||void 0,M.stateObj=this._hass&&this._hass.states?this._hass.states[C.entity]:void 0;let e=document.createElement("div");return e.className="summary-label",this._fillSummaryLabel(e,C),L.appendChild(M),L.appendChild(e),L.appendChild(this._editIconButton(H)),L.appendChild(this._removeIconButton(V)),{el:L,ref:{iconEl:M,labelEl:e}}}_renderAddPicker(C,H,V){let L=this.shadowRoot.getElementById(C),M=document.createElement("ha-form");M.schema=[{name:"entity",label:H,selector:{entity:{}}}],M.data={},M.hass=this._hass,M.computeLabel=e=>e.label||e.name,M.addEventListener("value-changed",e=>{e.stopPropagation();let t=e.detail.value.entity;t&&V(t)}),this._formEls.push(M),L.appendChild(M)}_mainFormData(){let C=this._config;return{...C,show_state:C.show_state!==!1,show_history:C.show_history!==!1,show_working_records:C.show_working_records!==!1,show_analytics:C.show_analytics!==!1}}_renderMainForm(){let C=this.shadowRoot.getElementById("main-section"),H=document.createElement("ha-form");H.schema=M2,H.data=this._mainFormData(),H.hass=this._hass,H.computeLabel=V=>V.label||V.name,H.addEventListener("value-changed",V=>{V.stopPropagation(),this._fireConfigChanged(V.detail.value)}),this._formEls.push(H),this._mainForm=H,C.appendChild(H)}};customElements.get("petkit-puramax-card")||customElements.define("petkit-puramax-card",F);customElements.get("petkit-puramax-card-editor")||customElements.define("petkit-puramax-card-editor",R);var I=window;I.customCards=I.customCards||[];I.customCards.push({type:"petkit-puramax-card",name:"PETKIT PURAMAX Card",description:"Configurable card for PETKIT PURAMAX litter box monitoring, controls, and per-cat visit analytics."});
//# sourceMappingURL=petkit-puramax-card.js.map
