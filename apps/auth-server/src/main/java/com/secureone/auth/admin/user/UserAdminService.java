package com.secureone.auth.admin.user;

import com.secureone.auth.admin.ConflictException;
import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.admin.user.UserAdminDtos.UserCreateRequest;
import com.secureone.auth.admin.user.UserAdminDtos.UserResponse;
import com.secureone.auth.admin.user.UserAdminDtos.UserUpdateRequest;
import com.secureone.auth.account.AccountNotificationService;
import com.secureone.auth.admin.user.UserAdminDtos.MfaFactorResponse;
import com.secureone.auth.audit.AuditService;
import com.secureone.auth.mfa.MfaFactorRepository;
import com.secureone.auth.notify.EmailNotificationService;
import com.secureone.auth.rbac.Role;
import com.secureone.auth.rbac.RoleRepository;
import com.secureone.auth.rbac.UserRole;
import com.secureone.auth.rbac.UserRoleRepository;
import com.secureone.auth.tenant.TenantRepository;
import com.secureone.auth.user.UserAccount;
import com.secureone.auth.user.UserAccountRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserAdminService {

    private final UserAccountRepository userRepository;
    private final TenantRepository tenantRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final AuditService auditService;
    private final AccountNotificationService accountNotifications;
    private final MfaFactorRepository mfaFactors;
    private final EmailNotificationService emailService;

    public UserAdminService(
            UserAccountRepository userRepository,
            TenantRepository tenantRepository,
            UserRoleRepository userRoleRepository,
            RoleRepository roleRepository,
            AuditService auditService,
            AccountNotificationService accountNotifications,
            MfaFactorRepository mfaFactors,
            EmailNotificationService emailService) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.userRoleRepository = userRoleRepository;
        this.roleRepository = roleRepository;
        this.auditService = auditService;
        this.accountNotifications = accountNotifications;
        this.mfaFactors = mfaFactors;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> list() {
        return userRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listByTenant(UUID tenantId) {
        requireTenant(tenantId);
        return userRepository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toResponse)
                .toList();
    }

    /** Users with at least one role whose name contains "admin" (e.g. Tenant Admin, Super Admin). */
    @Transactional(readOnly = true)
    public List<UserResponse> listWithAdminRole(UUID tenantId) {
        List<UUID> adminRoleIds =
                roleRepository.findByNameContainingIgnoreCase("admin").stream()
                        .map(Role::getId)
                        .toList();
        if (adminRoleIds.isEmpty()) {
            return List.of();
        }
        List<UUID> userIds = userRoleRepository.findDistinctUserIdsByRoleIdIn(adminRoleIds);
        if (userIds.isEmpty()) {
            return List.of();
        }
        List<UserAccount> users = new ArrayList<>();
        for (UUID userId : userIds) {
            userRepository.findById(userId).ifPresent(users::add);
        }
        return users.stream()
                .filter(u -> tenantId == null || tenantId.equals(u.getTenantId()))
                .sorted(Comparator.comparing(UserAccount::getEmail))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse get(UUID id) {
        return toResponse(require(id));
    }

    public UserResponse create(UserCreateRequest request) {
        requireTenant(request.tenantId());
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByTenantIdAndEmail(request.tenantId(), email).isPresent()) {
            throw new ConflictException("User email already exists in tenant: " + email);
        }
        UserAccount user = new UserAccount();
        user.setTenantId(request.tenantId());
        user.setEmail(email);
        user.setUsername(resolveUsername(request.username(), email));
        user.setDisplayName(displayName(request.firstName(), request.lastName()));
        user.setStatus(normalizeStatus(request.status(), "PENDING"));
        user.setEmailVerified(false);
        user.setType("USER");
        userRepository.save(user);
        syncUserRoles(user.getId(), request.roleIds());
        auditService.record(user.getTenantId(), "admin", "user.created", "user_account", user.getId(), user.getEmail(), true);
        accountNotifications.onUserInvited(user);
        return toResponse(user);
    }

    public void sendPasswordResetEmail(UUID id) {
        UserAccount user = require(id);
        accountNotifications.sendPasswordResetEmail(user, "admin");
        auditService.record(
                user.getTenantId(), "admin", "user.password_reset_sent", "user_account", user.getId(), user.getEmail(), true);
    }

    public void resendVerificationEmail(UUID id) {
        UserAccount user = require(id);
        accountNotifications.sendVerificationEmail(user, "admin");
        auditService.record(
                user.getTenantId(), "admin", "user.verification_resent", "user_account", user.getId(), user.getEmail(), true);
    }

    public UserResponse markEmailVerified(UUID id) {
        UserAccount user = require(id);
        accountNotifications.adminMarkEmailVerified(id);
        auditService.record(
                user.getTenantId(), "admin", "user.email_verified", "user_account", user.getId(), user.getEmail(), true);
        return toResponse(require(id));
    }

    public void resetMfa(UUID id) {
        UserAccount user = require(id);
        mfaFactors.deleteByUserId(user.getId());
        auditService.record(user.getTenantId(), "admin", "user.mfa_reset", "user_account", user.getId(), user.getEmail(), true);
        emailService.sendAdminSecurityAlert("MFA reset", "Admin cleared MFA factors for " + user.getEmail() + ".");
    }

    public UserResponse update(UUID id, UserUpdateRequest request) {
        UserAccount user = require(id);
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        userRepository.findByTenantIdAndEmail(user.getTenantId(), email).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ConflictException("User email already exists in tenant: " + email);
            }
        });
        user.setEmail(email);
        user.setUsername(resolveUsername(request.username(), email));
        user.setDisplayName(displayName(request.firstName(), request.lastName()));
        user.setStatus(normalizeStatus(request.status(), user.getStatus()));
        if (request.roleIds() != null) {
            syncUserRoles(user.getId(), request.roleIds());
        }
        auditService.record(user.getTenantId(), "admin", "user.updated", "user_account", user.getId(), user.getEmail(), true);
        return toResponse(user);
    }

    public void delete(UUID id) {
        UserAccount user = require(id);
        userRepository.delete(user);
        auditService.record(user.getTenantId(), "admin", "user.deleted", "user_account", id, user.getEmail(), true);
    }

    public UserResponse setStatus(UUID id, String status) {
        UserAccount user = require(id);
        user.setStatus(normalizeStatus(status, user.getStatus()));
        auditService.record(user.getTenantId(), "admin", "user.status_changed", "user_account", user.getId(), user.getEmail(), true);
        return toResponse(user);
    }

    private UserAccount require(UUID id) {
        return userRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private void requireTenant(UUID tenantId) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new ResourceNotFoundException("Tenant not found: " + tenantId);
        }
    }

    private UserResponse toResponse(UserAccount user) {
        NameParts parts = splitDisplayName(user.getDisplayName());
        List<String> roleIds = userRoleRepository.findByUserId(user.getId()).stream()
                .map(ur -> ur.getRoleId().toString())
                .sorted()
                .toList();
        List<MfaFactorResponse> factors = mfaFactors.findByUserIdOrderByCreatedAtAsc(user.getId()).stream()
                .map(f -> new MfaFactorResponse(
                        f.getId().toString(),
                        f.getType(),
                        f.getLabel() != null ? f.getLabel() : f.getType(),
                        f.isVerified()))
                .toList();
        return new UserResponse(
                user.getId(),
                user.getTenantId(),
                user.getEmail(),
                user.getUsername() != null ? user.getUsername() : "",
                parts.firstName(),
                parts.lastName(),
                user.getStatus().toLowerCase(Locale.ROOT),
                user.isEmailVerified(),
                roleIds,
                factors,
                user.getLastLoginAt(),
                user.getCreatedAt());
    }

    private void syncUserRoles(UUID userId, List<UUID> roleIds) {
        userRoleRepository.deleteByUserId(userId);
        if (roleIds == null || roleIds.isEmpty()) {
            return;
        }
        LinkedHashSet<UUID> unique = new LinkedHashSet<>(roleIds);
        for (UUID roleId : unique) {
            if (!roleRepository.existsById(roleId)) {
                throw new ResourceNotFoundException("Role not found: " + roleId);
            }
            UserRole grant = new UserRole();
            grant.setUserId(userId);
            grant.setRoleId(roleId);
            userRoleRepository.save(grant);
        }
    }

    private static String resolveUsername(String username, String email) {
        if (username != null && !username.isBlank()) {
            return username.trim();
        }
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }

    private static String displayName(String firstName, String lastName) {
        String f = firstName != null ? firstName.trim() : "";
        String l = lastName != null ? lastName.trim() : "";
        return (f + " " + l).trim();
    }

    private static NameParts splitDisplayName(String displayName) {
        if (displayName == null || displayName.isBlank()) {
            return new NameParts("", "");
        }
        String[] parts = displayName.trim().split("\\s+", 2);
        return new NameParts(parts[0], parts.length > 1 ? parts[1] : "");
    }

    private static String normalizeStatus(String status, String defaultStatus) {
        if (status == null || status.isBlank()) {
            return defaultStatus;
        }
        return switch (status.trim().toLowerCase(Locale.ROOT)) {
            case "active" -> "ACTIVE";
            case "suspended" -> "SUSPENDED";
            case "disabled" -> "DISABLED";
            case "invited" -> "PENDING";
            default -> status.trim().toUpperCase(Locale.ROOT);
        };
    }

    private record NameParts(String firstName, String lastName) {}
}
