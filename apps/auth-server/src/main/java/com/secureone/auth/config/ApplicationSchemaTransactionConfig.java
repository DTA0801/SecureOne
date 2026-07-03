package com.secureone.auth.config;

import com.secureone.auth.application.ApplicationSchemaJpaTransactionManager;
import com.secureone.auth.application.ApplicationSchemaService;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
public class ApplicationSchemaTransactionConfig {

    @Bean
    @Primary
    public PlatformTransactionManager transactionManager(
            EntityManagerFactory entityManagerFactory, ApplicationSchemaService schemaService) {
        return new ApplicationSchemaJpaTransactionManager(entityManagerFactory, schemaService);
    }
}
