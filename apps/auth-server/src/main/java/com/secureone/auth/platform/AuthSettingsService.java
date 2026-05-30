package com.secureone.auth.platform;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AuthSettingsService {

    private final PlatformSettingsService settings;
    private final ObjectMapper mapper;

    public AuthSettingsService(PlatformSettingsService settings, ObjectMapper mapper) {
        this.settings = settings;
        this.mapper = mapper;
    }

    public List<Map<String, Object>> getAuthMethods() {
        return readList("auth_methods", defaultAuthMethods());
    }

    public List<Map<String, Object>> saveAuthMethods(List<Map<String, Object>> body) {
        settings.save("auth_methods", new ArrayList<>(body));
        return getAuthMethods();
    }

    public Map<String, Object> getPasswordPolicy() {
        return readMap("password_policy", defaultPasswordPolicy());
    }

    public Map<String, Object> savePasswordPolicy(Map<String, Object> body) {
        settings.save("password_policy", new LinkedHashMap<>(body));
        return getPasswordPolicy();
    }

    public List<Map<String, Object>> getFeatureFlags() {
        return readList("feature_flags", defaultFeatureFlags());
    }

    public List<Map<String, Object>> saveFeatureFlags(List<Map<String, Object>> body) {
        settings.save("feature_flags", new ArrayList<>(body));
        return getFeatureFlags();
    }

    public boolean isAuthMethodEnabled(String methodId) {
        return getAuthMethods().stream()
                .filter(m -> methodId.equals(String.valueOf(m.get("id"))))
                .findFirst()
                .map(m -> Boolean.TRUE.equals(m.get("enabled")))
                .orElse(false);
    }

    public boolean isAuthMethodImplemented(String methodId) {
        return getAuthMethods().stream()
                .filter(m -> methodId.equals(String.valueOf(m.get("id"))))
                .findFirst()
                .map(m -> !Boolean.FALSE.equals(m.get("implemented")))
                .orElse(false);
    }

    public boolean isFeatureEnabled(String key) {
        return getFeatureFlags().stream()
                .filter(f -> key.equals(String.valueOf(f.get("key"))))
                .findFirst()
                .map(f -> Boolean.TRUE.equals(f.get("enabled")))
                .orElse(false);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> readList(String key, List<Map<String, Object>> fallback) {
        Object raw = settings.getRaw(key);
        if (raw == null) {
            return fallback;
        }
        if (raw instanceof List<?> list) {
            return (List<Map<String, Object>>) (List<?>) list;
        }
        return mapper.convertValue(raw, new TypeReference<>() {});
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readMap(String key, Map<String, Object> fallback) {
        Object raw = settings.getRaw(key);
        if (raw == null) {
            return fallback;
        }
        if (raw instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return mapper.convertValue(raw, new TypeReference<>() {});
    }

    private static List<Map<String, Object>> defaultAuthMethods() {
        return List.of();
    }

    private static Map<String, Object> defaultPasswordPolicy() {
        return new LinkedHashMap<>(Map.of(
                "minLength", 12,
                "requireUppercase", true,
                "requireNumber", true,
                "requireSymbol", true,
                "expiryDays", 0,
                "historyCount", 5,
                "hashAlgorithm", "bcrypt"));
    }

    private static List<Map<String, Object>> defaultFeatureFlags() {
        return List.of();
    }
}
