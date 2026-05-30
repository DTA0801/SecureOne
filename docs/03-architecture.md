# 03 — Architecture

## System components

| Component | Tech | Responsibility |
|---|---|---|
| **auth-server** | Spring Boot + Spring Authorization Server | OIDC/OAuth endpoints, token issuance, JWKS, user/tenant/role APIs, admin APIs |
| **admin-web** | Next.js | Admin dashboard + hosted login/consent/MFA pages |
| **docs-site** | Next.js/Nextra + Scalar | Public developer docs + OpenAPI rendering |
| **sdk-js** | TypeScript | Client SDK for integrating applications |
| **PostgreSQL** | RDBMS | Durable system of record |
| **Redis** | Cache | Sessions, refresh-token store + revocation, rate limiting, MFA challenges |
| **Secrets manager** | KMS / Vault | Signing keys, TOTP seed encryption keys, client secrets |

The `auth-server` is **stateless** (no in-memory session state) so it scales horizontally; all shared state lives in Redis and the database.

## Logical architecture

> Editable source: [`diagrams/logical-architecture.drawio`](diagrams/logical-architecture.drawio)

```mermaid
flowchart TB
    subgraph clients["Clients"]
        U["End Users / Browser"]
        APP["Integrated Apps<br/>(OIDC clients)"]
        M["Machines (M2M)"]
    end

    subgraph ui["admin-web (Next.js)"]
        LOGIN["Hosted Login / Consent / MFA"]
        ADMIN["Admin Dashboard"]
    end

    subgraph auth["auth-server (Spring Boot)"]
        SAS["Spring Authorization Server<br/>OAuth2 / OIDC engine"]
        API["Tenant / User / Role APIs"]
        POL["PolicyEvaluator (RBAC)"]
        REPO["Repository layer (JPA)"]
    end

    PG[("PostgreSQL")]
    REDIS[("Redis")]
    KMS[["Secrets Manager / KMS"]]

    U --> LOGIN
    APP -- "OIDC redirects" --> LOGIN
    APP --> SAS
    M --> SAS
    LOGIN --> SAS
    ADMIN --> API
    SAS --> POL
    API --> POL
    POL --> REPO
    REPO --> PG
    SAS --> REDIS
    SAS --> KMS

    classDef client fill:#dae8fc,stroke:#6c8ebf,color:#000;
    classDef uic fill:#d5e8d4,stroke:#82b366,color:#000;
    classDef authc fill:#ffe6cc,stroke:#d79b00,color:#000;
    classDef store fill:#f8cecc,stroke:#b85450,color:#000;
    classDef sec fill:#e1d5e7,stroke:#9673a6,color:#000;
    class U,APP,M client;
    class LOGIN,ADMIN uic;
    class SAS,API,POL,REPO authc;
    class PG,REDIS store;
    class KMS sec;
```

## Core request flows

### Authorization Code + PKCE (web / SPA / mobile login)

> Editable source: [`diagrams/auth-flow-authorization-code-pkce.drawio`](diagrams/auth-flow-authorization-code-pkce.drawio)

```mermaid
sequenceDiagram
    actor User
    participant App as Integrated App
    participant Auth as auth-server (SAS)
    participant Login as Hosted Login UI

    App->>Auth: 1. /oauth2/authorize (PKCE challenge)
    Auth->>Login: 2. redirect to login
    User->>Login: 3. credentials + MFA
    Login->>Auth: 4. authenticated
    Auth-->>App: 5. authorization code (redirect)
    App->>Auth: 6. /oauth2/token (code + PKCE verifier)
    Auth-->>App: 7. ID + access + refresh tokens
    App->>Auth: 8. GET /oauth2/jwks
    Auth-->>App: 9. JWKS public keys
    Note over App: 10. validate JWT signature
```

### Client Credentials (machine-to-machine)

> Editable source: [`diagrams/auth-flow-client-credentials.drawio`](diagrams/auth-flow-client-credentials.drawio)

```mermaid
sequenceDiagram
    participant SA as Service / Machine
    participant Auth as auth-server (SAS)

    SA->>Auth: 1. /oauth2/token (client_credentials, client_id+secret / API key)
    Note over Auth: 2. resolve service-account roles / permissions
    Auth-->>SA: 3. access token (JWT)
```

### Refresh with rotation

> Editable source: [`diagrams/auth-flow-refresh-rotation.drawio`](diagrams/auth-flow-refresh-rotation.drawio)

```mermaid
sequenceDiagram
    participant App
    participant Auth as auth-server (SAS)

    App->>Auth: 1. /oauth2/token (refresh_token)
    Note over Auth: 2. validate + check family for reuse
    alt token reuse detected
        Auth-->>App: 3a. revoke entire family + error (invalid_grant)
    else valid
        Auth-->>App: 4. rotate: new access + refresh token
    end
```

Full standards detail: [Auth Standards](05-auth-standards.md).

## Multi-tenancy & isolation

With PostgreSQL committed, isolation is enforced in **layers (defense in depth)**:

1. **Mandatory `tenant_id`** on every tenant-scoped table.
2. **Hibernate `@Filter`** auto-enabled per request from the authenticated principal's tenant, so no query can omit the predicate.
3. **PostgreSQL Row-Level Security (RLS)** policies keyed on a per-connection `app.tenant_id` setting — a database-enforced backstop even if app code has a bug.
4. **Automated cross-tenant isolation tests** in CI (read tenant B as tenant A → must fail).

Tenant resolution strategy is pluggable to allow, later, schema-per-tenant or database-per-tenant for enterprise customers. MVP uses **shared database, shared schema, `tenant_id` discriminator** + RLS. See the layered diagram in [Database Strategy](06-database.md#tenant-isolation-defense-in-depth) ([editable source](diagrams/tenant-isolation.drawio)).

## Trust tiers

| Tier | Stored as | Scope |
|---|---|---|
| Platform admin (super-admin) | separate `platform_admin` table | All tenants; manages the deployment |
| Tenant admin | `user_account.type = ADMIN` | One tenant |
| End user | `user_account.type = USER` | One tenant, per-app roles |
| Service account | `service_account` | M2M within a tenant |

Platform admins are deliberately decoupled from any tenant so a tenant-scoped bug cannot escalate to platform control.

## Deployment topology

### MVP (cheap, fast)
- Docker containers via **Docker Compose** or a PaaS (Render / Fly.io / Railway).
- Managed PostgreSQL + managed Redis.
- **Caddy / Traefik** for TLS termination + reverse proxy.

> Editable source: [`diagrams/deployment-mvp.drawio`](diagrams/deployment-mvp.drawio)

```mermaid
flowchart LR
    NET(["Internet"]) --> PROXY["Caddy / Traefik<br/>(TLS)"]
    PROXY --> AUTH["auth-server<br/>(Spring Boot)"]
    PROXY --> WEB["admin-web<br/>(Next.js)"]
    AUTH --> PG[("PostgreSQL<br/>managed")]
    AUTH --> REDIS[("Redis<br/>managed")]

    classDef sec fill:#e1d5e7,stroke:#9673a6,color:#000;
    classDef authc fill:#ffe6cc,stroke:#d79b00,color:#000;
    classDef uic fill:#d5e8d4,stroke:#82b366,color:#000;
    classDef store fill:#f8cecc,stroke:#b85450,color:#000;
    class PROXY sec;
    class AUTH authc;
    class WEB uic;
    class PG,REDIS store;
```

### Production (scale)

> Editable source: [`diagrams/deployment-production.drawio`](diagrams/deployment-production.drawio)

```mermaid
flowchart TB
    NET(["Internet"]) --> CDN["CDN / WAF<br/>(static UI/docs, DDoS/WAF)"]
    CDN --> LB["Load Balancer<br/>(TLS, HSTS)"]

    subgraph tier["Stateless tier (Kubernetes, horizontally scaled)"]
        A1["auth-server"]
        A2["auth-server"]
        WEB["admin-web"]
    end

    LB --> A1
    LB --> A2
    LB --> WEB
    A1 --> PG[("PostgreSQL primary<br/>HA + replicas, PgBouncer")]
    A2 --> PG
    A1 --> REDIS[("Redis cluster<br/>sessions, revoke, rate-limit")]
    A2 --> REDIS
    A2 --> KMS[["Secrets Manager / KMS"]]
    PG --> SIEM["Audit archive (object storage) → SIEM"]

    classDef sec fill:#e1d5e7,stroke:#9673a6,color:#000;
    classDef authc fill:#ffe6cc,stroke:#d79b00,color:#000;
    classDef uic fill:#d5e8d4,stroke:#82b366,color:#000;
    classDef store fill:#f8cecc,stroke:#b85450,color:#000;
    classDef note fill:#fff2cc,stroke:#d6b656,color:#000;
    class CDN,LB,KMS sec;
    class A1,A2 authc;
    class WEB uic;
    class PG,REDIS store;
    class SIEM note;
```

- **Kubernetes + Helm** when Compose is outgrown; the Helm chart doubles as the self-host distribution.
- DB connection pooling (e.g. **PgBouncer** for Postgres) and read replicas for read-heavy admin/audit queries.
- Aggressively cache JWKS, discovery docs, and tenant config.
- Signing keys/secrets always in a KMS/Vault in production — never env files.

See [Security](07-security.md) for hardening and [Installation](09-installation.md) for setup.
