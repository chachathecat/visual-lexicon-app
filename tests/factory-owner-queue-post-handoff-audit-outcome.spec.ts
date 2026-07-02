import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

type Outcome = {
  schema_version: string;
  kind: string;
  repository: string;
  created_at: string;
  this_packet: Record<string, boolean | string | string[]>;
  merged_pull_request: {
    number: number;
    state: string;
    merged: boolean;
    merge_commit: string;
    runtime_or_protected_surface_effect: string;
  };
  merged_pr_evidence: {
    number: number;
    state: string;
    merged: boolean;
    merge_commit: string;
    runtime_or_protected_surface_effect: string;
  }[];
  evidence: {
    owner_queue_post_handoff_audit_exists: boolean;
    owner_queue_post_handoff_audit_is_actual_evidence: boolean;
    owner_queue_post_handoff_audit_path: string;
    owner_queue_post_handoff_audit_markdown_path: string;
    owner_queue_post_handoff_audit_test_path: string;
  };
  completed_outputs: {
    id: string;
    completed_by_pull_request: number;
    merge_commit: string;
    router_reselectable: boolean;
    auto_selectable: boolean;
    implementation_allowed: boolean;
    live_mutation_allowed: boolean;
  }[];
  queue_reconciliation: {
    owner_queue_post_handoff_audit_work_reselectable: boolean;
    owner_queue_post_handoff_audit_selected: boolean;
    tb_110_owner_action_packet_selected: boolean;
    post_merge_handoff_generator_selected: boolean;
    post_merge_handoff_generator_outcome_selected: boolean;
    selected_implementation_task: null;
    selected_runtime_task: null;
    selected_product_task: null;
    implementation_task_selected: boolean;
    runtime_task_selected: boolean;
    product_implementation_task_selected: boolean;
    account_sync_implementation_selected: boolean;
    payment_or_billing_selected: boolean;
    deployment_selected: boolean;
    public_paid_beta_selected: boolean;
    private_manual_beta_launch_selected: boolean;
    live_mutation_allowed: boolean;
    auto_merge_enabled: boolean;
    next_safe_task_id: string;
    next_safe_task_status: string;
  };
  next_safe_task: {
    id: string;
    output_type: string;
    resulting_status: string;
    owner_only: boolean;
    docs_tests_only: boolean;
    non_mutating: boolean;
    auto_selectable: boolean;
    auto_mergeable: boolean;
    implementation_allowed: boolean;
    live_mutation_allowed: boolean;
    owner_decision_required: boolean;
  };
  evidence_policy: Record<string, boolean | string>;
  release_gates: {
    public_paid_beta: Record<string, boolean | string>;
    private_manual_beta: Record<string, boolean | string>;
  };
  github_mutation_policy: Record<string, boolean>;
  auto_merge_policy: Record<string, boolean>;
  protected_surface_changes: Record<string, boolean>;
  non_actions: Record<string, boolean>;
  determinism: {
    same_input_produces_identical_output: boolean;
    fixed_created_at: string;
    merge_evidence_order: string[];
    completed_output_order: string[];
    ranked_output_order: string[];
  };
  required_validation: {
    targeted: string[];
    before_finish: string[];
  };
  safety_confirmation: Record<string, boolean>;
};

type Queue = {
  latest_merged_factory_state: {
    merged_factory_prs: {
      number: number;
      state: string;
      merged: boolean;
      merge_commit?: string;
    }[];
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
  release_gates: {
    public_paid_beta: {
      status: string;
      unblocked_by_this_queue: boolean;
    };
    private_manual_beta: {
      status: string;
      launched_by_this_queue: boolean;
    };
  };
  protected_surfaces: {
    id: string;
    blocked: boolean;
    implementation_allowed: boolean;
  }[];
};

const OUTCOME_JSON_PATH = [
  "docs",
  "factory",
  "owner-queue-post-handoff-audit-outcome.v1.json"
];
const OUTCOME_MD_PATH = [
  "docs",
  "factory",
  "owner-queue-post-handoff-audit-outcome.md"
];
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
const AUDIT_TEST_PATH = [
  "tests",
  "factory-owner-queue-post-handoff-audit.spec.ts"
];
const QUEUE_JSON_PATH = [
  "docs",
  "factory",
  "owner-minimal-intervention-queue.v1.json"
];

function readJson<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(join(process.cwd(), ...parts), "utf8")) as T;
}

function readOutcome() {
  return readJson<Outcome>(...OUTCOME_JSON_PATH);
}

function readQueue() {
  return readJson<Queue>(...QUEUE_JSON_PATH);
}

function prByNumber(outcome: Outcome, number: number) {
  const pr = outcome.merged_pr_evidence.find(
    (candidate) => candidate.number === number
  );

  if (!pr) {
    throw new Error(`Missing PR #${number}`);
  }

  return pr;
}

test.describe("owner queue post-handoff audit outcome", () => {
  test("PR #152 merged evidence and actual audit artifacts are represented", () => {
    const outcome = readOutcome();
    const queue = readQueue();
    const markdown = readFileSync(join(process.cwd(), ...OUTCOME_MD_PATH), "utf8");
    const pr152 = queue.latest_merged_factory_state.merged_factory_prs.find(
      (candidate) => candidate.number === 152
    );

    for (const pathParts of [
      OUTCOME_JSON_PATH,
      OUTCOME_MD_PATH,
      AUDIT_JSON_PATH,
      AUDIT_MD_PATH,
      AUDIT_TEST_PATH
    ]) {
      expect(existsSync(join(process.cwd(), ...pathParts))).toBe(true);
    }

    expect(outcome).toMatchObject({
      schema_version: "1.0.0",
      kind: "owner_queue_post_handoff_audit_outcome",
      repository: "chachathecat/visual-lexicon-app",
      created_at: "2026-07-02",
      merged_pull_request: {
        number: 152,
        state: "merged",
        merged: true,
        merge_commit: "8651a36a27ff72ca780d7444c8acf8211862d12c",
        runtime_or_protected_surface_effect: "none"
      },
      evidence: {
        owner_queue_post_handoff_audit_exists: true,
        owner_queue_post_handoff_audit_is_actual_evidence: true,
        owner_queue_post_handoff_audit_path:
          "docs/factory/owner-queue-post-handoff-audit.v1.json",
        owner_queue_post_handoff_audit_markdown_path:
          "docs/factory/owner-queue-post-handoff-audit.md",
        owner_queue_post_handoff_audit_test_path:
          "tests/factory-owner-queue-post-handoff-audit.spec.ts"
      }
    });
    expect(pr152).toMatchObject({
      number: 152,
      state: "merged",
      merged: true,
      merge_commit: "8651a36a27ff72ca780d7444c8acf8211862d12c"
    });
    expect(markdown).toContain("PR #152 merged");
    expect(markdown).toContain("8651a36a27ff72ca780d7444c8acf8211862d12c");
  });

  test("required merged PR evidence is stable", () => {
    const outcome = readOutcome();

    expect(prByNumber(outcome, 147)).toMatchObject({
      merge_commit: "b4dd352f8ece4a660d983365ae60169b4c83566d"
    });
    expect(prByNumber(outcome, 149)).toMatchObject({
      merge_commit: "fcdd91f7b5cec444d25d35be3a6bdcc38519bcf6"
    });
    expect(prByNumber(outcome, 148)).toMatchObject({
      merge_commit: "4560e556ff682f3813983f4bc4f07c7868255ad9"
    });
    expect(prByNumber(outcome, 150)).toMatchObject({
      merge_commit: "96d53a7bd3f054aaa9b2af43f04feab43b97304c"
    });
    expect(prByNumber(outcome, 151)).toMatchObject({
      merge_commit: "1c3b4e0b26593539ad543014b46ce68bd62583d5"
    });
    expect(prByNumber(outcome, 152)).toMatchObject({
      merge_commit: "8651a36a27ff72ca780d7444c8acf8211862d12c"
    });
  });

  test("completed outputs are not reselected", () => {
    const outcome = readOutcome();
    const queue = readQueue();
    const completedIds = [
      "TB-110-PRIVATE-BETA-OWNER-ACTION-PACKET",
      "POST-MERGE-HANDOFF-GENERATOR",
      "POST-MERGE-HANDOFF-GENERATOR-OUTCOME",
      "OWNER-QUEUE-POST-HANDOFF-AUDIT"
    ];
    const queueCompletedIds = queue.latest_merged_factory_state.completed_owner_outputs.map(
      (output) => output.id
    );

    expect(outcome.completed_outputs.map((output) => output.id)).toEqual(
      completedIds
    );
    expect(queueCompletedIds).toEqual(expect.arrayContaining(completedIds));

    for (const completed of outcome.completed_outputs) {
      expect(completed).toMatchObject({
        router_reselectable: false,
        auto_selectable: false,
        implementation_allowed: false,
        live_mutation_allowed: false
      });
    }

    expect(outcome.queue_reconciliation).toMatchObject({
      owner_queue_post_handoff_audit_work_reselectable: false,
      owner_queue_post_handoff_audit_selected: false,
      tb_110_owner_action_packet_selected: false,
      post_merge_handoff_generator_selected: false,
      post_merge_handoff_generator_outcome_selected: false
    });
    expect(queue.selection_result).toMatchObject({
      owner_queue_post_handoff_audit_selected: false,
      post_merge_handoff_generator_outcome_selected: false
    });
  });

  test("no implementation or product work is selected or promoted", () => {
    const outcome = readOutcome();
    const queue = readQueue();

    expect(outcome.queue_reconciliation).toMatchObject({
      selected_implementation_task: null,
      selected_runtime_task: null,
      selected_product_task: null,
      implementation_task_selected: false,
      runtime_task_selected: false,
      product_implementation_task_selected: false,
      account_sync_implementation_selected: false,
      payment_or_billing_selected: false,
      deployment_selected: false,
      public_paid_beta_selected: false,
      private_manual_beta_launch_selected: false,
      live_mutation_allowed: false,
      auto_merge_enabled: false,
      next_safe_task_id: "OWNER-AUDIT-REQUIRED",
      next_safe_task_status: "audit_required"
    });
    expect(outcome.next_safe_task).toMatchObject({
      id: "OWNER-AUDIT-REQUIRED",
      output_type: "audit_required_owner_decision",
      resulting_status: "audit_required",
      owner_only: true,
      docs_tests_only: true,
      non_mutating: true,
      auto_selectable: false,
      auto_mergeable: false,
      implementation_allowed: false,
      live_mutation_allowed: false,
      owner_decision_required: true
    });
    expect(queue.selection_result).toMatchObject({
      selected_implementation: null,
      selected_runtime_task: null
    });
    expect(queue.next_safe_task).toMatchObject({
      id: "OWNER-AUDIT-REQUIRED",
      resulting_status: "audit_required",
      implementation_allowed: false,
      live_mutation_allowed: false
    });
  });

  test("mutation, auto-merge, gates, and protected surfaces remain closed", () => {
    const outcome = readOutcome();
    const queue = readQueue();

    for (const [field, enabled] of Object.entries(outcome.github_mutation_policy)) {
      expect(enabled, field).toBe(false);
    }

    for (const [field, enabled] of Object.entries(outcome.auto_merge_policy)) {
      expect(enabled, field).toBe(false);
    }

    for (const [field, changed] of Object.entries(outcome.protected_surface_changes)) {
      expect(changed, field).toBe(false);
    }

    for (const [field, performed] of Object.entries(outcome.non_actions)) {
      expect(performed, field).toBe(false);
    }

    expect(outcome.release_gates.public_paid_beta).toMatchObject({
      status: "blocked",
      router_selectable: false,
      auto_selectable: false,
      launch_allowed: false,
      unblocked_by_this_outcome: false
    });
    expect(outcome.release_gates.private_manual_beta).toMatchObject({
      status: "gated",
      router_selectable: false,
      auto_selectable: false,
      launched_by_this_outcome: false,
      participants_invited_by_this_outcome: false,
      charges_enabled_by_this_outcome: false,
      entitlements_granted_by_this_outcome: false
    });
    expect(queue.release_gates.public_paid_beta).toMatchObject({
      status: "blocked",
      unblocked_by_this_queue: false
    });
    expect(queue.release_gates.private_manual_beta).toMatchObject({
      status: "gated",
      launched_by_this_queue: false
    });

    for (const surface of queue.protected_surfaces) {
      expect(surface.blocked, surface.id).toBe(true);
      expect(surface.implementation_allowed, surface.id).toBe(false);
    }
  });

  test("missing, stale, or unknown evidence fails closed", () => {
    const outcome = readOutcome();

    expect(outcome.evidence_policy).toMatchObject({
      missing_evidence_result: "blocked_human",
      stale_evidence_result: "audit_required",
      unknown_evidence_result: "audit_required",
      requires_actual_artifacts: true,
      ready_when_evidence_missing: false,
      ready_when_evidence_stale: false,
      ready_when_evidence_unknown: false
    });
  });

  test("required validation commands and safety confirmations are documented", () => {
    const outcome = readOutcome();
    const markdown = readFileSync(join(process.cwd(), ...OUTCOME_MD_PATH), "utf8");

    expect(outcome.required_validation.targeted).toEqual([
      "npm.cmd run test -- tests/factory-owner-queue-post-handoff-audit-outcome.spec.ts tests/factory-owner-minimal-intervention-queue.spec.ts --workers=1",
      "npm.cmd run test -- tests/factory-owner-queue-post-handoff-audit.spec.ts tests/factory-owner-queue-post-handoff-audit-outcome.spec.ts --workers=1"
    ]);
    expect(outcome.required_validation.before_finish).toEqual([
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- --workers=1"
    ]);
    expect(outcome.safety_confirmation).toMatchObject({
      docs_tests_only: true,
      pr_152_merged_evidence_recorded: true,
      owner_queue_post_handoff_audit_exists_as_actual_evidence: true,
      owner_queue_post_handoff_audit_not_reselected: true,
      no_implementation_task_selected: true,
      no_account_sync_promoted: true,
      no_payment_or_billing_promoted: true,
      no_deployment_promoted: true,
      no_live_github_mutation_allowed: true,
      auto_merge_remains_disabled: true,
      public_paid_beta_remains_blocked: true,
      private_manual_beta_remains_gated: true,
      protected_surfaces_unchanged: true,
      missing_stale_or_unknown_evidence_fails_closed: true
    });
    expect(outcome.determinism).toMatchObject({
      same_input_produces_identical_output: true,
      fixed_created_at: "2026-07-02",
      merge_evidence_order: [
        "PR-147",
        "PR-149",
        "PR-148",
        "PR-150",
        "PR-151",
        "PR-152"
      ],
      completed_output_order: [
        "TB-110-PRIVATE-BETA-OWNER-ACTION-PACKET",
        "POST-MERGE-HANDOFF-GENERATOR",
        "POST-MERGE-HANDOFF-GENERATOR-OUTCOME",
        "OWNER-QUEUE-POST-HANDOFF-AUDIT"
      ],
      ranked_output_order: ["OWNER-AUDIT-REQUIRED"]
    });
    expect(markdown).toContain("npm.cmd run typecheck");
    expect(markdown).toContain("npm.cmd run lint");
    expect(markdown).toContain("npm.cmd run build");
    expect(markdown).toContain("npm.cmd run test -- --workers=1");
  });
});
