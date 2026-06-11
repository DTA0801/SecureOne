package com.secureone.auth.rbac;

import java.util.List;

/** Standard IAM permission keys seeded for every application. */
public final class DefaultPermissionCatalog {

    private DefaultPermissionCatalog() {}

    public record DefaultPermission(String key, String description) {}

    public static final List<DefaultPermission> ENTRIES = List.of(
            new DefaultPermission("user:read", "View users and profiles"),
            new DefaultPermission("user:write", "Create and edit users"),
            new DefaultPermission("user:delete", "Delete users"),
            new DefaultPermission("role:read", "View roles and permissions"),
            new DefaultPermission("role:write", "Manage roles and assignments"),
            new DefaultPermission("app:read", "View applications"),
            new DefaultPermission("app:write", "Manage OAuth clients"),
            new DefaultPermission("audit:read", "View audit logs"),
            new DefaultPermission("logs:read", "View application logs"),
            new DefaultPermission("settings:write", "Change application settings"),
            new DefaultPermission("session:read", "View active sessions"));
}
