-- Per-tenant default console sections for system console operator roles.

CREATE TABLE tenant_console_role_feature (
    tenant_id   UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    role_key    VARCHAR(80) NOT NULL,
    feature_key VARCHAR(80) NOT NULL,
    PRIMARY KEY (tenant_id, role_key, feature_key)
);
CREATE INDEX idx_tenant_console_role_feature_tenant ON tenant_console_role_feature(tenant_id);
