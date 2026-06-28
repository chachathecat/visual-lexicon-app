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

function fct060ReadyRoadmap(overrides?: (roadmap: RoadmapLike) => void) {
  return cloneRoadmap((draft) => {
    const fct060 = findTask(draft, "FCT-060") as {
      status?: string;
      evidence?: string[];
    };

    fct060.status = "ready";
    delete fct060.evidence;

    overrides?.(draft);
  });
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
        readyTaskIds: [],
        issuePlans: [],
        dryRun: true
      }
    });
  });

  test("materializes FCT-060 when ready and dependencies are verified", () => {
    const roadmap = fct060ReadyRoadmap();
    const fct060 = findTask(roadmap, "FCT-060");
    const dependencyStatuses = (fct060.depends_on ?? []).map(
      (dependencyId) => findTask(roadmap, dependencyId).status
    );
    const result = materialize(roadmap);
    const plan = planFor(result, "FCT-060");

    expect(dependencyStatuses).toEqual(["verified", "verified"]);
    expect(result.status).toBe("pass");
    expect(result.readyTaskIds).toEqual(["FCT-060"]);
    expect(plan).toMatchObject({
      taskId: "FCT-060",
      title: "[FCT-060] Implement release guard and roadmap evidence sync",
      idempotencyKey: "vlx-roadmap-task:FCT-060:v1",
      action: "create"
    });
    expect(plan?.labels).toEqual([
      "factory",
      "roadmap-task",
      "task:FCT-060",
      "risk:high",
      "human-gate",
      "owner-approval-required",
      "auto-merge-disabled"
    ]);
  });

  test("does not materialize blocked dependency tasks", () => {
    const result = materialize();

    expect(result.blockedTaskIds).toEqual(expect.arrayContaining(["ACC-020"]));
    expect(planFor(result, "ACC-020")).toBeUndefined();
  });

  test("does not materialize verified tasks", () => {
    const result = materialize();

    expect(result.skippedTaskIds).toEqual(
      expect.arrayContaining([
        "FCT-010",
        "FCT-020",
        "FCT-030",
        "FCT-040",
        "FCT-050",
        "FCT-060"
      ])
    );
    expect(planFor(result, "FCT-010")).toBeUndefined();
    expect(planFor(result, "FCT-020")).toBeUndefined();
    expect(planFor(result, "FCT-030")).toBeUndefined();
    expect(planFor(result, "FCT-040")).toBeUndefined();
    expect(planFor(result, "FCT-050")).toBeUndefined();
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
    const roadmap = fct060ReadyRoadmap((draft) => {
      findTask(draft, "FCT-060").depends_on = ["COM-010"];
    });
    const result = materialize(roadmap);

    expect(result.status).toBe("fail");
    expect(result.issuePlans).toEqual([]);
    expect(result.reasons).toContain(
      "dependency_not_verified:FCT-060:COM-010:blocked_human"
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
    const roadmap = fct060ReadyRoadmap();
    const result = materializeRoadmapIssues({
      roadmap,
      existingIssues: [
        {
          title: "[FCT-060] Implement release guard and roadmap evidence sync",
          taskId: "FCT-060",
          state: "open"
        }
      ]
    });

    expect(planFor(result, "FCT-060")?.action).toBe("update");
    expect(result.duplicateProtections).toEqual([
      "existing_issue_task_id:FCT-060:open"
    ]);
  });

  test("existing issue update or skip plan is deterministic", () => {
    const roadmap = fct060ReadyRoadmap();
    const initial = materialize(roadmap);
    const fct060Plan = planFor(initial, "FCT-060");

    if (!fct060Plan) {
      throw new Error("Missing FCT-060 issue plan");
    }

    const first = materializeRoadmapIssues({
      roadmap,
      existingIssues: [
        {
          title: fct060Plan.title,
          body: fct060Plan.body,
          labels: [...fct060Plan.labels].reverse(),
          idempotencyKey: fct060Plan.idempotencyKey,
          state: "open"
        }
      ]
    });
    const second = materializeRoadmapIssues({
      roadmap,
      existingIssues: [
        {
          title: fct060Plan.title,
          body: fct060Plan.body,
          labels: fct060Plan.labels,
          idempotencyKey: fct060Plan.idempotencyKey,
          state: "open"
        }
      ]
    });

    expect(planFor(first, "FCT-060")?.action).toBe("skip");
    expect(first).toEqual(second);
  });

  test("issue body contains acceptance, validation, human gate, and safety information", () => {
    const result = materialize(fct060ReadyRoadmap());
    const body = planFor(result, "FCT-060")?.body ?? "";

    expect(body).toContain("## Acceptance Criteria");
    expect(body).toContain("Only verified evidence can move a task to verified");
    expect(body).toContain("## Validation");
    expect(body).toContain("state-machine tests");
    expect(body).toContain("## Human Gate");
    expect(body).toContain("Human gate: required");
    expect(body).toContain("## Rollback / Safety");
    expect(body).toContain("creates no real GitHub issues");
  });

  test("high-risk task includes owner approval label and note", () => {
    const result = materialize(fct060ReadyRoadmap());
    const plan = planFor(result, "FCT-060");

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
      findTask(draft, "FCT-060").status = "mystery";
    });
    const result = materialize(roadmap);

    expect(result.status).toBe("fail");
    expect(result.issuePlans).toEqual([]);
    expect(result.reasons).toContain("unknown_task_status:FCT-060:mystery");
  });

  test("FCT-070 or later factory tasks are not materialized", () => {
    const result = materialize();
    const laterFactoryPlans = result.issuePlans.filter((plan) =>
      /^FCT-0[7-9]0$/.test(plan.taskId)
    );

    expect(laterFactoryPlans).toEqual([]);
  });

  test("live roadmap no longer materializes FCT-060 and keeps FCT-070 deferred", () => {
    const roadmap = readRoadmap();
    const result = materialize(roadmap);
    const fct060 = findTask(roadmap, "FCT-060") as {
      status?: string;
      evidence?: readonly string[];
    };
    const fct070 = findTask(roadmap, "FCT-070");

    expect(fct060.status).toBe("verified");
    expect(fct060.evidence).toEqual(
      expect.arrayContaining([
        "PR #134",
        "merge commit 0819bcbe170288cbede12aa640d478339506c083"
      ])
    );
    expect(fct070.status).toBe("deferred");
    expect(result.readyTaskIds).toEqual([]);
    expect(result.issuePlans).toEqual([]);
    expect(planFor(result, "FCT-060")).toBeUndefined();
    expect(planFor(result, "FCT-070")).toBeUndefined();
  });

  test("FCT-040 is verified with PR #130 merge evidence", () => {
    const roadmap = readRoadmap();
    const fct040 = findTask(roadmap, "FCT-040");
    const fct040Evidence = (fct040 as { evidence?: readonly string[] })
      .evidence;

    expect(fct040.status).toBe("verified");
    expect(fct040Evidence).toEqual(
      expect.arrayContaining([
        "PR #130",
        "merge commit b67dc2c008f99051a17089485429d7261b9637b0"
      ])
    );
  });

  test("roadmap verification boundary verifies FCT-060 and keeps FCT-070 deferred", () => {
    const roadmap = readRoadmap();
    const fct040 = findTask(roadmap, "FCT-040");
    const fct040Evidence = (fct040 as { evidence?: readonly string[] })
      .evidence;
    const fct050 = findTask(roadmap, "FCT-050");
    const fct050Evidence = (fct050 as { evidence?: readonly string[] })
      .evidence;
    const fct060 = findTask(roadmap, "FCT-060");
    const fct060Evidence = (fct060 as { evidence?: readonly string[] })
      .evidence;
    const fct070 = findTask(roadmap, "FCT-070");

    expect(fct040.status).toBe("verified");
    expect(fct040Evidence).toEqual(
      expect.arrayContaining([
        "PR #130",
        "merge commit b67dc2c008f99051a17089485429d7261b9637b0"
      ])
    );
    expect(fct040.depends_on).toContain("FCT-030");
    expect(fct050.status).toBe("verified");
    expect(fct050.depends_on).toContain("FCT-040");
    expect(fct050Evidence).toEqual(
      expect.arrayContaining([
        "PR #132",
        "merge commit 14393128a296ed09bebac700f7b4a86a2ceaf717"
      ])
    );
    expect(fct060.status).toBe("verified");
    expect(fct060.depends_on).toEqual(
      expect.arrayContaining(["FCT-020", "FCT-040"])
    );
    expect(fct060Evidence).toEqual(
      expect.arrayContaining([
        "PR #134",
        "merge commit 0819bcbe170288cbede12aa640d478339506c083"
      ])
    );
    expect(fct070.status).toBe("deferred");
  });
});
