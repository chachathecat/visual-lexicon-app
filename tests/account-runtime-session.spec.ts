import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";

import { expect, test } from "@playwright/test";

import {
  createSupabasePrincipalEvidenceFromClaims,
  mapSupabaseAuthErrorToPrincipalStatus,
  normalizeAccountPrincipalEvidence,
  readAccountPrincipal,
  verifySupabaseAccountPrincipal,
  type AccountPrincipalEvidence,
} from "../src/lib/account-runtime/session";
import {
  readSupabaseServerConfig,
  SUPABASE_SERVER_ENV_NAMES,
} from "../src/lib/supabase/server";

const workspaceRoot = process.cwd();

const newRuntimeFiles = [
  "src/lib/account-runtime/types.ts",
  "src/lib/account-runtime/session.ts",
  "src/lib/supabase/server.ts",
] as const;

const newRuntimeAndDocFiles = [
  ...newRuntimeFiles,
  "docs/TRACK_B_AUTH_PRINCIPAL_FOUNDATION.md",
  "README.md",
] as const;

function readProjectFile(relativePath: string) {
  return readFileSync(join(workspaceRoot, relativePath), "utf8");
}

function listFiles(root: string): string[] {
  if (!existsSync(root)) {
    return [];
  }

  const entries = readdirSync(root);
  const files: string[] = [];

  for (const entry of entries) {
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

function expectRejected(evidence: AccountPrincipalEvidence, status: string) {
  expect(normalizeAccountPrincipalEvidence(evidence)).toEqual({
    status,
    principal: null,
  });
}

async function withFetchAccessGuard<TValue>(callback: () => Promise<TValue>) {
  const originalFetchDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "fetch"
  );
  let fetchAccessed = false;

  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    get() {
      fetchAccessed = true;
      return () => {
        throw new Error("missing configuration must not call fetch");
      };
    },
  });

  try {
    const value = await callback();

    return {
      fetchAccessed,
      value,
    };
  } finally {
    if (originalFetchDescriptor) {
      Object.defineProperty(globalThis, "fetch", originalFetchDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "fetch");
    }
  }
}

test.describe("account runtime session principal", () => {
  test("verified subject becomes authenticated accountId", async () => {
    const result = await readAccountPrincipal({
      verifier: async () => ({
        status: "verified",
        provider: "supabase",
        subject: "account_123",
        isAnonymous: false,
      }),
    });

    expect(result).toEqual({
      status: "authenticated",
      principal: {
        accountId: "account_123",
        provider: "supabase",
      },
    });
  });

  test("Supabase validation uses auth.getClaims and never getSession", async () => {
    const calls: string[] = [];
    const supabase = {
      auth: {
        async getClaims() {
          calls.push("getClaims");

          return {
            data: {
              claims: {
                sub: "jwt_subject",
                is_anonymous: false,
                email: "private-email-value",
              },
            },
            error: null,
          };
        },
        async getSession() {
          calls.push("getSession");
          throw new Error("getSession must not be used as auth proof");
        },
      },
    };

    const evidence = await verifySupabaseAccountPrincipal({
      supabase: supabase as never,
    });

    expect(calls).toEqual(["getClaims"]);
    expect(normalizeAccountPrincipalEvidence(evidence)).toEqual({
      status: "authenticated",
      principal: {
        accountId: "jwt_subject",
        provider: "supabase",
      },
    });
  });

  test("empty or anonymous context is rejected", async () => {
    await expect(
      readAccountPrincipal({
        verifier: async () => ({
          status: "anonymous",
        }),
      })
    ).resolves.toEqual({
      status: "anonymous",
      principal: null,
    });

    expectRejected(
      createSupabasePrincipalEvidenceFromClaims({
        sub: "anonymous_subject",
        is_anonymous: true,
      }),
      "anonymous"
    );
  });

  test("invalid context is rejected", () => {
    expectRejected(createSupabasePrincipalEvidenceFromClaims(null), "invalid");
    expectRejected(
      createSupabasePrincipalEvidenceFromClaims({
        sub: "",
      }),
      "invalid"
    );
    expect(mapSupabaseAuthErrorToPrincipalStatus({ code: "bad_jwt" })).toBe(
      "invalid"
    );

    for (const isAnonymous of [undefined, "false", 0, null]) {
      expectRejected(
        createSupabasePrincipalEvidenceFromClaims({
          sub: "permanent_user_claim_requires_exact_false",
          is_anonymous: isAnonymous,
        }),
        "invalid"
      );
    }
  });

  test("expired is rejected when explicitly proven", () => {
    expect(
      mapSupabaseAuthErrorToPrincipalStatus({
        name: "AuthInvalidJwtError",
        message: "JWT has expired",
      })
    ).toBe("expired");
  });

  test("revoked is rejected when explicitly proven", () => {
    expect(
      mapSupabaseAuthErrorToPrincipalStatus({
        code: "session_revoked",
        message: "Session revoked by provider",
      })
    ).toBe("revoked");
  });

  test("ambiguous identity is rejected", () => {
    expectRejected(
      createSupabasePrincipalEvidenceFromClaims({
        sub: ["account_a", "account_b"],
      }),
      "ambiguous"
    );
    expectRejected(
      {
        status: "verified",
        provider: "supabase",
        subject: ["account_a", "account_b"],
        isAnonymous: false,
      },
      "ambiguous"
    );
  });

  test("unsupported provider result is rejected", () => {
    expectRejected(
      {
        status: "verified",
        provider: "unsupported-provider",
        subject: "account_123",
      },
      "unsupported"
    );
  });

  test("missing environment fails closed without external request", async () => {
    expect(readSupabaseServerConfig({})).toBeNull();

    const { fetchAccessed, value } = await withFetchAccessGuard(() =>
      readAccountPrincipal({
        env: {},
      })
    );

    expect(value).toEqual({
      status: "unconfigured",
      principal: null,
    });
    expect(fetchAccessed).toBe(false);
  });

  test("client-provided accountId is ignored", async () => {
    const result = await readAccountPrincipal({
      verifier: async () =>
        ({
          status: "verified",
          provider: "supabase",
          subject: "verified_jwt_sub",
          isAnonymous: false,
          accountId: "client_supplied_account",
          email: "private-email-value",
        }) as unknown as AccountPrincipalEvidence,
    });

    expect(result).toEqual({
      status: "authenticated",
      principal: {
        accountId: "verified_jwt_sub",
        provider: "supabase",
      },
    });
    expect(JSON.stringify(result)).not.toContain("client_supplied_account");
    expect(JSON.stringify(result)).not.toContain("private-email-value");
  });

  test("returned values contain no token, cookie, raw claim, email, or key", () => {
    const result = normalizeAccountPrincipalEvidence({
      status: "verified",
      provider: "supabase",
      subject: "verified_jwt_sub",
      isAnonymous: false,
      access_token: "access-token-value",
      refresh_token: "refresh-token-value",
      rawJwt: "raw-jwt-value",
      cookie: "cookie-value",
      claims: {
        sub: "verified_jwt_sub",
        email: "private-email-value",
      },
      email: "private-email-value",
      publishableKey: "publishable-key-value",
    } as unknown as AccountPrincipalEvidence);
    const serialized = JSON.stringify(result);

    expect(result).toEqual({
      status: "authenticated",
      principal: {
        accountId: "verified_jwt_sub",
        provider: "supabase",
      },
    });

    for (const forbidden of [
      "access-token-value",
      "refresh-token-value",
      "raw-jwt-value",
      "cookie-value",
      "claims",
      "private-email-value",
      "publishable-key-value",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  test("server utility uses Next cookies and Supabase SSR server client", () => {
    const serverSource = readProjectFile("src/lib/supabase/server.ts");
    const sessionSource = readProjectFile("src/lib/account-runtime/session.ts");

    expect(serverSource).toContain('from "next/headers"');
    expect(serverSource).toContain("cookies()");
    expect(serverSource).toContain("createServerClient");
    expect(serverSource).toContain("getAll()");
    expect(serverSource).toContain("setAll(");
    expect(sessionSource).toContain(".auth.getClaims()");
    expect(sessionSource).not.toContain(".auth.getSession(");
  });

  test("approved environment names are the only Supabase config names", () => {
    expect(SUPABASE_SERVER_ENV_NAMES).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ]);

    const forbiddenSnippets = [
      ["service", "_role"].join(""),
      ["sb_", "secret_"].join(""),
      ["SUPABASE_", "SERVICE"].join(""),
      ["SUPABASE_", "SECRET"].join(""),
      ["SECRET", "_KEY"].join(""),
    ];

    for (const relativePath of newRuntimeAndDocFiles) {
      const text = readProjectFile(relativePath);

      for (const forbidden of forbiddenSnippets) {
        expect(text, `${relativePath} contains ${forbidden}`).not.toContain(
          forbidden
        );
      }
    }
  });

  test("Client Components do not import the server session reader", () => {
    const sourceFiles = listFiles(join(workspaceRoot, "src")).filter((path) =>
      /\.(ts|tsx)$/.test(path)
    );
    const clientFiles = sourceFiles.filter((path) =>
      /^\s*["']use client["'];?/m.test(readFileSync(path, "utf8"))
    );

    for (const path of clientFiles) {
      const text = readFileSync(path, "utf8");

      expect(text, projectRelative(path)).not.toContain(
        "account-runtime/session"
      );
    }
  });

  test("route inventory includes only approved auth, entitlement, read, and staging learning routes", () => {
    const appFiles = listFiles(join(workspaceRoot, "src", "app"));
    const routeHandlers = appFiles
      .filter((path) => /^route\.(ts|tsx|js|jsx)$/.test(basename(path)))
      .map(projectRelative);

    expect(routeHandlers).toEqual([
      "src/app/api/account/sync/apply/route.ts",
      "src/app/api/account/sync/digest/route.ts",
      "src/app/api/account/sync/hydrate/route.ts",
      "src/app/api/account/sync/preview/route.ts",
      "src/app/api/me/entitlements/route.ts",
      "src/app/auth/confirm/route.ts",
    ]);

    for (const relativePath of [
      "app/api",
      "pages/api",
      "src/app/api/account/sync/audit",
      "src/app/api/admin",
      "src/app/api/billing",
      "src/app/api/checkout",
      "src/app/api/downloads",
      "src/app/api/me/usage",
      "src/app/api/payment",
      "src/app/api/payments",
      "src/app/api/packs",
      "src/app/api/usage",
      "src/pages/api",
      "proxy.ts",
      "src/proxy.ts",
    ]) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(
        false
      );
    }

    expect(existsSync(join(workspaceRoot, "src/middleware.ts"))).toBe(true);
  });

  test("no browser Supabase client is added", () => {
    const sourceText = listFiles(join(workspaceRoot, "src"))
      .filter((path) => /\.(ts|tsx)$/.test(path))
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    expect(sourceText).not.toContain("createBrowserClient");
    expect(existsSync(join(workspaceRoot, "src/lib/supabase/client.ts"))).toBe(
      false
    );
    expect(existsSync(join(workspaceRoot, "src/lib/supabase/browser.ts"))).toBe(
      false
    );
  });

  test("only the approved learner login auth page is added", () => {
    const forbiddenRouteSegments = new Set([
      "signin",
      "sign-in",
      "signup",
      "sign-up",
      "callback",
      "logout",
      "password-reset",
      "reset-password",
    ]);
    const appFiles = listFiles(join(workspaceRoot, "src", "app")).map(
      projectRelative
    );
    const matchingFiles = appFiles.filter((path) =>
      path
        .split("/")
        .some((segment) => forbiddenRouteSegments.has(segment.toLowerCase()))
    );

    expect(matchingFiles).toEqual([]);
    expect(appFiles).toContain("src/app/login/page.tsx");
  });

  test("no DB schema, migration, RLS, table, or storage bucket is added", () => {
    for (const relativePath of [
      "supabase",
      "migrations",
      "db",
      "prisma",
      "drizzle",
      "schema.sql",
      "src/db",
      "src/lib/db",
    ]) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(
        false
      );
    }

    const runtimeText = newRuntimeFiles.map(readProjectFile).join("\n");

    for (const forbiddenPattern of [
      /\bcreate\s+table\b/i,
      /\balter\s+table\b/i,
      /\bcreate\s+policy\b/i,
      /\brow\s+level\s+security\b/i,
      /\bstorage\s+bucket\b/i,
    ]) {
      expect(runtimeText).not.toMatch(forbiddenPattern);
    }
  });

  test("no Account Sync, entitlement runtime, or storage key is added", () => {
    const runtimeText = newRuntimeFiles.map(readProjectFile).join("\n");

    for (const forbidden of [
      "account-persistence",
      "entitlements",
      "billing-entitlements",
      "manual-payment-entitlement",
      "localStorage",
      "sessionStorage",
      "vlx_",
    ]) {
      expect(runtimeText).not.toContain(forbidden);
    }
  });

  test("existing SRS and analytics contracts remain unchanged", () => {
    const approvedPricingPaywallV2Diff = new Set([
      "src/lib/analytics/types.ts",
    ]);
    const unexpectedDiff = execFileSync(
      "git",
      ["diff", "--name-only", "--", "src/lib/srs", "src/lib/analytics"],
      {
        cwd: workspaceRoot,
        encoding: "utf8",
      }
    )
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((path) => !approvedPricingPaywallV2Diff.has(path));

    expect(unexpectedDiff).toEqual([]);
  });

  test("documentation states the auth principal boundary", () => {
    const readme = readProjectFile("README.md");
    const doc = readProjectFile("docs/TRACK_B_AUTH_PRINCIPAL_FOUNDATION.md");

    expect(readme).toContain(
      "[Track B Auth Principal Foundation](docs/TRACK_B_AUTH_PRINCIPAL_FOUNDATION.md)"
    );
    expect(doc).toContain(
      "identifies an already authenticated Supabase session"
    );
    expect(doc).toContain("Minimal Auth Session Flow");
    expect(doc).toContain("No learning data is uploaded.");
    expect(doc).toContain("No Account Sync route exists.");
    expect(doc).toContain(
      "Those exports are hard default-disabled and read-only"
    );
    expect(doc).toContain("No paid entitlement is granted.");
    expect(doc).toContain("Public paid beta remains **No-Go**.");
    expect(doc).toContain("feat/minimal-auth-session-flow-v1");
  });

  test("only the approved package additions are present in dependencies", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      dependencies: Record<string, string>;
    };
    const supabaseDependencies = Object.keys(packageJson.dependencies)
      .filter((dependency) => dependency.startsWith("@supabase/"))
      .sort();

    expect(supabaseDependencies).toEqual([
      "@supabase/ssr",
      "@supabase/supabase-js",
    ]);
    expect(packageJson.dependencies).not.toHaveProperty("stripe");
    expect(packageJson.dependencies).not.toHaveProperty("paddle");
    expect(packageJson.dependencies).not.toHaveProperty("next-auth");
  });
});
