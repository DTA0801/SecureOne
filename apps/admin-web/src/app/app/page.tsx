import { redirect } from "next/navigation";
import { loadAdminContextSafe } from "@/lib/api/app-workspace";
import { buildAppPath } from "@/lib/app-routes";
import { PageHeader } from "@/components/ui/PageHeader";
import { NoOAuthClientsPanel } from "@/components/applications/NoOAuthClientsPanel";
import { hasOAuthClients, noOAuthClientsVariant } from "@/lib/oauth-client-registry";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

/** Picker removed — use the application dropdown in the header. */
export default async function AppIndexPage() {
  const ctx = await loadAdminContextSafe();

  if (hasOAuthClients(ctx) && ctx.applications.length > 0) {
    redirect(buildAppPath(ctx.applications[0].id, "users"));
  }

  if (!hasOAuthClients(ctx)) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader
          title="Application console"
          description="Operational work for integrated applications lives here after OAuth clients are registered."
        />
        <NoOAuthClientsPanel variant={noOAuthClientsVariant(ctx)} />
      </div>
    );
  }

  const isTenantOperator =
    (ctx.operatorTier === "tenant" || ctx.operatorTier === "tenant_super") && !ctx.platformSuperAdmin;

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Application console"
        description={
          isTenantOperator
            ? "Your account has no applications assigned yet."
            : "Select an application from the header dropdown."
        }
      />
      <Card className="p-5">
        <p className="text-sm text-muted">
          {isTenantOperator
            ? "Ask a platform administrator to grant you admin console access and assign applications, then sign in again."
            : "OAuth clients exist, but none are available in your session. Check console access assignments."}
        </p>
      </Card>
    </div>
  );
}
