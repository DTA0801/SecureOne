package com.secureone.auth.rbac;

import java.util.Set;

/**
 * Separates application product RBAC (end-user / in-app authorization) from SecureOne admin
 * console operator roles and platform management permissions.
 */
public final class ApplicationRbacScope {

    public static final String TENANT_ADMIN_ROLE_NAME = "Tenant Admin";

    /** Mirrored from {@code admin_console_access}; managed via tenant/platform console, not app RBAC UI. */
    public static final Set<String> CONSOLE_OPERATOR_ROLE_NAMES =
            Set.of(TENANT_ADMIN_ROLE_NAME, "Application Admin", "Super Admin");

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

    public static boolean isTenantAdminOperatorRole(Role role) {
        return role != null && TENANT_ADMIN_ROLE_NAME.equalsIgnoreCase(role.getName());
    }

    public static boolean isTenantAdminOperatorRoleName(String name) {
        return name != null && TENANT_ADMIN_ROLE_NAME.equalsIgnoreCase(name);
    }

    /** Product RBAC roles plus the system Tenant Admin operator role shown in application Roles. */
    public static boolean isListedInApplicationRoleCatalog(Role role) {
        return role != null && (isApplicationScopedRole(role) || isTenantAdminOperatorRole(role));
    }

    public static boolean isListedInApplicationRoleCatalogName(String name) {
        return name != null && (isApplicationScopedRoleName(name) || isTenantAdminOperatorRoleName(name));
    }

    public static boolean isApplicationScopedPermissionKey(String key) {
        return key != null && !ADMIN_CONSOLE_PERMISSION_KEYS.contains(key);
    }
}
