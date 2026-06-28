import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import {
  FACTORY_RELEASE_EVIDENCE_GUARD_VERSION,
  planFactoryReleaseEvidenceGuard,
  type FactoryReleaseEvidenceGuardVersion,
  type ReleaseGuardEvidenceLike,
  type ReleaseGuardPlannerInput,
  type ReleaseGuardPlannerResult,
  type ReleaseGuardRoadmapLike,
  type ReleaseGuardRoadmapTaskLike
} from "../src/lib/factory/release-evidence-guard";

type ReleaseGuardTypeSurface = {
  version: FactoryReleaseEvidenceGuardVersion;
  result: ReleaseGuardPlannerResult;
};

type MutableRoadmap = ReleaseGuardRoadmapLike & {
  tasks: ReleaseGuardRoadmapTaskLike[];
};

type RoadmapTaskWithEvidence = ReleaseGuardRoadmapTaskLike & {
  evidence?: string[];
};

const NOW = "2026-06-28T00:00:00.000Z";
const RECENT_COMPLETED_AT = "2026-06-27T23:00:00.000Z";
const MERGE_SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TARGETED_TEST_EVIDENCE =
  "npm.cmd run test -- tests/factory-release-evidence-guard.spec.ts --workers=1 passed";

const typeSmoke: ReleaseGuardTypeSurface = {
  version: FACTORY_RELEASE_EVIDENCE_GUARD_VERSION,
  result: plan()
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
): ReleaseGuardEvidenceLike {
  return {
    name,
    status: "passed",
    evidence,
    completedAt: RECENT_COMPLETED_AT,
    commitSha: MERGE_SHA
  };
}

function validCiChecks() {
  return [
    passedEvidence("typecheck", "npm.cmd run typecheck passed"),
    passedEvidence("lint", "npm.cmd run lint passed"),
    passedEvidence("build", "npm.cmd run build passed"),
    passedEvidence("full test suite", "npm.cmd run test -- --workers=1 passed"),
    passedEvidence("targeted tests", TARGETED_TEST_EVIDENCE)
  ];
}

function validValidationResults() {
  return [
    passedEvidence(
      "state-machine tests",
      "FCT-060 state-machine tests passed"
    ),
    passedEvidence("tamper tests", "FCT-060 tamper tests passed")
  ];
}

function baseInput(
  overrides: Partial<ReleaseGuardPlannerInput> = {}
): ReleaseGuardPlannerInput {
  return {
    roadmap: readRoadmap(),
    targetTaskId: "FCT-060",
    pullRequests: [
      {
        number: 134,
        title: "[FCT-060] Implement release guard and roadmap evidence sync",
        labels: ["factory", "roadmap-task", "task:FCT-060"],
        taskId: "FCT-060",
        state: "closed",
        isDraft: false,
        merged: true,
        mergedAt: RECENT_COMPLETED_AT,
        mergeCommitSha: MERGE_SHA,
        branchName: "factory/fct-060-release-evidence-guard"
      }
    ],
    mergeCommit: {
      sha: MERGE_SHA,
      prNumber: 134,
      committedAt: RECENT_COMPLETED_AT,
      message: "Merge pull request #134"
    },
    ciChecks: validCiChecks(),
    validationResults: validValidationResults(),
    rollbackEvidence: {
      status: "passed",
      evidence: "Rollback is revert-only; no live roadmap mutation applies.",
      completedAt: RECENT_COMPLETED_AT,
      commitSha: MERGE_SHA
    },
    ownerApproval: {
      approved: true,
      evidence: "owner approval for high-risk FCT-060 release guard",
      approvedAt: RECENT_COMPLETED_AT,
      approver: "owner"
    },
    changedFiles: [
      "src/lib/factory/release-evidence-guard.ts",
      "tests/factory-release-evidence-guard.spec.ts"
    ],
    riskClassification: {
      risk: "high",
      taskSurface: "factory_control_plane",
      protectedPaths: ["src/lib/factory/release-evidence-guard.ts"],
      requiresOwnerApproval: true,
      changedFiles: [
        "src/lib/factory/release-evidence-guard.ts",
        "tests/factory-release-evidence-guard.spec.ts"
      ]
    },
    protectedPathEvidence: [
      {
        path: "src/lib/factory/release-evidence-guard.ts",
        status: "approved_safe",
        evidence: "factory control-plane change covered by owner approval"
      }
    ],
    options: {
      now: NOW
    },
    ...overrides
  };
}

function plan(overrides: Partial<ReleaseGuardPlannerInput> = {}) {
  return planFactoryReleaseEvidenceGuard(baseInput(overrides));
}

test.describe("factory release evidence guard", () => {
  test("exports the required versioned dry-run output contract", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      result: {
        version: 1,
        status: "pass",
        dryRun: true,
        liveGitHubMutations: false,
        autoMergeEnabled: false,
        targetTaskId: "FCT-060",
        requiresOwnerApproval: true
      }
    });
  });

  test("FCT-060 ready task can produce one verification proposal when evidence is valid", () => {
    const result = plan();
    const proposal = result.verificationProposals[0];

    expect(result.status).toBe("pass");
    expect(result.verificationProposals).toHaveLength(1);
    expect(proposal).toMatchObject({
      taskId: "FCT-060",
      fromStatus: "ready",
      toStatus: "verified",
      apply: false,
      prNumber: 134,
      mergeCommitSha: MERGE_SHA,
      ownerApprovalRequired: true
    });
    expect(proposal.evidence).toEqual(
      expect.arrayContaining([
        "PR #134",
        `merge commit ${MERGE_SHA}`,
        "owner_approval:owner approval for high-risk FCT-060 release guard",
        `ci_check:targeted_tests:${TARGETED_TEST_EVIDENCE}`
      ])
    );
    expect(result.requiredCiChecks).toEqual([
      "typecheck",
      "lint",
      "build",
      "full_test_suite",
      "targeted_tests"
    ]);
    expect(result.requiredValidations).toEqual([
      "state_machine_tests",
      "tamper_tests"
    ]);
  });

  test("target task must be ready and dependencies must be verified", () => {
    const unready = plan({
      roadmap: cloneRoadmap((draft) => {
        findTask(draft, "FCT-060").status = "in_progress";
      })
    });
    const unverifiedDependency = plan({
      roadmap: cloneRoadmap((draft) => {
        findTask(draft, "FCT-020").status = "done";
      })
    });
    const missingDependency = plan({
      roadmap: cloneRoadmap((draft) => {
        draft.tasks = draft.tasks.filter((task) => task.id !== "FCT-040");
      })
    });

    expect(unready.status).toBe("fail");
    expect(unready.verificationProposals).toEqual([]);
    expect(unready.reasons).toContain(
      "target_task_not_ready:FCT-060:in_progress"
    );
    expect(unverifiedDependency.status).toBe("fail");
    expect(unverifiedDependency.verificationProposals).toEqual([]);
    expect(unverifiedDependency.reasons).toContain(
      "dependency_not_verified:FCT-060:FCT-020:done"
    );
    expect(missingDependency.status).toBe("fail");
    expect(missingDependency.verificationProposals).toEqual([]);
    expect(missingDependency.reasons).toContain(
      "missing_dependency:FCT-060:FCT-040"
    );
  });

  test("missing PR metadata fails closed", () => {
    const result = plan({ pullRequests: [] });

    expect(result.status).toBe("fail");
    expect(result.verificationProposals).toEqual([]);
    expect(result.reasons).toContain("missing_pr_metadata:FCT-060");
    expect(result.missingEvidence).toContain("pr:FCT-060");
  });

  test("unmerged draft or ambiguous PR metadata fails closed", () => {
    const unmerged = plan({
      pullRequests: [
        {
          number: 134,
          title: "[FCT-060] Implement release guard and roadmap evidence sync",
          labels: ["task:FCT-060"],
          taskId: "FCT-060",
          state: "open",
          isDraft: false,
          merged: false,
          mergeCommitSha: MERGE_SHA
        }
      ]
    });
    const draft = plan({
      pullRequests: [
        {
          number: 134,
          title: "[FCT-060] Implement release guard and roadmap evidence sync",
          labels: ["task:FCT-060"],
          taskId: "FCT-060",
          state: "closed",
          isDraft: true,
          merged: true,
          mergeCommitSha: MERGE_SHA
        }
      ]
    });
    const ambiguous = plan({
      pullRequests: [
        ...(baseInput().pullRequests ?? []),
        {
          number: 135,
          title: "[FCT-060] Duplicate release guard",
          labels: ["task:FCT-060"],
          taskId: "FCT-060",
          state: "closed",
          isDraft: false,
          merged: true,
          mergeCommitSha: MERGE_SHA
        }
      ]
    });

    expect(unmerged.status).toBe("fail");
    expect(unmerged.reasons).toContain("pr_not_merged:FCT-060:#134");
    expect(draft.status).toBe("fail");
    expect(draft.reasons).toContain("pr_is_draft:FCT-060:#134");
    expect(ambiguous.status).toBe("fail");
    expect(ambiguous.reasons).toContain("ambiguous_pr_metadata:FCT-060");
  });

  test("missing or mismatched merge commit fails closed", () => {
    const missing = plan({ mergeCommit: null });
    const mismatched = plan({
      mergeCommit: {
        sha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        prNumber: 134
      }
    });

    expect(missing.status).toBe("fail");
    expect(missing.verificationProposals).toEqual([]);
    expect(missing.reasons).toContain(
      "missing_merge_commit_metadata:FCT-060"
    );
    expect(mismatched.status).toBe("fail");
    expect(mismatched.reasons).toContain(
      `merge_commit_sha_mismatch:FCT-060:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb:${MERGE_SHA}`
    );
  });

  test("missing CI evidence fails closed", () => {
    const result = plan({ ciChecks: [] });

    expect(result.status).toBe("fail");
    expect(result.verificationProposals).toEqual([]);
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "missing_ci_check_evidence",
        "missing_required_ci_check:typecheck"
      ])
    );
  });

  test("failed or unknown CI evidence fails closed", () => {
    const failed = plan({
      ciChecks: [
        ...validCiChecks().filter((check) => check.name !== "build"),
        {
          ...passedEvidence("build", "npm.cmd run build failed"),
          status: "failed"
        }
      ]
    });
    const unknown = plan({
      ciChecks: [
        ...validCiChecks().filter((check) => check.name !== "lint"),
        {
          ...passedEvidence("lint", "npm.cmd run lint unknown"),
          status: "mystery"
        }
      ]
    });

    expect(failed.status).toBe("fail");
    expect(failed.verificationProposals).toEqual([]);
    expect(failed.reasons).toContain("ci_check_not_passed:build:failed");
    expect(unknown.status).toBe("fail");
    expect(unknown.reasons).toContain(
      "unknown_ci_check_status:lint:mystery"
    );
  });

  test("no-op workflow success is rejected as release evidence", () => {
    const result = plan({
      ciChecks: [
        ...validCiChecks().filter((check) => check.name !== "targeted tests"),
        {
          name: "codex-quality-gate",
          status: "passed",
          evidence: "green no-op workflow",
          completedAt: RECENT_COMPLETED_AT,
          commitSha: MERGE_SHA,
          isNoOp: true
        }
      ]
    });

    expect(result.status).toBe("fail");
    expect(result.rejectedEvidence).toContain(
      "ci_check:codex_quality_gate:no_op"
    );
    expect(result.acceptedEvidence).not.toContain(
      "ci_check:codex_quality_gate:green no-op workflow"
    );
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "no_op_ci_check_not_release_evidence:codex_quality_gate",
        "missing_required_ci_check:targeted_tests"
      ])
    );
  });

  test("stale evidence fails closed", () => {
    const result = plan({
      ciChecks: [
        ...validCiChecks().filter((check) => check.name !== "typecheck"),
        {
          ...passedEvidence("typecheck", "npm.cmd run typecheck passed"),
          completedAt: "2026-06-26T00:00:00.000Z"
        }
      ]
    });

    expect(result.status).toBe("fail");
    expect(result.verificationProposals).toEqual([]);
    expect(result.reasons).toContain(
      "stale_evidence:ci_check:typecheck:48h>24h"
    );
  });

  test("missing owner approval for high-risk control-plane task fails closed", () => {
    const result = plan({ ownerApproval: null });

    expect(result.status).toBe("fail");
    expect(result.requiresOwnerApproval).toBe(true);
    expect(result.verificationProposals).toEqual([]);
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "owner_approval_required",
        "missing_owner_approval"
      ])
    );
  });

  test("live GitHub mutations or auto-merge requests fail closed", () => {
    const live = plan({
      options: {
        now: NOW,
        liveGitHubMutations: true
      }
    });
    const autoMerge = plan({
      options: {
        now: NOW,
        autoMerge: true
      }
    });

    expect(live.status).toBe("fail");
    expect(live.liveGitHubMutations).toBe(false);
    expect(live.verificationProposals).toEqual([]);
    expect(live.reasons).toContain(
      "live_github_mutation_request_not_supported_v1"
    );
    expect(autoMerge.status).toBe("fail");
    expect(autoMerge.autoMergeEnabled).toBe(false);
    expect(autoMerge.verificationProposals).toEqual([]);
    expect(autoMerge.reasons).toContain("auto_merge_request_not_supported_v1");
  });

  test("forbidden and unapproved protected files fail closed", () => {
    const forbidden = plan({
      changedFiles: [
        ".github/workflows/ci.yml",
        "src/lib/factory/release-evidence-guard.ts"
      ],
      riskClassification: {
        risk: "high",
        protectedPaths: [
          ".github/workflows/ci.yml",
          "src/lib/factory/release-evidence-guard.ts"
        ],
        requiresOwnerApproval: true,
        changedFiles: [
          ".github/workflows/ci.yml",
          "src/lib/factory/release-evidence-guard.ts"
        ]
      }
    });
    const unapprovedProtected = plan({ protectedPathEvidence: [] });

    expect(forbidden.status).toBe("fail");
    expect(forbidden.verificationProposals).toEqual([]);
    expect(forbidden.reasons).toContain(
      "forbidden_changed_file:.github/workflows/ci.yml:github_workflows"
    );
    expect(unapprovedProtected.status).toBe("fail");
    expect(unapprovedProtected.reasons).toContain(
      "missing_protected_path_evidence:src/lib/factory/release-evidence-guard.ts"
    );
  });

  test("validation and rollback evidence are required", () => {
    const missingValidation = plan({ validationResults: [] });
    const missingRollback = plan({ rollbackEvidence: null });

    expect(missingValidation.status).toBe("fail");
    expect(missingValidation.reasons).toEqual(
      expect.arrayContaining([
        "missing_validation_evidence",
        "missing_required_validation:state_machine_tests"
      ])
    );
    expect(missingRollback.status).toBe("fail");
    expect(missingRollback.reasons).toContain("missing_rollback_evidence");
  });

  test("roadmap input is not mutated and FCT-060 is not marked verified", () => {
    const roadmap = readRoadmap();
    const before = JSON.stringify(roadmap);
    const fct060Before = findTask(roadmap, "FCT-060") as RoadmapTaskWithEvidence;
    const result = plan({ roadmap });
    const fct060After = findTask(roadmap, "FCT-060") as RoadmapTaskWithEvidence;

    expect(result.status).toBe("pass");
    expect(JSON.stringify(roadmap)).toBe(before);
    expect(fct060Before.status).toBe("ready");
    expect(fct060After.status).toBe("ready");
    expect(fct060After.evidence).toBeUndefined();
    expect(result.verificationProposals[0].apply).toBe(false);
    expect(result.reasons).toContain("fct_060_status_preserved_ready_v1");
  });

  test("output order is deterministic", () => {
    const first = plan();
    const second = plan({
      roadmap: cloneRoadmap((draft) => {
        draft.tasks = [...draft.tasks].reverse();
      }),
      ciChecks: [...validCiChecks()].reverse(),
      validationResults: [...validValidationResults()].reverse(),
      protectedPathEvidence: [
        {
          path: "src/lib/factory/release-evidence-guard.ts",
          status: "approved safe",
          evidence: "factory control-plane change covered by owner approval"
        }
      ]
    });

    expect(second).toEqual(first);
  });

  test("same input produces identical output", () => {
    const input = baseInput();

    expect(planFactoryReleaseEvidenceGuard(input)).toEqual(
      planFactoryReleaseEvidenceGuard(input)
    );
  });

  test("proposal does not add FCT-060 evidence to the implementation roadmap", () => {
    const roadmap = readRoadmap();
    const fct060 = findTask(roadmap, "FCT-060") as RoadmapTaskWithEvidence;
    const result = plan({ roadmap });

    expect(fct060.status).toBe("ready");
    expect(fct060.evidence).toBeUndefined();
    expect(result.verificationProposals).toHaveLength(1);
    expect(result.verificationProposals[0]).toMatchObject({
      taskId: "FCT-060",
      toStatus: "verified",
      apply: false
    });
  });

  test("next task unlock is only proposed under dependency rules", () => {
    const current = plan();
    const unlockable = plan({
      roadmap: cloneRoadmap((draft) => {
        findTask(draft, "FCT-070").status = "blocked_dependency";
      })
    });

    expect(current.status).toBe("pass");
    expect(current.nextTaskUnlockProposals).toEqual([]);
    expect(unlockable.status).toBe("pass");
    expect(unlockable.nextTaskUnlockProposals).toEqual([
      {
        taskId: "FCT-070",
        fromStatus: "blocked_dependency",
        toStatus: "ready",
        apply: false,
        dependencySatisfiedBy: "FCT-060"
      }
    ]);
  });

  test("live roadmap keeps FCT-060 ready without implementation evidence", () => {
    const roadmap = readRoadmap();
    const fct060 = findTask(roadmap, "FCT-060") as RoadmapTaskWithEvidence;
    const fct070 = findTask(roadmap, "FCT-070") as RoadmapTaskWithEvidence;

    expect(fct060.status).toBe("ready");
    expect(fct060.evidence).toBeUndefined();
    expect(fct070.status).toBe("deferred");
    expect(fct070.evidence).toBeUndefined();
  });
});
