package com.secureone.auth.admin.application;

import com.secureone.auth.admin.user.UserAdminDtos.UserAuthMethodsUpdateRequest;
import com.secureone.auth.admin.user.UserAdminDtos.UserResponse;
import com.secureone.auth.admin.user.UserAdminService;
import com.secureone.auth.admin.user.UserImportExportService;
import com.secureone.auth.application.ApplicationSettingsService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
import org.springframework.web.multipart.MultipartFile;

/**
 * Per-application admin: users and settings scoped to one OAuth client / relying party.
 * Unset app settings inherit platform defaults.
 */
@RestController
@RequestMapping("/api/admin/v1/applications/{applicationId}")
public class ApplicationScopedAdminController {

    private final ApplicationUserAdminService users;
    private final ApplicationSettingsService settings;
    private final UserAdminService userAdmin;
    private final UserImportExportService userImportExport;

    public ApplicationScopedAdminController(
            ApplicationUserAdminService users,
            ApplicationSettingsService settings,
            UserAdminService userAdmin,
            UserImportExportService userImportExport) {
        this.users = users;
        this.settings = settings;
        this.userAdmin = userAdmin;
        this.userImportExport = userImportExport;
    }

    @GetMapping("/users")
    public List<UserResponse> listUsers(@PathVariable UUID applicationId) {
        return users.listUsers(applicationId);
    }

    @PostMapping("/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void grantUser(@PathVariable UUID applicationId, @PathVariable UUID userId) {
        users.grantAccess(applicationId, userId);
    }

    @DeleteMapping("/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revokeUser(@PathVariable UUID applicationId, @PathVariable UUID userId) {
        users.revokeAccess(applicationId, userId);
    }

    @GetMapping("/users/{userId}")
    public UserResponse getUser(@PathVariable UUID applicationId, @PathVariable UUID userId) {
        return userAdmin.get(userId, applicationId);
    }

    @PutMapping("/users/{userId}/auth-methods")
    public UserResponse updateUserAuthMethods(
            @PathVariable UUID applicationId,
            @PathVariable UUID userId,
            @Valid @RequestBody UserAuthMethodsUpdateRequest body) {
        return userAdmin.updateAuthMethods(userId, applicationId, body.methods());
    }

    @DeleteMapping("/users/{userId}/mfa/factors/{factorId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMfaFactor(
            @PathVariable UUID applicationId, @PathVariable UUID userId, @PathVariable UUID factorId) {
        userAdmin.deleteMfaFactor(userId, factorId);
    }

    @PostMapping("/users/{userId}/mfa/methods/{methodId}/reset")
    public UserResponse resetMfaForMethod(
            @PathVariable UUID applicationId,
            @PathVariable UUID userId,
            @PathVariable String methodId) {
        return userAdmin.resetMfaForMethod(userId, applicationId, methodId);
    }

    @GetMapping(value = "/users/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportUsers(
            @PathVariable UUID applicationId, @RequestParam(defaultValue = "csv") String format) {
        byte[] body = userImportExport.exportUsers(applicationId, format);
        String filename = "users-" + applicationId + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(body);
    }

    @PostMapping(value = "/users/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> importUsers(
            @PathVariable UUID applicationId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "csv") String source) {
        return userImportExport.importFromFile(applicationId, file, source);
    }

    @PostMapping("/users/import/ldap/preview")
    public Map<String, Object> previewLdapImport(@PathVariable UUID applicationId) {
        return userImportExport.previewLdap(applicationId);
    }

    @PostMapping("/users/import/ldap")
    public Map<String, Object> importFromLdap(@PathVariable UUID applicationId) {
        return userImportExport.importFromLdap(applicationId);
    }

    @GetMapping("/settings/workspace")
    public Map<String, Object> getSettingsWorkspace(@PathVariable UUID applicationId) {
        return settings.getWorkspace(applicationId);
    }

    @GetMapping("/settings/exposure")
    public Map<String, Boolean> getExposure(@PathVariable UUID applicationId) {
        return settings.getExposureForApplication(applicationId);
    }

    @GetMapping("/settings/notifications")
    public Map<String, Object> getNotifications(@PathVariable UUID applicationId) {
        return settings.getNotifications(applicationId);
    }

    @PutMapping("/settings/notifications")
    public Map<String, Object> updateNotifications(
            @PathVariable UUID applicationId, @RequestBody Map<String, Object> body) {
        return settings.saveNotifications(applicationId, body);
    }

    @DeleteMapping("/settings/notifications")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetNotifications(@PathVariable UUID applicationId) {
        settings.clearOverride(applicationId, "notifications");
    }

    @GetMapping("/settings/email")
    public Map<String, Object> getEmail(@PathVariable UUID applicationId) {
        return settings.getEmail(applicationId);
    }

    @PutMapping("/settings/email")
    public Map<String, Object> updateEmail(
            @PathVariable UUID applicationId, @RequestBody Map<String, Object> body) {
        return settings.saveEmail(applicationId, body);
    }

    @DeleteMapping("/settings/email")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetEmail(@PathVariable UUID applicationId) {
        settings.clearOverride(applicationId, "email");
    }

    @GetMapping("/settings/auth-methods")
    public List<Map<String, Object>> getAuthMethods(@PathVariable UUID applicationId) {
        return settings.getAuthMethods(applicationId);
    }

    @PutMapping("/settings/auth-methods")
    public List<Map<String, Object>> updateAuthMethods(
            @PathVariable UUID applicationId, @RequestBody List<Map<String, Object>> body) {
        return settings.saveAuthMethods(applicationId, body);
    }

    @DeleteMapping("/settings/auth-methods")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetAuthMethods(@PathVariable UUID applicationId) {
        settings.clearOverride(applicationId, "auth_methods");
    }

    @GetMapping("/settings/password-policy")
    public Map<String, Object> getPasswordPolicy(@PathVariable UUID applicationId) {
        return settings.getPasswordPolicy(applicationId);
    }

    @PutMapping("/settings/password-policy")
    public Map<String, Object> updatePasswordPolicy(
            @PathVariable UUID applicationId, @RequestBody Map<String, Object> body) {
        return settings.savePasswordPolicy(applicationId, body);
    }

    @DeleteMapping("/settings/password-policy")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPasswordPolicy(@PathVariable UUID applicationId) {
        settings.clearOverride(applicationId, "password_policy");
    }

    @GetMapping("/settings/feature-flags")
    public List<Map<String, Object>> getFeatureFlags(@PathVariable UUID applicationId) {
        return settings.getFeatureFlags(applicationId);
    }

    @PutMapping("/settings/feature-flags")
    public List<Map<String, Object>> updateFeatureFlags(
            @PathVariable UUID applicationId, @RequestBody List<Map<String, Object>> body) {
        return settings.saveFeatureFlags(applicationId, body);
    }

    @DeleteMapping("/settings/feature-flags")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetFeatureFlags(@PathVariable UUID applicationId) {
        settings.clearOverride(applicationId, "feature_flags");
    }

    @GetMapping("/settings/user-directory")
    public Map<String, Object> getUserDirectory(@PathVariable UUID applicationId) {
        return settings.getUserDirectory(applicationId);
    }

    @PutMapping("/settings/user-directory")
    public Map<String, Object> updateUserDirectory(
            @PathVariable UUID applicationId, @RequestBody Map<String, Object> body) {
        return settings.saveUserDirectory(applicationId, body);
    }

    @DeleteMapping("/settings/user-directory")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetUserDirectory(@PathVariable UUID applicationId) {
        settings.clearOverride(applicationId, "user_directory");
    }
}
