# LAGO Desktop (Windows EXE)

LAGO 웹앱(https://lago-ai-home.lagem1535.workers.dev)을 창으로 열고, 웹에서는 못 하는 일을 더해 주는 Windows 앱이에요.

## EXE에서만 되는 기능

| 기능 | 설명 |
| --- | --- |
| 작업 폴더 | 내 컴퓨터 폴더를 열면 CODE가 그 안의 파일 목록·내용을 보고 답해요. 다음에 켜도 기억해요. |
| 터미널 | `npm`, `python`, `git` 같은 명령을 그 폴더에서 실제로 실행해요. |
| 코드 실행 | 답에 나온 `bash`/`powershell` 코드 블록 위의 **실행** 버튼으로 바로 실행해요. |
| 파일로 저장 | 답에 나온 코드 블록을 **파일로 저장** 버튼으로 폴더에 저장해요. |

웹에서도 작업 폴더를 **읽기 전용**으로 열 수 있고, 터미널은 `ls · cd · cat · tree · find · grep` 같은 읽기 명령만 돼요.

## 안전 장치

- LAGO 주소에서 열린 페이지만 데스크톱 기능을 쓸 수 있어요 (다른 사이트는 기본 브라우저로 열려요).
- 고른 작업 폴더 **밖**의 경로는 읽기·쓰기·실행 모두 막아요 (`..`, 링크 포함).
- 명령 실행과 파일 저장은 **매번 Windows 확인 창**에서 허락해야 해요. 페이지가 이 확인을 건너뛸 수 없어요.
- 명령은 5분이 지나면 멈추고, 출력은 200KB까지만 보여요.

## 받기

[Releases](https://github.com/lagem1535-create/lago_ai_home/releases/latest)에서 받아요.

- `LAGO-Windows-<버전>.zip` — 압축을 풀고 `LAGO.exe`를 실행해요.
- `LAGO-Setup-<버전>.exe` / `LAGO-Portable-<버전>.exe` — GitHub Actions(`LAGO Desktop EXE`)가 Windows에서 만든 설치 파일이에요.

서명되지 않은 앱이라 처음 실행할 때 Windows SmartScreen이 경고할 수 있어요. **추가 정보 → 실행**을 누르면 돼요.

## 직접 빌드하기

```bash
cd EXE
npm install
npm start          # 개발용으로 바로 실행
npm run dist       # Windows에서: 설치 파일(nsis) + 포터블 exe → EXE/dist/
```

다른 주소(예: 로컬 개발 서버)로 열려면 `LAGO_URL=http://localhost:8787 npm start`.

## GitHub Actions로 만들기

`.github/workflows/exe.yml`이 `desktop-v*` 태그를 올리면 Windows에서 EXE를 만들어 Release에 붙여요.

```bash
git tag desktop-v0.1.0 && git push origin desktop-v0.1.0
```

Actions 탭에서 **Run workflow**로 직접 돌릴 수도 있어요 (결과는 Artifacts에 올라가요).
