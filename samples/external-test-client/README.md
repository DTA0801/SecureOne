# External Test Client

Pre-seeded **SPA** application for integrating any app (Vite, Next.js, mobile WebView, etc.) with SecureOne **outside** this monorepo.

## Identifiers (dev)

| Item | Value |
|------|--------|
| **Application ID** | `22222222-2222-2222-2222-222222222299` |
| **Tenant slug** | `acme` |
| **OAuth client ID** | `external-test-client` |
| **Client type** | Public SPA (PKCE, no client secret) |
| **Issuer** | `http://localhost:9000` (or your deployed auth-server URL) |

## Quick links (local auth-server)

| Flow | URL |
|------|-----|
| Hosted login | `http://localhost:9000/login.html?applicationId=22222222-2222-2222-2222-222222222299` |
| Hosted sign-up | `http://localhost:9000/account/signup.html?applicationId=22222222-2222-2222-2222-222222222299` |
| Public manifest | `GET /api/v1/applications/22222222-2222-2222-2222-222222222299` |
| Sign-up API | `GET/POST /api/v1/applications/22222222-2222-2222-2222-222222222299/signup` |

## OAuth 2.0 authorization code + PKCE

1. Generate `code_verifier` (43–128 chars) and `code_challenge` = BASE64URL(SHA256(verifier)).
2. Open authorize URL (replace `REDIRECT_URI` with one registered in the migration, e.g. `http://localhost:5173/callback`):

```
GET {issuer}/oauth2/authorize
  ?response_type=code
  &client_id=external-test-client
  &redirect_uri={REDIRECT_URI}
  &scope=openid%20profile%20email
  &state={random}
  &code_challenge={challenge}
  &code_challenge_method=S256
```

3. User signs in at SecureOne (`acme:email@example.com` format for tenant users).
4. Exchange code at `{issuer}/oauth2/token` with `grant_type=authorization_code`, `code`, `redirect_uri`, `code_verifier`, `client_id=external-test-client`.

See `.env.example` for variables your app should set.

## Add your own redirect URI

1. Open **Admin → Applications** → select the OAuth client → **Edit client** and add redirect URIs.
2. Or call `PUT /api/admin/v1/oauth-clients/{id}` with updated `redirectUris`.

OAuth clients are stored in `platform.oauth_client` (see [Applications & OAuth clients](../../docs/15-applications-and-oauth-clients.md)).

## Smoke test

From repo root (auth-server on `:9000`):

```powershell
.\scripts\test-external-client.ps1
```
