"use client";

import { initials } from "@/lib/format";
import { ApplicationSelector } from "./ApplicationSelector";
import { applicationIdFromPath } from "@/lib/app-routes";
import { usePathname } from "next/navigation";
import type { ApplicationContextItem } from "@/lib/api/context";

const ADMIN_NAME = "Sarah Chen";
const ADMIN_EMAIL = "sarah.chen@acme.com";

export function Topbar({ applications }: { applications: ApplicationContextItem[] }) {
  const pathname = usePathname();
  const currentApplicationId = applicationIdFromPath(pathname) ?? applications[0]?.id;

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-ui bg-[var(--ui-surface)]/85 px-8 backdrop-blur">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <ApplicationSelector
          applications={applications}
          currentApplicationId={currentApplicationId}
        />
        <div className="relative hidden max-w-xs flex-1 md:block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
            ⌕
          </span>
          <input
            type="search"
            placeholder="Search…"
            className="h-9 w-full rounded-[var(--ui-radius)] border border-ui bg-ui-elevated pl-9 pr-3 text-sm text-[var(--ui-text)] outline-none placeholder-ui focus:border-[var(--ui-primary)] focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-muted text-xs font-semibold text-brand">
          {initials(ADMIN_NAME)}
        </div>
        <div className="hidden leading-tight sm:block">
          <p className="text-xs font-medium text-[var(--ui-text)]">{ADMIN_NAME}</p>
          <p className="text-[11px] text-faint">{ADMIN_EMAIL}</p>
        </div>
      </div>
    </header>
  );
}
