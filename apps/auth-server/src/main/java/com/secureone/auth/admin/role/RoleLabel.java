package com.secureone.auth.admin.role;

import com.secureone.auth.rbac.Role;

/** Enterprise role classification shown in the admin console. */
public enum RoleLabel {
    SYSTEM,
    BUILT_IN,
    COMPOSITE,
    CUSTOM;

    public static RoleLabel from(Role role) {
        if (role.isDefaultRole()) {
            return BUILT_IN;
        }
        if (role.isSystemRole()) {
            return SYSTEM;
        }
        if (role.isComposite()) {
            return COMPOSITE;
        }
        return CUSTOM;
    }
}
