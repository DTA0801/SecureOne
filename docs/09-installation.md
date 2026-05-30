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

## 7. First-run bootstrap

On first boot the app creates:
- A **platform admin** account (super-admin) — credentials from `SECUREONE_BOOTSTRAP_ADMIN_*` env, forced password change on first login.
- A **system tenant** for platform-level operations.

```dotenv
SECUREONE_BOOTSTRAP_ADMIN_EMAIL=admin@example.com
SECUREONE_BOOTSTRAP_ADMIN_PASSWORD=change-me-now
```

## 8. Verify

- Discovery: `GET http://localhost:9000/.well-known/openid-configuration`
- JWKS: `GET http://localhost:9000/oauth2/jwks`
- Admin UI: `http://localhost:3000`

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
| `SECUREONE_MAIL_*` | Email provider config |
| `SECUREONE_BOOTSTRAP_ADMIN_*` | First-run super-admin |
