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
        readyTaskIds: ["FCT-040"],
        dryRun: true
      }
    });
  });

  test("materializes FCT-040 when ready and dependencies are verified", () => {
    const roadmap = readRoadmap();
    const fct040 = findTask(roadmap, "FCT-040");
    const dependencyStatuses = (fct040.depends_on ?? []).map(
      (dependencyId) => findTask(roadmap, dependencyId).status
    );
    const result = materialize(roadmap);
    const plan = planFor(result, "FCT-040");

    expect(dependencyStatuses).toEqual(["verified"]);
    expect(result.status).toBe("pass");
    expect(result.readyTaskIds).toEqual(["FCT-040"]);
    expect(plan).toMatchObject({
      taskId: "FCT-040",
      title: "[FCT-040] Implement bounded draft-PR orchestrator",
      idempotencyKey: "vlx-roadmap-task:FCT-040:v1",
      action: "create"
    });
    expect(plan?.labels).toEqual([
      "factory",
      "roadmap-task",
      "task:FCT-040",
      "risk:high",
      "human-gate",
      "owner-approval-required",
      "auto-merge-disabled"
    ]);
  });

  test("does not materialize blocked dependency factory tasks", () => {
    const result = materialize();

    expect(result.blockedTaskIds).toEqual(
      expect.arrayContaining(["FCT-050", "FCT-060"])
    );
    expect(planFor(result, "FCT-050")).toBeUndefined();
    expect(planFor(result, "FCT-060")).toBeUndefined();
  });

  test("does not materialize verified tasks", () => {
    const result = materialize();

    expect(result.skippedTaskIds).toEqual(
      expect.arrayContaining(["FCT-010", "FCT-020", "FCT-030"])
    );
    expect(planFor(result, "FCT-010")).toBeUndefined();
    expect(planFor(result, "FCT-020")).toBeUndefined();
    expect(planFor(result, "FCT-030")).toBeUndefined();
  });

  test("does not materialize blocked_human tasks", () => {
    const result = materialize();

    expect(result.blockedTaskIds).toContain("ACC-010");
    expect(planFor(result, "ACC-010")).toBeUndefined();
  });

  test("unresolved dependency fails closed", () => {
    const roadmap = cloneRoadmap((draft) => {
      findTask(draft, "FCT-040").depends_on = ["FCT-999"];
    });
    const result = materialize(roadmap);

    expect(result.status).toBe("fail");
    expect(result.issuePlans).toEqual([]);
    expect(result.reasons).toContain(
      "unresolved_dependency:FCT-040:FCT-999"
    );
  });

  test("non-verified ready-task dependency fails closed", () => {
    const roadmap = cloneRoadmap((draft) => {
      findTask(draft, "FCT-040").depends_on = ["ACC-010"];
    });
    const result = materialize(roadmap);

    expect(result.status).toBe("fail");
    expect(result.issuePlans).toEqual([]);
    expect(result.reasons).toContain(
      "dependency_not_verified:FCT-040:ACC-010:blocked_human"
    );
  });

  test("duplicate task IDs fail closed", () => {
    const roadmap = cloneRoadmap((draft) => {
      const fct040 = findTask(draft, "FCT-040");

      draft.tasks = [...(draft.tasks ?? []), { ...fct040 }];
    });
    const result = materialize(roadmap);

    expect(result.status).toBe("fail");
    expect(result.issuePlans).toEqual([]);
    expect(result.reasons).toContain("duplicate_task_id:FCT-040");
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
          title: "[FCT-040] Implement bounded draft-PR orchestrator",
          taskId: "FCT-040",
          state: "open"
        }
      ]
    });

    expect(planFor(result, "FCT-040")?.action).toBe("update");
    expect(result.duplicateProtections).toEqual([
      "existing_issue_task_id:FCT-040:open"
    ]);
  });

  test("existing issue update or skip plan is deterministic", () => {
    const initial = materialize();
    const fct040Plan = planFor(initial, "FCT-040");

    if (!fct040Plan) {
      throw new Error("Missing FCT-040 issue plan");
    }

    const first = materializeRoadmapIssues({
      roadmap: readRoadmap(),
      existingIssues: [
        {
          title: fct040Plan.title,
          body: fct040Plan.body,
          labels: [...fct040Plan.labels].reverse(),
          idempotencyKey: fct040Plan.idempotencyKey,
          state: "open"
        }
      ]
    });
    const second = materializeRoadmapIssues({
      roadmap: readRoadmap(),
      existingIssues: [
        {
          title: fct040Plan.title,
          body: fct040Plan.body,
          labels: fct040Plan.labels,
          idempotencyKey: fct040Plan.idempotencyKey,
          state: "open"
        }
      ]
    });

    expect(planFor(first, "FCT-040")?.action).toBe("skip");
    expect(first).toEqual(second);
  });

  test("issue body contains acceptance, validation, human gate, and safety information", () => {
    const result = materialize();
    const body = planFor(result, "FCT-040")?.body ?? "";

    expect(body).toContain("## Acceptance Criteria");
    expect(body).toContain("One task maps to one scoped PR");
    expect(body).toContain("## Validation");
    expect(body).toContain("sandbox integration test");
    expect(body).toContain("## Human Gate");
    expect(body).toContain("Human gate: required");
    expect(body).toContain("## Rollback / Safety");
    expect(body).toContain("creates no real GitHub issues");
  });

  test("high-risk task includes owner approval label and note", () => {
    const result = materialize();
    const plan = planFor(result, "FCT-040");

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
      findTask(draft, "FCT-040").status = "mystery";
    });
    const result = materialize(roadmap);

    expect(result.status).toBe("fail");
    expect(result.issuePlans).toEqual([]);
    expect(result.reasons).toContain("unknown_task_status:FCT-040:mystery");
  });

  test("FCT-050 or later task is not materialized", () => {
    const result = materialize();
    const laterFactoryPlans = result.issuePlans.filter((plan) =>
      /^FCT-0[5-9]0$/.test(plan.taskId)
    );

    expect(laterFactoryPlans).toEqual([]);
  });

  test("roadmap verification boundary keeps only FCT-040 ready", () => {
    const roadmap = readRoadmap();
    const fct030 = findTask(roadmap, "FCT-030");
    const fct040 = findTask(roadmap, "FCT-040");
    const fct030Evidence = (fct030 as { evidence?: readonly string[] })
      .evidence;

    expect(fct030.status).toBe("verified");
    expect(fct030Evidence).toEqual(
      expect.arrayContaining([
        "PR #128",
        "merge commit 71c678140416fff3d959424c52c1ac85f546c169"
      ])
    );
    expect(fct040.status).toBe("ready");
    expect(fct040.depends_on).toContain("FCT-030");
    expect(findTask(roadmap, "FCT-050").status).toBe("blocked_dependency");
    expect(findTask(roadmap, "FCT-060").status).toBe("blocked_dependency");
  });
});
