package com.secureone.auth.authn;

import com.secureone.auth.logging.AuthRequestContext;
import com.secureone.auth.session.LoginHistoryService;
import com.secureone.auth.tenant.TenantRepository;
import com.secureone.auth.user.UserAccount;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.stereotype.Component;

@Component
public class FormLoginFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private static final Logger log = LoggerFactory.getLogger(FormLoginFailureHandler.class);

    private final RequestCache requestCache;
    private final TenantUserDetailsService userDetailsService;
    private final LoginHistoryService loginHistory;
    private final TenantRepository tenants;

    public FormLoginFailureHandler(
            RequestCache requestCache,
            TenantUserDetailsService userDetailsService,
            LoginHistoryService loginHistory,
            TenantRepository tenants) {
        this.requestCache = requestCache;
        this.userDetailsService = userDetailsService;
        this.loginHistory = loginHistory;
        this.tenants = tenants;
        setDefaultFailureUrl("/login.html?error");
    }

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
            throws IOException, ServletException {
        String authorizeUrl =
                OAuthLoginRedirectSupport.resolvePendingAuthorizeUrl(request, response, requestCache);
        setDefaultFailureUrl(OAuthLoginRedirectSupport.appendContinueToLoginUrl("/login.html?error", authorizeUrl));

        LoginAttemptDiagnostics.Snapshot snapshot = LoginAttemptDiagnostics.capture(request);
        String username = snapshot.usernameField();
        AuthRequestContext.enrichForLogin(request, username, tenants);
        String reasonCode = LoginAttemptDiagnostics.classify(exception, snapshot);
        LoginAttemptDiagnostics.applyMdc(snapshot, reasonCode, exception);
        Map<String, Object> diagnostics = LoginAttemptDiagnostics.toMetadata(snapshot, reasonCode, exception);
        log.warn(
                "Form login failed [sess={}] {}",
                AuthRequestContext.formatSessionRef(request),
                LoginAttemptDiagnostics.formatLogLine(snapshot, reasonCode, exception));
        recordFailure(request, snapshot, reasonCode, exception, diagnostics);
        super.onAuthenticationFailure(request, response, exception);
    }

    private void recordFailure(
            HttpServletRequest request,
            LoginAttemptDiagnostics.Snapshot snapshot,
            String reasonCode,
            AuthenticationException exception,
            Map<String, Object> diagnostics) {
        String username = snapshot.usernameField();
        if (username == null || !username.contains(":")) {
            return;
        }
        try {
            int sep = username.indexOf(':');
            UserAccount account = userDetailsService.resolveAccount(
                    username.substring(0, sep).trim().toLowerCase(Locale.ROOT),
                    username.substring(sep + 1).trim().toLowerCase(Locale.ROOT));
            loginHistory.recordFailure(
                    account,
                    null,
                    request.getRemoteAddr(),
                    request.getHeader("User-Agent"),
                    AuthRequestContext.resolveSessionId(request),
                    reasonCode,
                    exception.getMessage(),
                    diagnostics);
        } catch (RuntimeException ignored) {
            // Unknown tenant/user — still logged at WARN above with full request diagnostics.
        }
    }
}
