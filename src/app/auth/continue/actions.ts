"use server";

import { redirect } from "next/navigation";

import { createLoginRedirectPath } from "@/lib/auth/redirects";
import { takePendingMagicLinkConfirmation } from "@/lib/auth/pending-confirmation";
import { confirmSupabaseMagicLink } from "@/lib/auth/session-flow";

export async function completeMagicLinkAction() {
  const pending = await takePendingMagicLinkConfirmation();

  if (!pending) {
    redirect(
      createLoginRedirectPath({
        status: "confirmation-error",
      })
    );
  }

  const result = await confirmSupabaseMagicLink({
    next: pending.next,
    tokenHash: pending.tokenHash,
    type: pending.type,
  });

  redirect(
    result.status === "confirmed"
      ? result.redirectTo
      : createLoginRedirectPath({
          status:
            result.reason === "unconfigured"
              ? "unavailable"
              : "confirmation-error",
        })
  );
}
