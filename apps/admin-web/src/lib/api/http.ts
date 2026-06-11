const ACT_AS_EMAIL = process.env.SECUREONE_ACT_AS_EMAIL;

/** Headers for application-scoped admin API calls. */
export function appScopeHeaders(applicationId: string): Record<string, string> {
  const headers: Record<string, string> = { "X-Application-Id": applicationId };
  if (ACT_AS_EMAIL) headers["X-Act-As-Email"] = ACT_AS_EMAIL;
  return headers;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
