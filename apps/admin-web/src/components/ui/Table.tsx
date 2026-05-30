import { cn } from "@/lib/cn";

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-black/[0.02] text-left text-xs uppercase tracking-wide text-black/45 dark:bg-white/[0.03] dark:text-white/45">
      {children}
    </thead>
  );
}

export function TH({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <th className={cn("px-4 py-3 font-medium", className)}>{children}</th>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  return (
    <tbody className="divide-y divide-black/5 dark:divide-white/5">{children}</tbody>
  );
}

export function TR({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TD({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}
