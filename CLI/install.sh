#!/bin/sh
# 맥 · 리눅스: LAGO CLI를 ~/.local/bin/lago 로 깔아요. (Node 18 이상 필요)
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HOME/.local/bin"
cp "$DIR/lago.js" "$HOME/.local/bin/lago"
chmod +x "$HOME/.local/bin/lago"
echo "설치했어요: $HOME/.local/bin/lago"
case ":$PATH:" in *":$HOME/.local/bin:"*) ;; *) echo 'PATH에 넣어 주세요:  export PATH="$HOME/.local/bin:$PATH"' ;; esac
