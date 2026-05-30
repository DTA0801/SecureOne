"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { loadAppExposureAction, saveAppExposureAction } from "@/lib/actions/app-exposure";
import type { AppSettingsExposure } from "@/lib/api/app-exposure";

const SECTIONS: { key: string; label: string; description: string }[] = [
  {
    key: "notifications",
    label: "Notifications",
    description: "Email alerts, admin recipients, and security notifications for this app.",
  },
  {
    key: "email",
    label: "Email sender",
    description: "From name, address, and reply-to overrides per application.",
  },
  {
    key: "auth-methods",
    label: "Authentication & MFA",
    description: "Login methods and MFA factors enabled for users of this application.",
  },
  {
    key: "password-policy",
    label: "Password policy",
    description: "Length, complexity, and history rules for this application.",
  },
  {
    key: "feature-flags",
    label: "Feature flags",
    description: "Capability toggles scoped to this application.",
  },
  {
    key: "appearance",
    label: "Appearance",
    description: "Per-application branding (admin console theme stays platform-wide unless you enable this).",
  },
  {
    key: "user-directory",
    label: "User directory",
    description: "Bulk import and export (CSV, Excel, LDAP) and per-app enablement of those features.",
  },
];

export function AppExposureSettings() {
  const { toast } = useToast();
  const [exposure, setExposure] = useState<AppSettingsExposure>({});
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadAppExposureAction().then(({ exposure: data, error }) => {
      setExposure(data);
      setLoaded(true);
      if (error) toast(error, "error");
    });
  }, [toast]);

  const scheduleSave = useCallback(
    (next: AppSettingsExposure) => {
      if (!loaded) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const { exposure: saved, error } = await saveAppExposureAction(next);
        setExposure(saved);
        toast(
          error ? error : "Application settings visibility saved",
          error ? "error" : "success",
        );
      }, 600);
    },
    [loaded, toast],
  );

  return (
    <Card padded={false}>
      <CardHeader
        title="For applications"
        description="Choose which platform setting sections appear under each application's Settings page. Disabled sections stay platform-only."
      />
      <ul className={`divide-y divide-ui ${!loaded ? "pointer-events-none opacity-60" : ""}`}>
        {SECTIONS.map((section) => (
          <li key={section.key} className="flex items-start justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-ui">{section.label}</p>
              <p className="text-xs text-muted">{section.description}</p>
            </div>
            <Toggle
              checked={Boolean(exposure[section.key])}
              onChange={(enabled) => {
                const next = { ...exposure, [section.key]: enabled };
                setExposure(next);
                scheduleSave(next);
              }}
              aria-label={`Enable ${section.label} for applications`}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
