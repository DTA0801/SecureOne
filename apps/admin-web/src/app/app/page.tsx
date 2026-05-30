import { redirect } from "next/navigation";
import { loadAdminContextSafe } from "@/lib/api/app-workspace";
import { buildAppPath } from "@/lib/app-routes";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

/** Picker removed — use the application dropdown in the header. */
export default async function AppIndexPage() {
  const ctx = await loadAdminContextSafe();

  if (ctx.applications.length > 0) {
    redirect(buildAppPath(ctx.applications[0].id, "users"));
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Application console"
        description="Select an application from the header dropdown once the auth-server is available."
      />
      <Card className="p-5">
        <p className="text-sm text-muted">
          No applications loaded. Start the auth-server on port 9000 and refresh, or register a client under
          Manage clients.
        </p>
      </Card>
    </div>
  );
}
