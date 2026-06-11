package com.secureone.auth.platform;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Platform-wide feature flag catalog (merged with stored overrides by key). */
public final class FeatureFlagDefaults {

    private FeatureFlagDefaults() {}

    public static List<Map<String, Object>> platformCatalog() {
        List<Map<String, Object>> flags = new ArrayList<>();
        // OAuth / token capabilities
        flags.add(flag(
                "oauth_authorization_code_pkce",
                "Authorization Code (PKCE)",
                "Browser and mobile apps obtain tokens via OAuth 2.1 authorization code flow with PKCE",
                true,
                100,
                "oauth"));
        flags.add(flag(
                "oauth_refresh_tokens",
                "Refresh Tokens",
                "Issue and rotate refresh tokens for long-lived sessions",
                true,
                100,
                "oauth"));
        flags.add(flag(
                "oauth_client_credentials",
                "Client Credentials",
                "Machine-to-machine access using client_id and secret",
                true,
                100,
                "oauth"));
        flags.add(flag(
                "oauth_device_code",
                "Device Authorization",
                "OAuth device authorization grant for input-constrained devices",
                false,
                0,
                "oauth"));
        flags.add(flag(
                "oauth_token_introspection",
                "Token Introspection",
                "Allow resource servers to validate opaque access tokens",
                true,
                100,
                "oauth"));
        flags.add(flag(
                "oauth_token_revocation",
                "Token Revocation",
                "RFC 7009 revocation endpoint for access and refresh tokens",
                true,
                100,
                "oauth"));
        flags.add(flag(
                "oauth_pushed_authorization",
                "Pushed Authorization (PAR)",
                "RFC 9126 PAR for front-channel authorize hardening",
                false,
                10,
                "oauth"));
        flags.add(flag(
                "dpop",
                "DPoP Tokens",
                "Sender-constrained access tokens (RFC 9449)",
                false,
                10,
                "oauth"));
        // Identity & sign-in
        flags.add(flag(
                "adaptive_mfa",
                "Adaptive MFA",
                "Risk-based step-up authentication",
                true,
                100,
                "identity"));
        flags.add(flag(
                "device_trust",
                "Trusted Devices",
                "Remember devices to skip MFA",
                true,
                100,
                "identity"));
        flags.add(flag(
                "self_service_recovery",
                "Self-service Recovery",
                "Password reset and magic link recovery",
                true,
                100,
                "identity"));
        flags.add(flag(
                "self_registration",
                "Self Registration",
                "Public user signup",
                false,
                0,
                "identity"));
        flags.add(flag(
                "passwordless",
                "Passwordless Primary",
                "Passkey-first login experience",
                true,
                100,
                "identity"));
        flags.add(flag(
                "social_login",
                "Social Login",
                "Google, GitHub, and external OIDC federation",
                true,
                100,
                "identity"));
        flags.add(flag("saml", "SAML SSO", "SAML 2.0 enterprise SSO", false, 0, "identity"));
        flags.add(flag("ldap", "LDAP / AD", "Directory-backed authentication", false, 0, "identity"));
        // Provisioning
        flags.add(flag(
                "scim_provisioning",
                "SCIM Provisioning",
                "Automated user provisioning (SCIM 2.0)",
                false,
                25,
                "provisioning"));
        flags.add(flag(
                "notification_email_test_ui",
                "Email test console",
                "Show the SMTP test panel under Application → Notifications",
                true,
                100,
                "notifications"));
        return flags;
    }

    private static Map<String, Object> flag(
            String key, String name, String description, boolean enabled, int rollout, String category) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("key", key);
        row.put("name", name);
        row.put("description", description);
        row.put("enabled", enabled);
        row.put("rollout", rollout);
        row.put("category", category);
        return row;
    }
}
