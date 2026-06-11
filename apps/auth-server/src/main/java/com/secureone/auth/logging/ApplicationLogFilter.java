package com.secureone.auth.logging;

import java.time.Instant;
import java.util.UUID;

/** Shared criteria for searching and deleting application logs. */
public record ApplicationLogFilter(
        String sessionId,
        String requestId,
        String level,
        UUID applicationId,
        UUID tenantId,
        boolean includeUnscoped,
        Instant since,
        Instant until,
        String search) {}
