import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  ACCOUNT_STATES,
  CANONICAL_ENTITLEMENT_CATALOG,
  CAPABILITIES,
  ENTITLEMENT_LIFECYCLE_POLICIES,
  LIFECYCLE_STATES,
  PLAN_CATALOG,
  PRICING_VISIBLE_PLANS,
  UNLIMITED,
  WELCOME_AI_DEMO_CREDITS,
  can,
  limit,
  remaining,
  resolveEffectiveEntitlements,
  type Capability,
  type EffectiveEntitlements,
  type EntitlementLifecycleState,
  type LimitKey,
  type ManualGrant,
  type ResolveEffectiveEntitlementsInput,
  type UsageSnapshot
} from "../src/lib/entitlements";

const workspaceRoot = process.cwd();
const evaluatedAt = "2026-06-23T00:00:00.000Z";

function resolveBase(accountState: ResolveEffectiveEntitlementsInput["accountState"]) {
  return resolveEffectiveEntitlements({ accountState, evaluatedAt });
}

function numericRank(entitlements: EffectiveEntitlements, limitKey: LimitKey) {
  const value = limit(entitlements, limitKey);

  return value === UNLIMITED ? Number.POSITIVE_INFINITY : value;
}

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(workspaceRoot, relativePath), "utf8");
}

test.describe("Track B entitlement domain core", () => {
  test("imports the canonical JSON as the exact runtime catalog source", () => {
    const canonicalPath = join(
      workspaceRoot,
      "docs",
      "monetization",
      "v1",
      "vlx-plan-entitlements.v1.json"
    );
    const canonicalFromDisk = JSON.parse(readFileSync(canonicalPath, "utf8"));

    expect(CANONICAL_ENTITLEMENT_CATALOG).toEqual(canonicalFromDisk);
    expect(CANONICAL_ENTITLEMENT_CATALOG.resolution.formula).toBe(
      "base_plan + active_one_time_purchases + active_promotions + audited_manual_grants"
    );
    expect(CANONICAL_ENTITLEMENT_CATALOG.resolution.server_authoritative).toBe(
      true
    );
    expect(CANONICAL_ENTITLEMENT_CATALOG.resolution.client_plan_state_trusted).toBe(
      false
    );
  });

  test("normalizes every canonical base plan without copying price or plan values", () => {
    expect(ACCOUNT_STATES).toEqual([
      "guest",
      "free",
      "lite",
      "pro",
      "educator"
    ]);

    for (const accountState of ACCOUNT_STATES) {
      const canonicalPlan = CANONICAL_ENTITLEMENT_CATALOG.plans[accountState];
      const normalizedPlan = PLAN_CATALOG[accountState];

      expect(normalizedPlan.id).toBe(accountState);
      expect(normalizedPlan.name).toBe(canonicalPlan.name);
      expect(normalizedPlan.publicPricingCard).toBe(
        canonicalPlan.is_public_plan
      );
      expect(normalizedPlan.price).toEqual(canonicalPlan.price);
      expect(resolveBase(accountState).planId).toBe(accountState);
    }

    expect(PLAN_CATALOG.lite.price.KRW).toEqual({
      monthly: 7900,
      annual: 59000
    });
    expect(PLAN_CATALOG.lite.price.USD).toEqual({
      monthly: 7.99,
      annual: 59.99
    });
    expect(PLAN_CATALOG.pro.price.KRW).toEqual({
      monthly: 14900,
      annual: 119000
    });
    expect(PLAN_CATALOG.pro.price.USD).toEqual({
      monthly: 14.99,
      annual: 119.99
    });
    expect(PLAN_CATALOG.educator.price.KRW).toEqual({
      monthly: null,
      annual: 399000
    });
    expect(PLAN_CATALOG.educator.price.USD).toEqual({
      monthly: null,
      annual: 249
    });
  });

  test("keeps Guest and Free distinct and exposes only Free/Lite/Pro pricing cards", () => {
    expect(ACCOUNT_STATES).toContain("guest");
    expect(ACCOUNT_STATES).toContain("free");
    expect(PRICING_VISIBLE_PLANS).toEqual(["free", "lite", "pro"]);
    expect(PRICING_VISIBLE_PLANS).not.toContain("guest");
    expect(PLAN_CATALOG.guest.publicPricingCard).toBe(false);
    expect(PLAN_CATALOG.free.publicPricingCard).toBe(true);
    expect(PLAN_CATALOG.guest.limits["learning.saved_words"]).toBe(10);
    expect(PLAN_CATALOG.free.limits["learning.saved_words"]).toBe(50);
    expect(PLAN_CATALOG.guest.capabilities["learning.local_only_storage"]).toBe(
      true
    );
    expect(PLAN_CATALOG.free.capabilities["learning.account_sync"]).toBe(true);
  });

  test("inherits Pro into Educator and adds only canonical classroom allowances", () => {
    const pro = resolveBase("pro");
    const educator = resolveBase("educator");

    for (const capability of CAPABILITIES.filter((item) => can(pro, item))) {
      expect(can(educator, capability), capability).toBe(true);
    }

    expect(can(educator, "classroom.seats")).toBe(true);
    expect(can(educator, "classroom.class_decks")).toBe(true);
    expect(can(educator, "classroom.assignments")).toBe(true);
    expect(can(educator, "classroom.student_progress")).toBe(true);
    expect(can(educator, "classroom.csv_roster")).toBe(true);
    expect(can(educator, "classroom.printable_answer_keys")).toBe(true);
    expect(limit(educator, "classroom.seats")).toBe(30);
    expect(limit(educator, "downloads.monthly_total")).toBe(2000);
    expect(educator.lifecycle.learningDataPolicy).toEqual({
      preserve: true,
      mutation: "none_policy_only"
    });
  });

  test("enforces canonical download and AI base-plan invariants", () => {
    const free = resolveBase("free");
    const lite = resolveBase("lite");
    const pro = resolveBase("pro");

    expect(can(free, "downloads.standard")).toBe(false);
    expect(limit(free, "downloads.monthly_total")).toBe(0);

    expect(can(lite, "assets.clean_standard")).toBe(true);
    expect(can(lite, "downloads.standard")).toBe(true);
    expect(limit(lite, "downloads.standard_monthly")).toBe(100);
    expect(limit(lite, "downloads.hd_monthly")).toBe(0);

    for (const capability of CAPABILITIES.filter((item) => can(lite, item))) {
      expect(can(pro, capability), capability).toBe(true);
    }

    expect(limit(free, "ai.personalized_mistake_explanations_monthly")).toBe(0);
    expect(limit(lite, "ai.personalized_mistake_explanations_monthly")).toBe(0);
    expect(can(free, "ai.monthly_personalized_mistake_explanations")).toBe(
      false
    );
    expect(can(lite, "ai.monthly_personalized_mistake_explanations")).toBe(
      false
    );
    expect(can(pro, "ai.monthly_personalized_mistake_explanations")).toBe(true);
    expect(pro.assetPolicy.commercialRightsAreNotImpliedByWatermarkRemoval).toBe(
      true
    );
  });

  test("keeps Guest to Free to Lite to Pro learning inheritance monotonic", () => {
    const plans = ["guest", "free", "lite", "pro"] as const;
    const learningCapabilities: Capability[] = [
      "learning.save_words",
      "learning.daily_review",
      "learning.due_queue_sample",
      "question.image_to_word",
      "question.definition_to_word",
      "packs.public_preview",
      "ai.static_approved_feedback"
    ];
    const monotonicLimits: LimitKey[] = [
      "learning.saved_words",
      "learning.daily_review_cards",
      "learning.history_days",
      "learning.custom_decks",
      "packs.exam_preview_cards"
    ];

    for (let index = 1; index < plans.length; index += 1) {
      const previous = resolveBase(plans[index - 1]);
      const current = resolveBase(plans[index]);

      for (const capability of learningCapabilities) {
        if (can(previous, capability)) {
          expect(can(current, capability), `${plans[index]} ${capability}`).toBe(
            true
          );
        }
      }

      for (const limitKey of monotonicLimits) {
        expect(numericRank(current, limitKey), `${plans[index]} ${limitKey}`).toBeGreaterThanOrEqual(
          numericRank(previous, limitKey)
        );
      }
    }
  });

  test("applies welcome_ai_demo as a three-credit promotion, not a plan capability", () => {
    const freeBase = resolveBase("free");
    const promotedFree = resolveEffectiveEntitlements({
      accountState: "free",
      evaluatedAt,
      promotions: [
        {
          grantId: "promo-free-welcome",
          promotionId: "welcome_ai_demo",
          issuedAt: evaluatedAt
        },
        {
          grantId: "promo-free-welcome-duplicate",
          promotionId: "welcome_ai_demo",
          issuedAt: evaluatedAt
        }
      ]
    });

    expect(WELCOME_AI_DEMO_CREDITS).toBe(3);
    expect(
      limit(freeBase, "ai.personalized_mistake_explanation_lifetime_credits")
    ).toBe(0);
    expect(can(freeBase, "ai.promotional_mistake_explanation_credits")).toBe(
      false
    );
    expect(
      limit(
        promotedFree,
        "ai.personalized_mistake_explanation_lifetime_credits"
      )
    ).toBe(3);
    expect(
      limit(
        promotedFree,
        "ai.personalized_mistake_explanations_monthly"
      )
    ).toBe(0);
    expect(
      can(promotedFree, "ai.monthly_personalized_mistake_explanations")
    ).toBe(false);
    expect(can(promotedFree, "ai.promotional_mistake_explanation_credits")).toBe(
      true
    );
    expect(promotedFree.ignoredGrantIds).toEqual([
      "promo-free-welcome-duplicate"
    ]);
  });

  test("adds purchased Academic, IELTS, and GRE pack grants separately from subscription state", () => {
    const freeWithPacks = resolveEffectiveEntitlements({
      accountState: "free",
      evaluatedAt,
      oneTimePurchases: [
        {
          grantId: "purchase-academic",
          productId: "exam_pack_academic",
          purchasedAt: evaluatedAt
        },
        {
          grantId: "purchase-ielts",
          productId: "exam_pack_ielts",
          purchasedAt: evaluatedAt
        },
        {
          grantId: "purchase-gre",
          productId: "exam_pack_gre",
          purchasedAt: evaluatedAt
        }
      ]
    });

    expect(freeWithPacks.planId).toBe("free");
    expect(freeWithPacks.purchasedPacks).toEqual([
      "pack:academic",
      "pack:gre-verbal",
      "pack:ielts-writing"
    ]);
    expect(can(freeWithPacks, "pack:academic")).toBe(true);
    expect(can(freeWithPacks, "pack:ielts-writing")).toBe(true);
    expect(can(freeWithPacks, "pack:gre-verbal")).toBe(true);
    expect(can(freeWithPacks, "downloads.standard")).toBe(false);
  });

  test("rejects unaudited manual grants and ignores expired grants", () => {
    const invalidManualGrant = {
      grantId: "manual-missing-audit",
      capabilities: ["downloads.standard"]
    } as unknown as ManualGrant;

    expect(() =>
      resolveEffectiveEntitlements({
        accountState: "free",
        evaluatedAt,
        manualGrants: [invalidManualGrant]
      })
    ).toThrow(/missing audit metadata/);

    const expired = resolveEffectiveEntitlements({
      accountState: "free",
      evaluatedAt,
      oneTimePurchases: [
        {
          grantId: "expired-purchase",
          productId: "exam_pack_academic",
          purchasedAt: "2026-01-01T00:00:00.000Z",
          expiresAt: "2026-01-02T00:00:00.000Z"
        }
      ],
      promotions: [
        {
          grantId: "expired-promotion",
          promotionId: "welcome_ai_demo",
          issuedAt: "2026-01-01T00:00:00.000Z",
          expiresAt: "2026-01-02T00:00:00.000Z"
        }
      ],
      manualGrants: [
        {
          grantId: "expired-manual",
          reason: "temporary review restore",
          issuedBy: "owner",
          issuedAt: "2026-01-01T00:00:00.000Z",
          expiresAt: "2026-01-02T00:00:00.000Z",
          auditId: "audit-expired-manual",
          capabilities: ["downloads.standard"]
        }
      ]
    });

    expect(expired.ignoredGrantIds).toEqual([
      "expired-purchase",
      "expired-promotion",
      "expired-manual"
    ]);
    expect(can(expired, "pack:academic")).toBe(false);
    expect(can(expired, "downloads.standard")).toBe(false);
    expect(
      limit(expired, "ai.personalized_mistake_explanation_lifetime_credits")
    ).toBe(0);
  });

  test("preserves unlimited limits and clamps remaining allowance without mutating usage", () => {
    const lite = resolveBase("lite");
    const pro = resolveBase("pro");
    const usage: UsageSnapshot = {
      "downloads.standard_monthly": 150,
      "learning.saved_words": 9999
    };
    const before = JSON.stringify(usage);

    expect(limit(lite, "learning.saved_words")).toBe(UNLIMITED);
    expect(remaining(lite, "learning.saved_words", usage)).toBe(UNLIMITED);
    expect(remaining(lite, "downloads.standard_monthly", usage)).toBe(0);
    expect(remaining(pro, "downloads.standard_monthly", usage)).toBe(350);
    expect(remaining(pro, "downloads.hd_monthly", { "downloads.hd_monthly": 600 })).toBe(
      0
    );
    expect(JSON.stringify(usage)).toBe(before);
  });

  test("does not mutate resolver input objects", () => {
    const input: ResolveEffectiveEntitlementsInput = {
      accountState: "lite",
      evaluatedAt,
      oneTimePurchases: [
        {
          grantId: "purchase-bundle",
          productId: "exam_pack_bundle",
          purchasedAt: evaluatedAt
        }
      ],
      promotions: [
        {
          grantId: "promo-lite-welcome",
          promotionId: "welcome_ai_demo",
          issuedAt: evaluatedAt
        }
      ],
      manualGrants: [
        {
          grantId: "manual-standard-download-topup",
          reason: "support adjustment",
          issuedBy: "owner",
          issuedAt: evaluatedAt,
          expiresAt: "2026-07-23T00:00:00.000Z",
          auditId: "audit-manual-standard-download-topup",
          limits: {
            "downloads.standard_monthly": 10
          }
        }
      ]
    };
    const before = JSON.stringify(input);
    const entitlements = resolveEffectiveEntitlements(input);

    expect(JSON.stringify(input)).toBe(before);
    expect(limit(entitlements, "downloads.standard_monthly")).toBe(110);
    expect(entitlements.purchasedPacks).toEqual([
      "pack:academic",
      "pack:gre-verbal",
      "pack:ielts-writing"
    ]);
  });

  test("applies every canonical lifecycle state as entitlement policy only", () => {
    expect(LIFECYCLE_STATES).toEqual([
      "active",
      "canceled_at_period_end",
      "past_due_grace",
      "expired",
      "refunded_or_chargeback"
    ] satisfies EntitlementLifecycleState[]);
    expect(ENTITLEMENT_LIFECYCLE_POLICIES).toEqual(
      CANONICAL_ENTITLEMENT_CATALOG.lifecycle
    );

    const active = resolveEffectiveEntitlements({
      accountState: "pro",
      evaluatedAt,
      lifecycle: { state: "active" }
    });
    expect(active.planId).toBe("pro");
    expect(active.lifecycle.policy).toBe("full_plan_entitlements");
    expect(can(active, "downloads.hd")).toBe(true);
    expect(can(active, "ai.monthly_personalized_mistake_explanations")).toBe(
      true
    );

    const canceledBeforePeriodEnd = resolveEffectiveEntitlements({
      accountState: "pro",
      evaluatedAt,
      lifecycle: {
        state: "canceled_at_period_end",
        currentPeriodEnd: "2026-07-01T00:00:00.000Z"
      }
    });
    expect(canceledBeforePeriodEnd.planId).toBe("pro");
    expect(canceledBeforePeriodEnd.lifecycle.policy).toBe(
      "full_plan_entitlements_until_current_period_end"
    );
    expect(can(canceledBeforePeriodEnd, "downloads.hd")).toBe(true);

    const canceledAfterPeriodEnd = resolveEffectiveEntitlements({
      accountState: "pro",
      evaluatedAt,
      lifecycle: {
        state: "canceled_at_period_end",
        currentPeriodEnd: "2026-01-01T00:00:00.000Z"
      }
    });
    expect(canceledAfterPeriodEnd.planId).toBe("free");
    expect(canceledAfterPeriodEnd.lifecycle.policy).toBe(
      "expired_fallback_to_free"
    );
    expect(can(canceledAfterPeriodEnd, "downloads.standard")).toBe(false);

    const pastDue = resolveEffectiveEntitlements({
      accountState: "pro",
      evaluatedAt,
      lifecycle: {
        state: "past_due_grace",
        graceStartedAt: "2026-06-20T00:00:00.000Z"
      }
    });
    expect(pastDue.planId).toBe("pro");
    expect(pastDue.lifecycle.policy).toBe("past_due_grace_learning_only");
    expect(can(pastDue, "learning.history")).toBe(true);
    expect(can(pastDue, "downloads.standard")).toBe(false);
    expect(can(pastDue, "ai.monthly_personalized_mistake_explanations")).toBe(
      false
    );
    expect(limit(pastDue, "downloads.monthly_total")).toBe(0);
    expect(limit(pastDue, "ai.personalized_mistake_explanations_monthly")).toBe(
      0
    );

    const expired = resolveEffectiveEntitlements({
      accountState: "pro",
      evaluatedAt,
      lifecycle: { state: "expired" },
      oneTimePurchases: [
        {
          grantId: "expired-state-academic-pack",
          productId: "exam_pack_academic",
          purchasedAt: evaluatedAt
        }
      ]
    });
    expect(expired.planId).toBe("free");
    expect(expired.lifecycle.policy).toBe("expired_fallback_to_free");
    expect(can(expired, "downloads.standard")).toBe(false);
    expect(can(expired, "pack:academic")).toBe(true);
    expect(expired.lifecycle.learningDataPolicy).toEqual({
      preserve: true,
      mutation: "none_policy_only"
    });

    const refunded = resolveEffectiveEntitlements({
      accountState: "pro",
      evaluatedAt,
      lifecycle: {
        state: "refunded_or_chargeback",
        verifiedAt: evaluatedAt
      },
      oneTimePurchases: [
        {
          grantId: "refunded-pack",
          productId: "exam_pack_academic",
          purchasedAt: evaluatedAt
        }
      ],
      promotions: [
        {
          grantId: "refunded-promo",
          promotionId: "welcome_ai_demo",
          issuedAt: evaluatedAt
        }
      ]
    });
    expect(refunded.planId).toBe("free");
    expect(refunded.lifecycle.policy).toBe(
      "refunded_or_chargeback_revoke_paid_grants"
    );
    expect(refunded.lifecycle.supportReviewRequired).toBe(true);
    expect(refunded.ignoredGrantIds).toEqual([
      "refunded-pack",
      "refunded-promo"
    ]);
    expect(can(refunded, "pack:academic")).toBe(false);
    expect(
      limit(refunded, "ai.personalized_mistake_explanation_lifetime_credits")
    ).toBe(0);
  });

  test("fails closed for unknown or malformed trusted-domain input", () => {
    expect(() =>
      resolveEffectiveEntitlements({
        accountState: "enterprise",
        evaluatedAt
      } as unknown as ResolveEffectiveEntitlementsInput)
    ).toThrow(/unknown accountState/);

    expect(() =>
      resolveEffectiveEntitlements({
        accountState: "free",
        evaluatedAt: "not-a-date"
      })
    ).toThrow(/Invalid entitlement timestamp/);

    expect(() =>
      resolveEffectiveEntitlements({
        accountState: "free",
        evaluatedAt,
        lifecycle: { state: "trialing" }
      } as unknown as ResolveEffectiveEntitlementsInput)
    ).toThrow(/unknown lifecycle state/);

    expect(() =>
      resolveEffectiveEntitlements({
        accountState: "free",
        evaluatedAt,
        oneTimePurchases: [
          {
            grantId: "unknown-product",
            productId: "exam_pack_unknown",
            purchasedAt: evaluatedAt
          }
        ]
      } as unknown as ResolveEffectiveEntitlementsInput)
    ).toThrow(/unknown additive product/);

    expect(() =>
      resolveEffectiveEntitlements({
        accountState: "free",
        evaluatedAt,
        manualGrants: [
          {
            grantId: "bad-manual-capability",
            reason: "support test",
            issuedBy: "owner",
            issuedAt: evaluatedAt,
            expiresAt: "2026-07-01T00:00:00.000Z",
            auditId: "audit-bad-manual-capability",
            capabilities: ["admin.override"]
          }
        ]
      } as unknown as ResolveEffectiveEntitlementsInput)
    ).toThrow(/unknown capability/);

    expect(() =>
      resolveEffectiveEntitlements(null as unknown as ResolveEffectiveEntitlementsInput)
    ).toThrow(/input must be an object/);
  });

  test("emits deterministic provenance for grants and sorted pack access", () => {
    const input: ResolveEffectiveEntitlementsInput = {
      accountState: "lite",
      evaluatedAt,
      oneTimePurchases: [
        {
          grantId: "purchase-gre",
          productId: "exam_pack_gre",
          purchasedAt: evaluatedAt
        },
        {
          grantId: "purchase-academic",
          productId: "exam_pack_academic",
          purchasedAt: evaluatedAt
        }
      ],
      promotions: [
        {
          grantId: "promotion-welcome",
          promotionId: "welcome_ai_demo",
          issuedAt: evaluatedAt
        }
      ],
      manualGrants: [
        {
          grantId: "manual-hd-download",
          reason: "owner support adjustment",
          issuedBy: "owner",
          issuedAt: evaluatedAt,
          expiresAt: "2026-07-01T00:00:00.000Z",
          auditId: "audit-manual-hd-download",
          capabilities: ["downloads.hd"],
          limits: {
            "downloads.hd_monthly": 2
          }
        }
      ]
    };
    const first = resolveEffectiveEntitlements(input);
    const second = resolveEffectiveEntitlements(JSON.parse(JSON.stringify(input)));

    expect(first.sources).toEqual(second.sources);
    expect(first.activeGrants).toEqual(second.activeGrants);
    expect(first.purchasedPacks).toEqual([
      "pack:academic",
      "pack:gre-verbal"
    ]);
    expect(first.sources).toEqual([
      "base_plan:lite",
      "lifecycle:active",
      "one_time_purchase:purchase-gre:exam_pack_gre",
      "one_time_purchase:purchase-academic:exam_pack_academic",
      "promotion:promotion-welcome:welcome_ai_demo",
      "manual:audit-manual-hd-download"
    ]);
  });

  test("keeps the pure domain free of client, auth, API, billing, payment, and React authority", () => {
    const pureDomainFiles = [
      "src/lib/entitlements/types.ts",
      "src/lib/entitlements/catalog.ts",
      "src/lib/entitlements/resolver.ts"
    ];
    const forbiddenSourcePattern =
      /localStorage|sessionStorage|cookies\(|headers\(|query|stringParams|process\.env|@supabase|from ["']react["']|createContext|useContext|stripe|paddle|billing|checkout|payment|route\.ts|middleware/i;

    for (const relativePath of pureDomainFiles) {
      expect(readWorkspaceFile(relativePath), relativePath).not.toMatch(
        forbiddenSourcePattern
      );
    }

    expect(
      readWorkspaceFile("src/app/api/me/entitlements/route.ts")
    ).not.toContain("local-entitlements");
    expect(existsSync(join(workspaceRoot, "middleware.ts"))).toBe(false);

    const sourceMiddlewarePath = join(workspaceRoot, "src", "middleware.ts");

    if (existsSync(sourceMiddlewarePath)) {
      expect(readFileSync(sourceMiddlewarePath, "utf8")).not.toMatch(
        /@\/lib\/entitlements|local-entitlements|resolveEffectiveEntitlements/
      );
    }
  });

  test("keeps package/config files and storage-key contracts unchanged", () => {
    const packageConfigDiff = execFileSync(
      "git",
      [
        "diff",
        "--name-only",
        "--",
        "package.json",
        "package-lock.json",
        "next-env.d.ts",
        "tsconfig.json"
      ],
      { cwd: workspaceRoot }
    )
      .toString()
      .trim();

    expect(packageConfigDiff).toBe("");

    const addedStorageKeyLines = execFileSync(
      "git",
      [
        "diff",
        "--unified=0",
        "--",
        "src/lib/entitlements",
        "docs/TRACK_B_ENTITLEMENT_DOMAIN_CORE.md"
      ],
      { cwd: workspaceRoot }
    )
      .toString()
      .split(/\r?\n/)
      .filter((line) => line.startsWith("+") && /vlx_[a-z0-9_]+_v1/.test(line));

    expect(addedStorageKeyLines).toEqual([]);
  });
});
