# LAGO AI — 홈

LAGO AI 앱 화면과, 그 화면을 내보내는 Cloudflare Worker예요.

```
public/index.html   앱 전체 (로그인 · 대화 · 코드 · 프로젝트 · 에이전트 · 요금제 · 사용량 · 설정 · 보호자 · 아이 계정)
public/brand.html   로그인 화면용 3D 브랜드 애니메이션
src/worker.js       /api/* 처리 (위키백과 · 공공데이터 · Firebase 설정)
wrangler.jsonc      Worker 설정 (이름: lago-ai-home)
```

## 시크릿 넣기

키는 코드나 깃에 넣지 않고 **Cloudflare 시크릿**으로 넣어요.

| 이름 | 값 |
|---|---|
| `FIREBASE_CONFIG` | Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹)의 설정을 **JSON 한 줄**로. 예: `{"apiKey":"AIza...","authDomain":"x.firebaseapp.com","projectId":"x","appId":"1:..."}` |
| `DATA_GO_KR_KEY` | data.go.kr 마이페이지 → 일반 인증키 **(Decoding)** |

넣는 방법 (둘 중 하나):
- 대시보드: Workers & Pages → `lago-ai-home` → 설정 → 변수 및 비밀 → 추가 → 유형 **비밀(Secret)**
- 터미널: `npx wrangler secret put FIREBASE_CONFIG`, `npx wrangler secret put DATA_GO_KR_KEY`

로컬 테스트: `.dev.vars.example`을 `.dev.vars`로 복사해 값을 채우고 `npx wrangler dev`.

## API

| 주소 | 설명 |
|---|---|
| `GET /api/config` | Firebase 웹 설정과 연결 상태. (Firebase 웹 설정은 원래 공개되는 값이에요. 보안은 Firebase 보안 규칙으로 지켜요.) |
| `GET /api/wiki?q=훈민정음` | 한국어 위키백과에서 찾아 요약 2개 (키 필요 없음) |
| `GET /api/holidays?year=2026&month=12` | 공공데이터 예시 — 한국천문연구원 특일 정보(공휴일). data.go.kr에서 이 API를 **활용신청**해야 해요. 키는 Worker 안에서만 써요. |

앱에서는 대화(FACT · 빠른 생각 · THINK)에 질문하면 위키백과에서 찾아 출처 카드와 함께 답하고, "12월 공휴일 알려 줘"처럼 물으면 공공데이터를 불러와요. 서버 연결 상태는 설정 → 일반 → 서버 연결에서 볼 수 있어요.

모델: Fonte 1.0 (FACT) · Torrente 1.0 (빠른 생각) · Mare 1.0 (THINK) · Code Spruzzo 1.0 · Code Corrente 1.0
일정: Beta 12/20 · 공개 12/31
