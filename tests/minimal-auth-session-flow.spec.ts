import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, sep } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import {
  AUTH_DEFAULT_REDIRECT_PATH,
  createLoginRedirectPath,
  normalizeAuthRedirectTarget,
} from "../src/lib/auth/redirects";
import {
  confirmSupabaseMagicLink,
  createAuthConfirmationUrl,
  getSupabaseAuthAvailability,
  isValidAuthTokenHash,
  requestSupabaseMagicLink,
  signOutSupabaseSession,
  type SupabaseAuthFlowClient,
} from "../src/lib/auth/session-flow";
import { refreshSupabaseAuthCookies } from "../src/lib/auth/middleware";
import {
  readPendingMagicLinkConfirmation,
  stagePendingMagicLinkConfirmation,
  takePendingMagicLinkConfirmation,
  type PendingConfirmationCookieStore,
} from "../src/lib/auth/pending-confirmation";
import {
  AUTH_REQUEST_STATE_COOKIE_NAME,
  consumeMagicLinkRequestState,
  createMagicLinkRequestState,
  storeMagicLinkRequestState,
  validateMagicLinkRequestState,
  type AuthRequestStateCookieStore,
} from "../src/lib/auth/request-state";
import { readAuthAccountStatus } from "../src/lib/auth/account-status";
import { readAccountPrincipal } from "../src/lib/account-runtime/session";
import {
  isSupabaseAuthCookieName,
  readSupabaseProjectRef,
} from "../src/lib/supabase/server";

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3006";

const workspaceRoot = process.cwd();
const allowedAuthRouteHandler = "src/app/auth/confirm/route.ts";
const allowedEntitlementReadRouteHandler =
  "src/app/api/me/entitlements/route.ts";
const allowedMiddleware = "src/middleware.ts";
const approvedLearnerEmail = `approved-learner@${"visuallexicon.test"}`;
const missingLearnerEmail = `missing-learner@${"visuallexicon.test"}`;
const vlxLearningStorageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
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
  return path.replace(workspaceRoot + sep, "").split(sep).join("/");
}

function makeSupabaseAuthClient(overrides: {
  exchangeCodeForSession?: SupabaseAuthFlowClient["auth"]["exchangeCodeForSession"];
  signInWithOtp?: SupabaseAuthFlowClient["auth"]["signInWithOtp"];
  signOut?: SupabaseAuthFlowClient["auth"]["signOut"];
  verifyOtp?: SupabaseAuthFlowClient["auth"]["verifyOtp"];
} = {}): SupabaseAuthFlowClient {
  return {
    auth: {
      async exchangeCodeForSession() {
        return { error: null };
      },
      async signInWithOtp() {
        return { error: null };
      },
      async verifyOtp() {
        return { error: null };
      },
      async signOut() {
        return { error: null };
      },
      ...overrides,
    },
  };
}

function makePendingCookieStore() {
  const values = new Map<string, string>();
  const writes: Array<{
    name: string;
    options: Record<string, unknown>;
    value: string;
  }> = [];
  const cookieStore: PendingConfirmationCookieStore &
    AuthRequestStateCookieStore = {
    get(name) {
      const value = values.get(name);

      return value === undefined ? undefined : { value };
    },
    set(name, value, options) {
      writes.push({ name, options, value });

      if (options.maxAge === 0) {
        values.delete(name);
      } else {
        values.set(name, value);
      }
    },
  };

  return {
    cookieStore,
    values,
    writes,
  };
}

async function getFirstFocusableLabel(page: Page) {
  await page.keyboard.press("Tab");

  return page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;

    return {
      id: active?.id,
      tagName: active?.tagName,
      text: active?.textContent?.trim(),
    };
  });
}

test.describe("Minimal Auth Session Flow v1", () => {
  test("login page renders keyboard-accessibly", async ({ page }) => {
    const response = await page.goto(`${baseUrl}/login`, {
      waitUntil: "networkidle",
    });

    expect(response?.status()).toBeLessThan(400);
    await expect(
      page.getByRole("heading", { name: "Sign in with a Magic Link." })
    ).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();

    const firstFocusable = await getFirstFocusableLabel(page);
    expect(firstFocusable).toEqual(
      expect.objectContaining({
        tagName: "A",
      })
    );
  });

  test("known-user Magic Link request uses shouldCreateUser=false", async () => {
    const calls: unknown[] = [];
    const result = await requestSupabaseMagicLink({
      email: approvedLearnerEmail,
      emailRedirectTo: "https://app.visuallexicon.test/auth/confirm?next=%2Fsaved",
      supabase: makeSupabaseAuthClient({
        async signInWithOtp(input) {
          calls.push(input);

          return { error: null };
        },
      }),
    });

    expect(result).toEqual({ status: "sent" });
    expect(calls).toEqual([
      {
        email: approvedLearnerEmail,
        options: {
          emailRedirectTo:
            "https://app.visuallexicon.test/auth/confirm?next=%2Fsaved",
          shouldCreateUser: false,
        },
      },
    ]);
  });

  test("unknown-user Magic Link result does not disclose account existence", async () => {
    const result = await requestSupabaseMagicLink({
      email: missingLearnerEmail,
      emailRedirectTo: "https://app.visuallexicon.test/auth/confirm?next=%2Fdashboard",
      supabase: makeSupabaseAuthClient({
        async signInWithOtp() {
          return { error: { message: "user not found" } };
        },
      }),
    });

    expect(result).toEqual({ status: "sent" });
    expect(JSON.stringify(result).toLowerCase()).not.toContain("not found");
    expect(JSON.stringify(result).toLowerCase()).not.toContain("unknown");
  });

  test("missing environment fails closed and login reflects availability", async ({
    page,
  }) => {
    expect(getSupabaseAuthAvailability({ env: {} })).toBe("unconfigured");

    const response = await page.goto(`${baseUrl}/login`, {
      waitUntil: "networkidle",
    });

    expect(response?.status()).toBeLessThan(400);

    if ((await page.getByText("Auth unavailable").count()) > 0) {
      await expect(page.getByText("Auth unavailable")).toBeVisible();
      await expect(page.getByRole("button", { name: "Send Magic Link" })).toBeDisabled();
    } else {
      await expect(
        page.getByRole("button", { name: "Send Magic Link" })
      ).toBeEnabled();
    }
  });

  test("valid confirmation establishes the session", async () => {
    const calls: unknown[] = [];
    const result = await confirmSupabaseMagicLink({
      next: "/review/due?limit=5",
      tokenHash: "valid_token_hash",
      type: "email",
      supabase: makeSupabaseAuthClient({
        async verifyOtp(input) {
          calls.push(input);

          return { error: null };
        },
      }),
    });

    expect(result).toEqual({
      status: "confirmed",
      redirectTo: "/review/due?limit=5",
    });
    expect(calls).toEqual([
      {
        token_hash: "valid_token_hash",
        type: "email",
      },
    ]);
  });

  test("PKCE authorization code establishes the session and preserves a safe redirect", async () => {
    const calls: unknown[] = [];
    const result = await confirmSupabaseMagicLink({
      code: "34e770dd-9ff9-416c-87fa-43b31d7ef225",
      next: "/review/due?limit=5",
      tokenHash: null,
      type: null,
      supabase: makeSupabaseAuthClient({
        async exchangeCodeForSession(code) {
          calls.push(code);

          return { error: null };
        },
      }),
    });

    expect(result).toEqual({
      status: "confirmed",
      redirectTo: "/review/due?limit=5",
    });
    expect(calls).toEqual(["34e770dd-9ff9-416c-87fa-43b31d7ef225"]);
  });

  test("Magic Link request state validates without GET consumption and is consumed on POST", async () => {
    const firstState = createMagicLinkRequestState();
    const secondState = createMagicLinkRequestState();
    const { cookieStore, values, writes } = makePendingCookieStore();

    expect(firstState).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(secondState).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(secondState).not.toBe(firstState);
    await expect(
      storeMagicLinkRequestState({
        cookieStore,
        secure: true,
        state: firstState,
      })
    ).resolves.toBe(true);
    expect(values.get(AUTH_REQUEST_STATE_COOKIE_NAME)).toBe(firstState);
    expect(writes[0]?.options).toEqual(
      expect.objectContaining({
        httpOnly: true,
        maxAge: 600,
        path: "/auth",
        sameSite: "lax",
        secure: true,
      })
    );
    await expect(
      validateMagicLinkRequestState({
        cookieStore,
        state: secondState,
      })
    ).resolves.toBe(false);
    expect(values.get(AUTH_REQUEST_STATE_COOKIE_NAME)).toBe(firstState);
    await expect(
      validateMagicLinkRequestState({
        cookieStore,
        state: firstState,
      })
    ).resolves.toBe(true);
    expect(values.get(AUTH_REQUEST_STATE_COOKIE_NAME)).toBe(firstState);
    await expect(
      consumeMagicLinkRequestState({
        cookieStore,
        state: firstState,
      })
    ).resolves.toBe(true);
    await expect(
      consumeMagicLinkRequestState({
        cookieStore,
        state: firstState,
      })
    ).resolves.toBe(false);
  });

  test("email scanner GET stages a short-lived HttpOnly token without consuming it", async () => {
    const { cookieStore, writes } = makePendingCookieStore();
    const state = "a".repeat(43);
    const staged = await stagePendingMagicLinkConfirmation({
      cookieStore,
      next: "/review/due?limit=5",
      secure: true,
      state,
      tokenHash: "valid_token_hash",
      type: "email",
    });

    expect(staged).toBe(true);
    await expect(
      readPendingMagicLinkConfirmation({ cookieStore })
    ).resolves.toEqual({
      next: "/review/due?limit=5",
      tokenHash: "valid_token_hash",
      type: "email",
    });
    expect(writes).toHaveLength(4);
    for (const write of writes) {
      expect(write.options).toEqual(
        expect.objectContaining({
          httpOnly: true,
          maxAge: 600,
          path: "/auth",
          sameSite: "lax",
          secure: true,
        })
      );
    }
  });

  test("pending token requires an explicit one-time take and then fails closed", async () => {
    const { cookieStore } = makePendingCookieStore();
    const state = "a".repeat(43);

    await storeMagicLinkRequestState({
      cookieStore,
      secure: true,
      state,
    });

    await stagePendingMagicLinkConfirmation({
      cookieStore,
      next: "https://evil.example/steal",
      secure: true,
      state,
      tokenHash: "valid_token_hash",
      type: "email",
    });

    await expect(
      takePendingMagicLinkConfirmation({ cookieStore })
    ).resolves.toEqual({
      next: AUTH_DEFAULT_REDIRECT_PATH,
      tokenHash: "valid_token_hash",
      type: "email",
    });
    await expect(
      takePendingMagicLinkConfirmation({ cookieStore })
    ).resolves.toBeNull();
  });

  test("explicit POST fails closed when the staged token is bound to another request state", async () => {
    const { cookieStore, values } = makePendingCookieStore();
    const browserState = "a".repeat(43);

    await storeMagicLinkRequestState({
      cookieStore,
      secure: true,
      state: browserState,
    });
    await stagePendingMagicLinkConfirmation({
      cookieStore,
      next: "/dashboard",
      secure: true,
      state: "b".repeat(43),
      tokenHash: "valid_token_hash",
      type: "email",
    });

    await expect(
      takePendingMagicLinkConfirmation({ cookieStore })
    ).resolves.toBeNull();
    expect(values.has(AUTH_REQUEST_STATE_COOKIE_NAME)).toBe(false);
    expect(values.size).toBe(0);
  });

  test("scanner landing rejects malformed and non-email token types without cookie writes", async () => {
    for (const candidate of [
      { tokenHash: "bad token", type: "email" },
      { tokenHash: "valid_token_hash", type: "magiclink" },
      { tokenHash: "valid_token_hash", type: null },
    ]) {
      const { cookieStore, writes } = makePendingCookieStore();

      await expect(
        stagePendingMagicLinkConfirmation({
          cookieStore,
          next: "/dashboard",
          secure: true,
          state: "a".repeat(43),
          ...candidate,
        })
      ).resolves.toBe(false);
      expect(writes).toEqual([]);
    }

    expect(isValidAuthTokenHash("a".repeat(512))).toBe(true);
    expect(isValidAuthTokenHash("a".repeat(513))).toBe(false);
  });

  test("scanner-safe HTTP landing requires matching browser state and emits only a clean redirect", async () => {
    const state = "a".repeat(43);
    const tokenHash = "scanner_safe_token_hash";
    const url = new URL("/auth/confirm", baseUrl);
    url.searchParams.set("next", "/review/due?limit=5");
    url.searchParams.set("state", state);
    url.searchParams.set("token_hash", tokenHash);
    url.searchParams.set("type", "email");

    const rejected = await fetch(url, {
      redirect: "manual",
    });
    expect(rejected.status).toBe(303);
    expect(rejected.headers.get("location")).toContain(
      "/login?status=confirmation-error"
    );
    expect(rejected.headers.get("set-cookie") ?? "").not.toContain(
      "auth_pending_token_hash"
    );

    const accepted = await fetch(url, {
      headers: {
        cookie: `${AUTH_REQUEST_STATE_COOKIE_NAME}=${state}`,
      },
      redirect: "manual",
    });
    const acceptedCookies = accepted.headers.get("set-cookie") ?? "";
    const acceptedLocation = accepted.headers.get("location");

    expect(accepted.status).toBe(303);
    expect(acceptedLocation).not.toBeNull();
    expect(new URL(acceptedLocation as string).pathname).toBe(
      "/auth/continue"
    );
    expect(accepted.headers.get("cache-control")).toContain("no-store");
    expect(accepted.headers.get("referrer-policy")).toBe("no-referrer");
    expect(acceptedCookies).toContain("auth_pending_token_hash=");
    expect(acceptedCookies).toContain("auth_pending_request_state=");
    expect(acceptedCookies).toContain("HttpOnly");
    expect(acceptedCookies).toContain("SameSite=lax");
    expect(acceptedCookies).not.toContain(
      `${AUTH_REQUEST_STATE_COOKIE_NAME}=;`
    );
    expect(acceptedLocation).not.toContain(tokenHash);
    expect(await accepted.text()).not.toContain(tokenHash);

    const headResponse = await fetch(url, {
      headers: {
        cookie: `${AUTH_REQUEST_STATE_COOKIE_NAME}=${state}`,
      },
      method: "HEAD",
      redirect: "manual",
    });
    const headCookies = headResponse.headers.get("set-cookie") ?? "";

    expect(headResponse.status).toBe(303);
    expect(headCookies).toContain("auth_pending_token_hash=");
    expect(headCookies).toContain("auth_pending_request_state=");
    expect(headCookies).not.toContain(
      `${AUTH_REQUEST_STATE_COOKIE_NAME}=;`
    );
    expect(await headResponse.text()).toBe("");
  });

  test("redirect and pending-cookie bounds cover Unicode and double-encoding expansion", async () => {
    const oversizedUnicode = `/${"é".repeat(600)}`;
    const doubleEncodingExpansion = `/safe/${"%3D".repeat(300)}`;

    expect(normalizeAuthRedirectTarget(oversizedUnicode)).toBe(
      AUTH_DEFAULT_REDIRECT_PATH
    );
    expect(normalizeAuthRedirectTarget(doubleEncodingExpansion)).toBe(
      doubleEncodingExpansion
    );

    const { cookieStore, writes } = makePendingCookieStore();
    await expect(
      stagePendingMagicLinkConfirmation({
        cookieStore,
        next: doubleEncodingExpansion,
        secure: true,
        state: "a".repeat(43),
        tokenHash: "valid_token_hash",
        type: "email",
      })
    ).resolves.toBe(true);

    expect(writes.some(({ value }) => value === "%2Fdashboard")).toBe(true);
    await expect(
      readPendingMagicLinkConfirmation({ cookieStore })
    ).resolves.toEqual({
      next: AUTH_DEFAULT_REDIRECT_PATH,
      tokenHash: "valid_token_hash",
      type: "email",
    });
  });

  test("invalid reused and ambiguous PKCE codes fail safely", async () => {
    await expect(
      confirmSupabaseMagicLink({
        code: "not valid",
        next: "/saved",
        tokenHash: null,
        type: null,
        supabase: makeSupabaseAuthClient(),
      })
    ).resolves.toEqual({
      status: "rejected",
      reason: "missing_token",
      redirectTo: AUTH_DEFAULT_REDIRECT_PATH,
    });

    await expect(
      confirmSupabaseMagicLink({
        code: "34e770dd-9ff9-416c-87fa-43b31d7ef225",
        next: "/saved",
        tokenHash: null,
        type: null,
        supabase: makeSupabaseAuthClient({
          async exchangeCodeForSession() {
            return { error: { message: "reused" } };
          },
        }),
      })
    ).resolves.toEqual({
      status: "rejected",
      reason: "provider_rejected",
      redirectTo: AUTH_DEFAULT_REDIRECT_PATH,
    });

    await expect(
      confirmSupabaseMagicLink({
        code: "34e770dd-9ff9-416c-87fa-43b31d7ef225",
        next: "/saved",
        tokenHash: "valid_token_hash",
        type: "email",
        supabase: makeSupabaseAuthClient(),
      })
    ).resolves.toEqual({
      status: "rejected",
      reason: "provider_rejected",
      redirectTo: AUTH_DEFAULT_REDIRECT_PATH,
    });
  });

  test("invalid missing expired and reused token hashes fail safely", async () => {
    await expect(
      confirmSupabaseMagicLink({
        next: "/saved",
        tokenHash: null,
        type: "email",
        supabase: makeSupabaseAuthClient(),
      })
    ).resolves.toEqual({
      status: "rejected",
      reason: "missing_token",
      redirectTo: AUTH_DEFAULT_REDIRECT_PATH,
    });

    for (const providerError of ["expired", "reused", "invalid"]) {
      await expect(
        confirmSupabaseMagicLink({
          next: "/saved",
          tokenHash: "valid_token_hash",
          type: "email",
          supabase: makeSupabaseAuthClient({
            async verifyOtp() {
              return { error: { message: providerError } };
            },
          }),
        })
      ).resolves.toEqual({
        status: "rejected",
        reason: "provider_rejected",
        redirectTo: AUTH_DEFAULT_REDIRECT_PATH,
      });
    }
  });

  test("external redirect target is rejected", () => {
    for (const target of [
      "https://evil.example/dashboard",
      "//evil.example/dashboard",
      "javascript:alert(1)",
      "/%2f%2fevil.example",
      " /dashboard",
    ]) {
      expect(normalizeAuthRedirectTarget(target), target).toBe(
        AUTH_DEFAULT_REDIRECT_PATH
      );
    }
    expect(normalizeAuthRedirectTarget(`/${"a".repeat(1_024)}`)).toBe(
      AUTH_DEFAULT_REDIRECT_PATH
    );
  });

  test("safe relative redirect target is accepted", () => {
    expect(normalizeAuthRedirectTarget("/saved")).toBe("/saved");
    expect(normalizeAuthRedirectTarget("/review/due?limit=5#start")).toBe(
      "/review/due?limit=5#start"
    );
    expect(
      createAuthConfirmationUrl({
        next: "/saved",
        origin: "https://app.visuallexicon.test",
        state: "a".repeat(43),
      })
    ).toBe(
      `https://app.visuallexicon.test/auth/confirm?next=%2Fsaved&state=${"a".repeat(43)}`
    );
    expect(
      createAuthConfirmationUrl({
        next: "/saved",
        origin: "https://app.visuallexicon.test",
        state: "too-short",
      })
    ).toBeNull();
  });

  test("email syntax and confirmation failures have distinct non-enumerating states", () => {
    expect(
      createLoginRedirectPath({
        next: "/saved",
        status: "invalid-email",
      })
    ).toBe("/login?status=invalid-email&next=%2Fsaved");
    expect(
      createLoginRedirectPath({
        next: "/saved",
        status: "confirmation-error",
      })
    ).toBe("/login?status=confirmation-error&next=%2Fsaved");

    const loginPageSource = readProjectFile("src/app/login/page.tsx");
    const loginActionSource = readProjectFile("src/app/login/actions.ts");
    const confirmationRouteSource = readProjectFile(
      "src/app/auth/confirm/route.ts"
    );

    expect(loginPageSource).toContain("Use a valid email address and try again.");
    expect(loginPageSource).toContain("Sign-in link not accepted.");
    expect(loginActionSource).toContain('"invalid-email"');
    expect(confirmationRouteSource).toContain('"confirmation-error"');
    expect(confirmationRouteSource).toContain(
      "stagePendingMagicLinkConfirmation"
    );
    expect(confirmationRouteSource).toContain(
      "validateMagicLinkRequestState"
    );
    expect(confirmationRouteSource).not.toContain(
      "consumeMagicLinkRequestState"
    );
    expect(confirmationRouteSource).not.toContain("verifyOtp");
    expect(confirmationRouteSource).not.toContain("exchangeCodeForSession");
    expect(loginPageSource.toLowerCase()).not.toContain("account not found");
  });

  test("logout clears the session through the server-safe boundary", async () => {
    let signOutCalled = false;
    let clearCookiesCalled = false;
    const result = await signOutSupabaseSession({
      async clearAuthCookies() {
        clearCookiesCalled = true;
      },
      supabase: makeSupabaseAuthClient({
        async signOut() {
          signOutCalled = true;

          return { error: null };
        },
      }),
    });

    expect(result).toEqual({ status: "signed_out" });
    expect(signOutCalled).toBe(true);
    expect(clearCookiesCalled).toBe(true);
  });

  test("repeated logout is safe when the provider reports a missing session", async () => {
    let clearCookiesCalled = false;
    const result = await signOutSupabaseSession({
      async clearAuthCookies() {
        clearCookiesCalled = true;
      },
      supabase: makeSupabaseAuthClient({
        async signOut() {
          return {
            error: {
              name: "AuthSessionMissingError",
              message: "Session missing",
            },
          };
        },
      }),
    });

    expect(result).toEqual({ status: "signed_out" });
    expect(clearCookiesCalled).toBe(true);
  });

  test("failed logout does not claim success or clear cookies", async () => {
    let clearCookiesCalled = false;
    const result = await signOutSupabaseSession({
      async clearAuthCookies() {
        clearCookiesCalled = true;
      },
      supabase: makeSupabaseAuthClient({
        async signOut() {
          return {
            error: {
              name: "ProviderLogoutError",
              message: "Logout unavailable",
            },
          };
        },
      }),
    });

    expect(result).toEqual({ status: "failed" });
    expect(clearCookiesCalled).toBe(false);
  });

  test("Supabase auth cookie matcher targets auth cookies narrowly", () => {
    const projectRef = readSupabaseProjectRef("https://vlxproject.supabase.co");

    expect(projectRef).toBe("vlxproject");
    expect(
      isSupabaseAuthCookieName({
        name: "sb-vlxproject-auth-token",
        projectRef,
      })
    ).toBe(true);
    expect(
      isSupabaseAuthCookieName({
        name: "sb-vlxproject-auth-token.0",
        projectRef,
      })
    ).toBe(true);
    expect(
      isSupabaseAuthCookieName({
        name: "sb-vlxproject-auth-token-code-verifier",
        projectRef,
      })
    ).toBe(true);
    expect(
      isSupabaseAuthCookieName({
        name: "sb-otherproject-auth-token",
        projectRef,
      })
    ).toBe(false);
    expect(
      isSupabaseAuthCookieName({
        name: "vlx_saved_words_v1",
        projectRef,
      })
    ).toBe(false);
  });

  test("middleware refreshes cookies through an injected mock boundary", async () => {
    const request = {
      headers: new Headers(),
    };
    let getUserCalled = false;
    const response = await refreshSupabaseAuthCookies({
      request: request as never,
      createClient() {
        return {
          status: "configured",
          client: {
            auth: {
              async getUser() {
                getUserCalled = true;

                return {};
              },
            },
          },
        };
      },
    });

    expect(getUserCalled).toBe(true);
    expect(response.status).toBe(200);
  });

  test("middleware matcher excludes Next internals and static image assets", () => {
    const middlewareSource = readProjectFile("src/middleware.ts");

    expect(middlewareSource).toContain("_next/static");
    expect(middlewareSource).toContain("_next/image");
    expect(middlewareSource).toContain("favicon.ico");
    expect(middlewareSource).toContain("jpg");
    expect(middlewareSource).toContain("png");
    expect(middlewareSource).toContain("svg");
    expect(middlewareSource).toContain("webp");
  });

  test("logout action uses relative redirects and revalidates settings", () => {
    const actionSource = readProjectFile("src/app/settings/actions.ts");
    const settingsSource = readProjectFile("src/app/settings/page.tsx");

    expect(actionSource).toContain('revalidatePath("/settings")');
    expect(actionSource).toContain("redirect(`/settings?account=${accountStatus}`)");
    expect(actionSource).not.toContain("new URL(");
    expect(actionSource).not.toContain("http://");
    expect(actionSource).not.toContain("https://");
    expect(settingsSource).toContain('export const dynamic = "force-dynamic"');
  });

  test("guest routes remain usable without authentication", async ({ request }) => {
    for (const route of [
      "/dashboard",
      "/save?slug=dissonance&source=word_page",
      "/review",
      "/saved",
      "/packs",
      "/pricing",
    ]) {
      const response = await request.get(`${baseUrl}${route}`, {
        maxRedirects: 0,
      });

      expect(response.status(), route).toBeLessThan(400);
      expect(response.headers().location, route).toBeUndefined();
    }
  });

  test("DashboardV2 implementation remains untouched by auth changes", () => {
    const diff = execFileSync(
      "git",
      [
        "diff",
        "--name-only",
        "--",
        "src/components/views/dashboard-v2-view.tsx",
      ],
      {
        cwd: workspaceRoot,
        encoding: "utf8",
      }
    ).trim();

    expect(diff).toBe("");
  });

  test("authenticated principal derives from verified sub", async () => {
    await expect(
      readAccountPrincipal({
        verifier: async () => ({
          status: "verified",
          provider: "supabase",
          subject: "verified_sub",
          isAnonymous: false,
          accountId: "client_supplied_account",
        } as never),
      })
    ).resolves.toEqual({
      status: "authenticated",
      principal: {
        accountId: "verified_sub",
        provider: "supabase",
      },
    });

    await expect(
      readAuthAccountStatus({
        verifier: async () => ({
          status: "verified",
          provider: "supabase",
          subject: "verified_sub",
          isAnonymous: false,
        }),
      })
    ).resolves.toEqual({
      status: "signed_in",
    });
  });

  test("no tokens cookies raw claims appear in UI or auth responses", async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/login?status=sent&next=/dashboard`, {
      waitUntil: "networkidle",
    });

    const bodyText = await page.locator("body").innerText();
    await page.goto(`${baseUrl}/auth/continue`, {
      waitUntil: "networkidle",
    });
    const continueBodyText = await page.locator("body").innerText();
    const serializedResult = JSON.stringify(
      await confirmSupabaseMagicLink({
        next: "/dashboard",
        tokenHash: "valid_token_hash",
        type: "email",
        supabase: makeSupabaseAuthClient(),
      })
    );

    for (const forbidden of [
      "access_token",
      "refresh_token",
      "raw jwt",
      "token_hash",
      "valid_token_hash",
      "cookie",
      "claims",
      approvedLearnerEmail,
      missingLearnerEmail,
    ]) {
      expect(bodyText.toLowerCase()).not.toContain(forbidden);
      expect(continueBodyText.toLowerCase()).not.toContain(forbidden);
      expect(serializedResult.toLowerCase()).not.toContain(forbidden);
    }
  });

  test("login and settings use the Track B shell without mock workspace copy", async ({
    page,
  }) => {
    for (const route of ["/login", "/settings"] as const) {
      await page.goto(`${baseUrl}${route}`, {
        waitUntil: "networkidle",
      });

      await expect(page.locator(".track-b-shell"), route).toHaveCount(1);
      await expect(page.locator(".app-shell"), route).toHaveCount(0);
      await expect(
        page.getByText(["Mock learning", "workspace"].join(" "))
      ).toHaveCount(0);
    }
  });

  test("settings keeps account and local learning state truthful", async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/settings?account=logout-error`, {
      waitUntil: "networkidle",
    });

    await expect(page.getByText("Logout failed")).toBeVisible();
    await expect(page.getByText("Learning state")).toBeVisible();
    await expect(page.getByText("Browser-local only")).toBeVisible();
    await expect(page.getByText("Account Sync").first()).toBeVisible();
    await expect(page.getByText("Not connected").first()).toBeVisible();
    await expect(page.getByText("Billing").first()).toBeVisible();
    await expect(page.getByText("Not configured").first()).toBeVisible();
  });

  test("settings source keeps the three approved account states", () => {
    const settingsSource = readProjectFile("src/app/settings/page.tsx");

    expect(settingsSource).toContain("Signed in");
    expect(settingsSource).toContain("Signed out");
    expect(settingsSource).toContain("Auth unavailable");
    expect(settingsSource).toContain("logoutAction");
    expect(settingsSource).toContain("Account Sync");
    expect(settingsSource).toContain("Not connected");
    expect(settingsSource).toContain("Billing");
    expect(settingsSource).toContain("Not configured");
  });

  test("learning localStorage survives signed-out account state", async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/dashboard`, {
      waitUntil: "networkidle",
    });

    await page.evaluate((keys) => {
      for (const key of keys) {
        window.localStorage.setItem(key, JSON.stringify({ preserved: true }));
      }
    }, [...vlxLearningStorageKeys]);

    await page.goto(`${baseUrl}/settings?account=signed-out`, {
      waitUntil: "networkidle",
    });

    await expect(page.getByText("Signed out").first()).toBeVisible();
    await expect.poll(async () => {
      return page.evaluate((keys) => {
        return keys.every((key) => window.localStorage.getItem(key) !== null);
      }, [...vlxLearningStorageKeys]);
    })
      .toBe(true);
  });

  test("no Account Sync DB usage billing or payment implementation is added", () => {
    for (const relativePath of [
      "src/app/api/account/sync/apply",
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
      "pages/api",
      "supabase/migrations",
      "migrations",
      "db",
      "prisma",
      "drizzle",
      "src/db",
      "src/lib/db",
      "src/app/checkout",
      "src/app/billing",
      "src/app/payment",
      "src/app/payments",
    ]) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(
        false
      );
    }

    const appRouteHandlers = listFiles(join(workspaceRoot, "src", "app"))
      .filter((path) => basename(path) === "route.ts")
      .map(projectRelative);

    expect(appRouteHandlers).toEqual([
      "src/app/api/account/sync/digest/route.ts",
      "src/app/api/account/sync/preview/route.ts",
      allowedEntitlementReadRouteHandler,
      allowedAuthRouteHandler,
    ]);
    expect(existsSync(join(workspaceRoot, allowedMiddleware))).toBe(true);
  });

  test("no browser Supabase client or new storage key is added", () => {
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

    const authSource = [
      "src/lib/auth/redirects.ts",
      "src/lib/auth/session-flow.ts",
      "src/lib/auth/account-status.ts",
      "src/lib/auth/middleware.ts",
      "src/app/login/page.tsx",
      "src/app/login/actions.ts",
      "src/app/auth/confirm/route.ts",
      "src/app/auth/continue/page.tsx",
      "src/app/auth/continue/actions.ts",
      "src/lib/auth/pending-confirmation.ts",
      "src/app/settings/actions.ts",
      "src/middleware.ts",
    ]
      .map(readProjectFile)
      .join("\n");

    for (const forbidden of ["localStorage", "sessionStorage", "vlx_"]) {
      expect(authSource).not.toContain(forbidden);
    }
  });
});
