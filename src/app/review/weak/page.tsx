import type { Metadata } from "next";

import { ReviewSessionView } from "@/components/views/review-session-view";

export const metadata: Metadata = {
  title: "Weak Review"
};

export default function WeakReviewPage() {
  return <ReviewSessionView mode="weak" />;
}
