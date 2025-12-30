# Quick Start Script for UPI Payment System

Write-Host "🚀 Starting AI Flashcard Payment System..." -ForegroundColor Cyan
Write-Host ""

# Check if payment service directory exists
if (-not (Test-Path ".\payment-service\main.go")) {
    Write-Host "❌ Error: payment-service directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

# Check if frontend directory exists
if (-not (Test-Path ".\frontend\package.json")) {
    Write-Host "❌ Error: frontend directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Project directories found" -ForegroundColor Green
Write-Host ""

# Start Payment Service in new window
Write-Host "🔧 Starting Payment Service (Port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\payment-service'; Write-Host '💳 Payment Service' -ForegroundColor Cyan; Write-Host '==================' -ForegroundColor Cyan; Write-Host ''; go run main.go"
Start-Sleep -Seconds 2

# Start Frontend in new window
Write-Host "🔧 Starting Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host '🌐 Frontend Service' -ForegroundColor Magenta; Write-Host '==================' -ForegroundColor Magenta; Write-Host ''; npm run dev"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✨ Services started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Service URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:        http://localhost:3000" -ForegroundColor White
Write-Host "   Premium Page:    http://localhost:3000/premium" -ForegroundColor White
Write-Host "   Payment API:     http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Update your UPI ID in payment-service/.env"
Write-Host "   2. Visit http://localhost:3000/premium"
Write-Host "   3. Test the payment flow"
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "   - Read PAYMENT_SETUP.md for detailed instructions"
Write-Host "   - Read FIXED_SUMMARY.md for what was fixed"
Write-Host ""
Write-Host "⏳ Waiting for services to initialize (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Try to open browser
Write-Host ""
Write-Host "🌐 Opening browser..." -ForegroundColor Cyan
try {
    Start-Process "http://localhost:3000/premium"
    Write-Host "✅ Browser opened to premium page" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not auto-open browser. Please visit: http://localhost:3000/premium" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 All systems running!" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop this script (services will keep running)" -ForegroundColor Gray
Write-Host ""

# Keep script running
while ($true) {
    Start-Sleep -Seconds 60
}
