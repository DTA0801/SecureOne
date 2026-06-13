package com.secureone.auth.authn;

import com.secureone.auth.application.ApplicationMembershipService;
import com.secureone.auth.application.UserApplicationRepository;
import com.secureone.auth.logging.AuthRequestContext;
import com.secureone.auth.session.LoginHistoryService;
import com.secureone.auth.tenant.TenantRepository;
import com.secureone.auth.user.UserAccount;
import com.secureone.auth.user.UserAccountRepository;
import java.util.UUID;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.security.web.savedrequest.RequestCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(LoginSuccessHandler.class);

    private final RequestCache requestCache;

    private final TenantUserDetailsService userDetailsService;
    private final UserAccountRepository users;
    private final LoginHistoryService loginHistory;
    private final UserApplicationRepository userApplications;
    private final ApplicationMembershipService memberships;
    private final TenantRepository tenants;

    public LoginSuccessHandler(
            RequestCache requestCache,
            TenantUserDetailsService userDetailsService,
            UserAccountRepository users,
            LoginHistoryService loginHistory,
            UserApplicationRepository userApplications,
            ApplicationMembershipService memberships,
            TenantRepository tenants) {
        this.requestCache = requestCache;
        this.userDetailsService = userDetailsService;
        this.users = users;
        this.loginHistory = loginHistory;
        this.userApplications = userApplications;
        this.memberships = memberships;
        this.tenants = tenants;
        setDefaultTargetUrl("/login.html?signedIn=1");
    }

    private void finishLogin(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {
        String authorizeUrl =
                OAuthLoginRedirectSupport.resolvePendingAuthorizeUrl(request, response, requestCache);
        if (authorizeUrl != null) {
            requestCache.removeRequest(request, response);
            getRedirectStrategy().sendRedirect(request, response, authorizeUrl);
            return;
        }
        String signedInUrl = "/login.html?signedIn=1";
        String applicationId = request.getParameter("applicationId");
        if (applicationId != null && !applicationId.isBlank()) {
            signedInUrl += "&applicationId=" + URLEncoder.encode(applicationId.trim(), StandardCharsets.UTF_8);
        }
        String continueParam = OAuthLoginRedirectSupport.readContinueParam(request);
        if (continueParam != null) {
            signedInUrl = OAuthLoginRedirectSupport.appendContinueToLoginUrl(signedInUrl, continueParam);
        }
        getRedirectStrategy().sendRedirect(request, response, signedInUrl);
    }

    public void recordSuccessfulLogin(HttpServletRequest request, Authentication authentication) {
        String username = authentication.getName();
        AuthRequestContext.enrichForLogin(request, username, tenants);
        if (username == null || !username.contains(":")) {
            return;
        }
        int sep = username.indexOf(':');
        UserAccount account =
                userDetailsService.resolveAccount(username.substring(0, sep), username.substring(sep + 1));
        account.setLastLoginAt(Instant.now());
        users.save(account);
        UUID applicationId = resolveApplicationId(request, account);
        if (applicationId != null) {
            memberships.ensureMemberWithDefaultRole(applicationId, account.getId());
        }
        loginHistory.record(
                account,
                applicationId,
                "SUCCESS",
                request.getRemoteAddr(),
                request.getHeader("User-Agent"),
                "password",
                "—",
                AuthRequestContext.resolveSessionId(request),
                null);
        log.info(
                "Form login succeeded [sess={}] for {}",
                AuthRequestContext.formatSessionRef(request),
                username);
    }

    private UUID resolveApplicationId(HttpServletRequest request, UserAccount account) {
        String raw = request.getParameter("applicationId");
        if (raw != null && !raw.isBlank()) {
            try {
                return UUID.fromString(raw.trim());
            } catch (IllegalArgumentException ignored) {
                // fall through
            }
        }
        return userApplications.findByUserId(account.getId()).stream()
                .map(ua -> ua.getApplicationId())
                .findFirst()
                .orElse(null);
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {
        recordSuccessfulLogin(request, authentication);
        finishLogin(request, response, authentication);
    }
}
