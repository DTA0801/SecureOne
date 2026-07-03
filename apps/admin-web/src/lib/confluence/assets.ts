import path from "path";

export function docsRoot(): string {
  return path.join(process.cwd(), "..", "..", "docs");
}

/** Resolve a docs-relative asset path; returns null if invalid or escapes docs root. */
export function resolveDocsAssetPath(segments: string[]): string | null {
  const joined = path.posix.normalize(segments.join("/"));
  if (joined.startsWith("..") || path.isAbsolute(joined)) return null;
  const abs = path.join(docsRoot(), ...joined.split("/"));
  const root = path.resolve(docsRoot());
  const resolved = path.resolve(abs);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) return null;
  return resolved;
}

export function isDrawioAssetPath(assetPath: string): boolean {
  return assetPath.toLowerCase().endsWith(".drawio");
}

export function assetPathFromSegments(segments: string[]): string {
  return segments.join("/");
}

export function contentTypeForAsset(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".drawio":
      return "application/xml";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
