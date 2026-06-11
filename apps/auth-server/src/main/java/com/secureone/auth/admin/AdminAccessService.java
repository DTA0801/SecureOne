package com.secureone.auth.admin;

import com.secureone.auth.admin.console.AdminConsoleAccessService;
import com.secureone.auth.application.Application;
import com.secureone.auth.application.ApplicationRepository;
import com.secureone.auth.tenant.TenantRepository;
import com.secureone.auth.user.UserAccount;
import com.secureone.auth.user.UserAccountRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Resolves which applications an admin principal may operate on.
 *
 * <p>Platform super-admin ({@code spring.security.user.name}, default {@code admin}) may manage OAuth
 * clients and all applications. Tenant operators are authorized via {@code admin_console_access}
 * (application admin, tenant admin, or tenant super admin).
 */
@Service
@Transactional(readOnly = true)
public class AdminAccessService {

    private final ApplicationRepository applications;
    private final AdminConsoleAccessService consoleAccess;
    private final AdminOperatorResolver operators;
    private final TenantRepository tenants;
    private final UserAccountRepository users;
    private final String platformAdminUsername;

    public AdminAccessService(
            ApplicationRepository applications,
            AdminConsoleAccessService consoleAccess,
            AdminOperatorResolver operators,
            TenantRepository tenants,
            UserAccountRepository users,
            @Value("${spring.security.user.name:admin}") String platformAdminUsername) {
        this.applications = applications;
        this.consoleAccess = consoleAccess;
        this.operators = operators;
        this.tenants = tenants;
        this.users = users;
        this.platformAdminUsername = platformAdminUsername;
    }

    /** Dev/platform operator account ({@code spring.security.user.name}, default {@code admin}). */
    public boolean isPlatformSuperAdmin(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && platformAdminUsername.equals(authentication.getName());
    }

    /**
     * Platform-wide settings (and exposure controls). Requires the platform operator principal and
     * no {@code X-Act-As-Email} — tenant admins and other simulated users must not view or edit.
     */
    public boolean canAccessPlatformSettings(Authentication authentication, String actAsEmail) {
        return isPlatformSuperAdmin(authentication) && !hasActAs(actAsEmail);
    }

    private static boolean hasActAs(String actAsEmail) {
        return actAsEmail != null && !actAsEmail.isBlank();
    }

    public String resolveOperatorEmail(Authentication authentication, String actAsEmail) {
        return operators.resolveEmail(authentication, actAsEmail);
    }

    public String resolveOperatorTier(Authentication authentication, String actAsEmail) {
        if (canAccessPlatformSettings(authentication, actAsEmail)) {
            return "platform";
        }
        return resolveTenantUserId(authentication, actAsEmail)
                .map(consoleAccess::resolveOperatorTier)
                .orElse("application");
    }

    public List<ApplicationSummary> accessibleApplications(Authentication authentication, String actAsEmail) {
        if (isPlatformSuperAdmin(authentication)) {
            return applications.findAll().stream()
                    .sorted(Comparator.comparing(Application::getName, String.CASE_INSENSITIVE_ORDER))
                    .map(this::toSummary)
                    .toList();
        }
        return resolveTenantUserId(authentication, actAsEmail)
                .map(consoleAccess::accessibleApplications)
                .orElse(List.of());
    }

    public void requireApplicationAccess(Authentication authentication, String actAsEmail, UUID applicationId) {
        boolean allowed = accessibleApplications(authentication, actAsEmail).stream()
                .anyMatch(a -> a.id().equals(applicationId));
        if (!allowed) {
            throw new AccessDeniedException("No access to application: " + applicationId);
        }
    }

    public void requireSuperAdmin(Authentication authentication) {
        if (!isPlatformSuperAdmin(authentication)) {
            throw new AccessDeniedException("Platform super-admin required");
        }
    }

    public void requirePlatformSettingsAccess(Authentication authentication, String actAsEmail) {
        if (!canAccessPlatformSettings(authentication, actAsEmail)) {
            throw new AccessDeniedException(
                    "Platform settings require the platform operator account without X-Act-As-Email");
        }
    }

    public boolean bypassesPermissionChecks(
            Authentication authentication, String actAsEmail, UUID applicationId) {
        if (canAccessPlatformSettings(authentication, actAsEmail)) {
            return true;
        }
        return resolveTenantUserId(authentication, actAsEmail)
                .map(userId -> consoleAccess.isTenantSuperAdminForApplication(userId, applicationId))
                .orElse(false);
    }

    private Optional<UUID> resolveTenantUserId(Authentication authentication, String actAsEmail) {
        String email = resolveOperatorEmail(authentication, actAsEmail);
        String tenantSlug = operators.resolveTenantSlug(authentication);
        if (email == null || tenantSlug == null) {
            return Optional.empty();
        }
        return tenants.findBySlug(tenantSlug.trim().toLowerCase()).flatMap(tenant -> users
                .findByTenantIdAndEmail(tenant.getId(), email.trim().toLowerCase())
                .map(UserAccount::getId));
    }

    private ApplicationSummary toSummary(Application app) {
        return new ApplicationSummary(
                app.getId(), app.getTenantId(), app.getName(), app.getSlug(), app.getStatus());
    }

    public record ApplicationSummary(
            UUID id, UUID tenantId, String name, String slug, String status) {}
}
