import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { UsersWorkspace, UsersWorkspaceHeaderActions } from "@/components/users/UsersWorkspace";
import { resolveApplicationMeta } from "@/lib/api/app-workspace";
import { fetchUserDirectorySettings } from "@/lib/api/user-directory";
import { listUsers } from "@/lib/api/users";
import { listRoles } from "@/lib/api/roles";
import { listTenants } from "@/lib/api/tenants";

export const dynamic = "force-dynamic";

export default async function AppUsersPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const app = await resolveApplicationMeta(applicationId);
  if (!app) notFound();

  const [users, roles, tenants, directory] = await Promise.all([
    listUsers(app.tenantId, applicationId),
    listRoles({ applicationId }),
    listTenants(),
    fetchUserDirectorySettings(applicationId).catch(() => null),
  ]);
  const tenant = tenants.find((t) => t.id === app.tenantId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col min-h-0">
      <PageHeader
        breadcrumb={
          <Link href={`/app/${applicationId}/users`} className="hover:underline">
            Users
          </Link>
        }
        title="User management"
        description={`${app.name} · browse members, then open a user to manage account settings`}
        actions={
          tenant ? (
            <UsersWorkspaceHeaderActions
              tenants={[tenant]}
              roles={roles}
              tenantId={app.tenantId}
              applicationId={applicationId}
              directory={directory}
            />
          ) : undefined
        }
      />
      <UsersWorkspace
        users={users}
        roles={roles}
        tenants={tenant ? [tenant] : tenants}
        tenantId={app.tenantId}
        applicationId={applicationId}
        appName={app.name}
        tenantName={app.tenantName}
      />
    </div>
  );
}
