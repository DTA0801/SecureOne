package com.secureone.auth.application;

import java.util.Map;

/** Maps application_setting keys to platform exposure section keys. */
public final class SettingsSectionKeys {

    private static final Map<String, String> SETTING_TO_EXPOSURE = Map.of(
            "notifications", "notifications",
            "email", "email",
            "auth_methods", "auth-methods",
            "password_policy", "password-policy",
            "feature_flags", "feature-flags",
            "appearance", "appearance",
            "user_directory", "user-directory",
            "public_manifest", "public-manifest",
            "token_policy", "token-policy");

    private SettingsSectionKeys() {}

    public static String exposureForSettingKey(String settingKey) {
        return SETTING_TO_EXPOSURE.get(settingKey);
    }

    public static boolean isKnownSettingKey(String settingKey) {
        return SETTING_TO_EXPOSURE.containsKey(settingKey);
    }

    public static String settingKeyForExposure(String exposureKey) {
        if (exposureKey == null) {
            return null;
        }
        for (var entry : SETTING_TO_EXPOSURE.entrySet()) {
            if (entry.getValue().equals(exposureKey)) {
                return entry.getKey();
            }
        }
        return null;
    }
}
