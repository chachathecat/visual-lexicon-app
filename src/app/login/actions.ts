"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createLoginRedirectPath } from "@/lib/auth/redirects";
import {
  createAuthConfirmationUrl,
  getCanonicalLoginRedirect,
  getRequestAuthOrigin,
  requestSupabaseMagicLink,
} from "@/lib/auth/session-flow";
import {
  createMagicLinkRequestState,
  storeMagicLinkRequestState,
} from "@/lib/auth/request-state";

export async function requestMagicLinkAction(formData: FormData) {
  const next = formData.get("next");
  const requestHeaders = await headers();
  const canonicalLoginRedirect = getCanonicalLoginRedirect({
    headers: requestHeaders,
    next,
    status: "canonical-host",
  });

  if (canonicalLoginRedirect) {
    redirect(canonicalLoginRedirect);
  }

  const origin = getRequestAuthOrigin({
    headers: requestHeaders,
  });
  const state = createMagicLinkRequestState();
  const emailRedirectTo = origin
    ? createAuthConfirmationUrl({
        next,
        origin,
        state,
      })
    : null;

  if (origin && emailRedirectTo) {
    await storeMagicLinkRequestState({
      secure: new URL(origin).protocol === "https:",
      state,
    });
  }

  const result = await requestSupabaseMagicLink({
    email: formData.get("email"),
    emailRedirectTo,
  });

  redirect(
    createLoginRedirectPath({
      next,
      status:
        result.status === "unavailable"
          ? "unavailable"
          : result.status === "invalid_email"
            ? "invalid-email"
            : "sent",
    })
  );
}
