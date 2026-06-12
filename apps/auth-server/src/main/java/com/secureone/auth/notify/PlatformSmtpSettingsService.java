package com.secureone.auth.notify;

import com.secureone.auth.platform.PlatformSettingsService;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class PlatformSmtpSettingsService {

    public static final String SETTINGS_KEY = "smtp";

    private final PlatformSettingsService platformSettings;
    private final SecretProtector secrets;

    public PlatformSmtpSettingsService(PlatformSettingsService platformSettings, SecretProtector secrets) {
        this.platformSettings = platformSettings;
        this.secrets = secrets;
    }

    public boolean isConfigured() {
        Map<String, Object> smtp = loadMap();
        return !string(smtp, "host", "").isBlank();
    }

    public Map<String, Object> getPublicSettings() {
        Map<String, Object> smtp = new HashMap<>(loadMap());
        smtp.remove("passwordEncrypted");
        smtp.put("passwordConfigured", hasPassword(smtp));
        smtp.put("smtpConfigured", isConfigured());
        return smtp;
    }

    public Map<String, Object> save(Map<String, Object> body) {
        Map<String, Object> current = new HashMap<>(loadMap());
        if (body.containsKey("host")) {
            current.put("host", string(body, "host", ""));
        }
        if (body.containsKey("port")) {
            current.put("port", parsePort(body.get("port"), intValue(current.get("port"), 465)));
        }
        if (body.containsKey("security")) {
            current.put("security", normalizeSecurity(string(body, "security", "ssl")));
        }
        if (body.containsKey("username")) {
            current.put("username", string(body, "username", ""));
        }
        if (body.containsKey("authEnabled")) {
            current.put("authEnabled", Boolean.TRUE.equals(body.get("authEnabled")));
        }
        Object password = body.get("password");
        if (password != null) {
            String plain = password.toString();
            if (!plain.isBlank()) {
                current.put("passwordEncrypted", secrets.encrypt(plain));
            }
        }
        if (!current.containsKey("port")) {
            current.put("port", 465);
        }
        if (!current.containsKey("security")) {
            current.put("security", "ssl");
        }
        if (!current.containsKey("authEnabled")) {
            current.put("authEnabled", true);
        }
        platformSettings.save(SETTINGS_KEY, current);
        return getPublicSettings();
    }

    SmtpSettingsService.SmtpConnectionConfig loadConnectionConfig() {
        Map<String, Object> smtp = loadMap();
        String host = string(smtp, "host", "");
        if (host.isBlank()) {
            return null;
        }
        String encrypted = string(smtp, "passwordEncrypted", "");
        String password = encrypted.isBlank() ? "" : secrets.decrypt(encrypted);
        return new SmtpSettingsService.SmtpConnectionConfig(
                host,
                intValue(smtp.get("port"), 465),
                normalizeSecurity(string(smtp, "security", "ssl")),
                string(smtp, "username", ""),
                password,
                Boolean.TRUE.equals(smtp.get("authEnabled")));
    }

    private Map<String, Object> loadMap() {
        Map<String, Object> stored = platformSettings.get(SETTINGS_KEY);
        if (stored == null || stored.isEmpty()) {
            return defaultSmtp();
        }
        return new HashMap<>(stored);
    }

    private static Map<String, Object> defaultSmtp() {
        Map<String, Object> defaults = new HashMap<>();
        defaults.put("host", "");
        defaults.put("port", 465);
        defaults.put("security", "ssl");
        defaults.put("username", "");
        defaults.put("authEnabled", true);
        return defaults;
    }

    private static boolean hasPassword(Map<String, Object> smtp) {
        return !string(smtp, "passwordEncrypted", "").isBlank();
    }

    private static String normalizeSecurity(String security) {
        String normalized = security == null ? "ssl" : security.trim().toLowerCase();
        return switch (normalized) {
            case "ssl", "starttls", "none" -> normalized;
            default -> "ssl";
        };
    }

    private static int parsePort(Object value, int fallback) {
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

    private static int intValue(Object value, int fallback) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return fallback;
    }

    private static String string(Map<String, Object> map, String key, String defaultValue) {
        Object v = map.get(key);
        return v != null ? v.toString().trim() : defaultValue;
    }
}
