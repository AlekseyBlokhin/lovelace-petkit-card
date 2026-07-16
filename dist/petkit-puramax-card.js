function x(o){let t=Math.round(o||0);if(t<60)return`${t}s`;let e=Math.floor(t/60),i=t%60;return`${e}m${i.toString().padStart(2,"0")}s`}function O(o){let t=Math.round(o||0),e=Math.floor(t/60),i=t%60;return`${e.toString().padStart(2,"0")}'${i.toString().padStart(2,"0")}"`}function V(o){let t=Math.floor(o);return t<1?"under 1h":t<48?`${t}h`:`${Math.floor(t/24)}d`}function y(o){return String(o).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function A(o,t=new Date){let e=new Date(t.getFullYear(),t.getMonth(),t.getDate());e.setDate(e.getDate()+o);let i=new Date(e);return i.setDate(i.getDate()+1),{start:e,end:i}}function F(o,t=new Date){if(o===0)return"Today";if(o===-1)return"Yesterday";let{start:e}=A(o,t);return e.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"})}function I(o){let t=new Date(o);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`}function T({startTime:o,endTime:t,entityIds:e,includeStartTimeState:i=!1}){let n=o instanceof Date?o.toISOString():o,s=t instanceof Date?t.toISOString():t;return{type:"history/history_during_period",start_time:n,end_time:s,entity_ids:e,minimal_response:!1,no_attributes:!0,include_start_time_state:i}}function bt(o){if(!o)return null;let t=o.s??o.state,e=parseFloat(t),i=o.lu?o.lu*1e3:o.last_changed?Date.parse(o.last_changed):null;return!Number.isFinite(e)||!i||Number.isNaN(i)?null:{value:e,ts:i}}function z(o,{minDelta:t=0,maxDelta:e=1/0}={}){if(!Array.isArray(o))return[];let i=o.map(bt).filter(Boolean).sort((s,a)=>s.ts-a.ts),n=[];for(let s=1;s<i.length;s++){let a=i[s].value-i[s-1].value;a>t&&a<e&&n.push({value:a,ts:i[s].ts})}return n}function U(o,t){if(!Array.isArray(o))return[];let e=new Set(t),i=[];for(let n of o){let s=n.s??n.state;if(!e.has(s))continue;let a=n.lu?n.lu*1e3:n.last_changed?Date.parse(n.last_changed):null;!a||Number.isNaN(a)||i.push({cat:s,ts:a})}return i.sort((n,s)=>n.ts-s.ts),i}var P=15e3;function W(o,t,{toleranceMs:e=P}={}){let i=0,n=null;return o.map(s=>{for(;i<t.length&&t[i].ts<=s.ts+e;)n=t[i].cat,i++;return{...s,cat:n}})}var xt=P;function j({ts:o,rawState:t,visits:e,cats:i,toleranceMs:n=xt}){let s=i.find(a=>t===`${a.name} used the litter box`);return s?e.some(a=>a.cat.name===s.name&&Math.abs(a.ts-o)<=n):!1}var wt=[10,15,30,60,120,180,300,600,900,1800,3600];function q(o){for(let t of wt)if(o/t<=5)return t;return Math.ceil(o/5/60)*60}function G({dayStart:o,niceMax:t,width:e,height:i,padding:n}){let{left:s,right:a,top:r,bottom:c}=n,u=e-s-a,h=i-r-c,d=o.getTime();return{xFor:v=>{let L=(v-d)/36e5;return s+L/24*u},yFor:v=>t?i-c-v/t*h:i-c}}function K({niceMax:o,yStep:t,width:e,height:i,padding:n}){let{left:s,right:a,top:r,bottom:c}=n,u=e-s-a,h=i-r-c,d=[4,8,12,16,20].map(p=>({hour:p,x:s+p/24*u,label:`${p.toString().padStart(2,"0")}:00`})),f=[];if(t>0)for(let p=0;p<=o;p+=t){let v=o?i-c-p/o*h:i-c;f.push({value:p,y:v,label:O(p)})}return{vertical:d,horizontal:f}}function X(o,{dayKeyFn:t}){let e={};for(let i of o||[]){let n=t(i.ts);e[n]||(e[n]={count:0,total:0}),e[n].count+=1,e[n].total+=i.value}return e}function Y(o,t){let e=Object.keys(o).filter(h=>h!==t).sort(),i=e.slice(-3),n=e.slice(-7),s=(h,d)=>h.length?h.reduce((f,p)=>f+o[p][d],0)/h.length:null,a=h=>{if(!h.length)return null;let d=h.reduce((p,v)=>p+o[v].total,0),f=h.reduce((p,v)=>p+o[v].count,0);return f>0?d/f:null},r=o[t],c=r?r.count:0,u=r?r.total:0;return{todayCount:c,todayTotal:u,todayAvgDuration:c>0?u/c:null,avg3dVisits:s(i,"count"),avg3dTotal:s(i,"total"),avg3dDuration:a(i),avg7dVisits:s(n,"count"),avg7dTotal:s(n,"total"),avg7dDuration:a(n),daysOfHistory:e.length}}function J({lastVisitTs:o,now:t,thresholdHours:e}){let i=t instanceof Date?t.getTime():t;if(o==null)return{alerting:!0,hoursSince:null};let n=(i-o)/36e5;return{alerting:n>=e,hoursSince:n}}function Q(o,t){let e=t;o.value_map&&t in o.value_map?e=o.value_map[t]:t!==null&&o.unit&&(e=`${t}${o.unit}`),e==null&&(e="\u2014");let i=parseFloat(t),n=!1;return o.warn_below!==void 0&&Number.isFinite(i)&&(n=i<o.warn_below),o.warn_above!==void 0&&Number.isFinite(i)&&(n=n||i>o.warn_above),o.warn_state!==void 0&&(n=n||t===o.warn_state),{display:e,warn:n}}function Z(o,t,e){return!t||!o||!o.states||!o.states[t]?e:o.states[t].state}function tt(o,t){let e=new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}});o.dispatchEvent(e)}function R(o,t,e,i){o.callService(t,e,i)}function E(o,t){t&&R(o,"button","press",{entity_id:t})}var et=`
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
`;var it={maintenance_mode:"Maintenance mode",manual_odor_completed:"Manual odor removal done",auto_cleaning_completed:"Auto cleaning done",no_events_yet:null,unavailable:null,unknown:null},nt="PETKIT PURAMAX",ot=60,st=8,at=1800,rt=600,ct=240,lt={left:46,right:10,top:10,bottom:28};var $=class extends HTMLElement{static getConfigElement(){return document.createElement("petkit-puramax-card-editor")}static getStubConfig(){return{type:"custom:petkit-puramax-card",title:"PETKIT PURAMAX",device_entities:{error:"sensor.example_petkit_error",last_event:"sensor.example_petkit_last_event",state:"sensor.example_petkit_state",total_use:"sensor.example_petkit_total_use"},cats:[{name:"Example Cat",color:"#4fc3f7"}]}}setConfig(t){if(!t)throw new Error("petkit-puramax-card: config is required");if(!t.device_entities)throw new Error('petkit-puramax-card: "device_entities" is required in config');if(!t.device_entities.total_use)throw new Error('petkit-puramax-card: "device_entities.total_use" is required in config');if(!t.cats)throw new Error('petkit-puramax-card: "cats" is required in config');if(!Array.isArray(t.cats)||t.cats.length<1)throw new Error('petkit-puramax-card: "cats" must be a non-empty array');if(t.cats.length>1&&!t.device_entities.last_used_by)throw new Error('petkit-puramax-card: "device_entities.last_used_by" is required in config when more than one cat is configured');t.cats.forEach((e,i)=>{if(!e||!e.name)throw new Error(`petkit-puramax-card: cats[${i}].name is required`);if(!e.color)throw new Error(`petkit-puramax-card: cats[${i}].color is required`)}),this._config=t,this._dayOffset=0,this._analytics=null,this._chartData=null,this._loadingChart=!1,this._loadingAnalytics=!1,this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}set hass(t){let e=this._hass;if(this._hass=t,!this._built){this._built=!0,this._render(),this._loadDay(),this._loadAnalytics(),this._startNoVisitTimer();return}this._updateLiveValues(),this._maybeRefreshOnNewVisit(e)}get hass(){return this._hass}getCardSize(){return 14}connectedCallback(){this._hass&&!this._built&&(this._built=!0,this._render(),this._loadDay(),this._loadAnalytics(),this._startNoVisitTimer())}disconnectedCallback(){this._noVisitTimer&&(clearInterval(this._noVisitTimer),this._noVisitTimer=null)}_startNoVisitTimer(){this._noVisitTimer||(this._noVisitTimer=setInterval(()=>this._checkNoVisitAlerts(),300*1e3))}_maybeRefreshOnNewVisit(t){if(!t)return;let e=this._config.device_entities.total_use,i=t.states[e],n=this._hass.states[e];n&&(!i||i.last_changed!==n.last_changed)&&(this._dayOffset===0&&this._loadDay(),this._loadAnalytics())}_s(t,e){return Z(this._hass,t,e)}async _fetchVisits({start:t,end:e}){let i=this._config,n=T({startTime:t,endTime:e,entityIds:[i.device_entities.total_use]}),s=[this._hass.callWS(n)];if(i.cats.length>1){let d=T({startTime:t,endTime:e,entityIds:[i.device_entities.last_used_by],includeStartTimeState:!0});s.push(this._hass.callWS(d))}let a={},r={};try{let[d,f]=await Promise.all(s);a=d||{},r=f||{}}catch{}let c=z(a[i.device_entities.total_use],{minDelta:0,maxDelta:at}),u;if(i.cats.length>1){let d=i.cats.map(p=>p.name),f=U(r[i.device_entities.last_used_by],d);u=W(c,f)}else u=c.map(d=>({...d,cat:i.cats[0].name}));let h=new Map(i.cats.map(d=>[d.name,d]));return u.filter(d=>h.has(d.cat)).map(d=>({cat:h.get(d.cat),duration:d.value,ts:d.ts}))}async _loadDay(){if(!this._hass)return;this._loadingChart=!0,this._renderChartArea();let t=this._config,{start:e,end:i}=A(this._dayOffset),n=[],s=[];try{let[a,r]=await Promise.all([this._fetchVisits({start:e,end:i}),t.device_entities.last_event?this._hass.callWS(T({startTime:e,endTime:i,entityIds:[t.device_entities.last_event]})):Promise.resolve({})]);n=a,s=(r||{})[t.device_entities.last_event]||[]}catch{n=[],s=[]}this._chartVisits=n,this._chartEventHist=s,this._loadingChart=!1,this._renderChartArea()}async _loadAnalytics(){if(!this._hass)return;this._loadingAnalytics=!0,this._renderAnalyticsArea();let t=this._config,e=new Date,i=new Date(e.getTime()-168*3600*1e3),n=[];try{n=await this._fetchVisits({start:i,end:e})}catch{n=[]}let s=I(e.getTime()),a={};t.cats.forEach(r=>{let c=n.filter(d=>d.cat===r).map(d=>({value:d.duration,ts:d.ts})),u=X(c,{dayKeyFn:I}),h=c.length?Math.max(...c.map(d=>d.ts)):null;a[r.name]={...Y(u,s),lastVisitTs:h}}),this._analytics=a,this._loadingAnalytics=!1,this._checkNoVisitAlerts(),this._renderAnalyticsArea()}_checkNoVisitAlerts(){if(!this._analytics||!this._built)return;let t=this._config,e=t.no_visit_alert_hours??st,i=Date.now();this._notifiedCats||(this._notifiedCats=new Set),t.cats.forEach(n=>{let s=this._analytics[n.name];if(!s)return;let a=J({lastVisitTs:s.lastVisitTs,now:i,thresholdHours:e});s.noVisitAlert=a;let r=this._notifiedCats.has(n.name);a.alerting&&!r?(this._notifiedCats.add(n.name),this._sendNoVisitNotification(n,a)):!a.alerting&&r&&this._notifiedCats.delete(n.name)}),this._renderAnalyticsArea()}_sendNoVisitNotification(t,e){let i=this._config.notify_service;if(!i||!this._hass)return;let n=i.indexOf(".");if(n===-1)return;let s=i.slice(0,n),a=i.slice(n+1);if(s!=="notify"||!a)return;let r=e.hoursSince==null?`${t.name} hasn't used the litter box yet in the tracked history.`:`${t.name} hasn't used the litter box in over ${Math.floor(e.hoursSince)}h.`;R(this._hass,"notify",a,{message:r,title:"Litter box alert"})}_render(){let t=this._config;this.shadowRoot.innerHTML=`
      <style>${et}</style>
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
    `,this.shadowRoot.getElementById("prev-day").addEventListener("click",()=>this._changeDay(-1)),this.shadowRoot.getElementById("next-day").addEventListener("click",()=>this._changeDay(1)),this._updateLiveValues(),this._renderChartArea(),this._renderAnalyticsArea()}_changeDay(t){this._dayOffset+=t,this._dayOffset>0&&(this._dayOffset=0),this._loadDay()}_updateLiveValues(){if(!this._built)return;let t=this._config,e=t.device_entities,i=this.shadowRoot.getElementById("status-row");if(i){let s=this._s(e.error,"no_error"),a=s&&s!=="no_error",r=t.info_row||[];i.innerHTML=[...r.map(c=>this._renderInfoChip(c)),a?this._chip("mdi:alert","Error",s.replace(/_/g," "),!0):""].join("")}let n=this.shadowRoot.getElementById("controls-row");if(n&&!n.dataset.bound){let s=t.controls_row||[];n.innerHTML=s.map((a,r)=>`
        <button class="ctrl-btn" id="ctrl-${r}"><ha-icon icon="${a.icon||"mdi:help"}"></ha-icon><span>${a.name||""}</span></button>
      `).join(""),n.dataset.bound="1",s.forEach((a,r)=>{this.shadowRoot.getElementById(`ctrl-${r}`).addEventListener("click",()=>this._runControlAction(a))})}}_renderInfoChip(t){let e=this._s(t.entity,null),{display:i,warn:n}=Q(t,e);return this._chip(t.icon||"mdi:information-outline",t.name||t.entity,i,n)}_runControlAction(t){switch(t.action){case"press":{t.confirm?window.confirm(t.confirm)&&E(this._hass,t.entity):E(this._hass,t.entity);break}case"toggle_maintenance":{let e=t.state_entity||this._config.device_entities.state;this._s(e,"")==="maintenance"?E(this._hass,t.exit_entity):E(this._hass,t.start_entity);break}case"toggle":{R(this._hass,"homeassistant","toggle",{entity_id:t.entity});break}case"more_info":{tt(this,t.entity);break}default:break}}_chip(t,e,i,n){return`
      <div class="chip ${n?"warn":""}">
        <ha-icon icon="${y(t)}"></ha-icon>
        <div class="chip-text"><div class="chip-label">${y(e)}</div><div class="chip-value">${y(i)}</div></div>
      </div>`}_renderChartArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("day-label");t&&(t.textContent=F(this._dayOffset));let e=this.shadowRoot.getElementById("next-day");e&&(e.disabled=this._dayOffset>=0);let i=this.shadowRoot.getElementById("chart-area"),n=this.shadowRoot.getElementById("records-list"),s=this.shadowRoot.getElementById("usage-body");if(!i||this._loadingChart)return;let a=this._config,r=(this._chartVisits||[]).slice().sort((l,_)=>l.ts-_.ts),c=rt,u=ct,h=lt,d=Math.max(60,...r.map(l=>l.duration)),f=q(d),p=Math.ceil(d/f)*f,{start:v}=A(this._dayOffset),{xFor:L,yFor:dt}=G({dayStart:v,niceMax:p,width:c,height:u,padding:h}),{vertical:H,horizontal:M}=K({niceMax:p,yStep:f,width:c,height:u,padding:h}),ht=H.map(l=>`<line x1="${l.x}" y1="${h.top}" x2="${l.x}" y2="${u-h.bottom}" class="grid-line-v" />`).join(""),ut=M.map(l=>`<line x1="${h.left}" y1="${l.y}" x2="${c-h.right}" y2="${l.y}" class="grid-line-h" />`).join(""),pt=(u-h.bottom)/u*100,_t=H.map(l=>`<div class="axis-label" style="left:${l.x/c*100}%;top:${pt}%">${l.label}</div>`).join(""),mt=M.map(l=>`<div class="axis-label-y" style="top:${l.y/u*100}%">${l.label}</div>`).join(""),ft=r.map((l,_)=>{let g=L(l.ts),m=dt(l.duration),b=u-h.bottom;return`<line x1="${g}" y1="${b}" x2="${g}" y2="${m}" stroke="${l.cat.color}" stroke-width="2" />
              <circle class="visit-point" cx="${g}" cy="${m}" r="5" fill="${l.cat.color}" />
              <line class="visit-hit" data-idx="${_}" x1="${g}" y1="${b}" x2="${g}" y2="${m}" stroke="transparent" stroke-width="16" />`}).join("");i.innerHTML=`
      <div class="chart-wrap">
        <svg viewBox="0 0 ${c} ${u}" class="chart-svg">
          ${ut}
          ${ht}
          ${ft||""}
        </svg>
        ${_t}
        ${mt}
        <div class="chart-tooltip" id="chart-tooltip"></div>
      </div>
      ${r.length===0?'<div class="empty-note">No visits recorded this day</div>':""}
    `;let w=this.shadowRoot.getElementById("chart-tooltip"),gt=i.querySelector(".chart-wrap");if(i.querySelectorAll(".visit-hit").forEach(l=>{l.addEventListener("mouseenter",()=>{let _=r[parseInt(l.dataset.idx,10)],g=new Date(_.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"});w.textContent=`${g} \xB7 ${_.cat.name} \xB7 ${x(_.duration)}`;let m=l.getBoundingClientRect(),b=gt.getBoundingClientRect();w.style.left=`${m.left-b.left+m.width/2}px`,w.style.top=`${m.top-b.top}px`,w.classList.add("visible")}),l.addEventListener("mouseleave",()=>{w.classList.remove("visible")})}),s){let l={};a.cats.forEach(m=>{l[m.name]={count:0}}),r.forEach(m=>{l[m.cat.name].count+=1});let _=r.length,g=a.cats.map(m=>{let b=l[m.name];return`<span class="usage-cat"><span class="dot" style="background:${m.color}"></span>${m.name}: ${b.count}</span>`}).join("");s.innerHTML=`
        <div class="usage-row">
          <div class="stat-value">${_} time${_===1?"":"s"}</div>
          <div class="usage-cats">${g}</div>
        </div>
      `}let C=r.map(l=>({ts:l.ts,icon:"mdi:cat",color:l.cat.color,text:`${l.cat.name} just spent ${x(l.duration)} in the litter box`})),vt=this._chartEventHist||[],D=this._eventLabels(),B=null,k=!1;vt.forEach(l=>{let _=l.s??l.state,g=l.lu?l.lu*1e3:l.last_changed?Date.parse(l.last_changed):null;if(!_||!g)return;if(_ in D&&D[_]===null){k=!0;return}let m=k&&_===B;if(B=_,k=!1,m||j({ts:g,rawState:_,visits:r,cats:a.cats}))return;let b=D[_]||_.replace(/_/g," ").replace(/\b\w/g,yt=>yt.toUpperCase());C.push({ts:g,icon:"mdi:information-outline",color:"var(--secondary-text-color)",text:b})}),C.sort((l,_)=>_.ts-l.ts),n&&(C.length===0?n.innerHTML='<div class="empty-note">No records for this day</div>':n.innerHTML=C.map(l=>`
          <div class="record-row">
            <div class="record-time">${new Date(l.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</div>
            <ha-icon icon="${y(l.icon)}" style="color:${y(l.color)}"></ha-icon>
            <div class="record-text">${y(l.text)}</div>
          </div>
        `).join(""))}_eventLabels(){return{...it,...this._config.event_labels||{}}}_renderAnalyticsArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("analytics-grid"),e=this.shadowRoot.getElementById("decline-banner"),i=this.shadowRoot.getElementById("no-visit-banner");if(!t||this._loadingAnalytics||!this._analytics)return;let n=this._config,s=(n.decline_threshold_pct||ot)/100,a=[];if(t.innerHTML=n.cats.map(r=>{let c=this._analytics[r.name]||{};return c.daysOfHistory>=3&&c.avg7dTotal&&new Date().getHours()>=18&&(c.todayTotal<s*c.avg7dTotal?a.push(`${r.name}'s usage today is well below their recent average \u2014 worth a check.`):c.todayTotal>(2-s)*c.avg7dTotal&&a.push(`${r.name}'s usage today is well above their recent average \u2014 worth a check.`)),`
        <div class="cat-analytics">
          <table>
            <tr><td class="cat-name-cell"><span class="dot" style="background:${y(r.color)}"></span>${y(r.name)}</td><td>Today</td><td>3d avg</td><td>7d avg</td></tr>
            <tr><td>Visits</td><td>${c.todayCount??0}</td><td>${c.avg3dVisits!==null&&c.avg3dVisits!==void 0?c.avg3dVisits.toFixed(1):"\u2014"}</td><td>${c.avg7dVisits!==null&&c.avg7dVisits!==void 0?c.avg7dVisits.toFixed(1):"\u2014"}</td></tr>
            <tr><td>Duration</td><td>${c.todayAvgDuration?x(c.todayAvgDuration):"\u2014"}</td><td>${c.avg3dDuration?x(c.avg3dDuration):"\u2014"}</td><td>${c.avg7dDuration?x(c.avg7dDuration):"\u2014"}</td></tr>
          </table>
        </div>
      `}).join(""),e&&(e.innerHTML=a.length?a.map(r=>`<div class="warn-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${r}</div>`).join(""):""),i){let r=n.cats.filter(c=>this._analytics[c.name]?.noVisitAlert?.alerting);i.innerHTML=r.length?r.map(c=>{let{hoursSince:u}=this._analytics[c.name].noVisitAlert,h=u==null?"no visits recorded yet":`last seen ${V(u)} ago`;return`<div class="no-visit-banner"><ha-icon icon="mdi:cat-alert"></ha-icon>${y(c.name)} hasn't used the litter box recently (${y(h)}).</div>`}).join(""):""}}};var Et=[{name:"name",label:"Name",selector:{text:{}}},{name:"color",label:"Color",selector:{ui_color:{}}}],Ct={name:"",color:"#4fc3f7"},At=[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"unit",label:"Unit",selector:{text:{}}},{name:"warn_below",label:"Warn below",selector:{number:{mode:"box"}}},{name:"warn_above",label:"Warn above",selector:{number:{mode:"box"}}},{name:"warn_state",label:"Warn state",selector:{text:{}}}],Tt={entity:"",name:"",icon:"mdi:information-outline"},Rt=["press","toggle_maintenance","toggle","more_info"],$t=[{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"action",label:"Action",selector:{select:{options:Rt,mode:"dropdown"}}}],St={press:[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"confirm",label:"Confirm text (optional)",selector:{text:{}}}],toggle:[{name:"entity",label:"Entity",selector:{entity:{}}}],more_info:[{name:"entity",label:"Entity",selector:{entity:{}}}],toggle_maintenance:[{name:"start_entity",label:"Start entity",selector:{entity:{domain:"button"}}},{name:"exit_entity",label:"Exit entity",selector:{entity:{domain:"button"}}},{name:"state_entity",label:"State entity (optional)",selector:{entity:{}}}]};function Lt(o){return[...$t,...St[o]||[]]}var Dt={name:"",icon:"mdi:gesture-tap-button",action:"press",entity:""},kt=[{name:"title",selector:{text:{}}},{name:"device_entities",type:"expandable",title:"Device entities",schema:[{name:"device_entities_total_use",label:"Total use sensor (required)",selector:{entity:{}}},{name:"device_entities_last_used_by",label:"Last used by sensor (required if more than one cat)",selector:{entity:{}}},{name:"device_entities_error",label:"Error sensor",selector:{entity:{}}},{name:"device_entities_last_event",label:"Last event sensor",selector:{entity:{}}},{name:"device_entities_state",label:"State sensor",selector:{entity:{}}}]},{name:"alerts",type:"expandable",title:"Analytics & alerts",schema:[{name:"decline_threshold_pct",label:"Decline/spike alert threshold (%)",selector:{number:{min:10,max:100,mode:"box"}}},{name:"no_visit_alert_hours",label:"Warn if no visit in (hours)",selector:{number:{min:1,max:168,mode:"box"}}},{name:"notify_service",label:"Push a notification too (optional)",selector:{entity:{domain:"notify"}}}]}],S=class extends HTMLElement{setConfig(t){this._config=t||{},this._render()}set hass(t){this._hass=t,(this._formEls||[]).forEach(e=>{e.hass=t})}get hass(){return this._hass}connectedCallback(){this._render()}_fireConfigChanged(t){this._config=t,this.dispatchEvent(new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:t}}))}_flattenMain(){let t=this._config||{},e=t.device_entities||{};return{title:t.title,device_entities_total_use:e.total_use,device_entities_last_used_by:e.last_used_by,device_entities_error:e.error,device_entities_last_event:e.last_event,device_entities_state:e.state,decline_threshold_pct:t.decline_threshold_pct,no_visit_alert_hours:t.no_visit_alert_hours,notify_service:t.notify_service}}_onMainFormChanged(t){let e={...this._config};e.title=t.title,e.device_entities={...e.device_entities||{},total_use:t.device_entities_total_use,last_used_by:t.device_entities_last_used_by,error:t.device_entities_error,last_event:t.device_entities_last_event,state:t.device_entities_state},e.decline_threshold_pct=t.decline_threshold_pct,e.no_visit_alert_hours=t.no_visit_alert_hours,e.notify_service=t.notify_service,this._fireConfigChanged(e)}_render(){if(this.shadowRoot||this.attachShadow({mode:"open"}),!this._config)return;this._formEls=[];let t=(this._config.cats||[]).length,e=(this._config.info_row||[]).length,i=(this._config.controls_row||[]).length;this.shadowRoot.innerHTML=`
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

        <ha-expansion-panel outlined header="Controls (${i})">
          <div class="panel-body">
            ${i===0?'<div class="empty-hint">No control buttons configured yet.</div>':""}
            <div id="controls-rows"></div>
            <div class="add-row">
              <button class="add-btn" id="add-control-row" type="button">
                <ha-icon icon="mdi:plus"></ha-icon>Add control
              </button>
            </div>
          </div>
        </ha-expansion-panel>
      </div>
    `,this._renderMainForm(),this._renderCats(),this._renderInfoRows(),this._renderControlsRows(),this.shadowRoot.getElementById("add-cat").addEventListener("click",()=>this._addCat()),this.shadowRoot.getElementById("add-info-row").addEventListener("click",()=>this._addInfoRow()),this.shadowRoot.getElementById("add-control-row").addEventListener("click",()=>this._addControlRow())}_removeIconButton(t){let e=document.createElement("ha-icon-button");e.className="remove-btn",e.label="Remove";let i=document.createElement("ha-icon");return i.setAttribute("icon","mdi:delete-outline"),e.appendChild(i),e.addEventListener("click",t),e}_renderCats(){let t=this.shadowRoot.getElementById("cats-rows");t.innerHTML="",(this._config.cats||[]).forEach((i,n)=>{let s=document.createElement("div");s.className="row",s.dataset.index=String(n);let a=document.createElement("ha-form");a.schema=Et,a.data=i,a.hass=this._hass,a.computeLabel=r=>r.label||r.name,a.addEventListener("value-changed",r=>{r.stopPropagation(),this._updateCat(n,r.detail.value)}),this._formEls.push(a),s.appendChild(a),s.appendChild(this._removeIconButton(()=>this._removeCat(n))),t.appendChild(s)})}_updateCat(t,e){let i=[...this._config.cats||[]];i[t]=e,this._fireConfigChanged({...this._config,cats:i})}_addCat(){let t=[...this._config.cats||[],{...Ct}];this._fireConfigChanged({...this._config,cats:t}),this._render()}_removeCat(t){let e=(this._config.cats||[]).filter((i,n)=>n!==t);this._fireConfigChanged({...this._config,cats:e}),this._render()}_renderInfoRows(){let t=this.shadowRoot.getElementById("info-rows");t.innerHTML="",(this._config.info_row||[]).forEach((i,n)=>{let s=document.createElement("div");s.className="row",s.dataset.index=String(n);let a=document.createElement("ha-form");a.schema=At,a.data=i,a.hass=this._hass,a.computeLabel=r=>r.label||r.name,a.addEventListener("value-changed",r=>{r.stopPropagation(),this._updateInfoRow(n,r.detail.value)}),this._formEls.push(a),s.appendChild(a),s.appendChild(this._removeIconButton(()=>this._removeInfoRow(n))),t.appendChild(s)})}_updateInfoRow(t,e){let i=[...this._config.info_row||[]];i[t]=e,this._fireConfigChanged({...this._config,info_row:i})}_addInfoRow(){let t=[...this._config.info_row||[],{...Tt}];this._fireConfigChanged({...this._config,info_row:t}),this._render()}_removeInfoRow(t){let e=(this._config.info_row||[]).filter((i,n)=>n!==t);this._fireConfigChanged({...this._config,info_row:e}),this._render()}_renderControlsRows(){let t=this.shadowRoot.getElementById("controls-rows");t.innerHTML="",(this._config.controls_row||[]).forEach((i,n)=>{let s=document.createElement("div");s.className="row",s.dataset.index=String(n);let a=document.createElement("ha-form");a.schema=Lt(i.action),a.data=i,a.hass=this._hass,a.computeLabel=r=>r.label||r.name,a.addEventListener("value-changed",r=>{r.stopPropagation(),this._updateControlRow(n,r.detail.value)}),this._formEls.push(a),s.appendChild(a),s.appendChild(this._removeIconButton(()=>this._removeControlRow(n))),t.appendChild(s)})}_updateControlRow(t,e){let i=[...this._config.controls_row||[]],n=i[t]&&i[t].action;i[t]=e,this._fireConfigChanged({...this._config,controls_row:i}),e.action!==n&&this._renderControlsRows()}_addControlRow(){let t=[...this._config.controls_row||[],{...Dt}];this._fireConfigChanged({...this._config,controls_row:t}),this._render()}_removeControlRow(t){let e=(this._config.controls_row||[]).filter((i,n)=>n!==t);this._fireConfigChanged({...this._config,controls_row:e}),this._render()}_renderMainForm(){let t=this.shadowRoot.getElementById("main-section"),e=document.createElement("ha-form");e.schema=kt,e.data=this._flattenMain(),e.hass=this._hass,e.computeLabel=i=>i.label||i.name,e.addEventListener("value-changed",i=>{i.stopPropagation(),this._onMainFormChanged(i.detail.value)}),this._formEls.push(e),t.appendChild(e)}};customElements.get("petkit-puramax-card")||customElements.define("petkit-puramax-card",$);customElements.get("petkit-puramax-card-editor")||customElements.define("petkit-puramax-card-editor",S);var N=window;N.customCards=N.customCards||[];N.customCards.push({type:"petkit-puramax-card",name:"PETKIT PURAMAX Card",description:"Configurable card for PETKIT PURAMAX litter box monitoring, controls, and per-cat visit analytics."});
//# sourceMappingURL=petkit-puramax-card.js.map
