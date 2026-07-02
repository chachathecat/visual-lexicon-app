import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

type QueueOutput = {
  rank: number;
  id: string;
  title: string;
  output_type: string;
  resulting_status?: string;
  router_candidate_status: string;
  owner_only?: boolean;
  docs_tests_only?: boolean;
  non_mutating?: boolean;
  router_selectable: boolean;
  auto_selectable: boolean;
  auto_mergeable: boolean;
  implementation_allowed: boolean;
  live_mutation_allowed: boolean;
  owner_decision_required: boolean;
  owner_action_required: boolean;
  recommendation: string;
};

type CompletedOwnerOutput = {
  id: string;
  completed_by_pull_request: number;
  merge_commit: string;
  actual_evidence_paths: string[];
  router_reselectable: boolean;
  auto_selectable: boolean;
  implementation_allowed: boolean;
  live_mutation_allowed: boolean;
};

type OwnerMinimalInterventionQueue = {
  schema_version: string;
  kind: string;
  repository: string;
  source_documents: string[];
  this_pr: Record<string, boolean | string | string[]>;
  router_contract: {
    dry_run_only: boolean;
    live_github_mutations_from_implementation_code: boolean;
    auto_merge_enabled: boolean;
    same_input_produces_identical_queue_output: boolean;
    sort_keys: string[];
    blocked_human_is_auto_selectable: boolean;
    stale_prs_are_auto_mergeable: boolean;
    protected_surfaces_block_implementation: boolean;
    owner_approval_required_for_blocked_human: boolean;
    unknown_evidence_ready: boolean;
    stale_evidence_ready: boolean;
  };
  latest_merged_factory_state: {
    state_label: string;
    merged_factory_prs: {
      number: number;
      state: string;
      merged: boolean;
      merge_commit?: string;
      evidence_paths: string[];
      runtime_or_protected_surface_effect: string;
    }[];
    completed_owner_outputs: CompletedOwnerOutput[];
    tasks: {
      task_id: string;
      title: string;
      resulting_status: string;
      router_candidate_status: string;
      router_selectable: boolean;
      auto_selectable: boolean;
      owner_action_required?: boolean;
      owner_approval_required?: boolean;
      owner_decision_packet_exists?: boolean;
      owner_decision_packet_is_actual_evidence?: boolean;
      owner_action_packet_exists?: boolean;
      owner_action_packet_is_actual_evidence?: boolean;
      account_sync_implementation_exists?: boolean;
      account_sync_implementation_approved?: boolean;
      disabled_route_skeleton_runtime_files_approved?: boolean;
      tb_090_owner_decision_packet_work_reselectable?: boolean;
      tb_110_owner_action_packet_work_reselectable?: boolean;
    }[];
  };
  open_stale_pull_requests: unknown[];
  closed_stale_pull_requests: {
    id: string;
    number: number;
    state: string;
    stale: boolean;
    superseded: boolean;
    resulting_status: string;
    router_selectable: boolean;
    auto_selectable: boolean;
    auto_mergeable: boolean;
    owner_decision_required: boolean;
    owner_action_required: boolean;
    closed_manually_by_owner: boolean;
    live_mutation_performed_by_this_packet: boolean;
  }[];
  selection_result: {
    selected_implementation: null;
    selected_runtime_task: null;
    account_sync_implementation_selected: boolean;
    tb_090_selected: boolean;
    tb_090_owner_decision_packet_work_selected: boolean;
    public_paid_beta_selected: boolean;
    private_manual_beta_launch_selected: boolean;
    pr_121_selected: boolean;
    tb_110_owner_action_packet_selected: boolean;
    post_merge_handoff_generator_selected: boolean;
    post_merge_handoff_generator_outcome_selected: boolean;
    owner_queue_post_handoff_audit_selected: boolean;
  };
  next_safe_task: QueueOutput;
  recommended_next_outputs: QueueOutput[];
  blocked_human_decisions: {
    id: string;
    status: string;
    owner_approval_required: boolean;
    owner_action_required: boolean;
    auto_selectable: boolean;
    implementation_allowed: boolean;
  }[];
  release_gates: {
    public_paid_beta: {
      status: string;
      router_selectable: boolean;
      auto_selectable: boolean;
      owner_decision_required: boolean;
      unblocked_by_this_queue: boolean;
      blockers: string[];
    };
    private_manual_beta: {
      status: string;
      router_selectable: boolean;
      auto_selectable: boolean;
      owner_approval_required: boolean;
      manual_only: boolean;
      launched_by_this_queue: boolean;
    };
  };
  protected_surfaces: {
    id: string;
    blocked: boolean;
    implementation_allowed: boolean;
  }[];
  evidence_policy: Record<string, boolean | string>;
  required_validation: {
    targeted: string[];
    before_finish: string[];
  };
  codex_prompt_draft: {
    title: string;
    allowed_files: string[];
    prompt_lines: string[];
  };
  merge_recommendation: {
    for_this_docs_tests_packet: string;
    auto_merge_enabled: boolean;
    live_mutations_enabled: boolean;
    no_merge_recommendations: string[];
  };
  safety_confirmation: Record<string, boolean>;
};

type AuditOutcome = {
  merged_pull_request: {
    number: number;
    merged: boolean;
    merge_commit: string;
  };
  evidence: {
    owner_queue_post_handoff_audit_exists: boolean;
    owner_queue_post_handoff_audit_is_actual_evidence: boolean;
  };
  queue_reconciliation: {
    owner_queue_post_handoff_audit_selected: boolean;
    next_safe_task_id: string;
    next_safe_task_status: string;
  };
};

const QUEUE_JSON_PATH = [
  "docs",
  "factory",
  "owner-minimal-intervention-queue.v1.json"
];
const QUEUE_MD_PATH = [
  "docs",
  "factory",
  "owner-minimal-intervention-queue.md"
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
const AUDIT_OUTCOME_JSON_PATH = [
  "docs",
  "factory",
  "owner-queue-post-handoff-audit-outcome.v1.json"
];
const AUDIT_OUTCOME_MD_PATH = [
  "docs",
  "factory",
  "owner-queue-post-handoff-audit-outcome.md"
];
const AUDIT_OUTCOME_TEST_PATH = [
  "tests",
  "factory-owner-queue-post-handoff-audit-outcome.spec.ts"
];

function readJson<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(join(process.cwd(), ...parts), "utf8")) as T;
}

function readQueue(): OwnerMinimalInterventionQueue {
  return readJson(...QUEUE_JSON_PATH);
}

function readAuditOutcome(): AuditOutcome {
  return readJson(...AUDIT_OUTCOME_JSON_PATH);
}

function prByNumber(queue: OwnerMinimalInterventionQueue, number: number) {
  const pr = queue.latest_merged_factory_state.merged_factory_prs.find(
    (candidate) => candidate.number === number
  );

  if (!pr) {
    throw new Error(`Missing PR #${number}`);
  }

  return pr;
}

function completedById(queue: OwnerMinimalInterventionQueue, id: string) {
  const output = queue.latest_merged_factory_state.completed_owner_outputs.find(
    (candidate) => candidate.id === id
  );

  if (!output) {
    throw new Error(`Missing completed output ${id}`);
  }

  return output;
}

function taskById(queue: OwnerMinimalInterventionQueue, taskId: string) {
  const task = queue.latest_merged_factory_state.tasks.find(
    (candidate) => candidate.task_id === taskId
  );

  if (!task) {
    throw new Error(`Missing task ${taskId}`);
  }

  return task;
}

function deterministicQueueOutput(queue: OwnerMinimalInterventionQueue) {
  return {
    latestMergedPrs: [...queue.latest_merged_factory_state.merged_factory_prs]
      .sort((left, right) => left.number - right.number)
      .map((pr) => ({
        number: pr.number,
        state: pr.state,
        merged: pr.merged,
        merge_commit: pr.merge_commit
      })),
    completedOutputs: [...queue.latest_merged_factory_state.completed_owner_outputs]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((output) => ({
        id: output.id,
        router_reselectable: output.router_reselectable,
        implementation_allowed: output.implementation_allowed,
        live_mutation_allowed: output.live_mutation_allowed
      })),
    nextOutputs: [...queue.recommended_next_outputs]
      .sort((left, right) => {
        const byRank = left.rank - right.rank;

        return byRank === 0 ? left.id.localeCompare(right.id) : byRank;
      })
      .map((output) => ({
        rank: output.rank,
        id: output.id,
        resulting_status: output.resulting_status,
        implementation_allowed: output.implementation_allowed,
        live_mutation_allowed: output.live_mutation_allowed
      }))
  };
}

test.describe("owner minimal-intervention queue", () => {
  test("artifact files exist and summarize the post-PR #152 state", () => {
    const queue = readQueue();
    const outcome = readAuditOutcome();
    const markdown = readFileSync(join(process.cwd(), ...QUEUE_MD_PATH), "utf8");

    for (const pathParts of [
      QUEUE_JSON_PATH,
      QUEUE_MD_PATH,
      AUDIT_JSON_PATH,
      AUDIT_MD_PATH,
      AUDIT_TEST_PATH,
      AUDIT_OUTCOME_JSON_PATH,
      AUDIT_OUTCOME_MD_PATH,
      AUDIT_OUTCOME_TEST_PATH
    ]) {
      expect(existsSync(join(process.cwd(), ...pathParts))).toBe(true);
    }

    expect(queue).toMatchObject({
      schema_version: "1.0.0",
      kind: "owner_minimal_intervention_queue",
      repository: "chachathecat/visual-lexicon-app"
    });
    expect(queue.latest_merged_factory_state).toMatchObject({
      state_label: "post_pr_152_owner_queue_post_handoff_audit_merged"
    });
    expect(prByNumber(queue, 152)).toMatchObject({
      number: 152,
      state: "merged",
      merged: true,
      merge_commit: "8651a36a27ff72ca780d7444c8acf8211862d12c",
      runtime_or_protected_surface_effect: "none"
    });
    expect(outcome).toMatchObject({
      merged_pull_request: {
        number: 152,
        merged: true,
        merge_commit: "8651a36a27ff72ca780d7444c8acf8211862d12c"
      },
      evidence: {
        owner_queue_post_handoff_audit_exists: true,
        owner_queue_post_handoff_audit_is_actual_evidence: true
      }
    });
    expect(markdown).toContain("PR #152 is merged");
    expect(markdown).toContain("8651a36a27ff72ca780d7444c8acf8211862d12c");
    expect(markdown).toContain("`OWNER-QUEUE-POST-HANDOFF-AUDIT` is not reselected");
  });

  test("completed owner outputs are not reselected", () => {
    const queue = readQueue();
    const completedIds = [
      "TB-110-PRIVATE-BETA-OWNER-ACTION-PACKET",
      "POST-MERGE-HANDOFF-GENERATOR",
      "POST-MERGE-HANDOFF-GENERATOR-OUTCOME",
      "OWNER-QUEUE-POST-HANDOFF-AUDIT"
    ];
    const outputIds = [
      queue.next_safe_task.id,
      ...queue.recommended_next_outputs.map((output) => output.id)
    ];

    for (const id of completedIds) {
      const completed = completedById(queue, id);

      expect(completed).toMatchObject({
        router_reselectable: false,
        auto_selectable: false,
        implementation_allowed: false,
        live_mutation_allowed: false
      });
      expect(outputIds).not.toContain(id);

      for (const evidencePath of completed.actual_evidence_paths) {
        expect(existsSync(join(process.cwd(), evidencePath)), evidencePath).toBe(
          true
        );
      }
    }

    expect(queue.selection_result).toMatchObject({
      tb_110_owner_action_packet_selected: false,
      post_merge_handoff_generator_selected: false,
      post_merge_handoff_generator_outcome_selected: false,
      owner_queue_post_handoff_audit_selected: false
    });
  });

  test("next action fails closed as owner-only audit_required work", () => {
    const queue = readQueue();

    expect(queue.next_safe_task).toMatchObject({
      rank: 1,
      id: "OWNER-AUDIT-REQUIRED",
      output_type: "audit_required_owner_decision",
      resulting_status: "audit_required",
      router_candidate_status: "blocked_human",
      owner_only: true,
      docs_tests_only: true,
      non_mutating: true,
      router_selectable: false,
      auto_selectable: false,
      auto_mergeable: false,
      implementation_allowed: false,
      live_mutation_allowed: false,
      owner_decision_required: true,
      owner_action_required: true
    });
    expect(queue.recommended_next_outputs).toHaveLength(1);
    expect(queue.recommended_next_outputs[0]).toMatchObject(queue.next_safe_task);
  });

  test("no implementation, product, account sync, payment, or deployment task is selected", () => {
    const queue = readQueue();
    const selectedText = [
      queue.next_safe_task.id,
      ...queue.recommended_next_outputs.map((output) => output.id)
    ].join("\n");

    expect(queue.selection_result).toMatchObject({
      selected_implementation: null,
      selected_runtime_task: null,
      account_sync_implementation_selected: false,
      tb_090_selected: false,
      tb_090_owner_decision_packet_work_selected: false,
      public_paid_beta_selected: false,
      private_manual_beta_launch_selected: false
    });
    expect(selectedText).not.toMatch(/IMPLEMENTATION/i);
    expect(selectedText).not.toMatch(/ACCOUNT-SYNC/i);
    expect(selectedText).not.toMatch(/PAYMENT|BILLING/i);
    expect(selectedText).not.toMatch(/DEPLOY/i);

    expect(taskById(queue, "TB-090")).toMatchObject({
      resulting_status: "partial_verified",
      router_candidate_status: "blocked_human",
      router_selectable: false,
      auto_selectable: false,
      account_sync_implementation_exists: false,
      account_sync_implementation_approved: false,
      disabled_route_skeleton_runtime_files_approved: false,
      tb_090_owner_decision_packet_work_reselectable: false
    });
    expect(taskById(queue, "TB-110")).toMatchObject({
      resulting_status: "blocked_human",
      router_candidate_status: "blocked_human",
      router_selectable: false,
      auto_selectable: false,
      owner_action_required: true,
      owner_approval_required: true,
      owner_action_packet_exists: true,
      owner_action_packet_is_actual_evidence: true,
      tb_110_owner_action_packet_work_reselectable: false
    });
  });

  test("PR #121 remains closed stale superseded and not reselected", () => {
    const queue = readQueue();
    const pr121 = queue.closed_stale_pull_requests.find(
      (pr) => pr.number === 121
    );

    expect(pr121).toMatchObject({
      id: "PR-121",
      number: 121,
      state: "closed",
      stale: true,
      superseded: true,
      resulting_status: "stale_not_selectable",
      router_selectable: false,
      auto_selectable: false,
      auto_mergeable: false,
      owner_decision_required: false,
      owner_action_required: false,
      closed_manually_by_owner: true,
      live_mutation_performed_by_this_packet: false
    });
    expect(queue.open_stale_pull_requests).toEqual([]);
    expect(queue.selection_result.pr_121_selected).toBe(false);
    expect(queue.router_contract.stale_prs_are_auto_mergeable).toBe(false);
    expect(queue.evidence_policy.stale_pr_is_auto_mergeable).toBe(false);
  });

  test("release gates remain blocked or gated with owner approval required", () => {
    const queue = readQueue();

    expect(queue.release_gates.public_paid_beta).toMatchObject({
      status: "blocked",
      router_selectable: false,
      auto_selectable: false,
      owner_decision_required: true,
      unblocked_by_this_queue: false
    });
    expect(queue.release_gates.public_paid_beta.blockers).toEqual(
      expect.arrayContaining([
        "account_owned_learning_persistence",
        "server_authoritative_entitlements",
        "payment_provider_policy_and_billing_lifecycle",
        "owner_public_launch_signoff"
      ])
    );
    expect(queue.release_gates.private_manual_beta).toMatchObject({
      status: "gated",
      router_selectable: false,
      auto_selectable: false,
      owner_approval_required: true,
      manual_only: true,
      launched_by_this_queue: false
    });

    for (const decision of queue.blocked_human_decisions) {
      expect(decision).toMatchObject({
        status: "blocked_human",
        owner_approval_required: true,
        owner_action_required: true,
        auto_selectable: false,
        implementation_allowed: false
      });
    }
  });

  test("protected surfaces, live mutation, and auto-merge remain disabled", () => {
    const queue = readQueue();

    expect(queue.router_contract).toMatchObject({
      dry_run_only: true,
      live_github_mutations_from_implementation_code: false,
      auto_merge_enabled: false,
      protected_surfaces_block_implementation: true,
      owner_approval_required_for_blocked_human: true
    });
    expect(queue.this_pr).toMatchObject({
      docs_tests_only: true,
      runtime_ui_changes: false,
      account_sync_implementation: false,
      api_routes_added: false,
      payment_or_billing_changes: false,
      workflow_changes: false,
      codeowners_changes: false,
      agents_policy_changes: false,
      dns_or_deployment_changes: false,
      secrets_or_env_changes: false,
      webflow_changes: false,
      cloudflare_worker_changes: false,
      r2_production_object_changes: false,
      production_data_changes: false,
      roadmap_status_changes: false,
      live_github_mutations_from_implementation_code: false,
      auto_merge_enabled: false
    });

    for (const surface of queue.protected_surfaces) {
      expect(surface.blocked, surface.id).toBe(true);
      expect(surface.implementation_allowed, surface.id).toBe(false);
    }
  });

  test("missing, stale, or unknown evidence fails closed", () => {
    const queue = readQueue();

    expect(queue.router_contract).toMatchObject({
      unknown_evidence_ready: false,
      stale_evidence_ready: false
    });
    expect(queue.evidence_policy).toMatchObject({
      unknown_evidence_is_ready: false,
      stale_evidence_is_ready: false,
      stale_pr_is_ready: false,
      requires_actual_artifacts: true,
      unknown_or_stale_evidence_result: "blocked_human",
      owner_queue_post_handoff_audit_actual_evidence_path:
        "docs/factory/owner-queue-post-handoff-audit.v1.json",
      owner_queue_post_handoff_audit_outcome_actual_evidence_path:
        "docs/factory/owner-queue-post-handoff-audit-outcome.v1.json"
    });
    expect(queue.safety_confirmation).toMatchObject({
      unknown_or_stale_evidence_is_not_ready: true
    });
  });

  test("required validation, prompt, and merge recommendation stay safe", () => {
    const queue = readQueue();
    const promptText = queue.codex_prompt_draft.prompt_lines.join("\n");

    expect(queue.required_validation.targeted).toEqual([
      "npm.cmd run test -- tests/factory-owner-queue-post-handoff-audit-outcome.spec.ts tests/factory-owner-minimal-intervention-queue.spec.ts --workers=1",
      "npm.cmd run test -- tests/factory-owner-queue-post-handoff-audit.spec.ts tests/factory-owner-queue-post-handoff-audit-outcome.spec.ts --workers=1"
    ]);
    expect(queue.required_validation.before_finish).toEqual([
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- --workers=1"
    ]);
    expect(queue.codex_prompt_draft.allowed_files).toEqual(
      expect.arrayContaining([
        "docs/factory/owner-queue-post-handoff-audit-outcome.v1.json",
        "docs/factory/owner-queue-post-handoff-audit-outcome.md",
        "tests/factory-owner-queue-post-handoff-audit-outcome.spec.ts"
      ])
    );
    expect(promptText).toContain("PR #152 is merged");
    expect(promptText).toContain("OWNER-QUEUE-POST-HANDOFF-AUDIT must not be selected again");
    expect(promptText).toContain("OWNER-AUDIT-REQUIRED / audit_required");
    expect(queue.merge_recommendation).toMatchObject({
      for_this_docs_tests_packet: "merge_after_required_validation_passes",
      auto_merge_enabled: false,
      live_mutations_enabled: false
    });
    expect(queue.merge_recommendation.no_merge_recommendations).toEqual(
      expect.arrayContaining([
        "Do not reselect POST-MERGE-HANDOFF-GENERATOR-OUTCOME after merged PR #151.",
        "Do not reselect OWNER-QUEUE-POST-HANDOFF-AUDIT after merged PR #152."
      ])
    );
  });

  test("identical input produces identical queue output", () => {
    const queue = readQueue();

    expect(deterministicQueueOutput(queue)).toEqual(
      deterministicQueueOutput(queue)
    );
    expect(JSON.stringify(deterministicQueueOutput(queue))).toBe(
      JSON.stringify(deterministicQueueOutput(readQueue()))
    );
  });
});
