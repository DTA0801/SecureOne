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
    <div className="rounded-[var(--ui-radius)] border border-ui bg-ui-surface p-5 text-[var(--ui-text)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">
          {label}
        </p>
        {icon && <span className="text-faint">{icon}</span>}
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
        {hint && <span className="text-faint">{hint}</span>}
      </div>
    </div>
  );
}
