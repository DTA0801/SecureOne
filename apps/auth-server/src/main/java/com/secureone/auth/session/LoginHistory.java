package com.secureone.auth.session;

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
@Table(name = "login_history")
@Getter
@Setter
public class LoginHistory {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "application_id")
    private UUID applicationId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "result", nullable = false)
    private String result;

    @Column(name = "ip")
    private String ip;

    @Column(name = "device")
    private String device;

    @Column(name = "session_id", length = 128)
    private String sessionId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "geo", columnDefinition = "jsonb")
    private Map<String, Object> geo = new HashMap<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

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
