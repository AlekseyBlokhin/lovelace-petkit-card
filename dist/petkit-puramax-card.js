var E2=Object.defineProperty;var N2=(M,C,H)=>C in M?E2(M,C,{enumerable:!0,configurable:!0,writable:!0,value:H}):M[C]=H;var B=(M,C,H)=>N2(M,typeof C!="symbol"?C+"":C,H);var Y=globalThis,J=Y.ShadowRoot&&(Y.ShadyCSS===void 0||Y.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,n1=Symbol(),w1=new WeakMap,N=class{constructor(C,H,V){if(this._$cssResult$=!0,V!==n1)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=C,this.t=H}get styleSheet(){let C=this.o,H=this.t;if(J&&C===void 0){let V=H!==void 0&&H.length===1;V&&(C=w1.get(H)),C===void 0&&((this.o=C=new CSSStyleSheet).replaceSync(this.cssText),V&&w1.set(H,C))}return C}toString(){return this.cssText}},b1=M=>new N(typeof M=="string"?M:M+"",void 0,n1),$=(M,...C)=>{let H=M.length===1?M[0]:C.reduce((V,L,r)=>V+(e=>{if(e._$cssResult$===!0)return e.cssText;if(typeof e=="number")return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(L)+M[r+1],M[0]);return new N(H,M,n1)},B1=(M,C)=>{if(J)M.adoptedStyleSheets=C.map(H=>H instanceof CSSStyleSheet?H:H.styleSheet);else for(let H of C){let V=document.createElement("style"),L=Y.litNonce;L!==void 0&&V.setAttribute("nonce",L),V.textContent=H.cssText,M.appendChild(V)}},l1=J?M=>M:M=>M instanceof CSSStyleSheet?(C=>{let H="";for(let V of C.cssRules)H+=V.cssText;return b1(H)})(M):M;var{is:$2,defineProperty:W2,getOwnPropertyDescriptor:I2,getOwnPropertyNames:U2,getOwnPropertySymbols:G2,getPrototypeOf:Q2}=Object,c=globalThis,P1=c.trustedTypes,z2=P1?P1.emptyScript:"",K2=c.reactiveElementPolyfillSupport,W=(M,C)=>M,v1={toAttribute(M,C){switch(C){case Boolean:M=M?z2:null;break;case Object:case Array:M=M==null?M:JSON.stringify(M)}return M},fromAttribute(M,C){let H=M;switch(C){case Boolean:H=M!==null;break;case Number:H=M===null?null:Number(M);break;case Object:case Array:try{H=JSON.parse(M)}catch{H=null}}return H}},F1=(M,C)=>!$2(M,C),T1={attribute:!0,type:String,converter:v1,reflect:!1,useDefault:!1,hasChanged:F1};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),c.litPropertyMetadata??(c.litPropertyMetadata=new WeakMap);var Z=class extends HTMLElement{static addInitializer(C){this._$Ei(),(this.l??(this.l=[])).push(C)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(C,H=T1){if(H.state&&(H.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(C)&&((H=Object.create(H)).wrapped=!0),this.elementProperties.set(C,H),!H.noAccessor){let V=Symbol(),L=this.getPropertyDescriptor(C,V,H);L!==void 0&&W2(this.prototype,C,L)}}static getPropertyDescriptor(C,H,V){let{get:L,set:r}=I2(this.prototype,C)??{get(){return this[H]},set(e){this[H]=e}};return{get:L,set(e){let t=L?.call(this);r?.call(this,e),this.requestUpdate(C,t,V)},configurable:!0,enumerable:!0}}static getPropertyOptions(C){return this.elementProperties.get(C)??T1}static _$Ei(){if(this.hasOwnProperty(W("elementProperties")))return;let C=Q2(this);C.finalize(),C.l!==void 0&&(this.l=[...C.l]),this.elementProperties=new Map(C.elementProperties)}static finalize(){if(this.hasOwnProperty(W("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(W("properties"))){let H=this.properties,V=[...U2(H),...G2(H)];for(let L of V)this.createProperty(L,H[L])}let C=this[Symbol.metadata];if(C!==null){let H=litPropertyMetadata.get(C);if(H!==void 0)for(let[V,L]of H)this.elementProperties.set(V,L)}this._$Eh=new Map;for(let[H,V]of this.elementProperties){let L=this._$Eu(H,V);L!==void 0&&this._$Eh.set(L,H)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(C){let H=[];if(Array.isArray(C)){let V=new Set(C.flat(1/0).reverse());for(let L of V)H.unshift(l1(L))}else C!==void 0&&H.push(l1(C));return H}static _$Eu(C,H){let V=H.attribute;return V===!1?void 0:typeof V=="string"?V:typeof C=="string"?C.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(C=>this.enableUpdating=C),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(C=>C(this))}addController(C){(this._$EO??(this._$EO=new Set)).add(C),this.renderRoot!==void 0&&this.isConnected&&C.hostConnected?.()}removeController(C){this._$EO?.delete(C)}_$E_(){let C=new Map,H=this.constructor.elementProperties;for(let V of H.keys())this.hasOwnProperty(V)&&(C.set(V,this[V]),delete this[V]);C.size>0&&(this._$Ep=C)}createRenderRoot(){let C=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return B1(C,this.constructor.elementStyles),C}connectedCallback(){this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),this._$EO?.forEach(C=>C.hostConnected?.())}enableUpdating(C){}disconnectedCallback(){this._$EO?.forEach(C=>C.hostDisconnected?.())}attributeChangedCallback(C,H,V){this._$AK(C,V)}_$ET(C,H){let V=this.constructor.elementProperties.get(C),L=this.constructor._$Eu(C,V);if(L!==void 0&&V.reflect===!0){let r=(V.converter?.toAttribute!==void 0?V.converter:v1).toAttribute(H,V.type);this._$Em=C,r==null?this.removeAttribute(L):this.setAttribute(L,r),this._$Em=null}}_$AK(C,H){let V=this.constructor,L=V._$Eh.get(C);if(L!==void 0&&this._$Em!==L){let r=V.getPropertyOptions(L),e=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:v1;this._$Em=L;let t=e.fromAttribute(H,r.type);this[L]=t??this._$Ej?.get(L)??t,this._$Em=null}}requestUpdate(C,H,V,L=!1,r){if(C!==void 0){let e=this.constructor;if(L===!1&&(r=this[C]),V??(V=e.getPropertyOptions(C)),!((V.hasChanged??F1)(r,H)||V.useDefault&&V.reflect&&r===this._$Ej?.get(C)&&!this.hasAttribute(e._$Eu(C,V))))return;this.C(C,H,V)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(C,H,{useDefault:V,reflect:L,wrapped:r},e){V&&!(this._$Ej??(this._$Ej=new Map)).has(C)&&(this._$Ej.set(C,e??H??this[C]),r!==!0||e!==void 0)||(this._$AL.has(C)||(this.hasUpdated||V||(H=void 0),this._$AL.set(C,H)),L===!0&&this._$Em!==C&&(this._$Eq??(this._$Eq=new Set)).add(C))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(H){Promise.reject(H)}let C=this.scheduleUpdate();return C!=null&&await C,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(let[L,r]of this._$Ep)this[L]=r;this._$Ep=void 0}let V=this.constructor.elementProperties;if(V.size>0)for(let[L,r]of V){let{wrapped:e}=r,t=this[L];e!==!0||this._$AL.has(L)||t===void 0||this.C(L,void 0,r,t)}}let C=!1,H=this._$AL;try{C=this.shouldUpdate(H),C?(this.willUpdate(H),this._$EO?.forEach(V=>V.hostUpdate?.()),this.update(H)):this._$EM()}catch(V){throw C=!1,this._$EM(),V}C&&this._$AE(H)}willUpdate(C){}_$AE(C){this._$EO?.forEach(H=>H.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(C)),this.updated(C)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(C){return!0}update(C){this._$Eq&&(this._$Eq=this._$Eq.forEach(H=>this._$ET(H,this[H]))),this._$EM()}updated(C){}firstUpdated(C){}};Z.elementStyles=[],Z.shadowRootOptions={mode:"open"},Z[W("elementProperties")]=new Map,Z[W("finalized")]=new Map,K2?.({ReactiveElement:Z}),(c.reactiveElementVersions??(c.reactiveElementVersions=[])).push("2.1.2");var U=globalThis,R1=M=>M,C1=U.trustedTypes,_1=C1?C1.createPolicy("lit-html",{createHTML:M=>M}):void 0,Z1="$lit$",s=`lit$${Math.random().toFixed(9).slice(2)}$`,s1="?"+s,q2=`<${s1}>`,k=document,G=()=>k.createComment(""),Q=M=>M===null||typeof M!="object"&&typeof M!="function",S1=Array.isArray,I1=M=>S1(M)||typeof M?.[Symbol.iterator]=="function",x1=`[ 	
\f\r]`,I=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D1=/-->/g,E1=/>/g,f=RegExp(`>|${x1}(?:([^\\s"'>=/]+)(${x1}*=${x1}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),N1=/'/g,$1=/"/g,U1=/^(?:script|style|textarea|title)$/i,u1=M=>(C,...H)=>({_$litType$:M,strings:C,values:H}),m=u1(1),e1=u1(2),T5=u1(3),S=Symbol.for("lit-noChange"),n=Symbol.for("lit-nothing"),W1=new WeakMap,g=k.createTreeWalker(k,129);function G1(M,C){if(!S1(M)||!M.hasOwnProperty("raw"))throw Error("invalid template strings array");return _1!==void 0?_1.createHTML(C):C}var Q1=(M,C)=>{let H=M.length-1,V=[],L,r=C===2?"<svg>":C===3?"<math>":"",e=I;for(let t=0;t<H;t++){let i=M[t],a,p,o=-1,A=0;for(;A<i.length&&(e.lastIndex=A,p=e.exec(i),p!==null);)A=e.lastIndex,e===I?p[1]==="!--"?e=D1:p[1]!==void 0?e=E1:p[2]!==void 0?(U1.test(p[2])&&(L=RegExp("</"+p[2],"g")),e=f):p[3]!==void 0&&(e=f):e===f?p[0]===">"?(e=L??I,o=-1):p[1]===void 0?o=-2:(o=e.lastIndex-p[2].length,a=p[1],e=p[3]===void 0?f:p[3]==='"'?$1:N1):e===$1||e===N1?e=f:e===D1||e===E1?e=I:(e=f,L=void 0);let d=e===f&&M[t+1].startsWith("/>")?" ":"";r+=e===I?i+q2:o>=0?(V.push(a),i.slice(0,o)+Z1+i.slice(o)+s+d):i+s+(o===-2?t:d)}return[G1(M,r+(M[H]||"<?>")+(C===2?"</svg>":C===3?"</math>":"")),V]},z=class M{constructor({strings:C,_$litType$:H},V){let L;this.parts=[];let r=0,e=0,t=C.length-1,i=this.parts,[a,p]=Q1(C,H);if(this.el=M.createElement(a,V),g.currentNode=this.el.content,H===2||H===3){let o=this.el.content.firstChild;o.replaceWith(...o.childNodes)}for(;(L=g.nextNode())!==null&&i.length<t;){if(L.nodeType===1){if(L.hasAttributes())for(let o of L.getAttributeNames())if(o.endsWith(Z1)){let A=p[e++],d=L.getAttribute(o).split(s),l=/([.?@])?(.*)/.exec(A);i.push({type:1,index:r,name:l[2],strings:d,ctor:l[1]==="."?V1:l[1]==="?"?L1:l[1]==="@"?M1:w}),L.removeAttribute(o)}else o.startsWith(s)&&(i.push({type:6,index:r}),L.removeAttribute(o));if(U1.test(L.tagName)){let o=L.textContent.split(s),A=o.length-1;if(A>0){L.textContent=C1?C1.emptyScript:"";for(let d=0;d<A;d++)L.append(o[d],G()),g.nextNode(),i.push({type:2,index:++r});L.append(o[A],G())}}}else if(L.nodeType===8)if(L.data===s1)i.push({type:2,index:r});else{let o=-1;for(;(o=L.data.indexOf(s,o+1))!==-1;)i.push({type:7,index:r}),o+=s.length-1}r++}}static createElement(C,H){let V=k.createElement("template");return V.innerHTML=C,V}};function y(M,C,H=M,V){if(C===S)return C;let L=V!==void 0?H._$Co?.[V]:H._$Cl,r=Q(C)?void 0:C._$litDirective$;return L?.constructor!==r&&(L?._$AO?.(!1),r===void 0?L=void 0:(L=new r(M),L._$AT(M,H,V)),V!==void 0?(H._$Co??(H._$Co=[]))[V]=L:H._$Cl=L),L!==void 0&&(C=y(M,L._$AS(M,C.values),L,V)),C}var H1=class{constructor(C,H){this._$AV=[],this._$AN=void 0,this._$AD=C,this._$AM=H}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(C){let{el:{content:H},parts:V}=this._$AD,L=(C?.creationScope??k).importNode(H,!0);g.currentNode=L;let r=g.nextNode(),e=0,t=0,i=V[0];for(;i!==void 0;){if(e===i.index){let a;i.type===2?a=new P(r,r.nextSibling,this,C):i.type===1?a=new i.ctor(r,i.name,i.strings,this,C):i.type===6&&(a=new r1(r,this,C)),this._$AV.push(a),i=V[++t]}e!==i?.index&&(r=g.nextNode(),e++)}return g.currentNode=k,L}p(C){let H=0;for(let V of this._$AV)V!==void 0&&(V.strings!==void 0?(V._$AI(C,V,H),H+=V.strings.length-2):V._$AI(C[H])),H++}},P=class M{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(C,H,V,L){this.type=2,this._$AH=n,this._$AN=void 0,this._$AA=C,this._$AB=H,this._$AM=V,this.options=L,this._$Cv=L?.isConnected??!0}get parentNode(){let C=this._$AA.parentNode,H=this._$AM;return H!==void 0&&C?.nodeType===11&&(C=H.parentNode),C}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(C,H=this){C=y(this,C,H),Q(C)?C===n||C==null||C===""?(this._$AH!==n&&this._$AR(),this._$AH=n):C!==this._$AH&&C!==S&&this._(C):C._$litType$!==void 0?this.$(C):C.nodeType!==void 0?this.T(C):I1(C)?this.k(C):this._(C)}O(C){return this._$AA.parentNode.insertBefore(C,this._$AB)}T(C){this._$AH!==C&&(this._$AR(),this._$AH=this.O(C))}_(C){this._$AH!==n&&Q(this._$AH)?this._$AA.nextSibling.data=C:this.T(k.createTextNode(C)),this._$AH=C}$(C){let{values:H,_$litType$:V}=C,L=typeof V=="number"?this._$AC(C):(V.el===void 0&&(V.el=z.createElement(G1(V.h,V.h[0]),this.options)),V);if(this._$AH?._$AD===L)this._$AH.p(H);else{let r=new H1(L,this),e=r.u(this.options);r.p(H),this.T(e),this._$AH=r}}_$AC(C){let H=W1.get(C.strings);return H===void 0&&W1.set(C.strings,H=new z(C)),H}k(C){S1(this._$AH)||(this._$AH=[],this._$AR());let H=this._$AH,V,L=0;for(let r of C)L===H.length?H.push(V=new M(this.O(G()),this.O(G()),this,this.options)):V=H[L],V._$AI(r),L++;L<H.length&&(this._$AR(V&&V._$AB.nextSibling,L),H.length=L)}_$AR(C=this._$AA.nextSibling,H){for(this._$AP?.(!1,!0,H);C!==this._$AB;){let V=R1(C).nextSibling;R1(C).remove(),C=V}}setConnected(C){this._$AM===void 0&&(this._$Cv=C,this._$AP?.(C))}},w=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(C,H,V,L,r){this.type=1,this._$AH=n,this._$AN=void 0,this.element=C,this.name=H,this._$AM=L,this.options=r,V.length>2||V[0]!==""||V[1]!==""?(this._$AH=Array(V.length-1).fill(new String),this.strings=V):this._$AH=n}_$AI(C,H=this,V,L){let r=this.strings,e=!1;if(r===void 0)C=y(this,C,H,0),e=!Q(C)||C!==this._$AH&&C!==S,e&&(this._$AH=C);else{let t=C,i,a;for(C=r[0],i=0;i<r.length-1;i++)a=y(this,t[V+i],H,i),a===S&&(a=this._$AH[i]),e||(e=!Q(a)||a!==this._$AH[i]),a===n?C=n:C!==n&&(C+=(a??"")+r[i+1]),this._$AH[i]=a}e&&!L&&this.j(C)}j(C){C===n?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,C??"")}},V1=class extends w{constructor(){super(...arguments),this.type=3}j(C){this.element[this.name]=C===n?void 0:C}},L1=class extends w{constructor(){super(...arguments),this.type=4}j(C){this.element.toggleAttribute(this.name,!!C&&C!==n)}},M1=class extends w{constructor(C,H,V,L,r){super(C,H,V,L,r),this.type=5}_$AI(C,H=this){if((C=y(this,C,H,0)??n)===S)return;let V=this._$AH,L=C===n&&V!==n||C.capture!==V.capture||C.once!==V.once||C.passive!==V.passive,r=C!==n&&(V===n||L);L&&this.element.removeEventListener(this.name,this,V),r&&this.element.addEventListener(this.name,this,C),this._$AH=C}handleEvent(C){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,C):this._$AH.handleEvent(C)}},r1=class{constructor(C,H,V){this.element=C,this.type=6,this._$AN=void 0,this._$AM=H,this.options=V}get _$AU(){return this._$AM._$AU}_$AI(C){y(this,C)}},z1={M:Z1,P:s,A:s1,C:1,L:Q1,R:H1,D:I1,V:y,I:P,H:w,N:L1,U:M1,B:V1,F:r1},j2=U.litHtmlPolyfillSupport;j2?.(z,P),(U.litHtmlVersions??(U.litHtmlVersions=[])).push("3.3.3");var K1=(M,C,H)=>{let V=H?.renderBefore??C,L=V._$litPart$;if(L===void 0){let r=H?.renderBefore??null;V._$litPart$=L=new P(C.insertBefore(G(),r),r,void 0,H??{})}return L._$AI(M),L};var K=globalThis,x=class extends Z{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var H;let C=super.createRenderRoot();return(H=this.renderOptions).renderBefore??(H.renderBefore=C.firstChild),C}update(C){let H=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(C),this._$Do=K1(H,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return S}};x._$litElement$=!0,x.finalized=!0,K.litElementHydrateSupport?.({LitElement:x});var X2=K.litElementPolyfillSupport;X2?.({LitElement:x});(K.litElementVersions??(K.litElementVersions=[])).push("4.2.2");var q1={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},j1=M=>(...C)=>({_$litDirective$:M,values:C}),t1=class{constructor(C){}get _$AU(){return this._$AM._$AU}_$AT(C,H,V){this._$Ct=C,this._$AM=H,this._$Ci=V}_$AS(C,H){return this.update(C,H)}update(C,H){return this.render(...H)}};var{I:Y2}=z1,X1=M=>M;var Y1=()=>document.createComment(""),T=(M,C,H)=>{let V=M._$AA.parentNode,L=C===void 0?M._$AB:C._$AA;if(H===void 0){let r=V.insertBefore(Y1(),L),e=V.insertBefore(Y1(),L);H=new Y2(r,e,M,M.options)}else{let r=H._$AB.nextSibling,e=H._$AM,t=e!==M;if(t){let i;H._$AQ?.(M),H._$AM=M,H._$AP!==void 0&&(i=M._$AU)!==e._$AU&&H._$AP(i)}if(r!==L||t){let i=H._$AA;for(;i!==r;){let a=X1(i).nextSibling;X1(V).insertBefore(i,L),i=a}}}return H},h=(M,C,H=M)=>(M._$AI(C,H),M),J2={},J1=(M,C=J2)=>M._$AH=C,C2=M=>M._$AH,i1=M=>{M._$AR(),M._$AA.remove()};var H2=(M,C,H)=>{let V=new Map;for(let L=C;L<=H;L++)V.set(M[L],L);return V},V2=j1(class extends t1{constructor(M){if(super(M),M.type!==q1.CHILD)throw Error("repeat() can only be used in text expressions")}dt(M,C,H){let V;H===void 0?H=C:C!==void 0&&(V=C);let L=[],r=[],e=0;for(let t of M)L[e]=V?V(t,e):e,r[e]=H(t,e),e++;return{values:r,keys:L}}render(M,C,H){return this.dt(M,C,H).values}update(M,[C,H,V]){let L=C2(M),{values:r,keys:e}=this.dt(C,H,V);if(!Array.isArray(L))return this.ut=e,r;let t=this.ut??(this.ut=[]),i=[],a,p,o=0,A=L.length-1,d=0,l=r.length-1;for(;o<=A&&d<=l;)if(L[o]===null)o++;else if(L[A]===null)A--;else if(t[o]===e[d])i[d]=h(L[o],r[d]),o++,d++;else if(t[A]===e[l])i[l]=h(L[A],r[l]),A--,l--;else if(t[o]===e[l])i[l]=h(L[o],r[l]),T(M,i[l+1],L[o]),o++,l--;else if(t[A]===e[d])i[d]=h(L[A],r[d]),T(M,L[o],L[A]),A--,d++;else if(a===void 0&&(a=H2(e,d,l),p=H2(t,o,A)),a.has(t[o]))if(a.has(t[A])){let v=p.get(e[d]),E=v!==void 0?L[v]:null;if(E===null){let u=T(M,L[o]);h(u,r[d]),i[d]=u}else i[d]=h(E,r[d]),T(M,L[o],E),L[v]=null;d++}else i1(L[A]),A--;else i1(L[o]),o++;for(;d<=l;){let v=T(M,i[l+1]);h(v,r[d]),i[d++]=v}for(;o<=A;){let v=L[o++];v!==null&&i1(v)}return this.ut=e,J1(M,i),S}});function q(M){let C=Math.round(M||0);if(C<60)return`${C}s`;let H=Math.floor(C/60),V=C%60;return`${H}m${V.toString().padStart(2,"0")}s`}function L2(M){let C=Math.round(M||0),H=Math.floor(C/60),V=C%60;return`${H.toString().padStart(2,"0")}'${V.toString().padStart(2,"0")}"`}function M2(M){let C=Math.floor(M);return C<1?"under 1h":C<48?`${C}h`:`${Math.floor(C/24)}d`}function o1(M,C=new Date){let H=new Date(C.getFullYear(),C.getMonth(),C.getDate());H.setDate(H.getDate()+M);let V=new Date(H);return V.setDate(V.getDate()+1),{start:H,end:V}}function r2(M,C=new Date){if(M===0)return"Today";if(M===-1)return"Yesterday";let{start:H}=o1(M,C);return H.toLocaleDateString(void 0,{weekday:"short",month:"short",day:"numeric"})}function c1(M){let C=new Date(M);return`${C.getFullYear()}-${C.getMonth()}-${C.getDate()}`}function A1({startTime:M,endTime:C,entityIds:H,includeStartTimeState:V=!1}){let L=M instanceof Date?M.toISOString():M,r=C instanceof Date?C.toISOString():C;return{type:"history/history_during_period",start_time:L,end_time:r,entity_ids:H,minimal_response:!1,no_attributes:!0,include_start_time_state:V}}function e2(M){if(!M)return null;let C=M.s??M.state,H=M.lu?M.lu*1e3:M.last_changed?Date.parse(M.last_changed):null;return{state:C,ts:H}}function C5(M){let C=e2(M);if(!C)return null;let H=parseFloat(C.state),{ts:V}=C;return!Number.isFinite(H)||!V||Number.isNaN(V)?null:{value:H,ts:V}}function t2(M,{minDelta:C=0,maxDelta:H=1/0}={}){if(!Array.isArray(M))return[];let V=M.map(C5).filter(Boolean).sort((r,e)=>r.ts-e.ts),L=[];for(let r=1;r<V.length;r++){let e=V[r].value-V[r-1].value;if(e<=C||e>=H)continue;let t=V[r+1];t&&t.value===V[r-1].value||L.push({value:e,ts:V[r].ts})}return L}var H5="unknown_pet",F="Unknown";function i2(M,C){if(!Array.isArray(M))return[];let H=new Set(C),V=[];for(let L of M){let{state:r,ts:e}=e2(L),t;if(H.has(r))t=r;else if(r===H5)t=F;else continue;!e||Number.isNaN(e)||V.push({cat:t,ts:e})}return V.sort((L,r)=>L.ts-r.ts),V}function o2(M,C){let H=M.length,V=new Array(H).fill(null),L=0,r=null;for(let e=0;e<H;e++){let t=M[e].ts,i=e===0?-1/0:(M[e-1].ts+t)/2,a=e===H-1?1/0:(t+M[e+1].ts)/2;for(;L<C.length&&C[L].ts<i;)r=C[L].cat,L++;let p=null,o=1/0;for(;L<C.length&&C[L].ts<a;){let A=Math.abs(C[L].ts-t);A<o&&(o=A,p=C[L].cat),r=C[L].cat,L++}V[e]=p!==null?p:r}return M.map((e,t)=>({...e,cat:V[t]}))}var V5=[10,15,30,60,120,180,300,600,900,1800,3600];function A2(M){for(let C of V5)if(M/C<=5)return C;return Math.ceil(M/5/60)*60}function a2({dayStart:M,niceMax:C,width:H,height:V,padding:L}){let{left:r,right:e,top:t,bottom:i}=L,a=H-r-e,p=V-t-i,o=M.getTime();return{xFor:l=>{let v=(l-o)/36e5;return r+v/24*a},yFor:l=>C?V-i-l/C*p:V-i}}function d2({niceMax:M,yStep:C,width:H,height:V,padding:L}){let{left:r,right:e,top:t,bottom:i}=L,a=H-r-e,p=V-t-i,o=[4,8,12,16,20].map(d=>({hour:d,x:r+d/24*a,label:`${d.toString().padStart(2,"0")}:00`})),A=[];if(C>0)for(let d=0;d<=M;d+=C){let l=M?V-i-d/M*p:V-i;A.push({value:d,y:l,label:L2(d)})}return{vertical:o,horizontal:A}}function p2(M,{dayKeyFn:C}){let H={};for(let V of M||[]){let L=C(V.ts);H[L]||(H[L]={count:0,total:0}),H[L].count+=1,H[L].total+=V.value}return H}function m2(M,C){let H=Object.keys(M).filter(p=>p!==C).sort(),V=H.slice(-3),L=H.slice(-7),r=(p,o)=>p.length?p.reduce((A,d)=>A+M[d][o],0)/p.length:null,e=p=>{if(!p.length)return null;let o=p.reduce((d,l)=>d+M[l].total,0),A=p.reduce((d,l)=>d+M[l].count,0);return A>0?o/A:null},t=M[C],i=t?t.count:0,a=t?t.total:0;return{todayCount:i,todayTotal:a,todayAvgDuration:i>0?a/i:null,avg3dVisits:r(V,"count"),avg3dTotal:r(V,"total"),avg3dDuration:e(V),avg7dVisits:r(L,"count"),avg7dTotal:r(L,"total"),avg7dDuration:e(L),daysOfHistory:H.length}}function n2({lastVisitTs:M,now:C,thresholdHours:H}){let V=C instanceof Date?C.getTime():C;if(M==null)return{alerting:!0,hoursSince:null};let L=(V-M)/36e5;return{alerting:L>=H,hoursSince:L}}function l2({todayTotal:M,avg7dTotal:C,daysOfHistory:H,thresholdPct:V,hourOfDay:L}){if(H<3||!C||L<18)return null;let r=V/100;return M<r*C?"low":M>(2-r)*C?"high":null}function v2(M,C,H){let V=H==null||H===""?"\u2014":H,L=parseFloat(C),r=!1;return M.warn_below!==void 0&&Number.isFinite(L)&&(r=L<M.warn_below),M.warn_above!==void 0&&Number.isFinite(L)&&(r=r||L>M.warn_above),M.warn_state!==void 0&&(r=r||C===M.warn_state),{display:V,warn:r}}function x2(M,C,H){return!C||!M||!M.states||!M.states[C]?H:M.states[C].state}function Z2(M,C,H){if(!C||!M||!M.states||!M.states[C])return H;let V=M.states[C];return typeof M.formatEntityState=="function"?M.formatEntityState(V):V.state}function s2(M,C,H){if(H==null)return H;let V=C&&M&&M.states?M.states[C]:null;return!V||typeof M.formatEntityState!="function"?H:M.formatEntityState(V,H)}function a1(M,C){if(!C)return"";let H=M&&M.entities&&M.entities[C]&&M.entities[C].name;if(H)return H;let V=M&&M.states?M.states[C]:null;return V&&V.attributes&&V.attributes.friendly_name||C}function j(M,C){let H=new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:C}});M.dispatchEvent(H)}function R(M,C,H,V){M.callService(C,H,V)}var L5={total_use:["total_use","total_time"],last_used_by:["last_used_by"],error:["error","error_message"],last_event:["max_last_event","litter_last_event"],state:["max_work_state","litter_state"]};function h1(M,C){let H={};if(!C||!M||!M.entities)return H;let V=Object.values(M.entities).filter(L=>L.device_id===C&&L.entity_id.startsWith("sensor."));for(let[L,r]of Object.entries(L5)){let e=V.find(t=>r.includes(t.translation_key));e&&(H[L]=e.entity_id)}return H}function b(M,C,H){if(!(!C||!M||!M.entities))return Object.values(M.entities).find(V=>V.device_id===C&&V.translation_key===H)}var M5=["wastebin","litter_weight","times_used","pura_air_battery"];function S2(M,C){let H=[];for(let V of M5){let L=b(M,C,V);L&&H.push({entity:L.entity_id})}return H}function u2(M,C,H){let V=[],L={action:"toggle"},r=b(M,C,"start_cleaning"),e=b(M,C,"pause_cleaning");r&&V.push({entity:r.entity_id,name:"Clean Now",tap_action:L,...e&&H?{visibility:[{condition:"state",entity:H,state_not:"cleaning_litter_box"}]}:{}}),e&&H&&V.push({entity:e.entity_id,name:"Pause Cleaning",tap_action:L,visibility:[{condition:"state",entity:H,state:"cleaning_litter_box"}]});let t=b(M,C,"start_maintenance"),i=b(M,C,"exit_maintenance");t&&V.push({entity:t.entity_id,name:"Start Maintenance",tap_action:L,...i&&H?{visibility:[{condition:"state",entity:H,state_not:"maintenance_mode"}]}:{}}),i&&H&&V.push({entity:i.entity_id,name:"Exit Maintenance",tap_action:L,visibility:[{condition:"state",entity:H,state:"maintenance_mode"}]});let a=b(M,C,"dump_litter");a&&V.push({entity:a.entity_id,name:"Dump Litter",tap_action:L});let p=b(M,C,"auto_cleaning");return p&&V.push({entity:p.entity_id,name:"Auto cleaning",tap_action:L}),V}var r5=new Set(["primary","accent","red","pink","purple","deep-purple","indigo","blue","light-blue","cyan","teal","green","light-green","lime","yellow","amber","orange","deep-orange","brown","light-grey","grey","dark-grey","blue-grey","black","white"]);function X(M){return M&&(r5.has(M)?`var(--${M}-color)`:M)}function e5(M,C){let H=C?.confirmation?.exemptions;return!H||!M?.user?.id?!1:H.some(V=>V.user===M.user.id)}function d1(M,C,H,V){let L=H||{action:"more-info"};if(L.confirmation&&!e5(C,L)){let r=L.confirmation.text||"Are you sure?";if(!window.confirm(r))return}switch(L.action){case"more-info":{let r=L.entity||V;r&&j(M,r);return}case"toggle":{let r=L.entity||V;if(!r)return;let e=r.split(".",1)[0];if(e==="button"||e==="input_button"){R(C,e,"press",{entity_id:r});return}let t=C.states[r],i=!t||t.state==="off";R(C,e,i?"turn_on":"turn_off",{entity_id:r});return}case"perform-action":case"call-service":{let r=L.perform_action||L.service;if(!r)return;let e=r.indexOf(".");if(e===-1)return;let t=r.slice(0,e),i=r.slice(e+1),a={...L.data||L.service_data||{},...L.target||{}};R(C,t,i,a);return}case"navigate":{if(!L.navigation_path)return;window.history.pushState(null,"",L.navigation_path),window.dispatchEvent(new CustomEvent("location-changed",{bubbles:!1,composed:!0,detail:{replace:!!L.navigation_replace}}));return}case"url":{L.url_path&&window.open(L.url_path);return}default:return}}var t5=500,O1=250;function c2(M){let C=0,H=0;return{onPointerDown(){C=Date.now()},onClick(V){let{hass:L,tapAction:r,holdAction:e,doubleTapAction:t,fallbackEntity:i}=M();if(e&&Date.now()-C>=t5){d1(V,L,e,i);return}let a=Date.now();if(t&&a-H<O1){H=0,d1(V,L,t,i);return}H=a,t?setTimeout(()=>{Date.now()-H>=O1&&d1(V,L,r,i)},O1):d1(V,L,r,i)}}}var i5="unknown";function h2(M){if(M!=null)return Array.isArray(M)?M:[M]}function O2(M,C,H){let V=M&&M.states&&C?M.states[C]:void 0;return V?H?V.attributes?.[H]:V.state:i5}function f2(M,C){switch(C.condition){case"state":{let H=O2(M,C.entity,C.attribute),V=h2(C.state),L=h2(C.state_not);return!(!V&&!L||V&&!V.includes(H)||L&&L.includes(H))}case"numeric_state":{let H=O2(M,C.entity,C.attribute),V=Number(H);return!(Number.isNaN(V)||C.above!=null&&!(V>C.above)||C.below!=null&&!(V<C.below))}case"and":return p1(C.conditions,M);case"or":return!C.conditions||C.conditions.length===0?!0:C.conditions.some(H=>f2(M,H));case"not":return!p1(C.conditions,M);default:return!0}}function p1(M,C){return!M||M.length===0?!0:M.every(H=>f2(C,H))}var g2=$`
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
  .chip { display: flex; align-items: center; gap: var(--pk-space-xs); background: var(--secondary-background-color); border-radius: var(--pk-radius-lg); padding: var(--pk-space-xs) var(--pk-space-md); flex: 1 1 auto; min-width: 80px; }
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
  /* Highlights a toggle-style control (e.g. "Auto cleaning") whenever its
     own entity is currently "on" -- reuses the same custom properties the
     button already exposes for hover, just with the theme's primary color. */
  ha-control-button.ctrl-btn.ctrl-btn-active {
    --control-button-background-color: var(--primary-color);
    --control-button-background-opacity: 0.2;
    --control-button-icon-color: var(--primary-color);
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
`;var k2=["unavailable","unknown","no_events_yet"],f1="#9e9e9e",y2="PETKIT PURAMAX";var w2={left:46,right:10,top:10,bottom:28};var _=class extends x{static getConfigElement(){return document.createElement("petkit-puramax-card-editor")}static getStubConfig(C){let H=C&&C.entities?Object.values(C.entities).find(t=>t.platform==="petkit"):null,V=H?H.device_id:"",L=h1(C,V),r=S2(C,V),e=u2(C,V,L.state);return{type:"custom:petkit-puramax-card",title:"PETKIT PURAMAX",device_id:V,...r.length?{info_row:r}:{},...e.length?{controls_row:e}:{},cats:[{name:"My Cat",color:"blue"}]}}constructor(){super(),this._dayOffset=0,this._chartVisits=[],this._chartEventHist=[],this._analytics=null,this._configErrorMsg=null,this._tapHandlersByIndex=new Map}setConfig(C){if(!C)throw new Error("petkit-puramax-card: config is required");let H=C.device_id!==void 0;if(!H&&!C.device_entities)throw new Error('petkit-puramax-card: "device_entities" is required in config (or set "device_id")');let V=C.device_entities||{};if(!H&&!V.total_use)throw new Error('petkit-puramax-card: "device_entities.total_use" is required in config (or set "device_id")');if(!C.cats)throw new Error('petkit-puramax-card: "cats" is required in config');if(!Array.isArray(C.cats)||C.cats.length<1)throw new Error('petkit-puramax-card: "cats" must be a non-empty array');if(!H&&C.cats.length>1&&!V.last_used_by)throw new Error('petkit-puramax-card: "device_entities.last_used_by" is required in config when more than one cat is configured (or set "device_id")');C.cats.forEach((L,r)=>{if(!L||!L.name)throw new Error(`petkit-puramax-card: cats[${r}].name is required`);if(!L.color)throw new Error(`petkit-puramax-card: cats[${r}].color is required`)}),this._config={...C,device_entities:V},this._dayOffset=0,this._analytics=null,this._chartVisits=[],this._chartEventHist=[],this._tapHandlersByIndex=new Map,this._deviceEntities=this._resolveDeviceEntities(),this._flush()}_resolveDeviceEntities(){return{...h1(this._hass,this._config.device_id),...this._config.device_entities}}_configError(){if(this._config.device_id===void 0)return null;let C=!this._config.device_id;return this._deviceEntities.total_use?this._config.cats.length>1&&!this._deviceEntities.last_used_by?C?'A PetKit device is required (or set "device_entities.last_used_by" manually) since more than one cat is configured.':'Could not auto-detect a "last used by" sensor on the selected device (required for more than one cat). Set "device_entities.last_used_by" in the config to override.':null:C?'A PetKit device is required. Select one in the card editor, or set "device_entities.total_use" manually.':'Could not auto-detect a "total use" sensor on the selected device. Set "device_entities.total_use" in the config to override.'}set hass(C){let H=this._hass;this._hass=C,this._deviceEntities=this._resolveDeviceEntities(),this._built?this._maybeRefreshOnNewVisit(H):(this._built=!0,this._build()),this._flush()}get hass(){return this._hass}_flush(){this.requestUpdate(),this.isUpdatePending&&this.performUpdate()}getCardSize(){return 14}_build(){let C=this._configError();this._configErrorMsg=C,!C&&(this._loadDay(),this._loadAnalytics(),this._startNoVisitTimer())}connectedCallback(){super.connectedCallback(),this._hass&&!this._built&&(this._built=!0,this._build())}disconnectedCallback(){super.disconnectedCallback(),this._noVisitTimer&&(clearInterval(this._noVisitTimer),this._noVisitTimer=null)}_startNoVisitTimer(){this._noVisitTimer||(this._noVisitTimer=setInterval(()=>this._checkNoVisitAlerts(),300*1e3))}_maybeRefreshOnNewVisit(C){if(!C)return;let H=this._deviceEntities.total_use,V=C.states[H],L=this._hass.states[H];L&&(!V||V.last_changed!==L.last_changed)&&(this._dayOffset===0&&this._loadDay(),this._loadAnalytics())}_s(C,H){return x2(this._hass,C,H)}async _fetchVisits({start:C,end:H}){let V=this._config,L=this._deviceEntities,r=A1({startTime:C,endTime:H,entityIds:[L.total_use]}),e=[this._hass.callWS(r)];if(V.cats.length>1){let A=A1({startTime:C,endTime:H,entityIds:[L.last_used_by],includeStartTimeState:!0});e.push(this._hass.callWS(A))}let t={},i={};try{let[A,d]=await Promise.all(e);t=A||{},i=d||{}}catch{}let a=t2(t[L.total_use],{minDelta:0,maxDelta:1800}),p;if(V.cats.length>1){let A=V.cats.map(l=>l.name),d=i2(i[L.last_used_by],A);p=o2(a,d)}else p=a.map(A=>({...A,cat:V.cats[0].name}));let o=new Map(V.cats.map(A=>[A.name,A]));return p.map(A=>({cat:A.cat===F?this._unknownCat():o.get(A.cat)||null,duration:A.value,ts:A.ts}))}_unknownCat(){return{name:F,color:this._config.unknown_cat_color||f1}}async _loadDay(){if(!this._hass)return;let C=this._deviceEntities,{start:H,end:V}=o1(this._dayOffset),L=[],r=[];try{let[e,t]=await Promise.all([this._fetchVisits({start:H,end:V}),C.last_event?this._hass.callWS(A1({startTime:H,endTime:V,entityIds:[C.last_event]})):Promise.resolve({})]);L=e,r=(t||{})[C.last_event]||[]}catch{L=[],r=[]}this._chartVisits=L,this._chartEventHist=r,this._flush()}async _loadAnalytics(){if(!this._hass)return;let C=this._config,H=new Date,V=new Date(H.getTime()-168*3600*1e3),L=[];try{L=await this._fetchVisits({start:V,end:H})}catch{L=[]}let r=c1(H.getTime()),e={};C.cats.forEach(t=>{let i=L.filter(o=>o.cat===t).map(o=>({value:o.duration,ts:o.ts})),a=p2(i,{dayKeyFn:c1}),p=i.length?Math.max(...i.map(o=>o.ts)):null;e[t.name]={...m2(a,r),lastVisitTs:p}}),this._analytics=e,this._checkNoVisitAlerts(),this._flush()}_checkNoVisitAlerts(){if(!this._analytics||!this._built)return;let C=this._config,H=C.no_visit_alert_hours??8,V=Date.now();this._notifiedCats||(this._notifiedCats=new Set),C.cats.forEach(L=>{let r=this._analytics[L.name];if(!r)return;let e=n2({lastVisitTs:r.lastVisitTs,now:V,thresholdHours:H});r.noVisitAlert=e;let t=this._notifiedCats.has(L.name);e.alerting&&!t?(this._notifiedCats.add(L.name),this._sendNoVisitNotification(L,e)):!e.alerting&&t&&this._notifiedCats.delete(L.name)}),this._flush()}_sendNoVisitNotification(C,H){let V=this._config.notify_service;if(!V||!this._hass)return;let L=V.indexOf(".");if(L===-1)return;let r=V.slice(0,L),e=V.slice(L+1);if(r!=="notify"||!e)return;let t=H.hoursSince==null?`${C.name} hasn't used the litter box yet in the tracked history.`:`${C.name} hasn't used the litter box in over ${Math.floor(H.hoursSince)}h.`;R(this._hass,"notify",e,{message:t,title:"Litter box alert"})}_changeDay(C){this._dayOffset+=C,this._dayOffset>0&&(this._dayOffset=0),this._flush(),this._loadDay()}_iconTemplate(C,H){return C?m`<ha-icon icon=${C}></ha-icon>`:H?m`<ha-state-icon .stateObj=${this._hass?.states?.[H]}></ha-state-icon>`:m`<ha-icon icon="mdi:information-outline"></ha-icon>`}_entityLabel(C,H){return C||a1(this._hass,H)}_tapHandlersFor(C){let H=this._tapHandlersByIndex.get(C);return H||(H=c2(()=>{let V=(this._config.controls_row||[])[C]||{};return{hass:this._hass,tapAction:V.tap_action,holdAction:V.hold_action,doubleTapAction:V.double_tap_action,fallbackEntity:V.entity}}),this._tapHandlersByIndex.set(C,H)),H}render(){if(this._configErrorMsg)return m`<ha-card><div style="padding: 16px;"><ha-alert alert-type="error">${this._configErrorMsg}</ha-alert></div></ha-card>`;if(!this._config)return n;let C=this._config;return m`
      <ha-card>
        <div class="header">
          <div class="title">${C.title||y2}</div>
          ${C.show_state!==!1?this._renderStateBadge():n}
        </div>
        <div class="status-row" id="status-row">${this._renderStatusRow()}</div>
        <div class="controls-row" id="controls-row">${this._renderControlsRow()}</div>
        ${C.show_history!==!1?this._renderChartSection():n}
        ${C.show_analytics!==!1?this._renderAnalyticsSection():n}
        ${C.show_working_records!==!1?this._renderRecordsSection():n}
      </ha-card>
    `}_renderStateBadge(){let C=this._deviceEntities,H=this._s(C.state,null),V=()=>{C.state&&j(this,C.state)};return m`<div
      class="state-badge"
      id="state-badge"
      ?hidden=${!H}
      tabindex="0"
      @click=${V}
      @keydown=${L=>{(L.key==="Enter"||L.key===" ")&&(L.preventDefault(),V())}}
    >${H?H.replace(/_/g," "):""}</div>`}_renderStatusRow(){let C=this._config,H=this._deviceEntities,V=this._s(H.error,"no_error"),L=V&&V!=="no_error",r=C.info_row||[];return m`
      ${r.map(e=>this._renderInfoChip(e))}
      ${L?this._chipTemplate("mdi:alert","Error",V.replace(/_/g," "),!0,H.error):n}
    `}_renderInfoChip(C){let H=this._s(C.entity,null),V=Z2(this._hass,C.entity,null),{display:L,warn:r}=v2(C,H,V);return this._chipTemplate(C.icon,this._entityLabel(C.name,C.entity),L,r,C.entity)}_chipTemplate(C,H,V,L,r){let e=()=>{r&&j(this,r)};return m`
      <div
        class="chip ${L?"warn":""} ${r?"tappable":""}"
        data-entity=${r||n}
        tabindex=${r?"0":n}
        @click=${r?e:n}
        @keydown=${r?t=>{(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),e())}:n}
      >
        ${this._iconTemplate(C,r)}
        <div class="chip-text"><div class="chip-label">${H}</div><div class="chip-value">${V}</div></div>
      </div>
    `}_renderControlsRow(){let V=(this._config.controls_row||[]).map((L,r)=>({spec:L,i:r})).filter(({spec:L})=>p1(L.visibility,this._hass));return V2(V,({i:L})=>L,({spec:L,i:r})=>{let e=this._entityLabel(L.name,L.entity),t=this._s(L.entity,null)==="on",i=this._tapHandlersFor(r);return m`
          <ha-control-button
            class="ctrl-btn ${t?"ctrl-btn-active":""}"
            id="ctrl-${r}"
            label=${e}
            @pointerdown=${()=>i.onPointerDown()}
            @click=${a=>i.onClick(a.currentTarget)}
          >
            <div class="ctrl-btn-content">
              ${this._iconTemplate(L.icon,L.entity)}
              <span>${e}</span>
            </div>
          </ha-control-button>
        `})}_renderChartSection(){return m`
      <div class="chart-section">
        <div class="chart-header">
          <button class="nav-btn" id="prev-day" @click=${()=>this._changeDay(-1)}>&#9664;</button>
          <div class="day-label" id="day-label">${r2(this._dayOffset)}</div>
          <button class="nav-btn" id="next-day" ?disabled=${this._dayOffset>=0} @click=${()=>this._changeDay(1)}>
            &#9654;
          </button>
        </div>
        <div class="usage-section">
          <div id="usage-body">${this._renderUsageBody()}</div>
        </div>
        <div class="chart-area" id="chart-area">${this._renderChartArea()}</div>
      </div>
    `}_visits(){return(this._chartVisits||[]).filter(C=>C.cat).sort((C,H)=>C.ts-H.ts)}_renderChartArea(){let C=this._visits(),H=600,V=240,L=w2,r=Math.max(60,...C.map(v=>v.duration)),e=A2(r),t=Math.ceil(r/e)*e,{start:i}=o1(this._dayOffset),{xFor:a,yFor:p}=a2({dayStart:i,niceMax:t,width:H,height:V,padding:L}),{vertical:o,horizontal:A}=d2({niceMax:t,yStep:e,width:H,height:V,padding:L}),d=(V-L.bottom)/V*100,l=L.left/H*100;return m`
      <div class="chart-wrap">
        <svg viewBox="0 0 ${H} ${V}" class="chart-svg">
          ${A.map(v=>e1`<line x1="${L.left}" y1="${v.y}" x2="${H-L.right}" y2="${v.y}" class="grid-line-h" />`)}
          ${o.map(v=>e1`<line x1="${v.x}" y1="${L.top}" x2="${v.x}" y2="${V-L.bottom}" class="grid-line-v" />`)}
          ${C.map((v,E)=>{let u=a(v.ts),m1=p(v.duration),k1=V-L.bottom,y1=X(v.cat.color);return e1`
              <line x1="${u}" y1="${k1}" x2="${u}" y2="${m1}" stroke="${y1}" stroke-width="2" />
              <circle class="visit-point" cx="${u}" cy="${m1}" r="5" fill="${y1}" />
              <line class="visit-hit" data-idx="${E}" x1="${u}" y1="${k1}" x2="${u}" y2="${m1}" stroke="transparent" stroke-width="16"
                @mouseenter=${D2=>this._showChartTooltip(D2,v)}
                @mouseleave=${()=>this._hideChartTooltip()}
              />
            `})}
        </svg>
        ${o.map(v=>m`<div class="axis-label" style="left:${v.x/H*100}%;top:${d}%">${v.label}</div>`)}
        ${A.map(v=>m`<div class="axis-label-y" style="top:${v.y/V*100}%;width:${l}%">${v.label}</div>`)}
        <div class="chart-tooltip" id="chart-tooltip"></div>
      </div>
      ${C.length===0?m`<div class="empty-note">No visits recorded this day</div>`:n}
    `}_showChartTooltip(C,H){let V=this.shadowRoot.getElementById("chart-tooltip");if(!V)return;let L=new Date(H.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"});V.textContent=`${L} \xB7 ${H.cat.name} \xB7 ${q(H.duration)}`;let r=C.currentTarget.getBoundingClientRect(),e=this.shadowRoot.querySelector(".chart-wrap").getBoundingClientRect();V.style.left=`${r.left-e.left+r.width/2}px`,V.style.top=`${r.top-e.top}px`,V.classList.add("visible")}_hideChartTooltip(){let C=this.shadowRoot.getElementById("chart-tooltip");C&&C.classList.remove("visible")}_renderUsageBody(){let C=this._config,H=this._visits(),V={};C.cats.forEach(t=>{V[t.name]={count:0}});let L=0,r=f1;H.forEach(t=>{t.cat.name===F?(L+=1,r=t.cat.color):V[t.cat.name].count+=1});let e=H.length;return m`
      <div class="usage-row">
        <div class="stat-value">${e} time${e===1?"":"s"}</div>
        <div class="usage-cats">
          ${C.cats.map(t=>m`
              <span class="usage-cat"
                ><span class="dot" style="background:${X(t.color)}"></span>${t.name}: ${V[t.name].count}</span
              >
            `)}
          ${L>0?m`<span class="usage-cat"
                ><span class="dot" style="background:${X(r)}"></span>${F}: ${L}</span
              >`:n}
        </div>
      </div>
    `}_renderRecordsSection(){let C=this._config,H=this._chartEventHist||[],V=this._deviceEntities.last_event,L=(C.event_exclude||k2).map(e=>String(e).toLowerCase()),r=H.map(e=>{let t=e.s??e.state,i=e.lu?e.lu*1e3:e.last_changed?Date.parse(e.last_changed):null;return!t||!i||L.includes(t.toLowerCase())?null:{ts:i,icon:"mdi:information-outline",color:"var(--secondary-text-color)",text:s2(this._hass,V,t)}}).filter(Boolean);return r.sort((e,t)=>t.ts-e.ts),m`
      <div class="records-section">
        <div class="section-title">Working Records</div>
        <div class="records-list" id="records-list">
          ${r.length===0?m`<div class="empty-note">No records for this day</div>`:r.map(e=>m`
                  <div class="record-row">
                    <div class="record-time">${new Date(e.ts).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</div>
                    <ha-icon icon=${e.icon} style="color:${e.color}"></ha-icon>
                    <div class="record-text">${e.text}</div>
                  </div>
                `)}
        </div>
      </div>
    `}_renderAnalyticsSection(){if(!this._analytics)return n;let C=this._config,H=C.decline_threshold_pct||60,V=new Date().getHours(),L=[],r=C.cats.map(t=>{let i=this._analytics[t.name]||{},a=l2({todayTotal:i.todayTotal,avg7dTotal:i.avg7dTotal,daysOfHistory:i.daysOfHistory,thresholdPct:H,hourOfDay:V});return a==="low"?L.push(`${t.name}'s usage today is well below their recent average \u2014 worth a check.`):a==="high"&&L.push(`${t.name}'s usage today is well above their recent average \u2014 worth a check.`),m`
        <div class="cat-analytics">
          <table>
            <colgroup>
              <col class="col-name" /><col class="col-stat" /><col class="col-stat" /><col class="col-stat" />
            </colgroup>
            <tr>
              <td class="cat-name-cell"><span class="dot" style="background:${X(t.color)}"></span>${t.name}</td>
              <td>Today</td>
              <td>3d avg</td>
              <td>7d avg</td>
            </tr>
            <tr>
              <td>Visits</td>
              <td>${i.todayCount??0}</td>
              <td>${i.avg3dVisits!==null&&i.avg3dVisits!==void 0?i.avg3dVisits.toFixed(1):"\u2014"}</td>
              <td>${i.avg7dVisits!==null&&i.avg7dVisits!==void 0?i.avg7dVisits.toFixed(1):"\u2014"}</td>
            </tr>
            <tr>
              <td>Duration</td>
              <td>${i.todayAvgDuration?q(i.todayAvgDuration):"\u2014"}</td>
              <td>${i.avg3dDuration?q(i.avg3dDuration):"\u2014"}</td>
              <td>${i.avg7dDuration?q(i.avg7dDuration):"\u2014"}</td>
            </tr>
          </table>
        </div>
      `}),e=C.cats.filter(t=>this._analytics[t.name]?.noVisitAlert?.alerting);return m`
      <div class="analytics-section">
        <div class="section-title">Analytics</div>
        <div id="no-visit-banner">
          ${e.map(t=>{let{hoursSince:i}=this._analytics[t.name].noVisitAlert,a=i==null?"no visits recorded yet":`last seen ${M2(i)} ago`;return m`<div class="no-visit-banner"><ha-icon icon="mdi:cat-alert"></ha-icon>${t.name} hasn't used the litter box recently (${a}).</div>`})}
        </div>
        <div id="decline-banner">
          ${L.map(t=>m`<div class="warn-banner"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${t}</div>`)}
        </div>
        <div class="analytics-grid" id="analytics-grid">${r}</div>
      </div>
    `}};B(_,"styles",g2),B(_,"properties",{_config:{state:!0},_dayOffset:{state:!0},_chartVisits:{state:!0},_chartEventHist:{state:!0},_analytics:{state:!0},_configErrorMsg:{state:!0}});var b2="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z";var B2="M21 11H3V9H21V11M21 13H3V15H21V13Z";var P2="M13 5C15.21 5 17 6.79 17 9C17 10.5 16.2 11.77 15 12.46V11.24C15.61 10.69 16 9.89 16 9C16 7.34 14.66 6 13 6S10 7.34 10 9C10 9.89 10.39 10.69 11 11.24V12.46C9.8 11.77 9 10.5 9 9C9 6.79 10.79 5 13 5M20 20.5C19.97 21.32 19.32 21.97 18.5 22H13C12.62 22 12.26 21.85 12 21.57L8 17.37L8.74 16.6C8.93 16.39 9.2 16.28 9.5 16.28H9.7L12 18V9C12 8.45 12.45 8 13 8S14 8.45 14 9V13.47L15.21 13.6L19.15 15.79C19.68 16.03 20 16.56 20 17.14V20.5M20 2H4C2.9 2 2 2.9 2 4V12C2 13.11 2.9 14 4 14H8V12L4 12L4 4H20L20 12H18V14H20V13.96L20.04 14C21.13 14 22 13.09 22 12V4C22 2.9 21.11 2 20 2Z";var T2="M8.35,3C9.53,2.83 10.78,4.12 11.14,5.9C11.5,7.67 10.85,9.25 9.67,9.43C8.5,9.61 7.24,8.32 6.87,6.54C6.5,4.77 7.17,3.19 8.35,3M15.5,3C16.69,3.19 17.35,4.77 17,6.54C16.62,8.32 15.37,9.61 14.19,9.43C13,9.25 12.35,7.67 12.72,5.9C13.08,4.12 14.33,2.83 15.5,3M3,7.6C4.14,7.11 5.69,8 6.5,9.55C7.26,11.13 7,12.79 5.87,13.28C4.74,13.77 3.2,12.89 2.41,11.32C1.62,9.75 1.9,8.08 3,7.6M21,7.6C22.1,8.08 22.38,9.75 21.59,11.32C20.8,12.89 19.26,13.77 18.13,13.28C17,12.79 16.74,11.13 17.5,9.55C18.31,8 19.86,7.11 21,7.6M19.33,18.38C19.37,19.32 18.65,20.36 17.79,20.75C16,21.57 13.88,19.87 11.89,19.87C9.9,19.87 7.76,21.64 6,20.75C5,20.26 4.31,18.96 4.44,17.88C4.62,16.39 6.41,15.59 7.47,14.5C8.88,13.09 9.88,10.44 11.89,10.44C13.89,10.44 14.95,13.05 16.3,14.5C17.41,15.72 19.26,16.75 19.33,18.38Z";var F2="M4,9H20V11H4V9M4,13H14V15H4V13Z";var R2="M3 11H11V3H3M5 5H9V9H5M13 21H21V13H13M15 15H19V19H15M3 21H11V13H3M5 15H9V19H5M13 3V11H21V3M19 9H15V5H19Z";var _2=$`
  /* .list-view/.detail-view are both always mounted; only one is ever
     visible at a time, toggled via the native \`hidden\` attribute rather
     than a conditional template swap -- see the comment on \`render()\` in
     the source for why. No explicit display rule needed here: the UA
     stylesheet's own \`[hidden] { display: none }\` is enough since neither
     class sets its own \`display\`. */
  .editor { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
  /* "Content" and "Analytics & alerts" are now hand-built
     ha-expansion-panel siblings too (not ha-form's own internal
     expandable), so this one rule shapes all five sections identically --
     see the class header comment for why that's necessary. */
  ha-expansion-panel { --expansion-panel-summary-padding: 0 16px; }
  ha-expansion-panel h3[slot="header"] { margin: 0; font-size: 1em; font-weight: 500; }
  ha-svg-icon[slot="leading-icon"] { color: var(--secondary-text-color); }
  .panel-body { display: flex; flex-direction: column; gap: 4px; padding: 4px 16px 16px; }
  /* Content's 4 show_* toggles: one small ha-form per field (see the class
     header comment), laid out in a compact 2-column grid this stylesheet
     controls directly -- ha-form's own grid sub-schema type hardcodes a
     24px row-gap with no exposed override, which read as an oversized gap
     between the two toggle rows. The --mdc-switch-* custom properties
     shrink the native ha-switch itself; font-size shrinks its label --
     both real, live properties MWC's switch/formfield already expose, not
     a card_mod-style guess at internal markup. */
  .content-toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 0 8px; }
  .content-toggles ha-form {
    font-size: 0.85em;
    --mdc-switch-track-height: 12px;
    --mdc-switch-track-width: 28px;
    --mdc-switch-thumb-height: 16px;
  }
  .row { display: flex; align-items: center; gap: 4px; }
  .row ha-form { flex: 1 1 auto; min-width: 0; }
  .handle { display: flex; cursor: grab; color: var(--secondary-text-color); flex: 0 0 auto; touch-action: none; }
  .handle:active { cursor: grabbing; }
  .summary-row { padding: 0 4px; }
  .summary-row ha-state-icon { color: var(--secondary-text-color); flex: 0 0 auto; }
  .summary-label { flex: 1 1 auto; min-width: 0; }
  .summary-label-primary { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--primary-text-color); }
  .summary-label-secondary { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--secondary-text-color); font-size: 0.85em; }
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

  .detail-header { display: flex; align-items: center; gap: 8px; padding: 4px 0 12px; }
  .detail-title { font-size: 1.1em; font-weight: 500; color: var(--primary-text-color); }
`;var m5=F2,n5=T2,l5=R2,v5=P2,x5=b2,Z5=B2,O=M=>M.label||M.name,s5=[{name:"name",label:"Name",selector:{text:{}}}],S5=[{name:"color",label:"Color",selector:{ui_color:{}}}],u5={name:"My Cat",color:"blue"},c5=[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"warn_below",label:"Warn below",selector:{number:{mode:"box"}}},{name:"warn_above",label:"Warn above",selector:{number:{mode:"box"}}},{name:"warn_state",label:"Warn state",selector:{text:{}}}],h5=[{name:"entity",label:"Entity",selector:{entity:{}}},{name:"name",label:"Name",selector:{text:{}}},{name:"icon",label:"Icon",selector:{icon:{}}},{name:"tap_action",label:"Tap action",selector:{ui_action:{}}},{name:"hold_action",label:"Hold action",selector:{ui_action:{}}},{name:"double_tap_action",label:"Double-tap action",selector:{ui_action:{}}}],O5=[{name:"device_id",label:"PetKit device",selector:{device:{filter:{integration:"petkit"}}}}],f5=[{name:"title",label:"Title",selector:{text:{}}}],g5=[{name:"show_state",label:"Show state",selector:{boolean:{}}},{name:"show_history",label:"Show history (visit chart)",selector:{boolean:{}}},{name:"show_working_records",label:"Show Working Records",selector:{boolean:{}}},{name:"show_analytics",label:"Show Analytics",selector:{boolean:{}}}],k5=[{name:"decline_threshold_pct",label:"Decline/spike alert threshold (%)",selector:{number:{min:10,max:100,mode:"box"}}},{name:"no_visit_alert_hours",label:"Warn if no visit in (hours)",selector:{number:{min:1,max:168,mode:"box"}}},{name:"notify_service",label:"Push a notification too (optional)",selector:{entity:{domain:"notify"}}}],D=class extends x{constructor(){super(),this._detailEditor=null}setConfig(C){this._config=C||{},this._flush()}set hass(C){this._hass=C,this._flush()}get hass(){return this._hass}_flush(){this.requestUpdate(),this.isUpdatePending&&this.performUpdate()}_fireConfigChanged(C){this._config=C,this._flush(),this.dispatchEvent(new CustomEvent("config-changed",{bubbles:!0,composed:!0,detail:{config:C}}))}_resolvedName(C){return C.name?C.name:a1(this._hass,C.entity)||C.entity||""}_entityContext(C){let H=this._hass;if(!H||!C||!H.entities)return null;let V=H.entities[C];if(!V)return null;let L=V.device_id&&H.devices?H.devices[V.device_id]:null,r=V.area_id||L&&L.area_id,e=r&&H.areas?H.areas[r]:null,t=L&&(L.name_by_user||L.name),i=e&&e.name;return i&&t?`${i} \u2192 ${t}`:i||t||null}render(){if(!this._config)return n;let C=this._resolveDetailSpec();return m`
      <div class="detail-view" ?hidden=${!C}>${C?this._renderDetail(C):n}</div>
      <div class="list-view" ?hidden=${!!C}>${this._renderList()}</div>
    `}_resolveDetailSpec(){if(!this._detailEditor)return null;let{kind:C,index:H}=this._detailEditor,V=C==="info"?"info_row":"controls_row",L=(this._config[V]||[])[H];return L||(queueMicrotask(()=>{this._detailEditor=null,this._flush()}),null)}_renderDetail(C){let{kind:H,index:V}=this._detailEditor,L=H==="info"?c5:h5;return m`
      <div class="detail-header">
        <ha-icon-button-prev @click=${()=>this._closeDetail()}></ha-icon-button-prev>
        <span class="detail-title">${H==="info"?"Edit status chip":"Edit control"}</span>
      </div>
      <div id="detail-body">
        <ha-form
          .hass=${this._hass}
          .schema=${L}
          .data=${C}
          .computeLabel=${O}
          @value-changed=${e=>{e.stopPropagation(),this._updateRowAt(H,V,e.detail.value)}}
        ></ha-form>
      </div>
    `}_closeDetail(){this._detailEditor=null,this._flush()}_updateRowAt(C,H,V){let L=C==="info"?"info_row":"controls_row";this._updateItem(L,H,V)}_openDetail(C,H){this._detailEditor={kind:C,index:H},this._flush()}_renderList(){let C=(this._config.cats||[]).length,H=(this._config.info_row||[]).length,V=(this._config.controls_row||[]).length;return m`
      <div class="editor">
        <div id="main-section">${this._renderMainForm()}</div>

        ${this._renderContentSection()}
        ${this._renderAlertsSection()}

        <ha-expansion-panel outlined>
          <ha-svg-icon slot="leading-icon" .path=${n5}></ha-svg-icon>
          <h3 slot="header">Cats (${C})</h3>
          <div class="panel-body">
            ${C===0?m`<div class="empty-hint">No cats configured yet.</div>`:n}
            <div id="cats-rows">${this._renderCatsRows()}</div>
            <div class="add-row">
              <button class="add-btn" id="add-cat" type="button" @click=${()=>this._addCat()}>
                <ha-icon icon="mdi:plus"></ha-icon>Add cat
              </button>
            </div>
          </div>
        </ha-expansion-panel>

        <ha-expansion-panel outlined>
          <ha-svg-icon slot="leading-icon" .path=${l5}></ha-svg-icon>
          <h3 slot="header">Status chips (${H})</h3>
          <div class="panel-body">
            ${H===0?m`<div class="empty-hint">No status chips configured yet.</div>`:n}
            <div id="info-rows">
              ${this._renderRowsList("info_row",L=>this._openDetail("info",L),L=>this._removeInfoRow(L),(L,r)=>this._moveInfoRow(L,r))}
            </div>
            <div class="add-row-form" id="add-info-row">
              ${this._renderAddPicker("Add a status chip",L=>this._addInfoRowFromEntity(L))}
            </div>
          </div>
        </ha-expansion-panel>

        <ha-expansion-panel outlined>
          <ha-svg-icon slot="leading-icon" .path=${v5}></ha-svg-icon>
          <h3 slot="header">Controls (${V})</h3>
          <div class="panel-body">
            ${V===0?m`<div class="empty-hint">No control buttons configured yet.</div>`:n}
            <div id="controls-rows">
              ${this._renderRowsList("controls_row",L=>this._openDetail("control",L),L=>this._removeControlRow(L),(L,r)=>this._moveControlRow(L,r))}
            </div>
            <div class="add-row-form" id="add-control-row">
              ${this._renderAddPicker("Add a control",L=>this._addControlRowFromEntity(L))}
            </div>
          </div>
        </ha-expansion-panel>
      </div>
    `}_dragHandleTemplate(){return m`
      <div class="handle">
        <ha-svg-icon .path=${Z5}></ha-svg-icon>
      </div>
    `}_iconButtonTemplate(C,H,V,L){return m`
      <ha-icon-button class=${V} .label=${H} @click=${L}>
        <ha-icon icon=${C}></ha-icon>
      </ha-icon-button>
    `}_renderCatsRows(){let C=this._config.cats||[];return m`
      <ha-sortable
        handle-selector=".handle"
        @item-moved=${H=>{H.stopPropagation(),this._moveCat(H.detail.oldIndex,H.detail.newIndex)}}
      >
        <div>
          ${C.map((H,V)=>m`
              <div class="cat-item">
                <div class="row">
                  ${this._dragHandleTemplate()}
                  <ha-form
                    .hass=${this._hass}
                    .schema=${s5}
                    .data=${H}
                    .computeLabel=${O}
                    @value-changed=${L=>{L.stopPropagation(),this._updateCat(V,{...this._config.cats[V],...L.detail.value})}}
                  ></ha-form>
                  ${this._iconButtonTemplate("mdi:delete-outline","Remove","remove-btn",()=>this._removeCat(V))}
                </div>
                <ha-form
                  .hass=${this._hass}
                  .schema=${S5}
                  .data=${H}
                  .computeLabel=${O}
                  @value-changed=${L=>{L.stopPropagation(),this._updateCat(V,{...this._config.cats[V],...L.detail.value})}}
                ></ha-form>
              </div>
            `)}
        </div>
      </ha-sortable>
    `}_updateCat(C,H){this._updateItem("cats",C,H)}_moveCat(C,H){this._moveItem("cats",C,H)}_addCat(){this._addItem("cats",{...u5})}_removeCat(C){this._removeItem("cats",C)}_updateItem(C,H,V){let L=[...this._config[C]||[]];L[H]=V,this._fireConfigChanged({...this._config,[C]:L})}_moveItem(C,H,V){let L=(this._config[C]||[]).concat();L.splice(V,0,L.splice(H,1)[0]),this._fireConfigChanged({...this._config,[C]:L})}_addItem(C,H){let V=[...this._config[C]||[],H];this._fireConfigChanged({...this._config,[C]:V})}_removeItem(C,H){let V=(this._config[C]||[]).filter((L,r)=>r!==H);this._fireConfigChanged({...this._config,[C]:V})}_renderRowsList(C,H,V,L){let r=this._config[C]||[];return m`
      <ha-sortable
        handle-selector=".handle"
        @item-moved=${e=>{e.stopPropagation(),L(e.detail.oldIndex,e.detail.newIndex)}}
      >
        <div>
          ${r.map((e,t)=>this._summaryRowTemplate(e,()=>H(t),()=>V(t)))}
        </div>
      </ha-sortable>
    `}_summaryRowTemplate(C,H,V){let L=this._entityContext(C.entity);return m`
      <div class="row summary-row">
        ${this._dragHandleTemplate()}
        <ha-state-icon
          .icon=${C.icon||void 0}
          .stateObj=${this._hass&&this._hass.states?this._hass.states[C.entity]:void 0}
        ></ha-state-icon>
        <div class="summary-label"><div class="summary-label-primary">${this._resolvedName(C)}</div>${L?m`<div class="summary-label-secondary">${L}</div>`:n}</div>
        ${this._iconButtonTemplate("mdi:pencil-outline","Edit","edit-btn",H)}
        ${this._iconButtonTemplate("mdi:delete-outline","Remove","remove-btn",V)}
      </div>
    `}_renderAddPicker(C,H){return m`
      <ha-form
        .hass=${this._hass}
        .schema=${[{name:"entity",label:C,selector:{entity:{}}}]}
        .data=${{}}
        .computeLabel=${O}
        @value-changed=${V=>{V.stopPropagation();let L=V.detail.value.entity;L&&H(L)}}
      ></ha-form>
    `}_addInfoRowFromEntity(C){this._addItem("info_row",{entity:C})}_moveInfoRow(C,H){this._moveItem("info_row",C,H)}_removeInfoRow(C){this._removeItem("info_row",C)}_addControlRowFromEntity(C){this._addItem("controls_row",{entity:C})}_moveControlRow(C,H){this._moveItem("controls_row",C,H)}_removeControlRow(C){this._removeItem("controls_row",C)}_mainFormData(){let C=this._config;return{...C,show_state:C.show_state!==!1,show_history:C.show_history!==!1,show_working_records:C.show_working_records!==!1,show_analytics:C.show_analytics!==!1}}_onMainFieldChanged(C){C.stopPropagation(),this._fireConfigChanged(C.detail.value)}_renderMainForm(){return m`
      <ha-form
        .hass=${this._hass}
        .schema=${O5}
        .data=${this._mainFormData()}
        .computeLabel=${O}
        @value-changed=${C=>this._onMainFieldChanged(C)}
      ></ha-form>
    `}_renderContentSection(){let C=this._mainFormData();return m`
      <ha-expansion-panel outlined id="content-panel">
        <ha-svg-icon slot="leading-icon" .path=${m5}></ha-svg-icon>
        <h3 slot="header">Content</h3>
        <div class="panel-body">
          <ha-form
            .hass=${this._hass}
            .schema=${f5}
            .data=${C}
            .computeLabel=${O}
            @value-changed=${H=>this._onMainFieldChanged(H)}
          ></ha-form>
          <div class="content-toggles">
            ${g5.map(H=>m`
                <ha-form
                  .hass=${this._hass}
                  .schema=${[H]}
                  .data=${C}
                  .computeLabel=${O}
                  @value-changed=${V=>this._onMainFieldChanged(V)}
                ></ha-form>
              `)}
          </div>
        </div>
      </ha-expansion-panel>
    `}_renderAlertsSection(){return m`
      <ha-expansion-panel outlined id="alerts-panel">
        <ha-svg-icon slot="leading-icon" .path=${x5}></ha-svg-icon>
        <h3 slot="header">Analytics &amp; alerts</h3>
        <div class="panel-body">
          <ha-form
            .hass=${this._hass}
            .schema=${k5}
            .data=${this._mainFormData()}
            .computeLabel=${O}
            @value-changed=${C=>this._onMainFieldChanged(C)}
          ></ha-form>
        </div>
      </ha-expansion-panel>
    `}};B(D,"styles",_2),B(D,"properties",{_config:{state:!0},_detailEditor:{state:!0}});customElements.get("petkit-puramax-card")||customElements.define("petkit-puramax-card",_);customElements.get("petkit-puramax-card-editor")||customElements.define("petkit-puramax-card-editor",D);var g1=window;g1.customCards=g1.customCards||[];g1.customCards.push({type:"petkit-puramax-card",name:"PETKIT PURAMAX Card",description:"Configurable card for PETKIT PURAMAX litter box monitoring, controls, and per-cat visit analytics."});
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
lit-html/lit-html.js:
lit-element/lit-element.js:
lit-html/directive.js:
lit-html/directives/repeat.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directive-helpers.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=petkit-puramax-card.js.map
