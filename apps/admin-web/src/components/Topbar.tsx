import { initials } from "@/lib/format";

const ADMIN_NAME = "Sarah Chen";
const ADMIN_EMAIL = "sarah.chen@acme.com";

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-ui bg-[var(--ui-surface)]/85 px-8 backdrop-blur">
      <div className="relative flex-1 max-w-md">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
          ⌕
        </span>
        <input
          type="search"
          placeholder="Search users, apps, tenants…"
          className="h-9 w-full rounded-[var(--ui-radius)] border border-ui bg-ui-elevated pl-9 pr-3 text-sm text-[var(--ui-text)] outline-none placeholder-ui focus:border-[var(--ui-primary)] focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:inline-flex dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Acme Corp
        </span>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-muted text-xs font-semibold text-brand">
            {initials(ADMIN_NAME)}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-medium text-[var(--ui-text)]">{ADMIN_NAME}</p>
            <p className="text-[11px] text-faint">{ADMIN_EMAIL}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
