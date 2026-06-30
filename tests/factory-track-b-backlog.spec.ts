import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import {
  planNextTaskRunPacket,
  type NextTaskBacklogCandidateLike,
  type NextTaskRoadmapLike,
  type NextTaskRoadmapTaskLike
} from "../src/lib/factory/next-task-run-packet";

type BacklogRisk = "low" | "medium" | "high";

type BacklogTask = {
  id: string;
  title: string;
  status: string;
  lane: string;
  phase: string;
  task_surface: string;
  source: string;
  priority: number;
  risk: BacklogRisk;
  depends_on: string[];
  owner_decision_required: boolean;
  blocked_surfaces: string[];
  expected_files: string[];
  validation_commands: string[];
  acceptance_criteria: string[];
  stop_reasons: string[];
  next_recommended_task_order: number;
};

type TrackBBacklogSeed = {
  schema_version: string;
  kind: string;
  repository: string;
  router_contract: {
    candidate_source: string;
    sort_keys: string[];
    same_input_produces_identical_order: boolean;
    dry_run_only: boolean;
    live_github_mutations_from_implementation_code: boolean;
    auto_merge_enabled: boolean;
  };
  this_pr: {
    type: string;
    runtime_ui_changes: boolean;
    account_sync_implementation: boolean;
    payment_or_billing_changes: boolean;
    roadmap_status_changes: boolean;
    workflow_changes: boolean;
    codeowners_changes: boolean;
    auto_merge_enabled: boolean;
    live_github_mutations_from_implementation_code: boolean;
    expected_files: string[];
  };
  common_blocked_surfaces: string[];
  stale_open_risks: {
    id: string;
    number: number;
    state: string;
    stale: boolean;
    mergeable_state: string;
    auto_selectable: boolean;
    auto_mergeable: boolean;
    owner_decision_required: boolean;
    risk: string;
    stop_reason: string;
  }[];
  release_gates: {
    public_paid_beta: {
      status: string;
      owner_decision_required: boolean;
      required_before_unblock: string[];
      stop_reasons: string[];
    };
    private_manual_beta: {
      status: string;
      owner_decision_required: boolean;
      depends_on: string[];
      required_before_unblock: string[];
      stop_reasons: string[];
    };
  };
  tasks: BacklogTask[];
};

const EXPECTED_TASK_IDS = [
  "TB-010",
  "TB-020",
  "TB-030",
  "TB-040",
  "TB-050",
  "TB-060",
  "TB-070",
  "TB-080",
  "TB-090",
  "TB-100",
  "TB-110"
];
const REQUIRED_TASK_FIELDS = [
  "id",
  "title",
  "status",
  "lane",
  "risk",
  "depends_on",
  "owner_decision_required",
  "blocked_surfaces",
  "expected_files",
  "validation_commands",
  "acceptance_criteria",
  "stop_reasons",
  "next_recommended_task_order"
];
const G0_TASK_IDS = [
  "FCT-010",
  "FCT-020",
  "FCT-030",
  "FCT-040",
  "FCT-050",
  "FCT-060"
];
const NOW = "2026-06-30T12:00:00.000Z";
const RECENT_COMPLETED_AT = "2026-06-30T09:00:00.000Z";
const REQUIRED_BLOCKED_SURFACES = [
  "payment",
  "billing",
  "dns",
  "deployment_settings",
  "secrets",
  "webflow_production",
  "cloudflare_production_workers",
  "r2_production_objects",
  "account_schema",
  "rls",
  "migrations",
  "production_account_data",
  "production_data",
  "auto_merge"
];
const THIS_PR_RUNTIME_PATH_PREFIXES = [
  "src/app/",
  "src/components/",
  "src/lib/review/",
  "src/lib/srs/",
  "src/lib/packs/",
  "src/lib/paywall/"
];

function readBacklogSeed(): TrackBBacklogSeed {
  const backlogPath = join(
    process.cwd(),
    "docs",
    "factory",
    "track-b-product-backlog.v1.json"
  );

  return JSON.parse(readFileSync(backlogPath, "utf8")) as TrackBBacklogSeed;
}

function taskById(seed: TrackBBacklogSeed, taskId: string) {
  const task = seed.tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    throw new Error(`Missing backlog task ${taskId}`);
  }

  return task;
}

function orderedTaskIds(seed: TrackBBacklogSeed) {
  return [...seed.tasks]
    .sort((left, right) => {
      const byOrder =
        left.next_recommended_task_order - right.next_recommended_task_order;

      return byOrder === 0 ? left.id.localeCompare(right.id) : byOrder;
    })
    .map((task) => task.id);
}

function normalizePath(path: string) {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/").toLowerCase();
}

function forbiddenPathRule(path: string) {
  const normalized = normalizePath(path);

  if (normalized.startsWith(".github/workflows/")) {
    return "github_workflows";
  }

  if (normalized === ".github/codeowners" || normalized === "codeowners") {
    return "codeowners";
  }

  if (normalized === "agents.md") {
    return "agents_policy";
  }

  if (
    normalized.includes("billing") ||
    normalized.includes("payment") ||
    normalized.includes("checkout") ||
    normalized.includes("subscription") ||
    normalized.includes("invoice") ||
    normalized.includes("stripe") ||
    normalized.includes("paddle")
  ) {
    return "billing_payment_subscription";
  }

  if (
    normalized === "vercel.json" ||
    normalized === "wrangler.toml" ||
    normalized.startsWith(".vercel/") ||
    normalized.startsWith("cloudflare/") ||
    normalized.startsWith("workers/") ||
    normalized.startsWith("infra/") ||
    normalized.startsWith("terraform/") ||
    normalized.endsWith(".tf") ||
    normalized.includes("dns") ||
    normalized.includes("provider")
  ) {
    return "deployment_dns_provider";
  }

  if (
    normalized === ".env" ||
    normalized.startsWith(".env.") ||
    normalized.endsWith(".env") ||
    normalized.includes("/.env") ||
    normalized === ".npmrc" ||
    normalized.includes("secret") ||
    normalized.includes("secrets")
  ) {
    return "secrets_env";
  }

  if (
    normalized.startsWith("r2/") ||
    normalized.startsWith("data/production/") ||
    normalized.includes("production-data")
  ) {
    return "production_data";
  }

  if (normalized.includes("webflow")) {
    return "webflow";
  }

  if (
    normalized.startsWith("supabase/") ||
    normalized.includes("migration") ||
    normalized.includes("migrations") ||
    normalized.includes("rls") ||
    normalized.includes("schema")
  ) {
    return "account_schema_rls_migration";
  }

  return null;
}

function toRoadmapTask(task: BacklogTask): NextTaskRoadmapTaskLike {
  return {
    id: task.id,
    phase: task.phase,
    title: task.title,
    status: task.status,
    risk: task.risk,
    depends_on: task.depends_on,
    deliverables: task.expected_files,
    acceptance: task.acceptance_criteria,
    validation: task.validation_commands,
    human_gate: task.owner_decision_required,
    auto_merge_eligible: false
  };
}

function toRouterCandidate(task: BacklogTask): NextTaskBacklogCandidateLike {
  return {
    id: task.id,
    title: task.title,
    phase: task.lane,
    status: task.status,
    risk: task.risk,
    taskSurface: task.task_surface,
    source: task.source,
    priority: task.next_recommended_task_order,
    depends_on: task.depends_on,
    acceptance: task.acceptance_criteria,
    validation: task.validation_commands,
    expectedChangedFiles: task.expected_files,
    requiresOwnerApproval: task.owner_decision_required
  };
}

function verifiedFactoryRoadmapTasks(): NextTaskRoadmapTaskLike[] {
  const verifiedTasks = G0_TASK_IDS.map((taskId) => ({
    id: taskId,
    phase: "factory_bootstrap",
    title: `${taskId} verified factory prerequisite`,
    status: "verified",
    risk: "high",
    depends_on: [],
    deliverables: ["verified factory prerequisite"],
    acceptance: ["verified factory prerequisite"],
    validation: ["factory verification evidence"],
    human_gate: true,
    auto_merge_eligible: false
  }));

  return [
    ...verifiedTasks,
    {
      id: "FCT-070",
      phase: "factory_bootstrap",
      title: "Optional low-risk auto-merge",
      status: "deferred",
      risk: "high",
      depends_on: ["FCT-060"],
      deliverables: ["deferred auto-merge policy"],
      acceptance: ["auto-merge remains disabled"],
      validation: ["owner approval required"],
      human_gate: true,
      auto_merge_eligible: false
    },
    {
      id: "ACC-010",
      phase: "account_and_learning_data",
      title: "Create persistent learning schema, indexes, migrations, and RLS",
      status: "blocked_human",
      risk: "high",
      depends_on: ["FCT-060"],
      deliverables: ["blocked account schema decision"],
      acceptance: ["owner decision required"],
      validation: ["owner approval required"],
      human_gate: true,
      auto_merge_eligible: false
    }
  ];
}

function backlogRoadmap(seed: TrackBBacklogSeed): NextTaskRoadmapLike {
  return {
    release_gates: [
      {
        id: "G0_FACTORY_READY",
        required_tasks: G0_TASK_IDS
      }
    ],
    tasks: [...verifiedFactoryRoadmapTasks(), ...seed.tasks.map(toRoadmapTask)]
  };
}

function passedCheck(name: string, evidence = `${name} passed`) {
  return {
    name,
    status: "passed",
    evidence,
    completedAt: RECENT_COMPLETED_AT
  };
}

test.describe("Track B product backlog seed", () => {
  test("JSON schema shape is valid for required fields", () => {
    const seed = readBacklogSeed();

    expect(seed).toMatchObject({
      schema_version: "1.0.0",
      kind: "track_b_product_backlog_seed",
      repository: "chachathecat/visual-lexicon-app"
    });
    expect(seed.router_contract).toMatchObject({
      dry_run_only: true,
      live_github_mutations_from_implementation_code: false,
      auto_merge_enabled: false,
      same_input_produces_identical_order: true
    });
    expect(seed.this_pr).toMatchObject({
      type: "factory_backlog_seed",
      runtime_ui_changes: false,
      account_sync_implementation: false,
      payment_or_billing_changes: false,
      roadmap_status_changes: false,
      workflow_changes: false,
      codeowners_changes: false,
      auto_merge_enabled: false
    });

    for (const task of seed.tasks) {
      for (const field of REQUIRED_TASK_FIELDS) {
        expect(task).toHaveProperty(field);
      }

      expect(task.id).toMatch(/^TB-\d{3}$/);
      expect(task.title.length).toBeGreaterThan(0);
      expect(["verified", "ready", "blocked_dependency"]).toContain(
        task.status
      );
      expect(["low", "medium", "high"]).toContain(task.risk);
      expect(Array.isArray(task.depends_on)).toBe(true);
      expect(Array.isArray(task.blocked_surfaces)).toBe(true);
      expect(Array.isArray(task.expected_files)).toBe(true);
      expect(Array.isArray(task.validation_commands)).toBe(true);
      expect(Array.isArray(task.acceptance_criteria)).toBe(true);
      expect(Array.isArray(task.stop_reasons)).toBe(true);
      expect(typeof task.owner_decision_required).toBe("boolean");
      expect(Number.isInteger(task.next_recommended_task_order)).toBe(true);
    }
  });

  test("required TB-010 through TB-110 tasks exist in deterministic order", () => {
    const seed = readBacklogSeed();

    expect(seed.tasks.map((task) => task.id)).toEqual(EXPECTED_TASK_IDS);
    expect(orderedTaskIds(seed)).toEqual(EXPECTED_TASK_IDS);
    expect(new Set(seed.tasks.map((task) => task.id)).size).toBe(
      EXPECTED_TASK_IDS.length
    );
  });

  test("dependencies are valid and TB-020 depends on TB-010", () => {
    const seed = readBacklogSeed();
    const taskIds = new Set(seed.tasks.map((task) => task.id));

    for (const task of seed.tasks) {
      for (const dependencyId of task.depends_on) {
        expect(taskIds.has(dependencyId), `${task.id} -> ${dependencyId}`).toBe(
          true
        );
      }
    }

    expect(taskById(seed, "TB-020").depends_on).toEqual(["TB-010"]);
  });

  test("TB-010 records the already merged and verified audit", () => {
    const seed = readBacklogSeed();
    const audit = taskById(seed, "TB-010");

    expect(audit.status).toBe("verified");
    expect(audit.task_surface).toBe("docs_only");
    expect(audit.acceptance_criteria.join("\n")).toContain("PR #137");
    expect(audit.acceptance_criteria.join("\n")).toContain("No-Go");
    expect(audit.acceptance_criteria.join("\n")).toContain(
      "no runtime UI changes"
    );
  });

  test("raw seed alone identifies TB-020 before status overlay reconciliation", () => {
    const seed = readBacklogSeed();
    const result = planNextTaskRunPacket({
      roadmap: backlogRoadmap(seed),
      ownerCommandCenterPacket: {
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
        stopReasons: []
      },
      backlogCandidates: seed.tasks.map(toRouterCandidate),
      recentMergedPrSummaries: [
        {
          number: 137,
          title: "[Track B] Add product/UI readiness audit",
          state: "closed",
          isDraft: false,
          merged: true,
          mergedAt: RECENT_COMPLETED_AT,
          mergeCommitSha: "d22d50e0a0000000000000000000000000000000",
          branchName: "trackb/product-ui-readiness-audit",
          evidence: "PR #137 merged product/UI readiness audit"
        }
      ],
      openPrSummaries: [
        {
          number: 121,
          title: "[Factory] Legacy open PR",
          state: "open",
          isDraft: false,
          merged: false,
          mergeableState: "dirty",
          stale: true
        }
      ],
      ciCheckSummaries: [
        passedCheck("typecheck", "npm.cmd run typecheck passed"),
        passedCheck("lint", "npm.cmd run lint passed"),
        passedCheck("build", "npm.cmd run build passed"),
        passedCheck(
          "targeted tests",
          "npm.cmd run test -- tests/factory-track-b-backlog.spec.ts --workers=1 passed"
        )
      ],
      blockedSurfaces: seed.common_blocked_surfaces.map((surface) => ({
        id: `blocked:${surface}`,
        surface,
        reason: "Track B backlog seed global safety boundary.",
        taskIds: []
      })),
      riskPolicy: {
        highRiskSurfaces: [
          "app_server_logic",
          "factory_control_plane",
          "account_sync"
        ],
        blockedSurfaces: seed.common_blocked_surfaces,
        forbiddenChangedFiles: ["AGENTS.md"],
        requiresOwnerApprovalForHighRisk: true
      },
      options: {
        now: NOW
      }
    });

    expect(result.stopReasons, JSON.stringify(result, null, 2)).toEqual([]);
    expect(result.status).toBe("pass");
    expect(result.selectedTask).toMatchObject({
      id: "TB-020",
      title: "Track B Design Tokens / App Shell v2",
      risk: "medium",
      taskSurface: "product_ui"
    });
    expect(result.selectedTask?.expectedChangedFiles).toEqual(
      expect.arrayContaining([
        "src/app/globals.css",
        "src/components/track-b/app-shell.tsx",
        "src/components/track-b/tokens.ts"
      ])
    );
    expect(result.blockedTasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          taskId: "PR-121",
          implementableNow: false
        })
      ])
    );
  });

  test("product UI tasks do not include forbidden changed files", () => {
    const seed = readBacklogSeed();
    const productTasks = seed.tasks.filter(
      (task) => task.task_surface === "product_ui"
    );

    expect(productTasks.map((task) => task.id)).toEqual([
      "TB-020",
      "TB-030",
      "TB-040",
      "TB-050",
      "TB-060",
      "TB-070"
    ]);

    for (const task of productTasks) {
      for (const expectedFile of task.expected_files) {
        expect(
          forbiddenPathRule(expectedFile),
          `${task.id} unexpectedly references forbidden path ${expectedFile}`
        ).toBeNull();
      }
    }
  });

  test("high-risk tasks require owner decision", () => {
    const seed = readBacklogSeed();
    const highRiskTasks = seed.tasks.filter((task) => task.risk === "high");

    expect(highRiskTasks.map((task) => task.id)).toEqual([
      "TB-090",
      "TB-100",
      "TB-110"
    ]);

    for (const task of highRiskTasks) {
      expect(task.owner_decision_required, task.id).toBe(true);
    }
  });

  test("payment, billing, DNS, secrets, and production data surfaces are blocked", () => {
    const seed = readBacklogSeed();

    expect(seed.common_blocked_surfaces).toEqual(
      expect.arrayContaining(REQUIRED_BLOCKED_SURFACES)
    );

    for (const task of seed.tasks) {
      expect(task.blocked_surfaces, task.id).toEqual(
        expect.arrayContaining(REQUIRED_BLOCKED_SURFACES)
      );
    }
  });

  test("public paid beta remains blocked until required gates pass", () => {
    const seed = readBacklogSeed();
    const publicGate = seed.release_gates.public_paid_beta;
    const privateGate = seed.release_gates.private_manual_beta;

    expect(publicGate).toMatchObject({
      status: "blocked",
      owner_decision_required: true
    });
    expect(publicGate.required_before_unblock).toEqual(
      expect.arrayContaining([
        "account_owned_learning_persistence",
        "server_authoritative_entitlements",
        "payment_provider_policy_and_billing_lifecycle",
        "production_monitoring_alerting_and_rollback",
        "accessibility_and_mobile_manual_qa",
        "owner_public_launch_signoff"
      ])
    );
    expect(publicGate.stop_reasons).toContain(
      "public_paid_beta_no_go_until_required_gates_pass"
    );
    expect(privateGate).toMatchObject({
      status: "blocked_dependency",
      owner_decision_required: true
    });
    expect(privateGate.required_before_unblock).toEqual(
      expect.arrayContaining(["current_manual_qa_execution_report", "owner_approval"])
    );
  });

  test("PR #121 is represented as stale open not mergeable risk", () => {
    const seed = readBacklogSeed();
    const pr121 = seed.stale_open_risks.find((risk) => risk.number === 121);

    expect(pr121).toMatchObject({
      id: "PR-121",
      state: "open",
      stale: true,
      auto_selectable: false,
      auto_mergeable: false,
      owner_decision_required: true,
      stop_reason: "pr_121_stale_open_not_mergeable"
    });
    expect(pr121?.mergeable_state).toContain("not_mergeable");
  });

  test("no runtime UI files are expected for this PR", () => {
    const seed = readBacklogSeed();

    expect(seed.this_pr.expected_files).toEqual([
      "docs/factory/track-b-product-backlog.v1.json",
      "docs/factory/track-b-product-backlog.md",
      "tests/factory-track-b-backlog.spec.ts"
    ]);

    for (const expectedFile of seed.this_pr.expected_files) {
      const normalized = normalizePath(expectedFile);

      expect(
        THIS_PR_RUNTIME_PATH_PREFIXES.some((prefix) =>
          normalized.startsWith(prefix)
        ),
        `${expectedFile} is runtime UI scope`
      ).toBe(false);
    }
  });

  test("same input produces identical backlog ordering", () => {
    const seed = readBacklogSeed();
    const firstOrder = orderedTaskIds(seed);
    const secondInput = JSON.parse(JSON.stringify(seed)) as TrackBBacklogSeed;
    const secondOrder = orderedTaskIds(secondInput);

    expect(secondOrder).toEqual(firstOrder);
    expect(JSON.stringify(secondOrder)).toBe(JSON.stringify(firstOrder));
  });
});
