import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PackCard } from "@/components/pack-card";
import { PageHeader } from "@/components/page-header";
import { getPackPreviewCatalog } from "@/lib/packs/preview";

export const metadata: Metadata = {
  title: "Packs"
};

export default async function PacksPage() {
  const packs = await getPackPreviewCatalog();
  const readyCount = packs.filter((pack) => pack.status === "available").length;
  const plannedCount = packs.filter(
    (pack) => pack.status === "placeholder"
  ).length;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Packs"
        title="Starter pack previews for the learning app."
        description="Inspect starter learning and exam packs from the pack reader and safe mock fallback, then start a short review session."
      />

      <section className="section" aria-labelledby="pack-list">
        <div className="section-heading">
          <h2 className="section-title" id="pack-list">
            Starter packs
          </h2>
          <span className="section-note">
            {readyCount} ready
            {plannedCount ? ` | ${plannedCount} planned` : ""}
          </span>
        </div>
        {packs.length ? (
          <div className="card-grid">
            {packs.map((pack) => (
              <PackCard key={pack.packId} pack={pack} />
            ))}
          </div>
        ) : (
          <EmptyState
            body="Pack previews will appear here when pack reader data or safe mock fallback data is available."
            title="No packs available"
          />
        )}
      </section>
    </div>
  );
}
