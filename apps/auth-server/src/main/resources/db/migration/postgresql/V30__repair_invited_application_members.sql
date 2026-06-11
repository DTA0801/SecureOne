-- Repair invited users stuck without application membership or active status.

UPDATE user_account u
SET status = 'ACTIVE', email_verified = true, updated_at = now()
WHERE u.status = 'PENDING'
  AND EXISTS (
      SELECT 1 FROM user_credential uc WHERE uc.user_id = u.id AND uc.is_current = true
  )
  AND EXISTS (
      SELECT 1 FROM email_token et
      WHERE et.user_id = u.id AND et.type = 'SET_PASSWORD' AND et.consumed_at IS NOT NULL
  );

INSERT INTO user_application (user_id, application_id)
SELECT u.id, (u.attributes->>'pendingInviteApplicationId')::uuid
FROM user_account u
WHERE u.attributes ? 'pendingInviteApplicationId'
  AND NOT EXISTS (
      SELECT 1 FROM user_application ua
      WHERE ua.user_id = u.id
        AND ua.application_id = (u.attributes->>'pendingInviteApplicationId')::uuid
  );

INSERT INTO user_application (user_id, application_id)
SELECT u.id, a.id
FROM user_account u
JOIN application a ON a.tenant_id = u.tenant_id
WHERE NOT EXISTS (SELECT 1 FROM user_application ua WHERE ua.user_id = u.id)
  AND EXISTS (SELECT 1 FROM user_credential uc WHERE uc.user_id = u.id AND uc.is_current = true)
  AND (SELECT COUNT(*) FROM application a2 WHERE a2.tenant_id = u.tenant_id) = 1
ON CONFLICT DO NOTHING;
