package com.secureone.auth.authn;

import com.secureone.auth.platform.AuthSettingsService;
import com.secureone.auth.user.UserAccount;
import com.secureone.auth.user.UserCredentialRepository;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class TenantPasswordAuthenticationProvider implements AuthenticationProvider {

    private final TenantUserDetailsService userDetailsService;
    private final UserCredentialRepository credentials;
    private final PasswordEncoder passwordEncoder;
    private final AuthSettingsService authSettings;

    public TenantPasswordAuthenticationProvider(
            TenantUserDetailsService userDetailsService,
            UserCredentialRepository credentials,
            PasswordEncoder passwordEncoder,
            AuthSettingsService authSettings) {
        this.userDetailsService = userDetailsService;
        this.credentials = credentials;
        this.passwordEncoder = passwordEncoder;
        this.authSettings = authSettings;
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        if (!authSettings.isAuthMethodEnabled("m_password")) {
            throw new DisabledException("Password login is disabled in platform settings.");
        }
        if (!authSettings.isAuthMethodImplemented("m_password")) {
            throw new DisabledException("Password login is not available.");
        }
        String username = authentication.getName();
        if (username == null || !username.contains(":")) {
            return null;
        }
        String password = authentication.getCredentials().toString();
        UserDetails user = userDetailsService.loadUserByUsername(username);
        int sep = username.indexOf(':');
        String tenantSlug = username.substring(0, sep);
        String email = username.substring(sep + 1);
        UserAccount account = userDetailsService.resolveAccount(tenantSlug, email);
        var cred = credentials
                .findByUserIdAndCurrentTrue(account.getId())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (!passwordEncoder.matches(password, cred.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        return new UsernamePasswordAuthenticationToken(user, password, user.getAuthorities());
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
