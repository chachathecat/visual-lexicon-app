import { expect, test } from "@playwright/test";

import {
  FACTORY_RISK_CLASSIFIER_VERSION,
  classifyChangedFilePathForFactoryRisk,
  classifyFactoryRisk,
  type FactoryRiskClassification,
  type FactoryRiskClassifierVersion
} from "../src/lib/factory/risk-classifier";

type FactoryRiskClassifierTypeSurface = {
  version: FactoryRiskClassifierVersion;
  classification: FactoryRiskClassification;
};

const typeSmoke: FactoryRiskClassifierTypeSurface = {
  version: FACTORY_RISK_CLASSIFIER_VERSION,
  classification: classifyFactoryRisk({
    changedFiles: ["docs/product-copy-notes.md"]
  })
};

function classifySingle(path: string) {
  return classifyFactoryRisk({ changedFiles: [path] });
}

test.describe("factory risk classifier", () => {
  test("exports the required versioned output contract", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      classification: {
        version: 1,
        risk: "low",
        reasons: expect.any(Array),
        protectedPaths: [],
        requiresOwnerApproval: false,
        autoMergeEligible: false,
        changedFiles: ["docs/product-copy-notes.md"]
      }
    });
  });

  test("empty or missing change set fails closed as high risk", () => {
    for (const input of [
      {},
      { changedFiles: null },
      { changedFiles: [] }
    ]) {
      expect(classifyFactoryRisk(input)).toMatchObject({
        risk: "high",
        changedFiles: [],
        requiresOwnerApproval: true,
        autoMergeEligible: false,
        protectedPaths: [],
        reasons: [
          "empty_change_set",
          "high_risk_requires_owner_approval",
          "auto_merge_disabled_v1"
        ]
      });
    }
  });

  test("unknown path fails closed as high risk", () => {
    expect(classifySingle("scripts/new-experimental-tool.ts")).toMatchObject({
      risk: "high",
      protectedPaths: ["scripts/new-experimental-tool.ts"],
      requiresOwnerApproval: true,
      autoMergeEligible: false,
      reasons: expect.arrayContaining([
        "high_path:scripts/new-experimental-tool.ts:unknown_path",
        "high_risk_requires_owner_approval"
      ])
    });
  });

  test("unknown task surface fails closed as high risk", () => {
    expect(
      classifyFactoryRisk({
        changedFiles: ["docs/product-copy-notes.md"],
        taskSurface: "mystery surface"
      })
    ).toMatchObject({
      risk: "high",
      protectedPaths: [],
      requiresOwnerApproval: true,
      autoMergeEligible: false,
      reasons: [
        "unknown_task_surface:mystery_surface",
        "low_path:docs/product-copy-notes.md:docs_only",
        "high_risk_requires_owner_approval",
        "auto_merge_disabled_v1"
      ]
    });
  });

  test("docs-only safe paths classify as low risk", () => {
    expect(classifySingle("docs/product-copy-notes.md")).toMatchObject({
      risk: "low",
      protectedPaths: [],
      requiresOwnerApproval: false,
      autoMergeEligible: false,
      reasons: [
        "low_path:docs/product-copy-notes.md:docs_only",
        "auto_merge_disabled_v1"
      ]
    });
  });

  test("tests-only safe paths classify as low risk", () => {
    expect(classifySingle("tests/review-state-regression.spec.ts")).toMatchObject({
      risk: "low",
      protectedPaths: [],
      requiresOwnerApproval: false,
      autoMergeEligible: false,
      reasons: [
        "low_path:tests/review-state-regression.spec.ts:tests_only",
        "auto_merge_disabled_v1"
      ]
    });
  });

  test("factory-named tests-only paths classify as low risk", () => {
    expect(classifySingle("tests/factory-risk-classifier.spec.ts")).toMatchObject({
      risk: "low",
      protectedPaths: [],
      requiresOwnerApproval: false,
      autoMergeEligible: false,
      reasons: [
        "low_path:tests/factory-risk-classifier.spec.ts:tests_only",
        "auto_merge_disabled_v1"
      ]
    });
  });

  test("fixture-only safe paths classify as low risk", () => {
    expect(classifySingle("src/lib/packs/fixtures.ts")).toMatchObject({
      risk: "low",
      protectedPaths: [],
      requiresOwnerApproval: false,
      autoMergeEligible: false,
      reasons: [
        "low_path:src/lib/packs/fixtures.ts:fixtures_only",
        "auto_merge_disabled_v1"
      ]
    });
  });

  test("known non-behavioral refactor surfaces can classify safe paths as low risk", () => {
    expect(
      classifyFactoryRisk({
        changedFiles: ["src/lib/srs/selectors.ts"],
        taskSurface: "non_behavioral_refactor"
      })
    ).toMatchObject({
      risk: "low",
      protectedPaths: [],
      requiresOwnerApproval: false,
      autoMergeEligible: false,
      reasons: [
        "task_surface:non_behavioral_refactor:low",
        "low_path:src/lib/srs/selectors.ts:known_safe_non_behavioral_refactor",
        "auto_merge_disabled_v1"
      ]
    });
  });

  test("product UI paths classify as medium risk", () => {
    expect(classifySingle("src/components/views/dashboard-view.tsx")).toMatchObject({
      risk: "medium",
      protectedPaths: [],
      requiresOwnerApproval: false,
      autoMergeEligible: false,
      reasons: [
        "medium_path:src/components/views/dashboard-view.tsx:product_ui",
        "auto_merge_disabled_v1"
      ]
    });
  });

  test("app and server safe logic paths classify as medium risk", () => {
    expect(classifySingle("src/lib/srs/engine.ts")).toMatchObject({
      risk: "medium",
      protectedPaths: [],
      requiresOwnerApproval: false,
      autoMergeEligible: false,
      reasons: [
        "medium_path:src/lib/srs/engine.ts:app_server_logic",
        "auto_merge_disabled_v1"
      ]
    });
  });

  test("high-risk protected surfaces classify as high risk", () => {
    const protectedCases = [
      ["src/lib/auth/session-flow.ts", "auth_session"],
      ["supabase/migrations/20260101000000_learning_rls.sql", "database_rls"],
      ["src/lib/account-persistence/sync-harness/harness.ts", "account_sync"],
      ["src/lib/billing-entitlements/types.ts", "entitlement_grant"],
      ["src/lib/usage-ledger/ledger.ts", "usage_ledger"],
      ["src/app/api/billing/webhook/route.ts", "billing_webhook_refund"],
      ["src/app/api/downloads/authorize/route.ts", "private_asset_download"],
      ["src/lib/ai/provider.ts", "ai_provider"],
      [".env.local", "secrets_env"],
      [".github/workflows/risk-gate.yml", "github_workflows"],
      [".github/CODEOWNERS", "codeowners"],
      ["AGENTS.md", "agents_policy"],
      ["docs/AUTONOMOUS_DELIVERY_POLICY.md", "agents_policy"],
      [
        "docs/roadmap/vlx-autonomous-factory-roadmap.v1.json",
        "roadmap_release_control_plane"
      ],
      ["docs/release_checklist.md", "roadmap_release_control_plane"],
      ["src/lib/factory/risk-classifier.ts", "roadmap_release_control_plane"]
    ] as const;

    for (const [path, ruleId] of protectedCases) {
      const classification = classifySingle(path);

      expect(classification, path).toMatchObject({
        risk: "high",
        protectedPaths: [path.toLowerCase()],
        requiresOwnerApproval: true,
        autoMergeEligible: false,
        reasons: expect.arrayContaining([
          `high_path:${path.toLowerCase()}:${ruleId}`,
          "high_risk_requires_owner_approval",
          "auto_merge_disabled_v1"
        ])
      });
    }
  });

  test("canonical monetization paths classify as high risk", () => {
    expect(
      classifySingle("docs/monetization/v1/vlx-plan-entitlements.v1.json")
    ).toMatchObject({
      risk: "high",
      protectedPaths: [
        "docs/monetization/v1/vlx-plan-entitlements.v1.json"
      ],
      requiresOwnerApproval: true,
      autoMergeEligible: false,
      reasons: expect.arrayContaining([
        "high_path:docs/monetization/v1/vlx-plan-entitlements.v1.json:canonical_monetization"
      ])
    });
  });

  test("mixed low and high paths classify the whole change set as high risk", () => {
    expect(
      classifyFactoryRisk({
        changedFiles: [
          "docs/product-copy-notes.md",
          "src/lib/auth/session-flow.ts"
        ]
      })
    ).toMatchObject({
      risk: "high",
      protectedPaths: ["src/lib/auth/session-flow.ts"],
      requiresOwnerApproval: true,
      autoMergeEligible: false,
      reasons: [
        "low_path:docs/product-copy-notes.md:docs_only",
        "high_path:src/lib/auth/session-flow.ts:auth_session",
        "high_risk_requires_owner_approval",
        "auto_merge_disabled_v1"
      ]
    });
  });

  test("current PR self-classification keeps only the classifier module protected", () => {
    expect(
      classifyFactoryRisk({
        changedFiles: [
          "src/lib/factory/risk-classifier.ts",
          "tests/factory-risk-classifier.spec.ts"
        ]
      })
    ).toMatchObject({
      risk: "high",
      protectedPaths: ["src/lib/factory/risk-classifier.ts"],
      requiresOwnerApproval: true,
      autoMergeEligible: false,
      reasons: [
        "high_path:src/lib/factory/risk-classifier.ts:roadmap_release_control_plane",
        "low_path:tests/factory-risk-classifier.spec.ts:tests_only",
        "high_risk_requires_owner_approval",
        "auto_merge_disabled_v1"
      ]
    });
  });

  test("high-risk classifications return protected paths and stable reasons", () => {
    const first = classifyFactoryRisk({
      changedFiles: [
        "src/lib/auth/session-flow.ts",
        "docs/product-copy-notes.md",
        "src/lib/auth/session-flow.ts"
      ]
    });
    const second = classifyFactoryRisk({
      changedFiles: [
        ".\\src\\lib\\auth\\session-flow.ts",
        "./docs/product-copy-notes.md"
      ]
    });

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      risk: "high",
      changedFiles: [
        "docs/product-copy-notes.md",
        "src/lib/auth/session-flow.ts"
      ],
      protectedPaths: ["src/lib/auth/session-flow.ts"],
      reasons: [
        "low_path:docs/product-copy-notes.md:docs_only",
        "high_path:src/lib/auth/session-flow.ts:auth_session",
        "high_risk_requires_owner_approval",
        "auto_merge_disabled_v1"
      ]
    });
  });

  test("autoMergeEligible remains false for low medium and high risk in v1", () => {
    expect(classifySingle("docs/product-copy-notes.md").autoMergeEligible).toBe(
      false
    );
    expect(classifySingle("src/lib/srs/engine.ts").autoMergeEligible).toBe(
      false
    );
    expect(
      classifySingle("src/lib/auth/session-flow.ts").autoMergeEligible
    ).toBe(false);
  });

  test("single-path helper uses the same deterministic path rules", () => {
    expect(
      classifyChangedFilePathForFactoryRisk(
        ".\\SRC\\Components\\Views\\Dashboard-View.tsx"
      )
    ).toEqual({
      path: "src/components/views/dashboard-view.tsx",
      risk: "medium",
      ruleId: "product_ui"
    });
  });
});
