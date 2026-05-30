"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resetUserMfa } from "./data";
import {
  createApplicationApi,
  deleteApplicationApi,
  updateApplicationApi,
} from "./api/applications";
import { createRoleApi, deleteRoleApi, updateRoleApi } from "./api/roles";
import {
  createTenantApi,
  deleteTenantApi,
  updateTenantApi,
} from "./api/tenants";
import {
  createUserApi,
  deleteUserApi,
  setUserStatusApi,
  updateUserApi,
  markUserEmailVerifiedApi,
  resendUserVerificationEmailApi,
  resetUserMfaApi,
  sendUserPasswordResetEmailApi,
} from "./api/users";
import { ApiError } from "./api/client";

function actionError(e: unknown): FormState {
  if (e instanceof ApiError) return fail(e.message);
  if (e instanceof Error) return fail(e.message);
  return fail("Request failed");
}

export type FormState = { ok: boolean; error?: string };

const ok: FormState = { ok: true };
const fail = (error: string): FormState => ({ ok: false, error });

function str(fd: FormData, key: string): string {
  return (fd.get(key) as string | null)?.trim() ?? "";
}

function list(fd: FormData, key: string): string[] {
  // Accept either multiple form entries (checkboxes) or a comma/newline string.
  const all = fd.getAll(key).map((v) => String(v).trim()).filter(Boolean);
  if (all.length > 1) return all;
  const single = all[0] ?? "";
  return single
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ---- Tenants ----

export async function tenantCreateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name");
  if (!name) return fail("Name is required.");
  try {
    await createTenantApi({
      name,
      slug: str(fd, "slug") || slugify(name),
      plan: str(fd, "plan") || "free",
      status: str(fd, "status") || "active",
    });
    revalidatePath("/tenants");
    revalidatePath("/");
    return ok;
  } catch (e) {
    return actionError(e);
  }
}

export async function tenantUpdateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!id) return fail("Missing tenant id.");
  if (!name) return fail("Name is required.");
  try {
    await updateTenantApi(id, {
      name,
      slug: str(fd, "slug") || slugify(name),
      plan: str(fd, "plan") || "free",
      status: str(fd, "status") || "active",
    });
    revalidatePath("/tenants");
    revalidatePath(`/tenants/${id}`);
    revalidatePath("/");
    return ok;
  } catch (e) {
    return actionError(e);
  }
}

export async function tenantDeleteAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (id) await deleteTenantApi(id);
  revalidatePath("/tenants");
  revalidatePath("/");
  redirect("/tenants");
}

// ---- Applications ----

export async function applicationCreateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name");
  const tenantId = str(fd, "tenantId");
  if (!name) return fail("Name is required.");
  if (!tenantId) return fail("Tenant is required.");
  try {
    await createApplicationApi({
      name,
      tenantId,
      clientId: str(fd, "clientId"),
      type: str(fd, "type") || "web",
      status: str(fd, "status") || "active",
      grantTypes: list(fd, "grantTypes"),
      scopes: list(fd, "scopes"),
      redirectUris: list(fd, "redirectUris"),
    });
    revalidatePath("/applications");
    revalidatePath("/tenants");
    revalidatePath("/audit");
    return ok;
  } catch (e) {
    return actionError(e);
  }
}

export async function applicationUpdateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd, "id");
  if (!id) return fail("Missing application id.");
  const name = str(fd, "name");
  if (!name) return fail("Name is required.");
  try {
    await updateApplicationApi(id, {
      name,
      type: str(fd, "type") || "web",
      status: str(fd, "status") || "active",
      grantTypes: list(fd, "grantTypes"),
      scopes: list(fd, "scopes"),
      redirectUris: list(fd, "redirectUris"),
    });
    revalidatePath("/applications");
    revalidatePath(`/applications/${id}`);
    return ok;
  } catch (e) {
    return actionError(e);
  }
}

export async function applicationDeleteAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (id) await deleteApplicationApi(id);
  revalidatePath("/applications");
  revalidatePath("/audit");
  redirect("/applications");
}

// ---- Users ----

export async function userCreateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email");
  const tenantId = str(fd, "tenantId");
  if (!email) return fail("Email is required.");
  if (!tenantId) return fail("Tenant is required.");
  try {
    await createUserApi({
      email,
      tenantId,
      username: str(fd, "username") || email.split("@")[0],
      firstName: str(fd, "firstName"),
      lastName: str(fd, "lastName"),
      status: str(fd, "status") || "invited",
      roleIds: list(fd, "roleIds"),
    });
    revalidatePath("/users");
    revalidatePath("/tenants");
    return ok;
  } catch (e) {
    return actionError(e);
  }
}

export async function userUpdateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd, "id");
  if (!id) return fail("Missing user id.");
  const email = str(fd, "email");
  if (!email) return fail("Email is required.");
  try {
    await updateUserApi(id, {
      email,
      username: str(fd, "username"),
      firstName: str(fd, "firstName"),
      lastName: str(fd, "lastName"),
      status: str(fd, "status") || "active",
      roleIds: list(fd, "roleIds"),
    });
    revalidatePath("/users");
    revalidatePath(`/users/${id}`);
    return ok;
  } catch (e) {
    return actionError(e);
  }
}

export async function userDeleteAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (id) await deleteUserApi(id);
  revalidatePath("/users");
  revalidatePath("/tenants");
  redirect("/users");
}

export async function userResetMfaAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (id) await resetUserMfaApi(id);
  revalidatePath(`/users/${id}`);
}

export async function userSetStatusAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (id && status) await setUserStatusApi(id, status);
  revalidatePath("/users");
  revalidatePath(`/users/${id}`);
  revalidatePath("/tenants");
}

export async function userSendPasswordResetEmailAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (id) await sendUserPasswordResetEmailApi(id);
  revalidatePath(`/users/${id}`);
}

export async function userResendVerificationEmailAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (id) await resendUserVerificationEmailApi(id);
  revalidatePath(`/users/${id}`);
}

export async function userMarkEmailVerifiedAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (id) await markUserEmailVerifiedApi(id);
  revalidatePath(`/users/${id}`);
}

// ---- Roles ----

export async function roleCreateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name");
  const tenantId = str(fd, "tenantId");
  const applicationId = str(fd, "applicationId");
  if (!name) return fail("Name is required.");
  if (!tenantId) return fail("Tenant is required.");
  if (!applicationId) return fail("Application is required.");
  try {
    await createRoleApi({
      name,
      tenantId,
      applicationId,
      description: str(fd, "description"),
      isComposite: str(fd, "isComposite") === "on",
    });
    revalidatePath("/roles");
    return ok;
  } catch (e) {
    return actionError(e);
  }
}

export async function roleUpdateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd, "id");
  if (!id) return fail("Missing role id.");
  const name = str(fd, "name");
  if (!name) return fail("Name is required.");
  try {
    await updateRoleApi(id, {
      name,
      description: str(fd, "description"),
      isComposite: str(fd, "isComposite") === "on",
    });
    revalidatePath("/roles");
    return ok;
  } catch (e) {
    return actionError(e);
  }
}

export async function roleDeleteAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (id) await deleteRoleApi(id);
  revalidatePath("/roles");
  redirect("/roles");
}
