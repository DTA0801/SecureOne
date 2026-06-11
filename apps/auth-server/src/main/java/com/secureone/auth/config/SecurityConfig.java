package com.secureone.auth.config;

import com.secureone.auth.admin.AdminBasicAuthenticationFilter;
import com.secureone.auth.admin.AdminCredentialAuthenticationFilter;
import com.secureone.auth.authn.DevAdminAuthenticationProvider;
import com.secureone.auth.authn.FormLoginFailureHandler;
import com.secureone.auth.authn.LoginSuccessHandler;
import com.secureone.auth.authn.OAuthAwareLoginEntryPoint;
import com.secureone.auth.authn.TenantLoginUsernameFilter;
import com.secureone.auth.authn.TenantPasswordAuthenticationProvider;
import java.util.function.Function;
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
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.authorization.oidc.authentication.OidcUserInfoAuthenticationContext;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.savedrequest.RequestCache;
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
 *   <li>Stateless Bearer-token APIs for integrated apps ({@code /api/v1/account/profile}, password change).</li>
 *   <li>The default application chain governing everything else, with form login.</li>
 * </ol>
 */
@Configuration
public class SecurityConfig {

    @Bean
    @Order(1)
    SecurityFilterChain authorizationServerSecurityFilterChain(
            HttpSecurity http,
            JwtDecoder jwtDecoder,
            RequestCache requestCache,
            Function<OidcUserInfoAuthenticationContext, OidcUserInfo> oidcUserInfoMapper)
            throws Exception {
        OAuth2AuthorizationServerConfigurer authorizationServer =
                new OAuth2AuthorizationServerConfigurer();
        RequestMatcher endpointsMatcher = authorizationServer.getEndpointsMatcher();

        http
                .securityMatcher(endpointsMatcher)
                .cors(Customizer.withDefaults())
                .requestCache(cache -> cache.requestCache(requestCache))
                .sessionManagement(session -> session.sessionFixation(fix -> fix.migrateSession()))
                .with(authorizationServer, server -> server.oidc(oidc -> oidc.userInfoEndpoint(
                        userInfo -> userInfo.userInfoMapper(oidcUserInfoMapper))))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/oauth2/token", "/oauth2/revoke", "/oauth2/introspect")
                        .permitAll()
                        .anyRequest().authenticated())
                .csrf(csrf -> csrf.ignoringRequestMatchers(endpointsMatcher))
                // Redirect browser (text/html) requests to the login page when unauthenticated.
                .exceptionHandling(ex -> ex
                        .defaultAuthenticationEntryPointFor(
                                new OAuthAwareLoginEntryPoint(requestCache),
                                new MediaTypeRequestMatcher(MediaType.TEXT_HTML)))
                // Accept access tokens for OIDC UserInfo and/or Client Registration.
                .oauth2ResourceServer(rs -> rs.jwt(jwt -> jwt.decoder(jwtDecoder)));
        return http.build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain bearerApiSecurityFilterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
        http
                .securityMatcher("/api/v1/account/profile", "/api/v1/account/password/change")
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .oauth2ResourceServer(rs -> rs.jwt(jwt -> jwt.decoder(jwtDecoder)));
        return http.build();
    }

    @Bean
    AuthenticationManager authenticationManager(
            DevAdminAuthenticationProvider devAdminProvider,
            TenantPasswordAuthenticationProvider tenantPasswordProvider) {
        return new ProviderManager(devAdminProvider, tenantPasswordProvider);
    }

    @Bean
    @Order(3)
    SecurityFilterChain defaultSecurityFilterChain(
            HttpSecurity http,
            RequestCache requestCache,
            AuthenticationManager authenticationManager,
            AdminBasicAuthenticationFilter adminBasicAuthenticationFilter,
            AdminCredentialAuthenticationFilter adminCredentialAuthenticationFilter,
            LoginSuccessHandler loginSuccessHandler,
            FormLoginFailureHandler loginFailureHandler)
            throws Exception {
        http
                .cors(Customizer.withDefaults())
                .requestCache(cache -> cache.requestCache(requestCache))
                .sessionManagement(session -> session.sessionFixation(fix -> fix.migrateSession()))
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
                                "/api/v1/account/password/forgot",
                                "/api/v1/account/password/reset",
                                "/api/v1/account/set-password",
                                "/api/v1/account/email/**",
                                "/api/v1/account/magic-link/**",
                                "/api/v1/auth/methods",
                                "/api/v1/auth/session/login",
                                "/api/v1/applications/**",
                                "/account/**",
                                "/login",
                                "/login.html")
                        .permitAll()
                        .requestMatchers("/api/admin/v1/auth/login").permitAll()
                        .requestMatchers("/api/admin/v1/**").authenticated()
                        .anyRequest().authenticated())
                .csrf(csrf -> csrf.ignoringRequestMatchers(
                        "/api/admin/v1/**",
                        "/api/v1/account/**",
                        "/api/v1/auth/methods",
                        "/api/v1/auth/me",
                        "/api/v1/auth/session/login",
                        "/api/v1/applications/**",
                        "/login"))
                .httpBasic(Customizer.withDefaults())
                .addFilterBefore(adminCredentialAuthenticationFilter, BasicAuthenticationFilter.class)
                .addFilterBefore(adminBasicAuthenticationFilter, BasicAuthenticationFilter.class)
                .addFilterBefore(new TenantLoginUsernameFilter(), UsernamePasswordAuthenticationFilter.class)
                .formLogin(form -> form
                        .loginPage("/login.html")
                        .loginProcessingUrl("/login")
                        .failureHandler(loginFailureHandler)
                        .successHandler(loginSuccessHandler)
                        .permitAll());
        return http.build();
    }
}
