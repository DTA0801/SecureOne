import type { ReactNode } from "react";

export function SecuritySection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-ui bg-ui-surface/40 px-4 py-4 sm:px-5">
      <h3 className="text-sm font-semibold text-ui">{title}</h3>
      {description && <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ActionNotice({ message, tone = "success" }: { message: string; tone?: "success" | "error" }) {
  return (
    <p
      className={`mt-3 rounded-lg px-3 py-2 text-xs ${
        tone === "success"
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-red-500/10 text-red-600 dark:text-red-400"
      }`}
      role="status"
    >
      {message}
    </p>
  );
}
