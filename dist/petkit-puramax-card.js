function b(i){let t=Math.round(i||0);if(t<60)return`${t}s`;let e=Math.floor(t/60),o=t%60;return`${e}m${o.toString().padStart(2,"0")}s`}function C(i,t=new Date){let e=new Date(t.getFullYear(),t.getMonth(),t.getDate());e.setDate(e.getDate()+i);let o=new Date(e);return o.setDate(o.getDate()+1),{start:e,end:o}}function H(i,t=new Date){if(i===0)return"Today";if(i===-1)return"Yesterday";let{start:e}=C(i,t);return e.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"})}function A(i){let t=new Date(i);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`}function k({startTime:i,endTime:t,entityIds:e}){let o=i instanceof Date?i.toISOString():i,n=t instanceof Date?t.toISOString():t;return{type:"history/history_during_period",start_time:o,end_time:n,entity_ids:e,minimal_response:!1,no_attributes:!0,include_start_time_state:!1}}function it(i){if(!i)return null;let t=i.s??i.state,e=parseFloat(t),o=i.lu?i.lu*1e3:i.last_changed?Date.parse(i.last_changed):null;return!Number.isFinite(e)||!o||Number.isNaN(o)?null:{value:e,ts:o}}function D(i,{filterPositive:t=!0}={}){if(!Array.isArray(i))return[];let e=[];for(let o of i){let n=it(o);n&&(t&&n.value<=0||e.push(n))}return e}var at=[10,15,30,60,120,180,300,600,900,1800,3600];function M(i){for(let t of at)if(i/t<=5)return t;return Math.ceil(i/5/60)*60}function N({dayStart:i,niceMax:t,width:e,height:o,padding:n}){let{left:s,right:r,top:a,bottom:l}=n,_=e-s-r,p=o-a-l,f=i.getTime();return{xFor:v=>{let T=(v-f)/36e5;return s+T/24*_},yFor:v=>t?o-l-v/t*p:o-l}}function B({niceMax:i,yStep:t,width:e,height:o,padding:n}){let{left:s,right:r,top:a,bottom:l}=n,_=e-s-r,p=o-a-l,f=[0,6,12,18,24].map(m=>({hour:m,x:s+m/24*_,label:`${m}h`})),y=[];if(t>0)for(let m=0;m<=i;m+=t){let v=i?o-l-m/i*p:o-l;y.push({value:m,y:v,label:`${m}s`})}return{vertical:f,horizontal:y}}function O(i,{dayKeyFn:t}){let e={};for(let o of i||[]){let n=t(o.ts);e[n]||(e[n]={count:0,total:0}),e[n].count+=1,e[n].total+=o.value}return e}function F(i,t){let e=Object.keys(i).filter(a=>a!==t).sort(),o=e.slice(-3),n=e.slice(-7),s=(a,l)=>a.length?a.reduce((_,p)=>_+i[p][l],0)/a.length:null,r=i[t];return{todayCount:r?r.count:0,todayTotal:r?r.total:0,avg3dVisits:s(o,"count"),avg3dTotal:s(o,"total"),avg7dVisits:s(n,"count"),avg7dTotal:s(n,"total"),daysOfHistory:e.length}}function z(i,t){let e=t;i.value_map&&t in i.value_map?e=i.value_map[t]:t!==null&&i.unit&&(e=`${t}${i.unit}`),e==null&&(e="\u2014");let o=parseFloat(t),n=!1;return i.warn_below!==void 0&&Number.isFinite(o)&&(n=o<i.warn_below),i.warn_above!==void 0&&Number.isFinite(o)&&(n=n||o>i.warn_above),i.warn_state!==void 0&&(n=n||t===i.warn_state),{display:e,warn:n}}function W(i,t,e){return!t||!i||!i.states||!i.states[t]?e:i.states[t].state}function P(i,t){let e=new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}});i.dispatchEvent(e)}function S(i,t,e,o){i.callService(t,e,o)}function w(i,t){t&&S(i,"button","press",{entity_id:t})}var j=`
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
`;var U={maintenance_mode:"Maintenance mode",manual_odor_completed:"Manual odor removal done",auto_cleaning_completed:"Auto cleaning done",no_events_yet:null},q="PETKIT PURAMAX";var G=600,V=240,K={left:40,right:10,top:10,bottom:26};var L=class extends HTMLElement{static getConfigElement(){return document.createElement("petkit-puramax-card-editor")}static getStubConfig(){return{type:"custom:petkit-puramax-card",title:"PETKIT PURAMAX",device_entities:{error:"sensor.example_petkit_error",last_event:"sensor.example_petkit_last_event",state:"sensor.example_petkit_state"},cats:[{name:"Example Cat",color:"#4fc3f7",last_visit_duration_entity:"input_number.example_cat_last_visit_duration"}]}}setConfig(t){if(!t)throw new Error("petkit-puramax-card: config is required");if(!t.device_entities)throw new Error('petkit-puramax-card: "device_entities" is required in config');if(!t.cats)throw new Error('petkit-puramax-card: "cats" is required in config');if(!Array.isArray(t.cats)||t.cats.length<1)throw new Error('petkit-puramax-card: "cats" must be a non-empty array');t.cats.forEach((e,o)=>{if(!e||!e.name)throw new Error(`petkit-puramax-card: cats[${o}].name is required`);if(!e.color)throw new Error(`petkit-puramax-card: cats[${o}].color is required`);if(!e.last_visit_duration_entity)throw new Error(`petkit-puramax-card: cats[${o}].last_visit_duration_entity is required`)}),this._config=t,this._dayOffset=0,this._analytics=null,this._chartData=null,this._loadingChart=!1,this._loadingAnalytics=!1,this._catWatermarks={},this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}set hass(t){let e=this._hass;if(this._hass=t,!this._built){this._built=!0,this._render(),this._loadDay(),this._loadAnalytics();return}this._updateLiveValues(),this._maybeRefreshOnNewVisit(e)}get hass(){return this._hass}getCardSize(){return 14}connectedCallback(){this._hass&&!this._built&&(this._built=!0,this._render(),this._loadDay(),this._loadAnalytics())}_maybeRefreshOnNewVisit(t){if(!t)return;let e=this._config,o=!1;e.cats.forEach(n=>{let s=n.last_visit_duration_entity,r=t.states[s],a=this._hass.states[s];a&&(!r||r.last_changed!==a.last_changed)&&(o=!0)}),o&&(this._dayOffset===0&&this._loadDay(),this._loadAnalytics())}_s(t,e){return W(this._hass,t,e)}async _loadDay(){if(!this._hass)return;this._loadingChart=!0,this._renderChartArea();let t=this._config,{start:e,end:o}=C(this._dayOffset),n=[...t.cats.map(s=>s.last_visit_duration_entity),t.device_entities.last_event].filter(Boolean);try{let s=await this._hass.callWS(k({startTime:e,endTime:o,entityIds:n}));this._chartData=s||{}}catch{this._chartData={}}this._loadingChart=!1,this._renderChartArea()}async _loadAnalytics(){if(!this._hass)return;this._loadingAnalytics=!0,this._renderAnalyticsArea();let t=this._config,e=new Date,o=new Date(e.getTime()-168*3600*1e3),n=t.cats.map(l=>l.last_visit_duration_entity),s={};try{s=await this._hass.callWS(k({startTime:o,endTime:e,entityIds:n}))}catch{s={}}let r=A(e.getTime()),a={};t.cats.forEach(l=>{let _=D(s[l.last_visit_duration_entity]),p=O(_,{dayKeyFn:A});a[l.name]=F(p,r)}),this._analytics=a,this._loadingAnalytics=!1,this._renderAnalyticsArea()}_render(){let t=this._config;this.shadowRoot.innerHTML=`
      <style>${j}</style>
      <ha-card>
        <div class="header">
          <div class="title">${t.title||q}</div>
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
    `,this.shadowRoot.getElementById("prev-day").addEventListener("click",()=>this._changeDay(-1)),this.shadowRoot.getElementById("next-day").addEventListener("click",()=>this._changeDay(1)),this._updateLiveValues(),this._renderChartArea(),this._renderAnalyticsArea()}_changeDay(t){this._dayOffset+=t,this._dayOffset>0&&(this._dayOffset=0),this._loadDay()}_updateLiveValues(){if(!this._built)return;let t=this._config,e=t.device_entities,o=this.shadowRoot.getElementById("status-row");if(o){let s=this._s(e.error,"no_error"),r=s&&s!=="no_error",a=t.info_row||[];o.innerHTML=[...a.map(l=>this._renderInfoChip(l)),r?this._chip("mdi:alert","Error",s.replace(/_/g," "),!0):""].join("")}let n=this.shadowRoot.getElementById("controls-row");if(n&&!n.dataset.bound){let s=t.controls_row||[];n.innerHTML=s.map((r,a)=>`
        <button class="ctrl-btn" id="ctrl-${a}"><ha-icon icon="${r.icon||"mdi:help"}"></ha-icon><span>${r.name||""}</span></button>
      `).join(""),n.dataset.bound="1",s.forEach((r,a)=>{this.shadowRoot.getElementById(`ctrl-${a}`).addEventListener("click",()=>this._runControlAction(r))})}}_renderInfoChip(t){let e=this._s(t.entity,null),{display:o,warn:n}=z(t,e);return this._chip(t.icon||"mdi:information-outline",t.name||t.entity,o,n)}_runControlAction(t){switch(t.action){case"press":{t.confirm?window.confirm(t.confirm)&&w(this._hass,t.entity):w(this._hass,t.entity);break}case"toggle_maintenance":{let e=t.state_entity||this._config.device_entities.state;this._s(e,"")==="maintenance"?w(this._hass,t.exit_entity):w(this._hass,t.start_entity);break}case"toggle":{S(this._hass,"homeassistant","toggle",{entity_id:t.entity});break}case"more_info":{P(this,t.entity);break}default:break}}_chip(t,e,o,n){return`
      <div class="chip ${n?"warn":""}">
        <ha-icon icon="${t}"></ha-icon>
        <div class="chip-text"><div class="chip-label">${e}</div><div class="chip-value">${o}</div></div>
      </div>`}_renderChartArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("day-label");t&&(t.textContent=H(this._dayOffset));let e=this.shadowRoot.getElementById("next-day");e&&(e.disabled=this._dayOffset>=0);let o=this.shadowRoot.getElementById("chart-area"),n=this.shadowRoot.getElementById("records-list"),s=this.shadowRoot.getElementById("usage-body");if(!o)return;if(this._loadingChart){o.innerHTML='<div class="loading">Loading\u2026</div>',n&&(n.innerHTML=""),s&&(s.innerHTML='<div class="loading">Loading\u2026</div>');return}let r=this._config,a=this._chartData||{},l=[];r.cats.forEach(c=>{D(a[c.last_visit_duration_entity]).forEach(u=>l.push({cat:c,duration:u.value,ts:u.ts}))}),l.sort((c,d)=>c.ts-d.ts);let _=G,p=V,f=K,y=Math.max(60,...l.map(c=>c.duration)),m=M(y),v=Math.ceil(y/m)*m,{start:T}=C(this._dayOffset),{xFor:Y,yFor:X}=N({dayStart:T,niceMax:v,width:_,height:p,padding:f}),{vertical:J,horizontal:Q}=B({niceMax:v,yStep:m,width:_,height:p,padding:f}),Z=J.map(c=>`<line x1="${c.x}" y1="${f.top}" x2="${c.x}" y2="${p-f.bottom}" class="grid-line-v" />
              <text x="${c.x}" y="${p-6}" class="axis-label">${c.label}</text>`).join(""),tt=Q.map(c=>`<line x1="${f.left}" y1="${c.y}" x2="${_-f.right}" y2="${c.y}" class="grid-line-h" />
              <text x="${f.left-6}" y="${c.y+3}" class="axis-label-y">${c.label}</text>`).join(""),et=l.map((c,d)=>{let u=Y(c.ts),h=X(c.duration),g=p-f.bottom;return`<line x1="${u}" y1="${g}" x2="${u}" y2="${h}" stroke="${c.cat.color}" stroke-width="2" />
              <circle class="visit-point" cx="${u}" cy="${h}" r="5" fill="${c.cat.color}" />
              <line class="visit-hit" data-idx="${d}" x1="${u}" y1="${g}" x2="${u}" y2="${h}" stroke="transparent" stroke-width="16" />`}).join("");o.innerHTML=`
      <div class="chart-wrap">
        <svg viewBox="0 0 ${_} ${p}" class="chart-svg">
          ${tt}
          ${Z}
          ${et||""}
        </svg>
        <div class="chart-tooltip" id="chart-tooltip"></div>
      </div>
      ${l.length===0?'<div class="empty-note">No visits recorded this day</div>':""}
    `;let x=this.shadowRoot.getElementById("chart-tooltip"),ot=o.querySelector(".chart-wrap");if(o.querySelectorAll(".visit-hit").forEach(c=>{c.addEventListener("mouseenter",()=>{let d=l[parseInt(c.dataset.idx,10)],u=new Date(d.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"});x.textContent=`${u} \xB7 ${d.cat.name} \xB7 ${b(d.duration)}`;let h=c.getBoundingClientRect(),g=ot.getBoundingClientRect();x.style.left=`${h.left-g.left+h.width/2}px`,x.style.top=`${h.top-g.top}px`,x.classList.add("visible")}),c.addEventListener("mouseleave",()=>{x.classList.remove("visible")})}),s){let c={};r.cats.forEach(h=>{c[h.name]={count:0}}),l.forEach(h=>{c[h.cat.name].count+=1});let d=l.length,u=r.cats.map(h=>{let g=c[h.name];return`<span class="usage-cat"><span class="dot" style="background:${h.color}"></span>${h.name}: ${g.count}</span>`}).join("");s.innerHTML=`
        <div class="usage-row">
          <div class="stat-value">${d} time${d===1?"":"s"}</div>
          <div class="usage-cats">${u}</div>
        </div>
      `}let E=l.map(c=>({ts:c.ts,icon:"mdi:cat",color:c.cat.color,text:`${c.cat.name} just spent ${b(c.duration)} in the litter box`})),nt=a[r.device_entities.last_event]||[],$=this._eventLabels();nt.forEach(c=>{let d=c.s??c.state,u=c.lu?c.lu*1e3:c.last_changed?Date.parse(c.last_changed):null;if(!d||!u||d in $&&$[d]===null)return;let h=$[d]||d.replace(/_/g," ").replace(/\b\w/g,g=>g.toUpperCase());E.push({ts:u,icon:"mdi:information-outline",color:"var(--secondary-text-color)",text:h})}),E.sort((c,d)=>d.ts-c.ts),n&&(E.length===0?n.innerHTML='<div class="empty-note">No records for this day</div>':n.innerHTML=E.map(c=>`
          <div class="record-row">
            <div class="record-time">${new Date(c.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</div>
            <ha-icon icon="${c.icon}" style="color:${c.color}"></ha-icon>
            <div class="record-text">${c.text}</div>
          </div>
        `).join(""))}_eventLabels(){return{...U,...this._config.event_labels||{}}}_renderAnalyticsArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("analytics-grid"),e=this.shadowRoot.getElementById("decline-banner");if(!t)return;if(this._loadingAnalytics||!this._analytics){t.innerHTML='<div class="loading">Loading\u2026</div>',e&&(e.innerHTML="");return}let o=this._config,n=(o.decline_threshold_pct||60)/100,s=[];t.innerHTML=o.cats.map(r=>{let a=this._analytics[r.name]||{};return a.daysOfHistory>=3&&a.avg7dTotal&&new Date().getHours()>=18&&(a.todayTotal<n*a.avg7dTotal?s.push(`${r.name}'s usage today is well below their recent average \u2014 worth a check.`):a.todayTotal>(2-n)*a.avg7dTotal&&s.push(`${r.name}'s usage today is well above their recent average \u2014 worth a check.`)),`
        <div class="cat-analytics">
          <div class="cat-analytics-title"><span class="dot" style="background:${r.color}"></span>${r.name}</div>
          <table>
            <tr><td></td><td>Today</td><td>3d avg</td><td>7d avg</td></tr>
            <tr><td>Visits</td><td>${a.todayCount??0}</td><td>${a.avg3dVisits!==null&&a.avg3dVisits!==void 0?a.avg3dVisits.toFixed(1):"\u2014"}</td><td>${a.avg7dVisits!==null&&a.avg7dVisits!==void 0?a.avg7dVisits.toFixed(1):"\u2014"}</td></tr>
            <tr><td>Duration</td><td>${b(a.todayTotal||0)}</td><td>${a.avg3dTotal?b(a.avg3dTotal):"\u2014"}</td><td>${a.avg7dTotal?b(a.avg7dTotal):"\u2014"}</td></tr>
          </table>
        </div>
      `}).join(""),e&&(e.innerHTML=s.length?s.map(r=>`<div class="warn-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${r}</div>`).join(""):"")}};var st=[{name:"name",label:"Name",selector:{text:{}}},{name:"color",label:"Color",selector:{text:{}}},{name:"last_visit_duration_entity",label:"Last visit duration entity",selector:{entity:{domain:"input_number"}}}],rt={name:"",color:"#4fc3f7",last_visit_duration_entity:""},ct=[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"unit",label:"Unit",selector:{text:{}}},{name:"warn_below",label:"Warn below",selector:{number:{mode:"box"}}},{name:"warn_above",label:"Warn above",selector:{number:{mode:"box"}}},{name:"warn_state",label:"Warn state",selector:{text:{}}}],lt={entity:"",name:"",icon:"mdi:information-outline"},dt=["press","toggle_maintenance","toggle","more_info"],ht=[{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"action",label:"Action",selector:{select:{options:dt,mode:"dropdown"}}}],ut={press:[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"confirm",label:"Confirm text (optional)",selector:{text:{}}}],toggle:[{name:"entity",label:"Entity",selector:{entity:{}}}],more_info:[{name:"entity",label:"Entity",selector:{entity:{}}}],toggle_maintenance:[{name:"start_entity",label:"Start entity",selector:{entity:{domain:"button"}}},{name:"exit_entity",label:"Exit entity",selector:{entity:{domain:"button"}}},{name:"state_entity",label:"State entity (optional)",selector:{entity:{}}}]};function pt(i){return[...ht,...ut[i]||[]]}var mt={name:"",icon:"mdi:gesture-tap-button",action:"press",entity:""},_t=[{name:"title",selector:{text:{}}},{name:"device_entities",type:"expandable",title:"Device entities",schema:[{name:"device_entities_error",label:"Error sensor",selector:{entity:{}}},{name:"device_entities_last_event",label:"Last event sensor",selector:{entity:{}}},{name:"device_entities_state",label:"State sensor",selector:{entity:{}}}]},{name:"decline_threshold_pct",label:"Decline/spike alert threshold (%)",selector:{number:{min:10,max:100,mode:"box"}}}],R=class extends HTMLElement{setConfig(t){this._config=t||{},this._render()}set hass(t){this._hass=t,this._render()}get hass(){return this._hass}connectedCallback(){this._render()}_fireConfigChanged(t){this._config=t,this.dispatchEvent(new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:t}}))}_flattenMain(){let t=this._config||{},e=t.device_entities||{};return{title:t.title,device_entities_error:e.error,device_entities_last_event:e.last_event,device_entities_state:e.state,decline_threshold_pct:t.decline_threshold_pct}}_onMainFormChanged(t){let e={...this._config};e.title=t.title,e.device_entities={...e.device_entities||{},error:t.device_entities_error,last_event:t.device_entities_last_event,state:t.device_entities_state},e.decline_threshold_pct=t.decline_threshold_pct,this._fireConfigChanged(e)}_render(){this.shadowRoot||this.attachShadow({mode:"open"}),this._config&&(this.shadowRoot.innerHTML=`
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
    `,this._renderMainForm(),this._renderCats(),this._renderInfoRows(),this._renderControlsRows(),this.shadowRoot.getElementById("add-cat").addEventListener("click",()=>this._addCat()),this.shadowRoot.getElementById("add-info-row").addEventListener("click",()=>this._addInfoRow()),this.shadowRoot.getElementById("add-control-row").addEventListener("click",()=>this._addControlRow()))}_renderCats(){let t=this.shadowRoot.getElementById("cats-rows");t.innerHTML="",(this._config.cats||[]).forEach((o,n)=>{let s=document.createElement("div");s.className="row",s.dataset.index=String(n);let r=document.createElement("ha-form");r.schema=st,r.data=o,r.hass=this._hass,r.computeLabel=l=>l.label||l.name,r.addEventListener("value-changed",l=>{l.stopPropagation(),this._updateCat(n,l.detail.value)});let a=document.createElement("button");a.className="remove-btn",a.type="button",a.textContent="Remove",a.addEventListener("click",()=>this._removeCat(n)),s.appendChild(r),s.appendChild(a),t.appendChild(s)})}_updateCat(t,e){let o=[...this._config.cats||[]];o[t]=e,this._fireConfigChanged({...this._config,cats:o})}_addCat(){let t=[...this._config.cats||[],{...rt}];this._fireConfigChanged({...this._config,cats:t}),this._render()}_removeCat(t){let e=(this._config.cats||[]).filter((o,n)=>n!==t);this._fireConfigChanged({...this._config,cats:e}),this._render()}_renderInfoRows(){let t=this.shadowRoot.getElementById("info-rows");t.innerHTML="",(this._config.info_row||[]).forEach((o,n)=>{let s=document.createElement("div");s.className="row",s.dataset.index=String(n);let r=document.createElement("ha-form");r.schema=ct,r.data=o,r.hass=this._hass,r.computeLabel=l=>l.label||l.name,r.addEventListener("value-changed",l=>{l.stopPropagation(),this._updateInfoRow(n,l.detail.value)});let a=document.createElement("button");a.className="remove-btn",a.type="button",a.textContent="Remove",a.addEventListener("click",()=>this._removeInfoRow(n)),s.appendChild(r),s.appendChild(a),t.appendChild(s)})}_updateInfoRow(t,e){let o=[...this._config.info_row||[]];o[t]=e,this._fireConfigChanged({...this._config,info_row:o})}_addInfoRow(){let t=[...this._config.info_row||[],{...lt}];this._fireConfigChanged({...this._config,info_row:t}),this._render()}_removeInfoRow(t){let e=(this._config.info_row||[]).filter((o,n)=>n!==t);this._fireConfigChanged({...this._config,info_row:e}),this._render()}_renderControlsRows(){let t=this.shadowRoot.getElementById("controls-rows");t.innerHTML="",(this._config.controls_row||[]).forEach((o,n)=>{let s=document.createElement("div");s.className="row",s.dataset.index=String(n);let r=document.createElement("ha-form");r.schema=pt(o.action),r.data=o,r.hass=this._hass,r.computeLabel=l=>l.label||l.name,r.addEventListener("value-changed",l=>{l.stopPropagation(),this._updateControlRow(n,l.detail.value)});let a=document.createElement("button");a.className="remove-btn",a.type="button",a.textContent="Remove",a.addEventListener("click",()=>this._removeControlRow(n)),s.appendChild(r),s.appendChild(a),t.appendChild(s)})}_updateControlRow(t,e){let o=[...this._config.controls_row||[]],n=o[t]&&o[t].action;o[t]=e,this._fireConfigChanged({...this._config,controls_row:o}),e.action!==n&&this._renderControlsRows()}_addControlRow(){let t=[...this._config.controls_row||[],{...mt}];this._fireConfigChanged({...this._config,controls_row:t}),this._render()}_removeControlRow(t){let e=(this._config.controls_row||[]).filter((o,n)=>n!==t);this._fireConfigChanged({...this._config,controls_row:e}),this._render()}_renderMainForm(){let t=this.shadowRoot.getElementById("main-section"),e=document.createElement("ha-form");e.schema=_t,e.data=this._flattenMain(),e.hass=this._hass,e.computeLabel=o=>o.label||o.name,e.addEventListener("value-changed",o=>{o.stopPropagation(),this._onMainFormChanged(o.detail.value)}),t.appendChild(e)}};customElements.get("petkit-puramax-card")||customElements.define("petkit-puramax-card",L);customElements.get("petkit-puramax-card-editor")||customElements.define("petkit-puramax-card-editor",R);var I=window;I.customCards=I.customCards||[];I.customCards.push({type:"petkit-puramax-card",name:"PETKIT PURAMAX Card",description:"Configurable card for PETKIT PURAMAX litter box monitoring, controls, and per-cat visit analytics."});
//# sourceMappingURL=petkit-puramax-card.js.map
