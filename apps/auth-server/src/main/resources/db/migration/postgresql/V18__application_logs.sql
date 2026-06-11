-- Centralized application logs (CloudWatch-style) with session/request correlation.

CREATE TABLE application_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    level           VARCHAR(16) NOT NULL,
    logger          VARCHAR(256) NOT NULL,
    message         TEXT NOT NULL,
    session_id      VARCHAR(128),
    request_id      VARCHAR(64),
    principal       VARCHAR(320),
    tenant_id       UUID,
    application_id  UUID,
    ip              VARCHAR(64),
    user_agent      VARCHAR(512),
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_application_log_created_at ON application_log (created_at DESC);
CREATE INDEX idx_application_log_session_id ON application_log (session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_application_log_request_id ON application_log (request_id) WHERE request_id IS NOT NULL;
CREATE INDEX idx_application_log_level ON application_log (level);
CREATE INDEX idx_application_log_app_created ON application_log (application_id, created_at DESC)
    WHERE application_id IS NOT NULL;

ALTER TABLE login_history ADD COLUMN IF NOT EXISTS session_id VARCHAR(128);
CREATE INDEX IF NOT EXISTS idx_login_history_session_id ON login_history (session_id)
    WHERE session_id IS NOT NULL;

-- Permission for log viewer (seed for existing apps).
INSERT INTO permission (id, application_id, key, description)
SELECT gen_random_uuid(), a.id, 'logs:read', 'View application logs'
FROM application a
WHERE NOT EXISTS (
    SELECT 1 FROM permission p WHERE p.application_id = a.id AND p.key = 'logs:read'
);

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.application_id = r.application_id AND p.key = 'logs:read'
WHERE r.name IN ('Super Admin', 'Tenant Admin', 'Security Auditor')
  AND NOT EXISTS (
      SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
