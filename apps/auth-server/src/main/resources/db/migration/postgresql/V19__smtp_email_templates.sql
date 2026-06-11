-- Platform SMTP transport, email templates, and recipient groups (managed via admin UI).

INSERT INTO platform_setting (key, value)
VALUES
    ('smtp', '{
      "host": "",
      "port": 465,
      "security": "ssl",
      "username": "",
      "authEnabled": true
    }'::jsonb),
    ('email_templates', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;

UPDATE platform_setting
SET value = value || '{
  "recipientGroups": {
    "security": [],
    "operations": []
  }
}'::jsonb
WHERE key = 'notifications'
  AND NOT (value ? 'recipientGroups');
