import { apiFetch, appScopeHeaders } from "./client";
import type { EmailSettings, NotificationSettings } from "@/lib/api/settings";
import type { AuthMethod, FeatureFlag, PasswordPolicy } from "@/lib/types";
import type { TokenPolicy } from "./token-policy";
import type { AppSettingsExposure } from "./app-exposure";

const base = (appId: string) => `/api/admin/v1/applications/${appId}/settings`;

function scoped(appId: string, init?: RequestInit): RequestInit {
  return { ...init, headers: { ...appScopeHeaders(appId), ...(init?.headers as Record<string, string>) } };
}

export type ApplicationSettingsWorkspace = {
  exposure: AppSettingsExposure;
  notifications?: NotificationSettings;
  email?: EmailSettings;
  authMethods?: AuthMethod[];
  passwordPolicy?: PasswordPolicy;
  featureFlags?: FeatureFlag[];
  appearance?: Record<string, unknown>;
};

export async function fetchApplicationSettingsWorkspace(
  appId: string,
): Promise<ApplicationSettingsWorkspace> {
  return apiFetch<ApplicationSettingsWorkspace>(`${base(appId)}/workspace`, scoped(appId));
}

export async function fetchApplicationNotifications(appId: string): Promise<NotificationSettings> {
  return apiFetch<NotificationSettings>(`${base(appId)}/notifications`, scoped(appId));
}

export async function saveApplicationNotifications(
  appId: string,
  body: NotificationSettings,
): Promise<NotificationSettings> {
  return apiFetch<NotificationSettings>(
    `${base(appId)}/notifications`,
    scoped(appId, { method: "PUT", body: JSON.stringify(body) }),
  );
}

export async function resetApplicationNotifications(appId: string): Promise<void> {
  await apiFetch<void>(`${base(appId)}/notifications`, scoped(appId, { method: "DELETE" }));
}

export async function fetchApplicationEmail(appId: string): Promise<EmailSettings> {
  return apiFetch<EmailSettings>(`${base(appId)}/email`, scoped(appId));
}

export async function saveApplicationEmail(appId: string, body: EmailSettings): Promise<EmailSettings> {
  return apiFetch<EmailSettings>(
    `${base(appId)}/email`,
    scoped(appId, { method: "PUT", body: JSON.stringify(body) }),
  );
}

export async function resetApplicationEmail(appId: string): Promise<void> {
  await apiFetch<void>(`${base(appId)}/email`, scoped(appId, { method: "DELETE" }));
}

export async function fetchApplicationAuthMethods(appId: string): Promise<AuthMethod[]> {
  return apiFetch<AuthMethod[]>(`${base(appId)}/auth-methods`, scoped(appId));
}

export async function saveApplicationAuthMethods(appId: string, body: AuthMethod[]): Promise<AuthMethod[]> {
  return apiFetch<AuthMethod[]>(
    `${base(appId)}/auth-methods`,
    scoped(appId, { method: "PUT", body: JSON.stringify(body) }),
  );
}

export async function resetApplicationAuthMethods(appId: string): Promise<void> {
  await apiFetch<void>(`${base(appId)}/auth-methods`, scoped(appId, { method: "DELETE" }));
}

export async function fetchApplicationAppearance(appId: string): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(`${base(appId)}/appearance`, scoped(appId));
}

export async function saveApplicationAppearance(
  appId: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(
    `${base(appId)}/appearance`,
    scoped(appId, { method: "PUT", body: JSON.stringify(body) }),
  );
}

export async function resetApplicationAppearance(appId: string): Promise<void> {
  await apiFetch<void>(`${base(appId)}/appearance`, scoped(appId, { method: "DELETE" }));
}

export async function fetchApplicationPasswordPolicy(appId: string): Promise<PasswordPolicy> {
  return apiFetch<PasswordPolicy>(`${base(appId)}/password-policy`, scoped(appId));
}

export async function saveApplicationPasswordPolicy(
  appId: string,
  body: PasswordPolicy,
): Promise<PasswordPolicy> {
  return apiFetch<PasswordPolicy>(
    `${base(appId)}/password-policy`,
    scoped(appId, { method: "PUT", body: JSON.stringify(body) }),
  );
}

export async function resetApplicationPasswordPolicy(appId: string): Promise<void> {
  await apiFetch<void>(`${base(appId)}/password-policy`, scoped(appId, { method: "DELETE" }));
}

export async function fetchApplicationFeatureFlags(appId: string): Promise<FeatureFlag[]> {
  return apiFetch<FeatureFlag[]>(`${base(appId)}/feature-flags`, scoped(appId));
}

export async function saveApplicationFeatureFlags(
  appId: string,
  body: FeatureFlag[],
): Promise<FeatureFlag[]> {
  return apiFetch<FeatureFlag[]>(
    `${base(appId)}/feature-flags`,
    scoped(appId, { method: "PUT", body: JSON.stringify(body) }),
  );
}

export async function resetApplicationFeatureFlags(appId: string): Promise<void> {
  await apiFetch<void>(`${base(appId)}/feature-flags`, scoped(appId, { method: "DELETE" }));
}

export type ApplicationTokenTabState = {
  platformExposed: boolean;
  tabEnabled: boolean;
};

export type ApplicationMfaTabState = {
  platformExposed: boolean;
  tabEnabled: boolean;
};

export async function fetchApplicationTokenTabState(appId: string): Promise<ApplicationTokenTabState> {
  return apiFetch<ApplicationTokenTabState>(`${base(appId)}/token-policy/tab-state`, scoped(appId));
}

export async function setApplicationTokenTabEnabled(
  appId: string,
  enabled: boolean,
): Promise<ApplicationTokenTabState> {
  return apiFetch<ApplicationTokenTabState>(
    `${base(appId)}/token-policy/tab-enabled`,
    scoped(appId, { method: "PUT", body: JSON.stringify({ enabled }) }),
  );
}

export async function fetchApplicationMfaTabState(appId: string): Promise<ApplicationMfaTabState> {
  return apiFetch<ApplicationMfaTabState>(`${base(appId)}/mfa-tab/tab-state`, scoped(appId));
}

export async function setApplicationMfaTabEnabled(
  appId: string,
  enabled: boolean,
): Promise<ApplicationMfaTabState> {
  return apiFetch<ApplicationMfaTabState>(
    `${base(appId)}/mfa-tab/tab-enabled`,
    scoped(appId, { method: "PUT", body: JSON.stringify({ enabled }) }),
  );
}

export async function fetchApplicationTokenPolicy(appId: string): Promise<TokenPolicy> {
  return apiFetch<TokenPolicy>(`${base(appId)}/token-policy`, scoped(appId));
}

export async function saveApplicationTokenPolicy(appId: string, body: TokenPolicy): Promise<TokenPolicy> {
  return apiFetch<TokenPolicy>(
    `${base(appId)}/token-policy`,
    scoped(appId, { method: "PUT", body: JSON.stringify(body) }),
  );
}

export async function resetApplicationTokenPolicy(appId: string): Promise<void> {
  await apiFetch<void>(`${base(appId)}/token-policy`, scoped(appId, { method: "DELETE" }));
}

export { listUsers as listApplicationUsers } from "./users";

export async function grantApplicationUser(appId: string, userId: string): Promise<void> {
  await apiFetch<void>(`/api/admin/v1/applications/${appId}/users/${userId}`, { method: "POST" });
}

export async function revokeApplicationUser(appId: string, userId: string): Promise<void> {
  await apiFetch<void>(`/api/admin/v1/applications/${appId}/users/${userId}`, { method: "DELETE" });
}
