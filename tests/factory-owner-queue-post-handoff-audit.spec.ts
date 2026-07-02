import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

type EvidenceItem = {
  exists: boolean;
  is_actual_evidence: boolean;
  completed_by_pull_request?: number;
  merge_commit?: string;
  paths: string[];
};

type AuditPacket = {
  schema_version: string;
  kind: string;
  repository: string;
  created_at: string;
  merged_pr_evidence: {
    number: number;
    state: string;
    merged: boolean;
    merge_commit: string;
    evidence_paths: string[];
    runtime_or_protected_surface_effect: string;
  }[];
  actual_evidence: Record<string, EvidenceItem>;
  completed_outputs: {
    id: string;
    completed_by_pull_request: number;
    merge_commit: string;
    router_reselectable: boolean;
    auto_selectable: boolean;
    implementation_allowed: boolean;
    live_mutation_allowed: boolean;
  }[];
  owner_queue_audit: {
    next_safe_task_from_queue: {
      id: string;
      owner_only: boolean;
      docs_tests_only: boolean;
      non_mutating: boolean;
      router_selectable: boolean;
      auto_selectable: boolean;
      auto_mergeable: boolean;
      implementation_allowed: boolean;
      live_mutation_allowed: boolean;
    };
    post_audit_next_action: {
      result: string;
      next_safe_task: null;
      implementation_task_promoted: boolean;
      runtime_product_work_promoted: boolean;
      account_sync_promoted: boolean;
      payment_or_billing_promoted: boolean;
      deployment_promoted: boolean;
      public_paid_beta_launch_promoted: boolean;
    };
    missing_stale_unknown_evidence_policy: {
      missing_evidence_result: string;
      stale_evidence_result: string;
      unknown_evidence_result: string;
      requires_actual_artifacts: boolean;
      ready_when_evidence_missing: boolean;
      ready_when_evidence_stale: boolean;
      ready_when_evidence_unknown: boolean;
    };
  };
  selection_result: Record<string, boolean | null>;
  release_gates: {
    public_paid_beta: Record<string, boolean | string>;
    private_manual_beta: Record<string, boolean | string>;
  };
  github_mutation_policy: Record<string, boolean>;
  auto_merge_policy: Record<string, boolean>;
  protected_surface_changes: Record<string, boolean>;
  protected_surfaces: {
    id: string;
    blocked: boolean;
    implementation_allowed: boolean;
  }[];
  non_actions: Record<string, boolean>;
  determinism: {
    fixed_created_at: string;
    merge_evidence_order: string[];
    completed_output_order: string[];
  };
  required_validation: {
    targeted: string[];
    before_finish: string[];
  };
  safety_confirmation: Record<string, boolean>;
};

type OwnerQueue = {
  latest_merged_factory_state: {
    completed_owner_outputs: {
      id: string;
      router_reselectable: boolean;
      implementation_allowed: boolean;
      live_mutation_allowed: boolean;
    }[];
  };
  selection_result: {
    selected_implementation: null;
    selected_runtime_task: null;
    owner_queue_post_handoff_audit_selected: boolean;
    post_merge_handoff_generator_outcome_selected: boolean;
  };
  next_safe_task: {
    id: string;
    resulting_status: string;
    implementation_allowed: boolean;
    live_mutation_allowed: boolean;
  };
  recommended_next_outputs: {
    id: string;
    implementation_allowed: boolean;
    live_mutation_allowed: boolean;
  }[];
};

const AUDIT_JSON_PATH = [
  "docs",
  "factory",
  "owner-queue-post-handoff-audit.v1.json"
];
const AUDIT_MD_PATH = [
  "docs",
  "factory",
  "owner-queue-post-handoff-audit.md"
];
const OWNER_QUEUE_PATH = [
  "docs",
  "factory",
  "owner-minimal-intervention-queue.v1.json"
];
const AUDIT_OUTCOME_JSON_PATH = [
  "docs",
  "factory",
  "owner-queue-post-handoff-audit-outcome.v1.json"
];

function readJson<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(join(process.cwd(), ...parts), "utf8")) as T;
}

function readAudit() {
  return readJson<AuditPacket>(...AUDIT_JSON_PATH);
}

function readOwnerQueue() {
  return readJson<OwnerQueue>(...OWNER_QUEUE_PATH);
}

function prByNumber(packet: AuditPacket, number: number) {
  const pr = packet.merged_pr_evidence.find(
    (candidate) => candidate.number === number
  );

  if (!pr) {
    throw new Error(`Missing PR #${number}`);
  }

  return pr;
}

function stableProjection(packet: AuditPacket, queue: OwnerQueue) {
  return {
    auditMergedPrs: packet.merged_pr_evidence.map((pr) => ({
      number: pr.number,
      merge_commit: pr.merge_commit
    })),
    historicalAuditTask: packet.owner_queue_audit.next_safe_task_from_queue.id,
    currentQueueNextTask: queue.next_safe_task.id,
    currentCompletedOutputs:
      queue.latest_merged_factory_state.completed_owner_outputs.map((output) => ({
        id: output.id,
        router_reselectable: output.router_reselectable
      }))
  };
}

test.describe("owner queue post-handoff audit packet", () => {
  test("artifact files exist and required PR merge SHAs are represented", () => {
    const packet = readAudit();
    const markdown = readFileSync(join(process.cwd(), ...AUDIT_MD_PATH), "utf8");

    expect(existsSync(join(process.cwd(), ...AUDIT_JSON_PATH))).toBe(true);
    expect(existsSync(join(process.cwd(), ...AUDIT_MD_PATH))).toBe(true);
    expect(existsSync(join(process.cwd(), ...AUDIT_OUTCOME_JSON_PATH))).toBe(
      true
    );
    expect(packet).toMatchObject({
      schema_version: "1.0.0",
      kind: "owner_queue_post_handoff_audit",
      repository: "chachathecat/visual-lexicon-app",
      created_at: "2026-07-02"
    });
    expect(prByNumber(packet, 147)).toMatchObject({
      merge_commit: "b4dd352f8ece4a660d983365ae60169b4c83566d",
      runtime_or_protected_surface_effect: "none"
    });
    expect(prByNumber(packet, 149)).toMatchObject({
      merge_commit: "fcdd91f7b5cec444d25d35be3a6bdcc38519bcf6",
      runtime_or_protected_surface_effect: "none"
    });
    expect(prByNumber(packet, 148)).toMatchObject({
      merge_commit: "4560e556ff682f3813983f4bc4f07c7868255ad9",
      runtime_or_protected_surface_effect: "none"
    });
    expect(prByNumber(packet, 150)).toMatchObject({
      merge_commit: "96d53a7bd3f054aaa9b2af43f04feab43b97304c",
      runtime_or_protected_surface_effect: "none"
    });
    expect(prByNumber(packet, 151)).toMatchObject({
      merge_commit: "1c3b4e0b26593539ad543014b46ce68bd62583d5",
      runtime_or_protected_surface_effect: "none"
    });
    expect(markdown).toContain("PR #151 merged");
    expect(markdown).toContain("1c3b4e0b26593539ad543014b46ce68bd62583d5");
  });

  test("required evidence files exist as actual evidence", () => {
    const packet = readAudit();

    expect(packet.actual_evidence).toMatchObject({
      pr_150_post_merge_handoff_generator: {
        exists: true,
        is_actual_evidence: true,
        completed_by_pull_request: 150,
        merge_commit: "96d53a7bd3f054aaa9b2af43f04feab43b97304c"
      },
      pr_150_ci_failure_triage_seed: {
        exists: true,
        is_actual_evidence: true,
        completed_by_pull_request: 150,
        merge_commit: "96d53a7bd3f054aaa9b2af43f04feab43b97304c"
      },
      pr_151_post_merge_handoff_generator_outcome: {
        exists: true,
        is_actual_evidence: true,
        completed_by_pull_request: 151,
        merge_commit: "1c3b4e0b26593539ad543014b46ce68bd62583d5"
      }
    });

    for (const [id, evidence] of Object.entries(packet.actual_evidence)) {
      expect(evidence.exists, id).toBe(true);
      expect(evidence.is_actual_evidence, id).toBe(true);

      for (const evidencePath of evidence.paths) {
        expect(existsSync(join(process.cwd(), evidencePath)), evidencePath).toBe(
          true
        );
      }
    }
  });

  test("historical audit output is now completed and not reselected", () => {
    const packet = readAudit();
    const queue = readOwnerQueue();
    const outputIds = [
      queue.next_safe_task.id,
      ...queue.recommended_next_outputs.map((output) => output.id)
    ];
    const completedAudit =
      queue.latest_merged_factory_state.completed_owner_outputs.find(
        (output) => output.id === "OWNER-QUEUE-POST-HANDOFF-AUDIT"
      );

    expect(packet.owner_queue_audit.next_safe_task_from_queue).toMatchObject({
      id: "OWNER-QUEUE-POST-HANDOFF-AUDIT",
      owner_only: true,
      docs_tests_only: true,
      non_mutating: true,
      router_selectable: false,
      auto_selectable: false,
      auto_mergeable: false,
      implementation_allowed: false,
      live_mutation_allowed: false
    });
    expect(completedAudit).toMatchObject({
      id: "OWNER-QUEUE-POST-HANDOFF-AUDIT",
      router_reselectable: false,
      implementation_allowed: false,
      live_mutation_allowed: false
    });
    expect(outputIds).not.toContain("OWNER-QUEUE-POST-HANDOFF-AUDIT");
    expect(queue.selection_result).toMatchObject({
      selected_implementation: null,
      selected_runtime_task: null,
      owner_queue_post_handoff_audit_selected: false,
      post_merge_handoff_generator_outcome_selected: false
    });
  });

  test("current owner queue remains conservative and evidence fails closed", () => {
    const packet = readAudit();
    const queue = readOwnerQueue();

    expect(packet.owner_queue_audit.post_audit_next_action).toMatchObject({
      result: "audit_required",
      next_safe_task: null,
      implementation_task_promoted: false,
      runtime_product_work_promoted: false,
      account_sync_promoted: false,
      payment_or_billing_promoted: false,
      deployment_promoted: false,
      public_paid_beta_launch_promoted: false
    });
    expect(packet.owner_queue_audit.missing_stale_unknown_evidence_policy).toMatchObject({
      missing_evidence_result: "blocked_human",
      stale_evidence_result: "audit_required",
      unknown_evidence_result: "audit_required",
      requires_actual_artifacts: true,
      ready_when_evidence_missing: false,
      ready_when_evidence_stale: false,
      ready_when_evidence_unknown: false
    });
    expect(queue.next_safe_task).toMatchObject({
      id: "OWNER-AUDIT-REQUIRED",
      resulting_status: "audit_required",
      implementation_allowed: false,
      live_mutation_allowed: false
    });
  });

  test("protected surface, live mutation, and auto-merge flags remain disabled", () => {
    const packet = readAudit();

    for (const [field, changed] of Object.entries(
      packet.protected_surface_changes
    )) {
      expect(changed, field).toBe(false);
    }

    for (const [field, enabled] of Object.entries(packet.github_mutation_policy)) {
      expect(enabled, field).toBe(false);
    }

    for (const [field, enabled] of Object.entries(packet.auto_merge_policy)) {
      expect(enabled, field).toBe(false);
    }

    for (const [field, performed] of Object.entries(packet.non_actions)) {
      expect(performed, field).toBe(false);
    }

    for (const surface of packet.protected_surfaces) {
      expect(surface.blocked, surface.id).toBe(true);
      expect(surface.implementation_allowed, surface.id).toBe(false);
    }
  });

  test("release gates remain blocked or gated with owner approval required", () => {
    const packet = readAudit();

    expect(packet.release_gates.public_paid_beta).toMatchObject({
      status: "blocked",
      router_selectable: false,
      auto_selectable: false,
      launch_allowed: false,
      owner_decision_required: true,
      unblocked_by_this_audit: false
    });
    expect(packet.release_gates.private_manual_beta).toMatchObject({
      status: "gated",
      router_selectable: false,
      auto_selectable: false,
      manual_only: true,
      owner_approval_required: true,
      launched_by_this_audit: false,
      participants_invited_by_this_audit: false,
      charges_enabled_by_this_audit: false,
      entitlements_granted_by_this_audit: false
    });
    expect(packet.safety_confirmation).toMatchObject({
      public_paid_beta_remains_blocked: true,
      private_manual_beta_remains_gated: true,
      owner_approval_required_for_blocked_human_tasks: true
    });
  });

  test("validation commands and deterministic ordering are documented", () => {
    const packet = readAudit();
    const queue = readOwnerQueue();
    const markdown = readFileSync(join(process.cwd(), ...AUDIT_MD_PATH), "utf8");

    expect(packet.required_validation.before_finish).toEqual([
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- --workers=1"
    ]);
    expect(packet.determinism).toMatchObject({
      fixed_created_at: "2026-07-02",
      merge_evidence_order: [
        "PR-147",
        "PR-149",
        "PR-148",
        "PR-150",
        "PR-151"
      ],
      completed_output_order: [
        "TB-110-PRIVATE-BETA-OWNER-ACTION-PACKET",
        "POST-MERGE-HANDOFF-GENERATOR",
        "POST-MERGE-HANDOFF-GENERATOR-OUTCOME"
      ]
    });
    expect(stableProjection(packet, queue)).toEqual(
      stableProjection(packet, queue)
    );
    expect(markdown).toContain("npm.cmd run typecheck");
    expect(markdown).toContain("npm.cmd run lint");
    expect(markdown).toContain("npm.cmd run build");
    expect(markdown).toContain("npm.cmd run test -- --workers=1");
  });
});
