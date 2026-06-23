"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { signOutSupabaseSession } from "@/lib/auth/session-flow";

export async function logoutAction() {
  const result = await signOutSupabaseSession();
  const accountStatus =
    result.status === "signed_out"
      ? "signed-out"
      : result.status === "unavailable"
        ? "unavailable"
        : "logout-error";

  revalidatePath("/settings");
  redirect(`/settings?account=${accountStatus}`);
}
