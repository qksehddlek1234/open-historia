@echo off
REM Builds Open Historia. Safe to launch from anywhere - it always builds THIS
REM folder (the one this file sits in), and always uses the project's own Vite
REM version rather than whatever npx happens to download.
cd /d "%~dp0"
echo Building in: %CD%
echo.
call npm run build
echo.
if errorlevel 1 (
  echo ============================================
  echo  BUILD FAILED - see the error above.
  echo ============================================
) else (
  echo ============================================
  echo  Build finished. You can start the game now.
  echo ============================================
)
pause
