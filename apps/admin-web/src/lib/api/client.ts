import { AUTH_SERVER_URL } from "@/lib/config";

const DEV_USER = process.env.SECUREONE_DEV_USER ?? "admin";
const DEV_PASSWORD = process.env.SECUREONE_DEV_PASSWORD ?? "admin";
const ACT_AS_EMAIL = process.env.SECUREONE_ACT_AS_EMAIL;

function authHeader(): string {
  const token = Buffer.from(`${DEV_USER}:${DEV_PASSWORD}`).toString("base64");
  return `Basic ${token}`;
}

/** Headers for application-scoped admin API calls. */
export function appScopeHeaders(applicationId: string): Record<string, string> {
  const headers: Record<string, string> = { "X-Application-Id": applicationId };
  if (ACT_AS_EMAIL) headers["X-Act-As-Email"] = ACT_AS_EMAIL;
  return headers;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${AUTH_SERVER_URL}${path}`;
  const baseHeaders: Record<string, string> = {
    Authorization: authHeader(),
    Accept: "application/json",
  };
  if (ACT_AS_EMAIL) baseHeaders["X-Act-As-Email"] = ACT_AS_EMAIL;
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      ...baseHeaders,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const detail =
      typeof body === "object" && body !== null && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : `HTTP ${res.status}`;
    throw new ApiError(detail, res.status, body);
  }

  return body as T;
}
