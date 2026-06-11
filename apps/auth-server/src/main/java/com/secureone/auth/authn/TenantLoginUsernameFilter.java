package com.secureone.auth.authn;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Builds {@code tenant:email} usernames for the hosted login form when the hidden username field is
 * missing (password managers, script errors, or Enter-key submit races).
 */
public class TenantLoginUsernameFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (isLoginPost(request)) {
            String username = normalize(request.getParameter("username"));
            if (username == null) {
                String tenant = normalize(request.getParameter("tenant"));
                String email = normalize(request.getParameter("email"));
                if (tenant != null && email != null) {
                    request = new UsernameOverrideRequest(request, tenant + ":" + email.toLowerCase(Locale.ROOT));
                }
            }
        }
        filterChain.doFilter(request, response);
    }

    private static boolean isLoginPost(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod())
                && "/login".equals(request.getRequestURI());
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static final class UsernameOverrideRequest extends HttpServletRequestWrapper {

        private final Map<String, String[]> params;

        UsernameOverrideRequest(HttpServletRequest request, String username) {
            super(request);
            Map<String, String[]> merged = new HashMap<>(request.getParameterMap());
            merged.put("username", new String[] {username});
            params = Collections.unmodifiableMap(merged);
        }

        @Override
        public String getParameter(String name) {
            String[] values = params.get(name);
            if (values == null || values.length == 0) {
                return null;
            }
            return values[0];
        }

        @Override
        public Map<String, String[]> getParameterMap() {
            return params;
        }

        @Override
        public Enumeration<String> getParameterNames() {
            return Collections.enumeration(params.keySet());
        }

        @Override
        public String[] getParameterValues(String name) {
            return params.get(name);
        }
    }
}
