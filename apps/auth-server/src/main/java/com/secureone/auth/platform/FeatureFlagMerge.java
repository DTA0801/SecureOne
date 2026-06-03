package com.secureone.auth.platform;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Merges feature flag lists by {@code key} (not {@code id}). */
public final class FeatureFlagMerge {

    private FeatureFlagMerge() {}

    public static List<Map<String, Object>> merge(List<Map<String, Object>> platform, Object override) {
        if (!(override instanceof List<?> overrideList) || overrideList.isEmpty()) {
            return copy(platform);
        }
        Map<String, Map<String, Object>> byKey = new LinkedHashMap<>();
        for (Map<String, Object> item : platform) {
            String key = flagKey(item);
            if (key != null) {
                byKey.put(key, new HashMap<>(item));
            }
        }
        for (Object raw : overrideList) {
            if (!(raw instanceof Map<?, ?> row)) {
                continue;
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> patch = (Map<String, Object>) row;
            String key = flagKey(patch);
            if (key == null) {
                continue;
            }
            if (byKey.containsKey(key)) {
                byKey.get(key).putAll(patch);
            } else {
                byKey.put(key, new HashMap<>(patch));
            }
        }
        return new ArrayList<>(byKey.values());
    }

    private static String flagKey(Map<String, Object> item) {
        Object key = item.get("key");
        if (key == null) {
            return null;
        }
        String s = String.valueOf(key);
        return s.isBlank() ? null : s;
    }

    private static List<Map<String, Object>> copy(List<Map<String, Object>> source) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> item : source) {
            out.add(new HashMap<>(item));
        }
        return out;
    }
}
