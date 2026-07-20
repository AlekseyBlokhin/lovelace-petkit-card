function C(a){let t=Math.round(a||0);if(t<60)return`${t}s`;let e=Math.floor(t/60),o=t%60;return`${e}m${o.toString().padStart(2,"0")}s`}function M(a){let t=Math.round(a||0),e=Math.floor(t/60),o=t%60;return`${e.toString().padStart(2,"0")}'${o.toString().padStart(2,"0")}"`}function V(a){let t=Math.floor(a);return t<1?"under 1h":t<48?`${t}h`:`${Math.floor(t/24)}d`}function _(a){return String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function A(a,t=new Date){let e=new Date(t.getFullYear(),t.getMonth(),t.getDate());e.setDate(e.getDate()+a);let o=new Date(e);return o.setDate(o.getDate()+1),{start:e,end:o}}function U(a,t=new Date){if(a===0)return"Today";if(a===-1)return"Yesterday";let{start:e}=A(a,t);return e.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"})}function N(a){let t=new Date(a);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`}function T({startTime:a,endTime:t,entityIds:e,includeStartTimeState:o=!1}){let s=a instanceof Date?a.toISOString():a,n=t instanceof Date?t.toISOString():t;return{type:"history/history_during_period",start_time:s,end_time:n,entity_ids:e,minimal_response:!1,no_attributes:!0,include_start_time_state:o}}function Et(a){if(!a)return null;let t=a.s??a.state,e=parseFloat(t),o=a.lu?a.lu*1e3:a.last_changed?Date.parse(a.last_changed):null;return!Number.isFinite(e)||!o||Number.isNaN(o)?null:{value:e,ts:o}}function z(a,{minDelta:t=0,maxDelta:e=1/0}={}){if(!Array.isArray(a))return[];let o=a.map(Et).filter(Boolean).sort((n,i)=>n.ts-i.ts),s=[];for(let n=1;n<o.length;n++){let i=o[n].value-o[n-1].value;if(i<=t||i>=e)continue;let r=o[n+1];r&&r.value===o[n-1].value||s.push({value:i,ts:o[n].ts})}return s}var Ct="unknown_pet",w="Unknown";function P(a,t){if(!Array.isArray(a))return[];let e=new Set(t),o=[];for(let s of a){let n=s.s??s.state,i;if(e.has(n))i=n;else if(n===Ct)i=w;else continue;let r=s.lu?s.lu*1e3:s.last_changed?Date.parse(s.last_changed):null;!r||Number.isNaN(r)||o.push({cat:i,ts:r})}return o.sort((s,n)=>s.ts-n.ts),o}function W(a,t){let e=a.length,o=new Array(e).fill(null),s=0,n=null;for(let i=0;i<e;i++){let r=a[i].ts,c=i===0?-1/0:(a[i-1].ts+r)/2,h=i===e-1?1/0:(r+a[i+1].ts)/2;for(;s<t.length&&t[s].ts<c;)n=t[s].cat,s++;let d=null,m=1/0;for(;s<t.length&&t[s].ts<h;){let u=Math.abs(t[s].ts-r);u<m&&(m=u,d=t[s].cat),n=t[s].cat,s++}o[i]=d!==null?d:n}return a.map((i,r)=>({...i,cat:o[r]}))}var kt=[10,15,30,60,120,180,300,600,900,1800,3600];function j(a){for(let t of kt)if(a/t<=5)return t;return Math.ceil(a/5/60)*60}function K({dayStart:a,niceMax:t,width:e,height:o,padding:s}){let{left:n,right:i,top:r,bottom:c}=s,h=e-n-i,d=o-r-c,m=a.getTime();return{xFor:g=>{let D=(g-m)/36e5;return n+D/24*h},yFor:g=>t?o-c-g/t*d:o-c}}function q({niceMax:a,yStep:t,width:e,height:o,padding:s}){let{left:n,right:i,top:r,bottom:c}=s,h=e-n-i,d=o-r-c,m=[4,8,12,16,20].map(p=>({hour:p,x:n+p/24*h,label:`${p.toString().padStart(2,"0")}:00`})),u=[];if(t>0)for(let p=0;p<=a;p+=t){let g=a?o-c-p/a*d:o-c;u.push({value:p,y:g,label:M(p)})}return{vertical:m,horizontal:u}}function G(a,{dayKeyFn:t}){let e={};for(let o of a||[]){let s=t(o.ts);e[s]||(e[s]={count:0,total:0}),e[s].count+=1,e[s].total+=o.value}return e}function X(a,t){let e=Object.keys(a).filter(d=>d!==t).sort(),o=e.slice(-3),s=e.slice(-7),n=(d,m)=>d.length?d.reduce((u,p)=>u+a[p][m],0)/d.length:null,i=d=>{if(!d.length)return null;let m=d.reduce((p,g)=>p+a[g].total,0),u=d.reduce((p,g)=>p+a[g].count,0);return u>0?m/u:null},r=a[t],c=r?r.count:0,h=r?r.total:0;return{todayCount:c,todayTotal:h,todayAvgDuration:c>0?h/c:null,avg3dVisits:n(o,"count"),avg3dTotal:n(o,"total"),avg3dDuration:i(o),avg7dVisits:n(s,"count"),avg7dTotal:n(s,"total"),avg7dDuration:i(s),daysOfHistory:e.length}}function Y({lastVisitTs:a,now:t,thresholdHours:e}){let o=t instanceof Date?t.getTime():t;if(a==null)return{alerting:!0,hoursSince:null};let s=(o-a)/36e5;return{alerting:s>=e,hoursSince:s}}function J(a,t){let e=t;a.value_map&&t in a.value_map?e=a.value_map[t]:t!==null&&a.unit&&(e=`${t}${a.unit}`),e==null&&(e="\u2014");let o=parseFloat(t),s=!1;return a.warn_below!==void 0&&Number.isFinite(o)&&(s=o<a.warn_below),a.warn_above!==void 0&&Number.isFinite(o)&&(s=s||o>a.warn_above),a.warn_state!==void 0&&(s=s||t===a.warn_state),{display:e,warn:s}}function Q(a,t,e){return!t||!a||!a.states||!a.states[t]?e:a.states[t].state}function I(a,t){let e=new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}});a.dispatchEvent(e)}function L(a,t,e,o){a.callService(t,e,o)}function k(a,t){t&&L(a,"button","press",{entity_id:t})}var At={total_use:["total_use","total_time"],last_used_by:["last_used_by"],error:["error","error_message"],last_event:["max_last_event","litter_last_event"],state:["max_work_state","litter_state"]};function Z(a,t){let e={};if(!t||!a||!a.entities)return e;let o=Object.values(a.entities).filter(s=>s.device_id===t&&s.entity_id.startsWith("sensor."));for(let[s,n]of Object.entries(At)){let i=o.find(r=>n.includes(r.translation_key));i&&(e[s]=i.entity_id)}return e}var tt=`
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
`;var et={maintenance_mode:"Maintenance mode",manual_odor_completed:"Manual odor removal done",auto_cleaning_completed:"Auto cleaning done"},ot=["unavailable","unknown","no_events_yet"],H="#9e9e9e",st="PETKIT PURAMAX",nt=60,it=8,at=1800,rt=600,ct=240,lt={left:46,right:10,top:10,bottom:28};var S=class extends HTMLElement{static getConfigElement(){return document.createElement("petkit-puramax-card-editor")}static getStubConfig(){return{type:"custom:petkit-puramax-card",title:"PETKIT PURAMAX",device_entities:{error:"sensor.example_petkit_error",last_event:"sensor.example_petkit_last_event",state:"sensor.example_petkit_state",total_use:"sensor.example_petkit_total_use"},cats:[{name:"Example Cat",color:"#4fc3f7"}]}}setConfig(t){if(!t)throw new Error("petkit-puramax-card: config is required");if(!t.device_id&&!t.device_entities)throw new Error('petkit-puramax-card: "device_entities" is required in config (or set "device_id")');let e=t.device_entities||{};if(!t.device_id&&!e.total_use)throw new Error('petkit-puramax-card: "device_entities.total_use" is required in config (or set "device_id")');if(!t.cats)throw new Error('petkit-puramax-card: "cats" is required in config');if(!Array.isArray(t.cats)||t.cats.length<1)throw new Error('petkit-puramax-card: "cats" must be a non-empty array');if(!t.device_id&&t.cats.length>1&&!e.last_used_by)throw new Error('petkit-puramax-card: "device_entities.last_used_by" is required in config when more than one cat is configured (or set "device_id")');t.cats.forEach((o,s)=>{if(!o||!o.name)throw new Error(`petkit-puramax-card: cats[${s}].name is required`);if(!o.color)throw new Error(`petkit-puramax-card: cats[${s}].color is required`)}),this._config={...t,device_entities:e},this._dayOffset=0,this._analytics=null,this._chartData=null,this._loadingChart=!1,this._loadingAnalytics=!1,this._deviceEntities=this._resolveDeviceEntities(),this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}_resolveDeviceEntities(){return{...Z(this._hass,this._config.device_id),...this._config.device_entities}}_configError(){return this._config.device_id?this._deviceEntities.total_use?this._config.cats.length>1&&!this._deviceEntities.last_used_by?'Could not auto-detect a "last used by" sensor on the selected device (required for more than one cat). Set "device_entities.last_used_by" in the config to override.':null:'Could not auto-detect a "total use" sensor on the selected device. Set "device_entities.total_use" in the config to override.':null}_renderError(t){this.shadowRoot||this.attachShadow({mode:"open"}),this.shadowRoot.innerHTML=`<ha-card><div style="padding: 16px;"><ha-alert alert-type="error">${_(t)}</ha-alert></div></ha-card>`}set hass(t){let e=this._hass;if(this._hass=t,this._deviceEntities=this._resolveDeviceEntities(),!this._built){this._built=!0,this._build();return}this._updateLiveValues(),this._maybeRefreshOnNewVisit(e)}get hass(){return this._hass}getCardSize(){return 14}_build(){let t=this._configError();if(t){this._renderError(t);return}this._render(),this._loadDay(),this._loadAnalytics(),this._startNoVisitTimer()}connectedCallback(){this._hass&&!this._built&&(this._built=!0,this._build())}disconnectedCallback(){this._noVisitTimer&&(clearInterval(this._noVisitTimer),this._noVisitTimer=null)}_startNoVisitTimer(){this._noVisitTimer||(this._noVisitTimer=setInterval(()=>this._checkNoVisitAlerts(),300*1e3))}_maybeRefreshOnNewVisit(t){if(!t)return;let e=this._deviceEntities.total_use,o=t.states[e],s=this._hass.states[e];s&&(!o||o.last_changed!==s.last_changed)&&(this._dayOffset===0&&this._loadDay(),this._loadAnalytics())}_s(t,e){return Q(this._hass,t,e)}async _fetchVisits({start:t,end:e}){let o=this._config,s=this._deviceEntities,n=T({startTime:t,endTime:e,entityIds:[s.total_use]}),i=[this._hass.callWS(n)];if(o.cats.length>1){let u=T({startTime:t,endTime:e,entityIds:[s.last_used_by],includeStartTimeState:!0});i.push(this._hass.callWS(u))}let r={},c={};try{let[u,p]=await Promise.all(i);r=u||{},c=p||{}}catch{}let h=z(r[s.total_use],{minDelta:0,maxDelta:at}),d;if(o.cats.length>1){let u=o.cats.map(g=>g.name),p=P(c[s.last_used_by],u);d=W(h,p)}else d=h.map(u=>({...u,cat:o.cats[0].name}));let m=new Map(o.cats.map(u=>[u.name,u]));return d.map(u=>({cat:u.cat===w?this._unknownCat():m.get(u.cat)||null,duration:u.value,ts:u.ts}))}_unknownCat(){return{name:w,color:this._config.unknown_cat_color||H}}async _loadDay(){if(!this._hass)return;this._loadingChart=!0,this._renderChartArea();let t=this._deviceEntities,{start:e,end:o}=A(this._dayOffset),s=[],n=[];try{let[i,r]=await Promise.all([this._fetchVisits({start:e,end:o}),t.last_event?this._hass.callWS(T({startTime:e,endTime:o,entityIds:[t.last_event]})):Promise.resolve({})]);s=i,n=(r||{})[t.last_event]||[]}catch{s=[],n=[]}this._chartVisits=s,this._chartEventHist=n,this._loadingChart=!1,this._renderChartArea()}async _loadAnalytics(){if(!this._hass)return;this._loadingAnalytics=!0,this._renderAnalyticsArea();let t=this._config,e=new Date,o=new Date(e.getTime()-168*3600*1e3),s=[];try{s=await this._fetchVisits({start:o,end:e})}catch{s=[]}let n=N(e.getTime()),i={};t.cats.forEach(r=>{let c=s.filter(m=>m.cat===r).map(m=>({value:m.duration,ts:m.ts})),h=G(c,{dayKeyFn:N}),d=c.length?Math.max(...c.map(m=>m.ts)):null;i[r.name]={...X(h,n),lastVisitTs:d}}),this._analytics=i,this._loadingAnalytics=!1,this._checkNoVisitAlerts(),this._renderAnalyticsArea()}_checkNoVisitAlerts(){if(!this._analytics||!this._built)return;let t=this._config,e=t.no_visit_alert_hours??it,o=Date.now();this._notifiedCats||(this._notifiedCats=new Set),t.cats.forEach(s=>{let n=this._analytics[s.name];if(!n)return;let i=Y({lastVisitTs:n.lastVisitTs,now:o,thresholdHours:e});n.noVisitAlert=i;let r=this._notifiedCats.has(s.name);i.alerting&&!r?(this._notifiedCats.add(s.name),this._sendNoVisitNotification(s,i)):!i.alerting&&r&&this._notifiedCats.delete(s.name)}),this._renderAnalyticsArea()}_sendNoVisitNotification(t,e){let o=this._config.notify_service;if(!o||!this._hass)return;let s=o.indexOf(".");if(s===-1)return;let n=o.slice(0,s),i=o.slice(s+1);if(n!=="notify"||!i)return;let r=e.hoursSince==null?`${t.name} hasn't used the litter box yet in the tracked history.`:`${t.name} hasn't used the litter box in over ${Math.floor(e.hoursSince)}h.`;L(this._hass,"notify",i,{message:r,title:"Litter box alert"})}_render(){let t=this._config;this.shadowRoot.innerHTML=`
      <style>${tt}</style>
      <ha-card>
        <div class="header">
          <div class="title">${t.title||st}</div>
        </div>
        <div class="status-row" id="status-row"></div>
        <div class="controls-row" id="controls-row"></div>
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
        </div>
        <div class="analytics-section">
          <div class="section-title">Analytics</div>
          <div id="no-visit-banner"></div>
          <div id="decline-banner"></div>
          <div class="analytics-grid" id="analytics-grid"></div>
        </div>
        <div class="records-section">
          <div class="section-title">Working Records</div>
          <div class="records-list" id="records-list"></div>
        </div>
      </ha-card>
    `,this.shadowRoot.getElementById("prev-day").addEventListener("click",()=>this._changeDay(-1)),this.shadowRoot.getElementById("next-day").addEventListener("click",()=>this._changeDay(1)),this._updateLiveValues(),this._renderChartArea(),this._renderAnalyticsArea()}_changeDay(t){this._dayOffset+=t,this._dayOffset>0&&(this._dayOffset=0),this._loadDay()}_updateLiveValues(){if(!this._built)return;let t=this._config,e=this._deviceEntities,o=this.shadowRoot.getElementById("status-row");if(o){let n=this._s(e.error,"no_error"),i=n&&n!=="no_error",r=t.info_row||[];if(o.innerHTML=[...r.map(c=>this._renderInfoChip(c)),i?this._chip("mdi:alert","Error",n.replace(/_/g," "),!0,e.error):""].join(""),!o.dataset.bound){o.dataset.bound="1";let c=h=>{let d=h.target.closest(".chip[data-entity]");d&&I(this,d.dataset.entity)};o.addEventListener("click",c),o.addEventListener("keydown",h=>{(h.key==="Enter"||h.key===" ")&&(h.preventDefault(),c(h))})}}let s=this.shadowRoot.getElementById("controls-row");if(s&&!s.dataset.bound){let n=t.controls_row||[];s.innerHTML=n.map((i,r)=>`
      <ha-control-button class="ctrl-btn" id="ctrl-${r}" label="${_(i.name||"")}">
        <div class="ctrl-btn-content">
          <ha-icon icon="${_(i.icon||"mdi:help")}"></ha-icon>
          <span>${_(i.name||"")}</span>
        </div>
      </ha-control-button>
    `).join(""),s.dataset.bound="1",n.forEach((i,r)=>{this.shadowRoot.getElementById(`ctrl-${r}`).addEventListener("click",()=>this._runControlAction(i))})}}_renderInfoChip(t){let e=this._s(t.entity,null),{display:o,warn:s}=J(t,e);return this._chip(t.icon||"mdi:information-outline",t.name||t.entity,o,s,t.entity)}_runControlAction(t){switch(t.action){case"press":{t.confirm?window.confirm(t.confirm)&&k(this._hass,t.entity):k(this._hass,t.entity);break}case"toggle_maintenance":{let e=t.state_entity||this._deviceEntities.state;this._s(e,"")==="maintenance"?k(this._hass,t.exit_entity):k(this._hass,t.start_entity);break}case"toggle":{L(this._hass,"homeassistant","toggle",{entity_id:t.entity});break}case"more_info":{I(this,t.entity);break}default:break}}_chip(t,e,o,s,n){let i=n?` data-entity="${_(n)}" tabindex="0"`:"";return`
      <div class="chip ${s?"warn":""} ${n?"tappable":""}"${i}>
        <ha-icon icon="${_(t)}"></ha-icon>
        <div class="chip-text"><div class="chip-label">${_(e)}</div><div class="chip-value">${_(o)}</div></div>
      </div>`}_renderChartArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("day-label");t&&(t.textContent=U(this._dayOffset));let e=this.shadowRoot.getElementById("next-day");e&&(e.disabled=this._dayOffset>=0);let o=this.shadowRoot.getElementById("chart-area"),s=this.shadowRoot.getElementById("records-list"),n=this.shadowRoot.getElementById("usage-body");if(!o||this._loadingChart)return;let i=this._config,r=(this._chartVisits||[]).filter(l=>l.cat).sort((l,f)=>l.ts-f.ts),c=rt,h=ct,d=lt,m=Math.max(60,...r.map(l=>l.duration)),u=j(m),p=Math.ceil(m/u)*u,{start:g}=A(this._dayOffset),{xFor:D,yFor:dt}=K({dayStart:g,niceMax:p,width:c,height:h,padding:d}),{vertical:B,horizontal:F}=q({niceMax:p,yStep:u,width:c,height:h,padding:d}),ht=B.map(l=>`<line x1="${l.x}" y1="${d.top}" x2="${l.x}" y2="${h-d.bottom}" class="grid-line-v" />`).join(""),ut=F.map(l=>`<line x1="${d.left}" y1="${l.y}" x2="${c-d.right}" y2="${l.y}" class="grid-line-h" />`).join(""),pt=(h-d.bottom)/h*100,mt=B.map(l=>`<div class="axis-label" style="left:${l.x/c*100}%;top:${pt}%">${l.label}</div>`).join(""),ft=d.left/c*100,_t=F.map(l=>`<div class="axis-label-y" style="top:${l.y/h*100}%;width:${ft}%">${l.label}</div>`).join(""),gt=r.map((l,f)=>{let v=D(l.ts),y=dt(l.duration),x=h-d.bottom;return`<line x1="${v}" y1="${x}" x2="${v}" y2="${y}" stroke="${l.cat.color}" stroke-width="2" />
              <circle class="visit-point" cx="${v}" cy="${y}" r="5" fill="${l.cat.color}" />
              <line class="visit-hit" data-idx="${f}" x1="${v}" y1="${x}" x2="${v}" y2="${y}" stroke="transparent" stroke-width="16" />`}).join("");o.innerHTML=`
      <div class="chart-wrap">
        <svg viewBox="0 0 ${c} ${h}" class="chart-svg">
          ${ut}
          ${ht}
          ${gt||""}
        </svg>
        ${mt}
        ${_t}
        <div class="chart-tooltip" id="chart-tooltip"></div>
      </div>
      ${r.length===0?'<div class="empty-note">No visits recorded this day</div>':""}
    `;let E=this.shadowRoot.getElementById("chart-tooltip"),vt=o.querySelector(".chart-wrap");if(o.querySelectorAll(".visit-hit").forEach(l=>{l.addEventListener("mouseenter",()=>{let f=r[parseInt(l.dataset.idx,10)],v=new Date(f.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"});E.textContent=`${v} \xB7 ${f.cat.name} \xB7 ${C(f.duration)}`;let y=l.getBoundingClientRect(),x=vt.getBoundingClientRect();E.style.left=`${y.left-x.left+y.width/2}px`,E.style.top=`${y.top-x.top}px`,E.classList.add("visible")}),l.addEventListener("mouseleave",()=>{E.classList.remove("visible")})}),n){let l={};i.cats.forEach(b=>{l[b.name]={count:0}});let f=0,v=H;r.forEach(b=>{b.cat.name===w?(f+=1,v=b.cat.color):l[b.cat.name].count+=1});let y=r.length,x=i.cats.map(b=>{let wt=l[b.name];return`<span class="usage-cat"><span class="dot" style="background:${b.color}"></span>${b.name}: ${wt.count}</span>`}).join("")+(f>0?`<span class="usage-cat"><span class="dot" style="background:${v}"></span>${w}: ${f}</span>`:"");n.innerHTML=`
        <div class="usage-row">
          <div class="stat-value">${y} time${y===1?"":"s"}</div>
          <div class="usage-cats">${x}</div>
        </div>
      `}let yt=this._chartEventHist||[],bt=this._eventLabels(),xt=(i.event_exclude||ot).map(l=>String(l).toLowerCase()),$=yt.map(l=>{let f=l.s??l.state,v=l.lu?l.lu*1e3:l.last_changed?Date.parse(l.last_changed):null;return!f||!v||xt.includes(f.toLowerCase())?null:{ts:v,icon:"mdi:information-outline",color:"var(--secondary-text-color)",text:bt[f]||f}}).filter(Boolean);$.sort((l,f)=>f.ts-l.ts),s&&($.length===0?s.innerHTML='<div class="empty-note">No records for this day</div>':s.innerHTML=$.map(l=>`
          <div class="record-row">
            <div class="record-time">${new Date(l.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</div>
            <ha-icon icon="${_(l.icon)}" style="color:${_(l.color)}"></ha-icon>
            <div class="record-text">${_(l.text)}</div>
          </div>
        `).join(""))}_eventLabels(){return{...et,...this._config.event_labels||{}}}_renderAnalyticsArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("analytics-grid"),e=this.shadowRoot.getElementById("decline-banner"),o=this.shadowRoot.getElementById("no-visit-banner");if(!t||this._loadingAnalytics||!this._analytics)return;let s=this._config,n=(s.decline_threshold_pct||nt)/100,i=[];if(t.innerHTML=s.cats.map(r=>{let c=this._analytics[r.name]||{};return c.daysOfHistory>=3&&c.avg7dTotal&&new Date().getHours()>=18&&(c.todayTotal<n*c.avg7dTotal?i.push(`${r.name}'s usage today is well below their recent average \u2014 worth a check.`):c.todayTotal>(2-n)*c.avg7dTotal&&i.push(`${r.name}'s usage today is well above their recent average \u2014 worth a check.`)),`
        <div class="cat-analytics">
          <table>
            <colgroup>
              <col class="col-name" /><col class="col-stat" /><col class="col-stat" /><col class="col-stat" />
            </colgroup>
            <tr><td class="cat-name-cell"><span class="dot" style="background:${_(r.color)}"></span>${_(r.name)}</td><td>Today</td><td>3d avg</td><td>7d avg</td></tr>
            <tr><td>Visits</td><td>${c.todayCount??0}</td><td>${c.avg3dVisits!==null&&c.avg3dVisits!==void 0?c.avg3dVisits.toFixed(1):"\u2014"}</td><td>${c.avg7dVisits!==null&&c.avg7dVisits!==void 0?c.avg7dVisits.toFixed(1):"\u2014"}</td></tr>
            <tr><td>Duration</td><td>${c.todayAvgDuration?C(c.todayAvgDuration):"\u2014"}</td><td>${c.avg3dDuration?C(c.avg3dDuration):"\u2014"}</td><td>${c.avg7dDuration?C(c.avg7dDuration):"\u2014"}</td></tr>
          </table>
        </div>
      `}).join(""),e&&(e.innerHTML=i.length?i.map(r=>`<div class="warn-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${r}</div>`).join(""):""),o){let r=s.cats.filter(c=>this._analytics[c.name]?.noVisitAlert?.alerting);o.innerHTML=r.length?r.map(c=>{let{hoursSince:h}=this._analytics[c.name].noVisitAlert,d=h==null?"no visits recorded yet":`last seen ${V(h)} ago`;return`<div class="no-visit-banner"><ha-icon icon="mdi:cat-alert"></ha-icon>${_(c.name)} hasn't used the litter box recently (${_(d)}).</div>`}).join(""):""}}};var Tt=[{type:"grid",schema:[{name:"name",label:"Name",selector:{text:{}}},{name:"color",label:"Color",selector:{ui_color:{}}}]}],Lt={name:"",color:"#4fc3f7"},St=[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"unit",label:"Unit",selector:{text:{}}},{name:"warn_below",label:"Warn below",selector:{number:{mode:"box"}}},{name:"warn_above",label:"Warn above",selector:{number:{mode:"box"}}},{name:"warn_state",label:"Warn state",selector:{text:{}}}],Rt={entity:"",name:"",icon:"mdi:information-outline"},Dt=["press","toggle_maintenance","toggle","more_info"],$t=[{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"action",label:"Action",selector:{select:{options:Dt,mode:"dropdown"}}}],Nt={press:[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"confirm",label:"Confirm text (optional)",selector:{text:{}}}],toggle:[{name:"entity",label:"Entity",selector:{entity:{}}}],more_info:[{name:"entity",label:"Entity",selector:{entity:{}}}],toggle_maintenance:[{name:"start_entity",label:"Start entity",selector:{entity:{domain:"button"}}},{name:"exit_entity",label:"Exit entity",selector:{entity:{domain:"button"}}},{name:"state_entity",label:"State entity (optional)",selector:{entity:{}}}]};function It(a){return[...$t,...Nt[a]||[]]}var Ht={name:"",icon:"mdi:gesture-tap-button",action:"press",entity:""},Ot=[{name:"device_id",label:"PetKit device (auto-detects the sensors below)",selector:{device:{filter:{integration:"petkit"}}}},{name:"title",label:"Title",selector:{text:{}}},{name:"device_entities",type:"expandable",title:"Device entities (overrides)",schema:[{name:"total_use",label:"Total use sensor (required unless a device is selected above)",selector:{entity:{}}},{name:"last_used_by",label:"Last used by sensor (required if more than one cat, unless auto-detected)",selector:{entity:{}}},{name:"error",label:"Error sensor (auto-detected, or override)",selector:{entity:{}}},{name:"last_event",label:"Last event sensor (auto-detected, or override)",selector:{entity:{}}},{name:"state",label:"State sensor (auto-detected, or override)",selector:{entity:{}}}]},{name:"alerts",type:"expandable",flatten:!0,title:"Analytics & alerts",schema:[{name:"decline_threshold_pct",label:"Decline/spike alert threshold (%)",selector:{number:{min:10,max:100,mode:"box"}}},{name:"no_visit_alert_hours",label:"Warn if no visit in (hours)",selector:{number:{min:1,max:168,mode:"box"}}},{name:"notify_service",label:"Push a notification too (optional)",selector:{entity:{domain:"notify"}}},{name:"unknown_cat_color",label:"Unidentified-visit color (chart & analytics)",selector:{ui_color:{}}}]}],R=class extends HTMLElement{setConfig(t){let e=t||{},o=!this.shadowRoot||this._structureKey(e)!==this._lastStructureKey;this._config=e,o?this._render():this._updateFormsInPlace()}set hass(t){this._hass=t,(this._formEls||[]).forEach(e=>{e.hass=t})}get hass(){return this._hass}connectedCallback(){this._render()}_fireConfigChanged(t){this._config=t,this.dispatchEvent(new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:t}}))}_structureKey(t){return JSON.stringify({cats:(t.cats||[]).length,info_row:(t.info_row||[]).length,controls_row:(t.controls_row||[]).map(e=>e&&e.action||null)})}_capturePanelExpanded(){if(!this.shadowRoot)return null;let t=this.shadowRoot.querySelectorAll("ha-expansion-panel");return t.length?Array.from(t).map(e=>e.expanded):null}_restorePanelExpanded(t){if(!t)return;this.shadowRoot.querySelectorAll("ha-expansion-panel").forEach((o,s)=>{t[s]!==void 0&&(o.expanded=t[s])})}_updateFormsInPlace(){this._mainForm&&(this._mainForm.data=this._config);let t=this._config.cats||[];(this._catForms||[]).forEach((s,n)=>{t[n]&&(s.data=t[n])});let e=this._config.info_row||[];(this._infoForms||[]).forEach((s,n)=>{e[n]&&(s.data=e[n])});let o=this._config.controls_row||[];(this._controlForms||[]).forEach((s,n)=>{o[n]&&(s.data=o[n])})}_render(){if(this.shadowRoot||this.attachShadow({mode:"open"}),!this._config)return;let t=this._capturePanelExpanded();this._formEls=[],this._catForms=[],this._infoForms=[],this._controlForms=[];let e=(this._config.cats||[]).length,o=(this._config.info_row||[]).length,s=(this._config.controls_row||[]).length;this.shadowRoot.innerHTML=`
      <style>
        .editor { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
        ha-expansion-panel { --expansion-panel-summary-padding: 0 16px; border-radius: var(--ha-card-border-radius, 12px); }
        .panel-body { display: flex; flex-direction: column; gap: 4px; padding: 4px 16px 16px; }
        .row { display: flex; align-items: center; gap: 4px; }
        .row ha-form { flex: 1 1 auto; min-width: 0; }
        .add-row { display: flex; justify-content: flex-start; margin-top: 4px; }
        .add-btn {
          display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
          border: 1px solid var(--divider-color, #ccc); border-radius: 8px;
          background: none; color: var(--primary-color); padding: 8px 14px;
          font-size: 0.85em; font-weight: 500; font-family: inherit;
        }
        .add-btn:hover { background: rgba(var(--rgb-primary-color, 3,169,244), 0.08); }
        .add-btn:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
        .empty-hint { color: var(--secondary-text-color); font-size: 0.85em; padding: 4px 0 8px; }
      </style>
      <div class="editor">
        <div id="main-section"></div>

        <ha-expansion-panel outlined header="Cats (${e})">
          <div class="panel-body">
            ${e===0?'<div class="empty-hint">No cats configured yet.</div>':""}
            <div id="cats-rows"></div>
            <div class="add-row">
              <button class="add-btn" id="add-cat" type="button">
                <ha-icon icon="mdi:plus"></ha-icon>Add cat
              </button>
            </div>
          </div>
        </ha-expansion-panel>

        <ha-expansion-panel outlined header="Status chips (${o})">
          <div class="panel-body">
            ${o===0?'<div class="empty-hint">No status chips configured yet.</div>':""}
            <div id="info-rows"></div>
            <div class="add-row">
              <button class="add-btn" id="add-info-row" type="button">
                <ha-icon icon="mdi:plus"></ha-icon>Add chip
              </button>
            </div>
          </div>
        </ha-expansion-panel>

        <ha-expansion-panel outlined header="Controls (${s})">
          <div class="panel-body">
            ${s===0?'<div class="empty-hint">No control buttons configured yet.</div>':""}
            <div id="controls-rows"></div>
            <div class="add-row">
              <button class="add-btn" id="add-control-row" type="button">
                <ha-icon icon="mdi:plus"></ha-icon>Add control
              </button>
            </div>
          </div>
        </ha-expansion-panel>
      </div>
    `,this._renderMainForm(),this._renderCats(),this._renderInfoRows(),this._renderControlsRows(),this._restorePanelExpanded(t),this._lastStructureKey=this._structureKey(this._config),this.shadowRoot.getElementById("add-cat").addEventListener("click",()=>this._addCat()),this.shadowRoot.getElementById("add-info-row").addEventListener("click",()=>this._addInfoRow()),this.shadowRoot.getElementById("add-control-row").addEventListener("click",()=>this._addControlRow())}_removeIconButton(t){let e=document.createElement("ha-icon-button");e.className="remove-btn",e.label="Remove";let o=document.createElement("ha-icon");return o.setAttribute("icon","mdi:delete-outline"),e.appendChild(o),e.addEventListener("click",t),e}_renderCats(){let t=this.shadowRoot.getElementById("cats-rows");t.innerHTML="",(this._config.cats||[]).forEach((o,s)=>{let n=document.createElement("div");n.className="row",n.dataset.index=String(s);let i=document.createElement("ha-form");i.schema=Tt,i.data=o,i.hass=this._hass,i.computeLabel=r=>r.label||r.name,i.addEventListener("value-changed",r=>{r.stopPropagation(),this._updateCat(s,r.detail.value)}),this._formEls.push(i),this._catForms.push(i),n.appendChild(i),n.appendChild(this._removeIconButton(()=>this._removeCat(s))),t.appendChild(n)})}_updateCat(t,e){let o=[...this._config.cats||[]];o[t]=e,this._fireConfigChanged({...this._config,cats:o})}_addCat(){let t=[...this._config.cats||[],{...Lt}];this._fireConfigChanged({...this._config,cats:t}),this._render()}_removeCat(t){let e=(this._config.cats||[]).filter((o,s)=>s!==t);this._fireConfigChanged({...this._config,cats:e}),this._render()}_renderInfoRows(){let t=this.shadowRoot.getElementById("info-rows");t.innerHTML="",(this._config.info_row||[]).forEach((o,s)=>{let n=document.createElement("div");n.className="row",n.dataset.index=String(s);let i=document.createElement("ha-form");i.schema=St,i.data=o,i.hass=this._hass,i.computeLabel=r=>r.label||r.name,i.addEventListener("value-changed",r=>{r.stopPropagation(),this._updateInfoRow(s,r.detail.value)}),this._formEls.push(i),this._infoForms.push(i),n.appendChild(i),n.appendChild(this._removeIconButton(()=>this._removeInfoRow(s))),t.appendChild(n)})}_updateInfoRow(t,e){let o=[...this._config.info_row||[]];o[t]=e,this._fireConfigChanged({...this._config,info_row:o})}_addInfoRow(){let t=[...this._config.info_row||[],{...Rt}];this._fireConfigChanged({...this._config,info_row:t}),this._render()}_removeInfoRow(t){let e=(this._config.info_row||[]).filter((o,s)=>s!==t);this._fireConfigChanged({...this._config,info_row:e}),this._render()}_renderControlsRows(){let t=this.shadowRoot.getElementById("controls-rows");t.innerHTML="",this._controlForms=[],(this._config.controls_row||[]).forEach((o,s)=>{let n=document.createElement("div");n.className="row",n.dataset.index=String(s);let i=document.createElement("ha-form");i.schema=It(o.action),i.data=o,i.hass=this._hass,i.computeLabel=r=>r.label||r.name,i.addEventListener("value-changed",r=>{r.stopPropagation(),this._updateControlRow(s,r.detail.value)}),this._formEls.push(i),this._controlForms.push(i),n.appendChild(i),n.appendChild(this._removeIconButton(()=>this._removeControlRow(s))),t.appendChild(n)})}_updateControlRow(t,e){let o=[...this._config.controls_row||[]],s=o[t]&&o[t].action;o[t]=e,this._fireConfigChanged({...this._config,controls_row:o}),e.action!==s&&(this._renderControlsRows(),this._lastStructureKey=this._structureKey(this._config))}_addControlRow(){let t=[...this._config.controls_row||[],{...Ht}];this._fireConfigChanged({...this._config,controls_row:t}),this._render()}_removeControlRow(t){let e=(this._config.controls_row||[]).filter((o,s)=>s!==t);this._fireConfigChanged({...this._config,controls_row:e}),this._render()}_renderMainForm(){let t=this.shadowRoot.getElementById("main-section"),e=document.createElement("ha-form");e.schema=Ot,e.data=this._config,e.hass=this._hass,e.computeLabel=o=>o.label||o.name,e.addEventListener("value-changed",o=>{o.stopPropagation(),this._fireConfigChanged(o.detail.value)}),this._formEls.push(e),this._mainForm=e,t.appendChild(e)}};customElements.get("petkit-puramax-card")||customElements.define("petkit-puramax-card",S);customElements.get("petkit-puramax-card-editor")||customElements.define("petkit-puramax-card-editor",R);var O=window;O.customCards=O.customCards||[];O.customCards.push({type:"petkit-puramax-card",name:"PETKIT PURAMAX Card",description:"Configurable card for PETKIT PURAMAX litter box monitoring, controls, and per-cat visit analytics."});
//# sourceMappingURL=petkit-puramax-card.js.map
