package com.secureone.auth.admin.tenant;

import com.secureone.auth.admin.AdminAccessService;
import com.secureone.auth.admin.tenant.TenantRbacAdminDtos.TenantPermissionCreateRequest;
import com.secureone.auth.admin.tenant.TenantRbacAdminDtos.TenantPermissionResponse;
import com.secureone.auth.admin.tenant.TenantRbacAdminDtos.TenantRoleCreateRequest;
import com.secureone.auth.admin.tenant.TenantRbacAdminDtos.TenantRoleDetailResponse;
import com.secureone.auth.admin.tenant.TenantRbacAdminDtos.TenantRoleSummaryResponse;
import com.secureone.auth.admin.tenant.TenantRbacAdminDtos.TenantRoleUpdateRequest;
import com.secureone.auth.admin.tenant.TenantRbacAdminDtos.ReplaceUserTenantRolesRequest;
import com.secureone.auth.admin.tenant.TenantRbacAdminDtos.UserTenantRoleAssignmentsResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin — tenant RBAC", description = "Tenant-scoped roles and permissions (platform governance)")
@SecurityRequirement(name = "adminHttpBasic")
@RestController
@RequestMapping("/api/admin/v1/tenants/{tenantId}/tenant-rbac")
public class TenantRbacAdminController {

    private final TenantRbacAdminService rbac;
    private final AdminAccessService access;

    public TenantRbacAdminController(TenantRbacAdminService rbac, AdminAccessService access) {
        this.rbac = rbac;
        this.access = access;
    }

    @GetMapping("/permissions")
    public List<TenantPermissionResponse> listPermissions(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId) {
        requirePlatform(authentication, actAsEmail, tenantId);
        return rbac.listPermissions(tenantId);
    }

    @PostMapping("/permissions")
    @ResponseStatus(HttpStatus.CREATED)
    public TenantPermissionResponse createPermission(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId,
            @Valid @RequestBody TenantPermissionCreateRequest request) {
        requirePlatform(authentication, actAsEmail, tenantId);
        return rbac.createPermission(tenantId, request);
    }

    @DeleteMapping("/permissions/{permissionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePermission(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId,
            @PathVariable UUID permissionId) {
        requirePlatform(authentication, actAsEmail, tenantId);
        rbac.deletePermission(tenantId, permissionId);
    }

    @GetMapping("/roles")
    public List<TenantRoleSummaryResponse> listRoles(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId,
            @RequestParam(defaultValue = "false") boolean customOnly) {
        requirePlatform(authentication, actAsEmail, tenantId);
        return rbac.listRoles(tenantId, customOnly);
    }

    @GetMapping("/roles/{roleId}")
    public TenantRoleDetailResponse getRole(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId,
            @PathVariable UUID roleId) {
        requirePlatform(authentication, actAsEmail, tenantId);
        return rbac.getRole(tenantId, roleId);
    }

    @PostMapping("/roles")
    @ResponseStatus(HttpStatus.CREATED)
    public TenantRoleDetailResponse createRole(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId,
            @Valid @RequestBody TenantRoleCreateRequest request) {
        requirePlatform(authentication, actAsEmail, tenantId);
        return rbac.createRole(tenantId, request);
    }

    @PutMapping("/roles/{roleId}")
    public TenantRoleDetailResponse updateRole(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId,
            @PathVariable UUID roleId,
            @Valid @RequestBody TenantRoleUpdateRequest request) {
        requirePlatform(authentication, actAsEmail, tenantId);
        return rbac.updateRole(tenantId, roleId, request);
    }

    @DeleteMapping("/roles/{roleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRole(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId,
            @PathVariable UUID roleId) {
        requirePlatform(authentication, actAsEmail, tenantId);
        rbac.deleteRole(tenantId, roleId);
    }

    @GetMapping("/users/{userId}/role-assignments")
    public UserTenantRoleAssignmentsResponse listUserRoleAssignments(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId,
            @PathVariable UUID userId) {
        requirePlatform(authentication, actAsEmail, tenantId);
        return rbac.listUserRoleAssignments(tenantId, userId);
    }

    @PutMapping("/users/{userId}/role-assignments")
    public UserTenantRoleAssignmentsResponse replaceUserRoleAssignments(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId,
            @PathVariable UUID userId,
            @RequestBody ReplaceUserTenantRolesRequest request) {
        requirePlatform(authentication, actAsEmail, tenantId);
        return rbac.replaceUserRoleAssignments(
                tenantId, userId, request != null ? request.roleIds() : List.of());
    }

    private void requirePlatform(Authentication authentication, String actAsEmail, UUID tenantId) {
        access.requireTenantGovernanceAccess(authentication, actAsEmail, tenantId);
    }
}
