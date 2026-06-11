package com.secureone.auth.admin.console;

import com.secureone.auth.admin.AdminAccessService.ApplicationSummary;
import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.admin.application.ApplicationUserAdminService;
import com.secureone.auth.application.Application;
import com.secureone.auth.application.ApplicationRepository;
import com.secureone.auth.rbac.Role;
import com.secureone.auth.rbac.RoleRepository;
import com.secureone.auth.rbac.UserRole;
import com.secureone.auth.rbac.UserRoleRepository;
import com.secureone.auth.tenant.Tenant;
import com.secureone.auth.tenant.TenantRepository;
import com.secureone.auth.tenant.TenantUserRosterService;
import com.secureone.auth.user.UserAccount;
import com.secureone.auth.user.UserAccountRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminConsoleAccessService {

    private final AdminConsoleAccessRepository access;
    private final UserAccountRepository users;
    private final TenantRepository tenants;
    private final ApplicationRepository applications;
    private final RoleRepository roles;
    private final UserRoleRepository userRoles;
    private final ApplicationUserAdminService applicationUsers;
    private final TenantUserRosterService tenantUserRoster;

    public AdminConsoleAccessService(
            AdminConsoleAccessRepository access,
            UserAccountRepository users,
            TenantRepository tenants,
            ApplicationRepository applications,
            RoleRepository roles,
            UserRoleRepository userRoles,
            ApplicationUserAdminService applicationUsers,
            TenantUserRosterService tenantUserRoster) {
        this.access = access;
        this.users = users;
        this.tenants = tenants;
        this.applications = applications;
        this.roles = roles;
        this.userRoles = userRoles;
        this.applicationUsers = applicationUsers;
        this.tenantUserRoster = tenantUserRoster;
    }

    public record ConsoleAccessAssignment(
            UUID id,
            UUID userId,
            String email,
            String displayName,
            AdminConsoleRoleType roleType,
            UUID tenantId,
            UUID applicationId,
            String applicationName) {}

    public boolean hasActiveConsoleAccess(UUID userId) {
        return !access.findActiveByUserId(userId).isEmpty();
    }

    public Optional<AdminConsoleRoleType> highestRoleType(UUID userId) {
        List<AdminConsoleAccess> rows = access.findActiveByUserId(userId);
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        if (rows.stream().anyMatch(r -> r.getRoleType() == AdminConsoleRoleType.TENANT_SUPER_ADMIN)) {
            return Optional.of(AdminConsoleRoleType.TENANT_SUPER_ADMIN);
        }
        if (rows.stream().anyMatch(r -> r.getRoleType() == AdminConsoleRoleType.TENANT_ADMIN)) {
            return Optional.of(AdminConsoleRoleType.TENANT_ADMIN);
        }
        return Optional.of(AdminConsoleRoleType.APPLICATION_ADMIN);
    }

    public String resolveOperatorTier(UUID userId) {
        return highestRoleType(userId)
                .map(role -> switch (role) {
                    case TENANT_SUPER_ADMIN -> "tenant_super";
                    case TENANT_ADMIN -> "tenant";
                    case APPLICATION_ADMIN -> "application";
                })
                .orElse("application");
    }

    public List<ApplicationSummary> accessibleApplications(UUID userId) {
        UserAccount user = users.findById(userId).orElse(null);
        if (user == null) {
            return List.of();
        }
        UUID tenantId = user.getTenantId();
        if (access.findActiveTenantSuperAdmin(userId, tenantId).isPresent()) {
            return applications.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                    .map(this::toSummary)
                    .toList();
        }
        Set<UUID> appIds = new LinkedHashSet<>();
        for (AdminConsoleAccess row : access.findActiveByUserId(userId)) {
            if (row.getApplicationId() != null) {
                appIds.add(row.getApplicationId());
            }
        }
        return applications.findAllById(appIds).stream()
                .sorted(Comparator.comparing(Application::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toSummary)
                .toList();
    }

    public boolean isTenantSuperAdminForApplication(UUID userId, UUID applicationId) {
        Application app = applications.findById(applicationId).orElse(null);
        if (app == null) {
            return false;
        }
        return access.findActiveTenantSuperAdmin(userId, app.getTenantId()).isPresent();
    }

    public List<ConsoleAccessAssignment> listForTenant(UUID tenantId) {
        tenants.findById(tenantId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        Map<UUID, UserAccount> userById = new LinkedHashMap<>();
        Map<UUID, String> appNameById = new LinkedHashMap<>();
        List<ConsoleAccessAssignment> result = new ArrayList<>();
        for (AdminConsoleAccess row : access.findActiveByTenantId(tenantId)) {
            UserAccount user = userById.computeIfAbsent(
                    row.getUserId(), id -> users.findById(id).orElse(null));
            if (user == null) {
                continue;
            }
            String appName = null;
            if (row.getApplicationId() != null) {
                appName = appNameById.computeIfAbsent(
                        row.getApplicationId(),
                        id -> applications.findById(id).map(Application::getName).orElse(id.toString()));
            }
            result.add(new ConsoleAccessAssignment(
                    row.getId(),
                    user.getId(),
                    user.getEmail(),
                    user.getDisplayName(),
                    row.getRoleType(),
                    row.getTenantId(),
                    row.getApplicationId(),
                    appName));
        }
        return result;
    }

    @Transactional
    public ConsoleAccessAssignment grant(
            UUID tenantId, UUID userId, AdminConsoleRoleType roleType, UUID applicationId, UUID grantedBy) {
        Tenant tenant = tenants.findById(tenantId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        UserAccount user = users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!user.getTenantId().equals(tenant.getId())) {
            throw new IllegalArgumentException("User must belong to this tenant");
        }
        tenantUserRoster.addToRoster(
                tenantId,
                userId,
                com.secureone.auth.tenant.TenantRosterSource.CONSOLE_ACCESS,
                applicationId,
                grantedBy);
        validateGrant(roleType, applicationId);
        prepareConsoleOperator(user);

        if (roleType == AdminConsoleRoleType.TENANT_SUPER_ADMIN) {
            access.findActiveByTenantId(tenantId).stream()
                    .filter(row -> row.getUserId().equals(userId))
                    .filter(row -> row.getApplicationId() != null)
                    .forEach(this::revokeRow);

            access.findByUserIdAndTenantIdAndRoleTypeAndApplicationIdIsNull(
                            userId, tenantId, AdminConsoleRoleType.TENANT_SUPER_ADMIN)
                    .orElseGet(() -> {
                        AdminConsoleAccess row = new AdminConsoleAccess();
                        row.setUserId(userId);
                        row.setTenantId(tenantId);
                        row.setRoleType(AdminConsoleRoleType.TENANT_SUPER_ADMIN);
                        row.setGrantedBy(grantedBy);
                        return access.save(row);
                    });
            for (Application app : applications.findByTenantIdOrderByCreatedAtDesc(tenantId)) {
                syncRbacForApp(userId, app.getId(), "Tenant Admin");
                applicationUsers.grantAccess(app.getId(), userId);
            }
            return toAssignment(
                    access.findByUserIdAndTenantIdAndRoleTypeAndApplicationIdIsNull(
                                    userId, tenantId, AdminConsoleRoleType.TENANT_SUPER_ADMIN)
                            .orElseThrow(),
                    user,
                    null);
        }

        Application app = applications
                .findById(applicationId)
                .filter(a -> a.getTenantId().equals(tenantId))
                .orElseThrow(() -> new IllegalArgumentException("Application not in tenant"));

        AdminConsoleAccess row = access
                .findByUserIdAndTenantIdAndApplicationIdAndRoleType(userId, tenantId, applicationId, roleType)
                .orElseGet(() -> {
                    AdminConsoleAccess created = new AdminConsoleAccess();
                    created.setUserId(userId);
                    created.setTenantId(tenantId);
                    created.setApplicationId(applicationId);
                    created.setRoleType(roleType);
                    created.setGrantedBy(grantedBy);
                    return access.save(created);
                });

        String rbacRoleName =
                roleType == AdminConsoleRoleType.APPLICATION_ADMIN ? "Application Admin" : "Tenant Admin";
        syncRbacForApp(userId, app.getId(), rbacRoleName);
        applicationUsers.grantAccess(app.getId(), userId);

        return toAssignment(row, user, app.getName());
    }

    @Transactional
    public void revoke(UUID assignmentId) {
        AdminConsoleAccess row = access.findById(assignmentId).orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        revokeRow(row);
    }

    @Transactional
    public void revoke(UUID tenantId, UUID userId, AdminConsoleRoleType roleType, UUID applicationId) {
        if (roleType == AdminConsoleRoleType.TENANT_SUPER_ADMIN) {
            access.findByUserIdAndTenantIdAndRoleTypeAndApplicationIdIsNull(
                            userId, tenantId, AdminConsoleRoleType.TENANT_SUPER_ADMIN)
                    .ifPresent(this::revokeRow);
            return;
        }
        if (applicationId == null) {
            throw new IllegalArgumentException("applicationId required");
        }
        access.findByUserIdAndTenantIdAndApplicationIdAndRoleType(userId, tenantId, applicationId, roleType)
                .ifPresent(this::revokeRow);
    }

    private void revokeRow(AdminConsoleAccess row) {
        if (row.getRoleType() == AdminConsoleRoleType.TENANT_SUPER_ADMIN) {
            for (Application app : applications.findByTenantIdOrderByCreatedAtDesc(row.getTenantId())) {
                removeRbacForApp(row.getUserId(), app.getId(), "Tenant Admin");
            }
            access.delete(row);
            return;
        }
        String rbacRoleName = row.getRoleType() == AdminConsoleRoleType.APPLICATION_ADMIN
                ? "Application Admin"
                : "Tenant Admin";
        UUID applicationId = row.getApplicationId();
        removeRbacForApp(row.getUserId(), applicationId, rbacRoleName);
        if (applicationId != null) {
            applicationUsers.revokeAccess(applicationId, row.getUserId());
        }
        access.delete(row);
    }

    /** Console operators must be active with a verified email before they can sign in. */
    private void prepareConsoleOperator(UserAccount user) {
        boolean changed = false;
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            user.setStatus("ACTIVE");
            changed = true;
        }
        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            changed = true;
        }
        if (changed) {
            users.save(user);
        }
    }

    private void validateGrant(AdminConsoleRoleType roleType, UUID applicationId) {
        if (roleType == AdminConsoleRoleType.TENANT_SUPER_ADMIN) {
            if (applicationId != null) {
                throw new IllegalArgumentException("Tenant super admin cannot be scoped to an application");
            }
            return;
        }
        if (applicationId == null) {
            throw new IllegalArgumentException("applicationId is required for " + roleType);
        }
    }

    private void syncRbacForApp(UUID userId, UUID applicationId, String roleName) {
        Role role = roles.findByApplicationIdAndName(applicationId, roleName)
                .orElseThrow(() -> new IllegalStateException(roleName + " role missing for application"));
        boolean hasRole = userRoles.findByUserId(userId).stream()
                .anyMatch(ur -> ur.getRoleId().equals(role.getId()));
        if (!hasRole) {
            UserRole link = new UserRole();
            link.setUserId(userId);
            link.setRoleId(role.getId());
            userRoles.save(link);
        }
    }

    private void removeRbacForApp(UUID userId, UUID applicationId, String roleName) {
        roles.findByApplicationIdAndName(applicationId, roleName).ifPresent(role -> userRoles.findByUserId(userId).stream()
                .filter(ur -> ur.getRoleId().equals(role.getId()))
                .forEach(userRoles::delete));
    }

    private ConsoleAccessAssignment toAssignment(AdminConsoleAccess row, UserAccount user, String appName) {
        return new ConsoleAccessAssignment(
                row.getId(),
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                row.getRoleType(),
                row.getTenantId(),
                row.getApplicationId(),
                appName);
    }

    private ApplicationSummary toSummary(Application app) {
        return new ApplicationSummary(
                app.getId(), app.getTenantId(), app.getName(), app.getSlug(), app.getStatus());
    }
}
