package com.secureone.auth.authn;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.FactorGrantedAuthority;

/** Adds authentication-factor metadata required for OIDC {@code auth_time} during token issuance. */
final class AuthenticationAuthorities {

    private AuthenticationAuthorities() {}

    static List<GrantedAuthority> withPasswordFactor(Collection<? extends GrantedAuthority> roles) {
        List<GrantedAuthority> authorities = new ArrayList<>(roles.size() + 1);
        authorities.addAll(roles);
        authorities.add(FactorGrantedAuthority.fromAuthority(FactorGrantedAuthority.PASSWORD_AUTHORITY));
        return List.copyOf(authorities);
    }
}
