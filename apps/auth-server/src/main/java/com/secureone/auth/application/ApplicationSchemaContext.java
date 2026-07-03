package com.secureone.auth.application;

import java.util.UUID;

/** Thread-local application id for schema routing within a request/transaction. */
public final class ApplicationSchemaContext {

    private static final ThreadLocal<UUID> APPLICATION_ID = new ThreadLocal<>();

    private ApplicationSchemaContext() {}

    public static void setApplicationId(UUID applicationId) {
        if (applicationId == null) {
            APPLICATION_ID.remove();
        } else {
            APPLICATION_ID.set(applicationId);
        }
    }

    public static UUID getApplicationId() {
        return APPLICATION_ID.get();
    }

    public static void clear() {
        APPLICATION_ID.remove();
    }
}
