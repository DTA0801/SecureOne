package com.secureone.auth.admin.tenant;

import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.admin.console.AdminConsoleAccess;
import com.secureone.auth.admin.console.AdminConsoleAccessRepository;
import com.secureone.auth.admin.console.AdminConsoleCapabilityService;
import com.secureone.auth.admin.console.AdminConsoleRoleType;
import com.secureone.auth.admin.console.TenantConsoleRoleDefaultsService;
import com.secureone.auth.tenant.TenantRepository;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class TenantConsoleRolesService {

    private final TenantRepository tenants;
    private final AdminConsoleAccessRepository consoleAccess;
    private final AdminConsoleCapabilityService capabilities;
    private final TenantConsoleRoleDefaultsService roleDefaults;

    public TenantConsoleRolesService(
            TenantRepository tenants,
            AdminConsoleAccessRepository consoleAccess,
            AdminConsoleCapabilityService capabilities,
            TenantConsoleRoleDefaultsService roleDefaults) {
        this.tenants = tenants;
        this.consoleAccess = consoleAccess;
        this.capabilities = capabilities;
        this.roleDefaults = roleDefaults;
    }

    public record TenantConsoleRoleResponse(
            String roleType,
            String name,
            String description,
            boolean applicationScoped,
            boolean allApplications,
            List<String> defaultFeatures,
            boolean customized,
            int assignmentCount) {}

    public record TenantConsoleRolesCatalogResponse(
            List<String> features, List<TenantConsoleRoleResponse> roles) {}

    public TenantConsoleRolesCatalogResponse catalog(UUID tenantId) {
        if (!tenants.existsById(tenantId)) {
            throw new ResourceNotFoundException("Tenant not found: " + tenantId);
        }
        List<AdminConsoleAccess> assignments = consoleAccess.findActiveByTenantId(tenantId);
        List<String> features = capabilities.allFeatureKeys();
        List<TenantConsoleRoleResponse> roles = Arrays.stream(AdminConsoleRoleType.values())
                .map(type -> toRole(tenantId, type, assignments))
                .toList();
        return new TenantConsoleRolesCatalogResponse(features, roles);
    }

    public List<String> updateConsoleRoleFeatures(UUID tenantId, String roleKey, List<String> features) {
        return roleDefaults.updateConsoleRoleFeatures(tenantId, roleKey, features);
    }

    private TenantConsoleRoleResponse toRole(
            UUID tenantId, AdminConsoleRoleType type, List<AdminConsoleAccess> assignments) {
        int count = (int) assignments.stream()
                .filter(row -> row.getRoleType() == type)
                .count();
        return new TenantConsoleRoleResponse(
                type.name(),
                displayName(type),
                description(type),
                type == AdminConsoleRoleType.APPLICATION_ADMIN,
                type == AdminConsoleRoleType.TENANT_SUPER_ADMIN,
                roleDefaults.resolveFeatureKeys(tenantId, type.name()),
                roleDefaults.hasCustomDefaults(tenantId, type.name()),
                count);
    }

    private static String displayName(AdminConsoleRoleType type) {
        return switch (type) {
            case APPLICATION_ADMIN -> "Application Admin";
            case TENANT_ADMIN -> "Tenant Admin";
            case TENANT_SUPER_ADMIN -> "Tenant Super Admin";
        };
    }

    private static String description(AdminConsoleRoleType type) {
        return switch (type) {
            case APPLICATION_ADMIN ->
                    "Manage users, roles, groups, and settings for a single assigned OAuth application.";
            case TENANT_ADMIN ->
                    "Manage users, groups, roles, and console access across assigned applications within the tenant.";
            case TENANT_SUPER_ADMIN ->
                    "Full tenant console access across all applications, including operator management.";
        };
    }
}
