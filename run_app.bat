@echo off
echo ==============================================
echo   Starting EventHub Full-Stack Application
echo ==============================================

echo [1/2] Starting Backend Server (Port 5001)...
start "EventHub Backend" cmd /k "cd eventapp\backend && npm install && npm run seed && npm run dev"

echo [2/2] Starting Frontend Server (Port 3001)...
start "EventHub Frontend" cmd /k "cd eventapp\frontend && npm install && npm run dev"

echo ----------------------------------------------
echo Both servers are starting up in separate windows.
echo - Web App: http://localhost:3001
echo - Super Admin Login: http://localhost:3001/admin/login
echo ==============================================
pause
