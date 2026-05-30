package com.secureone.auth.admin.user;

import com.secureone.auth.admin.ConflictException;
import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.admin.user.UserAdminDtos.UserCreateRequest;
import com.secureone.auth.admin.user.UserAdminDtos.UserResponse;
import com.secureone.auth.admin.user.UserAdminDtos.UserUpdateRequest;
import com.secureone.auth.tenant.TenantRepository;
import com.secureone.auth.user.UserAccount;
import com.secureone.auth.user.UserAccountRepository;
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

    public UserAdminService(UserAccountRepository userRepository, TenantRepository tenantRepository) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
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
        return toResponse(user);
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
        return toResponse(user);
    }

    public void delete(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found: " + id);
        }
        userRepository.deleteById(id);
    }

    public UserResponse setStatus(UUID id, String status) {
        UserAccount user = require(id);
        user.setStatus(normalizeStatus(status, user.getStatus()));
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
        return new UserResponse(
                user.getId(),
                user.getTenantId(),
                user.getEmail(),
                user.getUsername() != null ? user.getUsername() : "",
                parts.firstName(),
                parts.lastName(),
                user.getStatus().toLowerCase(Locale.ROOT),
                user.isEmailVerified(),
                List.of(),
                user.getLastLoginAt(),
                user.getCreatedAt());
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
