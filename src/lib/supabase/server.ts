import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const SUPABASE_SERVER_ENV_NAMES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

export type SupabaseServerEnvName = (typeof SUPABASE_SERVER_ENV_NAMES)[number];

export type SupabaseServerEnv = {
  [key: string]: string | undefined;
} & Partial<Record<SupabaseServerEnvName, string>>;

export type SupabaseServerConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

export type SupabaseServerCookieWriteMode = "enabled" | "disabled";

export type VlxSupabaseServerClientResult =
  | {
      status: "configured";
      client: SupabaseClient;
    }
  | {
      status: "unconfigured";
      client: null;
    };

const SUPABASE_AUTH_COOKIE_PATTERN =
  /^sb-[A-Za-z0-9_-]+-auth-token(?:\.[0-9]+)?$/;
const SUPABASE_CODE_VERIFIER_COOKIE_PATTERN =
  /^sb-[A-Za-z0-9_-]+-auth-token-code-verifier$/;

export function readSupabaseServerConfig(
  env: SupabaseServerEnv = process.env
): SupabaseServerConfig | null {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabasePublishableKey =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function readSupabaseProjectRef(supabaseUrl: string) {
  try {
    const host = new URL(supabaseUrl).hostname;
    const [projectRef] = host.split(".");

    if (projectRef && host.endsWith(".supabase.co")) {
      return projectRef;
    }
  } catch {
    return null;
  }

  return null;
}

export function isSupabaseAuthCookieName({
  name,
  projectRef,
}: {
  name: string;
  projectRef?: string | null;
}) {
  if (projectRef) {
    const escapedProjectRef = escapeRegExp(projectRef);
    const projectAuthTokenPattern = new RegExp(
      `^sb-${escapedProjectRef}-auth-token(?:\\.[0-9]+)?$`
    );
    const projectCodeVerifierPattern = new RegExp(
      `^sb-${escapedProjectRef}-auth-token-code-verifier$`
    );

    return (
      projectAuthTokenPattern.test(name) ||
      projectCodeVerifierPattern.test(name)
    );
  }

  return (
    SUPABASE_AUTH_COOKIE_PATTERN.test(name) ||
    SUPABASE_CODE_VERIFIER_COOKIE_PATTERN.test(name)
  );
}

export async function clearVlxSupabaseAuthCookies({
  env = process.env,
}: {
  env?: SupabaseServerEnv;
} = {}) {
  const cookieStore = await cookies();
  const config = readSupabaseServerConfig(env);
  const projectRef = config ? readSupabaseProjectRef(config.supabaseUrl) : null;
  const cookieNames = new Set(
    cookieStore
      .getAll()
      .map((cookie) => cookie.name)
      .filter((name) => isSupabaseAuthCookieName({ name, projectRef }))
  );

  if (projectRef) {
    cookieNames.add(`sb-${projectRef}-auth-token`);
    cookieNames.add(`sb-${projectRef}-auth-token-code-verifier`);
  }

  cookieNames.forEach((name) => {
    cookieStore.set(name, "", {
      expires: new Date(0),
      maxAge: 0,
      path: "/",
      sameSite: "lax",
    });
  });

  return cookieNames.size;
}

export async function createVlxSupabaseServerClient({
  env = process.env,
  cookieWriteMode = "enabled",
}: {
  env?: SupabaseServerEnv;
  cookieWriteMode?: SupabaseServerCookieWriteMode;
} = {}): Promise<VlxSupabaseServerClientResult> {
  const config = readSupabaseServerConfig(env);

  if (!config) {
    return {
      status: "unconfigured",
      client: null,
    };
  }

  const cookieStore = await cookies();
  const client = createServerClient(
    config.supabaseUrl,
    config.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          if (cookieWriteMode === "disabled") {
            return;
          }

          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Some Next.js server contexts are read-only; token refresh writes
            // are then handled by a future auth flow boundary.
          }
        },
      },
    }
  );

  return {
    status: "configured",
    client,
  };
}
