export type NavItem = {
  label: string;
  href: string;
  description: string;
  superAdminOnly?: boolean;
};

export type SidebarNavChild = {
  label: string;
  href: string;
  isActive?: (pathname: string) => boolean;
};

export type SidebarNavGroupConfig = {
  label: string;
  children: SidebarNavChild[];
};

export function isTenantListNavActive(pathname: string): boolean {
  if (pathname === "/tenants") return true;
  const match = pathname.match(/^\/tenants\/([^/]+)(?:\/.*)?$/);
  if (!match) return false;
  if (match[1] === "roles") return false;
  return !pathname.includes("/roles");
}

export function isTenantRolesNavActive(pathname: string): boolean {
  return pathname === "/tenants/roles" || /^\/tenants\/[^/]+\/roles\/?$/.test(pathname);
}

/** Collapsible tenant section for platform super-admin sidebars. */
export const TENANT_NAV_GROUP: SidebarNavGroupConfig = {
  label: "Tenant",
  children: [
    { label: "Tenants", href: "/tenants", isActive: isTenantListNavActive },
    { label: "Roles & Permissions", href: "/tenants/roles", isActive: isTenantRolesNavActive },
  ],
};

/** Tenant super-admin: scoped links to their organization only. */
export function tenantNavGroupForOperator(tenantId: string): SidebarNavGroupConfig {
  return {
    label: "Tenant",
    children: [
      { label: "Tenants", href: `/tenants/${tenantId}`, isActive: isTenantListNavActive },
      {
        label: "Roles & Permissions",
        href: `/tenants/${tenantId}/roles`,
        isActive: isTenantRolesNavActive,
      },
    ],
  };
}

/** Super-admin / platform operations (shown at bottom of sidebar). */
export const SUPER_ADMIN_NAV: NavItem[] = [
  {
    label: "OAuth clients",
    href: "/applications",
    description: "Enterprise client registry",
    superAdminOnly: true,
  },
  { label: "Platform settings", href: "/settings", description: "Global defaults", superAdminOnly: true },
];

/** Tenant operator nav — application console only (assigned apps via header dropdown). */
export const TENANT_OPERATOR_NAV: NavItem[] = [
  { label: "Application console", href: "/app", description: "Manage users, roles, and settings per application" },
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
    { label: "Application logs", href: `${base}/logs`, description: "Runtime logs — search by session or request" },
    { label: "Sessions", href: `${base}/sessions`, description: "Sign-ins for this application" },
  ];
}
