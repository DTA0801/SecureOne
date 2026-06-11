package com.secureone.auth.admin;

import java.util.Locale;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/** Resolves the effective operator email for admin-plane authorization. */
@Component
public class AdminOperatorResolver {

    public String resolveEmail(Authentication authentication, String actAsEmail) {
        if (actAsEmail != null && !actAsEmail.isBlank()) {
            return actAsEmail.trim().toLowerCase(Locale.ROOT);
        }
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String principal = authentication.getName();
        if (principal == null || principal.isBlank()) {
            return null;
        }
        int sep = principal.indexOf(':');
        if (sep > 0) {
            return principal.substring(sep + 1).trim().toLowerCase(Locale.ROOT);
        }
        return null;
    }

    public String resolveTenantSlug(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String principal = authentication.getName();
        if (principal == null) {
            return null;
        }
        int sep = principal.indexOf(':');
        if (sep > 0) {
            return principal.substring(0, sep).trim().toLowerCase(Locale.ROOT);
        }
        return null;
    }

    public boolean isTenantUser(Authentication authentication) {
        return resolveTenantSlug(authentication) != null;
    }
}
