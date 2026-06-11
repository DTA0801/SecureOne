package com.secureone.auth.admin.console;

import java.util.Arrays;
import java.util.Optional;

/** Admin console navigation / API sections tenant operators may access. */
public enum ConsoleFeature {
    USERS("users"),
    ROLES("roles"),
    PERMISSIONS("permissions"),
    SETTINGS("settings"),
    AUDIT("audit"),
    LOGS("logs"),
    SESSIONS("sessions");

    private final String key;

    ConsoleFeature(String key) {
        this.key = key;
    }

    public String key() {
        return key;
    }

    public static Optional<ConsoleFeature> fromKey(String key) {
        if (key == null || key.isBlank()) {
            return Optional.empty();
        }
        return Arrays.stream(values()).filter(f -> f.key.equalsIgnoreCase(key.trim())).findFirst();
    }
}
