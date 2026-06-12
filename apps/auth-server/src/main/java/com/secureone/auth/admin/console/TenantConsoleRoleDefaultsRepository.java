package com.secureone.auth.admin.console;

import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TenantConsoleRoleDefaultsRepository {

    private final JdbcTemplate jdbc;

    public TenantConsoleRoleDefaultsRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<String> findFeatureKeys(UUID tenantId, String roleKey) {
        return jdbc.queryForList(
                """
                SELECT feature_key
                FROM tenant_console_role_feature
                WHERE tenant_id = ? AND role_key = ?
                ORDER BY feature_key
                """,
                String.class,
                tenantId,
                roleKey);
    }

    public boolean hasDefaults(UUID tenantId, String roleKey) {
        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM tenant_console_role_feature WHERE tenant_id = ? AND role_key = ?",
                Long.class,
                tenantId,
                roleKey);
        return count != null && count > 0;
    }

    public void replaceFeatures(UUID tenantId, String roleKey, List<String> featureKeys) {
        jdbc.update(
                "DELETE FROM tenant_console_role_feature WHERE tenant_id = ? AND role_key = ?",
                tenantId,
                roleKey);
        for (String featureKey : featureKeys) {
            if (featureKey == null || featureKey.isBlank()) {
                continue;
            }
            jdbc.update(
                    """
                    INSERT INTO tenant_console_role_feature (tenant_id, role_key, feature_key)
                    VALUES (?, ?, ?)
                    """,
                    tenantId,
                    roleKey,
                    featureKey.trim().toLowerCase());
        }
    }
}
