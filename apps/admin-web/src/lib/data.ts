import type {
  Application,
  AuditEvent,
  AuthMethod,
  FeatureFlag,
  LoginEvent,
  PasswordPolicy,
  Permission,
  Role,
  Tenant,
  User,
} from "./types";

/**
 * In-memory mock dataset for the admin console. Deterministic so the UI is
 * stable across renders. Replace these module functions with real calls to the
 * SecureOne admin API once it exists — the page components only depend on the
 * exported getters, not the arrays.
 */

export const tenants: Tenant[] = [
  { id: "t_acme", name: "Acme Corp", slug: "acme", status: "active", plan: "enterprise", userCount: 1842, appCount: 6, createdAt: "2024-02-11T10:00:00Z" },
  { id: "t_globex", name: "Globex", slug: "globex", status: "active", plan: "team", userCount: 327, appCount: 3, createdAt: "2024-06-03T10:00:00Z" },
  { id: "t_initech", name: "Initech", slug: "initech", status: "active", plan: "team", userCount: 96, appCount: 2, createdAt: "2024-09-21T10:00:00Z" },
  { id: "t_umbrella", name: "Umbrella Inc", slug: "umbrella", status: "suspended", plan: "enterprise", userCount: 12, appCount: 1, createdAt: "2025-01-15T10:00:00Z" },
  { id: "t_hooli", name: "Hooli", slug: "hooli", status: "active", plan: "free", userCount: 8, appCount: 1, createdAt: "2025-04-02T10:00:00Z" },
];

export const applications: Application[] = [
  { id: "app_web", tenantId: "t_acme", name: "Acme Web Portal", clientId: "acme-web", type: "web", status: "active", grantTypes: ["authorization_code", "refresh_token"], scopes: ["openid", "profile", "email"], redirectUris: ["https://app.acme.com/callback"], createdAt: "2024-02-12T10:00:00Z" },
  { id: "app_spa", tenantId: "t_acme", name: "Acme Dashboard (SPA)", clientId: "acme-spa", type: "spa", status: "active", grantTypes: ["authorization_code", "refresh_token"], scopes: ["openid", "profile"], redirectUris: ["https://dash.acme.com/callback"], createdAt: "2024-03-01T10:00:00Z" },
  { id: "app_mobile", tenantId: "t_acme", name: "Acme Mobile", clientId: "acme-mobile", type: "native", status: "active", grantTypes: ["authorization_code", "refresh_token"], scopes: ["openid", "profile", "offline_access"], redirectUris: ["com.acme.app://callback"], createdAt: "2024-05-19T10:00:00Z" },
  { id: "app_billing", tenantId: "t_acme", name: "Billing Service", clientId: "acme-billing-svc", type: "m2m", status: "active", grantTypes: ["client_credentials"], scopes: ["billing.read", "billing.write"], redirectUris: [], createdAt: "2024-07-08T10:00:00Z" },
  { id: "app_globex", tenantId: "t_globex", name: "Globex Suite", clientId: "globex-suite", type: "web", status: "active", grantTypes: ["authorization_code", "refresh_token"], scopes: ["openid", "profile", "email"], redirectUris: ["https://suite.globex.com/callback"], createdAt: "2024-06-04T10:00:00Z" },
  { id: "app_initech", tenantId: "t_initech", name: "Initech CRM", clientId: "initech-crm", type: "web", status: "active", grantTypes: ["authorization_code"], scopes: ["openid", "profile"], redirectUris: ["https://crm.initech.com/callback"], createdAt: "2024-09-22T10:00:00Z" },
  { id: "app_hooli", tenantId: "t_hooli", name: "Hooli Chat", clientId: "hooli-chat", type: "spa", status: "disabled", grantTypes: ["authorization_code"], scopes: ["openid"], redirectUris: ["https://chat.hooli.com/cb"], createdAt: "2025-04-03T10:00:00Z" },
];

export const permissions: Permission[] = [
  { id: "p_user_read", key: "user:read", resource: "user", action: "read", description: "View users and profiles" },
  { id: "p_user_write", key: "user:write", resource: "user", action: "write", description: "Create and edit users" },
  { id: "p_user_delete", key: "user:delete", resource: "user", action: "delete", description: "Delete users" },
  { id: "p_role_read", key: "role:read", resource: "role", action: "read", description: "View roles & permissions" },
  { id: "p_role_write", key: "role:write", resource: "role", action: "write", description: "Manage roles & assignments" },
  { id: "p_app_read", key: "app:read", resource: "application", action: "read", description: "View applications" },
  { id: "p_app_write", key: "app:write", resource: "application", action: "write", description: "Manage OAuth clients" },
  { id: "p_audit_read", key: "audit:read", resource: "audit", action: "read", description: "View audit logs" },
  { id: "p_billing_read", key: "billing:read", resource: "billing", action: "read", description: "View billing data" },
  { id: "p_billing_write", key: "billing:write", resource: "billing", action: "write", description: "Manage billing" },
  { id: "p_settings_write", key: "settings:write", resource: "settings", action: "write", description: "Change tenant settings" },
];

export const roles: Role[] = [
  { id: "r_superadmin", tenantId: "t_acme", name: "Super Admin", description: "Full platform control, composite of all admin roles", isComposite: true, isSystem: true, isDefault: false, label: "SYSTEM", permissionIds: [], childRoleIds: ["r_admin", "r_security"], userCount: 3 },
  { id: "r_admin", tenantId: "t_acme", name: "Tenant Admin", description: "Manage users, roles, and applications", isComposite: false, isSystem: true, isDefault: true, label: "BUILT_IN", permissionIds: ["p_user_read", "p_user_write", "p_user_delete", "p_role_read", "p_role_write", "p_app_read", "p_app_write", "p_settings_write"], childRoleIds: [], userCount: 14 },
  { id: "r_security", tenantId: "t_acme", name: "Security Auditor", description: "Read-only access to audit & security data", isComposite: false, isSystem: true, isDefault: false, label: "SYSTEM", permissionIds: ["p_audit_read", "p_user_read", "p_role_read"], childRoleIds: [], userCount: 5 },
  { id: "r_billing", tenantId: "t_acme", name: "Billing Manager", description: "Manage billing and subscriptions", isComposite: false, isSystem: false, isDefault: false, label: "CUSTOM", permissionIds: ["p_billing_read", "p_billing_write", "p_user_read"], childRoleIds: [], userCount: 2 },
  { id: "r_developer", tenantId: "t_acme", name: "Developer", description: "Manage applications and integrations", isComposite: false, isSystem: false, isDefault: false, label: "CUSTOM", permissionIds: ["p_app_read", "p_app_write", "p_user_read"], childRoleIds: [], userCount: 28 },
  { id: "r_member", tenantId: "t_acme", name: "Member", description: "Standard end-user access", isComposite: false, isSystem: true, isDefault: true, label: "BUILT_IN", permissionIds: ["p_user_read"], childRoleIds: [], userCount: 1790 },
];

export const users: User[] = [
  { id: "u_001", tenantId: "t_acme", email: "sarah.chen@acme.com", username: "schen", firstName: "Sarah", lastName: "Chen", status: "active", emailVerified: true, roleIds: ["r_superadmin"], mfaFactors: [{ id: "f1", type: "passkey", label: "MacBook Pro", verified: true, addedAt: "2024-02-12T10:00:00Z" }, { id: "f2", type: "totp", label: "Authenticator", verified: true, addedAt: "2024-02-12T10:05:00Z" }], lastLoginAt: "2026-05-30T08:12:00Z", createdAt: "2024-02-12T10:00:00Z" },
  { id: "u_002", tenantId: "t_acme", email: "marcus.lee@acme.com", username: "mlee", firstName: "Marcus", lastName: "Lee", status: "active", emailVerified: true, roleIds: ["r_admin"], mfaFactors: [{ id: "f3", type: "passkey", label: "iPhone 15", verified: true, addedAt: "2024-03-01T10:00:00Z" }], lastLoginAt: "2026-05-29T17:40:00Z", createdAt: "2024-02-20T10:00:00Z" },
  { id: "u_003", tenantId: "t_acme", email: "priya.nair@acme.com", username: "pnair", firstName: "Priya", lastName: "Nair", status: "active", emailVerified: true, roleIds: ["r_security"], mfaFactors: [{ id: "f4", type: "totp", label: "Authenticator", verified: true, addedAt: "2024-04-10T10:00:00Z" }], lastLoginAt: "2026-05-30T07:55:00Z", createdAt: "2024-04-10T10:00:00Z" },
  { id: "u_004", tenantId: "t_acme", email: "david.kim@acme.com", username: "dkim", firstName: "David", lastName: "Kim", status: "active", emailVerified: true, roleIds: ["r_developer"], mfaFactors: [], lastLoginAt: "2026-05-28T12:00:00Z", createdAt: "2024-05-05T10:00:00Z" },
  { id: "u_005", tenantId: "t_acme", email: "elena.rossi@acme.com", username: "erossi", firstName: "Elena", lastName: "Rossi", status: "invited", emailVerified: false, roleIds: ["r_member"], mfaFactors: [], lastLoginAt: null, createdAt: "2026-05-25T10:00:00Z" },
  { id: "u_006", tenantId: "t_acme", email: "tom.baker@acme.com", username: "tbaker", firstName: "Tom", lastName: "Baker", status: "suspended", emailVerified: true, roleIds: ["r_member"], mfaFactors: [{ id: "f5", type: "sms", label: "+1 ••• 4821", verified: true, addedAt: "2024-08-01T10:00:00Z" }], lastLoginAt: "2026-04-02T09:30:00Z", createdAt: "2024-08-01T10:00:00Z" },
  { id: "u_007", tenantId: "t_globex", email: "yuki.tanaka@globex.com", username: "ytanaka", firstName: "Yuki", lastName: "Tanaka", status: "active", emailVerified: true, roleIds: ["r_admin"], mfaFactors: [{ id: "f6", type: "passkey", label: "Windows Hello", verified: true, addedAt: "2024-06-04T10:00:00Z" }], lastLoginAt: "2026-05-30T06:20:00Z", createdAt: "2024-06-04T10:00:00Z" },
  { id: "u_008", tenantId: "t_globex", email: "ahmed.hassan@globex.com", username: "ahassan", firstName: "Ahmed", lastName: "Hassan", status: "active", emailVerified: true, roleIds: ["r_developer"], mfaFactors: [{ id: "f7", type: "totp", label: "Authy", verified: true, addedAt: "2024-07-01T10:00:00Z" }], lastLoginAt: "2026-05-29T22:10:00Z", createdAt: "2024-07-01T10:00:00Z" },
  { id: "u_009", tenantId: "t_initech", email: "bill.lumbergh@initech.com", username: "blumbergh", firstName: "Bill", lastName: "Lumbergh", status: "active", emailVerified: true, roleIds: ["r_admin"], mfaFactors: [], lastLoginAt: "2026-05-27T14:00:00Z", createdAt: "2024-09-22T10:00:00Z" },
  { id: "u_010", tenantId: "t_hooli", email: "gavin.belson@hooli.com", username: "gbelson", firstName: "Gavin", lastName: "Belson", status: "active", emailVerified: true, roleIds: ["r_member"], mfaFactors: [{ id: "f8", type: "email", label: "gavin.belson@hooli.com", verified: true, addedAt: "2025-04-03T10:00:00Z" }], lastLoginAt: "2026-05-26T11:00:00Z", createdAt: "2025-04-03T10:00:00Z" },
];

export const auditEvents: AuditEvent[] = [
  { id: "a1", timestamp: "2026-05-30T08:12:00Z", actor: "sarah.chen@acme.com", action: "role.assigned", target: "marcus.lee@acme.com → Tenant Admin", ip: "203.0.113.10", result: "success" },
  { id: "a2", timestamp: "2026-05-30T07:55:00Z", actor: "priya.nair@acme.com", action: "audit.export", target: "audit log (May 2026)", ip: "203.0.113.22", result: "success" },
  { id: "a3", timestamp: "2026-05-30T06:20:00Z", actor: "ytanaka@globex.com", action: "application.created", target: "Globex Suite", ip: "198.51.100.5", result: "success" },
  { id: "a4", timestamp: "2026-05-29T23:01:00Z", actor: "unknown", action: "login.failed", target: "tom.baker@acme.com", ip: "45.155.205.99", result: "failure" },
  { id: "a5", timestamp: "2026-05-29T22:10:00Z", actor: "ahmed.hassan@globex.com", action: "mfa.enrolled", target: "TOTP (Authy)", ip: "198.51.100.8", result: "success" },
  { id: "a6", timestamp: "2026-05-29T17:40:00Z", actor: "marcus.lee@acme.com", action: "client_secret.rotated", target: "acme-billing-svc", ip: "203.0.113.11", result: "success" },
  { id: "a7", timestamp: "2026-05-29T10:05:00Z", actor: "sarah.chen@acme.com", action: "user.suspended", target: "tom.baker@acme.com", ip: "203.0.113.10", result: "success" },
  { id: "a8", timestamp: "2026-05-28T16:30:00Z", actor: "system", action: "feature_flag.toggled", target: "adaptive_mfa → on", ip: "—", result: "success" },
  { id: "a9", timestamp: "2026-05-28T12:00:00Z", actor: "david.kim@acme.com", action: "token.introspect", target: "acme-spa", ip: "203.0.113.40", result: "success" },
  { id: "a10", timestamp: "2026-05-28T09:00:00Z", actor: "unknown", action: "login.failed", target: "admin@acme.com", ip: "45.155.205.99", result: "failure" },
];

export const loginEvents: LoginEvent[] = [
  { id: "l1", userId: "u_001", userEmail: "sarah.chen@acme.com", timestamp: "2026-05-30T08:12:00Z", ip: "203.0.113.10", location: "San Francisco, US", device: "Chrome · macOS", method: "passkey", result: "success" },
  { id: "l2", userId: "u_003", userEmail: "priya.nair@acme.com", timestamp: "2026-05-30T07:55:00Z", ip: "203.0.113.22", location: "Austin, US", device: "Firefox · Windows", method: "password", result: "mfa_required" },
  { id: "l3", userId: "u_007", userEmail: "yuki.tanaka@globex.com", timestamp: "2026-05-30T06:20:00Z", ip: "198.51.100.5", location: "Tokyo, JP", device: "Edge · Windows", method: "passkey", result: "success" },
  { id: "l4", userId: "u_006", userEmail: "tom.baker@acme.com", timestamp: "2026-05-29T23:01:00Z", ip: "45.155.205.99", location: "Unknown", device: "curl/8.4", method: "password", result: "failure" },
  { id: "l5", userId: "u_008", userEmail: "ahmed.hassan@globex.com", timestamp: "2026-05-29T22:10:00Z", ip: "198.51.100.8", location: "Cairo, EG", device: "Safari · iOS", method: "totp", result: "success" },
  { id: "l6", userId: "u_002", userEmail: "marcus.lee@acme.com", timestamp: "2026-05-29T17:40:00Z", ip: "203.0.113.11", location: "San Francisco, US", device: "Chrome · macOS", method: "social", result: "success" },
  { id: "l7", userId: "u_010", userEmail: "gavin.belson@hooli.com", timestamp: "2026-05-26T11:00:00Z", ip: "192.0.2.55", location: "Palo Alto, US", device: "Chrome · Windows", method: "password", result: "success" },
];

export const authMethods: AuthMethod[] = [
  { id: "m_password", name: "Password", description: "Username + password with Argon2id hashing", enabled: true, category: "primary" },
  { id: "m_passkey", name: "Passkeys (WebAuthn / FIDO2)", description: "Phishing-resistant, passwordless sign-in", enabled: true, category: "primary" },
  { id: "m_magic", name: "Magic Link", description: "Email-based passwordless login", enabled: false, category: "primary" },
  { id: "m_totp", name: "TOTP Authenticator", description: "Time-based one-time codes (RFC 6238)", enabled: true, category: "mfa" },
  { id: "m_sms", name: "SMS OTP", description: "One-time code via text message", enabled: true, category: "mfa" },
  { id: "m_email_otp", name: "Email OTP", description: "One-time code via email", enabled: true, category: "mfa" },
  { id: "m_push", name: "Push Notification", description: "Approve sign-in from a registered device", enabled: false, category: "mfa" },
  { id: "m_google", name: "Google", description: "Social login via Google OIDC", enabled: true, category: "federation" },
  { id: "m_github", name: "GitHub", description: "Social login via GitHub OAuth", enabled: true, category: "federation" },
  { id: "m_saml", name: "SAML 2.0", description: "Enterprise SSO via SAML identity providers", enabled: false, category: "federation" },
  { id: "m_oidc", name: "External OIDC", description: "Federate with any OpenID Connect provider", enabled: false, category: "federation" },
];

export const featureFlags: FeatureFlag[] = [
  { key: "adaptive_mfa", name: "Adaptive MFA", description: "Risk-based step-up authentication", enabled: true, rollout: 100 },
  { key: "device_trust", name: "Trusted Devices", description: "Remember devices to skip MFA", enabled: true, rollout: 100 },
  { key: "scim_provisioning", name: "SCIM Provisioning", description: "Automated user provisioning (SCIM 2.0)", enabled: false, rollout: 25 },
  { key: "dpop", name: "DPoP Tokens", description: "Sender-constrained access tokens", enabled: false, rollout: 10 },
  { key: "self_service_recovery", name: "Self-service Recovery", description: "Allow users to recover accounts unaided", enabled: true, rollout: 100 },
];

export const passwordPolicy: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireNumber: true,
  requireSymbol: true,
  expiryDays: 0,
  historyCount: 5,
  hashAlgorithm: "Argon2id",
};

// ---- Accessors (swap these for API calls later) ----

export const getTenants = () => tenants;
export const getTenant = (id: string) => tenants.find((t) => t.id === id) ?? null;
export const getApplications = () => applications;
export const getApplication = (id: string) => applications.find((a) => a.id === id) ?? null;
export const getAppsForTenant = (tenantId: string) =>
  applications.filter((a) => a.tenantId === tenantId);
export const getUsers = () => users;
export const getUser = (id: string) => users.find((u) => u.id === id) ?? null;
export const getUsersForTenant = (tenantId: string) =>
  users.filter((u) => u.tenantId === tenantId);
export const getRoles = () => roles;
export const getRole = (id: string) => roles.find((r) => r.id === id) ?? null;
export const getPermissions = () => permissions;
export const getPermission = (id: string) => permissions.find((p) => p.id === id) ?? null;
export const getAuditEvents = () => auditEvents;
export const getLoginEvents = () => loginEvents;
export const getAuthMethods = () => authMethods;
export const getFeatureFlags = () => featureFlags;
export const getPasswordPolicy = () => passwordPolicy;

export const tenantName = (id: string) => getTenant(id)?.name ?? id;
export const roleName = (id: string) => getRole(id)?.name ?? id;

// ---- Mutations (in-memory; swap for API writes later) ----

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export type TenantInput = Pick<Tenant, "name" | "slug" | "plan" | "status">;

export function createTenant(input: TenantInput): Tenant {
  const tenant: Tenant = {
    id: uid("t"),
    ...input,
    userCount: 0,
    appCount: 0,
    createdAt: nowIso(),
  };
  tenants.unshift(tenant);
  return tenant;
}

export function updateTenant(id: string, patch: Partial<TenantInput>): Tenant | null {
  const t = getTenant(id);
  if (!t) return null;
  Object.assign(t, patch);
  return t;
}

export function deleteTenant(id: string): boolean {
  const i = tenants.findIndex((t) => t.id === id);
  if (i === -1) return false;
  tenants.splice(i, 1);
  return true;
}

export type ApplicationInput = Pick<
  Application,
  "tenantId" | "name" | "type" | "status" | "grantTypes" | "scopes" | "redirectUris"
> & { clientId?: string };

export function createApplication(input: ApplicationInput): Application {
  const app: Application = {
    id: uid("app"),
    tenantId: input.tenantId,
    name: input.name,
    clientId: input.clientId?.trim() || uid("client"),
    type: input.type,
    status: input.status,
    grantTypes: input.grantTypes,
    scopes: input.scopes,
    redirectUris: input.redirectUris,
    createdAt: nowIso(),
  };
  applications.unshift(app);
  const t = getTenant(input.tenantId);
  if (t) t.appCount += 1;
  return app;
}

export function updateApplication(id: string, patch: Partial<ApplicationInput>): Application | null {
  const a = getApplication(id);
  if (!a) return null;
  Object.assign(a, patch);
  return a;
}

export function deleteApplication(id: string): boolean {
  const i = applications.findIndex((a) => a.id === id);
  if (i === -1) return false;
  const [removed] = applications.splice(i, 1);
  const t = getTenant(removed.tenantId);
  if (t && t.appCount > 0) t.appCount -= 1;
  return true;
}

export type UserInput = Pick<
  User,
  "tenantId" | "email" | "username" | "firstName" | "lastName" | "status" | "roleIds"
>;

export function createUser(input: UserInput): User {
  const user: User = {
    id: uid("u"),
    ...input,
    emailVerified: false,
    mfaFactors: [],
    lastLoginAt: null,
    createdAt: nowIso(),
  };
  users.unshift(user);
  const t = getTenant(input.tenantId);
  if (t) t.userCount += 1;
  return user;
}

export function updateUser(id: string, patch: Partial<UserInput>): User | null {
  const u = getUser(id);
  if (!u) return null;
  Object.assign(u, patch);
  return u;
}

export function deleteUser(id: string): boolean {
  const i = users.findIndex((u) => u.id === id);
  if (i === -1) return false;
  const [removed] = users.splice(i, 1);
  const t = getTenant(removed.tenantId);
  if (t && t.userCount > 0) t.userCount -= 1;
  return true;
}

export function resetUserMfa(id: string): boolean {
  const u = getUser(id);
  if (!u) return false;
  u.mfaFactors = [];
  return true;
}

export type RoleInput = Pick<
  Role,
  "tenantId" | "name" | "description" | "isComposite" | "permissionIds" | "childRoleIds"
>;

export function createRole(input: RoleInput): Role {
  const role: Role = {
    id: uid("r"),
    ...input,
    isSystem: false,
    isDefault: false,
    label: input.isComposite ? "COMPOSITE" : "CUSTOM",
    userCount: 0,
  };
  roles.unshift(role);
  return role;
}

export function updateRole(id: string, patch: Partial<RoleInput>): Role | null {
  const r = getRole(id);
  if (!r) return null;
  Object.assign(r, patch);
  return r;
}

export function deleteRole(id: string): boolean {
  const i = roles.findIndex((r) => r.id === id);
  if (i === -1) return false;
  roles.splice(i, 1);
  return true;
}

export const platformStats = () => ({
  tenants: tenants.length,
  activeTenants: tenants.filter((t) => t.status === "active").length,
  users: tenants.reduce((sum, t) => sum + t.userCount, 0),
  applications: applications.length,
  mfaCoverage: Math.round(
    (users.filter((u) => u.mfaFactors.length > 0).length / users.length) * 100,
  ),
  failedLogins24h: loginEvents.filter((l) => l.result === "failure").length,
});
