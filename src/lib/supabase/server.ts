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

export type VlxSupabaseServerClientResult =
  | {
      status: "configured";
      client: SupabaseClient;
    }
  | {
      status: "unconfigured";
      client: null;
    };

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

export async function createVlxSupabaseServerClient({
  env = process.env,
}: {
  env?: SupabaseServerEnv;
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
