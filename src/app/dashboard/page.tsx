import type { Metadata } from "next";

import {
  DashboardV2View,
  type DashboardV2PackPreview
} from "@/components/views/dashboard-v2-view";
import { getPackPreviewCatalog, type VlxPackPreview } from "@/lib/packs/preview";

export const metadata: Metadata = {
  title: "Dashboard"
};

function toDashboardPackPreview(
  pack: VlxPackPreview
): DashboardV2PackPreview {
  return {
    packId: pack.packId,
    title: pack.title,
    description: pack.description,
    kind: pack.kind,
    status: pack.status,
    reviewHref: pack.reviewHref,
    wordCount: pack.wordCount,
    previewCount: pack.previewCount,
    targetLabel: pack.targetLabel,
    levelLabel: pack.levelLabel,
    difficultyLabel: pack.difficultyLabel
  };
}

export default async function DashboardPage() {
  const packs = await getPackPreviewCatalog();

  return <DashboardV2View packs={packs.map(toDashboardPackPreview)} />;
}
