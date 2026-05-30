# SecureOne

> A centralized, multi-tenant **Identity and Access Management (IAM)** platform — a Keycloak-style system that provides authentication, authorization, user management, RBAC, tenant/application management, and integration APIs from one central place, consumable by many independent applications.

This repository currently contains the **planning, architecture, and design documentation** for the platform. Code will be added on top of this foundation in phases (see the [Roadmap](docs/08-roadmap.md)).

---

## What SecureOne provides

- Multi-application support from a single central system
- User, admin, and super-admin (platform operator) management
- Application-specific roles and permissions (RBAC, evolvable to ABAC/ReBAC)
- Tenant / organization support (multi-tenancy)
- OAuth 2.1 and OpenID Connect (OIDC)
- JWT access tokens + refresh tokens (with rotation & reuse detection)
- Optional SAML 2.0 federation
- MFA/2FA (TOTP, then WebAuthn/passkeys)
- Password reset & email verification
- Audit logs & login history
- API keys / service accounts for machine-to-machine access
- Admin dashboard
- Developer integration docs & SDK examples
- Flexible database setup — **PostgreSQL** (connection configured at install), abstracted so other engines can be added later

---

## Chosen stack (summary)

| Layer | Choice |
|---|---|
| Backend | **Java/Kotlin + Spring Boot + Spring Authorization Server** |
| Frontend | **Next.js + TypeScript + Tailwind + shadcn/ui** |
| Database | **PostgreSQL** (via JPA/Hibernate + Flyway; abstracted for future engines) |
| Cache / sessions | **Redis** |
| AuthZ model | RBAC (app-scoped), policy layer ready for ABAC/ReBAC |
| Migrations | **Flyway** (engine-neutral SQL) |
| Deploy | Docker → Compose/PaaS (MVP) → Kubernetes + Helm (scale) |

Full rationale and the comparison of alternatives are in [docs/02-tech-stack.md](docs/02-tech-stack.md).

---

## Documentation index

| # | Document | What's inside |
|---|---|---|
| 01 | [Overview](docs/01-overview.md) | Vision, goals, scope, core feature definitions |
| 02 | [Tech Stack](docs/02-tech-stack.md) | Stack comparisons and the decisions made |
| 03 | [Architecture](docs/03-architecture.md) | System components, request flows, deployment topology |
| 04 | [Data Model](docs/04-data-model.md) | Entities, ERD, tables, relationships, indexing |
| 05 | [Auth Standards](docs/05-auth-standards.md) | OAuth2/OIDC flows, tokens, MFA, SAML, SCIM |
| 06 | [Database Strategy](docs/06-database.md) | Dual-engine portability, ORM/repository, tenant isolation |
| 07 | [Security](docs/07-security.md) | Security best practices and non-negotiables |
| 08 | [Roadmap](docs/08-roadmap.md) | Phased delivery plan (MVP → enterprise) |
| 09 | [Installation](docs/09-installation.md) | Local setup, configuration, install-time DB selection |
| — | [Diagrams](docs/diagrams/README.md) | Mermaid + editable `.drawio` sources for all diagrams |
| — | [Decision Records](docs/decisions/README.md) | ADRs — why key choices were made |

---

## Repository layout (planned)

```
secureone/
├─ README.md
├─ docs/                      # all design & reference documentation (this set)
├─ apps/
│  ├─ auth-server/            # Spring Boot + Spring Authorization Server (OIDC/OAuth core + APIs)
│  └─ admin-web/              # Next.js admin dashboard + hosted login/consent/MFA UI
├─ packages/
│  └─ sdk-js/                 # TypeScript SDK for integrating apps
├─ db/
│  └─ migration/              # Flyway scripts (PostgreSQL)
├─ docs-site/                 # public developer documentation portal
└─ deploy/                    # Docker, Compose, Helm, infra manifests
```

> Only `docs/` exists today. The `apps/`, `packages/`, `db/`, and `deploy/` trees are created as development begins.

---

## Status

**Phase:** Planning & design (pre-code). See the [Roadmap](docs/08-roadmap.md) for what gets built next.
