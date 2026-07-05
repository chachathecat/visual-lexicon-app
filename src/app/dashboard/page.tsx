import type { Metadata } from "next";

import { DashboardV3View } from "@/components/views/dashboard-v3-view";

export const metadata: Metadata = {
  title: "Dashboard"
};

export default function DashboardPage() {
  return <DashboardV3View />;
}
