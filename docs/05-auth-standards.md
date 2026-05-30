# 05 — Authentication & Authorization Standards

SecureOne adopts the modern, consolidated standards set so existing OAuth/OIDC client libraries work out of the box.

## Protocols

| Standard | Use |
|---|---|
| **OAuth 2.1** | Consolidated best practices: PKCE everywhere, no implicit flow, no password grant |
| **OpenID Connect (OIDC)** | Authentication, ID tokens, discovery (`/.well-known/openid-configuration`) |
| **SAML 2.0** | Optional enterprise SSO via a separate, feature-flagged IdP module |
| **SCIM 2.0** | User provisioning/deprovisioning (Phase 3) |
| **WebAuthn / FIDO2** | Passkeys / hardware MFA (strategic direction) |
| **TOTP (RFC 6238)** | App-based 2FA (first MFA factor implemented) |

## Supported flows

| Flow | For |
|---|---|
| **Authorization Code + PKCE** | Web apps, SPAs, mobile, native |
| **Client Credentials** | Machine-to-machine / service accounts |
| **Refresh Token (with rotation)** | Long-lived sessions |
| **Device Authorization Grant** | CLIs / TVs (later) |

> The Authorization Code flow with PKCE is the default for all interactive clients. The legacy Implicit and Resource Owner Password grants are **not** supported.

## Tokens

- **Access token:** short-lived (5–15 min) **JWT**, signed with **RS256 or ES256**, published via **JWKS** with key rotation (multiple active keys overlap during rotation).
- **ID token:** JWT per OIDC, carries identity claims + `nonce`.
- **Refresh token:** opaque, stored **server-side and hashed**, revocable, rotated on each use with **reuse detection** (replay revokes the whole token family).
- **Claims:** `sub`, `tenant`, `roles`, `permissions`, `scope`, standard OIDC profile claims. Roles/permissions resolved from `user_role` at issuance time.
- **Introspection (RFC 7662)** and **Revocation (RFC 7009)** endpoints provided for opaque validation and logout-everywhere.

## Endpoints (Spring Authorization Server)

| Endpoint | Purpose |
|---|---|
| `/.well-known/openid-configuration` | Discovery |
| `/oauth2/authorize` | Authorization (code flow) |
| `/oauth2/token` | Token issuance/exchange/refresh |
| `/oauth2/jwks` | Public signing keys |
| `/oauth2/introspect` | Token introspection |
| `/oauth2/revoke` | Token revocation |
| `/userinfo` | OIDC user claims |
| `/connect/logout` | RP-initiated logout |

## MFA / 2FA

- **TOTP first**, then **WebAuthn/passkeys**.
- **Recovery codes** mandatory (stored hashed, single-use).
- TOTP seeds stored **encrypted with a KMS-managed key**, never plaintext.
- MFA challenges held in **Redis** (short TTL).

## Federation (optional)

- **SAML 2.0 IdP/SP** as a separate module behind a feature flag — kept out of the core so it never complicates the primary OIDC path.
- External IdP logins (Google, GitHub, enterprise OIDC/SAML) link to `user_identity`.

## Authorization model

- **RBAC scoped per application/tenant**: `permission` (atomic) → `role` (bundle) → `user_role` (grant).
- All checks flow through a **`PolicyEvaluator` interface**.
- **Future:** ABAC/ReBAC via **OpenFGA** — a new `PolicyEvaluator` implementation, no caller changes.

## Standards compliance targets

- Run against the **OpenID Connect conformance suite**.
- Follow **OAuth 2.1** and the OAuth Security BCP (RFC 9700).
- Align with **OWASP ASVS** (see [Security](07-security.md)).
