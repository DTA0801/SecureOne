"use server";

import {
  fetchAuthMethods,
  fetchFeatureFlags,
  fetchPasswordPolicy,
  saveAuthMethods,
  saveFeatureFlags,
  savePasswordPolicy,
} from "@/lib/api/auth-settings";
import { ApiError } from "@/lib/api/client";
import type { AuthMethod, FeatureFlag, PasswordPolicy } from "@/lib/types";

function formatError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Request failed";
}

export async function loadAuthSettingsAction(applicationId?: string): Promise<{
  authMethods: AuthMethod[];
  featureFlags: FeatureFlag[];
  passwordPolicy: PasswordPolicy;
  error?: string;
}> {
  try {
    if (applicationId) {
      const {
        fetchApplicationAuthMethods,
        fetchApplicationFeatureFlags,
        fetchApplicationPasswordPolicy,
      } = await import("@/lib/api/application-settings");
      const [authMethods, featureFlags, passwordPolicy] = await Promise.all([
        fetchApplicationAuthMethods(applicationId),
        fetchApplicationFeatureFlags(applicationId),
        fetchApplicationPasswordPolicy(applicationId),
      ]);
      return { authMethods, featureFlags, passwordPolicy };
    }
    const [authMethods, featureFlags, passwordPolicy] = await Promise.all([
      fetchAuthMethods(),
      fetchFeatureFlags(),
      fetchPasswordPolicy(),
    ]);
    return { authMethods, featureFlags, passwordPolicy };
  } catch (e) {
    return {
      authMethods: [],
      featureFlags: [],
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireNumber: true,
        requireSymbol: true,
        expiryDays: 0,
        historyCount: 5,
        hashAlgorithm: "bcrypt",
      },
      error: formatError(e),
    };
  }
}

export async function saveAuthMethodsAction(
  methods: AuthMethod[],
  applicationId?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (applicationId) {
      const { saveApplicationAuthMethods } = await import("@/lib/api/application-settings");
      await saveApplicationAuthMethods(applicationId, methods);
      return { ok: true };
    }
    await saveAuthMethods(methods);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatError(e) };
  }
}

export async function savePasswordPolicyAction(
  policy: PasswordPolicy,
  applicationId?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (applicationId) {
      const { saveApplicationPasswordPolicy } = await import("@/lib/api/application-settings");
      const { scope: _s, inheritsPlatformDefaults: _i, ...body } = policy as PasswordPolicy &
        Record<string, unknown>;
      await saveApplicationPasswordPolicy(applicationId, body as PasswordPolicy);
      return { ok: true };
    }
    await savePasswordPolicy(policy);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatError(e) };
  }
}

export async function saveFeatureFlagsAction(
  flags: FeatureFlag[],
  applicationId?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (applicationId) {
      const { saveApplicationFeatureFlags } = await import("@/lib/api/application-settings");
      await saveApplicationFeatureFlags(applicationId, flags);
      return { ok: true };
    }
    await saveFeatureFlags(flags);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatError(e) };
  }
}

export async function resetApplicationAuthSettingsAction(
  applicationId: string,
  section: "auth-methods" | "password-policy" | "feature-flags",
): Promise<{ ok: boolean; error?: string }> {
  try {
    const api = await import("@/lib/api/application-settings");
    if (section === "auth-methods") await api.resetApplicationAuthMethods(applicationId);
    else if (section === "password-policy") await api.resetApplicationPasswordPolicy(applicationId);
    else await api.resetApplicationFeatureFlags(applicationId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatError(e) };
  }
}
