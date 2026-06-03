package com.secureone.auth.application;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class FeatureFlagSanitizer {

    private static final Set<String> KEYS = Set.of("key", "name", "description", "enabled", "rollout", "category");

    private FeatureFlagSanitizer() {}

    public static List<Map<String, Object>> sanitize(List<Map<String, Object>> body) {
        if (body == null || body.isEmpty()) {
            return List.of();
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> row : body) {
            if (row == null) {
                continue;
            }
            Object keyObj = row.get("key");
            if (keyObj == null || String.valueOf(keyObj).isBlank()) {
                continue;
            }
            Map<String, Object> clean = new LinkedHashMap<>();
            KEYS.forEach(k -> {
                if (row.containsKey(k) && row.get(k) != null) {
                    clean.put(k, row.get(k));
                }
            });
            clean.put("key", String.valueOf(keyObj).trim());
            if (!clean.containsKey("enabled")) {
                clean.put("enabled", false);
            }
            if (!clean.containsKey("rollout")) {
                clean.put("rollout", 0);
            }
            out.add(clean);
        }
        return out;
    }
}
