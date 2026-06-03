$ErrorActionPreference = "Stop"
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Starting Pacemaker Microservices...   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Determine AI service folder name
$aiFolder = "groq-ai-service"
if (!(Test-Path $aiFolder)) {
    if (Test-Path "ai-service-temp") {
        $aiFolder = "ai-service-temp"
    } else {
        Write-Host "Warning: Could not find AI service folder." -ForegroundColor Yellow
    }
}

if (Test-Path $aiFolder) {
    Write-Host "Starting AI Service (FastAPI) in a new window..." -ForegroundColor Green
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd $aiFolder; docker-compose up --build -d" -WindowStyle Normal
}

if (Test-Path "Backend") {
    Write-Host "Starting Backend (Spring Boot) in a new window..." -ForegroundColor Green
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd Backend; if (Test-Path 'mvnw.cmd') { .\mvnw.cmd spring-boot:run } else { mvn spring-boot:run }" -WindowStyle Normal
}

if (Test-Path "Frontend") {
    Write-Host "Starting Frontend (Next.js) in a new window..." -ForegroundColor Green
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd Frontend; npm run dev" -WindowStyle Normal
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " All services have been launched!        " -ForegroundColor Cyan
Write-Host " - Frontend: http://localhost:3000       " -ForegroundColor Cyan
Write-Host " - Backend:  http://localhost:8080       " -ForegroundColor Cyan
Write-Host " - AI Auth:  http://localhost:8000       " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
