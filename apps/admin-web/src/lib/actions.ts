"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createApplication,
  createRole,
  createTenant,
  createUser,
  deleteApplication,
  deleteRole,
  deleteTenant,
  deleteUser,
  resetUserMfa,
  updateApplication,
  updateRole,
  updateTenant,
  updateUser,
} from "./data";
import type { AppType, Status } from "./types";

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
  createTenant({
    name,
    slug: str(fd, "slug") || slugify(name),
    plan: (str(fd, "plan") || "free") as "free" | "team" | "enterprise",
    status: (str(fd, "status") || "active") as Status,
  });
  revalidatePath("/tenants");
  return ok;
}

export async function tenantUpdateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!id) return fail("Missing tenant id.");
  if (!name) return fail("Name is required.");
  updateTenant(id, {
    name,
    slug: str(fd, "slug") || slugify(name),
    plan: str(fd, "plan") as "free" | "team" | "enterprise",
    status: str(fd, "status") as Status,
  });
  revalidatePath("/tenants");
  revalidatePath(`/tenants/${id}`);
  return ok;
}

export async function tenantDeleteAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (id) deleteTenant(id);
  revalidatePath("/tenants");
  redirect("/tenants");
}

// ---- Applications ----

export async function applicationCreateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name");
  const tenantId = str(fd, "tenantId");
  if (!name) return fail("Name is required.");
  if (!tenantId) return fail("Tenant is required.");
  createApplication({
    name,
    tenantId,
    clientId: str(fd, "clientId"),
    type: (str(fd, "type") || "web") as AppType,
    status: (str(fd, "status") || "active") as Status,
    grantTypes: list(fd, "grantTypes"),
    scopes: list(fd, "scopes"),
    redirectUris: list(fd, "redirectUris"),
  });
  revalidatePath("/applications");
  return ok;
}

export async function applicationUpdateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd, "id");
  if (!id) return fail("Missing application id.");
  const name = str(fd, "name");
  if (!name) return fail("Name is required.");
  updateApplication(id, {
    name,
    type: str(fd, "type") as AppType,
    status: str(fd, "status") as Status,
    grantTypes: list(fd, "grantTypes"),
    scopes: list(fd, "scopes"),
    redirectUris: list(fd, "redirectUris"),
  });
  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
  return ok;
}

export async function applicationDeleteAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (id) deleteApplication(id);
  revalidatePath("/applications");
  redirect("/applications");
}

// ---- Users ----

export async function userCreateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email");
  const tenantId = str(fd, "tenantId");
  if (!email) return fail("Email is required.");
  if (!tenantId) return fail("Tenant is required.");
  createUser({
    email,
    tenantId,
    username: str(fd, "username") || email.split("@")[0],
    firstName: str(fd, "firstName"),
    lastName: str(fd, "lastName"),
    status: (str(fd, "status") || "invited") as Status,
    roleIds: list(fd, "roleIds"),
  });
  revalidatePath("/users");
  return ok;
}

export async function userUpdateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd, "id");
  if (!id) return fail("Missing user id.");
  const email = str(fd, "email");
  if (!email) return fail("Email is required.");
  updateUser(id, {
    email,
    username: str(fd, "username"),
    firstName: str(fd, "firstName"),
    lastName: str(fd, "lastName"),
    status: str(fd, "status") as Status,
    roleIds: list(fd, "roleIds"),
  });
  revalidatePath("/users");
  revalidatePath(`/users/${id}`);
  return ok;
}

export async function userDeleteAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (id) deleteUser(id);
  revalidatePath("/users");
  redirect("/users");
}

export async function userResetMfaAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (id) resetUserMfa(id);
  revalidatePath(`/users/${id}`);
}

export async function userSetStatusAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  const status = str(fd, "status") as Status;
  if (id && status) updateUser(id, { status });
  revalidatePath("/users");
  revalidatePath(`/users/${id}`);
}

// ---- Roles ----

export async function roleCreateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name");
  const tenantId = str(fd, "tenantId");
  if (!name) return fail("Name is required.");
  if (!tenantId) return fail("Tenant is required.");
  const isComposite = str(fd, "isComposite") === "on";
  createRole({
    name,
    tenantId,
    description: str(fd, "description"),
    isComposite,
    permissionIds: isComposite ? [] : list(fd, "permissionIds"),
    childRoleIds: isComposite ? list(fd, "childRoleIds") : [],
  });
  revalidatePath("/roles");
  return ok;
}

export async function roleUpdateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd, "id");
  if (!id) return fail("Missing role id.");
  const name = str(fd, "name");
  if (!name) return fail("Name is required.");
  const isComposite = str(fd, "isComposite") === "on";
  updateRole(id, {
    name,
    description: str(fd, "description"),
    isComposite,
    permissionIds: isComposite ? [] : list(fd, "permissionIds"),
    childRoleIds: isComposite ? list(fd, "childRoleIds") : [],
  });
  revalidatePath("/roles");
  return ok;
}

export async function roleDeleteAction(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (id) deleteRole(id);
  revalidatePath("/roles");
  redirect("/roles");
}
