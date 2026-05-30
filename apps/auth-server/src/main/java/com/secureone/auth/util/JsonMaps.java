package com.secureone.auth.util;

import java.util.List;
import java.util.Map;

public final class JsonMaps {

    private JsonMaps() {}

    @SuppressWarnings("unchecked")
    public static List<String> stringList(Map<String, Object> map, String key) {
        if (map == null) {
            return List.of();
        }
        Object value = map.get(key);
        if (value instanceof List<?> list) {
            return list.stream().map(Object::toString).toList();
        }
        return List.of();
    }

    public static String stringVal(Map<String, Object> map, String key, String defaultValue) {
        if (map == null || !map.containsKey(key) || map.get(key) == null) {
            return defaultValue;
        }
        return map.get(key).toString();
    }
}
