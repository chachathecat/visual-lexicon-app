import { expect, test } from "@playwright/test";

import {
  PR_READINESS_OWNER_QUEUE_VERSION,
  summarizePrReadinessOwnerQueue,
  type PrReadinessCheckLike,
  type PrReadinessOwnerQueueInput,
  type PrReadinessOwnerQueueItem,
  type PrReadinessOwnerQueueVersion,
  type PrReadinessTaskMappingLike,
  type PrReadinessValidationEvidenceLike
} from "../src/lib/factory/pr-readiness-owner-queue";

type PrReadinessTypeSurface = {
  version: PrReadinessOwnerQueueVersion;
  item: PrReadinessOwnerQueueItem;
};

const typeSmoke: PrReadinessTypeSurface = {
  version: PR_READINESS_OWNER_QUEUE_VERSION,
  item: summarize()
};

function passedCheck(
  name: string,
  evidence = `${name} passed`
): PrReadinessCheckLike {
  return {
    name,
    status: "passed",
    evidence,
    completedAt: "2026-06-29T12:00:00.000Z"
  };
}

function validCiChecks() {
  return [
    passedCheck("typecheck", "npm.cmd run typecheck passed"),
    passedCheck("lint", "npm.cmd run lint passed"),
    passedCheck("build", "npm.cmd run build passed"),
    passedCheck(
      "targeted tests",
      "npm.cmd run test -- tests/factory-pr-readiness-owner-queue.spec.ts --workers=1 passed"
    )
  ];
}

function passedEvidence(
  name: string,
  evidence = `${name} present`
): PrReadinessValidationEvidenceLike {
  return {
    name,
    status: "passed",
    evidence,
    source: "pr_body"
  };
}

function docsValidationEvidence() {
  return [
    passedEvidence("validation results", "validation section lists commands"),
    passedEvidence("safety section", "safety section confirms blocked surfaces")
  ];
}

function runtimeValidationEvidence() {
  return [
    passedEvidence("validation results", "validation section lists commands"),
    passedEvidence("manual QA", "manual QA notes included"),
    passedEvidence("browser QA", "browser QA notes included"),
    passedEvidence("accessibility notes", "accessibility notes included"),
    passedEvidence("runtime UI scope", "runtime UI changed files listed")
  ];
}

function taskMappings(): PrReadinessTaskMappingLike[] {
  return [
    {
      id: "FCT-PR-READINESS",
      title: "PR readiness owner queue summarizer",
      taskSurface: "docs_only",
      risk: "low",
      expectedChangedFiles: [
        "docs/factory/pr-readiness-owner-queue.md",
        "tests/factory-pr-readiness-owner-queue.spec.ts"
      ],
      validation: [
        "npm.cmd run test -- tests/factory-pr-readiness-owner-queue.spec.ts --workers=1"
      ]
    },
    {
      id: "TB-030",
      title: "Dashboard v2",
      taskSurface: "product_ui",
      risk: "medium",
      expectedChangedFiles: ["src/components/views/dashboard-view.tsx"]
    }
  ];
}

function baseInput(
  overrides: Partial<PrReadinessOwnerQueueInput> = {}
): PrReadinessOwnerQueueInput {
  return {
    pr: {
      number: 140,
      title: "[Factory] Add PR readiness owner queue summarizer",
      body: "Goal, scope, validation results, and safety section are present.",
      state: "open",
      isDraft: false,
      labels: ["factory", "task:FCT-PR-READINESS"],
      mergeableState: "clean"
    },
    changedFiles: [
      "docs/factory/pr-readiness-owner-queue.md",
      "tests/factory-pr-readiness-owner-queue.spec.ts"
    ],
    ciChecks: validCiChecks(),
    validationEvidence: docsValidationEvidence(),
    riskPolicy: {
      requiredCiChecks: ["typecheck", "lint", "build", "targeted tests"],
      docsTestsRequiredEvidence: ["validation results", "safety section"],
      runtimeUiRequiredEvidence: [
        "validation results",
        "manual QA",
        "browser QA",
        "accessibility notes",
        "runtime UI scope"
      ],
      highRiskSurfaces: [
        "github_workflows",
        "codeowners",
        "payment",
        "billing",
        "dns",
        "secrets",
        "production_data",
        "public_paid_beta_launch"
      ],
      blockedSurfaces: [],
      forbiddenChangedFiles: ["AGENTS.md"],
      requiresOwnerApprovalForHighRisk: true
    },
    blockedSurfaces: [],
    taskBacklogMapping: taskMappings(),
    ownerApprovalPolicy: {
      ownerApprovalRequired: false
    },
    staleOpenPrContext: [
      {
        number: 121,
        title: "[Factory] Legacy stale PR",
        state: "open",
        stale: true,
        mergeableState: "dirty"
      }
    ],
    options: {
      dryRun: true,
      liveGitHubMutations: false,
      autoMerge: false
    },
    ...overrides
  };
}

function summarize(overrides: Partial<PrReadinessOwnerQueueInput> = {}) {
  return summarizePrReadinessOwnerQueue(baseInput(overrides));
}

test.describe("factory PR readiness owner queue summarizer", () => {
  test("exports the required versioned owner queue contract", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      item: {
        version: 1,
        status: "pass",
        readiness: "ready_for_owner_review",
        taskId: "FCT-PR-READINESS"
      }
    });
  });

  test("docs/tests-only PR with CI success becomes ready for owner review", () => {
    const result = summarize();

    expect(result).toMatchObject({
      status: "pass",
      readiness: "ready_for_owner_review",
      riskLevel: "low",
      ownerDecisionRequired: true,
      mergeRecommendation: "Ready for owner review only; do not auto-merge."
    });
    expect(result.changedFilesSummary.docsOrTestsOnly).toBe(true);
    expect(result.mergeBlockers).toEqual([]);
    expect(result.stalePrWarnings).toContain(
      "pr:#121:stale_not_mergeable:dirty"
    );
  });

  test("draft PR with in-progress CI becomes needs_fix", () => {
    const result = summarize({
      pr: {
        ...baseInput().pr,
        isDraft: true
      },
      ciChecks: validCiChecks().map((check) =>
        check.name === "lint" ? { ...check, status: "in_progress" } : check
      )
    });

    expect(result.status).toBe("fail");
    expect(result.readiness).toBe("needs_fix");
    expect(result.stopReasons).toEqual(
      expect.arrayContaining([
        "draft_pr_not_ready_for_merge",
        "pending_required_ci_check:lint"
      ])
    );
    expect(result.ciSummary.pendingChecks).toContain("lint");
  });

  test("missing CI fails closed", () => {
    const result = summarize({
      ciChecks: validCiChecks().filter((check) => check.name !== "build")
    });

    expect(result.status).toBe("fail");
    expect(result.readiness).toBe("needs_fix");
    expect(result.ciSummary.missingChecks).toContain("build");
    expect(result.stopReasons).toContain("missing_required_ci_check:build");
  });

  test("failing CI blocks merge", () => {
    const result = summarize({
      ciChecks: validCiChecks().map((check) =>
        check.name === "build" ? { ...check, status: "failed" } : check
      )
    });

    expect(result.status).toBe("fail");
    expect(result.readiness).toBe("blocked");
    expect(result.ciSummary.failedChecks).toContain("build");
    expect(result.mergeBlockers).toContain("failing_ci_checks:build");
  });

  test("missing validation evidence marks needs_fix", () => {
    const result = summarize({
      validationEvidence: [passedEvidence("validation results")]
    });

    expect(result.status).toBe("fail");
    expect(result.readiness).toBe("needs_fix");
    expect(result.validationSummary.missingEvidence).toContain(
      "safety_section"
    );
    expect(result.missingEvidence).toContain("validation:safety_section");
  });

  test("liveGitHubMutations true fails closed as unsafe", () => {
    const result = summarize({
      options: {
        dryRun: true,
        liveGitHubMutations: true,
        autoMerge: false
      }
    });

    expect(result.status).toBe("fail");
    expect(result.readiness).toBe("unsafe");
    expect(result.stopReasons).toContain(
      "live_github_mutation_request_not_supported_v1"
    );
  });

  test("autoMerge true fails closed as unsafe", () => {
    const result = summarize({
      options: {
        dryRun: true,
        liveGitHubMutations: false,
        autoMerge: true
      }
    });

    expect(result.status).toBe("fail");
    expect(result.readiness).toBe("unsafe");
    expect(result.stopReasons).toContain("auto_merge_request_not_supported_v1");
  });

  test("high-risk changed files require owner approval or block", () => {
    const result = summarize({
      changedFiles: [".github/workflows/ci.yml"],
      pr: {
        ...baseInput().pr,
        title: "[Factory] Update workflow readiness"
      },
      ownerApprovalPolicy: {
        ownerApprovalRequired: true,
        approved: false,
        evidence: null
      }
    });

    expect(result.status).toBe("fail");
    expect(result.readiness).toBe("blocked");
    expect(result.riskLevel).toBe("high");
    expect(result.blockedSurfacesTouched).toContain("github_workflows");
    expect(result.mergeBlockers).toContain("missing_owner_approval_evidence");
  });

  test("workflows and CODEOWNERS changes are high-risk", () => {
    const result = summarize({
      changedFiles: [".github/workflows/ci.yml", ".github/CODEOWNERS"],
      ownerApprovalPolicy: {
        ownerApprovalRequired: true,
        approved: true,
        evidence: "owner approved workflow/CODEOWNERS review"
      }
    });

    expect(result.riskLevel).toBe("high");
    expect(result.blockedSurfacesTouched).toEqual(
      expect.arrayContaining(["codeowners", "github_workflows"])
    );
    expect(result.riskReasons).toEqual(
      expect.arrayContaining([
        "high_risk_surface:codeowners:.github/codeowners",
        "high_risk_surface:github_workflows:.github/workflows/ci.yml"
      ])
    );
  });

  test("payment billing DNS secrets and production data surfaces block", () => {
    const cases = [
      ["src/app/api/payments/route.ts", "payment"],
      ["src/lib/billing/ledger.ts", "billing"],
      ["docs/dns-cutover.md", "dns"],
      [".env.local", "secrets"],
      ["data/production/users.json", "production_data"]
    ] as const;

    for (const [file, surface] of cases) {
      const result = summarize({
        changedFiles: [file],
        ownerApprovalPolicy: {
          ownerApprovalRequired: true,
          approved: true,
          evidence: `owner reviewed ${surface}`
        }
      });

      expect(result, file).toMatchObject({
        status: "fail",
        readiness: "blocked"
      });
      expect(result.blockedSurfacesTouched).toContain(surface);
      expect(result.mergeBlockers).toContain(
        `hard_blocked_surface_touched:${surface}`
      );
    }
  });

  test("public paid beta launch claim blocks without gate evidence", () => {
    const result = summarize({
      pr: {
        ...baseInput().pr,
        title: "[TB-110] Public paid beta launch"
      },
      ownerApprovalPolicy: {
        ownerApprovalRequired: true,
        approved: true,
        evidence: "owner reviewed copy"
      }
    });

    expect(result.status).toBe("fail");
    expect(result.readiness).toBe("blocked");
    expect(result.blockedSurfacesTouched).toContain(
      "public_paid_beta_launch"
    );
    expect(result.mergeBlockers).toContain(
      "public_paid_beta_launch_without_owner_gate_evidence"
    );
  });

  test("stale PR #121 is surfaced as stale and not mergeable", () => {
    const contextWarning = summarize().stalePrWarnings;
    const currentPr = summarize({
      pr: {
        number: 121,
        title: "[Factory] Legacy stale PR",
        state: "open",
        isDraft: false,
        mergeableState: "dirty"
      },
      staleOpenPrContext: []
    });

    expect(contextWarning).toContain("pr:#121:stale_not_mergeable:dirty");
    expect(currentPr.status).toBe("fail");
    expect(currentPr.readiness).toBe("stale");
    expect(currentPr.mergeRecommendation).toContain("Do not merge");
  });

  test("no-op workflow success is rejected as release evidence", () => {
    const result = summarize({
      ciChecks: [
        passedCheck("typecheck"),
        passedCheck("lint"),
        passedCheck("build"),
        {
          name: "codex-quality-gate",
          status: "passed",
          evidence: "green no-op workflow",
          isNoOp: true
        }
      ]
    });

    expect(result.status).toBe("fail");
    expect(result.readiness).toBe("needs_fix");
    expect(result.ciSummary.noOpChecks).toContain("codex_quality_gate");
    expect(result.ciSummary.missingChecks).toContain("targeted_tests");
    expect(result.stopReasons).toContain(
      "no_op_ci_check_not_release_evidence:codex_quality_gate"
    );
  });

  test("runtime UI PR requires stronger validation than docs-only PR", () => {
    const missingRuntimeEvidence = summarize({
      pr: {
        ...baseInput().pr,
        title: "[TB-030] Dashboard v2 runtime UI"
      },
      changedFiles: ["src/components/views/dashboard-view.tsx"],
      validationEvidence: docsValidationEvidence()
    });
    const completeRuntimeEvidence = summarize({
      pr: {
        ...baseInput().pr,
        title: "[TB-030] Dashboard v2 runtime UI"
      },
      changedFiles: ["src/components/views/dashboard-view.tsx"],
      validationEvidence: runtimeValidationEvidence()
    });

    expect(missingRuntimeEvidence.status).toBe("fail");
    expect(missingRuntimeEvidence.readiness).toBe("needs_fix");
    expect(missingRuntimeEvidence.validationSummary.missingEvidence).toEqual(
      expect.arrayContaining([
        "accessibility_notes",
        "browser_qa",
        "manual_qa",
        "runtime_ui_scope"
      ])
    );
    expect(completeRuntimeEvidence.status).toBe("pass");
    expect(completeRuntimeEvidence.readiness).toBe("ready_for_owner_review");
  });

  test("factory backlog task mapping is deterministic", () => {
    const first = summarize({
      taskBacklogMapping: taskMappings()
    });
    const second = summarize({
      taskBacklogMapping: [...taskMappings()].reverse(),
      changedFiles: [
        "tests/factory-pr-readiness-owner-queue.spec.ts",
        "docs/factory/pr-readiness-owner-queue.md"
      ]
    });

    expect(first.taskId).toBe("FCT-PR-READINESS");
    expect(second.taskId).toBe("FCT-PR-READINESS");
    expect(second.changedFilesSummary.files).toEqual(
      first.changedFilesSummary.files
    );
  });

  test("ownerApprovalCommentDraft is deterministic", () => {
    const first = summarize().ownerApprovalCommentDraft;
    const second = summarize({
      ciChecks: [...validCiChecks()].reverse(),
      validationEvidence: [...docsValidationEvidence()].reverse(),
      taskBacklogMapping: [...taskMappings()].reverse()
    }).ownerApprovalCommentDraft;

    expect(second).toBe(first);
    expect(first).toContain("PR readiness owner queue v1");
    expect(first).toContain("no live GitHub mutations");
  });

  test("needsFixCommentDraft is deterministic", () => {
    const first = summarize({
      ciChecks: validCiChecks().filter((check) => check.name !== "build"),
      validationEvidence: [passedEvidence("validation results")]
    }).needsFixCommentDraft;
    const second = summarize({
      validationEvidence: [passedEvidence("validation results")],
      ciChecks: validCiChecks().filter((check) => check.name !== "build")
    }).needsFixCommentDraft;

    expect(second).toBe(first);
    expect(first).toContain("PR readiness needs-fix draft v1");
    expect(first).toContain("missing");
  });

  test("input objects are not mutated", () => {
    const input = baseInput();
    const before = JSON.stringify(input);
    const result = summarizePrReadinessOwnerQueue(input);

    expect(result.status).toBe("pass");
    expect(JSON.stringify(input)).toBe(before);
  });

  test("same input produces identical output", () => {
    const input = baseInput();

    expect(summarizePrReadinessOwnerQueue(input)).toEqual(
      summarizePrReadinessOwnerQueue(input)
    );
  });
});
