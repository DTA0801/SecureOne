"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PLATFORM_NAV, SUPER_ADMIN_NAV, TENANT_OPERATOR_NAV } from "./nav";
import { PlatformAdminNav } from "./PlatformAdminNav";
import { useAdminContext } from "./AdminContextProvider";
import { isTenantSuperAdmin } from "@/lib/operator-access";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { cn } from "@/lib/cn";
import { buildAppPath } from "@/lib/app-routes";
import type { ApplicationContextItem } from "@/lib/api/context";

/** Fallback sidebar when no applications are loaded yet. */
export function PlatformSidebar({
  superAdmin,
  applications,
}: {
  superAdmin: boolean;
  applications: ApplicationContextItem[];
}) {
  const pathname = usePathname();
  const ctx = useAdminContext();
  const isTenantOperator =
    (ctx.operatorTier === "tenant" || ctx.operatorTier === "tenant_super") && !superAdmin;
  const navSource = isTenantOperator ? TENANT_OPERATOR_NAV : PLATFORM_NAV;
  const superAdminHrefs = new Set(SUPER_ADMIN_NAV.map((i) => i.href));
  const items = navSource.filter(
    (i) => (superAdmin || !i.superAdminOnly) && !(superAdmin && superAdminHrefs.has(i.href)),
  );
  const defaultAppHref =
    applications.length > 0
      ? buildAppPath(applications[0].id, "users")
      : isTenantOperator
        ? "/login"
        : "/applications";

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-ui bg-ui-surface px-3 py-5">
      <Link href={defaultAppHref} className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-on-brand text-sm font-bold shadow-sm">
          S1
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-ui">{APP_NAME}</p>
          <p className="text-xs text-muted">{APP_TAGLINE}</p>
        </div>
      </Link>
      <nav className="flex flex-1 flex-col gap-0.5">
        {items.map((item) => {
          const href = item.href === "/app" ? defaultAppHref : item.href;
          const active =
            item.href === "/app"
              ? pathname.startsWith("/app/")
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "rounded-lg px-2.5 py-2 text-sm transition-colors",
                active ? "bg-brand font-medium text-on-brand" : "text-soft hover:bg-ui-elevated",
              )}
            >
              {item.label}
            </Link>
          );
        })}
        {showPlatformAdmin && (
          <div className="mt-3 border-t border-ui pt-3">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-faint">
              Platform admin
            </p>
            <PlatformAdminNav
              pathname={pathname}
              variant={superAdmin ? "full" : "tenant-only"}
              tenantId={ctx.tenantId}
            />
          </div>
        )}
      </nav>
    </aside>
  );
}
