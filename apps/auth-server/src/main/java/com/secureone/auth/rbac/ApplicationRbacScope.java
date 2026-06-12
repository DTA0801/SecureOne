package com.secureone.auth.rbac;

import java.util.Set;

/**
 * Separates application product RBAC (end-user / in-app authorization) from SecureOne admin
 * console operator roles and platform management permissions.
 */
public final class ApplicationRbacScope {

    /** Mirrored from {@code admin_console_access}; managed via tenant/platform console, not app RBAC UI. */
    public static final Set<String> CONSOLE_OPERATOR_ROLE_NAMES =
            Set.of("Tenant Admin", "Application Admin", "Super Admin");

    /** Permission keys used only by SecureOne Admin console operators, not the OAuth application product. */
    public static final Set<String> ADMIN_CONSOLE_PERMISSION_KEYS = Set.of(
            "role:read",
            "role:write",
            "app:read",
            "app:write",
            "audit:read",
            "logs:read",
            "settings:write",
            "session:read");

    private ApplicationRbacScope() {}

    public static boolean isApplicationScopedRole(Role role) {
        return role != null && !CONSOLE_OPERATOR_ROLE_NAMES.contains(role.getName());
    }

    public static boolean isApplicationScopedRoleName(String name) {
        return name != null && !CONSOLE_OPERATOR_ROLE_NAMES.contains(name);
    }

    public static boolean isApplicationScopedPermissionKey(String key) {
        return key != null && !ADMIN_CONSOLE_PERMISSION_KEYS.contains(key);
    }
}
