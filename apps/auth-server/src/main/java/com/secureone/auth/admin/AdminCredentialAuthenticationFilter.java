package com.secureone.auth.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Admin console auth via {@code Authorization: SecureOne-Admin <base64(json)>} so tenant operators
 * can use {@code tenantSlug:email} usernames without HTTP Basic colon ambiguity.
 */
@Component
public class AdminCredentialAuthenticationFilter extends OncePerRequestFilter {

    public static final String SCHEME = "SecureOne-Admin";

    private final AuthenticationManager authenticationManager;
    private final ObjectMapper objectMapper;

    public AdminCredentialAuthenticationFilter(
            AuthenticationManager authenticationManager, ObjectMapper objectMapper) {
        this.authenticationManager = authenticationManager;
        this.objectMapper = objectMapper;
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
        if (header != null && header.regionMatches(true, 0, SCHEME + " ", 0, SCHEME.length() + 1)) {
            String token = header.substring(SCHEME.length() + 1).trim();
            try {
                String json = new String(Base64.getDecoder().decode(token), StandardCharsets.UTF_8);
                JsonNode node = objectMapper.readTree(json);
                String username = node.path("username").asText(null);
                String password = node.path("password").asText(null);
                if (username != null && password != null) {
                    Authentication auth = authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(username, password));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (org.springframework.security.core.AuthenticationException ignored) {
                SecurityContextHolder.clearContext();
            } catch (RuntimeException ignored) {
                // Malformed token — fall through to HTTP Basic handling.
            }
        }

        filterChain.doFilter(request, response);
    }
}
