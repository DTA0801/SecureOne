package com.secureone.auth.application;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "application_setting")
@IdClass(ApplicationSetting.ApplicationSettingId.class)
@Getter
@Setter
public class ApplicationSetting {

    @Id
    @Column(name = "application_id", nullable = false, updatable = false)
    private UUID applicationId;

    @Id
    @Column(name = "setting_key", nullable = false, updatable = false)
    private String key;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "value", nullable = false, columnDefinition = "jsonb")
    private Object value;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public record ApplicationSettingId(UUID applicationId, String key) implements Serializable {}
}
