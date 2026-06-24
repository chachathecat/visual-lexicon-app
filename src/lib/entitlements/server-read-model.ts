import type { AccountPrincipalResult } from "@/lib/account-runtime/types";
import { readAccountPrincipal } from "@/lib/account-runtime/session";
import { resolveEffectiveEntitlements } from "@/lib/entitlements/resolver";
import type {
  AccountState,
  CapabilityRecord,
  EntitlementLifecycleState,
  LimitRecord,
  PackEntitlement,
} from "@/lib/entitlements/types";

export const ENTITLEMENT_READ_MODEL_SCHEMA_VERSION =
  "track_b_entitlement_read_model.v1" as const;
export const ENTITLEMENT_READ_MODEL_CACHE_CONTROL = "private, no-store";
export const ENTITLEMENT_READ_MODEL_VARY = "Cookie";

export type EntitlementReadModelAuthState = "authenticated" | "anonymous";
export type EntitlementReadModelErrorCode =
  | "AUTH_INVALID"
  | "AUTH_UNAVAILABLE";

export type EntitlementReadModelSuccess = {
  schemaVersion: typeof ENTITLEMENT_READ_MODEL_SCHEMA_VERSION;
  authState: EntitlementReadModelAuthState;
  accountState: Extract<AccountState, "guest" | "free">;
  plan: Extract<AccountState, "guest" | "free">;
  capabilities: CapabilityRecord;
  limits: LimitRecord;
  purchasedPackIds: readonly PackEntitlement[];
  activePromotionIds: readonly [];
  lifecycleStatus: EntitlementLifecycleState;
  evaluatedAt: string;
};

export type EntitlementReadModelError = {
  error: {
    code: EntitlementReadModelErrorCode;
  };
};

export type EntitlementReadModelResult =
  | {
      status: 200;
      body: EntitlementReadModelSuccess;
    }
  | {
      status: 401 | 503;
      body: EntitlementReadModelError;
    };

export type EntitlementReadModelDependencies = {
  readPrincipal?: () => Promise<AccountPrincipalResult>;
  now?: () => Date;
};

export type EntitlementReadModelRouteHandler = (
  request: Request
) => Promise<Response>;

export function createEntitlementReadModelHeaders() {
  return {
    "Cache-Control": ENTITLEMENT_READ_MODEL_CACHE_CONTROL,
    Vary: ENTITLEMENT_READ_MODEL_VARY,
  };
}

export async function resolveServerEntitlementReadModel({
  readPrincipal = readAccountPrincipal,
  now = () => new Date(),
}: EntitlementReadModelDependencies = {}): Promise<EntitlementReadModelResult> {
  const principalResult = await readPrincipal();

  if (principalResult.status === "unconfigured") {
    return {
      status: 503,
      body: {
        error: {
          code: "AUTH_UNAVAILABLE",
        },
      },
    };
  }

  if (principalResult.status === "anonymous") {
    return createSuccessfulEntitlementReadModel({
      authState: "anonymous",
      accountState: "guest",
      evaluatedAt: now().toISOString(),
    });
  }

  if (principalResult.status === "authenticated") {
    return createSuccessfulEntitlementReadModel({
      authState: "authenticated",
      accountState: "free",
      evaluatedAt: now().toISOString(),
    });
  }

  return {
    status: 401,
    body: {
      error: {
        code: "AUTH_INVALID",
      },
    },
  };
}

export function createEntitlementReadModelRouteHandler(
  dependencies: EntitlementReadModelDependencies = {}
): EntitlementReadModelRouteHandler {
  return async function entitlementReadModelRouteHandler(_request: Request) {
    const result = await resolveServerEntitlementReadModel(dependencies);

    return Response.json(result.body, {
      status: result.status,
      headers: createEntitlementReadModelHeaders(),
    });
  };
}

function createSuccessfulEntitlementReadModel({
  authState,
  accountState,
  evaluatedAt,
}: {
  authState: EntitlementReadModelAuthState;
  accountState: Extract<AccountState, "guest" | "free">;
  evaluatedAt: string;
}): EntitlementReadModelResult {
  const entitlements = resolveEffectiveEntitlements({
    accountState,
    evaluatedAt,
    oneTimePurchases: [],
    promotions: [],
    manualGrants: [],
  });

  return {
    status: 200,
    body: {
      schemaVersion: ENTITLEMENT_READ_MODEL_SCHEMA_VERSION,
      authState,
      accountState,
      plan: entitlements.planId as Extract<AccountState, "guest" | "free">,
      capabilities: entitlements.capabilities,
      limits: entitlements.limits,
      purchasedPackIds: entitlements.purchasedPacks,
      activePromotionIds: [],
      lifecycleStatus: entitlements.lifecycle.state,
      evaluatedAt: entitlements.evaluatedAt,
    },
  };
}
