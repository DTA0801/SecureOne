# Smoke test for External Test Client (auth-server :9000, migration V17).
param([string]$Base = "http://localhost:9000", [string]$AppId = "22222222-2222-2222-2222-222222222299")

$ErrorActionPreference = "Stop"
Write-Host "External Test Client smoke test" -ForegroundColor Cyan

try {
  $manifest = Invoke-RestMethod -Uri "$Base/api/v1/applications/$AppId" -Method GET
  Write-Host "[OK] Public manifest" -ForegroundColor Green
  Write-Host "     signup.enabled = $($manifest.signup.enabled)"
} catch {
  Write-Host "[FAIL] Public manifest: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

try {
  $signup = Invoke-RestMethod -Uri "$Base/api/v1/applications/$AppId/signup" -Method GET
  Write-Host "[OK] Sign-up options signupEnabled=$($signup.signupEnabled)" -ForegroundColor Green
} catch {
  Write-Host "[FAIL] Sign-up options: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

Write-Host "OAuth client_id: external-test-client (PKCE, no secret)" -ForegroundColor DarkGray
Write-Host "Sample callback page: samples/external-test-client/callback.html" -ForegroundColor DarkGray
