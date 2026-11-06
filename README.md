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
