@echo off
echo  Quick Deploy to VPS...

REM Build frontend locally
echo Building frontend...
cd ReactClient
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed
    pause
    exit /b 1
)

REM Upload to VPS via SCP (requires SSH key setup)
echo Uploading files...
scp -r dist/* root@89.116.122.189:/var/www/html/

REM SSH and restart services
echo Restarting services...
ssh root@89.116.122.189 "cd /var/www/vantex/WebService && npm run migrate && npx pm2 restart vantex-backend && systemctl reload nginx"

echo Deployment completed!
pause