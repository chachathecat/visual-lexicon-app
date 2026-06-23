import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  readSupabaseServerConfig,
  type SupabaseServerEnv,
} from "@/lib/supabase/server";

export type SupabaseMiddlewareClient = {
  auth: {
    getUser(): Promise<unknown>;
  };
};

export type SupabaseMiddlewareClientFactory = ({
  request,
  response,
}: {
  request: NextRequest;
  response: NextResponse;
}) =>
  | {
      status: "configured";
      client: SupabaseMiddlewareClient;
    }
  | {
      status: "unconfigured";
      client: null;
    };

export function createVlxSupabaseMiddlewareClient({
  env = process.env,
  request,
  response,
}: {
  env?: SupabaseServerEnv;
  request: NextRequest;
  response: NextResponse;
}) {
  const config = readSupabaseServerConfig(env);

  if (!config) {
    return {
      status: "unconfigured" as const,
      client: null,
    };
  }

  const client = createServerClient(
    config.supabaseUrl,
    config.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return {
    status: "configured" as const,
    client,
  };
}

export async function refreshSupabaseAuthCookies({
  createClient,
  env,
  request,
}: {
  createClient?: SupabaseMiddlewareClientFactory;
  env?: SupabaseServerEnv;
  request: NextRequest;
}) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  const result = createClient
    ? createClient({ request, response })
    : createVlxSupabaseMiddlewareClient({ env, request, response });

  if (result.status === "configured") {
    await result.client.auth.getUser().catch(() => null);
  }

  return response;
}
