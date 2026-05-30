# 07 — Security & Scalability

Security is the product. This document lists non-negotiables and scalability practices.

## Non-negotiable security controls

| Area | Control |
|---|---|
| Password hashing | **Argon2id** with tuned cost; rehash-on-login when params upgrade. Never MD5/SHA/bcrypt-only. |
| Secrets at rest | Encrypt TOTP seeds, client secrets, API keys; **hash** refresh tokens & API keys (store hash only). MFA seeds encrypted with a KMS-managed key. |
| MFA | **Passkeys/FIDO2 first** (phishing-resistant); TOTP fallback; SMS/email OTP only when policy allows. Per-tenant `mfa_policy`, AAL tracking, attestation allow-lists, step-up for sensitive ops. Secure recovery never bypasses MFA. |
| Brute-force defense | Progressive delays, account lockout (`locked_until`), IP + device throttling, CAPTCHA on abuse, leaked-password detection. |
| Refresh tokens | Rotation + **reuse detection** → replay revokes the whole token family. |
| Access tokens | Short TTL (5–15 min) + Redis-backed revocation for "log out everywhere." |
| Signing keys | Rotation with overlapping keys in JWKS; private keys in KMS/Vault. |
| Transport | TLS everywhere, **HSTS**, secure/HttpOnly/SameSite cookies. |
| Login UI hardening | Strict **CSP**, anti-clickjacking (frame-ancestors), XSS hygiene — critical on consent/login pages. |
| Audit | **Append-only** audit log shipped to a SIEM; no update/delete paths. |
| Tenant isolation | `tenant_id` + Hibernate filters + **PostgreSQL RLS** backstop + **automated cross-tenant isolation tests**. |
| Input/authz | Server-side validation; deny-by-default authorization via `PolicyEvaluator`. |

## Secure SDLC

- **SAST** + **dependency scanning (SCA)** + **secret scanning** in CI on every PR.
- Pin dependencies; automated update PRs (Dependabot/Renovate).
- **Third-party penetration test** before GA, and periodically after.
- Target **OWASP ASVS** Level 2+ and follow the **OAuth 2.0 Security BCP (RFC 9700)**.
- Run the **OpenID Connect conformance suite** in CI.
- Threat-model new auth surfaces before they ship.

## Highest-risk areas to test hardest

1. **Cross-tenant data leakage** — the #1 multi-tenant IAM bug class. Dedicated isolation test suite.
2. **Token handling** — rotation, reuse detection, revocation, signature/JWKS validation.
3. **Privilege escalation** — user → admin → platform-admin boundaries.
4. **Account recovery** — password reset & email verification token misuse.

## Scalability practices

| Practice | Detail |
|---|---|
| Stateless services | `auth-server` keeps no local session state → horizontal scaling behind a load balancer. |
| Shared state in Redis | Sessions, refresh-token store/revocation, rate-limit counters, MFA challenges. |
| DB pooling | HikariCP; **PgBouncer** in front of Postgres at scale. |
| Read replicas | For read-heavy admin/audit queries. |
| Caching | JWKS, discovery docs, tenant config cached aggressively. |
| Async work | Emails, audit shipping, webhooks via a queue (Spring + Redis/broker). |
| Rate limiting | At the edge and per-client. |
| Partitioning | `audit_log` / `login_history` partitioned by time; archive cold data to object storage. |

## Operational security

- Secrets only in a **KMS/Vault/cloud secrets manager** in production — never committed, never in plain env files.
- Least-privilege DB and infra credentials.
- Centralized structured logging + metrics + tracing; alert on anomalous auth patterns.
- Backups with tested restore; documented key-rotation and incident-response runbooks.
