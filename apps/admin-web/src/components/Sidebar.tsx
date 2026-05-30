"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS, NAV_ITEMS } from "./nav";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { cn } from "@/lib/cn";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-ui bg-ui-surface px-3 py-5">
      <Link href="/" className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-on-brand text-sm font-bold shadow-sm">
          S1
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-[var(--ui-text)]">{APP_NAME}</p>
          <p className="text-xs text-muted">{APP_TAGLINE}</p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-faint">
                {group}
              </p>
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-brand text-on-brand font-medium"
                          : "text-soft hover:bg-ui-elevated",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mt-4 rounded-lg border border-ui px-3 py-2">
        <p className="text-[11px] text-faint">SecureOne Admin</p>
        <p className="text-[11px] text-faint">v0.0.1 · MVP</p>
      </div>
    </aside>
  );
}
