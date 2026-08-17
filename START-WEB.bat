@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================
echo   GUILD MANAGER - BANG CHIEN PLANNER
echo ==========================================
echo.
echo Mo website tai: http://localhost:3000
echo Nhan Ctrl+C de dung server.
echo.
py -m http.server 3000
if errorlevel 1 python -m http.server 3000
pause
