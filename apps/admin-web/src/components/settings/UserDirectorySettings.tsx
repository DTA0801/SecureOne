"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import {
  fetchUserDirectorySettings,
  saveUserDirectorySettings,
  type UserDirectorySettings,
} from "@/lib/api/user-directory";

const DEFAULTS: UserDirectorySettings = {
  importEnabled: false,
  exportEnabled: false,
  sources: {
    csv: { enabled: true },
    excel: { enabled: true },
    ldap: { enabled: false },
  },
  ldap: {
    host: "",
    port: 389,
    baseDn: "",
    bindDn: "",
    bindPassword: "",
    userFilter: "(mail={0})",
    useTls: true,
  },
};

export function UserDirectorySettings({ applicationId }: { applicationId: string }) {
  const { toast } = useToast();
  const [config, setConfig] = useState<UserDirectorySettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchUserDirectorySettings(applicationId)
      .then((data) => {
        setConfig({
          ...DEFAULTS,
          ...data,
          sources: { ...DEFAULTS.sources, ...data.sources },
          ldap: { ...DEFAULTS.ldap, ...data.ldap },
        });
      })
      .catch(() => setConfig(DEFAULTS))
      .finally(() => setLoaded(true));
  }, [applicationId]);

  const scheduleSave = useCallback(
    (next: UserDirectorySettings) => {
      if (!loaded) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const saved = await saveUserDirectorySettings(applicationId, next);
          setConfig({
            ...DEFAULTS,
            ...saved,
            sources: { ...DEFAULTS.sources, ...saved.sources },
            ldap: { ...DEFAULTS.ldap, ...saved.ldap },
          });
          toast("User directory settings saved", "success");
        } catch (e) {
          toast(e instanceof Error ? e.message : "Save failed", "error");
        }
      }, 600);
    },
    [applicationId, loaded, toast],
  );

  function patch(partial: Partial<UserDirectorySettings>) {
    const next = { ...config, ...partial };
    setConfig(next);
    scheduleSave(next);
  }

  function patchSource(key: keyof UserDirectorySettings["sources"], enabled: boolean) {
    const next = {
      ...config,
      sources: { ...config.sources, [key]: { enabled } },
    };
    setConfig(next);
    scheduleSave(next);
  }

  function patchLdap(field: keyof UserDirectorySettings["ldap"], value: string | number | boolean) {
    const next = { ...config, ldap: { ...config.ldap, [field]: value } };
    setConfig(next);
    scheduleSave(next);
  }

  return (
    <div className={`space-y-5 ${!loaded ? "pointer-events-none opacity-60" : ""}`}>
      <Card padded={false}>
        <CardHeader
          title="Import & export"
          description="Control whether admins can bulk import or export users for this application. Disabled features are hidden on the Users page."
        />
        <ul className="divide-y divide-ui">
          <li className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-ui">Allow user import</p>
              <p className="text-xs text-muted">CSV, Excel (CSV format), and LDAP sources.</p>
            </div>
            <Toggle
              checked={config.importEnabled}
              onChange={(v) => patch({ importEnabled: v })}
              aria-label="Allow user import"
            />
          </li>
          <li className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-ui">Allow user export</p>
              <p className="text-xs text-muted">Download members as CSV for backup or migration.</p>
            </div>
            <Toggle
              checked={config.exportEnabled}
              onChange={(v) => patch({ exportEnabled: v })}
              aria-label="Allow user export"
            />
          </li>
        </ul>
      </Card>

      <Card padded={false}>
        <CardHeader
          title="Import sources"
          description="Enable only the connectors you want admins to see. Import must be turned on above."
        />
        <ul className="divide-y divide-ui">
          {(
            [
              ["csv", "CSV file", "Comma-separated file with email, username, firstName, lastName, status."],
              ["excel", "Excel / spreadsheet", "Upload a .csv export from Excel (Save As CSV UTF-8)."],
              ["ldap", "LDAP / Active Directory", "Directory sync using the connection below (preview today)."],
            ] as const
          ).map(([key, label, desc]) => (
            <li key={key} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-ui">{label}</p>
                <p className="text-xs text-muted">{desc}</p>
              </div>
              <Toggle
                checked={Boolean(config.sources[key]?.enabled)}
                onChange={(v) => patchSource(key, v)}
                aria-label={`Enable ${label}`}
              />
            </li>
          ))}
        </ul>
      </Card>

      {config.sources.ldap?.enabled && (
        <Card padded={false}>
          <CardHeader
            title="LDAP connection"
            description="Used for LDAP import preview and future live sync. Password is stored in application settings."
          />
          <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-muted">Host</span>
              <Input
                value={config.ldap.host}
                onChange={(e) => patchLdap("host", e.target.value)}
                placeholder="ldap.example.com"
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted">Port</span>
              <Input
                type="number"
                value={String(config.ldap.port)}
                onChange={(e) => patchLdap("port", Number(e.target.value) || 389)}
                className="mt-1"
              />
            </label>
            <label className="flex items-end gap-2 pb-2">
              <Toggle
                checked={config.ldap.useTls}
                onChange={(v) => patchLdap("useTls", v)}
                aria-label="Use TLS"
              />
              <span className="text-sm text-muted">Use TLS (LDAPS)</span>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-muted">Base DN</span>
              <Input
                value={config.ldap.baseDn}
                onChange={(e) => patchLdap("baseDn", e.target.value)}
                placeholder="ou=users,dc=example,dc=com"
                className="mt-1"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-muted">Bind DN</span>
              <Input
                value={config.ldap.bindDn}
                onChange={(e) => patchLdap("bindDn", e.target.value)}
                placeholder="cn=admin,dc=example,dc=com"
                className="mt-1"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-muted">Bind password</span>
              <Input
                type="password"
                value={config.ldap.bindPassword}
                onChange={(e) => patchLdap("bindPassword", e.target.value)}
                className="mt-1"
                autoComplete="off"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-muted">User filter</span>
              <Input
                value={config.ldap.userFilter}
                onChange={(e) => patchLdap("userFilter", e.target.value)}
                className="mt-1"
              />
            </label>
          </div>
        </Card>
      )}

      {config.inheritsPlatformDefaults && (
        <p className="text-xs text-faint">Inheriting platform defaults until you change a value here.</p>
      )}
    </div>
  );
}
