@echo off
REM Pulls the official Open-Historia repo's newest work into your modified copy.
REM Safe: your changes are committed first, and conflicts stop the script
REM instead of overwriting anything.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0update-from-upstream.ps1"
