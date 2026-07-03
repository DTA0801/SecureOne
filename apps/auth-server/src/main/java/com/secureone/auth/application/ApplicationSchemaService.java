package com.secureone.auth.application;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ApplicationSchemaService {

    private final ApplicationRepository applications;
    private final JdbcTemplate jdbc;

    public ApplicationSchemaService(ApplicationRepository applications, JdbcTemplate jdbc) {
        this.applications = applications;
        this.jdbc = jdbc;
    }

    /** Called from {@link ApplicationSchemaJpaTransactionManager#doBegin} on every DB transaction. */
    public void applySearchPathForContext() {
        UUID applicationId = ApplicationSchemaContext.getApplicationId();
        if (applicationId == null) {
            applyPlatformSearchPath();
            return;
        }
        Application app = applications.findById(applicationId).orElse(null);
        applySearchPathForApplication(app);
    }

    public void applySearchPathForApplicationId(UUID applicationId) {
        if (applicationId == null) {
            applyPlatformSearchPath();
            return;
        }
        Application app = applications.findById(applicationId).orElse(null);
        applySearchPathForApplication(app);
    }

    public void applySearchPathForApplication(Application app) {
        if (app == null || app.getSchemaName() == null || app.getSchemaName().isBlank()) {
            applyPlatformSearchPath();
            return;
        }
        jdbc.execute(
                "SET LOCAL search_path TO " + quoteIdent(app.getSchemaName()) + ", "
                        + quoteIdent(ApplicationSchemaNames.PLATFORM_SCHEMA));
    }

    public void applyPlatformSearchPath() {
        jdbc.execute("SET LOCAL search_path TO " + quoteIdent(ApplicationSchemaNames.PLATFORM_SCHEMA));
    }

    private static String quoteIdent(String ident) {
        return "\"" + ident.replace("\"", "\"\"") + "\"";
    }
}
