function C(s){let t=Math.round(s||0);if(t<60)return`${t}s`;let e=Math.floor(t/60),o=t%60;return`${e}m${o.toString().padStart(2,"0")}s`}function F(s){let t=Math.round(s||0),e=Math.floor(t/60),o=t%60;return`${e.toString().padStart(2,"0")}'${o.toString().padStart(2,"0")}"`}function V(s){let t=Math.floor(s);return t<1?"under 1h":t<48?`${t}h`:`${Math.floor(t/24)}d`}function _(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function A(s,t=new Date){let e=new Date(t.getFullYear(),t.getMonth(),t.getDate());e.setDate(e.getDate()+s);let o=new Date(e);return o.setDate(o.getDate()+1),{start:e,end:o}}function U(s,t=new Date){if(s===0)return"Today";if(s===-1)return"Yesterday";let{start:e}=A(s,t);return e.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"})}function $(s){let t=new Date(s);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`}function k({startTime:s,endTime:t,entityIds:e,includeStartTimeState:o=!1}){let n=s instanceof Date?s.toISOString():s,i=t instanceof Date?t.toISOString():t;return{type:"history/history_during_period",start_time:n,end_time:i,entity_ids:e,minimal_response:!1,no_attributes:!0,include_start_time_state:o}}function At(s){if(!s)return null;let t=s.s??s.state,e=parseFloat(t),o=s.lu?s.lu*1e3:s.last_changed?Date.parse(s.last_changed):null;return!Number.isFinite(e)||!o||Number.isNaN(o)?null:{value:e,ts:o}}function z(s,{minDelta:t=0,maxDelta:e=1/0}={}){if(!Array.isArray(s))return[];let o=s.map(At).filter(Boolean).sort((i,a)=>i.ts-a.ts),n=[];for(let i=1;i<o.length;i++){let a=o[i].value-o[i-1].value;if(a<=t||a>=e)continue;let r=o[i+1];r&&r.value===o[i-1].value||n.push({value:a,ts:o[i].ts})}return n}var kt="unknown_pet",x="Unknown";function P(s,t){if(!Array.isArray(s))return[];let e=new Set(t),o=[];for(let n of s){let i=n.s??n.state,a;if(e.has(i))a=i;else if(i===kt)a=x;else continue;let r=n.lu?n.lu*1e3:n.last_changed?Date.parse(n.last_changed):null;!r||Number.isNaN(r)||o.push({cat:a,ts:r})}return o.sort((n,i)=>n.ts-i.ts),o}function W(s,t){let e=s.length,o=new Array(e).fill(null),n=0,i=null;for(let a=0;a<e;a++){let r=s[a].ts,l=a===0?-1/0:(s[a-1].ts+r)/2,d=a===e-1?1/0:(r+s[a+1].ts)/2;for(;n<t.length&&t[n].ts<l;)i=t[n].cat,n++;let h=null,m=1/0;for(;n<t.length&&t[n].ts<d;){let u=Math.abs(t[n].ts-r);u<m&&(m=u,h=t[n].cat),i=t[n].cat,n++}o[a]=h!==null?h:i}return s.map((a,r)=>({...a,cat:o[r]}))}var Tt=[10,15,30,60,120,180,300,600,900,1800,3600];function j(s){for(let t of Tt)if(s/t<=5)return t;return Math.ceil(s/5/60)*60}function K({dayStart:s,niceMax:t,width:e,height:o,padding:n}){let{left:i,right:a,top:r,bottom:l}=n,d=e-i-a,h=o-r-l,m=s.getTime();return{xFor:g=>{let I=(g-m)/36e5;return i+I/24*d},yFor:g=>t?o-l-g/t*h:o-l}}function q({niceMax:s,yStep:t,width:e,height:o,padding:n}){let{left:i,right:a,top:r,bottom:l}=n,d=e-i-a,h=o-r-l,m=[4,8,12,16,20].map(p=>({hour:p,x:i+p/24*d,label:`${p.toString().padStart(2,"0")}:00`})),u=[];if(t>0)for(let p=0;p<=s;p+=t){let g=s?o-l-p/s*h:o-l;u.push({value:p,y:g,label:F(p)})}return{vertical:m,horizontal:u}}function G(s,{dayKeyFn:t}){let e={};for(let o of s||[]){let n=t(o.ts);e[n]||(e[n]={count:0,total:0}),e[n].count+=1,e[n].total+=o.value}return e}function X(s,t){let e=Object.keys(s).filter(h=>h!==t).sort(),o=e.slice(-3),n=e.slice(-7),i=(h,m)=>h.length?h.reduce((u,p)=>u+s[p][m],0)/h.length:null,a=h=>{if(!h.length)return null;let m=h.reduce((p,g)=>p+s[g].total,0),u=h.reduce((p,g)=>p+s[g].count,0);return u>0?m/u:null},r=s[t],l=r?r.count:0,d=r?r.total:0;return{todayCount:l,todayTotal:d,todayAvgDuration:l>0?d/l:null,avg3dVisits:i(o,"count"),avg3dTotal:i(o,"total"),avg3dDuration:a(o),avg7dVisits:i(n,"count"),avg7dTotal:i(n,"total"),avg7dDuration:a(n),daysOfHistory:e.length}}function Y({lastVisitTs:s,now:t,thresholdHours:e}){let o=t instanceof Date?t.getTime():t;if(s==null)return{alerting:!0,hoursSince:null};let n=(o-s)/36e5;return{alerting:n>=e,hoursSince:n}}function J(s,t){let e=t;s.value_map&&t in s.value_map?e=s.value_map[t]:t!==null&&s.unit&&(e=`${t}${s.unit}`),e==null&&(e="\u2014");let o=parseFloat(t),n=!1;return s.warn_below!==void 0&&Number.isFinite(o)&&(n=o<s.warn_below),s.warn_above!==void 0&&Number.isFinite(o)&&(n=n||o>s.warn_above),s.warn_state!==void 0&&(n=n||t===s.warn_state),{display:e,warn:n}}function Q(s,t,e){return!t||!s||!s.states||!s.states[t]?e:s.states[t].state}function N(s,t){let e=new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}});s.dispatchEvent(e)}function T(s,t,e,o){s.callService(t,e,o)}function R(s,t){t&&T(s,"button","press",{entity_id:t})}var Lt={total_use:["total_use","total_time"],last_used_by:["last_used_by"],error:["error","error_message"],last_event:["max_last_event","litter_last_event"],state:["max_work_state","litter_state"]};function Z(s,t){let e={};if(!t||!s||!s.entities)return e;let o=Object.values(s.entities).filter(n=>n.device_id===t&&n.entity_id.startsWith("sensor."));for(let[n,i]of Object.entries(Lt)){let a=o.find(r=>i.includes(r.translation_key));a&&(e[n]=a.entity_id)}return e}var tt=`
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
`;var et={maintenance_mode:"Maintenance mode",manual_odor_completed:"Manual odor removal done",auto_cleaning_completed:"Auto cleaning done"},ot=["unavailable","unknown","no_events_yet"],H="#9e9e9e",nt="PETKIT PURAMAX",it=60,st=8,at=1800,rt=600,lt=240,ct={left:46,right:10,top:10,bottom:28};var L=class extends HTMLElement{static getConfigElement(){return document.createElement("petkit-puramax-card-editor")}static getStubConfig(){return{type:"custom:petkit-puramax-card",title:"PETKIT PURAMAX",device_entities:{error:"sensor.example_petkit_error",last_event:"sensor.example_petkit_last_event",state:"sensor.example_petkit_state",total_use:"sensor.example_petkit_total_use"},cats:[{name:"Example Cat",color:"#4fc3f7"}]}}setConfig(t){if(!t)throw new Error("petkit-puramax-card: config is required");if(!t.device_id&&!t.device_entities)throw new Error('petkit-puramax-card: "device_entities" is required in config (or set "device_id")');let e=t.device_entities||{};if(!t.device_id&&!e.total_use)throw new Error('petkit-puramax-card: "device_entities.total_use" is required in config (or set "device_id")');if(!t.cats)throw new Error('petkit-puramax-card: "cats" is required in config');if(!Array.isArray(t.cats)||t.cats.length<1)throw new Error('petkit-puramax-card: "cats" must be a non-empty array');if(!t.device_id&&t.cats.length>1&&!e.last_used_by)throw new Error('petkit-puramax-card: "device_entities.last_used_by" is required in config when more than one cat is configured (or set "device_id")');t.cats.forEach((o,n)=>{if(!o||!o.name)throw new Error(`petkit-puramax-card: cats[${n}].name is required`);if(!o.color)throw new Error(`petkit-puramax-card: cats[${n}].color is required`)}),this._config={...t,device_entities:e},this._dayOffset=0,this._analytics=null,this._chartData=null,this._loadingChart=!1,this._loadingAnalytics=!1,this._deviceEntities=this._resolveDeviceEntities(),this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}_resolveDeviceEntities(){return{...Z(this._hass,this._config.device_id),...this._config.device_entities}}_configError(){return this._config.device_id?this._deviceEntities.total_use?this._config.cats.length>1&&!this._deviceEntities.last_used_by?'Could not auto-detect a "last used by" sensor on the selected device (required for more than one cat). Set "device_entities.last_used_by" in the config to override.':null:'Could not auto-detect a "total use" sensor on the selected device. Set "device_entities.total_use" in the config to override.':null}_renderError(t){this.shadowRoot||this.attachShadow({mode:"open"}),this.shadowRoot.innerHTML=`<ha-card><div style="padding: 16px;"><ha-alert alert-type="error">${_(t)}</ha-alert></div></ha-card>`}set hass(t){let e=this._hass;if(this._hass=t,this._deviceEntities=this._resolveDeviceEntities(),!this._built){this._built=!0,this._build();return}this._updateLiveValues(),this._maybeRefreshOnNewVisit(e)}get hass(){return this._hass}getCardSize(){return 14}_build(){let t=this._configError();if(t){this._renderError(t);return}this._render(),this._loadDay(),this._loadAnalytics(),this._startNoVisitTimer()}connectedCallback(){this._hass&&!this._built&&(this._built=!0,this._build())}disconnectedCallback(){this._noVisitTimer&&(clearInterval(this._noVisitTimer),this._noVisitTimer=null)}_startNoVisitTimer(){this._noVisitTimer||(this._noVisitTimer=setInterval(()=>this._checkNoVisitAlerts(),300*1e3))}_maybeRefreshOnNewVisit(t){if(!t)return;let e=this._deviceEntities.total_use,o=t.states[e],n=this._hass.states[e];n&&(!o||o.last_changed!==n.last_changed)&&(this._dayOffset===0&&this._loadDay(),this._loadAnalytics())}_s(t,e){return Q(this._hass,t,e)}async _fetchVisits({start:t,end:e}){let o=this._config,n=this._deviceEntities,i=k({startTime:t,endTime:e,entityIds:[n.total_use]}),a=[this._hass.callWS(i)];if(o.cats.length>1){let u=k({startTime:t,endTime:e,entityIds:[n.last_used_by],includeStartTimeState:!0});a.push(this._hass.callWS(u))}let r={},l={};try{let[u,p]=await Promise.all(a);r=u||{},l=p||{}}catch{}let d=z(r[n.total_use],{minDelta:0,maxDelta:at}),h;if(o.cats.length>1){let u=o.cats.map(g=>g.name),p=P(l[n.last_used_by],u);h=W(d,p)}else h=d.map(u=>({...u,cat:o.cats[0].name}));let m=new Map(o.cats.map(u=>[u.name,u]));return h.map(u=>({cat:u.cat===x?this._unknownCat():m.get(u.cat)||null,duration:u.value,ts:u.ts}))}_unknownCat(){return{name:x,color:this._config.unknown_cat_color||H}}async _loadDay(){if(!this._hass)return;this._loadingChart=!0,this._renderChartArea();let t=this._deviceEntities,{start:e,end:o}=A(this._dayOffset),n=[],i=[];try{let[a,r]=await Promise.all([this._fetchVisits({start:e,end:o}),t.last_event?this._hass.callWS(k({startTime:e,endTime:o,entityIds:[t.last_event]})):Promise.resolve({})]);n=a,i=(r||{})[t.last_event]||[]}catch{n=[],i=[]}this._chartVisits=n,this._chartEventHist=i,this._loadingChart=!1,this._renderChartArea()}async _loadAnalytics(){if(!this._hass)return;this._loadingAnalytics=!0,this._renderAnalyticsArea();let t=this._config,e=new Date,o=new Date(e.getTime()-168*3600*1e3),n=[];try{n=await this._fetchVisits({start:o,end:e})}catch{n=[]}let i=$(e.getTime()),a={};t.cats.forEach(r=>{let l=n.filter(m=>m.cat===r).map(m=>({value:m.duration,ts:m.ts})),d=G(l,{dayKeyFn:$}),h=l.length?Math.max(...l.map(m=>m.ts)):null;a[r.name]={...X(d,i),lastVisitTs:h}}),this._analytics=a,this._loadingAnalytics=!1,this._checkNoVisitAlerts(),this._renderAnalyticsArea()}_checkNoVisitAlerts(){if(!this._analytics||!this._built)return;let t=this._config,e=t.no_visit_alert_hours??st,o=Date.now();this._notifiedCats||(this._notifiedCats=new Set),t.cats.forEach(n=>{let i=this._analytics[n.name];if(!i)return;let a=Y({lastVisitTs:i.lastVisitTs,now:o,thresholdHours:e});i.noVisitAlert=a;let r=this._notifiedCats.has(n.name);a.alerting&&!r?(this._notifiedCats.add(n.name),this._sendNoVisitNotification(n,a)):!a.alerting&&r&&this._notifiedCats.delete(n.name)}),this._renderAnalyticsArea()}_sendNoVisitNotification(t,e){let o=this._config.notify_service;if(!o||!this._hass)return;let n=o.indexOf(".");if(n===-1)return;let i=o.slice(0,n),a=o.slice(n+1);if(i!=="notify"||!a)return;let r=e.hoursSince==null?`${t.name} hasn't used the litter box yet in the tracked history.`:`${t.name} hasn't used the litter box in over ${Math.floor(e.hoursSince)}h.`;T(this._hass,"notify",a,{message:r,title:"Litter box alert"})}_render(){let t=this._config;this.shadowRoot.innerHTML=`
      <style>${tt}</style>
      <ha-card>
        <div class="header">
          <div class="title">${t.title||nt}</div>
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
    `,this.shadowRoot.getElementById("prev-day").addEventListener("click",()=>this._changeDay(-1)),this.shadowRoot.getElementById("next-day").addEventListener("click",()=>this._changeDay(1)),this._updateLiveValues(),this._renderChartArea(),this._renderAnalyticsArea()}_changeDay(t){this._dayOffset+=t,this._dayOffset>0&&(this._dayOffset=0),this._loadDay()}_updateLiveValues(){if(!this._built)return;let t=this._config,e=this._deviceEntities,o=this.shadowRoot.getElementById("status-row");if(o){let i=this._s(e.error,"no_error"),a=i&&i!=="no_error",r=t.info_row||[];if(o.innerHTML=[...r.map(l=>this._renderInfoChip(l)),a?this._chip("mdi:alert","Error",i.replace(/_/g," "),!0,e.error):""].join(""),!o.dataset.bound){o.dataset.bound="1";let l=d=>{let h=d.target.closest(".chip[data-entity]");h&&N(this,h.dataset.entity)};o.addEventListener("click",l),o.addEventListener("keydown",d=>{(d.key==="Enter"||d.key===" ")&&(d.preventDefault(),l(d))})}}let n=this.shadowRoot.getElementById("controls-row");if(n&&!n.dataset.bound){let i=t.controls_row||[];n.innerHTML=i.map((a,r)=>`
      <ha-control-button class="ctrl-btn" id="ctrl-${r}" label="${_(a.name||"")}">
        <div class="ctrl-btn-content">
          <ha-icon icon="${_(a.icon||"mdi:help")}"></ha-icon>
          <span>${_(a.name||"")}</span>
        </div>
      </ha-control-button>
    `).join(""),n.dataset.bound="1",i.forEach((a,r)=>{this.shadowRoot.getElementById(`ctrl-${r}`).addEventListener("click",()=>this._runControlAction(a))})}}_renderInfoChip(t){let e=this._s(t.entity,null),{display:o,warn:n}=J(t,e);return this._chip(t.icon||"mdi:information-outline",t.name||t.entity,o,n,t.entity)}_runControlAction(t){switch(t.action){case"press":{t.confirm?window.confirm(t.confirm)&&R(this._hass,t.entity):R(this._hass,t.entity);break}case"toggle_maintenance":{let e=t.state_entity||this._deviceEntities.state;this._s(e,"")==="maintenance"?R(this._hass,t.exit_entity):R(this._hass,t.start_entity);break}case"toggle":{T(this._hass,"homeassistant","toggle",{entity_id:t.entity});break}case"more_info":{N(this,t.entity);break}default:break}}_chip(t,e,o,n,i){let a=i?` data-entity="${_(i)}" tabindex="0"`:"";return`
      <div class="chip ${n?"warn":""} ${i?"tappable":""}"${a}>
        <ha-icon icon="${_(t)}"></ha-icon>
        <div class="chip-text"><div class="chip-label">${_(e)}</div><div class="chip-value">${_(o)}</div></div>
      </div>`}_renderChartArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("day-label");t&&(t.textContent=U(this._dayOffset));let e=this.shadowRoot.getElementById("next-day");e&&(e.disabled=this._dayOffset>=0);let o=this.shadowRoot.getElementById("chart-area"),n=this.shadowRoot.getElementById("records-list"),i=this.shadowRoot.getElementById("usage-body");if(!o||this._loadingChart)return;let a=this._config,r=(this._chartVisits||[]).filter(c=>c.cat).sort((c,f)=>c.ts-f.ts),l=rt,d=lt,h=ct,m=Math.max(60,...r.map(c=>c.duration)),u=j(m),p=Math.ceil(m/u)*u,{start:g}=A(this._dayOffset),{xFor:I,yFor:pt}=K({dayStart:g,niceMax:p,width:l,height:d,padding:h}),{vertical:B,horizontal:M}=q({niceMax:p,yStep:u,width:l,height:d,padding:h}),mt=B.map(c=>`<line x1="${c.x}" y1="${h.top}" x2="${c.x}" y2="${d-h.bottom}" class="grid-line-v" />`).join(""),ft=M.map(c=>`<line x1="${h.left}" y1="${c.y}" x2="${l-h.right}" y2="${c.y}" class="grid-line-h" />`).join(""),_t=(d-h.bottom)/d*100,gt=B.map(c=>`<div class="axis-label" style="left:${c.x/l*100}%;top:${_t}%">${c.label}</div>`).join(""),vt=h.left/l*100,yt=M.map(c=>`<div class="axis-label-y" style="top:${c.y/d*100}%;width:${vt}%">${c.label}</div>`).join(""),wt=r.map((c,f)=>{let v=I(c.ts),y=pt(c.duration),b=d-h.bottom;return`<line x1="${v}" y1="${b}" x2="${v}" y2="${y}" stroke="${c.cat.color}" stroke-width="2" />
              <circle class="visit-point" cx="${v}" cy="${y}" r="5" fill="${c.cat.color}" />
              <line class="visit-hit" data-idx="${f}" x1="${v}" y1="${b}" x2="${v}" y2="${y}" stroke="transparent" stroke-width="16" />`}).join("");o.innerHTML=`
      <div class="chart-wrap">
        <svg viewBox="0 0 ${l} ${d}" class="chart-svg">
          ${ft}
          ${mt}
          ${wt||""}
        </svg>
        ${gt}
        ${yt}
        <div class="chart-tooltip" id="chart-tooltip"></div>
      </div>
      ${r.length===0?'<div class="empty-note">No visits recorded this day</div>':""}
    `;let E=this.shadowRoot.getElementById("chart-tooltip"),bt=o.querySelector(".chart-wrap");if(o.querySelectorAll(".visit-hit").forEach(c=>{c.addEventListener("mouseenter",()=>{let f=r[parseInt(c.dataset.idx,10)],v=new Date(f.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"});E.textContent=`${v} \xB7 ${f.cat.name} \xB7 ${C(f.duration)}`;let y=c.getBoundingClientRect(),b=bt.getBoundingClientRect();E.style.left=`${y.left-b.left+y.width/2}px`,E.style.top=`${y.top-b.top}px`,E.classList.add("visible")}),c.addEventListener("mouseleave",()=>{E.classList.remove("visible")})}),i){let c={};a.cats.forEach(w=>{c[w.name]={count:0}});let f=0,v=H;r.forEach(w=>{w.cat.name===x?(f+=1,v=w.cat.color):c[w.cat.name].count+=1});let y=r.length,b=a.cats.map(w=>{let Rt=c[w.name];return`<span class="usage-cat"><span class="dot" style="background:${w.color}"></span>${w.name}: ${Rt.count}</span>`}).join("")+(f>0?`<span class="usage-cat"><span class="dot" style="background:${v}"></span>${x}: ${f}</span>`:"");i.innerHTML=`
        <div class="usage-row">
          <div class="stat-value">${y} time${y===1?"":"s"}</div>
          <div class="usage-cats">${b}</div>
        </div>
      `}let xt=this._chartEventHist||[],Et=this._eventLabels(),Ct=(a.event_exclude||ot).map(c=>String(c).toLowerCase()),D=xt.map(c=>{let f=c.s??c.state,v=c.lu?c.lu*1e3:c.last_changed?Date.parse(c.last_changed):null;return!f||!v||Ct.includes(f.toLowerCase())?null:{ts:v,icon:"mdi:information-outline",color:"var(--secondary-text-color)",text:Et[f]||f}}).filter(Boolean);D.sort((c,f)=>f.ts-c.ts),n&&(D.length===0?n.innerHTML='<div class="empty-note">No records for this day</div>':n.innerHTML=D.map(c=>`
          <div class="record-row">
            <div class="record-time">${new Date(c.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</div>
            <ha-icon icon="${_(c.icon)}" style="color:${_(c.color)}"></ha-icon>
            <div class="record-text">${_(c.text)}</div>
          </div>
        `).join(""))}_eventLabels(){return{...et,...this._config.event_labels||{}}}_renderAnalyticsArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("analytics-grid"),e=this.shadowRoot.getElementById("decline-banner"),o=this.shadowRoot.getElementById("no-visit-banner");if(!t||this._loadingAnalytics||!this._analytics)return;let n=this._config,i=(n.decline_threshold_pct||it)/100,a=[];if(t.innerHTML=n.cats.map(r=>{let l=this._analytics[r.name]||{};return l.daysOfHistory>=3&&l.avg7dTotal&&new Date().getHours()>=18&&(l.todayTotal<i*l.avg7dTotal?a.push(`${r.name}'s usage today is well below their recent average \u2014 worth a check.`):l.todayTotal>(2-i)*l.avg7dTotal&&a.push(`${r.name}'s usage today is well above their recent average \u2014 worth a check.`)),`
        <div class="cat-analytics">
          <table>
            <colgroup>
              <col class="col-name" /><col class="col-stat" /><col class="col-stat" /><col class="col-stat" />
            </colgroup>
            <tr><td class="cat-name-cell"><span class="dot" style="background:${_(r.color)}"></span>${_(r.name)}</td><td>Today</td><td>3d avg</td><td>7d avg</td></tr>
            <tr><td>Visits</td><td>${l.todayCount??0}</td><td>${l.avg3dVisits!==null&&l.avg3dVisits!==void 0?l.avg3dVisits.toFixed(1):"\u2014"}</td><td>${l.avg7dVisits!==null&&l.avg7dVisits!==void 0?l.avg7dVisits.toFixed(1):"\u2014"}</td></tr>
            <tr><td>Duration</td><td>${l.todayAvgDuration?C(l.todayAvgDuration):"\u2014"}</td><td>${l.avg3dDuration?C(l.avg3dDuration):"\u2014"}</td><td>${l.avg7dDuration?C(l.avg7dDuration):"\u2014"}</td></tr>
          </table>
        </div>
      `}).join(""),e&&(e.innerHTML=a.length?a.map(r=>`<div class="warn-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${r}</div>`).join(""):""),o){let r=n.cats.filter(l=>this._analytics[l.name]?.noVisitAlert?.alerting);o.innerHTML=r.length?r.map(l=>{let{hoursSince:d}=this._analytics[l.name].noVisitAlert,h=d==null?"no visits recorded yet":`last seen ${V(d)} ago`;return`<div class="no-visit-banner"><ha-icon icon="mdi:cat-alert"></ha-icon>${_(l.name)} hasn't used the litter box recently (${_(h)}).</div>`}).join(""):""}}};var St=[{name:"name",label:"Name",selector:{text:{}}}],It=[{name:"color",label:"Color",selector:{ui_color:{}}}],Dt={name:"",color:"#4fc3f7"},$t=[{name:"entity",label:"Entity",selector:{entity:{}}}],ht="mdi:information-outline",Nt=[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"unit",label:"Unit",selector:{text:{}}},{name:"warn_below",label:"Warn below",selector:{number:{mode:"box"}}},{name:"warn_above",label:"Warn above",selector:{number:{mode:"box"}}},{name:"warn_state",label:"Warn state",selector:{text:{}}}],Ht={entity:"",name:"",icon:ht},Ot=["press","toggle_maintenance","toggle","more_info"],Bt=[{name:"entity",label:"Entity",selector:{entity:{}}}],ut="mdi:gesture-tap-button",Mt=[{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"action",label:"Action",selector:{select:{options:Ot,mode:"dropdown"}}}],Ft={press:[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"confirm",label:"Confirm text (optional)",selector:{text:{}}}],toggle:[{name:"entity",label:"Entity",selector:{entity:{}}}],more_info:[{name:"entity",label:"Entity",selector:{entity:{}}}],toggle_maintenance:[{name:"start_entity",label:"Start entity",selector:{entity:{domain:"button"}}},{name:"exit_entity",label:"Exit entity",selector:{entity:{domain:"button"}}},{name:"state_entity",label:"State entity (optional)",selector:{entity:{}}}]};function Vt(s){return[...Mt,...Ft[s]||[]]}var Ut={name:"",icon:ut,action:"press",entity:""};function zt(s){return!!(s&&s.entity)}function Pt(s){return!!(s&&(s.entity||s.start_entity))}function dt(s,t){let e=new Set;return s.forEach(o=>{o<t?e.add(o):o>t&&e.add(o-1)}),e}var Wt=[{name:"title",label:"Title",selector:{text:{}}},{name:"device_id",label:"PetKit device",selector:{device:{filter:{integration:"petkit"}}}},{name:"alerts",type:"expandable",flatten:!0,title:"Analytics & alerts",schema:[{name:"decline_threshold_pct",label:"Decline/spike alert threshold (%)",selector:{number:{min:10,max:100,mode:"box"}}},{name:"no_visit_alert_hours",label:"Warn if no visit in (hours)",selector:{number:{min:1,max:168,mode:"box"}}},{name:"notify_service",label:"Push a notification too (optional)",selector:{entity:{domain:"notify"}}},{name:"unknown_cat_color",label:"Unidentified-visit color (chart & analytics)",selector:{ui_color:{}}}]}],S=class extends HTMLElement{constructor(){super(),this._expandedInfoRows=new Set,this._expandedControlRows=new Set}setConfig(t){let e=t||{},o=!this.shadowRoot||this._structureKey(e)!==this._lastStructureKey;this._config=e,o?this._render():this._updateFormsInPlace()}set hass(t){this._hass=t,(this._formEls||[]).forEach(e=>{e.hass=t})}get hass(){return this._hass}connectedCallback(){this._render()}_fireConfigChanged(t){this._config=t,this.dispatchEvent(new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:t}}))}_structureKey(t){return JSON.stringify({cats:(t.cats||[]).length,info_row:(t.info_row||[]).length,controls_row:(t.controls_row||[]).map(e=>e&&e.action||null)})}_capturePanelExpanded(){if(!this.shadowRoot)return null;let t=this.shadowRoot.querySelectorAll("ha-expansion-panel");return t.length?Array.from(t).map(e=>e.expanded):null}_restorePanelExpanded(t){if(!t)return;this.shadowRoot.querySelectorAll("ha-expansion-panel").forEach((o,n)=>{t[n]!==void 0&&(o.expanded=t[n])})}_updateFormsInPlace(){this._mainForm&&(this._mainForm.data=this._config);let t=this._config.cats||[];(this._catNameForms||[]).forEach((n,i)=>{t[i]&&(n.data=t[i])}),(this._catColorForms||[]).forEach((n,i)=>{t[i]&&(n.data=t[i])});let e=this._config.info_row||[];(this._infoRowRefs||[]).forEach((n,i)=>this._refreshRowRef(n,e[i],"info"));let o=this._config.controls_row||[];(this._controlRowRefs||[]).forEach((n,i)=>this._refreshRowRef(n,o[i],"control"))}_refreshRowRef(t,e,o){!t||!e||(t.form&&(t.form.data=e),t.labelEl&&(t.labelEl.textContent=this._summaryLabel(e,o)),t.iconEl&&t.iconEl.setAttribute("icon",this._summaryIcon(e,o)))}_summaryLabel(t,e){return t.name?t.name:e==="info"?t.entity||"":t.entity||t.start_entity||t.action||""}_summaryIcon(t,e){return t.icon||(e==="info"?ht:ut)}_render(){if(this.shadowRoot||this.attachShadow({mode:"open"}),!this._config)return;let t=this._capturePanelExpanded();this._formEls=[],this._catNameForms=[],this._catColorForms=[];let e=(this._config.cats||[]).length,o=(this._config.info_row||[]).length,n=(this._config.controls_row||[]).length;this.shadowRoot.innerHTML=`
      <style>
        .editor { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
        ha-expansion-panel { --expansion-panel-summary-padding: 0 16px; border-radius: var(--ha-card-border-radius, 12px); }
        .panel-body { display: flex; flex-direction: column; gap: 4px; padding: 4px 16px 16px; }
        .row { display: flex; align-items: center; gap: 4px; }
        .row ha-form { flex: 1 1 auto; min-width: 0; }
        .summary-row { padding: 0 4px; }
        .summary-row ha-icon { color: var(--secondary-text-color); flex: 0 0 auto; }
        .summary-label {
          flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; color: var(--primary-text-color);
        }
        #cats-rows { display: flex; flex-direction: column; gap: 12px; }
        .cat-item { display: flex; flex-direction: column; gap: 4px; }
        #info-rows, #controls-rows { display: flex; flex-direction: column; gap: 4px; }
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

        <ha-expansion-panel outlined header="Controls (${n})">
          <div class="panel-body">
            ${n===0?'<div class="empty-hint">No control buttons configured yet.</div>':""}
            <div id="controls-rows"></div>
            <div class="add-row">
              <button class="add-btn" id="add-control-row" type="button">
                <ha-icon icon="mdi:plus"></ha-icon>Add control
              </button>
            </div>
          </div>
        </ha-expansion-panel>
      </div>
    `,this._renderMainForm(),this._renderCats(),this._renderInfoRows(),this._renderControlsRows(),this._restorePanelExpanded(t),this._lastStructureKey=this._structureKey(this._config),this.shadowRoot.getElementById("add-cat").addEventListener("click",()=>this._addCat()),this.shadowRoot.getElementById("add-info-row").addEventListener("click",()=>this._addInfoRow()),this.shadowRoot.getElementById("add-control-row").addEventListener("click",()=>this._addControlRow())}_iconButton(t,e,o,n){let i=document.createElement("ha-icon-button");i.className=o,i.label=e;let a=document.createElement("ha-icon");return a.setAttribute("icon",t),i.appendChild(a),i.addEventListener("click",n),i}_removeIconButton(t){return this._iconButton("mdi:delete-outline","Remove","remove-btn",t)}_editIconButton(t){return this._iconButton("mdi:pencil-outline","Edit","edit-btn",t)}_collapseIconButton(t){return this._iconButton("mdi:check","Done","collapse-btn",t)}_renderCats(){let t=this.shadowRoot.getElementById("cats-rows");t.innerHTML="",(this._config.cats||[]).forEach((o,n)=>{let i=document.createElement("div");i.className="cat-item",i.dataset.index=String(n);let a=document.createElement("div");a.className="row";let r=document.createElement("ha-form");r.schema=St,r.data=o,r.hass=this._hass,r.computeLabel=d=>d.label||d.name,r.addEventListener("value-changed",d=>{d.stopPropagation(),this._updateCat(n,{...this._config.cats[n],...d.detail.value})}),this._formEls.push(r),this._catNameForms.push(r),a.appendChild(r),a.appendChild(this._removeIconButton(()=>this._removeCat(n)));let l=document.createElement("ha-form");l.schema=It,l.data=o,l.hass=this._hass,l.computeLabel=d=>d.label||d.name,l.addEventListener("value-changed",d=>{d.stopPropagation(),this._updateCat(n,{...this._config.cats[n],...d.detail.value})}),this._formEls.push(l),this._catColorForms.push(l),i.appendChild(a),i.appendChild(l),t.appendChild(i)})}_updateCat(t,e){let o=[...this._config.cats||[]];o[t]=e,this._fireConfigChanged({...this._config,cats:o})}_addCat(){let t=[...this._config.cats||[],{...Dt}];this._fireConfigChanged({...this._config,cats:t}),this._render()}_removeCat(t){let e=(this._config.cats||[]).filter((o,n)=>n!==t);this._fireConfigChanged({...this._config,cats:e}),this._render()}_renderInfoRows(){let t=this.shadowRoot.getElementById("info-rows");t.innerHTML="",this._infoRowRefs=[],(this._config.info_row||[]).forEach((o,n)=>{let{el:i,ref:a}=this._buildInfoRow(o,n);this._infoRowRefs[n]=a,t.appendChild(i)})}_buildInfoRow(t,e){return zt(t)?this._expandedInfoRows.has(e)?this._buildFullRow({schema:Nt,spec:t,onChange:o=>this._updateInfoRow(e,o),onCollapse:()=>{this._expandedInfoRows.delete(e),this._renderInfoRows()},onRemove:()=>this._removeInfoRow(e)}):this._buildSummaryRow({spec:t,kind:"info",onEdit:()=>{this._expandedInfoRows.add(e),this._renderInfoRows()},onRemove:()=>this._removeInfoRow(e)}):this._buildMinimalRow({schema:$t,spec:t,onChange:o=>{this._updateInfoRow(e,{...t,...o}),this._renderInfoRows()},onRemove:()=>this._removeInfoRow(e)})}_updateInfoRow(t,e){let o=[...this._config.info_row||[]];o[t]=e,this._fireConfigChanged({...this._config,info_row:o})}_addInfoRow(){let t=[...this._config.info_row||[],{...Ht}];this._fireConfigChanged({...this._config,info_row:t}),this._render()}_removeInfoRow(t){let e=(this._config.info_row||[]).filter((o,n)=>n!==t);this._expandedInfoRows=dt(this._expandedInfoRows,t),this._fireConfigChanged({...this._config,info_row:e}),this._render()}_renderControlsRows(){let t=this.shadowRoot.getElementById("controls-rows");t.innerHTML="",this._controlRowRefs=[],(this._config.controls_row||[]).forEach((o,n)=>{let{el:i,ref:a}=this._buildControlRow(o,n);this._controlRowRefs[n]=a,t.appendChild(i)})}_buildControlRow(t,e){return Pt(t)?this._expandedControlRows.has(e)?this._buildFullRow({schema:Vt(t.action),spec:t,onChange:o=>this._updateControlRow(e,o),onCollapse:()=>{this._expandedControlRows.delete(e),this._renderControlsRows()},onRemove:()=>this._removeControlRow(e)}):this._buildSummaryRow({spec:t,kind:"control",onEdit:()=>{this._expandedControlRows.add(e),this._renderControlsRows()},onRemove:()=>this._removeControlRow(e)}):this._buildMinimalRow({schema:Bt,spec:t,onChange:o=>{this._updateControlRow(e,{...t,...o}),this._renderControlsRows()},onRemove:()=>this._removeControlRow(e)})}_updateControlRow(t,e){let o=[...this._config.controls_row||[]],n=o[t]&&o[t].action;o[t]=e,this._fireConfigChanged({...this._config,controls_row:o}),e.action!==n&&(this._renderControlsRows(),this._lastStructureKey=this._structureKey(this._config))}_addControlRow(){let t=[...this._config.controls_row||[],{...Ut}];this._fireConfigChanged({...this._config,controls_row:t}),this._render()}_removeControlRow(t){let e=(this._config.controls_row||[]).filter((o,n)=>n!==t);this._expandedControlRows=dt(this._expandedControlRows,t),this._fireConfigChanged({...this._config,controls_row:e}),this._render()}_buildMinimalRow({schema:t,spec:e,onChange:o,onRemove:n}){let i=document.createElement("div");i.className="row";let a=document.createElement("ha-form");return a.schema=t,a.data=e,a.hass=this._hass,a.computeLabel=r=>r.label||r.name,a.addEventListener("value-changed",r=>{r.stopPropagation(),o(r.detail.value)}),this._formEls.push(a),i.appendChild(a),i.appendChild(this._removeIconButton(n)),{el:i,ref:{mode:"minimal",form:a}}}_buildFullRow({schema:t,spec:e,onChange:o,onCollapse:n,onRemove:i}){let a=document.createElement("div");a.className="row";let r=document.createElement("ha-form");return r.schema=t,r.data=e,r.hass=this._hass,r.computeLabel=l=>l.label||l.name,r.addEventListener("value-changed",l=>{l.stopPropagation(),o(l.detail.value)}),this._formEls.push(r),a.appendChild(r),a.appendChild(this._collapseIconButton(n)),a.appendChild(this._removeIconButton(i)),{el:a,ref:{mode:"full",form:r}}}_buildSummaryRow({spec:t,kind:e,onEdit:o,onRemove:n}){let i=document.createElement("div");i.className="row summary-row";let a=document.createElement("ha-icon");a.setAttribute("icon",this._summaryIcon(t,e));let r=document.createElement("span");return r.className="summary-label",r.textContent=this._summaryLabel(t,e),i.appendChild(a),i.appendChild(r),i.appendChild(this._editIconButton(o)),i.appendChild(this._removeIconButton(n)),{el:i,ref:{mode:"summary",iconEl:a,labelEl:r}}}_renderMainForm(){let t=this.shadowRoot.getElementById("main-section"),e=document.createElement("ha-form");e.schema=Wt,e.data=this._config,e.hass=this._hass,e.computeLabel=o=>o.label||o.name,e.addEventListener("value-changed",o=>{o.stopPropagation(),this._fireConfigChanged(o.detail.value)}),this._formEls.push(e),this._mainForm=e,t.appendChild(e)}};customElements.get("petkit-puramax-card")||customElements.define("petkit-puramax-card",L);customElements.get("petkit-puramax-card-editor")||customElements.define("petkit-puramax-card-editor",S);var O=window;O.customCards=O.customCards||[];O.customCards.push({type:"petkit-puramax-card",name:"PETKIT PURAMAX Card",description:"Configurable card for PETKIT PURAMAX litter box monitoring, controls, and per-cat visit analytics."});
//# sourceMappingURL=petkit-puramax-card.js.map
