import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session-server";
import { confluenceCatalogJson } from "@/lib/confluence/catalog";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(confluenceCatalogJson());
}
