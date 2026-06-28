import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import {
  DRAFT_PR_ORCHESTRATOR_VERSION,
  planDraftPrOrchestration,
  type DraftPrOrchestrationResult,
  type DraftPrOrchestratorVersion,
  type DraftPrRoadmapLike,
  type DraftPrRoadmapTaskLike
} from "../src/lib/factory/draft-pr-orchestrator";

type DraftPrOrchestratorTypeSurface = {
  version: DraftPrOrchestratorVersion;
  result: DraftPrOrchestrationResult;
};

type MutableRoadmap = DraftPrRoadmapLike & {
  tasks: DraftPrRoadmapTaskLike[];
};

const typeSmoke: DraftPrOrchestratorTypeSurface = {
  version: DRAFT_PR_ORCHESTRATOR_VERSION,
  result: planDraftPrOrchestration({
    roadmap: fct040ReadyRoadmap()
  })
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

function fct040ReadyRoadmap(overrides?: (roadmap: MutableRoadmap) => void) {
  return cloneRoadmap((draft) => {
    const fct040 = findTask(draft, "FCT-040") as DraftPrRoadmapTaskLike & {
      evidence?: string[];
    };
    const fct050 = findTask(draft, "FCT-050");
    const fct060 = findTask(draft, "FCT-060");

    fct040.status = "ready";
    delete fct040.evidence;
    fct050.status = "blocked_dependency";
    fct060.status = "blocked_dependency";
    overrides?.(draft);
  });
}

function plan(roadmap = fct040ReadyRoadmap()) {
  return planDraftPrOrchestration({ roadmap });
}

function findTask(roadmap: MutableRoadmap, taskId: string) {
  const task = roadmap.tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    throw new Error(`Missing roadmap task ${taskId}`);
  }

  return task;
}

function planFor(result: DraftPrOrchestrationResult, taskId: string) {
  return result.draftPrPlans.find((candidate) => candidate.taskId === taskId);
}

test.describe("factory draft PR orchestrator", () => {
  test("exports the required versioned dry-run output contract", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      result: {
        version: 1,
        status: "pass",
        dryRun: true,
        liveGitHubMutations: false,
        autoMergeEnabled: false,
        readyTaskIds: ["FCT-040"]
      }
    });
  });

  test("FCT-040 ready task produces one dry-run draft PR plan", () => {
    const result = plan();
    const draftPrPlan = planFor(result, "FCT-040");

    expect(result.status).toBe("pass");
    expect(result.draftPrPlans).toHaveLength(1);
    expect(draftPrPlan).toMatchObject({
      taskId: "FCT-040",
      branchName: "factory/fct-040-draft-pr-orchestrator",
      title: "[FCT-040] Implement bounded draft-PR orchestrator",
      idempotencyKey: "vlx-draft-pr:FCT-040:v1",
      action: "create"
    });
    expect(result).toMatchObject({
      dryRun: true,
      liveGitHubMutations: false,
      autoMergeEnabled: false
    });
    expect(result.reasons).toEqual([
      "dry_run_forced_v1",
      "live_github_mutations_disabled_v1",
      "auto_merge_disabled_v1"
    ]);
  });

  test("FCT-030 verified task is skipped and not planned", () => {
    const result = plan();

    expect(result.skippedTaskIds).toContain("FCT-030");
    expect(planFor(result, "FCT-030")).toBeUndefined();
  });

  test("FCT-050 and FCT-060 remain blocked and are not planned", () => {
    const result = plan();

    expect(result.blockedTaskIds).toEqual(
      expect.arrayContaining(["FCT-050", "FCT-060"])
    );
    expect(planFor(result, "FCT-050")).toBeUndefined();
    expect(planFor(result, "FCT-060")).toBeUndefined();
  });

  test("FCT-040 dependency on FCT-030 must be verified", () => {
    const roadmap = fct040ReadyRoadmap();
    const fct040 = findTask(roadmap, "FCT-040");
    const dependencyStatuses = (fct040.depends_on ?? []).map(
      (dependencyId) => findTask(roadmap, dependencyId).status
    );
    const result = plan(roadmap);

    expect(fct040.depends_on).toEqual(["FCT-030"]);
    expect(dependencyStatuses).toEqual(["verified"]);
    expect(result.status).toBe("pass");
    expect(result.reasons.join("\n")).not.toContain("dependency_not_verified");
  });

  test("unverified dependency fails closed", () => {
    const roadmap = fct040ReadyRoadmap((draft) => {
      findTask(draft, "FCT-030").status = "done";
    });
    const result = plan(roadmap);

    expect(result.status).toBe("fail");
    expect(result.draftPrPlans).toEqual([]);
    expect(result.reasons).toContain(
      "dependency_not_verified:FCT-040:FCT-030:done"
    );
  });

  test("missing dependency fails closed", () => {
    const roadmap = fct040ReadyRoadmap((draft) => {
      findTask(draft, "FCT-040").depends_on = ["FCT-999"];
    });
    const result = plan(roadmap);

    expect(result.status).toBe("fail");
    expect(result.draftPrPlans).toEqual([]);
    expect(result.reasons).toContain("missing_dependency:FCT-040:FCT-999");
  });

  test("duplicate task IDs fail closed", () => {
    const roadmap = fct040ReadyRoadmap((draft) => {
      draft.tasks = [...draft.tasks, { ...findTask(draft, "FCT-040") }];
    });
    const result = plan(roadmap);

    expect(result.status).toBe("fail");
    expect(result.draftPrPlans).toEqual([]);
    expect(result.reasons).toContain("duplicate_task_id:FCT-040");
  });

  test("unknown task status fails closed", () => {
    const roadmap = fct040ReadyRoadmap((draft) => {
      findTask(draft, "FCT-040").status = "mystery";
    });
    const result = plan(roadmap);

    expect(result.status).toBe("fail");
    expect(result.draftPrPlans).toEqual([]);
    expect(result.reasons).toContain("unknown_task_status:FCT-040:mystery");
  });

  test("unknown risk fails closed", () => {
    const roadmap = fct040ReadyRoadmap((draft) => {
      findTask(draft, "FCT-040").risk = "critical";
    });
    const result = plan(roadmap);

    expect(result.status).toBe("fail");
    expect(result.draftPrPlans).toEqual([]);
    expect(result.reasons).toContain("unknown_task_risk:FCT-040:critical");
  });

  test("missing roadmap and missing tasks fail closed", () => {
    const missingRoadmap = planDraftPrOrchestration({ roadmap: null });
    const missingTasks = planDraftPrOrchestration({ roadmap: { tasks: [] } });

    expect(missingRoadmap.status).toBe("fail");
    expect(missingRoadmap.reasons).toEqual(
      expect.arrayContaining(["missing_roadmap", "missing_tasks"])
    );
    expect(missingTasks.status).toBe("fail");
    expect(missingTasks.reasons).toContain("missing_tasks");
  });

  test("live mutation request fails closed", () => {
    const result = planDraftPrOrchestration({
      roadmap: fct040ReadyRoadmap(),
      options: {
        dryRun: false,
        liveGitHubMutations: true
      }
    });

    expect(result.status).toBe("fail");
    expect(result.draftPrPlans).toEqual([]);
    expect(result).toMatchObject({
      dryRun: true,
      liveGitHubMutations: false,
      autoMergeEnabled: false
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "dry_run_false_not_supported_v1",
        "live_github_mutation_request_not_supported_v1"
      ])
    );
  });

  test("high-risk task forces owner approval and auto-merge disabled", () => {
    const result = plan();
    const draftPrPlan = planFor(result, "FCT-040");

    expect(result.requiresOwnerApproval).toBe(true);
    expect(result.autoMergeEnabled).toBe(false);
    expect(draftPrPlan?.labels).toEqual(
      expect.arrayContaining([
        "risk:high",
        "human-gate",
        "owner-approval-required",
        "auto-merge-disabled"
      ])
    );
    expect(draftPrPlan?.safetyNotes).toContain(
      "Owner approval is required before merge or follow-on automation."
    );
    expect(draftPrPlan?.body).toContain("- High-risk PRs never merge automatically.");
  });

  test("high-risk auto-merge request fails closed", () => {
    const result = planDraftPrOrchestration({
      roadmap: fct040ReadyRoadmap(),
      options: {
        autoMerge: true
      }
    });

    expect(result.status).toBe("fail");
    expect(result.autoMergeEnabled).toBe(false);
    expect(result.draftPrPlans).toEqual([]);
    expect(result.reasons).toContain("auto_merge_request_not_supported_v1");
  });

  test("existing matching branch and draft PR are handled without duplicate creation", () => {
    const initial = plan();
    const draftPrPlan = planFor(initial, "FCT-040");

    if (!draftPrPlan) {
      throw new Error("Missing FCT-040 draft PR plan");
    }

    const result = planDraftPrOrchestration({
      roadmap: fct040ReadyRoadmap(),
      existingBranches: [
        {
          name: draftPrPlan.branchName,
          taskId: draftPrPlan.taskId,
          idempotencyKey: draftPrPlan.idempotencyKey
        }
      ],
      existingDraftPrs: [
        {
          title: draftPrPlan.title,
          body: draftPrPlan.body,
          labels: [...draftPrPlan.labels].reverse(),
          taskId: draftPrPlan.taskId,
          idempotencyKey: draftPrPlan.idempotencyKey,
          branchName: draftPrPlan.branchName,
          isDraft: true,
          state: "open",
          autoMergeEnabled: false
        }
      ]
    });

    expect(result.status).toBe("pass");
    expect(planFor(result, "FCT-040")?.action).toBe("skip");
    expect(result.duplicateProtections).toEqual(
      expect.arrayContaining([
        "existing_branch_name:FCT-040:active",
        "existing_draft_pr_task_id:FCT-040:open"
      ])
    );
  });

  test("existing matching branch without draft PR creates the missing draft PR plan", () => {
    const initial = plan();
    const draftPrPlan = planFor(initial, "FCT-040");

    if (!draftPrPlan) {
      throw new Error("Missing FCT-040 draft PR plan");
    }

    const result = planDraftPrOrchestration({
      roadmap: fct040ReadyRoadmap(),
      existingBranches: [
        {
          name: draftPrPlan.branchName,
          taskId: draftPrPlan.taskId,
          idempotencyKey: draftPrPlan.idempotencyKey
        }
      ]
    });
    const recoveredPlan = planFor(result, "FCT-040");

    expect(result.status).toBe("pass");
    expect(recoveredPlan?.action).toBe("create");
    expect(result.duplicateProtections).toContain(
      "existing_branch_name:FCT-040:active"
    );
    expect(result.duplicateProtections).not.toContain("blocked_plan:FCT-040");
    expect(recoveredPlan?.action).not.toBe("block");
  });

  test("existing draft PR with task label is matched without duplicate creation", () => {
    const result = planDraftPrOrchestration({
      roadmap: fct040ReadyRoadmap(),
      existingDraftPrs: [
        {
          title: "[Factory] Draft PR orchestration follow-up",
          labels: ["factory", "draft-pr", "roadmap-task", "task:FCT-040"],
          isDraft: true,
          state: "open",
          autoMergeEnabled: false
        }
      ]
    });
    const draftPrPlan = planFor(result, "FCT-040");

    expect(result.status).toBe("pass");
    expect(draftPrPlan?.action).toBe("update");
    expect(result.duplicateProtections).toContain(
      "existing_draft_pr_task_label:FCT-040:open"
    );
    expect(draftPrPlan?.action).not.toBe("create");
    expect(draftPrPlan?.action).not.toBe("block");
  });

  test("conflicting existing branch blocks instead of creating a duplicate", () => {
    const result = planDraftPrOrchestration({
      roadmap: fct040ReadyRoadmap(),
      existingBranches: [
        {
          name: "factory/fct-040-draft-pr-orchestrator",
          taskId: "ACC-010",
          idempotencyKey: "vlx-draft-pr:ACC-010:v1"
        }
      ]
    });

    expect(result.status).toBe("fail");
    expect(planFor(result, "FCT-040")?.action).toBe("block");
    expect(result.duplicateProtections).toEqual(
      expect.arrayContaining([
        "conflicting_existing_branch:FCT-040:task_id_mismatch",
        "blocked_plan:FCT-040"
      ])
    );
  });

  test("conflicting existing draft PR blocks instead of creating a duplicate", () => {
    const result = planDraftPrOrchestration({
      roadmap: fct040ReadyRoadmap(),
      existingDraftPrs: [
        {
          taskId: "FCT-040",
          idempotencyKey: "vlx-draft-pr:FCT-040:v1",
          branchName: "factory/fct-040-other",
          isDraft: true,
          state: "open"
        }
      ]
    });

    expect(result.status).toBe("fail");
    expect(planFor(result, "FCT-040")?.action).toBe("block");
    expect(result.duplicateProtections).toEqual(
      expect.arrayContaining([
        "conflicting_existing_draft_pr:FCT-040:branch_name_mismatch",
        "blocked_plan:FCT-040"
      ])
    );
  });

  test("ambiguous existing idempotency key fails closed", () => {
    const result = planDraftPrOrchestration({
      roadmap: fct040ReadyRoadmap(),
      existingDraftPrs: [
        {
          idempotencyKey: "vlx-draft-pr:FCT-040:v1",
          branchName: "factory/fct-040-draft-pr-orchestrator"
        },
        {
          idempotencyKey: "vlx-draft-pr:FCT-040:v1",
          branchName: "factory/fct-040-duplicate"
        }
      ]
    });

    expect(result.status).toBe("fail");
    expect(result.draftPrPlans).toEqual([]);
    expect(result.reasons).toContain(
      "ambiguous_existing_idempotency_key:vlx-draft-pr:FCT-040:v1"
    );
  });

  test("idempotency key is deterministic", () => {
    const first = planFor(plan(), "FCT-040")?.idempotencyKey;
    const second = planFor(plan(), "FCT-040")?.idempotencyKey;

    expect(first).toBe("vlx-draft-pr:FCT-040:v1");
    expect(second).toBe(first);
  });

  test("branch name is deterministic and slug-safe", () => {
    const draftPrPlan = planFor(plan(), "FCT-040");

    expect(draftPrPlan?.branchName).toBe(
      "factory/fct-040-draft-pr-orchestrator"
    );
    expect(draftPrPlan?.branchName).toMatch(/^factory\/[a-z0-9-]+$/);
  });

  test("PR title is deterministic", () => {
    expect(planFor(plan(), "FCT-040")?.title).toBe(
      "[FCT-040] Implement bounded draft-PR orchestrator"
    );
  });

  test("PR body contains required contract sections", () => {
    const body = planFor(plan(), "FCT-040")?.body ?? "";

    for (const section of [
      "## Goal",
      "## Scope",
      "## Roadmap task",
      "## Acceptance criteria",
      "## Validation plan",
      "## Role handoff plan",
      "## Risk",
      "## Safety boundaries",
      "## Rollback",
      "## Human decision / owner approval",
      "## Auto-merge eligibility"
    ]) {
      expect(body).toContain(section);
    }
  });

  test("role handoff plan includes all configured factory roles", () => {
    const draftPrPlan = planFor(plan(), "FCT-040");
    const roles = draftPrPlan?.roleHandoffs.map((handoff) => handoff.role);
    const agents = draftPrPlan?.roleHandoffs.map(
      (handoff) => handoff.codexAgent
    );

    expect(roles).toEqual([
      "planner",
      "explorer",
      "implementer",
      "tester",
      "security_reviewer",
      "release_guard"
    ]);
    expect(agents).toEqual([
      "planner",
      "explorer",
      "implementer",
      "tester",
      "security-reviewer",
      "release-guard"
    ]);
    expect(draftPrPlan?.body).toContain("security-reviewer");
    expect(draftPrPlan?.body).toContain("release-guard");
  });

  test("output order is deterministic", () => {
    const first = plan();
    const second = plan(
      fct040ReadyRoadmap((draft) => {
        draft.tasks = [...draft.tasks].reverse();
      })
    );

    expect(second).toEqual(first);
  });

  test("same input produces identical output", () => {
    const roadmap = fct040ReadyRoadmap();

    expect(plan(roadmap)).toEqual(plan(roadmap));
  });

  test("FCT-040 is not marked verified", () => {
    const roadmap = fct040ReadyRoadmap();
    const before = findTask(roadmap, "FCT-040").status;
    const result = plan(roadmap);
    const after = findTask(roadmap, "FCT-040").status;

    expect(before).toBe("ready");
    expect(after).toBe("ready");
    expect(result.reasons.join("\n")).not.toContain("verified:FCT-040");
  });

  test("roadmap task statuses are not modified", () => {
    const roadmap = fct040ReadyRoadmap();
    const before = roadmap.tasks.map((task) => [task.id, task.status]);

    plan(roadmap);

    const after = roadmap.tasks.map((task) => [task.id, task.status]);

    expect(after).toEqual(before);
  });

  test("FCT-050 or later requested from this scope fails closed", () => {
    const result = planDraftPrOrchestration({
      roadmap: readRoadmap(),
      requestedTaskId: "FCT-050"
    });

    expect(result.status).toBe("fail");
    expect(result.draftPrPlans).toEqual([]);
    expect(result.reasons).toContain("later_factory_task_out_of_scope:FCT-050");
  });

  test("no FCT-050+ implementation or unblock appears in draft PR output", () => {
    const result = plan();
    const draftPrOutput = JSON.stringify(result.draftPrPlans);

    expect(result.draftPrPlans.some((draftPrPlan) => /^FCT-0[5-9]0$/.test(draftPrPlan.taskId))).toBe(false);
    expect(draftPrOutput).not.toContain("FCT-050");
    expect(draftPrOutput).not.toContain("FCT-060");
    expect(draftPrOutput).not.toContain("unblock");
  });
});
