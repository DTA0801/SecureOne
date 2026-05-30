import { AUTH_SERVER_URL } from "@/lib/config";

const DEV_USER = process.env.SECUREONE_DEV_USER ?? "admin";
const DEV_PASSWORD = process.env.SECUREONE_DEV_PASSWORD ?? "admin";

function authHeader(): string {
  const token = Buffer.from(`${DEV_USER}:${DEV_PASSWORD}`).toString("base64");
  return `Basic ${token}`;
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
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
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
