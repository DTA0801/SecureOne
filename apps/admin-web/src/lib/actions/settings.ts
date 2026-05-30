"use server";

import {
  fetchAppearancePrefs,
  fetchEmailSettings,
  fetchNotificationSettings,
  saveAppearancePrefs,
  saveEmailSettings,
  saveNotificationSettings,
  type EmailSettings,
  type NotificationSettings,
} from "@/lib/api/settings";
import { ApiError } from "@/lib/api/client";
import { listAdminUsers, listUsers } from "@/lib/api/users";
import { listRoles } from "@/lib/api/roles";
import type { UiPreferences } from "@/lib/theme/types";

export type AdminRecipientOption = {
  id: string;
  email: string;
  label: string;
  roleNames: string[];
};

export type RecipientUserOption = {
  id: string;
  email: string;
  label: string;
};

function formatSettingsError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 404) {
      return "Auth server is missing settings API — restart apps/auth-server (./gradlew bootRun).";
    }
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return "Request failed";
}

export async function loadAppearanceAction(): Promise<{
  prefs: Partial<UiPreferences>;
  error?: string;
}> {
  try {
    const prefs = await fetchAppearancePrefs();
    return { prefs };
  } catch (e) {
    return { prefs: {}, error: formatSettingsError(e) };
  }
}

export async function saveAppearanceAction(
  prefs: UiPreferences,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await saveAppearancePrefs(prefs);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatSettingsError(e) };
  }
}

export async function loadAdminRecipientOptionsAction(): Promise<{
  adminOptions: AdminRecipientOption[];
  allUsers: RecipientUserOption[];
  error?: string;
}> {
  try {
    const [adminUsers, allAccounts, roles] = await Promise.all([
      listAdminUsers(),
      listUsers(),
      listRoles(),
    ]);
    const roleNameById = new Map(roles.map((r) => [r.id, r.name]));
    const adminOptions: AdminRecipientOption[] = adminUsers.map((u) => {
      const name = `${u.firstName} ${u.lastName}`.trim();
      return {
        id: u.id,
        email: u.email.toLowerCase(),
        label: name || u.email,
        roleNames: u.roleIds
          .map((id) => roleNameById.get(id))
          .filter((n): n is string => Boolean(n)),
      };
    });
    const allUsers: RecipientUserOption[] = allAccounts
      .map((u) => {
        const name = `${u.firstName} ${u.lastName}`.trim();
        return {
          id: u.id,
          email: u.email.toLowerCase(),
          label: name || u.email,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
    return { adminOptions, allUsers };
  } catch (e) {
    return { adminOptions: [], allUsers: [], error: formatSettingsError(e) };
  }
}

export async function loadNotificationsAction(): Promise<{
  notifications: NotificationSettings;
  email: EmailSettings;
  error?: string;
}> {
  try {
    const [notifications, email] = await Promise.all([
      fetchNotificationSettings(),
      fetchEmailSettings(),
    ]);
    return { notifications, email };
  } catch (e) {
    return { notifications: {}, email: {}, error: formatSettingsError(e) };
  }
}

export async function sendTestEmailAction(to: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { apiFetch } = await import("@/lib/api/client");
    await apiFetch("/api/admin/v1/settings/email/test", {
      method: "POST",
      body: JSON.stringify({ to }),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatSettingsError(e) };
  }
}

export async function saveNotificationsAction(input: {
  notifications: NotificationSettings & { adminRecipients?: string[] };
  email: EmailSettings;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await saveNotificationSettings(input.notifications);
    await saveEmailSettings(input.email);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatSettingsError(e) };
  }
}
