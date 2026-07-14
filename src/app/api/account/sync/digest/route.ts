import { createAccountLearningReadOnlyRouteHandler } from "@/lib/account-persistence/read-only-preview-digest/server";

export const dynamic = "force-dynamic";

export const GET = createAccountLearningReadOnlyRouteHandler("digest");
