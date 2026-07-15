import {
  clearVlxSupabaseAuthCookies,
  createVlxSupabaseServerClient,
  readSupabaseServerConfig,
  type SupabaseServerEnv,
} from "@/lib/supabase/server";

import {
  AUTH_DEFAULT_REDIRECT_PATH,
  createLoginRedirectPath,
  normalizeAuthRedirectTarget,
  type AuthLoginStatus,
} from "./redirects";
import { isValidMagicLinkRequestState } from "./request-state";

export type AuthMagicLinkRequestStatus =
  | "invalid_email"
  | "sent"
  | "unavailable";

export type AuthMagicLinkRequestResult = {
  status: AuthMagicLinkRequestStatus;
};

export type AuthConfirmationRejectReason =
  | "missing_token"
  | "provider_rejected"
  | "unsupported_type"
  | "unconfigured";

export type AuthConfirmationResult =
  | {
      status: "confirmed";
      redirectTo: string;
    }
  | {
      status: "rejected";
      reason: AuthConfirmationRejectReason;
      redirectTo: string;
    };

export type AuthLogoutResult = {
  status: "failed" | "signed_out" | "unavailable";
};

export type SupabaseAuthFlowClient = {
  auth: {
    exchangeCodeForSession(code: string): Promise<{ error: unknown | null }>;
    signInWithOtp(input: {
      email: string;
      options: {
        emailRedirectTo: string;
        shouldCreateUser: false;
      };
    }): Promise<{ error: unknown | null }>;
    verifyOtp(input: {
      token_hash: string;
      type: "email" | "magiclink";
    }): Promise<{ error: unknown | null }>;
    signOut(): Promise<{ error: unknown | null }>;
  };
};

type GetSupabaseAuthFlowClientOptions = {
  clearAuthCookies?: () => Promise<unknown>;
  env?: SupabaseServerEnv;
  supabase?: SupabaseAuthFlowClient;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTH_CODE_PATTERN = /^[A-Za-z0-9_-]{8,512}$/;
const AUTH_TOKEN_HASH_PATTERN = /^[A-Za-z0-9_-]{8,512}$/;

export function getSupabaseAuthAvailability({
  env = process.env,
}: {
  env?: SupabaseServerEnv;
} = {}) {
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const appUrlIsInvalid =
    appUrl !== undefined && normalizeAuthOrigin(appUrl) === null;

  return readSupabaseServerConfig(env) && !appUrlIsInvalid
    ? "configured"
    : "unconfigured";
}

export function normalizeAuthEmail(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();

  return EMAIL_PATTERN.test(email) ? email : null;
}

export function normalizeAuthOrigin(value: unknown) {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  try {
    const url = new URL(value);

    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      !url.host ||
      url.username ||
      url.password
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function createAuthConfirmationUrl({
  next,
  origin,
  state,
}: {
  next?: unknown;
  origin: string;
  state: unknown;
}) {
  const safeOrigin = normalizeAuthOrigin(origin);

  if (!safeOrigin || !isValidMagicLinkRequestState(state)) {
    return null;
  }

  const url = new URL("/auth/confirm", safeOrigin);
  url.searchParams.set("next", normalizeAuthRedirectTarget(next));
  url.searchParams.set("state", state);

  return url.toString();
}

export function getForwardedRequestAuthOrigin({
  headers,
}: {
  headers: Pick<Headers, "get">;
}) {
  const forwardedHost = headers.get("x-forwarded-host")?.trim();
  const host = forwardedHost || headers.get("host")?.trim();
  const forwardedProtocol = headers.get("x-forwarded-proto")?.trim();
  const protocol = forwardedProtocol || "http";

  if (
    !host ||
    host.includes(",") ||
    host.includes("/") ||
    host.includes("\\") ||
    host.includes("@") ||
    !/^https?$/.test(protocol)
  ) {
    return null;
  }

  return normalizeAuthOrigin(`${protocol}://${host}`);
}

export function getCanonicalLoginRedirect({
  env = process.env,
  headers,
  next,
  status,
}: {
  env?: SupabaseServerEnv & {
    NEXT_PUBLIC_APP_URL?: string;
  };
  headers: Pick<Headers, "get">;
  next?: unknown;
  status?: AuthLoginStatus;
}) {
  const configuredOrigin = normalizeAuthOrigin(env.NEXT_PUBLIC_APP_URL);

  if (!configuredOrigin) {
    return null;
  }

  const requestOrigin = getForwardedRequestAuthOrigin({ headers });

  if (requestOrigin === configuredOrigin) {
    return null;
  }

  return new URL(
    createLoginRedirectPath({ next, status }),
    configuredOrigin
  ).toString();
}

export function getRequestAuthOrigin({
  env = process.env,
  headers,
}: {
  env?: SupabaseServerEnv & {
    NEXT_PUBLIC_APP_URL?: string;
  };
  headers: Pick<Headers, "get">;
}) {
  const configuredAppUrl = env.NEXT_PUBLIC_APP_URL;
  const configuredOrigin = normalizeAuthOrigin(configuredAppUrl);

  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (configuredAppUrl !== undefined) {
    return null;
  }

  return getForwardedRequestAuthOrigin({ headers });
}

export function isSupportedAuthOtpType(value: unknown): value is
  | "email"
  | "magiclink" {
  return value === "email" || value === "magiclink";
}

export function isValidAuthCode(value: unknown): value is string {
  return typeof value === "string" && AUTH_CODE_PATTERN.test(value);
}

export function isValidAuthTokenHash(value: unknown): value is string {
  return typeof value === "string" && AUTH_TOKEN_HASH_PATTERN.test(value);
}

export async function requestSupabaseMagicLink({
  email,
  emailRedirectTo,
  env,
  supabase,
}: {
  email: unknown;
  emailRedirectTo: string | null;
} & GetSupabaseAuthFlowClientOptions): Promise<AuthMagicLinkRequestResult> {
  const normalizedEmail = normalizeAuthEmail(email);

  if (!normalizedEmail) {
    return {
      status: "invalid_email",
    };
  }

  const client = await getSupabaseAuthFlowClient({ env, supabase });

  if (!client || !emailRedirectTo) {
    return {
      status: "unavailable",
    };
  }

  try {
    await client.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo,
        shouldCreateUser: false,
      },
    });
  } catch {
    return {
      status: "sent",
    };
  }

  return {
    status: "sent",
  };
}

export async function confirmSupabaseMagicLink({
  code,
  env,
  next,
  supabase,
  tokenHash,
  type,
}: {
  code?: unknown;
  next?: unknown;
  tokenHash: unknown;
  type: unknown;
} & GetSupabaseAuthFlowClientOptions): Promise<AuthConfirmationResult> {
  const redirectTo = normalizeAuthRedirectTarget(next);
  const hasCode = code !== null && code !== undefined && code !== "";
  const hasTokenHash =
    tokenHash !== null && tokenHash !== undefined && tokenHash !== "";

  if (hasCode && hasTokenHash) {
    return {
      status: "rejected",
      reason: "provider_rejected",
      redirectTo: AUTH_DEFAULT_REDIRECT_PATH,
    };
  }

  if (hasCode) {
    if (!isValidAuthCode(code)) {
      return {
        status: "rejected",
        reason: "missing_token",
        redirectTo: AUTH_DEFAULT_REDIRECT_PATH,
      };
    }

    const client = await getSupabaseAuthFlowClient({ env, supabase });

    if (!client) {
      return {
        status: "rejected",
        reason: "unconfigured",
        redirectTo: AUTH_DEFAULT_REDIRECT_PATH,
      };
    }

    const { error } = await client.auth
      .exchangeCodeForSession(code)
      .catch(() => ({
        error: true,
      }));

    if (error) {
      return {
        status: "rejected",
        reason: "provider_rejected",
        redirectTo: AUTH_DEFAULT_REDIRECT_PATH,
      };
    }

    return {
      status: "confirmed",
      redirectTo,
    };
  }

  if (!isValidAuthTokenHash(tokenHash)) {
    return {
      status: "rejected",
      reason: "missing_token",
      redirectTo: AUTH_DEFAULT_REDIRECT_PATH,
    };
  }

  if (!isSupportedAuthOtpType(type)) {
    return {
      status: "rejected",
      reason: "unsupported_type",
      redirectTo: AUTH_DEFAULT_REDIRECT_PATH,
    };
  }

  const client = await getSupabaseAuthFlowClient({ env, supabase });

  if (!client) {
    return {
      status: "rejected",
      reason: "unconfigured",
      redirectTo: AUTH_DEFAULT_REDIRECT_PATH,
    };
  }

  const { error } = await client.auth
    .verifyOtp({
      token_hash: tokenHash,
      type,
    })
    .catch(() => ({
      error: true,
    }));

  if (error) {
    return {
      status: "rejected",
      reason: "provider_rejected",
      redirectTo: AUTH_DEFAULT_REDIRECT_PATH,
    };
  }

  return {
    status: "confirmed",
    redirectTo,
  };
}

export async function signOutSupabaseSession({
  clearAuthCookies,
  env,
  supabase,
}: GetSupabaseAuthFlowClientOptions = {}): Promise<AuthLogoutResult> {
  const client = await getSupabaseAuthFlowClient({ env, supabase });

  if (!client) {
    return {
      status: "unavailable",
    };
  }

  const { error } = await client.auth.signOut().catch((caughtError) => ({
    error: caughtError,
  }));

  if (error && !isAuthSessionMissingSignOutError(error)) {
    return {
      status: "failed",
    };
  }

  const clearCookies =
    clearAuthCookies ?? (() => clearVlxSupabaseAuthCookies({ env }));

  try {
    await clearCookies();
  } catch {
    return {
      status: "failed",
    };
  }

  return {
    status: "signed_out",
  };
}

async function getSupabaseAuthFlowClient({
  env,
  supabase,
}: GetSupabaseAuthFlowClientOptions) {
  if (supabase) {
    return supabase;
  }

  const result = await createVlxSupabaseServerClient({ env });

  return result.status === "configured" ? result.client : null;
}

function isAuthSessionMissingSignOutError(error: unknown) {
  const evidence = [
    readErrorString(error, "name"),
    readErrorString(error, "code"),
    readErrorString(error, "message"),
  ]
    .join(" ")
    .toLowerCase();

  return (
    evidence.includes("authsessionmissingerror") ||
    evidence.includes("session_missing") ||
    evidence.includes("session missing") ||
    evidence.includes("missing session")
  );
}

function readErrorString(error: unknown, key: "code" | "message" | "name") {
  if (!error || typeof error !== "object") {
    return "";
  }

  const value = (error as Partial<Record<typeof key, unknown>>)[key];

  return typeof value === "string" ? value : "";
}
