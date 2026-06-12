package com.secureone.auth.admin.console;

import java.util.EnumSet;
import java.util.Set;

/** Default admin console features granted by console access role type. */
public final class AdminConsoleCapabilityCatalog {

    private AdminConsoleCapabilityCatalog() {}

    public static Set<ConsoleFeature> baseFeatures(AdminConsoleRoleType roleType) {
        return switch (roleType) {
            case APPLICATION_ADMIN ->
                    EnumSet.of(
                            ConsoleFeature.USERS,
                            ConsoleFeature.ROLES,
                            ConsoleFeature.GROUPS,
                            ConsoleFeature.SETTINGS,
                            ConsoleFeature.AUDIT,
                            ConsoleFeature.SESSIONS);
            case TENANT_ADMIN ->
                    EnumSet.of(
                            ConsoleFeature.USERS,
                            ConsoleFeature.ROLES,
                            ConsoleFeature.GROUPS,
                            ConsoleFeature.PERMISSIONS,
                            ConsoleFeature.SETTINGS,
                            ConsoleFeature.AUDIT,
                            ConsoleFeature.LOGS,
                            ConsoleFeature.SESSIONS);
            case TENANT_SUPER_ADMIN -> EnumSet.allOf(ConsoleFeature.class);
        };
    }
}
