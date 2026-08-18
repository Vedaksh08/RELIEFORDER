@echo off
REM ===================================================================
REM  Relief Medical - start everything
REM  Double-click this file. Two windows open and must stay open.
REM ===================================================================

cd /d "%~dp0"

echo.
echo  Starting Relief Medical...
echo.

REM Each service gets its own tiny launcher script. Passing a cd + npm
REM chain inline to "start ... cmd /k" needs escaping that cmd handles
REM inconsistently, and the window silently fails to open. Separate .bat
REM files avoid the quoting problem completely.

start "Relief WhatsApp Bot" cmd /k "%~dp0scripts\run-bot.bat"

REM give the bot a head start so its log is readable
timeout /t 3 /nobreak >nul

start "Relief Website" cmd /k "%~dp0scripts\run-web.bat"

REM wait for Vite to bind the port before opening the browser
timeout /t 10 /nobreak >nul

start http://localhost:3000/ADMIN

echo.
echo  ==============================================================
echo   Website:  http://localhost:3000
echo   Admin:    http://localhost:3000/ADMIN   (SYSTEM / SYSTEM)
echo.
echo   TWO windows opened - keep BOTH open.
echo   In the bot window look for:  [wa] ready as 91...
echo   The bot takes ~30s to connect (it starts a browser internally).
echo   Closing a window stops that part.
echo  ==============================================================
echo.
pause
