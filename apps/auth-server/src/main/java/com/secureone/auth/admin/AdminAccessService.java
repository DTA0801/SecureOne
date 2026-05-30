package com.secureone.auth.admin;

import com.secureone.auth.application.Application;
import com.secureone.auth.application.ApplicationRepository;
import com.secureone.auth.rbac.UserRoleRepository;
import java.util.Comparator;
import java.util.List;
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
 * clients and all applications. Application operators may only access apps where they hold a role
 * (see {@code X-Act-As-Email} for dev simulation).
 */
@Service
@Transactional(readOnly = true)
public class AdminAccessService {

    private final ApplicationRepository applications;
    private final UserRoleRepository userRoles;
    private final String platformAdminUsername;

    public AdminAccessService(
            ApplicationRepository applications,
            UserRoleRepository userRoles,
            @Value("${spring.security.user.name:admin}") String platformAdminUsername) {
        this.applications = applications;
        this.userRoles = userRoles;
        this.platformAdminUsername = platformAdminUsername;
    }

    public boolean isPlatformSuperAdmin(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && platformAdminUsername.equals(authentication.getName());
    }

    public List<ApplicationSummary> accessibleApplications(Authentication authentication, String actAsEmail) {
        List<UUID> ids;
        if (isPlatformSuperAdmin(authentication)) {
            ids = applications.findAll().stream().map(Application::getId).toList();
        } else if (actAsEmail != null && !actAsEmail.isBlank()) {
            ids = userRoles.findDistinctApplicationIdsByUserEmail(actAsEmail.trim());
        } else {
            return List.of();
        }
        return applications.findAllById(ids).stream()
                .sorted(Comparator.comparing(Application::getName, String.CASE_INSENSITIVE_ORDER))
                .map(app -> new ApplicationSummary(
                        app.getId(),
                        app.getTenantId(),
                        app.getName(),
                        app.getSlug(),
                        app.getStatus()))
                .toList();
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

    public record ApplicationSummary(
            UUID id, UUID tenantId, String name, String slug, String status) {}
}
