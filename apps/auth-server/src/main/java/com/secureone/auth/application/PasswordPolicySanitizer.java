package com.secureone.auth.application;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public final class PasswordPolicySanitizer {

    private static final Set<String> KEYS = Set.of(
            "minLength",
            "requireUppercase",
            "requireNumber",
            "requireSymbol",
            "expiryDays",
            "historyCount",
            "hashAlgorithm");

    private PasswordPolicySanitizer() {}

    public static Map<String, Object> platformDefaults() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("minLength", 12);
        out.put("requireUppercase", true);
        out.put("requireNumber", true);
        out.put("requireSymbol", true);
        out.put("expiryDays", 0);
        out.put("historyCount", 5);
        out.put("hashAlgorithm", "bcrypt");
        return out;
    }

    public static Map<String, Object> sanitize(Map<String, Object> body) {
        Map<String, Object> defaults = platformDefaults();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("minLength", clampInt(body, "minLength", intValue(defaults, "minLength", 12), 8, 128));
        out.put("requireUppercase", bool(body, "requireUppercase", boolValue(defaults, "requireUppercase", true)));
        out.put("requireNumber", bool(body, "requireNumber", boolValue(defaults, "requireNumber", true)));
        out.put("requireSymbol", bool(body, "requireSymbol", boolValue(defaults, "requireSymbol", true)));
        out.put("expiryDays", clampInt(body, "expiryDays", intValue(defaults, "expiryDays", 0), 0, 3650));
        out.put("historyCount", clampInt(body, "historyCount", intValue(defaults, "historyCount", 5), 0, 24));
        out.put("hashAlgorithm", normalizeHashAlgorithm(body != null ? body.get("hashAlgorithm") : null));
        return out;
    }

    public static String normalizeHashAlgorithm(Object raw) {
        String algorithm = raw != null ? raw.toString().trim().toLowerCase(Locale.ROOT) : "bcrypt";
        if (!"bcrypt".equals(algorithm)) {
            throw new IllegalArgumentException("Only bcrypt is supported for hashAlgorithm.");
        }
        return algorithm;
    }

    private static int clampInt(Map<String, Object> body, String key, int fallback, int min, int max) {
        int value = intValue(body, key, fallback);
        return Math.max(min, Math.min(max, value));
    }

    private static int intValue(Map<String, Object> body, String key, int fallback) {
        if (body == null || !body.containsKey(key)) {
            return fallback;
        }
        Object value = body.get(key);
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value != null) {
            try {
                return Integer.parseInt(value.toString().trim());
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        return fallback;
    }

    private static boolean boolValue(Map<String, Object> defaults, String key, boolean fallback) {
        Object value = defaults.get(key);
        return value instanceof Boolean b ? b : fallback;
    }

    private static boolean bool(Map<String, Object> body, String key, boolean fallback) {
        if (body == null || !body.containsKey(key)) {
            return fallback;
        }
        Object value = body.get(key);
        return value instanceof Boolean b ? b : fallback;
    }
}
