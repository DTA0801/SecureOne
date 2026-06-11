-- Track how users were added to the tenant roster.

ALTER TABLE tenant_user_roster
    ADD COLUMN source VARCHAR(32) NOT NULL DEFAULT 'direct',
    ADD COLUMN source_application_id UUID REFERENCES application(id) ON DELETE SET NULL,
    ADD COLUMN added_by UUID REFERENCES user_account(id) ON DELETE SET NULL;

UPDATE tenant_user_roster r
SET source = 'console_access'
WHERE EXISTS (
    SELECT 1
    FROM admin_console_access a
    WHERE a.tenant_id = r.tenant_id
      AND a.user_id = r.user_id
      AND (a.expires_at IS NULL OR a.expires_at > now())
);

CREATE INDEX idx_tenant_user_roster_source ON tenant_user_roster(tenant_id, source);
