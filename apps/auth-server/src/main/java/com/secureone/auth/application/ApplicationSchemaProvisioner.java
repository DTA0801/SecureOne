package com.secureone.auth.application;

import com.secureone.auth.admin.ConflictException;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationSchemaProvisioner {

    private static final String APP_DDL_RESOURCE = "db/migration/application-schema/V1__app_core.sql";

    private final JdbcTemplate jdbc;
    private final ApplicationSchemaRepository schemaRegistry;

    public ApplicationSchemaProvisioner(JdbcTemplate jdbc, ApplicationSchemaRepository schemaRegistry) {
        this.jdbc = jdbc;
        this.schemaRegistry = schemaRegistry;
    }

    @Transactional
    public String provision(UUID applicationId, String slug) {
        String schemaName = resolveUniqueSchemaName(slug);
        if (schemaExists(schemaName)) {
            throw new ConflictException("Database schema already exists: " + schemaName);
        }
        jdbc.execute("CREATE SCHEMA " + quoteIdent(schemaName));
        jdbc.execute("SET LOCAL search_path TO " + quoteIdent(schemaName));
        executeAppDdl();
        jdbc.execute("SET LOCAL search_path TO " + quoteIdent(ApplicationSchemaNames.PLATFORM_SCHEMA));

        ApplicationSchema record = new ApplicationSchema();
        record.setApplicationId(applicationId);
        record.setSchemaName(schemaName);
        record.setStatus("ACTIVE");
        record.setFlywayVersion("V1__app_core");
        record.setProvisionedAt(Instant.now());
        schemaRegistry.save(record);
        return schemaName;
    }

    private String resolveUniqueSchemaName(String slug) {
        String base = ApplicationSchemaNames.fromSlug(slug);
        String candidate = base;
        int suffix = 2;
        while (schemaExists(candidate) || schemaRegistry.existsBySchemaName(candidate)) {
            candidate = base + "_" + suffix++;
        }
        return candidate;
    }

    private boolean schemaExists(String schemaName) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = ?",
                Integer.class,
                schemaName);
        return count != null && count > 0;
    }

    private void executeAppDdl() {
        try {
            String ddl = new ClassPathResource(APP_DDL_RESOURCE)
                    .getContentAsString(StandardCharsets.UTF_8);
            String cleaned = ddl.replaceAll("(?m)^--.*$", "");
            for (String statement : cleaned.split(";")) {
                String trimmed = statement.trim();
                if (!trimmed.isEmpty()) {
                    jdbc.execute(trimmed);
                }
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load application schema DDL", ex);
        }
    }

    private static String quoteIdent(String ident) {
        return "\"" + ident.replace("\"", "\"\"") + "\"";
    }
}
