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

  const isTenantOperator =
    (ctx.operatorTier === "tenant" || ctx.operatorTier === "tenant_super") && !ctx.platformSuperAdmin;

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Application console"
        description={
          isTenantOperator
            ? "Your account has no applications assigned yet."
            : "Select an application from the header dropdown or register a new OAuth client."
        }
      />
      <Card className="p-5">
        <p className="text-sm text-muted">
          {isTenantOperator
            ? "Ask a platform administrator to grant you admin console access and assign applications, then sign in again."
            : "No applications yet. Create a tenant and OAuth client under Tenants and OAuth clients, then return here."}
        </p>
      </Card>
    </div>
  );
}
