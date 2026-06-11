"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { APP_NAME } from "@/lib/config";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [tenantSlug, setTenantSlug] = useState("");
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const slug = tenantSlug.trim();
    const identity = emailOrUsername.trim();
    if (slug && identity.toLowerCase() === "admin") {
      setError(
        "Platform super admin does not use a tenant slug. Clear the tenant field and sign in again.",
      );
      setLoading(false);
      return;
    }
    const payload = {
      tenantSlug: slug,
      emailOrUsername: identity,
      password,
    };
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as { detail?: string };
      if (!res.ok) {
        setError(body.detail ?? "Sign-in failed.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Could not reach the login service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-ui bg-ui-surface p-8 shadow-lg">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-on-brand text-lg font-bold">
          S1
        </div>
        <h1 className="text-xl font-semibold text-ui">{APP_NAME} Admin</h1>
        <p className="mt-1 text-sm text-muted">Sign in to manage your platform and applications.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="tenantSlug" className="mb-1 block text-xs font-medium text-soft">
            Tenant slug <span className="text-faint">(leave empty for platform super admin)</span>
          </label>
          <input
            id="tenantSlug"
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
            placeholder="your-tenant"
            className="h-10 w-full rounded-[var(--ui-radius)] border border-ui bg-ui-elevated px-3 text-sm text-ui outline-none focus:border-[var(--ui-primary)] focus:ring-2 focus:ring-brand"
          />
        </div>

        <div>
          <label htmlFor="emailOrUsername" className="mb-1 block text-xs font-medium text-soft">
            Email or username
          </label>
          <input
            id="emailOrUsername"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            placeholder="you@company.com"
            autoComplete="username"
            required
            className="h-10 w-full rounded-[var(--ui-radius)] border border-ui bg-ui-elevated px-3 text-sm text-ui outline-none focus:border-[var(--ui-primary)] focus:ring-2 focus:ring-brand"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-xs font-medium text-soft">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="h-10 w-full rounded-[var(--ui-radius)] border border-ui bg-ui-elevated px-3 pr-16 text-sm text-ui outline-none focus:border-[var(--ui-primary)] focus:ring-2 focus:ring-brand"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-2 px-2 text-xs text-faint hover:text-soft"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-10 w-full rounded-[var(--ui-radius)] bg-brand text-sm font-medium text-on-brand transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-faint">
        Platform operators sign in without a tenant slug. Tenant users enter their tenant slug and
        email.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ui px-4">
      <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
