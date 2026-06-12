# API documentation (OpenAPI & Swagger UI)

The **auth-server** publishes interactive API documentation via [springdoc-openapi](https://springdoc.org/) and **Swagger UI**.

## URLs (default `http://localhost:9000`)

| Resource | Path |
|----------|------|
| Swagger UI | `/swagger-ui/index.html` or `/docs` (redirect) |
| OpenAPI JSON (all) | `/v3/api-docs/all` |
| OpenAPI JSON (default) | `/v3/api-docs` |
| Service discovery | `GET /api/info` → `swaggerUi`, `openapi`, `docs` |

## API groups

Swagger UI opens **All APIs** by default (every endpoint). Use the **Select a definition** dropdown to filter:

> If you only see two endpoints, the UI is on **Public — auth & info**. Switch to **All APIs**.

| Group | Contents |
|-------|----------|
| **all** | Every REST endpoint plus OAuth/OIDC protocol paths |
| **public** | `GET /api/info`, `GET /api/v1/auth/methods` |
| **account** | Password reset, email verification, magic link |
| **applications** | Public manifest and self-service sign-up |
| **admin-platform** | Tenants, users, platform settings, audit, sessions, platform RBAC, application registry |
| **admin-applications** | Per-application users, settings, app RBAC |
| **oauth-oidc** | Authorization server: authorize, token, revoke, introspect, JWKS, OIDC discovery, UserInfo |

## Authentication in Swagger UI

### Admin APIs

1. Click **Authorize**.
2. Choose **adminHttpBasic** and enter platform credentials (dev default: `admin` / `admin`), **or**
3. Open `/login.html` in the same browser, sign in, then use **Try it out** (session cookie).

Tenant-scoped admins use `tenantSlug:email` as the Basic username (see login form).

### OAuth token endpoint

Use **oauthClientBasic** with `demo-client` / `demo-secret` (dev), or send `client_id` / `client_secret` in the form body.

### Bearer-protected OIDC UserInfo

Obtain an access token from `POST /oauth2/token`, then **Authorize** → **bearerAuth**.

## Integrated applications (e.g. e-commerce)

Public flows do not require Swagger authorization:

- `GET /api/v1/applications/{applicationId}` — client manifest (appearance, auth methods, signup block)
- `GET/POST /api/v1/applications/{applicationId}/signup` — self-registration when **Self Registration** is enabled

See [Settings governance — Self-registration](10-settings-governance.md#self-registration-application-end-users) and [Authentication UI integration](13-auth-ui-integration.md) (hosted vs custom UI, magic link, OAuth, session login).

## Swagger UI: "No API definition provided"

Usually **`disable-swagger-default-url: true`** without a default spec URL. Fix: use **`http://localhost:9000/docs`** or **`/swagger-ui/index.html?url=/v3/api-docs/all`**, and ensure `springdoc.swagger-ui.url` is set to `/v3/api-docs/all` in `application.yml`. Restart auth-server after config changes.

## Swagger UI: "Failed to fetch"

This is almost always a **browser / URL** issue, not a broken signup API.

1. Confirm auth-server is running: `GET http://localhost:9000/api/info` → `"status":"UP"`.
2. Open Swagger from **http://localhost:9000/docs** (same host you use for the API).
3. In **Servers**, select **Current host (use this in Swagger UI)** (`/`) — not a mismatched `localhost` vs `127.0.0.1` URL.
4. For sign-up, leave **Authorize** empty (public endpoint).
5. If it still fails, use curl or PowerShell (see below) — the API does not require CORS from the command line.

## Exporting the spec

```bash
curl -s http://localhost:9000/v3/api-docs/all -o secureone-openapi.json
```

Use the JSON for SDK generation, Postman import, or CI contract tests.

## Configuration

`apps/auth-server/src/main/resources/application.yml` → `springdoc.*`

Java configuration: `com.secureone.auth.config.openapi.OpenApiConfig`, `OAuth2OpenApiDocumentation`.
