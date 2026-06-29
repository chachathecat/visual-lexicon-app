import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import {
  OWNER_COMMAND_CENTER_VERSION,
  planOwnerCommandCenter,
  type OwnerCommandCenterInput,
  type OwnerCommandCenterPacket,
  type OwnerCommandCenterVersion,
  type OwnerCommandEvidenceLike,
  type OwnerCommandPrSummaryLike,
  type OwnerCommandRoadmapLike,
  type OwnerCommandRoadmapTaskLike
} from "../src/lib/factory/owner-command-center";

type OwnerCommandTypeSurface = {
  version: OwnerCommandCenterVersion;
  packet: OwnerCommandCenterPacket;
};

type MutableRoadmap = OwnerCommandRoadmapLike & {
  tasks: OwnerCommandRoadmapTaskLike[];
};

type RoadmapTaskWithEvidence = OwnerCommandRoadmapTaskLike & {
  evidence?: string[];
};

const NOW = "2026-06-29T00:00:00.000Z";
const RECENT_COMPLETED_AT = "2026-06-28T12:00:00.000Z";
const CHANGED_FILES = [
  "src/lib/factory/owner-command-center.ts",
  "tests/factory-owner-command-center.spec.ts",
  "docs/factory/owner-command-center.md"
];
const G0_TASK_IDS = [
  "FCT-010",
  "FCT-020",
  "FCT-030",
  "FCT-040",
  "FCT-050",
  "FCT-060"
];
const MERGE_EVIDENCE: Record<string, { prNumber: number; sha: string }> = {
  "FCT-010": {
    prNumber: 124,
    sha: "818f96f492bc5b5beb23cf449bc2d9d6355eb5f0"
  },
  "FCT-020": {
    prNumber: 126,
    sha: "4b3d7526448371539ca5c0694dfc2622019402c2"
  },
  "FCT-030": {
    prNumber: 128,
    sha: "71c678140416fff3d959424c52c1ac85f546c169"
  },
  "FCT-040": {
    prNumber: 130,
    sha: "b67dc2c008f99051a17089485429d7261b9637b0"
  },
  "FCT-050": {
    prNumber: 132,
    sha: "14393128a296ed09bebac700f7b4a86a2ceaf717"
  },
  "FCT-060": {
    prNumber: 134,
    sha: "0819bcbe170288cbede12aa640d478339506c083"
  }
};

const typeSmoke: OwnerCommandTypeSurface = {
  version: OWNER_COMMAND_CENTER_VERSION,
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

function passedEvidence(
  name: string,
  evidence = `${name} passed`
): OwnerCommandEvidenceLike {
  return {
    name,
    status: "passed",
    evidence,
    completedAt: RECENT_COMPLETED_AT
  };
}

function validCiChecks() {
  return [
    passedEvidence("typecheck", "npm.cmd run typecheck passed"),
    passedEvidence("lint", "npm.cmd run lint passed"),
    passedEvidence("build", "npm.cmd run build passed"),
    passedEvidence("full test suite", "npm.cmd run test -- --workers=1 passed"),
    passedEvidence(
      "targeted tests",
      "npm.cmd run test -- tests/factory-owner-command-center.spec.ts --workers=1 passed"
    )
  ];
}

function validValidationResults() {
  return [
    passedEvidence(
      "owner command center contract",
      "Owner packet contract tests passed"
    ),
    passedEvidence(
      "factory regression contract",
      "Factory quality/materializer/release/repair regression tests passed"
    )
  ];
}

function validReleaseEvidence() {
  return [
    passedEvidence(
      "g0 factory ready review",
      "G0 factory bootstrap ready packet reviewed"
    )
  ];
}

function mergedPullRequests(
  roadmap = readRoadmap()
): OwnerCommandPrSummaryLike[] {
  return G0_TASK_IDS.map((taskId) => {
    const task = findTask(roadmap, taskId);
    const evidence = MERGE_EVIDENCE[taskId];

    return {
      number: evidence.prNumber,
      title: `[${taskId}] ${task.title}`,
      labels: ["factory", "roadmap-task", `task:${taskId}`],
      taskId,
      state: "closed",
      isDraft: false,
      merged: true,
      mergedAt: RECENT_COMPLETED_AT,
      mergeCommitSha: evidence.sha,
      branchName: `factory/${taskId.toLowerCase()}`
    };
  });
}

function baseInput(
  overrides: Partial<OwnerCommandCenterInput> = {}
): OwnerCommandCenterInput {
  return {
    roadmap: readRoadmap(),
    openPullRequests: [],
    mergedPullRequests: mergedPullRequests(),
    ciChecks: validCiChecks(),
    validationResults: validValidationResults(),
    releaseEvidence: validReleaseEvidence(),
    changedFiles: CHANGED_FILES,
    riskClassification: {
      risk: "high",
      taskSurface: "factory_control_plane",
      changedFiles: CHANGED_FILES,
      protectedPaths: ["src/lib/factory/owner-command-center.ts"],
      requiresOwnerApproval: true,
      evidence: "factory control-plane planner contract"
    },
    ownerApproval: {
      approved: true,
      evidence:
        "owner requested planner/mock-only Owner Command Center contract",
      approvedAt: RECENT_COMPLETED_AT,
      approver: "owner"
    },
    options: {
      now: NOW
    },
    ...overrides
  };
}

function plan(overrides: Partial<OwnerCommandCenterInput> = {}) {
  return planOwnerCommandCenter(baseInput(overrides));
}

test.describe("factory owner command center planner", () => {
  test("exports the required versioned owner packet contract", () => {
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

  test("FCT-010 through FCT-060 verified produces a factory-ready owner packet", () => {
    const result = plan();

    expect(result.status).toBe("pass");
    expect(result.factoryGateStatus).toMatchObject({
      gateId: "G0_FACTORY_READY",
      status: "complete",
      requiredTaskIds: G0_TASK_IDS,
      verifiedRequiredTaskIds: G0_TASK_IDS,
      missingVerifiedTaskIds: []
    });
    expect(result.verifiedFactoryTaskIds).toEqual(
      expect.arrayContaining(["FCT-010", "FCT-020", "FCT-060"])
    );
    expect(result.nextRecommendedActions).toEqual(
      expect.arrayContaining([
        "g0_factory_bootstrap_complete",
        "owner_directed_next_track_selection_required"
      ])
    );
    expect(result.factoryGateStatus.summary).toContain(
      "G0 factory bootstrap is complete"
    );
  });

  test("FCT-070 deferred is preserved and not planned", () => {
    const result = plan();

    expect(result.deferredTaskIds).toContain("FCT-070");
    expect(result.readyTaskIds).not.toContain("FCT-070");
    expect(result.nextRecommendedActions.join("\n")).not.toContain(
      "review_ready_tasks:FCT-070"
    );
    expect(result.worktreeBranchPlan).not.toContain("fct-070");
    expect(result.safetyNotes).toContain(
      "FCT-070 remains deferred and is not planned for implementation or auto-merge."
    );
  });

  test("auto-merge remains disabled", () => {
    const result = plan();

    expect(result.autoMergeEnabled).toBe(false);
    expect(result.mergeReadinessRecommendation).toContain("Do not auto-merge");
    expect(result.nextRecommendedActions).toContain("keep_auto_merge_disabled");
  });

  test("ACC-010 blocked_human is surfaced as owner decision and not implementation", () => {
    const result = plan();
    const acc010Decision = result.ownerDecisionRequired.find(
      (decision) => decision.taskId === "ACC-010"
    );

    expect(result.blockedHumanTaskIds).toContain("ACC-010");
    expect(result.readyTaskIds).not.toContain("ACC-010");
    expect(acc010Decision).toMatchObject({
      taskId: "ACC-010",
      status: "blocked_human",
      implementableNow: false
    });
    expect(acc010Decision?.recommendation).toContain(
      "Keep ACC-010 blocked_human"
    );
  });

  test("missing verified factory dependency fails closed", () => {
    const roadmap = cloneRoadmap((draft) => {
      findTask(draft, "FCT-050").status = "done";
    });
    const result = plan({
      roadmap,
      mergedPullRequests: mergedPullRequests(roadmap)
    });

    expect(result.status).toBe("fail");
    expect(result.factoryGateStatus.status).toBe("blocked");
    expect(result.stopReasons).toContain(
      "missing_verified_factory_task:FCT-050:done"
    );
  });

  test("missing PR or merge evidence fails closed when verifying a merged implementation PR", () => {
    const missingPr = plan({
      mergedPullRequests: mergedPullRequests().filter(
        (pr) => pr.taskId !== "FCT-060"
      )
    });
    const missingMerge = plan({
      mergedPullRequests: mergedPullRequests().map((pr) =>
        pr.taskId === "FCT-060" ? { ...pr, mergeCommitSha: null } : pr
      )
    });

    expect(missingPr.status).toBe("fail");
    expect(missingPr.stopReasons).toContain(
      "missing_merged_pr_evidence:FCT-060"
    );
    expect(missingMerge.status).toBe("fail");
    expect(missingMerge.stopReasons).toContain(
      "missing_pr_merge_commit:FCT-060:#134"
    );
  });

  test("no-op workflow success is rejected as release evidence", () => {
    const result = plan({
      releaseEvidence: [
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
        "no_op_only_release_evidence",
        "no_op_release_evidence:codex_quality_gate"
      ])
    );
    expect(result.ciStatusSummary.rejectedEvidence).toContain(
      "release_evidence:codex_quality_gate:no_op"
    );
  });

  test("unknown PR or CI state fails closed", () => {
    const unknownPr = plan({
      mergedPullRequests: mergedPullRequests().map((pr) =>
        pr.taskId === "FCT-060" ? { ...pr, state: "mystery" } : pr
      )
    });
    const unknownCi = plan({
      ciChecks: validCiChecks().map((check) =>
        check.name === "lint" ? { ...check, status: "mystery" } : check
      )
    });

    expect(unknownPr.status).toBe("fail");
    expect(unknownPr.stopReasons).toContain(
      "merged_pr_unknown_state:#134:mystery"
    );
    expect(unknownCi.status).toBe("fail");
    expect(unknownCi.stopReasons).toContain(
      "unknown_ci_check_state:lint:mystery"
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

  test("forbidden and protected changed files produce owner stop reasons", () => {
    const changedFiles = [
      "src/lib/factory/owner-command-center.ts",
      "AGENTS.md"
    ];
    const result = plan({
      changedFiles,
      riskClassification: {
        risk: "high",
        taskSurface: "factory_control_plane",
        changedFiles,
        protectedPaths: ["src/lib/factory/owner-command-center.ts"],
        requiresOwnerApproval: true
      },
      ownerApproval: null
    });

    expect(result.status).toBe("fail");
    expect(result.stopReasons).toEqual(
      expect.arrayContaining([
        "forbidden_changed_file:agents.md:agents_policy",
        "missing_owner_approval"
      ])
    );
    expect(result.changedFileScopeWarnings).toEqual(
      expect.arrayContaining([
        "forbidden_changed_file:agents.md:agents_policy",
        "protected_changed_file:src/lib/factory/owner-command-center.ts"
      ])
    );
  });

  test("owner approval comment draft is deterministic", () => {
    const first = plan().ownerApprovalCommentDraft;
    const second = plan({
      mergedPullRequests: [...mergedPullRequests()].reverse(),
      ciChecks: [...validCiChecks()].reverse()
    }).ownerApprovalCommentDraft;

    expect(first).toBe(second);
    expect(first).toContain("Owner Command Center packet v1");
    expect(first).toContain("Factory gate: G0_FACTORY_READY complete");
    expect(first).toContain("auto-merge disabled");
  });

  test("verification sync recommendation appears only after a merged implementation PR with valid evidence", () => {
    const noPendingSync = plan();
    const roadmap = cloneRoadmap((draft) => {
      const fct060 = findTask(draft, "FCT-060") as RoadmapTaskWithEvidence;

      fct060.status = "ready";
      delete fct060.evidence;
    });
    const pendingSync = plan({
      roadmap,
      mergedPullRequests: mergedPullRequests(roadmap)
    });

    expect(noPendingSync.verificationSyncRecommendation).toBe(
      "No verification sync recommendation: no merged implementation PR with valid pending evidence."
    );
    expect(pendingSync.status).toBe("pass");
    expect(pendingSync.factoryGateStatus.status).toBe(
      "pending_verification_sync"
    );
    expect(pendingSync.verificationSyncRecommendation).toBe(
      "Prepare release-guard verification sync for FCT-060 from PR #134; this planner does not mutate roadmap status."
    );
  });

  test("roadmap input is not mutated", () => {
    const roadmap = cloneRoadmap();
    const before = JSON.stringify(roadmap);
    const result = plan({
      roadmap,
      mergedPullRequests: mergedPullRequests(roadmap)
    });

    expect(result.status).toBe("pass");
    expect(JSON.stringify(roadmap)).toBe(before);
  });

  test("output order is deterministic", () => {
    const first = plan();
    const roadmap = cloneRoadmap((draft) => {
      draft.tasks = [...draft.tasks].reverse();
      draft.release_gates = [...(draft.release_gates ?? [])].reverse();
    });
    const second = plan({
      roadmap,
      mergedPullRequests: [...mergedPullRequests(roadmap)].reverse(),
      ciChecks: [...validCiChecks()].reverse(),
      validationResults: [...validValidationResults()].reverse(),
      releaseEvidence: [...validReleaseEvidence()].reverse()
    });

    expect(second).toEqual(first);
  });

  test("same input produces identical output", () => {
    const input = baseInput();

    expect(planOwnerCommandCenter(input)).toEqual(
      planOwnerCommandCenter(input)
    );
  });
});
