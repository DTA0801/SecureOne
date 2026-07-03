import { redirect } from "next/navigation";
import { drawioDocumentSlug } from "@/lib/confluence/catalog";
import { assetPathFromSegments, isDrawioAssetPath } from "@/lib/confluence/assets";

export const dynamic = "force-dynamic";

/** Legacy diagram URLs redirect to the parent documentation page with inline embeds. */
export default async function ConfluenceDiagramRedirectPage({
  params,
}: {
  params: Promise<{ assetPath: string[] }>;
}) {
  const { assetPath: segments } = await params;
  const assetPath = assetPathFromSegments(segments);

  if (!isDrawioAssetPath(assetPath)) {
    redirect("/confluence/diagrams");
  }

  const slug = drawioDocumentSlug(assetPath) ?? "diagrams";
  redirect(`/confluence/${slug}`);
}
