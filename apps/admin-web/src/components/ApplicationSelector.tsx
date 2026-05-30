"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  appSectionFromPath,
  buildAppPath,
  isAppWorkspacePath,
} from "@/lib/app-routes";
import type { ApplicationContextItem } from "@/lib/api/context";

export function ApplicationSelector({
  applications,
  currentApplicationId,
}: {
  applications: ApplicationContextItem[];
  currentApplicationId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (applications.length === 0) {
    return (
      <span className="text-xs text-muted">No applications</span>
    );
  }

  const value = currentApplicationId ?? applications[0]?.id ?? "";

  function onChange(nextId: string) {
    if (!nextId || nextId === value) return;
    const section = isAppWorkspacePath(pathname) ? appSectionFromPath(pathname) : "users";
    router.push(buildAppPath(nextId, section));
  }

  const byTenant = new Map<string, ApplicationContextItem[]>();
  for (const app of applications) {
    const key = app.tenantName || "Other";
    if (!byTenant.has(key)) byTenant.set(key, []);
    byTenant.get(key)!.push(app);
  }

  const current = applications.find((a) => a.id === value);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <label htmlFor="app-select" className="sr-only">
        Application
      </label>
      <select
        id="app-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 max-w-[min(100%,280px)] min-w-[200px] truncate rounded-[var(--ui-radius)] border border-ui bg-ui-elevated px-3 text-sm font-medium text-ui outline-none focus:border-[var(--ui-primary)] focus:ring-2 focus:ring-brand"
      >
        {[...byTenant.entries()].map(([tenantName, apps]) => (
          <optgroup key={tenantName} label={tenantName}>
            {apps.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {current && (
        <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 lg:inline-flex dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {current.tenantName}
        </span>
      )}
    </div>
  );
}
