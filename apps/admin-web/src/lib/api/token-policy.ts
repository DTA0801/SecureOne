import { apiFetch } from "./client";

export type TokenPolicy = {
  tabEnabled?: boolean;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  authorizationCodeTtlSeconds: number;
  idTokenTtlSeconds: number;
  clientCredentialsTtlSeconds: number;
  deviceCodeTtlSeconds: number;
  refreshTokensEnabled: boolean;
  reuseRefreshTokens: boolean;
  rotateRefreshTokens: boolean;
  refreshTokenReuseDetection: boolean;
  scope?: string;
  inheritsPlatformDefaults?: boolean;
};

export async function fetchPlatformTokenPolicy(): Promise<TokenPolicy> {
  return apiFetch<TokenPolicy>("/api/admin/v1/settings/token-policy");
}

export async function savePlatformTokenPolicy(body: TokenPolicy): Promise<TokenPolicy> {
  return apiFetch<TokenPolicy>("/api/admin/v1/settings/token-policy", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
