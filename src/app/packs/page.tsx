import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PackCard } from "@/components/pack-card";
import { PageHeader } from "@/components/page-header";
import { mockPacks } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Packs"
};

export default function PacksPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Packs"
        title="Static pack previews for the learning app."
        description="Mock pack data stands in for future R2 files without calling production systems."
      />

      <section className="section" aria-labelledby="pack-list">
        <div className="section-heading">
          <h2 className="section-title" id="pack-list">
            Available packs
          </h2>
          <span className="section-note">{mockPacks.length} mock packs</span>
        </div>
        {mockPacks.length ? (
          <div className="card-grid">
            {mockPacks.map((pack) => (
              <PackCard key={pack.packId} pack={pack} />
            ))}
          </div>
        ) : (
          <EmptyState
            body="Pack previews will appear here when mock pack data is available."
            title="No packs available"
          />
        )}
      </section>
    </div>
  );
}
