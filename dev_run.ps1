# JARVIS Dev Mode — run without installing
# Requires two terminals:
#   Terminal 1: ./dev_run.ps1 ui
#   Terminal 2: ./dev_run.ps1 backend
#
# Or just: ./dev_run.ps1 (starts both in same window, background UI)

param(
    [string]$Target = "all"
)

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Start-UI {
    Write-Host "==> Starting Vite dev server (port 1420)..." -ForegroundColor Cyan
    Push-Location "$Root/ui"
    npm run dev
    Pop-Location
}

function Start-Backend {
    Write-Host "==> Starting Python backend (--dev = connect to Vite)..." -ForegroundColor Green
    Push-Location "$Root"
    python backend/jarvis/main.py --dev --debug
    Pop-Location
}

switch ($Target) {
    "ui"      { Start-UI }
    "backend" { Start-Backend }
    "all" {
        # Start UI in background, backend in foreground
        $job = Start-Job -ScriptBlock {
            Set-Location "$using:Root/ui"
            npm run dev
        }
        Start-Sleep -Seconds 3
        Start-Backend
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -ErrorAction SilentlyContinue
    }
    default {
        Write-Host "Usage: ./dev_run.ps1 [ui|backend|all]" -ForegroundColor Yellow
    }
}
