import { NextResponse } from "next/server";
import { AUTH_SERVER_URL } from "@/lib/config";
import {
  buildLoginUsername,
  encodeSession,
  SESSION_COOKIE,
  type AdminSession,
} from "@/lib/auth/session-shared";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    emailOrUsername?: string;
    password?: string;
    tenantSlug?: string;
  };
  const emailOrUsername = body.emailOrUsername?.trim();
  const password = body.password ?? "";
  if (!emailOrUsername || !password) {
    return NextResponse.json({ detail: "Username and password are required." }, { status: 400 });
  }

  const username = buildLoginUsername(body.tenantSlug, emailOrUsername);
  const session: AdminSession = { username, password };

  const res = await fetch(`${AUTH_SERVER_URL}/api/admin/v1/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tenantSlug: body.tenantSlug?.trim() || undefined,
      emailOrUsername,
      password,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    let detail = "Invalid credentials.";
    try {
      const parsed = JSON.parse(text) as { detail?: string };
      if (parsed.detail) detail = parsed.detail;
    } catch {
      // ignore
    }
    return NextResponse.json({ detail }, { status: res.status });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
