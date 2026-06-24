import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";

import type { AccountPrincipalResult } from "../src/lib/account-runtime/types";
import { resolveEffectiveEntitlements } from "../src/lib/entitlements/resolver";
import {
  createEntitlementReadModelRouteHandler,
  ENTITLEMENT_READ_MODEL_CACHE_CONTROL,
  ENTITLEMENT_READ_MODEL_SCHEMA_VERSION,
  resolveServerEntitlementReadModel,
  type EntitlementReadModelSuccess,
} from "../src/lib/entitlements/server-read-model";
import * as routeModule from "../src/app/api/me/entitlements/route";

const workspaceRoot = process.cwd();
const evaluatedAt = "2026-06-24T00:00:00.000Z";
const fixedNow = () => new Date(evaluatedAt);

const authenticatedPrincipal: AccountPrincipalResult = {
  status: "authenticated",
  principal: {
    accountId: "acct_server_verified_secret",
    provider: "supabase",
  },
};

const anonymousPrincipal: AccountPrincipalResult = {
  status: "anonymous",
  principal: null,
};

function readProjectFile(relativePath: string) {
  return readFileSync(join(workspaceRoot, relativePath), "utf8");
}

function listFiles(root: string): string[] {
  if (!existsSync(root)) {
    return [];
  }

  const files: string[] = [];

  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      files.push(...listFiles(path));
    } else if (stats.isFile()) {
      files.push(path);
    }
  }

  return files;
}

function projectRelative(path: string) {
  return relative(workspaceRoot, path).split(sep).join("/");
}

async function callReadModelRoute(
  principal: AccountPrincipalResult,
  request?: Request
) {
  const handler = createEntitlementReadModelRouteHandler({
    readPrincipal: async () => principal,
    now: fixedNow,
  });
  const response = await handler(
    request ?? new Request("https://app.visuallexicon.org/api/me/entitlements")
  );

  return {
    response,
    body: (await response.json()) as Record<string, unknown>,
  };
}

function expectNoEntitlements(body: Record<string, unknown>) {
  expect(body).toEqual({
    error: {
      code: expect.any(String),
    },
  });
  expect(body).not.toHaveProperty("capabilities");
  expect(body).not.toHaveProperty("limits");
  expect(body).not.toHaveProperty("plan");
  expect(body).not.toHaveProperty("accountState");
}

function expectSuccessSchema(body: Record<string, unknown>) {
  expect(Object.keys(body).sort()).toEqual(
    [
      "schemaVersion",
      "authState",
      "accountState",
      "plan",
      "capabilities",
      "limits",
      "purchasedPackIds",
      "activePromotionIds",
      "lifecycleStatus",
      "evaluatedAt",
    ].sort()
  );
}

function expectMatchesResolver(
  body: Record<string, unknown>,
  accountState: "guest" | "free"
) {
  const expected = resolveEffectiveEntitlements({
    accountState,
    evaluatedAt,
    oneTimePurchases: [],
    promotions: [],
    manualGrants: [],
  });

  expect(body.capabilities).toEqual(expected.capabilities);
  expect(body.limits).toEqual(expected.limits);
  expect(body.purchasedPackIds).toEqual(expected.purchasedPacks);
  expect(body.lifecycleStatus).toBe(expected.lifecycle.state);
  expect(body.evaluatedAt).toBe(expected.evaluatedAt);
}

async function withGlobalGetterTrap<TValue>({
  key,
  value,
  callback,
}: {
  key: string;
  value: unknown;
  callback: () => Promise<TValue>;
}) {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, key);
  let accessed = false;

  Object.defineProperty(globalThis, key, {
    configurable: true,
    get() {
      accessed = true;

      return value;
    },
  });

  try {
    const result = await callback();

    return {
      accessed,
      result,
    };
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, key, originalDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, key);
    }
  }
}

test.describe("Track B entitlement runtime read model", () => {
  test("anonymous request returns Guest with status 200", async () => {
    const { response, body } = await callReadModelRoute(anonymousPrincipal);

    expect(response.status).toBe(200);
    expectSuccessSchema(body);
    expect(body).toMatchObject({
      schemaVersion: ENTITLEMENT_READ_MODEL_SCHEMA_VERSION,
      authState: "anonymous",
      accountState: "guest",
      plan: "guest",
      purchasedPackIds: [],
      activePromotionIds: [],
      lifecycleStatus: "active",
      evaluatedAt,
    } satisfies Partial<EntitlementReadModelSuccess>);
    expectMatchesResolver(body, "guest");
  });

  test("verified authenticated principal returns Free with status 200", async () => {
    const { response, body } = await callReadModelRoute(authenticatedPrincipal);

    expect(response.status).toBe(200);
    expectSuccessSchema(body);
    expect(body).toMatchObject({
      schemaVersion: ENTITLEMENT_READ_MODEL_SCHEMA_VERSION,
      authState: "authenticated",
      accountState: "free",
      plan: "free",
      purchasedPackIds: [],
      activePromotionIds: [],
      lifecycleStatus: "active",
      evaluatedAt,
    } satisfies Partial<EntitlementReadModelSuccess>);
    expectMatchesResolver(body, "free");
  });

  test("authenticated users receive no Lite, Pro, or Educator capability", async () => {
    const { body } = await callReadModelRoute(authenticatedPrincipal);
    const capabilities = body.capabilities as Record<string, boolean>;
    const limits = body.limits as Record<string, unknown>;

    expect(body.plan).toBe("free");
    expect(capabilities["assets.clean_standard"]).toBe(false);
    expect(capabilities["assets.clean_hd"]).toBe(false);
    expect(capabilities["downloads.standard"]).toBe(false);
    expect(capabilities["downloads.hd"]).toBe(false);
    expect(capabilities["downloads.batch"]).toBe(false);
    expect(capabilities["srs.full_5_box"]).toBe(false);
    expect(capabilities["srs.weak_sprint"]).toBe(false);
    expect(capabilities["srs.mastery_test"]).toBe(false);
    expect(capabilities["ai.monthly_personalized_mistake_explanations"]).toBe(
      false
    );
    expect(capabilities["classroom.seats"]).toBe(false);
    expect(limits["downloads.monthly_total"]).toBe(0);
    expect(limits["ai.personalized_mistake_explanations_monthly"]).toBe(0);
  });

  test("rejected sessions return generic 401 and no entitlements", async () => {
    for (const status of [
      "invalid",
      "expired",
      "revoked",
      "ambiguous",
      "unsupported",
    ] as const) {
      const { response, body } = await callReadModelRoute({
        status,
        principal: null,
      });

      expect(response.status, status).toBe(401);
      expect(body).toEqual({
        error: {
          code: "AUTH_INVALID",
        },
      });
      expectNoEntitlements(body);
    }
  });

  test("unconfigured auth returns generic 503 and no entitlements", async () => {
    const { response, body } = await callReadModelRoute({
      status: "unconfigured",
      principal: null,
    });

    expect(response.status).toBe(503);
    expect(body).toEqual({
      error: {
        code: "AUTH_UNAVAILABLE",
      },
    });
    expectNoEntitlements(body);
  });

  test("query plan is ignored", async () => {
    const { body } = await callReadModelRoute(
      authenticatedPrincipal,
      new Request("https://app.visuallexicon.org/api/me/entitlements?plan=pro")
    );

    expect(body.authState).toBe("authenticated");
    expect(body.accountState).toBe("free");
    expect(body.plan).toBe("free");
    expectMatchesResolver(body, "free");
  });

  test("query accountId is ignored", async () => {
    const { body } = await callReadModelRoute(
      authenticatedPrincipal,
      new Request(
        "https://app.visuallexicon.org/api/me/entitlements?accountId=acct_client_supplied"
      )
    );

    expect(body.accountState).toBe("free");
    expect(JSON.stringify(body)).not.toContain("acct_client_supplied");
  });

  test("arbitrary plan and account headers are ignored", async () => {
    const { body } = await callReadModelRoute(
      authenticatedPrincipal,
      new Request("https://app.visuallexicon.org/api/me/entitlements", {
        headers: {
          "x-vlx-plan": "pro",
          "x-vlx-account-id": "acct_header_supplied",
          cookie: "vlx_plan=pro",
        },
      })
    );

    expect(body.accountState).toBe("free");
    expect(body.plan).toBe("free");
    expect(JSON.stringify(body)).not.toContain("acct_header_supplied");
  });

  test("localStorage plan state cannot affect the result", async () => {
    const { accessed, result } = await withGlobalGetterTrap({
      key: "localStorage",
      value: {
        getItem() {
          return JSON.stringify({
            plan: "pro",
            accountId: "acct_local_storage",
          });
        },
      },
      callback: () => callReadModelRoute(authenticatedPrincipal),
    });

    expect(accessed).toBe(false);
    expect(result.body.accountState).toBe("free");
    expect(result.body.plan).toBe("free");
  });

  test("success-page or route arrival cannot affect the result", async () => {
    const { body } = await callReadModelRoute(
      anonymousPrincipal,
      new Request(
        "https://app.visuallexicon.org/api/me/entitlements?from=success&plan=pro",
        {
          headers: {
            referer:
              "https://app.visuallexicon.org/pricing?checkout=success&plan=pro",
          },
        }
      )
    );

    expect(body.authState).toBe("anonymous");
    expect(body.accountState).toBe("guest");
    expect(body.plan).toBe("guest");
  });

  test("response contains no accountId, email, token, cookie, claims, or key", async () => {
    const { body } = await callReadModelRoute({
      status: "authenticated",
      principal: {
        accountId: "acct_private_response_boundary",
        provider: "supabase",
      },
      email: "learner@example.com",
      accessToken: "access-token-value",
      refreshToken: "refresh-token-value",
      rawJwt: "raw-jwt-value",
      cookie: "cookie-value",
      claims: {
        sub: "acct_private_response_boundary",
      },
      publishableKey: "publishable-key-value",
      secretKey: "secret-key-value",
    } as unknown as AccountPrincipalResult);
    const serialized = JSON.stringify(body);

    for (const forbidden of [
      "acct_private_response_boundary",
      "learner@example.com",
      "access-token-value",
      "refresh-token-value",
      "raw-jwt-value",
      "cookie-value",
      "claims",
      "publishable-key-value",
      "secret-key-value",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  test("response grants and purchases are empty", async () => {
    const { body } = await callReadModelRoute(authenticatedPrincipal);

    expect(body.purchasedPackIds).toEqual([]);
    expect(body.activePromotionIds).toEqual([]);
    expect(JSON.stringify(body)).not.toContain("activeGrants");
    expect(JSON.stringify(body)).not.toContain("ignoredGrantIds");
  });

  test("response contains canonical capabilities and limits", async () => {
    const authenticated = await callReadModelRoute(authenticatedPrincipal);
    const anonymous = await callReadModelRoute(anonymousPrincipal);

    expectMatchesResolver(authenticated.body, "free");
    expectMatchesResolver(anonymous.body, "guest");
  });

  test("pure resolver output matches the successful endpoint read model", async () => {
    const result = await resolveServerEntitlementReadModel({
      readPrincipal: async () => authenticatedPrincipal,
      now: fixedNow,
    });

    expect(result.status).toBe(200);
    expectMatchesResolver(result.body, "free");
  });

  test("Cache-Control is exactly private, no-store and Vary contains Cookie", async () => {
    const { response } = await callReadModelRoute(authenticatedPrincipal);

    expect(response.headers.get("cache-control")).toBe(
      ENTITLEMENT_READ_MODEL_CACHE_CONTROL
    );
    expect(response.headers.get("vary")).toContain("Cookie");
  });

  test("route is force-dynamic", () => {
    expect(routeModule.dynamic).toBe("force-dynamic");
  });

  test("POST or unsupported methods do not mutate state", () => {
    expect("GET" in routeModule).toBe(true);
    expect("POST" in routeModule).toBe(false);
    expect("PUT" in routeModule).toBe(false);
    expect("PATCH" in routeModule).toBe(false);
    expect("DELETE" in routeModule).toBe(false);
  });

  test("no external Supabase request occurs in tests", async () => {
    let principalReads = 0;
    const { accessed, result } = await withGlobalGetterTrap({
      key: "fetch",
      value: () => {
        throw new Error("tests must not call external services");
      },
      callback: async () => {
        principalReads += 1;

        return resolveServerEntitlementReadModel({
          readPrincipal: async () => authenticatedPrincipal,
          now: fixedNow,
        });
      },
    });

    expect(accessed).toBe(false);
    expect(principalReads).toBe(1);
    expect(result.status).toBe(200);
  });

  test("no local-entitlements import occurs in the server route or read model", () => {
    const routeSource = readProjectFile("src/app/api/me/entitlements/route.ts");
    const readModelSource = readProjectFile(
      "src/lib/entitlements/server-read-model.ts"
    );
    const localEntitlementsSource = readProjectFile(
      "src/lib/entitlements/local-entitlements.ts"
    );

    for (const source of [routeSource, readModelSource]) {
      expect(source).not.toContain("local-entitlements");
      expect(source).not.toContain("resolveEntitlement");
      expect(source).not.toContain("readLocalPlanState");
      expect(source).not.toContain("VLX_PLAN_STATE_STORAGE_KEY");
      expect(source).not.toContain("@/lib/entitlements\"");
      expect(source).not.toContain("@/lib/entitlements'");
    }

    expect(localEntitlementsSource).toContain("window.localStorage");
    expect(localEntitlementsSource).toContain("VLX_PLAN_STATE_STORAGE_KEY");
    expect(localEntitlementsSource).toContain("resolveEntitlement");
  });

  test("no DB, RLS, Account Sync, usage, asset, billing, payment, or UI integration is added", () => {
    for (const relativePath of [
      "src/app/api/account",
      "src/app/api/usage",
      "src/app/api/downloads",
      "src/app/api/billing",
      "src/app/api/payment",
      "src/app/api/payments",
      "src/app/api/checkout",
      "src/app/api/packs",
      "src/app/api/admin",
      "src/app/checkout",
      "src/app/billing",
      "src/app/payment",
      "src/app/payments",
      "supabase",
      "migrations",
      "db",
      "prisma",
      "drizzle",
      "src/db",
      "src/lib/db",
    ]) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(
        false
      );
    }

    const runtimeSources = [
      readProjectFile("src/app/api/me/entitlements/route.ts"),
      readProjectFile("src/lib/entitlements/server-read-model.ts"),
    ].join("\n");

    for (const forbiddenPattern of [
      /account-persistence/i,
      /usage/i,
      /asset/i,
      /billing/i,
      /checkout/i,
      /payment/i,
      /create\s+table/i,
      /row\s+level\s+security/i,
      /localStorage|sessionStorage/,
    ]) {
      expect(runtimeSources).not.toMatch(forbiddenPattern);
    }

    const uiDiff = execFileSync(
      "git",
      [
        "diff",
        "--name-only",
        "--",
        "src/components",
        "src/app/dashboard",
        "src/app/pricing",
        "src/app/settings",
      ],
      { cwd: workspaceRoot }
    )
      .toString()
      .trim();

    expect(uiDiff).toBe("");
  });

  test("no new storage key is introduced", () => {
    const runtimeSources = [
      readProjectFile("src/app/api/me/entitlements/route.ts"),
      readProjectFile("src/lib/entitlements/server-read-model.ts"),
    ].join("\n");

    expect(runtimeSources).not.toMatch(/vlx_[a-z0-9_]+_v1/);
  });

  test("only the approved entitlement read route is added next to existing auth", () => {
    const apiFiles = listFiles(join(workspaceRoot, "src", "app", "api"))
      .map(projectRelative)
      .sort();
    const routeHandlers = listFiles(join(workspaceRoot, "src", "app"))
      .filter((path) => basename(path) === "route.ts")
      .map(projectRelative)
      .sort();

    expect(apiFiles).toEqual(["src/app/api/me/entitlements/route.ts"]);
    expect(routeHandlers).toEqual([
      "src/app/api/me/entitlements/route.ts",
      "src/app/auth/confirm/route.ts",
    ]);
  });
});
