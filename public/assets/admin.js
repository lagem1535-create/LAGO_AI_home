/* LAGO 관리자 화면 — /admin (키·사용량), /admin/user (유저 관리)
   app.js 보다 먼저 불러와요. 여기 있는 함수는 화면이 그려질 때 app.js 가 불러 써요. */
const ADMIN_MAIL="lagem1535@gmail.com";
function isAdmin(){return !!(S.fb&&S.user&&S.user.uid&&String(S.user.email||"").toLowerCase()===ADMIN_MAIL);}
async function admFetch(path,method,body){const tk=await S.fb.auth.currentUser.getIdToken();const r=await fetch(path,{method:method||"GET",headers:{"content-type":"application/json",authorization:"Bearer "+tk},body:body?JSON.stringify(body):undefined});let j={};try{j=await r.json();}catch(e){}if(!r.ok){const er=new Error(j.error||("오류 "+r.status));er.needSa=!!j.needSa;er.needVerify=!!j.needVerify;throw er;}return j;}
const admBox=(t)=>`<div style="border:1px solid #F3C9C9;background:#FFF5F5;color:#B42318;padding:12px 14px;border-radius:12px;font-size:13.5px">${t}</div>`;
const admVerifyBox=()=>`<div class="card" style="padding:16px;display:grid;gap:10px"><b>이메일 인증이 필요해요</b><p class="muted" style="margin:0;font-size:13.5px">이메일·비밀번호로 만든 계정은 인증 메일의 링크를 눌러야 관리자로 인정돼요(남이 같은 이메일로 먼저 가입해 관리자가 되는 걸 막기 위해서예요).</p><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="admVerifySend">인증 메일 다시 보내기</button><button class="btn sm pri" data-act="admVerifyDone">인증 확인</button></div></div>`;
const admDeny=()=>shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:560px"><h1>관리자</h1><p class="muted">관리자 계정(${ADMIN_MAIL})으로 로그인해야 볼 수 있어요. 이 화면은 실제 서버에 연결된 사이트에서만 동작해요.</p><button class="btn" data-go="home">홈으로</button></div></div>`);
function admNav(on){const t=(r,l)=>`<button class="btn sm ${on===r?"pri":""}" data-go="${r}">${l}</button>`;return `<div class="row" style="gap:8px">${t("admin","개요 · 키")}${t("admin-user","유저 관리")}</div>`;}
const fmtT=ms=>ms?new Date(ms).toLocaleString("ko-KR",{timeZone:"Asia/Seoul",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}):"-";
const fmtD=ms=>ms?new Date(ms).toLocaleDateString("ko-KR",{timeZone:"Asia/Seoul",year:"2-digit",month:"numeric",day:"numeric"}):"-";
const fmtN=n=>n>=1e6?(n/1e6).toFixed(n%1e6?1:0)+"M":n>=1e3?Math.round(n/1e3)+"K":String(n);

/* ---------- /admin : 개요 · 키 ---------- */
async function loadAdmin(){if(!isAdmin()||S.admin&&S.admin.loading)return;S.admin=Object.assign(S.admin||{},{loading:true,err:""});try{const j=await admFetch("/api/admin/status");S.admin={status:j,loading:false,err:"",at:Date.now()};}catch(e){S.admin={loading:false,err:e.message,needVerify:e.needVerify,at:Date.now()};}if(route()==="admin")render();}
const ADM_SECRETS=[["MODEL_URL","모델 서버 주소","캐글 노트북(fact_6)이 알려 주는 https 주소예요. 노트북을 다시 켤 때마다 바뀌어요.","text","https://….trycloudflare.com"],["MODEL_KEY","모델 서버 비밀번호","노트북에 적은 KEY와 같은 값이에요. 서버가 이 값이 있어야 답해요.","password","긴 임의 문자열"],["FIREBASE_CONFIG","Firebase 웹 설정","로그인·저장에 쓰는 Firebase 웹앱 설정(JSON)이에요. Cloudflare 대시보드의 변수 및 비밀에서만 바꿀 수 있어요.","text","{...}"],["RESEND_API_KEY","Resend 키","보호자·아이 메일 보내기에 써요. re_ 로 시작해요.","password","re_..."],["MAIL_FROM","보내는 사람","예: LAGO &lt;noreply@내도메인.com&gt;. 도메인을 Resend에서 인증해야 아무에게나 보낼 수 있어요. 비워 두면 기본 주소를 써요.","text","LAGO <noreply@example.com>"],["DATA_GO_KR_KEY","공공데이터 키","공공데이터포털(data.go.kr) 일반 인증키(Decoding)예요. 공휴일 답에 써요.","password","인증키"],["FIREBASE_SERVICE_ACCOUNT","Firebase 서비스 계정","유저 관리(목록·정지·요금제)에 써요. Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → ‘새 비공개 키 생성’으로 받은 JSON 파일 내용을 통째로 붙여넣어요. 이 키는 힘이 세요. 가능하면 Cloudflare 대시보드 시크릿으로 넣는 걸 권해요.","area","{ \"type\": \"service_account\", ... }"]];
const ADM_STATS=[["visits","접속"],["wiki","위키 검색"],["holidays","공휴일 조회"],["kidConsent","아이 가입 요청"],["notify","시간 요청 알림"],["taskRun","예약 작업 실행"],["mailSent","메일 성공"],["mailFail","메일 실패"],["chat","Fonte 질문"]];
function vAdmin(){
if(!isAdmin())return admDeny();
if(!S.admin||Date.now()-(S.admin.at||0)>60000&&!S.admin.loading)setTimeout(loadAdmin,0);
const a=S.admin||{},st=a.status;
let body="";
if(a.loading&&!st)body=`<p class="muted">불러오는 중…</p>`;
else if(a.err&&!st)body=a.needVerify?admVerifyBox():admBox(esc(a.err));
else if(st){
const tot={},today=st.days[0]||{};st.days.forEach(d=>ADM_STATS.forEach(([k])=>tot[k]=(tot[k]||0)+(d[k]||0)));
const card=([k,l])=>`<div class="card" style="padding:14px 16px"><div class="muted" style="font-size:12.5px">${l}</div><div style="font-size:24px;font-weight:700;color:#0B1F55">${today[k]||0}</div><div class="muted" style="font-size:12px">14일 합계 ${tot[k]||0}</div></div>`;
const sec=([k,l,h,ty,ph])=>{const x=st.secrets[k]||{};const chip=x.set?`<span class="tag" style="background:#E8F5EC;color:#1F8A4C">설정됨 ${esc(x.hint)} · ${x.source==="dashboard"?"Cloudflare 대시보드":"관리자 화면"}</span>`:`<span class="tag" style="background:#FFF3E0;color:#B45309">없음</span>`;
const fld=ty==="area"?`<textarea class="inp" autocomplete="off" rows="4" placeholder="${esc(ph)}" style="flex:1;min-width:200px;font:12.5px var(--mono);resize:vertical" required></textarea>`:`<input class="inp" type="${ty}" autocomplete="off" placeholder="${esc(ph)}" style="flex:1;min-width:200px" required>`;
const edit=x.canEdit?`<form data-secret="${k}" class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px;align-items:flex-start">${fld}<button class="btn sm pri" type="submit">${x.set?"바꾸기":"저장"}</button>${x.source==="admin"?`<button class="btn sm danger" type="button" data-act="admDel" data-name="${k}">지우기</button>`:""}</form>`:`<p class="muted" style="font-size:12.5px;margin:10px 0 0">${x.set?"Cloudflare 대시보드에 넣은 값이 우선이라 여기서는 바꿀 수 없어요.":(k==="FIREBASE_CONFIG"?"Cloudflare 대시보드 → 설정 → 변수 및 비밀에 FIREBASE_CONFIG를 추가해 주세요.":"저장 공간(ADMIN_KV)이 연결되지 않았어요.")}</p>`;
return `<div class="card" style="padding:16px"><div class="row" style="gap:10px;flex-wrap:wrap"><b class="grow" style="min-width:140px">${l}<span class="muted" style="font-weight:400;font-size:12px"> · ${k}</span></b>${chip}</div><p class="muted" style="font-size:13px;margin:6px 0 0">${h}</p>${edit}</div>`;};
const rows=st.days.map(d=>`<tr><td>${d.date.slice(5)}</td>${ADM_STATS.map(([k])=>`<td>${d[k]||0}</td>`).join("")}</tr>`).join("");
body=`${st.kv?"":admBox("사용량 기록과 키 저장에 쓰는 ADMIN_KV가 연결되지 않았어요. wrangler.jsonc의 kv_namespaces를 확인해 주세요.")}
<h2 style="margin:6px 0 0;font-size:16px">오늘 사용량 <span class="muted" style="font-weight:400;font-size:12.5px">(한국 시간 기준)</span></h2>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">${ADM_STATS.map(card).join("")}</div>
<h2 style="margin:10px 0 0;font-size:16px">키와 설정</h2>
${ADM_SECRETS.map(sec).join("")}
<div class="row" style="gap:10px;flex-wrap:wrap;margin-top:10px"><h2 class="grow" style="margin:0;font-size:16px">연결한 API</h2><button class="btn sm pri" data-act="apiAdd">+ API 추가</button></div>
${S.apiForm?`<form data-apiform class="card" style="padding:16px;display:grid;gap:10px"><label class="f" for="apiP">어디서 받았나요<select class="inp" id="apiP" name="provider"><option>data.go.kr</option><option>Hugging Face</option><option>GitHub</option><option>Kaggle</option><option>기타</option></select></label><input class="inp" name="pother" maxlength="40" placeholder="제공처 이름 (기타일 때)" hidden><label class="f" for="apiN">이름<input class="inp" id="apiN" name="name" maxlength="40" autocomplete="off" placeholder="예: 기상청 단기예보" required></label><label class="f" for="apiK">API 키<input class="inp" id="apiK" name="key" type="password" autocomplete="new-password" placeholder="발급받은 인증키" required></label><label class="f" for="apiU">호출 주소 (선택)<input class="inp" id="apiU" name="url" type="url" placeholder="https://apis.data.go.kr/…"></label><label class="f" for="apiD">설명<textarea class="inp" id="apiD" name="desc" rows="2" maxlength="300" placeholder="어디에 쓰는 API인지 적어 두세요"></textarea></label><div class="row" style="gap:8px"><button class="btn pri sm" type="submit">저장</button><button class="btn sm" type="button" data-act="apiCancel">취소</button></div></form>`:""}
${(st.apis||[]).length?(st.apis).map(x=>`<div class="card" style="padding:14px 16px"><div class="row" style="gap:8px;flex-wrap:wrap"><b class="grow" style="min-width:140px">${esc(x.name)}</b><span class="tag">${esc(x.provider)}</span><span class="tag">키 ${esc(x.hint)}</span></div>${x.desc?`<p class="muted" style="font-size:13px;margin:6px 0 0">${esc(x.desc)}</p>`:""}${x.url?`<p class="muted" style="font-size:12px;margin:4px 0 0;overflow-wrap:anywhere">${esc(x.url)}</p>`:""}<div class="row" style="gap:8px;margin-top:10px">${x.url?`<button class="btn sm" data-act="apiTest" data-id="${x.id}">연결 테스트</button>`:""}<button class="btn sm danger" data-act="apiDel" data-id="${x.id}">지우기</button></div>${S.apiTest&&S.apiTest.id===x.id?`<p class="muted" style="font-size:12px;margin:8px 0 0;overflow-wrap:anywhere">${esc(S.apiTest.msg)}</p>`:""}</div>`).join(""):`<p class="muted" style="font-size:13px">아직 연결한 API가 없어요. 공공데이터포털(data.go.kr)이나 다른 곳에서 받은 키를 이름·설명과 함께 넣어 두세요. 키는 서버에만 저장되고 화면에는 끝 4자리만 보여요.</p>`}
<div class="card" style="padding:16px"><div class="row" style="gap:10px;flex-wrap:wrap"><div class="grow" style="min-width:200px"><b>테스트 메일</b><p class="muted" style="font-size:13px;margin:4px 0 0">내 이메일(${esc(st.email||ADMIN_MAIL)})로 테스트 메일을 보내요.</p></div><button class="btn sm" data-act="admTest" ${st.secrets.RESEND_API_KEY&&st.secrets.RESEND_API_KEY.set?"":"disabled"}>보내기</button></div></div>
<h2 style="margin:10px 0 0;font-size:16px">최근 14일</h2>
<div class="card" style="padding:6px 10px;overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px;white-space:nowrap"><thead><tr style="text-align:left;color:#64708A"><th style="padding:8px 6px;font-weight:600">날짜</th>${ADM_STATS.map(([,l])=>`<th style="padding:8px 6px;font-weight:600">${l}</th>`).join("")}</tr></thead><tbody class="admtb">${rows}</tbody></table></div>
<p class="muted" style="font-size:12.5px">접속은 앱을 열 때마다 1씩 올라가요(같은 사람이 여러 번 열면 여러 번 세요). 대화 내용은 서버에서 읽지 않아요. 유저 목록은 ‘유저 관리’에서 봐요.</p>`;
}
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:860px;display:grid;gap:14px">
<div class="row" style="flex-wrap:wrap;gap:10px"><div class="grow"><h1>관리자</h1><p class="muted" style="margin:0">${esc(ADMIN_MAIL)} · 키는 브라우저에 저장되지 않고 서버(Cloudflare KV)에만 저장돼요</p></div><button class="btn sm" data-act="admRefresh">새로고침</button></div>${admNav("admin")}${body}</div></div>`);}

/* ---------- /admin/user : 유저 관리 ---------- */
async function loadUsers(force){if(!isAdmin())return;const u=S.admUsers||(S.admUsers={list:null,loading:false,err:"",q:"",open:null});if(u.loading)return;if(u.list&&!force)return;u.loading=true;u.err="";try{const j=await admFetch("/api/admin/users");u.list=j.users;u.needSa=false;}catch(e){u.err=e.message;u.needSa=!!e.needSa;u.needVerify=!!e.needVerify;}u.loading=false;if(route()==="admin-user")render();}
function userStatus(x){const now=Date.now();if(x.banned)return{t:"영구 정지",c:"#B42318",bg:"#FDECEA"};if(x.bannedUntil>now){const m=Math.ceil((x.bannedUntil-now)/60000);return{t:"정지 · "+(m>=60?Math.floor(m/60)+"시간 "+(m%60)+"분":m+"분")+" 남음",c:"#B45309",bg:"#FFF3E0"};}if(x.disabled)return{t:"비활성",c:"#64708A",bg:"#EEF2F8"};return{t:"정상",c:"#1F8A4C",bg:"#E8F5EC"};}
function userRow(x){const s=userStatus(x),open=S.admUsers.open===x.uid,me=x.email.toLowerCase()===ADMIN_MAIL;
return `<div class="card" style="padding:12px 14px"><button data-act="admOpen" data-uid="${x.uid}" style="all:unset;cursor:pointer;display:grid;gap:4px;width:100%;box-sizing:border-box"><span class="row" style="gap:8px;flex-wrap:wrap"><b style="overflow-wrap:anywhere">${esc(x.email||x.uid)}</b>${me?'<span class="tag">관리자</span>':""}<span class="tag" style="background:${s.bg};color:${s.c}">${s.t}</span><span class="grow"></span><span class="tag">${esc(x.plan)}${x.planLocked?" · 고정":""}</span></span><span class="muted" style="font-size:12.5px">${esc(x.name||"이름 없음")} · ${esc(x.provider||"이메일")} · 가입 ${fmtD(x.created)} · 마지막 접속 ${fmtT(x.lastLogin)}${x.dailyLimit?" · 하루 한도 "+fmtN(x.dailyLimit):""}</span></button>${open&&!me?userPanel(x):open?'<p class="muted" style="font-size:13px;margin:10px 0 0">관리자 본인 계정은 여기서 바꿀 수 없어요.</p>':""}</div>`;}
function armBtn(act,uid,label,cls){return `<button class="btn sm ${cls||""}" data-act="admAct" data-do="${act}" data-uid="${uid}" data-label="${label}">${label}</button>`;}
function userPanel(x){const u=x.uid;
return `<div style="display:grid;gap:14px;margin-top:12px;padding-top:12px;border-top:1px solid #EEF2F8">
<div><b style="font-size:13.5px">정지</b>
<form data-ufrm="tempban" data-uid="${u}" class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><input class="inp" name="hours" type="number" min="1" max="8760" step="1" placeholder="시간" style="width:90px" required><input class="inp" name="reason" maxlength="100" placeholder="사유 (선택, 유저에게 보여요)" style="flex:1;min-width:160px"><button class="btn sm" type="submit">시간 정지</button></form>
<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">${armBtn("ban",u,"영구 추방","danger")}${armBtn("unban",u,"정지 풀기")}${armBtn("logout",u,"로그아웃시키기")}</div>
<p class="muted" style="font-size:12px;margin:6px 0 0">정지하면 로그인할 수 없고 열려 있는 로그인도 곧 끊겨요. 시간 정지는 끝나면 자동으로 풀려요(10분 안에).</p></div>
<div><b style="font-size:13.5px">요금제 · 사용량</b>
<form data-ufrm="plan" data-uid="${u}" class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><select class="inp" name="plan" style="min-width:140px"><option value="">유저 설정 따르기</option>${["Free","Pro","Max"].map(p=>`<option ${x.planLocked&&x.plan===p?"selected":""}>${p}</option>`).join("")}</select><button class="btn sm" type="submit">요금제 적용</button></form>
<form data-ufrm="limit" data-uid="${u}" class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><input class="inp" name="dailyLimit" type="number" min="0" step="1000" value="${x.dailyLimit||""}" placeholder="하루 토큰 한도 (비우면 요금제 기본)" style="flex:1;min-width:200px"><button class="btn sm" type="submit">한도 적용</button></form>
<p class="muted" style="font-size:12px;margin:6px 0 0">기본 한도: Free 80K · Pro 600K · Max 4M (하루). 값을 바꾸면 유저가 앱을 열거나 탭으로 돌아올 때(최대 5분) 반영돼요.</p></div></div>`;}
function userList(){const u=S.admUsers,q=(u.q||"").trim().toLowerCase();const l=(u.list||[]).filter(x=>!q||x.email.toLowerCase().includes(q)||(x.name||"").toLowerCase().includes(q)||x.uid.startsWith(q));return l.length?l.map(userRow).join(""):`<p class="muted">${u.list&&u.list.length?"찾는 유저가 없어요.":"아직 가입한 유저가 없어요."}</p>`;}
function vAdminUser(){
if(!isAdmin())return admDeny();
const u=S.admUsers||(S.admUsers={list:null,loading:false,err:"",q:"",open:null});
if(!u.list&&!u.loading&&!u.err)setTimeout(()=>loadUsers(),0);
let body="";
if(u.loading&&!u.list)body=`<p class="muted">불러오는 중…</p>`;
else if(u.err&&!u.list)body=(u.needVerify?admVerifyBox():admBox(esc(u.err)))+(u.needSa?`<div class="row"><button class="btn pri" data-go="admin">키 넣으러 가기</button></div>`:"");
else if(!u.list)body=`<p class="muted">불러오는 중…</p>`;
else{const n=u.list.length,ban=u.list.filter(x=>x.banned||x.bannedUntil>Date.now()).length;
body=`<div class="row" style="gap:10px;flex-wrap:wrap"><input class="inp" id="admQ" type="search" placeholder="이메일·이름 검색" value="${esc(u.q||"")}" style="flex:1;min-width:200px"><span class="muted" style="font-size:13px">전체 ${n}명 · 정지 ${ban}명</span><button class="btn sm" data-act="admUsersRefresh">새로고침</button></div><div id="admList" style="display:grid;gap:10px">${userList()}</div><p class="muted" style="font-size:12.5px">유저의 대화 내용은 이 화면에서 볼 수 없어요. 목록에는 이메일, 이름, 요금제, 접속 기록만 나와요. 유저는 최대 600명까지 보여요.</p>`;}
return shell(`${topbar("")}<div class="scroll"><div class="wrap page" style="max-width:860px;display:grid;gap:14px">
<div class="row" style="flex-wrap:wrap;gap:10px"><div class="grow"><h1>유저 관리</h1><p class="muted" style="margin:0">정지 · 추방 · 요금제 · 사용량 한도</p></div></div>${admNav("admin-user")}${body}</div></div>`);}

/* ---------- 관리자 화면의 클릭·제출 ---------- */
let admArm=null;
document.addEventListener("click",async e=>{const t=e.target.closest("[data-act]");if(!t)return;const d=t.dataset;
switch(d.act){
case"admVerifySend":try{await S.fb.auth.currentUser.sendEmailVerification();toast("인증 메일을 보냈어요");}catch(er){toast("잠시 뒤에 다시 시도해 주세요");}break;
case"admVerifyDone":try{await S.fb.auth.currentUser.reload();await S.fb.auth.currentUser.getIdToken(true);S.admin=null;S.admUsers=null;render();}catch(er){toast("확인하지 못했어요");}break;
case"apiAdd":S.apiForm=true;render();break;
case"apiCancel":S.apiForm=false;render();break;
case"apiDel":try{await admFetch("/api/admin/api/delete","POST",{id:d.id});toast("지웠어요");S.admin=null;loadAdmin();}catch(er){toast(er.message);}break;
case"apiTest":try{t.disabled=true;const j=await admFetch("/api/admin/api/test","POST",{id:d.id});S.apiTest={id:d.id,msg:(j.ok?"연결됐어요 (":"응답이 이상해요 (")+j.status+") "+j.sample};}catch(er){S.apiTest={id:d.id,msg:er.message};}render();break;
case"admRefresh":S.admin=null;loadAdmin();render();break;
case"admDel":try{await admFetch("/api/admin/secret/delete","POST",{name:d.name});toast("지웠어요");S.admin=null;loadAdmin();}catch(er){toast(er.message);}break;
case"admTest":try{t.disabled=true;await admFetch("/api/admin/test-mail","POST",{});toast("테스트 메일을 보냈어요. 받은편지함을 확인해 주세요");S.admin=null;loadAdmin();}catch(er){toast(er.message);}t.disabled=false;break;
case"admUsersRefresh":S.admUsers.list=null;S.admUsers.err="";loadUsers(true);render();break;
case"admOpen":{const u=S.admUsers;u.open=u.open===d.uid?null:d.uid;render();break;}
case"admAct":{ // 위험한 작업은 두 번 눌러야 실행돼요
if(d.do==="unban"){await admUserDo({uid:d.uid,action:"unban"},t);break;}
const key=d.do+d.uid;
if(admArm!==key){admArm=key;const o=t.textContent;t.textContent="한 번 더 누르면 실행";setTimeout(()=>{if(admArm===key){admArm=null;if(t.isConnected)t.textContent=d.label;}},4000);break;}
admArm=null;await admUserDo({uid:d.uid,action:d.do},t);break;}
}});
document.addEventListener("input",e=>{if(e.target.id==="admQ"){S.admUsers.q=e.target.value;const l=document.getElementById("admList");if(l)l.innerHTML=userList();}});
const API_PRESET={"data.go.kr":{n:"예: 기상청 단기예보",k:"발급받은 인증키(서비스키)",u:"https://apis.data.go.kr/…"},"Hugging Face":{n:"예: HF 토큰 (모델 내려받기)",k:"hf_로 시작하는 토큰",u:"https://huggingface.co/api/whoami-v2",d:"Hugging Face 모델·데이터셋 접근용 토큰"},GitHub:{n:"예: GitHub 토큰",k:"ghp_ 또는 github_pat_ 로 시작하는 토큰",u:"https://api.github.com/user",d:"GitHub 저장소 접근용 토큰"},Kaggle:{n:"예: Kaggle API 키",k:"Kaggle API 키(KGAT_… 또는 키 문자열)",u:"",d:"Kaggle 노트북·데이터셋 접근용 키"},"기타":{n:"예: 내 API",k:"API 키 또는 토큰",u:"https://…"}};
document.addEventListener("change",e=>{if(e.target.id==="apiP"){const f=e.target.form,v=e.target.value,o=f.querySelector("[name=pother]"),P=API_PRESET[v]||{};o.hidden=v!=="기타";if(!o.hidden)o.focus();f.name.placeholder=P.n||"";f.key.placeholder=P.k||"";f.url.placeholder=P.u||"https://…";if(!f.url.value||Object.values(API_PRESET).some(x=>x.u===f.url.value))f.url.value=(v==="data.go.kr"||v==="기타")?"":(P.u||"");if(!f.desc.value||Object.values(API_PRESET).some(x=>x.d===f.desc.value))f.desc.value=P.d||"";}});
document.addEventListener("submit",async e=>{const f=e.target;
if(f.hasAttribute&&f.hasAttribute("data-apiform")){e.preventDefault();e.stopImmediatePropagation();const fd=Object.fromEntries(new FormData(f)),btn=f.querySelector("button[type=submit]");const provider=fd.provider==="기타"?(fd.pother||"기타"):fd.provider;btn.disabled=true;try{await admFetch("/api/admin/api","POST",{provider,name:fd.name,key:fd.key,desc:fd.desc,url:fd.url});toast("API를 추가했어요");S.apiForm=false;S.admin=null;loadAdmin();}catch(er){toast(er.message);btn.disabled=false;}return;}
if(f.dataset&&f.dataset.secret){e.preventDefault();e.stopImmediatePropagation();const inp=f.querySelector("input,textarea"),btn=f.querySelector("button[type=submit]");btn.disabled=true;try{await admFetch("/api/admin/secret","POST",{name:f.dataset.secret,value:inp.value});toast("저장했어요");S.admin=null;S.admUsers=null;loadAdmin();if(S.fb){const r=await fetch("/api/config",{cache:"no-store"});if(r.ok)S.api=await r.json();}render();}catch(er){toast(er.message);btn.disabled=false;}return;}
if(f.dataset&&f.dataset.ufrm){e.preventDefault();e.stopImmediatePropagation();const fd=Object.fromEntries(new FormData(f)),a=f.dataset.ufrm;
const body={uid:f.dataset.uid,action:a};if(a==="tempban"){body.hours=Number(fd.hours);body.reason=fd.reason;}else if(a==="plan")body.plan=fd.plan;else body.dailyLimit=Number(fd.dailyLimit||0);
await admUserDo(body,f.querySelector("button[type=submit]"));}
},true);
async function admUserDo(body,btn){if(btn)btn.disabled=true;try{await admFetch("/api/admin/users/action","POST",body);toast({ban:"추방했어요",tempban:"정지했어요",unban:"정지를 풀었어요",plan:"요금제를 바꿨어요",limit:"한도를 바꿨어요",logout:"로그아웃시켰어요"}[body.action]||"처리했어요");S.admUsers.list=null;S.admUsers.err="";await loadUsers(true);}catch(er){toast(er.message);}if(btn&&btn.isConnected)btn.disabled=false;}
