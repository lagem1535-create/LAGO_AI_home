# LAGO CLI (터미널용)

CMD · PowerShell · 맥/리눅스 터미널에서 `lago` 명령으로 LAGO를 써요.

## 깔기

- **Windows (Node 없이)**: Releases에서 `lago.exe`를 받아 PATH에 있는 폴더에 두면 끝이에요.
- **Windows (Node 18+)**: `lago-cli.zip`을 풀고 `install.cmd`를 더블클릭 → 새 CMD 창에서 `lago`.
- **맥 · 리눅스 (Node 18+)**: `lago-cli.zip`을 풀고 `sh install.sh`.

## 쓰기

```bash
lago login                      # 이메일 · 비밀번호
lago login --code <연결 코드>   # Google로 가입한 계정: 사이트 ‘앱 받기’에서 코드 복사
lago "독도는 어디에 있어?"      # 한 번 묻기
lago                            # 대화 (/help, /exit)
lago code "app.py 버그 고쳐 줘" # 지금 폴더의 파일을 보고 코드 쓰기
type 글.txt | lago "요약해 줘"  # 파이프 (맥: cat 글.txt | lago ...)
```

대화 중에는 `/save 번호 파일이름`으로 답의 코드 블록을 저장하고, `/run 번호`로 명령 블록을 실행해요(실행 전에 y/N을 물어요).
저장은 지금 폴더 안에만 해요.

로그인 정보는 `~/.lago/config.json`에 있어요. `lago logout`으로 지워요. 로그인하지 않으면 위키백과에서 찾은 내용만 보여 줘요.

## 지우기

```
lago uninstall        (묻지 않고 지우려면 lago uninstall -y)
```

로그인 정보(`~/.lago`), 설치 파일, Windows의 PATH 항목까지 지워요. `lago.exe`는 창을 닫은 뒤 스스로 사라져요.
명령이 안 되면 압축 안의 `uninstall.cmd`(Windows) 또는 `uninstall.sh`(맥 · 리눅스)를 실행해도 돼요.
