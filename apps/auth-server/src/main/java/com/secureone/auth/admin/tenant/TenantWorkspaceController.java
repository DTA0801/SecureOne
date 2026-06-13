package com.secureone.auth.admin.tenant;

import com.secureone.auth.admin.tenant.TenantWorkspaceService.TenantAdminOperator;
import com.secureone.auth.admin.tenant.TenantWorkspaceService.TenantWorkspaceResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
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

@Tag(name = "Admin — tenant workspace", description = "Tenant operator workspace (users, application access)")
@SecurityRequirement(name = "adminHttpBasic")
@RestController
@RequestMapping("/api/admin/v1/tenant-workspace")
public class TenantWorkspaceController {

    private final TenantWorkspaceService workspace;

    public TenantWorkspaceController(TenantWorkspaceService workspace) {
        this.workspace = workspace;
    }

    @GetMapping
    public TenantWorkspaceResponse get(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @RequestParam(required = false) UUID tenantId) {
        if (tenantId != null) {
            return workspace.workspaceForPlatform(authentication, actAsEmail, tenantId);
        }
        return workspace.workspace(authentication, actAsEmail);
    }

    @PostMapping("/users/{userId}/applications/{applicationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void grantApplication(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @RequestParam(required = false) UUID tenantId,
            @PathVariable UUID userId,
            @PathVariable UUID applicationId) {
        if (tenantId != null) {
            workspace.grantApplicationForPlatform(
                    authentication, actAsEmail, tenantId, userId, applicationId);
            return;
        }
        workspace.grantApplication(authentication, actAsEmail, userId, applicationId);
    }

    @GetMapping("/applications/{applicationId}/importable-users")
    public List<TenantWorkspaceService.TenantWorkspaceUser> listImportableUsers(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @RequestParam(required = false) UUID tenantId,
            @PathVariable UUID applicationId) {
        if (tenantId != null) {
            return workspace.listImportableUsersForPlatform(authentication, actAsEmail, tenantId, applicationId);
        }
        return workspace.listImportableUsers(authentication, actAsEmail, applicationId);
    }

    @PostMapping("/users/{userId}/roster")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void importUserToRoster(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam UUID applicationId,
            @PathVariable UUID userId) {
        if (tenantId != null) {
            workspace.importUserToRosterForPlatform(
                    authentication, actAsEmail, tenantId, userId, applicationId);
            return;
        }
        workspace.importUserToRoster(authentication, actAsEmail, userId, applicationId);
    }

    @PostMapping("/users/roster/bulk")
    public Map<String, Object> bulkImportUsersToRoster(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam UUID applicationId,
            @RequestBody BulkRosterImportRequest body) {
        int imported;
        if (tenantId != null) {
            imported = workspace.bulkImportUsersToRosterForPlatform(
                    authentication,
                    actAsEmail,
                    tenantId,
                    applicationId,
                    body.userIds() != null ? body.userIds() : List.of());
        } else {
            imported = workspace.bulkImportUsersToRoster(
                    authentication,
                    actAsEmail,
                    applicationId,
                    body.userIds() != null ? body.userIds() : List.of());
        }
        return Map.of("imported", imported);
    }

    @DeleteMapping("/users/{userId}/roster")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeUserFromRoster(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @RequestParam(required = false) UUID tenantId,
            @PathVariable UUID userId) {
        if (tenantId != null) {
            workspace.removeUserFromRosterForPlatform(authentication, actAsEmail, tenantId, userId);
            return;
        }
        workspace.removeUserFromRoster(authentication, actAsEmail, userId);
    }

    @PutMapping("/users/{userId}/applications/{applicationId}/roles")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateUserApplicationRoles(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @RequestParam UUID tenantId,
            @PathVariable UUID userId,
            @PathVariable UUID applicationId,
            @RequestBody UpdateApplicationRolesRequest body) {
        workspace.updateUserApplicationRolesForPlatform(
                authentication,
                actAsEmail,
                tenantId,
                userId,
                applicationId,
                body.roleIds() != null ? body.roleIds() : List.of());
    }

    public record BulkRosterImportRequest(List<UUID> userIds) {}

    public record UpdateApplicationRolesRequest(List<UUID> roleIds) {}

    @DeleteMapping("/users/{userId}/applications/{applicationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revokeApplication(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @RequestParam(required = false) UUID tenantId,
            @PathVariable UUID userId,
            @PathVariable UUID applicationId) {
        if (tenantId != null) {
            workspace.revokeApplicationForPlatform(
                    authentication, actAsEmail, tenantId, userId, applicationId);
            return;
        }
        workspace.revokeApplication(authentication, actAsEmail, userId, applicationId);
    }

    /** Super-admin only: list Tenant Admin operators for a tenant. */
    @GetMapping("/admin-operators")
    public List<TenantAdminOperator> listAdminOperators(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @RequestParam UUID tenantId) {
        return workspace.listTenantAdminOperatorsForPlatform(authentication, actAsEmail, tenantId);
    }

    /** Super-admin only: promote a user to Tenant Admin on an application. */
    @PostMapping("/users/{userId}/tenant-admin/{applicationId}")
    public Map<String, Object> assignTenantAdmin(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID userId,
            @PathVariable UUID applicationId) {
        var user = workspace.assignTenantAdminRole(authentication, actAsEmail, userId, applicationId);
        return Map.of("ok", true, "userId", user.id(), "email", user.email());
    }

    /** Super-admin only: remove Tenant Admin role for an application. */
    @DeleteMapping("/users/{userId}/tenant-admin/{applicationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revokeTenantAdmin(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID userId,
            @PathVariable UUID applicationId) {
        workspace.revokeTenantAdminRole(authentication, actAsEmail, userId, applicationId);
    }
}
