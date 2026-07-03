import { ConfluenceSidebar } from "./ConfluenceSidebar";

export function ConfluenceShell({
  activeSlug,
  title,
  sourceFile,
  children,
}: {
  activeSlug: string;
  title: string;
  sourceFile: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-ui bg-ui-surface px-8 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-faint">SecureOne Confluence</p>
        <h1 className="mt-1 text-2xl font-semibold text-ui">{title}</h1>
        <p className="mt-1 font-mono text-xs text-muted">docs/{sourceFile}</p>
      </header>
      <div className="flex min-h-0 flex-1">
        <ConfluenceSidebar activeSlug={activeSlug} />
        <div className="min-w-0 flex-1 overflow-y-auto px-8 py-8">{children}</div>
      </div>
    </div>
  );
}
