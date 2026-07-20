function E(i){let t=Math.round(i||0);if(t<60)return`${t}s`;let e=Math.floor(t/60),o=t%60;return`${e}m${o.toString().padStart(2,"0")}s`}function F(i){let t=Math.round(i||0),e=Math.floor(t/60),o=t%60;return`${e.toString().padStart(2,"0")}'${o.toString().padStart(2,"0")}"`}function V(i){let t=Math.floor(i);return t<1?"under 1h":t<48?`${t}h`:`${Math.floor(t/24)}d`}function _(i){return String(i).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function k(i,t=new Date){let e=new Date(t.getFullYear(),t.getMonth(),t.getDate());e.setDate(e.getDate()+i);let o=new Date(e);return o.setDate(o.getDate()+1),{start:e,end:o}}function M(i,t=new Date){if(i===0)return"Today";if(i===-1)return"Yesterday";let{start:e}=k(i,t);return e.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"})}function N(i){let t=new Date(i);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`}function T({startTime:i,endTime:t,entityIds:e,includeStartTimeState:o=!1}){let n=i instanceof Date?i.toISOString():i,a=t instanceof Date?t.toISOString():t;return{type:"history/history_during_period",start_time:n,end_time:a,entity_ids:e,minimal_response:!1,no_attributes:!0,include_start_time_state:o}}function wt(i){if(!i)return null;let t=i.s??i.state,e=parseFloat(t),o=i.lu?i.lu*1e3:i.last_changed?Date.parse(i.last_changed):null;return!Number.isFinite(e)||!o||Number.isNaN(o)?null:{value:e,ts:o}}function U(i,{minDelta:t=0,maxDelta:e=1/0}={}){if(!Array.isArray(i))return[];let o=i.map(wt).filter(Boolean).sort((a,s)=>a.ts-s.ts),n=[];for(let a=1;a<o.length;a++){let s=o[a].value-o[a-1].value;if(s<=t||s>=e)continue;let r=o[a+1];r&&r.value===o[a-1].value||n.push({value:s,ts:o[a].ts})}return n}var Ct="unknown_pet",w="Unknown";function z(i,t){if(!Array.isArray(i))return[];let e=new Set(t),o=[];for(let n of i){let a=n.s??n.state,s;if(e.has(a))s=a;else if(a===Ct)s=w;else continue;let r=n.lu?n.lu*1e3:n.last_changed?Date.parse(n.last_changed):null;!r||Number.isNaN(r)||o.push({cat:s,ts:r})}return o.sort((n,a)=>n.ts-a.ts),o}function P(i,t){let e=i.length,o=new Array(e).fill(null),n=0,a=null;for(let s=0;s<e;s++){let r=i[s].ts,c=s===0?-1/0:(i[s-1].ts+r)/2,u=s===e-1?1/0:(r+i[s+1].ts)/2;for(;n<t.length&&t[n].ts<c;)a=t[n].cat,n++;let h=null,d=1/0;for(;n<t.length&&t[n].ts<u;){let m=Math.abs(t[n].ts-r);m<d&&(d=m,h=t[n].cat),a=t[n].cat,n++}o[s]=h!==null?h:a}return i.map((s,r)=>({...s,cat:o[r]}))}var Et=[10,15,30,60,120,180,300,600,900,1800,3600];function W(i){for(let t of Et)if(i/t<=5)return t;return Math.ceil(i/5/60)*60}function j({dayStart:i,niceMax:t,width:e,height:o,padding:n}){let{left:a,right:s,top:r,bottom:c}=n,u=e-a-s,h=o-r-c,d=i.getTime();return{xFor:v=>{let $=(v-d)/36e5;return a+$/24*u},yFor:v=>t?o-c-v/t*h:o-c}}function q({niceMax:i,yStep:t,width:e,height:o,padding:n}){let{left:a,right:s,top:r,bottom:c}=n,u=e-a-s,h=o-r-c,d=[4,8,12,16,20].map(p=>({hour:p,x:a+p/24*u,label:`${p.toString().padStart(2,"0")}:00`})),m=[];if(t>0)for(let p=0;p<=i;p+=t){let v=i?o-c-p/i*h:o-c;m.push({value:p,y:v,label:F(p)})}return{vertical:d,horizontal:m}}function K(i,{dayKeyFn:t}){let e={};for(let o of i||[]){let n=t(o.ts);e[n]||(e[n]={count:0,total:0}),e[n].count+=1,e[n].total+=o.value}return e}function G(i,t){let e=Object.keys(i).filter(h=>h!==t).sort(),o=e.slice(-3),n=e.slice(-7),a=(h,d)=>h.length?h.reduce((m,p)=>m+i[p][d],0)/h.length:null,s=h=>{if(!h.length)return null;let d=h.reduce((p,v)=>p+i[v].total,0),m=h.reduce((p,v)=>p+i[v].count,0);return m>0?d/m:null},r=i[t],c=r?r.count:0,u=r?r.total:0;return{todayCount:c,todayTotal:u,todayAvgDuration:c>0?u/c:null,avg3dVisits:a(o,"count"),avg3dTotal:a(o,"total"),avg3dDuration:s(o),avg7dVisits:a(n,"count"),avg7dTotal:a(n,"total"),avg7dDuration:s(n),daysOfHistory:e.length}}function X({lastVisitTs:i,now:t,thresholdHours:e}){let o=t instanceof Date?t.getTime():t;if(i==null)return{alerting:!0,hoursSince:null};let n=(o-i)/36e5;return{alerting:n>=e,hoursSince:n}}function Y(i,t){let e=t;i.value_map&&t in i.value_map?e=i.value_map[t]:t!==null&&i.unit&&(e=`${t}${i.unit}`),e==null&&(e="\u2014");let o=parseFloat(t),n=!1;return i.warn_below!==void 0&&Number.isFinite(o)&&(n=o<i.warn_below),i.warn_above!==void 0&&Number.isFinite(o)&&(n=n||o>i.warn_above),i.warn_state!==void 0&&(n=n||t===i.warn_state),{display:e,warn:n}}function J(i,t,e){return!t||!i||!i.states||!i.states[t]?e:i.states[t].state}function Q(i,t){let e=new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}});i.dispatchEvent(e)}function L(i,t,e,o){i.callService(t,e,o)}function A(i,t){t&&L(i,"button","press",{entity_id:t})}var Z=`
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
`;var tt={maintenance_mode:"Maintenance mode",manual_odor_completed:"Manual odor removal done",auto_cleaning_completed:"Auto cleaning done"},et=["unavailable","unknown","no_events_yet"],I="#9e9e9e",ot="PETKIT PURAMAX",nt=60,at=8,st=1800,it=600,rt=240,ct={left:46,right:10,top:10,bottom:28};var R=class extends HTMLElement{static getConfigElement(){return document.createElement("petkit-puramax-card-editor")}static getStubConfig(){return{type:"custom:petkit-puramax-card",title:"PETKIT PURAMAX",device_entities:{error:"sensor.example_petkit_error",last_event:"sensor.example_petkit_last_event",state:"sensor.example_petkit_state",total_use:"sensor.example_petkit_total_use"},cats:[{name:"Example Cat",color:"#4fc3f7"}]}}setConfig(t){if(!t)throw new Error("petkit-puramax-card: config is required");if(!t.device_entities)throw new Error('petkit-puramax-card: "device_entities" is required in config');if(!t.device_entities.total_use)throw new Error('petkit-puramax-card: "device_entities.total_use" is required in config');if(!t.cats)throw new Error('petkit-puramax-card: "cats" is required in config');if(!Array.isArray(t.cats)||t.cats.length<1)throw new Error('petkit-puramax-card: "cats" must be a non-empty array');if(t.cats.length>1&&!t.device_entities.last_used_by)throw new Error('petkit-puramax-card: "device_entities.last_used_by" is required in config when more than one cat is configured');t.cats.forEach((e,o)=>{if(!e||!e.name)throw new Error(`petkit-puramax-card: cats[${o}].name is required`);if(!e.color)throw new Error(`petkit-puramax-card: cats[${o}].color is required`)}),this._config=t,this._dayOffset=0,this._analytics=null,this._chartData=null,this._loadingChart=!1,this._loadingAnalytics=!1,this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}set hass(t){let e=this._hass;if(this._hass=t,!this._built){this._built=!0,this._render(),this._loadDay(),this._loadAnalytics(),this._startNoVisitTimer();return}this._updateLiveValues(),this._maybeRefreshOnNewVisit(e)}get hass(){return this._hass}getCardSize(){return 14}connectedCallback(){this._hass&&!this._built&&(this._built=!0,this._render(),this._loadDay(),this._loadAnalytics(),this._startNoVisitTimer())}disconnectedCallback(){this._noVisitTimer&&(clearInterval(this._noVisitTimer),this._noVisitTimer=null)}_startNoVisitTimer(){this._noVisitTimer||(this._noVisitTimer=setInterval(()=>this._checkNoVisitAlerts(),300*1e3))}_maybeRefreshOnNewVisit(t){if(!t)return;let e=this._config.device_entities.total_use,o=t.states[e],n=this._hass.states[e];n&&(!o||o.last_changed!==n.last_changed)&&(this._dayOffset===0&&this._loadDay(),this._loadAnalytics())}_s(t,e){return J(this._hass,t,e)}async _fetchVisits({start:t,end:e}){let o=this._config,n=T({startTime:t,endTime:e,entityIds:[o.device_entities.total_use]}),a=[this._hass.callWS(n)];if(o.cats.length>1){let d=T({startTime:t,endTime:e,entityIds:[o.device_entities.last_used_by],includeStartTimeState:!0});a.push(this._hass.callWS(d))}let s={},r={};try{let[d,m]=await Promise.all(a);s=d||{},r=m||{}}catch{}let c=U(s[o.device_entities.total_use],{minDelta:0,maxDelta:st}),u;if(o.cats.length>1){let d=o.cats.map(p=>p.name),m=z(r[o.device_entities.last_used_by],d);u=P(c,m)}else u=c.map(d=>({...d,cat:o.cats[0].name}));let h=new Map(o.cats.map(d=>[d.name,d]));return u.map(d=>({cat:d.cat===w?this._unknownCat():h.get(d.cat)||null,duration:d.value,ts:d.ts}))}_unknownCat(){return{name:w,color:this._config.unknown_cat_color||I}}async _loadDay(){if(!this._hass)return;this._loadingChart=!0,this._renderChartArea();let t=this._config,{start:e,end:o}=k(this._dayOffset),n=[],a=[];try{let[s,r]=await Promise.all([this._fetchVisits({start:e,end:o}),t.device_entities.last_event?this._hass.callWS(T({startTime:e,endTime:o,entityIds:[t.device_entities.last_event]})):Promise.resolve({})]);n=s,a=(r||{})[t.device_entities.last_event]||[]}catch{n=[],a=[]}this._chartVisits=n,this._chartEventHist=a,this._loadingChart=!1,this._renderChartArea()}async _loadAnalytics(){if(!this._hass)return;this._loadingAnalytics=!0,this._renderAnalyticsArea();let t=this._config,e=new Date,o=new Date(e.getTime()-168*3600*1e3),n=[];try{n=await this._fetchVisits({start:o,end:e})}catch{n=[]}let a=N(e.getTime()),s={};t.cats.forEach(r=>{let c=n.filter(d=>d.cat===r).map(d=>({value:d.duration,ts:d.ts})),u=K(c,{dayKeyFn:N}),h=c.length?Math.max(...c.map(d=>d.ts)):null;s[r.name]={...G(u,a),lastVisitTs:h}}),this._analytics=s,this._loadingAnalytics=!1,this._checkNoVisitAlerts(),this._renderAnalyticsArea()}_checkNoVisitAlerts(){if(!this._analytics||!this._built)return;let t=this._config,e=t.no_visit_alert_hours??at,o=Date.now();this._notifiedCats||(this._notifiedCats=new Set),t.cats.forEach(n=>{let a=this._analytics[n.name];if(!a)return;let s=X({lastVisitTs:a.lastVisitTs,now:o,thresholdHours:e});a.noVisitAlert=s;let r=this._notifiedCats.has(n.name);s.alerting&&!r?(this._notifiedCats.add(n.name),this._sendNoVisitNotification(n,s)):!s.alerting&&r&&this._notifiedCats.delete(n.name)}),this._renderAnalyticsArea()}_sendNoVisitNotification(t,e){let o=this._config.notify_service;if(!o||!this._hass)return;let n=o.indexOf(".");if(n===-1)return;let a=o.slice(0,n),s=o.slice(n+1);if(a!=="notify"||!s)return;let r=e.hoursSince==null?`${t.name} hasn't used the litter box yet in the tracked history.`:`${t.name} hasn't used the litter box in over ${Math.floor(e.hoursSince)}h.`;L(this._hass,"notify",s,{message:r,title:"Litter box alert"})}_render(){let t=this._config;this.shadowRoot.innerHTML=`
      <style>${Z}</style>
      <ha-card>
        <div class="header">
          <div class="title">${t.title||ot}</div>
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
    `,this.shadowRoot.getElementById("prev-day").addEventListener("click",()=>this._changeDay(-1)),this.shadowRoot.getElementById("next-day").addEventListener("click",()=>this._changeDay(1)),this._updateLiveValues(),this._renderChartArea(),this._renderAnalyticsArea()}_changeDay(t){this._dayOffset+=t,this._dayOffset>0&&(this._dayOffset=0),this._loadDay()}_updateLiveValues(){if(!this._built)return;let t=this._config,e=t.device_entities,o=this.shadowRoot.getElementById("status-row");if(o){let a=this._s(e.error,"no_error"),s=a&&a!=="no_error",r=t.info_row||[];o.innerHTML=[...r.map(c=>this._renderInfoChip(c)),s?this._chip("mdi:alert","Error",a.replace(/_/g," "),!0):""].join("")}let n=this.shadowRoot.getElementById("controls-row");if(n&&!n.dataset.bound){let a=t.controls_row||[];n.innerHTML=a.map((s,r)=>`
      <ha-control-button class="ctrl-btn" id="ctrl-${r}" label="${_(s.name||"")}">
        <div class="ctrl-btn-content">
          <ha-icon icon="${_(s.icon||"mdi:help")}"></ha-icon>
          <span>${_(s.name||"")}</span>
        </div>
      </ha-control-button>
    `).join(""),n.dataset.bound="1",a.forEach((s,r)=>{this.shadowRoot.getElementById(`ctrl-${r}`).addEventListener("click",()=>this._runControlAction(s))})}}_renderInfoChip(t){let e=this._s(t.entity,null),{display:o,warn:n}=Y(t,e);return this._chip(t.icon||"mdi:information-outline",t.name||t.entity,o,n)}_runControlAction(t){switch(t.action){case"press":{t.confirm?window.confirm(t.confirm)&&A(this._hass,t.entity):A(this._hass,t.entity);break}case"toggle_maintenance":{let e=t.state_entity||this._config.device_entities.state;this._s(e,"")==="maintenance"?A(this._hass,t.exit_entity):A(this._hass,t.start_entity);break}case"toggle":{L(this._hass,"homeassistant","toggle",{entity_id:t.entity});break}case"more_info":{Q(this,t.entity);break}default:break}}_chip(t,e,o,n){return`
      <div class="chip ${n?"warn":""}">
        <ha-icon icon="${_(t)}"></ha-icon>
        <div class="chip-text"><div class="chip-label">${_(e)}</div><div class="chip-value">${_(o)}</div></div>
      </div>`}_renderChartArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("day-label");t&&(t.textContent=M(this._dayOffset));let e=this.shadowRoot.getElementById("next-day");e&&(e.disabled=this._dayOffset>=0);let o=this.shadowRoot.getElementById("chart-area"),n=this.shadowRoot.getElementById("records-list"),a=this.shadowRoot.getElementById("usage-body");if(!o||this._loadingChart)return;let s=this._config,r=(this._chartVisits||[]).filter(l=>l.cat).sort((l,f)=>l.ts-f.ts),c=it,u=rt,h=ct,d=Math.max(60,...r.map(l=>l.duration)),m=W(d),p=Math.ceil(d/m)*m,{start:v}=k(this._dayOffset),{xFor:$,yFor:lt}=j({dayStart:v,niceMax:p,width:c,height:u,padding:h}),{vertical:B,horizontal:O}=q({niceMax:p,yStep:m,width:c,height:u,padding:h}),dt=B.map(l=>`<line x1="${l.x}" y1="${h.top}" x2="${l.x}" y2="${u-h.bottom}" class="grid-line-v" />`).join(""),ht=O.map(l=>`<line x1="${h.left}" y1="${l.y}" x2="${c-h.right}" y2="${l.y}" class="grid-line-h" />`).join(""),ut=(u-h.bottom)/u*100,pt=B.map(l=>`<div class="axis-label" style="left:${l.x/c*100}%;top:${ut}%">${l.label}</div>`).join(""),mt=h.left/c*100,ft=O.map(l=>`<div class="axis-label-y" style="top:${l.y/u*100}%;width:${mt}%">${l.label}</div>`).join(""),_t=r.map((l,f)=>{let g=$(l.ts),y=lt(l.duration),x=u-h.bottom;return`<line x1="${g}" y1="${x}" x2="${g}" y2="${y}" stroke="${l.cat.color}" stroke-width="2" />
              <circle class="visit-point" cx="${g}" cy="${y}" r="5" fill="${l.cat.color}" />
              <line class="visit-hit" data-idx="${f}" x1="${g}" y1="${x}" x2="${g}" y2="${y}" stroke="transparent" stroke-width="16" />`}).join("");o.innerHTML=`
      <div class="chart-wrap">
        <svg viewBox="0 0 ${c} ${u}" class="chart-svg">
          ${ht}
          ${dt}
          ${_t||""}
        </svg>
        ${pt}
        ${ft}
        <div class="chart-tooltip" id="chart-tooltip"></div>
      </div>
      ${r.length===0?'<div class="empty-note">No visits recorded this day</div>':""}
    `;let C=this.shadowRoot.getElementById("chart-tooltip"),gt=o.querySelector(".chart-wrap");if(o.querySelectorAll(".visit-hit").forEach(l=>{l.addEventListener("mouseenter",()=>{let f=r[parseInt(l.dataset.idx,10)],g=new Date(f.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"});C.textContent=`${g} \xB7 ${f.cat.name} \xB7 ${E(f.duration)}`;let y=l.getBoundingClientRect(),x=gt.getBoundingClientRect();C.style.left=`${y.left-x.left+y.width/2}px`,C.style.top=`${y.top-x.top}px`,C.classList.add("visible")}),l.addEventListener("mouseleave",()=>{C.classList.remove("visible")})}),a){let l={};s.cats.forEach(b=>{l[b.name]={count:0}});let f=0,g=I;r.forEach(b=>{b.cat.name===w?(f+=1,g=b.cat.color):l[b.cat.name].count+=1});let y=r.length,x=s.cats.map(b=>{let xt=l[b.name];return`<span class="usage-cat"><span class="dot" style="background:${b.color}"></span>${b.name}: ${xt.count}</span>`}).join("")+(f>0?`<span class="usage-cat"><span class="dot" style="background:${g}"></span>${w}: ${f}</span>`:"");a.innerHTML=`
        <div class="usage-row">
          <div class="stat-value">${y} time${y===1?"":"s"}</div>
          <div class="usage-cats">${x}</div>
        </div>
      `}let vt=this._chartEventHist||[],yt=this._eventLabels(),bt=(s.event_exclude||et).map(l=>String(l).toLowerCase()),D=vt.map(l=>{let f=l.s??l.state,g=l.lu?l.lu*1e3:l.last_changed?Date.parse(l.last_changed):null;return!f||!g||bt.includes(f.toLowerCase())?null:{ts:g,icon:"mdi:information-outline",color:"var(--secondary-text-color)",text:yt[f]||f}}).filter(Boolean);D.sort((l,f)=>f.ts-l.ts),n&&(D.length===0?n.innerHTML='<div class="empty-note">No records for this day</div>':n.innerHTML=D.map(l=>`
          <div class="record-row">
            <div class="record-time">${new Date(l.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</div>
            <ha-icon icon="${_(l.icon)}" style="color:${_(l.color)}"></ha-icon>
            <div class="record-text">${_(l.text)}</div>
          </div>
        `).join(""))}_eventLabels(){return{...tt,...this._config.event_labels||{}}}_renderAnalyticsArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("analytics-grid"),e=this.shadowRoot.getElementById("decline-banner"),o=this.shadowRoot.getElementById("no-visit-banner");if(!t||this._loadingAnalytics||!this._analytics)return;let n=this._config,a=(n.decline_threshold_pct||nt)/100,s=[];if(t.innerHTML=n.cats.map(r=>{let c=this._analytics[r.name]||{};return c.daysOfHistory>=3&&c.avg7dTotal&&new Date().getHours()>=18&&(c.todayTotal<a*c.avg7dTotal?s.push(`${r.name}'s usage today is well below their recent average \u2014 worth a check.`):c.todayTotal>(2-a)*c.avg7dTotal&&s.push(`${r.name}'s usage today is well above their recent average \u2014 worth a check.`)),`
        <div class="cat-analytics">
          <table>
            <colgroup>
              <col class="col-name" /><col class="col-stat" /><col class="col-stat" /><col class="col-stat" />
            </colgroup>
            <tr><td class="cat-name-cell"><span class="dot" style="background:${_(r.color)}"></span>${_(r.name)}</td><td>Today</td><td>3d avg</td><td>7d avg</td></tr>
            <tr><td>Visits</td><td>${c.todayCount??0}</td><td>${c.avg3dVisits!==null&&c.avg3dVisits!==void 0?c.avg3dVisits.toFixed(1):"\u2014"}</td><td>${c.avg7dVisits!==null&&c.avg7dVisits!==void 0?c.avg7dVisits.toFixed(1):"\u2014"}</td></tr>
            <tr><td>Duration</td><td>${c.todayAvgDuration?E(c.todayAvgDuration):"\u2014"}</td><td>${c.avg3dDuration?E(c.avg3dDuration):"\u2014"}</td><td>${c.avg7dDuration?E(c.avg7dDuration):"\u2014"}</td></tr>
          </table>
        </div>
      `}).join(""),e&&(e.innerHTML=s.length?s.map(r=>`<div class="warn-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${r}</div>`).join(""):""),o){let r=n.cats.filter(c=>this._analytics[c.name]?.noVisitAlert?.alerting);o.innerHTML=r.length?r.map(c=>{let{hoursSince:u}=this._analytics[c.name].noVisitAlert,h=u==null?"no visits recorded yet":`last seen ${V(u)} ago`;return`<div class="no-visit-banner"><ha-icon icon="mdi:cat-alert"></ha-icon>${_(c.name)} hasn't used the litter box recently (${_(h)}).</div>`}).join(""):""}}};var At=[{type:"grid",schema:[{name:"name",label:"Name",selector:{text:{}}},{name:"color",label:"Color",selector:{ui_color:{}}}]}],kt={name:"",color:"#4fc3f7"},Tt=[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"unit",label:"Unit",selector:{text:{}}},{name:"warn_below",label:"Warn below",selector:{number:{mode:"box"}}},{name:"warn_above",label:"Warn above",selector:{number:{mode:"box"}}},{name:"warn_state",label:"Warn state",selector:{text:{}}}],Lt={entity:"",name:"",icon:"mdi:information-outline"},Rt=["press","toggle_maintenance","toggle","more_info"],St=[{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"action",label:"Action",selector:{select:{options:Rt,mode:"dropdown"}}}],$t={press:[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"confirm",label:"Confirm text (optional)",selector:{text:{}}}],toggle:[{name:"entity",label:"Entity",selector:{entity:{}}}],more_info:[{name:"entity",label:"Entity",selector:{entity:{}}}],toggle_maintenance:[{name:"start_entity",label:"Start entity",selector:{entity:{domain:"button"}}},{name:"exit_entity",label:"Exit entity",selector:{entity:{domain:"button"}}},{name:"state_entity",label:"State entity (optional)",selector:{entity:{}}}]};function Dt(i){return[...St,...$t[i]||[]]}var Nt={name:"",icon:"mdi:gesture-tap-button",action:"press",entity:""},It=[{name:"title",label:"Title",selector:{text:{}}},{name:"device_entities",type:"expandable",title:"Device entities",schema:[{name:"total_use",label:"Total use sensor (required)",selector:{entity:{}}},{name:"last_used_by",label:"Last used by sensor (required if more than one cat)",selector:{entity:{}}},{name:"error",label:"Error sensor",selector:{entity:{}}},{name:"last_event",label:"Last event sensor",selector:{entity:{}}},{name:"state",label:"State sensor",selector:{entity:{}}}]},{name:"alerts",type:"expandable",flatten:!0,title:"Analytics & alerts",schema:[{name:"decline_threshold_pct",label:"Decline/spike alert threshold (%)",selector:{number:{min:10,max:100,mode:"box"}}},{name:"no_visit_alert_hours",label:"Warn if no visit in (hours)",selector:{number:{min:1,max:168,mode:"box"}}},{name:"notify_service",label:"Push a notification too (optional)",selector:{entity:{domain:"notify"}}},{name:"unknown_cat_color",label:"Unidentified-visit color (chart & analytics)",selector:{ui_color:{}}}]}],S=class extends HTMLElement{setConfig(t){let e=t||{},o=!this.shadowRoot||this._structureKey(e)!==this._lastStructureKey;this._config=e,o?this._render():this._updateFormsInPlace()}set hass(t){this._hass=t,(this._formEls||[]).forEach(e=>{e.hass=t})}get hass(){return this._hass}connectedCallback(){this._render()}_fireConfigChanged(t){this._config=t,this.dispatchEvent(new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:t}}))}_structureKey(t){return JSON.stringify({cats:(t.cats||[]).length,info_row:(t.info_row||[]).length,controls_row:(t.controls_row||[]).map(e=>e&&e.action||null)})}_capturePanelExpanded(){if(!this.shadowRoot)return null;let t=this.shadowRoot.querySelectorAll("ha-expansion-panel");return t.length?Array.from(t).map(e=>e.expanded):null}_restorePanelExpanded(t){if(!t)return;this.shadowRoot.querySelectorAll("ha-expansion-panel").forEach((o,n)=>{t[n]!==void 0&&(o.expanded=t[n])})}_updateFormsInPlace(){this._mainForm&&(this._mainForm.data=this._config);let t=this._config.cats||[];(this._catForms||[]).forEach((n,a)=>{t[a]&&(n.data=t[a])});let e=this._config.info_row||[];(this._infoForms||[]).forEach((n,a)=>{e[a]&&(n.data=e[a])});let o=this._config.controls_row||[];(this._controlForms||[]).forEach((n,a)=>{o[a]&&(n.data=o[a])})}_render(){if(this.shadowRoot||this.attachShadow({mode:"open"}),!this._config)return;let t=this._capturePanelExpanded();this._formEls=[],this._catForms=[],this._infoForms=[],this._controlForms=[];let e=(this._config.cats||[]).length,o=(this._config.info_row||[]).length,n=(this._config.controls_row||[]).length;this.shadowRoot.innerHTML=`
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
    `,this._renderMainForm(),this._renderCats(),this._renderInfoRows(),this._renderControlsRows(),this._restorePanelExpanded(t),this._lastStructureKey=this._structureKey(this._config),this.shadowRoot.getElementById("add-cat").addEventListener("click",()=>this._addCat()),this.shadowRoot.getElementById("add-info-row").addEventListener("click",()=>this._addInfoRow()),this.shadowRoot.getElementById("add-control-row").addEventListener("click",()=>this._addControlRow())}_removeIconButton(t){let e=document.createElement("ha-icon-button");e.className="remove-btn",e.label="Remove";let o=document.createElement("ha-icon");return o.setAttribute("icon","mdi:delete-outline"),e.appendChild(o),e.addEventListener("click",t),e}_renderCats(){let t=this.shadowRoot.getElementById("cats-rows");t.innerHTML="",(this._config.cats||[]).forEach((o,n)=>{let a=document.createElement("div");a.className="row",a.dataset.index=String(n);let s=document.createElement("ha-form");s.schema=At,s.data=o,s.hass=this._hass,s.computeLabel=r=>r.label||r.name,s.addEventListener("value-changed",r=>{r.stopPropagation(),this._updateCat(n,r.detail.value)}),this._formEls.push(s),this._catForms.push(s),a.appendChild(s),a.appendChild(this._removeIconButton(()=>this._removeCat(n))),t.appendChild(a)})}_updateCat(t,e){let o=[...this._config.cats||[]];o[t]=e,this._fireConfigChanged({...this._config,cats:o})}_addCat(){let t=[...this._config.cats||[],{...kt}];this._fireConfigChanged({...this._config,cats:t}),this._render()}_removeCat(t){let e=(this._config.cats||[]).filter((o,n)=>n!==t);this._fireConfigChanged({...this._config,cats:e}),this._render()}_renderInfoRows(){let t=this.shadowRoot.getElementById("info-rows");t.innerHTML="",(this._config.info_row||[]).forEach((o,n)=>{let a=document.createElement("div");a.className="row",a.dataset.index=String(n);let s=document.createElement("ha-form");s.schema=Tt,s.data=o,s.hass=this._hass,s.computeLabel=r=>r.label||r.name,s.addEventListener("value-changed",r=>{r.stopPropagation(),this._updateInfoRow(n,r.detail.value)}),this._formEls.push(s),this._infoForms.push(s),a.appendChild(s),a.appendChild(this._removeIconButton(()=>this._removeInfoRow(n))),t.appendChild(a)})}_updateInfoRow(t,e){let o=[...this._config.info_row||[]];o[t]=e,this._fireConfigChanged({...this._config,info_row:o})}_addInfoRow(){let t=[...this._config.info_row||[],{...Lt}];this._fireConfigChanged({...this._config,info_row:t}),this._render()}_removeInfoRow(t){let e=(this._config.info_row||[]).filter((o,n)=>n!==t);this._fireConfigChanged({...this._config,info_row:e}),this._render()}_renderControlsRows(){let t=this.shadowRoot.getElementById("controls-rows");t.innerHTML="",this._controlForms=[],(this._config.controls_row||[]).forEach((o,n)=>{let a=document.createElement("div");a.className="row",a.dataset.index=String(n);let s=document.createElement("ha-form");s.schema=Dt(o.action),s.data=o,s.hass=this._hass,s.computeLabel=r=>r.label||r.name,s.addEventListener("value-changed",r=>{r.stopPropagation(),this._updateControlRow(n,r.detail.value)}),this._formEls.push(s),this._controlForms.push(s),a.appendChild(s),a.appendChild(this._removeIconButton(()=>this._removeControlRow(n))),t.appendChild(a)})}_updateControlRow(t,e){let o=[...this._config.controls_row||[]],n=o[t]&&o[t].action;o[t]=e,this._fireConfigChanged({...this._config,controls_row:o}),e.action!==n&&(this._renderControlsRows(),this._lastStructureKey=this._structureKey(this._config))}_addControlRow(){let t=[...this._config.controls_row||[],{...Nt}];this._fireConfigChanged({...this._config,controls_row:t}),this._render()}_removeControlRow(t){let e=(this._config.controls_row||[]).filter((o,n)=>n!==t);this._fireConfigChanged({...this._config,controls_row:e}),this._render()}_renderMainForm(){let t=this.shadowRoot.getElementById("main-section"),e=document.createElement("ha-form");e.schema=It,e.data=this._config,e.hass=this._hass,e.computeLabel=o=>o.label||o.name,e.addEventListener("value-changed",o=>{o.stopPropagation(),this._fireConfigChanged(o.detail.value)}),this._formEls.push(e),this._mainForm=e,t.appendChild(e)}};customElements.get("petkit-puramax-card")||customElements.define("petkit-puramax-card",R);customElements.get("petkit-puramax-card-editor")||customElements.define("petkit-puramax-card-editor",S);var H=window;H.customCards=H.customCards||[];H.customCards.push({type:"petkit-puramax-card",name:"PETKIT PURAMAX Card",description:"Configurable card for PETKIT PURAMAX litter box monitoring, controls, and per-cat visit analytics."});
//# sourceMappingURL=petkit-puramax-card.js.map
