@echo off
REM One-time: convert this ZIP install into a git repository and merge upstream.
REM Double-click this file. It only calls git-migrate.ps1 next to it.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0git-migrate.ps1"
