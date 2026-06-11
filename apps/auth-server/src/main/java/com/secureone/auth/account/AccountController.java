package com.secureone.auth.account;

import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Account", description = "Password reset, email verification, magic link (public)")
@RestController
@RequestMapping("/api/v1/account")
public class AccountController {

    private final AccountNotificationService accounts;

    public AccountController(AccountNotificationService accounts) {
        this.accounts = accounts;
    }

    /**
     * @deprecated Prefer {@code POST /api/v1/applications/{applicationId}/account/password/forgot} with
     *     {@code { email }} only.
     */
    @Deprecated
    @PostMapping("/password/forgot")
    public Map<String, String> forgotPassword(@Valid @RequestBody AccountDtos.TenantEmailRequest request) {
        if (request.applicationId() != null) {
            return accounts.requestPasswordResetForApplication(request.applicationId(), request.email());
        }
        requireTenantSlug(request.tenantSlug());
        return accounts.requestPasswordReset(request.tenantSlug(), request.email());
    }

    @PostMapping("/password/reset")
    public Map<String, String> resetPassword(@Valid @RequestBody AccountDtos.ResetPasswordRequest request) {
        return accounts.resetPassword(request.token(), request.password());
    }

    /**
     * @deprecated Prefer {@code POST /api/v1/applications/{applicationId}/account/email/resend-verification}.
     */
    @Deprecated
    @PostMapping("/email/resend-verification")
    public Map<String, String> resendVerification(@Valid @RequestBody AccountDtos.TenantEmailRequest request) {
        if (request.applicationId() != null) {
            return accounts.resendVerificationForApplication(request.applicationId(), request.email());
        }
        requireTenantSlug(request.tenantSlug());
        return accounts.resendVerification(request.tenantSlug(), request.email());
    }

    @GetMapping(value = "/email/verify", produces = MediaType.TEXT_HTML_VALUE)
    public String verifyEmailHtml(@RequestParam String token) {
        try {
            var user = accounts.verifyEmail(token);
            return """
                    <!DOCTYPE html><html><head><meta charset="utf-8"><title>Email verified</title></head>
                    <body style="font-family:system-ui,sans-serif;padding:2rem">
                    <h1>Email verified</h1>
                    <p>Thank you. <strong>%s</strong> is now verified.</p>
                    <p>You can close this window and sign in.</p>
                    </body></html>
                    """
                    .formatted(escapeHtml(user.getEmail()));
        } catch (Exception ex) {
            return """
                    <!DOCTYPE html><html><head><meta charset="utf-8"><title>Verification failed</title></head>
                    <body style="font-family:system-ui,sans-serif;padding:2rem">
                    <h1>Verification failed</h1>
                    <p>This link is invalid or has expired. Request a new verification email from your administrator.</p>
                    </body></html>
                    """;
        }
    }

    /**
     * @deprecated Prefer {@code POST /api/v1/applications/{applicationId}/account/magic-link/request}.
     */
    @Deprecated
    @PostMapping("/magic-link/request")
    public Map<String, String> requestMagicLink(@Valid @RequestBody AccountDtos.TenantEmailRequest request) {
        if (request.applicationId() != null) {
            return accounts.requestMagicLinkForApplication(request.applicationId(), request.email());
        }
        requireTenantSlug(request.tenantSlug());
        return accounts.requestMagicLink(request.tenantSlug(), request.email());
    }

    @GetMapping(value = "/magic-link/verify", produces = MediaType.TEXT_HTML_VALUE)
    public String magicLinkVerifyHtml(@RequestParam String token) {
        try {
            var result = accounts.completeMagicLink(token);
            return """
                    <!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem">
                    <h1>Signed in</h1>
                    <p>%s</p>
                    <p>Username for password login: <code>%s</code></p>
                    <p><a href="/login.html">Go to login</a></p>
                    </body></html>
                    """
                    .formatted(result.get("message"), result.get("loginUsername"));
        } catch (Exception ex) {
            return "<html><body><h1>Invalid or expired magic link</h1></body></html>";
        }
    }

    @PostMapping("/set-password")
    public Map<String, String> setPassword(@Valid @RequestBody AccountDtos.ResetPasswordRequest request) {
        return accounts.setPasswordFromInvite(request.token(), request.password(), request.applicationId());
    }

    @PostMapping("/email/verify")
    public Map<String, Object> verifyEmailApi(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("token is required");
        }
        var user = accounts.verifyEmail(token);
        return Map.of("verified", true, "email", user.getEmail());
    }

    private static void requireTenantSlug(String tenantSlug) {
        if (tenantSlug == null || tenantSlug.isBlank()) {
            throw new IllegalArgumentException("applicationId or tenantSlug is required");
        }
    }

    private static String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
