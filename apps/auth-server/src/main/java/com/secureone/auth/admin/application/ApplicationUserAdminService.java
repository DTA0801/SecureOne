package com.secureone.auth.admin.application;

import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.admin.user.UserAdminDtos.UserResponse;
import com.secureone.auth.admin.user.UserAdminService;
import com.secureone.auth.application.ApplicationRepository;
import com.secureone.auth.application.UserApplication;
import com.secureone.auth.application.UserApplicationRepository;
import com.secureone.auth.user.UserAccountRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ApplicationUserAdminService {

    private final ApplicationRepository applications;
    private final UserApplicationRepository memberships;
    private final UserAccountRepository users;
    private final UserAdminService userAdminService;

    public ApplicationUserAdminService(
            ApplicationRepository applications,
            UserApplicationRepository memberships,
            UserAccountRepository users,
            UserAdminService userAdminService) {
        this.applications = applications;
        this.memberships = memberships;
        this.users = users;
        this.userAdminService = userAdminService;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers(UUID applicationId) {
        requireApplication(applicationId);
        List<UUID> userIds = memberships.findUserIdsByApplicationId(applicationId);
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
