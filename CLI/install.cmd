@echo off
chcp 65001 >nul
rem LAGO CLI를 %LOCALAPPDATA%\LAGO\cli 에 복사하고 PATH에 넣어요. 새 CMD 창에서 lago 를 입력하면 돼요.
set "DEST=%LOCALAPPDATA%\LAGO\cli"
if not exist "%DEST%" mkdir "%DEST%"
copy /y "%~dp0lago.js" "%DEST%\" >nul
copy /y "%~dp0lago.cmd" "%DEST%\" >nul
if exist "%~dp0lago.exe" copy /y "%~dp0lago.exe" "%DEST%\" >nul
powershell -NoProfile -Command "$d=$env:LOCALAPPDATA+'\LAGO\cli';$p=[Environment]::GetEnvironmentVariable('Path','User');if(-not $p){$p=''};if(($p -split ';') -notcontains $d){[Environment]::SetEnvironmentVariable('Path',($p.TrimEnd(';')+';'+$d).TrimStart(';'),'User')}"
echo 설치했어요: %DEST%
echo 새 CMD 창을 열고  lago  를 입력해 보세요.
pause
