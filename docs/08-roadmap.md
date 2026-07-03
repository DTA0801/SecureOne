# 08 — Roadmap

A phased plan from MVP to enterprise. The architecture is production-shaped from day one, so phases add **feature breadth**, not structural rewrites.

## Phase 0 — Foundations
- [x] Planning & architecture documentation (`docs/`)
- [x] Monorepo scaffold (`apps/auth-server`, `apps/admin-web`, `deploy/`)
- [ ] CI skeleton (build, lint, SAST, dependency scan)
- [x] PostgreSQL + Flyway wiring

## Phase 1 — MVP core
**Goal: a usable OIDC provider with multi-tenant user management and RBAC.**
- [x] Core schema migrations (tenants, applications, users, roles, permissions)
- [x] Platform schema + `oauth_client` table (V45)
- [x] Per-application PostgreSQL schema provisioning + isolate
- [x] Spring Authorization Server integration (Auth Code + PKCE, Client Credentials)
- [x] JWT issuance + JWKS
- [x] User management (CRUD, lifecycle)
- [x] Multi-tenancy (`tenant_id` + app-layer isolation)
- [x] Per-application RBAC (roles, permissions, composite roles, groups)
- [x] Hosted login UI + admin dashboard (admin-web)
- [x] Password reset + email verification (basic)
- [x] Platform-admin (super-admin) tier
- [x] Admin control basics — scopes, user lifecycle, sessions
- [x] OAuth client registry UI (application product separate from OAuth client)
- [x] **SecureOne Confluence** — in-app docs browser (standalone UI, session APIs, inline draw.io on doc pages)

## Phase 2 — Hardening, MFA & M2M
**Goal: production-grade security, phishing-resistant MFA, machine integration.**
- [ ] **MFA — passkeys-first:** WebAuthn/FIDO2 passkeys (primary + passwordless), **TOTP** fallback, **recovery codes**
- [ ] MFA fallbacks (policy-gated): **SMS OTP**, **email OTP**, **push w/ number-matching**
- [ ] Per-tenant `mfa_policy` (required factors, remembered-device, reauth interval)
- [ ] Basic step-up auth (`acr`/`amr`, `max_age`)
- [ ] **Admin MFA control** — reset/clear factors, revoke a factor, regenerate recovery codes, MFA exemption (audited)
- [ ] **Layered settings + feature toggles + auth-method selection** (platform/tenant/org/app with locks)
- [ ] **Admin impersonation** (time-boxed, step-up, audited) + self-lockout protection
- [ ] Service accounts + API keys (client-credentials mapping)
- [ ] Audit logs + login history (append-only, SIEM streaming)
- [ ] Brute-force defense, account lockout, rate limiting, leaked-password detection
- [ ] Self-service account portal + per-tenant branding/i18n
- [ ] Webhooks / event stream
- [ ] Token introspection & revocation; **Token Exchange (RFC 8693)**
- [x] OpenAPI spec + Swagger UI on auth-server (see [12-api-documentation.md](12-api-documentation.md))
- [ ] TypeScript SDK + developer docs portal

## Phase 3 — Enterprise
**Goal: enterprise SSO/brokering, governance, advanced authz & protocol hardening.**
- [ ] **Identity brokering** + LDAP/AD federation + home-realm discovery + JIT
- [ ] SAML 2.0 IdP module (feature-flagged)
- [ ] SCIM 2.0 provisioning
- [ ] **Configurable authentication flows** + adaptive/risk-based auth (`trusted_device`, risk signals)
- [ ] **Advanced MFA:** attestation/AAGUID allow-lists, AAL2/AAL3 enforcement, smart-card/PIV, mTLS
- [ ] ABAC/ReBAC via OpenFGA + policy-as-code (OPA/Cedar) + UMA 2.0
- [ ] **Organizations + nested groups + delegated administration** (org-scoped admin roles/boundaries, help-desk scopes)
- [ ] Protocol hardening: **PAR, DPoP/mTLS-bound tokens, CIBA, JARM, back-channel logout**
- [ ] Database-per-tenant / schema-per-tenant isolation tiers
- [ ] Terraform provider + management API; additional SDKs (Java, Python, Go)
- [ ] Helm chart self-host distribution
- [ ] OIDC conformance certification + third-party pen test

## Phase 4 — Governance & Scale
**Goal: identity governance (IGA), compliance, and global scale.**
- [ ] Full **IGA**: access requests + approval workflows, certification campaigns, **Segregation of Duties**, time-bound/JIT access
- [ ] **GDPR/CCPA tooling**: consent records, data export, right-to-be-forgotten, data residency
- [ ] Compliance posture: **SOC 2 / ISO 27001 / HIPAA**; configurable retention
- [ ] **Multi-region HA / active-active**, DR, blue-green/canary
- [ ] Per-tenant quotas + **usage metering / MAU billing**
- [ ] **HSM / BYOK** key management + automated signing-key rotation
- [ ] **FAPI 2.0** high-assurance profile
- [ ] Full observability: OpenTelemetry tracing, Prometheus metrics, dashboards

See [Enterprise Capabilities](10-enterprise.md) for detail on Phase 3–4 items.

## Definition of "production-ready" (GA gate)
- OIDC conformance suite passing
- Third-party penetration test passed
- Cross-tenant isolation test suite green
- Key rotation, backup/restore, incident-response runbooks documented
- Observability (logs/metrics/traces) + alerting in place
- Helm-based reproducible deployment
