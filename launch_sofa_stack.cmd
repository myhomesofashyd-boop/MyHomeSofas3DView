@echo off
setlocal

set "SOFA_DIR=C:\Users\myhom\OneDrive\Documents\sofas framework"
set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"

if not exist "%NPM_CMD%" (
  echo npm.cmd not found at "%NPM_CMD%"
  pause
  exit /b 1
)

start "Sofa API" cmd /k "cd /d "%SOFA_DIR%" && "%NPM_CMD%" run api"
timeout /t 3 /nobreak >nul

start "Sofa Frontend" cmd /k "cd /d "%SOFA_DIR%" && "%NPM_CMD%" run dev"

echo Started API and frontend.
echo API:      http://127.0.0.1:3001/
echo Frontend: usually http://127.0.0.1:5173/
exit /b 0
