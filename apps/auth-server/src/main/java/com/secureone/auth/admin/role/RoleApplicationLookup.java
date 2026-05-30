package com.secureone.auth.admin.role;

import com.secureone.auth.rbac.PermissionRepository;
import com.secureone.auth.rbac.RoleRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Resolves application scope for flat `/roles/{id}` and `/permissions/{id}` admin routes. */
@Component
public class RoleApplicationLookup {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public RoleApplicationLookup(RoleRepository roleRepository, PermissionRepository permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }

    public Optional<UUID> applicationIdForRole(UUID roleId) {
        return roleRepository.findById(roleId).map(r -> r.getApplicationId());
    }

    public Optional<UUID> applicationIdForPermission(UUID permissionId) {
        return permissionRepository.findById(permissionId).map(p -> p.getApplicationId());
    }
}
