(function(){
"use strict";
/* ---------- tiny helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const RICH=t=>window.LAGO_RICH?window.LAGO_RICH(t):esc(t).replace(/\n/g,"<br>");
function initSet(){S.set=Object.assign({sendkey:"enter",keys:true,fs:100,motion:true,sugs:true,bgc:"",dim:35},store.get("lago_set",{}));}
function saveSet(){store.set("lago_set",S.set);}
function bgImg(){return store.get("lago_bgimg","");}
function applySet(){const h=document.documentElement,o=S.set;h.style.setProperty("--ui",String(o.fs/100));
if(o.bgc){h.style.setProperty("--ubg",o.bgc);h.setAttribute("data-ubg","1");}else{h.style.removeProperty("--ubg");h.removeAttribute("data-ubg");}
const im=bgImg();if(im){const dk=h.getAttribute("data-lago")==="dark",c=dk?"0,0,0":"255,255,255";h.style.setProperty("--ubi",`linear-gradient(rgba(${c},${o.dim/100}),rgba(${c},${o.dim/100})),url("${im}")`);h.setAttribute("data-ubi","1");}else{h.style.removeProperty("--ubi");h.removeAttribute("data-ubi");}
if(o.motion===false)h.setAttribute("data-nomo","1");else h.removeAttribute("data-nomo");}

const P={sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',left:'<path d="m15 6-6 6 6 6"/>',layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 16.5 9 5 9-5"/>',plus:'<path d="M12 5v14M5 12h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',custom:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',msg:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',code:'<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',term:'<path d="m4 17 6-6-6-6M12 19h8"/>',clip:'<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',down:'<path d="m6 9 6 6 6-6"/>',up:'<path d="M12 19V5M5 12l7-7 7 7"/>',check:'<path d="M20 6 9 17l-5-5"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',drop:'<path d="M12 2.7s6 6.3 6 11a6 6 0 0 1-12 0c0-4.7 6-11 6-11z"/>',waves:'<path d="M2 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',brain:'<circle cx="12" cy="12" r="9"/><path d="M8 12c1.5-2 2.5-2 4 0s2.5 2 4 0"/>',bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',copy:'<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',thumb:'<path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',ext:'<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',menu:'<path d="M4 7h16M4 12h10M4 17h16"/>',ghost:'<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/><path d="m14.5 8.5 1 1-5 5H9.5v-1z"/>',sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',back:'<path d="m15 18-6-6 6-6"/>',file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',chart:'<path d="M3 3v18h18M7 15v3M12 10v8M17 6v12"/>',card:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',id:'<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M13 10h5M13 14h3"/>',logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',refresh:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',monitor:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',phone:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',bug:'<path d="M8 6a4 4 0 0 1 8 0v1H8zM6 9h12v5a6 6 0 0 1-12 0zM3 13h3M18 13h3M12 9v11"/>',book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/>',flask:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/>',pen:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',news:'<path d="M4 4h13v16H6a2 2 0 0 1-2-2zM17 8h3v10a2 2 0 0 1-2 2"/><path d="M8 8h5M8 12h5M8 16h3"/>',scale:'<path d="M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/>',link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',compass:'<circle cx="12" cy="12" r="10"/><path d="m16 8-2 6-6 2 2-6z"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',spark:'<path d="M12 4v16M5.1 8l13.8 8M18.9 8 5.1 16"/>',bot:'<path d="M12 3 3 8l9 5 9-5-9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 5 9-5" opacity=".5"/>',swap:'<path d="M17 3l4 4-4 4M21 7H9M7 21l-4-4 4-4M3 17h12"/>',dots:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',eyeoff:'<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.8 8.4 2 12 2 12s4 7 10 7a9.6 9.6 0 0 0 4.4-1.1"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',pin:'<path d="M12 17v5M9 10.8V4h6v6.8l3 3.2H6z"/>',share:'<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',gauge:'<path d="M12 14l4-4M3.3 17a9 9 0 1 1 17.4 0"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>',crown:'<path d="M3 7l4 4 5-6 5 6 4-4-2 11H5z"/>',upc:'<circle cx="12" cy="12" r="9"/><path d="m8 12 4-4 4 4M12 8v8"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',plug:'<path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0zM12 17v5"/>',right:'<path d="m9 6 6 6-6 6"/>',play:'<path d="M7 4l13 8-13 8z"/>',panel:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',download:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',star:'<path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" fill="currentColor" stroke="none"/>'};
const ic=(k,s=18)=>`<svg class="ic" viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${P[k]||""}</svg>`;
const SYM=(h=26)=>`<svg class="sym" viewBox="0 0 100 50" height="${h}" width="${h*2}" aria-hidden="true"><path d="M0 25A25 25 0 0 0 50 25Z" fill="url(#gL)"/><path d="M50 25A25 25 0 0 1 100 25Z" fill="url(#gR)"/></svg>`;
const MARK=(s=32,cls="")=>`<span class="mark ${cls}" style="width:${s}px;height:${s}px;border-radius:${Math.round(s*.3)}px" aria-hidden="true"><svg viewBox="0 0 100 50" width="${Math.round(s*.66)}" height="${Math.round(s*.33)}"><path d="M2 25A23 23 0 0 0 48 25Z" fill="#fff" fill-opacity=".72"/><path d="M52 25A23 23 0 0 1 98 25Z" fill="#fff"/></svg></span>`;
const WM=(h=20,color="currentColor")=>`<svg class="wm" viewBox="0 0 180 56" height="${h}" width="${Math.round(h*180/56)}" role="img" aria-label="LAGO" style="color:${color}"><g fill="none" stroke="currentColor" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6V50H36"/><path d="M42 50L60 6L78 50"/><path d="M124.9 13.9A22 22 0 1 0 130 28H104"/><circle cx="150" cy="28" r="22"/></g></svg>`;
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
let toastT;function toast(m){const t=$("#toast");const bad=/못|않아요|실패|없어요|안 돼|확인해 주세요|거절/.test(m);t.innerHTML=`<i class="${bad?"bad":""}">${ic(bad?"info":"check",13)}</i><span>${esc(S&&S.lang==="en"?trText(String(m)):m)}</span>`;t.hidden=false;t.style.animation="none";void t.offsetWidth;t.style.animation="";clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2800);}
async function hash(s){try{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("lago:"+s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}catch(e){return "plain:"+s.length}}

/* ---------- data ---------- */
const TALK_MODES=[{id:"Fonte",lab:"FACT",d:"위키 · 뉴스 · 웹에서 찾아 사실만 출처와 함께",ic:"drop",c:"#2BA3B8"},{id:"Torrente",lab:"빠른 생각",d:"짧게 생각하고 빠르게 답해요",ic:"waves",c:"#1B3E9E"},{id:"Mare",lab:"THINK",d:"깊게 생각하고 단계별로 추론",ic:"brain",c:"#4A5FA8"}];
const modeOf=id=>[...TALK_MODES,...CODE_MODES].find(m=>m.id===id)||TALK_MODES[0];
const LIMITS={Free:80000,Pro:600000,Max:4000000};
const CODE_MODES=[{id:"Code Spruzzo",lab:"빠른 CODE",d:"설명 없이 바로 코드",ic:"bolt",c:"#1F8A4C"},{id:"Code Corrente",lab:"CODE",d:"설계부터 생각하고 더 나은 코드",ic:"code",c:"#1F8A4C"}];
const SEED_PROJECTS=[];
const OFFICIAL=[
{id:"a1",name:"아침 뉴스 브리핑",cat:"매일",ic:"news",c:"#C2603A",desc:"오늘 주요 뉴스를 출처와 함께 3분 분량으로 정리해 줘요.",mode:"Torrente",starters:["오늘 주요 뉴스 정리해 줘","경제 뉴스만 알려 줘"]},
{id:"a2",name:"생활 법령 도우미",cat:"생활 · 법률",ic:"scale",c:"#4A5FA8",desc:"근로기준법 · 임대차 같은 생활 법령을 조문 번호와 함께 쉽게 풀어 줘요.",mode:"Torrente",starters:["연차휴가 규정 알려 줘","전세 계약 전에 확인할 것"]},
{id:"a3",name:"공식 사이트 찾기",cat:"생활 · 법률",ic:"link",c:"#1F8A4C",desc:"정부 · 기관 · 회사의 진짜 공식 사이트만 골라 링크로 알려 줘요.",mode:"Fonte",starters:["홈택스 사이트 알려 줘","여권 재발급 사이트"]},
{id:"a4",name:"위키 탐험가",cat:"공부",ic:"compass",c:"#2BA3B8",desc:"궁금한 주제를 위키백과에서 찾아 근거 번호와 함께 설명해 줘요.",mode:"Torrente",starters:["훈민정음은 누가 만들었어?","블랙홀은 어떻게 생겨?"]},
{id:"a5",name:"숙제 같이 풀기",cat:"공부",ic:"brain",c:"#7A5AE0",desc:"답을 바로 주지 않고, 풀이 과정을 한 단계씩 함께 생각해요.",mode:"Mare",starters:["분수 나눗셈 어떻게 풀어?","이 수학 문제 같이 풀자"]},
{id:"a6",name:"글 다듬기",cat:"글쓰기",ic:"pen",c:"#B5487A",desc:"쓴 글을 붙여 넣으면 맞춤법과 흐름을 고치고 이유도 알려 줘요.",mode:"Mare",starters:["이 문단 자연스럽게 고쳐 줘","자기소개서 다듬어 줘"]}];
const AGENT_ICONS=["bot","news","scale","link","compass","brain","pen","heart","book","spark"];
const AGENT_COLORS=["#1B3E9E","#C2603A","#4A5FA8","#1F8A4C","#2BA3B8","#7A5AE0","#B5487A","#E2A400"];
const DEMO={email:"dani@lago.ai",name:"다니",plan:"Pro"};

/* ---------- state ---------- */
const S={sideEdit:false,sideOrder:(()=>{try{return JSON.parse(localStorage.getItem("lago_sideorder")||"[]");}catch(e){return[];}})(),sideHide:(()=>{try{return JSON.parse(localStorage.getItem("lago_sidehide")||"[]");}catch(e){return[];}})(),myMcp:[],myHtml:[],pubKind:"tool",myTools:[],pinTools:[],conn:false,services:{},customMcp:[],flyout:false,flyTool:"translate",kidReqs:[],tasks:[],sideOff:false,user:null,area:"talk",mode:"Fonte",pinned:[],study:false,timeReq:null,extra:0,ptab:"general",cmode:"Code Corrente",think:1,web:0,menu:false,drawer:false,chats:[],cur:null,projects:SEED_PROJECTS.map(p=>({...p})),curProject:null,temp:false,learn:true,learnImg:true,confirm:null,preview:false,todos:[{t:"장보기",d:true},{t:"LAGO 데이터셋 정리",d:false},{t:"운동 30분",d:false}],kid:{sent:false,email:""},myAgents:[],favs:[],agentTab:"lago",agentCat:"전체",curAgent:null,editAgent:null,acct:false,goccia:false,gview:null,verify:"card",pendingVerify:null};
const PKEYS=["myMcp","myHtml","myTools","pinTools","services","customMcp","kidReqs","extra","limit","night","kThink","kCode","kStudy","kBreak","tasks","guardian"];const pk=()=>Object.fromEntries(PKEYS.map(k=>[k,S[k]]));
function syncReq(){const r=(S.kidReqs||[])[0];S.timeReq=r?(r.status==='pending'?'wait':r.status):null;}
function bootDone(){if(S.booting){S.booting=false;render();}}
function loadUser(){const s=store.get("lago_session",null);if(!s)return;S.user=s;const d=store.get("lago_data_"+s.email,null);if(d){PKEYS.forEach(k=>{if(d[k]!=null)S[k]=d[k];});syncReq();S.chats=d.chats||[];S.learn=d.learn!==false;S.learnImg=d.learnImg!==false;if(d.mode&&TALK_MODES.some(m=>m.id===d.mode))S.mode=d.mode;if(d.pinned)S.pinned=d.pinned;S.myAgents=d.myAgents||[];S.favs=d.favs||[];if(d.think!=null)S.think=d.think;if(d.web!=null)S.web=d.web;}}
function slimChats(list,lim){const ok=a=>JSON.stringify(a).length<lim;let a=list;if(ok(a))return a;
const st=m=>m.html||(m.att&&m.att.thumb)?{...m,html:undefined,att:m.att?{...m.att,thumb:undefined}:undefined}:m;a=a.map(c=>c.id===S.cur?c:{...c,msgs:c.msgs.map(st)});if(ok(a))return a;
a=a.map(c=>({...c,msgs:c.msgs.map(st)}));
while(a.length>1&&!ok(a)){let i=a.length-1;while(i>0&&(a[i].id===S.cur||a[i].pin))i--;a=a.filter((_,j)=>j!==i);}return a;}
function save(){if(!S.user)return;if(S.user.uid){fbSave();return;}store.set("lago_data_"+S.user.email,{myAgents:S.myAgents,favs:S.favs,pinned:S.pinned,chats:slimChats(S.chats.filter(c=>!c.temp&&!c.kid),3000000),learn:S.learn,learnImg:S.learnImg,mode:S.mode,think:S.think,web:S.web,...pk()});}

const me=()=>S.goccia?{name:"지우",plan:"Goccia",email:"kid"}:S.user;
const allAgents=()=>[...S.myAgents,...OFFICIAL];
const agentById=id=>allAgents().find(a=>a.id===id);
/* ---------- router ---------- */
const ROUTES=["dev","dev-list","html-pub","shared","tools","tool-new","tool-my","tool-pub","share-view","tool-translate","tool-spell","tool-extract","tool-summary","services","tasks","usage","agents","agent-new","agent","login","join","verify","kid","home","chat","projects","project","code","code-chat","code-folder","plans","prefs","terms","apps","guardian","admin","admin-user"];
const PUBLIC=["html-pub","login","join","verify","kid","terms","share-view","tool-pub"];
const PATHMODE=(()=>{const m=document.querySelector('meta[name="lago-router"]');return !!m&&m.content==="path"&&/^https?:$/.test(location.protocol)&&!!history.pushState;})();
/* 주소: 서버에서는 /chat, /chat/<대화번호>, /admin/user 처럼 실제 경로를 써요. 미리보기(한 파일)에서는 #chat 처럼 #을 써요. */
function urlFor(r){if(!PATHMODE)return"#"+r;if(r==="home")return"/";if((r==="chat"||r==="code-chat")&&S.cur)return"/"+r+"/"+encodeURIComponent(S.cur);if(r==="admin-user")return"/admin/user";if(r==="tool-my"&&S.curTool)return"/tool-my/"+encodeURIComponent(S.curTool);return"/"+r;}
function route(){
if(!PATHMODE){const h=location.hash.slice(1);return ROUTES.includes(h)?h:(S.user?"home":"login");}
const seg=location.pathname.replace(/\/+$/,"").split("/").slice(1).map(decodeURIComponent);
let r=seg[0]||"home";if(r==="admin"&&seg[1]==="user")r="admin-user";if(r==="s"){S.svId=seg[1]||"";r="share-view";}else if(r==="t"){S.tpId=seg[1]||"";r="tool-pub";}else if(r==="h"){S.hpId=seg[1]||"";r="html-pub";}else if(r==="tool-my"&&seg[1])S.curTool=seg[1];
if(!ROUTES.includes(r))return S.user?"home":"login";
if((r==="chat"||r==="code-chat")&&seg[1])S.cur=seg[1];
return r;}
function go(r,replace){if(!PATHMODE){if(location.hash==="#"+r)render();else location.hash=r;return;}
const u=urlFor(r);if(location.pathname===u){render();return;}
history[replace?"replaceState":"pushState"](null,"",u);onNav();}
function onNav(){S.sharePick=null;S.plus=false;S.menu=false;S.drawer=false;S.acct=false;S.cmenu=null;S.share=null;S.renameChat=null;S.delChat=null;S.flyout=false;S.tempAsk=false;S.confirm=null;render();}
addEventListener(PATHMODE?"popstate":"hashchange",onNav);

/* ---------- auth screens ---------- */
function brandPanel(){return `<section class="brand" aria-label="LAGO 소개">${WM(30,"#fff")}<h1>찾고 알려주는<br>사실적인 AI</h1><p class="sub">데이터를 찾고, 첨가 없이 알려 줘요.</p><ul><li><b>FACT</b> <span>사실만 빠르고 간편하게</span></li><li><b>THINK</b> <span>생각하고 추론</span></li><li><b>CODE</b> <span>더 나은 코드</span></li></ul></section>`;}
function vLogin(){return `<main class="auth">${brandPanel()}<section class="formside"><form class="form" id="loginForm" novalidate>
<h2>LAGO에 오신 걸 환영해요</h2><p class="muted" style="margin:0 0 6px">로그인하고 대화를 이어가세요</p>
<button type="button" class="btn" data-act="google">${googleG()} Google로 계속하기</button>
<div class="or">또는</div>
<label class="f" for="le">이메일<input id="le" type="email" autocomplete="email" placeholder="you@example.com"></label>
<label class="f" for="lp">비밀번호<input id="lp" type="password" autocomplete="current-password" placeholder="8자 이상"></label>
<p class="err" id="lerr" aria-live="polite"></p>
<button class="btn pri" type="submit">이메일로 로그인</button>
<div class="row" style="justify-content:center;gap:12px;font-size:13px"><button type="button" class="linkbtn" data-act="forgot">비밀번호 찾기</button><span class="muted">·</span><button type="button" class="linkbtn" data-go="join">회원가입</button></div>
${fbDiag()}${S.api&&S.api.firebase?"":`<button type="button" class="btn sm" data-act="demo" style="align-self:center">예시 계정으로 둘러보기</button>`}
<p class="fine">로그인하면 <button type="button" class="linkbtn" data-go="terms" style="font-size:12px">이용약관</button>에 동의하게 돼요.${S.api&&S.api.firebase?"":" 이 미리보기의 계정은 이 브라우저에만 저장돼요."}</p>
</form><small class="muted" style="font-size:12px">© 2026 LAGO</small></section></main>`;}
function vJoin(){const y=new Date().getFullYear();let ys="";for(let i=y;i>=y-100;i--)ys+=`<option>${i}</option>`;let ms="";for(let i=1;i<=12;i++)ms+=`<option>${i}</option>`;let ds="";for(let i=1;i<=31;i++)ds+=`<option>${i}</option>`;
return `<main class="auth">${brandPanel()}<section class="formside"><form class="form" id="joinForm" novalidate>
<h2>LAGO 계정 만들기</h2><p class="muted" style="margin:0 0 4px">1분이면 끝나요.</p>
<button type="button" class="btn" data-act="google">${googleG()} Google로 가입하기</button>
<div class="or">또는 이메일로</div>
<label class="f" for="jn">이름<input id="jn" autocomplete="name" placeholder="LAGO에서 부를 이름"></label>
<label class="f" for="je">이메일<input id="je" type="email" autocomplete="email" placeholder="you@example.com"></label>
<label class="f" for="jp">비밀번호<input id="jp" type="password" autocomplete="new-password" placeholder="영문 · 숫자를 섞어 8자 이상"></label>
<div class="f" style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:500;color:var(--ink2)">생년월일 <span class="hint">만 14세 이상인지 확인할 때만 써요. 날짜 자체는 저장하지 않아요.</span>
<div class="birth"><select id="jy" aria-label="태어난 해">${ys.replace(`<option>${y-20}</option>`,`<option selected>${y-20}</option>`)}</select><select id="jm" aria-label="월">${ms}</select><select id="jd" aria-label="일">${ds}</select></div></div>
<label class="check"><input type="checkbox" id="jt"><span>이용약관 · 개인정보 처리방침에 동의해요<span class="req">필수</span> <button type="button" class="linkbtn" data-go="terms" style="font-size:12px">보기</button></span></label>
<label class="check"><input type="checkbox" id="jl" checked><span>LAGO 개선에 내 대화를 써도 돼요 (설정에서 끌 수 있어요)</span></label>
<p class="err" id="jerr" aria-live="polite"></p>
<button class="btn pri" type="submit">가입하기</button>
<p class="fine">이미 계정이 있나요? <button type="button" class="linkbtn" data-go="login">로그인</button></p>
</form></section></main>`;}
function vVerify(){const e=S.pendingVerify||"you@example.com";return `<main class="auth">${brandPanel()}<section class="formside"><div class="form" style="text-align:center;align-items:center">
<div style="width:56px;height:56px;border-radius:16px;background:var(--mist);display:grid;place-items:center;color:var(--blue)">${ic("mail",28)}</div>
<h2>메일함을 확인해 주세요</h2><p class="muted" style="margin:0"><b style="color:var(--ink)">${esc(e)}</b>로 인증 링크를 보냈어요.<br>링크를 누르면 바로 시작할 수 있어요. 스팸함도 확인해 주세요.</p>
<button class="btn pri" data-act="verified" style="width:100%">인증했어요 (미리보기)</button>
<button class="btn" data-act="resend" style="width:100%">인증 메일 다시 보내기</button>
<button class="linkbtn" data-go="login">다른 이메일로 로그인</button></div></section></main>`;}
function vKid(){const k=S.kid;return `<main class="auth">${brandPanel()}<section class="formside"><form class="form" id="kidForm" novalidate style="max-width:420px">
<div class="steps"><span class="step done"><i>${ic("check",12)}</i>생년월일</span><span class="stepline" style="background:var(--blue)"></span><span class="step now"><i>2</i>보호자 동의</span><span class="stepline"></span><span class="step"><i>3</i>시작</span></div>
<span class="tag" style="align-self:flex-start;background:var(--kt);color:var(--kd)">${ic("drop",13)} LAGO Goccia · 14세 미만 계정</span>
<h2>보호자 동의가 필요해요</h2>
<p class="muted" style="margin:0">만 14세 미만은 보호자가 동의해야 LAGO를 쓸 수 있어요. 보호자 이메일을 알려 주면 동의 요청을 보낼게요. 아이 계정은 2027년 1월부터 열려요.</p>
<label class="f" for="ke">보호자 이메일<input id="ke" type="email" placeholder="parent@example.com" value="${esc(k.email)}"></label>
<div class="note">${ic("shield",17)}<span>보호자 이메일만 받아요. 7일 안에 동의가 끝나지 않으면 이 이메일과 임시 계정을 바로 지워요.</span></div>
<p class="err" id="kerr" aria-live="polite"></p>
<button class="btn pri" type="submit">${k.sent?"다시 보내기":"보호자에게 동의 요청 보내기"}</button>
${k.sent?`<div class="card" style="padding:14px 16px;display:grid;gap:6px"><div class="row"><span style="color:var(--g)">${ic("check",16)}</span><b>요청을 보냈어요</b><span class="grow"></span><span style="color:var(--blue);font-size:12px;font-weight:600">남은 기간 7일</span></div><span class="muted" style="font-size:12.5px">보호자가 메일에서 동의하고 본인 확인을 마치면 시작할 수 있어요.</span></div>`:""}
<button type="button" class="linkbtn" data-go="join" style="align-self:center">생년월일 다시 입력하기</button>
</form></section></main>`;}
function googleG(){return `<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.1C12.5 13.5 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.6 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>`;}

/* ---------- shell ---------- */
const HUB=["tools","agents","agent","agent-new","tool-new","tool-my"];
function hubHead(on,btn){return `<div class="row phead"><div class="grow"><h1>TOOLS / MODES</h1><p class="muted" style="margin:0">MODE는 답하는 방식, TOOLS는 글이나 파일로 하는 일이에요. 만든 것은 프로필 → 공유에서 링크로 공유해요.</p></div>${btn||""}</div><div class="tabs" role="tablist"><button role="tab" aria-selected="${on==="mode"}" data-go="agents">MODE</button><button role="tab" aria-selected="${on==="tools"}" data-go="tools">TOOLS</button></div>`;}
const TOOLS=[
{id:"translate",route:"tool-translate",lab:"문서 번역",ic:"scale",c:"#1B3E9E",d:"글을 원하는 언어로 번역해요 (Fonte 모델).",steps:["글을 붙여 넣거나 파일을 올려요 (PDF · DOCX · PPTX · XLSX)","번역할 언어를 고르고 번역을 시작해요","결과에서 번역본과 원문을 나란히 비교해요"],cta:"문서 번역 열기"},
{id:"spell",route:"tool-spell",lab:"맞춤법 검사",ic:"check",c:"#2BA3B8",d:"글의 맞춤법과 띄어쓰기를 고치고, 고친 곳을 알려 줘요.",steps:["고칠 글을 붙여 넣어요 (1,500자까지)","검사를 시작해요","고친 글과 고친 곳을 확인해요"],cta:"맞춤법 검사 열기"},
{id:"extract",route:"tool-extract",lab:"텍스트 추출",ic:"file",c:"#2BA3B8",d:"이미지나 PDF 속 글자를 뽑아서 복사할 수 있게 해요.",steps:["이미지나 PDF 파일을 올려요","글자를 뽑을 부분을 정해요","뽑힌 글자를 복사하거나 대화로 보내요"],cta:"텍스트 추출 열기"},
{id:"summary",route:"tool-summary",lab:"문서 요약",ic:"news",c:"#4A5FA8",d:"긴 글을 핵심만 짧게 정리해요. 근거 문장도 함께 보여 줘요.",steps:["요약할 글을 붙여 넣거나 파일을 올려요","길이를 골라요 (3줄 · 5줄 · 한 문단)","핵심 문장과 근거 위치를 확인해요"],cta:"문서 요약 열기"}];
const SERVICES=[["gcal","Google Calendar","일정을 보고, 새 일정을 만들어요.","로그인 필요","#1A73E8"],["gmail","Gmail","메일을 찾아 읽고, 답장 초안을 써요.","로그인 필요","#D93025"],["gdrive","Google Drive","드라이브의 파일을 찾아 읽어요.","로그인 필요","#188038"],["notion","Notion","Notion 페이지를 읽고 정리해요.","로그인 필요","#1F2937"],["m365mail","M365 메일 · 일정","승인 없이 바로 메일, 일정, 팀즈 채팅을 써요.","로그인 필요","#5B5FC7"],["m365files","M365 파일 · 회의실","관리자 승인 뒤에 원드라이브 파일과 회의실을 써요.","관리자 승인","#5B5FC7"]];
const connCount=()=>mcpOn().length;
const cust=()=>(S.customMcp||[]).map(x=>typeof x==="string"?{name:x.replace(/^https:\/\//,"").split("/")[0],url:x}:x);
const pendingReq=()=>(S.kidReqs||[]).filter(x=>x.status==="pending").length;
function flyPrev(t){const pin=S.pinTools.includes(t.id);return `<div class="flyart" style="--c:${t.c}">${ic(t.ic,38)}</div><b>${t.lab}</b><p>${t.d}</p><ol>${t.steps.map((x,i)=>`<li><i>${i+1}</i><span>${x}</span></li>`).join("")}</ol><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" data-go="${t.route}">${t.cta}</button><button class="btn sm" data-pintool="${t.id}">${ic("pin",14)} ${pin?"사이드바에서 빼기":"사이드바에 고정"}</button></div>`;}
function flyout(){const cur=TOOLS.find(t=>t.id===S.flyTool)||TOOLS[0];
return `<div class="flywrap" data-act="flyout"></div><div class="flyout ${S.sideOff?"atrail":""}" role="dialog" aria-label="TOOLS"><div class="flylist">${TOOLS.map(t=>`<button class="flyitem ${t.id===cur.id?"on":""}" data-tool="${t.id}" data-go="${t.route}"><span class="fi">${ic(t.ic,19)}</span><span class="grow"><b>${t.lab}</b><small>${t.d}</small></span>${S.pinTools.includes(t.id)?ic("pin",14):""}</button>`).join("")}${(S.myTools||[]).map(t=>`<button class="flyitem" data-ctool="${t.id}"><span class="fi" style="background:#4A5FA8;color:#fff">${ic("bot",19)}</span><span class="grow"><b>${esc(t.name)}</b><small>내 도구 · ${esc(t.desc||"")}</small></span></button>`).join("")}<button class="flyitem" data-act="newTool"><span class="fi">${ic("plus",19)}</span><span class="grow"><b>TOOLS 만들기</b><small>내 지시문으로 나만의 도구를 만들고 배포해요</small></span></button><button class="flyitem" data-go="tools"><span class="fi">${ic("grid",19)}</span><span class="grow"><b>도구 모두 보기</b></span></button></div><div class="flyprev">${flyPrev(cur)}</div></div>`;}
function railBar(){const code=S.area==="code",kid=S.goccia,r=route();const b=(k,act,t,on)=>`<button class="railbtn ${on?"on":""}" ${act} aria-label="${t}" title="${t}">${ic(k,20)}</button>`;
return `<nav class="rail" aria-label="빠른 메뉴">${b("panel",'data-act="sideToggle"',"사이드바 열기 (Ctrl B)")}<div class="railsep"></div>${b("pen",'data-act="new"',"새 대화 (Ctrl K)")}${b("search",'data-act="search"',"검색")}${code?b("folder",'data-go="code-folder"',"작업 폴더",r==="code-folder")+b("term",'data-act="term"',"터미널"):kid?b("grid",'data-go="tools"',"TOOLS / MODES",HUB.includes(r)):b("folder",'data-go="projects"',"프로젝트",r==="projects"||r==="project")+b("clock",'data-go="tasks"',"예약 작업",r==="tasks")+b("plug",'data-go="services"',"서비스 연결",r==="services")+b("grid",'data-go="tools"',"TOOLS / MODES",HUB.includes(r))+S.pinTools.map(id=>{const t=TOOLS.find(x=>x.id===id);return t?b(t.ic,`data-go="${t.route}"`,t.lab,r===t.route):""}).join("")}<span class="grow"></span>${kid?"":`<button class="railbtn" data-act="notice" aria-label="업데이트 · 공지" title="업데이트 · 공지">${ic("bell",19)}${updDot()?'<i class="dot"></i>':""}</button>`}<button class="railbtn av" data-act="acct" aria-label="계정 메뉴" ${kid?'style="background:var(--k);color:#fff"':""}>${esc(me().name.slice(0,1))}${!kid&&pendingReq()?'<i class="dot"></i>':""}</button></nav>`;}
function sidebar(){const code=S.area==="code";const r=route();const kid=S.goccia;
const list=S.chats.filter(c=>c.area===S.area&&!c.temp&&!!c.kid===kid);
const pinnedChats=list.filter(c=>c.pin),rest=list.filter(c=>!c.pin);
const pinProj=code||kid?[]:S.projects.filter(p=>S.pinned.includes(p.id));
const row=c=>S.renameChat===c.id&&S.renameAt==="side"?`<form class="renamef" data-rf="${c.id}"><input id="rnc" value="${esc(c.title)}" aria-label="새 대화 이름" maxlength="40"><button class="iconbtn" aria-label="저장">${ic("check",15)}</button></form>`
:`<div class="itemrow ${S.cur===c.id&&(r==="chat"||r==="code-chat")?"on":""}"><button class="item" data-chat="${c.id}">${c.pin?ic("pin",13)+" ":""}${esc(c.title)}</button><button class="more" data-cmenu="${c.id}" data-at="side" aria-label="대화 메뉴">${ic("dots",16)}</button>${S.cmenu===c.id&&S.cmenuAt==="side"?chatMenu(c):""}</div>${S.delChat===c.id&&!(r==="chat"||r==="code-chat"&&S.cur===c.id)?delConfirm(c):""}`;
const nav=(k,t,on,attr,right="")=>`<button class="nav ${on?"on":""}" ${attr}>${ic(k,18)}<span class="grow">${t}</span>${right}</button>`;
const pct=usagePct();
const temps=S.temp?S.chats.filter(c=>c.temp&&c.area===S.area):[];
return `<aside class="side" aria-label="메뉴"><div class="head">${WM(18)}<span class="grow"></span><button class="iconbtn hide-m" data-act="sideToggle" aria-label="사이드바 접기" title="사이드바 접기 (Ctrl B)">${ic("panel",19)}</button>${kid&&S.kCode===false?"":`<div class="toggle" role="group" aria-label="대화 / 코드"><button aria-pressed="${!code}" data-area="talk">대화</button><button aria-pressed="${code}" data-area="code">코드</button></div>`}</div>
<button class="newbtn" data-act="new">${ic("plus",17)}<span class="grow">${code?"새 코드 작업":"새 대화"}</span><kbd>Ctrl K</kbd></button>
<div class="sect row" style="gap:6px"><span class="grow">${code?"코드":"메뉴"}</span>${code||kid?"":`<button class="mngbtn" data-act="menuEdit" aria-label="메뉴 편집" title="메뉴 편집">${ic("pen",12)} 편집</button>`}</div>
${code?nav("folder","작업 폴더",r==="code-folder",'data-go="code-folder"',WF.name?'<span class="cnt">'+esc(WF.name.slice(0,12))+'</span>':'')+nav("search","검색",false,'data-act="search"')+nav("term","터미널",false,'data-act="term"')
:(kid?nav("grid","TOOLS / MODES",HUB.includes(r),'data-go="tools"','<span class="cnt">'+(OFFICIAL.length+S.myAgents.length+(S.myTools||[]).length+TOOLS.length)+'</span>')+nav("search","검색",false,'data-act="search"','<kbd>/</kbd>'):sideNav(r,nav))}
${temps.length?`<div class="sect row" style="gap:6px">${ic("eyeoff",13)} 임시 대화</div>${temps.map(c=>`<button class="item ${S.cur===c.id?"on":""}" data-chat="${c.id}"><i>${esc(c.title)}</i></button>`).join("")}`:""}
<div class="sect">최근 ${code?"작업":"대화"}</div>
<div class="recent">${pinProj.map(p=>`<div class="itemrow ${r==="project"&&S.curProject===p.id?"on":""}"><button class="item" data-project="${p.id}">${ic("folder",14)} ${esc(p.name)}</button><button class="more" data-unpin="${p.id}" aria-label="고정 해제" title="고정 해제">${ic("pin",14)}</button></div>`).join("")}${pinnedChats.map(row).join("")}${rest.slice(0,150).map(row).join("")}${!list.length&&!pinProj.length?`<p class="empty">아직 ${code?"코드 작업이":"대화가"} 없어요.<br>${code?"새 코드 작업":"새 대화"}로 시작해 보세요.</p>`:""}</div>
<div class="sidefoot">
${S.goccia?"":updBtn()}<div class="prof"><span class="av" ${kid?'style="background:var(--k);color:#fff"':""}>${esc(me().name.slice(0,1))}${!kid&&pendingReq()?'<i class="dot"></i>':""}</span><span class="grow"><b>${esc(me().name)}</b><small>${kid?"Goccia · 보호자와 연결됨":esc(S.user.plan||"Free")}</small></span><button class="iconbtn" data-act="acct" aria-expanded="${S.acct}" aria-label="계정 메뉴">${ic("dots",18)}</button></div></div></aside>${railBar()}${S.acct?acctMenu():""}${""}`;}
/* ---------- 사이드바 메뉴 편집 ---------- */
const SIDE_B=[["search","검색","search"],["projects","프로젝트","folder"],["tools","TOOLS / MODES","grid"],["tasks","예약 작업","clock"],["services","서비스 연결","plug"]];
const hid=k=>S.sideHide.includes(k);
function sideEntries(){const all=[...SIDE_B.map(([k,lab,i])=>({k,lab,ic:i,kind:"b"})),...TOOLS.map(t=>({k:"t:"+t.id,lab:t.lab,ic:t.ic,kind:"t",t}))];
 const ord=(S.sideOrder||[]).filter(k=>all.some(e=>e.k===k));const rest=all.map(e=>e.k).filter(k=>!ord.includes(k));
 return [...ord,...rest].map(k=>all.find(e=>e.k===k)).map(e=>({...e,on:e.kind==="t"?S.pinTools.includes(e.t.id):!hid(e.k)}));}
function sideNav(r,nav){return sideEntries().filter(e=>e.on).map(e=>{
 if(e.kind==="t")return nav(e.t.ic,e.t.lab,r===e.t.route,`data-go="${e.t.route}"`);
 if(e.k==="search")return nav("search","검색",false,'data-act="search"','<kbd>/</kbd>');
 if(e.k==="projects")return nav("folder","프로젝트",r==="projects"||r==="project",'data-go="projects"','<span class="cnt">'+S.projects.length+'</span>');
 if(e.k==="tools")return nav("grid","TOOLS / MODES",HUB.includes(r),'data-go="tools"','<span class="cnt">'+(OFFICIAL.length+S.myAgents.length+(S.myTools||[]).length+TOOLS.length)+'</span>');
 if(e.k==="tasks")return nav("clock","예약 작업",r==="tasks",'data-go="tasks"','<span class="cnt">'+S.tasks.length+'</span>');
 if(e.k==="services")return nav("plug","서비스 연결",r==="services",'data-go="services"','<span class="cnt">'+connCount()+'</span>');
 return "";}).join("");}
function sideSave(){try{localStorage.setItem("lago_sidehide",JSON.stringify(S.sideHide));localStorage.setItem("lago_sideorder",JSON.stringify(S.sideOrder));}catch(e){}}
function menuEditor(){const es=sideEntries();const on=es.filter(e=>e.on).length;
return `<div class="tempask" role="dialog" aria-label="사이드바 메뉴 편집"><div class="noticebg" data-act="menuEditX"></div><div class="card noticecard menued"><div class="row" style="gap:8px"><b style="font-size:16px" class="grow">사이드바 메뉴 편집</b><button class="iconbtn" data-act="menuEditX" aria-label="닫기">${ic("x",16)}</button></div>
<p class="muted" style="margin:0;font-size:12.5px">켜 둔 항목만 사이드바에 나와요 (${on}개). 화살표로 순서를 바꿔요.</p>
<div class="medlist">${es.map((e,i)=>`<div class="med ${e.on?"":"off"}"><span class="mico">${ic(e.ic,16)}</span><span class="grow mlab">${esc(e.lab)}${e.kind==="t"?"<small>도구</small>":""}</span><span class="mmv"><button class="iconbtn" data-act="menuMove" data-k="${e.k}" data-d="-1" ${i===0?"disabled":""} aria-label="위로"><span style="display:inline-flex;transform:rotate(90deg)">${ic("left",14)}</span></button><button class="iconbtn" data-act="menuMove" data-k="${e.k}" data-d="1" ${i===es.length-1?"disabled":""} aria-label="아래로"><span style="display:inline-flex;transform:rotate(-90deg)">${ic("left",14)}</span></button></span><button class="switch" role="switch" aria-checked="${e.on}" data-act="menuTog" data-k="${e.k}" aria-label="${esc(e.lab)} 표시"></button></div>`).join("")}</div>
<div class="row" style="gap:8px;justify-content:space-between"><button class="btn sm" data-act="menuReset">기본값으로</button><button class="btn pri" data-act="menuEditX">완료</button></div></div></div>`;}
function usagePct(){const lim=(S.user&&S.user.dailyLimit)||LIMITS[(S.user&&S.user.plan)||"Free"]||80000;return Math.min(100,Math.round(useDay(dayKey()).t/lim*100));}
function chatMenu(c){return `<div class="cmenu" role="menu"><button class="opt" data-act="cRename" data-id="${c.id}">${ic("pen",15)} 이름 바꾸기</button><button class="opt" data-act="cPin" data-id="${c.id}">${ic("pin",15)} ${c.pin?"고정 해제":"고정하기"}</button>${S.goccia?"":`<button class="opt" data-act="share" data-id="${c.id}">${ic("share",15)} 공유</button>`}<button class="opt danger-t" data-act="cDel" data-id="${c.id}">${ic("trash",15)} 삭제</button></div>`;}
function delConfirm(c){return `<div class="confirm" style="margin:4px 4px 8px">"${esc(c.title)}"을(를) 지울까요?<div class="row"><button class="btn sm danger" data-act="cDelYes" data-id="${c.id}">지우기</button><button class="btn sm" data-act="cDelNo">취소</button></div></div>`;}

/* ---------- 화면 테마 · 언어 · 검색 ---------- */
function applyTheme(){const t=S.theme||"light";let dark=t==="dark";try{if(t==="system")dark=matchMedia("(prefers-color-scheme: dark)").matches;}catch(e){}document.documentElement.setAttribute("data-lago",dark?"dark":"light");applySet();}
function setTheme(v){if(!["system","light","dark"].includes(v))return;S.theme=v;store.set("lago_theme",v);applyTheme();render();}
let enRx=null,enMap=null;
function enBuild(){const m=window.LAGO_EN||{};enMap=m;const ks=Object.keys(m).filter(k=>k.length>1).sort((a,b)=>b.length-a.length);enRx=ks.length?new RegExp(ks.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"),"g"):null;}
function trText(s){if(!/[가-힣]/.test(s))return s;if(!enRx)enBuild();if(!enRx)return s;let m=s.match(/^(\s*)안녕하세요, (.+)님(\s*)$/);if(m)return m[1]+"Hello, "+m[2]+m[3];
const t=s.trim();if(enMap[t])return s.replace(t,enMap[t]);
return s.replace(enRx,x=>enMap[x]).replace(/(\d+)\s*개(?![가-힣])/g,"$1").replace(/ ([을를이가은는에의도로으]|으로|에서|에게|님)(?![가-힣])/g,"");}
function trUI(){if((S.lang||"ko")!=="en")return;const root=document.body;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){const p=n.parentNode&&n.parentNode.nodeName;return p==="SCRIPT"||p==="STYLE"||p==="TEXTAREA"||(n.parentNode&&n.parentNode.closest&&n.parentNode.closest(".answer,.um,.toolout"))?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});const ns=[];while(w.nextNode())ns.push(w.currentNode);ns.forEach(n=>{const v=trText(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v;});root.querySelectorAll("[placeholder],[aria-label],[title]").forEach(el=>{["placeholder","aria-label","title"].forEach(a=>{const v=el.getAttribute(a);if(v){const t=trText(v);if(t!==v)el.setAttribute(a,t);}});});}
function setLang(v){if(!["ko","en"].includes(v))return;S.lang=v;store.set("lago_lang",v);document.documentElement.setAttribute("lang",v);render();}
function srchGo(k){const [t,id]=[k.slice(0,k.indexOf(":")),k.slice(k.indexOf(":")+1)];closeSearch();S.menu=false;S.drawer=false;
if(t==="chat"){S.cur=id;const c=curChat();S.area=c&&c.area==="code"?"code":"talk";go(c&&c.area==="code"?"code-chat":"chat");}
else if(t==="agent"){S.curAgent=id;S.cur=null;go("agent");}
else if(t==="tool"){const d=TOOLS.find(x=>x.id===id);if(d)go(d.route);}
else if(t==="mytool"){S.curTool=id;S.flyout=false;S.toolIn=null;go("tool-my");}}
function closeSearch(){const o=document.getElementById("srchov");if(o)o.remove();}
function srchRun(q){const box=document.getElementById("srchres");if(!box)return;q=(q||"").trim().toLowerCase();
const chats=S.chats.filter(c=>!c.temp&&!c.kid);const hit=(a)=>a&&String(a).toLowerCase().includes(q);
const snip=(c)=>{for(const m of c.msgs||[]){const x=m.role==="user"?m.text:(m.plain||"");if(x&&hit(x)){const i=x.toLowerCase().indexOf(q);return (i>30?"…":"")+x.slice(Math.max(0,i-30),i+60).replace(/\s+/g," ");}}return "";};
let cr=q?chats.filter(c=>hit(c.title)||(c.msgs||[]).some(m=>hit(m.role==="user"?m.text:m.plain))):chats.slice(0,6);cr=cr.slice(0,8);
const ag=q?allAgents().filter(a=>hit(a.name)||hit(a.desc)).slice(0,5):[];
const tl=q?TOOLS.filter(t=>hit(t.lab)||hit(t.d)).slice(0,5):[];
const mt=q?(S.myTools||[]).filter(t=>hit(t.name)||hit(t.desc)).slice(0,5):[];
const row=(k,i,t,sub)=>`<button type="button" class="srchrow" data-srch="${esc(k)}">${ic(i,16)}<span class="grow"><b>${esc(t)}</b>${sub?`<small>${esc(sub)}</small>`:""}</span></button>`;
let h="";
if(cr.length)h+=`<div class="hint">${q?"대화":"최근 대화예요"}</div>`+cr.map(c=>row("chat:"+c.id,"file",c.title||"대화",q?snip(c):"")).join("");
if(ag.length)h+=`<div class="hint">MODE</div>`+ag.map(a=>row("agent:"+a.id,"bot",a.name,a.desc||"")).join("");
if(tl.length||mt.length)h+=`<div class="hint">TOOLS</div>`+tl.map(t=>row("tool:"+t.id,t.ic,t.lab,t.d)).join("")+mt.map(t=>row("mytool:"+t.id,"bot",t.name,t.desc||"")).join("");
box.innerHTML=h||`<p class="muted" style="margin:14px 8px">${q?"검색 결과가 없어요":"아직 대화가 없어요."}</p>`;trUI();}
function openSearch(){if(!S.user||document.getElementById("srchov"))return;const o=document.createElement("div");o.id="srchov";o.className="tempask";o.innerHTML=`<div class="card srchbox" role="dialog" aria-label="검색"><div class="srchin">${ic("search",18)}<input id="srchq" type="search" placeholder="대화 · MODE · TOOLS 검색" autocomplete="off" aria-label="검색어"><button type="button" class="iconbtn" data-srchx="1" aria-label="닫기">${ic("x",16)}</button></div><div id="srchres" class="srchres"></div></div>`;document.body.appendChild(o);const q=o.querySelector("#srchq");q.addEventListener("input",()=>srchRun(q.value));o.addEventListener("click",e=>{const b=e.target.closest("[data-srch]");if(b){e.stopPropagation();srchGo(b.dataset.srch);return;}if(e.target===o||e.target.closest("[data-srchx]")){e.stopPropagation();closeSearch();}});o.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();closeSearch();}if(e.key==="Enter"){const f=o.querySelector("[data-srch]");if(f){e.preventDefault();srchGo(f.dataset.srch);}}});srchRun("");q.focus();trUI();}
function themeLang(){const th=S.theme||"light",lg=S.lang||"ko";const sg=(act,cur,o)=>`<div class="seg mini" role="group">${o.map(([v,l,t])=>`<button type="button" aria-pressed="${cur===v}" data-act="${act}" data-v="${v}" title="${t||l}" aria-label="${t||l}">${l}</button>`).join("")}</div>`;
return `<div class="acctrow two">${sg("setTheme",th,[["system",ic("monitor",14),"시스템"],["light",ic("sun",14),"라이트"],["dark",ic("moon",14),"다크"]])}${sg("setLang",lg,[["ko","한","한국어"],["en","EN","English"]])}</div>`;}
function acctMenu(){const kid=S.goccia;const plan=S.user.plan||"Free";const it=(k,t,attr,right="")=>`<button class="opt" ${attr}>${ic(k,17)}<span class="grow">${t}</span>${right}</button>`;
return `<div class="acctwrap" data-act="acct"></div><div class="acct" role="menu" aria-label="계정 메뉴"><div class="acchead">${esc(kid?"지우 · LAGO Goccia":S.user.email)}</div>
${kid?it("swap",esc(S.user.name)+" 계정으로 돌아가기",'data-act="asMe"')+it("file","이용약관",'data-go="terms"'):
it("sliders","설정",'data-go="prefs"','<span class="kb">Ctrl+,</span>')+it("share","공유",'data-go="shared"')+it("check","LAGO DEV",'data-go="dev"')+it("gauge","사용량",'data-go="usage"','<span class="kb">'+usagePct()+'%</span>')+(isAdmin()?it("shield","관리자",'data-go="admin"'):"")+(S.guardian?it("shield","보호자 화면",'data-go="guardian"',pendingReq()?'<span class="maxtag" style="background:#FDE8E4;color:#C0392B;border-color:transparent">요청 '+pendingReq()+'</span>':""):"")+"<hr>"+themeLang()+"<hr>"+
(plan==="Max"?it("crown","플랜 관리",'data-go="plans"','<span class="maxtag">MAX</span>'):it("upc","플랜 업그레이드",'data-go="plans"'))+it("download","앱 받기",'data-go="apps"')+it("file","이용약관",'data-go="terms"')}
<hr>${it("logout","로그아웃",'data-act="logout"')}</div>`;}
function tempBar(){const c=curChat();const inTemp=c&&c.temp&&(route()==="chat"||route()==="code-chat");const n=S.chats.filter(x=>x.temp).length;const ttl=["창을 닫으면","1시간 뒤","24시간 뒤"][S.ttl||0];
let left="";if(inTemp&&S.ttl){const ms=c.created+(S.ttl===1?36e5:864e5)-Date.now();left=` · 남은 시간 ${Math.max(0,Math.floor(ms/6e4))}분`;}
return `<div class="tempbar"><span class="row" style="gap:6px">${ic("eyeoff",15)} <b>임시 대화</b></span><span class="tb-txt">기록 · 학습 · 사용자 지정에 남지 않아요 · ${ttl} 지워져요${left}</span><span class="grow"></span>${inTemp?`<button data-act="tempCopy">${ic("copy",13)}<span class="tb-l">전체 복사</span></button><button data-act="tempSave">${ic("check",13)}<span class="tb-l">일반 대화로 저장</span></button>`:""}<button data-act="tempEnd">${ic("x",13)}<span class="tb-l">끝내기</span></button></div>${S.tempAsk?`<div class="tempask" role="alertdialog" aria-label="임시 대화 끝내기"><div class="card" style="display:grid;gap:12px;max-width:380px;width:100%"><b style="font-size:16px">임시 대화를 끝낼까요?</b><span class="muted" style="font-size:13px">끝내면 이 창의 임시 대화 ${n}개가 바로 지워져요. 남기고 싶은 대화는 일반 대화로 저장하세요.</span><div style="display:grid;gap:8px"><button class="btn pri" data-act="tempEndYes">지우고 홈으로 가기</button>${inTemp?`<button class="btn" data-act="tempSaveEnd">이 대화는 저장하고 끝내기</button>`:""}<button class="btn" data-act="tempAskNo">계속 임시 대화하기</button></div></div></div>`:""}`;}
function topbar(title,extra=""){
return `<header class="top"><button class="iconbtn menu-btn" data-act="drawer" aria-label="메뉴 열기">${ic("menu",22)}</button><span class="mwm">${WM(16)}</span>${S.area==="code"?`<span class="codebadge">${ic("code",14)} 코드</span>`:""}${title}${title?"":`<span class="stt" aria-hidden="true"></span>`}<span class="grow"></span>${extra}
<button class="pill" data-act="new" title="새 대화 (Ctrl K)">${ic("pen",15)}<span class="pl">새 대화</span></button>
</header>`;}
function shell(inner){const r=route();const tempOn=S.temp&&["home","chat","code","code-chat","agent"].includes(r);
if(S.temp&&S.ttl){const lim=S.ttl===1?36e5:864e5;S.chats=S.chats.filter(c=>!c.temp||Date.now()-c.created<lim);}
const saveM=S.saveCode&&DESK?`<div class="tempask" role="dialog" aria-label="파일로 저장"><form class="card" id="saveForm" style="display:grid;gap:12px;max-width:420px;width:100%" novalidate><b style="font-size:16px">코드를 파일로 저장</b><span class="muted" style="font-size:13px">${WF.name?esc(WF.name)+(WF.cwd?"/"+esc(WF.cwd):"")+" 폴더에 저장해요. 같은 이름이 있으면 확인 창에서 덮어쓸지 물어봐요.":"먼저 작업 폴더를 열어 주세요."}</span><input id="scname" placeholder="예: app.py" maxlength="120" aria-label="파일 이름" ${WF.name?"":"disabled"}><p class="err" id="scerr" role="alert"></p><div class="row" style="justify-content:flex-end;gap:8px"><button type="button" class="btn" data-act="saveX">취소</button><button class="btn pri" ${WF.name?"":"disabled"}>저장</button></div></form></div>`:"";
if(!S.noticeAsked&&S.upd&&noticeUnseen()&&!S.goccia&&["home","chat","code","code-chat"].includes(r)){S.noticeAsked=true;S.noticeOpen=true;}
const upM=(S.sideEdit?menuEditor():"")+(S.upw?upwModal():"")+(S.noticeOpen&&S.upd&&!S.upw?noticeModal():"");
return saveM+upM+`<div class="shell ${S.sideOff?"sideoff":""} ${S.area==="code"?"code":""} ${S.goccia?"goccia":""} ${S.drawer?"drawer":""}">${sidebar()}<div class="overlay" data-act="drawer"></div><div class="main ${tempOn?"temp":""}">${tempOn?tempBar():""}${inner}</div></div>`;}
function discText(code){return S.goccia?`${ic("info",13)} 보호자와 연결된 계정이에요 · 오늘 ${48+S.extra}분 남았어요`:code?"실행 전에 명령을 꼭 확인해 주세요.":"LAGO는 실수할 수 있어요. 중요한 내용은 출처를 확인해 주세요.";}
/* ---------- composer ---------- */
function composer(ph){const code=S.area==="code";const modes=code?CODE_MODES:TALK_MODES;const cur=code?S.cmode:S.mode;const cm=modeOf(cur);
const pop=S.menu?`<div class="pop" role="dialog" aria-label="모델 고르기"><div class="hint" style="padding:6px 10px">모델</div>${modes.map(m=>`<button class="opt ${m.id===cur?"on":""}" data-mode="${m.id}"><span class="mi" style="background:${m.c}22;color:${m.c}">${ic(m.ic,18)}</span><span class="grow"><b>${m.lab}</b><span class="ver">${m.id} 1.0</span><small>${m.d}</small></span>${m.id===cur?`<span style="color:${m.c}">${ic("check",18)}</span>`:""}</button>`).join("")}
${(code||cur==="Mare")?`<div style="height:1px;background:#EEF2F8;margin:6px 4px"></div><div class="popsec"><div class="row">${ic("brain",15)} 생각 강도</div><div class="seg">${["낮게","보통","깊게"].map((t,i)=>`<button aria-pressed="${S.think===i}" data-think="${i}">${t}</button>`).join("")}</div></div>`:""}</div>`:"";
const connPop=S.conn?`<div class="pop connpop" role="dialog" aria-label="커넥터"><div class="hint" style="padding:6px 10px">연결된 서비스 (MCP)</div>${(()=>{if(!S.mcp)mcpLoad();const on=mcpOn().map(x=>[x.name,"#4A5FA8"]);return on.length?on.map(x=>`<div class="opt" style="cursor:default"><span class="svcico sm" style="background:${x[1]}">${esc(x[0].slice(0,1))}</span><span class="grow"><b>${esc(x[0])}</b></span><span style="color:var(--g)">${ic("check",16)}</span></div>`).join(""):`<p class="muted" style="margin:0;padding:6px 10px 10px;font-size:13px">켜 둔 MCP가 없어요.</p>`;})()}<div style="height:1px;background:#EEF2F8;margin:6px 4px"></div><button type="button" class="opt" data-go="services">${ic("plug",17)}<span class="grow"><b>서비스 연결 열기</b></span>${ic("right",14)}</button></div>`:"";
return `<form class="composer" id="composer">${pop}${connPop}${S.plus&&!S.goccia?plusPop():""}<textarea id="q" rows="1" placeholder="${esc(ph)}" aria-label="메시지"></textarea>
${selRow()}
<div class="tools">${S.goccia?"":`<button type="button" class="round" data-act="plus" aria-label="첨부와 TOOLS" aria-expanded="${!!S.plus}" aria-haspopup="dialog">${ic("plus",18)}</button><input type="file" id="cfile" hidden accept=".pdf,.docx,.txt,.md,.csv,.tsv,.json,.html,.htm,.srt,.log,image/*">`}
${code?`<button type="button" class="chip plain" ${WF.name?'data-go="code-folder"':'data-act="wfPick"'}>${ic("folder",15)}<span class="wl">${WF.name?esc(WF.name):"폴더 열기"}</span></button><button type="button" class="chip" data-act="term" aria-pressed="${!!S.term}">${ic("term",15)}<span class="wl">터미널</span></button>`:""}
${S.goccia?`<button type="button" class="chip studychip" data-act="study" aria-pressed="${S.study||S.kStudy===true}">${ic("book",15)} 공부 모드</button>`:""}
${S.goccia||code?"":`<button type="button" class="chip connchip" data-act="conn" aria-expanded="${S.conn}" aria-haspopup="dialog" title="커넥터 (MCP)">${ic("plug",15)}<span class="wl">MCP${connCount()?" "+connCount():""}</span></button>`}<button type="button" class="modebtn" data-act="menu" aria-expanded="${S.menu}" aria-haspopup="dialog"><b>${cm.lab}</b><span class="mid">${cur} 1.0</span>${ic("down",15)}</button>
<button class="send" type="submit" aria-label="보내기">${ic("up",18)}</button></div></form>`;}
/* ---------- talk ---------- */
function kidHome(){const left=48+S.extra,tot=120+S.extra;
return `<div class="kidgrid"><div class="card kidtime"><div class="row"><b>${ic("clock",15)} 오늘 남은 시간</b><span class="grow"></span><b style="color:var(--k)">${left}분</b></div><div class="bar"><i style="width:${Math.round((tot-left)/tot*100)}%;background:var(--k)"></i></div>${S.timeReq==="wait"?`<span class="muted" style="font-size:12.5px">보호자에게 30분 더 달라고 요청했어요. 답을 기다리는 중이에요.</span>`:S.timeReq==="ok"?`<span style="font-size:12.5px;color:var(--g);font-weight:600">보호자가 30분을 더 줬어요!</span>`:S.timeReq==="no"?`<span class="muted" style="font-size:12.5px">오늘은 여기까지래요. 내일 또 만나요!</span>`:`<div class="row" style="gap:8px"><input id="treason" placeholder="왜 더 필요한지 한 줄 (선택)" maxlength="60" aria-label="이유" style="flex:1;min-width:0"><button class="btn sm pri" data-act="askTime" style="white-space:nowrap">${ic("up",14)} 보호자에게 보내기</button></div>`}</div>
<div class="explore">${[["spark","과학","블랙홀은 어떻게 생겨?"],["book","역사","훈민정음은 누가 만들었어?"],["brain","수학","분수 나눗셈 쉽게 알려 줘"],["code","코딩","파이썬으로 구구단 만들기"]].map(x=>`<button class="card" data-ask="${x[2]}"><span style="color:var(--k)">${ic(x[0],18)}</span><b>${x[1]}</b><small>${x[2]}</small></button>`).join("")}</div></div>`;}
function vHome(){const tm=S.temp;
return shell(`${topbar("",S.goccia?"":`<button class="pill tempbtn ${tm?"on":""}" data-act="temp" aria-pressed="${tm}" title="임시 대화">${ic("eyeoff",15)}<span class="pl">${tm?"임시 대화 중":"임시 대화"}</span></button>`)}<div class="scroll"><div class="wrap hero">
${tm?`<span class="tempicon">${ic("eyeoff",28)}</span><div><h1>임시 대화</h1><p class="muted" style="margin:6px 0 0">편하게 물어보세요. 끝내면 흔적 없이 사라져요.</p></div>
<div class="promise">${[["clock","기록에 남지 않아요","최근 대화 · 검색에 안 보여요"],["shield","학습에 쓰지 않아요","LAGO 다음 버전 학습에서 빠져요"],["sliders","사용자 지정을 안 써요","내 지시문 · 프로젝트 자료를 참고하지 않아요"]].map(x=>`<div>${ic(x[0],17)}<span><b>${x[1]}</b><br><small>${x[2]}</small></span></div>`).join("")}</div>
<div class="row" style="gap:10px;flex-wrap:wrap;justify-content:center;font-size:13px"><span class="muted">자동으로 지우기</span><div class="seg" style="width:auto">${["창을 닫으면","1시간 뒤","24시간 뒤"].map((t,i)=>`<button aria-pressed="${(S.ttl||0)===i}" data-ttl="${i}">${t}</button>`).join("")}</div></div>`
:S.goccia?`<div><h1>안녕, 지우!</h1><p class="muted" style="margin:6px 0 0">궁금한 걸 물어봐. 찾아보고 쉽게 알려 줄게.</p></div>`:`<div><h1>안녕하세요, ${esc(S.user.name)}님</h1><p class="muted" style="margin:6px 0 0">무엇이든 물어보세요. 찾아 읽고 출처와 함께 답할게요.</p></div>`}
${composer(tm?"임시로 물어보세요":"LAGO에게 무엇이든 물어보세요")}
${S.goccia?kidHome():""}${tm||S.goccia?"":`<div class="quicktools">${TOOLS.map(t=>`<button data-go="${t.route}"><span style="color:${t.c}">${ic(t.ic,17)}</span>${t.lab}</button>`).join("")}<button data-go="services"><span style="color:#2BA3B8">${ic("plug",17)}</span>서비스 연결</button></div><div class="sugs" ${S.set.sugs===false?"hidden":""}>${(S.goccia?["블랙홀은 어떻게 생겨?","분수 나눗셈 쉽게 알려 줘","훈민정음은 누가 만들었어?"]:["훈민정음은 누가 만들었어?","독도는 어디에 있어?","이번 달 공휴일 알려 줘","광합성이 뭐야?"]).map(t=>`<button data-ask="${esc(t)}">${esc(t)}</button>`).join("")}</div>`}
<p class="disc">${discText(false)}</p></div></div>`);}
function curChat(){return S.chats.find(c=>c.id===S.cur);}
function vChat(){const c=curChat();if(!c){go(S.area==="code"?"code":"home");return "";}
const code=c.area==="code";
const msgs=c.msgs.map(m=>m.role==="user"?userMsg(m):aMsg(m,code)).join("");
const preview=code&&(S.preview||pvCur(c))?pvPanel(c):"";
const ag=c.agent&&agentById(c.agent);
const ttl=S.renameChat===c.id&&S.renameAt==="top"?`<form class="renamef top" data-rf="${c.id}"><input id="rnc" value="${esc(c.title)}" aria-label="새 대화 이름" maxlength="40"><button class="iconbtn" aria-label="저장">${ic("check",15)}</button></form>`:`<div class="ttlwrap"><button class="ttlbtn" data-cmenu="${c.id}" data-at="top" aria-label="대화 메뉴"><span class="tt">${ag?esc(ag.name)+" · ":""}${esc(c.title)}</span>${ic("down",14)}</button>${S.cmenu===c.id&&S.cmenuAt==="top"?chatMenu(c):""}</div>`;
return shell(`${topbar(ttl+(S.delChat===c.id?delConfirm(c):""),(c.temp?'<span class="tag" style="background:#1C2440;color:#fff">임시</span>':"")+(code?`<button class="btn sm" data-act="preview">${ic("eye",14)} 미리보기</button>`:(c.temp||S.goccia?"":`<button class="pill" data-act="share" data-id="${c.id}">${ic("share",14)}<span class="pl">공유</span></button>`)))}${S.share?shareModal():""}${S.pubTool&&S.pubKind==="html"&&pubItem("html",S.pubTool)?pubModal(pubItem("html",S.pubTool),"html"):""}<div style="display:flex;flex:1;min-height:0"><div style="display:flex;flex-direction:column;flex:1;min-width:0"><div class="scroll" id="sc"><div class="wrap thread">${msgs}</div></div>${code&&S.term?`<div class="wrap" style="padding:0 20px;width:100%">${termPanel()}</div>`:""}<div class="bottom"><div class="wrap" style="padding:0">${composer(code?"이어서 요청하세요":"더 물어보세요")}<p class="disc" style="margin:8px 0 0">${discText(code)}</p></div></div></div>${preview}</div>`);}
function shareModal(){const c=S.chats.find(x=>x.id===S.share);if(!c)return "";const on=!!c.shared&&!!c.shareId;const link=on?location.origin+"/s/"+c.shareId:"";const real=PATHMODE&&S.fb&&S.user&&S.user.uid;const n=c.msgs.filter(m=>!m.loading).length;
return `<div class="tempask" role="dialog" aria-label="대화 공유" data-act="shareClose"><div class="card sharecard" data-stop="1"><div class="row"><b style="font-size:17px">대화 공유</b><span class="grow"></span><button class="iconbtn" data-act="shareClose" aria-label="닫기">${ic("x",18)}</button></div>
<div class="shareprev"><b>${esc(c.title)}</b><span class="muted" style="font-size:12px">메시지 ${n}개${c.shareName?" · "+esc(S.user.name):""}</span><div class="um" style="font-size:12.5px;max-width:100%;align-self:flex-start">${esc((c.msgs[0]||{}).text||"")}</div></div>
${real?"":`<div class="note">${ic("info",16)}<span>공유 링크는 로그인한 실제 서비스에서만 만들어져요.</span></div>`}
<div class="seg">${[["off","나만 보기"],["on","링크가 있는 사람"]].map(x=>`<button aria-pressed="${(x[0]==="on")===on}" data-shareset="${x[0]}" ${S.shareBusy?"disabled":""}>${x[1]}</button>`).join("")}</div>
${on?`<div class="row"><input readonly value="${link}" id="shareLink" aria-label="공유 링크" style="font:13px var(--mono)"><button class="btn sm pri" data-act="copy" data-text="${link}">${ic("copy",14)} 복사</button></div>
<div class="prow" style="padding:6px 0"><span class="grow" style="font-size:13px">출처 카드 함께 보여 주기</span><button class="switch" role="switch" aria-checked="${c.shareSrc!==false}" data-sharesrc="1"></button></div>
<div class="prow" style="padding:6px 0;border:0"><span class="grow" style="font-size:13px">내 이름 표시</span><button class="switch" role="switch" aria-checked="${!!c.shareName}" data-sharename="1"></button></div>
${audBlock({id:c.id,emails:c.emails},"share")}
<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="shareUpdate" ${S.shareBusy?"disabled":""}>${ic("refresh",14)} 지금 대화로 업데이트</button></div>
<span class="muted" style="font-size:12px">링크를 받은 사람은 공유한 대화를 읽기만 할 수 있어요(로그인 필요 없음). 공유한 뒤에 보낸 메시지는 ‘업데이트’를 눌러야 반영돼요. ‘이메일로 지정한 사람’을 고르면 그 주소로 로그인한 사람만 열 수 있고, 바꾼 뒤에는 ‘업데이트’를 눌러 주세요. 나만 보기로 바꾸면 링크가 사라져요.</span>`:`<span class="muted" style="font-size:12.5px">지금은 나만 볼 수 있어요. "링크가 있는 사람"을 고르면 이 대화의 읽기 전용 링크가 만들어져요. 링크를 아는 사람은 누구나 볼 수 있으니 개인정보가 없는지 확인해 주세요.</span>`}</div></div>`;}
/* ---------- 코드 미리보기 ---------- */
const PV_BRIDGE='<script>(function(){function f(x){try{if(typeof x==="string")return x;if(x instanceof Error)return x.stack||x.message;return JSON.stringify(x)}catch(e){return String(x)}}function s(t,a){try{parent.postMessage({lagoPv:1,t:t,m:a.map(f).join(" ").slice(0,600)},"*")}catch(e){}}["log","info","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){s(k,[].slice.call(arguments));try{o.apply(console,arguments)}catch(e){}}});addEventListener("error",function(e){s("error",[(e.message||"오류")+(e.lineno?" (줄 "+e.lineno+")":"")])});addEventListener("unhandledrejection",function(e){s("error",["Promise 오류: "+f(e.reason&&e.reason.message||e.reason)])});})()<\/script>';
function pvFences(t){const out=[];const re=/```([\w+-]*)[ \t]*\n([\s\S]*?)```/g;let m;while((m=re.exec(String(t||"")))){out.push({lang:(m[1]||"").toLowerCase(),code:m[2].replace(/\n$/,"")});}return out;}
function pvIsHtml(c){return /<(!doctype|html|body|head|div|script|style|h1|h2|p|canvas|svg|button|input|form|main|section|header|ul|table)\b/i.test(c)&&c.trim().length>=20;}
function pvItems(plain){const f=pvFences(plain);const css=f.filter(x=>x.lang==="css").map(x=>x.code).join("\n");const js=f.filter(x=>/^(js|javascript|mjs)$/.test(x.lang)).map(x=>x.code).join("\n");
const hs=f.filter(x=>(x.lang==="html"||x.lang==="htm"||x.lang==="")&&pvIsHtml(x.code)&&!/^\s*<svg\b/i.test(x.code));const items=[];
hs.forEach(h=>{let d=h.code,cu=false,ju=false;
d=d.replace(/<link\b[^>]*>/gi,tag=>{if(/stylesheet/i.test(tag)&&/href=["'](?!https?:|\/\/|data:)[^"']+["']/i.test(tag)&&css&&!cu){cu=true;return`<style>\n${css}\n</style>`;}return tag;});
d=d.replace(/<script\b[^>]*\bsrc=["'](?!https?:|\/\/)[^"']+["'][^>]*>\s*<\/script>/gi,()=>{if(js&&!ju){ju=true;return`<script>\n${js}\n<\/script>`;}return"";});
if(css&&!cu&&!/<style[\s>]/i.test(d)){cu=true;d=/<\/head>/i.test(d)?d.replace(/<\/head>/i,`<style>\n${css}\n</style></head>`):`<style>\n${css}\n</style>\n`+d;}
if(js&&!ju&&!/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?\S[\s\S]*?<\/script>/i.test(d)){ju=true;d=/<\/body>/i.test(d)?d.replace(/<\/body>/i,`<script>\n${js}\n<\/script></body>`):d+`\n<script>\n${js}\n<\/script>`;}
items.push({kind:"html",doc:d,raw:h.code});});
if(!items.length){const sv=f.find(x=>x.lang==="svg"||/^\s*<svg\b/i.test(x.code));
if(sv)items.push({kind:"svg",doc:`<!doctype html><meta charset="utf-8"><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#fff">${sv.code}</body>`,raw:sv.code});
else if(css||js)items.push({kind:"js",doc:`<!doctype html><meta charset="utf-8"><body style="font:15px system-ui;padding:16px"><div id="app"></div>${css?`<style>\n${css}\n</style>`:""}${js?`<script>\n${js}\n<\/script>`:""}</body>`,raw:[css,js].filter(Boolean).join("\n\n")});
else{const md=f.find(x=>x.lang==="markdown"||x.lang==="md");if(md&&typeof RICH==="function")items.push({kind:"md",doc:`<!doctype html><meta charset="utf-8"><body style="font:15px/1.7 system-ui;max-width:720px;margin:0 auto;padding:20px;color:#1b2540">${RICH(md.code)}</body>`,raw:md.code});}}
return items;}
function pvVersions(c){const v=[];if(!c)return v;for(const m of c.msgs){if(m.role==="user"||m.loading)continue;pvItems(m.plain).forEach((it,i)=>v.push({...it,mid:m.id,i}));}return v;}
function pvCur(c){const v=pvVersions(c);if(!v.length)return null;const k=S.pv&&S.pv.ver!=null&&S.pv.ver<v.length?S.pv.ver:v.length-1;return{list:v,k,it:v[k]};}
function pvSrc(doc){const b=PV_BRIDGE;if(/<head[^>]*>/i.test(doc))return doc.replace(/<head[^>]*>/i,x=>x+b);if(/<html[^>]*>/i.test(doc))return doc.replace(/<html[^>]*>/i,x=>x+b);if(/<!doctype[^>]*>/i.test(doc))return doc.replace(/<!doctype[^>]*>/i,x=>x+b);return b+doc;}
function pvConLine(e){return`<div class="pvl ${e.t}"><b>${e.t==="error"?"오류":e.t==="warn"?"경고":"로그"}</b><span>${esc(e.m)}</span></div>`;}
function pvConBody(){const q=S.pv.con;return q.length?q.slice(-60).map(pvConLine).join(""):`<p class="muted" style="margin:0;font-size:12px">console.log 와 오류가 여기에 나와요.</p>`;}
function pvPanel(c){const cur=pvCur(c);const pv=S.pv=S.pv||{tab:"view",size:"full",con:[],conOpen:false,ver:null};
if(!cur)return `<aside class="preview ${S.preview?"open":""}" aria-label="미리보기"><div class="bar2"><span class="chip plain grow" style="justify-content:flex-start">미리보기</span><button class="iconbtn" data-act="preview" aria-label="미리보기 닫기">${ic("x",16)}</button></div><div class="stage"><p class="muted" style="margin:auto;padding:24px;text-align:center;font-size:13px">아직 미리 볼 코드가 없어요.<br>“할 일 앱 화면을 HTML로 만들어 줘”처럼 요청해 보세요.<br><span style="font-size:12px">HTML · CSS · JS 코드 블록을 합쳐서 보여 줘요.</span></p></div></aside>`;
const it=cur.it,n=cur.list.length,errN=pv.con.filter(x=>x.t==="error").length;const name=it.kind==="html"?"index.html":it.kind==="svg"?"image.svg":it.kind==="md"?"문서.md":"script.js";
const sz=(k,l,i)=>`<button class="iconbtn ${pv.size===k?"on":""}" data-act="pvSize" data-s="${k}" aria-label="${l}" title="${l}">${ic(i,15)}</button>`;
const view=`<div id="pvview" class="pvview" ${pv.tab==="view"?"":"hidden"}><div class="stage pvs-${pv.size}" id="pvstage"><iframe id="pvf" title="미리보기" sandbox="allow-scripts allow-forms allow-modals allow-popups" srcdoc="${esc(pvSrc(it.doc))}"></iframe></div>
<div class="pvcon" id="pvconw"><button class="pvch" data-act="pvCon">${ic("term",13)}<b>콘솔</b><span class="pvn" id="pvn" ${pv.con.length?"":"hidden"}>${pv.con.length}</span><span class="pvn bad" id="pvbad" ${errN?"":"hidden"}>오류 ${errN}</span><span class="grow"></span><span class="muted" id="pvct" style="font-size:11.5px">${pv.conOpen?"접기":"펼치기"}</span></button><div class="pvcb" id="pvcb" ${pv.conOpen?"":"hidden"}>${pvConBody()}</div><div class="row pvcf" id="pvcf" ${pv.conOpen?"":"hidden"}><button class="btn sm" data-act="pvClr">지우기</button><button class="btn sm pri" data-act="pvFix" ${errN?"":"disabled"}>${ic("spark",13)} 오류 고쳐 달라고 하기</button></div></div></div>
<div class="stage" id="pvcodeS" ${pv.tab==="code"?"":"hidden"}><div class="pvcode"><div class="row" style="gap:8px;margin-bottom:8px"><b style="font-size:13px" class="grow">${name}</b><button class="btn sm" data-act="pvCopy">${ic("copy",13)} 복사</button>${DESK?`<button class="btn sm" data-act="pvSave">${ic("download",13)} 저장</button>`:""}</div><pre><code>${esc(it.doc)}</code></pre></div></div>`;
return `<aside class="preview ${S.preview?"open":""}" aria-label="미리보기"><div class="bar2"><div class="seg" style="width:auto" id="pvseg"><button aria-pressed="${pv.tab==="view"}" data-act="pvTab" data-t="view">${ic("eye",13)} 미리보기</button><button aria-pressed="${pv.tab==="code"}" data-act="pvTab" data-t="code">${ic("code",13)} 코드</button></div>${n>1?`<span class="pvver"><button class="iconbtn" data-act="pvVer" data-d="-1" ${cur.k<=0?"disabled":""} aria-label="이전 버전">${ic("left",14)}</button><span>${cur.k+1}/${n}</span><button class="iconbtn" data-act="pvVer" data-d="1" ${cur.k>=n-1?"disabled":""} aria-label="다음 버전" style="transform:scaleX(-1)">${ic("left",14)}</button></span>`:""}<span class="grow"></span><span class="pvtools" id="pvtools" ${pv.tab==="view"?"":"hidden"}>${sz("full","전체 너비","monitor")+sz("tablet","태블릿 768","grid")+sz("phone","모바일 390","phone")}<button class="iconbtn" data-act="pvReload" aria-label="새로고침" title="새로고침 (처음부터 다시 실행)">${ic("refresh",15)}</button><button class="iconbtn" data-act="pvFull" aria-label="전체 화면" title="전체 화면">${ic("panel",15)}</button></span><button class="iconbtn" data-act="hpubLast" aria-label="링크로 공개" title="링크로 공개">${ic("share",15)}</button><button class="iconbtn" data-act="preview" aria-label="미리보기 닫기">${ic("x",16)}</button></div>${view}</aside>${pv.full?`<div class="pvfull"><button class="btn sm pvx" data-act="pvFull">${ic("x",14)} 닫기</button><iframe title="전체 화면 미리보기" sandbox="allow-scripts allow-forms allow-modals allow-popups" srcdoc="${esc(pvSrc(it.doc))}"></iframe></div>`:""}`;}
window.addEventListener("message",e=>{const d=e.data;if(!d||!d.lagoPv||!S||!S.pv)return;const f=document.getElementById("pvf");if(!f||e.source!==f.contentWindow)return;
S.pv.con.push({t:d.t==="info"?"log":d.t,m:String(d.m||"")});if(S.pv.con.length>200)S.pv.con.shift();
const n=document.getElementById("pvn"),b=document.getElementById("pvbad"),cb=document.getElementById("pvcb");const errN=S.pv.con.filter(x=>x.t==="error").length;
if(n){n.hidden=false;n.textContent=S.pv.con.length;}if(b){b.hidden=!errN;b.textContent="오류 "+errN;}
if(cb){cb.innerHTML=pvConBody();cb.scrollTop=cb.scrollHeight;}const fx=document.querySelector('[data-act="pvFix"]');if(fx&&errN)fx.disabled=false;});
function lastHtml(c){const v=pvVersions(c).filter(x=>x.kind==="html");return v.length?v[v.length-1].doc:"";}
function htmlBlocks(t){t=String(t||"");const out=[];const re=/```[a-z]*[ \t]*\n([\s\S]*?)```/gi;let m;while((m=re.exec(t))){const c=m[1].trim();if(/<(!doctype|html|body|head|div|script|style|h1|h2|p|canvas|svg)\b/i.test(c)&&c.length>=20)out.push(c);}
if(!out.length&&/^\s*(<!doctype html|<html)/i.test(t))out.push(t.trim());return out;}
function htmlCards(m){return pvItems(m.plain).filter(x=>x.kind==="html").map((it,i)=>{const c=it.doc;const k=m.id+"_"+i,open=S.hprev&&S.hprev[k];return `<div class="card" style="padding:12px 14px;display:grid;gap:10px;margin:10px 0 0;max-width:640px"><div class="row" style="gap:8px;flex-wrap:wrap"><span class="svcico" style="background:#4A5FA8;width:30px;height:30px">${ic("code",15)}</span><b class="grow" style="min-width:120px;font-size:14px">HTML 페이지 · ${Math.max(1,Math.round(c.length/1024))}KB</b><button class="btn sm" data-act="hprev" data-hk="${k}">${ic("eye",14)} ${open?"미리보기 닫기":"미리보기"}</button><button class="btn sm pri" data-act="hpub" data-mid="${m.id}" data-i="${i}">${ic("share",14)} 링크로 공개</button></div>${open?`<iframe title="미리보기" sandbox="allow-scripts" srcdoc="${esc(pvSrc(c))}" style="width:100%;height:320px;border:1px solid var(--line);border-radius:10px;background:#fff"></iframe>`:""}</div>`;}).join("");}
function hpubStart(m,i){const code=(pvItems(m.plain).filter(x=>x.kind==="html")[i]||{}).doc;if(!code){toast("공개할 HTML을 찾지 못했어요");return;}const c=curChat();let h=(S.myHtml||[]).find(x=>x.code===code);if(!h){const tm=/<title[^>]*>([^<]{1,40})/i.exec(code);h={id:"h"+Date.now().toString(36),title:(tm&&tm[1].trim())||(c&&c.title)||"내 페이지",code};S.myHtml=[h,...(S.myHtml||[])];save();}S.pubKind="html";S.aud=null;S.pubTool=h.id;render();}
function aMsg(m,code){if(m.loading)return `<div class="am"><div class="who">${WM(12)}</div><span class="status think" data-think="${code?"c":"t"}">${ic(code?"brain":"globe",14)} <span class="tstage">${code?"생각하는 중":"자료 찾는 중"}</span> <span class="tsec"></span> <span class="typing"><i></i><i></i><i></i></span></span>${code?"":`<div class="peek" data-peek hidden></div>`}</div>`;
const fb=`<div class="acts"><button data-act="copy" data-text="${esc(m.plain||"")}" aria-label="복사">${ic("copy",16)}</button><button data-act="like" aria-pressed="${m.like===1}" data-mid="${m.id}" aria-label="좋아요">${ic("thumb",16)}</button><button data-act="dislike" aria-pressed="${m.like===-1}" data-mid="${m.id}" aria-label="별로예요"><svg class="ic" viewBox="0 0 24 24" width="16" height="16" style="transform:rotate(180deg)">${P.thumb}</svg></button><span>${esc(m.meta||"")}</span></div>`;
return `<div class="am"><div class="who">${WM(12)}</div>${m.html?m.html.replace(/@MID@/g,m.id):`<p class="answer">${esc(m.plain||"").replace(/\n/g,"<br>")}</p>`}${htmlCards(m)}${fb}</div>`;}
function answerFor(q,agent){const t=q.replace(/\s/g,"");
if(S.goccia&&/죽고싶|자해|괴롭힘|때려|학대|무서워/.test(t))return{html:`<p class="answer">힘든 일이 있었구나. 혼자 견디지 않아도 돼. 믿을 수 있는 어른에게 꼭 이야기해 줘.<br>지금 바로 이야기하고 싶으면 <b>청소년상담 1388</b>(전화 1388, 문자 #1388)에서 언제든 들어 줘.</p>`,plain:"청소년상담 1388",meta:"도움 안내"};
if(S.goccia&&(S.study||S.kStudy===true))return{html:`<span class="status">${ic("book",14)} 공부 모드</span><p class="answer">좋아, 답을 바로 말해 주는 대신 같이 풀어 보자! 🙂<br><b>1단계</b> 문제에서 무엇을 묻는지 한 줄로 말해 볼래?<br>그다음에 내가 힌트를 하나씩 줄게.</p>`,plain:"공부 모드",meta:"공부 모드"};
const live=!!S.api;
const miss=live?"위키백과에서 관련 문서를 찾지 못했어요. 질문을 더 짧은 단어로 바꿔 보거나 ‘~가 뭐야?’처럼 물어봐 주세요.":"이 화면에서는 서버에 연결되어 있지 않아서 답을 찾을 수 없어요.";
if(/^(안녕|하이|헬로)|^(hello|hi)\b/i.test(q.trim()))return{html:`<p class="answer">안녕하세요! 저는 LAGO예요. 궁금한 걸 물어보세요.</p><p class="muted" style="margin:0;font-size:13px">모델 서버가 켜져 있으면 Fonte가 자료를 찾아 풀어서 답해요.</p>`,plain:"인사",meta:modeOf(S.mode).lab};
if(S.goccia)return{html:`<p class="answer">${live?"위키백과에서 찾지 못했어. 다른 말로 물어봐 줄래?":"좋은 질문이야! 지금은 서버에 연결되지 않아서 답할 수 없어."}</p><p class="muted" style="margin:0;font-size:13px">LAGO는 위키백과에서 찾아서 쉽게 알려 줘.</p>`,plain:"찾지 못함",meta:modeOf(S.mode).lab};
if(agent)return{html:`<span class="status">${ic(agent.ic,14)} ${esc(agent.name)} MODE</span><p class="answer">${S.api&&S.api.model?"로그인하면 MODE가 지시문대로 답해요.":"모델 서버가 지금 꺼져 있어서 MODE가 답할 수 없어요. 서버가 켜지면 바로 돼요."}</p>${agent.ins?`<p class="muted" style="margin:0;font-size:12.5px">저장된 지시문: ${esc(agent.ins.slice(0,120))}${agent.ins.length>120?"…":""}</p>`:""}`,plain:"MODE는 베타",meta:agent.mode+" 1.0"};
return{html:`<p class="answer">${miss}</p><p class="muted" style="margin:0;font-size:13px">모델 서버가 꺼져 있을 때는 위키백과와 공공데이터(공휴일)로만 답해요.</p>`,plain:"찾지 못함",meta:S.mode+" 1.0"};}
function codeAnswer(q){return{html:`<span class="status">${ic("brain",14)} 코드</span><p class="answer">코드를 써 주고 고쳐 주는 기능은 코드 모델(Spruzzo · Corrente)이 연결되는 <b>베타</b> 때 열려요.</p><p class="muted" style="margin:0;font-size:13px">모델 없이 가짜 코드를 보여 드리지 않으려고 지금은 닫아 두었어요.</p>`,plain:"코드는 베타",meta:"코드 · 베타"};}
function todoApp(){return `<div class="todo"><h3>오늘 할 일</h3><form id="todoForm"><input type="text" id="todoIn" placeholder="할 일을 입력하세요" aria-label="할 일"><button class="addb" type="submit">+ 추가</button></form>${S.todos.map((t,i)=>`<label><input type="checkbox" data-todo="${i}" ${t.d?"checked":""}><span class="${t.d?"done":""}">${esc(t.t)}</span></label>`).join("")}<small style="color:#8A8AA0">남은 할 일 ${S.todos.filter(t=>!t.d).length}개</small></div>`;}
/* ---------- live API (Cloudflare Worker: /api/*) ---------- */
/* ---------- Firebase (Auth + Firestore) : 설정은 /api/config 의 FIREBASE_CONFIG 시크릿에서 받아요 ---------- */
const FB_V="10.12.2",FB_CDN="https://cdnjs.cloudflare.com/ajax/libs/firebase/"+FB_V+"/";
const loadScript=u=>new Promise((ok,no)=>{const e=document.createElement("script");e.src=u;e.onload=ok;e.onerror=no;document.head.appendChild(e);});
async function initFirebase(cfg){try{
await loadScript(FB_CDN+"firebase-app-compat.min.js");await Promise.all([loadScript(FB_CDN+"firebase-auth-compat.min.js"),loadScript(FB_CDN+"firebase-firestore-compat.min.js")]);
const app=firebase.initializeApp(cfg);S.fb={auth:firebase.auth(),db:firebase.firestore()};
S.fb.auth.languageCode="ko";
S.fb.auth.onAuthStateChanged(async u=>{
 if(!u){store.del("lago_fbhint");S.booting=false;if(S.unsub){S.unsub();S.unsub=null;}if(S.user&&S.user.uid){S.user=null;S.banned=null;S.chats=[];S.cur=null;go("login");}render();return;}
 store.set("lago_fbhint",1);let d={};try{const snap=await S.fb.db.doc("users/"+u.uid+"/data/main").get();if(snap.exists)d=snap.data();}catch(e){toast("저장된 데이터를 불러오지 못했어요 (Firestore 규칙을 확인해 주세요)");}
 S.user={uid:u.uid,email:u.email,name:d.name||u.displayName||(u.email||"").split("@")[0],plan:d.plan||"Free",planBase:d.plan||"Free",verified:!!u.emailVerified};
 PKEYS.forEach(k=>{if(d[k]!=null)S[k]=d[k];});syncReq();S.chats=d.chats||[];S.myAgents=d.myAgents||[];S.favs=d.favs||[];if(d.pinned)S.pinned=d.pinned;S.learn=d.learn!==false;S.learnImg=d.learnImg!==false;if(d.mode&&TALK_MODES.some(m=>m.id===d.mode))S.mode=d.mode;if(d.think!=null)S.think=d.think;
 if(!snap_exists(d)&&!S.signingUp)fbSave(true);
 if(S.unsub)S.unsub();S.unsub=S.fb.db.doc("users/"+u.uid+"/data/main").onSnapshot(sn=>{if(!sn.exists||sn.metadata.hasPendingWrites||fbT)return;const x=sn.data();const before=pendingReq();let ch=false;PKEYS.forEach(k=>{if(x[k]!=null&&JSON.stringify(S[k])!==JSON.stringify(x[k])){S[k]=x[k];ch=true;}});if(ch){syncReq();render();if(!S.goccia&&pendingReq()>before)toast("지우가 시간을 더 요청했어요");}});
 S.booting=false;const r=route();if(["login","join","verify","kid"].includes(r)||!r){if(PATHMODE&&S.after&&S.after!=="/login"){const a=S.after;S.after=null;history.replaceState(null,"",a);render();}else go("home",true);}else render();meCheck();});
}catch(e){bootDone();S.fbErr=true;S.fbErrMsg=String((e&&(e.code||e.message))||"").slice(0,80)||(e&&e.type==="error"?"스크립트 로드 실패":"");render();toast("Firebase를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.");}}
const snap_exists=d=>d&&Object.keys(d).length>0;
let fbT=null;
function fbSave(now){if(!S.fb||!S.user||!S.user.uid)return;syncTasks();clearTimeout(fbT);const run=()=>{fbT=0;const data=JSON.parse(JSON.stringify({name:S.user.name,plan:S.user.planBase||S.user.plan||"Free",myAgents:S.myAgents,favs:S.favs,pinned:S.pinned,chats:slimChats(S.chats.filter(c=>!c.temp&&!c.kid),700000),learn:S.learn,learnImg:S.learnImg,mode:S.mode,think:S.think,...pk(),updated:Date.now()}));S.fb.db.doc("users/"+S.user.uid+"/data/main").set(data).catch(()=>toast("저장하지 못했어요. 인터넷이나 Firestore 규칙을 확인해 주세요."));};now?run():fbT=setTimeout(run,800);}
function fbDiag(){if(!PATHMODE)return "";let m="";if(S.fbErr)m="Firebase를 불러오지 못했어요"+(S.fbErrMsg?" ("+S.fbErrMsg+")":"")+". 인터넷이나 광고 차단 설정을 확인하고 새로고침해 주세요. 계속되면 FIREBASE_CONFIG의 값(JSON 형식·apiKey)을 확인해 주세요.";else if(!S.apiTried)m="";else if(!S.api)m="서버(/api/config)에 연결하지 못했어요. 잠시 뒤 새로고침해 주세요. 계속되면 Worker 배포가 실패했을 수 있어요.";else if(!S.api.firebase)m="서버에 Firebase 설정(FIREBASE_CONFIG)이 없어서 지금은 로그인할 수 없어요. 관리자가 Cloudflare Worker의 변수·비밀에 FIREBASE_CONFIG를 넣어야 해요.";else if(S.api.firebase.error)m=S.api.firebase.error;else if(!S.fb&&!S.booting)m="Firebase에 연결하는 중이에요…";return m?`<div class="note" role="alert" style="border-color:#F0B8B3">${ic("info",16)}<span>${esc(m)}</span></div>`:"";}
function fbBlock(){if(!(PATHMODE&&S.api&&S.api.firebase&&!S.api.firebase.error&&S.api.firebase.apiKey)||S.fb)return "";return S.fbErr?"Firebase에 연결하지 못했어요"+(S.fbErrMsg?" ("+S.fbErrMsg+")":"")+". 새로고침한 뒤 다시 해 주세요.":"Firebase에 연결하는 중이에요. 1~2초 뒤에 다시 눌러 주세요.";}
const fbMsg=e=>({"auth/user-disabled":"이용이 정지된 계정이에요. 문의가 필요하면 관리자에게 연락해 주세요.","auth/invalid-credential":"이메일이나 비밀번호가 맞지 않아요.","auth/wrong-password":"비밀번호가 맞지 않아요.","auth/user-not-found":"이 이메일로 만든 비밀번호 계정이 없어요. Google로 가입했다면 위의 ‘Google로 계속하기’를 눌러 주세요. 처음이라면 회원가입을 해 주세요.","auth/email-already-in-use":"이미 가입된 이메일이에요. 로그인해 주세요.","auth/weak-password":"비밀번호가 너무 약해요. 영문과 숫자를 섞어 8자 이상으로 해 주세요.","auth/too-many-requests":"시도가 너무 많아요. 잠시 뒤에 다시 해 주세요.","auth/popup-closed-by-user":"Google 창이 닫혔어요.","auth/cancelled-popup-request":"Google 창이 닫혔어요.","auth/unauthorized-domain":"이 주소가 Firebase 승인된 도메인에 없어요. Authentication → 설정 → 승인된 도메인에 추가해 주세요.","auth/network-request-failed":"인터넷 연결을 확인해 주세요.","auth/operation-not-allowed":"이 로그인 방법이 Firebase에서 꺼져 있어요.","auth/invalid-email":"이메일 주소를 확인해 주세요."}[e&&e.code]||"로그인하지 못했어요. ("+((e&&e.code)||"알 수 없음")+")");
async function loadApi(){if(!/^https?:$/.test(location.protocol))return;try{const r=await fetch("/api/config",{cache:"no-store"});if(!r.ok)return;const c=await r.json();if(c&&c.wiki){S.api=c;if(c.firebase&&!c.firebase.error&&c.firebase.apiKey)initFirebase(c.firebase);}}catch(e){}S.apiTried=true;render();}
const srcCard=(n,title,host,url)=>`<${url?`a class="src" href="${esc(url)}" target="_blank" rel="noopener"`:'div class="src"'} style="text-decoration:none;color:inherit"><span class="n">${n}</span><span class="grow"><b style="font-weight:500">${esc(title)}</b><br><span class="muted" style="font-size:11.5px">${esc(host)}</span></span>${url?ic("ext",14):""}</${url?"a":"div"}>`;
const modelOn=()=>!!(S.api&&S.api.model&&S.fb&&S.fb.auth.currentUser&&!S.goccia);
async function modelCall(p){try{const tok=await S.fb.auth.currentUser.getIdToken();const r=await fetch("/api/chat",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+tok},body:JSON.stringify(S.lang==="en"?{...p,lang:"en"}:p)});const d=await r.json().catch(()=>({}));return{ok:r.ok,status:r.status,d};}catch(e){return{ok:false,status:0,d:{}};}}
const modelNote='<p class="muted" style="margin:8px 0 0;font-size:12.5px">Fonte 모델이 답했어요. 이 작업은 따로 학습하지 않아서 틀릴 수 있으니 중요한 내용은 확인해 주세요.</p>';
async function agentLive(text,ag){const r=await modelCall({task:"agent",q:text,agent:{name:ag.name,instructions:ag.ins||ag.desc||""},model:ag.model||undefined});
if(r.ok&&r.d.answer)return{html:`<span class="status">${ic(ag.ic||"bot",14)} ${esc(ag.name)} MODE</span><div class="answer rich">${RICH(r.d.answer)}</div>${modelNote}`,plain:r.d.answer,meta:ag.name};
if(r.status===429||r.status===403)return{html:`<p class="answer">${esc(r.d.error||"지금은 답할 수 없어요")}</p>`,plain:r.d.error||"",meta:ag.name};return null;}
function peekSet(t){document.querySelectorAll("[data-peek]").forEach(e=>{e.innerHTML=t;e.hidden=!t;});}
function stageSet(t){document.querySelectorAll("[data-think] .tstage").forEach(e=>e.textContent=t);}
/* ---------- 관리자 슬래시 명령: /mode_change /update /chatdata ---------- */
const ADMCMD=/^\/(mode_change|update|chatdata)\b/i;
async function admApi(path,body){const tk=await S.fb.auth.currentUser.getIdToken();const r=await fetch("/api/admin/"+path,{method:body?"POST":"GET",headers:{authorization:"Bearer "+tk,...(body?{"content-type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:"no-store"});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||("오류 "+r.status));return d;}
function admModelHtml(d,note){const rows=d.versions.map(v=>`<button class="btn sm" style="justify-content:flex-start;gap:10px;width:100%;${v.active?"border-color:var(--blue)":""}" data-act="admver" data-v="${esc(v.id)}"${v.loaded||v.active?"":""}><b style="font-family:monospace">${v.active?"[V]":"[ ]"}</b> ${esc(v.label)} <span class="muted" style="font-size:12px">${esc(v.note)}${d.server?(v.loaded?" · 서버에 올라와 있어요":" · 서버에 없어요"):""}</span></button>`).join("");
return `<p class="answer"><b>모델 선택</b> — 누르면 바로 바뀌어요</p><div style="display:grid;gap:8px;max-width:420px;margin:8px 0">${rows}</div><p class="muted" style="font-size:13px">${d.server?"":esc(d.msg||"서버에 연결하지 못했어요")+"<br>"}${note?esc(note)+"<br>":""}새 버전 파일은 태블릿에서 <code>bash ~/lago.sh update</code> 후 /update 를 입력하면 반영돼요.</p>`;}
async function admCmd(text,am){const cmd=text.trim().toLowerCase().split(/\s+/)[0];const fin=(html,plain)=>{am.loading=false;am.html=html;am.plain=plain||"";am.meta="관리자 명령";save();render();};
try{
if(cmd==="/mode_change"){const d=await admApi("model");fin(admModelHtml(d),"모델 선택");}
else if(cmd==="/update"){const d=await admApi("model",{reload:true});const a=d.versions.find(v=>v.active);fin(`<p class="answer"><b>모델을 다시 불러왔어요</b><br>쓰는 버전: ${esc(a?a.label:d.selected)}<br>서버에 올라온 버전: ${esc(d.versions.filter(v=>v.loaded).map(v=>v.label).join(", ")||"없음")}</p>`,"다시 불러옴");}
else{const d=await admApi("chatdata?n=20");const kst=t=>new Date(t+9*3600e3).toISOString().slice(5,16).replace("T"," ");
const rows=d.items.map(x=>`<details style="border-top:1px solid var(--line,#e5e7eb);padding:8px 0"><summary style="cursor:pointer"><span class="muted" style="font-size:12px">${kst(x.t)} · ${(x.ms/1000).toFixed(1)}초 · ${esc(x.ver||"")}${x.news?" · 뉴스":""}</span><br><b>${esc(x.q)}</b></summary><div style="white-space:pre-wrap;margin:6px 0 0;font-size:14px">${esc(x.a)}</div></details>`).join("");
fin(`<p class="answer"><b>최근 대화 ${d.items.length}개</b> <span class="muted" style="font-size:12px">(질문 · 답 · 걸린 시간, 14일 뒤 지워져요)</span></p>${d.items.length?rows:'<p class="muted">아직 기록이 없어요. 이 기능을 켠 뒤의 대화부터 쌓여요.</p>'}`,"대화 기록");}
}catch(e){fin(`<p class="answer">명령을 실행하지 못했어요: ${esc(e.message||e)}</p>`,"오류");}}
async function liveAnswer(q,hist,ctx,mo){try{
if(S.api.model)fetch("/api/wiki?q="+encodeURIComponent(q)).then(r=>r.json()).then(d=>{if(d&&d.found)peekSet("위키백과에서 찾음: "+d.results.slice(0,3).map(x=>"<b>"+esc(x.title)+"</b>").join(" · ")+"");}).catch(()=>{});
if(S.api.publicData&&/공휴일|휴일|쉬는\s*날|빨간\s*날/.test(q)){const m=q.match(/(\d{1,2})\s*월/),y=q.match(/(20\d{2})\s*년/);const now=new Date();const yy=y?y[1]:now.getFullYear(),mm=m?m[1]:now.getMonth()+1;
const r=await fetch(`/api/holidays?year=${yy}&month=${mm}`);const d=await r.json();if(!r.ok)throw 0;
const list=d.items.length?`<ul style="margin:6px 0 0;padding-left:20px">${d.items.map(i=>`<li>${i.date.slice(4,6)*1}월 ${i.date.slice(6)*1}일 · ${esc(i.name)}</li>`).join("")}</ul>`:"<br>이 달에는 공휴일이 없어요.";
return{html:`<span class="status">${ic("globe",14)} 공공데이터 1개 찾음</span><p class="answer">${yy}년 ${mm}월 공휴일이에요 <span class="cite">[1]</span>.${list}</p><div class="srcs">${srcCard(1,"한국천문연구원 특일 정보","공공데이터포털 · data.go.kr","https://www.data.go.kr")}</div>`,plain:`${yy}년 ${mm}월 공휴일 ${d.items.length}개`,meta:modeOf(S.mode).lab+" · 공공데이터"};}
if(S.api.model&&S.fb&&S.fb.auth.currentUser){try{const tok=await S.fb.auth.currentUser.getIdToken();const cr=await fetch("/api/chat",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+tok},body:JSON.stringify({lang:S.lang==="en"?"en":undefined,q,hist,stream:true,ctx:ctx||undefined,mcpOk:mo&&mo.ok&&mo.ok.length?mo.ok:undefined,mcpNo:mo&&mo.no&&mo.no.length?mo.no:undefined})});let cd;
if((cr.headers.get("content-type")||"").includes("ndjson")&&cr.body){cd={error:"끊겼어요"};const rd=cr.body.getReader(),dc=new TextDecoder();let bf="";for(;;){const {done,value}=await rd.read();if(value)bf+=dc.decode(value,{stream:true});let i;while((i=bf.indexOf("\n"))>=0){const ln=bf.slice(0,i).trim();bf=bf.slice(i+1);if(!ln)continue;let m;try{m=JSON.parse(ln);}catch(e){continue;}
if(m.t==="refs"){stageSet(m.refs.length?"자료 "+m.refs.length+"개 읽는 중":"자료 없이 답하는 중");peekSet(m.refs.length?"찾은 자료: "+m.refs.slice(0,4).map(x=>"<b>"+esc(x.db)+"</b> "+esc((x.title||"").slice(0,18))).join(" · ")+(m.refs.length>4?" 외 "+(m.refs.length-4)+"개":""):"찾은 자료가 없어요");}
else if(m.t==="done"||m.t==="pending")cd=m;else if(m.t==="error")cd={error:m.error};}if(done)break;}
if(!cd.answer&&!cd.pending)throw new Error(cd.error);}
else cd=await cr.json();
if(cr.ok&&cd.pending){const pd=cd.pending,ok=(mo&&mo.ok)||[],no=(mo&&mo.no)||[];return{html:`<span class="status">${ic("plug",14)} 도구를 쓰려면 허락이 필요해요</span><div class="card permcard"><div class="row" style="gap:8px;flex-wrap:wrap"><b>${esc(pd.server)} · ${esc(pd.tool.split("/").slice(1).join("/"))}</b>${(pd.risk||[]).length?`<span class="tag" style="background:#FDECEA;color:#B42318">주의</span>`:""}</div>${pd.desc?`<p class="muted" style="margin:0;font-size:13px">${esc(pd.desc)}</p>`:""}<div class="muted" style="font-size:12.5px">보낼 값</div><pre class="codeb" style="margin:0">${esc(JSON.stringify(pd.args||{},null,2).slice(0,600))}</pre><span style="font:12px var(--mono);color:var(--mut)">서버 ${esc(pd.host)}</span>${(pd.risk||[]).map(r=>`<span style="font-size:12.5px;color:#B42318">⚠ ${esc(r)}</span>`).join("")}<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm pri" data-act="mcpApprove" data-v="once" data-mid="@MID@">이번만 허용</button><button class="btn sm" data-act="mcpApprove" data-v="always" data-mid="@MID@">항상 허용</button><button class="btn sm" data-act="mcpApprove" data-v="no" data-mid="@MID@">거절</button></div></div>`,plain:"도구 허락 대기",meta:"허락 필요",pend:{q,hist,ctx,ok,no,call:{tool:pd.tool,args:pd.args||{}}}};}
if(cr.ok&&cd.answer){const body=RICH(cd.answer);const lab=x=>x.db||"위키백과",card=x=>srcCard(x.n,x.title||lab(x),[lab(x),x.publisher,x.date].filter(Boolean).join(" · "),x.url);
const head=`${cd.viaDb?`자료 ${cd.refs}개 찾음${cd.dbs&&cd.dbs.length?" ("+esc(cd.dbs.join("·"))+")":""}`:`위키백과 ${cd.refs}개 찾음`} · ${cd.direct?"기사 목록":"Fonte가 답했어요"}`;
const all=cd.sources||[];return{html:(cd.mcpErr&&cd.mcpErr.length?`<span class="status" style="background:#FDECEA;color:#B42318">${ic("plug",14)} MCP에 연결하지 못했어요: ${esc(cd.mcpErr.map(x=>x.name+" ("+x.msg+")").join(", "))}</span>`:"")+(cd.tools&&cd.tools.length?`<span class="status">${ic("plug",14)} 도구 사용: ${esc([...new Set(cd.tools.map(x=>x.server+" · "+x.tool))].join(", "))}</span>`:"")+(all.length?`<details class="srcsum"><summary class="status">${ic("globe",14)} ${head} <span class="chev">${ic("down",12)}</span></summary><div class="srcs" style="margin-top:8px">${all.map(x=>card(x)).join("")}</div></details>`:`<span class="status">${ic("globe",14)} ${head}</span>`)+`<div class="answer rich">${body}</div>${all.some(x=>x.cited)?`<div class="srcs">${all.filter(x=>x.cited).map(card).join("")}</div>`:""}`,plain:cd.answer,meta:modeOf(S.mode).lab+(cd.viaDb?" · 검색 DB":" · 위키백과"),src:all};}
if(cr.status===429||cr.status===403)return{html:`<p class="answer">${esc(cd.error||"지금은 답할 수 없어요")}</p>`,plain:cd.error||"",meta:modeOf(S.mode).lab};}catch(e){}}
const r=await fetch("/api/wiki?q="+encodeURIComponent(q));const d=await r.json();if(!r.ok||!d.found)return null;
const top=d.results[0];const txt=(top.extract||"").split(/(?<=[.다요])\s+/).slice(0,S.mode==="Fonte"?4:2).join(" ");
return{html:`<span class="status">${ic("globe",14)} 위키백과 ${d.results.length}개 찾음</span><p class="answer">${esc(txt)} <span class="cite">[1]</span></p><div class="srcs">${d.results.map((x,i)=>srcCard(i+1,x.title,"위키백과 · ko.wikipedia.org",x.url)).join("")}</div>`,plain:txt,meta:modeOf(S.mode).lab+" · 위키백과"};
}catch(e){return null;}}
function send(text,opt){text=text.trim();if(!text)return;const code=S.area==="code";
let c=(route()==="chat"||route()==="code-chat")?curChat():null;
if(!c){c={id:"c"+Date.now(),folder:S.area==="code"&&WF.name?WF.name:undefined,area:S.area,title:text.slice(0,24),msgs:[],temp:S.temp,created:Date.now(),kid:S.goccia,agent:route()==="agent"?S.curAgent:null};S.chats.unshift(c);S.cur=c.id;}
c.msgs.push({role:"user",text,att:(opt&&opt.att)||undefined,chip:(opt&&opt.chip)||undefined});const am={id:"m"+Date.now(),role:"assistant",loading:true};c.msgs.push(am);S.menu=false;save();
go(code?"code-chat":"chat");if(S.isAdmin&&ADMCMD.test(text)){admCmd(text,am);return;}const useLive=!code&&!!S.api&&!c.agent&&!(opt&&opt.tool)&&!(S.goccia&&(S.study||S.kStudy===true||/죽고싶|자해|괴롭힘|때려|학대|무서워/.test(text.replace(/\s/g,""))));
setTimeout(async()=>{let fctx="";if(opt&&opt.ctxFile){try{fctx=((await readFileText(opt.ctxFile)).text||"").trim();}catch(er){}}const a=(opt&&opt.ctxFile&&!fctx?{html:`<p class="answer">${esc(opt.ctxFile.name||"파일")}에서 글자를 찾지 못했어요. LAGO는 아직 그림 자체는 보지 못하고 글자만 읽어요. 글자가 있는 선명한 사진이나 PDF·Word·텍스트 파일을 올려 주세요.</p>`,plain:"글자 없음",meta:"첨부"}:null)||(opt&&opt.tool?await toolAnswer(opt.tool,opt.raw||text,opt.opt,opt.file,opt.def):null)||(useLive&&await liveAnswer(text,c.msgs.slice(0,-2).filter(m=>!m.loading&&(m.role==="user"?m.text:m.plain)).slice(-4).map(m=>({r:m.role==="user"?"u":"a",t:String(m.role==="user"?m.text:m.plain).slice(0,300)})),fctx))||(fctx?{html:`<p class="answer">${esc((opt.ctxFile.name||"파일")+"에서 글자를 "+fctx.length.toLocaleString()+"자 읽었어요.")} 모델 서버가 꺼져 있어서 이 글로 답하지 못했어요. ‘문서 요약’이나 ‘텍스트 추출’ 도구는 지금도 쓸 수 있어요.</p>`,plain:"첨부 글을 읽었어요",meta:"첨부"}:null)||(!code&&c.agent&&modelOn()&&await agentLive(text,agentById(c.agent)))||(code?await codeLive(text,histOf(c)):answerFor(text,c.agent&&agentById(c.agent)));Object.assign(am,a,{loading:false});if(a&&a.plain&&!/^(실패|모델 꺼짐|글자 없음|찾지 못함)$/.test(a.plain))useAdd(code?modeOf(S.cmode).lab:opt&&opt.tool?"TOOLS":c.agent?"MODE":modeOf(S.mode).lab,text,a.plain);if(a.preview)S.preview=true;save();if(S.cur===c.id)render();},useLive||code?200:900);}

/* ---------- projects ---------- */
function vProjects(){return shell(`${topbar("",`<button class="btn pri sm tbnew" data-act="newproj" tabindex="-1">${ic("plus",15)} 새 프로젝트</button>`)}<div class="scroll"><div class="wrap page" style="max-width:1080px">
<div class="row phead"><div class="grow"><h1>프로젝트</h1><p class="muted" style="margin:0">대화와 자료를 주제별로 모아 두면, LAGO가 그 안의 내용을 참고해서 답해요.</p></div><button class="btn pri hbtn" id="npbtn" data-act="newproj">${ic("plus",16)} 새 프로젝트</button></div>
${S.newProj?`<form class="card" id="projForm" style="margin-top:18px;display:grid;gap:10px;max-width:520px"><label class="f" for="pn">프로젝트 이름<input id="pn" placeholder="예: 독서 기록"></label><label class="f" for="pd">설명 (선택)<input id="pd" placeholder="무엇을 모아 둘까요?"></label><p class="err" id="perr"></p><div class="row"><button class="btn pri sm" type="submit">만들기</button><button class="btn sm" type="button" data-act="newproj">취소</button></div></form>`:""}
<div class="grid3" style="margin-top:20px">${S.projects.length?"":`<p class="muted" style="grid-column:1/-1">아직 프로젝트가 없어요. 오른쪽 위의 새 프로젝트를 눌러 만들어 보세요.</p>`}${S.projects.map(p=>`<button class="card pcard" data-project="${p.id}"><span class="logo-dot" style="width:36px;height:36px;border-radius:10px;background:var(--mist);color:var(--blue)">${ic("folder",18)}</span><b style="font-size:16px">${esc(p.name)}</b><span class="muted" style="font-size:13px">${esc(p.desc||"설명 없음")}</span><span class="row muted" style="font-size:12px">${ic("msg",13)} 대화 ${p.n}개<span class="grow"></span>${esc(p.u)}</span></button>`).join("")}</div></div></div>`);}
function vProject(){const p=S.projects.find(x=>x.id===S.curProject)||S.projects[0];if(!p){setTimeout(()=>go("projects",true),0);return "";}
return shell(`${topbar("",`<button class="btn sm" data-go="projects">${ic("back",14)} 프로젝트</button>`)}<div class="scroll"><div class="wrap page" style="max-width:1100px"><div class="split"><div style="display:grid;gap:18px;min-width:0">
<div class="row"><span class="logo-dot" style="width:44px;height:44px;border-radius:12px;background:var(--mist);color:var(--blue)">${ic("folder",22)}</span><div class="grow"><h1 style="margin:0">${esc(p.name)}</h1><span class="muted">${esc(p.desc||"")}</span></div><span class="tag">대화 프로젝트</span></div>
${composer("이 프로젝트의 자료를 바탕으로 물어보세요")}
<b>이 프로젝트의 대화</b>
<p class="muted" style="margin:0;font-size:13px">아직 이 프로젝트에 담은 대화가 없어요.</p></div>
<div style="display:grid;gap:16px"><div class="card" style="display:grid;gap:8px"><div class="row"><b>지침</b><span class="grow"></span><button class="iconbtn" data-act="editins" aria-label="지침 고치기">${ic("pen",15)}</button></div>${S.editIns?`<textarea id="insIn" rows="4">${esc(p.ins)}</textarea><button class="btn sm pri" data-act="saveins" style="justify-self:start">저장</button>`:`<p class="muted" style="margin:0;font-size:13px;line-height:1.6">${esc(p.ins||"아직 지침이 없어요. 연필을 눌러 추가하세요.")}</p>`}</div>
<div class="card" style="display:grid;gap:8px"><div class="row"><b>자료</b><span class="grow"></span><button class="chip" data-act="attach">${ic("plus",13)} 추가</button></div>${(p.files.length?p.files:["아직 자료가 없어요"]).map(f=>`<div class="row" style="background:var(--bg);border-radius:10px;padding:8px 10px;font-size:13px">${ic("file",15)} ${esc(f)}</div>`).join("")}<span class="muted" style="font-size:12px">자료는 이 프로젝트의 대화에서만 검색돼요.</span></div></div></div></div></div>`);}

/* ---------- agents ---------- */
const CATS=["전체","매일","공부","생활 · 법률","글쓰기","즐겨찾기"];
function agentCard(a){const fav=S.favs.includes(a.id);return `<div class="card agent"><button class="agentopen" data-agent="${a.id}"><span class="row" style="padding-right:28px"><span class="aic" style="background:${a.c}1f;color:${a.c}">${ic(a.ic,18)}</span><b style="font-size:15px">${esc(a.name)}</b></span><p>${esc(a.desc||"설명 없음")}</p><span class="row muted" style="font-size:11.5px;margin-top:auto"><span class="tag" style="background:#EEF2F8;color:var(--mut)">${esc(a.mode)} 1.0</span>${a.mine?'<span>내가 만듦</span>':'<span>LAGO</span>'}</span></button><button class="fav" data-fav="${a.id}" aria-pressed="${fav}" aria-label="즐겨찾기">${fav?ic("star",17):`<svg class="ic" viewBox="0 0 24 24" width="17" height="17"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/></svg>`}</button></div>`;}
function vAgents(){const mine=S.agentTab==="mine";let list=mine?S.myAgents:OFFICIAL;
if(!mine&&S.agentCat!=="전체")list=S.agentCat==="즐겨찾기"?allAgents().filter(a=>S.favs.includes(a.id)):list.filter(a=>a.cat===S.agentCat);
return shell(`${topbar("",S.goccia?"":`<button class="btn pri sm tbnew" data-act="newagent" tabindex="-1">${ic("plus",15)} 새 MODE</button>`)}<div class="scroll"><div class="wrap page" style="max-width:1100px">
${hubHead("mode",S.goccia?"":`<button class="btn pri hbtn" data-act="newagent">${ic("plus",16)} 새 MODE</button>`)}
<div class="cats"><button aria-pressed="${!mine}" data-tab="lago">LAGO MODE</button>${S.goccia?"":`<button aria-pressed="${mine}" data-tab="mine">나만의 MODE ${S.myAgents.length}</button>`}</div>
${mine?"":`<div class="cats">${CATS.map(c=>`<button aria-pressed="${S.agentCat===c}" data-cat="${c}">${c}</button>`).join("")}</div>`}
<div class="grid3">${mine?`<button class="card agent newagent" data-act="newagent">${ic("plus",22)} 새 MODE 만들기<span class="muted" style="font-weight:400;font-size:12.5px">이름 · 지시문 · 시작 질문만 정하면 돼요</span></button>`:""}${list.map(agentCard).join("")}</div>
${!mine&&!list.length?`<p class="muted" style="text-align:center;padding:30px 0">즐겨찾기한 MODE가 없어요. 카드의 별을 눌러 추가하세요.</p>`:""}</div></div>`);}
function vAgentNew(){const d=S.draft||{};const editing=!!S.editAgent;
return shell(`${topbar(editing?"MODE 고치기":"MODE 만들기",`<button class="btn sm" data-go="agents">${ic("back",14)} MODE</button>`)}<div class="scroll"><div class="wrap page" style="max-width:1100px"><div class="split">
<form class="card" id="agentForm" style="display:grid;gap:14px" novalidate><h1 style="font-size:22px">${editing?"MODE 고치기":"새 MODE"}</h1>
<div class="f" style="display:grid;gap:8px;font-size:13px;font-weight:500;color:var(--ink2)">아이콘<div class="icpick">${AGENT_ICONS.map(k=>`<button type="button" data-agic="${k}" aria-pressed="${d.ic===k}" aria-label="${k}">${ic(k,18)}</button>`).join("")}</div><div class="icpick">${AGENT_COLORS.map(c=>`<button type="button" data-agcol="${c}" aria-pressed="${d.c===c}" aria-label="색" style="background:${c}"></button>`).join("")}</div></div>
<label class="f" for="an">이름<input id="an" maxlength="20" placeholder="예: 영어 단어 선생님" value="${esc(d.name||"")}"></label>
<label class="f" for="ad">한 줄 소개<input id="ad" maxlength="60" placeholder="이 MODE가 무엇을 해 주나요?" value="${esc(d.desc||"")}"></label>
<label class="f" for="ai">지시문 <span class="hint">LAGO가 항상 지킬 규칙이에요. 말투 · 형식 · 하지 말 것을 적어 주세요.</span><textarea id="ai" rows="5" placeholder="예: 영어 단어를 물으면 뜻, 예문 2개, 비슷한 단어를 표로 알려 줘. 너무 길게 말하지 마.">${esc(d.ins||"")}</textarea></label>
<div class="birth" style="grid-template-columns:1fr 1fr"><label class="f" for="am">기본 모드<select id="am">${TALK_MODES.map(m=>`<option value="${m.id}" ${d.mode===m.id?"selected":""}>${m.lab} · ${m.id}</option>`).join("")}</select></label>
<label class="f" for="aw">웹 검색<select id="aw">${["DB에 없을 때만","항상","끄기"].map((t,i)=>`<option value="${i}" ${(d.web||0)==i?"selected":""}>${t}</option>`).join("")}</select></label></div>
<div class="f" style="display:grid;gap:6px;font-size:13px;font-weight:500;color:var(--ink2)">시작 질문 <span class="hint">MODE를 열면 버튼으로 보여요 (최대 3개)</span>${[0,1,2].map(i=>`<input id="as${i}" placeholder="예: apple 뜻 알려 줘" value="${esc((d.starters||[])[i]||"")}" aria-label="시작 질문 ${i+1}">`).join("")}</div>
${modelSel("amod",d.model)}
<p class="err" id="aerr" aria-live="polite"></p>
<div class="row"><button class="btn pri" type="submit">${editing?"저장하기":"만들기"}</button><button class="btn" type="button" data-go="agents">취소</button></div></form>
<div style="display:grid;gap:10px;position:sticky;top:0"><b class="muted" style="font-size:12.5px">미리보기</b><div id="agPrev">${agentPreview(d)}</div><div class="note">${ic("info",17)}<span>MODE의 대화도 일반 대화처럼 기록과 학습 설정을 따라요. 임시 대화로 쓰면 기록에 남지 않아요.</span></div></div></div></div></div>`);}
function agentPreview(d){const c=d.c||"#1B3E9E",k=d.ic||"bot";return `<div class="card" style="display:grid;gap:10px"><span class="row"><span class="aic" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:${c}1f;color:${c}">${ic(k,20)}</span><span><b style="font-size:16px">${esc(d.name||"이름 없는 MODE")}</b><br><span class="muted" style="font-size:12.5px">${esc(d.desc||"한 줄 소개가 여기에 보여요")}</span></span></span><div class="sugs" style="justify-content:flex-start">${(d.starters||[]).filter(Boolean).map(t=>`<button type="button" tabindex="-1">${esc(t)}</button>`).join("")||'<span class="muted" style="font-size:12.5px">시작 질문이 여기에 보여요</span>'}</div></div>`;}
function readDraft(){if(!$("#an"))return;S.draft={...S.draft,name:$("#an").value.trim(),desc:$("#ad").value.trim(),ins:$("#ai").value.trim(),mode:$("#am").value,web:+$("#aw").value,starters:[0,1,2].map(i=>$("#as"+i).value.trim()).filter(Boolean),model:$("#amod").value};}
function vAgent(){const a=agentById(S.curAgent);if(!a){go("agents");return "";}const fav=S.favs.includes(a.id);
const chats=S.chats.filter(c=>c.agent===a.id&&!c.temp);
return shell(`${topbar("",`<button class="btn sm" data-go="agents">${ic("back",14)} MODE</button>`)}<div class="scroll"><div class="wrap hero" style="justify-content:flex-start;padding-top:28px">
<span class="aic" style="width:60px;height:60px;border-radius:18px;display:grid;place-items:center;background:${a.c}1f;color:${a.c}">${ic(a.ic,30)}</span>
<div><h1>${esc(a.name)}</h1><p class="muted" style="margin:6px 0 0">${esc(a.desc||"")}</p><div class="row" style="justify-content:center;margin-top:10px;flex-wrap:wrap"><span class="tag" style="background:#EEF2F8;color:var(--mut)">${esc(a.mode)} 1.0</span><span class="muted" style="font-size:12px">${a.mine?"내가 만듦":"LAGO 공식"}</span><button class="btn sm" data-fav="${a.id}" aria-pressed="${fav}">${fav?"즐겨찾기 해제":"즐겨찾기"}</button>${a.mine?`<button class="btn sm" data-act="toolPubOpen" data-k="mode" data-id="${a.id}">${ic("share",14)} ${a.pub?"공개 관리":"공개하기"}</button><button class="btn sm" data-act="editagent">${ic("pen",14)} 고치기</button><button class="btn sm danger" data-act="ask-delagent">${ic("trash",14)} 지우기</button>`:""}</div></div>
${S.confirm==="delagent"?`<div class="confirm" style="width:min(760px,100%);text-align:left">이 MODE를 지울까요? 이 MODE로 한 대화는 남아요.<div class="row"><button class="btn sm danger" data-act="delagent">지우기</button><button class="btn sm" data-act="cancel">취소</button></div></div>`:""}
${composer(esc(a.name)+"에게 물어보세요")}
<div class="sugs">${(a.starters||[]).map(t=>`<button data-ask="${esc(t)}">${esc(t)}</button>`).join("")}</div>
${chats.length?`<div style="width:min(760px,100%);text-align:left;display:grid;gap:8px"><b>이 MODE로 한 대화</b><div class="list">${chats.slice(0,5).map(c=>`<button data-chat="${c.id}">${ic("msg",16)}<span class="grow">${esc(c.title)}</span></button>`).join("")}</div></div>`:""}</div></div>${S.pubTool===a.id&&S.pubKind==="mode"?pubModal(a,"mode"):""}`);}

/* ---------- code ---------- */
function vCode(){return shell(`${topbar("")}<div class="scroll"><div class="wrap hero">
<div><h1 style="color:var(--gd)">무엇을 만들까요?</h1><p class="muted" style="margin:6px 0 0">빠른 CODE는 바로 코드, CODE는 설계부터 생각하고 코드를 써요.</p></div>
${composer("만들거나 고치고 싶은 코드를 설명해 주세요")}
<div class="quick grid3" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">${[["bug","버그 고치기","오류를 붙여 넣으면 원인부터","websearch.py 오류 고쳐 줘"],["book","코드 설명","파일을 올리면 한 줄씩","app.py 설명해 줘"],["flask","CSV 정리","중복 행 지우는 함수","CSV 파일에서 중복된 행을 지우는 함수 만들어 줘"],["monitor","화면 만들기","HTML로 바로 미리보기","간단한 할 일 앱 화면을 HTML로 만들어 줘"]].map(q=>`<button class="card pcard" data-ask="${esc(q[3])}" style="padding:14px"><span style="color:var(--g)">${ic(q[0],18)}</span><b>${q[1]}</b><span class="muted" style="font-size:12px">${q[2]}</span></button>`).join("")}</div>
${S.term?`<div style="width:min(760px,100%);text-align:left">${termPanel()}</div>`:""}<p class="disc">${ic("monitor",13)} ${DESK?"LAGO Desktop · 명령과 저장은 확인 창에서 허락한 뒤에만 실행돼요":"웹에서는 폴더를 읽기만 해요 · 실제 명령 실행은 LAGO Desktop(EXE)에서 돼요"}</p></div></div>`);}
function vFolder(){const nf=WF.files.filter(f=>!f.dir).length;const pre=WF.cwd?WF.cwd+"/":"";
const tree=WF.files.filter(f=>f.p.startsWith(pre)&&!f.p.slice(pre.length).includes("/"));
const chats=S.chats.filter(c=>c.area==="code"&&!c.temp&&WF.name&&c.folder===WF.name).slice(0,6);
if(!WF.name)return shell(`${topbar("",`<span class="muted">작업 폴더</span>`)}<div class="scroll"><div class="wrap page" style="max-width:860px;display:grid;gap:16px">
<div class="row"><span class="logo-dot" style="width:44px;height:44px;border-radius:12px;background:var(--gt);color:var(--g)">${ic("folder",22)}</span><div class="grow"><h1 style="margin:0">작업 폴더</h1><span class="muted" style="font-size:13.5px">내 컴퓨터의 폴더를 열면 LAGO CODE가 그 안의 파일을 보고 답해요.</span></div></div>
<div class="card" style="display:grid;gap:12px;justify-items:start"><b>폴더 열기</b><span class="muted" style="font-size:13px">${DESK?"폴더를 고르면 파일을 읽고, 터미널에서 명령을 실행하고, 답에 나온 코드를 저장할 수 있어요. 실행과 저장은 확인 창에서 허락한 뒤에만 해요.":"웹에서는 폴더를 <b>읽기만</b> 해요(파일은 서버로 올라가지 않고, 질문할 때 필요한 부분만 모델에 보내요). Chrome · Edge에서 가장 잘 돼요."}</span><button class="btn pri g" data-act="wfPick">${ic("folder",16)} 폴더 열기</button></div>
${deskCard()}${S.term?termPanel():""}</div></div>`);
return shell(`${topbar("",`<span class="muted">작업 폴더 › <b style="color:var(--ink)">${esc(WF.name)}</b></span>`)}<div class="scroll"><div class="wrap page" style="max-width:1100px"><div class="split"><div style="display:grid;gap:16px;min-width:0;align-content:start">
<div class="row" style="flex-wrap:wrap"><span class="logo-dot" style="width:44px;height:44px;border-radius:12px;background:var(--gt);color:var(--g)">${ic("folder",22)}</span><div class="grow" style="min-width:160px"><h1 style="margin:0;color:var(--gd);word-break:break-all">${esc(WF.name)}</h1><span class="muted" style="font:12px var(--mono);word-break:break-all">${esc(WF.path||"브라우저에서 연 폴더 · 읽기 전용")} · 파일 ${nf}개</span></div><button class="btn sm" data-act="wfPick">${ic("refresh",14)} 다른 폴더</button><button class="btn sm" data-act="term">${ic("term",14)} 터미널</button></div>
${composer(WF.name+"에서 할 작업을 설명해 주세요")}
${S.term?termPanel():""}
${fileView()}
${chats.length?`<b>이 폴더로 한 작업</b><div class="list" style="border-color:var(--gline)">${chats.map(c=>`<button data-chat="${c.id}">${ic("term",17)}<span class="grow"><b style="font-weight:500">${esc(c.title)}</b><br><span class="muted" style="font-size:12.5px">메시지 ${c.msgs.length}개</span></span></button>`).join("")}</div>`:""}</div>
<div style="display:grid;gap:16px;align-content:start;min-width:0"><div class="card" style="display:grid;gap:2px;min-width:0"><div class="row" style="margin-bottom:6px"><b class="grow">파일</b>${WF.cwd?`<button class="btn sm" data-act="wfUp">${ic("left",13)} 위로</button>`:""}</div>${WF.cwd?`<span class="muted" style="font:12px var(--mono);padding:0 2px 4px">${esc(WF.cwd)}/</span>`:""}<div class="ftree">${tree.map(f=>`<button class="frow ${WF.open===f.p?"on":""}" data-wf="${esc(f.p)}" data-dir="${f.dir?1:""}">${ic(f.dir?"folder":"file",15)}<span class="grow">${esc(f.p.slice(pre.length))}${f.dir?"/":""}</span>${f.dir?"":`<small>${f.size>=1024?Math.round(f.size/1024)+"KB":f.size+"B"}</small>`}</button>`).join("")||`<span class="muted" style="font-size:13px;padding:6px 2px">(비어 있어요)</span>`}</div></div>
${deskCard()}</div></div></div></div>`);}
function vPlans(){const cur=S.user.plan||"Free";const order=["Free","Pro","Max"];
const plan=(n,sub,price,feats)=>{const isCur=cur===n,up=order.indexOf(n)>order.indexOf(cur);return `<div class="card plan ${isCur?"hl":""} ${n==="Max"?"maxp":""}"><div class="row"><b style="font-size:22px;color:${isCur?"var(--blue)":"var(--ink)"}">${n}</b><span class="grow"></span>${isCur?'<span class="tag">현재 요금제</span>':n==="Max"?'<span class="tag">Pro의 약 7배</span>':""}</div><span class="muted">${sub}</span><div><span class="price">${price}</span> <span class="muted">/ 월</span></div><button class="btn ${isCur?"":up?"pri":""}" data-plan="${n}" ${isCur?"disabled":""}>${isCur?"현재 이용 중":up?n+"로 업그레이드":n+"로 바꾸기"}</button><div style="height:1px;background:#E3E8F2"></div><ul class="feat">${feats.map(f=>`<li class="${f[1]?"":"no"}"><span style="color:${f[1]?"var(--sky)":"var(--mut3)"}">${ic(f[1]?"check":"x",16)}</span>${f[0]}</li>`).join("")}</ul></div>`;};
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:1100px"><div style="text-align:center;margin-bottom:26px"><h1>요금제</h1><p class="muted" style="margin:0">지금은 <b style="color:var(--ink)">${cur}</b>를 쓰고 있어요.</p></div><div class="plans">
${plan("Free","가볍게 써 보기","$0",[["하루 8만 토큰 (답 약 130번)",1],["FACT · 빠른 생각 · THINK",1],["대화 프로젝트 3개까지",1],["이미지 첨부 · 화면 공유",1],["CODE 영역",0],["터미널 모드 · 컴퓨터 유즈",0]])}
${plan("Pro","매일 쓰는 사람을 위해","$10",[["Free의 모든 기능",1],["하루 60만 토큰 (답 약 1,000번)",1],["대화 프로젝트 무제한",1],["빠른 CODE · CODE (생각 강도 조절)",1],["코드 프로젝트 · 터미널 모드",1],["컴퓨터 유즈 (실험)",1]])}
${plan("Max","가장 많이, 가장 먼저","$50",[["Pro의 모든 기능",1],["하루 400만 토큰",1],["사람 많을 때 우선 처리",1],["새 기능 먼저 써 보기",1]])}
</div><p class="disc" style="margin-top:22px">토큰은 내가 쓴 글 + LAGO의 답(생각 과정 포함) + 이미지로 세요 · 한도는 매일 0시(한국 시간)에 초기화돼요 · 언제든 해지할 수 있어요. <button class="linkbtn" data-go="usage" style="font-size:12px">사용량 자세히 보기</button></p></div></div>`);}
function vTool(){const id=route().slice(5),t=TOOLS.find(x=>x.id===id);if(!t){go("home");return "";}const dr=S.toolIn||{};
const LANG=["한국어","영어","일본어","중국어","스페인어"];
let form="";
if(id==="translate"&&modelOn())form=`<div class="note">${ic("info",16)}<span>Fonte 모델이 번역해요. 번역을 따로 학습하지 않아서 틀릴 수 있어요. 한 번에 1,500자까지 처리해요.</span></div>
<label class="fld">번역할 글<textarea id="ti" rows="6" placeholder="번역할 글을 붙여 넣어 주세요" maxlength="1500" style="resize:vertical">${esc(dr.text||"")}</textarea></label>
<div class="row" style="gap:10px;flex-wrap:wrap"><label class="fld" style="flex:1;min-width:150px">어떤 언어로<select id="to">${LANG.map(l=>`<option ${(dr.opt||"영어")===l?"selected":""}>${l}</option>`).join("")}</select></label></div>`;
else if(id==="translate")form=`<div class="note">${ic("info",16)}<span>${S.api&&S.api.model?"로그인하면 번역할 수 있어요.":"모델 서버가 지금 꺼져 있어서 번역할 수 없어요. 서버가 켜지면 바로 돼요."}</span></div>
<label class="fld">번역할 글<textarea id="ti" rows="6" placeholder="번역할 글" maxlength="4000" style="resize:vertical" disabled>${esc(dr.text||"")}</textarea></label>
<div class="row" style="gap:10px;flex-wrap:wrap"><label class="fld" style="flex:1;min-width:150px">어떤 언어로<select id="to" disabled>${LANG.map(l=>`<option>${l}</option>`).join("")}</select></label></div>`;
if(id==="spell")form=modelOn()?`<div class="note">${ic("info",16)}<span>Fonte 모델이 맞춤법과 띄어쓰기를 고쳐요. 맞춤법을 따로 학습하지 않아서 틀릴 수 있어요.</span></div><label class="fld">고칠 글<textarea id="ti" rows="6" placeholder="맞춤법을 확인할 글을 붙여 넣어 주세요" maxlength="1500" style="resize:vertical">${esc(dr.text||"")}</textarea></label>`:`<div class="note">${ic("info",16)}<span>${S.api&&S.api.model?"로그인하면 맞춤법을 검사할 수 있어요.":"모델 서버가 지금 꺼져 있어서 검사할 수 없어요. 서버가 켜지면 바로 돼요."}</span></div>`;
if(id==="extract")form=`<label class="fld">파일 올리기<input id="tf2" type="file" accept=".pdf,.docx,.txt,.md,.csv,.tsv,.json,.html,.htm,.srt,.log,image/*"></label>
<p class="muted" style="font-size:12.5px;margin:0">PDF · Word(DOCX) · 텍스트 파일은 바로 글자를 뽑아요. 사진·스캔 이미지는 글자 인식(OCR)을 쓰는데, 처음에는 언어 파일을 받느라 1~2분 걸릴 수 있어요. 파일은 이 브라우저에서만 읽고 서버로 보내지 않아요. 파일 크기는 15MB까지예요.</p>`;
if(id==="summary")form=`<label class="fld">요약할 글<textarea id="ti" rows="8" placeholder="요약할 글을 붙여 넣어 주세요" maxlength="30000" style="resize:vertical">${esc(dr.text||"")}</textarea></label>
<div class="row" style="gap:10px;flex-wrap:wrap"><label class="fld" style="flex:1;min-width:150px">길이<select id="to">${["3줄","5줄","한 문단"].map(l=>`<option ${(dr.opt||"3줄")===l?"selected":""}>${l}</option>`).join("")}</select></label><label class="fld" style="flex:2;min-width:200px">또는 파일 올리기<input id="tf2" type="file" accept=".pdf,.docx,.txt,.md,.html,.htm,.srt"></label></div>
<p class="muted" style="font-size:12.5px;margin:0">글에서 중요한 문장을 골라 보여 줘요(말을 새로 만들지 않아요). ${modelOn()?"모델이 연결돼 있어서 AI 요약으로 써 줘요(3,000자까지, 파일은 글자만 뽑아 요약해요).":"모델 서버가 켜져 있으면 AI가 새 문장으로 요약해 줘요."}</p>`;
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:760px;display:grid;gap:16px">
<div class="row" style="gap:12px"><span class="svcico" style="background:${t.c}">${ic(t.ic,20)}</span><div class="grow"><h1 style="margin:0">${t.lab}</h1><span class="muted" style="font-size:13.5px">${id==="translate"&&modelOn()?"원하는 언어로 번역해요 (Fonte 모델).":t.d}</span></div><button class="btn sm" data-pintool="${t.id}">${ic("pin",14)} ${S.pinTools.includes(t.id)?"고정 해제":"사이드바에 고정"}</button></div>
<form id="toolForm" class="card" style="display:grid;gap:14px" novalidate data-tool="${t.id}">${form}<p class="err" id="toolerr" role="alert"></p><div class="row" style="justify-content:flex-end"><button class="btn pri" ${id==="translate"&&!modelOn()?"disabled":""}>${id==="translate"?(modelOn()?"번역하기":"모델 서버 꺼짐"):id==="extract"?"글자 뽑기":"요약하기"}</button></div></form>
<div class="card" style="display:grid;gap:8px"><b style="font-size:14px">이렇게 써요</b><ol style="margin:0;padding-left:20px;display:grid;gap:6px;font-size:13.5px;color:var(--ink2)">${t.steps.map(x=>`<li>${x}</li>`).join("")}</ol></div></div></div>`);}
/* ---------- 글자 뽑기 · 핵심 문장 요약 (모델 없이 이 브라우저에서 해요) ---------- */
const unent=x=>x.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(m,n)=>String.fromCharCode(+n)).replace(/&amp;/g,"&");
async function docxText(file){const buf=new DataView(await file.arrayBuffer()),u8=new Uint8Array(buf.buffer);let e=u8.length-22;while(e>=0&&buf.getUint32(e,true)!==0x06054b50)e--;if(e<0)throw new Error("DOCX 파일이 아니에요");
let p=buf.getUint32(e+16,true);const n=buf.getUint16(e+10,true);
for(let i=0;i<n;i++){if(buf.getUint32(p,true)!==0x02014b50)break;const method=buf.getUint16(p+10,true),csz=buf.getUint32(p+20,true),nl=buf.getUint16(p+28,true),xl=buf.getUint16(p+30,true),cl=buf.getUint16(p+32,true),off=buf.getUint32(p+42,true);
const name=new TextDecoder().decode(u8.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;
if(name!=="word/document.xml")continue;
const lnl=buf.getUint16(off+26,true),lxl=buf.getUint16(off+28,true),start=off+30+lnl+lxl,data=u8.subarray(start,start+csz);
let xml;if(method===0)xml=new TextDecoder().decode(data);else{if(typeof DecompressionStream==="undefined")throw new Error("이 브라우저에서는 DOCX를 열 수 없어요");const ds=new DecompressionStream("deflate-raw");const w=ds.writable.getWriter();w.write(data);w.close();xml=new TextDecoder().decode(await new Response(ds.readable).arrayBuffer());}
return unent(xml.replace(/<\/w:p>/g,"\n").replace(/<w:tab\/>/g,"\t").replace(/<w:br[^>]*\/>/g,"\n").replace(/<[^>]+>/g,"")).replace(/\n{3,}/g,"\n\n").trim();}
throw new Error("문서 본문을 찾지 못했어요");}
async function pdfText(file){await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");const L=window.pdfjsLib;L.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const pdf=await L.getDocument({data:await file.arrayBuffer()}).promise;let out=[];
for(let i=1;i<=Math.min(pdf.numPages,200);i++){const tc=await (await pdf.getPage(i)).getTextContent();let t="";for(const it of tc.items){t+=it.str+(it.hasEOL?"\n":" ");}out.push(t.replace(/[ \t]+\n/g,"\n").trim());}
return {text:out.join("\n\n").trim(),pages:pdf.numPages};}
async function imageText(file){await loadScript("https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.0/tesseract.min.js");const r=await window.Tesseract.recognize(file,"kor+eng");return (r.data.text||"").trim();}
async function readFileText(file){const ext=(file.name.split(".").pop()||"").toLowerCase();
if(/^image\//.test(file.type)||/^(png|jpe?g|webp|bmp|gif)$/.test(ext))return {text:await imageText(file),how:"OCR"};
if(ext==="pdf"){const r=await pdfText(file);return {text:r.text,how:"PDF "+r.pages+"쪽"};}
if(ext==="docx")return {text:await docxText(file),how:"Word"};
if(/^(txt|md|csv|tsv|json|log|srt|html?|xml)$/.test(ext)){let t=await file.text();if(/^html?$/.test(ext))t=unent(t.replace(/<(script|style)[\s\S]*?<\/\1>/gi,"").replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr)>/gi,"\n").replace(/<[^>]+>/g,""));return {text:t.trim(),how:"텍스트"};}
throw new Error("이 파일 형식은 아직 못 열어요. PDF · DOCX · 텍스트 · 이미지만 돼요.");}
const STOP=new Set("그리고 그러나 하지만 그래서 또한 이것 그것 저것 있다 있는 있어 없다 없는 하는 하고 해서 한다 합니다 입니다 이다 되는 된다 대한 위해 통해 같은 매우 가장 때문 경우 수도 the and for that with this from are was were have has not but you your".split(" "));
const toks=x=>(x.toLowerCase().match(/[가-힣]{2,}|[a-z]{3,}|\d{2,}/g)||[]).map(w=>/[가-힣]/.test(w)&&w.length>2?w.replace(/(에서|으로|에게|까지|부터|은|는|이|가|을|를|의|에|로|과|와|도|만)$/,""):w).filter(w=>w.length>1&&!STOP.has(w));
function summarize(text,n){const sents=text.replace(/\r/g,"").split(/(?<=[.!?…。])\s+|\n+/).map(x=>x.trim()).filter(x=>x.length>=12).slice(0,600);
if(sents.length<=n)return {pick:sents.map((x,i)=>({i,x})),short:true};
const f={};sents.forEach(x=>new Set(toks(x)).forEach(w=>f[w]=(f[w]||0)+1));
const sc=sents.map((x,i)=>{const t=toks(x);const base=t.length?t.reduce((a,w)=>a+(f[w]>1?f[w]:0.3),0)/Math.pow(t.length,0.6):0;return {i,x,s:base*(i===0?1.35:i<3?1.1:1)*(x.length>260?0.7:1)};});
const pick=[];for(const c of sc.slice().sort((a,b)=>b.s-a.s)){if(pick.length>=n)break;const ct=new Set(toks(c.x));if(pick.some(p=>{const pt=toks(p.x);const hit=pt.filter(w=>ct.has(w)).length;return hit/Math.max(1,Math.min(pt.length,ct.size))>0.7;}))continue;pick.push(c);}
return {pick:pick.sort((a,b)=>a.i-b.i)};}
const SPELL_INS=`입력한 글의 맞춤법과 띄어쓰기를 바로잡아라. 뜻과 말투는 바꾸지 말고 틀린 곳만 고쳐라.\n출력 형식은 반드시 이렇게 한다.\n(고친 글 전체)\n\n고친 곳\n- 틀린 말 → 바른 말 (이유 한 줄)\n틀린 곳이 없으면 글을 그대로 쓰고 "고칠 곳이 없어요"라고만 덧붙여라.\n\n예시\n이제 집에 가도 되요?웬지 오늘은 좋은 일이 생길 것 같아!\n=>\n이제 집에 가도 돼요? 왠지 오늘은 좋은 일이 생길 것 같아!\n\n고친 곳\n- 되요 → 돼요 ('되어요'의 줄임말은 '돼요')\n- 웬지 → 왠지 ('왜인지'의 줄임말)\n- 물음표 뒤에 띄어쓰기를 넣었어요`;
async function toolAnswer(kind,text,opt,file,def){if(kind==="spell"){kind="custom";def={name:"맞춤법 검사기",ic:"layers",ins:SPELL_INS,model:""};}const t=kind==="custom"?{id:"custom",lab:def.name,ic:def.ic||"bot"}:TOOLS.find(x=>x.id===kind);
try{let body=text,how="";
if(file){const r=await readFileText(file);body=r.text;how=r.how;}
if(!body||!body.trim())return{html:`<span class="status">${ic(t.ic,14)} ${t.lab}</span><p class="answer">${file?"파일에서 글자를 찾지 못했어요. 글자가 없는 스캔 파일이거나 사진이 흐릴 수 있어요. 사진은 ‘이미지’로 올리면 글자 인식(OCR)을 해요.":"글이 비어 있어요."}</p>`,plain:"글자 없음",meta:t.lab};
if(kind==="custom"){if(!modelOn())return{html:`<span class="status">${ic("bot",14)} ${esc(t.lab)}</span><p class="answer">모델 서버가 지금 꺼져 있어서 이 도구를 쓸 수 없어요. 서버가 켜지면 바로 돼요.</p>`,plain:"모델 미연결",meta:t.lab};
 const mr=await modelCall({task:"agent",q:body.slice(0,500),ctx:body.slice(0,3000),agent:{name:def.name,instructions:def.ins+(opt?"\n선택한 옵션: "+opt:"")},tool:true,model:def.model||undefined});
 if(mr.ok&&mr.d.answer)return{html:`<span class="status">${ic("bot",14)} ${esc(t.lab)}${opt?" · "+esc(opt):""}${how?" · "+esc(how):""}</span><div class="answer rich">${RICH(mr.d.answer)}</div>${body.length>3000?`<p class="muted" style="margin:8px 0 0;font-size:12.5px">길어서 앞 3,000자만 처리했어요.</p>`:""}${modelNote}`,plain:mr.d.answer,meta:t.lab};
 return{html:`<span class="status">${ic("bot",14)} ${esc(t.lab)}</span><p class="answer">${esc((mr.d&&mr.d.error)||"모델 서버에 연결하지 못했어요. 잠시 뒤에 다시 해 주세요.")}</p>`,plain:"실패",meta:t.lab};}
if(kind==="extract"){const full=body.length>12000?body.slice(0,12000):body;
return{html:`<span class="status">${ic(t.ic,14)} ${t.lab} · ${esc(how)} · ${body.length.toLocaleString()}자</span><p class="answer">${esc(file.name)}에서 글자를 뽑았어요.</p><pre class="toolout" style="white-space:pre-wrap;word-break:break-word;max-height:360px;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px;font:13px/1.65 var(--sans,inherit);margin:6px 0 0">${esc(full)}</pre>${body.length>12000?`<p class="muted" style="font-size:12.5px;margin:6px 0 0">길어서 앞 12,000자만 보여 드려요.</p>`:""}`,plain:full,meta:t.lab};}
if(kind==="translate"||(kind==="summary"&&modelOn())){const mr=await modelCall(kind==="translate"?{task:"translate",text:body,lang:opt}:{task:"summary",text:body,len:opt});
 if(mr.ok&&mr.d.answer){const cut=body.length>(kind==="translate"?1500:3000);return{html:`<span class="status">${ic(t.ic,14)} ${t.lab} · ${esc(opt)}${how?" · "+esc(how):""}</span><div class="answer rich">${RICH(mr.d.answer)}</div>${cut?`<p class="muted" style="margin:8px 0 0;font-size:12.5px">길어서 앞 ${kind==="translate"?"1,500":"3,000"}자만 처리했어요.</p>`:""}${modelNote}`,plain:mr.d.answer,meta:t.lab};}
 if(kind==="translate")return{html:`<span class="status">${ic(t.ic,14)} ${t.lab}</span><p class="answer">${esc((mr.d&&mr.d.error)||"모델 서버에 연결하지 못했어요. 잠시 뒤에 다시 해 주세요.")}</p>`,plain:"번역 실패",meta:t.lab};}
const n=opt==="5줄"?5:opt==="한 문단"?4:3;const r=summarize(body,n);
if(!r.pick.length)return{html:`<span class="status">${ic(t.ic,14)} ${t.lab}</span><p class="answer">요약할 만한 문장을 찾지 못했어요. 글이 너무 짧아요.</p>`,plain:"요약 없음",meta:t.lab};
const lines=opt==="한 문단"?`<p class="answer">${esc(r.pick.map(p=>p.x).join(" "))}</p>`:`<ol style="margin:6px 0 0;padding-left:22px;display:grid;gap:8px">${r.pick.map(p=>`<li class="answer">${esc(p.x)} <span class="cite" title="원문 ${p.i+1}번째 문장">[원문 ${p.i+1}]</span></li>`).join("")}</ol>`;
return{html:`<span class="status">${ic(t.ic,14)} ${t.lab} · ${esc(opt)}${how?" · "+esc(how):""}</span>${r.short?`<p class="muted" style="margin:0;font-size:13px">글이 짧아서 전체를 그대로 보여 드려요.</p>`:""}${lines}<p class="muted" style="margin:8px 0 0;font-size:12.5px">중요한 문장을 골라 보여 드렸어요(말을 새로 만들지는 않아요).</p>`,plain:r.pick.map(p=>p.x).join(" "),meta:t.lab};
}catch(e){return{html:`<span class="status">${ic(t.ic,14)} ${t.lab}</span><p class="answer">${esc(e&&e.message||"처리하지 못했어요")}</p><p class="muted" style="margin:0;font-size:12.5px">인터넷 연결을 확인하고 다시 해 보세요. 사진 인식(OCR)과 PDF는 처음에 외부 라이브러리를 받아야 해요.</p>`,plain:"실패",meta:t.lab};}}
async function mcpAdd(body){S.mcpBusy=true;S.mcpMsg="";S.mcpWarn=null;render();try{const j=await pubFetch("/api/mcp/add",body);toast("연결했어요 · 도구 "+j.n+"개 ("+(j.tools||[]).slice(0,3).join(", ")+")");S.mcpBusy=false;await mcpLoad(true);}catch(er){S.mcpBusy=false;if(er.needAck)S.mcpWarn={risk:er.risk,url:er.url,body};else S.mcpMsg=er.message+(er.block&&er.url?" · "+er.url:"");render();}}
async function mcpApprove(mid,v){const c=S.chats.find(x=>x.id===S.cur),am=c&&c.msgs.find(m=>m.id===mid);if(!am||!am.pend||am.busy)return;const p=am.pend;
if(v==="no")p.no=[...p.no,p.call.tool];else{p.ok=[...p.ok,p.call];if(v==="always"){try{await pubFetch("/api/mcp/allow",{key:p.call.tool});S.mcp=null;}catch(er){toast(er.message);}}}
am.busy=true;am.loading=true;render();let r=null;try{r=await liveAnswer(p.q,p.hist,p.ctx,{ok:p.ok,no:p.no});}catch(er){}
Object.assign(am,{pend:null},r||{html:`<p class="answer">답을 가져오지 못했어요. 다시 물어봐 주세요.</p>`,plain:"실패",meta:""},{loading:false,busy:false});save();if(S.cur===c.id)render();}
async function mcpLoad(force){if(!force&&S.mcp)return;if(!(PATHMODE&&S.fb&&S.user&&S.user.uid)){S.mcp={off:true,defaults:[],custom:[],dev:[]};return;}
S.mcp=Object.assign({},S.mcp||{},{loading:true});try{const r=await authGet("/api/mcp/list"),j=await r.json();S.mcp=r.ok?j:{defaults:[],custom:[],dev:[],err:j.error||"불러오지 못했어요"};}catch(e){S.mcp={defaults:[],custom:[],dev:[],err:"불러오지 못했어요"};}render();}
const mcpOn=()=>{const m=S.mcp||{};return [...(m.defaults||[]).filter(x=>x.on),...(m.custom||[]).filter(x=>x.on),...(m.dev||[])];};
const warnBox=(w,act,label)=>`<div class="riskbox" role="alert"><b>${ic("info",15)} 주의가 필요한 주소예요</b><span class="riskurl">${esc(w.url)}</span><ul>${(w.risk||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul><span class="muted" style="font-size:12.5px">이 서버는 대화 내용 일부를 받을 수 있고, 돌려주는 내용이 답에 쓰여요. 믿을 수 있는 곳일 때만 계속하세요.</span><div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn sm danger" data-act="${act}">${label}</button><button type="button" class="btn sm" data-act="mcpWarnX">취소</button></div></div>`;
const riskTag=x=>(x.risk&&x.risk.length)?`<span class="tag" style="background:#FDECEA;color:#B42318">주의</span>`:"";
function mcpNote(){const m=S.mcp;if(!m||m.loading){if(!m)mcpLoad();return "";}if(m.off)return `<div class="note">${ic("info",16)}<span>MCP 연결은 로그인한 실제 서비스에서만 쓸 수 있어요.</span></div>`;return m.err?`<div class="note">${ic("info",16)}<span>${esc(m.err)}</span></div>`:`<div class="note">${ic("info",16)}<span>켜 둔 MCP는 Fonte로 대화할 때 필요하면 LAGO가 도구로 불러 써요. 어떤 도구를 썼는지는 답 위에 표시돼요.</span></div>`;}
function mcpRow(x,kind){const on=kind==="dev"?true:x.on;return `<div class="card svc" style="gap:8px"><div class="row" style="gap:10px"><span class="svcico sm" style="background:#4A5FA8">${ic("plug",15)}</span><b class="grow" style="min-width:0">${esc(x.name)}</b>${riskTag(x)}${kind==="dev"?`<span class="tag">DEV</span>`:""}${kind==="default"?`<span class="tag">기본</span>`:""}${kind==="dev"?"":`<button type="button" class="switch" role="switch" aria-checked="${on}" data-act="mcpTog" data-kind="${kind}" data-id="${esc(x.id)}" data-on="${on?"":"1"}" aria-label="${esc(x.name)} 켜기"></button>`}</div>${x.desc?`<p class="muted" style="margin:0;font-size:13px">${esc(x.desc)}</p>`:""}${kind==="custom"?`<span style="font:12px var(--mono);color:var(--mut);word-break:break-all">${esc(x.url)}${x.auth?" · 토큰":""}</span>${(x.risk||[]).map(r=>`<span style="font-size:12.5px;color:#B42318">⚠ ${esc(r)}</span>`).join("")}`:""}${kind==="dev"?`<span class="muted" style="font-size:12.5px">도구 ${x.tools||0}개</span>`:""}${kind==="default"?"":`<div><button type="button" class="btn sm danger" data-act="mcpRm" data-kind="${kind}" data-id="${esc(x.id)}">빼기</button></div>`}</div>`;}
function mcpSections(){const m=S.mcp||{};if(m.off||!S.mcp)return "";const d=m.defaults||[],c=m.custom||[],v=m.dev||[];
return `${d.length?`<section style="display:grid;gap:12px"><b style="font-size:15px">기본 MCP</b><div class="svcgrid">${d.map(x=>mcpRow(x,"default")).join("")}</div></section>`:""}
${v.length?`<section style="display:grid;gap:12px"><b style="font-size:15px">DEV 샵에서 가져온 MCP</b><div class="svcgrid">${v.map(x=>mcpRow(x,"dev")).join("")}</div></section>`:""}
<section style="display:grid;gap:12px"><b style="font-size:15px">내 MCP 추가</b><form id="mcpForm" class="card" style="display:grid;gap:12px" novalidate><p class="muted" style="margin:0;font-size:13.5px">MCP 서버(Streamable HTTP) 주소를 넣으면 LAGO가 먼저 연결해 보고 도구 목록을 확인해요. 토큰은 서버에만 저장돼요. DEV 샵에서 다른 사람이 올린 MCP를 가져올 수도 있어요.</p><div class="row" style="gap:8px;flex-wrap:wrap"><input id="mn" placeholder="이름 (예: 우리 학교 도서관)" maxlength="30" aria-label="커넥터 이름" style="flex:1;min-width:150px"><input id="mu" type="url" inputmode="url" placeholder="https://example.com/mcp" aria-label="MCP 서버 주소" style="flex:2;min-width:200px"></div><div class="row" style="gap:8px;flex-wrap:wrap"><input id="mk" type="password" autocomplete="off" placeholder="토큰 (필요한 서버만)" aria-label="토큰" style="flex:1;min-width:200px"><button class="btn pri" ${S.mcpBusy?"disabled":""}>${S.mcpBusy?"연결 확인 중…":"연결하고 추가"}</button></div><p class="err" id="merr" role="alert">${esc(S.mcpMsg||"")}</p>${S.mcpWarn?warnBox(S.mcpWarn,"mcpAck","위험을 알고 있어요. 그래도 추가"):""}</form>${c.length?`<div class="svcgrid">${c.map(x=>mcpRow(x,"custom")).join("")}</div>`:""}</section>
${(m.allow||[]).length?`<section style="display:grid;gap:10px"><b style="font-size:15px">항상 허용한 도구</b><div class="card" style="display:grid;gap:0">${m.allow.map(k=>`<div class="row" style="gap:8px;padding:9px 0;border-top:1px solid var(--line)"><code class="grow" style="word-break:break-all">${esc(k)}</code><button type="button" class="btn sm" data-act="mcpAllowOff" data-key="${esc(k)}">허락 받기로 되돌리기</button></div>`).join("")}</div></section>`:""}`;}
function vServices(){const on=id=>S.services[id]===true;
const card=x=>`<div class="card svc"><div class="row"><span class="svcico" style="background:${x[4]}">${esc(x[1].slice(0,1))}</span><span class="grow"></span></div><b>${x[1]}</b><p class="muted">${x[2]}</p><button class="btn" data-act="mcpPre" data-name="${esc(x[1])}">${ic("plug",15)} MCP로 연결</button></div>`;
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:1100px;display:grid;gap:22px">
<div><h1>서비스 연결</h1><p class="muted" style="margin:0">내 서비스를 <b style="color:var(--ink)">MCP</b>(Model Context Protocol)로 연결하면 LAGO가 일정 · 메일 · 파일을 읽고 쓸 수 있어요.</p></div>
${mcpNote()}
<section style="display:grid;gap:12px"><b style="font-size:15px">기본 제공</b><div class="svcgrid"><div class="card svc"><div class="row"><span class="svcico" style="background:#4A5FA8">${ic("globe",19)}</span><span class="grow"></span><span class="tag" style="background:#E6F6EE;color:#1F7A4A">켜져 있음</span></div><b>위키백과</b><p class="muted">FACT · 빠른 생각 · THINK가 한국어 위키에서 찾아 출처와 함께 답해요.</p></div>
<div class="card svc"><div class="row"><span class="svcico" style="background:#2BA3B8">${ic("news",19)}</span><span class="grow"></span><span class="tag" style="${S.api&&S.api.publicData?"background:#E6F6EE;color:#1F7A4A":""}">${S.api&&S.api.publicData?"켜져 있음":"키 필요"}</span></div><b>공공데이터포털</b><p class="muted">공휴일 같은 공공 자료를 불러와요. 서버에 data.go.kr 키가 있어야 해요.</p></div></div></section>
${mcpSections()}
<section style="display:grid;gap:12px"><b style="font-size:15px">다른 서비스 (MCP 주소로 연결)</b><p class="muted" style="margin:-4px 0 0;font-size:13px">각 서비스가 제공하는 MCP 서버 주소를 넣으면 연결돼요.</p><div class="svcgrid">${SERVICES.map(card).join("")}</div></section></div></div>`);}
const WD=["월","화","수","목","금","토","일"];
const TPL=[["이번 달 공휴일 (매주 월요일)","이번 달 공휴일 알려 줘","weekly","09:00","월"],["오늘의 지식 한 가지 (매일 아침)","오늘의 지식","daily","08:00"],["저녁에 한 번 복습 (한 번만)","독도는 어디에 있어?","once","20:00"]];
const taskWhen=t=>(t.freq==="daily"?"매일":t.freq==="weekly"?"매주 "+t.day+"요일":"한 번")+" "+(+t.time.slice(0,2)<12?"오전 ":"오후 ")+((+t.time.slice(0,2))%12||12)+":"+t.time.slice(3);
function nextRun(t){const [h,m]=t.time.split(":").map(Number),n=new Date();let d=new Date(n);d.setHours(h,m,0,0);if(t.freq==="weekly"){const want=(WD.indexOf(t.day)+1)%7;while(d.getDay()!==want||d<=n)d.setDate(d.getDate()+1);}else if(d<=n)d.setDate(d.getDate()+1);return d;}
const fmtNext=d=>{const n=new Date(),diff=Math.round((new Date(d).setHours(0,0,0,0)-new Date(n).setHours(0,0,0,0))/864e5);return (diff===0?"오늘":diff===1?"내일":(d.getMonth()+1)+"월 "+d.getDate()+"일")+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");};
function taskNote(){if(!S.fb)return "이 화면은 서버에 연결되지 않아서 <b>지금 실행</b>으로만 확인할 수 있어요.";
if(!S.api||!S.api.tasks)return "정해진 시간에 서버가 대신 실행하려면 관리자가 메일 키(Resend)와 Firebase 서비스 계정을 넣어야 해요. 그때까지는 <b>지금 실행</b>으로 확인할 수 있어요.";
if(!S.user.verified)return "이메일 인증을 해야 결과를 메일로 받을 수 있어요. 받은 인증 메일의 링크를 눌러 주세요.";
const e=S.taskSync&&S.taskSync.ok===false?` <b style="color:#B42318">(${esc(S.taskSync.err||"저장하지 못했어요")})</b>`:"";
return "정한 시간이 되면 서버가 위키백과·공공데이터로 답을 찾아 <b>"+esc(S.user.email)+"</b>로 메일을 보내 줘요(시간은 최대 5~10분 늦을 수 있어요). 앱을 닫아 둬도 돼요."+e;}
let tsSig="",tsT=0;
function syncTasks(){clearTimeout(tsT);tsT=setTimeout(async()=>{if(!S.fb||!S.user||!S.user.uid||!S.api||!S.api.tasks||!S.user.verified)return;
const list=(S.tasks||[]).map(t=>({id:t.id,name:t.name,prompt:t.prompt,freq:t.freq,day:t.day,time:t.time,on:t.on!==false}));const sig=JSON.stringify(list);if(sig===tsSig)return;
try{const tk=await S.fb.auth.currentUser.getIdToken();const r=await fetch("/api/tasks/sync",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+tk},body:JSON.stringify({tasks:list,tzo:new Date().getTimezoneOffset()})});
if(r.ok){tsSig=sig;S.taskSync={ok:true};}else{const j=await r.json().catch(()=>({}));S.taskSync={ok:false,err:j.error||""};}}catch(e){}
if(route()==="tasks")render();},1200);}
function vTasks(){const dr=S.taskDraft||{};
const form=S.taskNew?`<form id="taskForm" class="card" style="display:grid;gap:12px" novalidate><b style="font-size:16px">새 예약 작업</b>
<label class="fld">이름<input id="tn" value="${esc(dr.name||"")}" maxlength="30" placeholder="예: 아침 뉴스 요약"></label>
<label class="fld">시간이 되면 LAGO에게 시킬 말 <span class="muted" style="font-weight:400">· 위키백과나 공공데이터(공휴일)로 답할 수 있는 말이어야 해요. “오늘의 지식”이라고 쓰면 매번 새 문서를 하나 보내 줘요.</span><textarea id="tp" rows="3" maxlength="300" placeholder="예: 이번 달 공휴일 알려 줘" style="resize:vertical">${esc(dr.prompt||"")}</textarea></label>
<div class="row" style="flex-wrap:wrap;gap:10px"><label class="fld" style="flex:1;min-width:120px">반복<select id="tf">${[["daily","매일"],["weekly","매주"],["once","한 번만"]].map(x=>`<option value="${x[0]}" ${(dr.freq||"daily")===x[0]?"selected":""}>${x[1]}</option>`).join("")}</select></label>
<label class="fld" style="flex:1;min-width:100px">요일(매주)<select id="td">${WD.map(w=>`<option ${(dr.day||"월")===w?"selected":""}>${w}</option>`).join("")}</select></label>
<label class="fld" style="flex:1;min-width:110px">시간<input id="tt" type="time" value="${dr.time||"08:00"}"></label></div>
<p class="err" id="terr" role="alert"></p><div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="taskCancel">취소</button><button class="btn pri">만들기</button></div></form>`:"";
const list=S.tasks.map(t=>`<div class="card" style="display:grid;gap:8px"><div class="row"><b class="grow" style="font-size:15px">${esc(t.name)}</b><button class="switch" role="switch" aria-checked="${t.on!==false}" data-tsw="${t.id}" aria-label="${esc(t.name)} 켜기/끄기"></button></div>
<span class="muted" style="font-size:13px">${taskWhen(t)}${t.on!==false?" · 다음 "+fmtNext(nextRun(t)):" · 꺼짐"}</span>
<span style="font-size:13px;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:8px 10px">${esc(t.prompt)}</span>
<div class="row" style="gap:8px"><button class="btn sm pri" data-act="taskRun" data-id="${t.id}">${ic("play",13)} 지금 실행</button><button class="btn sm danger" data-act="taskDel" data-id="${t.id}">${ic("trash",13)} 삭제</button>${t.last?`<span class="muted" style="font-size:12px;margin-left:auto">마지막 실행 ${new Date(t.last).getMonth()+1}/${new Date(t.last).getDate()}</span>`:""}</div></div>`).join("");
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:760px;display:grid;gap:16px">
<div class="row" style="align-items:flex-start;flex-wrap:wrap;gap:12px"><div class="grow"><h1>예약 작업</h1><p class="muted" style="margin:0">정한 시간에 LAGO가 대신 찾아서 답을 보내 줘요.</p></div><button class="btn pri" data-act="taskNew">${ic("plus",16)} 새 예약 작업</button></div>
<div class="note">${ic("info",16)}<span>${taskNote()}</span></div>
${form}${list||(S.taskNew?"":`<div class="card" style="display:grid;gap:12px;text-align:center;padding:36px 20px"><b>아직 예약 작업이 없어요</b><span class="muted" style="font-size:13px">아래 예시로 바로 시작해 볼 수 있어요.</span><div class="row" style="justify-content:center;flex-wrap:wrap;gap:8px">${TPL.map((x,i)=>`<button class="chip" data-tpl="${i}">${esc(x[0])}</button>`).join("")}</div></div>`)}</div></div>`);}

function vUsage(){const plan=S.user.plan||"Free",lim=S.user.dailyLimit||LIMITS[plan],today=useDay(dayKey()),used=today.t,pct=Math.min(100,Math.round(used/lim*100));
const now=new Date(),mid=new Date(Date.now()+9*36e5);mid.setUTCHours(24,0,0,0);const ms=mid-(Date.now()+9*36e5),hh=Math.floor(ms/36e5),mm=Math.floor(ms%36e5/6e4);
const COL={"FACT":"#2563EB","빠른 생각":"#3B82F6","THINK":"#1D4ED8","CODE":"#16A34A","빠른 CODE":"#22C55E","MODE":"#0EA5A0","TOOLS":"#64748B"};
const by=Object.entries(today.by||{}).sort((a,b)=>b[1]-a[1]);
const WK=["일","월","화","수","목","금","토"];const days=[];for(let i=6;i>=0;i--){const k=dayKey(Date.now()-i*864e5);const d=useDay(k);days.push([i?WK[new Date(k+"T00:00:00Z").getUTCDay()]:"오늘",d.t,d.n]);}
const mx=Math.max(1,...days.map(d=>d[1]));
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e4?Math.round(n/1e3)+"K":n>=1e3?(n/1e3).toFixed(1)+"K":String(n);
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:860px;display:grid;gap:16px">
<div class="row" style="flex-wrap:wrap"><div class="grow"><h1>사용량</h1><p class="muted" style="margin:0">${plan} 요금제 · 하루 ${fmt(lim)} 토큰 · 이 기기에서 실제로 주고받은 글로 세요</p></div></div>
<div class="card" style="display:grid;gap:10px"><div class="row"><b style="font-size:15px">오늘</b><span class="grow"></span><span class="muted" style="font-size:12.5px">${hh}시간 ${mm}분 뒤 초기화 (0시, 한국 시간)</span></div>
<div class="row" style="align-items:baseline;gap:6px;flex-wrap:wrap"><span class="price" style="font-size:32px">${pct}%</span><span class="muted">${fmt(used)} / ${fmt(lim)} 토큰 · ${S.lang==="en"?today.n+" answers":"답 "+today.n+"번"}</span></div><div class="bar" style="height:10px"><i style="width:${Math.max(pct,used?1:0)}%"></i></div>
${pct>=80?`<div class="note">${ic("info",16)}<span>한도에 가까워요. 다 쓰면 내일 0시까지 쉬었다가 다시 쓸 수 있어요.</span></div>`:""}</div>
<div class="split" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)"><div class="card" style="display:grid;gap:12px;align-content:start"><b>오늘 모델별</b>${by.length?by.map(b=>`<div style="display:grid;gap:5px;font-size:13px"><div class="row"><span>${esc(b[0])}</span><span class="grow"></span><span class="muted">${fmt(b[1])} · ${Math.round(b[1]/Math.max(1,used)*100)}%</span></div><div class="bar"><i style="width:${Math.round(b[1]/Math.max(1,used)*100)}%;background:${COL[b[0]]||"#2563EB"}"></i></div></div>`).join(""):`<span class="muted" style="font-size:13px">오늘은 아직 쓰지 않았어요.</span>`}</div>
<div class="card" style="display:grid;gap:8px"><b>최근 7일 (토큰)</b><div class="bars" style="height:140px">${days.map(d=>`<div class="${d[0]==="오늘"?"today":""}" title="${S.lang==="en"?d[2]+" answers":d[2]+"번"}"><span>${d[1]?fmt(d[1]):""}</span><i style="height:${Math.max(3,Math.round(d[1]/mx*100))}px;background:${d[0]==="오늘"?"var(--blue)":"#BFD3FB"}"></i>${d[0]}</div>`).join("")}</div></div></div>
<div class="card" style="display:grid;gap:6px;font-size:13px"><b style="font-size:14px">어떻게 세나요?</b><span>${ic("check",14)} 내가 쓴 글과 LAGO의 답 (글자 2개를 1토큰으로 셈)</span><span class="muted">${ic("x",14)} LAGO가 찾아서 붙인 위키 · 뉴스 · 웹 자료는 세지 않아요</span><span class="muted">${ic("info",14)} 이 기기 · 이 브라우저에서 센 값이에요</span></div></div></div>`);}
function vPrefs(){const sw=(k,on)=>`<button class="switch" role="switch" aria-checked="${on}" data-sw="${k}"></button>`;const conf=S.confirm;const t=S.ptab;
const tabs=[["general","일반","sliders"],["look","화면","eye"],["keys","키 설정","term"],["account","계정","user"],["plan","요금제 · 사용량","card"],["data","데이터 · 개인정보","shield"],["family","보호자","heart"],["legal","약관","file"]];
const sw2=(k,on)=>`<button class="switch" role="switch" aria-checked="${on}" data-sw2="${k}"></button>`;const row=(l,sub,right)=>`<div class="prow"><span class="grow">${l}${sub?`<br><span class="muted" style="font-size:12.5px">${sub}</span>`:""}</span>${right}</div>`;
let body="";
if(t==="general")body=row("이름",esc(S.user.name),`<button class="btn sm" data-act="rename">바꾸기</button>`)+(S.renaming?`<form id="renameForm" class="row" style="padding:0 0 12px"><input id="rn" value="${esc(S.user.name)}" aria-label="새 이름"><button class="btn sm pri">저장</button></form>`:"")
+row("새 대화 기본 모델","",`<select id="sMode" aria-label="기본 모델">${TALK_MODES.map(m=>`<option value="${m.id}" ${S.mode===m.id?"selected":""}>${m.lab} · ${m.id}</option>`).join("")}</select>`)
+row("생각 강도","THINK · CODE에서 얼마나 깊게 생각할지",`<select id="sThink" aria-label="생각 강도">${["낮게","보통","깊게"].map((x,i)=>`<option value="${i}" ${S.think===i?"selected":""}>${x}</option>`).join("")}</select>`)
+row("언어","화면에 보이는 글자의 언어예요",`<select id="sLang" aria-label="언어"><option value="ko" ${(S.lang||"ko")==="ko"?"selected":""}>한국어</option><option value="en" ${S.lang==="en"?"selected":""}>English</option></select>`)+row("서버 연결",S.api?"위키백과 · 공공데이터 "+(S.api.publicData?"연결됨":"키 없음")+" · Firebase "+(S.fb?"연결됨 · 로그인 "+esc(S.user.email):"설정 없음"):"미리보기 (예시 답변)","");
if(t==="look"){const SW=["#F7F8FC","#FFFFFF","#F1EFEA","#E8F0FB","#E6F4EC","#F1EAF8","#FCEDEE","#1A1D24"],cur=S.set.bgc||"",im=!!bgImg();
body=row("테마","라이트 · 다크 · 시스템 설정 따라가기",`<select id="sTheme" aria-label="화면 테마">${[["system","시스템"],["light","라이트"],["dark","다크"]].map(([v,l])=>`<option value="${v}" ${(S.theme||"light")===v?"selected":""}>${l}</option>`).join("")}</select>`)
+`<div class="prow col"><span class="grow">배경 색<br><span class="muted" style="font-size:12.5px">대화 화면 바탕색이에요</span></span><div class="swrow">${SW.map(c=>`<button type="button" class="sw ${cur.toLowerCase()===c.toLowerCase()?"on":""}" style="background:${c}" data-bgc="${c}" aria-label="배경 ${c}"></button>`).join("")}<label class="sw pick ${cur&&!SW.some(c=>c.toLowerCase()===cur.toLowerCase())?"on":""}" ${cur&&!SW.some(c=>c.toLowerCase()===cur.toLowerCase())?`style="background:${cur}"`:""}><input type="color" id="bgcIn" value="${/^#[0-9a-f]{6}$/i.test(cur)?cur:"#F7F8FC"}" aria-label="직접 고르기"><span>직접</span></label>${cur?`<button type="button" class="btn sm" data-act="bgcReset">기본색</button>`:""}</div></div>`
+`<div class="prow col"><span class="grow">배경 이미지<br><span class="muted" style="font-size:12.5px">내 기기에만 저장돼요. 큰 사진은 자동으로 줄여요</span></span><div class="swrow">${im?`<span class="bgthumb" style="background-image:url('${bgImg()}')"></span>`:""}<label class="btn sm">${im?"바꾸기":"이미지 고르기"}<input type="file" id="bgFile" accept="image/*" hidden></label>${im?`<button type="button" class="btn sm" data-act="bgiClear">지우기</button>`:""}</div></div>`
+(im?row("이미지 위 덮개","글씨가 잘 보이도록 이미지를 흐리게 덮어요",`<input type="range" id="bgDim" min="0" max="85" value="${S.set.dim}" aria-label="덮개 진하기"><span class="muted" style="font-size:12.5px;min-width:34px;text-align:right">${S.set.dim}%</span>`):"")
+row("글자 크기","대화 글씨 크기예요",`<select id="sFs" aria-label="글자 크기">${[[90,"작게"],[100,"보통"],[115,"크게"],[130,"아주 크게"]].map(([v,l])=>`<option value="${v}" ${S.set.fs===v?"selected":""}>${l}</option>`).join("")}</select>`)
+row("움직임 줄이기","애니메이션과 전환 효과를 꺼요",sw2("motionOff",S.set.motion===false))
+row("추천 질문 보이기","새 대화 화면 아래 예시 질문",sw2("sugs",S.set.sugs!==false));}
if(t==="keys"){const kb=x=>`<kbd>${x}</kbd>`;body=row("메시지 보내기","다른 줄로 넘기는 키는 반대쪽이에요",`<select id="sSend" aria-label="보내기 키">${[["enter","Enter로 보내기 (Shift+Enter 줄바꿈)"],["ctrl","Ctrl+Enter로 보내기 (Enter 줄바꿈)"]].map(([v,l])=>`<option value="${v}" ${S.set.sendkey===v?"selected":""}>${l}</option>`).join("")}</select>`)
+row("단축키 사용","끄면 아래 키가 동작하지 않아요. Esc와 보내기 키는 그대로예요",sw2("keys",S.set.keys!==false))
+`<div class="kblist">${[["새 대화",kb("Ctrl")+kb("K")],["사이드바 열고 닫기",kb("Ctrl")+kb("B")],["검색",kb("/")],["설정",kb("Ctrl")+kb(",")],["창 닫기",kb("Esc")]].map(([a,b])=>`<div class="prow"><span class="grow">${a}</span><span>${b}</span></div>`).join("")}</div>`;}
if(t==="account")body=row("이메일",esc(S.user.email),'<span style="color:var(--g);font-size:12.5px;font-weight:600">인증됨</span>')+row("로그아웃","",`<button class="btn sm" data-act="logout">${ic("logout",14)} 로그아웃</button>`)+row("탈퇴","계정과 대화가 모두 지워져요",`<button class="btn sm danger" data-act="ask-leave">탈퇴하기</button>`)+(conf==="leave"?`<div class="confirm">탈퇴하면 계정과 대화가 모두 지워져요. 유료 요금제는 먼저 해지돼요.<div class="row"><button class="btn sm danger" data-act="leave">탈퇴하기</button><button class="btn sm" data-act="cancel">취소</button></div></div>`:"");
if(t==="plan")body=row(esc(S.user.plan||"Free")+" 요금제","",`<button class="btn sm" data-go="plans">요금제 바꾸기</button>`)+row("오늘 사용량",usagePct()+"% · 매일 0시(한국 시간)에 초기화",`<button class="btn sm pri" data-go="usage">자세히 보기</button>`);
if(t==="data")body=row("LAGO 개선에 내 대화 사용","끄면 그 뒤 대화는 학습에 들어가지 않아요.",sw("learn",S.learn))+row("이미지도 사용","첨부한 이미지와 화면 캡처",sw("learnImg",S.learnImg))+row("내 데이터 전부 지우기","대화 · 프로젝트 · 이미지를 지워요. 되돌릴 수 없어요.",`<button class="btn sm danger" data-act="ask-wipe">지우기</button>`)+(conf==="wipe"?`<div class="confirm">정말 모두 지울까요?<div class="row"><button class="btn sm danger" data-act="wipe">${ic("trash",14)} 모두 지우기</button><button class="btn sm" data-act="cancel">취소</button></div></div>`:"");
if(t==="family")body=(S.guardian?row("보호자 화면",esc(S.guardian.email)+" · 등록됨",`<button class="btn sm" data-go="guardian">열기</button>`):`<form class="card" id="guardForm" style="display:grid;gap:10px"><b>보호자로 등록하기</b><span class="muted" style="font-size:13px;line-height:1.7">아이 계정을 지켜볼 보호자라면 이메일을 등록해 주세요. 등록하면 보호자 화면(사용 제한·리포트)이 열려요. 아이 계정은 2027년 1월부터 열려요.</span><label class="f" for="ge">보호자 이메일<input id="ge" type="email" placeholder="parent@example.com" value="${esc((S.user&&S.user.email)||"")}"></label><p class="err" id="gerr" aria-live="polite"></p><button class="btn pri sm" type="submit" style="justify-self:start">보호자로 등록</button></form>`)+row("아이 가입 흐름","보호자 동의 요청 화면",`<button class="btn sm" data-go="kid">열기</button>`);
if(t==="legal")body=row("이용약관","시행일 2026년 12월 31일",`<button class="btn sm" data-go="terms">보기</button>`)+row("개인정보 처리방침","공개 전에 준비돼요","<span class=\"muted\" style=\"font-size:12.5px\">준비 중</span>");
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:960px"><h1 style="margin-bottom:18px">설정</h1><div class="prefs"><nav class="pnav" aria-label="설정 메뉴">${tabs.map(x=>`<button class="nav ${t===x[0]?"on":""}" data-ptab="${x[0]}">${ic(x[2],17)} ${x[1]}</button>`).join("")}</nav><section class="card" style="min-width:0"><b style="font-size:16px;display:block;margin-bottom:4px">${tabs.find(x=>x[0]===t)[1]}</b>${body}</section></div></div></div>`);}
const TERMS=[["서비스 소개","LAGO는 위키백과 · 뉴스 · 법령 · 웹에서 자료를 찾아 근거와 함께 답하는 AI 서비스예요. 대화 모드(빠른 FACT · FACT · THINK)와 코드 모드(빠른 CODE · CODE)를 제공해요."],["가입과 계정","만 14세 이상만 가입할 수 있어요. 만 14세 미만은 2027년 1월부터 보호자 동의(이메일 + 카드 또는 신분증 확인)를 거쳐 LAGO Goccia 계정으로 쓸 수 있어요. 계정은 본인이 관리하고, 다른 사람과 함께 쓰면 안 돼요."],["요금제와 결제","Free · Pro · Max 요금제가 있어요. 하루 사용 한도는 매일 0시(한국 시간)에 초기화돼요. 유료 요금제는 언제든 해지할 수 있고, 이미 결제한 기간이 끝날 때까지는 그대로 쓸 수 있어요."],["대화 데이터와 학습","내 대화와 첨부한 이미지는 LAGO 다음 버전을 학습하는 데 쓰일 수 있어요. 설정 → 데이터 · 개인정보에서 언제든 끌 수 있고, 끈 뒤의 대화는 학습에 쓰지 않아요. 아이 계정의 대화는 학습에 쓰지 않아요."],["AI 답변의 한계","LAGO는 실수할 수 있어요. 중요한 결정(법률 · 의료 · 금융 등)에는 답변 아래 출처를 직접 확인하고, 필요하면 전문가와 상의해 주세요."],["CODE와 터미널 모드","터미널 모드와 컴퓨터 유즈는 LAGO Desktop에서만 동작해요. 명령은 사용자가 승인한 뒤에만, 연결한 작업 폴더 안에서만 실행돼요. 실행 결과에 대한 확인은 사용자 책임이에요."],["하지 말아야 할 일","다른 사람의 권리를 침해하거나, 법을 어기거나, 서비스를 방해하는 용도로 쓰면 안 돼요. 자동화된 방법으로 한도를 피해 대량으로 쓰는 것도 안 돼요."],["해지와 탈퇴","설정에서 언제든 탈퇴할 수 있어요. 탈퇴하면 대화 · 프로젝트 · 이미지가 지워지고, 유료 요금제는 먼저 해지돼요."],["약관 변경","약관을 바꿀 때는 시행 7일 전에 알려 드려요. 이용자에게 불리한 변경은 30일 전에 알려 드려요."]];
function vTerms(){return `<div style="min-height:100%;background:#fff"><header class="top" style="border-bottom:1px solid var(--line);padding-right:max(20px,env(safe-area-inset-right,0px))">${WM(18)}<b style="margin-left:12px">이용약관</b><span class="grow"></span><button class="btn sm" data-act="back">${ic("back",14)} 돌아가기</button></header>
<div class="terms"><nav style="display:grid;gap:2px;align-content:start;font-size:13px">${TERMS.map((t,i)=>`<a href="#terms" data-scroll="t${i}" class="nav" style="font-size:13px;text-decoration:none">${i+1}. ${t[0]}</a>`).join("")}</nav>
<article><span class="draft">초안 · 공개 전에 법률 검토가 필요해요</span><h1 style="font-size:30px;color:var(--navy);margin:14px 0 4px">LAGO 이용약관</h1><p class="muted" style="font-size:13px">시행일 2026년 12월 31일 · 마지막 수정 2026년 11월 5일</p>${TERMS.map((t,i)=>`<h2 id="t${i}">${i+1}. ${t[0]}</h2><p>${t[1]}</p>`).join("")}</article></div></div>`;}

/* ---------- guardian ---------- */
function vGuardian(){const g=S.guardian;if(!g){go("prefs",true);return "";}const t=S.gtab==="limits"?"limits":"report";const lim=S.limit||2;
const sw=(k)=>`<button class="switch" role="switch" aria-checked="${S[k]!==false}" data-sw="${k}"></button>`;
let body="";
if(t==="report")body=`${S.timeReq==="wait"?`<div class="card" style="display:grid;gap:8px;border-color:var(--k);background:var(--kt)"><b class="row">${ic("clock",15)} 시간을 더 요청했어요</b><span style="font-size:13px">"${esc(((S.kidReqs[0]||{}).reason)||"")}"</span><div class="row"><button class="btn sm pri" data-act="timeOk">30분 늘려 주기</button><button class="btn sm" data-act="timeNo">안 돼요</button></div></div>`:""}
<div class="card" style="display:grid;gap:10px;justify-items:start"><span class="logo-dot" style="width:40px;height:40px;border-radius:12px;background:var(--kt);color:var(--kd)">${ic("shield",20)}</span><b style="font-size:16px">연결된 아이 계정이 아직 없어요</b><span class="muted" style="font-size:13.5px;line-height:1.7">아이 계정(LAGO Goccia)은 2027년 1월에 열려요. 아이가 가입하고 보호자 동의를 마치면, 사용 시간과 주제 요약 리포트가 여기에 나타나요. 대화 내용은 보호자도 볼 수 없어요.</span></div>`;
if(t==="limits")body=`<div class="card" style="display:grid">
<div class="prow"><span class="grow">하루 사용 시간</span><select id="gLimit" aria-label="하루 사용 시간">${[1,2,3,4].map(h=>`<option value="${h}" ${lim===h?"selected":""}>${h}시간</option>`).join("")}</select></div>
<div class="prow"><span class="grow">밤에는 쓰지 않기<br><span class="muted" style="font-size:12px">밤 10시 ~ 아침 7시</span></span>${sw("night")}</div>
<div class="prow"><span class="grow">THINK 모드</span>${sw("kThink")}</div><div class="prow"><span class="grow">공부 모드 항상 켜기<br><span class="muted" style="font-size:12px">답을 바로 주지 않고 풀이를 같이 생각해요</span></span><button class="switch" role="switch" aria-checked="${S.kStudy===true}" data-sw="kStudy"></button></div><div class="prow"><span class="grow">쉬는 시간 알림<br><span class="muted" style="font-size:12px">40분마다 잠깐 쉬자고 알려 줘요</span></span>${sw("kBreak")}</div>
<div class="prow"><span class="grow">CODE 영역<br><span class="muted" style="font-size:12px">코딩 공부용 · 터미널은 항상 꺼져 있어요</span></span>${sw("kCode")}</div></div>
<div class="card" style="display:grid;gap:10px"><div class="row"><span class="grow">보호자 등록 해제<br><span class="muted" style="font-size:12px">등록을 풀면 보호자 화면이 사라져요</span></span><button class="btn sm danger" data-act="unguard">해제하기</button></div>
${S.confirm==="unguard"?`<div class="confirm">정말 해제할까요? 설정한 사용 제한은 그대로 남아요.<div class="row"><button class="btn sm danger" data-act="unguardYes">해제하기</button><button class="btn sm" data-act="cancel">취소</button></div></div>`:""}</div>`;
return shell(`${topbar("보호자")}<div class="scroll"><div class="wrap page" style="max-width:820px;display:grid;gap:16px">
<div class="row" style="gap:14px"><span class="av" style="width:48px;height:48px;font-size:18px;background:var(--k);color:#fff">${esc((g.email||"보").slice(0,1).toUpperCase())}</span><div class="grow" style="min-width:0"><h1 style="margin:0;font-size:24px">보호자</h1><span class="muted" style="font-size:13px;overflow-wrap:anywhere">${esc(g.email)} · 등록됨</span></div></div>
<div class="seg" role="tablist" style="max-width:420px">${[["report","리포트"],["limits","사용 제한"]].map(x=>`<button role="tab" aria-pressed="${t===x[0]}" data-gtab="${x[0]}">${x[1]}</button>`).join("")}</div>
${body}</div></div>`);}

function armScroll(){const sc=document.querySelector(".main > .scroll");const top=document.querySelector("header.top");if(!sc||!top)return;const h1=sc.querySelector(".page h1");const stt=top.querySelector(".stt");const tb=top.querySelector(".tbnew");const btn=sc.querySelector(".hbtn");if(!(h1&&stt)&&!tb)return;if(h1&&stt)stt.textContent=h1.textContent.trim();
const upd=()=>{const bb=top.getBoundingClientRect().bottom;if(h1&&stt){const r=h1.getBoundingClientRect();top.classList.toggle("st",r.top+r.height/2<bb);}if(tb&&btn){const on=btn.getBoundingClientRect().bottom<bb;tb.classList.toggle("show",on);tb.tabIndex=on?0:-1;}};
sc.addEventListener("scroll",upd,{passive:true});upd();}
/* ---------- render ---------- */
let brandStage=null;
function fixPops(){const c=document.querySelector(".composer");if(!c)return;const r=c.getBoundingClientRect();document.querySelectorAll(".pop").forEach(pp=>pp.classList.toggle("down",r.top<420&&innerHeight-r.bottom>r.top));}
/* ---------- 첨부 · TOOLS 만들기·배포 · 대화 공유 ---------- */
const fmtSize=n=>n<1024?n+"B":n<1048576?Math.round(n/1024)+"KB":(n/1048576).toFixed(1)+"MB";
function makeThumb(file){return new Promise(res=>{if(!file||!/^image\//.test(file.type))return res("");const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{try{const k=Math.min(1,480/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));c.getContext("2d").drawImage(im,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",0.7));}catch(e){res("");}URL.revokeObjectURL(u);};im.onerror=()=>{URL.revokeObjectURL(u);res("");};im.src=u;});}
function attOf(file,raw,thumb){if(file)return{kind:/^image\//.test(file.type)?"image":"file",name:file.name,size:file.size,thumb:thumb||""};if(raw&&raw.length>120)return{kind:"text",name:"붙여 넣은 글",chars:raw.length,preview:raw.slice(0,140)};return null;}
function attHtml(a){if(a.kind==="image")return a.thumb?`<figure class="attimg"><img src="${a.thumb}" alt="올린 이미지: ${esc(a.name)}"><figcaption>${esc(a.name)}${a.size?" · "+fmtSize(a.size):""}</figcaption></figure>`:`<div class="attcard">${ic("file",18)}<span><b>${esc(a.name)}</b><small>이미지${a.size?" · "+fmtSize(a.size):""}</small></span></div>`;
if(a.kind==="text")return `<div class="attcard">${ic("news",18)}<span><b>${esc(a.name)} · ${(a.chars||0).toLocaleString()}자</b><small>${a.preview?esc(a.preview)+((a.chars||0)>140?"…":""):"붙여 넣은 글"}</small></span></div>`;
return `<div class="attcard">${ic("file",18)}<span><b>${esc(a.name)}</b><small>파일${a.size?" · "+fmtSize(a.size):""}</small></span></div>`;}
const userMsg=m=>`<div class="umw">${m.chip?`<span class="status uchip">${ic(m.chip.ic,14)} ${esc(m.chip.lab)}</span>`:""}${m.att?attHtml(m.att):""}${m.text?`<div class="um">${esc(m.text)}</div>`:""}</div>`;
const myTool=id=>(S.myTools||[]).find(x=>x.id===id);
function toolDef(id){if(id&&id.startsWith("u:")){const d=myTool(id.slice(2));return d?{id,lab:d.name,ic:"bot",c:"#4A5FA8",def:d,opts:d.opts||[],input:d.input}:null;}const t=TOOLS.find(x=>x.id===id);return t?{id,lab:t.lab,ic:t.ic,c:t.c,opts:t.id==="translate"?["영어","한국어","일본어","중국어","스페인어"]:t.id==="summary"?["3줄","5줄","한 문단"]:[],input:t.id==="extract"?"file":"both"}:null;}
function fitPop(){document.querySelectorAll(".pop").forEach(pp=>{const cs=getComputedStyle(pp);if(cs.position!=="absolute")return;if(!pp.offsetParent)return;pp.style.maxHeight="";if(pp.classList.contains("plusp")){const host=pp.offsetParent,bt=host.querySelector('[data-act="plus"]'),hr=host.getBoundingClientRect();pp.style.top="";pp.style.bottom="";pp.style.left="";pp.style.right="";if(bt){const br=bt.getBoundingClientRect(),w=Math.min(330,innerWidth-24);if(innerWidth-br.right-8>=w+8){pp.classList.add("beside");pp.style.left=(br.right+8-hr.left)+"px";pp.style.right="auto";const tb0=document.querySelector("header.top");const lim=Math.max(8,tb0?tb0.getBoundingClientRect().bottom+8:8),cap=Math.max(180,innerHeight-lim-12);pp.style.maxHeight=cap+"px";pp.style.bottom="auto";const H=pp.getBoundingClientRect().height;const t=Math.min(Math.max(br.bottom-H,lim),innerHeight-12-H);pp.style.top=(t-hr.top)+"px";return;}}pp.classList.remove("beside");pp.style.left="8px";pp.style.right="auto";}const pr=pp.getBoundingClientRect();let top=0,bot=innerHeight;for(let el=pp.parentElement;el&&el!==document.body;el=el.parentElement){const o=getComputedStyle(el).overflowY;if(o!=="visible"){const r=el.getBoundingClientRect();top=Math.max(top,r.top);bot=Math.min(bot,r.bottom);}}const tb=document.querySelector(".topbar");if(tb)top=Math.max(top,tb.getBoundingClientRect().bottom);const down=pp.classList.contains("down");const room=down?bot-pr.top-12:pr.bottom-top-10;pp.style.maxHeight=Math.max(140,Math.min(560,room))+"px";});}
window.addEventListener("resize",()=>fitPop());
function plusPop(){const code=S.area==="code";const all=code||S.goccia?"":null;
const trow=(go,ico,c,lab,sub)=>`<button type="button" class="opt" ${go}><span class="mi" style="background:${c}22;color:${c}">${ic(ico,17)}</span><span class="grow"><b>${esc(lab)}</b>${sub?`<small>${esc(sub)}</small>`:""}</span></button>`;
const mid=all===""?"":`<div class="pbody"><div class="hint">TOOLS</div>${TOOLS.map(t=>trow(`data-seltool="${t.id}"`,t.ic,t.c,t.lab)).join("")}${(S.myTools||[]).length?`<div class="hint">내 TOOLS</div>${(S.myTools||[]).map(t=>trow(`data-seltool="u:${t.id}"`,"bot","#4A5FA8",t.name)).join("")}`:""}</div><div class="pfoot"><button type="button" class="opt" data-go="tool-new"><span class="mi" style="background:var(--mist);color:var(--blue)">${ic("plus",17)}</span><span class="grow"><b>TOOLS 만들기</b></span></button><button type="button" class="opt" data-go="tools"><span class="mi" style="background:var(--mist);color:var(--blue)">${ic("grid",17)}</span><span class="grow"><b>모두 보기</b></span></button></div>`;
return `<div class="pop plusp" role="dialog" aria-label="첨부와 TOOLS" style="left:8px;right:auto"><button type="button" class="opt phead2" data-act="pickFile"><span class="mi" style="background:var(--mist);color:var(--blue)">${ic("clip",17)}</span><span class="grow"><b>사진·파일 올리기</b><small>이미지 · PDF · Word · 텍스트 (15MB까지)</small></span></button>${mid}</div>`;}
function selRow(){const a=S.att,t=S.selTool&&toolDef(S.selTool);if(!a&&!t)return "";
const opt=t&&t.opts.length?`<select id="selopt" class="selopt" aria-label="${t.id==="translate"?"번역할 언어":t.id==="summary"?"요약 길이":"옵션"}">${t.opts.map(o=>`<option ${(S.selOpt||t.opts[0])===o?"selected":""}>${esc(o)}</option>`).join("")}</select>`:"";
return `<div class="selrow">${t?`<span class="selchip" style="--c:${t.c}">${ic(t.ic,14)}<b>${esc(t.lab)}</b><button type="button" class="x" data-act="toolClear" aria-label="도구 선택 해제">${ic("x",12)}</button></span>${opt}`:""}${a?`<span class="selchip att">${a.kind==="image"&&a.thumb?`<img src="${a.thumb}" alt="">`:ic("file",14)}<b>${esc(a.name)}</b><small>${fmtSize(a.size)}</small><button type="button" class="x" data-act="attClear" aria-label="첨부 지우기">${ic("x",12)}</button></span>`:""}</div>`;}
async function runTool(k,o){const raw=(o.raw||"").trim(),file=o.file||null,opt=o.opt||"",def=o.def||null;
const lab=def?def.name:TOOLS.find(x=>x.id===k).lab;const thumb=o.thumb!=null?o.thumb:(file?await makeThumb(file):"");const att=attOf(file,raw,thumb);
let disp=k==="extract"?"글자를 뽑아 줘":k==="translate"?`${opt}로 번역해 줘`:k==="summary"?`${opt}로 요약해 줘`:(opt?opt+" · ":"")+(def?def.name:lab)+" 실행";
if(!att&&raw)disp=k==="custom"?(opt?opt+" · ":"")+lab+": "+raw:k==="spell"?raw:disp+": "+raw;
if(!o.keep){S.area="talk";S.cur=null;S.temp=false;}
send(disp,{tool:k,raw,opt,file,def,att,chip:k==="spell"?{ic:"layers",lab:"맞춤법 검사기"}:null});
const c=curChat();if(c&&c.msgs.length<=2){c.title=lab+" · "+(file?file.name:raw.slice(0,16)||lab);}save();}
function composerSend(text){text=(text||"").trim();const tid=S.selTool,at=S.att,q=$("#q");
if(!tid&&!at){if(q)q.value="";send(text);return;}
if(tid){const d=toolDef(tid);if(!d){S.selTool=null;render();return;}if(!text&&!at){toast("글을 쓰거나 파일을 올려 주세요");return;}
 const k=tid.startsWith("u:")?"custom":tid;if((k==="translate"||k==="spell")&&!modelOn()){toast("모델 서버가 지금 꺼져 있어요");return;}
 const opt=S.selOpt||d.opts[0]||"";S.selTool=null;S.att=null;S.selOpt=null;if(q)q.value="";
 runTool(k,{raw:text,opt,file:at?at.file:null,def:k==="custom"?d.def:null,keep:true,thumb:at?at.thumb:""});return;}
S.att=null;if(q)q.value="";send(text||"이 파일 내용을 알려 줘",{ctxFile:at.file,att:{kind:at.kind,name:at.name,size:at.size,thumb:at.thumb}});}
async function pickedFile(f){if(!f)return;if(f.size>15*1024*1024){toast("파일이 너무 커요. 15MB 이하로 올려 주세요");return;}
S.att={file:f,name:f.name,size:f.size,kind:/^image\//.test(f.type)?"image":"file",thumb:""};render();const th=await makeThumb(f);if(S.att&&S.att.file===f&&th){S.att.thumb=th;render();}}
/* 내 TOOLS */
const TOOL_INPUT=[["text","글만 붙여 넣기"],["file","파일만 올리기"],["both","글 또는 파일"]];
function toolCard(t,mine){const c=mine?"#4A5FA8":t.c,icn=mine?"bot":t.ic,name=mine?t.name:t.lab,desc=mine?t.desc:t.d,go=mine?`data-ctool="${t.id}"`:`data-go="${t.route}"`;const pin=!mine&&S.pinTools.includes(t.id);
return `<div class="card agent"><button class="agentopen" ${go}><span class="row" style="padding-right:28px"><span class="aic" style="background:${c}1f;color:${c}">${ic(icn,18)}</span><b style="font-size:15px">${esc(name)}</b></span><p>${esc(desc||"설명 없음")}</p><span class="row muted" style="font-size:11.5px;margin-top:auto"><span class="tag" style="background:#EEF2F8;color:var(--mut)">${mine?esc(MODEL_OPTS.find(x=>x[0]===(t.model||""))[1].replace("기본 (Fonte)","Fonte")):"LAGO"} 1.0</span>${mine?(t.pub?'<span style="color:#1F8A4C">공개 중</span>':'<span>내가 만듦</span>'):'<span>LAGO</span>'}</span></button>${mine?"":`<button class="fav" data-pintool="${t.id}" aria-pressed="${pin}" aria-label="${pin?"사이드바에서 빼기":"사이드바에 고정"}" title="${pin?"사이드바에서 빼기":"사이드바에 고정"}">${ic("pin",16)}</button>`}</div>`;}
function vTools(){const mine=S.toolTab==="mine";const list=mine?(S.myTools||[]):TOOLS;const pm=S.pubTool&&S.pubKind==="tool"&&myTool(S.pubTool);
return shell(`${topbar("",`<button class="btn pri sm tbnew" data-act="newTool" tabindex="-1">${ic("plus",15)} 새 TOOL</button>`)}<div class="scroll"><div class="wrap page" style="max-width:1100px">
${hubHead("tools",`<button class="btn pri hbtn" data-act="newTool">${ic("plus",16)} 새 TOOL</button>`)}
<div class="cats"><button aria-pressed="${!mine}" data-ttab="lago">LAGO TOOLS</button><button aria-pressed="${mine}" data-ttab="mine">나만의 TOOLS ${(S.myTools||[]).length}</button></div>
<div class="grid3">${mine?`<button class="card agent newagent" data-act="newTool">${ic("plus",22)} 새 TOOL 만들기<span class="muted" style="font-weight:400;font-size:12.5px">이름 · 지시문 · 넣을 것만 정하면 돼요</span></button>`:""}${list.map(t=>toolCard(t,mine)).join("")}</div></div></div>${pm?pubModal(pm,"tool"):""}`);}
const SK={chat:"대화",tool:"TOOL",mode:"MODE",html:"HTML"};
function sharedItems(){const o=location.origin,it=[];S.chats.filter(c=>c.shared&&c.shareId).forEach(c=>it.push({k:"chat",id:c.id,title:c.title,link:o+"/s/"+c.shareId}));
(S.myTools||[]).filter(t=>t.pub).forEach(t=>it.push({k:"tool",id:t.id,title:t.name,link:o+"/t/"+t.pub.id}));
S.myAgents.filter(a=>a.pub).forEach(a=>it.push({k:"mode",id:a.id,title:a.name,link:o+"/t/"+a.pub.id}));
(S.myHtml||[]).filter(h=>h.pub).forEach(h=>it.push({k:"html",id:h.id,title:h.title,link:o+"/h/"+h.pub.id}));return it;}
function pickList(){const k=S.sharePick;const rows=k==="chat"?S.chats.filter(c=>!c.temp&&!c.kid&&!(c.shared&&c.shareId)).map(c=>[c.id,c.title,"msg"]):k==="tool"?(S.myTools||[]).filter(t=>!t.pub).map(t=>[t.id,t.name,"bot"]):k==="mode"?S.myAgents.filter(a=>!a.pub).map(a=>[a.id,a.name,"bot"]):(S.myHtml||[]).filter(h=>!h.pub).map(h=>[h.id,h.title,"code"]);
return `<div class="tempask" role="dialog" aria-label="공유할 것 고르기" data-act="pickClose"><div class="card sharecard" data-stop="1"><div class="row"><b style="font-size:17px">${SK[k]} 추가</b><span class="grow"></span><button class="iconbtn" data-act="pickClose" aria-label="닫기">${ic("x",18)}</button></div>
${k==="html"?`<button class="btn pri sm" data-act="htmlNew" style="justify-self:start">${ic("plus",14)} 새 HTML 붙여 넣기 · 파일 올리기</button>`:""}
${rows.length?`<div class="list">${rows.slice(0,30).map(r=>`<button data-act="pickGo" data-id="${r[0]}">${ic(r[2],16)}<span class="grow">${esc(r[1]||"제목 없음")}</span><span class="muted" style="font-size:12px">공유하기</span></button>`).join("")}</div>`:`<p class="muted" style="margin:0;font-size:13px">${k==="chat"?"공유할 대화가 없어요.":k==="html"?"올려 둔 HTML이 없어요. 위 버튼으로 추가해 주세요.":"공유하지 않은 "+SK[k]+"이(가) 없어요. TOOLS / MODES에서 먼저 만들어 주세요."}</p>`}</div></div>`;}
function vShared(){const items=sharedItems(),html=S.myHtml||[];const pm=S.pubTool&&pubItem(S.pubKind,S.pubTool);
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:900px;display:grid;gap:16px">
<div class="row phead"><div class="grow"><h1 style="margin:0">공유</h1><p class="muted" style="margin:4px 0 0">링크로 공유한 대화 · TOOL · MODE · HTML을 한곳에서 보고, 추가하고, 멈출 수 있어요.</p></div></div>
<div class="row" style="gap:8px;flex-wrap:wrap"><b style="font-size:13px" class="muted">추가</b>${["chat","tool","mode","html"].map(k=>`<button class="btn sm" data-act="pickOpen" data-k="${k}">${ic("plus",14)} ${SK[k]}</button>`).join("")}</div>
<h2 style="margin:6px 0 0;font-size:16px">공유 중 <span class="muted" style="font-weight:400">${items.length}</span></h2>
${items.length?items.map(x=>`<div class="card" style="padding:12px 16px;display:grid;gap:8px"><div class="row" style="gap:10px;flex-wrap:wrap"><span class="tag" style="background:#EEF2F8;color:var(--mut)">${SK[x.k]}</span><b class="grow" style="min-width:120px">${esc(x.title||"제목 없음")}</b></div><div class="muted" style="font:12.5px var(--mono);word-break:break-all">${esc(x.link)}</div>
<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm pri" data-act="copy" data-text="${esc(x.link)}">${ic("copy",14)} 링크 복사</button><a class="btn sm" href="${esc(x.link)}" target="_blank" rel="noopener">열기</a>${x.k==="chat"?`<button class="btn sm" data-act="share" data-id="${x.id}">관리</button>`:`<button class="btn sm" data-act="toolPubOpen" data-k="${x.k}" data-id="${x.id}">관리</button>`}<button class="btn sm danger" data-act="unshare" data-k="${x.k}" data-id="${x.id}" ${S.shareBusy||S.pubBusy?"disabled":""}>공유 멈추기</button></div></div>`).join(""):`<div class="card" style="padding:18px"><p class="muted" style="margin:0">아직 공유한 게 없어요. 위의 ‘추가’에서 골라 보세요.</p></div>`}
<h2 style="margin:10px 0 0;font-size:16px">내 HTML <span class="muted" style="font-weight:400">${html.length}</span></h2>
${html.length?html.map(h=>`<div class="card" style="padding:12px 16px;display:grid;gap:8px"><div class="row" style="gap:10px;flex-wrap:wrap"><span class="svcico" style="background:#4A5FA8;width:32px;height:32px">${ic("code",16)}</span><div class="grow" style="min-width:120px"><b>${esc(h.title)}</b><div class="muted" style="font-size:12.5px">${Math.max(1,Math.round((h.code||"").length/1024))}KB</div></div>${h.pub?`<span class="tag" style="background:#E8F5EC;color:#1F8A4C">공유 중</span>`:""}</div>
<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm ${h.pub?"":"pri"}" data-act="toolPubOpen" data-k="html" data-id="${h.id}">${ic("share",14)} ${h.pub?"관리":"공유하기"}</button><button class="btn sm" data-act="htmlEdit" data-id="${h.id}">${ic("pen",14)} 고치기</button>${S.delHtml===h.id?`<span class="muted" style="font-size:13px">${h.pub?"공유도 함께 멈춰요. ":""}정말 뺄까요?</span><button class="btn sm danger" data-act="htmlDel" data-id="${h.id}">빼기</button><button class="btn sm" data-act="htmlDelNo">취소</button>`:`<button class="btn sm" data-act="htmlDel" data-id="${h.id}">${ic("trash",14)} 빼기</button>`}</div></div>`).join(""):`<div class="card" style="padding:18px"><p class="muted" style="margin:0">넣어 둔 HTML이 없어요. ‘추가 → HTML’로 코드를 붙여 넣거나 .html 파일을 올려 주세요. AI가 만든 HTML은 대화에서 바로 공유할 수도 있어요.</p></div>`}
</div></div>${S.share?shareModal():""}${S.sharePick?pickList():""}${S.htmlDraft?htmlEditor(S.htmlDraft):""}${pm?pubModal(pm,S.pubKind):""}`);}
function htmlEditor(d){return `<div class="tempask" role="dialog" aria-label="HTML 편집" data-act="htmlClose"><div class="card sharecard" data-stop="1" style="width:min(720px,94vw);max-height:92vh;overflow:auto"><div class="row"><b style="font-size:17px">${d.id?"HTML 수정":"HTML 추가"}</b><span class="grow"></span><button class="iconbtn" data-act="htmlClose" aria-label="닫기">${ic("x",18)}</button></div>
<label class="fld">제목<input id="hT" maxlength="40" value="${esc(d.title||"")}" placeholder="예: 우리 반 시간표" autocomplete="off"></label>
<label class="fld">HTML 코드<textarea id="hC" rows="11" maxlength="200000" spellcheck="false" style="resize:vertical;font:12.5px/1.5 var(--mono)" placeholder="<!doctype html>…">${esc(d.code||"")}</textarea></label>
<label class="fld">또는 파일 올리기<input id="hF" type="file" accept=".html,.htm,.txt,text/html"></label>
${d.prev&&d.code?`<iframe title="미리보기" sandbox="allow-scripts" srcdoc="${esc(d.code)}" style="width:100%;height:280px;border:1px solid var(--line);border-radius:10px;background:#fff"></iframe>`:""}
<p class="err" id="herr" role="alert">${esc(d.err||"")}</p>
<div class="row" style="gap:8px;justify-content:flex-end"><button class="btn" data-act="htmlPrev">${d.prev?"미리보기 닫기":"미리보기"}</button><button class="btn pri" data-act="htmlSave">저장</button></div></div></div>`;}
function vToolNew(){const e=S.editTool&&myTool(S.editTool),d=e||S.toolDraft||{};
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:680px;display:grid;gap:16px">
<div class="row" style="gap:10px"><button class="btn sm" data-go="tools">${ic("back",14)} TOOLS</button></div>
<div><h1 style="margin:0">${e?"도구 수정":"TOOLS 만들기"}</h1><p class="muted" style="margin:4px 0 0">무슨 일을 하는 도구인지 적으면, 쓸 때마다 그 지시대로 LAGO가 처리해요.</p></div>
<form id="toolNewForm" class="card" style="display:grid;gap:14px" novalidate>
<label class="fld">이름<input id="tnN" maxlength="30" value="${esc(d.name||"")}" placeholder="예: 맞춤법 검사기" autocomplete="off"></label>
<label class="fld">한 줄 설명 (선택)<input id="tnD" maxlength="120" value="${esc(d.desc||"")}" placeholder="예: 틀린 맞춤법과 띄어쓰기를 고쳐 줘요" autocomplete="off"></label>
<label class="fld">지시문<textarea id="tnI" rows="6" maxlength="1500" style="resize:vertical" placeholder="예: 입력한 글의 맞춤법과 띄어쓰기만 고쳐서 돌려줘. 내용은 바꾸지 말고, 고친 부분을 마지막에 한 줄로 알려 줘.">${esc(d.ins||"")}</textarea></label>
<label class="fld">무엇을 넣나요<select id="tnT">${TOOL_INPUT.map(x=>`<option value="${x[0]}" ${(d.input||"both")===x[0]?"selected":""}>${x[1]}</option>`).join("")}</select></label>
${modelSel("tnM",d.model)}
<label class="fld">선택지 (선택, 쉼표로)<input id="tnO" maxlength="120" value="${esc((d.opts||[]).join(", "))}" placeholder="예: 존댓말, 반말" autocomplete="off"></label>
<div class="note">${ic("info",16)}<span>도구는 고른 모델이 지시문대로 답해요. 따로 학습한 일이 아니어서 틀릴 수 있어요. 지시문은 1,500자, 한 번에 넣는 글은 3,000자까지예요.</span></div>
<p class="err" id="tnerr" role="alert"></p><div class="row" style="justify-content:flex-end;gap:8px"><button class="btn" type="button" data-go="tools">취소</button><button class="btn pri" type="submit">${e?"저장":"만들기"}</button></div></form></div></div>`);}
function vToolMy(){const d=myTool(S.curTool);if(!d){go("tools",true);return "";}const dr=S.toolIn||{};const inp=d.input||"both";
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:720px;display:grid;gap:16px">
<div class="row" style="gap:10px"><button class="btn sm" data-go="tools">${ic("back",14)} TOOLS</button></div>
<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="toolPubOpen" data-k="tool" data-id="${d.id}">${ic("share",14)} ${d.pub?"공개 관리":"공개하기"}</button><button class="btn sm" data-act="toolEdit" data-id="${d.id}">${ic("pen",14)} 고치기</button>${S.delTool===d.id?`<span class="muted" style="font-size:13px">정말 지울까요?</span><button class="btn sm danger" data-act="toolDel" data-id="${d.id}">지우기</button><button class="btn sm" data-act="toolDelNo">취소</button>`:`<button class="btn sm danger" data-act="toolDel" data-id="${d.id}">${ic("trash",14)} 지우기</button>`}</div>
<div class="row" style="gap:12px"><span class="svcico" style="background:#4A5FA8">${ic("bot",20)}</span><div class="grow"><h1 style="margin:0">${esc(d.name)}</h1><span class="muted" style="font-size:13.5px">${esc(d.desc||"")}</span></div></div>
${modelOn()?"":`<div class="note">${ic("info",16)}<span>모델 서버가 지금 꺼져 있어요. 만들고 다듬어 두면 서버가 켜졌을 때 바로 써요.</span></div>`}
<form id="toolMyForm" class="card" style="display:grid;gap:14px" novalidate>${inp!=="file"?`<label class="fld">글<textarea id="tmT" rows="7" maxlength="3000" style="resize:vertical" placeholder="여기에 글을 붙여 넣어 주세요">${esc(dr.text||"")}</textarea></label>`:""}
${inp!=="text"?`<label class="fld">${inp==="both"?"또는 파일 올리기":"파일 올리기"}<input id="tmF" type="file" accept=".pdf,.docx,.txt,.md,.csv,.tsv,.json,.html,.htm,.srt,.log,image/*"></label>`:""}
${(d.opts||[]).length?`<label class="fld">옵션<select id="tmO">${d.opts.map(o=>`<option>${esc(o)}</option>`).join("")}</select></label>`:""}
<p class="err" id="tmerr" role="alert"></p><div class="row" style="justify-content:flex-end"><button class="btn pri" ${modelOn()?"":"disabled"}>실행하기</button></div></form></div></div>${S.pubTool===d.id&&S.pubKind==="tool"?pubModal(d,"tool"):""}`);}
const MODEL_OPTS=[["","기본 (Fonte)"],["fonte","Fonte"],["torrente","Torrente"],["mare","Mare"],["code","Code"]];
const modelSel=(id,v)=>`<label class="fld">답하는 모델<select id="${id}">${MODEL_OPTS.map(x=>`<option value="${x[0]}" ${(v||"")===x[0]?"selected":""}>${x[1]}</option>`).join("")}</select><span class="muted" style="font-size:12px;font-weight:400">지금은 Fonte만 연결돼 있어요. 다른 모델은 연결되면 이 선택대로 답해요.</span></label>`;
async function authGet(path){const h={};try{if(S.fb&&S.user&&S.user.uid&&S.fb.auth.currentUser)h.authorization="Bearer "+await S.fb.auth.currentUser.getIdToken();}catch{}return fetch(path,{headers:h});}
const pubItem=(k,id)=>k==="mcp"?(S.myMcp||[]).find(a=>a.id===id):k==="mode"?S.myAgents.find(a=>a.id===id):k==="html"?(S.myHtml||[]).find(h=>h.id===id):myTool(id);
const KLAB={tool:"도구",mode:"MODE",html:"HTML 페이지"};
function audBlock(t,k){let a=S.aud;if(!a||a.for!==t.id){a=S.aud={for:t.id,mode:(t.emails&&t.emails.length)?"emails":"link",em:(t.emails||[]).join(", "),inv:false};}
return `<div class="fld" style="display:grid;gap:6px;font-size:13px"><span style="font-weight:500">누가 열 수 있나요</span><div class="seg"><button type="button" aria-pressed="${a.mode==="link"}" data-aud="link">링크가 있는 사람</button><button type="button" aria-pressed="${a.mode==="emails"}" data-aud="emails">이메일로 지정한 사람</button></div>${a.mode==="emails"?`<textarea id="audEm" rows="2" maxlength="600" placeholder="a@example.com, b@example.com (10명까지)" style="resize:vertical">${esc(a.em)}</textarea><label class="check" style="align-items:center"><input type="checkbox" id="audInv" ${a.inv?"checked":""}><span>초대 메일 보내기</span></label><span class="muted" style="font-size:12px">${k==="html"?"HTML 페이지는 링크를 아는 사람이 누구나 열 수 있어요. 메일은 링크를 전해 주는 용도예요.":"그 주소로 로그인한 사람만 열 수 있어요."}</span>`:""}</div>`;}
function audGet(){const a=S.aud||{mode:"link"};if(a.mode!=="emails")return{emails:[],invite:false};const em=(a.em||"").split(/[\s,;]+/).map(x=>x.trim().toLowerCase()).filter(x=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));return{emails:[...new Set(em)].slice(0,10),invite:!!a.inv};}
function pubModal(t,k){k=k||"tool";const p=t.pub,link=p?location.origin+(k==="html"?"/h/":"/t/")+p.id:"";
return `<div class="tempask" role="dialog" aria-label="${KLAB[k]} 공개" data-act="pubClose"><div class="card sharecard" data-stop="1"><div class="row"><b style="font-size:17px">${KLAB[k]} 공개</b><span class="grow"></span><button class="iconbtn" data-act="pubClose" aria-label="닫기">${ic("x",18)}</button></div>
<div class="shareprev"><b>${esc(t.name||t.title)}</b><span class="muted" style="font-size:12.5px">${esc(k==="html"?"HTML 페이지":(t.desc||"설명 없음"))}</span></div>
<span class="muted" style="font-size:13px">${k==="html"?"링크를 열면 이 페이지가 그대로 보여요. 로그인 없이도 열리고, 서버나 내 정보에는 접근하지 못하게 격리돼요. 고치면 ‘업데이트’를 눌러 주세요.":`링크를 연 사람은 <b>로그인하면</b> 이 ${KLAB[k]}를 쓸 수 있어요. 지시문은 화면에 보이지 않고, 사용량은 쓰는 사람의 하루 한도에서 빠져요. 받는 사람이 “내 MODE/TOOLS에 넣기”를 누르면 지시문도 함께 복사돼요. 고치면 ‘업데이트’를 눌러 반영해 주세요.`}</span>${audBlock(t,k)}
${p?`<div class="row"><input readonly value="${link}" id="pubLink" aria-label="도구 링크" style="font:13px var(--mono)"><button class="btn sm pri" data-act="copy" data-text="${link}">${ic("copy",14)} 복사</button></div>`:""}
<div class="prow" style="padding:6px 0;border:0"><span class="grow" style="font-size:13px">만든 사람 이름 표시</span><button class="switch" role="switch" aria-checked="${!!t.showName}" data-act="pubName" data-id="${t.id}"></button></div>
<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn pri sm" data-act="pubDo" data-id="${t.id}" ${S.pubBusy?"disabled":""}>${p?"업데이트":"공개하기"}</button>${p?`<button class="btn sm" data-act="pubOff" data-id="${t.id}" ${S.pubBusy?"disabled":""}>공개 내리기</button>`:""}</div></div></div>`;}
async function pubFetch(path,body){if(!PATHMODE||!S.fb||!S.user||!S.user.uid)throw new Error("로그인한 실제 서비스에서만 쓸 수 있어요");const tok=await S.fb.auth.currentUser.getIdToken();const r=await fetch(path,{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+tok},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok){const er=new Error(j.error||"처리하지 못했어요");er.needAck=!!j.needAck;er.risk=j.risk||[];er.url=j.url||"";er.block=!!j.block;throw er;}return j;}
async function pubDo(id){const k=S.pubKind||"tool",t=pubItem(k,id);if(!t)return;const au=audGet();if(S.aud&&S.aud.mode==="emails"&&!au.emails.length){toast("이메일 주소를 하나 이상 적어 주세요");return;}
S.pubBusy=true;render();try{let j;const base={id:t.pub&&t.pub.id,showName:!!t.showName,ownerName:S.user.name,emails:au.emails,invite:au.invite};
if(k==="html")j=await pubFetch("/api/html/publish",{...base,title:t.title,code:t.code});
else if(k==="mode")j=await pubFetch("/api/tools/publish",{...base,kind:"mode",name:t.name,desc:t.desc,ins:t.ins,input:"text",starters:t.starters||[],model:t.model||""});
else j=await pubFetch("/api/tools/publish",{...base,kind:"tool",name:t.name,desc:t.desc,ins:t.ins,input:t.input,opts:t.opts,model:t.model||""});
const was=!!t.pub;t.pub={id:j.id};t.emails=au.emails;save();toast((was?"업데이트했어요":"공개했어요")+(au.invite?(j.sent?` · 초대 메일 ${j.sent}통`:(j.mail?" · 메일은 보내지 못했어요":" · 메일 기능이 아직 꺼져 있어요")):""));}catch(e){toast(e.message);}S.pubBusy=false;render();}
async function pubOff(id){const k=S.pubKind||"tool",t=pubItem(k,id);if(!t||!t.pub)return;S.pubBusy=true;render();try{await pubFetch(k==="html"?"/api/html/unpublish":"/api/tools/unpublish",{id:t.pub.id});t.pub=null;save();toast("공개를 내렸어요. 링크로 더 이상 열 수 없어요");}catch(e){toast(e.message);}S.pubBusy=false;render();}
/* 배포된 도구 열기 (/t/아이디) */
function vHtmlPub(){const id=S.hpId,st=S.hp&&S.hp.id===id?S.hp:null;if(!st){S.hp={id,loading:true};fetch("/api/html/"+encodeURIComponent(id)).then(r=>r.json().then(j=>({ok:r.ok,j}))).then(x=>{S.hp={id,data:x.ok?x.j:null,err:x.ok?"":x.j.error||"없는 페이지예요"};if(x.ok)document.title=x.j.title||"LAGO";render();}).catch(()=>{S.hp={id,err:"불러오지 못했어요"};render();});}
const d=st&&st.data;if(!d)return `<div class="pubpage"><main class="wrap pubmain"><div class="card"><b>${esc(!st||st.loading?"불러오는 중…":(st.err||"열 수 없는 페이지예요"))}</b></div></main></div>`;
return `<iframe title="${esc(d.title)}" sandbox="allow-scripts allow-forms allow-popups allow-modals" referrerpolicy="no-referrer" srcdoc="${esc(d.code)}" style="position:fixed;inset:0;width:100%;height:100%;border:0;background:#fff"></iframe><a href="/" style="position:fixed;right:10px;bottom:10px;z-index:2;font:12px system-ui;background:#0B1F55;color:#fff;padding:5px 10px;border-radius:99px;text-decoration:none;opacity:.85">LAGO로 만든 페이지</a>`;}
const DEVB=`<span class="devb" title="LAGO DEV · 이메일 인증을 마친 개발자" aria-label="LAGO DEV 인증"><svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#1B3E9E"/><path d="M4.6 8.3l2.2 2.2 4.6-4.9" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><b>DEV</b></span>`;
function trustModal(){const x=S.trust,t=x.t;return `<div class="tempask" role="dialog" aria-label="신뢰 확인" data-act="trustNo"><div class="card sharecard" data-stop="1"><div class="row"><b style="font-size:17px">다음 사용자를 신뢰합니까?</b><span class="grow"></span><button class="iconbtn" data-act="trustNo" aria-label="닫기">${ic("x",18)}</button></div>
<div class="shareprev"><b style="display:flex;gap:6px;align-items:center">${esc(t.owner||"이름을 밝히지 않은 사용자")}${t.dev?DEVB:""}</b><span class="muted" style="font-size:12.5px">${t.dev?"LAGO DEV: 이메일 인증을 마친 개발자예요.":"LAGO DEV 인증이 없는 사용자예요."}</span></div>
<span class="muted" style="font-size:13px">${t.kind==="mcp"?`‘${esc(t.name)}’을(를) 추가하면 LAGO가 대화 중에 <b>이 사람의 서버로 질문 내용 일부를 보낼 수 있어요</b>. 서버가 돌려준 내용은 답에 쓰여요. 믿을 수 있는 사람의 것만 추가해 주세요.`:`‘${esc(t.name)}’을(를) 내 ${t.kind==="mode"?"MODE":"TOOLS"}에 넣으면 만든 사람의 <b>지시문이 함께 복사돼요</b>. 내용은 넣은 뒤 ‘고치기’에서 확인할 수 있어요. 믿을 수 있는 사람의 것만 넣어 주세요.`}</span>
<p class="err" id="trerr" role="alert">${esc(x.err||"")}</p>
<div class="row" style="gap:8px;justify-content:flex-end"><button class="btn" data-act="trustNo">취소</button><button class="btn pri" data-act="trustYes" ${x.busy?"disabled":""}>${x.busy?"넣는 중…":t.kind==="mcp"?"신뢰하고 추가":"신뢰하고 넣기"}</button></div></div></div>`;}
function devMine(){const o=location.origin,it=[...S.myAgents.filter(a=>a.viaDev&&a.pub).map(a=>({k:"mode",id:a.id,name:a.name,link:o+"/t/"+a.pub.id})),...(S.myTools||[]).filter(t=>t.viaDev&&t.pub).map(t=>({k:"tool",id:t.id,name:t.name,link:o+"/t/"+t.pub.id})),...(S.myMcp||[]).filter(t=>t.pub).map(t=>({k:"mcp",id:t.id,name:t.name,link:o+"/t/"+t.pub.id}))];
return `<div class="card" style="display:grid;gap:10px"><div class="row" style="gap:8px"><b style="font-size:16px">내가 DEV에서 올린 것</b><span class="muted">${it.length}</span></div>${it.length?it.map(x=>`<div style="display:grid;gap:6px;padding:10px 0;border-top:1px solid var(--line)"><div class="row" style="gap:8px"><span class="tag" style="background:#EEF2F8;color:var(--mut)">${x.k==="mode"?"MODE":x.k==="mcp"?"MCP":"TOOL"}</span><b class="grow">${esc(x.name)}</b>${DEVB}</div><div class="muted" style="font:12.5px var(--mono);word-break:break-all">${esc(x.link)}</div><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm pri" data-act="copy" data-text="${esc(x.link)}">${ic("copy",14)} 링크 복사</button><a class="btn sm" href="${esc(x.link)}" target="_blank" rel="noopener">열기</a><button class="btn sm danger" data-act="unshare" data-k="${x.k}" data-id="${x.id}" ${S.pubBusy?"disabled":""}>공개 내리기</button></div></div>`).join(""):`<p class="muted" style="margin:0;font-size:13px">아직 DEV에서 올린 게 없어요. 위에서 만들어 공개하면 여기에 모여요.</p>`}</div>`;}
function coverFrom(f){return new Promise((ok,no)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{try{const W=640,H=360,c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");const r=Math.max(W/im.width,H/im.height),w=im.width*r,h=im.height*r;x.fillStyle="#fff";x.fillRect(0,0,W,H);x.drawImage(im,(W-w)/2,(H-h)/2,w,h);let q=.82,d=c.toDataURL("image/jpeg",q);while(d.length>100000&&q>.3){q-=.1;d=c.toDataURL("image/jpeg",q);}URL.revokeObjectURL(u);d.length>110000?no():ok(d);}catch(e){no(e);}};im.onerror=()=>{URL.revokeObjectURL(u);no();};im.src=u;});}
function shopCard(x){let h=0;for(const ch of x.name)h=(h*31+ch.charCodeAt(0))%360;const img=x.cover?`<img src="/api/dev/cover/${esc(x.id)}" alt="" loading="lazy">`:`<div class="gen" style="background:hsl(${h} 32% 92%);color:hsl(${h} 38% 26%)"><b>${esc(x.name.slice(0,16))}</b></div>`;
return `<a class="shopcard" href="/t/${esc(x.id)}" data-act="shopOpen" data-id="${esc(x.id)}"><div class="shopimg">${img}<span class="tag shopk">${x.kind==="mode"?"MODE":x.kind==="mcp"?"MCP":"TOOL"}</span></div><div class="shopb"><div class="row" style="gap:6px;min-width:0"><b class="shopn">${esc(x.name)}</b>${DEVB}</div><span class="shopd">${esc(x.desc||"소개가 아직 없어요")}</span><span class="shopm">${esc(x.owner||"이름 비공개")}${x.mine?" · 내가 올림":""} · 사용 ${x.runs}회</span></div></a>`;}
function shopBody(){const d=S.devL||{},its=d.items||[],q=(S.devQs||"").trim().toLowerCase(),f=S.devF||"all";
let list=its.filter(x=>(f==="all"||x.kind===f)&&(!q||(x.name+" "+x.desc+" "+x.owner).toLowerCase().includes(q)));
if(!its.length)return `<div class="card"><b>아직 올라온 게 없어요</b><p class="muted" style="margin:6px 0 0">LAGO DEV에서 만들고 공개하면 여기에 모여요.</p></div>`;
if(!list.length)return `<div class="card"><b>찾는 게 없어요</b><p class="muted" style="margin:6px 0 0">다른 말로 검색해 보세요.</p></div>`;
const sec=(t,sub,a)=>a.length?`<section class="shopsec"><div class="row"><h2>${t}</h2><span class="muted" style="font-size:13px">${sub}</span></div><div class="shopgrid">${a.map(shopCard).join("")}</div></section>`:"";
if(q||f!=="all")return sec(q?"검색 결과":(f==="mode"?"MODE":f==="mcp"?"MCP":"TOOL"),list.length+"개",list);
return sec("새로 올라왔어요","최근 순",list.slice(0,5))+sec("MODE","답하는 방식",list.filter(x=>x.kind==="mode"))+sec("TOOL","도구",list.filter(x=>x.kind==="tool"));}
function vDevList(){const st=S.devL;if(!st&&S.user&&S.user.uid){S.devL={loading:true};authGet("/api/dev/list").then(r=>r.json().then(j=>({ok:r.ok,j}))).then(x=>{S.devL=x.ok?{items:x.j.items||[]}:{err:x.j.error||"불러오지 못했어요"};render();}).catch(()=>{S.devL={err:"불러오지 못했어요"};render();});}
const d=S.devL||{};let body;
if(!(PATHMODE&&S.user&&S.user.uid))body=`<div class="note">${ic("info",16)}<span>로그인한 실제 서비스에서만 볼 수 있어요.</span></div>`;
else if(d.loading||!S.devL)body=`<p class="muted">불러오는 중…</p>`;
else if(d.err)body=`<div class="note">${ic("info",16)}<span>${esc(d.err)}</span></div>`;
else body=`<div id="shopList">${shopBody()}</div>`;
const f=S.devF||"all";
return shell(`${topbar("",`<button class="btn sm" data-go="dev">${ic("back",14)} LAGO DEV</button>`)}<div class="scroll"><div class="wrap page shop" style="max-width:1100px;display:grid;gap:22px"><div class="shopsearch">${ic("search",18)}<input id="shopQ" type="search" value="${esc(S.devQs||"")}" placeholder="DEV 샵에서 MODE · TOOL 검색" autocomplete="off" aria-label="DEV 샵 검색"></div>
<div class="shophead"><h1>DEV 샵 ${DEVB}</h1><p>이메일 인증을 마친 개발자들이 만든 MODE · TOOL · MCP예요.</p><div class="cats"><button aria-pressed="${f==="all"}" data-devf="all">전체</button><button aria-pressed="${f==="mode"}" data-devf="mode">MODE</button><button aria-pressed="${f==="tool"}" data-devf="tool">TOOL</button><button aria-pressed="${f==="mcp"}" data-devf="mcp">MCP</button></div></div>${body}</div></div>`);}
function vDev(){const st=S.devSt;if(!st&&S.user&&S.user.uid){S.devSt={loading:true};authGet("/api/dev/me").then(r=>r.json().then(j=>({ok:r.ok,j}))).then(x=>{S.devSt=x.ok?x.j:{err:x.j.error||"확인하지 못했어요"};render();}).catch(()=>{S.devSt={err:"확인하지 못했어요"};render();});}
const d=S.devSt||{},q=S.devQ||{kind:"mode"};let body;
if(!(PATHMODE&&S.user&&S.user.uid))body=`<div class="note">${ic("info",16)}<span>LAGO DEV는 로그인한 실제 서비스에서만 쓸 수 있어요.</span></div>`;
else if(d.loading)body=`<p class="muted">확인하는 중…</p>`;
else if(d.err)body=`<div class="note">${ic("info",16)}<span>${esc(d.err)}</span></div>`;
else if(!d.verified)body=`<div class="card" style="display:grid;gap:10px"><b>1. 이메일 인증</b><p class="muted" style="margin:0">${esc(d.email||"")}로 보낸 인증 메일의 링크를 눌러 주세요. 메일이 없으면 다시 보낼 수 있어요.</p><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="devResend">인증 메일 다시 보내기</button><button class="btn sm pri" data-act="devRecheck">인증했어요</button></div><p class="err" role="alert">${esc(S.devMsg||"")}</p></div>`;
else if(!d.dev)body=`<div class="card" style="display:grid;gap:10px"><b>이메일 인증 완료</b><p class="muted" style="margin:0">LAGO DEV를 시작하면 만든 MODE·TOOL 이름 옆에 ${DEVB} 표시가 붙고, 아래에서 바로 만들고 공개할 수 있어요.</p><div><button class="btn pri" data-act="devJoin" ${S.devBusy?"disabled":""}>LAGO DEV 시작하기</button></div><p class="err" role="alert">${esc(S.devMsg||"")}</p></div>`;
else body=`<div class="card" style="display:grid;gap:12px"><div class="row" style="gap:8px"><b style="font-size:16px">바로 만들기</b>${DEVB}</div>
<div class="seg"><button type="button" aria-pressed="${q.kind==="mode"}" data-devk="mode">MODE</button><button type="button" aria-pressed="${q.kind==="tool"}" data-devk="tool">TOOL</button><button type="button" aria-pressed="${q.kind==="mcp"}" data-devk="mcp">MCP</button></div>
<form id="devForm" style="display:grid;gap:12px" novalidate><label class="fld">이름<input id="dvN" maxlength="30" value="${esc(q.name||"")}" autocomplete="off" placeholder="예: 영어 선생님"></label>
<label class="fld">한 줄 소개 <span class="hint">샵 카드에 보여요 (선택)</span><input id="dvD" maxlength="60" value="${esc(q.desc||"")}" autocomplete="off" placeholder="예: 영어로 먼저 말하고 한국어로 풀어 줘요"></label>
<div class="fld" style="display:grid;gap:6px;font-size:13px;font-weight:500;color:var(--ink2)">대표 이미지 <span class="hint">샵 카드 위에 보여요 (선택, 없으면 자동으로 만들어요)</span><div class="row" style="gap:10px;flex-wrap:wrap">${q.cover?`<img src="${q.cover}" alt="대표 이미지 미리보기" style="width:128px;height:72px;object-fit:cover;border-radius:10px;border:1px solid var(--line)"><button type="button" class="btn sm" data-act="devCoverX">지우기</button>`:""}<label class="btn sm" style="cursor:pointer">${ic("plus",14)} 이미지 고르기<input id="dvC" type="file" accept="image/png,image/jpeg,image/webp" hidden></label></div></div>
${q.kind==="mcp"?`<label class="fld">MCP 서버 주소 <span class="hint">https://, Streamable HTTP 방식</span><input id="dvU" type="url" inputmode="url" value="${esc(q.url||"")}" autocomplete="off" placeholder="https://example.com/mcp"></label><label class="fld">토큰 <span class="hint">필요한 서버만. 서버에만 저장되고 다른 사람에게 보이지 않아요</span><input id="dvK" type="password" value="${esc(q.token||"")}" autocomplete="off" placeholder="Bearer 토큰"></label><p class="muted" style="margin:0;font-size:12.5px">공개하기 전에 LAGO가 서버에 연결해서 도구 목록을 확인해요. 가져간 사람이 켜면 그 사람의 대화에서 이 서버의 도구를 쓸 수 있어요.</p>`:`<label class="fld">${q.kind==="mode"?"어떻게 답할지":"무엇을 할지"}<textarea id="dvI" rows="5" maxlength="1500" style="resize:vertical" placeholder="${q.kind==="mode"?"예: 영어로 먼저 말하고 한국어로 짧게 풀어 줘":"예: 글의 맞춤법을 고쳐 줘"}">${esc(q.ins||"")}</textarea></label>${modelSel("dvM",q.model)}`}
<p class="err" id="dverr" role="alert">${esc(S.devMsg||"")}</p>${S.devWarn?warnBox(S.devWarn,"devAck","위험을 알고 있어요. 그래도 공개"):""}<div class="row" style="gap:8px;justify-content:flex-end"><button class="btn pri" ${S.devBusy?"disabled":""}>${S.devBusy?"만드는 중…":"만들고 바로 공개"}</button></div></form>
${q.link?`<div class="note">${ic("check",16)}<span>공개했어요: ${esc(q.link)}</span><button class="btn sm pri" style="margin-left:auto" data-act="copy" data-text="${esc(q.link)}">복사</button></div>`:""}
</div>${devMine()}`;
return shell(`${topbar("",`<button class="btn sm" data-go="dev-list" data-fresh="1">${ic("grid",14)} DEV 샵</button>`)}<div class="scroll"><div class="wrap page" style="max-width:760px;display:grid;gap:16px"><div><h1 style="margin:0;display:flex;gap:10px;align-items:center;flex-wrap:wrap">LAGO DEV ${d.dev?DEVB:""}</h1><p class="muted" style="margin:4px 0 0">이메일 인증을 마친 개발자가 MODE · TOOL · MCP를 빠르게 만들어 공개하는 곳이에요.</p></div>${body}</div></div>`);}
function vToolPub(){const id=S.tpId,st=S.tp&&S.tp.id===id?S.tp:null;if(!st){S.tp={id,loading:true};authGet("/api/tools/"+encodeURIComponent(id)).then(r=>r.json().then(j=>({ok:r.ok,j}))).then(x=>{S.tp={id,data:x.ok?x.j:null,err:x.ok?"":x.j.error||"없는 도구예요",login:!x.ok&&!!x.j.needLogin};render();}).catch(()=>{S.tp={id,err:"불러오지 못했어요"};render();});}
const t=st&&st.data;let body="";
if(!st||st.loading)body=`<p class="muted">불러오는 중…</p>`;
else if(!t)body=`<div class="card"><b>${esc(st.err||"열 수 없는 도구예요")}</b><p class="muted" style="margin:6px 0 0">링크가 바뀌었거나 만든 사람이 공개를 내렸을 수 있어요.</p>${st.login?`<button class="btn pri sm" style="margin-top:10px" data-act="pubRetry">${S.user?"다시 확인":"로그인"}</button>`:""}</div>`;
else if(t.kind==="mcp"){body=`<div><h1 style="margin:0">${esc(t.name)} <span class="tag">MCP</span></h1><p class="muted" style="margin:4px 0 0">${esc(t.desc||"")}${t.owner||t.dev?` · 만든 사람 <span style="display:inline-flex;gap:5px;align-items:center">${esc(t.owner||"")}${t.dev?DEVB:""}</span>`:""}</p><div class="row" style="margin-top:10px"><button class="btn sm pri" data-act="trustAsk">${ic("plug",14)} 내 서비스 연결에 추가</button></div></div>
<div class="card" style="display:grid;gap:8px"><b>이 MCP가 주는 도구 ${t.mcpN||0}개</b><div class="row" style="gap:6px;flex-wrap:wrap">${(t.mcpTools||[]).map(n=>`<code>${esc(n)}</code>`).join("")||`<span class="muted">목록이 없어요</span>`}</div><p class="muted" style="margin:0;font-size:12.5px">추가하면 Fonte와 대화할 때 필요한 순간에 이 서버의 도구를 불러 써요. 서버 주소와 토큰은 보이지 않아요.</p></div>`;}
else{const inp=t.input||"both";const dr=S.tpIn||{};
body=`<div><h1 style="margin:0">${esc(t.name)}</h1><p class="muted" style="margin:4px 0 0">${esc(t.desc||"")}${t.owner||t.dev?` · 만든 사람 <span style="display:inline-flex;gap:5px;align-items:center">${esc(t.owner||"")}${t.dev?DEVB:""}</span>`:""}</p><div class="row" style="margin-top:10px"><button class="btn sm" data-act="trustAsk">${ic("plus",14)} 내 ${t.kind==="mode"?"MODE":"TOOLS"}에 넣기</button></div></div>
${S.user?(modelOn()?"":`<div class="note">${ic("info",16)}<span>지금은 모델이 연결되어 있지 않아요.</span></div>`):`<div class="note">${ic("info",16)}<span>이 도구를 쓰려면 로그인이 필요해요.</span><button class="btn sm pri" data-act="pubLogin" style="margin-left:auto">로그인</button></div>`}
<form id="toolPubForm" class="card" style="display:grid;gap:14px" novalidate>${inp!=="file"?`<label class="fld">${t.kind==="mode"?"질문":"글"}<textarea id="tpT" rows="7" maxlength="3000" style="resize:vertical" placeholder="여기에 글을 붙여 넣어 주세요">${esc(dr.text||"")}</textarea></label>`:""}
${inp!=="text"?`<label class="fld">${inp==="both"?"또는 파일 올리기":"파일 올리기"}<input id="tpF" type="file" accept=".pdf,.docx,.txt,.md,.csv,.tsv,.json,.html,.htm,.srt,.log,image/*"></label>`:""}
${(t.opts||[]).length?`<label class="fld">옵션<select id="tpO">${t.opts.map(o=>`<option>${esc(o)}</option>`).join("")}</select></label>`:""}
<p class="err" id="tperr" role="alert"></p><div class="row" style="justify-content:flex-end"><button class="btn pri" ${S.user&&modelOn()?"":"disabled"}>${S.tpBusy?"처리 중…":"실행하기"}</button></div></form>
${S.tpOut?`<div class="card" style="display:grid;gap:8px"><div class="row"><b>결과</b><span class="grow"></span><button class="btn sm" data-act="copy" data-text="${esc(S.tpOut)}">${ic("copy",14)} 복사</button></div><p class="answer" style="margin:0">${esc(S.tpOut).replace(/\n/g,"<br>")}</p><p class="muted" style="margin:0;font-size:12.5px">AI가 만든 결과라 틀릴 수 있어요. 중요한 내용은 확인해 주세요.</p></div>`:""}`;}
return pubShell(`<div style="display:grid;gap:16px">${body}</div>`)+(S.trust?trustModal():"");}
function pubShell(inner){return `<div class="pubpage"><header class="pubtop"><a href="/" class="pubbrand" aria-label="LAGO 홈">${WM(22)}</a><span class="grow"></span><a class="btn sm" href="/">${S.user?"내 대화로":"LAGO 열기"}</a></header><main class="wrap pubmain">${inner}</main></div>`;}
/* 공유된 대화 보기 (/s/아이디) */
function vShareView(){const id=S.svId,st=S.sv&&S.sv.id===id?S.sv:null;if(!st){S.sv={id,loading:true};authGet("/api/share/"+encodeURIComponent(id)).then(r=>r.json().then(j=>({ok:r.ok,j}))).then(x=>{S.sv={id,data:x.ok?x.j:null,err:x.ok?"":x.j.error||"없는 링크예요",login:!x.ok&&!!x.j.needLogin};if(x.ok)document.title="LAGO · "+x.j.title;render();}).catch(()=>{S.sv={id,err:"불러오지 못했어요"};render();});}
const d=st&&st.data;let body="";
if(!st||st.loading)body=`<p class="muted">불러오는 중…</p>`;
else if(!d)body=`<div class="card"><b>${esc(st.err||"열 수 없는 링크예요")}</b><p class="muted" style="margin:6px 0 0">공유가 끝났거나 링크가 잘못됐을 수 있어요.</p>${st.login?`<button class="btn pri sm" style="margin-top:10px" data-act="pubRetry">${S.user?"다시 확인":"로그인"}</button>`:""}</div>`;
else{const dt=new Date(d.upd||d.at).toLocaleDateString("ko-KR");
body=`<div><h1 style="margin:0">${esc(d.title)}</h1><p class="muted" style="margin:4px 0 0;font-size:13px">${d.name?esc(d.name)+" · ":""}${dt} 공유 · 읽기 전용</p></div>
<div class="thread" style="display:grid;gap:16px">${d.msgs.map(m=>m.r==="u"?`<div class="umw">${m.att?attHtml({kind:m.att.kind,name:m.att.name,chars:m.att.chars}):""}<div class="um">${esc(m.t)}</div></div>`:`<div class="am"><div class="who">${WM(12)}</div><p class="answer">${esc(m.t).replace(/\n/g,"<br>")}</p>${(m.src||[]).length?`<div class="srcs">${m.src.map(x=>srcCard(x.n,x.title||x.db,[x.db,x.publisher,x.date].filter(Boolean).join(" · "),x.url)).join("")}</div>`:""}</div>`).join("")}</div>
<p class="muted" style="font-size:12.5px;margin:6px 0 0">이 대화는 LAGO 사용자가 공유한 내용이에요. AI 답변은 틀릴 수 있어요.</p>
<div class="card" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="grow" style="min-width:180px">LAGO는 찾아 읽고 출처와 함께 답하는 AI예요.</span><a class="btn pri sm" href="/">LAGO 써 보기</a></div>`;}
return pubShell(`<div style="display:grid;gap:16px">${body}</div>`);}
function sharePayload(c){const so=c.shareSrc!==false;const au=audGet();return{id:c.shareId,emails:au.emails,invite:au.invite,title:c.title,showName:!!c.shareName,name:S.user.name,msgs:c.msgs.filter(m=>!m.loading&&(m.role==="user"?m.text:m.plain)).map(m=>m.role==="user"?{r:"u",t:m.text,att:m.att?{kind:m.att.kind,name:m.att.name,chars:m.att.chars}:undefined}:{r:"a",t:m.plain,src:so?(m.src||[]).map(x=>({n:x.n,title:x.title,db:x.db,url:x.url,date:x.date,publisher:x.publisher})):[]})};}
async function shareDo(c,on){if(c.kid){toast("아이 계정의 대화는 공유할 수 없어요");return;}if(c.temp){toast("임시 대화는 공유할 수 없어요");return;}S.shareBusy=true;render();
try{if(on){const j=await pubFetch("/api/share",sharePayload(c));c.shareId=j.id;c.shared=true;c.emails=audGet().emails;toast(c.shareUpd?"링크를 업데이트했어요":"공유 링크를 만들었어요");}else{if(c.shareId)await pubFetch("/api/share/delete",{id:c.shareId});c.shared=false;c.shareId=null;toast("공유를 멈췄어요. 링크로 더 이상 볼 수 없어요");}save();}catch(e){toast(e.message);}S.shareBusy=false;S.shareUpd=false;render();}
/* 누르는 중에 화면이 다시 그려지면 클릭이 사라져서 + 나 모델 메뉴가 가끔 안 열렸어요. 손을 뗀 뒤에 그려요. */
let ptrDown=false,ptrT=0,ptrPend=false;
const ptrEnd=()=>{if(!ptrDown)return;ptrDown=false;clearTimeout(ptrT);if(ptrPend)setTimeout(()=>{if(ptrPend&&!ptrDown){ptrPend=false;render();}},0);};
document.addEventListener("pointerdown",e=>{if(e.target.closest&&e.target.closest("button,a,[data-act],[data-go]")){ptrDown=true;clearTimeout(ptrT);ptrT=setTimeout(()=>{ptrDown=false;if(ptrPend){ptrPend=false;render();}},1200);}},true);
document.addEventListener("pointerup",()=>setTimeout(ptrEnd,0),true);
document.addEventListener("pointercancel",ptrEnd,true);
function render(){if(ptrDown){ptrPend=true;return;}ptrPend=false;const r=route();
if(S.booting&&!S.user){$("#app").innerHTML=`<div class="splash" role="status" aria-label="불러오는 중">${WM(30)}</div>`;return;}
if(S.banned&&S.user){$("#app").innerHTML=vBanned();return;}
if(!S.user&&!PUBLIC.includes(r)){if(PATHMODE&&!S.after)S.after=location.pathname;go("login",true);return;}
if(S.user&&(r==="login"||r==="join")){go("home",true);return;}
if(S.goccia&&["prefs","plans","guardian","agent-new","usage","tasks","services","tool-translate","tool-spell","tool-extract","tool-summary","tools","tool-new","tool-my","tool-pub"].includes(r)){toast("아이 계정에서는 열 수 없는 화면이에요");go("home",true);return;}
if(r==="code"||r==="code-chat"||r==="code-folder")S.area="code";else if(["home","chat","projects","project","agents","agent","agent-new"].includes(r))S.area="talk";
const v={dev:vDev,"dev-list":vDevList,"html-pub":vHtmlPub,shared:vShared,tools:vTools,"tool-new":vToolNew,"tool-my":vToolMy,"tool-pub":vToolPub,"share-view":vShareView,"tool-translate":vTool,"tool-spell":vTool,"tool-extract":vTool,"tool-summary":vTool,services:vServices,tasks:vTasks,usage:vUsage,admin:vAdmin,"admin-user":vAdminUser,agents:vAgents,"agent-new":vAgentNew,agent:vAgent,login:vLogin,join:vJoin,verify:vVerify,kid:vKid,home:vHome,chat:vChat,"code-chat":vChat,projects:vProjects,project:vProject,code:vCode,"code-folder":vFolder,plans:vPlans,prefs:vPrefs,apps:vApps,terms:vTerms,guardian:vGuardian}[r];
const html=v();if(!html)return;const rk=location.pathname+location.hash,oldSc=document.querySelector(".main > .scroll"),keepTop=oldSc&&S.rk===rk?oldSc.scrollTop:0,qv=S.rk===rk&&$("#q")?$("#q").value:"";S.rk=rk;$("#app").innerHTML=html;fitPop();requestAnimationFrame(fitPop);if(keepTop){const ns=document.querySelector(".main > .scroll");if(ns&&!$("#sc"))ns.scrollTop=keepTop;}
const sc=$("#sc");if(sc)sc.scrollTop=sc.scrollHeight;
if($("#bc"))startBrand();
const q=$("#q");if(q){if(qv){q.value=qv;q.style.height="auto";q.style.height=Math.min(180,q.scrollHeight)+"px";}q.addEventListener("input",()=>{q.style.height="auto";q.style.height=Math.min(180,q.scrollHeight)+"px";});q.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.isComposing&&(S.set.sendkey==="ctrl"?(e.ctrlKey||e.metaKey):!e.shiftKey)){e.preventDefault();composerSend(q.value);}});}
armScroll();document.title=r==="login"?"LAGO 로그인":(PATHMODE?"LAGO":"LAGO 앱 미리보기");
if(r==="agent-new")["an","ad","ai","as0","as1","as2"].forEach(id=>{const el=$("#"+id);el&&el.addEventListener("input",()=>{readDraft();$("#agPrev").innerHTML=agentPreview(S.draft);});});}

/* ---------- events ---------- */
document.addEventListener("click",async e=>{const t=e.target.closest("button,a,[data-act]");if(!t)return;const d=t.dataset;
if(d.scroll){e.preventDefault();const el=document.getElementById(d.scroll);if(el)el.scrollIntoView({behavior:"smooth",block:"start"});return;}
if(d.go){if(d.go==="dev-list")S.devL=null;go(d.go);return;}
if(d.area){S.area=d.area;go(d.area==="code"?"code":"home");return;}
if(d.chat){S.cur=d.chat;const c=curChat();go(c&&c.area==="code"?"code-chat":"chat");return;}
if(d.project){S.curProject=d.project;S.editIns=false;go("project");return;}
if(d.ask){send(d.ask);return;}
if(d.wf!==undefined){if(d.dir){WF.cwd=d.wf;render();return;}WF.open=d.wf;WF.openTxt="불러오는 중…";render();try{WF.openTxt=await wfRead(d.wf);}catch(er){WF.openTxt=String(er&&er.message||"읽지 못했어요");}render();return;}
if(d.agent){S.curAgent=d.agent;S.cur=null;S.confirm=null;go("agent");return;}
if(d.fav){const i=S.favs.indexOf(d.fav);if(i>=0)S.favs.splice(i,1);else S.favs.push(d.fav);save();render();toast(i>=0?"즐겨찾기에서 뺐어요":"즐겨찾기에 넣었어요");return;}
if(d.tab){S.agentTab=d.tab;render();return;}
if(d.ttab){S.toolTab=d.ttab;render();return;}
if(d.ttl){S.ttl=+d.ttl;render();toast(["창을 닫으면 지워져요","1시간 뒤에 지워져요","24시간 뒤에 지워져요"][S.ttl]);return;}
if(d.svc){S.services[d.svc]=!S.services[d.svc];save();render();toast(S.services[d.svc]?d.name+"을(를) 연결했어요 (예시)":d.name+" 연결을 풀었어요");return;}
if(d.devf){S.devF=d.devf;render();return;}
if(d.devk){S.devQ={...(S.devQ||{}),kind:d.devk};render();return;}
if(d.aud){S.aud=S.aud||{mode:"link",em:"",inv:false};S.aud.mode=d.aud;render();return;}
if(d.pintool){const a=S.pinTools;S.pinTools=a.includes(d.pintool)?a.filter(x=>x!==d.pintool):[...a,d.pintool];save();render();toast(S.pinTools.includes(d.pintool)?"사이드바에 고정했어요":"사이드바에서 뺐어요");return;}
if(d.go&&S.flyout){S.flyout=false;}
if(d.tpl!=null){const x=TPL[+d.tpl];S.taskDraft={name:x[0],prompt:x[1],freq:x[2],time:x[3],day:x[4]||"월"};S.taskNew=true;render();return;}
if(d.tsw){const t=S.tasks.find(x=>x.id===d.tsw);if(t){t.on=t.on===false;save();render();}return;}
if(d.ptab){S.ptab=d.ptab;S.confirm=null;S.renaming=false;render();return;}
if(d.cmenu){if(S.cmenu===d.cmenu&&S.cmenuAt===d.at)S.cmenu=null;else{S.cmenu=d.cmenu;S.cmenuAt=d.at;}render();return;}
if(d.unpin){S.pinned=S.pinned.filter(x=>x!==d.unpin);save();render();toast("고정을 풀었어요");return;}
if(d.seltool){S.selTool=d.seltool;S.selOpt=null;S.plus=false;render();const qq=$("#q");if(qq)qq.focus();return;}
if(d.ctool){S.curTool=d.ctool;S.flyout=false;S.toolIn=null;go("tool-my");return;}
if(d.shareset){const c=S.chats.find(x=>x.id===S.share);if(c&&!S.shareBusy&&(d.shareset==="on")!==!!c.shared)shareDo(c,d.shareset==="on");return;}
if(d.sharesrc){const c=S.chats.find(x=>x.id===S.share);c.shareSrc=c.shareSrc===false;save();render();return;}
if(d.sharename){const c=S.chats.find(x=>x.id===S.share);c.shareName=!c.shareName;save();render();return;}
if(d.gtab){S.gtab=d.gtab;S.gview=null;S.confirm=null;render();return;}
if(d.cat){S.agentCat=d.cat;render();return;}
if(d.agic){readDraft();S.draft.ic=d.agic;render();return;}
if(d.agcol){readDraft();S.draft.c=d.agcol;render();return;}
if(d.mode){if(S.area==="code")S.cmode=d.mode;else S.mode=d.mode;S.menu=false;save();render();return;}
if(d.think){S.think=+d.think;save();render();return;}
if(d.web){S.web=+d.web;save();render();return;}
if(d.plan&&S.fb){toast(d.plan==="Free"?"지금은 Free 요금제예요":"결제는 아직 열리지 않았어요. 열리면 알려 드릴게요.");return;}
if(d.plan){S.user.plan=d.plan;if(S.user.uid)fbSave(true);else store.set("lago_session",S.user);toast(d.plan==="Free"?"Free로 바꿨어요 (미리보기)":"결제는 아직 연결 전이에요. 미리보기에서는 "+d.plan+"로 바뀌어요.");render();return;}
if(d.sw){const k=d.sw;S[k]=k==="kStudy"?S[k]!==true:!(S[k]!==false);if(k==="learn"||k==="learnImg"){toast(S[k]?"켰어요":"껐어요. 이제부터의 대화는 학습에 쓰지 않아요.");}save();render();return;}
if(d.todo!=null&&t.tagName==="INPUT")return;
switch(d.act){
case"admver":{const el=t.closest("[data-v]");const v=el&&el.dataset.v;if(!v||!S.isAdmin)break;el.disabled=true;admApi("model",{version:v}).then(d=>{const m=S.chats.flatMap(c=>c.msgs).find(x=>x.html&&x.html.includes("data-act=\"admver\""));if(m){m.html=admModelHtml(d,"바꿨어요: "+(d.versions.find(x=>x.active)||{}).label);}render();}).catch(e=>{el.disabled=false;toast("바꾸지 못했어요: "+(e.message||e));});break;}
case"replay":brandStage&&brandStage.play();break;
case"demo":S.user={...DEMO};store.set("lago_session",S.user);loadUser();toast("예시 계정으로 들어왔어요");go("home");break;
case"google":{const bl=fbBlock();if(bl){const m=$("#lerr")||$("#jerr");if(m)m.textContent=bl;else toast(bl);break;}}if(S.fb){try{await S.fb.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());}catch(e){const m=$("#lerr")||$("#jerr");if(m)m.textContent=fbMsg(e);else toast(fbMsg(e));}break;}toast("Google 로그인은 실제 서비스에서 연결돼요. 지금은 예시 계정으로 들어갈게요.");S.user={...DEMO};store.set("lago_session",S.user);loadUser();go("home");break;
case"forgot":{const em=($("#le")||{}).value||"";if(!em){toast("이메일을 먼저 입력해 주세요");break;}if(S.fb){try{await S.fb.auth.sendPasswordResetEmail(em);toast("재설정 메일을 보냈어요. 받은편지함을 확인해 주세요");}catch(e){toast(fbMsg(e));}break;}toast(esc(em)+"로 재설정 메일을 보냈어요 (미리보기)");break;}
case"verified":{const u=store.get("lago_users",{})[S.pendingVerify];if(u){S.user={email:S.pendingVerify,name:u.name,plan:"Free"};store.set("lago_session",S.user);loadUser();toast("인증됐어요. 환영해요!");go("home");}else go("login");break;}
case"resend":toast("인증 메일을 다시 보냈어요 (1분에 한 번)");break;
case"kidGuardian":go("guardian");break;
case"new":S.cur=null;S.preview=false;S.drawer=false;go(S.area==="code"?"code":"home");break;
case"search":S.drawer=false;openSearch();break;
case"term":termToggle();break;
case"wfPick":wfPick();break;
case"wfUp":WF.cwd=WF.cwd.split("/").slice(0,-1).join("/");render();break;
case"fileClose":WF.open=null;WF.openTxt="";render();break;
case"fileAsk":{S.term=false;const q=$("#q");if(q){q.value=WF.open+" 파일을 설명해 줘";q.focus();}break;}
case"mcpPre":{S.mcpPre=d.name||"";render();setTimeout(()=>{const n=$("#mn"),u=$("#mu");if(n&&!n.value)n.value=S.mcpPre;if(u){u.scrollIntoView({behavior:"smooth",block:"center"});u.focus();}},50);break;}
case"cpcode":{const pre=t.closest(".codewrap");const tx=pre?pre.querySelector("code").textContent:"";try{await navigator.clipboard.writeText(tx);toast("코드를 복사했어요");}catch(er){toast("복사하지 못했어요. 직접 선택해 주세요.");}break;}
case"runcode":{const pre=t.closest(".codewrap");const tx=pre?pre.querySelector("code").textContent.trim():"";if(!tx)break;if(!WF.name){toast("먼저 작업 폴더를 열어 주세요");wfPick();break;}if(!S.term){S.term=true;render();}termPrint("cmd","$ "+tx);await termExec(tx);break;}
case"savecode":{const pre=t.closest(".codewrap");S.saveCode={text:pre?pre.querySelector("code").textContent:"",lang:pre?pre.dataset.lang||"":""};render();setTimeout(()=>{const i=$("#scname");i&&i.focus();},30);break;}
case"saveX":S.saveCode=null;render();break;
case"attach":toast("파일 첨부는 실제 서비스에서 연결돼요");break;
case"plus":S.plus=!S.plus;S.menu=false;S.conn=false;render();break;
case"pickFile":S.plus=false;render();{const ci=$("#cfile");if(ci)ci.click();}break;
case"toolClear":S.selTool=null;S.selOpt=null;render();break;
case"attClear":S.att=null;render();break;
case"hpubLast":{const c=curChat();let f=null;if(c)for(const m of [...c.msgs].reverse()){if(m.role!=="user"&&pvItems(m.plain).some(x=>x.kind==="html")){f=[m,pvItems(m.plain).filter(x=>x.kind==="html").length-1];break;}}if(f)hpubStart(f[0],f[1]);else toast("이 대화에는 공개할 HTML이 아직 없어요. 코드 모델이 HTML을 만들면 여기서 공개할 수 있어요");break;}
case"trustAsk":{const t=S.tp&&S.tp.data;if(!t)break;if(!S.user){S.after=location.pathname;go("login");break;}S.trust={t};render();break;}
case"trustNo":if(t.tagName!=="BUTTON"&&e.target!==t)break;S.trust=null;render();break;
case"trustYes":{const x=S.trust;if(!x||x.busy)break;x.busy=true;x.err="";render();try{if(x.t&&x.t.kind==="mcp"){await pubFetch("/api/mcp/addDev",{id:S.tp.id});S.trust=null;S.mcp=null;toast("내 MCP에 추가했어요 · 켜져 있어요");go("services");break;}const j=await pubFetch("/api/tools/import",{id:S.tp.id});
if(j.kind==="mode"){const a={ic:"bot",c:"#1B3E9E",mode:"Torrente",web:0,name:j.name,desc:j.desc||"",ins:j.ins||"",starters:j.starters||[],model:j.model||"",id:"m"+Date.now(),mine:true,cat:"내 MODE",from:{owner:j.owner||"",dev:!!j.dev}};S.myAgents.unshift(a);S.agentTab="mine";S.curAgent=a.id;}
else{S.myTools=[{id:"u"+Date.now().toString(36),name:j.name,desc:j.desc||"",ins:j.ins||"",input:j.input||"both",opts:j.opts||[],model:j.model||"",from:{owner:j.owner||"",dev:!!j.dev}},...(S.myTools||[])];S.toolTab="mine";}
S.trust=null;save();toast("내 "+(j.kind==="mode"?"MODE":"TOOLS")+"에 넣었어요"+(j.kind==="mode"?" · 바로 대화해 보세요":""));if(j.kind==="mode"){S.cur=null;go("agent");}else go("tools");}catch(er){x.busy=false;x.err=er.message;render();}break;}
case"shopOpen":{e.preventDefault&&e.preventDefault();if(PATHMODE){S.tpId=d.id;S.tp=null;S.tpOut="";S.tpIn=null;history.pushState(null,"","/t/"+encodeURIComponent(d.id));render();window.scrollTo(0,0);}break;}
case"devCoverX":{S.devQ={...(S.devQ||{kind:"mode"}),name:($("#dvN")||{}).value||"",ins:($("#dvI")||{}).value||"",desc:($("#dvD")||{}).value||"",model:($("#dvM")||{}).value||"",cover:""};render();break;}
case"devJoin":{S.devBusy=true;S.devMsg="";render();try{await pubFetch("/api/dev/join",{name:S.user.name});S.devSt={dev:true,verified:true,email:S.user.email};toast("LAGO DEV가 시작됐어요");}catch(er){S.devMsg=er.message;}S.devBusy=false;render();break;}
case"devResend":try{await S.fb.auth.currentUser.sendEmailVerification();S.devMsg="인증 메일을 보냈어요. 받은편지함과 스팸함을 확인해 주세요.";}catch(er){S.devMsg="잠시 뒤에 다시 시도해 주세요.";}render();break;
case"devRecheck":try{await S.fb.auth.currentUser.reload();S.devSt=null;S.devMsg="";}catch(er){S.devMsg="확인하지 못했어요.";}render();break;
case"hprev":S.hprev=S.hprev||{};S.hprev[d.hk]=!S.hprev[d.hk];render();break;
case"hpub":{const c=curChat(),m=c&&c.msgs.find(x=>x.id===d.mid);if(m)hpubStart(m,+d.i);break;}
case"pickOpen":S.sharePick=d.k;render();break;
case"pickClose":if(t.tagName!=="BUTTON"&&e.target!==t)break;S.sharePick=null;render();break;
case"pickGo":{const k=S.sharePick;S.sharePick=null;if(k==="chat"){S.share=d.id;render();}else{S.pubKind=k;S.aud=null;S.pubTool=d.id;render();}break;}
case"unshare":{if(d.k==="chat"){const c=S.chats.find(x=>x.id===d.id);if(c)shareDo(c,false);}else{S.pubKind=d.k;pubOff(d.id);}break;}
case"htmlNew":S.sharePick=null;S.htmlDraft={title:"",code:"",prev:false};render();break;
case"htmlEdit":{const h=(S.myHtml||[]).find(x=>x.id===d.id);if(h){S.htmlDraft={id:h.id,title:h.title,code:h.code,prev:false};render();}break;}
case"htmlClose":if(t.tagName!=="BUTTON"&&e.target!==t)break;S.htmlDraft=null;render();break;
case"htmlPrev":S.htmlDraft.prev=!S.htmlDraft.prev;render();break;
case"htmlSave":{const h=S.htmlDraft;if(!h)break;const code=(h.code||"").trim(),title=(h.title||"").trim()||"내 페이지";if(code.length<20||!/<\/?[a-z][\s\S]*>/i.test(code)){h.err="HTML 코드를 붙여 넣거나 파일을 올려 주세요.";render();break;}if(code.length>200000){h.err="HTML은 200KB까지예요.";render();break;}
if(h.id){const t=(S.myHtml||[]).find(x=>x.id===h.id);if(t){t.title=title;t.code=code;}toast(t&&t.pub?"저장했어요. 공개한 페이지는 ‘공개 관리’에서 업데이트해 주세요":"저장했어요");}else{S.myHtml=[{id:"h"+Date.now().toString(36),title,code},...(S.myHtml||[])];toast("추가했어요");}S.htmlDraft=null;save();render();break;}
case"htmlDel":if(S.delHtml===d.id){const hh=(S.myHtml||[]).find(x=>x.id===d.id);if(hh&&hh.pub)pubFetch("/api/html/unpublish",{id:hh.pub.id}).catch(()=>{});S.myHtml=(S.myHtml||[]).filter(x=>x.id!==d.id);S.delHtml=null;save();toast("HTML을 뺐어요");}else S.delHtml=d.id;render();break;
case"htmlDelNo":S.delHtml=null;render();break;
case"newTool":S.editTool=null;S.toolDraft=null;go("tool-new");break;
case"toolEdit":S.editTool=d.id;go("tool-new");break;
case"toolDel":if(S.delTool===d.id){const t=myTool(d.id);if(t&&t.pub)pubFetch("/api/tools/unpublish",{id:t.pub.id}).catch(()=>{});S.myTools=(S.myTools||[]).filter(x=>x.id!==d.id);S.delTool=null;save();toast("도구를 지웠어요");}else S.delTool=d.id;render();break;
case"toolDelNo":S.delTool=null;render();break;
case"toolPubOpen":S.pubKind=d.k||"tool";S.aud=null;S.pubTool=d.id;render();break;
case"pubClose":if(t.tagName!=="BUTTON"&&e.target!==t)break;S.pubTool=null;S.aud=null;render();break;
case"pubName":{const t=pubItem(S.pubKind||"tool",d.id);if(t){t.showName=!t.showName;save();render();}break;}
case"pubDo":pubDo(d.id);break;
case"pubOff":pubOff(d.id);break;
case"pubRetry":if(S.user){S.tp=null;S.sv=null;render();}else{S.after=location.pathname;go("login");}break;
case"pubLogin":S.after=location.pathname;go("login");break;
case"shareUpdate":{const c=S.chats.find(x=>x.id===S.share);if(c){S.shareUpd=true;shareDo(c,true);}break;}
case"websw":S.web=(S.web+1)%3;save();render();break;
case"menu":S.conn=false;S.menu=!S.menu;render();break;
case"drawer":S.drawer=!S.drawer;render();break;
case"temp":{if(S.temp&&S.chats.some(c=>c.temp)){S.tempAsk=true;render();break;}S.temp=!S.temp;const r=route();const inChat=r==="chat"||r==="code-chat";
 if(!S.temp){const had=S.chats.some(c=>c.temp);S.chats=S.chats.filter(c=>!c.temp);if(inChat&&!curChat()){S.cur=null;toast(had?"임시 대화를 끄고 내용을 지웠어요":"임시 대화를 껐어요");go(S.area==="code"?"code":"home");break;}toast(had?"임시 대화를 끄고 내용을 지웠어요":"임시 대화를 껐어요");}
 else{toast("임시 대화를 켰어요. 기록에 남지 않고 학습에도 쓰지 않아요.");if(inChat){S.cur=null;go(S.area==="code"?"code":"home");break;}}
 render();break;}
case"acct":S.acct=!S.acct;render();break;
case"notice":S.acct=false;S.noticeOpen=true;if(!S.upd)loadUpd();render();break;
case"upwGo":S.noticeOpen=false;render();upwCheck(true);break;
case"upwStart":upwStart();break;
case"upwInstall":upwInstall();break;
case"upwSkip":if(S.upw&&S.upw.info)store.set("lago_upd_skip",S.upw.info.latest);S.upw=null;render();break;
case"upwClose":S.upw=null;render();break;
case"upwManual":S.upw=null;go("apps");break;
case"noticeX":noticeClose();break;
case"reloadNow":try{noticeClose();}catch(e){}location.reload();break;
case"getNew":S.noticeOpen=false;if(S.upd&&S.upd.notice)store.set("lago_notice",S.upd.notice.id);go("apps");break;
case"tempEnd":if(S.chats.some(c=>c.temp)){S.tempAsk=true;render();}else{S.temp=false;S.cur=null;toast("임시 대화를 끝냈어요");go(S.area==="code"?"code":"home");}break;
case"tempAskNo":S.tempAsk=false;render();break;
case"tempEndYes":S.tempAsk=false;S.temp=false;S.chats=S.chats.filter(c=>!c.temp);S.cur=null;toast("임시 대화를 지우고 끝냈어요");go(S.area==="code"?"code":"home");break;
case"tempSave":case"tempSaveEnd":{const c=curChat();if(c&&c.temp){c.temp=false;}if(d.act==="tempSaveEnd"){S.tempAsk=false;S.temp=false;S.chats=S.chats.filter(x=>!x.temp);}save();toast("일반 대화로 저장했어요. 최근 항목에 남아요.");render();break;}
case"tempNew":S.cur=null;go(S.area==="code"?"code":"home");break;
case"tempCopy":{const c=curChat();const txt=c?c.msgs.map(m=>(m.role==="user"?"나: "+m.text:"LAGO: "+(m.plain||""))).join("\n\n"):"";try{await navigator.clipboard.writeText(txt);toast("임시 대화를 복사했어요");}catch(err){toast("복사할 수 없어요");}break;}
case"asMe":S.goccia=false;S.acct=false;S.cur=null;toast(S.user.name+" 계정으로 돌아왔어요");go("home");break;
case"newagent":S.draft={ic:"bot",c:"#1B3E9E",mode:"Torrente",web:0,starters:[]};S.editAgent=null;go("agent-new");break;
case"editagent":{const a=agentById(S.curAgent);S.draft={...a};S.editAgent=a.id;go("agent-new");break;}
case"ask-delagent":S.confirm="delagent";render();break;
case"delagent":S.myAgents=S.myAgents.filter(a=>a.id!==S.curAgent);S.favs=S.favs.filter(f=>f!==S.curAgent);S.confirm=null;save();S.agentTab="mine";toast("MODE를 지웠어요");go("agents");break;
case"share":S.share=d.id||S.cur;S.cmenu=null;render();break;
case"shareClose":if(t.tagName!=="BUTTON"&&e.target!==t)break;S.share=null;render();break;
case"cRename":S.renameChat=d.id;S.renameAt=S.cmenuAt;S.cmenu=null;render();setTimeout(()=>{const i=$("#rnc");if(i){i.focus();i.select();}},0);break;
case"menuEdit":S.sideEdit=true;S.acct=false;render();break;
case"menuEditX":S.sideEdit=false;render();break;
case"menuTog":{const k=d.k;if(k.startsWith("t:")){const id=k.slice(2);S.pinTools=S.pinTools.includes(id)?S.pinTools.filter(x=>x!==id):[...S.pinTools,id];save();}else{S.sideHide=hid(k)?S.sideHide.filter(x=>x!==k):[...S.sideHide,k];sideSave();}render();break;}
case"menuMove":{const ks=sideEntries().map(e=>e.k);const i=ks.indexOf(d.k),j=i+Number(d.d);if(i>=0&&j>=0&&j<ks.length){[ks[i],ks[j]]=[ks[j],ks[i]];S.sideOrder=ks;sideSave();}render();break;}
case"menuReset":S.sideHide=[];S.sideOrder=[];S.pinTools=[];sideSave();save();render();toast("기본 메뉴로 돌렸어요");break;
case"cPin":{const c=S.chats.find(x=>x.id===d.id);c.pin=!c.pin;S.cmenu=null;save();render();toast(c.pin?"고정했어요":"고정을 풀었어요");break;}
case"cDel":S.delChat=d.id;S.cmenu=null;render();break;
case"cDelNo":S.delChat=null;render();break;
case"cDelYes":{S.chats=S.chats.filter(x=>x.id!==d.id);S.delChat=null;save();toast("대화를 지웠어요");if(S.cur===d.id){S.cur=null;go(S.area==="code"?"code":"home");}else render();break;}
case"sideToggle":S.sideOff=!S.sideOff;store.set("lago_sideoff",S.sideOff);render();break;
case"taskNew":S.taskNew=true;S.taskDraft=null;render();break;
case"taskCancel":S.taskNew=false;S.taskDraft=null;render();break;
case"taskDel":S.tasks=S.tasks.filter(x=>x.id!==d.id);save();render();toast("예약 작업을 지웠어요");break;
case"taskRun":{const t=S.tasks.find(x=>x.id===d.id);if(!t)break;t.last=Date.now();S.area="talk";S.cur=null;S.temp=false;send(t.prompt);if(S.chats[0])S.chats[0].title="예약 · "+t.name;save();toast("예약 작업을 실행했어요");break;}
case"conn":S.conn=!S.conn;S.menu=false;render();break;
case"flyout":S.flyout=!S.flyout;S.acct=false;render();break;
case"mcpAck":{const w=S.mcpWarn;if(w)mcpAdd({...w.body,ack:true});break;}
case"mcpWarnX":S.mcpWarn=null;S.devWarn=null;render();break;
case"mcpAllowOff":{try{await pubFetch("/api/mcp/allow",{key:d.key,on:false});await mcpLoad(true);}catch(er){toast(er.message);}break;}
case"devAck":{S.devQ.ack=true;S.devWarn=null;const f=document.getElementById("devForm");if(f&&f.requestSubmit)f.requestSubmit();break;}
case"mcpApprove":mcpApprove(d.mid,d.v);break;
case"mcpTog":{try{await pubFetch("/api/mcp/toggle",{kind:d.kind,id:d.id,on:!!d.on});await mcpLoad(true);}catch(er){toast(er.message);}break;}
case"mcpRm":{try{await pubFetch("/api/mcp/remove",{kind:d.kind,id:d.id});toast("뺐어요");await mcpLoad(true);}catch(er){toast(er.message);}break;}
case"setTheme":setTheme(d.v);break;
case"setLang":setLang(d.v);break;
case"lang":S.acct=true;render();break;
case"help":go("terms");break;
case"dl":S.acct=false;go("apps");break;
case"pwaInstall":if(S.pwa){try{S.pwa.prompt();await S.pwa.userChoice;}catch(er){}S.pwa=null;render();}break;
case"cliCode":{const u=S.fb&&S.fb.auth&&S.fb.auth.currentUser;if(!u||!u.refreshToken){toast("실제 계정으로 로그인한 뒤에 복사할 수 있어요");break;}try{await navigator.clipboard.writeText(u.refreshToken);toast("연결 코드를 복사했어요 · lago login --code 뒤에 붙여 넣어요");}catch(er){toast("복사하지 못했어요");}break;}
case"more":toast("LAGO 소개 · 블로그는 공개 때 열려요");break;
case"study":S.study=!S.study;render();toast(S.study?"공부 모드: 답 대신 풀이를 같이 생각해요":"공부 모드를 껐어요");break;
case"askTime":{const rs=(($("#treason")||{}).value||"").trim().slice(0,60);S.kidReqs.unshift({id:"r"+Date.now(),reason:rs,at:Date.now(),status:"pending"});syncReq();save();render();toast("보호자에게 요청을 보냈어요");
if(S.fb&&S.api&&S.api.mail&&S.user&&S.user.uid){try{const tk=await S.fb.auth.currentUser.getIdToken();const r=await fetch("/api/notify",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+tk},body:JSON.stringify({kid:"지우",reason:rs})});if(r.ok)setTimeout(()=>toast("보호자 이메일로도 알림을 보냈어요"),1800);}catch(e){}}break;}
case"timeOk":{const r=S.kidReqs.find(x=>x.status==="pending");if(r){r.status="ok";r.done=Date.now();S.extra=(S.extra||0)+30;}syncReq();save();render();toast("지우에게 30분을 더 줬어요");break;}
case"timeNo":{const r=S.kidReqs.find(x=>x.status==="pending");if(r){r.status="no";r.done=Date.now();}syncReq();save();render();toast("요청을 거절했어요");break;}
case"copy":try{await navigator.clipboard.writeText(d.text||"");toast("복사했어요");}catch(err){toast("복사할 수 없어요. 직접 선택해서 복사해 주세요.");}break;
case"like":case"dislike":{const c=curChat();const m=c&&c.msgs.find(x=>x.id===d.mid);if(m){const v=d.act==="like"?1:-1;m.like=m.like===v?0:v;save();render();toast(m.like?"의견을 보냈어요. 고마워요!":"취소했어요");}break;}
case"pvTab":{S.pv.tab=d.t;const v=$("#pvview"),c2=$("#pvcodeS"),tl=$("#pvtools");if(v&&c2){v.hidden=d.t!=="view";c2.hidden=d.t!=="code";if(tl)tl.hidden=d.t!=="view";document.querySelectorAll("#pvseg button").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.t===d.t)));}else render();break;}
case"pvSize":{S.pv.size=d.s;const st=$("#pvstage");if(st){st.className="stage pvs-"+d.s;document.querySelectorAll('[data-act="pvSize"]').forEach(x=>x.classList.toggle("on",x.dataset.s===d.s));}else render();break;}
case"pvReload":S.pv.con=[];render();break;
case"pvFull":S.pv.full=!S.pv.full;if(S.pv.full)S.pv.con=S.pv.con;render();break;
case"pvCon":{S.pv.conOpen=!S.pv.conOpen;const x=$("#pvcb"),y=$("#pvcf"),z=$("#pvct");if(x&&y){x.hidden=y.hidden=!S.pv.conOpen;if(z)z.textContent=S.pv.conOpen?"접기":"펼치기";if(S.pv.conOpen)x.scrollTop=x.scrollHeight;}else render();break;}
case"pvClr":{S.pv.con=[];const x=$("#pvcb");if(x)x.innerHTML=pvConBody();const n=$("#pvn"),bd=$("#pvbad"),fx=document.querySelector('[data-act="pvFix"]');if(n)n.hidden=true;if(bd)bd.hidden=true;if(fx)fx.disabled=true;break;}
case"pvVer":{const cur=pvCur(curChat());if(cur){S.pv.ver=Math.max(0,Math.min(cur.list.length-1,cur.k+Number(d.d)));S.pv.con=[];}render();break;}
case"pvCopy":{const cur=pvCur(curChat());if(cur){try{await navigator.clipboard.writeText(cur.it.doc);toast("코드를 복사했어요");}catch(er){toast("복사하지 못했어요");}}break;}
case"pvSave":{const cur=pvCur(curChat());if(cur&&DESK){S.saveCode={text:cur.it.doc,lang:"html"};render();setTimeout(()=>{const i=$("#scname");i&&i.focus();},30);}break;}
case"pvFix":{const errs=S.pv.con.filter(x=>x.t==="error").slice(-4).map(x=>"- "+x.m).join("\n");if(errs){S.pv.conOpen=false;send("미리보기에서 아래 오류가 났어. 원인을 찾아 고친 전체 코드를 다시 줘.\n"+errs);}break;}
case"preview":S.preview=!S.preview;render();break;
case"showcodeOld":{const h=lastHtml(curChat());if(h){try{await navigator.clipboard.writeText(h);toast("HTML 코드를 복사했어요");}catch(er){toast("복사하지 못했어요");}}else toast("아직 HTML이 없어요");break;}
case"todoreset":S.todos=[{t:"장보기",d:true},{t:"LAGO 데이터셋 정리",d:false},{t:"운동 30분",d:false}];render();break;
case"run":toast("명령을 실행했어요: 3개 행을 지웠어요 → data_dedup.csv (미리보기)");break;
case"skip":toast("명령을 건너뛰었어요");break;
case"newproj":S.newProj=!S.newProj;render();if(S.newProj)setTimeout(()=>$("#pn")&&$("#pn").focus(),0);break;
case"editins":S.editIns=!S.editIns;render();break;
case"saveins":{const p=S.projects.find(x=>x.id===S.curProject);if(p)p.ins=$("#insIn").value.trim();S.editIns=false;render();toast("지침을 저장했어요");break;}
case"rename":S.renaming=!S.renaming;render();break;
case"logout":if(S.fb&&S.user&&S.user.uid){S.fb.auth.signOut();S.acct=false;break;}store.del("lago_session");S.user=null;S.chats=[];S.cur=null;toast("로그아웃했어요");go("login");break;
case"ask-wipe":S.confirm="wipe";render();break;
case"ask-leave":S.confirm="leave";render();break;
case"cancel":S.confirm=null;render();break;
case"wipe":S.chats=[];S.cur=null;S.confirm=null;save();render();toast("대화를 모두 지웠어요");break;
case"leave":{const users=store.get("lago_users",{});delete users[S.user.email];store.set("lago_users",users);store.del("lago_data_"+S.user.email);store.del("lago_session");S.user=null;S.chats=[];S.confirm=null;toast("탈퇴했어요");go("login");break;}
case"back":if(history.length>1)history.back();else go(S.user?"home":"login");break;
case"gview":S.gview=S.gview===+d.gi?null:+d.gi;render();break;
case"revoke":S.confirm="revoke";render();break;
case"unguard":S.confirm="unguard";render();break;
case"unguardYes":S.guardian=null;S.confirm=null;save();toast("보호자 등록을 해제했어요");go("prefs");break;
case"revokeYes":S.confirm=null;toast("동의를 철회했어요. 아이 계정이 삭제돼요 (미리보기)");render();break;
}});
document.addEventListener("input",e=>{const t=e.target;if(t.id==="audEm"&&S.aud)S.aud.em=t.value;else if(S.htmlDraft){if(t.id==="hT")S.htmlDraft.title=t.value;else if(t.id==="hC")S.htmlDraft.code=t.value;}});
document.addEventListener("input",e=>{const t=e.target;if(t&&t.id==="shopQ"){S.devQs=t.value;const el=document.getElementById("shopList");if(el)el.innerHTML=shopBody();}});
function bgFrom(f){return new Promise((ok,no)=>{if(!/^image\//.test(f.type))return no();const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{const m=1600,k=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL("image/jpeg",.8));};im.onerror=no;im.src=u;});}
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-bgc],[data-act=bgcReset],[data-act=bgiClear],[data-sw2]");if(!t)return;
if(t.dataset.bgc){S.set.bgc=t.dataset.bgc;}else if(t.dataset.act==="bgcReset"){S.set.bgc="";}else if(t.dataset.act==="bgiClear"){store.del("lago_bgimg");}
else if(t.dataset.sw2){const k=t.dataset.sw2;if(k==="motionOff")S.set.motion=S.set.motion===false;else S.set[k]=!(S.set[k]!==false);}
saveSet();applySet();render();});
document.addEventListener("change",e=>{const t=e.target;
if(t.id==="sFs"){S.set.fs=+t.value;saveSet();applySet();return;}
if(t.id==="sSend"){S.set.sendkey=t.value;saveSet();return;}
if(t.id==="bgcIn"){S.set.bgc=t.value;saveSet();applySet();render();return;}
if(t.id==="bgDim"){S.set.dim=+t.value;saveSet();applySet();render();return;}
if(t.id==="bgFile"){const f=t.files&&t.files[0];if(!f)return;bgFrom(f).then(u=>{try{localStorage.setItem("lago_bgimg",JSON.stringify(u));}catch(er){toast("이미지가 너무 커서 저장하지 못했어요");return;}applySet();render();}).catch(()=>toast("이미지를 읽지 못했어요. 다른 파일로 해 보세요."));return;}
if(t.id==="sTheme"){setTheme(t.value);return;}if(t.id==="sLang"){setLang(t.value);return;}
if(t.id==="dvC"){const f=t.files&&t.files[0];if(!f)return;const keep=()=>{S.devQ={...(S.devQ||{kind:"mode"}),name:($("#dvN")||{}).value||"",ins:($("#dvI")||{}).value||"",desc:($("#dvD")||{}).value||"",model:($("#dvM")||{}).value||""};};keep();coverFrom(f).then(u=>{S.devQ.cover=u;S.devMsg="";render();}).catch(()=>{S.devMsg="이미지를 읽지 못했어요. 다른 파일로 해 보세요.";render();});return;}
if(t.id==="audInv"&&S.aud){S.aud.inv=t.checked;return;}
if(t.id==="hF"&&S.htmlDraft){const f=t.files&&t.files[0];if(!f)return;if(f.size>200000){S.htmlDraft.err="200KB보다 큰 파일이에요.";render();return;}f.text().then(x=>{S.htmlDraft.code=x;S.htmlDraft.err="";if(!S.htmlDraft.title)S.htmlDraft.title=f.name.replace(/\.[^.]+$/,"").slice(0,40);render();});return;}
if(t.id==="cfile"){const f=t.files&&t.files[0];t.value="";pickedFile(f);return;}
if(t.id==="selopt"){S.selOpt=t.value;return;}
if(t.dataset.todo!=null){S.todos[+t.dataset.todo].d=t.checked;render();return;}
if(t.id==="sMode"){S.mode=t.value;save();toast("기본 모드를 바꿨어요");}
if(t.id==="sThink"){S.think=+t.value;save();}
if(t.id==="sWeb"){S.web=+t.value;save();}
if(t.id==="gLimit"){S.limit=+t.value;render();toast("하루 사용 시간을 "+t.value+"시간으로 바꿨어요");}});
document.addEventListener("keydown",e=>{if(e.target&&e.target.id==="termin"&&(e.key==="ArrowUp"||e.key==="ArrowDown")){e.preventDefault();if(!WF.hist.length)return;WF.hi=Math.max(0,Math.min(WF.hist.length,WF.hi+(e.key==="ArrowUp"?-1:1)));e.target.value=WF.hist[WF.hi]||"";return;}const ko=S.set.keys===false;if(e.key==="/"&&!ko&&S.user&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/^(INPUT|TEXTAREA|SELECT)$/.test((e.target||{}).tagName||"")&&!(e.target&&e.target.isContentEditable)){e.preventDefault();openSearch();return;}
if(e.key==="Escape"&&(S.menu||S.drawer||S.tempAsk||S.acct)){S.menu=false;S.drawer=false;S.tempAsk=false;S.acct=false;render();}
if(!ko&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="b"&&S.user){e.preventDefault();S.sideOff=!S.sideOff;store.set("lago_sideoff",S.sideOff);render();return;}
if(!ko&&(e.ctrlKey||e.metaKey)&&e.key===","&&S.user&&!S.goccia){e.preventDefault();go("prefs");return;}
if(e.key==="Escape"&&(S.cmenu||S.share||S.renameChat||S.delChat||S.sideEdit)){S.sideEdit=false;S.cmenu=null;S.share=null;S.renameChat=null;S.delChat=null;S.flyout=false;render();return;}
if(!ko&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"&&S.user){e.preventDefault();S.cur=null;go(S.area==="code"?"code":"home");}});
document.addEventListener("submit",async e=>{const f=e.target;e.preventDefault();
if(f.id==="composer"){composerSend($("#q").value);return;}
if(f.id==="termf"){const i=f.querySelector("#termin");const v=i.value;i.value="";await termRun(v);termFocus();return;}
if(f.id==="saveForm"){const nm=($("#scname").value||"").trim().replace(/^\/+/,"");if(!nm){$("#scerr").textContent="파일 이름을 적어 주세요";return;}const sc=S.saveCode;try{const r=await DESK.writeFile(relJoin(WF.cwd,nm),sc.text);if(r&&r.denied){$("#scerr").textContent="저장하지 않았어요 (거절)";return;}if(r&&r.error){$("#scerr").textContent=r.error;return;}S.saveCode=null;await wfRefresh();toast(nm+" 에 저장했어요");render();}catch(er){$("#scerr").textContent=(er&&er.message)||"저장하지 못했어요";}return;}
if(f.id==="todoForm"){const v=$("#todoIn").value.trim();if(v){S.todos.push({t:v,d:false});render();setTimeout(()=>$("#todoIn")&&$("#todoIn").focus(),0);}return;}
if(f.id==="loginForm"){const em=$("#le").value.trim().toLowerCase(),pw=$("#lp").value,err=$("#lerr");
 if(!/^\S+@\S+\.\S+$/.test(em)){err.textContent="이메일 주소를 확인해 주세요.";$("#le").focus();return;}
 if(!pw){err.textContent="비밀번호를 입력해 주세요.";$("#lp").focus();return;}
 {const bl=em!==DEMO.email&&fbBlock();if(bl){err.textContent=bl;return;}}
 if(S.fb&&em!==DEMO.email){err.textContent="";const b=f.querySelector("button.pri,button[type=submit]");if(b)b.disabled=true;try{await S.fb.auth.signInWithEmailAndPassword(em,pw);toast("다시 오신 걸 환영해요");}catch(e){err.textContent=fbMsg(e);}if(b)b.disabled=false;return;}
 if(em===DEMO.email){S.user={...DEMO};store.set("lago_session",S.user);loadUser();go("home");return;}
 const u=store.get("lago_users",{})[em];if(!u){err.textContent="가입된 이메일이 아니에요. 회원가입을 먼저 해 주세요.";return;}
 if(u.hash!==await hash(pw)){err.textContent="비밀번호가 맞지 않아요.";$("#lp").focus();return;}
 if(!u.verified){S.pendingVerify=em;go("verify");return;}
 S.user={email:em,name:u.name,plan:u.plan||"Free"};store.set("lago_session",S.user);loadUser();toast(u.name+"님, 다시 오신 걸 환영해요");go("home");return;}
if(f.id==="devForm"){e.preventDefault();const isM=(S.devQ||{}).kind==="mcp";const q=S.devQ={...(S.devQ||{kind:"mode"}),name:$("#dvN").value.trim(),desc:$("#dvD").value.trim(),...(isM?{url:$("#dvU").value.trim(),token:$("#dvK").value.trim(),ins:"MCP",model:""}:{ins:$("#dvI").value.trim(),model:$("#dvM").value})};if(q.name.length<2||(!isM&&q.ins.length<5)){S.devMsg="이름과 내용을 적어 주세요.";render();return;}
if(isM&&!/^https?:\/\/\S+$/.test(q.url)){S.devMsg="http:// 또는 https:// 로 시작하는 MCP 서버 주소를 넣어 주세요.";render();return;}
S.devBusy=true;S.devMsg="";S.devWarn=null;q.link="";render();try{const base={viaDev:true,cover:q.cover||"",name:q.name,desc:(q.desc||q.ins).slice(0,60),ins:q.ins,model:q.model,showName:true,ownerName:S.user.name,emails:[],invite:false};let it;
if(q.kind==="mcp"){it={id:"x"+Date.now().toString(36),name:q.name,desc:q.desc};const j=await pubFetch("/api/tools/publish",{...base,kind:"mcp",ins:"MCP",url:q.url,token:q.token,ack:!!q.ack,desc:q.desc||q.name});it.pub={id:j.id};S.myMcp=[it,...(S.myMcp||[])];q.link=location.origin+"/t/"+j.id;q.url="";q.token="";q.ack=false;}
else if(q.kind==="mode"){it={ic:"bot",c:"#1B3E9E",mode:"Torrente",web:0,name:q.name,desc:q.ins.slice(0,60),ins:q.ins,starters:[],model:q.model,id:"m"+Date.now(),mine:true,cat:"내 MODE",showName:true,viaDev:true};const j=await pubFetch("/api/tools/publish",{...base,kind:"mode",input:"text",starters:[]});it.pub={id:j.id};S.myAgents.unshift(it);q.link=location.origin+"/t/"+j.id;}
else{it={name:q.name,desc:q.ins.slice(0,60),ins:q.ins,input:"both",opts:[],model:q.model,id:"u"+Date.now().toString(36),showName:true,viaDev:true};const j=await pubFetch("/api/tools/publish",{...base,kind:"tool",input:"both",opts:[]});it.pub={id:j.id};S.myTools=[it,...(S.myTools||[])];q.link=location.origin+"/t/"+j.id;}S.devL=null;
q.name="";q.ins="";save();toast("만들고 공개했어요");}catch(er){q.ack=false;if(er.needAck){S.devWarn={risk:er.risk,url:er.url};}else S.devMsg=er.message+(er.block&&er.url?" · "+er.url:"");}S.devBusy=false;render();return;}
if(f.id==="joinForm"){const n=$("#jn").value.trim(),em=$("#je").value.trim().toLowerCase(),pw=$("#jp").value,err=$("#jerr");
 if(!n){err.textContent="이름을 입력해 주세요.";$("#jn").focus();return;}
 if(!/^\S+@\S+\.\S+$/.test(em)){err.textContent="이메일 주소를 확인해 주세요.";$("#je").focus();return;}
 if(pw.length<8||!/[A-Za-z]/.test(pw)||!/\d/.test(pw)){err.textContent="비밀번호는 영문과 숫자를 섞어 8자 이상이에요.";$("#jp").focus();return;}
 const by=+$("#jy").value,bm=+$("#jm").value,bd=+$("#jd").value,now=new Date();let age=now.getFullYear()-by;if(now.getMonth()+1<bm||(now.getMonth()+1===bm&&now.getDate()<bd))age--;
 if(age<14){S.kid={sent:false,email:""};go("kid");return;}
 if(!$("#jt").checked){err.textContent="이용약관 · 개인정보 처리방침에 동의해 주세요.";return;}
 {const bl=fbBlock();if(bl){err.textContent=bl;return;}}
 if(S.fb){err.textContent="";const b=f.querySelector("button.pri,button[type=submit]");if(b)b.disabled=true;S.signingUp=true;try{const cr=await S.fb.auth.createUserWithEmailAndPassword(em,pw);await cr.user.updateProfile({displayName:n});S.pendingName=n;await S.fb.db.doc("users/"+cr.user.uid+"/data/main").set({name:n,plan:"Free",chats:[],learn:$("#jl").checked,learnImg:$("#jl").checked,age14:new Date().toISOString().slice(0,10),created:Date.now()});try{await cr.user.sendEmailVerification();}catch(e){}if(S.user)S.user.name=n;render();toast(n+"님, 가입했어요. 확인 메일도 보냈어요");}catch(e){err.textContent=fbMsg(e);}S.signingUp=false;if(b)b.disabled=false;return;}
 const users=store.get("lago_users",{});if(users[em]||em===DEMO.email){err.textContent="이미 가입된 이메일이에요. 로그인해 주세요.";return;}
 users[em]={name:n,hash:await hash(pw),verified:false,plan:"Free",learn:$("#jl").checked,age14:new Date().toISOString().slice(0,10)};store.set("lago_users",users);
 store.set("lago_data_"+em,{chats:[],learn:$("#jl").checked,learnImg:$("#jl").checked});
 S.pendingVerify=em;go("verify");return;}
if(f.id==="toolForm"){const k=f.dataset.tool,raw=($("#ti")?$("#ti").value.trim():""),op=$("#to")?$("#to").value:"",fl=$("#tf2")&&$("#tf2").files&&$("#tf2").files[0],err=$("#toolerr");
 if((k==="translate"||k==="spell")&&!modelOn()){err.textContent="모델 서버가 지금 꺼져 있어요. 서버가 켜지면 바로 돼요.";return;}
 if(!raw&&!fl){err.textContent=k==="extract"?"파일을 올려 주세요.":"글을 붙여 넣거나 파일을 올려 주세요.";return;}
 if(fl&&fl.size>15*1024*1024){err.textContent="파일이 너무 커요. 15MB 이하로 올려 주세요.";return;}
 err.textContent="";S.toolIn={text:raw,opt:op};runTool(k,{raw,opt:op,file:fl||null});return;}
if(f.id==="toolNewForm"){const nm=$("#tnN").value.trim(),ins=$("#tnI").value.trim(),err=$("#tnerr");if(!nm){err.textContent="이름을 입력해 주세요.";$("#tnN").focus();return;}if(!ins){err.textContent="지시문을 적어 주세요.";$("#tnI").focus();return;}
 const o={name:nm,desc:$("#tnD").value.trim(),ins,input:$("#tnT").value,opts:$("#tnO").value.split(",").map(x=>x.trim()).filter(Boolean).slice(0,8),model:$("#tnM").value};
 if(S.editTool){const t=myTool(S.editTool);Object.assign(t,o);S.curTool=t.id;toast(t.pub?"저장했어요. 배포한 도구는 ‘배포 관리’에서 업데이트해 주세요":"저장했어요");}else{const t={...o,id:"u"+Date.now().toString(36)};S.myTools=[t,...(S.myTools||[])];S.curTool=t.id;toast("도구를 만들었어요");}
 S.editTool=null;S.toolDraft=null;save();go("tools");return;}
if(f.id==="toolMyForm"){const d=myTool(S.curTool),raw=($("#tmT")?$("#tmT").value.trim():""),fl=$("#tmF")&&$("#tmF").files&&$("#tmF").files[0],err=$("#tmerr");if(!d)return;if(!raw&&!fl){err.textContent="글을 넣거나 파일을 올려 주세요.";return;}if(fl&&fl.size>15*1024*1024){err.textContent="파일이 너무 커요. 15MB 이하로 올려 주세요.";return;}err.textContent="";S.toolIn={text:raw};runTool("custom",{raw,opt:$("#tmO")?$("#tmO").value:"",file:fl||null,def:d});return;}
if(f.id==="toolPubForm"){const err=$("#tperr");if(!S.user){err.textContent="로그인이 필요해요.";return;}if(S.tpBusy)return;const raw=($("#tpT")?$("#tpT").value.trim():""),fl=$("#tpF")&&$("#tpF").files&&$("#tpF").files[0];if(!raw&&!fl){err.textContent="글을 넣거나 파일을 올려 주세요.";return;}if(fl&&fl.size>15*1024*1024){err.textContent="파일이 너무 커요. 15MB 이하로 올려 주세요.";return;}
 err.textContent="";S.tpBusy=true;S.tpOut="";S.tpIn={text:raw};render();let body=raw;try{if(fl){const r=await readFileText(fl);body=(r.text||"").trim();}if(!body)throw new Error("글자를 찾지 못했어요");const j=await pubFetch("/api/tools/run",{id:S.tpId,text:body.slice(0,3000),opt:$("#tpO")?$("#tpO").value:""});S.tpOut=j.answer||"";}catch(er){S.tpOut="";setTimeout(()=>{const e2=$("#tperr");if(e2)e2.textContent=er.message;},0);}S.tpBusy=false;render();return;}
if(f.id==="mcpForm"){e.preventDefault();const u=$("#mu").value.trim();if(!/^https?:\/\/\S+$/.test(u)){S.mcpMsg="http:// 또는 https:// 로 시작하는 서버 주소를 넣어 주세요.";render();return;}S.mcpBusy=true;S.mcpMsg="";S.mcpWarn=null;const body={name:$("#mn").value.trim(),url:u,token:$("#mk").value.trim()};render();await mcpAdd(body);return;}
if(f.id==="taskForm"){const n=$("#tn").value.trim(),pr=$("#tp").value.trim(),err=$("#terr");if(!n){err.textContent="이름을 입력해 주세요.";$("#tn").focus();return;}if(!pr){err.textContent="시킬 말을 입력해 주세요.";$("#tp").focus();return;}
 if(!$("#tt").value){err.textContent="시간을 정해 주세요.";return;}S.tasks.unshift({id:"t"+Date.now(),name:n,prompt:pr,freq:$("#tf").value,day:$("#td").value,time:$("#tt").value,on:true});S.taskNew=false;S.taskDraft=null;save();render();toast("예약 작업을 만들었어요");return;}
if(f.id==="kidForm"){const em=$("#ke").value.trim();if(!/^\S+@\S+\.\S+$/.test(em)){$("#kerr").textContent="보호자 이메일 주소를 확인해 주세요.";return;}const btn=f.querySelector("button[type=submit],button.pri");if(btn)btn.disabled=true;
 if(S.api&&S.api.mail){try{const r=await fetch("/api/kid-consent",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:em})});const j=await r.json().catch(()=>({}));if(!r.ok){$("#kerr").textContent=j.error||"메일을 보내지 못했어요. 잠시 뒤에 다시 해 주세요.";if(btn)btn.disabled=false;return;}S.kid={sent:true,email:em};render();toast("보호자 이메일로 동의 요청을 보냈어요");return;}catch(e){$("#kerr").textContent="인터넷 연결을 확인해 주세요.";if(btn)btn.disabled=false;return;}}
 S.kid={sent:true,email:em};render();toast("미리보기라서 실제 메일은 보내지 않았어요");return;}
if(f.dataset.rf){const c=S.chats.find(x=>x.id===f.dataset.rf);const v=$("#rnc").value.trim();if(c&&v){c.title=v;save();toast("이름을 바꿨어요");}S.renameChat=null;render();return;}
if(f.id==="agentForm"){readDraft();const d=S.draft;if(!d.name){$("#aerr").textContent="이름을 입력해 주세요.";$("#an").focus();return;}if(!d.ins){$("#aerr").textContent="지시문을 한 줄 이상 적어 주세요.";$("#ai").focus();return;}
 if(S.editAgent){const i=S.myAgents.findIndex(a=>a.id===S.editAgent);S.myAgents[i]={...S.myAgents[i],...d};S.curAgent=S.editAgent;}else{const a={...d,id:"m"+Date.now(),mine:true,cat:"내 MODE"};S.myAgents.unshift(a);S.curAgent=a.id;}
 save();toast(S.editAgent?"MODE를 저장했어요":"MODE를 만들었어요");S.editAgent=null;go("agent");return;}
if(f.id==="guardForm"){const em=($("#ge").value||"").trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){$("#gerr").textContent="이메일 주소를 확인해 주세요.";return;}S.guardian={email:em,at:Date.now()};save();toast("보호자로 등록했어요");render();return;}
if(f.id==="projForm"){const n=$("#pn").value.trim();if(!n){$("#perr").textContent="프로젝트 이름을 입력해 주세요.";return;}S.projects.unshift({id:"p"+Date.now(),name:n,desc:$("#pd").value.trim(),n:0,u:"방금",ins:"",files:[]});S.newProj=false;render();toast("프로젝트를 만들었어요");return;}
if(f.id==="renameForm"){const v=$("#rn").value.trim();if(v){S.user.name=v;if(S.user.uid)fbSave(true);else store.set("lago_session",S.user);const us=store.get("lago_users",{});if(us[S.user.email]){us[S.user.email].name=v;store.set("lago_users",us);}}S.renaming=false;render();toast("이름을 바꿨어요");}});
document.addEventListener("click",e=>{let ch=false;if(S.plus&&!e.target.closest(".composer")){S.plus=false;ch=true;}if(S.menu&&!e.target.closest(".composer")){S.menu=false;ch=true;}if(S.conn&&!e.target.closest(".composer")){S.conn=false;ch=true;}if(S.acct&&!e.target.closest(".acct,[data-act=acct]")){S.acct=false;ch=true;}if(S.cmenu&&!e.target.closest(".cmenu,[data-cmenu]")){S.cmenu=null;ch=true;}if(ch)render();},true);

/* ---------- brand 3D mark (login) ---------- */
function startBrand(){if(!window.THREE)return;const canvas=$("#bc"),host=canvas.parentElement;if(brandStage)brandStage.stop();
const ease=t=>t<0?0:t>1?1:1-Math.pow(1-t,3),easeIO=t=>t<0?0:t>1?1:t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const r=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});r.setPixelRatio(Math.min(2,devicePixelRatio));r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(38,1,.1,100);cam.position.z=7.5;
scene.add(new THREE.AmbientLight(0x9fb6ff,.55));const k=new THREE.DirectionalLight(0xffffff,1.1);k.position.set(3,4,6);scene.add(k);const rim=new THREE.DirectionalLight(0x6f9bff,.9);rim.position.set(-5,-2,-3);scene.add(rim);
function half(up){const s=new THREE.Shape();if(up){s.moveTo(1,0);s.absarc(0,0,1,0,Math.PI,false);}else{s.moveTo(-1,0);s.absarc(0,0,1,Math.PI,Math.PI*2,false);}s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.28,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:4,curveSegments:64});g.translate(0,0,-.14);
 const p=g.attributes.position,col=new Float32Array(p.count*3),a=new THREE.Color("#8FB2FF").convertSRGBToLinear(),b=new THREE.Color("#0B2468").convertSRGBToLinear(),c=new THREE.Color();for(let i=0;i<p.count;i++){const x=p.getX(i),kk=up?(x+1)/2:1-(x+1)/2;c.copy(a).lerp(b,Math.min(1,Math.max(0,kk)));col.set([c.r,c.g,c.b],i*3);}g.setAttribute("color",new THREE.BufferAttribute(col,3));return new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,metalness:.35,roughness:.28}));}
const G=new THREE.Group(),R=half(true),L=half(false);G.add(L,R);scene.add(G);let vw=1,vh=1,raf=0,t0=0;
function size(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();vh=2*cam.position.z*Math.tan(THREE.MathUtils.degToRad(19));vw=vh*cam.aspect;}
function frame(now){if(!document.body.contains(canvas)){cancelAnimationFrame(raf);r.dispose();return;}const t=matchMedia("(prefers-reduced-motion: reduce)").matches?6:(now-t0)/1000;
 const a=easeIO(t/2.6),s=ease((t-2.4)/1.2),ang=(1-a)*Math.PI*2.2,rad=(1-a)*5.5;R.position.set(1+Math.cos(ang)*rad,Math.sin(ang)*rad*.6,-(1-a)*6);L.position.set(-1-Math.cos(ang)*rad,-Math.sin(ang)*rad*.6,-(1-a)*6);R.rotation.set((1-a)*2.4,(1-a)*-3.1,(1-a)*1.2);L.rotation.set((1-a)*-2.4,(1-a)*3.1,(1-a)*1.2);
 const sc=Math.min(.82*vw/4,.42*vh);G.rotation.y=(1-ease((t-1.6)/2.2))*-Math.PI+Math.sin(t*.8)*.1*s;G.position.set((vw/2-2*sc*.78)*s,(-vh/2+sc*1.05)*s,0);G.scale.setScalar(1+(sc-1)*s);r.render(scene,cam);raf=requestAnimationFrame(frame);}
const api={play(){size();cancelAnimationFrame(raf);t0=performance.now();raf=requestAnimationFrame(frame);},stop(){cancelAnimationFrame(raf);}};addEventListener("resize",size);brandStage=api;api.play();}

/* ---------- 작업 폴더 · 터미널 · LAGO Desktop(EXE) ---------- */
const DESK=(window.lagoDesktop&&typeof window.lagoDesktop.run==="function")?window.lagoDesktop:null;
const WF={name:"",path:"",files:[],handle:null,picked:null,cwd:"",open:null,openTxt:"",lines:[],hist:[],hi:-1};
const SKIPD=/^(node_modules|\.git|__pycache__|\.venv|venv|dist|build|\.next|\.cache|\.idea|\.vscode)$/;
const TXT=/\.(js|mjs|cjs|ts|jsx|tsx|py|json|md|txt|html?|css|scss|java|c|cc|cpp|h|hpp|cs|go|rs|rb|php|sh|bat|ps1|ya?ml|toml|csv|tsv|vue|svelte|kt|swift|sql|ini|cfg|env|xml|gradle|lua|r|dart|ipynb|log|gitignore)$/i;
async function wfWalk(h,pre,out,depth){for await(const [n,e] of h.entries()){if(out.length>=800)return;if(SKIPD.test(n))continue;const p=pre?pre+"/"+n:n;if(e.kind==="directory"){out.push({p,dir:true});if(depth<6)await wfWalk(e,p,out,depth+1);}else{let size=0;try{size=(await e.getFile()).size;}catch(er){}out.push({p,dir:false,size});}}}
function wfSort(){WF.files.sort((a,b)=>a.p.localeCompare(b.p));}
async function wfRefresh(){if(DESK){WF.files=await DESK.list();}else if(WF.handle){const out=[];await wfWalk(WF.handle,"",out,0);WF.files=out;}wfSort();}
function wfOpened(){WF.cwd="";WF.open=null;WF.openTxt="";WF.lines=[];termPrint("sys",WF.name+" 폴더를 열었어요 · 파일 "+WF.files.filter(f=>!f.dir).length+"개"+(DESK?"":" · 웹에서는 읽기만 해요"));render();}
async function wfPick(){try{
 if(DESK){const r=await DESK.pickFolder();if(!r)return;WF.name=r.name;WF.path=r.path;WF.files=await DESK.list();wfSort();wfOpened();return;}
 if(window.showDirectoryPicker){const h=await window.showDirectoryPicker({mode:"read"});WF.handle=h;WF.picked=null;WF.name=h.name;WF.path="";const out=[];await wfWalk(h,"",out,0);WF.files=out;wfSort();wfOpened();return;}
 const inp=document.createElement("input");inp.type="file";inp.webkitdirectory=true;inp.multiple=true;inp.hidden=true;document.body.appendChild(inp);
 inp.addEventListener("change",()=>{const fs=[...inp.files];inp.remove();if(!fs.length)return;WF.handle=null;WF.picked={};WF.path="";WF.name=(fs[0].webkitRelativePath||"").split("/")[0]||"폴더";const dirs=new Set();WF.files=[];
  fs.forEach(f=>{const rel=(f.webkitRelativePath||f.name).split("/").slice(1).join("/");if(!rel||rel.split("/").some(x=>SKIPD.test(x)))return;const ps=rel.split("/");for(let i=1;i<ps.length;i++)dirs.add(ps.slice(0,i).join("/"));WF.picked[rel]=f;WF.files.push({p:rel,dir:false,size:f.size});});
  dirs.forEach(d=>WF.files.push({p:d,dir:true}));WF.files=WF.files.slice(0,800);wfSort();wfOpened();});inp.click();
}catch(e){if(e&&e.name==="AbortError")return;toast((e&&e.message)||"폴더를 열지 못했어요");}}
async function wfRead(rel){if(DESK){const t=await DESK.readFile(rel);if(t&&t.error)throw new Error(t.error);return String(t);}
 const f=WF.files.find(x=>x.p===rel&&!x.dir);if(!f)throw new Error("그런 파일이 없어요: "+rel);if(f.size>400000)throw new Error("파일이 너무 커요 (400KB까지 읽어요)");
 if(WF.handle){let h=WF.handle;const ps=rel.split("/");for(let i=0;i<ps.length-1;i++)h=await h.getDirectoryHandle(ps[i]);return await (await (await h.getFileHandle(ps[ps.length-1])).getFile()).text();}
 if(WF.picked&&WF.picked[rel])return await WF.picked[rel].text();throw new Error("파일을 읽지 못했어요");}
async function wfCtx(q){if(!WF.name)return "";let s="폴더: "+WF.name+"\n파일 목록:\n"+WF.files.filter(f=>!f.dir).slice(0,80).map(f=>"- "+f.p).join("\n");
 const pick=WF.files.filter(f=>!f.dir&&f.size<80000&&TXT.test(f.p)&&q.includes(f.p.split("/").pop()));if(WF.open&&!pick.some(f=>f.p===WF.open))pick.unshift({p:WF.open});
 for(const f of pick.slice(0,3)){try{s+="\n\n[파일 "+f.p+"]\n"+(await wfRead(f.p)).slice(0,2500);}catch(e){}}return s.slice(0,6000);}
function histOf(c){return c.msgs.slice(0,-2).filter(m=>!m.loading&&(m.role==="user"?m.text:m.plain)).slice(-4).map(m=>({r:m.role==="user"?"u":"a",t:String(m.role==="user"?m.text:m.plain).slice(0,300)}));}
async function codeLive(text,hist){const cm=modeOf(S.cmode).lab;
 if(!modelOn())return{html:`<span class="status">${ic("code",14)} ${cm}</span><p class="answer">${S.api&&S.api.model?"로그인하면 CODE가 코드를 써 줘요.":"모델 서버가 지금 꺼져 있어서 코드를 쓸 수 없어요. 서버가 켜지면 바로 돼요."}</p>`,plain:"모델 꺼짐",meta:cm};
 stageSet(WF.name?"작업 폴더 읽는 중":"코드 쓰는 중");const ctx=await wfCtx(text);stageSet("코드 쓰는 중");
 const r=await modelCall({task:"code",q:text,hist,ctx:ctx||undefined,model:undefined});
 if(r.ok&&r.d.answer)return{html:`<span class="status">${ic("code",14)} ${cm}${WF.name?" · "+esc(WF.name)+" 폴더 참고":""}</span><div class="answer rich">${RICH(r.d.answer)}</div>${modelNote}`,plain:r.d.answer,meta:cm+(WF.name?" · "+WF.name:"")};
 return{html:`<span class="status">${ic("code",14)} ${cm}</span><p class="answer">${esc((r.d&&r.d.error)||"모델 서버에 연결하지 못했어요. 잠시 뒤에 다시 해 주세요.")}</p>`,plain:"실패",meta:cm};}
const relJoin=(a,b)=>{const out=a?a.split("/"):[];for(const x of String(b||"").replace(/\\/g,"/").split("/")){if(!x||x===".")continue;if(x==="..")out.pop();else out.push(x);}return out.join("/");};
const termLine=l=>`<div class="tl ${l.k}">${esc(l.k!=="out"&&l.k!=="cmd"&&S.lang==="en"?trText(l.t):l.t)}</div>`;
function termPrint(k,t){WF.lines.push({k,t:String(t)});if(WF.lines.length>500)WF.lines=WF.lines.slice(-500);const o=document.getElementById("termout");if(o){o.insertAdjacentHTML("beforeend",termLine(WF.lines[WF.lines.length-1]));o.scrollTop=o.scrollHeight;}}
function termFocus(){const i=document.getElementById("termin");if(i)i.focus();const o=document.getElementById("termout");if(o)o.scrollTop=o.scrollHeight;}
function termPanel(){const hello=DESK?"명령을 입력하세요. 실행 전에 확인 창이 떠요. help로 도움말을 볼 수 있어요.":"help를 입력하면 쓸 수 있는 명령이 보여요. npm·python 같은 실제 실행은 LAGO Desktop(EXE)에서 돼요.";
return `<section class="termp" aria-label="터미널"><div class="termh">${ic("term",15)}<b>터미널</b><span class="tpath">${WF.name?esc(WF.name)+(WF.cwd?"/"+esc(WF.cwd):""):"폴더 없음"}</span><span class="grow"></span><span class="tag">${DESK?"Desktop · 실행 전 확인":"웹 · 읽기 명령"}</span><button type="button" class="iconbtn" data-act="term" aria-label="터미널 닫기">${ic("x",15)}</button></div><div class="termout" id="termout" role="log">${(WF.lines.length?WF.lines:[{k:"sys",t:hello}]).map(termLine).join("")}</div><form class="termf" id="termf" autocomplete="off"><span class="pr">$</span><input id="termin" spellcheck="false" aria-label="명령" placeholder="${WF.name?"ls · cat 파일 · cd 폴더 · help":"open 을 입력해 폴더를 열어요"}"></form></section>`;}
async function termExec(cmd){if(!DESK){termPrint("err","실제 명령 실행은 LAGO Desktop(EXE)에서 돼요.");return;}if(!WF.name){termPrint("err","먼저 폴더를 열어 주세요 (open)");return;}
 termPrint("sys","확인 창에서 허락하면 실행해요…");let r;try{r=await DESK.run(cmd,WF.cwd);}catch(e){termPrint("err",(e&&e.message)||"실행하지 못했어요");return;}
 if(r.denied){termPrint("err","실행하지 않았어요 (거절)");return;}if(r.error){termPrint("err",r.error);return;}
 if(r.out)termPrint("out",r.out);if(r.err)termPrint("err",r.err);termPrint("sys","끝 · 코드 "+r.code+(r.timeout?" · 시간이 오래 걸려 멈췄어요":""));try{await wfRefresh();}catch(e){}}
async function termRun(line){line=String(line||"").trim();if(!line)return;WF.hist.push(line);WF.hi=WF.hist.length;termPrint("cmd","$ "+line);
 const sp=line.indexOf(" "),c=(sp<0?line:line.slice(0,sp)).toLowerCase(),a=sp<0?"":line.slice(sp+1).trim();
 const need=()=>{if(WF.name)return false;termPrint("err","열린 폴더가 없어요. open 을 입력하거나 ‘폴더 열기’를 눌러 주세요.");return true;};
 const kids=d=>WF.files.filter(f=>d?(f.p.startsWith(d+"/")&&!f.p.slice(d.length+1).includes("/")):!f.p.includes("/"));
 try{switch(c){
 case"help":if(S.lang==="en"){termPrint("out","open        open a folder\nls [dir]    list\ncd dir      change folder (cd .. goes up)\npwd         current folder\ncat file    show a file\nhead file   first 20 lines\ntree        whole structure\nfind name   find files\ngrep text   find lines containing text\nwc file     lines · characters\nask ...     ask LAGO CODE about this folder\nclear       clear the screen"+(DESK?"\n\nOther commands (npm, python, git …) really run in this folder after you approve them.":"\n\nOther commands run in LAGO Desktop (EXE)."));break;}termPrint("out","open        폴더 열기\nls [폴더]   목록 보기\ncd 폴더     이동 (cd .. 은 위로)\npwd         지금 위치\ncat 파일    내용 보기\nhead 파일   앞 20줄\ntree        전체 구조\nfind 이름   파일 찾기\ngrep 글자   글자가 든 줄 찾기\nwc 파일     줄 · 글자 수\nask 질문    이 폴더를 보고 LAGO CODE에게 묻기\nclear       화면 지우기"+(DESK?"\n\n그 밖의 명령(npm, python, git …)은 확인 창에서 허락하면 이 폴더에서 실제로 실행돼요.":"\n\n그 밖의 명령은 LAGO Desktop(EXE)에서 실행할 수 있어요."));break;
 case"clear":case"cls":{WF.lines=[];const o=document.getElementById("termout");if(o)o.innerHTML="";break;}
 case"open":await wfPick();break;
 case"pwd":if(need())break;termPrint("out",(WF.path||WF.name)+(WF.cwd?"/"+WF.cwd:""));break;
 case"ls":case"dir":{if(need())break;if(DESK&&/^-/.test(a)){await termExec(line);break;}const d=relJoin(WF.cwd,a);if(d&&!WF.files.some(f=>f.dir&&f.p===d)){termPrint("err","그런 폴더가 없어요: "+a);break;}const k=kids(d);termPrint("out",k.length?k.map(f=>f.p.split("/").pop()+(f.dir?"/":"")).join("\n"):"(비어 있어요)");break;}
 case"cd":{if(need())break;const d=relJoin(WF.cwd,a);if(d&&!WF.files.some(f=>f.dir&&f.p===d)){termPrint("err","그런 폴더가 없어요: "+a);break;}WF.cwd=d;const h=document.querySelector(".termh .tpath");if(h)h.textContent=WF.name+(d?"/"+d:"");break;}
 case"cat":case"type":case"head":{if(need())break;if(!a){termPrint("err","파일 이름을 적어 주세요");break;}const t=await wfRead(relJoin(WF.cwd,a));termPrint("out",c==="head"?t.split("\n").slice(0,20).join("\n"):t.slice(0,20000)+(t.length>20000?"\n… (앞 20,000자만 보여요)":""));break;}
 case"wc":{if(need())break;const t=await wfRead(relJoin(WF.cwd,a));termPrint("out",t.split("\n").length+"줄 · "+t.length.toLocaleString()+"자");break;}
 case"tree":{if(need())break;const pre=WF.cwd?WF.cwd+"/":"";const l=WF.files.filter(f=>f.p.startsWith(pre)).slice(0,300);termPrint("out",l.map(f=>{const r=f.p.slice(pre.length);return "  ".repeat(r.split("/").length-1)+r.split("/").pop()+(f.dir?"/":"");}).join("\n")||"(비어 있어요)");break;}
 case"find":{if(need())break;const k=a.toLowerCase();const l=WF.files.filter(f=>f.p.toLowerCase().includes(k)).slice(0,80);termPrint("out",l.map(f=>f.p+(f.dir?"/":"")).join("\n")||"찾지 못했어요");break;}
 case"grep":{if(need())break;if(!a){termPrint("err","찾을 글자를 적어 주세요");break;}if(DESK&&/^-/.test(a)){await termExec(line);break;}const q=a.replace(/^["']|["']$/g,"");const hits=[];let n=0;for(const f of WF.files){if(f.dir||f.size>200000||!TXT.test(f.p))continue;if(++n>200)break;try{(await wfRead(f.p)).split("\n").forEach((l,i)=>{if(hits.length<80&&l.includes(q))hits.push(f.p+":"+(i+1)+": "+l.trim().slice(0,160));});}catch(e){}}termPrint("out",hits.join("\n")||"찾지 못했어요");break;}
 case"ask":if(!a){termPrint("err","물어볼 내용을 적어 주세요 (예: ask app.py 설명해 줘)");break;}termPrint("sys","LAGO CODE에게 물어봤어요. 답은 대화에 나와요.");send(a);break;
 default:if(need())break;if(!DESK){termPrint("err",c+": 웹에서는 실행할 수 없어요. 실제 명령 실행은 LAGO Desktop(EXE)에서 돼요. help 를 입력해 보세요.");break;}await termExec(line);}
 }catch(e){termPrint("err",(e&&e.message)||"실패했어요");}}
function termToggle(open){if(S.goccia){toast("아이 계정에서는 터미널을 쓸 수 없어요");return;}S.term=open===undefined?!S.term:open;const r=route();if(S.term&&!["code","code-chat","code-folder"].includes(r)){S.area="code";go("code-folder");}else render();if(S.term)setTimeout(termFocus,0);}
function fileView(){if(!WF.open)return "";const t=WF.openTxt;return `<div class="card fileview" style="display:grid;gap:8px;min-width:0"><div class="row" style="gap:8px;flex-wrap:wrap"><b class="grow" style="font:600 13px var(--mono);word-break:break-all">${esc(WF.open)}</b><button class="btn sm" data-act="fileAsk">${ic("code",14)} 이 파일로 묻기</button><button class="iconbtn" data-act="fileClose" aria-label="파일 닫기">${ic("x",15)}</button></div><pre class="codeb" style="max-height:420px;margin:0"><code>${esc(t.slice(0,30000))}</code></pre>${t.length>30000?`<span class="muted" style="font-size:12px">앞 30,000자만 보여요</span>`:""}</div>`;}
function deskCard(){return `<div class="card" style="display:grid;gap:8px"><div class="row" style="gap:8px">${ic("monitor",17)}<b class="grow">LAGO Desktop (Windows EXE)</b>${DESK?`<span class="tag" style="background:var(--gt);color:var(--g)">실행 중</span>`:""}</div><span class="muted" style="font-size:13px">${DESK?"이 창은 LAGO Desktop이에요. 폴더 읽기 · 명령 실행 · 파일 저장이 모두 돼요. 실행과 저장은 항상 확인 창에서 허락한 뒤에만 해요.":"EXE로 쓰면 이 폴더에서 npm · python · git 같은 명령을 실제로 실행하고, 답에 나온 코드를 파일로 저장할 수 있어요."}</span>${DESK?"":`<button class="btn sm" data-go="apps">${ic("download",14)} LAGO Desktop 받기</button>`}</div>`;}
const DESK_URL="https://github.com/lagem1535-create/LAGO_AI_home/releases/latest";
/* 사용량: 이 기기에서 실제로 주고받은 글자 수로 세요 (글자 2개 ≈ 1토큰) */
const dayKey=(ms)=>new Date((ms||Date.now())+9*36e5).toISOString().slice(0,10);
const useKey=()=>"lago_use_"+((S.user&&(S.user.uid||S.user.email))||"me");
function useAdd(mode,a,b){try{const u=store.get(useKey(),{})||{};const k=dayKey();const d=u[k]||(u[k]={t:0,n:0,by:{}});const tk=Math.ceil((String(a||"").length+String(b||"").length)/2);d.t+=tk;d.n++;d.by[mode]=(d.by[mode]||0)+tk;const ks=Object.keys(u).sort();while(ks.length>30)delete u[ks.shift()];store.set(useKey(),u);}catch(e){}}
function useDay(k){const u=store.get(useKey(),{})||{};return u[k]||{t:0,n:0,by:{}};}

const REL="https://github.com/lagem1535-create/LAGO_AI_home/releases/latest/download/";
const IN_APK=/LAGOAndroid\//.test(navigator.userAgent);
function vApps(){let alone=false;try{alone=matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;}catch(e){}
const dl=(f,l,sub)=>`<a class="btn sm" href="${REL+f}" target="_blank" rel="noopener">${ic("download",14)} ${l}${sub?` <span class="muted" style="font-weight:400">${sub}</span>`:""}</a>`;
const card=(k,t,on,body)=>`<div class="card" style="display:grid;gap:10px;align-content:start;min-width:0"><div class="row" style="gap:8px">${ic(k,18)}<b class="grow" style="font-size:15px">${t}</b>${on?`<span class="tag" style="background:var(--gt);color:var(--g)">지금 쓰는 중</span>`:""}</div>${body}</div>`;
const cmd=t=>`<pre class="codeb" style="margin:0;font-size:12.5px"><code>${esc(t)}</code></pre>`;
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:920px;display:grid;gap:16px">
<div><h1>앱 받기</h1><p class="muted" style="margin:0">폰 · 태블릿 · PC · 터미널 어디서든 같은 계정으로 로그인해서 써요.</p></div>
${card("monitor","이 기기에 바로 설치 (홈 화면에 추가)",alone&&!DESK&&!IN_APK,`<span class="muted" style="font-size:13px">내려받지 않고 지금 보는 사이트를 앱처럼 설치해요. 어느 기기에서나 돼요.</span>${S.pwa?`<div><button class="btn pri sm" data-act="pwaInstall">${ic("download",14)} 지금 설치</button></div>`:""}<div style="display:grid;gap:4px;font-size:13px"><span><b>iPhone · iPad</b> Safari에서 공유 버튼 → ‘홈 화면에 추가’</span><span><b>Android</b> Chrome 메뉴(⋮) → ‘앱 설치’ 또는 ‘홈 화면에 추가’</span><span><b>PC · Mac</b> Chrome · Edge 주소창 오른쪽의 설치 아이콘</span></div>`)}
<div class="split" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">
${card("monitor","Windows",DESK&&DESK.platform==="win32",`<span class="muted" style="font-size:13px">작업 폴더 · 터미널 · 코드 저장까지 되는 LAGO Desktop이에요.</span><div class="row" style="gap:8px;flex-wrap:wrap">${dl("LAGO-Setup.exe","설치 파일")}${dl("LAGO-Portable.exe","포터블","설치 없이")}</div><span class="muted" style="font-size:12px">처음 실행할 때 파란 경고 창이 뜨면 ‘추가 정보 → 실행’을 눌러요.</span>`)}
${card("monitor","Mac",DESK&&DESK.platform==="darwin",`<span class="muted" style="font-size:13px">Windows와 같은 LAGO Desktop이에요.</span><div class="row" style="gap:8px;flex-wrap:wrap">${dl("LAGO-Mac-arm64.dmg","Apple Silicon","M1 이후")}${dl("LAGO-Mac-x64.dmg","Intel")}</div><span class="muted" style="font-size:12px">서명이 없는 앱이라 처음에는 앱을 우클릭 → ‘열기’로 열어요.</span>`)}
${card("monitor","Android (APK)",IN_APK,`<span class="muted" style="font-size:13px">폰 · 태블릿에 까는 앱이에요.</span><div class="row" style="gap:8px;flex-wrap:wrap">${dl("LAGO-Android.apk","APK 받기")}</div><span class="muted" style="font-size:12px">받은 파일을 열고 ‘출처를 알 수 없는 앱 설치’를 허용해요.</span>`)}
${card("term","터미널 (CLI)",false,`<span class="muted" style="font-size:13px">CMD · PowerShell · 맥 터미널에서 <b>lago</b> 명령으로 써요.</span><div class="row" style="gap:8px;flex-wrap:wrap">${dl("lago.exe","Windows용 lago.exe")}${dl("lago-cli.zip","lago-cli.zip","Node 18+")}</div>${cmd('lago login\nlago "독도는 어디에 있어?"\nlago code "app.py 버그 고쳐 줘"')}<span class="muted" style="font-size:12px">Google로 가입했다면 아래 연결 코드를 복사해 <b>lago login --code</b> 뒤에 붙여요. 이 코드는 비밀번호와 같으니 남에게 보여 주지 마세요.</span><div><button class="btn sm" data-act="cliCode">${ic("copy",14)} 연결 코드 복사</button></div>`)}
</div>
${card("monitor","크롬 확장 프로그램",false,`<span class="muted" style="font-size:13px">보고 있는 페이지를 요약하고, 드래그한 글을 설명하고, 옆 패널에서 바로 물어봐요.</span><div class="row" style="gap:8px;flex-wrap:wrap">${dl("lago-chrome.zip","lago-chrome.zip","Chrome · Edge")}</div><div style="display:grid;gap:3px;font-size:13px"><span>① 받은 zip의 압축을 풀어요</span><span>② 주소창에 아래 주소를 열고 <b>개발자 모드</b>를 켜요</span><span>③ <b>압축해제된 확장 프로그램을 로드합니다</b> → 압축 푼 폴더 선택</span></div>${cmd('chrome://extensions')}`)}
${card("trash","앱 지우기",false,`<div style="display:grid;gap:5px;font-size:13px"><span><b>Windows</b> 앱 안에서 메뉴 <b>LAGO → LAGO 지우기…</b> 를 누르면 ‘설치된 앱’이 바로 열려요. 포터블은 파일만 지우면 돼요.</span><span><b>Mac</b> 메뉴 <b>LAGO → LAGO 지우기…</b> 또는 Applications 폴더에서 휴지통으로 끌어다 놓기</span><span><b>Android</b> 앱 아이콘을 길게 눌러 ‘삭제’ (또는 설정 → 앱 → LAGO → 제거)</span><span><b>홈 화면에 추가한 앱</b> 아이콘을 길게 눌러 삭제 · PC는 앱 창 오른쪽 위 ⋮ → 제거</span><span><b>터미널</b></span></div>${cmd('lago uninstall')}<span class="muted" style="font-size:12px">로그인 정보 · 설치 파일 · PATH까지 한 번에 지워요. (zip으로 받았다면 uninstall.cmd / uninstall.sh 도 있어요)</span>`)}
</div></div>`);}
/* ---------- update + notice ---------- */
function vNum(v){return String(v||"").split(".").map(x=>parseInt(x,10)||0);}
function vNewer(a,b){const x=vNum(a),y=vNum(b);for(let i=0;i<3;i++){if((x[i]||0)!==(y[i]||0))return(x[i]||0)>(y[i]||0);}return false;}
function updNewApp(){return !!(DESK&&S.upd&&S.upd.latest&&vNewer(S.upd.latest,DESK.version||"0.0.0"));}
function noticeUnseen(){return !!(S.upd&&S.upd.notice&&store.get("lago_notice","")!==S.upd.notice.id);}
function updDot(){return noticeUnseen()||updNewApp();}
async function loadUpd(){if(!/^https?:$/.test(location.protocol))return;try{const r=await fetch("/api/update",{cache:"no-store"});if(!r.ok)return;S.upd=await r.json();}catch(e){return;}
 render();}
function noticeClose(){S.noticeOpen=false;if(S.upd&&S.upd.notice)store.set("lago_notice",S.upd.notice.id);render();}
function noticeModal(){const u=S.upd||{},n=u.notice||{};const cur=DESK?("v"+(DESK.version||"")):(IN_APK?"Android 앱":"웹");const nw=updNewApp();
const lines=String(n.body||"").split("\n").filter(Boolean).map(x=>`<p style="margin:0 0 6px">${esc(x)}</p>`).join("");
return `<div class="tempask" role="dialog" aria-label="업데이트 · 공지"><div class="noticebg" data-act="noticeX"></div><div class="card noticecard"><div class="row" style="gap:8px"><span class="noticeic">${ic("bell",18)}</span><b style="font-size:16px" class="grow">${esc(n.title||"공지")}</b><button class="iconbtn" data-act="noticeX" aria-label="닫기">${ic("x",16)}</button></div>
<div class="noticebody">${lines||'<p class="muted" style="margin:0">새 공지가 없어요.</p>'}</div>
<div class="noticever"><span>지금 쓰는 버전</span><b>${esc(cur)}</b>${u.latest?`<span>최신 앱</span><b>v${esc(u.latest)}</b>`:""}</div>
${nw?`<p class="noticenew">새 앱 v${esc(u.latest)} 이(가) 나왔어요. ${DESK?"‘지금 업데이트’를 누르면 설치 마법사로 안내해 드려요.":"받아서 설치하면 업데이트돼요."}</p>`:`<p class="muted" style="font-size:12.5px;margin:0">${DESK||IN_APK?"앱 화면은 다시 켜면 최신으로 바뀌어요.":"새로 고치면 최신 화면으로 바뀌어요."}</p>`}
<div class="row" style="gap:8px;justify-content:flex-end;flex-wrap:wrap"><button class="btn" data-act="noticeX">닫기</button><button class="btn ${nw?"":"pri"}" data-act="reloadNow">${ic("refresh",14)} 지금 새로 고침</button>${DESK?`<button class="btn ${nw?"pri":""}" data-act="upwGo">${ic("download",14)} ${nw?"지금 업데이트":"업데이트 확인"}</button>`:(IN_APK?"":`<button class="btn ${nw?"pri":""}" data-act="getNew">${ic("download",14)} 앱 받기</button>`)}</div></div></div>`;}
function updBtn(){return `<button class="updbtn" data-act="notice" title="업데이트 · 공지">${ic("bell",15)}<span class="grow">업데이트 · 공지</span>${updDot()?'<i class="newdot"></i>':""}</button>`;}
/* ---------- 앱 업데이트 마법사 (데스크톱 앱) ---------- */
const mbs=n=>((n||0)/1048576).toFixed(1)+" MB";
function upwOpen(info){S.upw={step:"info",info,pct:0,done:0,total:info.size||0};S.noticeOpen=false;render();}
async function upwCheck(manual){if(!DESK||!DESK.updCheck){if(manual)toast("이 앱에서는 업데이트를 확인할 수 없어요");return;}
 if(manual)toast("업데이트를 확인하는 중…");let i;try{i=await DESK.updCheck();}catch(e){i={error:e.message};}
 if(i.error){if(manual)toast("업데이트를 확인하지 못했어요: "+i.error);return;}
 if(i.newer)upwOpen(i);else if(manual)toast("최신 버전이에요 (v"+i.current+")");}
async function upwStart(){S.upw.step="down";S.upw.pct=0;S.upw.err="";render();let r;try{r=await DESK.updDownload();}catch(e){r={error:e.message};}
 if(!S.upw)return;if(r.error){S.upw.step="err";S.upw.err=r.error;}else{S.upw.step="ready";S.upw.res=r;}render();}
async function upwInstall(){let r;try{r=await DESK.updInstall();}catch(e){r={error:e.message};}if(!S.upw)return;if(r.error){S.upw.step="err";S.upw.err=r.error;}else{S.upw.step="done";S.upw.how=r.how;}render();}
function upwModal(){const u=S.upw;if(!u)return"";const i=u.info||{};const n=u.step==="info"?1:u.step==="down"?2:u.step==="err"?(u.done?2:1):3;
const steps=["새 버전","내려받기","설치"].map((t,k)=>`<span class="${k+1<n||u.step==="done"?"done":k+1===n?"cur":""}"><i>${k+1<n||u.step==="done"?ic("check",12):k+1}</i>${t}</span>`).join("<b></b>");
const mode=i.mode==="mac"?"내려받은 뒤 디스크 이미지가 열려요. LAGO를 Applications 폴더로 끌어다 놓아 주세요.":i.mode==="portable"?"내려받은 새 파일이 있는 폴더를 열어 드려요. 예전 파일은 지워도 돼요.":"내려받은 뒤 설치 마법사가 열려요. ‘다음’만 눌러 주세요.";
const notes=String(i.notes||"").split("\n").map(x=>x.replace(/^[#>*\-\s]+/,"").trim()).filter(Boolean).slice(0,6).map(x=>`<li>${esc(x)}</li>`).join("");
let body="",btns="";
if(u.step==="info"){body=`<h3>LAGO v${esc(i.latest)} 이(가) 나왔어요</h3><p class="muted" style="margin:0">지금 v${esc(i.current)} → v${esc(i.latest)} · ${mbs(i.size)}</p>${notes?`<ul class="upnotes">${notes}</ul>`:""}<p class="muted s" style="margin:0">${mode}</p>`;btns=`<button class="btn" data-act="upwSkip">나중에</button><button class="btn pri" data-act="upwStart">${ic("download",14)} 업데이트 시작</button>`;}
else if(u.step==="down"){body=`<h3>내려받는 중이에요</h3><div class="upbar"><i id="upwbar" style="width:${u.pct||0}%"></i></div><p class="muted" id="upwtxt" style="margin:0">${u.pct||0}% · ${mbs(u.done)} / ${mbs(u.total)}</p><p class="muted s" style="margin:0">창을 닫지 말고 잠깐만 기다려 주세요.</p>`;btns="";}
else if(u.step==="ready"){body=`<h3>내려받기가 끝났어요</h3><p class="muted" style="margin:0">${u.res&&u.res.verified?"파일이 올바른지 확인했어요.":"새 버전 파일이 준비됐어요."}</p><p style="margin:0">${i.mode==="setup"?"‘설치 마법사 열기’를 누르면 LAGO가 잠시 닫히고 마법사가 열려요. 마법사에서 <b>다음</b>을 눌러 설치를 마치면 새 LAGO가 켜져요.":i.mode==="mac"?"‘열기’를 누르면 디스크 이미지가 열려요. LAGO를 Applications 폴더로 끌어다 놓으면 끝이에요.":"‘폴더 열기’를 누르면 새 파일이 있는 폴더가 열려요."}</p>`;btns=`<button class="btn" data-act="upwSkip">나중에</button><button class="btn pri" data-act="upwInstall">${i.mode==="setup"?"설치 마법사 열기":i.mode==="mac"?"열기":"폴더 열기"}</button>`;}
else if(u.step==="done"){body=`<h3>${u.how==="wizard"?"설치 마법사를 열었어요":"열었어요"}</h3><p style="margin:0">${u.how==="wizard"?"LAGO가 곧 닫혀요. 마법사에서 <b>다음</b>을 눌러 설치를 마쳐 주세요.":u.how==="dmg"?"열린 창에서 LAGO를 Applications 폴더로 끌어다 놓아 주세요. 그 뒤 LAGO를 다시 켜면 새 버전이에요.":"새 파일을 열어서 쓰시면 돼요. 예전 파일은 지워도 돼요."}</p>`;btns=`<button class="btn" data-act="upwClose">닫기</button>`;}
else{body=`<h3>업데이트하지 못했어요</h3><p class="err-t" style="margin:0">${esc(u.err||"알 수 없는 오류")}</p><p class="muted s" style="margin:0">인터넷을 확인하고 다시 시도하거나, 받는 곳에서 직접 받아 설치할 수 있어요.</p>`;btns=`<button class="btn" data-act="upwClose">닫기</button><button class="btn" data-act="upwManual">받는 곳 열기</button><button class="btn pri" data-act="upwStart">다시 시도</button>`;}
return `<div class="tempask" role="dialog" aria-label="업데이트 마법사"><div class="noticebg"></div><div class="card noticecard upw"><div class="upsteps">${steps}</div>${body}${btns?`<div class="row" style="gap:8px;justify-content:flex-end;flex-wrap:wrap">${btns}</div>`:""}</div></div>`;}
if(DESK&&DESK.onUpd)DESK.onUpd((k,x)=>{if(k==="avail"){if(store.get("lago_upd_skip","")!==x.latest&&!S.upw)upwOpen(x);}else if(k==="open")upwCheck(true);else if(k==="progress"&&S.upw&&S.upw.step==="down"){S.upw.pct=x.pct;S.upw.done=x.done;S.upw.total=x.total;const b=document.getElementById("upwbar"),t=document.getElementById("upwtxt");if(b)b.style.width=x.pct+"%";if(t)t.textContent=x.pct+"% · "+mbs(x.done)+" / "+mbs(x.total);}});
/* ---------- boot ---------- */
initSet();applySet();S.theme=store.get("lago_theme","light");S.lang=store.get("lago_lang","ko");applyTheme();document.documentElement.setAttribute("lang",S.lang);try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{if(S.theme==="system")applyTheme();});}catch(e){}
S.sideOff=store.get("lago_sideoff",false)===true;{const _r=render;render=function(){_r();fixPops();trUI();};}
/* 서버가 정한 정지/요금제/한도를 불러와요. 5분마다, 그리고 탭으로 돌아올 때 다시 확인해요. */
async function meCheck(){if(!S.fb||!S.user||!S.user.uid||!S.api)return;
try{const tk=await S.fb.auth.currentUser.getIdToken();const r=await fetch("/api/me",{headers:{authorization:"Bearer "+tk},cache:"no-store"});if(!r.ok)return;const m=await r.json();
const before=JSON.stringify([S.banned,S.user.plan,S.user.dailyLimit]);
S.banned=m.banned?{until:m.until||0,reason:m.reason||""}:null;S.isAdmin=!!m.admin;S.user.plan=m.plan||"Free";S.user.dailyLimit=m.dailyLimit||0;syncTasks();
if(before!==JSON.stringify([S.banned,S.user.plan,S.user.dailyLimit]))render();}
catch(e){if(e&&/user-disabled|user-token-expired/.test(e.code||"")){S.fb.auth.signOut();toast("이용이 정지된 계정이에요");}}}
setInterval(()=>document.querySelectorAll("[data-think]").forEach(e=>{const t0=+e.dataset.t0||(e.dataset.t0=Date.now(),+e.dataset.t0),sec=Math.floor((Date.now()-t0)/1000);e.querySelector(".tsec").textContent=sec>=2?sec+"초":"";}),700);
setInterval(meCheck,300000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)meCheck();});
function vBanned(){const b=S.banned||{};let left="";if(b.until){const m=Math.max(1,Math.ceil((b.until-Date.now())/60000));left=m>=60?Math.floor(m/60)+"시간 "+(m%60)+"분":m+"분";}
return `<main style="min-height:100dvh;display:grid;place-items:center;padding:24px;background:#F6F8FC"><section class="card" style="max-width:440px;width:100%;text-align:center;display:grid;gap:12px;padding:28px">${WM(22)}<h1 style="font-size:20px;margin:6px 0 0">이용이 정지된 계정이에요</h1><p class="muted" style="margin:0">${b.until?left+" 뒤에 다시 쓸 수 있어요.":"이 계정은 지금 쓸 수 없어요."}${b.reason?`<br>사유: ${esc(b.reason)}`:""}</p><p class="muted" style="font-size:12.5px;margin:0">잘못 정지됐다고 생각하면 관리자에게 문의해 주세요.</p><button class="btn" data-act="logout">로그아웃</button></section></main>`;}
/* admin.js(별도 파일)가 쓰는 것들을 바깥으로 내보내요 */
Object.assign(window,{S,shell,topbar,esc,toast,go,route,WM});window.render=()=>render();
if(DESK&&DESK.current)DESK.current().then(async r=>{if(r&&r.name){WF.name=r.name;WF.path=r.path;try{WF.files=await DESK.list();wfSort();}catch(e){}render();}}).catch(()=>{});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();S.pwa=e;if(route()==="apps")render();});
loadUser();S.booting=!S.user&&/^https?:$/.test(location.protocol)&&!!store.get("lago_fbhint",0);render();loadUpd();loadApi().finally(()=>{if(!(S.api&&S.api.firebase&&S.api.firebase.apiKey))bootDone();});setTimeout(bootDone,8000);
})();
