import "server-only";

import { cookies } from "next/headers";
import { decodeSession, type AdminSession } from "./session-shared";

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const raw = jar.get("secureone_admin_session")?.value;
  if (!raw) return null;
  return decodeSession(raw);
}
