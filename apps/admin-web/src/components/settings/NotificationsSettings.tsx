"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { FieldRow, Input } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { AdminRecipientsPicker } from "@/components/settings/AdminRecipientsPicker";
import {
  loadAdminRecipientOptionsAction,
  loadNotificationsAction,
  saveNotificationsAction,
  type AdminRecipientOption,
  type RecipientUserOption,
} from "@/lib/actions/settings";
import { ensureApplicationPolicyScopes } from "@/lib/api/ensure-application-policy";
import type { EmailSettings, NotificationSettings } from "@/lib/api/settings";

export function NotificationsSettings({ applicationId }: { applicationId?: string }) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationSettings>({});
  const [email, setEmail] = useState<EmailSettings>({});
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [adminOptions, setAdminOptions] = useState<AdminRecipientOption[]>([]);
  const [allUsers, setAllUsers] = useState<RecipientUserOption[]>([]);
  const [testTo, setTestTo] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipAutoSave = useRef(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (applicationId) {
        try {
          await ensureApplicationPolicyScopes(applicationId, ["notifications", "email"]);
        } catch (e) {
          if (!cancelled) toast(e instanceof Error ? e.message : "Failed to prepare settings", "error");
        }
      }
      const recipientsPromise = applicationId
        ? Promise.resolve({
          adminOptions: [] as AdminRecipientOption[],
          allUsers: [] as RecipientUserOption[],
          error: undefined as string | undefined,
          })
        : loadAdminRecipientOptionsAction();
      const [{ notifications: n, email: e, error }, { adminOptions: admins, allUsers: users, error: optionsError }] =
        await Promise.all([loadNotificationsAction(applicationId), recipientsPromise]);
      if (cancelled) return;
      setNotifications(n);
      setEmail(e);
      setSelectedEmails((n.adminRecipients ?? []).map((x) => x.trim().toLowerCase()));
      setAdminOptions(admins);
      setAllUsers(users);
      if (error || optionsError) {
        const msg = [error, optionsError].filter(Boolean).join(" ");
        setMessage(msg);
        toast(msg, "error");
      }
      skipAutoSave.current = true;
      setLoaded(true);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [toast, applicationId]);

  const persist = useCallback(async () => {
    setSaving(true);
    const result = await saveNotificationsAction(
      {
        notifications: { ...notifications, adminRecipients: selectedEmails },
        email,
      },
      applicationId,
      applicationId ? { saveNotifications: true, saveEmail: true } : undefined,
    );
    if (result.ok) {
      toast("Settings saved", "success");
    } else {
      const msg = result.error ?? "Save failed";
      setMessage(msg);
      toast(msg, "error");
    }
    setSaving(false);
  }, [notifications, email, selectedEmails, toast, applicationId]);

  useEffect(() => {
    if (!loaded) return;
    if (skipAutoSave.current) {
      skipAutoSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persist();
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [notifications, email, selectedEmails, loaded, persist]);

  async function sendTest() {
    setMessage(null);
    try {
      const { sendTestEmailAction } = await import("@/lib/actions/settings");
      const result = await sendTestEmailAction(testTo);
      const msg = result.ok
        ? `Test email sent to ${testTo}. Check MailHog at http://localhost:8025 if using dev SMTP.`
        : (result.error ?? "Send failed");
      setMessage(msg);
      toast(msg, result.ok ? "success" : "error");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Send failed");
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <p className="rounded-lg bg-brand-muted px-3 py-2 text-sm text-brand">{message}</p>
      )}

      <Card padded={false}>
        <CardHeader
          title="Notification channels"
          description={
            notifications.smtpConfigured
              ? "SMTP is configured. Changes auto-save to the database."
              : "SMTP not detected — start MailHog (docker compose) or set SECUREONE_SMTP_HOST."
          }
        />
        <ul className={`divide-y divide-ui ${!loaded ? "pointer-events-none opacity-60" : ""}`}>
          <SettingRow
            label="Email notifications (admin)"
            hint="Platform alerts to admin recipients below"
            checked={!!notifications.emailEnabled}
            onChange={(v) => setNotifications({ ...notifications, emailEnabled: v })}
          />
          <SettingRow
            label="User email (transactional)"
            hint="Verify email, password reset, and password-changed messages to end users"
            checked={notifications.userEmailEnabled !== false}
            onChange={(v) => setNotifications({ ...notifications, userEmailEnabled: v })}
          />
          <SettingRow
            label="Push notifications"
            hint="Mobile / web push (coming soon)"
            checked={!!notifications.pushEnabled}
            onChange={(v) => setNotifications({ ...notifications, pushEnabled: v })}
          />
          <SettingRow
            label="Audit alerts"
            hint="Email on high-risk admin actions"
            checked={!!notifications.auditAlertsEnabled}
            onChange={(v) => setNotifications({ ...notifications, auditAlertsEnabled: v })}
          />
          <SettingRow
            label="Security alerts"
            hint="Failed logins, lockouts, MFA changes"
            checked={!!notifications.securityAlertsEnabled}
            onChange={(v) => setNotifications({ ...notifications, securityAlertsEnabled: v })}
          />
        </ul>
        <div className="space-y-4 border-t border-ui p-5">
          <FieldRow
            label="Admin recipients"
            hint="Expand to pick admin users or add any email"
          >
            <AdminRecipientsPicker
              adminOptions={adminOptions}
              allUsers={allUsers}
              selectedEmails={selectedEmails}
              onChange={setSelectedEmails}
              disabled={!loaded}
            />
          </FieldRow>
        </div>
      </Card>

      <Card padded={false}>
        <CardHeader title="Email sender" description="From address shown on outbound mail" />
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <FieldRow label="From name">
            <Input
              value={email.fromName ?? ""}
              onChange={(e) => setEmail({ ...email, fromName: e.target.value })}
            />
          </FieldRow>
          <FieldRow label="From address">
            <Input
              value={email.fromAddress ?? ""}
              onChange={(e) => setEmail({ ...email, fromAddress: e.target.value })}
            />
          </FieldRow>
          <FieldRow label="Reply-to">
            <Input
              value={email.replyTo ?? ""}
              onChange={(e) => setEmail({ ...email, replyTo: e.target.value })}
            />
          </FieldRow>
        </div>
      </Card>

      <Card padded={false}>
        <CardHeader title="Send test email" description="Verify SMTP (does not change saved settings)" />
        <div className="flex flex-wrap items-end gap-3 p-5">
          <div className="min-w-[240px] flex-1">
            <FieldRow label="Recipient">
              <Input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="you@example.com"
              />
            </FieldRow>
          </div>
          <Button onClick={sendTest} disabled={!testTo}>
            Send test
          </Button>
          {saving && <span className="text-xs text-muted">Saving…</span>}
        </div>
      </Card>
    </div>
  );
}

function SettingRow({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm font-medium text-[var(--ui-text)]">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <Toggle checked={checked} disabled={disabled} onChange={onChange} aria-label={label} />
    </li>
  );
}
