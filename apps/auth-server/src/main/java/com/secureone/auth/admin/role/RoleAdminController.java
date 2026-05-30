package com.secureone.auth.admin.role;

import com.secureone.auth.admin.ConflictException;
import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.application.ApplicationRepository;
import com.secureone.auth.audit.AuditService;
import com.secureone.auth.rbac.Role;
import com.secureone.auth.rbac.RoleRepository;
import com.secureone.auth.rbac.UserRoleRepository;
import com.secureone.auth.tenant.TenantRepository;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/v1/roles")
@Transactional
public class RoleAdminController {

    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final TenantRepository tenantRepository;
    private final ApplicationRepository applicationRepository;
    private final AuditService auditService;

    public RoleAdminController(
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            TenantRepository tenantRepository,
            ApplicationRepository applicationRepository,
            AuditService auditService) {
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.tenantRepository = tenantRepository;
        this.applicationRepository = applicationRepository;
        this.auditService = auditService;
    }

    public record RoleResponse(
            UUID id,
            UUID tenantId,
            UUID applicationId,
            String name,
            String description,
            boolean isComposite,
            long userCount) {}

    public record RoleCreateRequest(
            @NotNull UUID tenantId,
            @NotNull UUID applicationId,
            @NotBlank String name,
            String description,
            boolean isComposite) {}

    public record RoleUpdateRequest(@NotBlank String name, String description, boolean isComposite) {}

    @GetMapping
    public List<RoleResponse> list(@RequestParam(required = false) UUID tenantId) {
        List<Role> roles = tenantId != null
                ? roleRepository.findByTenantIdOrderByNameAsc(tenantId)
                : roleRepository.findAll();
        return roles.stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public RoleResponse get(@PathVariable UUID id) {
        return toResponse(require(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoleResponse create(@RequestBody RoleCreateRequest request) {
        requireTenant(request.tenantId());
        if (!applicationRepository.existsById(request.applicationId())) {
            throw new ResourceNotFoundException("Application not found: " + request.applicationId());
        }
        Role role = new Role();
        role.setTenantId(request.tenantId());
        role.setApplicationId(request.applicationId());
        role.setName(request.name().trim());
        role.setDescription(request.description());
        role.setComposite(request.isComposite());
        roleRepository.save(role);
        auditService.record(request.tenantId(), "admin", "role.created", "role", role.getId(), role.getName(), true);
        return toResponse(role);
    }

    @PutMapping("/{id}")
    public RoleResponse update(@PathVariable UUID id, @RequestBody RoleUpdateRequest request) {
        Role role = require(id);
        role.setName(request.name().trim());
        role.setDescription(request.description());
        role.setComposite(request.isComposite());
        auditService.record(role.getTenantId(), "admin", "role.updated", "role", role.getId(), role.getName(), true);
        return toResponse(role);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        Role role = require(id);
        roleRepository.delete(role);
        auditService.record(role.getTenantId(), "admin", "role.deleted", "role", id, role.getName(), true);
    }

    private Role require(UUID id) {
        return roleRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + id));
    }

    private void requireTenant(UUID tenantId) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new ResourceNotFoundException("Tenant not found: " + tenantId);
        }
    }

    private RoleResponse toResponse(Role role) {
        return new RoleResponse(
                role.getId(),
                role.getTenantId(),
                role.getApplicationId(),
                role.getName(),
                role.getDescription(),
                role.isComposite(),
                userRoleRepository.countByRoleId(role.getId()));
    }
}
