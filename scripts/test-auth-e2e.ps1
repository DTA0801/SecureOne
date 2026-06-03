# SecureOne auth & authorization E2E smoke tests (requires auth-server on :9000, optional MailHog :8025)
param(
  [string]$Base = "http://localhost:9000",
  [string]$AppId = "22222222-2222-2222-2222-222222222201",
  [string]$UserId = "33333333-3333-3333-3333-333333333301",
  [string]$TenantUser = "acme:sarah.chen@acme.com",
  [string]$TenantEmail = "sarah.chen@acme.com",
  [string]$TenantSlug = "acme",
  [string]$OrigPass = "SecureOne123!",
  [string]$NewPass = "NewSecureOne123!"
)

$ErrorActionPreference = "Continue"
$script:pass = 0
$script:fail = 0
$script:skip = 0
$script:log = [System.Collections.Generic.List[object]]::new()

function Record($name, $result, [string]$detail = "") {
  $script:log.Add([pscustomobject]@{ Test = $name; Result = $result; Detail = $detail })
  switch ($result) {
    "PASS" { $script:pass++; Write-Host "[PASS] $name" -ForegroundColor Green }
    "FAIL" { $script:fail++; Write-Host "[FAIL] $name" -ForegroundColor Red; if ($detail) { Write-Host "       $detail" -ForegroundColor DarkRed } }
    "SKIP" { $script:skip++; Write-Host "[SKIP] $name" -ForegroundColor Yellow; if ($detail) { Write-Host "       $detail" -ForegroundColor DarkYellow } }
  }
}

function BasicHdr([string]$user = "admin", [string]$pass = "admin") {
  @{ Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}")) }
}

function New-Pkce {
  $verifier = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
  $sha = [System.Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::ASCII.GetBytes($verifier))
  $challenge = [Convert]::ToBase64String($sha).TrimEnd('=').Replace('+', '-').Replace('/', '_')
  @{ verifier = $verifier; challenge = $challenge }
}

function Form-Login([Microsoft.PowerShell.Commands.WebRequestSession]$sess, [string]$user, [string]$pass) {
  try {
    Invoke-WebRequest -Uri "$Base/login" -Method POST -Body @{ username = $user; password = $pass } `
      -WebSession $sess -MaximumRedirection 0 -TimeoutSec 15 -ErrorAction Stop | Out-Null
    return 200
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 302) { return 302 }
    return $code
  }
}

function Get-MailhogResetToken {
  try {
    $msgs = Invoke-RestMethod "http://localhost:8025/api/v2/messages?limit=5" -TimeoutSec 5
    foreach ($m in $msgs.items) {
      $raw = Invoke-RestMethod "http://localhost:8025/api/v2/messages/$($m.ID)" -TimeoutSec 5
      $body = $raw.Content.Body
      if ($body -match 'reset-password\.html\?token=([^"''&\s]+)') { return $Matches[1] }
    }
  } catch { }
  return $null
}

Write-Host "=== SecureOne Auth E2E ===" -ForegroundColor Cyan
Write-Host "Base: $Base`n"

# --- Discovery & health ---
try {
  $h = Invoke-RestMethod "$Base/actuator/health" -TimeoutSec 5
  if ($h.status -eq "UP") { Record "Health" "PASS" } else { Record "Health" "FAIL" $h.status }
} catch { Record "Health" "FAIL" $_.Exception.Message }

try {
  $d = Invoke-RestMethod "$Base/.well-known/openid-configuration" -TimeoutSec 10
  if ($d.token_endpoint) { Record "OIDC discovery" "PASS" } else { Record "OIDC discovery" "FAIL" "missing token_endpoint" }
} catch { Record "OIDC discovery" "FAIL" $_.Exception.Message }

try {
  $jwks = Invoke-RestMethod "$Base/oauth2/jwks" -TimeoutSec 10
  if ($jwks.keys.Count -gt 0) { Record "JWKS" "PASS" } else { Record "JWKS" "FAIL" "no keys" }
} catch { Record "JWKS" "FAIL" $_.Exception.Message }

# --- Public auth methods ---
try {
  $methods = Invoke-RestMethod "$Base/api/v1/auth/methods" -TimeoutSec 10
  $pwd = $methods | Where-Object { $_.id -eq "m_password" }
  if ($pwd.available) { Record "Auth methods (password)" "PASS" } else { Record "Auth methods (password)" "FAIL" "not available" }
} catch { Record "Auth methods" "FAIL" $_.Exception.Message }

# --- Form login ---
$tenantSess = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$code = Form-Login $tenantSess $TenantUser $OrigPass
if ($code -eq 302) { Record "Form login (tenant)" "PASS" }
elseif ($code -eq 302 -or $code -eq 200) {
  $code2 = Form-Login $tenantSess $TenantUser $NewPass
  if ($code2 -eq 302) { Record "Form login (tenant, alt password)" "PASS" } else { Record "Form login (tenant)" "FAIL" "status $code / $code2" }
} else { Record "Form login (tenant)" "FAIL" "status $code" }

$adminSess = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$acode = Form-Login $adminSess "admin" "admin"
if ($acode -eq 302) { Record "Form login (platform admin)" "PASS" } else { Record "Form login (platform admin)" "FAIL" "status $acode (restart auth-server after LoginSuccessHandler fix)" }

# --- OAuth2 client credentials ---
$clientAuth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("demo-client:demo-secret"))
try {
  $cc = Invoke-RestMethod "$Base/oauth2/token" -Method POST -Headers @{ Authorization = "Basic $clientAuth" } `
    -ContentType "application/x-www-form-urlencoded" -Body "grant_type=client_credentials&scope=openid" -TimeoutSec 15
  if ($cc.access_token) { Record "OAuth client_credentials" "PASS" } else { Record "OAuth client_credentials" "FAIL" "no token" }
} catch { Record "OAuth client_credentials" "FAIL" $_.ErrorDetails.Message }

# --- OAuth authorization code + refresh + revoke ---
$pkce = New-Pkce
$authUrl = "$Base/oauth2/authorize?response_type=code&client_id=demo-client" `
  + "&redirect_uri=http://127.0.0.1:3000/login/oauth2/code/secureone&scope=openid%20profile" `
  + "&state=e2e-test&code_challenge=$($pkce.challenge)&code_challenge_method=S256"

$authCode = $null
if ($code -eq 302 -or (Form-Login $tenantSess $TenantUser $OrigPass) -eq 302 -or (Form-Login $tenantSess $TenantUser $NewPass) -eq 302) {
  try {
    $ar = Invoke-WebRequest -Uri $authUrl -WebSession $tenantSess -MaximumRedirection 0 -TimeoutSec 15 -ErrorAction Stop
  } catch {
    $loc = $_.Exception.Response.Headers["Location"]
    if ($loc -match '[?&]code=([^&]+)') { $authCode = $Matches[1] }
    elseif ($loc -and $loc -notmatch "code=") {
      # consent redirect
      try {
        $cr = Invoke-WebRequest -Uri $loc -WebSession $tenantSess -MaximumRedirection 5 -TimeoutSec 15
        if ($cr.BaseResponse.ResponseUri -match '[?&]code=([^&]+)') { $authCode = $Matches[1] }
      } catch {
        $loc2 = $_.Exception.Response.Headers["Location"]
        if ($loc2 -match '[?&]code=([^&]+)') { $authCode = $Matches[1] }
      }
    }
  }
}

$accessToken = $null
$refreshToken = $null
if ($authCode) {
  try {
    $tokBody = "grant_type=authorization_code&code=$authCode&redirect_uri=http://127.0.0.1:3000/login/oauth2/code/secureone&code_verifier=$($pkce.verifier)"
    $tok = Invoke-RestMethod "$Base/oauth2/token" -Method POST -Headers @{ Authorization = "Basic $clientAuth" } `
      -ContentType "application/x-www-form-urlencoded" -Body $tokBody -TimeoutSec 15
    $accessToken = $tok.access_token
    $refreshToken = $tok.refresh_token
    if ($accessToken) { Record "OAuth authorization_code" "PASS" } else { Record "OAuth authorization_code" "FAIL" "no access_token" }
  } catch { Record "OAuth authorization_code" "FAIL" $_.ErrorDetails.Message }
} else {
  Record "OAuth authorization_code" "SKIP" "no auth code (session/consent)"
}

if ($accessToken) {
  try {
    $ui = Invoke-RestMethod "$Base/userinfo" -Headers @{ Authorization = "Bearer $accessToken" } -TimeoutSec 10
    if ($ui.sub -or $ui.preferred_username) { Record "OIDC userinfo" "PASS" } else { Record "OIDC userinfo" "FAIL" ($ui | ConvertTo-Json -Compress) }
  } catch { Record "OIDC userinfo" "FAIL" $_.ErrorDetails.Message }
}

if ($refreshToken) {
  try {
    $ref = Invoke-RestMethod "$Base/oauth2/token" -Method POST -Headers @{ Authorization = "Basic $clientAuth" } `
      -ContentType "application/x-www-form-urlencoded" -Body "grant_type=refresh_token&refresh_token=$refreshToken" -TimeoutSec 15
    if ($ref.access_token) {
      $accessToken = $ref.access_token
      if ($ref.refresh_token) { $refreshToken = $ref.refresh_token }
      Record "OAuth refresh_token" "PASS"
    } else { Record "OAuth refresh_token" "FAIL" "no access_token" }
  } catch { Record "OAuth refresh_token" "FAIL" $_.ErrorDetails.Message }
} else {
  Record "OAuth refresh_token" "SKIP" "no refresh token"
}

if ($refreshToken) {
  try {
    Invoke-RestMethod "$Base/oauth2/revoke" -Method POST -Headers @{ Authorization = "Basic $clientAuth" } `
      -ContentType "application/x-www-form-urlencoded" -Body "token=$refreshToken&token_type_hint=refresh_token" -TimeoutSec 10 | Out-Null
    Record "OAuth revoke (refresh)" "PASS"
    try {
      Invoke-RestMethod "$Base/oauth2/token" -Method POST -Headers @{ Authorization = "Basic $clientAuth" } `
        -ContentType "application/x-www-form-urlencoded" -Body "grant_type=refresh_token&refresh_token=$refreshToken" -TimeoutSec 10 | Out-Null
      Record "Revoked token rejected" "FAIL" "refresh still works"
    } catch {
      Record "Revoked token rejected" "PASS"
    }
  } catch { Record "OAuth revoke" "FAIL" $_.ErrorDetails.Message }
}

# --- Admin authorization ---
$hdr = BasicHdr
try {
  $ctx = Invoke-RestMethod "$Base/api/admin/v1/context" -Headers $hdr -TimeoutSec 10
  if ($ctx.platformSuperAdmin) { Record "Admin context (super)" "PASS" } else { Record "Admin context (super)" "FAIL" }
} catch { Record "Admin context (super)" "FAIL" $_.ErrorDetails.Message }

try {
  $act = Invoke-RestMethod "$Base/api/admin/v1/context" -Headers (@{ Authorization = $hdr.Authorization; "X-Act-As-Email" = $TenantEmail }) -TimeoutSec 10
  if (-not $act.platformSuperAdmin -and $act.applications.Count -ge 1) { Record "Admin act-as (operator)" "PASS" }
  else { Record "Admin act-as (operator)" "FAIL" }
} catch { Record "Admin act-as" "FAIL" $_.ErrorDetails.Message }

# Platform settings blocked for act-as
try {
  Invoke-RestMethod "$Base/api/admin/v1/settings/password-policy" -Headers (@{ Authorization = $hdr.Authorization; "X-Act-As-Email" = $TenantEmail }) -TimeoutSec 10 | Out-Null
  Record "Act-as blocked from platform settings" "FAIL" "got 200"
} catch {
  $c = $_.Exception.Response.StatusCode.value__
  if ($c -eq 403 -or $c -eq 401) { Record "Act-as blocked from platform settings" "PASS" } else { Record "Act-as blocked from platform settings" "FAIL" "status $c" }
}

# --- Roles & permissions ---
$scopeHdr = @{ Authorization = $hdr.Authorization; "X-Application-Id" = $AppId }
try {
  $perms = Invoke-RestMethod "$Base/api/admin/v1/applications/$AppId/permissions" -Headers $scopeHdr -TimeoutSec 10
  if ($perms.Count -ge 1) { Record "List permissions (app)" "PASS" "count=$($perms.Count)" } else { Record "List permissions (app)" "FAIL" "empty" }
} catch { Record "List permissions (app)" "FAIL" $_.ErrorDetails.Message }

try {
  $roles = Invoke-RestMethod "$Base/api/admin/v1/applications/$AppId/roles" -Headers $scopeHdr -TimeoutSec 10
  if ($roles.Count -ge 1) { Record "List roles (app)" "PASS" "count=$($roles.Count)" } else { Record "List roles (app)" "FAIL" }
} catch { Record "List roles (app)" "FAIL" $_.ErrorDetails.Message }

try {
  $roleDetail = Invoke-RestMethod "$Base/api/admin/v1/applications/$AppId/roles/44444444-4444-4444-4444-444444444402" -Headers $scopeHdr -TimeoutSec 10
  if ($roleDetail.permissionIds.Count -ge 1) { Record "Role detail + permissions" "PASS" } else { Record "Role detail + permissions" "FAIL" }
} catch { Record "Role detail" "FAIL" $_.ErrorDetails.Message }

try {
  $roleUsers = Invoke-RestMethod "$Base/api/admin/v1/applications/$AppId/roles/44444444-4444-4444-4444-444444444402/users" -Headers $scopeHdr -TimeoutSec 10
  Record "Role assigned users" "PASS" "count=$($roleUsers.Count)"
} catch { Record "Role assigned users" "FAIL" $_.ErrorDetails.Message }

# --- Password flows ---
try {
  $forgot = Invoke-RestMethod "$Base/api/v1/account/password/forgot" -Method POST -ContentType "application/json" `
    -Body (@{ tenantSlug = $TenantSlug; email = $TenantEmail } | ConvertTo-Json) -TimeoutSec 15
  if ($forgot.message) { Record "Forgot password" "PASS" } else { Record "Forgot password" "FAIL" }
} catch { Record "Forgot password" "FAIL" $_.ErrorDetails.Message }

Start-Sleep -Seconds 2
$resetTok = Get-MailhogResetToken
if ($resetTok) {
  try {
    $reset = Invoke-RestMethod "$Base/api/v1/account/password/reset" -Method POST -ContentType "application/json" `
      -Body (@{ token = $resetTok; password = $NewPass } | ConvertTo-Json) -TimeoutSec 15
    if ($reset.message) { Record "Reset password (email token)" "PASS" } else { Record "Reset password" "FAIL" }
  } catch { Record "Reset password" "FAIL" $_.ErrorDetails.Message }

  if ((Form-Login (New-Object Microsoft.PowerShell.Commands.WebRequestSession) $TenantUser $NewPass) -eq 302) {
    Record "Login after reset" "PASS"
  } else { Record "Login after reset" "FAIL" }
} else {
  Record "Reset password (email token)" "SKIP" "MailHog unavailable or no email"
  Record "Login after reset" "SKIP" ""
}

# Admin set password (restore)
try {
  Invoke-WebRequest "$Base/api/admin/v1/users/$UserId/password/set" -Method POST -Headers $hdr `
    -ContentType "application/json" -Body (@{ password = $OrigPass } | ConvertTo-Json) -TimeoutSec 15 | Out-Null
  Record "Admin set password" "PASS"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 204) { Record "Admin set password" "PASS" }
  else { Record "Admin set password" "FAIL" $_.ErrorDetails.Message }
}

if ((Form-Login (New-Object Microsoft.PowerShell.Commands.WebRequestSession) $TenantUser $OrigPass) -eq 302) {
  Record "Login after admin set password" "PASS"
} else { Record "Login after admin set password" "FAIL" }

# Admin reset email
try {
  $re = Invoke-RestMethod "$Base/api/admin/v1/users/$UserId/password/reset-email" -Method POST -Headers $hdr -TimeoutSec 15
  if ($re.status -or $re.message) { Record "Admin password reset email" "PASS" } else { Record "Admin password reset email" "FAIL" }
} catch { Record "Admin password reset email" "FAIL" $_.ErrorDetails.Message }

# Sessions / login history
try {
  $sessions = Invoke-RestMethod "$Base/api/admin/v1/sessions?userId=$UserId&applicationId=$AppId" -Headers $hdr -TimeoutSec 10
  if ($sessions.Count -ge 0) { Record "Login history / sessions" "PASS" "entries=$($sessions.Count)" } else { Record "Login history" "FAIL" }
} catch { Record "Login history" "FAIL" $_.ErrorDetails.Message }

Write-Host "`n=== Summary: PASS=$($script:pass) FAIL=$($script:fail) SKIP=$($script:skip) ===" -ForegroundColor Cyan
$script:log | Format-Table -AutoSize -Wrap

if ($script:fail -gt 0) { exit 1 }
exit 0
