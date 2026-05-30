export type NavItem = {
  label: string;
  href: string;
  description: string;
  enabled: boolean;
  group: "Overview" | "Identity" | "Access" | "Security" | "Platform";
};

/**
 * Primary admin navigation, grouped by control-plane domain
 * (see docs/11-admin-control.md).
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", description: "Platform overview & health", enabled: true, group: "Overview" },
  { label: "Tenants", href: "/tenants", description: "Organizations & isolation", enabled: true, group: "Identity" },
  { label: "Users", href: "/users", description: "Accounts, credentials & MFA", enabled: true, group: "Identity" },
  { label: "Applications", href: "/applications", description: "OAuth2 clients & relying parties", enabled: true, group: "Access" },
  { label: "Roles & Permissions", href: "/roles", description: "RBAC, composite roles", enabled: true, group: "Access" },
  { label: "Audit Log", href: "/audit", description: "Security & admin events", enabled: true, group: "Security" },
  { label: "Sessions", href: "/sessions", description: "Login history & active sessions", enabled: true, group: "Security" },
  { label: "Settings", href: "/settings", description: "Auth methods & policies", enabled: true, group: "Platform" },
];

export const NAV_GROUPS = ["Overview", "Identity", "Access", "Security", "Platform"] as const;
