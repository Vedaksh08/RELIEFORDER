@echo off
title Relief Website
cd /d "%~dp0.."

REM Same guard as the bot: vite has strictPort set, so a second copy dies
REM with a port error rather than quietly moving to 3001.
netstat -ano | findstr /r /c:"TCP.*:3000 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo.
    echo  ============================================================
    echo   The website is ALREADY RUNNING on port 3000.
    echo.
    echo   Nothing is wrong - open http://localhost:3000/ADMIN
    echo   Look for its other window, titled "Relief Website".
    echo.
    echo   To restart it instead, close that window first, then run
    echo   this again.
    echo  ============================================================
    echo.
    pause
    exit /b 0
)

echo Starting website on http://localhost:3000 ...
echo.
call npm run dev
echo.
echo Website stopped. Press any key to close.
pause >nul
