package com.secureone.auth.authn;

import com.secureone.auth.logging.RequestContext;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.slf4j.MDC;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

/** Safe, structured diagnostics for form login attempts (never logs the password value). */
public final class LoginAttemptDiagnostics {

    private LoginAttemptDiagnostics() {}

    public record Snapshot(
            String httpMethod,
            String requestUri,
            String queryString,
            String tenantField,
            String emailField,
            String usernameField,
            boolean passwordPresent,
            int passwordLength,
            String applicationId,
            String userAgent,
            String referer,
            String remoteAddr,
            String forwardedFor,
            String contentType) {}

    public static Snapshot capture(HttpServletRequest request) {
        String password = request.getParameter("password");
        return new Snapshot(
                request.getMethod(),
                request.getRequestURI(),
                blankToNull(request.getQueryString()),
                blankToNull(request.getParameter("tenant")),
                blankToNull(request.getParameter("email")),
                blankToNull(request.getParameter("username")),
                password != null && !password.isBlank(),
                password != null ? password.length() : 0,
                firstNonBlank(request.getParameter("applicationId"), request.getHeader("X-Application-Id")),
                blankToNull(request.getHeader("User-Agent")),
                blankToNull(request.getHeader("Referer")),
                request.getRemoteAddr(),
                blankToNull(request.getHeader("X-Forwarded-For")),
                blankToNull(request.getContentType()));
    }

    public static String classify(AuthenticationException exception, Snapshot snapshot) {
        if (exception instanceof CredentialsExpiredException) {
            return "password_expired";
        }
        if (exception instanceof DisabledException) {
            return "auth_method_disabled";
        }
        if (exception instanceof UsernameNotFoundException unfe) {
            String message = unfe.getMessage() != null ? unfe.getMessage().toLowerCase(Locale.ROOT) : "";
            if (message.contains("not verified")) {
                return "email_not_verified";
            }
            if (message.contains("not active")) {
                return "account_inactive";
            }
            if (message.contains("unknown tenant")) {
                return "unknown_tenant";
            }
            return "user_not_found";
        }
        if (exception instanceof BadCredentialsException bce) {
            String message = bce.getMessage() != null ? bce.getMessage().toLowerCase(Locale.ROOT) : "";
            if (snapshot.usernameField() == null || snapshot.usernameField().isBlank()) {
                if (snapshot.tenantField() != null
                        && snapshot.emailField() != null
                        && !snapshot.tenantField().isBlank()
                        && !snapshot.emailField().isBlank()) {
                    return "username_not_built";
                }
                return "missing_username";
            }
            if (message.contains("no password")) {
                return "no_password";
            }
            if (message.contains("does not match")) {
                return "password_mismatch";
            }
            return "invalid_credentials";
        }
        return "unknown";
    }

    public static void applyMdc(Snapshot snapshot, String reasonCode, AuthenticationException exception) {
        put(RequestContext.HTTP_METHOD, snapshot.httpMethod());
        put(RequestContext.REQUEST_PATH, snapshot.requestUri());
        put(RequestContext.QUERY_STRING, snapshot.queryString());
        put(RequestContext.USER_AGENT, snapshot.userAgent());
        put(RequestContext.REFERER, snapshot.referer());
        put(RequestContext.FORWARDED_FOR, snapshot.forwardedFor());
        put(RequestContext.LOGIN_FAILURE_REASON, reasonCode);
        put(RequestContext.LOGIN_FAILURE_DETAIL, exception.getMessage());
        put(RequestContext.LOGIN_TENANT, snapshot.tenantField());
        put(RequestContext.LOGIN_EMAIL, snapshot.emailField());
        put(RequestContext.LOGIN_USERNAME, snapshot.usernameField());
        put(RequestContext.PASSWORD_PRESENT, Boolean.toString(snapshot.passwordPresent()));
        put(RequestContext.PASSWORD_LENGTH, Integer.toString(snapshot.passwordLength()));
        if (snapshot.applicationId() != null) {
            put(RequestContext.APPLICATION_ID, snapshot.applicationId());
        }
        if (snapshot.contentType() != null) {
            put(RequestContext.CONTENT_TYPE, snapshot.contentType());
        }
    }

    public static Map<String, Object> toMetadata(Snapshot snapshot, String reasonCode, AuthenticationException exception) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("event", "form_login_failure");
        metadata.put("failureReason", reasonCode);
        metadata.put("failureDetail", exception.getMessage());
        metadata.put("exceptionType", exception.getClass().getSimpleName());

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("method", snapshot.httpMethod());
        request.put("path", snapshot.requestUri());
        if (snapshot.queryString() != null) {
            request.put("query", snapshot.queryString());
        }
        if (snapshot.contentType() != null) {
            request.put("contentType", snapshot.contentType());
        }
        metadata.put("request", request);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("tenant", snapshot.tenantField());
        payload.put("email", snapshot.emailField());
        payload.put("username", snapshot.usernameField());
        payload.put("passwordPresent", snapshot.passwordPresent());
        payload.put("passwordLength", snapshot.passwordLength());
        if (snapshot.applicationId() != null) {
            payload.put("applicationId", snapshot.applicationId());
        }
        metadata.put("payload", payload);

        Map<String, Object> client = new LinkedHashMap<>();
        client.put("ip", snapshot.remoteAddr());
        if (snapshot.forwardedFor() != null) {
            client.put("forwardedFor", snapshot.forwardedFor());
        }
        if (snapshot.userAgent() != null) {
            client.put("userAgent", snapshot.userAgent());
        }
        if (snapshot.referer() != null) {
            client.put("referer", snapshot.referer());
        }
        metadata.put("client", client);
        return metadata;
    }

    public static String formatLogLine(Snapshot snapshot, String reasonCode, AuthenticationException exception) {
        return "reason="
                + reasonCode
                + " detail="
                + exception.getMessage()
                + " method="
                + snapshot.httpMethod()
                + " path="
                + snapshot.requestUri()
                + " tenant="
                + nullSafe(snapshot.tenantField())
                + " email="
                + nullSafe(snapshot.emailField())
                + " username="
                + nullSafe(snapshot.usernameField())
                + " passwordPresent="
                + snapshot.passwordPresent()
                + " passwordLength="
                + snapshot.passwordLength()
                + " applicationId="
                + nullSafe(snapshot.applicationId())
                + " ip="
                + nullSafe(snapshot.remoteAddr())
                + " userAgent="
                + truncate(nullSafe(snapshot.userAgent()), 120);
    }

    private static void put(String key, String value) {
        if (value != null && !value.isBlank()) {
            MDC.put(key, truncate(value, 512));
        }
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private static String nullSafe(String value) {
        return value != null ? value : "—";
    }

    private static String truncate(String value, int max) {
        return value.length() <= max ? value : value.substring(0, max) + "…";
    }
}
