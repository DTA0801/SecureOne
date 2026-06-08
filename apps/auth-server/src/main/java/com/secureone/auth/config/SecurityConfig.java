package com.secureone.auth.config;

import com.secureone.auth.authn.DevAdminAuthenticationProvider;
import com.secureone.auth.authn.LoginSuccessHandler;
import com.secureone.auth.authn.TenantPasswordAuthenticationProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.oauth2.server.authorization.OAuth2AuthorizationServerConfigurer;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.util.matcher.MediaTypeRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

/**
 * Security wiring for the authorization server.
 *
 * <p>Two ordered filter chains:
 * <ol>
 *   <li>The OAuth2/OIDC protocol endpoints (authorize, token, jwks, discovery, ...) — matched by
 *       the authorization-server endpoints matcher, with OIDC enabled, and protected as a resource
 *       server (JWT) for OIDC UserInfo / Client Registration.</li>
 *   <li>The default application chain governing everything else, with form login.</li>
 * </ol>
 */
@Configuration
public class SecurityConfig {

    @Bean
    @Order(1)
    SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
        OAuth2AuthorizationServerConfigurer authorizationServer =
                new OAuth2AuthorizationServerConfigurer();
        RequestMatcher endpointsMatcher = authorizationServer.getEndpointsMatcher();

        http
                .securityMatcher(endpointsMatcher)
                .with(authorizationServer, server -> server.oidc(Customizer.withDefaults()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/oauth2/token", "/oauth2/revoke", "/oauth2/introspect")
                        .permitAll()
                        .anyRequest().authenticated())
                .csrf(csrf -> csrf.ignoringRequestMatchers(endpointsMatcher))
                // Redirect browser (text/html) requests to the login page when unauthenticated.
                .exceptionHandling(ex -> ex
                        .defaultAuthenticationEntryPointFor(
                                new LoginUrlAuthenticationEntryPoint("/login"),
                                new MediaTypeRequestMatcher(MediaType.TEXT_HTML)))
                // Accept access tokens for OIDC UserInfo and/or Client Registration.
                .oauth2ResourceServer(rs -> rs.jwt(Customizer.withDefaults()));
        return http.build();
    }

    @Bean
    AuthenticationManager authenticationManager(
            DevAdminAuthenticationProvider devAdminProvider,
            TenantPasswordAuthenticationProvider tenantPasswordProvider) {
        return new ProviderManager(devAdminProvider, tenantPasswordProvider);
    }

    @Bean
    @Order(2)
    SecurityFilterChain defaultSecurityFilterChain(
            HttpSecurity http,
            AuthenticationManager authenticationManager,
            LoginSuccessHandler loginSuccessHandler)
            throws Exception {
        http
                .cors(Customizer.withDefaults())
                .authenticationManager(authenticationManager)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**")
                        .permitAll()
                        .requestMatchers(
                                "/actuator/health/**",
                                "/actuator/info",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/docs",
                                "/docs/**",
                                "/api/info",
                                "/api/v1/account/**",
                                "/api/v1/auth/**",
                                "/api/v1/applications/**",
                                "/account/**",
                                "/login",
                                "/login.html")
                        .permitAll()
                        .requestMatchers("/api/admin/v1/**").authenticated()
                        .anyRequest().authenticated())
                .csrf(csrf -> csrf.ignoringRequestMatchers(
                        "/api/admin/v1/**",
                        "/api/v1/account/**",
                        "/api/v1/auth/**",
                        "/api/v1/applications/**",
                        "/login"))
                .httpBasic(Customizer.withDefaults())
                .formLogin(form -> form
                        .loginPage("/login.html")
                        .loginProcessingUrl("/login")
                        .successHandler(loginSuccessHandler)
                        .permitAll());
        return http.build();
    }
}
