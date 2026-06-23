import type { Metadata } from "next";

import { LocalPlanStatePanel } from "@/components/local-plan-state-panel";
import { LocalPaywallTriggerPanel } from "@/components/local-paywall-trigger-panel";
import { TrackBAppShell, TrackBPageHeader } from "@/components/track-b";
import {
  readAuthAccountStatus,
  type AuthAccountStatus,
} from "@/lib/auth/account-status";

import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: "Settings"
};

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

type AccountNotice = "logout-error" | "signed-out" | "unavailable";

function readSearchParam(
  searchParams: SettingsPageProps["searchParams"],
  key: string
) {
  const value = searchParams?.[key];

  return Array.isArray(value) ? value[0] : value;
}

function readAccountNotice(
  searchParams: SettingsPageProps["searchParams"]
): AccountNotice | null {
  const value = readSearchParam(searchParams, "account");

  if (
    value === "logout-error" ||
    value === "signed-out" ||
    value === "unavailable"
  ) {
    return value;
  }

  return null;
}

function AccountStatusPanel({
  notice,
  status,
}: {
  notice: AccountNotice | null;
  status: AuthAccountStatus;
}) {
  const statusCopy = {
    signed_in: {
      label: "Signed in",
      body: "A verified Supabase session is present for this browser. Learning data remains browser-local; Account Sync is not connected and billing is not configured.",
    },
    signed_out: {
      label: "Signed out",
      body: "No verified account session is active. The local learning loop remains available as a guest.",
    },
    unavailable: {
      label: "Auth unavailable",
      body: "Supabase auth configuration is missing in this environment. The app is not claiming a fake signed-in state.",
    },
  } satisfies Record<AuthAccountStatus["status"], { body: string; label: string }>;
  const noticeCopy = {
    "logout-error": {
      role: "alert",
      text: "Logout did not complete. Retry before assuming this session has ended.",
      title: "Logout failed",
    },
    "signed-out": {
      role: "status",
      text: "This browser is signed out. Your Visual Lexicon learning state stays on this device.",
      title: "Signed out",
    },
    unavailable: {
      role: "status",
      text: "Auth is unavailable in this environment, so no Supabase logout request was sent.",
      title: "Auth unavailable",
    },
  } satisfies Record<
    AccountNotice,
    { role: "alert" | "status"; text: string; title: string }
  >;
  const copy = statusCopy[status.status];
  const accountNotice = notice ? noticeCopy[notice] : null;

  return (
    <section className="settings-panel" aria-labelledby="account-status">
      <div className="settings-panel__topline">
        <div>
          <h2 className="section-title" id="account-status">
            Account
          </h2>
          <p className="settings-panel__body">{copy.body}</p>
        </div>
        <span className={`account-status-pill account-status-pill--${status.status}`}>
          {copy.label}
        </span>
      </div>

      {accountNotice ? (
        <div
          className="auth-status auth-status--neutral"
          role={accountNotice.role}
        >
          <strong>{accountNotice.title}</strong>
          <span>{accountNotice.text}</span>
        </div>
      ) : null}

      <dl className="detail-list">
        <div className="detail-row">
          <dt>Learning state</dt>
          <dd>Browser-local only</dd>
        </div>
        <div className="detail-row">
          <dt>Account Sync</dt>
          <dd>Not connected</dd>
        </div>
        <div className="detail-row">
          <dt>Billing</dt>
          <dd>Not configured</dd>
        </div>
      </dl>

      {status.status === "signed_in" ? (
        <form action={logoutAction}>
          <button className="track-b-button track-b-button--quiet" type="submit">
            Log out
          </button>
        </form>
      ) : null}
    </section>
  );
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const accountStatus = await readAuthAccountStatus();
  const accountNotice = readAccountNotice(searchParams);

  return (
    <TrackBAppShell currentPath="/settings" workspaceLabel="Private session">
      <div className="page">
        <TrackBPageHeader
          eyebrow="Settings"
          title="Local learning preferences."
          description="App preferences, local plan diagnostics, and private-session status."
        />

        <AccountStatusPanel notice={accountNotice} status={accountStatus} />

        <LocalPlanStatePanel />

        <LocalPaywallTriggerPanel />

        <section className="settings-panel" aria-labelledby="settings-shell">
          <h2 className="section-title" id="settings-shell">
            Preferences
          </h2>
          <p className="settings-panel__body">
            Review length, reminder cadence, and display preferences can be added
            after the memory loop is working. No billing or payment setting is
            configured here.
          </p>
        </section>
      </div>
    </TrackBAppShell>
  );
}
