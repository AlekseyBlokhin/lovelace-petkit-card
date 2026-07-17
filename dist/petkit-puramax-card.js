function E(o){let t=Math.round(o||0);if(t<60)return`${t}s`;let e=Math.floor(t/60),n=t%60;return`${e}m${n.toString().padStart(2,"0")}s`}function O(o){let t=Math.round(o||0),e=Math.floor(t/60),n=t%60;return`${e.toString().padStart(2,"0")}'${n.toString().padStart(2,"0")}"`}function V(o){let t=Math.floor(o);return t<1?"under 1h":t<48?`${t}h`:`${Math.floor(t/24)}d`}function v(o){return String(o).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function T(o,t=new Date){let e=new Date(t.getFullYear(),t.getMonth(),t.getDate());e.setDate(e.getDate()+o);let n=new Date(e);return n.setDate(n.getDate()+1),{start:e,end:n}}function U(o,t=new Date){if(o===0)return"Today";if(o===-1)return"Yesterday";let{start:e}=T(o,t);return e.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"})}function N(o){let t=new Date(o);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`}function L({startTime:o,endTime:t,entityIds:e,includeStartTimeState:n=!1}){let i=o instanceof Date?o.toISOString():o,a=t instanceof Date?t.toISOString():t;return{type:"history/history_during_period",start_time:i,end_time:a,entity_ids:e,minimal_response:!1,no_attributes:!0,include_start_time_state:n}}function bt(o){if(!o)return null;let t=o.s??o.state,e=parseFloat(t),n=o.lu?o.lu*1e3:o.last_changed?Date.parse(o.last_changed):null;return!Number.isFinite(e)||!n||Number.isNaN(n)?null:{value:e,ts:n}}function F(o,{minDelta:t=0,maxDelta:e=1/0}={}){if(!Array.isArray(o))return[];let n=o.map(bt).filter(Boolean).sort((a,s)=>a.ts-s.ts),i=[];for(let a=1;a<n.length;a++){let s=n[a].value-n[a-1].value;if(s<=t||s>=e)continue;let r=n[a+1];r&&r.value===n[a-1].value||i.push({value:s,ts:n[a].ts})}return i}var wt="unknown_pet",w="Unknown";function z(o,t){if(!Array.isArray(o))return[];let e=new Set(t),n=[];for(let i of o){let a=i.s??i.state,s;if(e.has(a))s=a;else if(a===wt)s=w;else continue;let r=i.lu?i.lu*1e3:i.last_changed?Date.parse(i.last_changed):null;!r||Number.isNaN(r)||n.push({cat:s,ts:r})}return n.sort((i,a)=>i.ts-a.ts),n}function W(o,t){let e=o.length,n=new Array(e).fill(null),i=0,a=null;for(let s=0;s<e;s++){let r=o[s].ts,c=s===0?-1/0:(o[s-1].ts+r)/2,u=s===e-1?1/0:(r+o[s+1].ts)/2;for(;i<t.length&&t[i].ts<c;)a=t[i].cat,i++;let h=null,d=1/0;for(;i<t.length&&t[i].ts<u;){let _=Math.abs(t[i].ts-r);_<d&&(d=_,h=t[i].cat),a=t[i].cat,i++}n[s]=h!==null?h:a}return o.map((s,r)=>({...s,cat:n[r]}))}var Ct=[10,15,30,60,120,180,300,600,900,1800,3600];function P(o){for(let t of Ct)if(o/t<=5)return t;return Math.ceil(o/5/60)*60}function j({dayStart:o,niceMax:t,width:e,height:n,padding:i}){let{left:a,right:s,top:r,bottom:c}=i,u=e-a-s,h=n-r-c,d=o.getTime();return{xFor:g=>{let D=(g-d)/36e5;return a+D/24*u},yFor:g=>t?n-c-g/t*h:n-c}}function q({niceMax:o,yStep:t,width:e,height:n,padding:i}){let{left:a,right:s,top:r,bottom:c}=i,u=e-a-s,h=n-r-c,d=[4,8,12,16,20].map(p=>({hour:p,x:a+p/24*u,label:`${p.toString().padStart(2,"0")}:00`})),_=[];if(t>0)for(let p=0;p<=o;p+=t){let g=o?n-c-p/o*h:n-c;_.push({value:p,y:g,label:O(p)})}return{vertical:d,horizontal:_}}function G(o,{dayKeyFn:t}){let e={};for(let n of o||[]){let i=t(n.ts);e[i]||(e[i]={count:0,total:0}),e[i].count+=1,e[i].total+=n.value}return e}function K(o,t){let e=Object.keys(o).filter(h=>h!==t).sort(),n=e.slice(-3),i=e.slice(-7),a=(h,d)=>h.length?h.reduce((_,p)=>_+o[p][d],0)/h.length:null,s=h=>{if(!h.length)return null;let d=h.reduce((p,g)=>p+o[g].total,0),_=h.reduce((p,g)=>p+o[g].count,0);return _>0?d/_:null},r=o[t],c=r?r.count:0,u=r?r.total:0;return{todayCount:c,todayTotal:u,todayAvgDuration:c>0?u/c:null,avg3dVisits:a(n,"count"),avg3dTotal:a(n,"total"),avg3dDuration:s(n),avg7dVisits:a(i,"count"),avg7dTotal:a(i,"total"),avg7dDuration:s(i),daysOfHistory:e.length}}function X({lastVisitTs:o,now:t,thresholdHours:e}){let n=t instanceof Date?t.getTime():t;if(o==null)return{alerting:!0,hoursSince:null};let i=(n-o)/36e5;return{alerting:i>=e,hoursSince:i}}function Y(o,t){let e=t;o.value_map&&t in o.value_map?e=o.value_map[t]:t!==null&&o.unit&&(e=`${t}${o.unit}`),e==null&&(e="\u2014");let n=parseFloat(t),i=!1;return o.warn_below!==void 0&&Number.isFinite(n)&&(i=n<o.warn_below),o.warn_above!==void 0&&Number.isFinite(n)&&(i=i||n>o.warn_above),o.warn_state!==void 0&&(i=i||t===o.warn_state),{display:e,warn:i}}function J(o,t,e){return!t||!o||!o.states||!o.states[t]?e:o.states[t].state}function Q(o,t){let e=new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}});o.dispatchEvent(e)}function R(o,t,e,n){o.callService(t,e,n)}function A(o,t){t&&R(o,"button","press",{entity_id:t})}var Z=`
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
    /* Sized for the widest real label, 01'30" (Task 3's MM'SS" format,
       ~6 characters) at 0.7em, plus a little breathing room before the
       plot area -- see CHART_PADDING.left's comment for how this lines up
       (approximately, by design) with the SVG's own left inset. */
    width: 42px;
    transform: translateY(-50%);
    font-size: 0.7em;
    color: var(--secondary-text-color);
    text-align: right;
    padding-right: 4px;
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
  .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
  .cat-analytics table { width: 100%; font-size: 0.8em; color: var(--primary-text-color); border-collapse: collapse; }
  .cat-analytics td { padding: 2px 4px; }
  .cat-analytics tr:first-child td { color: var(--secondary-text-color); font-size: 0.9em; }
  .cat-name-cell { display: flex; align-items: center; gap: 6px; font-weight: 500; color: var(--primary-text-color) !important; font-size: 0.9em; }
  .warn-banner { display: flex; align-items: center; gap: 8px; background: rgba(var(--rgb-state-warning-color, 255,152,0), 0.15); color: var(--warning-color); border-radius: 8px; padding: 8px 10px; font-size: 0.85em; margin-bottom: 8px; }
  .no-visit-banner { display: flex; align-items: center; gap: 8px; background: rgba(var(--rgb-state-error-color, 244,67,54), 0.15); color: var(--error-color); border-radius: 8px; padding: 8px 10px; font-size: 0.85em; margin-bottom: 8px; }
`;var tt={maintenance_mode:"Maintenance mode",manual_odor_completed:"Manual odor removal done",auto_cleaning_completed:"Auto cleaning done"},et=["unavailable","unknown","no_events_yet"],I="#9e9e9e",nt="PETKIT PURAMAX",it=60,ot=8,st=1800,at=600,rt=240,ct={left:46,right:10,top:10,bottom:28};var $=class extends HTMLElement{static getConfigElement(){return document.createElement("petkit-puramax-card-editor")}static getStubConfig(){return{type:"custom:petkit-puramax-card",title:"PETKIT PURAMAX",device_entities:{error:"sensor.example_petkit_error",last_event:"sensor.example_petkit_last_event",state:"sensor.example_petkit_state",total_use:"sensor.example_petkit_total_use"},cats:[{name:"Example Cat",color:"#4fc3f7"}]}}setConfig(t){if(!t)throw new Error("petkit-puramax-card: config is required");if(!t.device_entities)throw new Error('petkit-puramax-card: "device_entities" is required in config');if(!t.device_entities.total_use)throw new Error('petkit-puramax-card: "device_entities.total_use" is required in config');if(!t.cats)throw new Error('petkit-puramax-card: "cats" is required in config');if(!Array.isArray(t.cats)||t.cats.length<1)throw new Error('petkit-puramax-card: "cats" must be a non-empty array');if(t.cats.length>1&&!t.device_entities.last_used_by)throw new Error('petkit-puramax-card: "device_entities.last_used_by" is required in config when more than one cat is configured');t.cats.forEach((e,n)=>{if(!e||!e.name)throw new Error(`petkit-puramax-card: cats[${n}].name is required`);if(!e.color)throw new Error(`petkit-puramax-card: cats[${n}].color is required`)}),this._config=t,this._dayOffset=0,this._analytics=null,this._chartData=null,this._loadingChart=!1,this._loadingAnalytics=!1,this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}set hass(t){let e=this._hass;if(this._hass=t,!this._built){this._built=!0,this._render(),this._loadDay(),this._loadAnalytics(),this._startNoVisitTimer();return}this._updateLiveValues(),this._maybeRefreshOnNewVisit(e)}get hass(){return this._hass}getCardSize(){return 14}connectedCallback(){this._hass&&!this._built&&(this._built=!0,this._render(),this._loadDay(),this._loadAnalytics(),this._startNoVisitTimer())}disconnectedCallback(){this._noVisitTimer&&(clearInterval(this._noVisitTimer),this._noVisitTimer=null)}_startNoVisitTimer(){this._noVisitTimer||(this._noVisitTimer=setInterval(()=>this._checkNoVisitAlerts(),300*1e3))}_maybeRefreshOnNewVisit(t){if(!t)return;let e=this._config.device_entities.total_use,n=t.states[e],i=this._hass.states[e];i&&(!n||n.last_changed!==i.last_changed)&&(this._dayOffset===0&&this._loadDay(),this._loadAnalytics())}_s(t,e){return J(this._hass,t,e)}async _fetchVisits({start:t,end:e}){let n=this._config,i=L({startTime:t,endTime:e,entityIds:[n.device_entities.total_use]}),a=[this._hass.callWS(i)];if(n.cats.length>1){let d=L({startTime:t,endTime:e,entityIds:[n.device_entities.last_used_by],includeStartTimeState:!0});a.push(this._hass.callWS(d))}let s={},r={};try{let[d,_]=await Promise.all(a);s=d||{},r=_||{}}catch{}let c=F(s[n.device_entities.total_use],{minDelta:0,maxDelta:st}),u;if(n.cats.length>1){let d=n.cats.map(p=>p.name),_=z(r[n.device_entities.last_used_by],d);u=W(c,_)}else u=c.map(d=>({...d,cat:n.cats[0].name}));let h=new Map(n.cats.map(d=>[d.name,d]));return u.map(d=>({cat:d.cat===w?this._unknownCat():h.get(d.cat)||null,duration:d.value,ts:d.ts}))}_unknownCat(){return{name:w,color:this._config.unknown_cat_color||I}}async _loadDay(){if(!this._hass)return;this._loadingChart=!0,this._renderChartArea();let t=this._config,{start:e,end:n}=T(this._dayOffset),i=[],a=[];try{let[s,r]=await Promise.all([this._fetchVisits({start:e,end:n}),t.device_entities.last_event?this._hass.callWS(L({startTime:e,endTime:n,entityIds:[t.device_entities.last_event]})):Promise.resolve({})]);i=s,a=(r||{})[t.device_entities.last_event]||[]}catch{i=[],a=[]}this._chartVisits=i,this._chartEventHist=a,this._loadingChart=!1,this._renderChartArea()}async _loadAnalytics(){if(!this._hass)return;this._loadingAnalytics=!0,this._renderAnalyticsArea();let t=this._config,e=new Date,n=new Date(e.getTime()-168*3600*1e3),i=[];try{i=await this._fetchVisits({start:n,end:e})}catch{i=[]}let a=N(e.getTime()),s={};t.cats.forEach(r=>{let c=i.filter(d=>d.cat===r).map(d=>({value:d.duration,ts:d.ts})),u=G(c,{dayKeyFn:N}),h=c.length?Math.max(...c.map(d=>d.ts)):null;s[r.name]={...K(u,a),lastVisitTs:h}}),this._analytics=s,this._loadingAnalytics=!1,this._checkNoVisitAlerts(),this._renderAnalyticsArea()}_checkNoVisitAlerts(){if(!this._analytics||!this._built)return;let t=this._config,e=t.no_visit_alert_hours??ot,n=Date.now();this._notifiedCats||(this._notifiedCats=new Set),t.cats.forEach(i=>{let a=this._analytics[i.name];if(!a)return;let s=X({lastVisitTs:a.lastVisitTs,now:n,thresholdHours:e});a.noVisitAlert=s;let r=this._notifiedCats.has(i.name);s.alerting&&!r?(this._notifiedCats.add(i.name),this._sendNoVisitNotification(i,s)):!s.alerting&&r&&this._notifiedCats.delete(i.name)}),this._renderAnalyticsArea()}_sendNoVisitNotification(t,e){let n=this._config.notify_service;if(!n||!this._hass)return;let i=n.indexOf(".");if(i===-1)return;let a=n.slice(0,i),s=n.slice(i+1);if(a!=="notify"||!s)return;let r=e.hoursSince==null?`${t.name} hasn't used the litter box yet in the tracked history.`:`${t.name} hasn't used the litter box in over ${Math.floor(e.hoursSince)}h.`;R(this._hass,"notify",s,{message:r,title:"Litter box alert"})}_render(){let t=this._config;this.shadowRoot.innerHTML=`
      <style>${Z}</style>
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
    `,this.shadowRoot.getElementById("prev-day").addEventListener("click",()=>this._changeDay(-1)),this.shadowRoot.getElementById("next-day").addEventListener("click",()=>this._changeDay(1)),this._updateLiveValues(),this._renderChartArea(),this._renderAnalyticsArea()}_changeDay(t){this._dayOffset+=t,this._dayOffset>0&&(this._dayOffset=0),this._loadDay()}_updateLiveValues(){if(!this._built)return;let t=this._config,e=t.device_entities,n=this.shadowRoot.getElementById("status-row");if(n){let a=this._s(e.error,"no_error"),s=a&&a!=="no_error",r=t.info_row||[];n.innerHTML=[...r.map(c=>this._renderInfoChip(c)),s?this._chip("mdi:alert","Error",a.replace(/_/g," "),!0):""].join("")}let i=this.shadowRoot.getElementById("controls-row");if(i&&!i.dataset.bound){let a=t.controls_row||[];i.innerHTML=a.map((s,r)=>`
        <button class="ctrl-btn" id="ctrl-${r}"><ha-icon icon="${s.icon||"mdi:help"}"></ha-icon><span>${s.name||""}</span></button>
      `).join(""),i.dataset.bound="1",a.forEach((s,r)=>{this.shadowRoot.getElementById(`ctrl-${r}`).addEventListener("click",()=>this._runControlAction(s))})}}_renderInfoChip(t){let e=this._s(t.entity,null),{display:n,warn:i}=Y(t,e);return this._chip(t.icon||"mdi:information-outline",t.name||t.entity,n,i)}_runControlAction(t){switch(t.action){case"press":{t.confirm?window.confirm(t.confirm)&&A(this._hass,t.entity):A(this._hass,t.entity);break}case"toggle_maintenance":{let e=t.state_entity||this._config.device_entities.state;this._s(e,"")==="maintenance"?A(this._hass,t.exit_entity):A(this._hass,t.start_entity);break}case"toggle":{R(this._hass,"homeassistant","toggle",{entity_id:t.entity});break}case"more_info":{Q(this,t.entity);break}default:break}}_chip(t,e,n,i){return`
      <div class="chip ${i?"warn":""}">
        <ha-icon icon="${v(t)}"></ha-icon>
        <div class="chip-text"><div class="chip-label">${v(e)}</div><div class="chip-value">${v(n)}</div></div>
      </div>`}_renderChartArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("day-label");t&&(t.textContent=U(this._dayOffset));let e=this.shadowRoot.getElementById("next-day");e&&(e.disabled=this._dayOffset>=0);let n=this.shadowRoot.getElementById("chart-area"),i=this.shadowRoot.getElementById("records-list"),a=this.shadowRoot.getElementById("usage-body");if(!n||this._loadingChart)return;let s=this._config,r=(this._chartVisits||[]).filter(l=>l.cat).sort((l,m)=>l.ts-m.ts),c=at,u=rt,h=ct,d=Math.max(60,...r.map(l=>l.duration)),_=P(d),p=Math.ceil(d/_)*_,{start:g}=T(this._dayOffset),{xFor:D,yFor:lt}=j({dayStart:g,niceMax:p,width:c,height:u,padding:h}),{vertical:M,horizontal:B}=q({niceMax:p,yStep:_,width:c,height:u,padding:h}),dt=M.map(l=>`<line x1="${l.x}" y1="${h.top}" x2="${l.x}" y2="${u-h.bottom}" class="grid-line-v" />`).join(""),ht=B.map(l=>`<line x1="${h.left}" y1="${l.y}" x2="${c-h.right}" y2="${l.y}" class="grid-line-h" />`).join(""),ut=(u-h.bottom)/u*100,pt=M.map(l=>`<div class="axis-label" style="left:${l.x/c*100}%;top:${ut}%">${l.label}</div>`).join(""),_t=B.map(l=>`<div class="axis-label-y" style="top:${l.y/u*100}%">${l.label}</div>`).join(""),mt=r.map((l,m)=>{let f=D(l.ts),y=lt(l.duration),b=u-h.bottom;return`<line x1="${f}" y1="${b}" x2="${f}" y2="${y}" stroke="${l.cat.color}" stroke-width="2" />
              <circle class="visit-point" cx="${f}" cy="${y}" r="5" fill="${l.cat.color}" />
              <line class="visit-hit" data-idx="${m}" x1="${f}" y1="${b}" x2="${f}" y2="${y}" stroke="transparent" stroke-width="16" />`}).join("");n.innerHTML=`
      <div class="chart-wrap">
        <svg viewBox="0 0 ${c} ${u}" class="chart-svg">
          ${ht}
          ${dt}
          ${mt||""}
        </svg>
        ${pt}
        ${_t}
        <div class="chart-tooltip" id="chart-tooltip"></div>
      </div>
      ${r.length===0?'<div class="empty-note">No visits recorded this day</div>':""}
    `;let C=this.shadowRoot.getElementById("chart-tooltip"),ft=n.querySelector(".chart-wrap");if(n.querySelectorAll(".visit-hit").forEach(l=>{l.addEventListener("mouseenter",()=>{let m=r[parseInt(l.dataset.idx,10)],f=new Date(m.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"});C.textContent=`${f} \xB7 ${m.cat.name} \xB7 ${E(m.duration)}`;let y=l.getBoundingClientRect(),b=ft.getBoundingClientRect();C.style.left=`${y.left-b.left+y.width/2}px`,C.style.top=`${y.top-b.top}px`,C.classList.add("visible")}),l.addEventListener("mouseleave",()=>{C.classList.remove("visible")})}),a){let l={};s.cats.forEach(x=>{l[x.name]={count:0}});let m=0,f=I;r.forEach(x=>{x.cat.name===w?(m+=1,f=x.cat.color):l[x.cat.name].count+=1});let y=r.length,b=s.cats.map(x=>{let xt=l[x.name];return`<span class="usage-cat"><span class="dot" style="background:${x.color}"></span>${x.name}: ${xt.count}</span>`}).join("")+(m>0?`<span class="usage-cat"><span class="dot" style="background:${f}"></span>${w}: ${m}</span>`:"");a.innerHTML=`
        <div class="usage-row">
          <div class="stat-value">${y} time${y===1?"":"s"}</div>
          <div class="usage-cats">${b}</div>
        </div>
      `}let gt=this._chartEventHist||[],vt=this._eventLabels(),yt=(s.event_exclude||et).map(l=>String(l).toLowerCase()),k=gt.map(l=>{let m=l.s??l.state,f=l.lu?l.lu*1e3:l.last_changed?Date.parse(l.last_changed):null;return!m||!f||yt.includes(m.toLowerCase())?null:{ts:f,icon:"mdi:information-outline",color:"var(--secondary-text-color)",text:vt[m]||m}}).filter(Boolean);k.sort((l,m)=>m.ts-l.ts),i&&(k.length===0?i.innerHTML='<div class="empty-note">No records for this day</div>':i.innerHTML=k.map(l=>`
          <div class="record-row">
            <div class="record-time">${new Date(l.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</div>
            <ha-icon icon="${v(l.icon)}" style="color:${v(l.color)}"></ha-icon>
            <div class="record-text">${v(l.text)}</div>
          </div>
        `).join(""))}_eventLabels(){return{...tt,...this._config.event_labels||{}}}_renderAnalyticsArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("analytics-grid"),e=this.shadowRoot.getElementById("decline-banner"),n=this.shadowRoot.getElementById("no-visit-banner");if(!t||this._loadingAnalytics||!this._analytics)return;let i=this._config,a=(i.decline_threshold_pct||it)/100,s=[];if(t.innerHTML=i.cats.map(r=>{let c=this._analytics[r.name]||{};return c.daysOfHistory>=3&&c.avg7dTotal&&new Date().getHours()>=18&&(c.todayTotal<a*c.avg7dTotal?s.push(`${r.name}'s usage today is well below their recent average \u2014 worth a check.`):c.todayTotal>(2-a)*c.avg7dTotal&&s.push(`${r.name}'s usage today is well above their recent average \u2014 worth a check.`)),`
        <div class="cat-analytics">
          <table>
            <tr><td class="cat-name-cell"><span class="dot" style="background:${v(r.color)}"></span>${v(r.name)}</td><td>Today</td><td>3d avg</td><td>7d avg</td></tr>
            <tr><td>Visits</td><td>${c.todayCount??0}</td><td>${c.avg3dVisits!==null&&c.avg3dVisits!==void 0?c.avg3dVisits.toFixed(1):"\u2014"}</td><td>${c.avg7dVisits!==null&&c.avg7dVisits!==void 0?c.avg7dVisits.toFixed(1):"\u2014"}</td></tr>
            <tr><td>Duration</td><td>${c.todayAvgDuration?E(c.todayAvgDuration):"\u2014"}</td><td>${c.avg3dDuration?E(c.avg3dDuration):"\u2014"}</td><td>${c.avg7dDuration?E(c.avg7dDuration):"\u2014"}</td></tr>
          </table>
        </div>
      `}).join(""),e&&(e.innerHTML=s.length?s.map(r=>`<div class="warn-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${r}</div>`).join(""):""),n){let r=i.cats.filter(c=>this._analytics[c.name]?.noVisitAlert?.alerting);n.innerHTML=r.length?r.map(c=>{let{hoursSince:u}=this._analytics[c.name].noVisitAlert,h=u==null?"no visits recorded yet":`last seen ${V(u)} ago`;return`<div class="no-visit-banner"><ha-icon icon="mdi:cat-alert"></ha-icon>${v(c.name)} hasn't used the litter box recently (${v(h)}).</div>`}).join(""):""}}};var Et=[{name:"name",label:"Name",selector:{text:{}}},{name:"color",label:"Color",selector:{ui_color:{}}}],At={name:"",color:"#4fc3f7"},Tt=[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"unit",label:"Unit",selector:{text:{}}},{name:"warn_below",label:"Warn below",selector:{number:{mode:"box"}}},{name:"warn_above",label:"Warn above",selector:{number:{mode:"box"}}},{name:"warn_state",label:"Warn state",selector:{text:{}}}],Lt={entity:"",name:"",icon:"mdi:information-outline"},Rt=["press","toggle_maintenance","toggle","more_info"],$t=[{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"action",label:"Action",selector:{select:{options:Rt,mode:"dropdown"}}}],St={press:[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"confirm",label:"Confirm text (optional)",selector:{text:{}}}],toggle:[{name:"entity",label:"Entity",selector:{entity:{}}}],more_info:[{name:"entity",label:"Entity",selector:{entity:{}}}],toggle_maintenance:[{name:"start_entity",label:"Start entity",selector:{entity:{domain:"button"}}},{name:"exit_entity",label:"Exit entity",selector:{entity:{domain:"button"}}},{name:"state_entity",label:"State entity (optional)",selector:{entity:{}}}]};function Dt(o){return[...$t,...St[o]||[]]}var kt={name:"",icon:"mdi:gesture-tap-button",action:"press",entity:""},Nt=[{name:"title",selector:{text:{}}},{name:"device_entities",type:"expandable",title:"Device entities",schema:[{name:"device_entities_total_use",label:"Total use sensor (required)",selector:{entity:{}}},{name:"device_entities_last_used_by",label:"Last used by sensor (required if more than one cat)",selector:{entity:{}}},{name:"device_entities_error",label:"Error sensor",selector:{entity:{}}},{name:"device_entities_last_event",label:"Last event sensor",selector:{entity:{}}},{name:"device_entities_state",label:"State sensor",selector:{entity:{}}}]},{name:"alerts",type:"expandable",title:"Analytics & alerts",schema:[{name:"decline_threshold_pct",label:"Decline/spike alert threshold (%)",selector:{number:{min:10,max:100,mode:"box"}}},{name:"no_visit_alert_hours",label:"Warn if no visit in (hours)",selector:{number:{min:1,max:168,mode:"box"}}},{name:"notify_service",label:"Push a notification too (optional)",selector:{entity:{domain:"notify"}}},{name:"unknown_cat_color",label:"Unidentified-visit color (chart & analytics)",selector:{ui_color:{}}}]}],S=class extends HTMLElement{setConfig(t){this._config=t||{},this._render()}set hass(t){this._hass=t,(this._formEls||[]).forEach(e=>{e.hass=t})}get hass(){return this._hass}connectedCallback(){this._render()}_fireConfigChanged(t){this._config=t,this.dispatchEvent(new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:t}}))}_flattenMain(){let t=this._config||{},e=t.device_entities||{};return{title:t.title,device_entities_total_use:e.total_use,device_entities_last_used_by:e.last_used_by,device_entities_error:e.error,device_entities_last_event:e.last_event,device_entities_state:e.state,decline_threshold_pct:t.decline_threshold_pct,no_visit_alert_hours:t.no_visit_alert_hours,notify_service:t.notify_service,unknown_cat_color:t.unknown_cat_color}}_onMainFormChanged(t){let e={...this._config};e.title=t.title,e.device_entities={...e.device_entities||{},total_use:t.device_entities_total_use,last_used_by:t.device_entities_last_used_by,error:t.device_entities_error,last_event:t.device_entities_last_event,state:t.device_entities_state},e.decline_threshold_pct=t.decline_threshold_pct,e.no_visit_alert_hours=t.no_visit_alert_hours,e.notify_service=t.notify_service,e.unknown_cat_color=t.unknown_cat_color,this._fireConfigChanged(e)}_render(){if(this.shadowRoot||this.attachShadow({mode:"open"}),!this._config)return;this._formEls=[];let t=(this._config.cats||[]).length,e=(this._config.info_row||[]).length,n=(this._config.controls_row||[]).length;this.shadowRoot.innerHTML=`
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

        <ha-expansion-panel outlined header="Cats (${t})">
          <div class="panel-body">
            ${t===0?'<div class="empty-hint">No cats configured yet.</div>':""}
            <div id="cats-rows"></div>
            <div class="add-row">
              <button class="add-btn" id="add-cat" type="button">
                <ha-icon icon="mdi:plus"></ha-icon>Add cat
              </button>
            </div>
          </div>
        </ha-expansion-panel>

        <ha-expansion-panel outlined header="Status chips (${e})">
          <div class="panel-body">
            ${e===0?'<div class="empty-hint">No status chips configured yet.</div>':""}
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
    `,this._renderMainForm(),this._renderCats(),this._renderInfoRows(),this._renderControlsRows(),this.shadowRoot.getElementById("add-cat").addEventListener("click",()=>this._addCat()),this.shadowRoot.getElementById("add-info-row").addEventListener("click",()=>this._addInfoRow()),this.shadowRoot.getElementById("add-control-row").addEventListener("click",()=>this._addControlRow())}_removeIconButton(t){let e=document.createElement("ha-icon-button");e.className="remove-btn",e.label="Remove";let n=document.createElement("ha-icon");return n.setAttribute("icon","mdi:delete-outline"),e.appendChild(n),e.addEventListener("click",t),e}_renderCats(){let t=this.shadowRoot.getElementById("cats-rows");t.innerHTML="",(this._config.cats||[]).forEach((n,i)=>{let a=document.createElement("div");a.className="row",a.dataset.index=String(i);let s=document.createElement("ha-form");s.schema=Et,s.data=n,s.hass=this._hass,s.computeLabel=r=>r.label||r.name,s.addEventListener("value-changed",r=>{r.stopPropagation(),this._updateCat(i,r.detail.value)}),this._formEls.push(s),a.appendChild(s),a.appendChild(this._removeIconButton(()=>this._removeCat(i))),t.appendChild(a)})}_updateCat(t,e){let n=[...this._config.cats||[]];n[t]=e,this._fireConfigChanged({...this._config,cats:n})}_addCat(){let t=[...this._config.cats||[],{...At}];this._fireConfigChanged({...this._config,cats:t}),this._render()}_removeCat(t){let e=(this._config.cats||[]).filter((n,i)=>i!==t);this._fireConfigChanged({...this._config,cats:e}),this._render()}_renderInfoRows(){let t=this.shadowRoot.getElementById("info-rows");t.innerHTML="",(this._config.info_row||[]).forEach((n,i)=>{let a=document.createElement("div");a.className="row",a.dataset.index=String(i);let s=document.createElement("ha-form");s.schema=Tt,s.data=n,s.hass=this._hass,s.computeLabel=r=>r.label||r.name,s.addEventListener("value-changed",r=>{r.stopPropagation(),this._updateInfoRow(i,r.detail.value)}),this._formEls.push(s),a.appendChild(s),a.appendChild(this._removeIconButton(()=>this._removeInfoRow(i))),t.appendChild(a)})}_updateInfoRow(t,e){let n=[...this._config.info_row||[]];n[t]=e,this._fireConfigChanged({...this._config,info_row:n})}_addInfoRow(){let t=[...this._config.info_row||[],{...Lt}];this._fireConfigChanged({...this._config,info_row:t}),this._render()}_removeInfoRow(t){let e=(this._config.info_row||[]).filter((n,i)=>i!==t);this._fireConfigChanged({...this._config,info_row:e}),this._render()}_renderControlsRows(){let t=this.shadowRoot.getElementById("controls-rows");t.innerHTML="",(this._config.controls_row||[]).forEach((n,i)=>{let a=document.createElement("div");a.className="row",a.dataset.index=String(i);let s=document.createElement("ha-form");s.schema=Dt(n.action),s.data=n,s.hass=this._hass,s.computeLabel=r=>r.label||r.name,s.addEventListener("value-changed",r=>{r.stopPropagation(),this._updateControlRow(i,r.detail.value)}),this._formEls.push(s),a.appendChild(s),a.appendChild(this._removeIconButton(()=>this._removeControlRow(i))),t.appendChild(a)})}_updateControlRow(t,e){let n=[...this._config.controls_row||[]],i=n[t]&&n[t].action;n[t]=e,this._fireConfigChanged({...this._config,controls_row:n}),e.action!==i&&this._renderControlsRows()}_addControlRow(){let t=[...this._config.controls_row||[],{...kt}];this._fireConfigChanged({...this._config,controls_row:t}),this._render()}_removeControlRow(t){let e=(this._config.controls_row||[]).filter((n,i)=>i!==t);this._fireConfigChanged({...this._config,controls_row:e}),this._render()}_renderMainForm(){let t=this.shadowRoot.getElementById("main-section"),e=document.createElement("ha-form");e.schema=Nt,e.data=this._flattenMain(),e.hass=this._hass,e.computeLabel=n=>n.label||n.name,e.addEventListener("value-changed",n=>{n.stopPropagation(),this._onMainFormChanged(n.detail.value)}),this._formEls.push(e),t.appendChild(e)}};customElements.get("petkit-puramax-card")||customElements.define("petkit-puramax-card",$);customElements.get("petkit-puramax-card-editor")||customElements.define("petkit-puramax-card-editor",S);var H=window;H.customCards=H.customCards||[];H.customCards.push({type:"petkit-puramax-card",name:"PETKIT PURAMAX Card",description:"Configurable card for PETKIT PURAMAX litter box monitoring, controls, and per-cat visit analytics."});
//# sourceMappingURL=petkit-puramax-card.js.map
