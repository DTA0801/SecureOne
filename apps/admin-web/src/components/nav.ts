export type NavItem = {
  label: string;
  href: string;
  description: string;
  enabled: boolean;
};

/**
 * Primary admin navigation. Items map to the platform's control-plane domains
 * (see docs/11-admin-control.md). Most are placeholders for upcoming phases —
 * `enabled: false` renders them as "coming soon".
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", description: "Platform overview & health", enabled: true },
  { label: "Tenants", href: "/tenants", description: "Organizations & isolation", enabled: false },
  { label: "Applications", href: "/applications", description: "OAuth2 clients & relying parties", enabled: false },
  { label: "Users", href: "/users", description: "Accounts, credentials & MFA", enabled: false },
  { label: "Roles & Permissions", href: "/roles", description: "RBAC, composite roles", enabled: false },
  { label: "Audit Log", href: "/audit", description: "Security & login history", enabled: false },
  { label: "Settings", href: "/settings", description: "Auth methods & policies", enabled: false },
];
