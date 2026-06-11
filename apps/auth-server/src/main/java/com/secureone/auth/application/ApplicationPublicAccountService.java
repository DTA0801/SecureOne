package com.secureone.auth.application;

import com.secureone.auth.account.AccountNotificationService;
import com.secureone.auth.authn.AuthSessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ApplicationPublicAccountService {

    private final AccountNotificationService accounts;
    private final AuthSessionService sessions;
    private final ApplicationTenantResolver tenants;

    public ApplicationPublicAccountService(
            AccountNotificationService accounts,
            AuthSessionService sessions,
            ApplicationTenantResolver tenants) {
        this.accounts = accounts;
        this.sessions = sessions;
        this.tenants = tenants;
    }

    public Map<String, String> forgotPassword(UUID applicationId, String email) {
        tenants.requireActiveApplication(applicationId);
        return accounts.requestPasswordResetForApplication(applicationId, email);
    }

    public Map<String, String> resendVerification(UUID applicationId, String email) {
        tenants.requireActiveApplication(applicationId);
        return accounts.resendVerificationForApplication(applicationId, email);
    }

    public Map<String, String> requestMagicLink(UUID applicationId, String email) {
        tenants.requireActiveApplication(applicationId);
        return accounts.requestMagicLinkForApplication(applicationId, email);
    }

    public ResponseEntity<?> sessionLogin(
            UUID applicationId, String email, String password, HttpServletRequest request, HttpServletResponse response) {
        tenants.requireActiveApplication(applicationId);
        String tenantSlug = tenants.requireTenantSlug(applicationId);
        return sessions.sessionLogin(tenantSlug, email, password, request, response);
    }
}
