-- Dev-only: password for seeded users (SecureOne123!) — use forgot-password in prod-like envs.
INSERT INTO user_credential (user_id, password_hash, algorithm, is_current)
SELECT u.id, '$2a$10$l4rw.ZW0bub9AMUDZp5BoOeblXp6zfo7fohXX2Ws5/jLeIlj1hmwS', 'bcrypt', true
FROM user_account u
WHERE u.email IN ('sarah.chen@acme.com', 'yuki.tanaka@globex.com')
  AND NOT EXISTS (
      SELECT 1 FROM user_credential c WHERE c.user_id = u.id AND c.is_current = true
  );
