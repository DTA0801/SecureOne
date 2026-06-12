package com.secureone.auth.tenant.rbac;

import java.util.List;

/** Standard tenant-governance permission keys (platform / operator scope). */
public final class TenantPermissionCatalog {

    private TenantPermissionCatalog() {}

    public record Entry(String key, String description) {}

    public static final List<Entry> ENTRIES = List.of(
            new Entry("tenant:read", "View tenant metadata and roster"),
            new Entry("tenant:manage", "Edit tenant settings and roster"),
            new Entry("operator:read", "View tenant operators and console access"),
            new Entry("operator:manage", "Grant or revoke operator console access"),
            new Entry("application:access", "Assign users to applications"),
            new Entry("application:manage", "Create and configure applications"),
            new Entry("console:users", "Admin console — Users section"),
            new Entry("console:roles", "Admin console — Roles section"),
            new Entry("console:permissions", "Admin console — Permissions section"),
            new Entry("console:settings", "Admin console — Settings section"),
            new Entry("console:audit", "Admin console — Audit log"),
            new Entry("console:logs", "Admin console — Application logs"),
            new Entry("console:sessions", "Admin console — Sessions"));

    public static final List<String> TENANT_ADMINISTRATOR = List.of(
            "tenant:read",
            "tenant:manage",
            "operator:read",
            "operator:manage",
            "application:access",
            "application:manage",
            "console:users",
            "console:roles",
            "console:permissions",
            "console:settings",
            "console:audit",
            "console:logs",
            "console:sessions");

    public static final List<String> APPLICATION_OPERATOR = List.of(
            "tenant:read",
            "operator:read",
            "application:access",
            "console:users",
            "console:roles",
            "console:settings",
            "console:audit",
            "console:sessions");

    public static final List<String> TENANT_AUDITOR = List.of(
            "tenant:read", "operator:read", "console:audit", "console:logs", "console:sessions");

    public static final List<String> SEEDED_ROLE_NAMES = List.of(
            "Tenant Administrator", "Application Operator", "Tenant Auditor");

    public static boolean isSeededRoleName(String name) {
        if (name == null || name.isBlank()) {
            return false;
        }
        String normalized = name.trim();
        return SEEDED_ROLE_NAMES.stream().anyMatch(n -> n.equalsIgnoreCase(normalized));
    }

    public static boolean isCatalogKey(String key) {
        if (key == null || key.isBlank()) {
            return false;
        }
        String normalized = key.trim().toLowerCase();
        return ENTRIES.stream().anyMatch(e -> e.key().equals(normalized));
    }
}
