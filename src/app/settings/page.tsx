import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
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

      <section className="settings-panel" aria-labelledby="settings-shell">
        <h2 className="section-title" id="settings-shell">
          Preferences
        </h2>
        <EmptyState
          body="Review length, reminder cadence, and display preferences can be added after the memory loop is working."
          title="No settings configured"
        />
      </section>
    </div>
  );
}
