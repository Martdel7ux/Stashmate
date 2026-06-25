# Stash — bring the whole local preview stack up after a reboot.
# Run from PowerShell:  ./start-preview.ps1
# Starts: WSL Postgres -> .NET API (:5000) -> Expo web (:8082)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "1/4  Starting PostgreSQL in WSL..." -ForegroundColor Cyan
wsl -d Ubuntu -- bash -lc "tr -d '\r' < /mnt/c/Users/User/OneDrive/Desktop/Stash/backend/pg-setup.sh > /tmp/pg-setup.sh && bash /tmp/pg-setup.sh" | Out-Host

Write-Host "2/4  Waiting for DB to accept connections..." -ForegroundColor Cyan
$ok = $false
for ($i = 0; $i -lt 20; $i++) {
  $r = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue
  if ($r.TcpTestSucceeded) { $ok = $true; break }
  Start-Sleep -Seconds 1
}
if ($ok) { Write-Host "    DB reachable." -ForegroundColor Green }
else { Write-Host "    DB still not reachable from Windows — the API has a 15x retry, continuing." -ForegroundColor Yellow }

Write-Host "3/4  Starting .NET API on http://localhost:5000 ..." -ForegroundColor Cyan
$apiDir = Join-Path $root 'backend/SavingsApp.API'
Start-Process powershell -ArgumentList @(
  '-NoExit','-Command',
  "`$env:DOTNET_ROLL_FORWARD='Major'; `$env:ASPNETCORE_ENVIRONMENT='Development'; `$env:ASPNETCORE_URLS='http://localhost:5000'; Set-Location '$apiDir'; dotnet run --no-launch-profile"
)

Write-Host "4/4  Starting Expo web on http://localhost:8082 ..." -ForegroundColor Cyan
$mobileDir = Join-Path $root 'mobile'
Start-Process powershell -ArgumentList @(
  '-NoExit','-Command',
  "`$env:CI='1'; Set-Location '$mobileDir'; npx expo start --web --port 8082 --clear"
)

Write-Host ""
Write-Host "Done. Two windows opened (API + Expo)." -ForegroundColor Green
Write-Host "  App:     http://localhost:8082" -ForegroundColor Green
Write-Host "  Swagger: http://localhost:5000/swagger" -ForegroundColor Green
Write-Host "  Login:   test@savingsapp.dev / Password123!" -ForegroundColor Green
