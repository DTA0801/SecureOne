package com.secureone.auth.admin.tenant;

import com.secureone.auth.admin.AdminOperatorService;
import com.secureone.auth.admin.tenant.TenantConsoleRolesService.TenantConsoleRolesCatalogResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin — tenant console roles", description = "Console operator roles and default permissions for a tenant")
@SecurityRequirement(name = "adminHttpBasic")
@RestController
@RequestMapping("/api/admin/v1/tenants/{tenantId}/console-roles")
public class TenantConsoleRolesController {

    private final TenantConsoleRolesService roles;
    private final AdminOperatorService operators;

    public TenantConsoleRolesController(TenantConsoleRolesService roles, AdminOperatorService operators) {
        this.roles = roles;
        this.operators = operators;
    }

    @GetMapping
    public TenantConsoleRolesCatalogResponse catalog(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId) {
        operators.requireTenantAccess(authentication, actAsEmail, tenantId);
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required for tenant console roles");
        }
        return roles.catalog(tenantId);
    }
}
