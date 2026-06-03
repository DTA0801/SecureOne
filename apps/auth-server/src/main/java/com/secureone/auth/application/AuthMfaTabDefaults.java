package com.secureone.auth.application;

import java.util.LinkedHashMap;
import java.util.Map;

/** Per-application gate for the MFA settings tab (separate from auth method toggles). */
public final class AuthMfaTabDefaults {

    public static final String SETTING_KEY = "auth_mfa_tab";

    private AuthMfaTabDefaults() {}

    public static Map<String, Object> platformDefaults() {
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("tabEnabled", false);
        return root;
    }

    public static boolean tabEnabled(Map<String, Object> row) {
        return row != null && Boolean.TRUE.equals(row.get("tabEnabled"));
    }
}
