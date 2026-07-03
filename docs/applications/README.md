# Application integration guide

Documentation for **developers** integrating a product with SecureOne (OAuth, login, account APIs). For platform operators, see the [main documentation hub](../README.md).

---

## Quick links

| Step | Resource |
|------|----------|
| 1. Register your product | [15 — Applications & OAuth clients](../15-applications-and-oauth-clients.md) |
| 2. Choose login approach | [13 — Auth UI integration](../13-auth-ui-integration.md) |
| 3. Interactive API list | Admin → **App console → Settings → Integration** |
| 4. Full OpenAPI | http://localhost:9000/docs |
| 5. Sample SPA | [external-test-client](../../samples/external-test-client/README.md) |

---

## Setup checklist (per application)

Use the **Integration checklist** in the admin console (Settings → Integration), or follow this list:

- [ ] Application product registered (dedicated schema provisioned)
- [ ] OAuth client created (client ID, redirect URIs, grants, PKCE)
- [ ] Redirect URIs match your app callback URLs
- [ ] SMTP configured (password reset, verify email)
- [ ] Auth methods reviewed (password, MFA when available)
- [ ] Signup flow reviewed (if using self-registration)
- [ ] Login flow tested (hosted redirect or native session/OAuth)
- [ ] Public manifest enabled if the client needs unauthenticated config (`GET /api/v1/applications/{id}`)

---

## Integration modes

### Hosted SecureOne UI (fastest)

1. Redirect users to `{issuer}/oauth2/authorize` with PKCE.
2. User signs in on SecureOne-hosted pages.
3. Exchange authorization code at `{issuer}/oauth2/token`.

See [13 — Auth UI integration § Hosted](../13-auth-ui-integration.md).

### Native / custom UI

1. Build your own login screens.
2. Call `POST /api/v1/applications/{applicationId}/auth/session/login` (or OAuth PKCE from your UI).
3. Point **forgot password** / **reset password** URLs at your pages (Settings → Integration → Native app URLs).

See [13 — Auth UI integration § Native](../13-auth-ui-integration.md).

---

## APIs your app will call

| Category | Examples | Auth |
|----------|----------|------|
| **Discovery** | `GET /.well-known/openid-configuration`, `GET /api/v1/applications/{id}` | Public |
| **OAuth** | `/oauth2/authorize`, `/oauth2/token`, `/oauth2/jwks` | Client credentials / PKCE |
| **Account** | forgot password, reset, verify email, set password | Public or session |
| **Session (native)** | `POST …/auth/session/login` | Application-scoped |

The **in-console API reference** lists every endpoint with fields, examples, and response shapes for **your** `applicationId`.

Source of truth for the catalog: `apps/admin-web/src/lib/integration-api-catalog.ts`.

---

## Identifiers you need

| Value | Where to find it |
|-------|------------------|
| Application ID (UUID) | Admin → Applications → client detail, or Integration settings |
| OAuth client ID | Same pages, or `platform.oauth_client` |
| Client secret | Shown once at registration (confidential clients) |
| Tenant slug | Tenants list (users sign in as `slug:email`) |
| Issuer URL | `SECUREONE_ISSUER_URL` / discovery document |

---

## Samples & testing

```powershell
# From repo root (auth-server on :9000)
.\scripts\test-external-client.ps1
```

- **external-test-client** — minimal SPA OAuth + PKCE sample
- **Integration health check** — Admin → Settings → Integration → Run checks

---

## Platform vs application docs

| Audience | Documentation |
|----------|----------------|
| **Platform team** (runs SecureOne) | [docs/README.md](../README.md) — install, tenants, schemas, governance; **SecureOne Confluence** at `/confluence` |
| **Application team** (builds a product) | **This guide** + doc 13 + in-console Integration tab |

Per-application documentation is **not a separate wiki space yet** — it is embedded in the admin console (dynamic, with your IDs) plus the shared guides above. A standalone **developer docs portal** per application is planned with `docs-site` on the roadmap.
