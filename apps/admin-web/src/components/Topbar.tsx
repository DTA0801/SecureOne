import { initials } from "@/lib/format";

const ADMIN_NAME = "Sarah Chen";
const ADMIN_EMAIL = "sarah.chen@acme.com";

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-black/10 bg-[var(--background)]/80 px-8 backdrop-blur dark:border-white/10">
      <div className="relative flex-1 max-w-md">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30">
          ⌕
        </span>
        <input
          type="search"
          placeholder="Search users, apps, tenants…"
          className="h-9 w-full rounded-lg border border-black/10 bg-black/[0.02] pl-9 pr-3 text-sm outline-none placeholder:text-black/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/30"
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:inline-flex dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Acme Corp
        </span>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            {initials(ADMIN_NAME)}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-medium">{ADMIN_NAME}</p>
            <p className="text-[11px] text-black/45 dark:text-white/45">{ADMIN_EMAIL}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
