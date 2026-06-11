package com.secureone.auth.application;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/** Public account API paths scoped to an application (no tenantSlug required from clients). */
public final class ApplicationAccountEndpoints {

    private ApplicationAccountEndpoints() {}

    public static String basePath(UUID applicationId) {
        return "/api/v1/applications/" + applicationId;
    }

    public static Map<String, Object> manifestBlock(UUID applicationId, String tenantSlug) {
        String base = basePath(applicationId);
        Map<String, Object> account = new LinkedHashMap<>();
        account.put("forgotPasswordEndpoint", base + "/account/password/forgot");
        account.put("resendVerificationEndpoint", base + "/account/email/resend-verification");
        account.put("magicLinkRequestEndpoint", base + "/account/magic-link/request");
        account.put("sessionLoginEndpoint", base + "/auth/session/login");
        account.put("passwordResetEndpoint", "/api/v1/account/password/reset");
        account.put("setPasswordEndpoint", "/api/v1/account/set-password");
        account.put("loginUsernameFormat", "tenantSlug:email");
        account.put("loginUsernameHint", tenantSlug + ":user@example.com");
        return account;
    }
}
