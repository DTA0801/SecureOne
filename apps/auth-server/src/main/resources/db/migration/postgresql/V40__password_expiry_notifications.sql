-- Track password expiry warning and expired-reset emails per credential row.

ALTER TABLE user_credential
    ADD COLUMN IF NOT EXISTS expiry_warning_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS expiry_expired_notice_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_credential_expires_at
    ON user_credential (expires_at)
    WHERE is_current = true AND expires_at IS NOT NULL;
