package com.secureone.auth.rbac;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "role")
@Getter
@Setter
public class Role {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "is_composite", nullable = false)
    private boolean composite;

    @Column(name = "is_system", nullable = false)
    private boolean systemRole;

    @Column(name = "is_default", nullable = false)
    private boolean defaultRole;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }
}
