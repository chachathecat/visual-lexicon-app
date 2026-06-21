import type { Metadata } from "next";

import { DashboardV2View } from "@/components/views/dashboard-v2-view";

export const metadata: Metadata = {
  title: "Dashboard"
};

export default function DashboardPage() {
  return <DashboardV2View />;
}
