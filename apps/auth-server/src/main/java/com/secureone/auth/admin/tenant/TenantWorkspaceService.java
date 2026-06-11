package com.secureone.auth.admin.tenant;

import com.secureone.auth.admin.AdminAccessService;
import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.admin.console.AdminConsoleAccess;
import com.secureone.auth.admin.console.AdminConsoleAccessRepository;
import com.secureone.auth.admin.console.AdminConsoleAccessService;
import com.secureone.auth.admin.console.AdminConsoleAccessService.ConsoleAccessAssignment;
import com.secureone.auth.admin.console.AdminConsoleRoleType;
import com.secureone.auth.admin.AdminAccessService.ApplicationSummary;
import com.secureone.auth.admin.AdminOperatorService;
import com.secureone.auth.admin.application.ApplicationUserAdminService;
import com.secureone.auth.admin.user.UserAdminDtos.UserResponse;
import com.secureone.auth.admin.user.UserAdminService;
import com.secureone.auth.application.Application;
import com.secureone.auth.application.ApplicationRepository;
import com.secureone.auth.application.UserApplicationRepository;
import com.secureone.auth.rbac.Role;
import com.secureone.auth.rbac.RoleRepository;
import com.secureone.auth.rbac.UserRole;
import com.secureone.auth.rbac.UserRoleRepository;
import com.secureone.auth.tenant.Tenant;
import com.secureone.auth.tenant.TenantRepository;
import com.secureone.auth.tenant.TenantUserRoster;
import com.secureone.auth.tenant.TenantUserRosterRepository;
import com.secureone.auth.tenant.TenantUserRosterService;
import com.secureone.auth.user.UserAccount;
import com.secureone.auth.user.UserAccountRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class TenantWorkspaceService {

    private final AdminOperatorService operators;
    private final AdminAccessService access;
    private final TenantRepository tenants;
    private final ApplicationRepository applications;
    private final UserAccountRepository users;
    private final UserApplicationRepository memberships;
    private final UserAdminService userAdminService;
    private final ApplicationUserAdminService applicationUsers;
    private final RoleRepository roles;
    private final UserRoleRepository userRoles;
    private final JdbcTemplate jdbc;
    private final AdminConsoleAccessService consoleAccess;
    private final AdminConsoleAccessRepository consoleAccessRepo;
    private final TenantUserRosterRepository tenantUserRoster;
    private final TenantUserRosterService tenantUserRosterService;

    public TenantWorkspaceService(
            AdminOperatorService operators,
            AdminAccessService access,
            TenantRepository tenants,
            ApplicationRepository applications,
            UserAccountRepository users,
            UserApplicationRepository memberships,
            UserAdminService userAdminService,
            ApplicationUserAdminService applicationUsers,
            RoleRepository roles,
            UserRoleRepository userRoles,
            JdbcTemplate jdbc,
            AdminConsoleAccessService consoleAccess,
            AdminConsoleAccessRepository consoleAccessRepo,
            TenantUserRosterRepository tenantUserRoster,
            TenantUserRosterService tenantUserRosterService) {
        this.operators = operators;
        this.access = access;
        this.tenants = tenants;
        this.applications = applications;
        this.users = users;
        this.memberships = memberships;
        this.userAdminService = userAdminService;
        this.applicationUsers = applicationUsers;
        this.roles = roles;
        this.userRoles = userRoles;
        this.jdbc = jdbc;
        this.consoleAccess = consoleAccess;
        this.consoleAccessRepo = consoleAccessRepo;
        this.tenantUserRoster = tenantUserRoster;
        this.tenantUserRosterService = tenantUserRosterService;
    }

    public record TenantWorkspaceApplication(
            UUID id, String name, String slug, String status, long userCount) {}

    public record TenantWorkspaceApplicationAccess(
            UUID applicationId,
            String applicationName,
            List<UUID> roleIds,
            List<String> roleNames,
            List<String> permissionKeys) {}

    public record TenantWorkspaceUser(
            UUID id,
            String email,
            String displayName,
            String status,
            boolean emailVerified,
            List<UUID> applicationIds,
            List<String> roleNames,
            boolean onRoster,
            String rosterSource,
            UUID sourceApplicationId,
            String sourceApplicationName,
            Instant rosterAddedAt,
            UUID rosterAddedById,
            String rosterAddedByLabel,
            List<TenantWorkspaceApplicationAccess> applicationAccess) {}

    public record TenantAdminOperator(
            UUID userId,
            String email,
            String displayName,
            String status,
            List<UUID> tenantAdminApplicationIds) {}

    public record TenantWorkspaceResponse(
            UUID tenantId,
            String tenantSlug,
            String tenantName,
            String status,
            String plan,
            long userCount,
            int applicationCount,
            List<TenantWorkspaceApplication> applications,
            List<TenantWorkspaceUser> users,
            List<ConsoleAccessAssignment> consoleAccess) {}

    public TenantWorkspaceResponse workspace(Authentication authentication, String actAsEmail) {
        requireTenantOperator(authentication, actAsEmail);
        Tenant tenant = resolveWorkspaceTenant(authentication, actAsEmail);
        List<ApplicationSummary> accessible =
                access.accessibleApplications(authentication, actAsEmail).stream()
                        .filter(a -> a.tenantId().equals(tenant.getId()))
                        .toList();

        List<TenantWorkspaceApplication> appItems = new ArrayList<>();
        for (ApplicationSummary app : accessible) {
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM user_application WHERE application_id = ?",
                    Integer.class,
                    app.id());
            long userCount = count != null ? count : 0L;
            appItems.add(new TenantWorkspaceApplication(
                    app.id(), app.name(), app.slug(), app.status(), userCount));
        }

        List<UUID> accessibleAppIds = accessible.stream().map(ApplicationSummary::id).toList();
        List<TenantWorkspaceUser> userItems = buildWorkspaceUsers(tenant, accessibleAppIds);

        String plan = "standard";
        if (tenant.getSettings() != null && tenant.getSettings().get("plan") != null) {
            plan = String.valueOf(tenant.getSettings().get("plan"));
        }

        return new TenantWorkspaceResponse(
                tenant.getId(),
                tenant.getSlug(),
                tenant.getName(),
                tenant.getStatus(),
                plan,
                userItems.size(),
                appItems.size(),
                appItems,
                userItems,
                consoleAccess.listForTenant(tenant.getId()));
    }

    /** Platform super-admin: full tenant workspace (all apps and users in the tenant). */
    public TenantWorkspaceResponse workspaceForPlatform(
            Authentication authentication, String actAsEmail, UUID tenantId) {
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required");
        }
        Tenant tenant = tenants.findById(tenantId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        List<Application> tenantApps = applications.findByTenantIdOrderByCreatedAtDesc(tenant.getId());
        List<UUID> tenantAppIds =
                tenantApps.stream().map(Application::getId).toList();

        List<TenantWorkspaceApplication> appItems = new ArrayList<>();
        for (Application app : tenantApps) {
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM user_application WHERE application_id = ?",
                    Integer.class,
                    app.getId());
            long userCount = count != null ? count : 0L;
            appItems.add(new TenantWorkspaceApplication(
                    app.getId(), app.getName(), app.getSlug(), app.getStatus(), userCount));
        }

        List<TenantWorkspaceUser> userItems = buildWorkspaceUsers(tenant, tenantAppIds);

        String plan = "standard";
        if (tenant.getSettings() != null && tenant.getSettings().get("plan") != null) {
            plan = String.valueOf(tenant.getSettings().get("plan"));
        }

        return new TenantWorkspaceResponse(
                tenant.getId(),
                tenant.getSlug(),
                tenant.getName(),
                tenant.getStatus(),
                plan,
                userItems.size(),
                appItems.size(),
                appItems,
                userItems,
                consoleAccess.listForTenant(tenant.getId()));
    }

    public List<TenantWorkspaceUser> listImportableUsersForPlatform(
            Authentication authentication, String actAsEmail, UUID tenantId, UUID applicationId) {
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required");
        }
        Tenant tenant = tenants.findById(tenantId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        applications
                .findById(applicationId)
                .filter(a -> a.getTenantId().equals(tenant.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Application not in tenant"));
        return listImportableUsers(tenant, applicationId);
    }

    @Transactional
    public void importUserToRosterForPlatform(
            Authentication authentication,
            String actAsEmail,
            UUID tenantId,
            UUID userId,
            UUID applicationId) {
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required");
        }
        UUID addedBy = resolveOperatorUserId(authentication, actAsEmail);
        tenantUserRosterService.importFromApplication(tenantId, userId, applicationId, addedBy);
    }

    @Transactional
    public int bulkImportUsersToRosterForPlatform(
            Authentication authentication,
            String actAsEmail,
            UUID tenantId,
            UUID applicationId,
            List<UUID> userIds) {
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required");
        }
        tenants.findById(tenantId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        applications
                .findById(applicationId)
                .filter(a -> a.getTenantId().equals(tenantId))
                .orElseThrow(() -> new IllegalArgumentException("Application not in tenant"));
        UUID addedBy = resolveOperatorUserId(authentication, actAsEmail);
        return tenantUserRosterService.bulkImportFromApplication(tenantId, userIds, applicationId, addedBy);
    }

    @Transactional
    public void removeUserFromRosterForPlatform(
            Authentication authentication, String actAsEmail, UUID tenantId, UUID userId) {
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required");
        }
        tenants.findById(tenantId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        tenantUserRosterService.removeFromRoster(tenantId, userId);
    }

    @Transactional
    public void updateUserApplicationRolesForPlatform(
            Authentication authentication,
            String actAsEmail,
            UUID tenantId,
            UUID userId,
            UUID applicationId,
            List<UUID> roleIds) {
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required");
        }
        Tenant tenant = tenants.findById(tenantId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        UserAccount user = users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!user.getTenantId().equals(tenant.getId())) {
            throw new IllegalArgumentException("User must belong to this tenant");
        }
        applications
                .findById(applicationId)
                .filter(a -> a.getTenantId().equals(tenant.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Application not in tenant"));
        requireOnTenantRoster(tenant.getId(), userId);
        if (!memberships.existsByUserIdAndApplicationId(userId, applicationId)) {
            throw new IllegalArgumentException("User must be a member of this application to assign roles");
        }
        syncUserRolesForApplication(userId, applicationId, roleIds);
    }

    public List<TenantAdminOperator> listTenantAdminOperatorsForPlatform(
            Authentication authentication, String actAsEmail, UUID tenantId) {
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required");
        }
        tenants.findById(tenantId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        return listTenantAdminOperators(tenantId);
    }

    public List<TenantAdminOperator> listTenantAdminOperators(UUID tenantId) {
        List<UUID> allTenantAppIds = applications.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(Application::getId)
                .toList();
        Map<UUID, TenantAdminOperator> byUser = new LinkedHashMap<>();
        for (AdminConsoleAccess row : consoleAccessRepo.findActiveByTenantId(tenantId)) {
            if (row.getRoleType() != AdminConsoleRoleType.TENANT_ADMIN
                    && row.getRoleType() != AdminConsoleRoleType.TENANT_SUPER_ADMIN) {
                continue;
            }
            UserAccount user = users.findById(row.getUserId()).orElse(null);
            if (user == null) {
                continue;
            }
            TenantAdminOperator existing = byUser.get(user.getId());
            List<UUID> appIds = existing != null
                    ? new ArrayList<>(existing.tenantAdminApplicationIds())
                    : new ArrayList<>();
            if (row.getRoleType() == AdminConsoleRoleType.TENANT_SUPER_ADMIN) {
                appIds = new ArrayList<>(allTenantAppIds);
            } else if (row.getApplicationId() != null && !appIds.contains(row.getApplicationId())) {
                appIds.add(row.getApplicationId());
            }
            byUser.put(
                    user.getId(),
                    new TenantAdminOperator(
                            user.getId(),
                            user.getEmail(),
                            user.getDisplayName(),
                            user.getStatus(),
                            appIds));
        }
        return new ArrayList<>(byUser.values());
    }

    @Transactional
    public void grantApplicationForPlatform(
            Authentication authentication,
            String actAsEmail,
            UUID tenantId,
            UUID userId,
            UUID applicationId) {
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required");
        }
        Tenant tenant = tenants.findById(tenantId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        UserAccount user = users.findById(userId).orElseThrow();
        if (!user.getTenantId().equals(tenant.getId())) {
            throw new IllegalArgumentException("User must belong to this tenant");
        }
        applications
                .findById(applicationId)
                .filter(a -> a.getTenantId().equals(tenant.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Application not in tenant"));
        requireOnTenantRoster(tenant.getId(), userId);
        applicationUsers.grantAccess(applicationId, userId);
    }

    @Transactional
    public void revokeApplicationForPlatform(
            Authentication authentication,
            String actAsEmail,
            UUID tenantId,
            UUID userId,
            UUID applicationId) {
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required");
        }
        Tenant tenant = tenants.findById(tenantId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        UserAccount user = users.findById(userId).orElseThrow();
        if (!user.getTenantId().equals(tenant.getId())) {
            throw new IllegalArgumentException("User must belong to this tenant");
        }
        applications
                .findById(applicationId)
                .filter(a -> a.getTenantId().equals(tenant.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Application not in tenant"));
        applicationUsers.revokeAccess(applicationId, userId);
    }

    @Transactional
    public void grantApplication(
            Authentication authentication, String actAsEmail, UUID userId, UUID applicationId) {
        requireTenantOperator(authentication, actAsEmail);
        Tenant tenant = resolveWorkspaceTenant(authentication, actAsEmail);
        requireAccessibleApp(authentication, actAsEmail, tenant, applicationId);
        UserAccount user = users.findById(userId).orElseThrow();
        if (!user.getTenantId().equals(tenant.getId())) {
            throw new IllegalArgumentException("User must belong to this tenant");
        }
        requireOnTenantRoster(tenant.getId(), userId);
        applicationUsers.grantAccess(applicationId, userId);
    }

    @Transactional
    public void revokeApplication(
            Authentication authentication, String actAsEmail, UUID userId, UUID applicationId) {
        requireTenantOperator(authentication, actAsEmail);
        Tenant tenant = resolveWorkspaceTenant(authentication, actAsEmail);
        requireAccessibleApp(authentication, actAsEmail, tenant, applicationId);
        UserAccount user = users.findById(userId).orElseThrow();
        if (!user.getTenantId().equals(tenant.getId())) {
            throw new IllegalArgumentException("User must belong to this tenant");
        }
        applicationUsers.revokeAccess(applicationId, userId);
    }

    @Transactional
    public UserResponse assignTenantAdminRole(
            Authentication authentication, String actAsEmail, UUID userId, UUID applicationId) {
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only platform super-admin may assign tenant admin roles");
        }
        UserAccount user = users.findById(userId).orElseThrow();
        Tenant tenant = tenants.findById(user.getTenantId()).orElseThrow();
        consoleAccess.grant(
                tenant.getId(),
                userId,
                AdminConsoleRoleType.TENANT_ADMIN,
                applicationId,
                null);
        return userAdminService.toResponsePublic(
                users.findById(userId).orElseThrow(), applicationId);
    }

    @Transactional
    public void revokeTenantAdminRole(
            Authentication authentication, String actAsEmail, UUID userId, UUID applicationId) {
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only platform super-admin may remove tenant admin roles");
        }
        UserAccount user = users.findById(userId).orElseThrow();
        Tenant tenant = tenants.findById(user.getTenantId()).orElseThrow();
        consoleAccess.revoke(tenant.getId(), userId, AdminConsoleRoleType.TENANT_ADMIN, applicationId);
    }

    private List<TenantWorkspaceUser> buildWorkspaceUsers(Tenant tenant, List<UUID> relevantAppIds) {
        Set<UUID> userIds = workspaceUserIds(tenant.getId());
        Map<UUID, TenantUserRoster> rosterByUser =
                tenantUserRoster.findByTenantIdOrderByAddedAtDesc(tenant.getId()).stream()
                        .collect(Collectors.toMap(TenantUserRoster::getUserId, row -> row, (a, b) -> a));
        Map<UUID, String> appNameById = applications.findByTenantIdOrderByCreatedAtDesc(tenant.getId()).stream()
                .collect(Collectors.toMap(Application::getId, Application::getName, (a, b) -> a));

        List<TenantWorkspaceUser> userItems = new ArrayList<>();
        for (UUID userId : userIds) {
            UserAccount user = users.findById(userId).orElse(null);
            if (user == null || !user.getTenantId().equals(tenant.getId())) {
                continue;
            }
            List<UUID> appIds = memberships.findByUserId(user.getId()).stream()
                    .map(ua -> ua.getApplicationId())
                    .filter(relevantAppIds::contains)
                    .toList();
            List<String> roleNames = jdbc.queryForList(
                    """
                    SELECT DISTINCT r.name
                    FROM user_role ur
                    JOIN role r ON r.id = ur.role_id
                    WHERE ur.user_id = ?
                    ORDER BY r.name
                    """,
                    String.class,
                    user.getId());

            TenantUserRoster rosterRow = rosterByUser.get(userId);
            boolean onRoster = rosterRow != null;
            String rosterSource = onRoster ? rosterRow.getSource() : "console_only";
            UUID sourceApplicationId = onRoster ? rosterRow.getSourceApplicationId() : null;
            String sourceApplicationName =
                    sourceApplicationId != null
                            ? appNameById.getOrDefault(sourceApplicationId, sourceApplicationId.toString())
                            : null;
            Instant rosterAddedAt = onRoster ? rosterRow.getAddedAt() : null;
            UUID rosterAddedById = onRoster ? rosterRow.getAddedBy() : null;
            String rosterAddedByLabel = resolveAddedByLabel(rosterAddedById);

            List<TenantWorkspaceApplicationAccess> applicationAccess = new ArrayList<>();
            for (UUID appId : relevantAppIds) {
                if (!appIds.contains(appId)) {
                    continue;
                }
                applicationAccess.add(buildApplicationAccess(userId, appId, appNameById.get(appId)));
            }

            userItems.add(new TenantWorkspaceUser(
                    user.getId(),
                    user.getEmail(),
                    user.getDisplayName(),
                    user.getStatus(),
                    user.isEmailVerified(),
                    appIds,
                    roleNames,
                    onRoster,
                    rosterSource,
                    sourceApplicationId,
                    sourceApplicationName,
                    rosterAddedAt,
                    rosterAddedById,
                    rosterAddedByLabel,
                    applicationAccess));
        }
        userItems.sort(Comparator.comparing(TenantWorkspaceUser::email, String.CASE_INSENSITIVE_ORDER));
        return userItems;
    }

    private String resolveAddedByLabel(UUID addedById) {
        if (addedById == null) {
            return null;
        }
        return users.findById(addedById)
                .map(u -> {
                    String name = u.getDisplayName();
                    if (name != null && !name.isBlank()) {
                        return name;
                    }
                    return u.getEmail();
                })
                .orElse(null);
    }

    private UUID resolveOperatorUserId(Authentication authentication, String actAsEmail) {
        String email = access.resolveOperatorEmail(authentication, actAsEmail);
        if (email == null || email.isBlank()) {
            return null;
        }
        return users.findByEmailIgnoreCase(email).stream()
                .findFirst()
                .map(UserAccount::getId)
                .orElse(null);
    }

    private TenantWorkspaceApplicationAccess buildApplicationAccess(UUID userId, UUID appId, String appName) {
        List<UUID> roleIds = jdbc.queryForList(
                """
                SELECT ur.role_id
                FROM user_role ur
                JOIN role r ON r.id = ur.role_id
                WHERE ur.user_id = ? AND r.application_id = ?
                ORDER BY r.name
                """,
                UUID.class,
                userId,
                appId);
        List<String> roleNames = jdbc.queryForList(
                """
                SELECT r.name
                FROM user_role ur
                JOIN role r ON r.id = ur.role_id
                WHERE ur.user_id = ? AND r.application_id = ?
                ORDER BY r.name
                """,
                String.class,
                userId,
                appId);
        List<String> permissionKeys = jdbc.queryForList(
                """
                SELECT DISTINCT p.key
                FROM user_role ur
                JOIN role r ON r.id = ur.role_id
                JOIN role_permission rp ON rp.role_id = r.id
                JOIN permission p ON p.id = rp.permission_id
                WHERE ur.user_id = ? AND r.application_id = ?
                ORDER BY p.key
                """,
                String.class,
                userId,
                appId);
        return new TenantWorkspaceApplicationAccess(
                appId, appName != null ? appName : appId.toString(), roleIds, roleNames, permissionKeys);
    }

    private void syncUserRolesForApplication(UUID userId, UUID applicationId, List<UUID> roleIds) {
        userRoles.deleteByUserIdAndApplicationId(userId, applicationId);
        if (roleIds == null || roleIds.isEmpty()) {
            return;
        }
        LinkedHashSet<UUID> unique = new LinkedHashSet<>(roleIds);
        for (UUID roleId : unique) {
            Role role = roles.findById(roleId).orElseThrow(() -> new ResourceNotFoundException("Role not found"));
            if (!role.getApplicationId().equals(applicationId)) {
                throw new IllegalArgumentException("Role does not belong to this application");
            }
            UserRole grant = new UserRole();
            grant.setUserId(userId);
            grant.setRoleId(roleId);
            userRoles.save(grant);
        }
    }

    private Set<UUID> workspaceUserIds(UUID tenantId) {
        Set<UUID> ids = new LinkedHashSet<>();
        tenantUserRoster.findByTenantIdOrderByAddedAtDesc(tenantId).forEach(row -> ids.add(row.getUserId()));
        consoleAccessRepo.findActiveByTenantId(tenantId).forEach(row -> ids.add(row.getUserId()));
        return ids;
    }

    private List<TenantWorkspaceUser> listImportableUsers(Tenant tenant, UUID applicationId) {
        List<TenantWorkspaceUser> importable = new ArrayList<>();
        for (UUID userId : memberships.findUserIdsByApplicationId(applicationId)) {
            if (tenantUserRoster.existsByTenantIdAndUserId(tenant.getId(), userId)) {
                continue;
            }
            UserAccount user = users.findById(userId).orElse(null);
            if (user == null || !user.getTenantId().equals(tenant.getId())) {
                continue;
            }
            List<String> roleNames = jdbc.queryForList(
                    """
                    SELECT DISTINCT r.name
                    FROM user_role ur
                    JOIN role r ON r.id = ur.role_id
                    WHERE ur.user_id = ?
                    ORDER BY r.name
                    """,
                    String.class,
                    userId);
            importable.add(new TenantWorkspaceUser(
                    user.getId(),
                    user.getEmail(),
                    user.getDisplayName(),
                    user.getStatus(),
                    user.isEmailVerified(),
                    List.of(applicationId),
                    roleNames,
                    false,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    List.of(buildApplicationAccess(
                            userId,
                            applicationId,
                            applications
                                    .findById(applicationId)
                                    .map(Application::getName)
                                    .orElse(applicationId.toString())))));
        }
        importable.sort(Comparator.comparing(TenantWorkspaceUser::email, String.CASE_INSENSITIVE_ORDER));
        return importable;
    }

    private void requireOnTenantRoster(UUID tenantId, UUID userId) {
        if (!tenantUserRoster.existsByTenantIdAndUserId(tenantId, userId)
                && consoleAccessRepo.findActiveByTenantId(tenantId).stream()
                        .noneMatch(row -> row.getUserId().equals(userId))) {
            throw new IllegalArgumentException(
                    "User is not on the tenant roster. Import from an application first.");
        }
    }

    private void requireTenantOperator(Authentication authentication, String actAsEmail) {
        if (operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Use platform tenant management for super-admin");
        }
        String tier = access.resolveOperatorTier(authentication, actAsEmail);
        if (!"tenant".equals(tier) && !"tenant_super".equals(tier)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Tenant workspace requires tenant admin console access");
        }
    }

    private Tenant resolveWorkspaceTenant(Authentication authentication, String actAsEmail) {
        if (operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Use platform tenant management for super-admin");
        }
        return operators.requireOperatorTenant(authentication, actAsEmail);
    }

    private void requireAccessibleApp(
            Authentication authentication,
            String actAsEmail,
            Tenant tenant,
            UUID applicationId) {
        access.requireApplicationAccess(authentication, actAsEmail, applicationId);
        applications
                .findById(applicationId)
                .filter(a -> a.getTenantId().equals(tenant.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Application not in tenant"));
    }
}
