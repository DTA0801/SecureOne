import type { RecipientGroups } from "@/lib/api/settings";

export const ADMIN_RECIPIENTS_TOKEN = "@admin";

export function groupToken(name: string): string {
  return `@group:${name}`;
}

export function isAdminRecipientsToken(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === ADMIN_RECIPIENTS_TOKEN ||
    normalized === "@adminrecipients" ||
    normalized === "adminrecipients" ||
    normalized === "admin"
  );
}

export function parseGroupToken(value: string): string | null {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("@group:")) {
    const name = trimmed.slice("@group:".length).trim();
    return name || null;
  }
  if (lower.startsWith("group:")) {
    const name = trimmed.slice("group:".length).trim();
    return name || null;
  }
  return null;
}

export function isRecipientToken(value: string): boolean {
  return isAdminRecipientsToken(value) || parseGroupToken(value) !== null;
}

export function labelRecipientEntry(
  value: string,
  recipientGroups: RecipientGroups,
  emailLabels?: Record<string, string>,
): string {
  if (isAdminRecipientsToken(value)) {
    return "All admin recipients";
  }
  const groupName = parseGroupToken(value);
  if (groupName) {
    const count = recipientGroups[groupName]?.length ?? 0;
    return count > 0 ? `Group: ${groupName} (${count})` : `Group: ${groupName}`;
  }
  return emailLabels?.[value] ?? value;
}

export function parseRecipientEntries(text: string): string[] {
  return text
    .split(/[,;\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => (isRecipientToken(entry) ? entry : entry.toLowerCase()));
}
