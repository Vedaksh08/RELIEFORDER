@echo off
title Relief WhatsApp Bot
cd /d "%~dp0.."
cd whatsapp-bot
echo Starting WhatsApp bot...
echo Look for:  [wa] ready as 91...
echo.
call npm start
echo.
echo Bot stopped. Press any key to close.
pause >nul
