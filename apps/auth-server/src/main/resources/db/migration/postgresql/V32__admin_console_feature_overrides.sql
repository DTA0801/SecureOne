-- Per-user grant/deny overrides for admin console features (beyond role defaults).
CREATE TABLE admin_console_feature_override (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    tenant_id   UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    feature_key VARCHAR(64) NOT NULL,
    effect      VARCHAR(8) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT admin_console_feature_override_effect_chk CHECK (effect IN ('GRANT', 'DENY')),
    CONSTRAINT uq_admin_console_feature_override UNIQUE (user_id, tenant_id, feature_key)
);

CREATE INDEX idx_admin_console_feature_override_user ON admin_console_feature_override(user_id);
CREATE INDEX idx_admin_console_feature_override_tenant ON admin_console_feature_override(tenant_id);
