-- Platform notifications are operator alerts only (separate from application notification settings).

UPDATE platform_setting
SET value = (value - 'userEmailEnabled' - 'pushEnabled' - 'recipientGroups')
WHERE key = 'notifications';
