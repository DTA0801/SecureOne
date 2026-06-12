package com.secureone.auth.authn;

import com.secureone.auth.account.PasswordExpiryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthSessionService {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final LoginSuccessHandler loginSuccessHandler;

    public AuthSessionService(
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository,
            LoginSuccessHandler loginSuccessHandler) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.loginSuccessHandler = loginSuccessHandler;
    }

    public ResponseEntity<?> sessionLogin(
            String tenantSlug, String email, String password, HttpServletRequest request, HttpServletResponse response) {
        String username = tenantSlug.trim().toLowerCase(Locale.ROOT)
                + ":"
                + email.trim().toLowerCase(Locale.ROOT);
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, request, response);
            loginSuccessHandler.recordSuccessfulLogin(request, authentication);
            return ResponseEntity.noContent().build();
        } catch (AuthenticationException ex) {
            ProblemDetail problem =
                    ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, loginFailureMessage(ex));
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
        }
    }

    private static String loginFailureMessage(AuthenticationException ex) {
        Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
        if (cause instanceof UsernameNotFoundException unfe && unfe.getMessage() != null) {
            return unfe.getMessage();
        }
        if (ex instanceof CredentialsExpiredException) {
            return PasswordExpiryService.EXPIRED_LOGIN_MESSAGE;
        }
        if (ex instanceof BadCredentialsException) {
            return "Invalid email or password.";
        }
        String message = ex.getMessage();
        return message != null && !message.isBlank() ? message : "Invalid email or password.";
    }
}
