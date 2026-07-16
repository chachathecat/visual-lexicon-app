import { createAccountLearningVerticalSliceRouteHandler } from "@/lib/account-persistence/staging-vertical-slice/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = createAccountLearningVerticalSliceRouteHandler("hydrate");
