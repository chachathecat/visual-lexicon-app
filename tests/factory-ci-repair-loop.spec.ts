import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import {
  CI_REPAIR_LOOP_VERSION,
  planCiRepairLoop,
  type CiRepairCheckRunLike,
  type CiRepairFailedJobSummaryLike,
  type CiRepairPlannerInput,
  type CiRepairPlannerResult,
  type CiRepairLoopVersion,
  type CiRepairRoadmapLike,
  type CiRepairRoadmapTaskLike,
  type CiRepairRunLike
} from "../src/lib/factory/ci-repair-loop";

type CiRepairLoopTypeSurface = {
  version: CiRepairLoopVersion;
  result: CiRepairPlannerResult;
};

type MutableRoadmap = CiRepairRoadmapLike & {
  tasks: CiRepairRoadmapTaskLike[];
};

type RoadmapTaskWithEvidence = CiRepairRoadmapTaskLike & {
  evidence?: string[];
};

const NOW = "2026-06-28T00:00:00.000Z";
const RECENT_COMPLETED_AT = "2026-06-27T23:00:00.000Z";

const typeSmoke: CiRepairLoopTypeSurface = {
  version: CI_REPAIR_LOOP_VERSION,
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

function fct050ReadyRoadmap(overrides?: (roadmap: MutableRoadmap) => void) {
  return cloneRoadmap((draft) => {
    const fct050 = findTask(draft, "FCT-050") as RoadmapTaskWithEvidence;
    const fct060 = findTask(draft, "FCT-060") as RoadmapTaskWithEvidence;

    fct050.status = "ready";
    delete fct050.evidence;
    fct060.status = "blocked_dependency";
    delete fct060.evidence;

    overrides?.(draft);
  });
}

function safeCheckRuns(
  overrides?: (checkRuns: CiRepairCheckRunLike[]) => void
) {
  const checkRuns: CiRepairCheckRunLike[] = [
    {
      name: "targeted tests",
      status: "completed",
      conclusion: "failure",
      evidence:
        "npm.cmd run test -- tests/factory-ci-repair-loop.spec.ts --workers=1 failed"
    },
    {
      name: "typecheck",
      status: "completed",
      conclusion: "success",
      evidence: "npm.cmd run typecheck passed"
    }
  ];

  overrides?.(checkRuns);

  return checkRuns;
}

function safeCiRun(overrides: Partial<CiRepairRunLike> = {}): CiRepairRunLike {
  return {
    name: "pull request",
    status: "completed",
    conclusion: "failure",
    completedAt: RECENT_COMPLETED_AT,
    evidence: "CI run 123 failed with one targeted test failure",
    checkRuns: safeCheckRuns(),
    ...overrides
  };
}

function safeFailedJobs(
  overrides: Partial<CiRepairFailedJobSummaryLike> = {}
): CiRepairFailedJobSummaryLike[] {
  return [
    {
      checkName: "targeted tests",
      jobName: "factory ci repair loop",
      failureClass: "test",
      failureSignature: "expected bounded repair plan shape mismatch",
      summary: "The new FCT-050 planner contract test failed.",
      rerunCommand:
        "npm.cmd run test -- tests/factory-ci-repair-loop.spec.ts --workers=1",
      ...overrides
    }
  ];
}

function baseInput(
  overrides: Partial<CiRepairPlannerInput> = {}
): CiRepairPlannerInput {
  return {
    roadmap: fct050ReadyRoadmap(),
    ciRun: safeCiRun(),
    failedJobs: safeFailedJobs(),
    affectedTaskIds: ["FCT-050"],
    options: {
      now: NOW
    },
    ...overrides
  };
}

function plan(overrides: Partial<CiRepairPlannerInput> = {}) {
  return planCiRepairLoop(baseInput(overrides));
}

function planFor(result: CiRepairPlannerResult, taskId: string) {
  return result.repairPlans.find((candidate) => candidate.taskId === taskId);
}

test.describe("factory CI repair loop", () => {
  test("exports the required versioned dry-run output contract", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      result: {
        version: 1,
        status: "pass",
        dryRun: true,
        liveGitHubMutations: false,
        autoMergeEnabled: false,
        repairAttemptLimit: 3,
        nextRepairAttempt: 1
      }
    });
  });

  test("FCT-050 ready task produces one dry-run bounded repair plan", () => {
    const result = plan();
    const repairPlan = planFor(result, "FCT-050");

    expect(result.status).toBe("pass");
    expect(result.readyTaskIds).toEqual(["FCT-050"]);
    expect(result.repairPlans).toHaveLength(1);
    expect(repairPlan).toMatchObject({
      taskId: "FCT-050",
      repairAttempt: 1,
      branchName: "factory/fct-050-ci-repair-attempt-1",
      title: "[FCT-050] CI repair attempt 1: targeted_tests",
      idempotencyKey: "vlx-ci-repair:FCT-050:attempt-1:v1",
      action: "create",
      ownerApprovalRequired: true,
      failureTarget: {
        checkName: "targeted_tests",
        jobName: "factory_ci_repair_loop",
        failureClass: "test"
      }
    });
    expect(result).toMatchObject({
      dryRun: true,
      liveGitHubMutations: false,
      autoMergeEnabled: false,
      requiresOwnerApproval: true
    });
    expect(result.reasons).toEqual([
      "dry_run_forced_v1",
      "live_github_mutations_disabled_v1",
      "auto_merge_disabled_v1",
      "fct_050_status_preserved_ready_v1",
      "fct_060_blocked_dependency_preserved_v1"
    ]);
  });

  test("FCT-050 depends on verified FCT-040", () => {
    const roadmap = fct050ReadyRoadmap();
    const fct050 = findTask(roadmap, "FCT-050");
    const dependencyStatuses = (fct050.depends_on ?? []).map(
      (dependencyId) => findTask(roadmap, dependencyId).status
    );
    const result = plan({ roadmap });

    expect(fct050.depends_on).toEqual(["FCT-040"]);
    expect(dependencyStatuses).toEqual(["verified"]);
    expect(result.status).toBe("pass");
    expect(result.reasons.join("\n")).not.toContain("dependency_not_verified");
  });

  test("FCT-040 missing or unverified dependency fails closed", () => {
    const unverified = plan({
      roadmap: fct050ReadyRoadmap((draft) => {
        findTask(draft, "FCT-040").status = "done";
      })
    });
    const missing = plan({
      roadmap: fct050ReadyRoadmap((draft) => {
        draft.tasks = draft.tasks.filter((task) => task.id !== "FCT-040");
      })
    });

    expect(unverified.status).toBe("fail");
    expect(unverified.repairPlans).toEqual([]);
    expect(unverified.reasons).toContain(
      "dependency_not_verified:FCT-050:FCT-040:done"
    );
    expect(missing.status).toBe("fail");
    expect(missing.repairPlans).toEqual([]);
    expect(missing.reasons).toContain("missing_dependency:FCT-050:FCT-040");
  });

  test("FCT-060 remains blocked and is not planned", () => {
    const result = plan();

    expect(result.blockedTaskIds).toContain("FCT-060");
    expect(planFor(result, "FCT-060")).toBeUndefined();
    expect(result.repairPlans.some((repairPlan) => repairPlan.taskId === "FCT-060")).toBe(false);
    expect(planFor(result, "FCT-050")?.safetyNotes).toContain(
      "FCT-060 remains blocked_dependency and is not planned."
    );
  });

  test("FCT-060 affected scope fails closed", () => {
    const result = plan({
      affectedTaskIds: ["FCT-050", "FCT-060"]
    });

    expect(result.status).toBe("fail");
    expect(result.repairPlans).toEqual([]);
    expect(result.reasons).toContain("fct_060_would_be_affected:FCT-060");
  });

  test("FCT-050 ready fixture is not marked verified by the planner", () => {
    const roadmap = fct050ReadyRoadmap();
    const before = findTask(roadmap, "FCT-050").status;
    const result = plan({ roadmap });
    const after = findTask(roadmap, "FCT-050").status;

    expect(before).toBe("ready");
    expect(after).toBe("ready");
    expect(result.reasons.join("\n")).not.toContain("verified:FCT-050");
  });

  test("live roadmap has FCT-050 and FCT-060 verified with merge evidence", () => {
    const roadmap = readRoadmap();
    const fct050 = findTask(roadmap, "FCT-050") as RoadmapTaskWithEvidence;
    const fct060 = findTask(roadmap, "FCT-060") as RoadmapTaskWithEvidence;
    const fct070 = findTask(roadmap, "FCT-070") as RoadmapTaskWithEvidence;

    expect(fct050.status).toBe("verified");
    expect(fct050.evidence).toEqual(
      expect.arrayContaining([
        "PR #132",
        "merge commit 14393128a296ed09bebac700f7b4a86a2ceaf717"
      ])
    );
    expect(fct060.status).toBe("verified");
    expect(fct060.evidence).toEqual(
      expect.arrayContaining([
        "PR #134",
        "merge commit 0819bcbe170288cbede12aa640d478339506c083"
      ])
    );
    expect(fct070.status).toBe("deferred");
    expect(fct070.evidence).toBeUndefined();
  });

  test("roadmap task statuses are not mutated", () => {
    const roadmap = fct050ReadyRoadmap();
    const before = roadmap.tasks.map((task) => [task.id, task.status]);

    plan({ roadmap });

    const after = roadmap.tasks.map((task) => [task.id, task.status]);

    expect(after).toEqual(before);
  });

  test("live mutation, auto-merge, and dryRun false requests fail closed", () => {
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
    const dryRunFalse = plan({
      options: {
        now: NOW,
        dryRun: false
      }
    });

    expect(live.status).toBe("fail");
    expect(live.reasons).toContain(
      "live_github_mutation_request_not_supported_v1"
    );
    expect(autoMerge.status).toBe("fail");
    expect(autoMerge.reasons).toContain("auto_merge_request_not_supported_v1");
    expect(dryRunFalse.status).toBe("fail");
    expect(dryRunFalse.reasons).toContain("dry_run_false_not_supported_v1");
    expect(live.repairPlans).toEqual([]);
    expect(autoMerge.repairPlans).toEqual([]);
    expect(dryRunFalse.repairPlans).toEqual([]);
  });

  test("unknown check conclusion fails closed", () => {
    const result = plan({
      ciRun: safeCiRun({
        checkRuns: safeCheckRuns((checkRuns) => {
          checkRuns[0].conclusion = "mystery";
        })
      })
    });

    expect(result.status).toBe("fail");
    expect(result.repairPlans).toEqual([]);
    expect(result.reasons).toContain(
      "unknown_check_conclusion:targeted_tests:mystery"
    );
  });

  test("missing CI run or check evidence fails closed", () => {
    const missingRun = plan({ ciRun: null });
    const missingChecks = plan({
      ciRun: safeCiRun({
        checkRuns: []
      })
    });

    expect(missingRun.status).toBe("fail");
    expect(missingRun.reasons).toContain("missing_ci_run_evidence");
    expect(missingRun.repairPlans).toEqual([]);
    expect(missingChecks.status).toBe("fail");
    expect(missingChecks.reasons).toContain("missing_ci_check_runs");
    expect(missingChecks.repairPlans).toEqual([]);
  });

  test("stale CI evidence fails closed", () => {
    const result = plan({
      ciRun: safeCiRun({
        completedAt: "2026-06-26T00:00:00.000Z"
      })
    });

    expect(result.status).toBe("fail");
    expect(result.repairPlans).toEqual([]);
    expect(result.reasons).toContain(
      "stale_ci_evidence:ci_run:pull_request:48h>24h"
    );
  });

  test("ambiguous failed jobs or checks fail closed", () => {
    const ambiguousChecks = plan({
      ciRun: safeCiRun({
        checkRuns: [
          ...safeCheckRuns(),
          {
            name: "build",
            status: "completed",
            conclusion: "failure",
            evidence: "npm.cmd run build failed"
          }
        ]
      })
    });
    const ambiguousJobs = plan({
      failedJobs: [
        ...safeFailedJobs(),
        {
          checkName: "build",
          jobName: "next build",
          failureClass: "build",
          failureSignature: "missing module",
          summary: "The build failed.",
          rerunCommand: "npm.cmd run build"
        }
      ]
    });

    expect(ambiguousChecks.status).toBe("fail");
    expect(ambiguousChecks.reasons).toContain(
      "ambiguous_failed_checks:build,targeted_tests"
    );
    expect(ambiguousChecks.repairPlans).toEqual([]);
    expect(ambiguousJobs.status).toBe("fail");
    expect(ambiguousJobs.reasons).toContain(
      "ambiguous_failed_jobs:next_build,factory_ci_repair_loop"
    );
    expect(ambiguousJobs.repairPlans).toEqual([]);
  });

  test("exceeded repair attempt limit fails closed", () => {
    const result = plan({
      attemptHistory: [
        { taskId: "FCT-050", attemptNumber: 1, status: "failed" },
        { taskId: "FCT-050", attemptNumber: 2, status: "failed" },
        { taskId: "FCT-050", attemptNumber: 3, status: "failed" }
      ]
    });

    expect(result.status).toBe("fail");
    expect(result.nextRepairAttempt).toBeNull();
    expect(result.repairPlans).toEqual([]);
    expect(result.reasons).toContain(
      "repair_attempt_limit_exceeded:FCT-050:3/3"
    );
  });

  test("no-op workflow success is not accepted as release or repair evidence", () => {
    const result = plan({
      ciRun: safeCiRun({
        name: "ci-repair",
        conclusion: "success",
        isNoOp: true,
        evidence: "green manual no-op workflow"
      })
    });

    expect(result.status).toBe("fail");
    expect(result.repairPlans).toEqual([]);
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "no_op_workflow_not_repair_evidence:ci_repair",
        "ci_run_not_failed:ci_repair:success"
      ])
    );
    expect(result.rejectedEvidence).toContain("workflow:ci_repair:no_op");
    expect(result.acceptedEvidence).not.toContain(
      "ci_run:ci_repair:green manual no-op workflow"
    );
  });

  test("existing mock branch and PR prevent duplicate repair planning", () => {
    const initial = plan();
    const repairPlan = planFor(initial, "FCT-050");

    if (!repairPlan) {
      throw new Error("Missing FCT-050 repair plan");
    }

    const result = plan({
      existingBranches: [
        {
          name: repairPlan.branchName,
          taskId: repairPlan.taskId,
          repairAttempt: repairPlan.repairAttempt,
          idempotencyKey: repairPlan.idempotencyKey
        }
      ],
      existingRepairPrs: [
        {
          title: repairPlan.title,
          body: repairPlan.body,
          labels: [...repairPlan.labels].reverse(),
          taskId: repairPlan.taskId,
          repairAttempt: repairPlan.repairAttempt,
          idempotencyKey: repairPlan.idempotencyKey,
          branchName: repairPlan.branchName,
          isDraft: true,
          state: "open",
          autoMergeEnabled: false
        }
      ]
    });

    expect(result.status).toBe("pass");
    expect(planFor(result, "FCT-050")?.action).toBe("skip");
    expect(result.duplicateProtections).toEqual(
      expect.arrayContaining([
        "existing_branch_name:FCT-050:attempt-1:active",
        "existing_repair_pr_task_id_attempt:FCT-050:attempt-1:open"
      ])
    );
  });

  test("conflicting existing mock PR blocks repair planning", () => {
    const result = plan({
      existingRepairPrs: [
        {
          taskId: "FCT-050",
          repairAttempt: 1,
          idempotencyKey: "vlx-ci-repair:FCT-050:attempt-1:v1",
          branchName: "factory/fct-050-other",
          isDraft: true,
          state: "open"
        }
      ]
    });

    expect(result.status).toBe("fail");
    expect(planFor(result, "FCT-050")?.action).toBe("block");
    expect(result.duplicateProtections).toEqual(
      expect.arrayContaining([
        "conflicting_existing_repair_pr:FCT-050:attempt-1:branch_name_mismatch",
        "blocked_plan:FCT-050"
      ])
    );
  });

  test("owner approval is required for high-risk control-plane repair actions", () => {
    const result = plan();
    const repairPlan = planFor(result, "FCT-050");

    expect(result.requiresOwnerApproval).toBe(true);
    expect(repairPlan?.ownerApprovalRequired).toBe(true);
    expect(repairPlan?.labels).toEqual(
      expect.arrayContaining([
        "risk:high",
        "human-gate",
        "owner-approval-required",
        "auto-merge-disabled"
      ])
    );
    expect(repairPlan?.body).toContain(
      "High-risk/control-plane repair actions require owner approval."
    );
  });

  test("output order is deterministic", () => {
    const first = plan();
    const second = plan({
      roadmap: fct050ReadyRoadmap((draft) => {
        draft.tasks = [...draft.tasks].reverse();
      }),
      ciRun: safeCiRun({
        checkRuns: [...safeCheckRuns()].reverse()
      })
    });

    expect(second).toEqual(first);
  });

  test("same input produces identical output", () => {
    const input = baseInput();

    expect(planCiRepairLoop(input)).toEqual(planCiRepairLoop(input));
  });
});
