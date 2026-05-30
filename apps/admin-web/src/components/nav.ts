export type NavItem = {
  label: string;
  href: string;
  description: string;
  superAdminOnly?: boolean;
};

/** Super-admin / platform operations (shown at bottom of sidebar). */
export const SUPER_ADMIN_NAV: NavItem[] = [
  { label: "Manage clients", href: "/applications", description: "Register OAuth clients", superAdminOnly: true },
  { label: "Tenants", href: "/tenants", description: "Organizations", superAdminOnly: true },
  { label: "Platform settings", href: "/settings", description: "Global defaults", superAdminOnly: true },
];

/** Legacy platform nav (picker + super admin) — used when no application context. */
export const PLATFORM_NAV: NavItem[] = [
  { label: "Application console", href: "/app", description: "Users, roles, settings — use header dropdown to switch app" },
  ...SUPER_ADMIN_NAV,
];

export function appNav(applicationId: string): NavItem[] {
  const base = `/app/${applicationId}`;
  return [
    { label: "Users", href: `${base}/users`, description: "Members of this application" },
    { label: "Roles", href: `${base}/roles`, description: "RBAC for this application" },
    { label: "Permissions", href: `${base}/permissions`, description: "Permission catalog (database)" },
    { label: "Settings", href: `${base}/settings`, description: "Auth & notifications overrides" },
    { label: "Audit log", href: `${base}/audit`, description: "Events for this application" },
    { label: "Sessions", href: `${base}/sessions`, description: "Sign-ins for this application" },
  ];
}
