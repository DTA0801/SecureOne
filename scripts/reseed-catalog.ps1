# Re-apply idempotent catalog seeds after manual TRUNCATE (platform_setting, tenant_permission, permission, etc.).
# Does NOT delete user/tenant/application data — only restores catalog rows.
# Usage:  .\scripts\reseed-catalog.ps1
#
# For a completely empty database use:  .\scripts\reset-database.ps1

param(
    [switch]$SkipDockerCheck
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$SqlFile = Join-Path $RepoRoot "apps\auth-server\src\main\resources\db\migration\postgresql\R__z_repair_catalog.sql"
$ComposeFile = Join-Path $RepoRoot "deploy\docker-compose.yml"

function Test-DockerDaemon {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    try {
        & docker info *> $null
        return $LASTEXITCODE -eq 0
    } finally {
        $ErrorActionPreference = $prev
    }
}

Write-Host "Re-seeding SecureOne catalog data..." -ForegroundColor Cyan

if (-not $SkipDockerCheck) {
    if (-not (Test-DockerDaemon)) {
        throw "Docker is not running. Start Docker Desktop or Postgres, then retry."
    }
    $running = docker inspect --format "{{.State.Running}}" secureone-postgres 2>$null
    if ($running -ne "true") {
        Write-Host "Starting Postgres..." -ForegroundColor Yellow
        docker compose -f $ComposeFile up -d postgres | Out-Null
        Start-Sleep -Seconds 4
    }
}

if (-not (Test-Path $SqlFile)) {
    throw "Repair SQL not found: $SqlFile"
}

Get-Content -Path $SqlFile -Raw -Encoding UTF8 | docker exec -i secureone-postgres psql -U secureone -d secureone -v ON_ERROR_STOP=1 -f -
if ($LASTEXITCODE -ne 0) {
    throw "Catalog reseed failed (psql exit code $LASTEXITCODE)"
}

Write-Host ""
Write-Host "Catalog reseed complete." -ForegroundColor Green
Write-Host "  Platform settings, tenant RBAC catalog, and application permissions/roles restored."
Write-Host "  Restart auth-server if it is already running:  .\scripts\stop-all.ps1 -KeepDocker; .\scripts\start-all.ps1 -SkipInstall -SkipDocker"
Write-Host ""
