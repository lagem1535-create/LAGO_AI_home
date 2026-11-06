(function(){
"use strict";
/* ---------- tiny helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const P={plus:'<path d="M12 5v14M5 12h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',custom:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',msg:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',code:'<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',term:'<path d="m4 17 6-6-6-6M12 19h8"/>',clip:'<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',down:'<path d="m6 9 6 6 6-6"/>',up:'<path d="M12 19V5M5 12l7-7 7 7"/>',check:'<path d="M20 6 9 17l-5-5"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',drop:'<path d="M12 2.7s6 6.3 6 11a6 6 0 0 1-12 0c0-4.7 6-11 6-11z"/>',waves:'<path d="M2 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',brain:'<circle cx="12" cy="12" r="9"/><path d="M8 12c1.5-2 2.5-2 4 0s2.5 2 4 0"/>',bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',copy:'<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',thumb:'<path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',ext:'<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',menu:'<path d="M4 7h16M4 12h10M4 17h16"/>',ghost:'<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/><path d="m14.5 8.5 1 1-5 5H9.5v-1z"/>',sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',back:'<path d="m15 18-6-6 6-6"/>',file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',chart:'<path d="M3 3v18h18M7 15v3M12 10v8M17 6v12"/>',card:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',id:'<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M13 10h5M13 14h3"/>',logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',refresh:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',monitor:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',phone:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',bug:'<path d="M8 6a4 4 0 0 1 8 0v1H8zM6 9h12v5a6 6 0 0 1-12 0zM3 13h3M18 13h3M12 9v11"/>',book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/>',flask:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/>',pen:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',news:'<path d="M4 4h13v16H6a2 2 0 0 1-2-2zM17 8h3v10a2 2 0 0 1-2 2"/><path d="M8 8h5M8 12h5M8 16h3"/>',scale:'<path d="M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/>',link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',compass:'<circle cx="12" cy="12" r="10"/><path d="m16 8-2 6-6 2 2-6z"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',bot:'<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9 17h6"/>',swap:'<path d="M17 3l4 4-4 4M21 7H9M7 21l-4-4 4-4M3 17h12"/>',dots:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',eyeoff:'<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.8 8.4 2 12 2 12s4 7 10 7a9.6 9.6 0 0 0 4.4-1.1"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',pin:'<path d="M12 17v5M9 10.8V4h6v6.8l3 3.2H6z"/>',share:'<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',gauge:'<path d="M12 14l4-4M3.3 17a9 9 0 1 1 17.4 0"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>',crown:'<path d="M3 7l4 4 5-6 5 6 4-4-2 11H5z"/>',upc:'<circle cx="12" cy="12" r="9"/><path d="m8 12 4-4 4 4M12 8v8"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',plug:'<path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0zM12 17v5"/>',right:'<path d="m9 6 6 6-6 6"/>',play:'<path d="M7 4l13 8-13 8z"/>',panel:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',download:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',star:'<path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" fill="currentColor" stroke="none"/>'};
const ic=(k,s=18)=>`<svg class="ic" viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${P[k]||""}</svg>`;
const SYM=(h=26)=>`<svg class="sym" viewBox="0 0 100 50" height="${h}" width="${h*2}" aria-hidden="true"><path d="M0 25A25 25 0 0 0 50 25Z" fill="url(#gL)"/><path d="M50 25A25 25 0 0 1 100 25Z" fill="url(#gR)"/></svg>`;
const MARK=(s=32,cls="")=>`<span class="mark ${cls}" style="width:${s}px;height:${s}px;border-radius:${Math.round(s*.3)}px" aria-hidden="true"><svg viewBox="0 0 100 50" width="${Math.round(s*.66)}" height="${Math.round(s*.33)}"><path d="M2 25A23 23 0 0 0 48 25Z" fill="#fff" fill-opacity=".72"/><path d="M52 25A23 23 0 0 1 98 25Z" fill="#fff"/></svg></span>`;
const WM=(h=20,color="currentColor")=>`<svg class="wm" viewBox="0 0 180 56" height="${h}" width="${Math.round(h*180/56)}" role="img" aria-label="LAGO" style="color:${color}"><g fill="none" stroke="currentColor" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6V50H36"/><path d="M42 50L60 6L78 50"/><path d="M124.9 13.9A22 22 0 1 0 130 28H104"/><circle cx="150" cy="28" r="22"/></g></svg>`;
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
let toastT;function toast(m){const t=$("#toast");const bad=/못|않아요|실패|없어요|안 돼|확인해 주세요|거절/.test(m);t.innerHTML=`<i class="${bad?"bad":""}">${ic(bad?"info":"check",13)}</i><span>${esc(m)}</span>`;t.hidden=false;t.style.animation="none";void t.offsetWidth;t.style.animation="";clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2800);}
async function hash(s){try{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("lago:"+s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}catch(e){return "plain:"+s.length}}

/* ---------- data ---------- */
const TALK_MODES=[{id:"Fonte",lab:"FACT",d:"위키 · 뉴스 · 웹에서 찾아 사실만 출처와 함께",ic:"drop",c:"#2BA3B8"},{id:"Torrente",lab:"빠른 생각",d:"짧게 생각하고 빠르게 답해요",ic:"waves",c:"#1B3E9E"},{id:"Mare",lab:"THINK",d:"깊게 생각하고 단계별로 추론",ic:"brain",c:"#4A5FA8"}];
const modeOf=id=>[...TALK_MODES,...CODE_MODES].find(m=>m.id===id)||TALK_MODES[0];
const LIMITS={Free:80000,Pro:600000,Max:4000000};
const CODE_MODES=[{id:"Code Spruzzo",lab:"빠른 CODE",d:"설명 없이 바로 코드",ic:"bolt",c:"#1F8A4C"},{id:"Code Corrente",lab:"CODE",d:"설계부터 생각하고 더 나은 코드",ic:"code",c:"#1F8A4C"}];
const SEED_PROJECTS=[{id:"p1",name:"LAGO 개발 메모",desc:"학습 일정, 데이터 정리, 서버 후보 비교",n:24,u:"2시간 전",ins:"답은 짧게, 일정과 비용은 표로 정리해 줘. 캐글 GPU는 주 30시간이라는 걸 항상 고려해 줘.",files:["할일.md","data.md","LAGO_AI_계획.md"]},{id:"p2",name:"법령 공부",desc:"근로기준법 · 주택임대차보호법 조문 찾아 보기",n:11,u:"어제",ins:"조문 번호를 꼭 같이 알려 줘.",files:[]},{id:"p3",name:"제주 여행",desc:"3박 4일 일정과 동선, 날씨 확인",n:7,u:"3일 전",ins:"",files:[]},{id:"p4",name:"수학 문제 풀이",desc:"확률과 통계 단원 복습, 틀린 문제 다시 풀기",n:15,u:"4일 전",ins:"",files:[]}];
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
const S={pinTools:[],conn:false,services:{},customMcp:[],flyout:false,flyTool:"translate",kidReqs:[],tasks:[],sideOff:false,user:null,area:"talk",mode:"Fonte",pinned:["p1"],study:false,timeReq:null,extra:0,ptab:"general",cmode:"Code Corrente",think:1,web:0,menu:false,drawer:false,chats:[],cur:null,projects:SEED_PROJECTS.map(p=>({...p})),curProject:null,temp:false,learn:true,learnImg:true,confirm:null,preview:false,todos:[{t:"장보기",d:true},{t:"LAGO 데이터셋 정리",d:false},{t:"운동 30분",d:false}],kid:{sent:false,email:""},myAgents:[],favs:[],agentTab:"lago",agentCat:"전체",curAgent:null,editAgent:null,acct:false,goccia:false,gview:null,verify:"card",pendingVerify:null};
const PKEYS=["pinTools","services","customMcp","kidReqs","extra","limit","night","kThink","kCode","kStudy","kBreak","tasks"];const pk=()=>Object.fromEntries(PKEYS.map(k=>[k,S[k]]));
function syncReq(){const r=(S.kidReqs||[])[0];S.timeReq=r?(r.status==='pending'?'wait':r.status):null;}
function loadUser(){const s=store.get("lago_session",null);if(!s)return;S.user=s;const d=store.get("lago_data_"+s.email,null);if(d){PKEYS.forEach(k=>{if(d[k]!=null)S[k]=d[k];});syncReq();S.chats=d.chats||[];S.learn=d.learn!==false;S.learnImg=d.learnImg!==false;if(d.mode&&TALK_MODES.some(m=>m.id===d.mode))S.mode=d.mode;if(d.pinned)S.pinned=d.pinned;S.myAgents=d.myAgents||[];S.favs=d.favs||[];if(d.think!=null)S.think=d.think;if(d.web!=null)S.web=d.web;}}
function save(){if(!S.user)return;if(S.user.uid){fbSave();return;}store.set("lago_data_"+S.user.email,{myAgents:S.myAgents,favs:S.favs,pinned:S.pinned,chats:S.chats.filter(c=>!c.temp&&!c.kid),learn:S.learn,learnImg:S.learnImg,mode:S.mode,think:S.think,web:S.web,...pk()});}

const me=()=>S.goccia?{name:"지우",plan:"Goccia",email:"kid"}:S.user;
const allAgents=()=>[...S.myAgents,...OFFICIAL];
const agentById=id=>allAgents().find(a=>a.id===id);
/* ---------- router ---------- */
const ROUTES=["tool-translate","tool-extract","tool-summary","services","tasks","usage","agents","agent-new","agent","login","join","verify","kid","home","chat","projects","project","code","code-chat","code-folder","plans","prefs","terms","guardian","admin","admin-user"];
const PUBLIC=["login","join","verify","kid","terms"];
const PATHMODE=(()=>{const m=document.querySelector('meta[name="lago-router"]');return !!m&&m.content==="path"&&/^https?:$/.test(location.protocol)&&!!history.pushState;})();
/* 주소: 서버에서는 /chat, /chat/<대화번호>, /admin/user 처럼 실제 경로를 써요. 미리보기(한 파일)에서는 #chat 처럼 #을 써요. */
function urlFor(r){if(!PATHMODE)return"#"+r;if(r==="home")return"/";if((r==="chat"||r==="code-chat")&&S.cur)return"/"+r+"/"+encodeURIComponent(S.cur);if(r==="admin-user")return"/admin/user";return"/"+r;}
function route(){
if(!PATHMODE){const h=location.hash.slice(1);return ROUTES.includes(h)?h:(S.user?"home":"login");}
const seg=location.pathname.replace(/\/+$/,"").split("/").slice(1).map(decodeURIComponent);
let r=seg[0]||"home";if(r==="admin"&&seg[1]==="user")r="admin-user";
if(!ROUTES.includes(r))return S.user?"home":"login";
if((r==="chat"||r==="code-chat")&&seg[1])S.cur=seg[1];
return r;}
function go(r,replace){if(!PATHMODE){if(location.hash==="#"+r)render();else location.hash=r;return;}
const u=urlFor(r);if(location.pathname===u){render();return;}
history[replace?"replaceState":"pushState"](null,"",u);onNav();}
document.addEventListener("mouseover",e=>{const it=e.target.closest&&e.target.closest(".flyitem");if(!it||!S.flyout||S.flyTool===it.dataset.tool)return;S.flyTool=it.dataset.tool;const t=TOOLS.find(x=>x.id===S.flyTool);document.querySelectorAll(".flyitem").forEach(b=>b.classList.toggle("on",b===it));const pv=$(".flyprev");if(pv&&t)pv.innerHTML=flyPrev(t);});
function onNav(){S.menu=false;S.drawer=false;S.acct=false;S.cmenu=null;S.share=null;S.renameChat=null;S.delChat=null;S.flyout=false;S.tempAsk=false;S.confirm=null;render();}
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
<button type="button" class="btn sm" data-act="demo" style="align-self:center">예시 계정으로 둘러보기</button>
<p class="fine">로그인하면 <button type="button" class="linkbtn" data-go="terms" style="font-size:12px">이용약관</button>에 동의하게 돼요. 이 미리보기의 계정은 이 브라우저에만 저장돼요.</p>
</form><small class="muted" style="font-size:12px">© 2026 LAGO</small></section></main>`;}
function vJoin(){const y=new Date().getFullYear();let ys="";for(let i=y;i>=y-100;i--)ys+=`<option>${i}</option>`;let ms="";for(let i=1;i<=12;i++)ms+=`<option>${i}</option>`;let ds="";for(let i=1;i<=31;i++)ds+=`<option>${i}</option>`;
return `<main class="auth">${brandPanel()}<section class="formside"><form class="form" id="joinForm" novalidate>
<h2>LAGO 계정 만들기</h2><p class="muted" style="margin:0 0 4px">1분이면 끝나요. 웹 검색은 Free에서도 무제한이에요.</p>
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
<button type="button" class="linkbtn" data-act="asKid" style="align-self:center;font-size:12px;color:var(--mut)">아이 화면 모양 보기 (예시)</button>
</form></section></main>`;}
function googleG(){return `<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.1C12.5 13.5 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.6 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>`;}

/* ---------- shell ---------- */
const TOOLS=[
{id:"translate",route:"tool-translate",lab:"문서 번역",ic:"scale",c:"#1B3E9E",d:"문서의 모양은 그대로 두고 원하는 언어로 번역해요.",steps:["글을 붙여 넣거나 파일을 올려요 (PDF · DOCX · PPTX · XLSX)","번역할 언어를 고르고 번역을 시작해요","결과에서 번역본과 원문을 나란히 비교해요"],cta:"문서 번역 열기"},
{id:"extract",route:"tool-extract",lab:"텍스트 추출",ic:"file",c:"#2BA3B8",d:"이미지나 PDF 속 글자를 뽑아서 복사할 수 있게 해요.",steps:["이미지나 PDF 파일을 올려요","글자를 뽑을 부분을 정해요","뽑힌 글자를 복사하거나 대화로 보내요"],cta:"텍스트 추출 열기"},
{id:"summary",route:"tool-summary",lab:"문서 요약",ic:"news",c:"#4A5FA8",d:"긴 글을 핵심만 짧게 정리해요. 근거 문장도 함께 보여 줘요.",steps:["요약할 글을 붙여 넣거나 파일을 올려요","길이를 골라요 (3줄 · 5줄 · 한 문단)","핵심 문장과 근거 위치를 확인해요"],cta:"문서 요약 열기"}];
const SERVICES=[["gcal","Google Calendar","일정을 보고, 새 일정을 만들어요.","로그인 필요","#1A73E8"],["gmail","Gmail","메일을 찾아 읽고, 답장 초안을 써요.","로그인 필요","#D93025"],["gdrive","Google Drive","드라이브의 파일을 찾아 읽어요.","로그인 필요","#188038"],["notion","Notion","Notion 페이지를 읽고 정리해요.","로그인 필요","#1F2937"],["m365mail","M365 메일 · 일정","승인 없이 바로 메일, 일정, 팀즈 채팅을 써요.","로그인 필요","#5B5FC7"],["m365files","M365 파일 · 회의실","관리자 승인 뒤에 원드라이브 파일과 회의실을 써요.","관리자 승인","#5B5FC7"]];
const connCount=()=>Object.values(S.services||{}).filter(Boolean).length+(S.customMcp||[]).length;
const cust=()=>(S.customMcp||[]).map(x=>typeof x==="string"?{name:x.replace(/^https:\/\//,"").split("/")[0],url:x}:x);
const pendingReq=()=>(S.kidReqs||[]).filter(x=>x.status==="pending").length;
function flyPrev(t){const pin=S.pinTools.includes(t.id);return `<div class="flyart" style="--c:${t.c}">${ic(t.ic,38)}</div><b>${t.lab}</b><p>${t.d}</p><ol>${t.steps.map((x,i)=>`<li><i>${i+1}</i><span>${x}</span></li>`).join("")}</ol><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" data-go="${t.route}">${t.cta}</button><button class="btn sm" data-pintool="${t.id}">${ic("pin",14)} ${pin?"사이드바에서 빼기":"사이드바에 고정"}</button></div>`;}
function flyout(){const cur=TOOLS.find(t=>t.id===S.flyTool)||TOOLS[0];
return `<div class="flywrap" data-act="flyout"></div><div class="flyout ${S.sideOff?"atrail":""}" role="dialog" aria-label="AI 도구"><div class="flylist">${TOOLS.map(t=>`<button class="flyitem ${t.id===cur.id?"on":""}" data-tool="${t.id}" data-go="${t.route}"><span class="fi">${ic(t.ic,19)}</span><span class="grow"><b>${t.lab}</b><small>${t.d}</small></span>${S.pinTools.includes(t.id)?ic("pin",14):""}</button>`).join("")}</div><div class="flyprev">${flyPrev(cur)}</div></div>`;}
function railBar(){const code=S.area==="code",kid=S.goccia,r=route();const b=(k,act,t,on)=>`<button class="railbtn ${on?"on":""}" ${act} aria-label="${t}" title="${t}">${ic(k,20)}</button>`;
return `<nav class="rail" aria-label="빠른 메뉴">${b("panel",'data-act="sideToggle"',"사이드바 열기 (Ctrl B)")}<div class="railsep"></div>${b("pen",'data-act="new"',"새 대화 (Ctrl K)")}${b("search",'data-act="search"',"검색")}${code?b("folder",'data-go="code-folder"',"작업 폴더",r==="code-folder")+b("term",'data-act="term"',"터미널"):kid?b("bot",'data-go="agents"',"에이전트",r==="agents"):b("folder",'data-go="projects"',"프로젝트",r==="projects"||r==="project")+b("bot",'data-go="agents"',"에이전트",r==="agents")+b("clock",'data-go="tasks"',"예약 작업",r==="tasks")+b("plug",'data-go="services"',"서비스 연결",r==="services")+b("grid",'data-act="flyout"',"AI 도구",S.flyout)+S.pinTools.map(id=>{const t=TOOLS.find(x=>x.id===id);return t?b(t.ic,`data-go="${t.route}"`,t.lab,r===t.route):""}).join("")}<span class="grow"></span><button class="railbtn av" data-act="acct" aria-label="계정 메뉴" ${kid?'style="background:var(--k);color:#fff"':""}>${esc(me().name.slice(0,1))}${!kid&&pendingReq()?'<i class="dot"></i>':""}</button></nav>`;}
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
<div class="sect">${code?"코드":"메뉴"}</div>
${code?nav("folder","작업 폴더",r==="code-folder",'data-go="code-folder"','<span class="cnt">1</span>')+nav("search","검색",false,'data-act="search"')+nav("term","터미널",false,'data-act="term"')
:(kid?nav("bot","에이전트",["agents","agent","agent-new"].includes(r),'data-go="agents"','<span class="cnt">'+(OFFICIAL.length+S.myAgents.length)+'</span>')+nav("search","검색",false,'data-act="search"','<kbd>/</kbd>'):nav("search","검색",false,'data-act="search"','<kbd>/</kbd>')+nav("folder","프로젝트",r==="projects"||r==="project",'data-go="projects"','<span class="cnt">'+S.projects.length+'</span>')+nav("bot","에이전트",["agents","agent","agent-new"].includes(r),'data-go="agents"','<span class="cnt">'+(OFFICIAL.length+S.myAgents.length)+'</span>')+nav("clock","예약 작업",r==="tasks",'data-go="tasks"','<span class="cnt">'+S.tasks.length+'</span>')+nav("plug","서비스 연결",r==="services",'data-go="services"','<span class="cnt">'+connCount()+'</span>')+`<button class="nav ${S.flyout?"on":""}" data-act="flyout" aria-expanded="${S.flyout}" aria-haspopup="dialog">${ic("grid",18)}<span class="grow">AI 도구</span><span class="cnt">${TOOLS.length}</span>${ic("right",14)}</button>`+S.pinTools.map(id=>{const t=TOOLS.find(x=>x.id===id);return t?nav(t.ic,t.lab,r===t.route,`data-go="${t.route}"`):"";}).join(""))}
${temps.length?`<div class="sect row" style="gap:6px">${ic("eyeoff",13)} 임시 대화</div>${temps.map(c=>`<button class="item ${S.cur===c.id?"on":""}" data-chat="${c.id}"><i>${esc(c.title)}</i></button>`).join("")}`:""}
<div class="sect">최근 ${code?"작업":"대화"}</div>
<div class="recent">${pinProj.map(p=>`<div class="itemrow ${r==="project"&&S.curProject===p.id?"on":""}"><button class="item" data-project="${p.id}">${ic("folder",14)} ${esc(p.name)}</button><button class="more" data-unpin="${p.id}" aria-label="고정 해제" title="고정 해제">${ic("pin",14)}</button></div>`).join("")}${pinnedChats.map(row).join("")}${rest.slice(0,12).map(row).join("")}${!list.length&&!pinProj.length?`<p class="empty">아직 ${code?"코드 작업이":"대화가"} 없어요.<br>${code?"새 코드 작업":"새 대화"}로 시작해 보세요.</p>`:""}</div>
<div class="sidefoot">
<div class="prof"><span class="av" ${kid?'style="background:var(--k);color:#fff"':""}>${esc(me().name.slice(0,1))}${!kid&&pendingReq()?'<i class="dot"></i>':""}</span><span class="grow"><b>${esc(me().name)}</b><small>${kid?"Goccia · 보호자와 연결됨":esc(S.user.plan||"Free")}</small></span><button class="iconbtn" data-act="acct" aria-expanded="${S.acct}" aria-label="계정 메뉴">${ic("dots",18)}</button></div></div></aside>${railBar()}${S.acct?acctMenu():""}${S.flyout?flyout():""}`;}
function usagePct(){return Math.min(99,12+S.chats.length*4);}
function chatMenu(c){return `<div class="cmenu" role="menu"><button class="opt" data-act="cRename" data-id="${c.id}">${ic("pen",15)} 이름 바꾸기</button><button class="opt" data-act="cPin" data-id="${c.id}">${ic("pin",15)} ${c.pin?"고정 해제":"고정하기"}</button>${S.goccia?"":`<button class="opt" data-act="share" data-id="${c.id}">${ic("share",15)} 공유</button>`}<button class="opt danger-t" data-act="cDel" data-id="${c.id}">${ic("trash",15)} 삭제</button></div>`;}
function delConfirm(c){return `<div class="confirm" style="margin:4px 4px 8px">"${esc(c.title)}"을(를) 지울까요?<div class="row"><button class="btn sm danger" data-act="cDelYes" data-id="${c.id}">지우기</button><button class="btn sm" data-act="cDelNo">취소</button></div></div>`;}
function acctMenu(){const kid=S.goccia;const plan=S.user.plan||"Free";const it=(k,t,attr,right="")=>`<button class="opt" ${attr}>${ic(k,17)}<span class="grow">${t}</span>${right}</button>`;
return `<div class="acctwrap" data-act="acct"></div><div class="acct" role="menu" aria-label="계정 메뉴"><div class="acchead">${esc(kid?"지우 · LAGO Goccia":S.user.email)}</div>
${kid?it("swap",esc(S.user.name)+" 계정으로 돌아가기",'data-act="asMe"')+it("file","이용약관",'data-go="terms"'):
it("sliders","설정",'data-go="prefs"','<span class="kb">Ctrl+,</span>')+it("gauge","사용량",'data-go="usage"')+(isAdmin()?it("shield","관리자",'data-go="admin"'):"")+it("globe","언어",'data-act="lang"','<span class="kb">한국어</span>')+it("help","도움 받기",'data-act="help"')+"<hr>"+
(plan==="Max"?it("crown","플랜 관리",'data-go="plans"','<span class="maxtag">MAX</span>'):it("upc","플랜 업그레이드",'data-go="plans"'))+it("download","앱 및 확장 프로그램 다운로드",'data-act="dl"')+it("info","더 알아보기",'data-act="more"',ic("right",14))+"<hr>"+
it("shield","보호자 화면",'data-go="guardian"',pendingReq()?'<span class="maxtag" style="background:#FDE8E4;color:#C0392B;border-color:transparent">요청 '+pendingReq()+'</span>':'<span class="kb">지우</span>')+it("file","이용약관",'data-go="terms"')}
<hr>${it("logout","로그아웃",'data-act="logout"')}</div>`;}
function tempBar(){const c=curChat();const inTemp=c&&c.temp&&(route()==="chat"||route()==="code-chat");const n=S.chats.filter(x=>x.temp).length;const ttl=["창을 닫으면","1시간 뒤","24시간 뒤"][S.ttl||0];
let left="";if(inTemp&&S.ttl){const ms=c.created+(S.ttl===1?36e5:864e5)-Date.now();left=` · 남은 시간 ${Math.max(0,Math.floor(ms/6e4))}분`;}
return `<div class="tempbar"><span class="row" style="gap:6px">${ic("eyeoff",15)} <b>임시 대화</b></span><span class="tb-txt">기록 · 학습 · 사용자 지정에 남지 않아요 · ${ttl} 지워져요${left}</span><span class="grow"></span>${inTemp?`<button data-act="tempCopy">${ic("copy",13)}<span class="tb-l">전체 복사</span></button><button data-act="tempSave">${ic("check",13)}<span class="tb-l">일반 대화로 저장</span></button>`:""}<button data-act="tempEnd">${ic("x",13)}<span class="tb-l">끝내기</span></button></div>${S.tempAsk?`<div class="tempask" role="alertdialog" aria-label="임시 대화 끝내기"><div class="card" style="display:grid;gap:12px;max-width:380px;width:100%"><b style="font-size:16px">임시 대화를 끝낼까요?</b><span class="muted" style="font-size:13px">끝내면 이 창의 임시 대화 ${n}개가 바로 지워져요. 남기고 싶은 대화는 일반 대화로 저장하세요.</span><div style="display:grid;gap:8px"><button class="btn pri" data-act="tempEndYes">지우고 홈으로 가기</button>${inTemp?`<button class="btn" data-act="tempSaveEnd">이 대화는 저장하고 끝내기</button>`:""}<button class="btn" data-act="tempAskNo">계속 임시 대화하기</button></div></div></div>`:""}`;}
function topbar(title,extra=""){const plan=S.user?S.user.plan||"Free":"Free";
return `<header class="top"><button class="iconbtn menu-btn" data-act="drawer" aria-label="메뉴 열기">${ic("menu",22)}</button><span class="mwm">${WM(16)}</span>${S.area==="code"?`<span class="codebadge">${ic("code",14)} 코드</span>`:""}${title}<span class="grow"></span>${extra}
<button class="pill" data-act="new" title="새 대화 (Ctrl K)">${ic("pen",15)}<span class="pl">새 대화</span></button>
${S.goccia?"":plan==="Max"?`<span class="maxtag big" title="Max 요금제 이용 중">${ic("crown",14)} MAX</span>`:`<button class="upbtn hide-m" data-go="plans"><svg class="spark" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" fill="currentColor"/></svg>${plan==="Pro"?"Max로":"업그레이드"}</button>`}</header>`;}
function shell(inner){const r=route();const tempOn=S.temp&&["home","chat","code","code-chat","agent"].includes(r);
if(S.temp&&S.ttl){const lim=S.ttl===1?36e5:864e5;S.chats=S.chats.filter(c=>!c.temp||Date.now()-c.created<lim);}
return `<div class="shell ${S.sideOff?"sideoff":""} ${S.area==="code"?"code":""} ${S.goccia?"goccia":""} ${S.drawer?"drawer":""}">${sidebar()}<div class="overlay" data-act="drawer"></div><div class="main ${tempOn?"temp":""}">${tempOn?tempBar():""}${inner}</div></div>`;}
function discText(code){return S.goccia?`${ic("info",13)} 보호자와 연결된 계정이에요 · 오늘 ${48+S.extra}분 남았어요`:code?"실행 전에 명령을 꼭 확인해 주세요.":"LAGO는 실수할 수 있어요. 중요한 내용은 출처를 확인해 주세요.";}
/* ---------- composer ---------- */
function composer(ph){const code=S.area==="code";const modes=code?CODE_MODES:TALK_MODES;const cur=code?S.cmode:S.mode;const cm=modeOf(cur);
const pop=S.menu?`<div class="pop" role="dialog" aria-label="모델 고르기"><div class="hint" style="padding:6px 10px">모델</div>${modes.map(m=>`<button class="opt ${m.id===cur?"on":""}" data-mode="${m.id}"><span class="mi" style="background:${m.c}22;color:${m.c}">${ic(m.ic,18)}</span><span class="grow"><b>${m.lab}</b><span class="ver">${m.id} 1.0</span><small>${m.d}</small></span>${m.id===cur?`<span style="color:${m.c}">${ic("check",18)}</span>`:""}</button>`).join("")}
${(code||cur==="Mare")?`<div style="height:1px;background:#EEF2F8;margin:6px 4px"></div><div class="popsec"><div class="row">${ic("brain",15)} 생각 강도</div><div class="seg">${["낮게","보통","깊게"].map((t,i)=>`<button aria-pressed="${S.think===i}" data-think="${i}">${t}</button>`).join("")}</div></div>`:""}</div>`:"";
const connPop=S.conn?`<div class="pop connpop" role="dialog" aria-label="커넥터"><div class="hint" style="padding:6px 10px">연결된 서비스 (MCP)</div>${(()=>{const on=[...SERVICES.filter(x=>S.services[x[0]]).map(x=>[x[1],x[4]]),...cust().map(x=>[x.name,"#334"])];return on.length?on.map(x=>`<div class="opt" style="cursor:default"><span class="svcico sm" style="background:${x[1]}">${esc(x[0].slice(0,1))}</span><span class="grow"><b>${esc(x[0])}</b></span><span style="color:var(--g)">${ic("check",16)}</span></div>`).join(""):`<p class="muted" style="margin:0;padding:6px 10px 10px;font-size:13px">아직 연결한 서비스가 없어요.</p>`;})()}<div style="height:1px;background:#EEF2F8;margin:6px 4px"></div><button type="button" class="opt" data-go="services">${ic("plug",17)}<span class="grow"><b>서비스 연결 열기</b></span>${ic("right",14)}</button></div>`:"";
return `<form class="composer" id="composer">${pop}${connPop}<textarea id="q" rows="1" placeholder="${esc(ph)}" aria-label="메시지"></textarea>
<div class="tools"><button type="button" class="round" data-act="attach" aria-label="파일 첨부">${ic("clip",17)}</button>
${code?`<button type="button" class="chip plain" data-go="code-folder">${ic("folder",15)}<span class="wl">lago_app</span></button><button type="button" class="chip" data-act="term">${ic("term",15)}<span class="wl">터미널 모드</span></button>`:""}
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
${S.goccia?kidHome():""}${tm||S.goccia?"":`<div class="quicktools">${TOOLS.map(t=>`<button data-go="${t.route}"><span style="color:${t.c}">${ic(t.ic,17)}</span>${t.lab}</button>`).join("")}<button data-go="services"><span style="color:#2BA3B8">${ic("plug",17)}</span>서비스 연결</button></div><div class="sugs">${(S.goccia?["블랙홀은 어떻게 생겨?","분수 나눗셈 쉽게 알려 줘","훈민정음은 누가 만들었어?"]:["훈민정음은 누가 만들었어?","홈택스 사이트 알려 줘","오늘 주요 뉴스 정리해 줘","연차휴가 규정 알려 줘"]).map(t=>`<button data-ask="${esc(t)}">${esc(t)}</button>`).join("")}</div>`}
<p class="disc">${discText(false)}</p></div></div>`);}
function curChat(){return S.chats.find(c=>c.id===S.cur);}
function vChat(){const c=curChat();if(!c){go(S.area==="code"?"code":"home");return "";}
const code=c.area==="code";
const msgs=c.msgs.map(m=>m.role==="user"?`<div class="um">${esc(m.text)}</div>`:aMsg(m,code)).join("");
const preview=code?`<aside class="preview ${S.preview?"open":""}" aria-label="미리보기"><div class="bar2"><div class="seg" style="width:auto"><button aria-pressed="true">${ic("eye",13)} 미리보기</button><button aria-pressed="false" data-act="showcode">${ic("code",13)} 코드</button></div><span class="chip plain grow" style="justify-content:flex-start">index.html</span><button class="iconbtn" data-act="todoreset" aria-label="새로고침">${ic("refresh",16)}</button><button class="iconbtn" data-act="preview" aria-label="미리보기 닫기">${ic("x",16)}</button></div><div class="stage">${todoApp()}</div></aside>`:"";
const ag=c.agent&&agentById(c.agent);
const ttl=S.renameChat===c.id&&S.renameAt==="top"?`<form class="renamef top" data-rf="${c.id}"><input id="rnc" value="${esc(c.title)}" aria-label="새 대화 이름" maxlength="40"><button class="iconbtn" aria-label="저장">${ic("check",15)}</button></form>`:`<div class="ttlwrap"><button class="ttlbtn" data-cmenu="${c.id}" data-at="top" aria-label="대화 메뉴">${ag?esc(ag.name)+" · ":""}${esc(c.title)} ${ic("down",14)}</button>${S.cmenu===c.id&&S.cmenuAt==="top"?chatMenu(c):""}</div>`;
return shell(`${topbar(ttl+(S.delChat===c.id?delConfirm(c):""),(c.temp?'<span class="tag" style="background:#1C2440;color:#fff">임시</span>':"")+(code?`<button class="btn sm" data-act="preview">${ic("eye",14)} 미리보기</button>`:(c.temp||S.goccia?"":`<button class="pill" data-act="share" data-id="${c.id}">${ic("share",14)}<span class="pl">공유</span></button>`)))}${S.share?shareModal():""}<div style="display:flex;flex:1;min-height:0"><div style="display:flex;flex-direction:column;flex:1;min-width:0"><div class="scroll" id="sc"><div class="wrap thread">${msgs}</div></div><div class="bottom"><div class="wrap" style="padding:0">${composer(code?"이어서 요청하세요":"더 물어보세요")}<p class="disc" style="margin:8px 0 0">${discText(code)}</p></div></div></div>${preview}</div>`);}
function shareModal(){const c=S.chats.find(x=>x.id===S.share);if(!c)return "";const on=!!c.shared;const link="https://lago.ai/s/"+c.id.slice(-8);
return `<div class="tempask" role="dialog" aria-label="대화 공유" data-act="shareClose"><div class="card sharecard" data-stop="1"><div class="row"><b style="font-size:17px">대화 공유</b><span class="grow"></span><button class="iconbtn" data-act="shareClose" aria-label="닫기">${ic("x",18)}</button></div>
<div class="shareprev"><b>${esc(c.title)}</b><span class="muted" style="font-size:12px">메시지 ${c.msgs.length}개 · ${esc(S.user.name)}</span><div class="um" style="font-size:12.5px;max-width:100%;align-self:flex-start">${esc((c.msgs[0]||{}).text||"")}</div></div>
<div class="seg">${[["off","나만 보기"],["on","링크가 있는 사람"]].map(x=>`<button aria-pressed="${(x[0]==="on")===on}" data-shareset="${x[0]}">${x[1]}</button>`).join("")}</div>
${on?`<div class="row"><input readonly value="${link}" id="shareLink" aria-label="공유 링크" style="font:13px var(--mono)"><button class="btn sm pri" data-act="copy" data-text="${link}">${ic("copy",14)} 복사</button></div>
<div class="prow" style="padding:6px 0"><span class="grow" style="font-size:13px">출처 카드 함께 보여 주기</span><button class="switch" role="switch" aria-checked="${c.shareSrc!==false}" data-sharesrc="1"></button></div>
<div class="prow" style="padding:6px 0;border:0"><span class="grow" style="font-size:13px">내 이름 표시</span><button class="switch" role="switch" aria-checked="${!!c.shareName}" data-sharename="1"></button></div>
<span class="muted" style="font-size:12px">링크를 받은 사람은 지금까지의 대화를 읽기만 할 수 있어요. 이후에 보낸 메시지는 보이지 않아요.</span>`:`<span class="muted" style="font-size:12.5px">지금은 나만 볼 수 있어요. "링크가 있는 사람"을 고르면 공유 링크가 만들어져요.</span>`}</div></div>`;}
function aMsg(m,code){if(m.loading)return `<div class="am"><div class="who">${WM(12)}</div><span class="status">${ic(code?"brain":"globe",14)} ${code?"생각하는 중":"자료 찾는 중"} <span class="typing"><i></i><i></i><i></i></span></span></div>`;
const fb=`<div class="acts"><button data-act="copy" data-text="${esc(m.plain||"")}" aria-label="복사">${ic("copy",16)}</button><button data-act="like" aria-pressed="${m.like===1}" data-mid="${m.id}" aria-label="좋아요">${ic("thumb",16)}</button><button data-act="dislike" aria-pressed="${m.like===-1}" data-mid="${m.id}" aria-label="별로예요"><svg class="ic" viewBox="0 0 24 24" width="16" height="16" style="transform:rotate(180deg)">${P.thumb}</svg></button><span>${esc(m.meta||"")}</span></div>`;
return `<div class="am"><div class="who">${WM(12)}</div>${m.html}${fb}</div>`;}
function answerFor(q,agent){const t=q.replace(/\s/g,"");
if(S.goccia&&/죽고싶|자해|괴롭힘|때려|학대|무서워/.test(t))return{html:`<p class="answer">힘든 일이 있었구나. 혼자 견디지 않아도 돼. 믿을 수 있는 어른에게 꼭 이야기해 줘.<br>지금 바로 이야기하고 싶으면 <b>청소년상담 1388</b>(전화 1388, 문자 #1388)에서 언제든 들어 줘.</p>`,plain:"청소년상담 1388",meta:"도움 안내"};
if(S.goccia&&(S.study||S.kStudy===true))return{html:`<span class="status">${ic("book",14)} 공부 모드</span><p class="answer">좋아, 답을 바로 말해 주는 대신 같이 풀어 보자! 🙂<br><b>1단계</b> 문제에서 무엇을 묻는지 한 줄로 말해 볼래?<br>그다음에 내가 힌트를 하나씩 줄게.</p>`,plain:"공부 모드",meta:"공부 모드"};
if(S.goccia&&!/훈민정음|세종|한글/.test(t))return{html:`<p class="answer">좋은 질문이야! 이 화면은 미리보기라서 아직 진짜 답은 못 하지만, LAGO가 연결되면 위키백과에서 찾아서 쉽게 설명해 줄게.</p>`,plain:"미리보기",meta:modeOf(S.mode).lab};
if(agent&&!/훈민정음|세종|한글|홈택스|국세청|사이트/.test(t))return{html:`<span class="status">${ic(agent.ic,14)} ${esc(agent.name)} 에이전트</span><p class="answer"><b>${esc(agent.name)}</b> 에이전트가 정해 둔 지시문대로 답하는 자리예요. 미리보기라서 실제 LAGO 모델과는 아직 연결되어 있지 않아요.</p>${agent.ins?`<p class="muted" style="margin:0;font-size:12.5px">지시문: ${esc(agent.ins.slice(0,120))}${agent.ins.length>120?"…":""}</p>`:""}`,plain:"에이전트 미리보기",meta:agent.mode+" 1.0"};
if(/훈민정음|세종|한글/.test(t))return{html:`<span class="status">${ic("globe",14)} 자료 4개 찾음 · 위키 3 · 뉴스 0 · 웹 1</span><p class="answer">훈민정음은 조선의 4대 임금 세종이 만들었어요 <span class="cite">[1]</span>. 1443년(세종 25년)에 글자를 만들었고, 1446년에 백성에게 널리 알렸어요 <span class="cite">[1][2]</span>.<br>백성이 어려운 한자 대신 쉽게 글을 익혀 쓰게 하려는 뜻이었어요. 이때 펴낸 해설서 『훈민정음 해례본』은 유네스코 세계기록유산으로 등재되어 있어요 <span class="cite">[2]</span>.</p><div class="srcs"><div class="src"><span class="n">1</span><span class="grow"><b style="font-weight:500">훈민정음</b><br><span class="muted" style="font-size:11.5px">위키백과 · ko.wikipedia.org</span></span>${ic("ext",14)}</div><div class="src"><span class="n">2</span><span class="grow"><b style="font-weight:500">훈민정음 해례본</b><br><span class="muted" style="font-size:11.5px">위키백과 · ko.wikipedia.org</span></span>${ic("ext",14)}</div></div>`,plain:"훈민정음은 조선의 4대 임금 세종이 만들었어요. 1443년에 만들고 1446년에 반포했어요.",meta:"자료 4개"};
if(/홈택스|국세청|사이트/.test(t))return{html:`<p class="answer">국세청 홈택스는 세금 신고 · 납부, 각종 증명서 발급을 할 수 있는 공식 사이트예요 <span class="cite">[L1]</span>. 연말정산 간소화 자료도 여기서 내려받을 수 있어요.</p><div class="linkcard"><span class="src n" style="width:36px;height:36px;border:0;padding:0;justify-content:center;background:var(--mist)">L1</span><span class="grow"><b>국세청 홈택스</b><br><span class="muted" style="font-size:12px">hometax.go.kr · 공식 사이트</span></span><a class="btn sm pri" href="https://www.hometax.go.kr" target="_blank" rel="noopener">열기 ${ic("ext",13)}</a></div>`,plain:"국세청 홈택스: hometax.go.kr",meta:"링크 1개"};
return{html:`<p class="answer">이 화면은 미리보기라서 아직 실제 LAGO 모델과 연결되어 있지 않아요. 연결되면 <b>${esc(S.mode)}</b> 모드로 위키백과 · 뉴스 · 웹을 찾아 읽고, 근거 번호와 출처를 붙여 답해요.</p><p class="muted" style="margin:0;font-size:13px">예시 질문 "훈민정음은 누가 만들었어?"나 "홈택스 사이트 알려 줘"를 보내 보면 실제 답 모양을 볼 수 있어요.</p>`,plain:"미리보기 답변",meta:S.mode+" 1.0"};}
function codeAnswer(q){const code=`<span class="kw">import</span> pandas <span class="kw">as</span> pd
<span class="kw">from</span> pathlib <span class="kw">import</span> <span class="fn">Path</span>

<span class="kw">def</span> remove_duplicates(src: str) -> <span class="fn">Path</span>:
    <span class="st">"""CSV의 중복 행을 지우고 새 파일로 저장합니다."""</span>
    df = <span class="fn">pd</span>.read_csv(src)
    out = <span class="fn">Path</span>(src).with_name(<span class="fn">Path</span>(src).stem + <span class="st">"_dedup.csv"</span>)
    df.drop_duplicates().to_csv(out, index=<span class="kw">False</span>)
    <span class="kw">return</span> out`;
if(/html|화면|ui|앱|페이지|할일|todo/i.test(q))return{html:`<span class="status">${ic("brain",14)} 생각 과정 · 6초</span><p class="answer">index.html 하나로 할 일 앱 화면을 만들었어요. 할 일을 추가하고, 체크하면 줄이 그어져요. 오른쪽 미리보기에서 바로 눌러 볼 수 있어요.</p><div class="filecard"><span class="logo-dot" style="width:32px;height:32px;border-radius:8px;background:var(--gt);color:var(--g)">${ic("file",16)}</span><span class="grow"><b>index.html</b><br><span class="muted" style="font-size:11.5px">HTML · 84줄</span></span><button class="chip" data-act="preview">${ic("eye",13)} 미리보기</button></div>`,plain:"index.html",meta:S.cmode+" 1.0",preview:true};
return{html:`<span class="status">${ic("brain",14)} 생각 과정 · 8초</span><p class="answer">pandas의 drop_duplicates로 중복을 지우고, 결과는 새 파일(…_dedup.csv)로 저장할게요. 원본 파일은 건드리지 않아요.</p><div class="codeblock"><header>python · dedup.py<button data-act="copy" data-text="def remove_duplicates(src): ...">${ic("copy",13)} 복사</button></header><pre>${code}</pre></div><div class="card" style="padding:12px 14px;display:grid;gap:10px;border-color:#BFDCCB"><div class="row" style="font-size:12px;color:var(--g);font-weight:600">${ic("term",15)} 명령 제안 <span class="grow"></span><span class="muted" style="font-weight:400">lago_app 폴더 안에서만 실행돼요</span></div><code style="background:#0F1F1A;color:#D7E3E8;padding:9px 12px;border-radius:8px;font:12px var(--mono);overflow-x:auto;white-space:nowrap">$ python -c "from dedup import remove_duplicates; remove_duplicates('data.csv')"</code><div class="row"><button class="btn sm pri g" data-act="run">${ic("check",14)} 승인하고 실행</button><button class="btn sm" data-act="skip">건너뛰기</button></div></div>`,plain:"dedup.py",meta:S.cmode+" 1.0"};}
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
 if(!u){if(S.unsub){S.unsub();S.unsub=null;}if(S.user&&S.user.uid){S.user=null;S.banned=null;S.chats=[];S.cur=null;go("login");}render();return;}
 let d={};try{const snap=await S.fb.db.doc("users/"+u.uid+"/data/main").get();if(snap.exists)d=snap.data();}catch(e){toast("저장된 데이터를 불러오지 못했어요 (Firestore 규칙을 확인해 주세요)");}
 S.user={uid:u.uid,email:u.email,name:d.name||u.displayName||(u.email||"").split("@")[0],plan:d.plan||"Free",planBase:d.plan||"Free"};
 PKEYS.forEach(k=>{if(d[k]!=null)S[k]=d[k];});syncReq();S.chats=d.chats||[];S.myAgents=d.myAgents||[];S.favs=d.favs||[];if(d.pinned)S.pinned=d.pinned;S.learn=d.learn!==false;S.learnImg=d.learnImg!==false;if(d.mode&&TALK_MODES.some(m=>m.id===d.mode))S.mode=d.mode;if(d.think!=null)S.think=d.think;
 if(!snap_exists(d)&&!S.signingUp)fbSave(true);
 if(S.unsub)S.unsub();S.unsub=S.fb.db.doc("users/"+u.uid+"/data/main").onSnapshot(sn=>{if(!sn.exists||sn.metadata.hasPendingWrites||fbT)return;const x=sn.data();const before=pendingReq();let ch=false;PKEYS.forEach(k=>{if(x[k]!=null&&JSON.stringify(S[k])!==JSON.stringify(x[k])){S[k]=x[k];ch=true;}});if(ch){syncReq();render();if(!S.goccia&&pendingReq()>before)toast("지우가 시간을 더 요청했어요");}});
 const r=route();if(["login","join","verify","kid"].includes(r)||!r){if(PATHMODE&&S.after&&S.after!=="/login"){const a=S.after;S.after=null;history.replaceState(null,"",a);render();}else go("home",true);}else render();meCheck();});
}catch(e){S.fbErr=true;toast("Firebase를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.");}}
const snap_exists=d=>d&&Object.keys(d).length>0;
let fbT=null;
function fbSave(now){if(!S.fb||!S.user||!S.user.uid)return;clearTimeout(fbT);const run=()=>{fbT=0;const data=JSON.parse(JSON.stringify({name:S.user.name,plan:S.user.planBase||S.user.plan||"Free",myAgents:S.myAgents,favs:S.favs,pinned:S.pinned,chats:S.chats.filter(c=>!c.temp&&!c.kid),learn:S.learn,learnImg:S.learnImg,mode:S.mode,think:S.think,...pk(),updated:Date.now()}));S.fb.db.doc("users/"+S.user.uid+"/data/main").set(data).catch(()=>toast("저장하지 못했어요. 인터넷이나 Firestore 규칙을 확인해 주세요."));};now?run():fbT=setTimeout(run,800);}
const fbMsg=e=>({"auth/user-disabled":"이용이 정지된 계정이에요. 문의가 필요하면 관리자에게 연락해 주세요.","auth/invalid-credential":"이메일이나 비밀번호가 맞지 않아요.","auth/wrong-password":"비밀번호가 맞지 않아요.","auth/user-not-found":"가입된 이메일이 아니에요. 회원가입을 먼저 해 주세요.","auth/email-already-in-use":"이미 가입된 이메일이에요. 로그인해 주세요.","auth/weak-password":"비밀번호가 너무 약해요. 영문과 숫자를 섞어 8자 이상으로 해 주세요.","auth/too-many-requests":"시도가 너무 많아요. 잠시 뒤에 다시 해 주세요.","auth/popup-closed-by-user":"Google 창이 닫혔어요.","auth/cancelled-popup-request":"Google 창이 닫혔어요.","auth/unauthorized-domain":"이 주소가 Firebase 승인된 도메인에 없어요. Authentication → 설정 → 승인된 도메인에 추가해 주세요.","auth/network-request-failed":"인터넷 연결을 확인해 주세요.","auth/operation-not-allowed":"이 로그인 방법이 Firebase에서 꺼져 있어요.","auth/invalid-email":"이메일 주소를 확인해 주세요."}[e&&e.code]||"로그인하지 못했어요. ("+((e&&e.code)||"알 수 없음")+")");
async function loadApi(){if(!/^https?:$/.test(location.protocol))return;try{const r=await fetch("/api/config",{cache:"no-store"});if(!r.ok)return;const c=await r.json();if(c&&c.wiki){S.api=c;if(c.firebase&&!c.firebase.error&&c.firebase.apiKey)initFirebase(c.firebase);if(S.user)render();}}catch(e){}}
const srcCard=(n,title,host,url)=>`<a class="src" href="${esc(url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><span class="n">${n}</span><span class="grow"><b style="font-weight:500">${esc(title)}</b><br><span class="muted" style="font-size:11.5px">${esc(host)}</span></span>${ic("ext",14)}</a>`;
async function liveAnswer(q){try{
if(S.api.publicData&&/공휴일|휴일|쉬는\s*날|빨간\s*날/.test(q)){const m=q.match(/(\d{1,2})\s*월/),y=q.match(/(20\d{2})\s*년/);const now=new Date();const yy=y?y[1]:now.getFullYear(),mm=m?m[1]:now.getMonth()+1;
const r=await fetch(`/api/holidays?year=${yy}&month=${mm}`);const d=await r.json();if(!r.ok)throw 0;
const list=d.items.length?`<ul style="margin:6px 0 0;padding-left:20px">${d.items.map(i=>`<li>${i.date.slice(4,6)*1}월 ${i.date.slice(6)*1}일 · ${esc(i.name)}</li>`).join("")}</ul>`:"<br>이 달에는 공휴일이 없어요.";
return{html:`<span class="status">${ic("globe",14)} 공공데이터 1개 찾음</span><p class="answer">${yy}년 ${mm}월 공휴일이에요 <span class="cite">[1]</span>.${list}</p><div class="srcs">${srcCard(1,"한국천문연구원 특일 정보","공공데이터포털 · data.go.kr","https://www.data.go.kr")}</div>`,plain:`${yy}년 ${mm}월 공휴일 ${d.items.length}개`,meta:modeOf(S.mode).lab+" · 공공데이터"};}
const kw=q.replace(/[?？!.]/g," ").replace(/(은|는|이|가|을|를|에 대해|에대해)?\s*(누가 만들었어|누가 만들었나요|뭐야|무엇인가요|뭔가요|알려 ?줘|설명해 ?줘|쉽게|자세히)/g," ").replace(/\s+/g," ").trim()||q;
const r=await fetch("/api/wiki?q="+encodeURIComponent(kw));const d=await r.json();if(!r.ok||!d.found)return null;
const top=d.results[0];const txt=(top.extract||"").split(/(?<=[.다요])\s+/).slice(0,S.mode==="Fonte"?4:2).join(" ");
return{html:`<span class="status">${ic("globe",14)} 위키백과 ${d.results.length}개 찾음</span><p class="answer">${esc(txt)} <span class="cite">[1]</span></p><div class="srcs">${d.results.map((x,i)=>srcCard(i+1,x.title,"위키백과 · ko.wikipedia.org",x.url)).join("")}</div>`,plain:txt,meta:modeOf(S.mode).lab+" · 위키백과"};
}catch(e){return null;}}
function send(text,opt){text=text.trim();if(!text)return;const code=S.area==="code";
let c=(route()==="chat"||route()==="code-chat")?curChat():null;
if(!c){c={id:"c"+Date.now(),area:S.area,title:text.slice(0,24),msgs:[],temp:S.temp,created:Date.now(),kid:S.goccia,agent:route()==="agent"?S.curAgent:null};S.chats.unshift(c);S.cur=c.id;}
c.msgs.push({role:"user",text});const am={id:"m"+Date.now(),role:"assistant",loading:true};c.msgs.push(am);S.menu=false;save();
go(code?"code-chat":"chat");const useLive=!code&&S.api&&!c.agent&&!(opt&&opt.tool)&&!(S.goccia&&(S.study||S.kStudy===true||/죽고싶|자해|괴롭힘|때려|학대|무서워/.test(text.replace(/\s/g,""))));
setTimeout(async()=>{const a=(opt&&opt.tool?toolAnswer(opt.tool,opt.raw||text,opt.opt):null)||(useLive&&await liveAnswer(text))||(code?codeAnswer(text):answerFor(text,c.agent&&agentById(c.agent)));Object.assign(am,a,{loading:false});if(a.preview)S.preview=true;save();if(S.cur===c.id)render();},900);}

/* ---------- projects ---------- */
function vProjects(){return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:1080px">
<div class="row" style="align-items:flex-start;flex-wrap:wrap;gap:12px"><div class="grow"><h1>프로젝트</h1><p class="muted" style="margin:0">대화와 자료를 주제별로 모아 두면, LAGO가 그 안의 내용을 참고해서 답해요.</p></div><button class="btn pri" data-act="newproj">${ic("plus",16)} 새 프로젝트</button></div>
${S.newProj?`<form class="card" id="projForm" style="margin-top:18px;display:grid;gap:10px;max-width:520px"><label class="f" for="pn">프로젝트 이름<input id="pn" placeholder="예: 독서 기록"></label><label class="f" for="pd">설명 (선택)<input id="pd" placeholder="무엇을 모아 둘까요?"></label><p class="err" id="perr"></p><div class="row"><button class="btn pri sm" type="submit">만들기</button><button class="btn sm" type="button" data-act="newproj">취소</button></div></form>`:""}
<div class="grid3" style="margin-top:20px">${S.projects.map(p=>`<button class="card pcard" data-project="${p.id}"><span class="logo-dot" style="width:36px;height:36px;border-radius:10px;background:var(--mist);color:var(--blue)">${ic("folder",18)}</span><b style="font-size:16px">${esc(p.name)}</b><span class="muted" style="font-size:13px">${esc(p.desc||"설명 없음")}</span><span class="row muted" style="font-size:12px">${ic("msg",13)} 대화 ${p.n}개<span class="grow"></span>${esc(p.u)}</span></button>`).join("")}</div></div></div>`);}
function vProject(){const p=S.projects.find(x=>x.id===S.curProject)||S.projects[0];
return shell(`${topbar("",`<button class="btn sm" data-go="projects">${ic("back",14)} 프로젝트</button>`)}<div class="scroll"><div class="wrap page" style="max-width:1100px"><div class="split"><div style="display:grid;gap:18px;min-width:0">
<div class="row"><span class="logo-dot" style="width:44px;height:44px;border-radius:12px;background:var(--mist);color:var(--blue)">${ic("folder",22)}</span><div class="grow"><h1 style="margin:0">${esc(p.name)}</h1><span class="muted">${esc(p.desc||"")}</span></div><span class="tag">대화 프로젝트</span></div>
${composer("이 프로젝트의 자료를 바탕으로 물어보세요")}
<b>이 프로젝트의 대화 <span class="muted" style="font-weight:400">${p.n}</span></b>
<div class="list">${[["11월 GPU 시간 나누기","이번 주 30시간 중 FACT 학습에 18시간…","2시간 전"],["서버 후보 비교","Cloud Run L4와 RunPod의 한 달 비용…","어제"],["요금제 본전 계산","서버가 한 달 $500이면…","4일 전"]].map(r=>`<button data-ask="${esc(r[0])}">${ic("msg",17)}<span class="grow"><b style="font-weight:500">${r[0]}</b><br><span class="muted" style="font-size:12.5px">${r[1]}</span></span><span class="muted" style="font-size:12px">${r[2]}</span></button>`).join("")}</div></div>
<div style="display:grid;gap:16px"><div class="card" style="display:grid;gap:8px"><div class="row"><b>지침</b><span class="grow"></span><button class="iconbtn" data-act="editins" aria-label="지침 고치기">${ic("pen",15)}</button></div>${S.editIns?`<textarea id="insIn" rows="4">${esc(p.ins)}</textarea><button class="btn sm pri" data-act="saveins" style="justify-self:start">저장</button>`:`<p class="muted" style="margin:0;font-size:13px;line-height:1.6">${esc(p.ins||"아직 지침이 없어요. 연필을 눌러 추가하세요.")}</p>`}</div>
<div class="card" style="display:grid;gap:8px"><div class="row"><b>자료</b><span class="grow"></span><button class="chip" data-act="attach">${ic("plus",13)} 추가</button></div>${(p.files.length?p.files:["아직 자료가 없어요"]).map(f=>`<div class="row" style="background:var(--bg);border-radius:10px;padding:8px 10px;font-size:13px">${ic("file",15)} ${esc(f)}</div>`).join("")}<span class="muted" style="font-size:12px">자료는 이 프로젝트의 대화에서만 검색돼요.</span></div></div></div></div></div>`);}

/* ---------- agents ---------- */
const CATS=["전체","매일","공부","생활 · 법률","글쓰기","즐겨찾기"];
function agentCard(a){const fav=S.favs.includes(a.id);return `<div class="card agent"><button class="agentopen" data-agent="${a.id}"><span class="row" style="padding-right:28px"><span class="aic" style="background:${a.c}1f;color:${a.c}">${ic(a.ic,18)}</span><b style="font-size:15px">${esc(a.name)}</b></span><p>${esc(a.desc||"설명 없음")}</p><span class="row muted" style="font-size:11.5px;margin-top:auto"><span class="tag" style="background:#EEF2F8;color:var(--mut)">${esc(a.mode)} 1.0</span>${a.mine?'<span>내가 만듦</span>':'<span>LAGO</span>'}</span></button><button class="fav" data-fav="${a.id}" aria-pressed="${fav}" aria-label="즐겨찾기">${fav?ic("star",17):`<svg class="ic" viewBox="0 0 24 24" width="17" height="17"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/></svg>`}</button></div>`;}
function vAgents(){const mine=S.agentTab==="mine";let list=mine?S.myAgents:OFFICIAL;
if(!mine&&S.agentCat!=="전체")list=S.agentCat==="즐겨찾기"?allAgents().filter(a=>S.favs.includes(a.id)):list.filter(a=>a.cat===S.agentCat);
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:1100px">
<div class="row" style="flex-wrap:wrap;gap:12px;align-items:flex-start"><div class="grow"><h1>에이전트</h1><p class="muted" style="margin:0">자주 하는 일을 에이전트로 만들어 두면, 고르기만 해도 같은 방식으로 답해요.</p></div>${S.goccia?"":`<button class="btn pri" data-act="newagent">${ic("plus",16)} 에이전트 만들기</button>`}</div>
<div class="tabs" role="tablist"><button role="tab" aria-selected="${!mine}" data-tab="lago">LAGO 에이전트</button>${S.goccia?"":`<button role="tab" aria-selected="${mine}" data-tab="mine">나만의 에이전트 <span class="muted">${S.myAgents.length}</span></button>`}</div>
${mine?"":`<div class="cats">${CATS.map(c=>`<button aria-pressed="${S.agentCat===c}" data-cat="${c}">${c}</button>`).join("")}</div>`}
<div class="grid3">${mine?`<button class="card agent newagent" data-act="newagent">${ic("plus",22)} 새 에이전트 만들기<span class="muted" style="font-weight:400;font-size:12.5px">이름 · 지시문 · 시작 질문만 정하면 돼요</span></button>`:""}${list.map(agentCard).join("")}</div>
${!mine&&!list.length?`<p class="muted" style="text-align:center;padding:30px 0">즐겨찾기한 에이전트가 없어요. 카드의 별을 눌러 추가하세요.</p>`:""}</div></div>`);}
function vAgentNew(){const d=S.draft||{};const editing=!!S.editAgent;
return shell(`${topbar(editing?"에이전트 고치기":"에이전트 만들기",`<button class="btn sm" data-go="agents">${ic("back",14)} 에이전트</button>`)}<div class="scroll"><div class="wrap page" style="max-width:1100px"><div class="split">
<form class="card" id="agentForm" style="display:grid;gap:14px" novalidate><h1 style="font-size:22px">${editing?"에이전트 고치기":"새 에이전트"}</h1>
<div class="f" style="display:grid;gap:8px;font-size:13px;font-weight:500;color:var(--ink2)">아이콘<div class="icpick">${AGENT_ICONS.map(k=>`<button type="button" data-agic="${k}" aria-pressed="${d.ic===k}" aria-label="${k}">${ic(k,18)}</button>`).join("")}</div><div class="icpick">${AGENT_COLORS.map(c=>`<button type="button" data-agcol="${c}" aria-pressed="${d.c===c}" aria-label="색" style="background:${c}"></button>`).join("")}</div></div>
<label class="f" for="an">이름<input id="an" maxlength="20" placeholder="예: 영어 단어 선생님" value="${esc(d.name||"")}"></label>
<label class="f" for="ad">한 줄 소개<input id="ad" maxlength="60" placeholder="이 에이전트가 무엇을 해 주나요?" value="${esc(d.desc||"")}"></label>
<label class="f" for="ai">지시문 <span class="hint">LAGO가 항상 지킬 규칙이에요. 말투 · 형식 · 하지 말 것을 적어 주세요.</span><textarea id="ai" rows="5" placeholder="예: 영어 단어를 물으면 뜻, 예문 2개, 비슷한 단어를 표로 알려 줘. 너무 길게 말하지 마.">${esc(d.ins||"")}</textarea></label>
<div class="birth" style="grid-template-columns:1fr 1fr"><label class="f" for="am">기본 모드<select id="am">${TALK_MODES.map(m=>`<option value="${m.id}" ${d.mode===m.id?"selected":""}>${m.lab} · ${m.id}</option>`).join("")}</select></label>
<label class="f" for="aw">웹 검색<select id="aw">${["DB에 없을 때만","항상","끄기"].map((t,i)=>`<option value="${i}" ${(d.web||0)==i?"selected":""}>${t}</option>`).join("")}</select></label></div>
<div class="f" style="display:grid;gap:6px;font-size:13px;font-weight:500;color:var(--ink2)">시작 질문 <span class="hint">에이전트를 열면 버튼으로 보여요 (최대 3개)</span>${[0,1,2].map(i=>`<input id="as${i}" placeholder="예: apple 뜻 알려 줘" value="${esc((d.starters||[])[i]||"")}" aria-label="시작 질문 ${i+1}">`).join("")}</div>
<label class="f" for="av">공개 범위<select id="av"><option value="me" ${d.vis!=="link"?"selected":""}>나만 보기</option><option value="link" ${d.vis==="link"?"selected":""}>링크가 있는 사람</option></select></label>
<p class="err" id="aerr" aria-live="polite"></p>
<div class="row"><button class="btn pri" type="submit">${editing?"저장하기":"만들기"}</button><button class="btn" type="button" data-go="agents">취소</button></div></form>
<div style="display:grid;gap:10px;position:sticky;top:0"><b class="muted" style="font-size:12.5px">미리보기</b><div id="agPrev">${agentPreview(d)}</div><div class="note">${ic("info",17)}<span>에이전트의 대화도 일반 대화처럼 기록과 학습 설정을 따라요. 임시 대화로 쓰면 기록에 남지 않아요.</span></div></div></div></div></div>`);}
function agentPreview(d){const c=d.c||"#1B3E9E",k=d.ic||"bot";return `<div class="card" style="display:grid;gap:10px"><span class="row"><span class="aic" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:${c}1f;color:${c}">${ic(k,20)}</span><span><b style="font-size:16px">${esc(d.name||"이름 없는 에이전트")}</b><br><span class="muted" style="font-size:12.5px">${esc(d.desc||"한 줄 소개가 여기에 보여요")}</span></span></span><div class="sugs" style="justify-content:flex-start">${(d.starters||[]).filter(Boolean).map(t=>`<button type="button" tabindex="-1">${esc(t)}</button>`).join("")||'<span class="muted" style="font-size:12.5px">시작 질문이 여기에 보여요</span>'}</div></div>`;}
function readDraft(){if(!$("#an"))return;S.draft={...S.draft,name:$("#an").value.trim(),desc:$("#ad").value.trim(),ins:$("#ai").value.trim(),mode:$("#am").value,web:+$("#aw").value,starters:[0,1,2].map(i=>$("#as"+i).value.trim()).filter(Boolean),vis:$("#av").value};}
function vAgent(){const a=agentById(S.curAgent);if(!a){go("agents");return "";}const fav=S.favs.includes(a.id);
const chats=S.chats.filter(c=>c.agent===a.id&&!c.temp);
return shell(`${topbar("",`<button class="btn sm" data-go="agents">${ic("back",14)} 에이전트</button>`)}<div class="scroll"><div class="wrap hero" style="justify-content:flex-start;padding-top:28px">
<span class="aic" style="width:60px;height:60px;border-radius:18px;display:grid;place-items:center;background:${a.c}1f;color:${a.c}">${ic(a.ic,30)}</span>
<div><h1>${esc(a.name)}</h1><p class="muted" style="margin:6px 0 0">${esc(a.desc||"")}</p><div class="row" style="justify-content:center;margin-top:10px;flex-wrap:wrap"><span class="tag" style="background:#EEF2F8;color:var(--mut)">${esc(a.mode)} 1.0</span><span class="muted" style="font-size:12px">${a.mine?"내가 만듦":"LAGO 공식"}</span><button class="btn sm" data-fav="${a.id}" aria-pressed="${fav}">${fav?"즐겨찾기 해제":"즐겨찾기"}</button>${a.mine?`<button class="btn sm" data-act="editagent">${ic("pen",14)} 고치기</button><button class="btn sm danger" data-act="ask-delagent">${ic("trash",14)} 지우기</button>`:""}</div></div>
${S.confirm==="delagent"?`<div class="confirm" style="width:min(760px,100%);text-align:left">이 에이전트를 지울까요? 이 에이전트로 한 대화는 남아요.<div class="row"><button class="btn sm danger" data-act="delagent">지우기</button><button class="btn sm" data-act="cancel">취소</button></div></div>`:""}
${composer(esc(a.name)+"에게 물어보세요")}
<div class="sugs">${(a.starters||[]).map(t=>`<button data-ask="${esc(t)}">${esc(t)}</button>`).join("")}</div>
${chats.length?`<div style="width:min(760px,100%);text-align:left;display:grid;gap:8px"><b>이 에이전트로 한 대화</b><div class="list">${chats.slice(0,5).map(c=>`<button data-chat="${c.id}">${ic("msg",16)}<span class="grow">${esc(c.title)}</span></button>`).join("")}</div></div>`:""}</div></div>`);}

/* ---------- code ---------- */
function vCode(){return shell(`${topbar("")}<div class="scroll"><div class="wrap hero">
<div><h1 style="color:var(--gd)">무엇을 만들까요?</h1><p class="muted" style="margin:6px 0 0">빠른 CODE는 바로 코드, CODE는 설계부터 생각하고 코드를 써요.</p></div>
${composer("만들거나 고치고 싶은 코드를 설명해 주세요")}
<div class="quick grid3" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">${[["bug","버그 고치기","오류를 붙여 넣으면 원인부터","websearch.py 오류 고쳐 줘"],["book","코드 설명","파일을 올리면 한 줄씩","app.py 설명해 줘"],["flask","CSV 정리","중복 행 지우는 함수","CSV 파일에서 중복된 행을 지우는 함수 만들어 줘"],["monitor","화면 만들기","HTML로 바로 미리보기","간단한 할 일 앱 화면을 HTML로 만들어 줘"]].map(q=>`<button class="card pcard" data-ask="${esc(q[3])}" style="padding:14px"><span style="color:var(--g)">${ic(q[0],18)}</span><b>${q[1]}</b><span class="muted" style="font-size:12px">${q[2]}</span></button>`).join("")}</div>
<p class="disc">${ic("monitor",13)} 터미널 모드는 LAGO Desktop에서 쓸 수 있어요 · 명령은 승인한 뒤에만 실행돼요</p></div></div>`);}
function vFolder(){return shell(`${topbar("",`<span class="muted">작업 폴더 › <b style="color:var(--ink)">lago_app</b></span>`)}<div class="scroll"><div class="wrap page" style="max-width:1100px"><div class="split"><div style="display:grid;gap:16px;min-width:0">
<div class="row"><span class="logo-dot" style="width:44px;height:44px;border-radius:12px;background:var(--gt);color:var(--g)">${ic("folder",22)}</span><div class="grow"><h1 style="margin:0;color:var(--gd)">lago_app</h1><span class="muted" style="font:12px var(--mono)">~/projects/lago_app · main</span></div><span class="codebadge">코드 프로젝트</span></div>
${composer("lago_app에서 할 작업을 설명해 주세요")}
<b>이 폴더의 작업</b><div class="list" style="border-color:var(--gline)">${[["CSV 중복 행 지우기","dedup.py 추가 · 명령 1개 실행","완료"],["websearch.py 오류 고치기","타임아웃 처리 · 테스트 3개 통과","완료"],["FAISS 검색 속도 개선","인덱스를 IVF로 바꾸는 중","진행 중"]].map(r=>`<button data-ask="${esc(r[0])}">${ic("term",17)}<span class="grow"><b style="font-weight:500">${r[0]}</b><br><span class="muted" style="font-size:12.5px">${r[1]}</span></span><span class="tag" style="background:${r[2]==="완료"?"var(--gt)":"#FFF4DC"};color:${r[2]==="완료"?"var(--g)":"#8A6417"}">${r[2]}</span></button>`).join("")}</div></div>
<div style="display:grid;gap:16px"><div class="card" style="display:grid;gap:6px"><b>파일</b>${["app.py","websearch.py","dedup.py","data/","requirements.txt"].map(f=>`<div class="row" style="font:13px var(--mono);padding:4px 2px">${ic(f.endsWith("/")?"folder":"file",15)} ${f}</div>`).join("")}</div>
<p class="muted" style="font-size:12px;margin:0">터미널 명령은 이 폴더 안에서만, 승인한 뒤에 실행돼요.</p></div></div></div></div>`);}

/* ---------- plans / prefs / terms ---------- */
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
if(id==="translate")form=`<label class="fld">번역할 글<textarea id="ti" rows="7" placeholder="번역할 글을 붙여 넣어 주세요" maxlength="4000" style="resize:vertical">${esc(dr.text||"")}</textarea></label>
<div class="row" style="gap:10px;flex-wrap:wrap"><label class="fld" style="flex:1;min-width:150px">어떤 언어로<select id="to">${LANG.map(l=>`<option ${(dr.opt||"영어")===l?"selected":""}>${l}</option>`).join("")}</select></label><label class="fld" style="flex:2;min-width:200px">파일로 올리기<input id="tf2" type="file" accept=".pdf,.docx,.pptx,.xlsx,.txt"></label></div>
<p class="muted" style="font-size:12.5px;margin:0">파일 번역(모양 그대로 유지)은 서버가 연결된 뒤에 열려요. 지금은 글을 붙여 넣는 번역만 미리 볼 수 있어요.</p>`;
if(id==="extract")form=`<label class="fld">이미지나 PDF 올리기<input id="tf2" type="file" accept="image/*,.pdf"></label>
<label class="fld">또는 사진 속 글자를 직접 확인할 글<textarea id="ti" rows="4" placeholder="(선택) 뽑힌 글자를 고치고 싶을 때" maxlength="4000" style="resize:vertical">${esc(dr.text||"")}</textarea></label>
<p class="muted" style="font-size:12.5px;margin:0">글자 인식(OCR)은 서버가 연결된 뒤에 열려요. 지금은 화면 모양만 미리 볼 수 있어요.</p>`;
if(id==="summary")form=`<label class="fld">요약할 글<textarea id="ti" rows="8" placeholder="요약할 글을 붙여 넣어 주세요" maxlength="6000" style="resize:vertical">${esc(dr.text||"")}</textarea></label>
<label class="fld" style="max-width:220px">길이<select id="to">${["3줄","5줄","한 문단"].map(l=>`<option ${(dr.opt||"3줄")===l?"selected":""}>${l}</option>`).join("")}</select></label>`;
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:760px;display:grid;gap:16px">
<div class="row" style="gap:12px"><span class="svcico" style="background:${t.c}">${ic(t.ic,20)}</span><div class="grow"><h1 style="margin:0">${t.lab}</h1><span class="muted" style="font-size:13.5px">${t.d}</span></div><button class="btn sm" data-pintool="${t.id}">${ic("pin",14)} ${S.pinTools.includes(t.id)?"고정 해제":"사이드바에 고정"}</button></div>
<form id="toolForm" class="card" style="display:grid;gap:14px" novalidate data-tool="${t.id}">${form}<p class="err" id="toolerr" role="alert"></p><div class="row" style="justify-content:flex-end"><button class="btn pri">${id==="translate"?"번역하기":id==="extract"?"글자 뽑기":"요약하기"}</button></div></form>
<div class="card" style="display:grid;gap:8px"><b style="font-size:14px">이렇게 써요</b><ol style="margin:0;padding-left:20px;display:grid;gap:6px;font-size:13.5px;color:var(--ink2)">${t.steps.map(x=>`<li>${x}</li>`).join("")}</ol></div></div></div>`);}
function toolAnswer(kind,text,opt){const t=TOOLS.find(x=>x.id===kind);const sn=esc(text.slice(0,160))+(text.length>160?"…":"");
const msg=kind==="translate"?`<b>${esc(opt)}</b>로 번역한 결과가 이 자리에 나와요.`:kind==="extract"?`뽑힌 글자가 이 자리에 나와요. 복사하거나 대화로 보낼 수 있어요.`:`<b>${esc(opt)}</b> 요약이 이 자리에 나와요. 핵심 문장의 위치도 함께 보여 줘요.`;
return{html:`<span class="status">${ic(t.ic,14)} ${t.lab}</span><p class="answer">미리보기라서 실제 ${t.lab}은 아직 연결되지 않았어요. 연결되면 ${msg}</p>${sn?`<div class="card" style="padding:10px 12px;font-size:13px;color:var(--ink2)"><span class="muted" style="font-size:11.5px">입력한 글</span><br>${sn}</div>`:""}`,plain:t.lab+" 미리보기",meta:t.lab};}
function vServices(){const on=id=>S.services[id]===true;
const card=x=>`<div class="card svc"><div class="row"><span class="svcico" style="background:${x[4]}">${esc(x[1].slice(0,1))}</span><span class="grow"></span><span class="tag">${x[3]}</span></div><b>${x[1]}</b><p class="muted">${x[2]}</p><button class="btn ${on(x[0])?"":"navy"}" data-svc="${x[0]}" data-name="${esc(x[1])}">${on(x[0])?`${ic("check",15)} 연결됨 · 해제`:"계정 연결"}</button></div>`;
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:1100px;display:grid;gap:22px">
<div><h1>서비스 연결</h1><p class="muted" style="margin:0">내 서비스를 <b style="color:var(--ink)">MCP</b>(Model Context Protocol)로 연결하면 LAGO가 일정 · 메일 · 파일을 읽고 쓸 수 있어요.</p></div>
<div class="note">${ic("info",16)}<span>지금은 연결 화면 예시예요. 실제 연결은 MCP 서버와 로그인(OAuth)을 붙이는 다음 단계에서 열려요. 연결해도 LAGO는 허용한 범위만 읽어요.</span></div>
<section style="display:grid;gap:12px"><b style="font-size:15px">기본 제공</b><div class="svcgrid"><div class="card svc"><div class="row"><span class="svcico" style="background:#4A5FA8">${ic("globe",19)}</span><span class="grow"></span><span class="tag" style="background:#E6F6EE;color:#1F7A4A">켜져 있음</span></div><b>위키백과</b><p class="muted">FACT · 빠른 생각 · THINK가 한국어 위키에서 찾아 출처와 함께 답해요.</p></div>
<div class="card svc"><div class="row"><span class="svcico" style="background:#2BA3B8">${ic("news",19)}</span><span class="grow"></span><span class="tag" style="${S.api&&S.api.publicData?"background:#E6F6EE;color:#1F7A4A":""}">${S.api&&S.api.publicData?"켜져 있음":"키 필요"}</span></div><b>공공데이터포털</b><p class="muted">공휴일 같은 공공 자료를 불러와요. 서버에 data.go.kr 키가 있어야 해요.</p></div></div></section>
<section style="display:grid;gap:12px"><b style="font-size:15px">내 서비스</b><div class="svcgrid">${SERVICES.map(card).join("")}</div></section>
<section style="display:grid;gap:12px"><b style="font-size:15px">커스텀 커넥터 추가</b><form id="mcpForm" class="card" style="display:grid;gap:12px" novalidate><p class="muted" style="margin:0;font-size:13.5px">직접 만들었거나 다른 곳에서 받은 MCP 서버를 이름과 주소로 추가해요.</p><div class="row" style="gap:8px;flex-wrap:wrap"><input id="mn" placeholder="이름 (예: 우리 학교 도서관)" maxlength="30" aria-label="커넥터 이름" style="flex:1;min-width:150px"><input id="mu" type="url" inputmode="url" placeholder="https://example.com/mcp" aria-label="MCP 서버 주소" style="flex:2;min-width:200px"><button class="btn pri">추가</button></div><p class="err" id="merr" role="alert"></p>
${cust().map((x,i)=>`<div class="row" style="gap:10px;border-top:1px solid var(--line);padding-top:10px"><span class="svcico sm" style="background:#334">${ic("plug",15)}</span><span class="grow" style="min-width:0"><b style="font-size:14px">${esc(x.name)}</b><br><span style="font:12px var(--mono);color:var(--mut);word-break:break-all">${esc(x.url)}</span></span><button type="button" class="btn sm danger" data-act="mcpDel" data-i="${i}">빼기</button></div>`).join("")}</form></section></div></div>`);}
const WD=["월","화","수","목","금","토","일"];
const TPL=[["아침 뉴스 요약","오늘 주요 뉴스를 5줄로 정리해 줘","daily","08:00"],["월요일 공휴일 확인","이번 달 공휴일 알려 줘","weekly","09:00","월"],["저녁 복습","오늘 내가 물어본 내용을 한 번 더 정리해 줘","daily","21:00"]];
const taskWhen=t=>(t.freq==="daily"?"매일":t.freq==="weekly"?"매주 "+t.day+"요일":"한 번")+" "+(+t.time.slice(0,2)<12?"오전 ":"오후 ")+((+t.time.slice(0,2))%12||12)+":"+t.time.slice(3);
function nextRun(t){const [h,m]=t.time.split(":").map(Number),n=new Date();let d=new Date(n);d.setHours(h,m,0,0);if(t.freq==="weekly"){const want=(WD.indexOf(t.day)+1)%7;while(d.getDay()!==want||d<=n)d.setDate(d.getDate()+1);}else if(d<=n)d.setDate(d.getDate()+1);return d;}
const fmtNext=d=>{const n=new Date(),diff=Math.round((new Date(d).setHours(0,0,0,0)-new Date(n).setHours(0,0,0,0))/864e5);return (diff===0?"오늘":diff===1?"내일":(d.getMonth()+1)+"월 "+d.getDate()+"일")+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");};
function vTasks(){const dr=S.taskDraft||{};
const form=S.taskNew?`<form id="taskForm" class="card" style="display:grid;gap:12px" novalidate><b style="font-size:16px">새 예약 작업</b>
<label class="fld">이름<input id="tn" value="${esc(dr.name||"")}" maxlength="30" placeholder="예: 아침 뉴스 요약"></label>
<label class="fld">시간이 되면 LAGO에게 시킬 말<textarea id="tp" rows="3" maxlength="300" placeholder="예: 오늘 주요 뉴스를 5줄로 정리해 줘" style="resize:vertical">${esc(dr.prompt||"")}</textarea></label>
<div class="row" style="flex-wrap:wrap;gap:10px"><label class="fld" style="flex:1;min-width:120px">반복<select id="tf">${[["daily","매일"],["weekly","매주"],["once","한 번만"]].map(x=>`<option value="${x[0]}" ${(dr.freq||"daily")===x[0]?"selected":""}>${x[1]}</option>`).join("")}</select></label>
<label class="fld" style="flex:1;min-width:100px">요일(매주)<select id="td">${WD.map(w=>`<option ${(dr.day||"월")===w?"selected":""}>${w}</option>`).join("")}</select></label>
<label class="fld" style="flex:1;min-width:110px">시간<input id="tt" type="time" value="${dr.time||"08:00"}"></label></div>
<p class="err" id="terr" role="alert"></p><div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="taskCancel">취소</button><button class="btn pri">만들기</button></div></form>`:"";
const list=S.tasks.map(t=>`<div class="card" style="display:grid;gap:8px"><div class="row"><b class="grow" style="font-size:15px">${esc(t.name)}</b><button class="switch" role="switch" aria-checked="${t.on!==false}" data-tsw="${t.id}" aria-label="${esc(t.name)} 켜기/끄기"></button></div>
<span class="muted" style="font-size:13px">${taskWhen(t)}${t.on!==false?" · 다음 "+fmtNext(nextRun(t)):" · 꺼짐"}</span>
<span style="font-size:13px;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:8px 10px">${esc(t.prompt)}</span>
<div class="row" style="gap:8px"><button class="btn sm pri" data-act="taskRun" data-id="${t.id}">${ic("play",13)} 지금 실행</button><button class="btn sm danger" data-act="taskDel" data-id="${t.id}">${ic("trash",13)} 삭제</button>${t.last?`<span class="muted" style="font-size:12px;margin-left:auto">마지막 실행 ${new Date(t.last).getMonth()+1}/${new Date(t.last).getDate()}</span>`:""}</div></div>`).join("");
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:760px;display:grid;gap:16px">
<div class="row" style="align-items:flex-start;flex-wrap:wrap;gap:12px"><div class="grow"><h1>예약 작업</h1><p class="muted" style="margin:0">정한 시간에 LAGO가 대신 물어보고, 답을 대화로 남겨 줘요.</p></div><button class="btn pri" data-act="taskNew">${ic("plus",16)} 새 예약 작업</button></div>
<div class="note">${ic("info",16)}<span>지금은 예시 단계예요. 자동 실행 서버는 아직 연결 전이라, <b>지금 실행</b>으로 결과 모양을 먼저 확인해 보세요.</span></div>
${form}${list||(S.taskNew?"":`<div class="card" style="display:grid;gap:12px;text-align:center;padding:36px 20px"><b>아직 예약 작업이 없어요</b><span class="muted" style="font-size:13px">아래 예시로 바로 시작해 볼 수 있어요.</span><div class="row" style="justify-content:center;flex-wrap:wrap;gap:8px">${TPL.map((x,i)=>`<button class="chip" data-tpl="${i}">${esc(x[0])}</button>`).join("")}</div></div>`)}</div></div>`);}

function vUsage(){const plan=S.user.plan||"Free",lim=S.user.dailyLimit||LIMITS[plan],pct=usagePct(),used=Math.round(lim*pct/100);
const now=new Date(),mid=new Date(now);mid.setHours(24,0,0,0);const ms=mid-now,hh=Math.floor(ms/36e5),mm=Math.floor(ms%36e5/6e4);
const by=[["FACT",.46,"#2BA3B8"],["빠른 생각",.27,"#1B3E9E"],["THINK",.17,"#4A5FA8"],["CODE",.10,"#1F8A4C"]];
const days=[["금",38],["토",12],["일",5],["월",61],["화",44],["수",72],["오늘",pct]];
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?Math.round(n/1e3)+"K":n;
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:860px;display:grid;gap:16px">
<div class="row" style="flex-wrap:wrap"><div class="grow"><h1>사용량</h1><p class="muted" style="margin:0">${plan} 요금제 · 하루 ${fmt(lim)} 토큰 · 예시 데이터</p></div><button class="btn sm" data-go="plans">요금제 보기</button></div>
<div class="card" style="display:grid;gap:10px"><div class="row"><b style="font-size:15px">오늘</b><span class="grow"></span><span class="muted" style="font-size:12.5px">${hh}시간 ${mm}분 뒤 초기화 (0시, 한국 시간)</span></div>
<div class="row" style="align-items:baseline;gap:6px"><span class="price" style="font-size:32px">${pct}%</span><span class="muted">${fmt(used)} / ${fmt(lim)} 토큰</span></div><div class="bar" style="height:10px"><i style="width:${pct}%"></i></div>
${pct>=80?`<div class="note">${ic("info",16)}<span>한도에 가까워요. 다 쓰면 내일 0시까지 쉬었다가 다시 쓸 수 있어요.</span></div>`:""}</div>
<div class="split" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)"><div class="card" style="display:grid;gap:12px"><b>모델별</b>${by.map(b=>`<div style="display:grid;gap:5px;font-size:13px"><div class="row"><span>${b[0]}</span><span class="grow"></span><span class="muted">${fmt(Math.round(used*b[1]))} · ${Math.round(b[1]*100)}%</span></div><div class="bar"><i style="width:${b[1]*100}%;background:${b[2]}"></i></div></div>`).join("")}</div>
<div class="card" style="display:grid;gap:8px"><b>최근 7일 (한도 대비 %)</b><div class="bars" style="height:140px">${days.map(d=>`<div class="${d[0]==="오늘"?"today":""}"><span>${d[1]}</span><i style="height:${Math.max(4,d[1]*1.1)}px;background:${d[0]==="오늘"?"var(--blue)":"#C9D6F5"}"></i>${d[0]}</div>`).join("")}</div></div></div>
<div class="card" style="display:grid;gap:6px;font-size:13px"><b style="font-size:14px">무엇이 사용량에 들어가나요?</b><span>${ic("check",14)} 내가 쓴 글, LAGO의 답, 생각 과정, 첨부한 이미지</span><span class="muted">${ic("x",14)} LAGO가 찾아서 붙인 위키 · 뉴스 · 웹 자료는 세지 않아요</span></div></div></div>`);}
function vPrefs(){const sw=(k,on)=>`<button class="switch" role="switch" aria-checked="${on}" data-sw="${k}"></button>`;const conf=S.confirm;const t=S.ptab;
const tabs=[["general","일반","sliders"],["account","계정","user"],["plan","요금제 · 사용량","card"],["data","데이터 · 개인정보","shield"],["family","보호자","heart"],["legal","약관","file"]];
const row=(l,sub,right)=>`<div class="prow"><span class="grow">${l}${sub?`<br><span class="muted" style="font-size:12.5px">${sub}</span>`:""}</span>${right}</div>`;
let body="";
if(t==="general")body=row("이름",esc(S.user.name),`<button class="btn sm" data-act="rename">바꾸기</button>`)+(S.renaming?`<form id="renameForm" class="row" style="padding:0 0 12px"><input id="rn" value="${esc(S.user.name)}" aria-label="새 이름"><button class="btn sm pri">저장</button></form>`:"")
+row("새 대화 기본 모델","",`<select id="sMode" aria-label="기본 모델">${TALK_MODES.map(m=>`<option value="${m.id}" ${S.mode===m.id?"selected":""}>${m.lab} · ${m.id}</option>`).join("")}</select>`)
+row("생각 강도","THINK · CODE에서 얼마나 깊게 생각할지",`<select id="sThink" aria-label="생각 강도">${["낮게","보통","깊게"].map((x,i)=>`<option value="${i}" ${S.think===i?"selected":""}>${x}</option>`).join("")}</select>`)
+row("언어","","<span class=\"muted\">한국어</span>")+row("서버 연결",S.api?"위키백과 · 공공데이터 "+(S.api.publicData?"연결됨":"키 없음")+" · Firebase "+(S.fb?"연결됨 · 로그인 "+esc(S.user.email):"설정 없음"):"미리보기 (예시 답변)","");
if(t==="account")body=row("이메일",esc(S.user.email),'<span style="color:var(--g);font-size:12.5px;font-weight:600">인증됨</span>')+row("로그아웃","",`<button class="btn sm" data-act="logout">${ic("logout",14)} 로그아웃</button>`)+row("탈퇴","계정과 대화가 모두 지워져요",`<button class="btn sm danger" data-act="ask-leave">탈퇴하기</button>`)+(conf==="leave"?`<div class="confirm">탈퇴하면 계정과 대화가 모두 지워져요. 유료 요금제는 먼저 해지돼요.<div class="row"><button class="btn sm danger" data-act="leave">탈퇴하기</button><button class="btn sm" data-act="cancel">취소</button></div></div>`:"");
if(t==="plan")body=row(esc(S.user.plan||"Free")+" 요금제","",`<button class="btn sm" data-go="plans">요금제 바꾸기</button>`)+row("오늘 사용량",usagePct()+"% · 매일 0시(한국 시간)에 초기화",`<button class="btn sm pri" data-go="usage">자세히 보기</button>`);
if(t==="data")body=row("LAGO 개선에 내 대화 사용","끄면 그 뒤 대화는 학습에 들어가지 않아요.",sw("learn",S.learn))+row("이미지도 사용","첨부한 이미지와 화면 캡처",sw("learnImg",S.learnImg))+row("내 데이터 전부 지우기","대화 · 프로젝트 · 이미지를 지워요. 되돌릴 수 없어요.",`<button class="btn sm danger" data-act="ask-wipe">지우기</button>`)+(conf==="wipe"?`<div class="confirm">정말 모두 지울까요?<div class="row"><button class="btn sm danger" data-act="wipe">${ic("trash",14)} 모두 지우기</button><button class="btn sm" data-act="cancel">취소</button></div></div>`:"");
if(t==="family")body=row("보호자 화면","지우의 사용 시간 · 주제 요약 · 사용 제한",`<button class="btn sm" data-go="guardian">열기</button>`)+row("아이 가입 흐름","보호자 동의 요청 화면",`<button class="btn sm" data-go="kid">열기</button>`);
if(t==="legal")body=row("이용약관","시행일 2026년 12월 31일",`<button class="btn sm" data-go="terms">보기</button>`)+row("개인정보 처리방침","공개 전에 준비돼요","<span class=\"muted\" style=\"font-size:12.5px\">준비 중</span>");
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:960px"><h1 style="margin-bottom:18px">설정</h1><div class="prefs"><nav class="pnav" aria-label="설정 메뉴">${tabs.map(x=>`<button class="nav ${t===x[0]?"on":""}" data-ptab="${x[0]}">${ic(x[2],17)} ${x[1]}</button>`).join("")}</nav><section class="card" style="min-width:0"><b style="font-size:16px;display:block;margin-bottom:4px">${tabs.find(x=>x[0]===t)[1]}</b>${body}</section></div></div></div>`);}
const TERMS=[["서비스 소개","LAGO는 위키백과 · 뉴스 · 법령 · 웹에서 자료를 찾아 근거와 함께 답하는 AI 서비스예요. 대화 모드(빠른 FACT · FACT · THINK)와 코드 모드(빠른 CODE · CODE)를 제공해요."],["가입과 계정","만 14세 이상만 가입할 수 있어요. 만 14세 미만은 2027년 1월부터 보호자 동의(이메일 + 카드 또는 신분증 확인)를 거쳐 LAGO Goccia 계정으로 쓸 수 있어요. 계정은 본인이 관리하고, 다른 사람과 함께 쓰면 안 돼요."],["요금제와 결제","Free · Pro · Max 요금제가 있어요. 하루 사용 한도는 매일 0시(한국 시간)에 초기화돼요. 유료 요금제는 언제든 해지할 수 있고, 이미 결제한 기간이 끝날 때까지는 그대로 쓸 수 있어요."],["대화 데이터와 학습","내 대화와 첨부한 이미지는 LAGO 다음 버전을 학습하는 데 쓰일 수 있어요. 설정 → 데이터 · 개인정보에서 언제든 끌 수 있고, 끈 뒤의 대화는 학습에 쓰지 않아요. 아이 계정의 대화는 학습에 쓰지 않아요."],["AI 답변의 한계","LAGO는 실수할 수 있어요. 중요한 결정(법률 · 의료 · 금융 등)에는 답변 아래 출처를 직접 확인하고, 필요하면 전문가와 상의해 주세요."],["CODE와 터미널 모드","터미널 모드와 컴퓨터 유즈는 LAGO Desktop에서만 동작해요. 명령은 사용자가 승인한 뒤에만, 연결한 작업 폴더 안에서만 실행돼요. 실행 결과에 대한 확인은 사용자 책임이에요."],["하지 말아야 할 일","다른 사람의 권리를 침해하거나, 법을 어기거나, 서비스를 방해하는 용도로 쓰면 안 돼요. 자동화된 방법으로 한도를 피해 대량으로 쓰는 것도 안 돼요."],["해지와 탈퇴","설정에서 언제든 탈퇴할 수 있어요. 탈퇴하면 대화 · 프로젝트 · 이미지가 지워지고, 유료 요금제는 먼저 해지돼요."],["약관 변경","약관을 바꿀 때는 시행 7일 전에 알려 드려요. 이용자에게 불리한 변경은 30일 전에 알려 드려요."]];
function vTerms(){return `<div style="min-height:100%;background:#fff"><header class="top" style="border-bottom:1px solid var(--line);padding-right:max(20px,env(safe-area-inset-right,0px))">${WM(18)}<b style="margin-left:12px">이용약관</b><span class="grow"></span><button class="btn sm" data-act="back">${ic("back",14)} 돌아가기</button></header>
<div class="terms"><nav style="display:grid;gap:2px;align-content:start;font-size:13px">${TERMS.map((t,i)=>`<a href="#terms" data-scroll="t${i}" class="nav" style="font-size:13px;text-decoration:none">${i+1}. ${t[0]}</a>`).join("")}</nav>
<article><span class="draft">초안 · 공개 전에 법률 검토가 필요해요</span><h1 style="font-size:30px;color:var(--navy);margin:14px 0 4px">LAGO 이용약관</h1><p class="muted" style="font-size:13px">시행일 2026년 12월 31일 · 마지막 수정 2026년 11월 5일</p>${TERMS.map((t,i)=>`<h2 id="t${i}">${i+1}. ${t[0]}</h2><p>${t[1]}</p>`).join("")}</article></div></div>`;}

/* ---------- guardian ---------- */
function vGuardian(){const t=S.gtab||"overview";const days=[["월",55],["화",80],["수",40],["목",72],["금",0],["토",0],["일",0]];const used=[15,16,20];const lim=S.limit||2;
const convos=[["분수 나눗셈 쉽게 알려 줘","THINK · 오후 4:20","나누는 수를 뒤집어서 곱하면 돼! 예를 들어 1/2 ÷ 1/4 은 1/2 × 4 = 2야. 같이 하나 더 풀어 볼까?"],["파이썬으로 구구단 만들기","CODE · 오후 3:48","for 문 두 개를 겹치면 돼. 먼저 2단부터 출력하는 코드를 같이 써 보자!"],["태양계 행성 순서","FACT · 오후 3:10","태양에서 가까운 순서로 수성 · 금성 · 지구 · 화성 · 목성 · 토성 · 천왕성 · 해왕성이야."]];
const sw=(k)=>`<button class="switch" role="switch" aria-checked="${S[k]!==false}" data-sw="${k}"></button>`;
let body="";
if(t==="overview")body=`${S.timeReq==="wait"?`<div class="card" style="display:grid;gap:8px;border-color:var(--k);background:var(--kt)"><b class="row">${ic("clock",15)} 지우가 시간을 더 요청했어요</b><span style="font-size:13px">"${esc(((S.kidReqs.find(x=>x.status==="pending")||{}).reason)||"시간을 더 쓰고 싶어요")}" · 30분 더</span><div class="row"><button class="btn sm pri" data-act="timeOk">30분 주기</button><button class="btn sm" data-act="timeNo">오늘은 안 돼요</button></div></div>`:""}
<div class="card" style="display:grid;gap:8px"><b>지우가 요즘 궁금해하는 것</b><div class="row" style="flex-wrap:wrap;gap:6px">${["분수","태양계","파이썬","공룡","훈민정음"].map(x=>`<span class="tag" style="background:var(--kt);color:var(--kd)">${x}</span>`).join("")}</div><span class="muted" style="font-size:12px">공부 모드 사용 · 이번 주 9번</span></div>
<div class="grid3" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
<div class="card stat"><span class="muted">오늘 사용</span><b>1시간 12분</b><div class="bar"><i style="width:${Math.min(100,72/(lim*60)*100)}%;background:var(--k)"></i></div><span class="muted" style="font-size:12px">하루 ${lim}시간 중</span></div>
<div class="card stat"><span class="muted">이번 주</span><b>4시간 7분</b><span class="muted" style="font-size:12px">지난주보다 35분 적어요</span></div>
<button class="card stat" data-gtab="talks" style="text-align:left;background:var(--warnbg);border-color:#F3CDB6"><span class="muted">안전 알림</span><b style="color:var(--warn)">1건</b><span class="muted" style="font-size:12px">11월 4일 · 리포트 보기</span></button></div>
<div class="card" style="display:grid;gap:8px"><b>이번 주 사용 시간</b><div class="bars">${days.map(d=>`<div class="${d[0]==="목"?"today":""}"><span>${d[1]?d[1]+"분":""}</span><i style="height:${Math.max(4,d[1]*1.3)}px;opacity:${d[1]?1:.35}"></i>${d[0]}</div>`).join("")}</div></div>
<div class="card" style="display:grid;gap:10px"><b>오늘 언제 썼나요</b><div class="strip">${Array.from({length:24},(_,h)=>`<i class="${used.includes(h)?"u":(S.night!==false&&(h>=22||h<7))?"x":""}" title="${h}시"></i>`).join("")}</div><div class="row muted" style="font-size:11px;justify-content:space-between"><span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>24시</span></div></div>`;
if(t==="talks")body=`<div class="card" style="background:var(--warnbg);border-color:#F3CDB6;display:grid;gap:4px"><b style="color:var(--warn)" class="row">${ic("bell",15)} 안전 알림 · 11월 4일</b><span style="font-size:13px">폭력과 관련된 질문 1건이 걸러졌어요. LAGO가 답하지 않고 믿을 수 있는 어른과 이야기해 보라고 안내했어요. 질문 내용은 보이지 않아요.</span></div>
<div class="card" style="display:grid;gap:12px"><b>이번 주 관심 주제</b>${[["수학",5],["과학",4],["코딩",3],["역사",2],["기타",1]].map(x=>`<div style="display:grid;gap:5px;font-size:13px"><div class="row"><span>${x[0]}</span><span class="grow"></span><span class="muted">${x[1]}번</span></div><div class="bar"><i style="width:${x[1]*20}%;background:var(--k)"></i></div></div>`).join("")}</div>
<div class="card" style="display:grid;gap:6px;font-size:13px"><b>이번 주 요약</b><span>공부 모드 9번 사용 · 평균 한 번에 14분</span><span>시간 더 요청 ${S.kidReqs.length}번${S.kidReqs.length?" · 최근 "+(S.kidReqs[0].status==="pending"?"답을 기다리는 중":S.kidReqs[0].status==="ok"?"허락함":"거절함"):""}</span></div>
<div class="card" style="display:flex;gap:10px;align-items:flex-start;background:var(--kt);border-color:transparent"><span style="color:var(--kd);flex:none">${ic("shield",18)}</span><span style="font-size:13px;line-height:1.7;color:var(--kd)"><b>대화 내용은 지우의 것이에요.</b><br>보호자에게는 사용 시간, 주제 요약, 안전 알림만 보여요. 지우의 계정으로 들어가서 볼 수도 없어요.</span></div>`;
if(t==="limits")body=`<div class="card" style="display:grid">
<div class="prow"><span class="grow">하루 사용 시간</span><select id="gLimit" aria-label="하루 사용 시간">${[1,2,3,4].map(h=>`<option value="${h}" ${lim===h?"selected":""}>${h}시간</option>`).join("")}</select></div>
<div class="prow"><span class="grow">밤에는 쓰지 않기<br><span class="muted" style="font-size:12px">밤 10시 ~ 아침 7시</span></span>${sw("night")}</div>
<div class="prow"><span class="grow">THINK 모드</span>${sw("kThink")}</div><div class="prow"><span class="grow">공부 모드 항상 켜기<br><span class="muted" style="font-size:12px">답을 바로 주지 않고 풀이를 같이 생각해요</span></span><button class="switch" role="switch" aria-checked="${S.kStudy===true}" data-sw="kStudy"></button></div><div class="prow"><span class="grow">쉬는 시간 알림<br><span class="muted" style="font-size:12px">40분마다 잠깐 쉬자고 알려 줘요</span></span>${sw("kBreak")}</div>
<div class="prow"><span class="grow">CODE 영역<br><span class="muted" style="font-size:12px">코딩 공부용 · 터미널은 항상 꺼져 있어요</span></span>${sw("kCode")}</div></div>
<div class="card" style="display:grid;gap:10px"><div class="row"><span class="grow">동의 철회<br><span class="muted" style="font-size:12px">아이 계정 · 대화 · 이미지를 모두 지워요</span></span><button class="btn sm danger" data-act="revoke">철회하기</button></div>
${S.confirm==="revoke"?`<div class="confirm">정말 철회할까요? 되돌릴 수 없어요.<div class="row"><button class="btn sm danger" data-act="revokeYes">철회하기</button><button class="btn sm" data-act="cancel">취소</button></div></div>`:""}</div>`;
return shell(`${topbar("보호자")}<div class="scroll"><div class="wrap page" style="max-width:820px;display:grid;gap:16px">
<div class="row" style="gap:14px"><span class="av" style="width:48px;height:48px;font-size:18px;background:var(--k);color:#fff">지</span><div class="grow"><h1 style="margin:0;font-size:24px">지우</h1><span class="muted" style="font-size:13px">LAGO Goccia · 만 12세 · 예시 데이터</span></div><span class="tag" style="background:var(--kt);color:var(--kd)">14세까지 D-412</span></div>
<div class="seg" role="tablist" style="max-width:420px">${[["overview","한눈에 보기"],["talks","리포트"],["limits","사용 제한"]].map(x=>`<button role="tab" aria-pressed="${t===x[0]}" data-gtab="${x[0]}">${x[1]}</button>`).join("")}</div>
${body}<p class="disc">지우의 화면에는 "보호자와 연결된 계정"이라는 작은 안내만 보여요. 대화 내용은 보호자도 볼 수 없어요.</p></div></div>`);}

/* ---------- render ---------- */
let brandStage=null;
function fixPops(){const c=document.querySelector(".composer");if(!c)return;const r=c.getBoundingClientRect();document.querySelectorAll(".pop").forEach(pp=>pp.classList.toggle("down",r.top<340&&innerHeight-r.bottom>r.top));}
function render(){const r=route();
if(S.banned&&S.user){$("#app").innerHTML=vBanned();return;}
if(!S.user&&!PUBLIC.includes(r)){if(PATHMODE&&!S.after)S.after=location.pathname;go("login",true);return;}
if(S.user&&(r==="login"||r==="join")){go("home",true);return;}
if(S.goccia&&["prefs","plans","guardian","agent-new","usage","tasks","services","tool-translate","tool-extract","tool-summary"].includes(r)){toast("아이 계정에서는 열 수 없는 화면이에요");go("home",true);return;}
if(r==="code"||r==="code-chat"||r==="code-folder")S.area="code";else if(["home","chat","projects","project","agents","agent","agent-new"].includes(r))S.area="talk";
const v={"tool-translate":vTool,"tool-extract":vTool,"tool-summary":vTool,services:vServices,tasks:vTasks,usage:vUsage,admin:vAdmin,"admin-user":vAdminUser,agents:vAgents,"agent-new":vAgentNew,agent:vAgent,login:vLogin,join:vJoin,verify:vVerify,kid:vKid,home:vHome,chat:vChat,"code-chat":vChat,projects:vProjects,project:vProject,code:vCode,"code-folder":vFolder,plans:vPlans,prefs:vPrefs,terms:vTerms,guardian:vGuardian}[r];
const html=v();if(!html)return;$("#app").innerHTML=html;
const sc=$("#sc");if(sc)sc.scrollTop=sc.scrollHeight;
if($("#bc"))startBrand();
const q=$("#q");if(q){q.addEventListener("input",()=>{q.style.height="auto";q.style.height=Math.min(180,q.scrollHeight)+"px";});q.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();send(q.value);}});}
document.title=r==="login"?"LAGO 로그인":"LAGO 앱 미리보기";
if(r==="agent-new")["an","ad","ai","as0","as1","as2"].forEach(id=>{const el=$("#"+id);el&&el.addEventListener("input",()=>{readDraft();$("#agPrev").innerHTML=agentPreview(S.draft);});});}

/* ---------- events ---------- */
document.addEventListener("click",async e=>{const t=e.target.closest("button,a,[data-act]");if(!t)return;const d=t.dataset;
if(d.scroll){e.preventDefault();const el=document.getElementById(d.scroll);if(el)el.scrollIntoView({behavior:"smooth",block:"start"});return;}
if(d.go){go(d.go);return;}
if(d.area){S.area=d.area;go(d.area==="code"?"code":"home");return;}
if(d.chat){S.cur=d.chat;const c=curChat();go(c&&c.area==="code"?"code-chat":"chat");return;}
if(d.project){S.curProject=d.project;S.editIns=false;go("project");return;}
if(d.ask){send(d.ask);return;}
if(d.agent){S.curAgent=d.agent;S.cur=null;S.confirm=null;go("agent");return;}
if(d.fav){const i=S.favs.indexOf(d.fav);if(i>=0)S.favs.splice(i,1);else S.favs.push(d.fav);save();render();toast(i>=0?"즐겨찾기에서 뺐어요":"즐겨찾기에 넣었어요");return;}
if(d.tab){S.agentTab=d.tab;render();return;}
if(d.ttl){S.ttl=+d.ttl;render();toast(["창을 닫으면 지워져요","1시간 뒤에 지워져요","24시간 뒤에 지워져요"][S.ttl]);return;}
if(d.svc){S.services[d.svc]=!S.services[d.svc];save();render();toast(S.services[d.svc]?d.name+"을(를) 연결했어요 (예시)":d.name+" 연결을 풀었어요");return;}
if(d.pintool){const a=S.pinTools;S.pinTools=a.includes(d.pintool)?a.filter(x=>x!==d.pintool):[...a,d.pintool];save();render();toast(S.pinTools.includes(d.pintool)?"사이드바에 고정했어요":"사이드바에서 뺐어요");return;}
if(d.go&&S.flyout){S.flyout=false;}
if(d.tpl!=null){const x=TPL[+d.tpl];S.taskDraft={name:x[0],prompt:x[1],freq:x[2],time:x[3],day:x[4]||"월"};S.taskNew=true;render();return;}
if(d.tsw){const t=S.tasks.find(x=>x.id===d.tsw);if(t){t.on=t.on===false;save();render();}return;}
if(d.ptab){S.ptab=d.ptab;S.confirm=null;S.renaming=false;render();return;}
if(d.cmenu){if(S.cmenu===d.cmenu&&S.cmenuAt===d.at)S.cmenu=null;else{S.cmenu=d.cmenu;S.cmenuAt=d.at;}render();return;}
if(d.unpin){S.pinned=S.pinned.filter(x=>x!==d.unpin);save();render();toast("고정을 풀었어요");return;}
if(d.shareset){const c=S.chats.find(x=>x.id===S.share);if(c){c.shared=d.shareset==="on";save();render();toast(c.shared?"공유 링크를 만들었어요":"공유를 멈췄어요. 링크로 더 이상 볼 수 없어요");}return;}
if(d.sharesrc){const c=S.chats.find(x=>x.id===S.share);c.shareSrc=c.shareSrc===false;save();render();return;}
if(d.sharename){const c=S.chats.find(x=>x.id===S.share);c.shareName=!c.shareName;save();render();return;}
if(d.gtab){S.gtab=d.gtab;S.gview=null;S.confirm=null;render();return;}
if(d.cat){S.agentCat=d.cat;render();return;}
if(d.agic){readDraft();S.draft.ic=d.agic;render();return;}
if(d.agcol){readDraft();S.draft.c=d.agcol;render();return;}
if(d.mode){if(S.area==="code")S.cmode=d.mode;else S.mode=d.mode;S.menu=false;save();render();return;}
if(d.think){S.think=+d.think;save();render();return;}
if(d.web){S.web=+d.web;save();render();return;}
if(d.plan){S.user.plan=d.plan;if(S.user.uid)fbSave(true);else store.set("lago_session",S.user);toast(d.plan==="Free"?"Free로 바꿨어요 (미리보기)":"결제는 아직 연결 전이에요. 미리보기에서는 "+d.plan+"로 바뀌어요.");render();return;}
if(d.sw){const k=d.sw;S[k]=k==="kStudy"?S[k]!==true:!(S[k]!==false);if(k==="learn"||k==="learnImg"){toast(S[k]?"켰어요":"껐어요. 이제부터의 대화는 학습에 쓰지 않아요.");}save();render();return;}
if(d.todo!=null&&t.tagName==="INPUT")return;
switch(d.act){
case"replay":brandStage&&brandStage.play();break;
case"demo":S.user={...DEMO};store.set("lago_session",S.user);loadUser();toast("예시 계정으로 들어왔어요");go("home");break;
case"google":if(S.fb){try{await S.fb.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());}catch(e){const m=$("#lerr")||$("#jerr");if(m)m.textContent=fbMsg(e);else toast(fbMsg(e));}break;}toast("Google 로그인은 실제 서비스에서 연결돼요. 지금은 예시 계정으로 들어갈게요.");S.user={...DEMO};store.set("lago_session",S.user);loadUser();go("home");break;
case"forgot":{const em=($("#le")||{}).value||"";toast(em?esc(em)+"로 재설정 메일을 보냈어요 (미리보기)":"이메일을 먼저 입력해 주세요");break;}
case"verified":{const u=store.get("lago_users",{})[S.pendingVerify];if(u){S.user={email:S.pendingVerify,name:u.name,plan:"Free"};store.set("lago_session",S.user);loadUser();toast("인증됐어요. 환영해요!");go("home");}else go("login");break;}
case"resend":toast("인증 메일을 다시 보냈어요 (1분에 한 번)");break;
case"kidGuardian":go("guardian");break;
case"new":S.cur=null;S.preview=false;S.drawer=false;go(S.area==="code"?"code":"home");break;
case"search":toast("검색은 실제 서비스에서 대화 제목과 내용을 찾아 줘요");break;
case"term":toast(S.goccia?"아이 계정에서는 터미널 모드를 쓸 수 없어요":"터미널 모드는 LAGO Desktop에서 쓸 수 있어요");break;
case"attach":toast("파일 첨부는 실제 서비스에서 연결돼요");break;
case"websw":S.web=(S.web+1)%3;save();render();break;
case"menu":S.conn=false;S.menu=!S.menu;render();break;
case"drawer":S.drawer=!S.drawer;render();break;
case"temp":{if(S.temp&&S.chats.some(c=>c.temp)){S.tempAsk=true;render();break;}S.temp=!S.temp;const r=route();const inChat=r==="chat"||r==="code-chat";
 if(!S.temp){const had=S.chats.some(c=>c.temp);S.chats=S.chats.filter(c=>!c.temp);if(inChat&&!curChat()){S.cur=null;toast(had?"임시 대화를 끄고 내용을 지웠어요":"임시 대화를 껐어요");go(S.area==="code"?"code":"home");break;}toast(had?"임시 대화를 끄고 내용을 지웠어요":"임시 대화를 껐어요");}
 else{toast("임시 대화를 켰어요. 기록에 남지 않고 학습에도 쓰지 않아요.");if(inChat){S.cur=null;go(S.area==="code"?"code":"home");break;}}
 render();break;}
case"acct":S.acct=!S.acct;render();break;
case"tempEnd":if(S.chats.some(c=>c.temp)){S.tempAsk=true;render();}else{S.temp=false;S.cur=null;toast("임시 대화를 끝냈어요");go(S.area==="code"?"code":"home");}break;
case"tempAskNo":S.tempAsk=false;render();break;
case"tempEndYes":S.tempAsk=false;S.temp=false;S.chats=S.chats.filter(c=>!c.temp);S.cur=null;toast("임시 대화를 지우고 끝냈어요");go(S.area==="code"?"code":"home");break;
case"tempSave":case"tempSaveEnd":{const c=curChat();if(c&&c.temp){c.temp=false;}if(d.act==="tempSaveEnd"){S.tempAsk=false;S.temp=false;S.chats=S.chats.filter(x=>!x.temp);}save();toast("일반 대화로 저장했어요. 최근 항목에 남아요.");render();break;}
case"tempNew":S.cur=null;go(S.area==="code"?"code":"home");break;
case"tempCopy":{const c=curChat();const txt=c?c.msgs.map(m=>(m.role==="user"?"나: "+m.text:"LAGO: "+(m.plain||""))).join("\n\n"):"";try{await navigator.clipboard.writeText(txt);toast("임시 대화를 복사했어요");}catch(err){toast("복사할 수 없어요");}break;}
case"asKid":S.goccia=true;S.acct=false;S.cur=null;S.area="talk";S.temp=false;toast("아이 계정(지우)으로 바꿨어요 · 예시");go("home");break;
case"asMe":S.goccia=false;S.acct=false;S.cur=null;toast(S.user.name+" 계정으로 돌아왔어요");go("home");break;
case"newagent":S.draft={ic:"bot",c:"#1B3E9E",mode:"Torrente",web:0,starters:[]};S.editAgent=null;go("agent-new");break;
case"editagent":{const a=agentById(S.curAgent);S.draft={...a};S.editAgent=a.id;go("agent-new");break;}
case"ask-delagent":S.confirm="delagent";render();break;
case"delagent":S.myAgents=S.myAgents.filter(a=>a.id!==S.curAgent);S.favs=S.favs.filter(f=>f!==S.curAgent);S.confirm=null;save();S.agentTab="mine";toast("에이전트를 지웠어요");go("agents");break;
case"share":S.share=d.id||S.cur;S.cmenu=null;render();break;
case"shareClose":if(e.target.closest("[data-stop]")&&!e.target.closest('[data-act="shareClose"]'))break;S.share=null;render();break;
case"cRename":S.renameChat=d.id;S.renameAt=S.cmenuAt;S.cmenu=null;render();setTimeout(()=>{const i=$("#rnc");if(i){i.focus();i.select();}},0);break;
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
case"mcpDel":{const a=cust();a.splice(+d.i,1);S.customMcp=a;save();render();break;}
case"lang":toast("지금은 한국어만 지원해요");break;
case"help":toast("도움말 센터는 공개 때 열려요");break;
case"dl":toast("LAGO Desktop과 브라우저 확장은 Beta2(12/25)부터 받을 수 있어요");break;
case"more":toast("LAGO 소개 · 블로그는 공개 때 열려요");break;
case"study":S.study=!S.study;render();toast(S.study?"공부 모드: 답 대신 풀이를 같이 생각해요":"공부 모드를 껐어요");break;
case"askTime":{const rs=(($("#treason")||{}).value||"").trim().slice(0,60);S.kidReqs.unshift({id:"r"+Date.now(),reason:rs,at:Date.now(),status:"pending"});syncReq();save();render();toast("보호자에게 요청을 보냈어요");
if(S.fb&&S.api&&S.api.mail&&S.user&&S.user.uid){try{const tk=await S.fb.auth.currentUser.getIdToken();const r=await fetch("/api/notify",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+tk},body:JSON.stringify({kid:"지우",reason:rs})});if(r.ok)setTimeout(()=>toast("보호자 이메일로도 알림을 보냈어요"),1800);}catch(e){}}break;}
case"timeOk":{const r=S.kidReqs.find(x=>x.status==="pending");if(r){r.status="ok";r.done=Date.now();S.extra=(S.extra||0)+30;}syncReq();save();render();toast("지우에게 30분을 더 줬어요");break;}
case"timeNo":{const r=S.kidReqs.find(x=>x.status==="pending");if(r){r.status="no";r.done=Date.now();}syncReq();save();render();toast("요청을 거절했어요");break;}
case"copy":try{await navigator.clipboard.writeText(d.text||"");toast("복사했어요");}catch(err){toast("복사할 수 없어요. 직접 선택해서 복사해 주세요.");}break;
case"like":case"dislike":{const c=curChat();const m=c&&c.msgs.find(x=>x.id===d.mid);if(m){const v=d.act==="like"?1:-1;m.like=m.like===v?0:v;save();render();toast(m.like?"의견을 보냈어요. 고마워요!":"취소했어요");}break;}
case"preview":S.preview=!S.preview;render();break;
case"showcode":toast("코드 탭: 실제 서비스에서 index.html 내용을 보여 줘요");break;
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
case"revokeYes":S.confirm=null;toast("동의를 철회했어요. 아이 계정이 삭제돼요 (미리보기)");render();break;
}});
document.addEventListener("change",e=>{const t=e.target;
if(t.dataset.todo!=null){S.todos[+t.dataset.todo].d=t.checked;render();return;}
if(t.id==="sMode"){S.mode=t.value;save();toast("기본 모드를 바꿨어요");}
if(t.id==="sThink"){S.think=+t.value;save();}
if(t.id==="sWeb"){S.web=+t.value;save();}
if(t.id==="gLimit"){S.limit=+t.value;render();toast("하루 사용 시간을 "+t.value+"시간으로 바꿨어요");}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&(S.menu||S.drawer||S.tempAsk||S.acct)){S.menu=false;S.drawer=false;S.tempAsk=false;S.acct=false;render();}
if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="b"&&S.user){e.preventDefault();S.sideOff=!S.sideOff;store.set("lago_sideoff",S.sideOff);render();return;}
if((e.ctrlKey||e.metaKey)&&e.key===","&&S.user&&!S.goccia){e.preventDefault();go("prefs");return;}
if(e.key==="Escape"&&(S.cmenu||S.share||S.renameChat||S.delChat)){S.cmenu=null;S.share=null;S.renameChat=null;S.delChat=null;S.flyout=false;render();return;}
if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"&&S.user){e.preventDefault();S.cur=null;go(S.area==="code"?"code":"home");}});
document.addEventListener("submit",async e=>{const f=e.target;e.preventDefault();
if(f.id==="composer"){send($("#q").value);return;}
if(f.id==="todoForm"){const v=$("#todoIn").value.trim();if(v){S.todos.push({t:v,d:false});render();setTimeout(()=>$("#todoIn")&&$("#todoIn").focus(),0);}return;}
if(f.id==="loginForm"){const em=$("#le").value.trim().toLowerCase(),pw=$("#lp").value,err=$("#lerr");
 if(!/^\S+@\S+\.\S+$/.test(em)){err.textContent="이메일 주소를 확인해 주세요.";$("#le").focus();return;}
 if(!pw){err.textContent="비밀번호를 입력해 주세요.";$("#lp").focus();return;}
 if(S.fb&&em!==DEMO.email){err.textContent="";const b=f.querySelector("button.pri,button[type=submit]");if(b)b.disabled=true;try{await S.fb.auth.signInWithEmailAndPassword(em,pw);toast("다시 오신 걸 환영해요");}catch(e){err.textContent=fbMsg(e);}if(b)b.disabled=false;return;}
 if(em===DEMO.email){S.user={...DEMO};store.set("lago_session",S.user);loadUser();go("home");return;}
 const u=store.get("lago_users",{})[em];if(!u){err.textContent="가입된 이메일이 아니에요. 회원가입을 먼저 해 주세요.";return;}
 if(u.hash!==await hash(pw)){err.textContent="비밀번호가 맞지 않아요.";$("#lp").focus();return;}
 if(!u.verified){S.pendingVerify=em;go("verify");return;}
 S.user={email:em,name:u.name,plan:u.plan||"Free"};store.set("lago_session",S.user);loadUser();toast(u.name+"님, 다시 오신 걸 환영해요");go("home");return;}
if(f.id==="joinForm"){const n=$("#jn").value.trim(),em=$("#je").value.trim().toLowerCase(),pw=$("#jp").value,err=$("#jerr");
 if(!n){err.textContent="이름을 입력해 주세요.";$("#jn").focus();return;}
 if(!/^\S+@\S+\.\S+$/.test(em)){err.textContent="이메일 주소를 확인해 주세요.";$("#je").focus();return;}
 if(pw.length<8||!/[A-Za-z]/.test(pw)||!/\d/.test(pw)){err.textContent="비밀번호는 영문과 숫자를 섞어 8자 이상이에요.";$("#jp").focus();return;}
 const by=+$("#jy").value,bm=+$("#jm").value,bd=+$("#jd").value,now=new Date();let age=now.getFullYear()-by;if(now.getMonth()+1<bm||(now.getMonth()+1===bm&&now.getDate()<bd))age--;
 if(age<14){S.kid={sent:false,email:""};go("kid");return;}
 if(!$("#jt").checked){err.textContent="이용약관 · 개인정보 처리방침에 동의해 주세요.";return;}
 if(S.fb){err.textContent="";const b=f.querySelector("button.pri,button[type=submit]");if(b)b.disabled=true;S.signingUp=true;try{const cr=await S.fb.auth.createUserWithEmailAndPassword(em,pw);await cr.user.updateProfile({displayName:n});S.pendingName=n;await S.fb.db.doc("users/"+cr.user.uid+"/data/main").set({name:n,plan:"Free",chats:[],learn:$("#jl").checked,learnImg:$("#jl").checked,age14:new Date().toISOString().slice(0,10),created:Date.now()});try{await cr.user.sendEmailVerification();}catch(e){}if(S.user)S.user.name=n;render();toast(n+"님, 가입했어요. 확인 메일도 보냈어요");}catch(e){err.textContent=fbMsg(e);}S.signingUp=false;if(b)b.disabled=false;return;}
 const users=store.get("lago_users",{});if(users[em]||em===DEMO.email){err.textContent="이미 가입된 이메일이에요. 로그인해 주세요.";return;}
 users[em]={name:n,hash:await hash(pw),verified:false,plan:"Free",learn:$("#jl").checked,age14:new Date().toISOString().slice(0,10)};store.set("lago_users",users);
 store.set("lago_data_"+em,{chats:[],learn:$("#jl").checked,learnImg:$("#jl").checked});
 S.pendingVerify=em;go("verify");return;}
if(f.id==="toolForm"){const k=f.dataset.tool,raw=($("#ti")?$("#ti").value.trim():""),op=$("#to")?$("#to").value:"",fl=$("#tf2")&&$("#tf2").files&&$("#tf2").files[0],err=$("#toolerr");
 if(!raw&&!fl){err.textContent=k==="extract"?"파일을 올려 주세요.":"글을 붙여 넣어 주세요.";return;}
 S.toolIn={text:raw,opt:op};const lab=TOOLS.find(x=>x.id===k).lab;const nm=fl?fl.name:raw.slice(0,16);
 const q=k==="translate"?`${op}로 번역해 줘: ${fl?fl.name:raw}`:k==="extract"?`이 파일에서 글자를 뽑아 줘: ${fl?fl.name:raw}`:`${op}로 요약해 줘: ${fl?fl.name:raw}`;
 S.area="talk";S.cur=null;S.temp=false;send(q,{tool:k,raw:fl?fl.name:raw,opt:op});if(S.chats[0])S.chats[0].title=lab+" · "+nm;save();return;}
if(f.id==="mcpForm"){const u=$("#mu").value.trim(),err=$("#merr");if(!/^https:\/\/[^\s/]+\.[^\s]+$/.test(u)){err.textContent="https://로 시작하는 서버 주소를 넣어 주세요.";return;}if(cust().some(x=>x.url===u)){err.textContent="이미 추가한 주소예요.";return;}const nm=$("#mn").value.trim()||u.replace(/^https:\/\//,"").split("/")[0];S.customMcp=[...cust(),{name:nm,url:u}];save();render();toast("커넥터를 추가했어요 (예시)");return;}
if(f.id==="taskForm"){const n=$("#tn").value.trim(),pr=$("#tp").value.trim(),err=$("#terr");if(!n){err.textContent="이름을 입력해 주세요.";$("#tn").focus();return;}if(!pr){err.textContent="시킬 말을 입력해 주세요.";$("#tp").focus();return;}
 if(!$("#tt").value){err.textContent="시간을 정해 주세요.";return;}S.tasks.unshift({id:"t"+Date.now(),name:n,prompt:pr,freq:$("#tf").value,day:$("#td").value,time:$("#tt").value,on:true});S.taskNew=false;S.taskDraft=null;save();render();toast("예약 작업을 만들었어요");return;}
if(f.id==="kidForm"){const em=$("#ke").value.trim();if(!/^\S+@\S+\.\S+$/.test(em)){$("#kerr").textContent="보호자 이메일 주소를 확인해 주세요.";return;}const btn=f.querySelector("button[type=submit],button.pri");if(btn)btn.disabled=true;
 if(S.api&&S.api.mail){try{const r=await fetch("/api/kid-consent",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:em})});const j=await r.json().catch(()=>({}));if(!r.ok){$("#kerr").textContent=j.error||"메일을 보내지 못했어요. 잠시 뒤에 다시 해 주세요.";if(btn)btn.disabled=false;return;}S.kid={sent:true,email:em};render();toast("보호자 이메일로 동의 요청을 보냈어요");return;}catch(e){$("#kerr").textContent="인터넷 연결을 확인해 주세요.";if(btn)btn.disabled=false;return;}}
 S.kid={sent:true,email:em};render();toast("미리보기라서 실제 메일은 보내지 않았어요");return;}
if(f.dataset.rf){const c=S.chats.find(x=>x.id===f.dataset.rf);const v=$("#rnc").value.trim();if(c&&v){c.title=v;save();toast("이름을 바꿨어요");}S.renameChat=null;render();return;}
if(f.id==="agentForm"){readDraft();const d=S.draft;if(!d.name){$("#aerr").textContent="이름을 입력해 주세요.";$("#an").focus();return;}if(!d.ins){$("#aerr").textContent="지시문을 한 줄 이상 적어 주세요.";$("#ai").focus();return;}
 if(S.editAgent){const i=S.myAgents.findIndex(a=>a.id===S.editAgent);S.myAgents[i]={...S.myAgents[i],...d};S.curAgent=S.editAgent;}else{const a={...d,id:"m"+Date.now(),mine:true,cat:"내 에이전트"};S.myAgents.unshift(a);S.curAgent=a.id;}
 save();toast(S.editAgent?"에이전트를 저장했어요":"에이전트를 만들었어요");S.editAgent=null;go("agent");return;}
if(f.id==="projForm"){const n=$("#pn").value.trim();if(!n){$("#perr").textContent="프로젝트 이름을 입력해 주세요.";return;}S.projects.unshift({id:"p"+Date.now(),name:n,desc:$("#pd").value.trim(),n:0,u:"방금",ins:"",files:[]});S.newProj=false;render();toast("프로젝트를 만들었어요");return;}
if(f.id==="renameForm"){const v=$("#rn").value.trim();if(v){S.user.name=v;if(S.user.uid)fbSave(true);else store.set("lago_session",S.user);const us=store.get("lago_users",{});if(us[S.user.email]){us[S.user.email].name=v;store.set("lago_users",us);}}S.renaming=false;render();toast("이름을 바꿨어요");}});
document.addEventListener("click",e=>{let ch=false;if(S.menu&&!e.target.closest(".composer")){S.menu=false;ch=true;}if(S.conn&&!e.target.closest(".composer")){S.conn=false;ch=true;}if(S.acct&&!e.target.closest(".acct,[data-act=acct]")){S.acct=false;ch=true;}if(S.cmenu&&!e.target.closest(".cmenu,[data-cmenu]")){S.cmenu=null;ch=true;}if(ch)render();},true);

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

/* ---------- boot ---------- */
S.sideOff=store.get("lago_sideoff",false)===true;{const _r=render;render=function(){_r();fixPops();};}
/* 서버가 정한 정지/요금제/한도를 불러와요. 5분마다, 그리고 탭으로 돌아올 때 다시 확인해요. */
async function meCheck(){if(!S.fb||!S.user||!S.user.uid||!S.api)return;
try{const tk=await S.fb.auth.currentUser.getIdToken();const r=await fetch("/api/me",{headers:{authorization:"Bearer "+tk},cache:"no-store"});if(!r.ok)return;const m=await r.json();
const before=JSON.stringify([S.banned,S.user.plan,S.user.dailyLimit]);
S.banned=m.banned?{until:m.until||0,reason:m.reason||""}:null;S.user.plan=m.plan||S.user.planBase||S.user.plan;S.user.dailyLimit=m.dailyLimit||0;
if(before!==JSON.stringify([S.banned,S.user.plan,S.user.dailyLimit]))render();}
catch(e){if(e&&/user-disabled|user-token-expired/.test(e.code||"")){S.fb.auth.signOut();toast("이용이 정지된 계정이에요");}}}
setInterval(meCheck,300000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)meCheck();});
function vBanned(){const b=S.banned||{};let left="";if(b.until){const m=Math.max(1,Math.ceil((b.until-Date.now())/60000));left=m>=60?Math.floor(m/60)+"시간 "+(m%60)+"분":m+"분";}
return `<main style="min-height:100dvh;display:grid;place-items:center;padding:24px;background:#F6F8FC"><section class="card" style="max-width:440px;width:100%;text-align:center;display:grid;gap:12px;padding:28px">${WM(22)}<h1 style="font-size:20px;margin:6px 0 0">이용이 정지된 계정이에요</h1><p class="muted" style="margin:0">${b.until?left+" 뒤에 다시 쓸 수 있어요.":"이 계정은 지금 쓸 수 없어요."}${b.reason?`<br>사유: ${esc(b.reason)}`:""}</p><p class="muted" style="font-size:12.5px;margin:0">잘못 정지됐다고 생각하면 관리자에게 문의해 주세요.</p><button class="btn" data-act="logout">로그아웃</button></section></main>`;}
/* admin.js(별도 파일)가 쓰는 것들을 바깥으로 내보내요 */
Object.assign(window,{S,shell,topbar,esc,toast,go,route,WM});window.render=()=>render();
loadUser();render();loadApi();
})();
