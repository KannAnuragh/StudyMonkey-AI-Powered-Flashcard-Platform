@echo off
echo ============================================
echo    Payment Service Startup
echo ============================================
echo.

cd /d "%~dp0"

echo Checking environment...
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please create .env file with your UPI_ID
    pause
    exit /b 1
)

echo Starting payment service on port 8081...
echo.
echo Press Ctrl+C to stop the service
echo.

go run main.go

pause
