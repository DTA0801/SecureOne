package com.secureone.auth.audit;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final AuditLogRepository repository;

    public AuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void record(
            UUID tenantId,
            String actorEmail,
            String action,
            String targetType,
            UUID targetId,
            String targetLabel,
            boolean success) {
        record(tenantId, null, actorEmail, action, targetType, targetId, targetLabel, success);
    }

    @Transactional
    public void record(
            UUID tenantId,
            UUID applicationId,
            String actorEmail,
            String action,
            String targetType,
            UUID targetId,
            String targetLabel,
            boolean success) {
        AuditLog log = new AuditLog();
        log.setTenantId(tenantId);
        log.setApplicationId(applicationId);
        log.setActorType("ADMIN");
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setIp("127.0.0.1");
        Map<String, Object> meta = new HashMap<>();
        meta.put("result", success ? "success" : "failure");
        meta.put("actorEmail", actorEmail != null ? actorEmail : "admin");
        meta.put("targetLabel", targetLabel);
        log.setMetadata(meta);
        repository.save(log);
    }
}
