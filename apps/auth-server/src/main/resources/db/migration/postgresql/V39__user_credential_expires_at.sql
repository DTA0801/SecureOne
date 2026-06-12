-- Password expiry is stamped when the credential is created (from active policy at set time).

ALTER TABLE user_credential
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
