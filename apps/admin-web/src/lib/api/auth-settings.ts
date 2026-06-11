import { browserApiFetch as apiFetch } from "./browser-client";
import type { AuthMethod, FeatureFlag, PasswordPolicy } from "@/lib/types";

type AuthMethodDto = AuthMethod & { implemented?: boolean; available?: boolean };

export async function fetchAuthMethods(): Promise<AuthMethodDto[]> {
  return apiFetch<AuthMethodDto[]>("/api/admin/v1/settings/auth-methods");
}

export async function saveAuthMethods(body: AuthMethodDto[]): Promise<AuthMethodDto[]> {
  return apiFetch<AuthMethodDto[]>("/api/admin/v1/settings/auth-methods", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function fetchPasswordPolicy(): Promise<PasswordPolicy> {
  return apiFetch<PasswordPolicy>("/api/admin/v1/settings/password-policy");
}

export async function savePasswordPolicy(body: PasswordPolicy): Promise<PasswordPolicy> {
  return apiFetch<PasswordPolicy>("/api/admin/v1/settings/password-policy", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  return apiFetch<FeatureFlag[]>("/api/admin/v1/settings/feature-flags");
}

export async function saveFeatureFlags(body: FeatureFlag[]): Promise<FeatureFlag[]> {
  return apiFetch<FeatureFlag[]>("/api/admin/v1/settings/feature-flags", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
