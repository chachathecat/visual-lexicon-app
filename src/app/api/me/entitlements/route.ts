import { createEntitlementReadModelRouteHandler } from "@/lib/entitlements/server-read-model";

export const dynamic = "force-dynamic";

export const GET = createEntitlementReadModelRouteHandler();
