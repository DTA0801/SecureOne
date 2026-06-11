package com.secureone.auth.rbac;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RbacBootstrapService {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final RoleRbacRepository roleRbac;

    public RbacBootstrapService(
            PermissionRepository permissionRepository,
            RoleRepository roleRepository,
            RoleRbacRepository roleRbac) {
        this.permissionRepository = permissionRepository;
        this.roleRepository = roleRepository;
        this.roleRbac = roleRbac;
    }

    /** Inserts missing default permission rows for an application (idempotent). */
    public int seedDefaultPermissions(UUID applicationId) {
        int created = 0;
        for (DefaultPermissionCatalog.DefaultPermission entry : DefaultPermissionCatalog.ENTRIES) {
            if (permissionRepository.existsByApplicationIdAndKey(applicationId, entry.key())) {
                continue;
            }
            Permission permission = new Permission();
            permission.setApplicationId(applicationId);
            permission.setKey(entry.key());
            permission.setDescription(entry.description());
            permissionRepository.save(permission);
            created++;
        }
        return created;
    }

    /** Inserts missing standard system roles and default permission grants (idempotent). */
    public void seedDefaultRoles(UUID tenantId, UUID applicationId) {
        seedDefaultPermissions(applicationId);
        Map<String, UUID> permissionsByKey =
                permissionRepository.findByApplicationIdOrderByKeyAsc(applicationId).stream()
                        .collect(Collectors.toMap(Permission::getKey, Permission::getId, (a, b) -> a));

        ensureRole(
                tenantId,
                applicationId,
                "Tenant Admin",
                "Full tenant administration",
                false,
                List.of(
                        "user:read",
                        "user:write",
                        "user:delete",
                        "role:read",
                        "role:write",
                        "app:read",
                        "app:write",
                        "settings:write",
                        "audit:read",
                        "session:read"),
                permissionsByKey);
        ensureRole(
                tenantId,
                applicationId,
                "Member",
                "Standard end-user access",
                true,
                List.of("user:read"),
                permissionsByKey);
        ensureRole(
                tenantId,
                applicationId,
                "Application Admin",
                "Manage users and roles for this application in SecureOne Admin",
                false,
                List.of("user:read", "user:write", "role:read", "app:read", "audit:read", "session:read"),
                permissionsByKey);
        ensureRole(
                tenantId,
                applicationId,
                "Security Auditor",
                "Read-only access to audit and identity data",
                false,
                List.of("audit:read", "user:read", "role:read", "session:read"),
                permissionsByKey);
    }

    private void ensureRole(
            UUID tenantId,
            UUID applicationId,
            String name,
            String description,
            boolean defaultRole,
            List<String> permissionKeys,
            Map<String, UUID> permissionsByKey) {
        Role role =
                roleRepository
                        .findByApplicationIdAndName(applicationId, name)
                        .orElseGet(
                                () -> {
                                    Role created = new Role();
                                    created.setTenantId(tenantId);
                                    created.setApplicationId(applicationId);
                                    created.setName(name);
                                    created.setDescription(description);
                                    created.setComposite(false);
                                    created.setSystemRole(true);
                                    created.setDefaultRole(defaultRole);
                                    return roleRepository.save(created);
                                });
        if (!defaultRole && role.isDefaultRole()) {
            role.setDefaultRole(false);
            roleRepository.save(role);
        } else if (defaultRole && !role.isDefaultRole()) {
            role.setDefaultRole(true);
            roleRepository.save(role);
        }
        if (roleRbac.countPermissions(role.getId()) > 0) {
            return;
        }
        List<UUID> permissionIds =
                permissionKeys.stream().map(permissionsByKey::get).filter(java.util.Objects::nonNull).toList();
        if (!permissionIds.isEmpty()) {
            roleRbac.replacePermissions(role.getId(), permissionIds);
        }
    }
}
