package com.secureone.auth.admin.application;

import com.secureone.auth.admin.AdminAccessService;
import com.secureone.auth.admin.application.ApplicationAdminDtos.ApplicationCreateRequest;
import com.secureone.auth.admin.application.ApplicationAdminDtos.ApplicationResponse;
import com.secureone.auth.admin.application.ApplicationAdminDtos.ApplicationUpdateRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin — applications", description = "Register and manage application products (console scope)")
@SecurityRequirement(name = "adminHttpBasic")
@RestController
@RequestMapping("/api/admin/v1/applications")
public class ApplicationAdminController {

    private final ApplicationAdminService service;
    private final AdminAccessService access;

    public ApplicationAdminController(ApplicationAdminService service, AdminAccessService access) {
        this.service = service;
        this.access = access;
    }

    @GetMapping
    public List<ApplicationResponse> list(
            Authentication authentication,
            @org.springframework.web.bind.annotation.RequestHeader(value = "X-Act-As-Email", required = false)
                    String actAsEmail,
            @RequestParam(required = false) UUID tenantId) {
        if (access.isPlatformSuperAdmin(authentication)) {
            if (tenantId != null) {
                return service.listByTenant(tenantId);
            }
            return service.list();
        }
        return access.accessibleApplications(authentication, actAsEmail).stream()
                .filter(a -> tenantId == null || tenantId.equals(a.tenantId()))
                .map(a -> service.get(a.id()))
                .toList();
    }

    @GetMapping("/{id}")
    public ApplicationResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse create(
            Authentication authentication, @Valid @RequestBody ApplicationCreateRequest request) {
        access.requireSuperAdmin(authentication);
        return service.create(request);
    }

    @PutMapping("/{id}")
    public ApplicationResponse update(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody ApplicationUpdateRequest request) {
        access.requireSuperAdmin(authentication);
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable UUID id) {
        access.requireSuperAdmin(authentication);
        service.delete(id);
    }

    @PostMapping("/{id}/isolate")
    public ApplicationResponse isolate(Authentication authentication, @PathVariable UUID id) {
        access.requireSuperAdmin(authentication);
        return service.isolate(id);
    }
}
