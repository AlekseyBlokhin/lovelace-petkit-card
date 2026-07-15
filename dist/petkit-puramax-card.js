function x(i){let t=Math.round(i||0);if(t<60)return`${t}s`;let e=Math.floor(t/60),n=t%60;return`${e}m${n.toString().padStart(2,"0")}s`}function N(i){let t=Math.round(i||0),e=Math.floor(t/60),n=t%60;return`${e.toString().padStart(2,"0")}'${n.toString().padStart(2,"0")}"`}function b(i){return String(i).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function A(i,t=new Date){let e=new Date(t.getFullYear(),t.getMonth(),t.getDate());e.setDate(e.getDate()+i);let n=new Date(e);return n.setDate(n.getDate()+1),{start:e,end:n}}function B(i,t=new Date){if(i===0)return"Today";if(i===-1)return"Yesterday";let{start:e}=A(i,t);return e.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"})}function S(i){let t=new Date(i);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`}function R({startTime:i,endTime:t,entityIds:e,includeStartTimeState:n=!1}){let o=i instanceof Date?i.toISOString():i,s=t instanceof Date?t.toISOString():t;return{type:"history/history_during_period",start_time:o,end_time:s,entity_ids:e,minimal_response:!1,no_attributes:!0,include_start_time_state:n}}function ut(i){if(!i)return null;let t=i.s??i.state,e=parseFloat(t),n=i.lu?i.lu*1e3:i.last_changed?Date.parse(i.last_changed):null;return!Number.isFinite(e)||!n||Number.isNaN(n)?null:{value:e,ts:n}}function O(i,{minDelta:t=0,maxDelta:e=1/0}={}){if(!Array.isArray(i))return[];let n=i.map(ut).filter(Boolean).sort((s,r)=>s.ts-r.ts),o=[];for(let s=1;s<n.length;s++){let r=n[s].value-n[s-1].value;r>t&&r<e&&o.push({value:r,ts:n[s].ts})}return o}function z(i,t){if(!Array.isArray(i))return[];let e=new Set(t),n=[];for(let o of i){let s=o.s??o.state;if(!e.has(s))continue;let r=o.lu?o.lu*1e3:o.last_changed?Date.parse(o.last_changed):null;!r||Number.isNaN(r)||n.push({cat:s,ts:r})}return n.sort((o,s)=>o.ts-s.ts),n}function F(i,t){let e=0,n=null;return i.map(o=>{for(;e<t.length&&t[e].ts<=o.ts;)n=t[e].cat,e++;return{...o,cat:n}})}var pt=[10,15,30,60,120,180,300,600,900,1800,3600];function P(i){for(let t of pt)if(i/t<=5)return t;return Math.ceil(i/5/60)*60}function U({dayStart:i,niceMax:t,width:e,height:n,padding:o}){let{left:s,right:r,top:a,bottom:l}=o,u=e-s-r,d=n-a-l,h=i.getTime();return{xFor:v=>{let $=(v-h)/36e5;return s+$/24*u},yFor:v=>t?n-l-v/t*d:n-l}}function W({niceMax:i,yStep:t,width:e,height:n,padding:o}){let{left:s,right:r,top:a,bottom:l}=o,u=e-s-r,d=n-a-l,h=[4,8,12,16,20].map(p=>({hour:p,x:s+p/24*u,label:`${p.toString().padStart(2,"0")}:00`})),f=[];if(t>0)for(let p=0;p<=i;p+=t){let v=i?n-l-p/i*d:n-l;f.push({value:p,y:v,label:N(p)})}return{vertical:h,horizontal:f}}function V(i,{dayKeyFn:t}){let e={};for(let n of i||[]){let o=t(n.ts);e[o]||(e[o]={count:0,total:0}),e[o].count+=1,e[o].total+=n.value}return e}function j(i,t){let e=Object.keys(i).filter(d=>d!==t).sort(),n=e.slice(-3),o=e.slice(-7),s=(d,h)=>d.length?d.reduce((f,p)=>f+i[p][h],0)/d.length:null,r=d=>{if(!d.length)return null;let h=d.reduce((p,v)=>p+i[v].total,0),f=d.reduce((p,v)=>p+i[v].count,0);return f>0?h/f:null},a=i[t],l=a?a.count:0,u=a?a.total:0;return{todayCount:l,todayTotal:u,todayAvgDuration:l>0?u/l:null,avg3dVisits:s(n,"count"),avg3dTotal:s(n,"total"),avg3dDuration:r(n),avg7dVisits:s(o,"count"),avg7dTotal:s(o,"total"),avg7dDuration:r(o),daysOfHistory:e.length}}function q(i,t){let e=t;i.value_map&&t in i.value_map?e=i.value_map[t]:t!==null&&i.unit&&(e=`${t}${i.unit}`),e==null&&(e="\u2014");let n=parseFloat(t),o=!1;return i.warn_below!==void 0&&Number.isFinite(n)&&(o=n<i.warn_below),i.warn_above!==void 0&&Number.isFinite(n)&&(o=o||n>i.warn_above),i.warn_state!==void 0&&(o=o||t===i.warn_state),{display:e,warn:o}}function G(i,t,e){return!t||!i||!i.states||!i.states[t]?e:i.states[t].state}function K(i,t){let e=new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}});i.dispatchEvent(e)}function k(i,t,e,n){i.callService(t,e,n)}function C(i,t){t&&k(i,"button","press",{entity_id:t})}var X=`
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
`;var Y={maintenance_mode:"Maintenance mode",manual_odor_completed:"Manual odor removal done",auto_cleaning_completed:"Auto cleaning done",no_events_yet:null,unavailable:null,unknown:null},J="PETKIT PURAMAX",Q=60,Z=1800,tt=600,et=240,nt={left:46,right:10,top:10,bottom:28};var T=class extends HTMLElement{static getConfigElement(){return document.createElement("petkit-puramax-card-editor")}static getStubConfig(){return{type:"custom:petkit-puramax-card",title:"PETKIT PURAMAX",device_entities:{error:"sensor.example_petkit_error",last_event:"sensor.example_petkit_last_event",state:"sensor.example_petkit_state",total_use:"sensor.example_petkit_total_use"},cats:[{name:"Example Cat",color:"#4fc3f7"}]}}setConfig(t){if(!t)throw new Error("petkit-puramax-card: config is required");if(!t.device_entities)throw new Error('petkit-puramax-card: "device_entities" is required in config');if(!t.device_entities.total_use)throw new Error('petkit-puramax-card: "device_entities.total_use" is required in config');if(!t.cats)throw new Error('petkit-puramax-card: "cats" is required in config');if(!Array.isArray(t.cats)||t.cats.length<1)throw new Error('petkit-puramax-card: "cats" must be a non-empty array');if(t.cats.length>1&&!t.device_entities.last_used_by)throw new Error('petkit-puramax-card: "device_entities.last_used_by" is required in config when more than one cat is configured');t.cats.forEach((e,n)=>{if(!e||!e.name)throw new Error(`petkit-puramax-card: cats[${n}].name is required`);if(!e.color)throw new Error(`petkit-puramax-card: cats[${n}].color is required`)}),this._config=t,this._dayOffset=0,this._analytics=null,this._chartData=null,this._loadingChart=!1,this._loadingAnalytics=!1,this.shadowRoot||this.attachShadow({mode:"open"}),this._render()}set hass(t){let e=this._hass;if(this._hass=t,!this._built){this._built=!0,this._render(),this._loadDay(),this._loadAnalytics();return}this._updateLiveValues(),this._maybeRefreshOnNewVisit(e)}get hass(){return this._hass}getCardSize(){return 14}connectedCallback(){this._hass&&!this._built&&(this._built=!0,this._render(),this._loadDay(),this._loadAnalytics())}_maybeRefreshOnNewVisit(t){if(!t)return;let e=this._config.device_entities.total_use,n=t.states[e],o=this._hass.states[e];o&&(!n||n.last_changed!==o.last_changed)&&(this._dayOffset===0&&this._loadDay(),this._loadAnalytics())}_s(t,e){return G(this._hass,t,e)}async _fetchVisits({start:t,end:e}){let n=this._config,o=R({startTime:t,endTime:e,entityIds:[n.device_entities.total_use]}),s=[this._hass.callWS(o)];if(n.cats.length>1){let h=R({startTime:t,endTime:e,entityIds:[n.device_entities.last_used_by],includeStartTimeState:!0});s.push(this._hass.callWS(h))}let r={},a={};try{let[h,f]=await Promise.all(s);r=h||{},a=f||{}}catch{}let l=O(r[n.device_entities.total_use],{minDelta:0,maxDelta:Z}),u;if(n.cats.length>1){let h=n.cats.map(p=>p.name),f=z(a[n.device_entities.last_used_by],h);u=F(l,f)}else u=l.map(h=>({...h,cat:n.cats[0].name}));let d=new Map(n.cats.map(h=>[h.name,h]));return u.filter(h=>d.has(h.cat)).map(h=>({cat:d.get(h.cat),duration:h.value,ts:h.ts}))}async _loadDay(){if(!this._hass)return;this._loadingChart=!0,this._renderChartArea();let t=this._config,{start:e,end:n}=A(this._dayOffset),o=[],s=[];try{let[r,a]=await Promise.all([this._fetchVisits({start:e,end:n}),t.device_entities.last_event?this._hass.callWS(R({startTime:e,endTime:n,entityIds:[t.device_entities.last_event]})):Promise.resolve({})]);o=r,s=(a||{})[t.device_entities.last_event]||[]}catch{o=[],s=[]}this._chartVisits=o,this._chartEventHist=s,this._loadingChart=!1,this._renderChartArea()}async _loadAnalytics(){if(!this._hass)return;this._loadingAnalytics=!0,this._renderAnalyticsArea();let t=this._config,e=new Date,n=new Date(e.getTime()-168*3600*1e3),o=[];try{o=await this._fetchVisits({start:n,end:e})}catch{o=[]}let s=S(e.getTime()),r={};t.cats.forEach(a=>{let l=o.filter(d=>d.cat===a).map(d=>({value:d.duration,ts:d.ts})),u=V(l,{dayKeyFn:S});r[a.name]=j(u,s)}),this._analytics=r,this._loadingAnalytics=!1,this._renderAnalyticsArea()}_render(){let t=this._config;this.shadowRoot.innerHTML=`
      <style>${X}</style>
      <ha-card>
        <div class="header">
          <div class="title">${t.title||J}</div>
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
    `,this.shadowRoot.getElementById("prev-day").addEventListener("click",()=>this._changeDay(-1)),this.shadowRoot.getElementById("next-day").addEventListener("click",()=>this._changeDay(1)),this._updateLiveValues(),this._renderChartArea(),this._renderAnalyticsArea()}_changeDay(t){this._dayOffset+=t,this._dayOffset>0&&(this._dayOffset=0),this._loadDay()}_updateLiveValues(){if(!this._built)return;let t=this._config,e=t.device_entities,n=this.shadowRoot.getElementById("status-row");if(n){let s=this._s(e.error,"no_error"),r=s&&s!=="no_error",a=t.info_row||[];n.innerHTML=[...a.map(l=>this._renderInfoChip(l)),r?this._chip("mdi:alert","Error",s.replace(/_/g," "),!0):""].join("")}let o=this.shadowRoot.getElementById("controls-row");if(o&&!o.dataset.bound){let s=t.controls_row||[];o.innerHTML=s.map((r,a)=>`
        <button class="ctrl-btn" id="ctrl-${a}"><ha-icon icon="${r.icon||"mdi:help"}"></ha-icon><span>${r.name||""}</span></button>
      `).join(""),o.dataset.bound="1",s.forEach((r,a)=>{this.shadowRoot.getElementById(`ctrl-${a}`).addEventListener("click",()=>this._runControlAction(r))})}}_renderInfoChip(t){let e=this._s(t.entity,null),{display:n,warn:o}=q(t,e);return this._chip(t.icon||"mdi:information-outline",t.name||t.entity,n,o)}_runControlAction(t){switch(t.action){case"press":{t.confirm?window.confirm(t.confirm)&&C(this._hass,t.entity):C(this._hass,t.entity);break}case"toggle_maintenance":{let e=t.state_entity||this._config.device_entities.state;this._s(e,"")==="maintenance"?C(this._hass,t.exit_entity):C(this._hass,t.start_entity);break}case"toggle":{k(this._hass,"homeassistant","toggle",{entity_id:t.entity});break}case"more_info":{K(this,t.entity);break}default:break}}_chip(t,e,n,o){return`
      <div class="chip ${o?"warn":""}">
        <ha-icon icon="${b(t)}"></ha-icon>
        <div class="chip-text"><div class="chip-label">${b(e)}</div><div class="chip-value">${b(n)}</div></div>
      </div>`}_renderChartArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("day-label");t&&(t.textContent=B(this._dayOffset));let e=this.shadowRoot.getElementById("next-day");e&&(e.disabled=this._dayOffset>=0);let n=this.shadowRoot.getElementById("chart-area"),o=this.shadowRoot.getElementById("records-list"),s=this.shadowRoot.getElementById("usage-body");if(!n||this._loadingChart)return;let r=this._config,a=(this._chartVisits||[]).slice().sort((c,m)=>c.ts-m.ts),l=tt,u=et,d=nt,h=Math.max(60,...a.map(c=>c.duration)),f=P(h),p=Math.ceil(h/f)*f,{start:v}=A(this._dayOffset),{xFor:$,yFor:ot}=U({dayStart:v,niceMax:p,width:l,height:u,padding:d}),{vertical:H,horizontal:M}=W({niceMax:p,yStep:f,width:l,height:u,padding:d}),it=H.map(c=>`<line x1="${c.x}" y1="${d.top}" x2="${c.x}" y2="${u-d.bottom}" class="grid-line-v" />`).join(""),at=M.map(c=>`<line x1="${d.left}" y1="${c.y}" x2="${l-d.right}" y2="${c.y}" class="grid-line-h" />`).join(""),st=(u-d.bottom)/u*100,rt=H.map(c=>`<div class="axis-label" style="left:${c.x/l*100}%;top:${st}%">${c.label}</div>`).join(""),ct=M.map(c=>`<div class="axis-label-y" style="top:${c.y/u*100}%">${c.label}</div>`).join(""),lt=a.map((c,m)=>{let g=$(c.ts),_=ot(c.duration),y=u-d.bottom;return`<line x1="${g}" y1="${y}" x2="${g}" y2="${_}" stroke="${c.cat.color}" stroke-width="2" />
              <circle class="visit-point" cx="${g}" cy="${_}" r="5" fill="${c.cat.color}" />
              <line class="visit-hit" data-idx="${m}" x1="${g}" y1="${y}" x2="${g}" y2="${_}" stroke="transparent" stroke-width="16" />`}).join("");n.innerHTML=`
      <div class="chart-wrap">
        <svg viewBox="0 0 ${l} ${u}" class="chart-svg">
          ${at}
          ${it}
          ${lt||""}
        </svg>
        ${rt}
        ${ct}
        <div class="chart-tooltip" id="chart-tooltip"></div>
      </div>
      ${a.length===0?'<div class="empty-note">No visits recorded this day</div>':""}
    `;let w=this.shadowRoot.getElementById("chart-tooltip"),dt=n.querySelector(".chart-wrap");if(n.querySelectorAll(".visit-hit").forEach(c=>{c.addEventListener("mouseenter",()=>{let m=a[parseInt(c.dataset.idx,10)],g=new Date(m.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"});w.textContent=`${g} \xB7 ${m.cat.name} \xB7 ${x(m.duration)}`;let _=c.getBoundingClientRect(),y=dt.getBoundingClientRect();w.style.left=`${_.left-y.left+_.width/2}px`,w.style.top=`${_.top-y.top}px`,w.classList.add("visible")}),c.addEventListener("mouseleave",()=>{w.classList.remove("visible")})}),s){let c={};r.cats.forEach(_=>{c[_.name]={count:0}}),a.forEach(_=>{c[_.cat.name].count+=1});let m=a.length,g=r.cats.map(_=>{let y=c[_.name];return`<span class="usage-cat"><span class="dot" style="background:${_.color}"></span>${_.name}: ${y.count}</span>`}).join("");s.innerHTML=`
        <div class="usage-row">
          <div class="stat-value">${m} time${m===1?"":"s"}</div>
          <div class="usage-cats">${g}</div>
        </div>
      `}let E=a.map(c=>({ts:c.ts,icon:"mdi:cat",color:c.cat.color,text:`${c.cat.name} just spent ${x(c.duration)} in the litter box`})),ht=this._chartEventHist||[],D=this._eventLabels();ht.forEach(c=>{let m=c.s??c.state,g=c.lu?c.lu*1e3:c.last_changed?Date.parse(c.last_changed):null;if(!m||!g||m in D&&D[m]===null)return;let _=D[m]||m.replace(/_/g," ").replace(/\b\w/g,y=>y.toUpperCase());E.push({ts:g,icon:"mdi:information-outline",color:"var(--secondary-text-color)",text:_})}),E.sort((c,m)=>m.ts-c.ts),o&&(E.length===0?o.innerHTML='<div class="empty-note">No records for this day</div>':o.innerHTML=E.map(c=>`
          <div class="record-row">
            <div class="record-time">${new Date(c.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</div>
            <ha-icon icon="${b(c.icon)}" style="color:${b(c.color)}"></ha-icon>
            <div class="record-text">${b(c.text)}</div>
          </div>
        `).join(""))}_eventLabels(){return{...Y,...this._config.event_labels||{}}}_renderAnalyticsArea(){if(!this._built)return;let t=this.shadowRoot.getElementById("analytics-grid"),e=this.shadowRoot.getElementById("decline-banner");if(!t||this._loadingAnalytics||!this._analytics)return;let n=this._config,o=(n.decline_threshold_pct||Q)/100,s=[];t.innerHTML=n.cats.map(r=>{let a=this._analytics[r.name]||{};return a.daysOfHistory>=3&&a.avg7dTotal&&new Date().getHours()>=18&&(a.todayTotal<o*a.avg7dTotal?s.push(`${r.name}'s usage today is well below their recent average \u2014 worth a check.`):a.todayTotal>(2-o)*a.avg7dTotal&&s.push(`${r.name}'s usage today is well above their recent average \u2014 worth a check.`)),`
        <div class="cat-analytics">
          <table>
            <tr><td class="cat-name-cell"><span class="dot" style="background:${b(r.color)}"></span>${b(r.name)}</td><td>Today</td><td>3d avg</td><td>7d avg</td></tr>
            <tr><td>Visits</td><td>${a.todayCount??0}</td><td>${a.avg3dVisits!==null&&a.avg3dVisits!==void 0?a.avg3dVisits.toFixed(1):"\u2014"}</td><td>${a.avg7dVisits!==null&&a.avg7dVisits!==void 0?a.avg7dVisits.toFixed(1):"\u2014"}</td></tr>
            <tr><td>Duration</td><td>${a.todayAvgDuration?x(a.todayAvgDuration):"\u2014"}</td><td>${a.avg3dDuration?x(a.avg3dDuration):"\u2014"}</td><td>${a.avg7dDuration?x(a.avg7dDuration):"\u2014"}</td></tr>
          </table>
        </div>
      `}).join(""),e&&(e.innerHTML=s.length?s.map(r=>`<div class="warn-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${r}</div>`).join(""):"")}};var mt=[{name:"name",label:"Name",selector:{text:{}}},{name:"color",label:"Color",selector:{text:{}}}],_t={name:"",color:"#4fc3f7"},ft=[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"unit",label:"Unit",selector:{text:{}}},{name:"warn_below",label:"Warn below",selector:{number:{mode:"box"}}},{name:"warn_above",label:"Warn above",selector:{number:{mode:"box"}}},{name:"warn_state",label:"Warn state",selector:{text:{}}}],gt={entity:"",name:"",icon:"mdi:information-outline"},vt=["press","toggle_maintenance","toggle","more_info"],yt=[{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"action",label:"Action",selector:{select:{options:vt,mode:"dropdown"}}}],bt={press:[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"confirm",label:"Confirm text (optional)",selector:{text:{}}}],toggle:[{name:"entity",label:"Entity",selector:{entity:{}}}],more_info:[{name:"entity",label:"Entity",selector:{entity:{}}}],toggle_maintenance:[{name:"start_entity",label:"Start entity",selector:{entity:{domain:"button"}}},{name:"exit_entity",label:"Exit entity",selector:{entity:{domain:"button"}}},{name:"state_entity",label:"State entity (optional)",selector:{entity:{}}}]};function xt(i){return[...yt,...bt[i]||[]]}var wt={name:"",icon:"mdi:gesture-tap-button",action:"press",entity:""},Ct=[{name:"title",selector:{text:{}}},{name:"device_entities",type:"expandable",title:"Device entities",schema:[{name:"device_entities_total_use",label:"Total use sensor (required)",selector:{entity:{}}},{name:"device_entities_last_used_by",label:"Last used by sensor (required if more than one cat)",selector:{entity:{}}},{name:"device_entities_error",label:"Error sensor",selector:{entity:{}}},{name:"device_entities_last_event",label:"Last event sensor",selector:{entity:{}}},{name:"device_entities_state",label:"State sensor",selector:{entity:{}}}]},{name:"decline_threshold_pct",label:"Decline/spike alert threshold (%)",selector:{number:{min:10,max:100,mode:"box"}}}],L=class extends HTMLElement{setConfig(t){this._config=t||{},this._render()}set hass(t){this._hass=t,this._render()}get hass(){return this._hass}connectedCallback(){this._render()}_fireConfigChanged(t){this._config=t,this.dispatchEvent(new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:t}}))}_flattenMain(){let t=this._config||{},e=t.device_entities||{};return{title:t.title,device_entities_total_use:e.total_use,device_entities_last_used_by:e.last_used_by,device_entities_error:e.error,device_entities_last_event:e.last_event,device_entities_state:e.state,decline_threshold_pct:t.decline_threshold_pct}}_onMainFormChanged(t){let e={...this._config};e.title=t.title,e.device_entities={...e.device_entities||{},total_use:t.device_entities_total_use,last_used_by:t.device_entities_last_used_by,error:t.device_entities_error,last_event:t.device_entities_last_event,state:t.device_entities_state},e.decline_threshold_pct=t.decline_threshold_pct,this._fireConfigChanged(e)}_render(){this.shadowRoot||this.attachShadow({mode:"open"}),this._config&&(this.shadowRoot.innerHTML=`
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
    `,this._renderMainForm(),this._renderCats(),this._renderInfoRows(),this._renderControlsRows(),this.shadowRoot.getElementById("add-cat").addEventListener("click",()=>this._addCat()),this.shadowRoot.getElementById("add-info-row").addEventListener("click",()=>this._addInfoRow()),this.shadowRoot.getElementById("add-control-row").addEventListener("click",()=>this._addControlRow()))}_renderCats(){let t=this.shadowRoot.getElementById("cats-rows");t.innerHTML="",(this._config.cats||[]).forEach((n,o)=>{let s=document.createElement("div");s.className="row",s.dataset.index=String(o);let r=document.createElement("ha-form");r.schema=mt,r.data=n,r.hass=this._hass,r.computeLabel=l=>l.label||l.name,r.addEventListener("value-changed",l=>{l.stopPropagation(),this._updateCat(o,l.detail.value)});let a=document.createElement("button");a.className="remove-btn",a.type="button",a.textContent="Remove",a.addEventListener("click",()=>this._removeCat(o)),s.appendChild(r),s.appendChild(a),t.appendChild(s)})}_updateCat(t,e){let n=[...this._config.cats||[]];n[t]=e,this._fireConfigChanged({...this._config,cats:n})}_addCat(){let t=[...this._config.cats||[],{..._t}];this._fireConfigChanged({...this._config,cats:t}),this._render()}_removeCat(t){let e=(this._config.cats||[]).filter((n,o)=>o!==t);this._fireConfigChanged({...this._config,cats:e}),this._render()}_renderInfoRows(){let t=this.shadowRoot.getElementById("info-rows");t.innerHTML="",(this._config.info_row||[]).forEach((n,o)=>{let s=document.createElement("div");s.className="row",s.dataset.index=String(o);let r=document.createElement("ha-form");r.schema=ft,r.data=n,r.hass=this._hass,r.computeLabel=l=>l.label||l.name,r.addEventListener("value-changed",l=>{l.stopPropagation(),this._updateInfoRow(o,l.detail.value)});let a=document.createElement("button");a.className="remove-btn",a.type="button",a.textContent="Remove",a.addEventListener("click",()=>this._removeInfoRow(o)),s.appendChild(r),s.appendChild(a),t.appendChild(s)})}_updateInfoRow(t,e){let n=[...this._config.info_row||[]];n[t]=e,this._fireConfigChanged({...this._config,info_row:n})}_addInfoRow(){let t=[...this._config.info_row||[],{...gt}];this._fireConfigChanged({...this._config,info_row:t}),this._render()}_removeInfoRow(t){let e=(this._config.info_row||[]).filter((n,o)=>o!==t);this._fireConfigChanged({...this._config,info_row:e}),this._render()}_renderControlsRows(){let t=this.shadowRoot.getElementById("controls-rows");t.innerHTML="",(this._config.controls_row||[]).forEach((n,o)=>{let s=document.createElement("div");s.className="row",s.dataset.index=String(o);let r=document.createElement("ha-form");r.schema=xt(n.action),r.data=n,r.hass=this._hass,r.computeLabel=l=>l.label||l.name,r.addEventListener("value-changed",l=>{l.stopPropagation(),this._updateControlRow(o,l.detail.value)});let a=document.createElement("button");a.className="remove-btn",a.type="button",a.textContent="Remove",a.addEventListener("click",()=>this._removeControlRow(o)),s.appendChild(r),s.appendChild(a),t.appendChild(s)})}_updateControlRow(t,e){let n=[...this._config.controls_row||[]],o=n[t]&&n[t].action;n[t]=e,this._fireConfigChanged({...this._config,controls_row:n}),e.action!==o&&this._renderControlsRows()}_addControlRow(){let t=[...this._config.controls_row||[],{...wt}];this._fireConfigChanged({...this._config,controls_row:t}),this._render()}_removeControlRow(t){let e=(this._config.controls_row||[]).filter((n,o)=>o!==t);this._fireConfigChanged({...this._config,controls_row:e}),this._render()}_renderMainForm(){let t=this.shadowRoot.getElementById("main-section"),e=document.createElement("ha-form");e.schema=Ct,e.data=this._flattenMain(),e.hass=this._hass,e.computeLabel=n=>n.label||n.name,e.addEventListener("value-changed",n=>{n.stopPropagation(),this._onMainFormChanged(n.detail.value)}),t.appendChild(e)}};customElements.get("petkit-puramax-card")||customElements.define("petkit-puramax-card",T);customElements.get("petkit-puramax-card-editor")||customElements.define("petkit-puramax-card-editor",L);var I=window;I.customCards=I.customCards||[];I.customCards.push({type:"petkit-puramax-card",name:"PETKIT PURAMAX Card",description:"Configurable card for PETKIT PURAMAX litter box monitoring, controls, and per-cat visit analytics."});
//# sourceMappingURL=petkit-puramax-card.js.map
