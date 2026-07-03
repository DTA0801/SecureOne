package com.secureone.auth.application;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.TransactionDefinition;

/**
 * Binds PostgreSQL {@code search_path} at transaction begin using {@link ApplicationSchemaContext},
 * so {@code SET LOCAL} applies to the same connection JPA uses for the request.
 */
public class ApplicationSchemaJpaTransactionManager extends JpaTransactionManager {

    private final ApplicationSchemaService schemaService;

    public ApplicationSchemaJpaTransactionManager(
            EntityManagerFactory entityManagerFactory, ApplicationSchemaService schemaService) {
        super(entityManagerFactory);
        this.schemaService = schemaService;
    }

    @Override
    protected void doBegin(Object transaction, TransactionDefinition definition) {
        super.doBegin(transaction, definition);
        schemaService.applySearchPathForContext();
    }
}
