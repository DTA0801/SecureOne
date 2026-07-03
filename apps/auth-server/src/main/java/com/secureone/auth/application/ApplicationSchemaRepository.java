package com.secureone.auth.application;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationSchemaRepository extends JpaRepository<ApplicationSchema, java.util.UUID> {
    Optional<ApplicationSchema> findBySchemaName(String schemaName);

    boolean existsBySchemaName(String schemaName);
}
