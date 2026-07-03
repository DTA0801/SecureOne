package com.secureone.auth.application;

import java.util.Locale;

public final class ApplicationSchemaNames {

    public static final String PLATFORM_SCHEMA = "platform";

    private ApplicationSchemaNames() {}

    public static String fromSlug(String slug) {
        if (slug == null || slug.isBlank()) {
            throw new IllegalArgumentException("Application slug is required for schema provisioning.");
        }
        String normalized = slugify(slug);
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Application slug cannot be normalized to a schema name.");
        }
        if (PLATFORM_SCHEMA.equals(normalized) || "public".equals(normalized)) {
            throw new IllegalArgumentException("Schema name '" + normalized + "' is reserved.");
        }
        return normalized;
    }

    public static String slugify(String value) {
        return value.trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
    }
}
