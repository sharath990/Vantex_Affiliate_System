@echo off
echo Starting Vantex Affiliate System...
echo.

echo Starting Backend Server...
start "WebService" cmd /k "cd WebService && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "ReactClient" cmd /k "cd ReactClient && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo Admin Login: http://localhost:5173/admin/login
echo.
pause