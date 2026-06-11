import { AUTH_SERVER_URL } from "@/lib/config";
import { buildBasicAuthHeader } from "@/lib/auth/session-shared";
import { ApiError } from "./http";

const DEV_USER = process.env.SECUREONE_DEV_USER ?? "admin";
const DEV_PASSWORD = process.env.SECUREONE_DEV_PASSWORD ?? "admin";
const ACT_AS_EMAIL = process.env.SECUREONE_ACT_AS_EMAIL;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function devAuthHeader(): string {
  const token = Buffer.from(`${DEV_USER}:${DEV_PASSWORD}`).toString("base64");
  return `Basic ${token}`;
}

/**
 * Admin API fetch safe for client components.
 * Browser: proxies through /api/proxy with session cookie.
 * SSR: direct auth-server with dev credentials (hydration refetches in browser when needed).
 */
export async function browserApiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const normalized = path.startsWith("/") ? path.slice(1) : path;

  const baseHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(init?.body ? { "Content-Type": "application/json" } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (ACT_AS_EMAIL) baseHeaders["X-Act-As-Email"] = ACT_AS_EMAIL;

  const url = isBrowser()
    ? `/api/proxy/${normalized}`
    : `${AUTH_SERVER_URL}/${normalized}`;

  if (!isBrowser()) {
    baseHeaders.Authorization = devAuthHeader();
  }

  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    credentials: isBrowser() ? "same-origin" : undefined,
    headers: baseHeaders,
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

/** @deprecated Use browserApiFetch */
export const apiFetch = browserApiFetch;
