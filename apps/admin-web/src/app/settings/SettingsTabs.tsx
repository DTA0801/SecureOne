"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { FieldRow, Input } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import type {
  AuthMethod,
  FeatureFlag,
  PasswordPolicy,
} from "@/lib/types";

type Tab = "auth" | "password" | "mfa" | "flags";

export function SettingsTabs({
  authMethods,
  featureFlags,
  passwordPolicy,
}: {
  authMethods: AuthMethod[];
  featureFlags: FeatureFlag[];
  passwordPolicy: PasswordPolicy;
}) {
  const [tab, setTab] = useState<Tab>("auth");

  const tabs: { id: Tab; label: string }[] = [
    { id: "auth", label: "Authentication" },
    { id: "mfa", label: "MFA" },
    { id: "password", label: "Password policy" },
    { id: "flags", label: "Feature flags" },
  ];

  const primary = authMethods.filter((m) => m.category === "primary");
  const mfa = authMethods.filter((m) => m.category === "mfa");
  const federation = authMethods.filter((m) => m.category === "federation");

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-black/10 dark:border-white/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-black/55 hover:text-black/80 dark:text-white/55 dark:hover:text-white/80",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "auth" && (
        <div className="space-y-6">
          <MethodSection title="Primary login" description="How users authenticate first" methods={primary} />
          <MethodSection title="Identity federation" description="Social and enterprise SSO providers" methods={federation} />
        </div>
      )}

      {tab === "mfa" && (
        <MethodSection
          title="Multi-factor methods"
          description="Passkey-first. Enable the second factors users may enroll."
          methods={mfa}
        />
      )}

      {tab === "password" && <PasswordPolicyForm policy={passwordPolicy} />}

      {tab === "flags" && (
        <Card padded={false}>
          <CardHeader title="Feature flags" description="Progressive rollout of platform capabilities" />
          <ul className="divide-y divide-black/5 dark:divide-white/5">
            {featureFlags.map((f) => (
              <li key={f.key} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{f.name}</p>
                    <code className="font-mono text-[10px] text-black/40 dark:text-white/40">{f.key}</code>
                  </div>
                  <p className="text-xs text-black/50 dark:text-white/50">{f.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  {f.rollout < 100 && <Badge tone="info">{f.rollout}% rollout</Badge>}
                  <Toggle defaultOn={f.enabled} aria-label={f.name} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function MethodSection({
  title,
  description,
  methods,
}: {
  title: string;
  description: string;
  methods: AuthMethod[];
}) {
  return (
    <Card padded={false}>
      <CardHeader title={title} description={description} />
      <ul className="divide-y divide-black/5 dark:divide-white/5">
        {methods.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-xs text-black/50 dark:text-white/50">{m.description}</p>
            </div>
            <Toggle defaultOn={m.enabled} aria-label={m.name} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PasswordPolicyForm({ policy }: { policy: PasswordPolicy }) {
  return (
    <Card padded={false}>
      <CardHeader title="Password policy" description="Requirements enforced at registration and reset" action={<Button size="sm">Save</Button>} />
      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
        <FieldRow label="Minimum length">
          <Input type="number" defaultValue={policy.minLength} />
        </FieldRow>
        <FieldRow label="Password history" hint="prevent reuse">
          <Input type="number" defaultValue={policy.historyCount} />
        </FieldRow>
        <FieldRow label="Expiry (days)" hint="0 = never">
          <Input type="number" defaultValue={policy.expiryDays} />
        </FieldRow>
        <FieldRow label="Hash algorithm">
          <Input defaultValue={policy.hashAlgorithm} disabled />
        </FieldRow>
        <div className="md:col-span-2">
          <p className="mb-2 text-sm font-medium">Complexity requirements</p>
          <div className="space-y-3">
            <PolicyToggle label="Require uppercase letter" on={policy.requireUppercase} />
            <PolicyToggle label="Require number" on={policy.requireNumber} />
            <PolicyToggle label="Require symbol" on={policy.requireSymbol} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function PolicyToggle({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-2.5 dark:border-white/10">
      <span className="text-sm">{label}</span>
      <Toggle defaultOn={on} aria-label={label} />
    </div>
  );
}
