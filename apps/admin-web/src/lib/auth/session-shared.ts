export const SESSION_COOKIE = "secureone_admin_session";
export const ADMIN_AUTH_SCHEME = "SecureOne-Admin";

export type AdminSession = {
  username: string;
  password: string;
};

export function encodeSession(session: AdminSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function decodeSession(value: string): AdminSession | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as AdminSession;
    if (!parsed?.username || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Auth header for admin API calls (supports tenantSlug:email usernames). */
export function buildAdminAuthHeader(session: AdminSession): string {
  const token = Buffer.from(
    JSON.stringify({ username: session.username, password: session.password }),
    "utf8",
  ).toString("base64");
  return `${ADMIN_AUTH_SCHEME} ${token}`;
}

/** @deprecated Use buildAdminAuthHeader */
export function buildBasicAuthHeader(session: AdminSession): string {
  return buildAdminAuthHeader(session);
}

/** Build login username: platform admin or tenantSlug:email */
export function buildLoginUsername(tenantSlug: string | undefined, emailOrUsername: string): string {
  const value = emailOrUsername.trim();
  if (!tenantSlug?.trim()) {
    return value;
  }
  return `${tenantSlug.trim().toLowerCase()}:${value.toLowerCase()}`;
}
