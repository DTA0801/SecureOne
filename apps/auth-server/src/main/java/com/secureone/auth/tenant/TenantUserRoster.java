package com.secureone.auth.tenant;

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
@Table(name = "tenant_user_roster")
@IdClass(TenantUserRoster.TenantUserRosterId.class)
@Getter
@Setter
public class TenantUserRoster {

    @Id
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt;

    @Column(name = "source", nullable = false, updatable = false)
    private String source = TenantRosterSource.DIRECT.wireValue();

    @Column(name = "source_application_id", updatable = false)
    private UUID sourceApplicationId;

    @Column(name = "added_by", updatable = false)
    private UUID addedBy;

    @PrePersist
    void onCreate() {
        if (addedAt == null) {
            addedAt = Instant.now();
        }
    }

    public record TenantUserRosterId(UUID tenantId, UUID userId) implements Serializable {}
}
