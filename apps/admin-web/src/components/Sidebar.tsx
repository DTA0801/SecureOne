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
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-black/10 bg-white/60 px-3 py-5 dark:border-white/10 dark:bg-white/5">
      <Link href="/" className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm">
          S1
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">{APP_NAME}</p>
          <p className="text-xs text-black/50 dark:text-white/50">{APP_TAGLINE}</p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-black/35 dark:text-white/35">
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
                          ? "bg-indigo-600 font-medium text-white"
                          : "text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10",
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

      <div className="mt-4 rounded-lg border border-black/10 px-3 py-2 dark:border-white/10">
        <p className="text-[11px] text-black/40 dark:text-white/40">SecureOne Admin</p>
        <p className="text-[11px] text-black/40 dark:text-white/40">v0.0.1 · MVP</p>
      </div>
    </aside>
  );
}
