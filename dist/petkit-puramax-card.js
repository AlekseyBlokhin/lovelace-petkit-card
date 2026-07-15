function x(n){let t=Math.round(n||0);if(t<60)return`${t}s`;let e=Math.floor(t/60),o=t%60;return`${e}m${o.toString().padStart(2,"0")}s`}function y(n){return String(n).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function L(n,t=new Date){let e=new Date(t.getFullYear(),t.getMonth(),t.getDate());e.setDate(e.getDate()+n);let o=new Date(e);return o.setDate(o.getDate()+1),{start:e,end:o}}function M(n,t=new Date){if(n===0)return"Today";if(n===-1)return"Yesterday";let{start:e}=L(n,t);return e.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"})}function k(n){let t=new Date(n);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`}function D({startTime:n,endTime:t,entityIds:e}){let o=n instanceof Date?n.toISOString():n,i=t instanceof Date?t.toISOString():t;return{type:"history/history_during_period",start_time:o,end_time:i,entity_ids:e,minimal_response:!1,no_attributes:!0,include_start_time_state:!1}}function st(n){if(!n)return null;let t=n.s??n.state,e=parseFloat(t),o=n.lu?n.lu*1e3:n.last_changed?Date.parse(n.last_changed):null;return!Number.isFinite(e)||!o||Number.isNaN(o)?null:{value:e,ts:o}}function S(n,{filterPositive:t=!0}={}){if(!Array.isArray(n))return[];let e=[];for(let o of n){let i=st(o);i&&(t&&i.value<=0||e.push(i))}return e}var rt=[10,15,30,60,120,180,300,600,900,1800,3600];function N(n){for(let t of rt)if(n/t<=5)return t;return Math.ceil(n/5/60)*60}function B({dayStart:n,niceMax:t,width:e,height:o,padding:i}){let{left:s,right:r,top:a,bottom:l}=i,_=e-s-r,p=o-a-l,f=n.getTime();return{xFor:v=>{let $=(v-f)/36e5;return s+$/24*_},yFor:v=>t?o-l-v/t*p:o-l}}function O({niceMax:n,yStep:t,width:e,height:o,padding:i}){let{left:s,right:r,top:a,bottom:l}=i,_=e-s-r,p=o-a-l,f=[0,6,12,18,24].map(m=>({hour:m,x:s+m/24*_,label:`${m}h`})),b=[];if(t>0)for(let m=0;m<=n;m+=t){let v=n?o-l-m/n*p:o-l;b.push({value:m,y:v,label:`${m}s`})}return{vertical:f,horizontal:b}}function F(n,{dayKeyFn:t}){let e={};for(let o of n||[]){let i=t(o.ts);e[i]||(e[i]={count:0,total:0}),e[i].count+=1,e[i].total+=o.value}return e}function z(n,t){let e=Object.keys(n).filter(a=>a!==t).sort(),o=e.slice(-3),i=e.slice(-7),s=(a,l)=>a.length?a.reduce((_,p)=>_+n[p][l],0)/a.length:null,r=n[t];return{todayCount:r?r.count:0,todayTotal:r?r.total:0,avg3dVisits:s(o,"count"),avg3dTotal:s(o,"total"),avg7dVisits:s(i,"count"),avg7dTotal:s(i,"total"),daysOfHistory:e.length}}function W(n,t){let e=t;n.value_map&&t in n.value_map?e=n.value_map[t]:t!==null&&n.unit&&(e=`${t}${n.unit}`),e==null&&(e="\u2014");let o=parseFloat(t),i=!1;return n.warn_below!==void 0&&Number.isFinite(o)&&(i=o<n.warn_below),n.warn_above!==void 0&&Number.isFinite(o)&&(i=i||o>n.warn_above),n.warn_state!==void 0&&(i=i||t===n.warn_state),{display:e,warn:i}}function P(n,t,e){return!t||!n||!n.states||!n.states[t]?e:n.states[t].state}function j(n,t){let e=new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}});n.dispatchEvent(e)}function H(n,t,e,o){n.callService(t,e,o)}function E(n,t){t&&H(n,"button","press",{entity_id:t})}var U=`
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
`;var q={maintenance_mode:"Maintenance mode",manual_odor_completed:"Manual odor removal done",auto_cleaning_completed:"Auto cleaning done",no_events_yet:null},G="PETKIT PURAMAX",V=60,K=600,Y=240,X={left:40,right:10,top:10,bottom:26};var T=class extends HTMLElement{static getConfigElement(){return document.createElement("petkit-puramax-card-editor")}static getStubConfig(){return{type:"custom:petkit-puramax-card",title:"PETKIT PURAMAX",device_entities:{error:"sensor.example_petkit_error",last_event:"sensor.example_petkit_last_event",state:"sensor.example_petkit_state"},cats:[{name:"Example Cat",color:"#4fc3f7",last_visit_duration_entity:"input_number.example_cat_last_visit_duration"}]}}setConfig(t){if(!t)throw new Error("petkit-puramax-card: config is required");if(!t.device_entities)throw new Error('petkit-puramax-card: "device_entities" is required in config');if(!t.cats)throw new Error('petkit-puramax-card: "cats" is required in config');if(!Array.isArray(t.cats)||t.cats.length<1)throw new Error('petkit-puramax-card: "cats" must be a non-empty array');t.cats.forEach((e,o)=>{if(!e||!e.name)throw new Error(`petkit-puramax-card: cats[${o}].name is required`);if(!e.color)throw new Error(`petkit-puramax-card: cats[${o}].color is required`);if(!e.last_visit_duration_entity)throw new Error(`petkit-puramax-card: cats[${o}].last_visit_duration_entity is required`)}),this._config=t,this._dayOffset=0,this._analytics=null,this._chartData=null,this._loadingChart=!1,this._loadingAnalytics=!1,this._catWatermarks={},this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}set hass(t){let e=this._hass;if(this._hass=t,!this._built){this._built=!0,this._render(),this._loadDay(),this._loadAnalytics();return}this._updateLiveValues(),this._maybeRefreshOnNewVisit(e)}get hass(){return this._hass}getCardSize(){return 14}connectedCallback(){this._hass&&!this._built&&(this._built=!0,this._render(),this._loadDay(),this._loadAnalytics())}_maybeRefreshOnNewVisit(t){if(!t)return;let e=this._config,o=!1;e.cats.forEach(i=>{let s=i.last_visit_duration_entity,r=t.states[s],a=this._hass.states[s];a&&(!r||r.last_changed!==a.last_changed)&&(o=!0)}),o&&(this._dayOffset===0&&this._loadDay(),this._loadAnalytics())}_s(t,e){return P(this._hass,t,e)}async _loadDay(){if(!this._hass)return;this._loadingChart=!0,this._renderChartArea();let t=this._config,{start:e,end:o}=L(this._dayOffset),i=[...t.cats.map(s=>s.last_visit_duration_entity),t.device_entities.last_event].filter(Boolean);try{let s=await this._hass.callWS(D({startTime:e,endTime:o,entityIds:i}));this._chartData=s||{}}catch{this._chartData={}}this._loadingChart=!1,this._renderChartArea()}async _loadAnalytics(){if(!this._hass)return;this._loadingAnalytics=!0,this._renderAnalyticsArea();let t=this._config,e=new Date,o=new Date(e.getTime()-168*3600*1e3),i=t.cats.map(l=>l.last_visit_duration_entity),s={};try{s=await this._hass.callWS(D({startTime:o,endTime:e,entityIds:i}))}catch{s={}}let r=k(e.getTime()),a={};t.cats.forEach(l=>{let _=S(s[l.last_visit_duration_entity]),p=F(_,{dayKeyFn:k});a[l.name]=z(p,r)}),this._analytics=a,this._loadingAnalytics=!1,this._renderAnalyticsArea()}_render(){let t=this._config;this.shadowRoot.innerHTML=`
      <style>${U}</style>
      <ha-card>
        <div class="header">
          <div class="title">${t.title||G}</div>
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
      `).join(""),i.dataset.bound="1",s.forEach((r,a)=>{this.shadowRoot.getElementById(`ctrl-${a}`).addEventListener("click",()=>this._runControlAction(r))})}}_renderInfoChip(t){let e=this._s(t.entity,null),{display:o,warn:i}=W(t,e);return this._chip(t.icon||"mdi:information-outline",t.name||t.entity,o,i)}_runControlAction(t){switch(t.action){case"press":{t.confirm?window.confirm(t.confirm)&&E(this._hass,t.entity):E(this._hass,t.entity);break}case"toggle_maintenance":{let e=t.state_entity||this._config.device_entities.state;this._s(e,"")==="maintenance"?E(this._hass,t.exit_entity):E(this._hass,t.start_entity);break}case"toggle":{H(this._hass,"homeassistant","toggle",{entity_id:t.entity});break}case"more_info":{j(this,t.entity);break}default:break}}_chip(t,e,o,i){return`
      <div class="chip ${i?"warn":""}">
        <ha-icon icon="${y(t)}"></ha-icon>
        <div class="chip-text"><div class="chip-label">${y(e)}</div><div class="chip-value">${y(o)}</div></div>
      </div>`}_renderChartArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("day-label");t&&(t.textContent=M(this._dayOffset));let e=this.shadowRoot.getElementById("next-day");e&&(e.disabled=this._dayOffset>=0);let o=this.shadowRoot.getElementById("chart-area"),i=this.shadowRoot.getElementById("records-list"),s=this.shadowRoot.getElementById("usage-body");if(!o)return;if(this._loadingChart){o.innerHTML='<div class="loading">Loading\u2026</div>',i&&(i.innerHTML=""),s&&(s.innerHTML='<div class="loading">Loading\u2026</div>');return}let r=this._config,a=this._chartData||{},l=[];r.cats.forEach(c=>{S(a[c.last_visit_duration_entity]).forEach(u=>l.push({cat:c,duration:u.value,ts:u.ts}))}),l.sort((c,d)=>c.ts-d.ts);let _=K,p=Y,f=X,b=Math.max(60,...l.map(c=>c.duration)),m=N(b),v=Math.ceil(b/m)*m,{start:$}=L(this._dayOffset),{xFor:J,yFor:Q}=B({dayStart:$,niceMax:v,width:_,height:p,padding:f}),{vertical:Z,horizontal:tt}=O({niceMax:v,yStep:m,width:_,height:p,padding:f}),et=Z.map(c=>`<line x1="${c.x}" y1="${f.top}" x2="${c.x}" y2="${p-f.bottom}" class="grid-line-v" />
              <text x="${c.x}" y="${p-6}" class="axis-label">${c.label}</text>`).join(""),ot=tt.map(c=>`<line x1="${f.left}" y1="${c.y}" x2="${_-f.right}" y2="${c.y}" class="grid-line-h" />
              <text x="${f.left-6}" y="${c.y+3}" class="axis-label-y">${c.label}</text>`).join(""),nt=l.map((c,d)=>{let u=J(c.ts),h=Q(c.duration),g=p-f.bottom;return`<line x1="${u}" y1="${g}" x2="${u}" y2="${h}" stroke="${c.cat.color}" stroke-width="2" />
              <circle class="visit-point" cx="${u}" cy="${h}" r="5" fill="${c.cat.color}" />
              <line class="visit-hit" data-idx="${d}" x1="${u}" y1="${g}" x2="${u}" y2="${h}" stroke="transparent" stroke-width="16" />`}).join("");o.innerHTML=`
      <div class="chart-wrap">
        <svg viewBox="0 0 ${_} ${p}" class="chart-svg">
          ${ot}
          ${et}
          ${nt||""}
        </svg>
        <div class="chart-tooltip" id="chart-tooltip"></div>
      </div>
      ${l.length===0?'<div class="empty-note">No visits recorded this day</div>':""}
    `;let w=this.shadowRoot.getElementById("chart-tooltip"),it=o.querySelector(".chart-wrap");if(o.querySelectorAll(".visit-hit").forEach(c=>{c.addEventListener("mouseenter",()=>{let d=l[parseInt(c.dataset.idx,10)],u=new Date(d.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"});w.textContent=`${u} \xB7 ${d.cat.name} \xB7 ${x(d.duration)}`;let h=c.getBoundingClientRect(),g=it.getBoundingClientRect();w.style.left=`${h.left-g.left+h.width/2}px`,w.style.top=`${h.top-g.top}px`,w.classList.add("visible")}),c.addEventListener("mouseleave",()=>{w.classList.remove("visible")})}),s){let c={};r.cats.forEach(h=>{c[h.name]={count:0}}),l.forEach(h=>{c[h.cat.name].count+=1});let d=l.length,u=r.cats.map(h=>{let g=c[h.name];return`<span class="usage-cat"><span class="dot" style="background:${h.color}"></span>${h.name}: ${g.count}</span>`}).join("");s.innerHTML=`
        <div class="usage-row">
          <div class="stat-value">${d} time${d===1?"":"s"}</div>
          <div class="usage-cats">${u}</div>
        </div>
      `}let C=l.map(c=>({ts:c.ts,icon:"mdi:cat",color:c.cat.color,text:`${c.cat.name} just spent ${x(c.duration)} in the litter box`})),at=a[r.device_entities.last_event]||[],A=this._eventLabels();at.forEach(c=>{let d=c.s??c.state,u=c.lu?c.lu*1e3:c.last_changed?Date.parse(c.last_changed):null;if(!d||!u||d in A&&A[d]===null)return;let h=A[d]||d.replace(/_/g," ").replace(/\b\w/g,g=>g.toUpperCase());C.push({ts:u,icon:"mdi:information-outline",color:"var(--secondary-text-color)",text:h})}),C.sort((c,d)=>d.ts-c.ts),i&&(C.length===0?i.innerHTML='<div class="empty-note">No records for this day</div>':i.innerHTML=C.map(c=>`
          <div class="record-row">
            <div class="record-time">${new Date(c.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</div>
            <ha-icon icon="${y(c.icon)}" style="color:${y(c.color)}"></ha-icon>
            <div class="record-text">${y(c.text)}</div>
          </div>
        `).join(""))}_eventLabels(){return{...q,...this._config.event_labels||{}}}_renderAnalyticsArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("analytics-grid"),e=this.shadowRoot.getElementById("decline-banner");if(!t)return;if(this._loadingAnalytics||!this._analytics){t.innerHTML='<div class="loading">Loading\u2026</div>',e&&(e.innerHTML="");return}let o=this._config,i=(o.decline_threshold_pct||V)/100,s=[];t.innerHTML=o.cats.map(r=>{let a=this._analytics[r.name]||{};return a.daysOfHistory>=3&&a.avg7dTotal&&new Date().getHours()>=18&&(a.todayTotal<i*a.avg7dTotal?s.push(`${r.name}'s usage today is well below their recent average \u2014 worth a check.`):a.todayTotal>(2-i)*a.avg7dTotal&&s.push(`${r.name}'s usage today is well above their recent average \u2014 worth a check.`)),`
        <div class="cat-analytics">
          <div class="cat-analytics-title"><span class="dot" style="background:${r.color}"></span>${r.name}</div>
          <table>
            <tr><td></td><td>Today</td><td>3d avg</td><td>7d avg</td></tr>
            <tr><td>Visits</td><td>${a.todayCount??0}</td><td>${a.avg3dVisits!==null&&a.avg3dVisits!==void 0?a.avg3dVisits.toFixed(1):"\u2014"}</td><td>${a.avg7dVisits!==null&&a.avg7dVisits!==void 0?a.avg7dVisits.toFixed(1):"\u2014"}</td></tr>
            <tr><td>Duration</td><td>${x(a.todayTotal||0)}</td><td>${a.avg3dTotal?x(a.avg3dTotal):"\u2014"}</td><td>${a.avg7dTotal?x(a.avg7dTotal):"\u2014"}</td></tr>
          </table>
        </div>
      `}).join(""),e&&(e.innerHTML=s.length?s.map(r=>`<div class="warn-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${r}</div>`).join(""):"")}};var ct=[{name:"name",label:"Name",selector:{text:{}}},{name:"color",label:"Color",selector:{text:{}}},{name:"last_visit_duration_entity",label:"Last visit duration entity",selector:{entity:{domain:"input_number"}}}],lt={name:"",color:"#4fc3f7",last_visit_duration_entity:""},dt=[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"unit",label:"Unit",selector:{text:{}}},{name:"warn_below",label:"Warn below",selector:{number:{mode:"box"}}},{name:"warn_above",label:"Warn above",selector:{number:{mode:"box"}}},{name:"warn_state",label:"Warn state",selector:{text:{}}}],ht={entity:"",name:"",icon:"mdi:information-outline"},ut=["press","toggle_maintenance","toggle","more_info"],pt=[{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"action",label:"Action",selector:{select:{options:ut,mode:"dropdown"}}}],mt={press:[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"confirm",label:"Confirm text (optional)",selector:{text:{}}}],toggle:[{name:"entity",label:"Entity",selector:{entity:{}}}],more_info:[{name:"entity",label:"Entity",selector:{entity:{}}}],toggle_maintenance:[{name:"start_entity",label:"Start entity",selector:{entity:{domain:"button"}}},{name:"exit_entity",label:"Exit entity",selector:{entity:{domain:"button"}}},{name:"state_entity",label:"State entity (optional)",selector:{entity:{}}}]};function _t(n){return[...pt,...mt[n]||[]]}var ft={name:"",icon:"mdi:gesture-tap-button",action:"press",entity:""},gt=[{name:"title",selector:{text:{}}},{name:"device_entities",type:"expandable",title:"Device entities",schema:[{name:"device_entities_error",label:"Error sensor",selector:{entity:{}}},{name:"device_entities_last_event",label:"Last event sensor",selector:{entity:{}}},{name:"device_entities_state",label:"State sensor",selector:{entity:{}}}]},{name:"decline_threshold_pct",label:"Decline/spike alert threshold (%)",selector:{number:{min:10,max:100,mode:"box"}}}],R=class extends HTMLElement{setConfig(t){this._config=t||{},this._render()}set hass(t){this._hass=t,this._render()}get hass(){return this._hass}connectedCallback(){this._render()}_fireConfigChanged(t){this._config=t,this.dispatchEvent(new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:t}}))}_flattenMain(){let t=this._config||{},e=t.device_entities||{};return{title:t.title,device_entities_error:e.error,device_entities_last_event:e.last_event,device_entities_state:e.state,decline_threshold_pct:t.decline_threshold_pct}}_onMainFormChanged(t){let e={...this._config};e.title=t.title,e.device_entities={...e.device_entities||{},error:t.device_entities_error,last_event:t.device_entities_last_event,state:t.device_entities_state},e.decline_threshold_pct=t.decline_threshold_pct,this._fireConfigChanged(e)}_render(){this.shadowRoot||this.attachShadow({mode:"open"}),this._config&&(this.shadowRoot.innerHTML=`
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
    `,this._renderMainForm(),this._renderCats(),this._renderInfoRows(),this._renderControlsRows(),this.shadowRoot.getElementById("add-cat").addEventListener("click",()=>this._addCat()),this.shadowRoot.getElementById("add-info-row").addEventListener("click",()=>this._addInfoRow()),this.shadowRoot.getElementById("add-control-row").addEventListener("click",()=>this._addControlRow()))}_renderCats(){let t=this.shadowRoot.getElementById("cats-rows");t.innerHTML="",(this._config.cats||[]).forEach((o,i)=>{let s=document.createElement("div");s.className="row",s.dataset.index=String(i);let r=document.createElement("ha-form");r.schema=ct,r.data=o,r.hass=this._hass,r.computeLabel=l=>l.label||l.name,r.addEventListener("value-changed",l=>{l.stopPropagation(),this._updateCat(i,l.detail.value)});let a=document.createElement("button");a.className="remove-btn",a.type="button",a.textContent="Remove",a.addEventListener("click",()=>this._removeCat(i)),s.appendChild(r),s.appendChild(a),t.appendChild(s)})}_updateCat(t,e){let o=[...this._config.cats||[]];o[t]=e,this._fireConfigChanged({...this._config,cats:o})}_addCat(){let t=[...this._config.cats||[],{...lt}];this._fireConfigChanged({...this._config,cats:t}),this._render()}_removeCat(t){let e=(this._config.cats||[]).filter((o,i)=>i!==t);this._fireConfigChanged({...this._config,cats:e}),this._render()}_renderInfoRows(){let t=this.shadowRoot.getElementById("info-rows");t.innerHTML="",(this._config.info_row||[]).forEach((o,i)=>{let s=document.createElement("div");s.className="row",s.dataset.index=String(i);let r=document.createElement("ha-form");r.schema=dt,r.data=o,r.hass=this._hass,r.computeLabel=l=>l.label||l.name,r.addEventListener("value-changed",l=>{l.stopPropagation(),this._updateInfoRow(i,l.detail.value)});let a=document.createElement("button");a.className="remove-btn",a.type="button",a.textContent="Remove",a.addEventListener("click",()=>this._removeInfoRow(i)),s.appendChild(r),s.appendChild(a),t.appendChild(s)})}_updateInfoRow(t,e){let o=[...this._config.info_row||[]];o[t]=e,this._fireConfigChanged({...this._config,info_row:o})}_addInfoRow(){let t=[...this._config.info_row||[],{...ht}];this._fireConfigChanged({...this._config,info_row:t}),this._render()}_removeInfoRow(t){let e=(this._config.info_row||[]).filter((o,i)=>i!==t);this._fireConfigChanged({...this._config,info_row:e}),this._render()}_renderControlsRows(){let t=this.shadowRoot.getElementById("controls-rows");t.innerHTML="",(this._config.controls_row||[]).forEach((o,i)=>{let s=document.createElement("div");s.className="row",s.dataset.index=String(i);let r=document.createElement("ha-form");r.schema=_t(o.action),r.data=o,r.hass=this._hass,r.computeLabel=l=>l.label||l.name,r.addEventListener("value-changed",l=>{l.stopPropagation(),this._updateControlRow(i,l.detail.value)});let a=document.createElement("button");a.className="remove-btn",a.type="button",a.textContent="Remove",a.addEventListener("click",()=>this._removeControlRow(i)),s.appendChild(r),s.appendChild(a),t.appendChild(s)})}_updateControlRow(t,e){let o=[...this._config.controls_row||[]],i=o[t]&&o[t].action;o[t]=e,this._fireConfigChanged({...this._config,controls_row:o}),e.action!==i&&this._renderControlsRows()}_addControlRow(){let t=[...this._config.controls_row||[],{...ft}];this._fireConfigChanged({...this._config,controls_row:t}),this._render()}_removeControlRow(t){let e=(this._config.controls_row||[]).filter((o,i)=>i!==t);this._fireConfigChanged({...this._config,controls_row:e}),this._render()}_renderMainForm(){let t=this.shadowRoot.getElementById("main-section"),e=document.createElement("ha-form");e.schema=gt,e.data=this._flattenMain(),e.hass=this._hass,e.computeLabel=o=>o.label||o.name,e.addEventListener("value-changed",o=>{o.stopPropagation(),this._onMainFormChanged(o.detail.value)}),t.appendChild(e)}};customElements.get("petkit-puramax-card")||customElements.define("petkit-puramax-card",T);customElements.get("petkit-puramax-card-editor")||customElements.define("petkit-puramax-card-editor",R);var I=window;I.customCards=I.customCards||[];I.customCards.push({type:"petkit-puramax-card",name:"PETKIT PURAMAX Card",description:"Configurable card for PETKIT PURAMAX litter box monitoring, controls, and per-cat visit analytics."});
//# sourceMappingURL=petkit-puramax-card.js.map
