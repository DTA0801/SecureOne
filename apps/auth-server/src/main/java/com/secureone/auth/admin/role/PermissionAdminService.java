package com.secureone.auth.admin.role;

import com.secureone.auth.admin.ConflictException;
import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.application.ApplicationRepository;
import com.secureone.auth.audit.AuditService;
import com.secureone.auth.rbac.DefaultPermissionCatalog;
import com.secureone.auth.rbac.Permission;
import com.secureone.auth.rbac.PermissionRepository;
import com.secureone.auth.rbac.RbacBootstrapService;
import com.secureone.auth.rbac.RoleRbacRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PermissionAdminService {

    private final PermissionRepository permissionRepository;
    private final RoleRbacRepository rbac;
    private final ApplicationRepository applicationRepository;
    private final AuditService auditService;
    private final RbacBootstrapService rbacBootstrap;

    public PermissionAdminService(
            PermissionRepository permissionRepository,
            RoleRbacRepository rbac,
            ApplicationRepository applicationRepository,
            AuditService auditService,
            RbacBootstrapService rbacBootstrap) {
        this.permissionRepository = permissionRepository;
        this.rbac = rbac;
        this.applicationRepository = applicationRepository;
        this.auditService = auditService;
        this.rbacBootstrap = rbacBootstrap;
    }

    public RoleAdminDtos.SeedPermissionsResponse seedDefaults(UUID applicationId) {
        requireApplication(applicationId);
        int created = rbacBootstrap.seedDefaultPermissions(applicationId);
        auditService.record(null, "admin", "permission.defaults_seeded", "application", applicationId, null, true);
        return new RoleAdminDtos.SeedPermissionsResponse(created, DefaultPermissionCatalog.ENTRIES.size());
    }

    @Transactional(readOnly = true)
    public List<RoleAdminDtos.PermissionResponse> list(UUID applicationId) {
        requireApplication(applicationId);
        return permissionRepository.findByApplicationIdOrderByKeyAsc(applicationId).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public PermissionAdminDtos.PermissionDetailResponse get(UUID applicationId, UUID permissionId) {
        Permission permission = requirePermission(applicationId, permissionId);
        return toDetail(permission);
    }

    public PermissionAdminDtos.PermissionDetailResponse create(
            UUID applicationId, PermissionAdminDtos.PermissionCreateRequest request) {
        requireApplication(applicationId);
        String key = normalizeKey(request.key());
        if (permissionRepository.existsByApplicationIdAndKey(applicationId, key)) {
            throw new ConflictException("Permission key already exists for this application: " + key);
        }
        Permission permission = new Permission();
        permission.setApplicationId(applicationId);
        permission.setKey(key);
        permission.setDescription(request.description());
        try {
            permissionRepository.save(permission);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("Permission key already exists for this application: " + key);
        }
        auditService.record(null, "admin", "permission.created", "permission", permission.getId(), key, true);
        return toDetail(permission);
    }

    public PermissionAdminDtos.PermissionDetailResponse update(
            UUID applicationId,
            UUID permissionId,
            PermissionAdminDtos.PermissionUpdateRequest request) {
        Permission permission = requirePermission(applicationId, permissionId);
        if (request.key() != null && !request.key().isBlank()) {
            String key = normalizeKey(request.key());
            if (!key.equals(permission.getKey())
                    && permissionRepository.existsByApplicationIdAndKey(applicationId, key)) {
                throw new ConflictException("Permission key already exists for this application: " + key);
            }
            permission.setKey(key);
        }
        if (request.description() != null) {
            permission.setDescription(request.description());
        }
        try {
            permissionRepository.save(permission);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("Permission key already exists for this application.");
        }
        auditService.record(null, "admin", "permission.updated", "permission", permission.getId(), permission.getKey(), true);
        return toDetail(permission);
    }

    public void delete(UUID applicationId, UUID permissionId) {
        Permission permission = requirePermission(applicationId, permissionId);
        int roleCount = rbac.countRolesUsingPermission(permissionId);
        if (roleCount > 0) {
            throw new ConflictException(
                    "Remove this permission from " + roleCount + " role(s) before deleting, or delete via SQL after unassigning.");
        }
        permissionRepository.delete(permission);
        auditService.record(null, "admin", "permission.deleted", "permission", permissionId, permission.getKey(), true);
    }

    private Permission requirePermission(UUID applicationId, UUID permissionId) {
        Permission permission =
                permissionRepository
                        .findById(permissionId)
                        .orElseThrow(() -> new ResourceNotFoundException("Permission not found: " + permissionId));
        if (!applicationId.equals(permission.getApplicationId())) {
            throw new ResourceNotFoundException("Permission not found in this application.");
        }
        return permission;
    }

    private void requireApplication(UUID applicationId) {
        if (!applicationRepository.existsById(applicationId)) {
            throw new ResourceNotFoundException("Application not found: " + applicationId);
        }
    }

    private PermissionAdminDtos.PermissionDetailResponse toDetail(Permission permission) {
        List<RoleAdminDtos.RoleRefResponse> roles =
                rbac.findRolesUsingPermission(permission.getId()).stream()
                        .map(r -> new RoleAdminDtos.RoleRefResponse(r.id(), r.name()))
                        .toList();
        return new PermissionAdminDtos.PermissionDetailResponse(
                permission.getId(),
                permission.getApplicationId(),
                permission.getKey(),
                parseResource(permission.getKey()),
                parseAction(permission.getKey()),
                permission.getDescription(),
                roles.size(),
                roles);
    }

    private RoleAdminDtos.PermissionResponse toSummary(Permission permission) {
        return new RoleAdminDtos.PermissionResponse(
                permission.getId(),
                permission.getApplicationId(),
                permission.getKey(),
                parseResource(permission.getKey()),
                parseAction(permission.getKey()),
                permission.getDescription(),
                rbac.countRolesUsingPermission(permission.getId()));
    }

    static String normalizeKey(String key) {
        return key.trim().toLowerCase();
    }

    static String parseResource(String key) {
        int colon = key.indexOf(':');
        return colon > 0 ? key.substring(0, colon) : key;
    }

    static String parseAction(String key) {
        int colon = key.indexOf(':');
        return colon > 0 ? key.substring(colon + 1) : "access";
    }
}
