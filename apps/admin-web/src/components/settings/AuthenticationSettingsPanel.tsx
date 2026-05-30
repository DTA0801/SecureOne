"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { FieldRow, Input } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import {
  loadAuthSettingsAction,
  saveAuthMethodsAction,
  saveFeatureFlagsAction,
  savePasswordPolicyAction,
} from "@/lib/actions/auth-settings";
import type { AuthMethod, FeatureFlag, PasswordPolicy } from "@/lib/types";

type Tab = "auth" | "mfa" | "password" | "flags";

export function AuthenticationSettingsPanel({ tab }: { tab: Tab }) {
  const { toast } = useToast();
  const [authMethods, setAuthMethods] = useState<AuthMethod[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy | null>(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadAuthSettingsAction().then(({ authMethods: a, featureFlags: f, passwordPolicy: p, error }) => {
      setAuthMethods(a);
      setFeatureFlags(f);
      setPasswordPolicy(p);
      setLoaded(true);
      if (error) toast(error, "error");
    });
  }, [toast]);

  const scheduleSave = useCallback(
    (fn: () => Promise<{ ok: boolean; error?: string }>) => {
      if (!loaded) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const result = await fn();
        toast(result.ok ? "Saved to database" : (result.error ?? "Save failed"), result.ok ? "success" : "error");
      }, 700);
    },
    [loaded, toast],
  );

  const primary = authMethods.filter((m) => m.category === "primary");
  const mfa = authMethods.filter((m) => m.category === "mfa");
  const federation = authMethods.filter((m) => m.category === "federation");

  return (
    <div className={!loaded ? "pointer-events-none opacity-60" : ""}>
      {tab === "auth" && (
        <div className="space-y-6">
          <MethodSection
            title="Primary login"
            description="How users authenticate first"
            methods={primary}
            onToggle={(next) => {
              setAuthMethods(next);
              scheduleSave(() => saveAuthMethodsAction(next));
            }}
          />
          <MethodSection
            title="Identity federation"
            description="Social and enterprise SSO (stored for policy; full SSO in later phases)"
            methods={federation}
            onToggle={(next) => {
              setAuthMethods(next);
              scheduleSave(() => saveAuthMethodsAction(next));
            }}
          />
        </div>
      )}

      {tab === "mfa" && (
        <MethodSection
          title="Multi-factor methods"
          description="Enable factors for future enrollment. TOTP/passkey enrollment coming in Phase 2."
          methods={mfa}
          onToggle={(next) => {
            setAuthMethods(next);
            scheduleSave(() => saveAuthMethodsAction(next));
          }}
        />
      )}

      {tab === "password" && passwordPolicy && (
        <Card padded={false}>
          <CardHeader title="Password policy" description="Enforced on set-password and reset flows" />
          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            <FieldRow label="Minimum length">
              <Input
                type="number"
                value={passwordPolicy.minLength}
                onChange={(e) => {
                  const next = { ...passwordPolicy, minLength: Number(e.target.value) };
                  setPasswordPolicy(next);
                  scheduleSave(() => savePasswordPolicyAction(next));
                }}
              />
            </FieldRow>
            <FieldRow label="Password history">
              <Input
                type="number"
                value={passwordPolicy.historyCount}
                onChange={(e) => {
                  const next = { ...passwordPolicy, historyCount: Number(e.target.value) };
                  setPasswordPolicy(next);
                  scheduleSave(() => savePasswordPolicyAction(next));
                }}
              />
            </FieldRow>
            <FieldRow label="Hash algorithm">
              <Input value={passwordPolicy.hashAlgorithm} disabled />
            </FieldRow>
            <div className="md:col-span-2 space-y-2">
              <PolicyToggle
                label="Require uppercase"
                on={passwordPolicy.requireUppercase}
                onChange={(v) => {
                  const next = { ...passwordPolicy, requireUppercase: v };
                  setPasswordPolicy(next);
                  scheduleSave(() => savePasswordPolicyAction(next));
                }}
              />
              <PolicyToggle
                label="Require number"
                on={passwordPolicy.requireNumber}
                onChange={(v) => {
                  const next = { ...passwordPolicy, requireNumber: v };
                  setPasswordPolicy(next);
                  scheduleSave(() => savePasswordPolicyAction(next));
                }}
              />
              <PolicyToggle
                label="Require symbol"
                on={passwordPolicy.requireSymbol}
                onChange={(v) => {
                  const next = { ...passwordPolicy, requireSymbol: v };
                  setPasswordPolicy(next);
                  scheduleSave(() => savePasswordPolicyAction(next));
                }}
              />
            </div>
          </div>
        </Card>
      )}

      {tab === "flags" && (
        <Card padded={false}>
          <CardHeader title="Feature flags" description="Platform capability toggles" />
          <ul className="divide-y divide-ui">
            {featureFlags.map((f, idx) => (
              <li key={f.key} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ui">{f.name}</p>
                    <code className="font-mono text-[10px] text-faint">{f.key}</code>
                  </div>
                  <p className="text-xs text-muted">{f.description}</p>
                </div>
                <Toggle
                  checked={f.enabled}
                  onChange={(enabled) => {
                    const next = featureFlags.map((x, i) => (i === idx ? { ...x, enabled } : x));
                    setFeatureFlags(next);
                    scheduleSave(() => saveFeatureFlagsAction(next));
                  }}
                  aria-label={f.name}
                />
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
  onToggle,
}: {
  title: string;
  description: string;
  methods: AuthMethod[];
  onToggle: (next: AuthMethod[]) => void;
}) {
  return (
    <Card padded={false}>
      <CardHeader title={title} description={description} />
      <ul className="divide-y divide-ui">
        {methods.map((m, idx) => {
          const extended = m as AuthMethod & { implemented?: boolean };
          const implemented = extended.implemented !== false;
          return (
            <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ui">{m.name}</p>
                  {!implemented && <Badge tone="warning">Coming soon</Badge>}
                </div>
                <p className="text-xs text-muted">{m.description}</p>
              </div>
              <Toggle
                checked={m.enabled}
                onChange={(enabled) => {
                  const next = methods.map((x, i) => (i === idx ? { ...x, enabled } : x));
                  onToggle(next);
                }}
                aria-label={m.name}
              />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function PolicyToggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-ui px-4 py-2.5">
      <span className="text-sm text-ui">{label}</span>
      <Toggle checked={on} onChange={onChange} aria-label={label} />
    </div>
  );
}
