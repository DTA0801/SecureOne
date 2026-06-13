package com.secureone.auth.application;

import com.secureone.auth.account.AccountNotificationService;
import com.secureone.auth.account.UserPasswordService;
import com.secureone.auth.admin.ConflictException;
import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.audit.AuditService;
import com.secureone.auth.user.UserAccount;
import com.secureone.auth.user.UserAccountRepository;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Self-service registration for end users of a registered application (e.g. a Flipkart-style client
 * integrated via the public API).
 */
@Service
@Transactional
public class ApplicationSignupService {

    private final ApplicationRepository applications;
    private final UserAccountRepository users;
    private final ApplicationMembershipService memberships;
    private final UserPasswordService passwords;
    private final ApplicationEffectiveSettingsService effectiveSettings;
    private final AccountNotificationService accountNotifications;
    private final AuditService auditService;
    private final String publicBaseUrl;

    public ApplicationSignupService(
            ApplicationRepository applications,
            UserAccountRepository users,
            ApplicationMembershipService memberships,
            UserPasswordService passwords,
            ApplicationEffectiveSettingsService effectiveSettings,
            AccountNotificationService accountNotifications,
            AuditService auditService,
            @Value("${secureone.public-base-url:http://localhost:9000}") String publicBaseUrl) {
        this.applications = applications;
        this.users = users;
        this.memberships = memberships;
        this.passwords = passwords;
        this.effectiveSettings = effectiveSettings;
        this.accountNotifications = accountNotifications;
        this.auditService = auditService;
        this.publicBaseUrl =
                publicBaseUrl.endsWith("/") ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1) : publicBaseUrl;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> signupOptions(UUID applicationId) {
        Application app = requireActiveApplication(applicationId);
        boolean enabled = isSignupEnabled(applicationId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("applicationId", app.getId().toString());
        out.put("applicationName", app.getName());
        out.put("signupEnabled", enabled);
        out.put("signupEndpoint", "/api/v1/applications/" + applicationId + "/signup");
        out.put("hostedSignupPage", publicBaseUrl + "/account/signup.html?applicationId=" + applicationId);
        out.put("loginPage", publicBaseUrl + "/login.html?applicationId=" + applicationId);
        out.put(
                "passwordPolicy",
                com.secureone.auth.account.PasswordPolicyRules.signupPolicy(
                        effectiveSettings.passwordPolicy(applicationId)));
        out.put("loginEmailHint", "your@email.com");
        out.put("account", ApplicationAccountEndpoints.manifestBlock(applicationId));
        return out;
    }

    public Map<String, Object> register(UUID applicationId, ApplicationSignupDtos.SignupRequest request) {
        Application app = requireActiveApplication(applicationId);
        ensureSignupAllowed(applicationId);

        String email = ApplicationConsumerAuth.normalizeEmail(request.email());
        var existing = users.findByTenantIdAndEmail(app.getTenantId(), email);
        if (existing.isPresent()) {
            return linkExistingUserToApplication(app, applicationId, existing.get(), email);
        }

        UserAccount user = new UserAccount();
        user.setTenantId(app.getTenantId());
        user.setEmail(email);
        user.setUsername(resolveUsername(email));
        user.setDisplayName(resolveDisplayName(request.firstName(), request.lastName(), request.displayName(), email));
        user.setEmailVerified(false);
        user.setStatus("ACTIVE");
        user.setType("USER");
        users.saveAndFlush(user);

        passwords.setPassword(user.getId(), request.password(), applicationId);

        memberships.ensureMemberWithDefaultRole(applicationId, user.getId());

        accountNotifications.sendVerificationEmail(applicationId, user, "signup");
        auditService.record(
                app.getTenantId(),
                applicationId,
                email,
                "user.self_registered",
                "user_account",
                user.getId(),
                email,
                true);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put(
                "message",
                "Account created. Check your inbox for a verification link, then sign in with your email and password.");
        response.put("userId", user.getId().toString());
        response.put("loginEmail", email);
        response.put("emailVerificationRequired", true);
        response.put("verificationEmailSent", true);
        response.put(
                "devMailInboxHint",
                "Local dev: open http://localhost:8025 (MailHog) if the message is not in your real inbox.");
        return response;
    }

    private Map<String, Object> linkExistingUserToApplication(
            Application app, UUID applicationId, UserAccount user, String email) {
        if (memberships.isMember(applicationId, user.getId())) {
            throw new ConflictException(
                    "An account with this email already exists for this application. Try signing in or reset your password.");
        }
        memberships.ensureMemberWithDefaultRole(applicationId, user.getId());
        if (!user.isEmailVerified()) {
            accountNotifications.sendVerificationEmail(applicationId, user, "signup");
        }
        auditService.record(
                app.getTenantId(),
                applicationId,
                email,
                "user.application_joined",
                "user_account",
                user.getId(),
                email,
                true);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put(
                "message",
                "You already have an account. We granted access to "
                        + app.getName()
                        + " — sign in with your existing email and password.");
        response.put("userId", user.getId().toString());
        response.put("loginEmail", email);
        response.put("existingAccountLinked", true);
        response.put("emailVerificationRequired", !user.isEmailVerified());
        response.put("verificationEmailSent", !user.isEmailVerified());
        response.put(
                "devMailInboxHint",
                "Local dev: open http://localhost:8025 (MailHog) if the message is not in your real inbox.");
        return response;
    }

    private void ensureSignupAllowed(UUID applicationId) {
        if (!isSignupEnabled(applicationId)) {
            throw new IllegalStateException(
                    "Sign-up is not enabled for this application. Ask the app administrator to enable the Self Registration feature flag.");
        }
        if (!effectiveSettings.isAuthMethodEnabled(applicationId, "m_password")) {
            throw new IllegalStateException("Password sign-up is not available for this application.");
        }
        if (!effectiveSettings.isAuthMethodImplemented(applicationId, "m_password")) {
            throw new IllegalStateException("Password sign-up is not available for this application.");
        }
    }

    private boolean isSignupEnabled(UUID applicationId) {
        return effectiveSettings.isFeatureEnabled(applicationId, "self_registration");
    }

    private Application requireActiveApplication(UUID applicationId) {
        Application app = applications
                .findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + applicationId));
        if (!"ACTIVE".equalsIgnoreCase(app.getStatus())) {
            throw new ResourceNotFoundException("Application not found: " + applicationId);
        }
        return app;
    }

    private static String resolveUsername(String email) {
        int at = email.indexOf('@');
        if (at > 0) {
            String local = email.substring(0, at).replaceAll("[^a-zA-Z0-9._-]", "");
            if (!local.isBlank()) {
                return local;
            }
        }
        return email;
    }

    private static String resolveDisplayName(
            String firstName, String lastName, String displayName, String email) {
        if (displayName != null && !displayName.isBlank()) {
            return displayName.trim();
        }
        String first = firstName != null ? firstName.trim() : "";
        String last = lastName != null ? lastName.trim() : "";
        String combined = (first + " " + last).trim();
        return combined.isBlank() ? email : combined;
    }
}
