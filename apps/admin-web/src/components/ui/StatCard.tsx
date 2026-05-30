import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  delta?: { value: string; positive?: boolean };
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-black/45 dark:text-white/45">
          {label}
        </p>
        {icon && <span className="text-black/30 dark:text-white/30">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta && (
          <span
            className={cn(
              "font-medium",
              delta.positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            {delta.positive ? "▲" : "▼"} {delta.value}
          </span>
        )}
        {hint && <span className="text-black/40 dark:text-white/40">{hint}</span>}
      </div>
    </div>
  );
}
