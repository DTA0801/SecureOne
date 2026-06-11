-- Restore dev tenant admin for admin console login (idempotent).

INSERT INTO user_account (tenant_id, email, email_verified, username, display_name, status, type, created_at, updated_at)
SELECT t.id, 'sarah.chen@acme.com', true, 'schen', 'Sarah Chen', 'ACTIVE', 'USER', now(), now()
FROM tenant t
WHERE t.slug = 'acme'
  AND NOT EXISTS (
      SELECT 1 FROM user_account u
      WHERE u.tenant_id = t.id AND u.email = 'sarah.chen@acme.com'
  );

INSERT INTO user_credential (user_id, password_hash, algorithm, is_current)
SELECT u.id, '$2a$10$l4rw.ZW0bub9AMUDZp5BoOeblXp6zfo7fohXX2Ws5/jLeIlj1hmwS', 'bcrypt', true
FROM user_account u
JOIN tenant t ON t.id = u.tenant_id
WHERE t.slug = 'acme' AND u.email = 'sarah.chen@acme.com'
  AND NOT EXISTS (
      SELECT 1 FROM user_credential c WHERE c.user_id = u.id AND c.is_current = true
  );

INSERT INTO user_role (user_id, role_id, granted_at)
SELECT u.id, '44444444-4444-4444-4444-444444444402', now()
FROM user_account u
JOIN tenant t ON t.id = u.tenant_id
WHERE t.slug = 'acme' AND u.email = 'sarah.chen@acme.com'
  AND NOT EXISTS (
      SELECT 1 FROM user_role ur
      WHERE ur.user_id = u.id AND ur.role_id = '44444444-4444-4444-4444-444444444402'
  );
