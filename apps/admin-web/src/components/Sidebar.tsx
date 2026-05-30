"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-black/10 bg-white/60 px-4 py-6 dark:border-white/10 dark:bg-white/5">
      <div className="mb-8 px-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            S1
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{APP_NAME}</p>
            <p className="text-xs text-black/50 dark:text-white/50">{APP_TAGLINE}</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const base =
            "group flex flex-col rounded-lg px-3 py-2 text-sm transition-colors";
          if (!item.enabled) {
            return (
              <span
                key={item.href}
                aria-disabled
                className={`${base} cursor-not-allowed text-black/35 dark:text-white/30`}
                title="Coming soon"
              >
                <span className="flex items-center justify-between">
                  {item.label}
                  <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide dark:bg-white/10">
                    soon
                  </span>
                </span>
              </span>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${base} ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <p className="px-2 pt-4 text-[11px] text-black/40 dark:text-white/40">
        v0.0.1 · MVP scaffold
      </p>
    </aside>
  );
}
