package com.secureone.auth.application;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

public final class PasswordPolicySanitizer {

    private static final Set<String> KEYS =
            Set.of("minLength", "requireUppercase", "requireNumber", "requireSymbol", "expiryDays", "historyCount", "hashAlgorithm");

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
        Map<String, Object> out = new LinkedHashMap<>(platformDefaults());
        if (body == null) {
            return out;
        }
        KEYS.forEach(key -> {
            if (body.containsKey(key) && body.get(key) != null) {
                out.put(key, body.get(key));
            }
        });
        return out;
    }
}
