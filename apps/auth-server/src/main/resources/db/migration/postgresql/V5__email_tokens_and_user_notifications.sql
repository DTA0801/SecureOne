-- Transactional email tokens (verify email, reset password).

CREATE TABLE email_token (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    type        VARCHAR(32) NOT NULL,
    token_hash  VARCHAR(64) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_token_user_type ON email_token(user_id, type);
CREATE INDEX idx_email_token_hash ON email_token(token_hash);

-- Enable user-facing transactional email by default (admin alerts remain separate).
UPDATE platform_setting
SET value = value || '{"userEmailEnabled": true}'::jsonb
WHERE key = 'notifications'
  AND NOT (value ? 'userEmailEnabled');
