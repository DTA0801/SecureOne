/**
 * UUID-shaped id (8-4-4-4-12 hex). Accepts RFC 4122 and dev seed ids such as
 * 22222222-2222-2222-2222-222222222201 (variant nibble is not 8/9/a/b).
 */
const UUID_SHAPE_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Strict RFC 4122 variant (optional checks). */
const UUID_RFC_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_SHAPE_RE.test(value.trim());
}

export function isStrictRfcUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_RFC_RE.test(value.trim());
}

export function filterValidUuids(values: string[]): string[] {
  return values.map((v) => v.trim()).filter((v) => isValidUuid(v));
}
