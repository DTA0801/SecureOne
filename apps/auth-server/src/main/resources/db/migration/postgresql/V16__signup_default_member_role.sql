-- Self-registration should assign the end-user Member role, not Tenant Admin.
UPDATE role
SET is_default = false
WHERE application_id = '22222222-2222-2222-2222-222222222201'
  AND name = 'Tenant Admin';

UPDATE role
SET is_default = true
WHERE application_id = '22222222-2222-2222-2222-222222222201'
  AND name = 'Member';
