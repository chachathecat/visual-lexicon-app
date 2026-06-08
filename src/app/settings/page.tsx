import type { Metadata } from "next";

import { LocalPlanStatePanel } from "@/components/local-plan-state-panel";
import { LocalPaywallTriggerPanel } from "@/components/local-paywall-trigger-panel";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Settings"
};

export default function SettingsPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Settings"
        title="Local learning preferences."
        description="A quiet placeholder for app preferences without account, auth, or billing settings."
      />

      <LocalPlanStatePanel />

      <LocalPaywallTriggerPanel />

      <section className="settings-panel" aria-labelledby="settings-shell">
        <h2 className="section-title" id="settings-shell">
          Preferences
        </h2>
        <p className="settings-panel__body">
          Review length, reminder cadence, and display preferences can be added
          after the memory loop is working. No auth, billing, or payment setting
          is configured here.
        </p>
      </section>
    </div>
  );
}
