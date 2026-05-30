package com.secureone.auth.admin.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Per-user auth method allow-list stored in user_account.attributes.authMethods. */
public final class UserAuthPreferences {

    private static final String ATTR_KEY = "authMethods";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private UserAuthPreferences() {}

    @SuppressWarnings("unchecked")
    public static Map<String, Boolean> read(Map<String, Object> attributes) {
        if (attributes == null || attributes.isEmpty()) {
            return new LinkedHashMap<>();
        }
        Object raw = attributes.get(ATTR_KEY);
        if (raw instanceof Map<?, ?> map) {
            Map<String, Boolean> out = new LinkedHashMap<>();
            map.forEach((k, v) -> {
                if (k != null && v instanceof Boolean b) {
                    out.put(k.toString(), b);
                }
            });
            return out;
        }
        return new LinkedHashMap<>();
    }

    public static Map<String, Object> write(Map<String, Object> attributes, Map<String, Boolean> prefs) {
        Map<String, Object> root = attributes != null ? new LinkedHashMap<>(attributes) : new HashMap<>();
        root.put(ATTR_KEY, new LinkedHashMap<>(prefs));
        return root;
    }

    /** Effective allow-list: explicit user prefs, else default true for app-enabled methods only. */
    public static Map<String, Boolean> effective(
            List<Map<String, Object>> appAuthMethods, Map<String, Boolean> userPrefs) {
        Map<String, Boolean> effective = new LinkedHashMap<>();
        for (Map<String, Object> method : appAuthMethods) {
            if (!Boolean.TRUE.equals(method.get("enabled"))) {
                continue;
            }
            String id = String.valueOf(method.get("id"));
            effective.put(id, userPrefs.getOrDefault(id, true));
        }
        return effective;
    }

    public static String mfaFactorTypeForMethodId(String methodId) {
        return switch (methodId) {
            case "m_totp" -> "totp";
            case "m_passkey" -> "passkey";
            case "m_sms" -> "sms";
            case "m_email_otp" -> "email";
            case "m_push" -> "push";
            default -> null;
        };
    }

    public static String methodIdForMfaFactorType(String factorType) {
        if (factorType == null) {
            return null;
        }
        return switch (factorType.toLowerCase()) {
            case "totp" -> "m_totp";
            case "passkey" -> "m_passkey";
            case "sms" -> "m_sms";
            case "email" -> "m_email_otp";
            case "push" -> "m_push";
            default -> null;
        };
    }
}
