# LAGO Desktop (Rust · Tauri)

LAGO 웹앱을 창으로 열고, 웹에서는 못 하는 일(작업 폴더 · 터미널 · 파일 저장 · 업데이트)을 더해 주는 Windows · Mac 앱이에요.
0.4.0부터 Electron(`EXE/`, 0.3.x) 대신 이 Rust 판을 빌드해요. 시스템에 있는 웹뷰(WebView2 · WKWebView)를 써서 설치 파일이 훨씬 작고 빨리 켜져요.

| 파일 | 하는 일 |
| --- | --- |
| `src/main.rs` | 창, 작업 폴더 읽기 · 명령 실행 · 파일 저장, 업데이트 내려받기(SHA-256 확인) |
| `ui/index.html` | 켤 때 연결 확인 → LAGO 화면으로 이동, 안 되면 "다시 시도" 안내 |
| `capabilities/main.json` | LAGO 주소에서 열린 화면만 데스크톱 기능을 부를 수 있게 하는 허용 목록 |
| `windows/hooks.nsh` | 설치할 때 예전 Electron 판이 있으면 먼저 지워요 |

## 안전 장치 (Electron 판과 같아요)

- LAGO 주소에서 열린 화면만 `window.lagoDesktop` 을 쓸 수 있어요. 다른 사이트는 기본 브라우저로 열려요.
- 고른 작업 폴더 밖의 경로는 읽기 · 쓰기 · 실행 모두 막아요 (`..`, 링크 포함).
- 명령 실행과 파일 저장은 매번 확인 창에서 허락해야 해요.
- 명령은 5분이 지나면 멈추고, 출력은 200KB까지만 보여요.

## 직접 빌드하기

Rust(https://rustup.rs)와 Node가 필요해요.

```bash
cd RUST
npx @tauri-apps/cli@2 dev                    # 개발용으로 바로 실행
npx @tauri-apps/cli@2 build --bundles nsis   # Windows 설치 파일 → target/release/bundle/nsis/
npx @tauri-apps/cli@2 build --bundles dmg    # Mac dmg
```

버전은 `tauri.conf.json` 과 `Cargo.toml` 두 곳을 같이 올려요. main에 올리면 GitHub Actions가 Release(`app-v<버전>`)를 만들어요.
