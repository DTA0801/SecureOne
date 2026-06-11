-- Each user must have at most one current password credential.
UPDATE user_credential stale
SET is_current = false
WHERE stale.is_current = true
  AND stale.id NOT IN (
      SELECT DISTINCT ON (user_id) id
      FROM user_credential
      WHERE is_current = true
      ORDER BY user_id, created_at DESC, id DESC
  );

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_credential_one_current
    ON user_credential (user_id)
    WHERE is_current = true;
