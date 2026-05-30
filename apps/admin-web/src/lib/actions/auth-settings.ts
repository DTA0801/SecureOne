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

export async function loadAuthSettingsAction(): Promise<{
  authMethods: AuthMethod[];
  featureFlags: FeatureFlag[];
  passwordPolicy: PasswordPolicy;
  error?: string;
}> {
  try {
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

export async function saveAuthMethodsAction(methods: AuthMethod[]): Promise<{ ok: boolean; error?: string }> {
  try {
    await saveAuthMethods(methods);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatError(e) };
  }
}

export async function savePasswordPolicyAction(
  policy: PasswordPolicy,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await savePasswordPolicy(policy);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatError(e) };
  }
}

export async function saveFeatureFlagsAction(
  flags: FeatureFlag[],
): Promise<{ ok: boolean; error?: string }> {
  try {
    await saveFeatureFlags(flags);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatError(e) };
  }
}
