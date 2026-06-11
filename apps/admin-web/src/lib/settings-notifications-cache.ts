import type { AdminRecipientOption, RecipientUserOption } from "@/lib/actions/settings";
import type {
  EmailSettings,
  EmailTemplatesMap,
  NotificationSettings,
  SmtpSettings,
} from "@/lib/api/settings";

export type NotificationsBundle = {
  notifications: NotificationSettings;
  email: EmailSettings;
  smtp: SmtpSettings;
  templates: EmailTemplatesMap;
  emailTestUiEnabled: boolean;
  adminOptions: AdminRecipientOption[];
  allUsers: RecipientUserOption[];
  adminRecipients: string[];
  errors: string;
};

const bundleCache = new Map<string, NotificationsBundle>();
const inflight = new Map<string, Promise<NotificationsBundle>>();

export function notificationsCacheKey(applicationId?: string): string {
  return applicationId ?? "platform";
}

export function getCachedNotificationsBundle(applicationId?: string): NotificationsBundle | undefined {
  return bundleCache.get(notificationsCacheKey(applicationId));
}

export function setCachedNotificationsBundle(applicationId: string | undefined, bundle: NotificationsBundle): void {
  bundleCache.set(notificationsCacheKey(applicationId), bundle);
}

export function patchCachedNotificationsBundle(
  applicationId: string | undefined,
  patch: Partial<Pick<NotificationsBundle, "notifications" | "email" | "smtp" | "templates">>,
): void {
  const key = notificationsCacheKey(applicationId);
  const current = bundleCache.get(key);
  if (!current) return;
  bundleCache.set(key, { ...current, ...patch });
}

export async function loadNotificationsBundleDeduped(
  applicationId: string | undefined,
  loader: () => Promise<NotificationsBundle>,
): Promise<NotificationsBundle> {
  const key = notificationsCacheKey(applicationId);
  const cached = bundleCache.get(key);
  if (cached) return cached;

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = loader()
    .then((bundle) => {
      bundleCache.set(key, bundle);
      inflight.delete(key);
      return bundle;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });

  inflight.set(key, promise);
  return promise;
}
