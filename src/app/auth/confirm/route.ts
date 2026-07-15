import { NextResponse, type NextRequest } from "next/server";

import { createLoginRedirectPath } from "@/lib/auth/redirects";
import { confirmSupabaseMagicLink } from "@/lib/auth/session-flow";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const result = await confirmSupabaseMagicLink({
    code: searchParams.get("code"),
    next: searchParams.get("next"),
    tokenHash: searchParams.get("token_hash"),
    type: searchParams.get("type"),
  });
  const redirectPath =
    result.status === "confirmed"
      ? result.redirectTo
      : createLoginRedirectPath({
          status:
            result.reason === "unconfigured"
              ? "unavailable"
              : "confirmation-error",
        });

  return NextResponse.redirect(new URL(redirectPath, request.url), {
    status: 303,
  });
}
