package com.secureone.auth.application;

import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.tenant.Tenant;
import com.secureone.auth.tenant.TenantRepository;
import com.secureone.auth.user.UserAccount;
import com.secureone.auth.user.UserAccountRepository;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Resolves tenant context from an application (1:1 tenant per application in integrated apps). */
@Service
@Transactional(readOnly = true)
public class ApplicationTenantResolver {

    private final ApplicationRepository applications;
    private final TenantRepository tenants;
    private final UserAccountRepository users;

    public ApplicationTenantResolver(
            ApplicationRepository applications, TenantRepository tenants, UserAccountRepository users) {
        this.applications = applications;
        this.tenants = tenants;
        this.users = users;
    }

    public Application requireActiveApplication(UUID applicationId) {
        Application app = applications
                .findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + applicationId));
        if (!"ACTIVE".equalsIgnoreCase(app.getStatus())) {
            throw new ResourceNotFoundException("Application not found: " + applicationId);
        }
        return app;
    }

    public UUID requireTenantId(UUID applicationId) {
        return requireActiveApplication(applicationId).getTenantId();
    }

    public Tenant requireTenant(UUID applicationId) {
        UUID tenantId = requireTenantId(applicationId);
        return tenants.findById(tenantId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found: " + tenantId));
    }

    public String requireTenantSlug(UUID applicationId) {
        return requireTenant(applicationId).getSlug();
    }

    public Optional<UserAccount> findUserByEmail(UUID applicationId, String email) {
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        UUID tenantId = requireTenantId(applicationId);
        return users.findByTenantIdAndEmail(tenantId, email.trim().toLowerCase(Locale.ROOT));
    }

    public String loginUsername(UUID applicationId, String email) {
        return requireTenantSlug(applicationId) + ":" + email.trim().toLowerCase(Locale.ROOT);
    }
}
