function x(n){let t=Math.round(n||0);if(t<60)return`${t}s`;let e=Math.floor(t/60),o=t%60;return`${e}m${o.toString().padStart(2,"0")}s`}function B(n){let t=Math.round(n||0),e=Math.floor(t/60),o=t%60;return`${e.toString().padStart(2,"0")}'${o.toString().padStart(2,"0")}"`}function b(n){return String(n).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function A(n,t=new Date){let e=new Date(t.getFullYear(),t.getMonth(),t.getDate());e.setDate(e.getDate()+n);let o=new Date(e);return o.setDate(o.getDate()+1),{start:e,end:o}}function O(n,t=new Date){if(n===0)return"Today";if(n===-1)return"Yesterday";let{start:e}=A(n,t);return e.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"})}function D(n){let t=new Date(n);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`}function k({startTime:n,endTime:t,entityIds:e}){let o=n instanceof Date?n.toISOString():n,i=t instanceof Date?t.toISOString():t;return{type:"history/history_during_period",start_time:o,end_time:i,entity_ids:e,minimal_response:!1,no_attributes:!0,include_start_time_state:!1}}function dt(n){if(!n)return null;let t=n.s??n.state,e=parseFloat(t),o=n.lu?n.lu*1e3:n.last_changed?Date.parse(n.last_changed):null;return!Number.isFinite(e)||!o||Number.isNaN(o)?null:{value:e,ts:o}}function S(n,{filterPositive:t=!0}={}){if(!Array.isArray(n))return[];let e=[];for(let o of n){let i=dt(o);i&&(t&&i.value<=0||e.push(i))}return e}var ht=[10,15,30,60,120,180,300,600,900,1800,3600];function F(n){for(let t of ht)if(n/t<=5)return t;return Math.ceil(n/5/60)*60}function z({dayStart:n,niceMax:t,width:e,height:o,padding:i}){let{left:s,right:r,top:a,bottom:l}=i,_=e-s-r,d=o-a-l,m=n.getTime();return{xFor:g=>{let T=(g-m)/36e5;return s+T/24*_},yFor:g=>t?o-l-g/t*d:o-l}}function W({niceMax:n,yStep:t,width:e,height:o,padding:i}){let{left:s,right:r,top:a,bottom:l}=i,_=e-s-r,d=o-a-l,m=[4,8,12,16,20].map(h=>({hour:h,x:s+h/24*_,label:`${h.toString().padStart(2,"0")}:00`})),v=[];if(t>0)for(let h=0;h<=n;h+=t){let g=n?o-l-h/n*d:o-l;v.push({value:h,y:g,label:B(h)})}return{vertical:m,horizontal:v}}function P(n,{dayKeyFn:t}){let e={};for(let o of n||[]){let i=t(o.ts);e[i]||(e[i]={count:0,total:0}),e[i].count+=1,e[i].total+=o.value}return e}function j(n,t){let e=Object.keys(n).filter(d=>d!==t).sort(),o=e.slice(-3),i=e.slice(-7),s=(d,m)=>d.length?d.reduce((v,h)=>v+n[h][m],0)/d.length:null,r=d=>{if(!d.length)return null;let m=d.reduce((h,g)=>h+n[g].total,0),v=d.reduce((h,g)=>h+n[g].count,0);return v>0?m/v:null},a=n[t],l=a?a.count:0,_=a?a.total:0;return{todayCount:l,todayTotal:_,todayAvgDuration:l>0?_/l:null,avg3dVisits:s(o,"count"),avg3dTotal:s(o,"total"),avg3dDuration:r(o),avg7dVisits:s(i,"count"),avg7dTotal:s(i,"total"),avg7dDuration:r(i),daysOfHistory:e.length}}function U(n,t){let e=t;n.value_map&&t in n.value_map?e=n.value_map[t]:t!==null&&n.unit&&(e=`${t}${n.unit}`),e==null&&(e="\u2014");let o=parseFloat(t),i=!1;return n.warn_below!==void 0&&Number.isFinite(o)&&(i=o<n.warn_below),n.warn_above!==void 0&&Number.isFinite(o)&&(i=i||o>n.warn_above),n.warn_state!==void 0&&(i=i||t===n.warn_state),{display:e,warn:i}}function G(n,t,e){return!t||!n||!n.states||!n.states[t]?e:n.states[t].state}function V(n,t){let e=new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}});n.dispatchEvent(e)}function H(n,t,e,o){n.callService(t,e,o)}function E(n,t){t&&H(n,"button","press",{entity_id:t})}var q=`
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
`;var K={maintenance_mode:"Maintenance mode",manual_odor_completed:"Manual odor removal done",auto_cleaning_completed:"Auto cleaning done",no_events_yet:null,unavailable:null,unknown:null},Y="PETKIT PURAMAX",X=60,J=600,Q=240,Z={left:46,right:10,top:10,bottom:28};var R=class extends HTMLElement{static getConfigElement(){return document.createElement("petkit-puramax-card-editor")}static getStubConfig(){return{type:"custom:petkit-puramax-card",title:"PETKIT PURAMAX",device_entities:{error:"sensor.example_petkit_error",last_event:"sensor.example_petkit_last_event",state:"sensor.example_petkit_state"},cats:[{name:"Example Cat",color:"#4fc3f7",last_visit_duration_entity:"input_number.example_cat_last_visit_duration"}]}}setConfig(t){if(!t)throw new Error("petkit-puramax-card: config is required");if(!t.device_entities)throw new Error('petkit-puramax-card: "device_entities" is required in config');if(!t.cats)throw new Error('petkit-puramax-card: "cats" is required in config');if(!Array.isArray(t.cats)||t.cats.length<1)throw new Error('petkit-puramax-card: "cats" must be a non-empty array');t.cats.forEach((e,o)=>{if(!e||!e.name)throw new Error(`petkit-puramax-card: cats[${o}].name is required`);if(!e.color)throw new Error(`petkit-puramax-card: cats[${o}].color is required`);if(!e.last_visit_duration_entity)throw new Error(`petkit-puramax-card: cats[${o}].last_visit_duration_entity is required`)}),this._config=t,this._dayOffset=0,this._analytics=null,this._chartData=null,this._loadingChart=!1,this._loadingAnalytics=!1,this._catWatermarks={},this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}set hass(t){let e=this._hass;if(this._hass=t,!this._built){this._built=!0,this._render(),this._loadDay(),this._loadAnalytics();return}this._updateLiveValues(),this._maybeRefreshOnNewVisit(e)}get hass(){return this._hass}getCardSize(){return 14}connectedCallback(){this._hass&&!this._built&&(this._built=!0,this._render(),this._loadDay(),this._loadAnalytics())}_maybeRefreshOnNewVisit(t){if(!t)return;let e=this._config,o=!1;e.cats.forEach(i=>{let s=i.last_visit_duration_entity,r=t.states[s],a=this._hass.states[s];a&&(!r||r.last_changed!==a.last_changed)&&(o=!0)}),o&&(this._dayOffset===0&&this._loadDay(),this._loadAnalytics())}_s(t,e){return G(this._hass,t,e)}async _loadDay(){if(!this._hass)return;this._loadingChart=!0,this._renderChartArea();let t=this._config,{start:e,end:o}=A(this._dayOffset),i=[...t.cats.map(s=>s.last_visit_duration_entity),t.device_entities.last_event].filter(Boolean);try{let s=await this._hass.callWS(k({startTime:e,endTime:o,entityIds:i}));this._chartData=s||{}}catch{this._chartData={}}this._loadingChart=!1,this._renderChartArea()}async _loadAnalytics(){if(!this._hass)return;this._loadingAnalytics=!0,this._renderAnalyticsArea();let t=this._config,e=new Date,o=new Date(e.getTime()-168*3600*1e3),i=t.cats.map(l=>l.last_visit_duration_entity),s={};try{s=await this._hass.callWS(k({startTime:o,endTime:e,entityIds:i}))}catch{s={}}let r=D(e.getTime()),a={};t.cats.forEach(l=>{let _=S(s[l.last_visit_duration_entity]),d=P(_,{dayKeyFn:D});a[l.name]=j(d,r)}),this._analytics=a,this._loadingAnalytics=!1,this._renderAnalyticsArea()}_render(){let t=this._config;this.shadowRoot.innerHTML=`
      <style>${q}</style>
      <ha-card>
        <div class="header">
          <div class="title">${t.title||Y}</div>
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
          <div id="decline-banner"></div>
          <div class="analytics-grid" id="analytics-grid"></div>
        </div>
        <div class="records-section">
          <div class="section-title">Working Records</div>
          <div class="records-list" id="records-list"></div>
        </div>
      </ha-card>
    `,this.shadowRoot.getElementById("prev-day").addEventListener("click",()=>this._changeDay(-1)),this.shadowRoot.getElementById("next-day").addEventListener("click",()=>this._changeDay(1)),this._updateLiveValues(),this._renderChartArea(),this._renderAnalyticsArea()}_changeDay(t){this._dayOffset+=t,this._dayOffset>0&&(this._dayOffset=0),this._loadDay()}_updateLiveValues(){if(!this._built)return;let t=this._config,e=t.device_entities,o=this.shadowRoot.getElementById("status-row");if(o){let s=this._s(e.error,"no_error"),r=s&&s!=="no_error",a=t.info_row||[];o.innerHTML=[...a.map(l=>this._renderInfoChip(l)),r?this._chip("mdi:alert","Error",s.replace(/_/g," "),!0):""].join("")}let i=this.shadowRoot.getElementById("controls-row");if(i&&!i.dataset.bound){let s=t.controls_row||[];i.innerHTML=s.map((r,a)=>`
        <button class="ctrl-btn" id="ctrl-${a}"><ha-icon icon="${r.icon||"mdi:help"}"></ha-icon><span>${r.name||""}</span></button>
      `).join(""),i.dataset.bound="1",s.forEach((r,a)=>{this.shadowRoot.getElementById(`ctrl-${a}`).addEventListener("click",()=>this._runControlAction(r))})}}_renderInfoChip(t){let e=this._s(t.entity,null),{display:o,warn:i}=U(t,e);return this._chip(t.icon||"mdi:information-outline",t.name||t.entity,o,i)}_runControlAction(t){switch(t.action){case"press":{t.confirm?window.confirm(t.confirm)&&E(this._hass,t.entity):E(this._hass,t.entity);break}case"toggle_maintenance":{let e=t.state_entity||this._config.device_entities.state;this._s(e,"")==="maintenance"?E(this._hass,t.exit_entity):E(this._hass,t.start_entity);break}case"toggle":{H(this._hass,"homeassistant","toggle",{entity_id:t.entity});break}case"more_info":{V(this,t.entity);break}default:break}}_chip(t,e,o,i){return`
      <div class="chip ${i?"warn":""}">
        <ha-icon icon="${b(t)}"></ha-icon>
        <div class="chip-text"><div class="chip-label">${b(e)}</div><div class="chip-value">${b(o)}</div></div>
      </div>`}_renderChartArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("day-label");t&&(t.textContent=O(this._dayOffset));let e=this.shadowRoot.getElementById("next-day");e&&(e.disabled=this._dayOffset>=0);let o=this.shadowRoot.getElementById("chart-area"),i=this.shadowRoot.getElementById("records-list"),s=this.shadowRoot.getElementById("usage-body");if(!o||this._loadingChart)return;let r=this._config,a=this._chartData||{},l=[];r.cats.forEach(c=>{S(a[c.last_visit_duration_entity]).forEach(f=>l.push({cat:c,duration:f.value,ts:f.ts}))}),l.sort((c,u)=>c.ts-u.ts);let _=J,d=Q,m=Z,v=Math.max(60,...l.map(c=>c.duration)),h=F(v),g=Math.ceil(v/h)*h,{start:T}=A(this._dayOffset),{xFor:tt,yFor:et}=z({dayStart:T,niceMax:g,width:_,height:d,padding:m}),{vertical:M,horizontal:N}=W({niceMax:g,yStep:h,width:_,height:d,padding:m}),ot=M.map(c=>`<line x1="${c.x}" y1="${m.top}" x2="${c.x}" y2="${d-m.bottom}" class="grid-line-v" />`).join(""),nt=N.map(c=>`<line x1="${m.left}" y1="${c.y}" x2="${_-m.right}" y2="${c.y}" class="grid-line-h" />`).join(""),it=(d-m.bottom)/d*100,at=M.map(c=>`<div class="axis-label" style="left:${c.x/_*100}%;top:${it}%">${c.label}</div>`).join(""),st=N.map(c=>`<div class="axis-label-y" style="top:${c.y/d*100}%">${c.label}</div>`).join(""),rt=l.map((c,u)=>{let f=tt(c.ts),p=et(c.duration),y=d-m.bottom;return`<line x1="${f}" y1="${y}" x2="${f}" y2="${p}" stroke="${c.cat.color}" stroke-width="2" />
              <circle class="visit-point" cx="${f}" cy="${p}" r="5" fill="${c.cat.color}" />
              <line class="visit-hit" data-idx="${u}" x1="${f}" y1="${y}" x2="${f}" y2="${p}" stroke="transparent" stroke-width="16" />`}).join("");o.innerHTML=`
      <div class="chart-wrap">
        <svg viewBox="0 0 ${_} ${d}" class="chart-svg">
          ${nt}
          ${ot}
          ${rt||""}
        </svg>
        ${at}
        ${st}
        <div class="chart-tooltip" id="chart-tooltip"></div>
      </div>
      ${l.length===0?'<div class="empty-note">No visits recorded this day</div>':""}
    `;let w=this.shadowRoot.getElementById("chart-tooltip"),ct=o.querySelector(".chart-wrap");if(o.querySelectorAll(".visit-hit").forEach(c=>{c.addEventListener("mouseenter",()=>{let u=l[parseInt(c.dataset.idx,10)],f=new Date(u.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"});w.textContent=`${f} \xB7 ${u.cat.name} \xB7 ${x(u.duration)}`;let p=c.getBoundingClientRect(),y=ct.getBoundingClientRect();w.style.left=`${p.left-y.left+p.width/2}px`,w.style.top=`${p.top-y.top}px`,w.classList.add("visible")}),c.addEventListener("mouseleave",()=>{w.classList.remove("visible")})}),s){let c={};r.cats.forEach(p=>{c[p.name]={count:0}}),l.forEach(p=>{c[p.cat.name].count+=1});let u=l.length,f=r.cats.map(p=>{let y=c[p.name];return`<span class="usage-cat"><span class="dot" style="background:${p.color}"></span>${p.name}: ${y.count}</span>`}).join("");s.innerHTML=`
        <div class="usage-row">
          <div class="stat-value">${u} time${u===1?"":"s"}</div>
          <div class="usage-cats">${f}</div>
        </div>
      `}let C=l.map(c=>({ts:c.ts,icon:"mdi:cat",color:c.cat.color,text:`${c.cat.name} just spent ${x(c.duration)} in the litter box`})),lt=a[r.device_entities.last_event]||[],$=this._eventLabels();lt.forEach(c=>{let u=c.s??c.state,f=c.lu?c.lu*1e3:c.last_changed?Date.parse(c.last_changed):null;if(!u||!f||u in $&&$[u]===null)return;let p=$[u]||u.replace(/_/g," ").replace(/\b\w/g,y=>y.toUpperCase());C.push({ts:f,icon:"mdi:information-outline",color:"var(--secondary-text-color)",text:p})}),C.sort((c,u)=>u.ts-c.ts),i&&(C.length===0?i.innerHTML='<div class="empty-note">No records for this day</div>':i.innerHTML=C.map(c=>`
          <div class="record-row">
            <div class="record-time">${new Date(c.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</div>
            <ha-icon icon="${b(c.icon)}" style="color:${b(c.color)}"></ha-icon>
            <div class="record-text">${b(c.text)}</div>
          </div>
        `).join(""))}_eventLabels(){return{...K,...this._config.event_labels||{}}}_renderAnalyticsArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("analytics-grid"),e=this.shadowRoot.getElementById("decline-banner");if(!t||this._loadingAnalytics||!this._analytics)return;let o=this._config,i=(o.decline_threshold_pct||X)/100,s=[];t.innerHTML=o.cats.map(r=>{let a=this._analytics[r.name]||{};return a.daysOfHistory>=3&&a.avg7dTotal&&new Date().getHours()>=18&&(a.todayTotal<i*a.avg7dTotal?s.push(`${r.name}'s usage today is well below their recent average \u2014 worth a check.`):a.todayTotal>(2-i)*a.avg7dTotal&&s.push(`${r.name}'s usage today is well above their recent average \u2014 worth a check.`)),`
        <div class="cat-analytics">
          <table>
            <tr><td class="cat-name-cell"><span class="dot" style="background:${b(r.color)}"></span>${b(r.name)}</td><td>Today</td><td>3d avg</td><td>7d avg</td></tr>
            <tr><td>Visits</td><td>${a.todayCount??0}</td><td>${a.avg3dVisits!==null&&a.avg3dVisits!==void 0?a.avg3dVisits.toFixed(1):"\u2014"}</td><td>${a.avg7dVisits!==null&&a.avg7dVisits!==void 0?a.avg7dVisits.toFixed(1):"\u2014"}</td></tr>
            <tr><td>Duration</td><td>${a.todayAvgDuration?x(a.todayAvgDuration):"\u2014"}</td><td>${a.avg3dDuration?x(a.avg3dDuration):"\u2014"}</td><td>${a.avg7dDuration?x(a.avg7dDuration):"\u2014"}</td></tr>
          </table>
        </div>
      `}).join(""),e&&(e.innerHTML=s.length?s.map(r=>`<div class="warn-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${r}</div>`).join(""):"")}};var ut=[{name:"name",label:"Name",selector:{text:{}}},{name:"color",label:"Color",selector:{text:{}}},{name:"last_visit_duration_entity",label:"Last visit duration entity",selector:{entity:{domain:"input_number"}}}],pt={name:"",color:"#4fc3f7",last_visit_duration_entity:""},mt=[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"unit",label:"Unit",selector:{text:{}}},{name:"warn_below",label:"Warn below",selector:{number:{mode:"box"}}},{name:"warn_above",label:"Warn above",selector:{number:{mode:"box"}}},{name:"warn_state",label:"Warn state",selector:{text:{}}}],ft={entity:"",name:"",icon:"mdi:information-outline"},_t=["press","toggle_maintenance","toggle","more_info"],gt=[{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"action",label:"Action",selector:{select:{options:_t,mode:"dropdown"}}}],vt={press:[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"confirm",label:"Confirm text (optional)",selector:{text:{}}}],toggle:[{name:"entity",label:"Entity",selector:{entity:{}}}],more_info:[{name:"entity",label:"Entity",selector:{entity:{}}}],toggle_maintenance:[{name:"start_entity",label:"Start entity",selector:{entity:{domain:"button"}}},{name:"exit_entity",label:"Exit entity",selector:{entity:{domain:"button"}}},{name:"state_entity",label:"State entity (optional)",selector:{entity:{}}}]};function yt(n){return[...gt,...vt[n]||[]]}var bt={name:"",icon:"mdi:gesture-tap-button",action:"press",entity:""},xt=[{name:"title",selector:{text:{}}},{name:"device_entities",type:"expandable",title:"Device entities",schema:[{name:"device_entities_error",label:"Error sensor",selector:{entity:{}}},{name:"device_entities_last_event",label:"Last event sensor",selector:{entity:{}}},{name:"device_entities_state",label:"State sensor",selector:{entity:{}}}]},{name:"decline_threshold_pct",label:"Decline/spike alert threshold (%)",selector:{number:{min:10,max:100,mode:"box"}}}],L=class extends HTMLElement{setConfig(t){this._config=t||{},this._render()}set hass(t){this._hass=t,this._render()}get hass(){return this._hass}connectedCallback(){this._render()}_fireConfigChanged(t){this._config=t,this.dispatchEvent(new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:t}}))}_flattenMain(){let t=this._config||{},e=t.device_entities||{};return{title:t.title,device_entities_error:e.error,device_entities_last_event:e.last_event,device_entities_state:e.state,decline_threshold_pct:t.decline_threshold_pct}}_onMainFormChanged(t){let e={...this._config};e.title=t.title,e.device_entities={...e.device_entities||{},error:t.device_entities_error,last_event:t.device_entities_last_event,state:t.device_entities_state},e.decline_threshold_pct=t.decline_threshold_pct,this._fireConfigChanged(e)}_render(){this.shadowRoot||this.attachShadow({mode:"open"}),this._config&&(this.shadowRoot.innerHTML=`
      <style>
        .editor { display: flex; flex-direction: column; gap: 16px; padding: 8px 0; }
        .section-title { font-weight: 500; margin-bottom: 4px; }
        .row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .row ha-form { flex: 1 1 auto; }
        .remove-btn, .add-btn { cursor: pointer; border: 1px solid var(--divider-color, #ccc); border-radius: 6px; background: none; padding: 6px 10px; font-size: 0.85em; }
        .remove-btn:hover, .add-btn:hover { background: var(--secondary-background-color, #eee); }
      </style>
      <div class="editor">
        <div id="main-section"></div>
        <div class="section">
          <div class="section-title">Cats</div>
          <div id="cats-rows"></div>
          <button class="add-btn" id="add-cat" type="button">+ Add cat</button>
        </div>
        <div class="section">
          <div class="section-title">Info row (status chips)</div>
          <div id="info-rows"></div>
          <button class="add-btn" id="add-info-row" type="button">+ Add chip</button>
        </div>
        <div class="section">
          <div class="section-title">Controls row (buttons)</div>
          <div id="controls-rows"></div>
          <button class="add-btn" id="add-control-row" type="button">+ Add control</button>
        </div>
      </div>
    `,this._renderMainForm(),this._renderCats(),this._renderInfoRows(),this._renderControlsRows(),this.shadowRoot.getElementById("add-cat").addEventListener("click",()=>this._addCat()),this.shadowRoot.getElementById("add-info-row").addEventListener("click",()=>this._addInfoRow()),this.shadowRoot.getElementById("add-control-row").addEventListener("click",()=>this._addControlRow()))}_renderCats(){let t=this.shadowRoot.getElementById("cats-rows");t.innerHTML="",(this._config.cats||[]).forEach((o,i)=>{let s=document.createElement("div");s.className="row",s.dataset.index=String(i);let r=document.createElement("ha-form");r.schema=ut,r.data=o,r.hass=this._hass,r.computeLabel=l=>l.label||l.name,r.addEventListener("value-changed",l=>{l.stopPropagation(),this._updateCat(i,l.detail.value)});let a=document.createElement("button");a.className="remove-btn",a.type="button",a.textContent="Remove",a.addEventListener("click",()=>this._removeCat(i)),s.appendChild(r),s.appendChild(a),t.appendChild(s)})}_updateCat(t,e){let o=[...this._config.cats||[]];o[t]=e,this._fireConfigChanged({...this._config,cats:o})}_addCat(){let t=[...this._config.cats||[],{...pt}];this._fireConfigChanged({...this._config,cats:t}),this._render()}_removeCat(t){let e=(this._config.cats||[]).filter((o,i)=>i!==t);this._fireConfigChanged({...this._config,cats:e}),this._render()}_renderInfoRows(){let t=this.shadowRoot.getElementById("info-rows");t.innerHTML="",(this._config.info_row||[]).forEach((o,i)=>{let s=document.createElement("div");s.className="row",s.dataset.index=String(i);let r=document.createElement("ha-form");r.schema=mt,r.data=o,r.hass=this._hass,r.computeLabel=l=>l.label||l.name,r.addEventListener("value-changed",l=>{l.stopPropagation(),this._updateInfoRow(i,l.detail.value)});let a=document.createElement("button");a.className="remove-btn",a.type="button",a.textContent="Remove",a.addEventListener("click",()=>this._removeInfoRow(i)),s.appendChild(r),s.appendChild(a),t.appendChild(s)})}_updateInfoRow(t,e){let o=[...this._config.info_row||[]];o[t]=e,this._fireConfigChanged({...this._config,info_row:o})}_addInfoRow(){let t=[...this._config.info_row||[],{...ft}];this._fireConfigChanged({...this._config,info_row:t}),this._render()}_removeInfoRow(t){let e=(this._config.info_row||[]).filter((o,i)=>i!==t);this._fireConfigChanged({...this._config,info_row:e}),this._render()}_renderControlsRows(){let t=this.shadowRoot.getElementById("controls-rows");t.innerHTML="",(this._config.controls_row||[]).forEach((o,i)=>{let s=document.createElement("div");s.className="row",s.dataset.index=String(i);let r=document.createElement("ha-form");r.schema=yt(o.action),r.data=o,r.hass=this._hass,r.computeLabel=l=>l.label||l.name,r.addEventListener("value-changed",l=>{l.stopPropagation(),this._updateControlRow(i,l.detail.value)});let a=document.createElement("button");a.className="remove-btn",a.type="button",a.textContent="Remove",a.addEventListener("click",()=>this._removeControlRow(i)),s.appendChild(r),s.appendChild(a),t.appendChild(s)})}_updateControlRow(t,e){let o=[...this._config.controls_row||[]],i=o[t]&&o[t].action;o[t]=e,this._fireConfigChanged({...this._config,controls_row:o}),e.action!==i&&this._renderControlsRows()}_addControlRow(){let t=[...this._config.controls_row||[],{...bt}];this._fireConfigChanged({...this._config,controls_row:t}),this._render()}_removeControlRow(t){let e=(this._config.controls_row||[]).filter((o,i)=>i!==t);this._fireConfigChanged({...this._config,controls_row:e}),this._render()}_renderMainForm(){let t=this.shadowRoot.getElementById("main-section"),e=document.createElement("ha-form");e.schema=xt,e.data=this._flattenMain(),e.hass=this._hass,e.computeLabel=o=>o.label||o.name,e.addEventListener("value-changed",o=>{o.stopPropagation(),this._onMainFormChanged(o.detail.value)}),t.appendChild(e)}};customElements.get("petkit-puramax-card")||customElements.define("petkit-puramax-card",R);customElements.get("petkit-puramax-card-editor")||customElements.define("petkit-puramax-card-editor",L);var I=window;I.customCards=I.customCards||[];I.customCards.push({type:"petkit-puramax-card",name:"PETKIT PURAMAX Card",description:"Configurable card for PETKIT PURAMAX litter box monitoring, controls, and per-cat visit analytics."});
//# sourceMappingURL=petkit-puramax-card.js.map
