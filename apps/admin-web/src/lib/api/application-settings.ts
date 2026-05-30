import { apiFetch, appScopeHeaders } from "./client";
import type { EmailSettings, NotificationSettings } from "@/lib/api/settings";
import type { AuthMethod, FeatureFlag, PasswordPolicy } from "@/lib/types";
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
  await apiFetch<void>(`${base(appId)}/auth-methods`, { method: "DELETE" });
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

export { listUsers as listApplicationUsers } from "./users";

export async function grantApplicationUser(appId: string, userId: string): Promise<void> {
  await apiFetch<void>(`/api/admin/v1/applications/${appId}/users/${userId}`, { method: "POST" });
}

export async function revokeApplicationUser(appId: string, userId: string): Promise<void> {
  await apiFetch<void>(`/api/admin/v1/applications/${appId}/users/${userId}`, { method: "DELETE" });
}
