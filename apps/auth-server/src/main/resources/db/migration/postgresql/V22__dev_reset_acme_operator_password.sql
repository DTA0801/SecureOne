-- Dev-only: restore known password (SecureOne123!) for the original Acme seeded operator
-- when the account email was changed (e.g. tyagidav97@gmail.com) and password no longer matches docs.

UPDATE user_credential c
SET password_hash = '$2a$10$l4rw.ZW0bub9AMUDZp5BoOeblXp6zfo7fohXX2Ws5/jLeIlj1hmwS',
    algorithm = 'bcrypt',
    is_current = true
FROM user_account u
JOIN tenant t ON t.id = u.tenant_id
WHERE c.user_id = u.id
  AND c.is_current = true
  AND t.slug = 'acme'
  AND u.email = 'tyagidav97@gmail.com';

INSERT INTO user_credential (user_id, password_hash, algorithm, is_current)
SELECT u.id, '$2a$10$l4rw.ZW0bub9AMUDZp5BoOeblXp6zfo7fohXX2Ws5/jLeIlj1hmwS', 'bcrypt', true
FROM user_account u
JOIN tenant t ON t.id = u.tenant_id
WHERE t.slug = 'acme'
  AND u.email = 'tyagidav97@gmail.com'
  AND NOT EXISTS (
      SELECT 1 FROM user_credential c WHERE c.user_id = u.id AND c.is_current = true
  );
