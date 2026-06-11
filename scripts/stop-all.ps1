# Stop SecureOne local dev stack (app processes + optional Docker).
# Usage:  .\scripts\stop-all.ps1
#         .\scripts\stop-all.ps1 -KeepDocker

param(
    [switch]$KeepDocker
)

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ComposeFile = Join-Path $RepoRoot "deploy\docker-compose.yml"
$PidsDir = Join-Path $RepoRoot ".local\pids"

function Stop-ByPidFile([string]$Name, [string]$PidFile) {
    if (-not (Test-Path $PidFile)) {
        return
    }
    $pidText = (Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    if (-not $pidText) {
        return
    }
    $procId = [int]$pidText
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Stopping $Name (PID $procId)..."
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Stopping SecureOne local stack..." -ForegroundColor Cyan

Stop-ByPidFile "auth-server" (Join-Path $PidsDir "auth-server.pid")
Stop-ByPidFile "admin-web" (Join-Path $PidsDir "admin-web.pid")

# Best-effort: free common dev ports if something else is listening
foreach ($port in @(9000, 3001)) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $owner = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($owner -and $owner.ProcessName -match "java|node") {
            Write-Host "Stopping process on port ${port} (PID $($conn.OwningProcess))..."
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}

if (-not $KeepDocker) {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Host "Stopping Docker services..."
        docker compose -f $ComposeFile down
    }
}

Write-Host "Done." -ForegroundColor Green
