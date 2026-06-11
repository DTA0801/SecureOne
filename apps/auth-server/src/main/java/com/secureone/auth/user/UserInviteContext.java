package com.secureone.auth.user;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/** Tracks which application an invite targets until membership is confirmed. */
public final class UserInviteContext {

    public static final String PENDING_APPLICATION_ID = "pendingInviteApplicationId";

    private UserInviteContext() {}

    public static void markPendingApplicationInvite(UserAccount user, UUID applicationId) {
        if (applicationId == null) {
            return;
        }
        Map<String, Object> attrs =
                user.getAttributes() != null ? new LinkedHashMap<>(user.getAttributes()) : new HashMap<>();
        attrs.put(PENDING_APPLICATION_ID, applicationId.toString());
        user.setAttributes(attrs);
    }

    public static Optional<UUID> pendingApplicationId(UserAccount user) {
        if (user == null || user.getAttributes() == null) {
            return Optional.empty();
        }
        Object raw = user.getAttributes().get(PENDING_APPLICATION_ID);
        if (raw == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(UUID.fromString(raw.toString()));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    public static void clearPendingApplicationInvite(UserAccount user) {
        if (user == null || user.getAttributes() == null) {
            return;
        }
        Map<String, Object> attrs = new LinkedHashMap<>(user.getAttributes());
        if (attrs.remove(PENDING_APPLICATION_ID) != null) {
            user.setAttributes(attrs);
        }
    }
}
