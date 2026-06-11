/** App workspace sections under /app/[applicationId]/… */

export const APP_SECTIONS = [
  "users",
  "roles",
  "permissions",
  "settings",
  "audit",
  "logs",
  "sessions",
] as const;
export type AppSection = (typeof APP_SECTIONS)[number];

export function appSectionFromPath(pathname: string): AppSection {
  const match = pathname.match(/^\/app\/[^/]+\/([^/]+)/);
  const section = match?.[1];
  if (section && APP_SECTIONS.includes(section as AppSection)) {
    return section as AppSection;
  }
  return "users";
}

export function applicationIdFromPath(pathname: string): string | undefined {
  return pathname.match(/^\/app\/([^/]+)/)?.[1];
}

export function buildAppPath(applicationId: string, section: AppSection = "users"): string {
  return `/app/${applicationId}/${section}`;
}

export function isAppWorkspacePath(pathname: string): boolean {
  return /^\/app\/[^/]+/.test(pathname);
}
