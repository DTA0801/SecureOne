package com.secureone.auth.application;

import java.util.Locale;

/** Consumer-facing auth helpers — tenant slug is resolved server-side, never shown to end users. */
public final class ApplicationConsumerAuth {

    private ApplicationConsumerAuth() {}

    public static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
