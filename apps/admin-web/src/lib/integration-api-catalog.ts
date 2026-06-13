import { AUTH_SERVER_URL } from "@/lib/config";

export type ApiField = {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
};

export type ApiResponseDoc = {
  status: number;
  description: string;
  example?: string;
};

export type IntegrationApiEndpoint = {
  id: string;
  group: string;
  method: string;
  path: string;
  description: string;
  authUiMode?: "hosted" | "native" | "both";
  auth?: string;
  contentType?: string;
  queryParams?: ApiField[];
  requestFields?: ApiField[];
  requestExample?: string;
  responses?: ApiResponseDoc[];
  notes?: string[];
};

export type ApiCatalogContext = {
  applicationId: string;
  clientId?: string;
  tenantSlug?: string;
};

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function buildIntegrationApiCatalog(ctx: ApiCatalogContext): IntegrationApiEndpoint[] {
  const base = AUTH_SERVER_URL;
  const { applicationId, clientId = "{clientId}", tenantSlug = "{tenantSlug}" } = ctx;

  return [
    {
      id: "oidc-discovery",
      group: "Discovery",
      method: "GET",
      path: `${base}/.well-known/openid-configuration`,
      description: "OIDC provider metadata used to discover authorize, token, JWKS, and userinfo endpoints.",
      authUiMode: "both",
      auth: "None (public)",
      responses: [
        {
          status: 200,
          description: "OIDC configuration document",
          example: json({
            issuer: base,
            authorization_endpoint: `${base}/oauth2/authorize`,
            token_endpoint: `${base}/oauth2/token`,
            jwks_uri: `${base}/oauth2/jwks`,
            userinfo_endpoint: `${base}/userinfo`,
            end_session_endpoint: `${base}/oauth2/logout`,
            scopes_supported: ["openid", "profile", "email"],
            response_types_supported: ["code"],
            grant_types_supported: ["authorization_code", "refresh_token", "client_credentials"],
            code_challenge_methods_supported: ["S256"],
          }),
        },
      ],
    },
    {
      id: "public-manifest",
      group: "Discovery",
      method: "GET",
      path: `${base}/api/v1/applications/${applicationId}`,
      description: "Unauthenticated manifest for client apps — auth methods, feature flags, password policy, branding.",
      authUiMode: "both",
      auth: "None (public; requires Public API enabled in settings)",
      responses: [
        {
          status: 200,
          description: "Application manifest",
          example: json({
            application: { id: applicationId, name: "My App", status: "active" },
            authMethods: [{ id: "m_password", enabled: true, implemented: true }],
            featureFlags: [{ key: "self_service_recovery", enabled: true }],
            passwordPolicy: {
              minLength: 12,
              requireUppercase: true,
              requireNumber: true,
              requireSymbol: true,
              requirements: [
                { key: "minLength", label: "At least 12 characters" },
                { key: "uppercase", label: "One uppercase letter (A–Z)" },
                { key: "number", label: "One number (0–9)" },
                { key: "symbol", label: "One symbol (!@#$… )" },
              ],
            },
            account: {
              forgotPasswordEndpoint: `/api/v1/applications/${applicationId}/account/password/forgot`,
              sessionLoginEndpoint: `/api/v1/applications/${applicationId}/auth/session/login`,
              loginIdentifier: "email",
              loginEmailHint: "user@example.com",
              hostedLoginPage: `/login.html?applicationId=${applicationId}`,
            },
          }),
        },
        { status: 404, description: "Manifest disabled or application not found" },
      ],
      notes: ["Enable under Settings → Public API before calling from your client."],
    },
    {
      id: "signup-options",
      group: "Discovery",
      method: "GET",
      path: `${base}/api/v1/applications/${applicationId}/signup`,
      description: "Signup availability, password rules, and hints for building a registration form.",
      authUiMode: "both",
      auth: "None (public)",
      responses: [
        {
          status: 200,
          description: "Signup configuration",
          example: json({
            applicationId,
            applicationName: "My App",
            signupEnabled: true,
            signupEndpoint: `/api/v1/applications/${applicationId}/signup`,
            passwordPolicy: {
              minLength: 12,
              requireUppercase: true,
              requireNumber: true,
              requireSymbol: true,
              requirements: [
                { key: "minLength", label: "At least 12 characters" },
                { key: "uppercase", label: "One uppercase letter (A–Z)" },
                { key: "number", label: "One number (0–9)" },
                { key: "symbol", label: "One symbol (!@#$… )" },
              ],
            },
            loginEmailHint: "your@email.com",
          }),
        },
      ],
    },
    {
      id: "oauth-authorize",
      group: "Sign-in",
      method: "GET",
      path: `${base}/oauth2/authorize`,
      description: "Hosted login — redirect the browser here to start the authorization code + PKCE flow.",
      authUiMode: "hosted",
      auth: "Browser redirect (session cookie set after login)",
      queryParams: [
        { name: "response_type", type: "string", required: true, description: "Must be code" },
        { name: "client_id", type: "string", required: true, description: `Your OAuth client ID (e.g. ${clientId})` },
        { name: "redirect_uri", type: "string", required: true, description: "Must match a registered redirect URI" },
        { name: "scope", type: "string", required: true, description: "Space-separated scopes, e.g. openid profile email" },
        { name: "state", type: "string", required: true, description: "CSRF token your app validates on callback" },
        { name: "code_challenge", type: "string", required: true, description: "PKCE S256 challenge" },
        { name: "code_challenge_method", type: "string", required: true, description: "S256" },
      ],
      responses: [
        { status: 302, description: "Redirect to login or back to redirect_uri with ?code=&state=" },
        { status: 400, description: "Invalid client_id, redirect_uri, or PKCE parameters" },
      ],
      notes: [
        "After native session login, navigate here in the same browser to complete token exchange.",
      ],
    },
    {
      id: "session-login",
      group: "Sign-in",
      method: "POST",
      path: `${base}/api/v1/applications/${applicationId}/auth/session/login`,
      description:
        "Native login — email and password only; tenant is resolved from applicationId. Sets an auth-server session cookie.",
      authUiMode: "native",
      auth: "None (public); sets session cookie on success",
      contentType: "application/json",
      requestFields: [
        { name: "email", type: "string (email)", required: true, description: "User email address" },
        { name: "password", type: "string", required: true, description: "User password (1–128 chars)" },
      ],
      requestExample: json({ email: "user@example.com", password: "••••••••" }),
      responses: [
        { status: 204, description: "Login succeeded; session cookie set" },
        {
          status: 401,
          description: "Invalid credentials",
          example: json({
            type: "about:blank",
            title: "Unauthorized",
            status: 401,
            detail: "Invalid email or password.",
          }),
        },
      ],
      notes: [
        "Call with credentials: 'include' from your SPA origin (CORS must allow your app).",
        "Follow with top-level navigation to /oauth2/authorize to obtain tokens.",
        "Legacy POST /api/v1/auth/session/login (tenantSlug + email) is deprecated.",
      ],
    },
    {
      id: "oauth-token",
      group: "Tokens",
      method: "POST",
      path: `${base}/oauth2/token`,
      description: "Exchange authorization code or refresh token for access and refresh tokens.",
      authUiMode: "both",
      auth: "Public clients: none + PKCE. Confidential clients: client_secret_basic or client_secret_post",
      contentType: "application/x-www-form-urlencoded",
      requestFields: [
        { name: "grant_type", type: "string", required: true, description: "authorization_code | refresh_token" },
        { name: "code", type: "string", description: "Authorization code (authorization_code grant)" },
        { name: "redirect_uri", type: "string", description: "Same redirect_uri used in /authorize" },
        { name: "client_id", type: "string", required: true, description: "OAuth client ID" },
        { name: "code_verifier", type: "string", description: "PKCE verifier (public clients)" },
        { name: "refresh_token", type: "string", description: "Refresh token (refresh_token grant)" },
      ],
      requestExample: [
        "# Authorization code exchange",
        "grant_type=authorization_code",
        `&code={authorization_code}`,
        `&redirect_uri=http://localhost:5173/callback`,
        `&client_id=${clientId}`,
        "&code_verifier={pkce_verifier}",
      ].join(""),
      responses: [
        {
          status: 200,
          description: "Token response",
          example: json({
            access_token: "eyJhbG…",
            token_type: "Bearer",
            expires_in: 3600,
            refresh_token: "rt_…",
            scope: "openid profile email",
            id_token: "eyJhbG…",
          }),
        },
        { status: 400, description: "Invalid grant, code, or client credentials" },
        { status: 401, description: "Invalid client authentication" },
      ],
    },
    {
      id: "oauth-revoke",
      group: "Tokens",
      method: "POST",
      path: `${base}/oauth2/revoke`,
      description: "Revoke a refresh or access token (RFC 7009). Call on logout.",
      authUiMode: "both",
      auth: "Client authentication for confidential clients",
      contentType: "application/x-www-form-urlencoded",
      requestFields: [
        { name: "token", type: "string", required: true, description: "Refresh or access token to revoke" },
        { name: "token_type_hint", type: "string", description: "refresh_token | access_token (optional)" },
        { name: "client_id", type: "string", required: true, description: "OAuth client ID" },
      ],
      requestExample: `token={refresh_token}&token_type_hint=refresh_token&client_id=${clientId}`,
      responses: [
        { status: 200, description: "Token revoked (always returns 200 per RFC 7009)" },
      ],
    },
    {
      id: "oauth-logout",
      group: "Session",
      method: "GET",
      path: `${base}/oauth2/logout`,
      description: "OIDC end-session — clears auth-server session and optionally redirects back to your app.",
      authUiMode: "hosted",
      auth: "Browser redirect",
      queryParams: [
        { name: "id_token_hint", type: "string", description: "ID token from last login (recommended)" },
        { name: "post_logout_redirect_uri", type: "string", description: "Registered post-logout redirect URI" },
        { name: "state", type: "string", description: "Opaque value returned after logout" },
      ],
      responses: [
        { status: 302, description: "Session cleared; redirect to post_logout_redirect_uri if provided" },
      ],
    },
    {
      id: "userinfo",
      group: "Profile",
      method: "GET",
      path: `${base}/userinfo`,
      description: "Standard OIDC userinfo claims for the signed-in user.",
      authUiMode: "both",
      auth: "Authorization: Bearer {access_token}",
      responses: [
        {
          status: 200,
          description: "OIDC claims",
          example: json({
            sub: "00000000-0000-0000-0000-000000000001",
            email: "user@example.com",
            email_verified: true,
            name: "Jane Doe",
            preferred_username: `${tenantSlug}:user@example.com`,
          }),
        },
        { status: 401, description: "Missing or invalid access token" },
      ],
    },
    {
      id: "account-profile",
      group: "Profile",
      method: "GET",
      path: `${base}/api/v1/account/profile`,
      description: "Extended account profile beyond OIDC userinfo — tenant, status, password flag.",
      authUiMode: "both",
      auth: "Authorization: Bearer {access_token}",
      responses: [
        {
          status: 200,
          description: "Profile object",
          example: json({
            id: "00000000-0000-0000-0000-000000000001",
            sub: "00000000-0000-0000-0000-000000000001",
            email: "user@example.com",
            emailVerified: true,
            displayName: "Jane Doe",
            status: "ACTIVE",
            hasPassword: true,
            tenantSlug,
            tenantName: "Your Tenant",
          }),
        },
        { status: 401, description: "Missing or invalid access token" },
      ],
    },
    {
      id: "password-forgot",
      group: "Password",
      method: "POST",
      path: `${base}/api/v1/applications/${applicationId}/account/password/forgot`,
      description:
        "Request a password reset email for this application. Email only — tenant resolved server-side. Same generic response always.",
      authUiMode: "both",
      auth: "None (public; requires self_service_recovery feature flag for this app)",
      contentType: "application/json",
      requestFields: [
        { name: "email", type: "string (email)", required: true, description: "Account email" },
      ],
      requestExample: json({ email: "user@example.com" }),
      responses: [
        {
          status: 200,
          description: "Generic success (sent if account exists)",
          example: json({
            message: "Password reset link has been sent.",
          }),
        },
        { status: 400, description: "Validation error (invalid email)" },
        { status: 500, description: "Self-service recovery disabled for this application" },
      ],
      notes: ["Legacy POST /api/v1/account/password/forgot (tenantSlug + email) is deprecated."],
    },
    {
      id: "password-reset",
      group: "Password",
      method: "POST",
      path: `${base}/api/v1/account/password/reset`,
      description: "Complete password reset using the token from the email link.",
      authUiMode: "both",
      auth: "None (public)",
      contentType: "application/json",
      requestFields: [
        { name: "token", type: "string", required: true, description: "Token from reset email URL" },
        { name: "password", type: "string", required: true, description: "New password (8–128 chars)" },
      ],
      requestExample: json({ token: "{token_from_email}", password: "NewSecurePass1!" }),
      responses: [
        {
          status: 200,
          description: "Password updated",
          example: json({ message: "Password updated. You can sign in with your new password." }),
        },
        { status: 400, description: "Invalid or expired token, or password policy violation" },
      ],
    },
    {
      id: "password-change",
      group: "Password",
      method: "POST",
      path: `${base}/api/v1/account/password/change`,
      description: "Change password while signed in.",
      authUiMode: "both",
      auth: "Authorization: Bearer {access_token}",
      contentType: "application/json",
      requestFields: [
        { name: "currentPassword", type: "string", required: true, description: "Existing password" },
        { name: "newPassword", type: "string", required: true, description: "New password (8–128 chars)" },
      ],
      requestExample: json({ currentPassword: "OldPass1!", newPassword: "NewPass1!" }),
      responses: [
        {
          status: 200,
          description: "Password changed",
          example: json({ message: "Password updated successfully." }),
        },
        { status: 401, description: "Wrong current password or invalid token" },
      ],
      notes: ["Optional header: X-Application-Id for application-scoped password policy."],
    },
    {
      id: "signup",
      group: "Signup",
      method: "POST",
      path: `${base}/api/v1/applications/${applicationId}/signup`,
      description: "Self-service user registration for this application.",
      authUiMode: "both",
      auth: "None (public; signup must be enabled)",
      contentType: "application/json",
      requestFields: [
        { name: "email", type: "string (email)", required: true, description: "User email" },
        { name: "password", type: "string", required: true, description: "Password (8–128 chars)" },
        { name: "firstName", type: "string", description: "Optional given name" },
        { name: "lastName", type: "string", description: "Optional family name" },
        { name: "displayName", type: "string", description: "Optional display name" },
      ],
      requestExample: json({
        email: "newuser@example.com",
        password: "SecurePass1!",
        firstName: "Jane",
        lastName: "Doe",
      }),
      responses: [
        {
          status: 200,
          description: "Account created",
          example: json({
            message: "Account created. Check your inbox for a verification link, then sign in with your email and password.",
            userId: "…",
            loginUsername: `${tenantSlug}:newuser@example.com`,
            emailVerificationRequired: true,
            verificationEmailSent: true,
          }),
        },
        { status: 409, description: "Email already registered" },
        { status: 400, description: "Validation or password policy error" },
      ],
    },
  ];
}
