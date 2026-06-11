package com.secureone.auth.admin.application;

import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.admin.user.UserAdminDtos.UserResponse;
import com.secureone.auth.admin.user.UserAdminService;
import com.secureone.auth.application.ApplicationRepository;
import com.secureone.auth.application.UserApplication;
import com.secureone.auth.application.UserApplicationRepository;
import com.secureone.auth.audit.AuditLogRepository;
import com.secureone.auth.user.UserAccountRepository;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ApplicationUserAdminService {

    private static final String SELF_REGISTERED_ACTION = "user.self_registered";

    private final ApplicationRepository applications;
    private final UserApplicationRepository memberships;
    private final UserAccountRepository users;
    private final UserAdminService userAdminService;
    private final AuditLogRepository auditLogs;
    private final JdbcTemplate jdbc;

    public ApplicationUserAdminService(
            ApplicationRepository applications,
            UserApplicationRepository memberships,
            UserAccountRepository users,
            UserAdminService userAdminService,
            AuditLogRepository auditLogs,
            JdbcTemplate jdbc) {
        this.applications = applications;
        this.memberships = memberships;
        this.users = users;
        this.userAdminService = userAdminService;
        this.auditLogs = auditLogs;
        this.jdbc = jdbc;
    }

    @Transactional
    public List<UserResponse> listUsers(UUID applicationId) {
        var app = requireApplication(applicationId);
        Set<UUID> userIds = new LinkedHashSet<>();
        for (UUID userId : findPendingInviteUserIds(app.getTenantId(), applicationId)) {
            userIds.add(userId);
        }
        for (UUID userId : memberships.findUserIdsByApplicationId(applicationId)) {
            if (users.findById(userId).isPresent()) {
                userIds.add(userId);
            } else {
                memberships.deleteByUserIdAndApplicationId(userId, applicationId);
            }
        }
        for (UUID userId : auditLogs.findDistinctTargetIdsByApplicationIdAndAction(applicationId, SELF_REGISTERED_ACTION)) {
            if (users.findById(userId).isEmpty()) {
                continue;
            }
            linkAccessIfAbsent(applicationId, userId);
            userIds.add(userId);
        }
        if (userIds.isEmpty()) {
            return List.of();
        }
        List<UserResponse> result = new ArrayList<>();
        for (UUID userId : userIds) {
            users.findById(userId)
                    .ifPresent(u -> result.add(userAdminService.toResponsePublic(u, applicationId)));
        }
        result.sort((a, b) -> a.email().compareToIgnoreCase(b.email()));
        return result;
    }

    public void grantAccess(UUID applicationId, UUID userId) {
        var user = users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        var app = requireApplication(applicationId);
        if (!user.getTenantId().equals(app.getTenantId())) {
            throw new IllegalArgumentException("User must belong to the same tenant as the application");
        }
        linkAccessIfAbsent(applicationId, userId);
    }

    private void linkAccessIfAbsent(UUID applicationId, UUID userId) {
        if (!users.findById(userId).isPresent()) {
            return;
        }
        if (!memberships.existsByUserIdAndApplicationId(userId, applicationId)) {
            UserApplication link = new UserApplication();
            link.setUserId(userId);
            link.setApplicationId(applicationId);
            memberships.save(link);
        }
    }

    public void revokeAccess(UUID applicationId, UUID userId) {
        requireApplication(applicationId);
        memberships.deleteByUserIdAndApplicationId(userId, applicationId);
    }

    private List<UUID> findPendingInviteUserIds(UUID tenantId, UUID applicationId) {
        return jdbc.queryForList(
                """
                SELECT id
                FROM user_account
                WHERE tenant_id = ?
                  AND attributes->>'pendingInviteApplicationId' = ?
                """,
                UUID.class,
                tenantId,
                applicationId.toString());
    }

    private com.secureone.auth.application.Application requireApplication(UUID applicationId) {
        return applications
                .findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + applicationId));
    }
}
