package com.secureone.auth.rbac;

import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RbacBootstrapService {

    private final PermissionRepository permissionRepository;

    public RbacBootstrapService(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
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
}
