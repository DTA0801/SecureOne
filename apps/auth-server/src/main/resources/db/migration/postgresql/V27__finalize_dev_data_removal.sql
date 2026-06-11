-- Final cleanup after V25/V26: remove orphan rows tied to deleted dev tenants.

DELETE FROM admin_console_access
WHERE user_id NOT IN (SELECT id FROM user_account)
   OR tenant_id NOT IN (SELECT id FROM tenant);

DELETE FROM user_role
WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM user_account);

DELETE FROM user_application
WHERE user_id NOT IN (SELECT id FROM user_account)
   OR application_id NOT IN (SELECT id FROM application);
