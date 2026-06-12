package com.secureone.auth.tenant.rbac;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TenantRbacBootstrapService {

    private final TenantPermissionRepository permissions;
    private final TenantRoleRepository roles;
    private final TenantRbacRepository rbac;

    public TenantRbacBootstrapService(
            TenantPermissionRepository permissions,
            TenantRoleRepository roles,
            TenantRbacRepository rbac) {
        this.permissions = permissions;
        this.roles = roles;
        this.rbac = rbac;
    }

    public void seedForTenant(UUID tenantId) {
        for (TenantPermissionCatalog.Entry entry : TenantPermissionCatalog.ENTRIES) {
            if (!permissions.existsByTenantIdAndKey(tenantId, entry.key())) {
                TenantPermission row = new TenantPermission();
                row.setTenantId(tenantId);
                row.setKey(entry.key());
                row.setDescription(entry.description());
                permissions.save(row);
            }
        }
        Map<String, UUID> byKey = permissions.findByTenantIdOrderByKeyAsc(tenantId).stream()
                .collect(Collectors.toMap(TenantPermission::getKey, TenantPermission::getId, (a, b) -> a));

        ensureRole(
                tenantId,
                "Tenant Administrator",
                "Full tenant governance — operators, applications, and console features",
                TenantPermissionCatalog.TENANT_ADMINISTRATOR,
                byKey,
                List.of());
        ensureRole(
                tenantId,
                "Application Operator",
                "Manage users and settings for assigned applications",
                TenantPermissionCatalog.APPLICATION_OPERATOR,
                byKey,
                List.of());
        ensureRole(
                tenantId,
                "Tenant Auditor",
                "Read-only access to tenant roster, audit, and logs",
                TenantPermissionCatalog.TENANT_AUDITOR,
                byKey,
                List.of());
    }

    private void ensureRole(
            UUID tenantId,
            String name,
            String description,
            List<String> permissionKeys,
            Map<String, UUID> byKey,
            List<UUID> applicationIds) {
        TenantRole role = roles.findByTenantIdAndName(tenantId, name).orElseGet(() -> {
            TenantRole created = new TenantRole();
            created.setTenantId(tenantId);
            created.setName(name);
            created.setDescription(description);
            created.setSystemRole(true);
            return roles.save(created);
        });
        if (!role.isSystemRole()) {
            role.setSystemRole(true);
            roles.save(role);
        }
        if (rbac.countPermissionsByRoleId(role.getId()) == 0) {
            List<UUID> permissionIds =
                    permissionKeys.stream().map(byKey::get).filter(java.util.Objects::nonNull).toList();
            rbac.replacePermissions(role.getId(), permissionIds);
        }
        if (!applicationIds.isEmpty()) {
            rbac.replaceApplications(role.getId(), applicationIds);
        }
    }
}
