package com.secureone.auth.config;

import com.secureone.auth.authn.OAuthLoginRedirectSupport;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.savedrequest.RequestCache;

@Configuration
public class WebSecurityBeans {

    @Bean
    RequestCache requestCache() {
        return OAuthLoginRedirectSupport.requestCache();
    }

    @Bean
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }
}
