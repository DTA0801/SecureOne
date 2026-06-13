package com.secureone.auth.application;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/** Public account API paths scoped to an application (tenant is resolved server-side). */
public final class ApplicationAccountEndpoints {

    private ApplicationAccountEndpoints() {}

    public static String basePath(UUID applicationId) {
        return "/api/v1/applications/" + applicationId;
    }

    public static Map<String, Object> manifestBlock(UUID applicationId) {
        String base = basePath(applicationId);
        Map<String, Object> account = new LinkedHashMap<>();
        account.put("forgotPasswordEndpoint", base + "/account/password/forgot");
        account.put("resendVerificationEndpoint", base + "/account/email/resend-verification");
        account.put("magicLinkRequestEndpoint", base + "/account/magic-link/request");
        account.put("sessionLoginEndpoint", base + "/auth/session/login");
        account.put("passwordResetEndpoint", "/api/v1/account/password/reset");
        account.put("setPasswordEndpoint", "/api/v1/account/set-password");
        account.put("loginIdentifier", "email");
        account.put("loginEmailHint", "user@example.com");
        account.put("hostedLoginPage", "/login.html?applicationId=" + applicationId);
        account.put("hostedForgotPasswordPage", "/account/forgot-password.html?applicationId=" + applicationId);
        account.put("hostedMagicLinkPage", "/account/magic-link.html?applicationId=" + applicationId);
        return account;
    }
}
