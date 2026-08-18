@echo off
title Relief WhatsApp Bot
cd /d "%~dp0.."
cd whatsapp-bot

REM If a bot is already listening on 8080 it is almost certainly a healthy
REM one from an earlier launch. Starting a second copy just crashes with
REM EADDRINUSE and looks like a real failure, so say so plainly instead.
netstat -ano | findstr /r /c:"TCP.*:8080 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo.
    echo  ============================================================
    echo   The WhatsApp bot is ALREADY RUNNING on port 8080.
    echo.
    echo   Nothing is wrong - you can use it right now.
    echo   Look for its other window, titled "Relief WhatsApp Bot".
    echo.
    echo   To restart it instead, close that window first, then run
    echo   this again.
    echo  ============================================================
    echo.
    pause
    exit /b 0
)

echo Starting WhatsApp bot...
echo Look for:  [wa] ready as 91...
echo.
call npm start
echo.
echo Bot stopped. Press any key to close.
pause >nul
