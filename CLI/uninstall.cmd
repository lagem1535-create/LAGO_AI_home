@echo off
chcp 65001 >nul
rem LAGO CLI 지우기: 설치 폴더 · 로그인 정보 · PATH 항목을 지워요.
set "DEST=%LOCALAPPDATA%\LAGO\cli"
powershell -NoProfile -Command "$d=$env:LOCALAPPDATA+'\LAGO\cli';$p=[Environment]::GetEnvironmentVariable('Path','User');if($p){[Environment]::SetEnvironmentVariable('Path',((($p -split ';')|Where-Object{$_ -and $_ -ne $d}) -join ';'),'User')}"
if exist "%DEST%" rmdir /s /q "%DEST%"
if exist "%USERPROFILE%\.lago" rmdir /s /q "%USERPROFILE%\.lago"
echo 지웠어요. 새 CMD 창부터 lago 명령이 없어져요.
pause
