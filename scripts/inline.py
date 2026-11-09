#!/usr/bin/env python3
"""public/ 의 화면 파일을 한 파일로 합쳐요(미리보기·공유용). 주소는 #chat 처럼 # 방식으로 동작해요.
사용: python3 scripts/inline.py 출력파일.html"""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / "public"
html = (root / "index.html").read_text()
css = (root / "assets/app.css").read_text()
js = (root / "assets/en.js").read_text() + "\n" + (root / "assets/admin.js").read_text() + "\n" + (root / "assets/app.js").read_text()
html = html.replace('<meta name="lago-router" content="path">\n', "")
html = html.replace('<link rel="stylesheet" href="/assets/app.css">', "<style>\n" + css + "</style>")
html = re.sub(r'<script defer src="/assets/[a-z]+\.js"></script>\n?', "", html)
html = html.replace("</body>", "<script>\n" + js + "</script>\n</body>")
pathlib.Path(sys.argv[1]).write_text(html)
