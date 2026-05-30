-- Per-application user membership and settings overrides (fall back to platform defaults).

CREATE TABLE user_application (
    user_id        UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, application_id)
);
CREATE INDEX idx_user_application_app ON user_application(application_id);

CREATE TABLE application_setting (
    application_id UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    setting_key    VARCHAR(150) NOT NULL,
    value          JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (application_id, setting_key)
);

-- Link dev seed user to Acme Web Portal client.
INSERT INTO user_application (user_id, application_id)
SELECT '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201'
WHERE EXISTS (SELECT 1 FROM user_account WHERE id = '33333333-3333-3333-3333-333333333301')
  AND EXISTS (SELECT 1 FROM application WHERE id = '22222222-2222-2222-2222-222222222201')
ON CONFLICT DO NOTHING;
