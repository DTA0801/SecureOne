"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { FieldRow, Input, Select } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { saveSmtpAction } from "@/lib/actions/settings";
import type { SmtpSettings } from "@/lib/api/settings";

export function SmtpSettingsCard({
  applicationId,
  smtp,
  onSaved,
}: {
  applicationId: string;
  smtp: SmtpSettings;
  onSaved: (next: SmtpSettings) => void;
}) {
  const [draft, setDraft] = useState<SmtpSettings>(smtp);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraft(smtp);
  }, [smtp]);

  async function save() {
    setSaving(true);
    setMessage(null);
    const payload: SmtpSettings = { ...draft };
    if (password.trim()) {
      payload.password = password;
    }
    const result = await saveSmtpAction(applicationId, payload);
    if (result.ok && result.smtp) {
      onSaved(result.smtp);
      setPassword("");
      setMessage("SMTP settings saved.");
    } else {
      setMessage(result.error ?? "Save failed");
    }
    setSaving(false);
  }

  return (
    <Card padded={false}>
      <CardHeader
        title="SMTP server"
        description="Per-application SMTP (password encrypted at rest). Gmail: smtp.gmail.com, port 465, SSL."
      />
      {message && <p className="px-5 text-sm text-brand">{message}</p>}
      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        <FieldRow label="Host">
          <Input
            value={draft.host ?? ""}
            onChange={(e) => setDraft({ ...draft, host: e.target.value })}
            placeholder="smtp.gmail.com"
          />
        </FieldRow>
        <FieldRow label="Port">
          <Input
            type="number"
            value={draft.port ?? 465}
            onChange={(e) => setDraft({ ...draft, port: Number(e.target.value) || 465 })}
          />
        </FieldRow>
        <FieldRow label="Security">
          <Select
            value={draft.security ?? "ssl"}
            onChange={(e) =>
              setDraft({ ...draft, security: e.target.value as SmtpSettings["security"] })
            }
          >
            <option value="ssl">SSL (port 465)</option>
            <option value="starttls">STARTTLS (port 587)</option>
            <option value="none">None</option>
          </Select>
        </FieldRow>
        <FieldRow label="Username">
          <Input
            value={draft.username ?? ""}
            onChange={(e) => setDraft({ ...draft, username: e.target.value })}
            placeholder="you@gmail.com"
          />
        </FieldRow>
        <FieldRow
          label="Password"
          hint={draft.passwordConfigured ? "Leave blank to keep current app password" : "Gmail App Password"}
        >
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={draft.passwordConfigured ? "••••••••" : "App password"}
          />
        </FieldRow>
        <FieldRow label="SMTP authentication">
          <div className="flex h-[38px] items-center">
            <Toggle
              checked={draft.authEnabled !== false}
              onChange={(v) => setDraft({ ...draft, authEnabled: v })}
              aria-label="SMTP authentication"
            />
          </div>
        </FieldRow>
      </div>
      <div className="border-t border-ui p-5">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save SMTP"}
        </Button>
      </div>
    </Card>
  );
}
