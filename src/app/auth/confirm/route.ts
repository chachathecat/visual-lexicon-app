import { NextResponse, type NextRequest } from "next/server";

import { createLoginRedirectPath } from "@/lib/auth/redirects";
import { stagePendingMagicLinkConfirmation } from "@/lib/auth/pending-confirmation";
import { validateMagicLinkRequestState } from "@/lib/auth/request-state";

export const runtime = "nodejs";

function createCredentialSafeRedirect(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url), {
    status: 303,
  });

  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");

  return response;
}

async function handleConfirmationLanding(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next");
  const state = searchParams.get("state");
  const requestStateAccepted = await validateMagicLinkRequestState({ state });

  // A GET is allowed to stage a custom-template token hash, but it must never
  // consume the browser-bound request state or an authentication credential.
  // Email security scanners routinely prefetch links. The explicit
  // server-action POST on /auth/continue consumes both the bound state and the
  // pending token before provider verification.
  if (!code && tokenHash && requestStateAccepted) {
    const staged = await stagePendingMagicLinkConfirmation({
      next,
      secure: request.nextUrl.protocol === "https:",
      state,
      tokenHash,
      type,
    });

    if (staged) {
      return createCredentialSafeRedirect(request, "/auth/continue");
    }
  }

  return createCredentialSafeRedirect(
    request,
    createLoginRedirectPath({ status: "confirmation-error" })
  );
}

export const GET = handleConfirmationLanding;
export const HEAD = handleConfirmationLanding;
