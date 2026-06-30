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
type StatusValue =
  | "verified"
  | "partial_verified"
  | "needs_verification"
  | "blocked_dependency"
  | "blocked_human"
  | "stale_not_selectable";
type RouterCandidateStatus =
  | "ready"
  | "proposed"
  | "verified"
  | "blocked_dependency"
  | "blocked_human";

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
  common_blocked_surfaces: string[];
  tasks: BacklogTask[];
};

type StatusEvidence = {
  merged_pr_number: number;
  merged_title: string;
  merge_commit_sha: string;
  evidence_source: string;
  evidence_summary: string;
  validation_summary: string;
  safety_summary: string;
};

type OwnerDecisionPacketStatus = {
  exists: boolean;
  status: string;
  outcome?: string;
  router_reselectable?: boolean;
  claims_actual_account_sync_exists: boolean;
  claims_disabled_route_skeleton_files_exist: boolean;
  approves_future_runtime_route_skeleton_implementation: boolean;
  evidence_summary: string;
};

type TaskStatusOverlay = {
  task_id: string;
  task_order: number;
  backlog_title: string;
  resulting_status: StatusValue;
  router_candidate_status: RouterCandidateStatus;
  router_selectable: boolean;
  owner_decision_required?: boolean;
  owner_action_required?: boolean;
  not_selectable_for_automatic_implementation?: boolean;
  owner_decision_packet?: OwnerDecisionPacketStatus;
  satisfied_by: StatusEvidence[];
  needs_verification_reason?: string;
  partial_verification_reason?: string;
  blocked_reason?: string;
};

type NextSafeFactoryOutput = {
  rank: number;
  id: string;
  task_id?: string;
  related_pr_number?: number;
  title: string;
  resulting_status: StatusValue;
  router_candidate_status: RouterCandidateStatus;
  router_selectable: boolean;
  owner_decision_required?: boolean;
  owner_action_required?: boolean;
  auto_selectable: boolean;
  source: string;
  recommendation: string;
  safety_summary: string;
};

type TrackBStatusOverlay = {
  schema_version: string;
  kind: string;
  repository: string;
  router_contract: {
    apply_overlay_before_selection: boolean;
    same_input_produces_identical_order: boolean;
    same_input_produces_identical_status_summary: boolean;
    dry_run_only: boolean;
    live_github_mutations_from_implementation_code: boolean;
    auto_merge_enabled: boolean;
    needs_verification_router_candidate_status: RouterCandidateStatus;
  };
  this_pr: {
    type: string;
    runtime_ui_changes: boolean;
    account_sync_implementation: boolean;
    payment_or_billing_changes: boolean;
    roadmap_status_changes: boolean;
    workflow_changes: boolean;
    codeowners_changes: boolean;
    agents_policy_changes: boolean;
    dns_or_deployment_changes: boolean;
    production_data_changes: boolean;
    auto_merge_enabled: boolean;
    live_github_mutations_from_implementation_code: boolean;
    expected_files: string[];
  };
  status_values: StatusValue[];
  task_statuses: TaskStatusOverlay[];
  stale_open_pull_requests: {
    id: string;
    number: number;
    state: string;
    stale: boolean;
    resulting_status: StatusValue;
    router_selectable: boolean;
    auto_selectable: boolean;
    auto_mergeable: boolean;
    owner_decision_required: boolean;
  }[];
  owner_decision_packets: {
    id: string;
    task_id: string;
    status: string;
    merged: boolean;
    router_selectable: boolean;
    auto_selectable: boolean;
    reselect_for_factory_output: boolean;
    claims_actual_account_sync_exists: boolean;
    claims_disabled_route_skeleton_files_exist: boolean;
    approves_future_runtime_route_skeleton_implementation: boolean;
    public_paid_beta_effect: string;
    private_manual_beta_effect: string;
    evidence_summary: string;
    safety_summary: string;
  }[];
  release_gates: {
    public_paid_beta: {
      status: string;
      resulting_status: StatusValue;
      owner_decision_required: boolean;
      router_selectable: boolean;
      required_before_unblock: string[];
    };
    private_manual_beta: {
      status: string;
      owner_decision_required: boolean;
      manual_only: boolean;
      router_selectable: boolean;
      required_before_unblock: string[];
    };
  };
  next_safe_gap: NextSafeFactoryOutput;
  next_safe_factory_outputs: NextSafeFactoryOutput[];
};

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
const NON_SELECTABLE_MERGED_TASKS = [
  ["TB-020", 73],
  ["TB-030", 74],
  ["TB-040", 75],
  ["TB-050", 76],
  ["TB-060", 77],
  ["TB-070", 78],
  ["TB-080", 79],
  ["TB-100", 82]
] as const;
const FORBIDDEN_THIS_PR_PATH_PARTS = [
  "payment",
  "billing",
  "checkout",
  "subscription",
  "invoice",
  "stripe",
  "paddle",
  "account-sync",
  "account_sync"
];
const RUNTIME_IMPLEMENTATION_PREFIXES = [
  "src/app/",
  "src/components/",
  "src/lib/review/",
  "src/lib/srs/",
  "src/lib/packs/",
  "src/lib/paywall/",
  "src/lib/account-sync/",
  "src/app/api/"
];

function readJson<T>(...parts: string[]): T {
  return JSON.parse(
    readFileSync(join(process.cwd(), ...parts), "utf8")
  ) as T;
}

function readBacklogSeed(): TrackBBacklogSeed {
  return readJson("docs", "factory", "track-b-product-backlog.v1.json");
}

function readStatusOverlay(): TrackBStatusOverlay {
  return readJson(
    "docs",
    "factory",
    "track-b-product-backlog-status.v1.json"
  );
}

function taskStatusById(overlay: TrackBStatusOverlay, taskId: string) {
  const status = overlay.task_statuses.find(
    (candidate) => candidate.task_id === taskId
  );

  if (!status) {
    throw new Error(`Missing status overlay task ${taskId}`);
  }

  return status;
}

function normalizedPath(path: string) {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/").toLowerCase();
}

function isFactoryDocsOrTestsPath(path: string) {
  return path.startsWith("docs/factory/") || path.startsWith("tests/factory-");
}

function applyStatusOverlay(
  seed: TrackBBacklogSeed,
  overlay: TrackBStatusOverlay
): TrackBBacklogSeed {
  const statusByTaskId = new Map(
    overlay.task_statuses.map((status) => [status.task_id, status])
  );

  return {
    ...seed,
    tasks: seed.tasks.map((task) => {
      const status = statusByTaskId.get(task.id);

      if (!status) {
        return task;
      }

      return {
        ...task,
        status: status.router_candidate_status
      };
    })
  };
}

function buildStatusSummary(overlay: TrackBStatusOverlay) {
  return [...overlay.task_statuses]
    .sort((left, right) => {
      const byOrder = left.task_order - right.task_order;

      return byOrder === 0
        ? left.task_id.localeCompare(right.task_id)
        : byOrder;
    })
    .map((status) => ({
      task_id: status.task_id,
      task_order: status.task_order,
      resulting_status: status.resulting_status,
      router_candidate_status: status.router_candidate_status,
      router_selectable: status.router_selectable,
      merged_pr_numbers: status.satisfied_by
        .map((evidence) => evidence.merged_pr_number)
        .sort((left, right) => left - right)
    }));
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

function mergedPrSummaries(overlay: TrackBStatusOverlay) {
  const byNumber = new Map<number, StatusEvidence>();

  for (const status of overlay.task_statuses) {
    for (const evidence of status.satisfied_by) {
      if (!byNumber.has(evidence.merged_pr_number)) {
        byNumber.set(evidence.merged_pr_number, evidence);
      }
    }
  }

  return [...byNumber.values()]
    .sort((left, right) => left.merged_pr_number - right.merged_pr_number)
    .map((evidence) => ({
      number: evidence.merged_pr_number,
      title: evidence.merged_title,
      state: "closed",
      isDraft: false,
      merged: true,
      mergedAt: RECENT_COMPLETED_AT,
      mergeCommitSha: evidence.merge_commit_sha,
      evidence: evidence.evidence_summary
    }));
}

function passedCheck(name: string, evidence = `${name} passed`) {
  return {
    name,
    status: "passed",
    evidence,
    completedAt: RECENT_COMPLETED_AT
  };
}

function planWithStatusOverlay() {
  const seed = readBacklogSeed();
  const overlay = readStatusOverlay();
  const overlaidSeed = applyStatusOverlay(seed, overlay);

  return planNextTaskRunPacket({
    roadmap: backlogRoadmap(overlaidSeed),
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
    backlogCandidates: overlaidSeed.tasks.map(toRouterCandidate),
    recentMergedPrSummaries: mergedPrSummaries(overlay),
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
        "npm.cmd run test -- tests/factory-track-b-backlog-status.spec.ts --workers=1 passed"
      )
    ],
    blockedSurfaces: seed.common_blocked_surfaces.map((surface) => ({
      id: `blocked:${surface}`,
      surface,
      reason: "Track B backlog status overlay global safety boundary.",
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
}

test.describe("Track B product backlog status overlay", () => {
  test("overlay schema and evidence fields are complete", () => {
    const overlay = readStatusOverlay();

    expect(overlay).toMatchObject({
      schema_version: "1.0.0",
      kind: "track_b_product_backlog_status_overlay",
      repository: "chachathecat/visual-lexicon-app"
    });
    expect(overlay.router_contract).toMatchObject({
      apply_overlay_before_selection: true,
      same_input_produces_identical_order: true,
      same_input_produces_identical_status_summary: true,
      dry_run_only: true,
      live_github_mutations_from_implementation_code: false,
      auto_merge_enabled: false,
      needs_verification_router_candidate_status: "blocked_dependency"
    });
    expect(overlay.status_values).toEqual([
      "verified",
      "partial_verified",
      "needs_verification",
      "blocked_dependency",
      "blocked_human",
      "stale_not_selectable"
    ]);

    for (const status of overlay.task_statuses) {
      expect(status.task_id).toMatch(/^TB-\d{3}$/);
      expect(status.backlog_title.length).toBeGreaterThan(0);
      expect(overlay.status_values).toContain(status.resulting_status);
      expect(status.router_selectable).toBe(false);
      expect(status.satisfied_by.length).toBeGreaterThan(0);

      for (const evidence of status.satisfied_by) {
        expect(Number.isInteger(evidence.merged_pr_number)).toBe(true);
        expect(evidence.merged_title.length).toBeGreaterThan(0);
        expect(evidence.merge_commit_sha.length).toBeGreaterThan(0);
        expect(evidence.evidence_summary.length).toBeGreaterThan(0);
        expect(evidence.validation_summary.length).toBeGreaterThan(0);
        expect(evidence.safety_summary.length).toBeGreaterThan(0);
      }
    }
  });

  for (const [taskId, prNumber] of NON_SELECTABLE_MERGED_TASKS) {
    test(`${taskId} is not next selectable after PR #${prNumber} evidence`, () => {
      const overlay = readStatusOverlay();
      const status = taskStatusById(overlay, taskId);
      const result = planWithStatusOverlay();

      expect(status.resulting_status).toBe("verified");
      expect(status.router_candidate_status).toBe("verified");
      expect(status.router_selectable).toBe(false);
      expect(
        status.satisfied_by.some(
          (evidence) => evidence.merged_pr_number === prNumber
        )
      ).toBe(true);
      expect(result.status).toBe("pass");
      expect(result.stopReasons).toEqual([]);
      expect(result.selectedTask?.id).not.toBe(taskId);

      const rejected = result.rejectedTasks.find(
        (task) => task.taskId === taskId
      );

      expect(rejected?.reason).toContain("candidate_not_ready:verified");
    });
  }

  test("PR #121 remains stale and not selectable", () => {
    const overlay = readStatusOverlay();
    const result = planWithStatusOverlay();
    const pr121 = overlay.stale_open_pull_requests.find(
      (pr) => pr.number === 121
    );

    expect(pr121).toMatchObject({
      id: "PR-121",
      state: "open",
      stale: true,
      resulting_status: "stale_not_selectable",
      router_selectable: false,
      auto_selectable: false,
      auto_mergeable: false,
      owner_decision_required: true
    });
    expect(result.blockedTasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          taskId: "PR-121",
          implementableNow: false
        })
      ])
    );
  });

  test("public paid beta remains blocked", () => {
    const overlay = readStatusOverlay();
    const publicGate = overlay.release_gates.public_paid_beta;

    expect(publicGate).toMatchObject({
      status: "blocked",
      resulting_status: "blocked_human",
      owner_decision_required: true,
      router_selectable: false
    });
    expect(publicGate.required_before_unblock).toEqual(
      expect.arrayContaining([
        "account_owned_learning_persistence",
        "server_authoritative_entitlements",
        "payment_provider_policy_and_billing_lifecycle",
        "production_monitoring_alerting_and_rollback",
        "owner_public_launch_signoff"
      ])
    );
  });

  test("private/manual beta remains owner-approved and gated", () => {
    const overlay = readStatusOverlay();
    const privateGate = overlay.release_gates.private_manual_beta;
    const tb110 = taskStatusById(overlay, "TB-110");

    expect(privateGate).toMatchObject({
      status: "blocked_human",
      owner_decision_required: true,
      manual_only: true,
      router_selectable: false
    });
    expect(privateGate.required_before_unblock).toEqual(
      expect.arrayContaining([
        "owner_approval",
        "participant_local_state_disclosure",
        "support_privacy_refund_and_local_storage_disclosures"
      ])
    );
    expect(tb110).toMatchObject({
      resulting_status: "blocked_human",
      router_candidate_status: "blocked_human",
      router_selectable: false,
      owner_decision_required: true,
      owner_action_required: true
    });
  });

  test("no runtime UI files are expected in this reconciliation PR", () => {
    const overlay = readStatusOverlay();

    expect(overlay.this_pr).toMatchObject({
      type: "factory_docs_tests_reconciliation",
      runtime_ui_changes: false,
      account_sync_implementation: false,
      payment_or_billing_changes: false,
      roadmap_status_changes: false,
      workflow_changes: false,
      codeowners_changes: false,
      agents_policy_changes: false,
      dns_or_deployment_changes: false,
      production_data_changes: false
    });

    for (const expectedFile of overlay.this_pr.expected_files) {
      const normalized = normalizedPath(expectedFile);

      expect(
        RUNTIME_IMPLEMENTATION_PREFIXES.some((prefix) =>
          normalized.startsWith(prefix)
        ),
        `${expectedFile} is runtime implementation scope`
      ).toBe(false);
    }
  });

  test("no payment billing or account sync implementation files are expected", () => {
    const overlay = readStatusOverlay();

    for (const expectedFile of overlay.this_pr.expected_files) {
      const normalized = normalizedPath(expectedFile);

      expect(normalized.startsWith("src/"), expectedFile).toBe(false);
      expect(
        !isFactoryDocsOrTestsPath(normalized) &&
          FORBIDDEN_THIS_PR_PATH_PARTS.some((part) =>
            normalized.includes(part)
          ),
        `${expectedFile} is protected implementation scope`
      ).toBe(false);
    }
  });

  test("output ordering is deterministic", () => {
    const overlay = readStatusOverlay();
    const expectedOrder = [
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
    const reversedOverlay = {
      ...overlay,
      task_statuses: [...overlay.task_statuses].reverse()
    };

    expect(overlay.task_statuses.map((status) => status.task_id)).toEqual(
      expectedOrder
    );
    expect(buildStatusSummary(reversedOverlay)).toEqual(
      buildStatusSummary(overlay)
    );
  });

  test("same input produces identical status summary", () => {
    const overlay = readStatusOverlay();

    expect(buildStatusSummary(overlay)).toEqual(buildStatusSummary(overlay));
    expect(JSON.stringify(buildStatusSummary(overlay))).toBe(
      JSON.stringify(buildStatusSummary(overlay))
    );
  });

  test("TB-090 applies PR #142 partial verification as owner action", () => {
    const overlay = readStatusOverlay();
    const result = planWithStatusOverlay();
    const tb090 = taskStatusById(overlay, "TB-090");

    expect(tb090).toMatchObject({
      resulting_status: "partial_verified",
      router_candidate_status: "blocked_human",
      router_selectable: false,
      owner_decision_required: true,
      owner_action_required: true,
      not_selectable_for_automatic_implementation: true,
      owner_decision_packet: {
        exists: true,
        status: "merged",
        outcome: "packet_exists_without_runtime_approval",
        router_reselectable: false,
        claims_actual_account_sync_exists: false,
        claims_disabled_route_skeleton_files_exist: false,
        approves_future_runtime_route_skeleton_implementation: false
      }
    });
    expect(tb090.satisfied_by).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          merged_pr_number: 142,
          evidence_source:
            "docs/factory/tb-090-account-sync-skeleton-verification.v1.json"
        })
      ])
    );
    expect(
      tb090.satisfied_by.some((evidence) => evidence.merged_pr_number === 82)
    ).toBe(false);
    expect(tb090.partial_verification_reason).toContain(
      "does not verify actual disabled route files"
    );
    expect(tb090.blocked_reason).toContain(
      "Owner decision is required before any disabled account sync route skeleton files"
    );
    expect(tb090.blocked_reason).toContain(
      "does not approve actual account sync, disabled route skeleton files, or future runtime route skeleton implementation"
    );
    expect(result.selectedTask?.id).not.toBe("TB-090");
    expect(result.ownerDecisionRequired).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          taskId: "TB-090",
          status: "blocked_human",
          implementableNow: false
        })
      ])
    );
    expect(result.blockedTasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          taskId: "TB-090",
          reason: "roadmap_status:blocked_human",
          implementableNow: false
        })
      ])
    );
    expect(
      result.rejectedTasks.find((task) => task.taskId === "TB-090")?.reason
    ).toContain("candidate_not_ready:blocked_human");
  });

  test("TB-090 owner decision packet is recorded but not reselected", () => {
    const overlay = readStatusOverlay();
    const result = planWithStatusOverlay();
    const tb090Packet = overlay.owner_decision_packets.find(
      (packet) => packet.id === "TB-090-OWNER-DECISION-PACKET"
    );
    const nextOutputText = overlay.next_safe_factory_outputs
      .map((output) => `${output.id} ${output.title} ${output.recommendation}`)
      .join("\n");

    expect(tb090Packet).toMatchObject({
      task_id: "TB-090",
      status: "exists",
      merged: true,
      router_selectable: false,
      auto_selectable: false,
      reselect_for_factory_output: false,
      claims_actual_account_sync_exists: false,
      claims_disabled_route_skeleton_files_exist: false,
      approves_future_runtime_route_skeleton_implementation: false,
      public_paid_beta_effect: "no_unblock",
      private_manual_beta_effect: "no_launch"
    });
    expect(result.selectedTask?.id).not.toBe("TB-090");
    expect(nextOutputText).not.toMatch(/produce an owner[- ]decision packet/i);
    expect(nextOutputText).not.toMatch(/TB-090 owner[- ]decision packet/i);
    expect(nextOutputText).not.toContain("route skeleton implementation");
  });

  test("next safe outputs are deterministic owner actions, not TB-090 packet work", () => {
    const overlay = readStatusOverlay();
    const firstNonVerified = buildStatusSummary(overlay).find(
      (status) => status.resulting_status !== "verified"
    );

    expect(firstNonVerified?.task_id).toBe("TB-090");
    expect(overlay.next_safe_gap).toMatchObject({
      rank: 1,
      id: "OWNER-MINIMAL-INTERVENTION-QUEUE-PACKET",
      title: "Owner minimal-intervention queue packet",
      resulting_status: "blocked_human",
      router_candidate_status: "blocked_human",
      router_selectable: false,
      owner_decision_required: true,
      owner_action_required: true,
      auto_selectable: false,
      source: "after_tb_090_owner_decision_packet_exists"
    });
    expect(overlay.next_safe_factory_outputs.map((output) => output.id)).toEqual(
      [
        "OWNER-MINIMAL-INTERVENTION-QUEUE-PACKET",
        "PR-121-STALE-SUPERSEDED-OWNER-DECISION",
        "TB-110-PRIVATE-BETA-OWNER-ACTION-PACKET"
      ]
    );
    expect(
      overlay.next_safe_factory_outputs.map((output) => output.title)
    ).toEqual([
      "Owner minimal-intervention queue packet",
      "PR #121 close as stale/superseded owner decision",
      "TB-110 private beta owner action packet"
    ]);
    expect(overlay.next_safe_factory_outputs[1]).toMatchObject({
      related_pr_number: 121,
      resulting_status: "stale_not_selectable",
      router_selectable: false,
      owner_action_required: true,
      auto_selectable: false
    });
    expect(overlay.next_safe_factory_outputs[2]).toMatchObject({
      task_id: "TB-110",
      resulting_status: "blocked_human",
      router_selectable: false,
      owner_action_required: true,
      auto_selectable: false
    });
    expect(overlay.next_safe_gap.id).not.toBe("TB-090");
    expect(overlay.next_safe_gap.recommendation).not.toMatch(
      /produce an owner[- ]decision packet/i
    );
  });
});
