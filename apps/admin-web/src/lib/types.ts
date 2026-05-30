/**
 * Domain types for the admin console. These mirror the platform data model
 * (see docs/04-data-model.md) and are consumed by the mock data layer in
 * data.ts. When the backend admin API lands, the data layer is swapped for
 * real fetch calls while these types stay stable.
 */

export type Status = "active" | "suspended" | "invited" | "disabled";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: Status;
  plan: "free" | "team" | "enterprise";
  userCount: number;
  appCount: number;
  createdAt: string;
};

export type AppType = "web" | "spa" | "native" | "m2m";

export type Application = {
  id: string;
  tenantId: string;
  name: string;
  clientId: string;
  type: AppType;
  status: Status;
  grantTypes: string[];
  scopes: string[];
  redirectUris: string[];
  createdAt: string;
};

export type MfaFactorType = "passkey" | "totp" | "sms" | "email" | "push";

export type MfaFactor = {
  id: string;
  type: MfaFactorType;
  label: string;
  verified: boolean;
  addedAt: string;
};

export type User = {
  id: string;
  tenantId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  status: Status;
  emailVerified: boolean;
  roleIds: string[];
  mfaFactors: MfaFactor[];
  lastLoginAt: string | null;
  createdAt: string;
};

export type Permission = {
  id: string;
  key: string;
  resource: string;
  action: string;
  description: string;
};

export type Role = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  isComposite: boolean;
  permissionIds: string[];
  childRoleIds: string[];
  userCount: number;
};

export type AuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
  result: "success" | "failure";
};

export type LoginEvent = {
  id: string;
  userId: string;
  userEmail: string;
  timestamp: string;
  ip: string;
  location: string;
  device: string;
  method: "password" | "passkey" | "totp" | "social";
  result: "success" | "failure" | "mfa_required";
};

export type AuthMethod = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: "primary" | "mfa" | "federation";
};

export type FeatureFlag = {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout: number;
};

export type PasswordPolicy = {
  minLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSymbol: boolean;
  expiryDays: number;
  historyCount: number;
  hashAlgorithm: string;
};
