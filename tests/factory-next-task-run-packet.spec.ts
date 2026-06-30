import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import {
  NEXT_TASK_RUN_PACKET_VERSION,
  planNextTaskRunPacket,
  type NextTaskBacklogCandidateLike,
  type NextTaskCiCheckLike,
  type NextTaskOwnerPacketLike,
  type NextTaskRoadmapLike,
  type NextTaskRoadmapTaskLike,
  type NextTaskRunPacket,
  type NextTaskRunPacketInput,
  type NextTaskRunPacketVersion
} from "../src/lib/factory/next-task-run-packet";

type NextTaskTypeSurface = {
  version: NextTaskRunPacketVersion;
  packet: NextTaskRunPacket;
};

type MutableRoadmap = NextTaskRoadmapLike & {
  tasks: NextTaskRoadmapTaskLike[];
};

const NOW = "2026-06-29T00:00:00.000Z";
const RECENT_COMPLETED_AT = "2026-06-28T12:00:00.000Z";
const G0_TASK_IDS = [
  "FCT-010",
  "FCT-020",
  "FCT-030",
  "FCT-040",
  "FCT-050",
  "FCT-060"
];

const typeSmoke: NextTaskTypeSurface = {
  version: NEXT_TASK_RUN_PACKET_VERSION,
  packet: plan()
};

function readRoadmap(): MutableRoadmap {
  const roadmapPath = join(
    process.cwd(),
    "docs",
    "roadmap",
    "vlx-autonomous-factory-roadmap.v1.json"
  );

  return JSON.parse(readFileSync(roadmapPath, "utf8")) as MutableRoadmap;
}

function cloneRoadmap(overrides?: (roadmap: MutableRoadmap) => void) {
  const roadmap = JSON.parse(JSON.stringify(readRoadmap())) as MutableRoadmap;

  overrides?.(roadmap);

  return roadmap;
}

function findTask(roadmap: MutableRoadmap, taskId: string) {
  const task = roadmap.tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    throw new Error(`Missing roadmap task ${taskId}`);
  }

  return task;
}

function ownerPacket(
  overrides: Partial<NextTaskOwnerPacketLike> = {}
): NextTaskOwnerPacketLike {
  return {
    status: "pass",
    factoryGateStatus: {
      gateId: "G0_FACTORY_READY",
      status: "complete",
      requiredTaskIds: G0_TASK_IDS,
      verifiedRequiredTaskIds: G0_TASK_IDS,
      missingVerifiedTaskIds: []
    },
    verifiedFactoryTaskIds: G0_TASK_IDS,
    deferredTaskIds: ["FCT-070"],
    blockedHumanTaskIds: ["ACC-010"],
    ownerDecisionRequired: [
      {
        taskId: "ACC-010",
        title: "Create persistent learning schema, indexes, migrations, and RLS",
        status: "blocked_human",
        reason: "Account schema requires owner decision.",
        recommendation: "Keep ACC-010 blocked_human."
      }
    ],
    stopReasons: [],
    ...overrides
  };
}

function passedCheck(
  name: string,
  evidence = `${name} passed`
): NextTaskCiCheckLike {
  return {
    name,
    status: "passed",
    evidence,
    completedAt: RECENT_COMPLETED_AT
  };
}

function validCiChecks() {
  return [
    passedCheck("typecheck", "npm.cmd run typecheck passed"),
    passedCheck("lint", "npm.cmd run lint passed"),
    passedCheck("build", "npm.cmd run build passed"),
    passedCheck(
      "targeted tests",
      "npm.cmd run test -- tests/factory-next-task-run-packet.spec.ts --workers=1 passed"
    )
  ];
}

function safeDocsCandidate(
  overrides: Partial<NextTaskBacklogCandidateLike> = {}
): NextTaskBacklogCandidateLike {
  return {
    id: "DOC-010",
    title: "Document Track B next readiness task",
    phase: "factory_product_readiness",
    status: "ready",
    risk: "low",
    taskSurface: "docs_only",
    source: "track_b_backlog",
    priority: 10,
    depends_on: ["FCT-060"],
    validation: [
      "npm.cmd run test -- tests/factory-next-task-run-packet.spec.ts --workers=1"
    ],
    expectedChangedFiles: ["docs/factory/track-b-next-readiness.md"],
    ...overrides
  };
}

function productCandidate(
  overrides: Partial<NextTaskBacklogCandidateLike> = {}
): NextTaskBacklogCandidateLike {
  return safeDocsCandidate({
    id: "PRD-010",
    title: "Prepare Track B product readiness copy",
    risk: "medium",
    taskSurface: "product_ui",
    priority: 5,
    expectedChangedFiles: ["src/components/product-readiness-copy.tsx"],
    ...overrides
  });
}

function mergedPr137() {
  return {
    number: 137,
    title: "[Track B] Add product/UI readiness audit",
    state: "closed",
    isDraft: false,
    merged: true,
    mergedAt: RECENT_COMPLETED_AT,
    mergeCommitSha: "d22d50e0a0000000000000000000000000000000",
    branchName: "trackb/product-ui-readiness-audit",
    evidence: "PR #137 merged product/UI readiness audit"
  };
}

function blockedPr121(overrides = {}) {
  return {
    number: 121,
    title: "[Factory] Legacy open PR",
    state: "open",
    isDraft: false,
    merged: false,
    mergeableState: "dirty",
    stale: true,
    ...overrides
  };
}

function baseInput(
  overrides: Partial<NextTaskRunPacketInput> = {}
): NextTaskRunPacketInput {
  return {
    roadmap: readRoadmap(),
    ownerCommandCenterPacket: ownerPacket(),
    backlogCandidates: [safeDocsCandidate()],
    recentMergedPrSummaries: [mergedPr137()],
    openPrSummaries: [blockedPr121()],
    ciCheckSummaries: validCiChecks(),
    blockedSurfaces: [],
    riskPolicy: {
      highRiskSurfaces: ["factory_control_plane"],
      blockedSurfaces: [],
      forbiddenChangedFiles: ["AGENTS.md"],
      requiresOwnerApprovalForHighRisk: true
    },
    options: {
      now: NOW
    },
    ...overrides
  };
}

function plan(overrides: Partial<NextTaskRunPacketInput> = {}) {
  return planNextTaskRunPacket(baseInput(overrides));
}

test.describe("factory next-task run packet router", () => {
  test("exports the required versioned run packet contract", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      packet: {
        version: 1,
        status: "pass",
        dryRun: true,
        liveGitHubMutations: false,
        autoMergeEnabled: false
      }
    });
  });

  test("FCT-010 through FCT-060 verified produces a factory-ready selected task", () => {
    const result = plan();

    expect(result.status).toBe("pass");
    expect(result.stopReasons).toEqual([]);
    expect(result.selectedTask).toMatchObject({
      id: "DOC-010",
      taskSurface: "docs_only",
      risk: "low"
    });
    expect(result.riskSummary.acceptedEvidence).toEqual(
      expect.arrayContaining([
        "pr:#137:merged_product_ui_readiness_audit",
        "ci_check:typecheck:npm.cmd run typecheck passed"
      ])
    );
  });

  test("FCT-070 deferred is preserved and not selected", () => {
    const result = plan({
      backlogCandidates: [
        safeDocsCandidate({
          id: "FCT-070",
          title: "Optional low-risk auto-merge",
          priority: 1
        }),
        safeDocsCandidate()
      ]
    });

    expect(result.selectedTask?.id).toBe("DOC-010");
    const fct070 = result.rejectedTasks.find(
      (task) => task.taskId === "FCT-070"
    );

    expect(fct070?.reason).toContain("fct_070_deferred_not_selectable");
    expect(result.codexPromptDraft).toContain("Do not implement FCT-070");
    expect(result.branchPlan).not.toContain("fct-070");
  });

  test("ACC-010 blocked_human is surfaced as owner decision and not selected", () => {
    const result = plan({
      backlogCandidates: [
        safeDocsCandidate({
          id: "ACC-010",
          title: "Create persistent learning schema, indexes, migrations, and RLS",
          risk: "high",
          taskSurface: "database_rls",
          priority: 1,
          expectedChangedFiles: ["docs/factory/acc-010-owner-decision.md"]
        }),
        safeDocsCandidate()
      ]
    });

    expect(result.selectedTask?.id).toBe("DOC-010");
    expect(result.ownerDecisionRequired.map((item) => item.taskId)).toContain(
      "ACC-010"
    );
    const acc010 = result.rejectedTasks.find(
      (task) => task.taskId === "ACC-010"
    );

    expect(acc010?.reason).toContain("acc_010_blocked_human_not_selectable");
  });

  test("PR #137 merged audit unlocks safe factory/product planning", () => {
    const selected = plan({
      backlogCandidates: [productCandidate()]
    });
    const missingAudit = plan({
      backlogCandidates: [productCandidate()],
      recentMergedPrSummaries: []
    });

    expect(selected.status).toBe("pass");
    expect(selected.selectedTask).toMatchObject({
      id: "PRD-010",
      taskSurface: "product_ui",
      risk: "medium"
    });
    expect(missingAudit.status).toBe("pass");
    expect(missingAudit.selectedTask).toBeNull();
    expect(
      missingAudit.rejectedTasks.find((task) => task.taskId === "PRD-010")
        ?.reason
    ).toContain("missing_product_readiness_audit_pr_137");
  });

  test("PR #121 open and stale is surfaced as blocked and not selected for merge", () => {
    const result = plan();
    const pr121 = result.blockedTasks.find((task) => task.taskId === "PR-121");

    expect(pr121).toMatchObject({
      taskId: "PR-121",
      reason: "blocked_stale_not_mergeable_pr:#121",
      implementableNow: false
    });
    expect(result.ownerDecisionRequired.map((item) => item.taskId)).toContain(
      "PR-121"
    );
    expect(result.riskSummary.rejectedEvidence).toContain(
      "pr:#121:blocked_stale_not_mergeable_pr"
    );
  });

  test("high-risk candidate is rejected and requires owner approval", () => {
    const result = plan({
      backlogCandidates: [
        safeDocsCandidate({
          id: "FCT-080",
          title: "Extend factory control plane",
          risk: "high",
          taskSurface: "factory_control_plane",
          priority: 1,
          expectedChangedFiles: ["src/lib/factory/future-control-plane.ts"]
        })
      ]
    });

    expect(result.status).toBe("pass");
    expect(result.selectedTask).toBeNull();
    expect(result.noSafeTaskReason).toContain(
      "owner-directed docs/audit/readiness"
    );
    expect(result.ownerDecisionRequired.map((item) => item.taskId)).toContain(
      "FCT-080"
    );
    const fct080 = result.rejectedTasks.find(
      (task) => task.taskId === "FCT-080"
    );

    expect(fct080?.reason).toContain(
      "owner_approval_required_for_high_risk_candidate"
    );
  });

  test("missing verified factory dependency fails closed", () => {
    const roadmap = cloneRoadmap((draft) => {
      findTask(draft, "FCT-060").status = "done";
    });
    const result = plan({ roadmap });

    expect(result.status).toBe("fail");
    expect(result.selectedTask).toBeNull();
    expect(result.stopReasons).toContain(
      "missing_verified_factory_task:FCT-060:done"
    );
  });

  test("liveGitHubMutations true fails closed", () => {
    const result = plan({
      options: {
        now: NOW,
        liveGitHubMutations: true
      }
    });

    expect(result.status).toBe("fail");
    expect(result.liveGitHubMutations).toBe(false);
    expect(result.stopReasons).toContain(
      "live_github_mutation_request_not_supported_v1"
    );
  });

  test("autoMerge true fails closed", () => {
    const result = plan({
      options: {
        now: NOW,
        autoMerge: true
      }
    });

    expect(result.status).toBe("fail");
    expect(result.autoMergeEnabled).toBe(false);
    expect(result.stopReasons).toContain("auto_merge_request_not_supported_v1");
  });

  test("unknown PR or CI state fails closed when required", () => {
    const unknownPr = plan({
      openPrSummaries: [blockedPr121({ state: "mystery" })]
    });
    const unknownCi = plan({
      ciCheckSummaries: validCiChecks().map((check) =>
        check.name === "lint" ? { ...check, status: "mystery" } : check
      )
    });

    expect(unknownPr.status).toBe("fail");
    expect(unknownPr.stopReasons).toContain("unknown_pr_state:#121:mystery");
    expect(unknownCi.status).toBe("fail");
    expect(unknownCi.stopReasons).toContain(
      "unknown_ci_check_state:lint:mystery"
    );
  });

  test("no-op workflow success is not accepted as release evidence", () => {
    const result = plan({
      ciCheckSummaries: [
        ...validCiChecks().filter((check) => check.name !== "targeted tests"),
        {
          name: "codex-quality-gate",
          status: "passed",
          evidence: "green no-op workflow",
          completedAt: RECENT_COMPLETED_AT,
          isNoOp: true
        }
      ]
    });

    expect(result.status).toBe("fail");
    expect(result.stopReasons).toEqual(
      expect.arrayContaining([
        "no_op_ci_check_not_release_evidence:codex_quality_gate",
        "missing_required_ci_check:targeted_tests"
      ])
    );
    expect(result.riskSummary.rejectedEvidence).toContain(
      "ci_check:codex_quality_gate:no_op"
    );
  });

  test("forbidden changed files create stop reasons", () => {
    const result = plan({
      backlogCandidates: [
        safeDocsCandidate({
          expectedChangedFiles: ["AGENTS.md"],
          forbiddenChangedFiles: ["AGENTS.md"]
        })
      ]
    });

    expect(result.status).toBe("fail");
    expect(result.selectedTask).toBeNull();
    expect(result.stopReasons).toContain(
      "forbidden_changed_file:agents.md:agents_policy"
    );
    expect(result.forbiddenChangedFiles).toContain("agents.md");
  });

  test("codex prompt and owner approval drafts are deterministic", () => {
    const first = plan();
    const second = plan({
      recentMergedPrSummaries: [mergedPr137()].reverse(),
      ciCheckSummaries: [...validCiChecks()].reverse()
    });

    expect(second.codexPromptDraft).toBe(first.codexPromptDraft);
    expect(second.ownerApprovalCommentDraft).toBe(
      first.ownerApprovalCommentDraft
    );
    expect(first.codexPromptDraft).toContain("Selected task: DOC-010");
    expect(first.ownerApprovalCommentDraft).toContain(
      "Next-task run packet v1"
    );
  });

  test("worktree and branch plans are text only and do not execute", () => {
    const result = plan();

    expect(result.worktreePlan).toContain("Text only");
    expect(result.branchPlan).toContain("Text only");
    expect(result.branchPlan).toContain("factory/doc-010");
    expect(result.safetyNotes.join("\n")).toContain(
      "creates no branches, PRs, issues"
    );
  });

  test("roadmap and backlog input are not mutated", () => {
    const roadmap = cloneRoadmap();
    const backlogCandidates = [safeDocsCandidate()];
    const beforeRoadmap = JSON.stringify(roadmap);
    const beforeBacklog = JSON.stringify(backlogCandidates);
    const result = plan({ roadmap, backlogCandidates });

    expect(result.status).toBe("pass");
    expect(JSON.stringify(roadmap)).toBe(beforeRoadmap);
    expect(JSON.stringify(backlogCandidates)).toBe(beforeBacklog);
  });

  test("output order is deterministic", () => {
    const first = plan({
      backlogCandidates: [
        safeDocsCandidate({ priority: 10 }),
        safeDocsCandidate({
          id: "FCT-080",
          title: "Extend factory control plane",
          risk: "high",
          taskSurface: "factory_control_plane",
          priority: 20,
          expectedChangedFiles: ["src/lib/factory/future-control-plane.ts"]
        })
      ]
    });
    const roadmap = cloneRoadmap((draft) => {
      draft.tasks = [...draft.tasks].reverse();
      draft.release_gates = [...(draft.release_gates ?? [])].reverse();
    });
    const second = plan({
      roadmap,
      backlogCandidates: [
        safeDocsCandidate({
          id: "FCT-080",
          title: "Extend factory control plane",
          risk: "high",
          taskSurface: "factory_control_plane",
          priority: 20,
          expectedChangedFiles: ["src/lib/factory/future-control-plane.ts"]
        }),
        safeDocsCandidate({ priority: 10 })
      ],
      recentMergedPrSummaries: [mergedPr137()].reverse(),
      openPrSummaries: [blockedPr121()].reverse(),
      ciCheckSummaries: [...validCiChecks()].reverse()
    });

    expect(second).toEqual(first);
  });

  test("same input produces identical output", () => {
    const input = baseInput();

    expect(planNextTaskRunPacket(input)).toEqual(planNextTaskRunPacket(input));
  });
});
