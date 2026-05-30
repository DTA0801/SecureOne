# 08 — Roadmap

A phased plan from MVP to enterprise. The architecture is production-shaped from day one, so phases add **feature breadth**, not structural rewrites.

## Phase 0 — Foundations (current)
- [x] Planning & architecture documentation (this `docs/` set)
- [ ] Monorepo scaffold (`apps/auth-server`, `apps/admin-web`, `db/migration`, `packages/sdk-js`)
- [ ] CI skeleton (build, lint, SAST, dependency scan)
- [ ] PostgreSQL datasource config + Flyway wiring (incl. RLS policies)

## Phase 1 — MVP core
**Goal: a usable OIDC provider with multi-tenant user management and RBAC.**
- [ ] Core schema migrations (tenants, applications, users, roles, permissions)
- [ ] Spring Authorization Server integration (Auth Code + PKCE, Client Credentials)
- [ ] JWT issuance + JWKS + refresh-token rotation & reuse detection
- [ ] User management (CRUD, lifecycle: active/disabled/locked/pending)
- [ ] Multi-tenancy (shared schema + `tenant_id` + Hibernate filters + PostgreSQL RLS + isolation tests)
- [ ] Per-application RBAC (roles, permissions, `PolicyEvaluator`)
- [ ] Hosted login UI + basic admin dashboard
- [ ] Password reset + email verification
- [ ] Platform-admin (super-admin) tier

## Phase 2 — Hardening & M2M
**Goal: production-grade security and machine integration.**
- [ ] TOTP MFA + recovery codes
- [ ] Service accounts + API keys (client-credentials mapping)
- [ ] Audit logs + login history (append-only, SIEM streaming)
- [ ] Brute-force defense, account lockout, rate limiting
- [ ] Webhooks / event stream
- [ ] TypeScript SDK + OpenAPI spec + developer docs portal
- [ ] Token introspection & revocation endpoints

## Phase 3 — Enterprise
**Goal: enterprise SSO, provisioning, and advanced authorization.**
- [ ] WebAuthn / passkeys
- [ ] SAML 2.0 IdP module (feature-flagged)
- [ ] SCIM 2.0 provisioning
- [ ] ABAC/ReBAC via OpenFGA (new `PolicyEvaluator` impl)
- [ ] Database-per-tenant / schema-per-tenant isolation tiers
- [ ] Helm chart self-host distribution
- [ ] Additional SDKs (Java, Python, Go)
- [ ] OIDC conformance certification + third-party pen test

## Definition of "production-ready" (GA gate)
- OIDC conformance suite passing
- Third-party penetration test passed
- Cross-tenant isolation test suite green
- Key rotation, backup/restore, incident-response runbooks documented
- Observability (logs/metrics/traces) + alerting in place
- Helm-based reproducible deployment
