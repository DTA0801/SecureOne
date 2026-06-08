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

    public ApplicationUserAdminService(
            ApplicationRepository applications,
            UserApplicationRepository memberships,
            UserAccountRepository users,
            UserAdminService userAdminService,
            AuditLogRepository auditLogs) {
        this.applications = applications;
        this.memberships = memberships;
        this.users = users;
        this.userAdminService = userAdminService;
        this.auditLogs = auditLogs;
    }

    @Transactional
    public List<UserResponse> listUsers(UUID applicationId) {
        requireApplication(applicationId);
        Set<UUID> userIds = new LinkedHashSet<>(memberships.findUserIdsByApplicationId(applicationId));
        for (UUID userId : auditLogs.findDistinctTargetIdsByApplicationIdAndAction(applicationId, SELF_REGISTERED_ACTION)) {
            if (!memberships.existsByUserIdAndApplicationId(userId, applicationId)) {
                grantAccess(applicationId, userId);
            }
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
        var app = requireApplication(applicationId);
        var user = users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if (!user.getTenantId().equals(app.getTenantId())) {
            throw new IllegalArgumentException("User must belong to the same tenant as the application");
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

    private com.secureone.auth.application.Application requireApplication(UUID applicationId) {
        return applications
                .findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + applicationId));
    }
}
