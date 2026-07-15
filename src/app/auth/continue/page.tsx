import type { Metadata } from "next";
import Link from "next/link";

import { TrackBAppShell, TrackBPageHeader } from "@/components/track-b";
import { readPendingMagicLinkConfirmation } from "@/lib/auth/pending-confirmation";

import { completeMagicLinkAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
    nocache: true,
  },
  title: "Confirm sign in",
};

export default async function ContinueAuthPage() {
  const hasPendingConfirmation =
    (await readPendingMagicLinkConfirmation()) !== null;

  return (
    <TrackBAppShell currentPath="/login" workspaceLabel="Private dogfood">
      <div className="page auth-page">
        <TrackBPageHeader
          eyebrow="Private dogfood"
          title="Confirm this sign-in."
          description="One deliberate click keeps automated email security checks from using your one-time sign-in link."
        />

        <section className="auth-card" aria-labelledby="confirm-heading">
          <div className="auth-card__copy">
            <h2 className="section-title" id="confirm-heading">
              Continue to Visual Lexicon
            </h2>
            <p className="settings-panel__body">
              Only continue if you requested this Magic Link in this browser.
              No learning data will be changed by signing in.
            </p>
          </div>

          {hasPendingConfirmation ? (
            <form action={completeMagicLinkAction} className="auth-form">
              <button
                className="track-b-button track-b-button--primary"
                type="submit"
              >
                Confirm and sign in
              </button>
            </form>
          ) : (
            <div className="auth-status auth-status--neutral" role="status">
              <strong>No active sign-in request</strong>
              <span>
                This link is missing, expired, or already used. Request a new
                Magic Link to continue.
              </span>
              <Link className="track-b-button" href="/login">
                Request a new link
              </Link>
            </div>
          )}
        </section>
      </div>
    </TrackBAppShell>
  );
}
