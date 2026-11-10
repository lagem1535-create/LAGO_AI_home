@echo off
chcp 65001 >nul
where node >nul 2>nul || (echo Node.js 18 이상이 필요해요: https://nodejs.org & exit /b 1)
node "%~dp0lago.js" %*
