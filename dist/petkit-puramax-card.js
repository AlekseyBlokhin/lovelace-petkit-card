function A(a){let t=Math.round(a||0);if(t<60)return`${t}s`;let e=Math.floor(t/60),o=t%60;return`${e}m${o.toString().padStart(2,"0")}s`}function W(a){let t=Math.round(a||0),e=Math.floor(t/60),o=t%60;return`${e.toString().padStart(2,"0")}'${o.toString().padStart(2,"0")}"`}function j(a){let t=Math.floor(a);return t<1?"under 1h":t<48?`${t}h`:`${Math.floor(t/24)}d`}function _(a){return String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function T(a,t=new Date){let e=new Date(t.getFullYear(),t.getMonth(),t.getDate());e.setDate(e.getDate()+a);let o=new Date(e);return o.setDate(o.getDate()+1),{start:e,end:o}}function K(a,t=new Date){if(a===0)return"Today";if(a===-1)return"Yesterday";let{start:e}=T(a,t);return e.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"})}function V(a){let t=new Date(a);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`}function S({startTime:a,endTime:t,entityIds:e,includeStartTimeState:o=!1}){let i=a instanceof Date?a.toISOString():a,n=t instanceof Date?t.toISOString():t;return{type:"history/history_during_period",start_time:i,end_time:n,entity_ids:e,minimal_response:!1,no_attributes:!0,include_start_time_state:o}}function kt(a){if(!a)return null;let t=a.s??a.state,e=parseFloat(t),o=a.lu?a.lu*1e3:a.last_changed?Date.parse(a.last_changed):null;return!Number.isFinite(e)||!o||Number.isNaN(o)?null:{value:e,ts:o}}function q(a,{minDelta:t=0,maxDelta:e=1/0}={}){if(!Array.isArray(a))return[];let o=a.map(kt).filter(Boolean).sort((n,s)=>n.ts-s.ts),i=[];for(let n=1;n<o.length;n++){let s=o[n].value-o[n-1].value;if(s<=t||s>=e)continue;let r=o[n+1];r&&r.value===o[n-1].value||i.push({value:s,ts:o[n].ts})}return i}var At="unknown_pet",w="Unknown";function G(a,t){if(!Array.isArray(a))return[];let e=new Set(t),o=[];for(let i of a){let n=i.s??i.state,s;if(e.has(n))s=n;else if(n===At)s=w;else continue;let r=i.lu?i.lu*1e3:i.last_changed?Date.parse(i.last_changed):null;!r||Number.isNaN(r)||o.push({cat:s,ts:r})}return o.sort((i,n)=>i.ts-n.ts),o}function X(a,t){let e=a.length,o=new Array(e).fill(null),i=0,n=null;for(let s=0;s<e;s++){let r=a[s].ts,l=s===0?-1/0:(a[s-1].ts+r)/2,u=s===e-1?1/0:(r+a[s+1].ts)/2;for(;i<t.length&&t[i].ts<l;)n=t[i].cat,i++;let d=null,p=1/0;for(;i<t.length&&t[i].ts<u;){let c=Math.abs(t[i].ts-r);c<p&&(p=c,d=t[i].cat),n=t[i].cat,i++}o[s]=d!==null?d:n}return a.map((s,r)=>({...s,cat:o[r]}))}var Rt=[10,15,30,60,120,180,300,600,900,1800,3600];function Y(a){for(let t of Rt)if(a/t<=5)return t;return Math.ceil(a/5/60)*60}function Z({dayStart:a,niceMax:t,width:e,height:o,padding:i}){let{left:n,right:s,top:r,bottom:l}=i,u=e-n-s,d=o-r-l,p=a.getTime();return{xFor:m=>{let v=(m-p)/36e5;return n+v/24*u},yFor:m=>t?o-l-m/t*d:o-l}}function J({niceMax:a,yStep:t,width:e,height:o,padding:i}){let{left:n,right:s,top:r,bottom:l}=i,u=e-n-s,d=o-r-l,p=[4,8,12,16,20].map(h=>({hour:h,x:n+h/24*u,label:`${h.toString().padStart(2,"0")}:00`})),c=[];if(t>0)for(let h=0;h<=a;h+=t){let m=a?o-l-h/a*d:o-l;c.push({value:h,y:m,label:W(h)})}return{vertical:p,horizontal:c}}function Q(a,{dayKeyFn:t}){let e={};for(let o of a||[]){let i=t(o.ts);e[i]||(e[i]={count:0,total:0}),e[i].count+=1,e[i].total+=o.value}return e}function tt(a,t){let e=Object.keys(a).filter(d=>d!==t).sort(),o=e.slice(-3),i=e.slice(-7),n=(d,p)=>d.length?d.reduce((c,h)=>c+a[h][p],0)/d.length:null,s=d=>{if(!d.length)return null;let p=d.reduce((h,m)=>h+a[m].total,0),c=d.reduce((h,m)=>h+a[m].count,0);return c>0?p/c:null},r=a[t],l=r?r.count:0,u=r?r.total:0;return{todayCount:l,todayTotal:u,todayAvgDuration:l>0?u/l:null,avg3dVisits:n(o,"count"),avg3dTotal:n(o,"total"),avg3dDuration:s(o),avg7dVisits:n(i,"count"),avg7dTotal:n(i,"total"),avg7dDuration:s(i),daysOfHistory:e.length}}function et({lastVisitTs:a,now:t,thresholdHours:e}){let o=t instanceof Date?t.getTime():t;if(a==null)return{alerting:!0,hoursSince:null};let i=(o-a)/36e5;return{alerting:i>=e,hoursSince:i}}function ot(a,t){let e=t;a.value_map&&t in a.value_map?e=a.value_map[t]:t!==null&&a.unit&&(e=`${t}${a.unit}`),e==null&&(e="\u2014");let o=parseFloat(t),i=!1;return a.warn_below!==void 0&&Number.isFinite(o)&&(i=o<a.warn_below),a.warn_above!==void 0&&Number.isFinite(o)&&(i=i||o>a.warn_above),a.warn_state!==void 0&&(i=i||t===a.warn_state),{display:e,warn:i}}function it(a,t,e){return!t||!a||!a.states||!a.states[t]?e:a.states[t].state}function D(a,t){let e=new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}});a.dispatchEvent(e)}function H(a,t,e,o){a.callService(t,e,o)}function R(a,t){t&&H(a,"button","press",{entity_id:t})}var Lt={total_use:["total_use","total_time"],last_used_by:["last_used_by"],error:["error","error_message"],last_event:["max_last_event","litter_last_event"],state:["max_work_state","litter_state"]};function nt(a,t){let e={};if(!t||!a||!a.entities)return e;let o=Object.values(a.entities).filter(i=>i.device_id===t&&i.entity_id.startsWith("sensor."));for(let[i,n]of Object.entries(Lt)){let s=o.find(r=>n.includes(r.translation_key));s&&(e[i]=s.entity_id)}return e}var Tt=new Set(["primary","accent","red","pink","purple","deep-purple","indigo","blue","light-blue","cyan","teal","green","light-green","lime","yellow","amber","orange","deep-orange","brown","light-grey","grey","dark-grey","blue-grey","black","white"]);function L(a){return a&&(Tt.has(a)?`var(--${a}-color)`:a)}var st=`
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
`;var at={maintenance_mode:"Maintenance mode",manual_odor_completed:"Manual odor removal done",auto_cleaning_completed:"Auto cleaning done"},rt=["unavailable","unknown","no_events_yet"],M="#9e9e9e",lt="PETKIT PURAMAX",ct=60,dt=8,ht=1800,ut=600,pt=240,mt={left:46,right:10,top:10,bottom:28};var $=class extends HTMLElement{static getConfigElement(){return document.createElement("petkit-puramax-card-editor")}static getStubConfig(t){let e=t&&t.entities?Object.values(t.entities).find(o=>o.platform==="petkit"):null;return{type:"custom:petkit-puramax-card",title:"PETKIT PURAMAX",device_id:e?e.device_id:"",cats:[{name:"My Cat",color:"blue"}]}}setConfig(t){if(!t)throw new Error("petkit-puramax-card: config is required");let e=t.device_id!==void 0;if(!e&&!t.device_entities)throw new Error('petkit-puramax-card: "device_entities" is required in config (or set "device_id")');let o=t.device_entities||{};if(!e&&!o.total_use)throw new Error('petkit-puramax-card: "device_entities.total_use" is required in config (or set "device_id")');if(!t.cats)throw new Error('petkit-puramax-card: "cats" is required in config');if(!Array.isArray(t.cats)||t.cats.length<1)throw new Error('petkit-puramax-card: "cats" must be a non-empty array');if(!e&&t.cats.length>1&&!o.last_used_by)throw new Error('petkit-puramax-card: "device_entities.last_used_by" is required in config when more than one cat is configured (or set "device_id")');t.cats.forEach((i,n)=>{if(!i||!i.name)throw new Error(`petkit-puramax-card: cats[${n}].name is required`);if(!i.color)throw new Error(`petkit-puramax-card: cats[${n}].color is required`)}),this._config={...t,device_entities:o},this._dayOffset=0,this._analytics=null,this._chartData=null,this._loadingChart=!1,this._loadingAnalytics=!1,this._deviceEntities=this._resolveDeviceEntities(),this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}_resolveDeviceEntities(){return{...nt(this._hass,this._config.device_id),...this._config.device_entities}}_configError(){if(this._config.device_id===void 0)return null;let t=!this._config.device_id;return this._deviceEntities.total_use?this._config.cats.length>1&&!this._deviceEntities.last_used_by?t?'A PetKit device is required (or set "device_entities.last_used_by" manually) since more than one cat is configured.':'Could not auto-detect a "last used by" sensor on the selected device (required for more than one cat). Set "device_entities.last_used_by" in the config to override.':null:t?'A PetKit device is required. Select one in the card editor, or set "device_entities.total_use" manually.':'Could not auto-detect a "total use" sensor on the selected device. Set "device_entities.total_use" in the config to override.'}_renderError(t){this.shadowRoot||this.attachShadow({mode:"open"}),this.shadowRoot.innerHTML=`<ha-card><div style="padding: 16px;"><ha-alert alert-type="error">${_(t)}</ha-alert></div></ha-card>`}set hass(t){let e=this._hass;if(this._hass=t,this._deviceEntities=this._resolveDeviceEntities(),!this._built){this._built=!0,this._build();return}this._updateLiveValues(),this._maybeRefreshOnNewVisit(e)}get hass(){return this._hass}getCardSize(){return 14}_build(){let t=this._configError();if(t){this._renderError(t);return}this._render(),this._loadDay(),this._loadAnalytics(),this._startNoVisitTimer()}connectedCallback(){this._hass&&!this._built&&(this._built=!0,this._build())}disconnectedCallback(){this._noVisitTimer&&(clearInterval(this._noVisitTimer),this._noVisitTimer=null)}_startNoVisitTimer(){this._noVisitTimer||(this._noVisitTimer=setInterval(()=>this._checkNoVisitAlerts(),300*1e3))}_maybeRefreshOnNewVisit(t){if(!t)return;let e=this._deviceEntities.total_use,o=t.states[e],i=this._hass.states[e];i&&(!o||o.last_changed!==i.last_changed)&&(this._dayOffset===0&&this._loadDay(),this._loadAnalytics())}_s(t,e){return it(this._hass,t,e)}async _fetchVisits({start:t,end:e}){let o=this._config,i=this._deviceEntities,n=S({startTime:t,endTime:e,entityIds:[i.total_use]}),s=[this._hass.callWS(n)];if(o.cats.length>1){let c=S({startTime:t,endTime:e,entityIds:[i.last_used_by],includeStartTimeState:!0});s.push(this._hass.callWS(c))}let r={},l={};try{let[c,h]=await Promise.all(s);r=c||{},l=h||{}}catch{}let u=q(r[i.total_use],{minDelta:0,maxDelta:ht}),d;if(o.cats.length>1){let c=o.cats.map(m=>m.name),h=G(l[i.last_used_by],c);d=X(u,h)}else d=u.map(c=>({...c,cat:o.cats[0].name}));let p=new Map(o.cats.map(c=>[c.name,c]));return d.map(c=>({cat:c.cat===w?this._unknownCat():p.get(c.cat)||null,duration:c.value,ts:c.ts}))}_unknownCat(){return{name:w,color:this._config.unknown_cat_color||M}}async _loadDay(){if(!this._hass)return;this._loadingChart=!0,this._renderChartArea();let t=this._deviceEntities,{start:e,end:o}=T(this._dayOffset),i=[],n=[];try{let[s,r]=await Promise.all([this._fetchVisits({start:e,end:o}),t.last_event?this._hass.callWS(S({startTime:e,endTime:o,entityIds:[t.last_event]})):Promise.resolve({})]);i=s,n=(r||{})[t.last_event]||[]}catch{i=[],n=[]}this._chartVisits=i,this._chartEventHist=n,this._loadingChart=!1,this._renderChartArea()}async _loadAnalytics(){if(!this._hass)return;this._loadingAnalytics=!0,this._renderAnalyticsArea();let t=this._config,e=new Date,o=new Date(e.getTime()-168*3600*1e3),i=[];try{i=await this._fetchVisits({start:o,end:e})}catch{i=[]}let n=V(e.getTime()),s={};t.cats.forEach(r=>{let l=i.filter(p=>p.cat===r).map(p=>({value:p.duration,ts:p.ts})),u=Q(l,{dayKeyFn:V}),d=l.length?Math.max(...l.map(p=>p.ts)):null;s[r.name]={...tt(u,n),lastVisitTs:d}}),this._analytics=s,this._loadingAnalytics=!1,this._checkNoVisitAlerts(),this._renderAnalyticsArea()}_checkNoVisitAlerts(){if(!this._analytics||!this._built)return;let t=this._config,e=t.no_visit_alert_hours??dt,o=Date.now();this._notifiedCats||(this._notifiedCats=new Set),t.cats.forEach(i=>{let n=this._analytics[i.name];if(!n)return;let s=et({lastVisitTs:n.lastVisitTs,now:o,thresholdHours:e});n.noVisitAlert=s;let r=this._notifiedCats.has(i.name);s.alerting&&!r?(this._notifiedCats.add(i.name),this._sendNoVisitNotification(i,s)):!s.alerting&&r&&this._notifiedCats.delete(i.name)}),this._renderAnalyticsArea()}_sendNoVisitNotification(t,e){let o=this._config.notify_service;if(!o||!this._hass)return;let i=o.indexOf(".");if(i===-1)return;let n=o.slice(0,i),s=o.slice(i+1);if(n!=="notify"||!s)return;let r=e.hoursSince==null?`${t.name} hasn't used the litter box yet in the tracked history.`:`${t.name} hasn't used the litter box in over ${Math.floor(e.hoursSince)}h.`;H(this._hass,"notify",s,{message:r,title:"Litter box alert"})}_render(){let t=this._config;this.shadowRoot.innerHTML=`
      <style>${st}</style>
      <ha-card>
        <div class="header">
          <div class="title">${t.title||lt}</div>
          ${t.show_state!==!1?'<div class="state-badge" id="state-badge" hidden></div>':""}
        </div>
        <div class="status-row" id="status-row"></div>
        <div class="controls-row" id="controls-row"></div>
        ${t.show_history!==!1?`
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
        ${t.show_analytics!==!1?`
        <div class="analytics-section">
          <div class="section-title">Analytics</div>
          <div id="no-visit-banner"></div>
          <div id="decline-banner"></div>
          <div class="analytics-grid" id="analytics-grid"></div>
        </div>`:""}
        ${t.show_working_records!==!1?`
        <div class="records-section">
          <div class="section-title">Working Records</div>
          <div class="records-list" id="records-list"></div>
        </div>`:""}
      </ha-card>
    `;let e=this.shadowRoot.getElementById("prev-day"),o=this.shadowRoot.getElementById("next-day");e&&e.addEventListener("click",()=>this._changeDay(-1)),o&&o.addEventListener("click",()=>this._changeDay(1)),this._updateLiveValues(),this._renderChartArea(),this._renderAnalyticsArea()}_changeDay(t){this._dayOffset+=t,this._dayOffset>0&&(this._dayOffset=0),this._loadDay()}_updateLiveValues(){if(!this._built)return;let t=this._config,e=this._deviceEntities,o=this.shadowRoot.getElementById("state-badge");if(o){let s=this._s(e.state,null);if(o.hidden=!s,s&&(o.textContent=s.replace(/_/g," "),o.dataset.entity=e.state),!o.dataset.bound){o.dataset.bound="1",o.setAttribute("tabindex","0");let r=()=>{o.dataset.entity&&D(this,o.dataset.entity)};o.addEventListener("click",r),o.addEventListener("keydown",l=>{(l.key==="Enter"||l.key===" ")&&(l.preventDefault(),r())})}}let i=this.shadowRoot.getElementById("status-row");if(i){let s=this._s(e.error,"no_error"),r=s&&s!=="no_error",l=t.info_row||[];if(i.innerHTML=[...l.map(u=>this._renderInfoChip(u)),r?this._chip("mdi:alert","Error",s.replace(/_/g," "),!0,e.error):""].join(""),!i.dataset.bound){i.dataset.bound="1";let u=d=>{let p=d.target.closest(".chip[data-entity]");p&&D(this,p.dataset.entity)};i.addEventListener("click",u),i.addEventListener("keydown",d=>{(d.key==="Enter"||d.key===" ")&&(d.preventDefault(),u(d))})}}let n=this.shadowRoot.getElementById("controls-row");if(n&&!n.dataset.bound){let s=t.controls_row||[];n.innerHTML=s.map((r,l)=>`
      <ha-control-button class="ctrl-btn" id="ctrl-${l}" label="${_(r.name||"")}">
        <div class="ctrl-btn-content">
          <ha-icon icon="${_(r.icon||"mdi:help")}"></ha-icon>
          <span>${_(r.name||"")}</span>
        </div>
      </ha-control-button>
    `).join(""),n.dataset.bound="1",s.forEach((r,l)=>{this.shadowRoot.getElementById(`ctrl-${l}`).addEventListener("click",()=>this._runControlAction(r))})}}_renderInfoChip(t){let e=this._s(t.entity,null),{display:o,warn:i}=ot(t,e);return this._chip(t.icon||"mdi:information-outline",t.name||t.entity,o,i,t.entity)}_runControlAction(t){switch(t.action){case"press":{t.confirm?window.confirm(t.confirm)&&R(this._hass,t.entity):R(this._hass,t.entity);break}case"toggle_maintenance":{let e=t.state_entity||this._deviceEntities.state;this._s(e,"")==="maintenance"?R(this._hass,t.exit_entity):R(this._hass,t.start_entity);break}case"toggle":{H(this._hass,"homeassistant","toggle",{entity_id:t.entity});break}case"more_info":{D(this,t.entity);break}default:break}}_chip(t,e,o,i,n){let s=n?` data-entity="${_(n)}" tabindex="0"`:"";return`
      <div class="chip ${i?"warn":""} ${n?"tappable":""}"${s}>
        <ha-icon icon="${_(t)}"></ha-icon>
        <div class="chip-text"><div class="chip-label">${_(e)}</div><div class="chip-value">${_(o)}</div></div>
      </div>`}_renderChartArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("day-label");t&&(t.textContent=K(this._dayOffset));let e=this.shadowRoot.getElementById("next-day");e&&(e.disabled=this._dayOffset>=0);let o=this.shadowRoot.getElementById("chart-area"),i=this.shadowRoot.getElementById("records-list"),n=this.shadowRoot.getElementById("usage-body");if(this._loadingChart)return;let s=this._config,r=(this._chartVisits||[]).filter(c=>c.cat).sort((c,h)=>c.ts-h.ts);if(o){let c=ut,h=pt,m=mt,v=Math.max(60,...r.map(f=>f.duration)),x=Y(v),g=Math.ceil(v/x)*x,{start:I}=T(this._dayOffset),{xFor:ft,yFor:_t}=Z({dayStart:I,niceMax:g,width:c,height:h,padding:m}),{vertical:P,horizontal:z}=J({niceMax:g,yStep:x,width:c,height:h,padding:m}),gt=P.map(f=>`<line x1="${f.x}" y1="${m.top}" x2="${f.x}" y2="${h-m.bottom}" class="grid-line-v" />`).join(""),vt=z.map(f=>`<line x1="${m.left}" y1="${f.y}" x2="${c-m.right}" y2="${f.y}" class="grid-line-h" />`).join(""),yt=(h-m.bottom)/h*100,bt=P.map(f=>`<div class="axis-label" style="left:${f.x/c*100}%;top:${yt}%">${f.label}</div>`).join(""),wt=m.left/c*100,xt=z.map(f=>`<div class="axis-label-y" style="top:${f.y/h*100}%;width:${wt}%">${f.label}</div>`).join(""),Ct=r.map((f,E)=>{let y=ft(f.ts),b=_t(f.duration),k=h-m.bottom,U=L(f.cat.color);return`<line x1="${y}" y1="${k}" x2="${y}" y2="${b}" stroke="${U}" stroke-width="2" />
              <circle class="visit-point" cx="${y}" cy="${b}" r="5" fill="${U}" />
              <line class="visit-hit" data-idx="${E}" x1="${y}" y1="${k}" x2="${y}" y2="${b}" stroke="transparent" stroke-width="16" />`}).join("");o.innerHTML=`
      <div class="chart-wrap">
        <svg viewBox="0 0 ${c} ${h}" class="chart-svg">
          ${vt}
          ${gt}
          ${Ct||""}
        </svg>
        ${bt}
        ${xt}
        <div class="chart-tooltip" id="chart-tooltip"></div>
      </div>
      ${r.length===0?'<div class="empty-note">No visits recorded this day</div>':""}
    `;let C=this.shadowRoot.getElementById("chart-tooltip"),Et=o.querySelector(".chart-wrap");o.querySelectorAll(".visit-hit").forEach(f=>{f.addEventListener("mouseenter",()=>{let E=r[parseInt(f.dataset.idx,10)],y=new Date(E.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"});C.textContent=`${y} \xB7 ${E.cat.name} \xB7 ${A(E.duration)}`;let b=f.getBoundingClientRect(),k=Et.getBoundingClientRect();C.style.left=`${b.left-k.left+b.width/2}px`,C.style.top=`${b.top-k.top}px`,C.classList.add("visible")}),f.addEventListener("mouseleave",()=>{C.classList.remove("visible")})})}if(n){let c={};s.cats.forEach(g=>{c[g.name]={count:0}});let h=0,m=M;r.forEach(g=>{g.cat.name===w?(h+=1,m=g.cat.color):c[g.cat.name].count+=1});let v=r.length,x=s.cats.map(g=>{let I=c[g.name];return`<span class="usage-cat"><span class="dot" style="background:${L(g.color)}"></span>${g.name}: ${I.count}</span>`}).join("")+(h>0?`<span class="usage-cat"><span class="dot" style="background:${L(m)}"></span>${w}: ${h}</span>`:"");n.innerHTML=`
        <div class="usage-row">
          <div class="stat-value">${v} time${v===1?"":"s"}</div>
          <div class="usage-cats">${x}</div>
        </div>
      `}let l=this._chartEventHist||[],u=this._eventLabels(),d=(s.event_exclude||rt).map(c=>String(c).toLowerCase()),p=l.map(c=>{let h=c.s??c.state,m=c.lu?c.lu*1e3:c.last_changed?Date.parse(c.last_changed):null;return!h||!m||d.includes(h.toLowerCase())?null:{ts:m,icon:"mdi:information-outline",color:"var(--secondary-text-color)",text:u[h]||h}}).filter(Boolean);p.sort((c,h)=>h.ts-c.ts),i&&(p.length===0?i.innerHTML='<div class="empty-note">No records for this day</div>':i.innerHTML=p.map(c=>`
          <div class="record-row">
            <div class="record-time">${new Date(c.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</div>
            <ha-icon icon="${_(c.icon)}" style="color:${_(c.color)}"></ha-icon>
            <div class="record-text">${_(c.text)}</div>
          </div>
        `).join(""))}_eventLabels(){return{...at,...this._config.event_labels||{}}}_renderAnalyticsArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("analytics-grid"),e=this.shadowRoot.getElementById("decline-banner"),o=this.shadowRoot.getElementById("no-visit-banner");if(!t||this._loadingAnalytics||!this._analytics)return;let i=this._config,n=(i.decline_threshold_pct||ct)/100,s=[];if(t.innerHTML=i.cats.map(r=>{let l=this._analytics[r.name]||{};return l.daysOfHistory>=3&&l.avg7dTotal&&new Date().getHours()>=18&&(l.todayTotal<n*l.avg7dTotal?s.push(`${r.name}'s usage today is well below their recent average \u2014 worth a check.`):l.todayTotal>(2-n)*l.avg7dTotal&&s.push(`${r.name}'s usage today is well above their recent average \u2014 worth a check.`)),`
        <div class="cat-analytics">
          <table>
            <colgroup>
              <col class="col-name" /><col class="col-stat" /><col class="col-stat" /><col class="col-stat" />
            </colgroup>
            <tr><td class="cat-name-cell"><span class="dot" style="background:${_(L(r.color))}"></span>${_(r.name)}</td><td>Today</td><td>3d avg</td><td>7d avg</td></tr>
            <tr><td>Visits</td><td>${l.todayCount??0}</td><td>${l.avg3dVisits!==null&&l.avg3dVisits!==void 0?l.avg3dVisits.toFixed(1):"\u2014"}</td><td>${l.avg7dVisits!==null&&l.avg7dVisits!==void 0?l.avg7dVisits.toFixed(1):"\u2014"}</td></tr>
            <tr><td>Duration</td><td>${l.todayAvgDuration?A(l.todayAvgDuration):"\u2014"}</td><td>${l.avg3dDuration?A(l.avg3dDuration):"\u2014"}</td><td>${l.avg7dDuration?A(l.avg7dDuration):"\u2014"}</td></tr>
          </table>
        </div>
      `}).join(""),e&&(e.innerHTML=s.length?s.map(r=>`<div class="warn-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${r}</div>`).join(""):""),o){let r=i.cats.filter(l=>this._analytics[l.name]?.noVisitAlert?.alerting);o.innerHTML=r.length?r.map(l=>{let{hoursSince:u}=this._analytics[l.name].noVisitAlert,d=u==null?"no visits recorded yet":`last seen ${j(u)} ago`;return`<div class="no-visit-banner"><ha-icon icon="mdi:cat-alert"></ha-icon>${_(l.name)} hasn't used the litter box recently (${_(d)}).</div>`}).join(""):""}}};var St="M4,9H20V11H4V9M4,13H14V15H4V13Z",Dt="M8.35,3C9.53,2.83 10.78,4.12 11.14,5.9C11.5,7.67 10.85,9.25 9.67,9.43C8.5,9.61 7.24,8.32 6.87,6.54C6.5,4.77 7.17,3.19 8.35,3M15.5,3C16.69,3.19 17.35,4.77 17,6.54C16.62,8.32 15.37,9.61 14.19,9.43C13,9.25 12.35,7.67 12.72,5.9C13.08,4.12 14.33,2.83 15.5,3M3,7.6C4.14,7.11 5.69,8 6.5,9.55C7.26,11.13 7,12.79 5.87,13.28C4.74,13.77 3.2,12.89 2.41,11.32C1.62,9.75 1.9,8.08 3,7.6M21,7.6C22.1,8.08 22.38,9.75 21.59,11.32C20.8,12.89 19.26,13.77 18.13,13.28C17,12.79 16.74,11.13 17.5,9.55C18.31,8 19.86,7.11 21,7.6M19.33,18.38C19.37,19.32 18.65,20.36 17.79,20.75C16,21.57 13.88,19.87 11.89,19.87C9.9,19.87 7.76,21.64 6,20.75C5,20.26 4.31,18.96 4.44,17.88C4.62,16.39 6.41,15.59 7.47,14.5C8.88,13.09 9.88,10.44 11.89,10.44C13.89,10.44 14.95,13.05 16.3,14.5C17.41,15.72 19.26,16.75 19.33,18.38Z",Ht="M3 11H11V3H3M5 5H9V9H5M13 21H21V13H13M15 15H19V19H15M3 21H11V13H3M5 15H9V19H5M13 3V11H21V3M19 9H15V5H19Z",$t="M13 5C15.21 5 17 6.79 17 9C17 10.5 16.2 11.77 15 12.46V11.24C15.61 10.69 16 9.89 16 9C16 7.34 14.66 6 13 6S10 7.34 10 9C10 9.89 10.39 10.69 11 11.24V12.46C9.8 11.77 9 10.5 9 9C9 6.79 10.79 5 13 5M20 20.5C19.97 21.32 19.32 21.97 18.5 22H13C12.62 22 12.26 21.85 12 21.57L8 17.37L8.74 16.6C8.93 16.39 9.2 16.28 9.5 16.28H9.7L12 18V9C12 8.45 12.45 8 13 8S14 8.45 14 9V13.47L15.21 13.6L19.15 15.79C19.68 16.03 20 16.56 20 17.14V20.5M20 2H4C2.9 2 2 2.9 2 4V12C2 13.11 2.9 14 4 14H8V12L4 12L4 4H20L20 12H18V14H20V13.96L20.04 14C21.13 14 22 13.09 22 12V4C22 2.9 21.11 2 20 2Z",Nt="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z",It="M21 11H3V9H21V11M21 13H3V15H21V13Z",Vt=[{name:"name",label:"Name",selector:{text:{}}}],Mt=[{name:"color",label:"Color",selector:{ui_color:{}}}],Ot={name:"My Cat",color:"blue"},O="mdi:information-outline",Bt=[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"unit",label:"Unit",selector:{text:{}}},{name:"warn_below",label:"Warn below",selector:{number:{mode:"box"}}},{name:"warn_above",label:"Warn above",selector:{number:{mode:"box"}}},{name:"warn_state",label:"Warn state",selector:{text:{}}}],Ft=["press","toggle_maintenance","toggle","more_info"],B="mdi:gesture-tap-button",Pt=[{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"action",label:"Action",selector:{select:{options:Ft,mode:"dropdown"}}}],zt={press:[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"confirm",label:"Confirm text (optional)",selector:{text:{}}}],toggle:[{name:"entity",label:"Entity",selector:{entity:{}}}],more_info:[{name:"entity",label:"Entity",selector:{entity:{}}}],toggle_maintenance:[{name:"start_entity",label:"Start entity",selector:{entity:{domain:"button"}}},{name:"exit_entity",label:"Exit entity",selector:{entity:{domain:"button"}}},{name:"state_entity",label:"State entity (optional)",selector:{entity:{}}}]};function Ut(a){return[...Pt,...zt[a]||[]]}function Wt(a){return a&&(a.entity||a.start_entity)||""}var jt=[{name:"content",type:"expandable",flatten:!0,title:"Content",iconPath:St,schema:[{name:"title",label:"Title",selector:{text:{}}},{name:"device_id",label:"PetKit device",selector:{device:{filter:{integration:"petkit"}}}},{name:"show_state",label:"Show state",selector:{boolean:{}}},{name:"show_history",label:"Show history (visit chart)",selector:{boolean:{}}},{name:"show_working_records",label:"Show Working Records",selector:{boolean:{}}},{name:"show_analytics",label:"Show Analytics",selector:{boolean:{}}}]},{name:"alerts",type:"expandable",flatten:!0,title:"Analytics & alerts",iconPath:Nt,schema:[{name:"decline_threshold_pct",label:"Decline/spike alert threshold (%)",selector:{number:{min:10,max:100,mode:"box"}}},{name:"no_visit_alert_hours",label:"Warn if no visit in (hours)",selector:{number:{min:1,max:168,mode:"box"}}},{name:"notify_service",label:"Push a notification too (optional)",selector:{entity:{domain:"notify"}}},{name:"unknown_cat_color",label:"Unidentified-visit color (chart & analytics)",selector:{ui_color:{}}}]}],N=class extends HTMLElement{constructor(){super(),this._detailEditor=null}setConfig(t){let e=t||{},o=!this.shadowRoot||this._structureKey(e)!==this._lastStructureKey;this._config=e,o?this._render():this._updateFormsInPlace()}set hass(t){this._hass=t,(this._formEls||[]).forEach(e=>{e.hass=t})}get hass(){return this._hass}connectedCallback(){this._render()}_fireConfigChanged(t){this._config=t,this.dispatchEvent(new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:t}}))}_structureKey(t){return JSON.stringify({cats:(t.cats||[]).length,info_row:(t.info_row||[]).length,controls_row:(t.controls_row||[]).map(e=>e&&e.action||null)})}_capturePanelExpanded(){if(!this.shadowRoot)return null;let t=this.shadowRoot.querySelectorAll("ha-expansion-panel");return t.length?Array.from(t).map(e=>e.expanded):null}_restorePanelExpanded(t){if(!t)return;this.shadowRoot.querySelectorAll("ha-expansion-panel").forEach((o,i)=>{t[i]!==void 0&&(o.expanded=t[i])})}_updateFormsInPlace(){if(this._detailEditor){let{kind:i,index:n}=this._detailEditor,s=this._config[i==="info"?"info_row":"controls_row"]||[];this._detailForm&&s[n]&&(this._detailForm.data=s[n]);return}this._mainForm&&(this._mainForm.data=this._mainFormData());let t=this._config.cats||[];(this._catNameForms||[]).forEach((i,n)=>{t[n]&&(i.data=t[n])}),(this._catColorForms||[]).forEach((i,n)=>{t[n]&&(i.data=t[n])});let e=this._config.info_row||[];(this._infoRowRefs||[]).forEach((i,n)=>this._refreshRowRef(i,e[n],"info"));let o=this._config.controls_row||[];(this._controlRowRefs||[]).forEach((i,n)=>this._refreshRowRef(i,o[n],"control"))}_refreshRowRef(t,e,o){!t||!e||(t.labelEl&&(t.labelEl.textContent=this._summaryLabel(e,o)),t.iconEl&&t.iconEl.setAttribute("icon",e.icon||(o==="info"?O:B)))}_summaryLabel(t,e){return t.name?t.name:e==="info"?t.entity||"":Wt(t)||t.action||""}_render(){this.shadowRoot||this.attachShadow({mode:"open"}),this._config&&(this._formEls=[],this._detailEditor?this._renderDetail():this._renderList())}_renderDetail(){let{kind:t,index:e}=this._detailEditor,o=t==="info"?"info_row":"controls_row",n=(this._config[o]||[])[e];if(!n){this._detailEditor=null,this._renderList();return}let s=t==="info"?Bt:Ut(n.action),r=t==="info"?"Edit status chip":"Edit control";this.shadowRoot.innerHTML=`
      <style>
        .detail-header { display: flex; align-items: center; gap: 8px; padding: 4px 0 12px; }
        .detail-title { font-size: 1.1em; font-weight: 500; color: var(--primary-text-color); }
      </style>
      <div class="detail-header">
        <ha-icon-button-prev></ha-icon-button-prev>
        <span class="detail-title">${r}</span>
      </div>
      <div id="detail-body"></div>
    `,this.shadowRoot.querySelector("ha-icon-button-prev").addEventListener("click",()=>this._closeDetail());let l=document.createElement("ha-form");l.schema=s,l.data=n,l.hass=this._hass,l.computeLabel=u=>u.label||u.name,l.addEventListener("value-changed",u=>{u.stopPropagation(),this._updateRowAt(t,e,u.detail.value)}),this._formEls.push(l),this._detailForm=l,this.shadowRoot.getElementById("detail-body").appendChild(l)}_closeDetail(){this._detailEditor=null,this._render()}_updateRowAt(t,e,o){let i=t==="info"?"info_row":"controls_row",n=[...this._config[i]||[]],s=t==="control"?n[e]&&n[e].action:null;n[e]=o,this._fireConfigChanged({...this._config,[i]:n}),t==="control"&&o.action!==s&&(this._renderDetail(),this._lastStructureKey=this._structureKey(this._config))}_renderList(){let t=this._capturePanelExpanded();this._catNameForms=[],this._catColorForms=[];let e=(this._config.cats||[]).length,o=(this._config.info_row||[]).length,i=(this._config.controls_row||[]).length;this.shadowRoot.innerHTML=`
      <style>
        .editor { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
        ha-expansion-panel { --expansion-panel-summary-padding: 0 16px; border-radius: var(--ha-card-border-radius, 12px); }
        ha-expansion-panel h3[slot="header"] { margin: 0; font-size: 1em; font-weight: 500; }
        ha-svg-icon[slot="leading-icon"] { color: var(--secondary-text-color); }
        .panel-body { display: flex; flex-direction: column; gap: 4px; padding: 4px 16px 16px; }
        .row { display: flex; align-items: center; gap: 4px; }
        .row ha-form { flex: 1 1 auto; min-width: 0; }
        .handle { display: flex; cursor: grab; color: var(--secondary-text-color); flex: 0 0 auto; touch-action: none; }
        .handle:active { cursor: grabbing; }
        .summary-row { padding: 0 4px; }
        .summary-row ha-icon { color: var(--secondary-text-color); flex: 0 0 auto; }
        .summary-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--primary-text-color); }
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
          <h3 slot="header">Cats (${e})</h3>
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

        <ha-expansion-panel outlined>
          <ha-svg-icon slot="leading-icon" id="chips-icon"></ha-svg-icon>
          <h3 slot="header">Status chips (${o})</h3>
          <div class="panel-body">
            ${o===0?'<div class="empty-hint">No status chips configured yet.</div>':""}
            <div id="info-rows"></div>
            <div class="add-row-form" id="add-info-row"></div>
          </div>
        </ha-expansion-panel>

        <ha-expansion-panel outlined>
          <ha-svg-icon slot="leading-icon" id="controls-icon"></ha-svg-icon>
          <h3 slot="header">Controls (${i})</h3>
          <div class="panel-body">
            ${i===0?'<div class="empty-hint">No control buttons configured yet.</div>':""}
            <div id="controls-rows"></div>
            <div class="add-row-form" id="add-control-row"></div>
          </div>
        </ha-expansion-panel>
      </div>
    `,this.shadowRoot.getElementById("cats-icon").path=Dt,this.shadowRoot.getElementById("chips-icon").path=Ht,this.shadowRoot.getElementById("controls-icon").path=$t,this._renderMainForm(),this._renderCats(),this._renderInfoRows(),this._renderControlsRows(),this._renderAddPicker("add-info-row","Add a status chip",n=>this._addInfoRowFromEntity(n)),this._renderAddPicker("add-control-row","Add a control",n=>this._addControlRowFromEntity(n)),this.shadowRoot.getElementById("add-cat").addEventListener("click",()=>this._addCat()),this._restorePanelExpanded(t),this._lastStructureKey=this._structureKey(this._config)}_iconButton(t,e,o,i){let n=document.createElement("ha-icon-button");n.className=o,n.label=e;let s=document.createElement("ha-icon");return s.setAttribute("icon",t),n.appendChild(s),n.addEventListener("click",i),n}_removeIconButton(t){return this._iconButton("mdi:delete-outline","Remove","remove-btn",t)}_editIconButton(t){return this._iconButton("mdi:pencil-outline","Edit","edit-btn",t)}_dragHandle(){let t=document.createElement("div");t.className="handle";let e=document.createElement("ha-svg-icon");return e.path=It,t.appendChild(e),t}_createSortableList(t){let e=document.createElement("ha-sortable");e.setAttribute("handle-selector",".handle"),e.addEventListener("item-moved",i=>{i.stopPropagation(),t(i.detail.oldIndex,i.detail.newIndex)});let o=document.createElement("div");return e.appendChild(o),{sortable:e,list:o}}_renderCats(){let t=this.shadowRoot.getElementById("cats-rows");t.innerHTML="";let e=this._config.cats||[],{sortable:o,list:i}=this._createSortableList((n,s)=>this._moveCat(n,s));e.forEach((n,s)=>{let r=document.createElement("div");r.className="cat-item";let l=document.createElement("div");l.className="row",l.appendChild(this._dragHandle());let u=document.createElement("ha-form");u.schema=Vt,u.data=n,u.hass=this._hass,u.computeLabel=p=>p.label||p.name,u.addEventListener("value-changed",p=>{p.stopPropagation(),this._updateCat(s,{...this._config.cats[s],...p.detail.value})}),this._formEls.push(u),this._catNameForms.push(u),l.appendChild(u),l.appendChild(this._removeIconButton(()=>this._removeCat(s)));let d=document.createElement("ha-form");d.schema=Mt,d.data=n,d.hass=this._hass,d.computeLabel=p=>p.label||p.name,d.addEventListener("value-changed",p=>{p.stopPropagation(),this._updateCat(s,{...this._config.cats[s],...p.detail.value})}),this._formEls.push(d),this._catColorForms.push(d),r.appendChild(l),r.appendChild(d),i.appendChild(r)}),t.appendChild(o)}_updateCat(t,e){let o=[...this._config.cats||[]];o[t]=e,this._fireConfigChanged({...this._config,cats:o})}_moveCat(t,e){let o=(this._config.cats||[]).concat();o.splice(e,0,o.splice(t,1)[0]),this._fireConfigChanged({...this._config,cats:o}),this._render()}_addCat(){let t=[...this._config.cats||[],{...Ot}];this._fireConfigChanged({...this._config,cats:t}),this._render()}_removeCat(t){let e=(this._config.cats||[]).filter((o,i)=>i!==t);this._fireConfigChanged({...this._config,cats:e}),this._render()}_renderInfoRows(){let t=this.shadowRoot.getElementById("info-rows");t.innerHTML="",this._infoRowRefs=[];let e=this._config.info_row||[],{sortable:o,list:i}=this._createSortableList((n,s)=>this._moveInfoRow(n,s));e.forEach((n,s)=>{let{el:r,ref:l}=this._buildSummaryRow({spec:n,kind:"info",onEdit:()=>this._openDetail("info",s),onRemove:()=>this._removeInfoRow(s)});this._infoRowRefs[s]=l,i.appendChild(r)}),t.appendChild(o)}_openDetail(t,e){this._detailEditor={kind:t,index:e},this._render()}_addInfoRowFromEntity(t){let e=[...this._config.info_row||[],{entity:t,name:"",icon:this._defaultIconFor(t,O)}];this._fireConfigChanged({...this._config,info_row:e}),this._render()}_moveInfoRow(t,e){let o=(this._config.info_row||[]).concat();o.splice(e,0,o.splice(t,1)[0]),this._fireConfigChanged({...this._config,info_row:o}),this._render()}_removeInfoRow(t){let e=(this._config.info_row||[]).filter((o,i)=>i!==t);this._fireConfigChanged({...this._config,info_row:e}),this._render()}_renderControlsRows(){let t=this.shadowRoot.getElementById("controls-rows");t.innerHTML="",this._controlRowRefs=[];let e=this._config.controls_row||[],{sortable:o,list:i}=this._createSortableList((n,s)=>this._moveControlRow(n,s));e.forEach((n,s)=>{let{el:r,ref:l}=this._buildSummaryRow({spec:n,kind:"control",onEdit:()=>this._openDetail("control",s),onRemove:()=>this._removeControlRow(s)});this._controlRowRefs[s]=l,i.appendChild(r)}),t.appendChild(o)}_addControlRowFromEntity(t){let e=[...this._config.controls_row||[],{entity:t,name:"",icon:this._defaultIconFor(t,B),action:"press"}];this._fireConfigChanged({...this._config,controls_row:e}),this._render()}_moveControlRow(t,e){let o=(this._config.controls_row||[]).concat();o.splice(e,0,o.splice(t,1)[0]),this._fireConfigChanged({...this._config,controls_row:o}),this._render()}_removeControlRow(t){let e=(this._config.controls_row||[]).filter((o,i)=>i!==t);this._fireConfigChanged({...this._config,controls_row:e}),this._render()}_defaultIconFor(t,e){let o=this._hass&&this._hass.states&&this._hass.states[t];return o&&o.attributes&&o.attributes.icon||e}_buildSummaryRow({spec:t,kind:e,onEdit:o,onRemove:i}){let n=document.createElement("div");n.className="row summary-row",n.appendChild(this._dragHandle());let s=document.createElement("ha-icon");s.setAttribute("icon",t.icon||(e==="info"?O:B));let r=document.createElement("span");return r.className="summary-label",r.textContent=this._summaryLabel(t,e),n.appendChild(s),n.appendChild(r),n.appendChild(this._editIconButton(o)),n.appendChild(this._removeIconButton(i)),{el:n,ref:{iconEl:s,labelEl:r}}}_renderAddPicker(t,e,o){let i=this.shadowRoot.getElementById(t),n=document.createElement("ha-form");n.schema=[{name:"entity",label:e,selector:{entity:{}}}],n.data={},n.hass=this._hass,n.computeLabel=s=>s.label||s.name,n.addEventListener("value-changed",s=>{s.stopPropagation();let r=s.detail.value.entity;r&&o(r)}),this._formEls.push(n),i.appendChild(n)}_mainFormData(){let t=this._config;return{...t,show_state:t.show_state!==!1,show_history:t.show_history!==!1,show_working_records:t.show_working_records!==!1,show_analytics:t.show_analytics!==!1}}_renderMainForm(){let t=this.shadowRoot.getElementById("main-section"),e=document.createElement("ha-form");e.schema=jt,e.data=this._mainFormData(),e.hass=this._hass,e.computeLabel=o=>o.label||o.name,e.addEventListener("value-changed",o=>{o.stopPropagation(),this._fireConfigChanged(o.detail.value)}),this._formEls.push(e),this._mainForm=e,t.appendChild(e)}};customElements.get("petkit-puramax-card")||customElements.define("petkit-puramax-card",$);customElements.get("petkit-puramax-card-editor")||customElements.define("petkit-puramax-card-editor",N);var F=window;F.customCards=F.customCards||[];F.customCards.push({type:"petkit-puramax-card",name:"PETKIT PURAMAX Card",description:"Configurable card for PETKIT PURAMAX litter box monitoring, controls, and per-cat visit analytics."});
//# sourceMappingURL=petkit-puramax-card.js.map
