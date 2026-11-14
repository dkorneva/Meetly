@echo off
setlocal

where node.exe >nul 2>&1
if errorlevel 1 goto missing_node
where npm.cmd >nul 2>&1
if errorlevel 1 goto missing_node

if not exist "%~dp0backend\node_modules\.bin\ts-node.cmd" (
  echo Backend dependencies are missing. Run npm ci in the backend folder.
  goto failed
)
if not exist "%~dp0frontend\node_modules\.bin\expo.cmd" (
  echo Frontend dependencies are missing. Run npm ci in the frontend folder.
  goto failed
)

if /I "%~1"=="--check" (
  echo Node.js, npm and both application dependencies are available.
  exit /b 0
)

start "Meetly backend" /D "%~dp0backend" "%ComSpec%" /d /k "npm run dev"
start "Meetly frontend" /D "%~dp0frontend" "%ComSpec%" /d /k "npm start"
echo Meetly started in two windows. Press Ctrl+C in each window to stop it.
exit /b 0

:missing_node
echo Install Node.js with npm and reopen the terminal.

:failed
if /I not "%~1"=="--check" pause
exit /b 1
