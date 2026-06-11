package com.secureone.auth.logging;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ApplicationLogRepository
        extends JpaRepository<ApplicationLog, UUID>, JpaSpecificationExecutor<ApplicationLog> {}
