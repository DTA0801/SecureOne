package com.secureone.auth.admin.console;

import com.secureone.auth.admin.AdminOperatorService;
import com.secureone.auth.admin.console.AdminConsoleCapabilityService.FeatureOverride;
import com.secureone.auth.admin.console.AdminConsoleCapabilityService.UserConsoleCapabilities;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin — console capabilities", description = "Feature matrix and per-user overrides for tenant console operators")
@SecurityRequirement(name = "adminHttpBasic")
@RestController
@RequestMapping("/api/admin/v1/tenants/{tenantId}/users/{userId}/console-capabilities")
public class AdminConsoleCapabilityController {

    private final AdminConsoleCapabilityService capabilities;
    private final AdminOperatorService operators;

    public AdminConsoleCapabilityController(
            AdminConsoleCapabilityService capabilities, AdminOperatorService operators) {
        this.capabilities = capabilities;
        this.operators = operators;
    }

    public record UpdateOverridesRequest(List<FeatureOverride> overrides) {}

    @GetMapping("/catalog")
    public Map<String, Object> catalog(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId,
            @PathVariable UUID userId) {
        operators.requireTenantAccess(authentication, actAsEmail, tenantId);
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required");
        }
        return Map.of(
                "features", capabilities.allFeatureKeys(),
                "roleDefaults", Map.of(
                        "APPLICATION_ADMIN",
                                capabilities.defaultFeaturesForRole(AdminConsoleRoleType.APPLICATION_ADMIN),
                        "TENANT_ADMIN",
                                capabilities.defaultFeaturesForRole(AdminConsoleRoleType.TENANT_ADMIN),
                        "TENANT_SUPER_ADMIN",
                                capabilities.defaultFeaturesForRole(AdminConsoleRoleType.TENANT_SUPER_ADMIN)));
    }

    @GetMapping
    public UserConsoleCapabilities get(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId,
            @PathVariable UUID userId) {
        operators.requireTenantAccess(authentication, actAsEmail, tenantId);
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required");
        }
        return capabilities.describeForUser(tenantId, userId);
    }

    @PutMapping
    public UserConsoleCapabilities update(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId,
            @PathVariable UUID userId,
            @RequestBody UpdateOverridesRequest body) {
        operators.requireTenantAccess(authentication, actAsEmail, tenantId);
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required");
        }
        return capabilities.replaceOverrides(
                tenantId, userId, body != null ? body.overrides() : List.of());
    }
}
