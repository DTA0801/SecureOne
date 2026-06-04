package com.secureone.auth.admin.role;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin — platform RBAC", description = "Platform-wide roles and permissions")
@SecurityRequirement(name = "adminHttpBasic")
@RestController
@RequestMapping("/api/admin/v1")
public class RoleAdminController {

    private final RoleAdminService roles;
    private final PermissionAdminService permissions;

    public RoleAdminController(RoleAdminService roles, PermissionAdminService permissions) {
        this.roles = roles;
        this.permissions = permissions;
    }

    @GetMapping("/permissions")
    public List<RoleAdminDtos.PermissionResponse> listPermissions(
            @RequestParam UUID applicationId) {
        return permissions.list(applicationId);
    }

    @GetMapping("/permissions/{id}")
    public PermissionAdminDtos.PermissionDetailResponse getPermission(
            @PathVariable UUID id, @RequestParam UUID applicationId) {
        return permissions.get(applicationId, id);
    }

    @PostMapping("/permissions")
    @ResponseStatus(HttpStatus.CREATED)
    public PermissionAdminDtos.PermissionDetailResponse createPermission(
            @RequestParam UUID applicationId,
            @Valid @RequestBody PermissionAdminDtos.PermissionCreateRequest request) {
        return permissions.create(applicationId, request);
    }

    @PutMapping("/permissions/{id}")
    public PermissionAdminDtos.PermissionDetailResponse updatePermission(
            @PathVariable UUID id,
            @RequestParam UUID applicationId,
            @Valid @RequestBody PermissionAdminDtos.PermissionUpdateRequest request) {
        return permissions.update(applicationId, id, request);
    }

    @DeleteMapping("/permissions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePermission(@PathVariable UUID id, @RequestParam UUID applicationId) {
        permissions.delete(applicationId, id);
    }

    @GetMapping("/roles")
    public List<RoleAdminDtos.RoleSummaryResponse> list(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID applicationId) {
        return roles.listRoles(tenantId, applicationId);
    }

    @GetMapping("/roles/{id}")
    public RoleAdminDtos.RoleDetailResponse get(
            @PathVariable UUID id, @RequestParam(required = false) UUID applicationId) {
        return roles.getRole(id, applicationId);
    }

    @PostMapping("/roles")
    @ResponseStatus(HttpStatus.CREATED)
    public RoleAdminDtos.RoleDetailResponse create(@Valid @RequestBody RoleAdminDtos.RoleCreateRequest request) {
        return roles.create(request);
    }

    @PutMapping("/roles/{id}")
    public RoleAdminDtos.RoleDetailResponse update(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID applicationId,
            @Valid @RequestBody RoleAdminDtos.RoleUpdateRequest request) {
        return roles.update(id, applicationId, request);
    }

    @DeleteMapping("/roles/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @RequestParam(required = false) UUID applicationId) {
        roles.delete(id, applicationId);
    }
}
