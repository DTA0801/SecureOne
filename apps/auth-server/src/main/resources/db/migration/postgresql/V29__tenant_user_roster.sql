-- Tenant roster: operators explicitly manage these users at tenant scope.
-- Application invites, signups, and self-registration do not add rows here.

CREATE TABLE tenant_user_roster (
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    added_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX idx_tenant_user_roster_user ON tenant_user_roster(user_id);

-- Keep existing admin console operators visible in tenant workspace.
INSERT INTO tenant_user_roster (tenant_id, user_id)
SELECT DISTINCT tenant_id, user_id
FROM admin_console_access
ON CONFLICT DO NOTHING;
