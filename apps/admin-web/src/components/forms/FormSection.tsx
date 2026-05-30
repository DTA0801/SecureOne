import { cn } from "@/lib/cn";

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-ui bg-ui-surface/50",
        className,
      )}
    >
      <header className="border-b border-ui bg-ui-elevated/40 px-4 py-3">
        <h3 className="text-sm font-semibold text-ui">{title}</h3>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>}
      </header>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

export function FormFieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
