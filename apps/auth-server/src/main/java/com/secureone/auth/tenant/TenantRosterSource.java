package com.secureone.auth.tenant;

public enum TenantRosterSource {
    DIRECT,
    IMPORTED,
    CONSOLE_ACCESS;

    public String wireValue() {
        return name().toLowerCase();
    }

    public static TenantRosterSource fromWire(String value) {
        if (value == null || value.isBlank()) {
            return DIRECT;
        }
        return TenantRosterSource.valueOf(value.trim().toUpperCase());
    }
}
