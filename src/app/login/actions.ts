"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createLoginRedirectPath } from "@/lib/auth/redirects";
import {
  createAuthConfirmationUrl,
  getRequestAuthOrigin,
  requestSupabaseMagicLink,
} from "@/lib/auth/session-flow";

export async function requestMagicLinkAction(formData: FormData) {
  const next = formData.get("next");
  const requestHeaders = await headers();
  const origin = getRequestAuthOrigin({
    headers: requestHeaders,
  });
  const emailRedirectTo = origin
    ? createAuthConfirmationUrl({
        next,
        origin,
      })
    : null;
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
