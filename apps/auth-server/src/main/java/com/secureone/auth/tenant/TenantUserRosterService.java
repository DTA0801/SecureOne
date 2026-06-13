package com.secureone.auth.tenant;

import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.admin.console.AdminConsoleAccessRepository;
import com.secureone.auth.application.ApplicationRepository;
import com.secureone.auth.application.UserApplicationRepository;
import com.secureone.auth.rbac.ApplicationRbacScope;
import com.secureone.auth.rbac.RoleRepository;
import com.secureone.auth.rbac.UserRoleRepository;
import com.secureone.auth.user.UserAccount;
import com.secureone.auth.user.UserAccountRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TenantUserRosterService {

    private static final String TENANT_ADMIN_ROLE_NAME = ApplicationRbacScope.TENANT_ADMIN_ROLE_NAME;

    private final TenantUserRosterRepository roster;
    private final TenantRepository tenants;
    private final UserAccountRepository users;
    private final ApplicationRepository applications;
    private final UserApplicationRepository memberships;
    private final AdminConsoleAccessRepository consoleAccess;
    private final RoleRepository roles;
    private final UserRoleRepository userRoles;

    public TenantUserRosterService(
            TenantUserRosterRepository roster,
            TenantRepository tenants,
            UserAccountRepository users,
            ApplicationRepository applications,
            UserApplicationRepository memberships,
            AdminConsoleAccessRepository consoleAccess,
            RoleRepository roles,
            UserRoleRepository userRoles) {
        this.roster = roster;
        this.tenants = tenants;
        this.users = users;
        this.applications = applications;
        this.memberships = memberships;
        this.consoleAccess = consoleAccess;
        this.roles = roles;
        this.userRoles = userRoles;
    }

    @Transactional(readOnly = true)
    public boolean isOnRoster(UUID tenantId, UUID userId) {
        return roster.existsByTenantIdAndUserId(tenantId, userId);
    }

    @Transactional(readOnly = true)
    public long countForTenant(UUID tenantId) {
        return roster.countByTenantId(tenantId);
    }

    public void addToRoster(UUID tenantId, UUID userId) {
        addToRoster(tenantId, userId, TenantRosterSource.DIRECT, null, null);
    }

    public void addToRoster(
            UUID tenantId,
            UUID userId,
            TenantRosterSource source,
            UUID sourceApplicationId,
            UUID addedBy) {
        requireTenantUser(tenantId, userId);
        if (roster.existsByTenantIdAndUserId(tenantId, userId)) {
            return;
        }
        TenantUserRoster row = new TenantUserRoster();
        row.setTenantId(tenantId);
        row.setUserId(userId);
        row.setSource(source.wireValue());
        row.setSourceApplicationId(sourceApplicationId);
        row.setAddedBy(addedBy);
        roster.save(row);
    }

    public void importFromApplication(UUID tenantId, UUID userId, UUID applicationId) {
        importFromApplication(tenantId, userId, applicationId, null);
    }

    public void importFromApplication(
            UUID tenantId, UUID userId, UUID applicationId, UUID addedBy) {
        requireTenantUser(tenantId, userId);
        var app =
                applications
                        .findById(applicationId)
                        .filter(a -> a.getTenantId().equals(tenantId))
                        .orElseThrow(() -> new IllegalArgumentException("Application not in tenant"));
        if (!memberships.existsByUserIdAndApplicationId(userId, app.getId())) {
            throw new IllegalArgumentException("User is not a member of this application");
        }
        if (!hasTenantAdminRoleInApplication(userId, applicationId)) {
            throw new IllegalArgumentException(
                    "Only users with the "
                            + TENANT_ADMIN_ROLE_NAME
                            + " role in this application can be imported to the tenant roster");
        }
        addToRoster(tenantId, userId, TenantRosterSource.IMPORTED, applicationId, addedBy);
    }

    public int bulkImportFromApplication(UUID tenantId, List<UUID> userIds, UUID applicationId, UUID addedBy) {
        int imported = 0;
        for (UUID userId : userIds) {
            if (roster.existsByTenantIdAndUserId(tenantId, userId)) {
                continue;
            }
            try {
                importFromApplication(tenantId, userId, applicationId, addedBy);
                imported++;
            } catch (IllegalArgumentException ignored) {
                // skip users not in application or wrong tenant
            }
        }
        return imported;
    }

    public void removeFromRoster(UUID tenantId, UUID userId) {
        if (!roster.existsByTenantIdAndUserId(tenantId, userId)) {
            return;
        }
        roster.deleteByTenantIdAndUserId(tenantId, userId);
    }

    /** Drops roster rows left behind when console access was revoked but roster was not cleaned up. */
    public void removeConsoleAccessRosterEntry(UUID tenantId, UUID userId) {
        roster.findByTenantIdAndUserId(tenantId, userId)
                .filter(row -> TenantRosterSource.CONSOLE_ACCESS.wireValue().equals(row.getSource()))
                .ifPresent(roster::delete);
    }

    public boolean hasActiveConsoleAccess(UUID tenantId, UUID userId) {
        return consoleAccess.findActiveByTenantId(tenantId).stream()
                .anyMatch(row -> row.getUserId().equals(userId));
    }

    private UserAccount requireTenantUser(UUID tenantId, UUID userId) {
        tenants.findById(tenantId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        UserAccount user =
                users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!user.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("User must belong to this tenant");
        }
        return user;
    }

    private boolean hasTenantAdminRoleInApplication(UUID userId, UUID applicationId) {
        return userRoles.findByUserId(userId).stream()
                .map(grant -> roles.findById(grant.getRoleId()).orElse(null))
                .filter(role -> role != null && applicationId.equals(role.getApplicationId()))
                .anyMatch(role -> TENANT_ADMIN_ROLE_NAME.equalsIgnoreCase(role.getName()));
    }
}
