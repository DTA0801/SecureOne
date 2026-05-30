package com.secureone.auth.application;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_application")
@IdClass(UserApplication.UserApplicationId.class)
@Getter
@Setter
public class UserApplication {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Id
    @Column(name = "application_id", nullable = false, updatable = false)
    private UUID applicationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public record UserApplicationId(UUID userId, UUID applicationId) implements Serializable {}
}
