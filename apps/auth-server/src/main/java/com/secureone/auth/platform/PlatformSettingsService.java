package com.secureone.auth.platform;

import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class PlatformSettingsService {

    private final PlatformSettingRepository settings;

    public PlatformSettingsService(PlatformSettingRepository settings) {
        this.settings = settings;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> get(String key) {
        Object value = getRaw(key);
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return new HashMap<>();
    }

    public Object getRaw(String key) {
        return settings.findById(key).map(PlatformSetting::getValue).orElse(null);
    }

    public Object save(String key, Object value) {
        PlatformSetting row = settings.findById(key).orElseGet(() -> {
            PlatformSetting created = new PlatformSetting();
            created.setKey(key);
            return created;
        });
        row.setValue(value);
        settings.save(row);
        return row.getValue();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> saveMap(String key, Map<String, Object> value) {
        return (Map<String, Object>) save(key, value != null ? new HashMap<>(value) : new HashMap<>());
    }
}
