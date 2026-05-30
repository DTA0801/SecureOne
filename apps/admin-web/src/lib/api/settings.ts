import { apiFetch } from "./client";
import type { UiPreferences } from "@/lib/theme/types";

export async function fetchAppearancePrefs(): Promise<Partial<UiPreferences>> {
  const data = await apiFetch<Partial<UiPreferences>>("/api/admin/v1/settings/appearance");
  return data ?? {};
}

export async function saveAppearancePrefs(prefs: UiPreferences): Promise<void> {
  await apiFetch("/api/admin/v1/settings/appearance", {
    method: "PUT",
    body: JSON.stringify(prefs),
  });
}

export type NotificationSettings = {
  emailEnabled?: boolean;
  /** End-user mail: verify email, password reset, password changed */
  userEmailEnabled?: boolean;
  pushEnabled?: boolean;
  auditAlertsEnabled?: boolean;
  securityAlertsEnabled?: boolean;
  adminRecipients?: string[];
  smtpConfigured?: boolean;
};

export type EmailSettings = {
  fromName?: string;
  fromAddress?: string;
  replyTo?: string;
  smtpConfigured?: boolean;
};

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  return apiFetch<NotificationSettings>("/api/admin/v1/settings/notifications");
}

export async function fetchEmailSettings(): Promise<EmailSettings> {
  return apiFetch<EmailSettings>("/api/admin/v1/settings/email");
}

export async function saveNotificationSettings(
  body: NotificationSettings & { adminRecipients?: string[] },
): Promise<void> {
  await apiFetch("/api/admin/v1/settings/notifications", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function saveEmailSettings(body: EmailSettings): Promise<void> {
  await apiFetch("/api/admin/v1/settings/email", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
