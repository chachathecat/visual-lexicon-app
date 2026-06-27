import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import {
  ROADMAP_ISSUE_MATERIALIZER_VERSION,
  materializeRoadmapIssues,
  type RoadmapIssueMaterializerResult,
  type RoadmapIssueMaterializerVersion,
  type RoadmapLike
} from "../src/lib/factory/roadmap-issue-materializer";

type RoadmapIssueMaterializerTypeSurface = {
  version: RoadmapIssueMaterializerVersion;
  result: RoadmapIssueMaterializerResult;
};

const typeSmoke: RoadmapIssueMaterializerTypeSurface = {
  version: ROADMAP_ISSUE_MATERIALIZER_VERSION,
  result: materializeRoadmapIssues({
    roadmap: readRoadmap()
  })
};

function readRoadmap(): RoadmapLike {
  const roadmapPath = join(
    process.cwd(),
    "docs",
    "roadmap",
    "vlx-autonomous-factory-roadmap.v1.json"
  );

  return JSON.parse(readFileSync(roadmapPath, "utf8")) as RoadmapLike;
}

function cloneRoadmap(overrides?: (roadmap: RoadmapLike) => void) {
  const roadmap = JSON.parse(JSON.stringify(readRoadmap())) as RoadmapLike;

  overrides?.(roadmap);

  return roadmap;
}

function materialize(roadmap = readRoadmap()) {
  return materializeRoadmapIssues({ roadmap });
}

function findTask(roadmap: RoadmapLike, taskId: string) {
  const task = roadmap.tasks?.find((candidate) => candidate.id === taskId);

  if (!task) {
    throw new Error(`Missing roadmap task ${taskId}`);
  }

  return task;
}

function planFor(result: RoadmapIssueMaterializerResult, taskId: string) {
  return result.issuePlans.find((plan) => plan.taskId === taskId);
}

test.describe("roadmap issue materializer", () => {
  test("exports the required versioned output contract", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      result: {
        version: 1,
        status: "pass",
        readyTaskIds: ["FCT-030"],
        dryRun: true
      }
    });
  });

  test("materializes FCT-030 when ready and dependencies are verified", () => {
    const result = materialize();
    const plan = planFor(result, "FCT-030");

    expect(result.status).toBe("pass");
    expect(result.readyTaskIds).toEqual(["FCT-030"]);
    expect(plan).toMatchObject({
      taskId: "FCT-030",
      title: "[FCT-030] Implement roadmap-to-issue materializer",
      idempotencyKey: "vlx-roadmap-task:FCT-030:v1",
      action: "create"
    });
    expect(plan?.labels).toEqual([
      "factory",
      "roadmap-task",
      "task:FCT-030",
      "risk:high",
      "human-gate",
      "owner-approval-required",
      "auto-merge-disabled"
    ]);
  });

  test("does not materialize FCT-040 when blocked_dependency", () => {
    const result = materialize();

    expect(result.blockedTaskIds).toContain("FCT-040");
    expect(planFor(result, "FCT-040")).toBeUndefined();
  });

  test("does not materialize verified tasks", () => {
    const result = materialize();

    expect(result.skippedTaskIds).toEqual(
      expect.arrayContaining(["FCT-010", "FCT-020"])
    );
    expect(planFor(result, "FCT-010")).toBeUndefined();
    expect(planFor(result, "FCT-020")).toBeUndefined();
  });

  test("does not materialize blocked_human tasks", () => {
    const result = materialize();

    expect(result.blockedTaskIds).toContain("ACC-010");
    expect(planFor(result, "ACC-010")).toBeUndefined();
  });

  test("unresolved dependency fails closed", () => {
    const roadmap = cloneRoadmap((draft) => {
      findTask(draft, "FCT-030").depends_on = ["FCT-999"];
    });
    const result = materialize(roadmap);

    expect(result.status).toBe("fail");
    expect(result.issuePlans).toEqual([]);
    expect(result.reasons).toContain(
      "unresolved_dependency:FCT-030:FCT-999"
    );
  });

  test("non-verified ready-task dependency fails closed", () => {
    const roadmap = cloneRoadmap((draft) => {
      findTask(draft, "FCT-030").depends_on = ["FCT-040"];
    });
    const result = materialize(roadmap);

    expect(result.status).toBe("fail");
    expect(result.issuePlans).toEqual([]);
    expect(result.reasons).toContain(
      "dependency_not_verified:FCT-030:FCT-040:blocked_dependency"
    );
  });

  test("duplicate task IDs fail closed", () => {
    const roadmap = cloneRoadmap((draft) => {
      const fct030 = findTask(draft, "FCT-030");

      draft.tasks = [...(draft.tasks ?? []), { ...fct030 }];
    });
    const result = materialize(roadmap);

    expect(result.status).toBe("fail");
    expect(result.issuePlans).toEqual([]);
    expect(result.reasons).toContain("duplicate_task_id:FCT-030");
  });

  test("release gate reference mismatch fails closed", () => {
    const roadmap = cloneRoadmap((draft) => {
      draft.release_gates = [
        ...(draft.release_gates ?? []),
        {
          id: "BROKEN_GATE",
          required_tasks: ["FCT-999"]
        }
      ];
    });
    const result = materialize(roadmap);

    expect(result.status).toBe("fail");
    expect(result.issuePlans).toEqual([]);
    expect(result.reasons).toContain(
      "unresolved_release_gate_task:BROKEN_GATE:FCT-999"
    );
  });

  test("dependency cycle fails closed", () => {
    const roadmap = cloneRoadmap((draft) => {
      findTask(draft, "FCT-010").depends_on = ["FCT-030"];
    });
    const result = materialize(roadmap);

    expect(result.status).toBe("fail");
    expect(result.issuePlans).toEqual([]);
    expect(result.reasons).toContain(
      "dependency_cycle:FCT-010->FCT-030->FCT-010"
    );
  });

  test("existing issue prevents duplicate create", () => {
    const result = materializeRoadmapIssues({
      roadmap: readRoadmap(),
      existingIssues: [
        {
          title: "[FCT-030] Implement roadmap-to-issue materializer",
          taskId: "FCT-030",
          state: "open"
        }
      ]
    });

    expect(planFor(result, "FCT-030")?.action).toBe("update");
    expect(result.duplicateProtections).toEqual([
      "existing_issue_task_id:FCT-030:open"
    ]);
  });

  test("existing issue update or skip plan is deterministic", () => {
    const initial = materialize();
    const fct030Plan = planFor(initial, "FCT-030");

    if (!fct030Plan) {
      throw new Error("Missing FCT-030 issue plan");
    }

    const first = materializeRoadmapIssues({
      roadmap: readRoadmap(),
      existingIssues: [
        {
          title: fct030Plan.title,
          body: fct030Plan.body,
          labels: [...fct030Plan.labels].reverse(),
          idempotencyKey: fct030Plan.idempotencyKey,
          state: "open"
        }
      ]
    });
    const second = materializeRoadmapIssues({
      roadmap: readRoadmap(),
      existingIssues: [
        {
          title: fct030Plan.title,
          body: fct030Plan.body,
          labels: fct030Plan.labels,
          idempotencyKey: fct030Plan.idempotencyKey,
          state: "open"
        }
      ]
    });

    expect(planFor(first, "FCT-030")?.action).toBe("skip");
    expect(first).toEqual(second);
  });

  test("issue body contains acceptance, validation, human gate, and safety information", () => {
    const result = materialize();
    const body = planFor(result, "FCT-030")?.body ?? "";

    expect(body).toContain("## Acceptance Criteria");
    expect(body).toContain("No issue is created for blocked tasks");
    expect(body).toContain("## Validation");
    expect(body).toContain("dry-run fixtures");
    expect(body).toContain("## Human Gate");
    expect(body).toContain("Human gate: required");
    expect(body).toContain("## Rollback / Safety");
    expect(body).toContain("creates no real GitHub issues");
  });

  test("high-risk task includes owner approval label and note", () => {
    const result = materialize();
    const plan = planFor(result, "FCT-030");

    expect(result.requiresOwnerApproval).toBe(true);
    expect(plan?.labels).toContain("owner-approval-required");
    expect(plan?.body).toContain("High-risk safety note");
    expect(plan?.body).toContain("roadmap/control-plane");
  });

  test("output order is deterministic", () => {
    const first = materialize();
    const second = materialize(
      cloneRoadmap((draft) => {
        draft.tasks = [...(draft.tasks ?? [])].reverse();
        draft.release_gates = [...(draft.release_gates ?? [])].reverse();
      })
    );

    expect(second).toEqual(first);
  });

  test("dryRun is always true in v1", () => {
    const result = materializeRoadmapIssues({
      roadmap: readRoadmap(),
      options: {
        dryRun: false
      }
    });

    expect(result.dryRun).toBe(true);
    expect(result.reasons).toContain("dry_run_forced_v1");
  });

  test("unknown and blocked task states are not materialized", () => {
    const roadmap = cloneRoadmap((draft) => {
      findTask(draft, "FCT-030").status = "mystery";
    });
    const result = materialize(roadmap);

    expect(result.status).toBe("fail");
    expect(result.issuePlans).toEqual([]);
    expect(result.reasons).toContain("unknown_task_status:FCT-030:mystery");
  });

  test("FCT-040 or later task is not implemented", () => {
    const result = materialize();
    const laterFactoryPlans = result.issuePlans.filter((plan) =>
      /^FCT-0[4-9]0$/.test(plan.taskId)
    );

    expect(laterFactoryPlans).toEqual([]);
  });

  test("FCT-030 is not marked verified", () => {
    const roadmap = readRoadmap();

    expect(findTask(roadmap, "FCT-030").status).toBe("ready");
  });

  test("FCT-040 is not unblocked", () => {
    const roadmap = readRoadmap();

    expect(findTask(roadmap, "FCT-040").status).toBe("blocked_dependency");
  });
});
