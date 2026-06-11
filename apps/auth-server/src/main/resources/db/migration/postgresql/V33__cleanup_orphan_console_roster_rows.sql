-- Remove tenant roster rows that were created for console access but no longer have active console access.
DELETE FROM tenant_user_roster tur
WHERE tur.source = 'console_access'
  AND NOT EXISTS (
    SELECT 1
    FROM admin_console_access aca
    WHERE aca.user_id = tur.user_id
      AND aca.tenant_id = tur.tenant_id
      AND (aca.expires_at IS NULL OR aca.expires_at > NOW())
  );
