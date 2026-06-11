# 09 — Installation & Setup Notes

> These notes describe the **intended** install/run experience. Code does not exist yet (see [Roadmap](08-roadmap.md)); this is the target that development implements.

## Prerequisites

| Tool | Version (target) | For |
|---|---|---|
| JDK | 21 (LTS) | Spring Boot backend |
| Gradle | wrapper included | Backend build |
| Node.js | 20+ LTS | admin-web, docs, SDK |
| pnpm | 9+ | JS workspace package manager |
| Docker + Compose | latest | Local Postgres/Redis |
| PostgreSQL | 16+ | System of record |
| Redis | 7+ | Sessions, cache, rate limiting |

## 1. Clone & install

```bash
git clone <repo-url> secureone
cd secureone
pnpm install            # JS workspaces (admin-web, docs, sdk)
./gradlew build         # backend (from apps/auth-server once scaffolded)
```

## 2. Configure the database (PostgreSQL)

SecureOne runs on **PostgreSQL**. Set the connection via environment/config (see [Database Strategy](06-database.md)). The data layer is abstracted behind repository interfaces so another engine could be added later, but only Postgres is supported today.

Copy the example env and edit:

```bash
cp .env.example .env
```

```dotenv
SECUREONE_DB_URL=jdbc:postgresql://localhost:5432/secureone
SECUREONE_DB_USERNAME=secureone
SECUREONE_DB_PASSWORD=change-me
```

## 3. Other required configuration

```dotenv
# Redis
SECUREONE_REDIS_URL=redis://localhost:6379

# JWT signing (DEV ONLY: generate locally; PROD: use KMS/Vault)
SECUREONE_JWT_KEY_SOURCE=local        # local | kms | vault
SECUREONE_ISSUER_URL=http://localhost:9000

# Secret encryption key for MFA seeds / client secrets (PROD: KMS-managed)
SECUREONE_ENCRYPTION_KEY=base64:...

# Email (password reset / verification)
SECUREONE_MAIL_PROVIDER=smtp          # smtp | ses | resend
SECUREONE_MAIL_FROM=no-reply@example.com
```

> **Never commit `.env`.** Production secrets belong in a KMS/Vault/cloud secrets manager (see [Security](07-security.md)).

## 4. Run dependencies locally (Docker Compose)

```bash
docker compose up -d postgres redis
```

## 5. Run migrations

Flyway runs automatically on backend startup, applying the `db/migration/postgresql` scripts (schema, RBAC, RLS policies).

```bash
./gradlew flywayMigrate     # or automatic on app boot
```

## 6. Start the services

```bash
# Backend (OIDC + APIs)
./gradlew :apps:auth-server:bootRun     # http://localhost:9000

# Admin dashboard + hosted login UI
pnpm --filter admin-web dev             # http://localhost:3000

# Docs portal (optional)
pnpm --filter docs dev                  # http://localhost:3001
```

**API documentation:** with auth-server running, open [Swagger UI](http://localhost:9000/docs) or `GET /api/info` for OpenAPI links. See [API documentation](12-api-documentation.md).

## 7. Clean database (no sample tenants)

Dev migrations historically inserted Acme/Globex sample data; **V25+ removes it** on upgrade. For a completely empty database:

```powershell
.\scripts\reset-database.ps1 -SkipInstall
```

**Platform super admin** (in-memory, not in Postgres): username `admin`, password from `SECUREONE_DEV_PASSWORD` (default `admin`). Sign in at http://localhost:3001/login with **no tenant slug**.

### End-to-end tenant operator test

1. Sign in as platform admin (above).
2. **Tenants** → create a tenant (note the slug, e.g. `myorg`).
3. **Applications** → register an OAuth client for that tenant.
4. **Tenants** → open the tenant → **+ Add user** (status Active).
5. **Grant access** → Tenant Super Admin (or Tenant Admin + pick an app).
6. **Applications** table → **Open console → Users** → open the user → **Set password**.
7. Sign out → sign in with tenant slug `myorg`, user email, and the password you set.

## 8. Email & notifications (dev)

`deploy/docker-compose.yml` includes **MailHog** (SMTP `1025`, web UI `8025`). With the stack running, open **Settings → Notifications** in the admin UI, save recipients, and use **Send test** — messages appear in MailHog, not a real inbox.

Two channels are enabled when SMTP is up:

| Channel | Setting | Who receives |
|--------|---------|----------------|
| **Admin / operational** | Email notifications + Security alerts + Admin recipients | Platform operators |
| **User transactional** | User email (transactional) | End users (verify email, password reset, password changed) |

**Try user flows (dev):**

| Flow | URL / API | Dev credentials |
|------|-----------|-----------------|
| Password login | http://localhost:9000/login.html | Create a tenant + user in Admin, set a password, then sign in with `tenant-slug:email` |
| Magic link | http://localhost:9000/account/magic-link.html | Same tenant + email; link in MailHog |
| Forgot password | http://localhost:9000/account/forgot-password.html | `POST /api/v1/account/password/forgot` |
| Reset password | MailHog link → `/account/reset-password.html?token=…` | `POST /api/v1/account/password/reset` |
| Set password (invite) | MailHog link → `/account/set-password.html?token=…` | New users without a credential |
| Verify email | MailHog → `GET /api/v1/account/email/verify?token=…` | |
| Enabled methods | `GET /api/v1/auth/methods` | Lists `available` (enabled + implemented) |
| Admin triggers | **Users → user detail → Email & password** | Resend verification, send reset, mark verified, reset MFA |
| Auth settings | **Settings → Authentication / MFA / Password / Flags** | Persisted in `platform_setting` (`auth_methods`, `password_policy`, `feature_flags`) |

Passkeys, TOTP, SMS/email OTP, push, Google/GitHub/OIDC/SAML/LDAP, and self-registration are stored in settings with `implemented: false` until Phase 2/3.

Set `SECUREONE_PUBLIC_BASE_URL` if links must point at a host other than `http://localhost:9000`.

## 9. Admin console layout (application-first)

| Area | Who | URL |
|------|-----|-----|
| **Application console** | Super admin + app operators (users with a role on that client) | http://localhost:3001/app → pick application → Users / Roles / Settings / Audit / Sessions |
| **Manage clients** | Platform super-admin only (`admin` dev user) | http://localhost:3001/applications |
| **Platform settings** | Super-admin only | http://localhost:3001/settings |

Optional: set `SECUREONE_ACT_AS_EMAIL` to a tenant user email to debug API access as that operator (development only).

For production, point SMTP at your provider (e.g. SendGrid, SES) via `SECUREONE_SMTP_*` and set notification toggles in the same Settings tab (stored in `platform_setting` in Postgres).

## 9. Verify

- Discovery: `GET http://localhost:9000/.well-known/openid-configuration`
- JWKS: `GET http://localhost:9000/oauth2/jwks`
- Admin UI: `http://localhost:3000`
- MailHog (dev): `http://localhost:8025`

## Production deployment (summary)

- Containerized; **Docker Compose / PaaS** for small installs, **Kubernetes + Helm** at scale.
- Managed PostgreSQL + managed Redis; TLS via Caddy/Traefik or LB.
- Signing keys & secrets in **KMS/Vault**.
- See [Architecture](03-architecture.md) for topology and [Security](07-security.md) for hardening.

## Configuration reference

| Variable | Purpose |
|---|---|
| `SECUREONE_DB_URL` / `_USERNAME` / `_PASSWORD` | PostgreSQL JDBC connection |
| `SECUREONE_REDIS_URL` | Redis connection |
| `SECUREONE_ISSUER_URL` | OIDC issuer / public base URL |
| `SECUREONE_JWT_KEY_SOURCE` | `local` / `kms` / `vault` |
| `SECUREONE_ENCRYPTION_KEY` | Key for encrypting MFA seeds / secrets |
| `SECUREONE_SMTP_HOST` / `_PORT` / `_USERNAME` / `_PASSWORD` | Outbound email (dev default: MailHog on `localhost:1025`, UI at `http://localhost:8025`) |
| `SECUREONE_DEV_USER` / `SECUREONE_DEV_PASSWORD` | HTTP Basic for admin API (used by admin-web server actions) |
| `SECUREONE_BOOTSTRAP_ADMIN_*` | First-run super-admin |
