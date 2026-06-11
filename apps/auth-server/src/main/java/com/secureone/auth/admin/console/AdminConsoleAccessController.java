package com.secureone.auth.admin.console;

import com.secureone.auth.admin.AdminOperatorService;
import com.secureone.auth.admin.console.AdminConsoleAccessService.ConsoleAccessAssignment;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin — console access", description = "Who may sign in to SecureOne Admin and at which scope")
@SecurityRequirement(name = "adminHttpBasic")
@RestController
@RequestMapping("/api/admin/v1/tenants/{tenantId}/console-access")
public class AdminConsoleAccessController {

    private final AdminConsoleAccessService consoleAccess;
    private final AdminOperatorService operators;

    public AdminConsoleAccessController(AdminConsoleAccessService consoleAccess, AdminOperatorService operators) {
        this.consoleAccess = consoleAccess;
        this.operators = operators;
    }

    public record GrantConsoleAccessRequest(UUID userId, String roleType, UUID applicationId) {}

    @GetMapping
    public List<ConsoleAccessAssignment> list(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId) {
        operators.requireTenantAccess(authentication, actAsEmail, tenantId);
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required");
        }
        return consoleAccess.listForTenant(tenantId);
    }

    @PostMapping
    public ConsoleAccessAssignment grant(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId,
            @RequestBody GrantConsoleAccessRequest body) {
        operators.requireTenantAccess(authentication, actAsEmail, tenantId);
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required");
        }
        if (body.userId() == null || body.roleType() == null || body.roleType().isBlank()) {
            throw new IllegalArgumentException("userId and roleType are required");
        }
        AdminConsoleRoleType roleType = AdminConsoleRoleType.valueOf(body.roleType().trim().toUpperCase());
        UUID grantedBy = operators
                .resolveTenantUser(authentication, actAsEmail)
                .map(u -> u.getId())
                .orElse(null);
        return consoleAccess.grant(tenantId, body.userId(), roleType, body.applicationId(), grantedBy);
    }

    @DeleteMapping("/{assignmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @PathVariable UUID tenantId,
            @PathVariable UUID assignmentId) {
        operators.requireTenantAccess(authentication, actAsEmail, tenantId);
        if (!operators.isPlatformSuperAdmin(authentication, actAsEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Platform super-admin required");
        }
        consoleAccess.revoke(assignmentId);
    }
}
