-- Scope audit and login history to applications; index for app-scoped admin console.

ALTER TABLE audit_log
    ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES application(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_audit_application_created ON audit_log(application_id, created_at DESC);

ALTER TABLE login_history
    ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES application(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_login_history_application_created ON login_history(application_id, created_at DESC);

UPDATE audit_log
SET application_id = '22222222-2222-2222-2222-222222222201'
WHERE tenant_id = '11111111-1111-1111-1111-111111111101' AND application_id IS NULL;

UPDATE login_history
SET application_id = '22222222-2222-2222-2222-222222222201'
WHERE tenant_id = '11111111-1111-1111-1111-111111111101' AND application_id IS NULL;
