export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ui px-6 py-16 text-center dark:border-white/15">
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-faint">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
