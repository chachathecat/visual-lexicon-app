import type { Metadata } from "next";

import { ReviewSessionView } from "@/components/views/review-session-view";

export const metadata: Metadata = {
  title: "Weak Sprint"
};

export default function WeakSprintReviewPage() {
  return <ReviewSessionView mode="weak-sprint" limit={5} />;
}
