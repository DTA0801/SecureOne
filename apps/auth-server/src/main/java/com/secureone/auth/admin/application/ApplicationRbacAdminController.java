package com.secureone.auth.admin.application;

import com.secureone.auth.admin.role.PermissionAdminDtos;
import com.secureone.auth.admin.role.PermissionAdminService;
import com.secureone.auth.admin.role.RoleAdminDtos;
import com.secureone.auth.admin.role.RoleAdminService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Application-scoped RBAC: roles and permissions (mirrors `role` / `permission` tables). */
@RestController
@RequestMapping("/api/admin/v1/applications/{applicationId}")
public class ApplicationRbacAdminController {

    private final RoleAdminService roles;
    private final PermissionAdminService permissions;

    public ApplicationRbacAdminController(RoleAdminService roles, PermissionAdminService permissions) {
        this.roles = roles;
        this.permissions = permissions;
    }

    @GetMapping("/permissions")
    public List<RoleAdminDtos.PermissionResponse> listPermissions(@PathVariable UUID applicationId) {
        return permissions.list(applicationId);
    }

    @PostMapping("/permissions/seed-defaults")
    public RoleAdminDtos.SeedPermissionsResponse seedDefaultPermissions(@PathVariable UUID applicationId) {
        return permissions.seedDefaults(applicationId);
    }

    @GetMapping("/permissions/{permissionId}")
    public PermissionAdminDtos.PermissionDetailResponse getPermission(
            @PathVariable UUID applicationId, @PathVariable UUID permissionId) {
        return permissions.get(applicationId, permissionId);
    }

    @PostMapping("/permissions")
    @ResponseStatus(HttpStatus.CREATED)
    public PermissionAdminDtos.PermissionDetailResponse createPermission(
            @PathVariable UUID applicationId,
            @Valid @RequestBody PermissionAdminDtos.PermissionCreateRequest request) {
        return permissions.create(applicationId, request);
    }

    @PutMapping("/permissions/{permissionId}")
    public PermissionAdminDtos.PermissionDetailResponse updatePermission(
            @PathVariable UUID applicationId,
            @PathVariable UUID permissionId,
            @Valid @RequestBody PermissionAdminDtos.PermissionUpdateRequest request) {
        return permissions.update(applicationId, permissionId, request);
    }

    @DeleteMapping("/permissions/{permissionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePermission(@PathVariable UUID applicationId, @PathVariable UUID permissionId) {
        permissions.delete(applicationId, permissionId);
    }

    @GetMapping("/roles")
    public List<RoleAdminDtos.RoleSummaryResponse> listRoles(@PathVariable UUID applicationId) {
        return roles.listRoles(null, applicationId);
    }

    @GetMapping("/roles/{roleId}")
    public RoleAdminDtos.RoleDetailResponse getRole(
            @PathVariable UUID applicationId, @PathVariable UUID roleId) {
        return roles.getRole(roleId, applicationId);
    }

    @GetMapping("/roles/{roleId}/users")
    public List<RoleAdminDtos.RoleAssignedUserResponse> listRoleUsers(
            @PathVariable UUID applicationId, @PathVariable UUID roleId) {
        return roles.listUsersForRole(roleId, applicationId);
    }

    @PostMapping("/roles")
    @ResponseStatus(HttpStatus.CREATED)
    public RoleAdminDtos.RoleDetailResponse createRole(
            @PathVariable UUID applicationId, @Valid @RequestBody RoleAdminDtos.RoleCreateRequest request) {
        if (!applicationId.equals(request.applicationId())) {
            throw new IllegalArgumentException("applicationId in body must match the URL.");
        }
        return roles.create(request);
    }

    @PutMapping("/roles/{roleId}")
    public RoleAdminDtos.RoleDetailResponse updateRole(
            @PathVariable UUID applicationId,
            @PathVariable UUID roleId,
            @Valid @RequestBody RoleAdminDtos.RoleUpdateRequest request) {
        return roles.update(roleId, applicationId, request);
    }

    @DeleteMapping("/roles/{roleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRole(@PathVariable UUID applicationId, @PathVariable UUID roleId) {
        roles.delete(roleId, applicationId);
    }
}
