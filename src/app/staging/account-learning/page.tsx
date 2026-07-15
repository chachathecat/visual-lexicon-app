import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import { TrackBAppShell, TrackBPageHeader } from "@/components/track-b";
import { readAuthenticatedPermanentOwner } from "@/lib/account-persistence/read-only-preview-digest/server";
import {
  VLX_ACCOUNT_LEARNING_EXPECTED_OWNER_ACCOUNT_ID_ENV,
  readAccountLearningVerticalSliceAccess,
} from "@/lib/account-persistence/staging-vertical-slice/server";
import { createVlxSupabaseServerClient } from "@/lib/supabase/server";

import { StagingAccountLearningBridge } from "./staging-account-learning-bridge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staging learning proof",
  robots: { index: false, follow: false },
};

export default async function StagingAccountLearningPage() {
  noStore();

  let hydrateEnabled = false;
  let applyEnabled = false;

  try {
    hydrateEnabled = readAccountLearningVerticalSliceAccess("hydrate").enabled;
    applyEnabled = readAccountLearningVerticalSliceAccess("apply").enabled;
  } catch {
    notFound();
  }

  if (!hydrateEnabled) {
    notFound();
  }

  const expectedOwnerAccountId =
    process.env[VLX_ACCOUNT_LEARNING_EXPECTED_OWNER_ACCOUNT_ID_ENV]?.trim();
  const clientResult = await createVlxSupabaseServerClient({
    cookieWriteMode: "disabled",
  });
  const owner =
    clientResult.status === "configured"
      ? await readAuthenticatedPermanentOwner(clientResult.client)
      : null;

  if (
    !expectedOwnerAccountId ||
    !owner?.ok ||
    owner.ownerAccountId !== expectedOwnerAccountId
  ) {
    notFound();
  }

  return (
    <TrackBAppShell
      currentPath="/staging/account-learning"
      workspaceLabel="Isolated staging proof"
    >
      <div className="page">
        <TrackBPageHeader
          eyebrow="Track B · PR C"
          title="Account learning persistence proof."
          description="A bounded, no-index operator surface for one canonical saved word and one synthetic review event."
        />

        <StagingAccountLearningBridge applyEnabled={applyEnabled} />
      </div>
    </TrackBAppShell>
  );
}
