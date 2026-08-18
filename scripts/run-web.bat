@echo off
title Relief Website
cd /d "%~dp0.."
echo Starting website on http://localhost:3000 ...
echo.
call npm run dev
echo.
echo Website stopped. Press any key to close.
pause >nul
