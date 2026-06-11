package com.secureone.auth.logging;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "application_log")
@Getter
@Setter
public class ApplicationLog {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "level", nullable = false, length = 16)
    private String level;

    @Column(name = "logger", nullable = false, length = 256)
    private String logger;

    @Column(name = "message", nullable = false, columnDefinition = "text")
    private String message;

    @Column(name = "session_id", length = 128)
    private String sessionId;

    @Column(name = "request_id", length = 64)
    private String requestId;

    @Column(name = "principal", length = 320)
    private String principal;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "application_id")
    private UUID applicationId;

    @Column(name = "ip", length = 64)
    private String ip;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> metadata = new HashMap<>();

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
