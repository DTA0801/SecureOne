package com.secureone.auth.authn;

import com.secureone.auth.session.LoginHistoryService;
import com.secureone.auth.user.UserAccount;
import com.secureone.auth.user.UserAccountRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
public class LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final TenantUserDetailsService userDetailsService;
    private final UserAccountRepository users;
    private final LoginHistoryService loginHistory;

    public LoginSuccessHandler(
            TenantUserDetailsService userDetailsService,
            UserAccountRepository users,
            LoginHistoryService loginHistory) {
        this.userDetailsService = userDetailsService;
        this.users = users;
        this.loginHistory = loginHistory;
        setDefaultTargetUrl("/");
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {
        String username = authentication.getName();
        int sep = username.indexOf(':');
        UserAccount account =
                userDetailsService.resolveAccount(username.substring(0, sep), username.substring(sep + 1));
        account.setLastLoginAt(Instant.now());
        users.save(account);
        loginHistory.record(
                account,
                "SUCCESS",
                request.getRemoteAddr(),
                request.getHeader("User-Agent"),
                "password",
                "—");
        super.onAuthenticationSuccess(request, response, authentication);
    }
}
