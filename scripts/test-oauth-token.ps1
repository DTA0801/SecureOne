param([string]$Base = "http://localhost:9000")

function New-Pkce {
  $verifier = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
  $sha = [System.Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::ASCII.GetBytes($verifier))
  $challenge = [Convert]::ToBase64String($sha).TrimEnd('=').Replace('+', '-').Replace('/', '_')
  @{ verifier = $verifier; challenge = $challenge }
}

$cookie = Join-Path $env:TEMP "secureone-oauth-test.txt"
if (Test-Path $cookie) { Remove-Item $cookie -Force }

curl.exe -s -c $cookie -b $cookie -X POST "$Base/login" `
  -d "username=acme:sarah.chen@acme.com&password=SecureOne123!" -o NUL | Out-Null

$pkce = New-Pkce
$redirect = [uri]::EscapeDataString("$Base/account/oauth-dev.html")
$authUrl = "$Base/oauth2/authorize?response_type=code&client_id=external-test-client" `
  + "&redirect_uri=$redirect&scope=openid%20profile%20email&state=test" `
  + "&code_challenge=$($pkce.challenge)&code_challenge_method=S256"

$headers = curl.exe -s -D - -b $cookie -c $cookie -o NUL $authUrl 2>&1
$loc = ($headers | Select-String -Pattern "^Location:" | Select-Object -First 1).ToString().Replace("Location: ", "").Trim()
if ($loc -notmatch 'code=([^&]+)') {
  Write-Host "FAIL: no auth code. Location: $loc"
  exit 1
}
$code = $Matches[1]

$tokJson = curl.exe -s -X POST "$Base/oauth2/token" `
  -d "grant_type=authorization_code&code=$code&redirect_uri=$Base/account/oauth-dev.html&client_id=external-test-client&code_verifier=$($pkce.verifier)"
$tok = $tokJson | ConvertFrom-Json
if (-not $tok.access_token) {
  Write-Host "FAIL: token exchange: $tokJson"
  exit 1
}
Write-Host "PASS: access_token length $($tok.access_token.Length)"
if ($tok.refresh_token) {
  Write-Host "PASS: refresh_token issued"
  $refJson = curl.exe -s -X POST "$Base/oauth2/token" `
    -d "grant_type=refresh_token&refresh_token=$($tok.refresh_token)&client_id=external-test-client&client_secret=external-test-dev-secret"
  $ref = $refJson | ConvertFrom-Json
  if ($ref.access_token) {
    Write-Host "PASS: refresh_token grant (access_token length $($ref.access_token.Length))"
  } else {
    Write-Host "FAIL: refresh grant: $refJson"
    exit 1
  }
} else {
  Write-Host "FAIL: no refresh_token in authorization_code response"
  exit 1
}
$ui = curl.exe -s -H "Authorization: Bearer $($tok.access_token)" "$Base/userinfo"
Write-Host "userinfo: $ui"
