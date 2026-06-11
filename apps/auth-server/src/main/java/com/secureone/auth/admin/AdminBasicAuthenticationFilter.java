package com.secureone.auth.admin;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * HTTP Basic uses the first {@code :} as the username/password delimiter. Tenant operators use
 * {@code tenantSlug:email}, which breaks default parsing. For admin API routes, split on the last
 * {@code :} when multiple delimiters are present.
 */
@Component
public class AdminBasicAuthenticationFilter extends OncePerRequestFilter {

    private final AuthenticationManager authenticationManager;

    public AdminBasicAuthenticationFilter(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!request.getRequestURI().startsWith("/api/admin/v1/")) {
            filterChain.doFilter(request, response);
            return;
        }
        Authentication existing = SecurityContextHolder.getContext().getAuthentication();
        if (existing != null
                && existing.isAuthenticated()
                && !(existing instanceof AnonymousAuthenticationToken)) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        if (header != null && header.regionMatches(true, 0, "Basic ", 0, 6)) {
            String token = header.substring(6).trim();
            try {
                String decoded = new String(Base64.getDecoder().decode(token), StandardCharsets.UTF_8);
                int first = decoded.indexOf(':');
                int last = decoded.lastIndexOf(':');
                if (first > 0 && last > first) {
                    String username = decoded.substring(0, last);
                    String password = decoded.substring(last + 1);
                    Authentication auth =
                            authenticationManager.authenticate(
                                    new UsernamePasswordAuthenticationToken(username, password));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (RuntimeException ignored) {
                // Fall through to default HTTP Basic handling.
            }
        }

        filterChain.doFilter(request, response);
    }
}
