# LAGO AI — 홈

LAGO AI 앱 화면과, 그 화면을 내보내는 Cloudflare Worker예요.

```
public/index.html   앱 전체 (로그인 · 대화 · 코드 · 프로젝트 · 에이전트 · 요금제 · 사용량 · 설정 · 보호자 · 아이 계정)
src/worker.js       /api/* 처리 (위키백과 · 공공데이터 · Firebase 설정)
wrangler.jsonc      Worker 설정 (이름: lago-ai-home)
```

## 시크릿 넣기

키는 코드나 깃에 넣지 않고 **Cloudflare 시크릿**으로 넣어요.

| 이름 | 값 |
|---|---|
| `FIREBASE_CONFIG` | Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹)의 설정을 **JSON 한 줄**로. 예: `{"apiKey":"AIza...","authDomain":"x.firebaseapp.com","projectId":"x","appId":"1:..."}` |
| `DATA_GO_KR_KEY` | data.go.kr 마이페이지 → 일반 인증키 **(Decoding)** |
| `RESEND_API_KEY` | (선택) resend.com API 키. 아이의 시간 요청을 보호자 이메일로 보낼 때 써요 |
| `MAIL_FROM` | (선택) 보내는 사람. 비우면 `LAGO <onboarding@resend.dev>` (이 주소는 Resend 가입 이메일로만 보낼 수 있어요) |

넣는 방법 (둘 중 하나):
- 대시보드: Workers & Pages → `lago-ai-home` → 설정 → 변수 및 비밀 → 추가 → 유형 **비밀(Secret)**
- 터미널: `npx wrangler secret put FIREBASE_CONFIG`, `npx wrangler secret put DATA_GO_KR_KEY`

로컬 테스트: `.dev.vars.example`을 `.dev.vars`로 복사해 값을 채우고 `npx wrangler dev`.

## API

| 주소 | 설명 |
|---|---|
| `GET /api/config` | Firebase 웹 설정과 연결 상태. (Firebase 웹 설정은 원래 공개되는 값이에요. 보안은 Firebase 보안 규칙으로 지켜요.) |
| `GET /api/wiki?q=훈민정음` | 한국어 위키백과에서 찾아 요약 2개 (키 필요 없음) |
| `POST /api/notify` | 아이의 시간 요청을 **로그인한 본인 이메일(구글 이메일)**로 보내요. Firebase 로그인 토큰을 확인하고, 토큰의 이메일에게만 보내서 스팸 통로로 쓸 수 없어요. 이메일 인증이 끝난 계정만 받아요. |
| `POST /api/kid-consent` | 아이 계정(14세 미만)을 만들 때 **보호자 이메일**로 동의 요청 메일을 보내요. 메일 내용은 서버에 고정돼 있고, 같은 사이트에서만 호출할 수 있어요. IP당 시간당 5회·받는 사람당 시간당 1회로 제한해요(메모리 방식이라 완벽하지 않아요. 공개 전에 Cloudflare Turnstile을 붙이길 권해요). `RESEND_API_KEY`가 필요하고, `MAIL_FROM` 도메인을 인증하기 전에는 Resend 계정 주인 이메일로만 가요. |
| `GET /api/holidays?year=2026&month=12` | 공공데이터 예시 — 한국천문연구원 특일 정보(공휴일). data.go.kr에서 이 API를 **활용신청**해야 해요. 키는 Worker 안에서만 써요. |

앱에서는 대화(FACT · 빠른 생각 · THINK)에 질문하면 위키백과에서 찾아 출처 카드와 함께 답하고, "12월 공휴일 알려 줘"처럼 물으면 공공데이터를 불러와요. 서버 연결 상태는 설정 → 일반 → 서버 연결에서 볼 수 있어요.

모델: Fonte 1.0 (FACT) · Torrente 1.0 (빠른 생각) · Mare 1.0 (THINK) · Code Spruzzo 1.0 · Code Corrente 1.0
일정: Beta 12/20 · 공개 12/31

## Firebase (로그인 · 저장)

- 로그인: Firebase Authentication — 이메일/비밀번호, Google
- 저장: Cloud Firestore — `users/{uid}/data/main` 문서 하나에 대화·프로젝트·에이전트·설정을 저장
- Firestore 규칙(자기 데이터만):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
- `FIREBASE_CONFIG` 시크릿이 없으면 예전처럼 브라우저 저장소(예시 모드)로 동작해요.


## 관리자 페이지 (`/#admin`)

- `lagem1535@gmail.com`(Firebase 로그인 + 이메일 인증된 계정)으로 로그인하면 계정 메뉴에 **관리자**가 보여요. 다른 이메일로 바꾸려면 시크릿 `ADMIN_EMAIL`을 넣어요.
- 서버가 매 요청마다 Firebase 토큰을 확인해서 관리자가 아니면 403이에요(화면에서 숨기는 것만이 아니에요).
- 여기서 `RESEND_API_KEY`, `MAIL_FROM`, `DATA_GO_KR_KEY`를 넣고 지울 수 있어요. 값은 Workers KV(`ADMIN_KV`)에 저장되고 브라우저로는 마지막 4글자만 내려가요. Cloudflare 대시보드 시크릿이 있으면 그쪽이 우선이에요.
- `FIREBASE_CONFIG`는 로그인 확인에 쓰여서 대시보드에서만 넣어요.
- 사용량(접속, 위키, 공휴일, 아이 가입 요청, 알림, 메일 성공/실패)을 하루 단위로 세어 최근 14일을 보여줘요. 60일 지나면 지워져요. 개인정보(가입자·대화)는 세지 않아요.
- KV 숫자는 동시에 들어오면 조금 틀릴 수 있어서 대략적인 값이에요.


## 주소와 폴더 구조

```
public/
  index.html            /            (홈)
  chat/index.html       /chat        (대화) · /chat/<대화번호> 는 같은 화면이 열려요
  admin/index.html      /admin       (관리자: 키·사용량)
  admin/user/index.html /admin/user  (유저 관리)
  assets/app.css        화면 모양
  assets/app.js         앱 본체 (대화, 설정, 로그인 …)
  assets/admin.js       관리자 화면 (/admin, /admin/user)
src/worker.js           서버 (/api/*)
scripts/inline.py       화면을 한 파일로 합쳐요 (미리보기용, # 주소 방식)
```

- 그 밖의 주소(`/usage`, `/plans`, `/prefs` …)는 `index.html`이 열리고 앱이 주소를 보고 화면을 골라요. 로그인하지 않고 `/chat/abc` 같은 주소로 들어오면 로그인 뒤에 그 주소로 돌아가요.
- 폴더의 `index.html`은 모두 같은 내용이에요(주소를 예쁘게 만들기 위한 것). 고치려면 네 파일을 같이 고쳐요.

## 유저 관리 (`/admin/user`)

- 필요: 시크릿 `FIREBASE_SERVICE_ACCOUNT` (Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성 → JSON 전체). 관리자 화면 → 키와 설정에서 넣거나 Cloudflare 대시보드 시크릿으로 넣어요.
- 기능: 유저 목록·검색, **영구 추방**, **시간 정지**(N시간), 정지 풀기, 로그아웃시키기, 요금제 바꾸기(Free/Pro/Max), 하루 토큰 한도 바꾸기.
- 정지는 Firebase 계정을 비활성화해서 로그인 자체를 막고, 시간 정지는 10분마다 도는 크론(`wrangler.jsonc`의 `triggers.crons`)이 끝난 계정을 다시 열어요.
- 정지·요금제·한도는 Firestore의 `mod/{uid}` 문서에 저장돼요. 이 문서는 서비스 계정만 쓸 수 있어서 유저가 스스로 바꿀 수 없어요. 앱은 열릴 때와 5분마다 `GET /api/me`로 이 값을 받아 와요.
- 대화 내용은 읽지 않아요. 목록에는 이메일·이름·요금제·접속 기록만 나와요.
- 관리자는 `ADMIN_EMAIL`(기본 `lagem1535@gmail.com`)이에요. 구글 로그인이든 이메일·비밀번호 로그인이든 **이메일 인증이 끝난** 계정만 인정해요.
- 한계: 지금 AI 답은 미리보기라 서버에서 사용량을 세지 않아요. 한도는 화면에 반영되고, 실제 AI 서버를 붙일 때 `mod/{uid}`를 서버에서 확인해야 해요.


## 베타 전에 실제로 되는 것 / 베타 때 열리는 것

| 기능 | 지금 |
| --- | --- |
| 대화 | 위키백과 · 공공데이터(공휴일)로 찾아서 답해요. 모델이 없어서 말을 새로 만들지는 않아요. |
| 글자 뽑기 | 이 브라우저에서 PDF · DOCX · 텍스트 · 이미지(OCR)를 읽어요. 서버로 보내지 않아요. |
| 문서 요약 | 중요한 문장을 골라 보여 줘요(핵심 문장 추출). 문장을 새로 쓰는 AI 요약은 베타. |
| 예약 작업 | `POST /api/tasks/sync`로 저장 → 5분마다 도는 크론이 시간이 된 작업을 실행 → 위키/공휴일 답을 본인(이메일 인증됨)에게 메일. `FIREBASE_SERVICE_ACCOUNT` + `RESEND_API_KEY` 필요. |
| 요금제 | 서버(관리자)가 정해요. 유저가 스스로 올릴 수 없어요. 결제는 아직 없어요. |
| 번역 · 코드 · 에이전트 답 · 서비스 연결(MCP) | 모델/연결이 필요해서 베타 이후에 열려요. 화면에는 닫혀 있다고 표시해요. |

## 모델 서버 (llama.cpp llama-server)
- 주소: 관리자 화면 → "모델 서버 (llama.cpp)"에서 저장 → KV `config:llama_url` (터널 주소가 바뀔 때마다 여기서 변경)
- 키: Worker Secret `LLAMA_API_KEY` (Cloudflare 대시보드 또는 관리자 화면의 키와 설정)
- 질문: Worker `/api/chat` → `POST {주소}/v1/chat/completions` (Bearer 키, stream:false, max_tokens:300), 상태: `GET {주소}/health`
- 브라우저는 주소·키를 모릅니다. 두 값이 있으면 예전 캐글 방식(MODEL_URL)보다 먼저 씁니다.
