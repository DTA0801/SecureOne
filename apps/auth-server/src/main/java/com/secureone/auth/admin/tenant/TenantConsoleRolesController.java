package com.secureone.auth.admin.tenant;

import com.secureone.auth.admin.AdminAccessService;
import com.secureone.auth.admin.tenant.TenantConsoleRolesService.TenantConsoleRolesCatalogResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin — tenant console roles", description = "Console operator roles and default permissions for a tenant")
@SecurityRequirement(name = "adminHttpBasic")
@RestController
@RequestMapping("/api/admin/v1/tenants/{tenantId}/console-roles")
public class TenantConsoleRolesController {

    private final TenantConsoleRolesService roles;
    private final AdminAccessService access;

    public TenantConsoleRolesController(TenantConsoleRolesService roles, AdminAccessService access) {
        this.roles = roles;
        this.access = access;
    }

    public record UpdateConsoleRoleFeaturesRequest(List<String> features) {}

    @GetMapping
    public TenantConsoleRolesCatalogResponse catalog(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId) {
        requireGovernance(authentication, actAsEmail, tenantId);
        return roles.catalog(tenantId);
    }

    @PutMapping("/{roleKey}/features")
    public List<String> updateFeatures(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId,
            @PathVariable String roleKey,
            @RequestBody UpdateConsoleRoleFeaturesRequest body) {
        requireGovernance(authentication, actAsEmail, tenantId);
        return roles.updateConsoleRoleFeatures(
                tenantId, roleKey, body != null ? body.features() : List.of());
    }

    private void requireGovernance(Authentication authentication, String actAsEmail, UUID tenantId) {
        access.requireTenantGovernanceAccess(authentication, actAsEmail, tenantId);
    }
}
