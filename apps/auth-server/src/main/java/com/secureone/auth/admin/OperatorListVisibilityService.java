package com.secureone.auth.admin;

import com.secureone.auth.admin.console.AdminConsoleAccessService;
import com.secureone.auth.admin.console.AdminConsoleRoleType;
import com.secureone.auth.user.UserAccount;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Visibility rules for operator-facing user lists:
 * <ul>
 *   <li>Platform super-admin — see all users (including self)</li>
 *   <li>Tenant admin — everyone except self; other tenant admins remain visible</li>
 *   <li>Application admin — hide self and users with tenant-level console roles</li>
 * </ul>
 */
@Service
@Transactional(readOnly = true)
public class OperatorListVisibilityService {

    private final AdminAccessService access;
    private final AdminOperatorService operators;
    private final AdminConsoleAccessService consoleAccess;

    public OperatorListVisibilityService(
            AdminAccessService access,
            AdminOperatorService operators,
            AdminConsoleAccessService consoleAccess) {
        this.access = access;
        this.operators = operators;
        this.consoleAccess = consoleAccess;
    }

    public boolean canViewUserInOperatorList(
            Authentication authentication, String actAsEmail, UUID targetUserId) {
        if (access.canAccessPlatformSettings(authentication, actAsEmail)) {
            return true;
        }
        Optional<UUID> viewerId =
                operators.resolveTenantUser(authentication, actAsEmail).map(UserAccount::getId);
        if (viewerId.isPresent() && viewerId.get().equals(targetUserId)) {
            return false;
        }
        String tier = access.resolveOperatorTier(authentication, actAsEmail);
        if ("tenant".equals(tier) || "tenant_super".equals(tier)) {
            return true;
        }
        return !isTenantLevelAdmin(targetUserId);
    }

    private boolean isTenantLevelAdmin(UUID userId) {
        return consoleAccess
                .highestRoleType(userId)
                .map(role -> role == AdminConsoleRoleType.TENANT_ADMIN
                        || role == AdminConsoleRoleType.TENANT_SUPER_ADMIN)
                .orElse(false);
    }
}
