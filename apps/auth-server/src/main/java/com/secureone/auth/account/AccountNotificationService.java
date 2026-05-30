package com.secureone.auth.account;

import com.secureone.auth.notify.EmailNotificationService;
import com.secureone.auth.notify.EmailTokenType;
import com.secureone.auth.platform.AuthSettingsService;
import com.secureone.auth.tenant.TenantRepository;
import com.secureone.auth.user.UserAccount;
import com.secureone.auth.user.UserAccountRepository;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AccountNotificationService {

    private final UserAccountRepository users;
    private final TenantRepository tenants;
    private final EmailTokenService emailTokens;
    private final UserPasswordService passwords;
    private final EmailNotificationService mail;
    private final AuthSettingsService authSettings;
    private final String publicBaseUrl;

    public AccountNotificationService(
            UserAccountRepository users,
            TenantRepository tenants,
            EmailTokenService emailTokens,
            UserPasswordService passwords,
            EmailNotificationService mail,
            AuthSettingsService authSettings,
            @Value("${secureone.public-base-url:http://localhost:9000}") String publicBaseUrl) {
        this.users = users;
        this.tenants = tenants;
        this.emailTokens = emailTokens;
        this.passwords = passwords;
        this.mail = mail;
        this.authSettings = authSettings;
        this.publicBaseUrl = publicBaseUrl.endsWith("/") ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1) : publicBaseUrl;
    }

    /** Always returns the same message to avoid email enumeration. */
    public Map<String, String> requestPasswordReset(String tenantSlug, String email) {
        if (!authSettings.isFeatureEnabled("self_service_recovery")) {
            throw new IllegalStateException("Self-service recovery is disabled.");
        }
        resolveUserOptional(tenantSlug, email)
                .ifPresent(user -> sendPasswordResetEmail(user, "self-service"));
        return Map.of("message", "If an account exists for that email, a password reset link has been sent.");
    }

    public Map<String, String> requestMagicLink(String tenantSlug, String email) {
        if (!authSettings.isAuthMethodEnabled("m_magic") || !authSettings.isAuthMethodImplemented("m_magic")) {
            throw new IllegalStateException("Magic link login is disabled.");
        }
        resolveUserOptional(tenantSlug, email).ifPresent(this::sendMagicLinkEmail);
        return Map.of("message", "If an account exists for that email, a sign-in link has been sent.");
    }

    public Map<String, String> completeMagicLink(String rawToken) {
        var token = emailTokens.requireValid(rawToken, EmailTokenType.MAGIC_LINK);
        UserAccount user = users.findById(token.getUserId()).orElseThrow();
        emailTokens.consume(token);
        user.setLastLoginAt(java.time.Instant.now());
        if ("PENDING".equalsIgnoreCase(user.getStatus())) {
            user.setStatus("ACTIVE");
        }
        mail.sendAdminSecurityAlert("Magic link sign-in", "User " + user.getEmail() + " signed in via magic link.");
        return Map.of(
                "message", "Signed in successfully.",
                "loginUsername", resolveLoginUsername(user));
    }

    public Map<String, String> setPasswordFromInvite(String rawToken, String newPassword) {
        var token = emailTokens.requireValid(rawToken, EmailTokenType.SET_PASSWORD);
        UserAccount user = users.findById(token.getUserId()).orElseThrow();
        passwords.setPassword(user.getId(), newPassword);
        emailTokens.consume(token);
        user.setEmailVerified(true);
        user.setStatus("ACTIVE");
        mail.sendPasswordChanged(user);
        return Map.of("message", "Password set. You can sign in now.", "loginUsername", resolveLoginUsername(user));
    }

    public Map<String, String> resetPassword(String rawToken, String newPassword) {
        var token = emailTokens.requireValid(rawToken, EmailTokenType.RESET_PASSWORD);
        UserAccount user = users.findById(token.getUserId()).orElseThrow();
        passwords.setPassword(user.getId(), newPassword);
        emailTokens.consume(token);
        user.setStatus("ACTIVE");
        mail.sendPasswordChanged(user);
        mail.sendAdminSecurityAlert(
                "Password reset completed",
                "User " + user.getEmail() + " reset their password via email link.");
        return Map.of("message", "Password updated. You can sign in with your new password.");
    }

    public Map<String, String> resendVerification(String tenantSlug, String email) {
        resolveUserOptional(tenantSlug, email)
                .filter(user -> !user.isEmailVerified())
                .ifPresent(user -> sendVerificationEmail(user, "self-service"));
        return Map.of("message", "If an unverified account exists, a verification email has been sent.");
    }

    @Transactional(readOnly = true)
    public UserAccount verifyEmail(String rawToken) {
        var token = emailTokens.requireValid(rawToken, EmailTokenType.VERIFY_EMAIL);
        UserAccount user = users.findById(token.getUserId()).orElseThrow();
        user.setEmailVerified(true);
        if ("PENDING".equalsIgnoreCase(user.getStatus())) {
            user.setStatus("ACTIVE");
        }
        emailTokens.consume(token);
        mail.sendAdminSecurityAlert(
                "Email verified",
                "User " + user.getEmail() + " verified their email address.");
        return user;
    }

    public void sendVerificationEmail(UserAccount user, String initiatedBy) {
        if (user.isEmailVerified()) {
            return;
        }
        String raw = emailTokens.issue(user, EmailTokenType.VERIFY_EMAIL).rawToken();
        String link = publicBaseUrl + "/api/v1/account/email/verify?token=" + raw;
        mail.sendVerifyEmail(user, link);
        if ("admin".equals(initiatedBy)) {
            mail.sendAdminSecurityAlert(
                    "Verification email sent",
                    "Admin resent verification to " + user.getEmail() + ".");
        }
    }

    public void sendPasswordResetEmail(UserAccount user, String initiatedBy) {
        String raw = emailTokens.issue(user, EmailTokenType.RESET_PASSWORD).rawToken();
        String link = publicBaseUrl + "/account/reset-password.html?token=" + raw;
        mail.sendPasswordReset(user, link);
        mail.sendAdminSecurityAlert(
                "Password reset requested",
                ("admin".equals(initiatedBy) ? "Admin" : "User")
                        + " triggered password reset for "
                        + user.getEmail()
                        + ".");
    }

    public void onUserInvited(UserAccount user) {
        if (!passwords.hasPassword(user.getId())) {
            sendSetPasswordEmail(user);
        } else {
            sendVerificationEmail(user, "invite");
        }
        mail.sendAdminNotification(
                "User invited",
                "New user: " + user.getEmail() + " — onboarding email sent.");
    }

    public void sendMagicLinkEmail(UserAccount user) {
        String raw = emailTokens.issue(user, EmailTokenType.MAGIC_LINK).rawToken();
        String link = publicBaseUrl + "/account/magic-link.html?token=" + raw;
        mail.sendMagicLink(user, link);
    }

    public void sendSetPasswordEmail(UserAccount user) {
        String raw = emailTokens.issue(user, EmailTokenType.SET_PASSWORD).rawToken();
        String link = publicBaseUrl + "/account/set-password.html?token=" + raw;
        mail.sendSetPasswordInvite(user, link);
        if (!user.isEmailVerified()) {
            sendVerificationEmail(user, "invite");
        }
    }

    private String resolveLoginUsername(UserAccount user) {
        String slug = tenants.findById(user.getTenantId()).map(t -> t.getSlug()).orElse("tenant");
        return slug + ":" + user.getEmail();
    }

    public void adminMarkEmailVerified(UUID userId) {
        UserAccount user = users.findById(userId).orElseThrow();
        user.setEmailVerified(true);
        if ("PENDING".equalsIgnoreCase(user.getStatus())) {
            user.setStatus("ACTIVE");
        }
        mail.sendAdminSecurityAlert("Email marked verified", "Admin verified email for " + user.getEmail() + ".");
    }

    private java.util.Optional<UserAccount> resolveUserOptional(String tenantSlug, String email) {
        if (tenantSlug == null || tenantSlug.isBlank() || email == null || email.isBlank()) {
            return java.util.Optional.empty();
        }
        return tenants.findBySlug(tenantSlug.trim().toLowerCase(Locale.ROOT)).flatMap(tenant -> users.findByTenantIdAndEmail(
                tenant.getId(), email.trim().toLowerCase(Locale.ROOT)));
    }
}
