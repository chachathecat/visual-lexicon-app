import {
  clearVlxSupabaseAuthCookies,
  createVlxSupabaseServerClient,
  readSupabaseServerConfig,
  type SupabaseServerEnv,
} from "@/lib/supabase/server";

import {
  AUTH_DEFAULT_REDIRECT_PATH,
  normalizeAuthRedirectTarget,
} from "./redirects";

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
const AUTH_TOKEN_HASH_PATTERN = /^[A-Za-z0-9_-]{8,}$/;

export function getSupabaseAuthAvailability({
  env = process.env,
}: {
  env?: SupabaseServerEnv;
} = {}) {
  return readSupabaseServerConfig(env) ? "configured" : "unconfigured";
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
}: {
  next?: unknown;
  origin: string;
}) {
  const safeOrigin = normalizeAuthOrigin(origin);

  if (!safeOrigin) {
    return null;
  }

  const url = new URL("/auth/confirm", safeOrigin);
  url.searchParams.set("next", normalizeAuthRedirectTarget(next));

  return url.toString();
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
  const configuredOrigin = normalizeAuthOrigin(env.NEXT_PUBLIC_APP_URL);

  if (configuredOrigin) {
    return configuredOrigin;
  }

  const host =
    headers.get("x-forwarded-host")?.trim() ?? headers.get("host")?.trim();
  const protocol = headers.get("x-forwarded-proto")?.trim() ?? "http";

  if (
    !host ||
    host.includes("/") ||
    host.includes("\\") ||
    host.includes("@") ||
    !/^https?$/.test(protocol)
  ) {
    return null;
  }

  return normalizeAuthOrigin(`${protocol}://${host}`);
}

export function isSupportedAuthOtpType(value: unknown): value is
  | "email"
  | "magiclink" {
  return value === "email" || value === "magiclink";
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
  env,
  next,
  supabase,
  tokenHash,
  type,
}: {
  next?: unknown;
  tokenHash: unknown;
  type: unknown;
} & GetSupabaseAuthFlowClientOptions): Promise<AuthConfirmationResult> {
  const redirectTo = normalizeAuthRedirectTarget(next);

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
