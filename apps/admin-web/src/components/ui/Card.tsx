import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-black/10 bg-white/70 dark:border-white/10 dark:bg-white/5",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-black/5 px-5 py-4 dark:border-white/5">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
