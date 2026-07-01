import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

type QueueOutput = {
  rank: number;
  id: string;
  related_pr_number?: number;
  task_id?: string;
  title: string;
  output_type: string;
  router_candidate_status: string;
  router_selectable: boolean;
  auto_selectable: boolean;
  auto_mergeable: boolean;
  implementation_allowed: boolean;
  live_mutation_allowed: boolean;
  owner_decision_required: boolean;
  owner_action_required: boolean;
  recommendation: string;
};

type OwnerMinimalInterventionQueue = {
  schema_version: string;
  kind: string;
  repository: string;
  source_documents: string[];
  this_pr: {
    docs_tests_only: boolean;
    runtime_ui_changes: boolean;
    account_sync_implementation: boolean;
    api_routes_added: boolean;
    auth_or_session_behavior_changes: boolean;
    middleware_changes: boolean;
    database_schema_rls_migration_or_account_data_changes: boolean;
    entitlement_mutation_changes: boolean;
    payment_or_billing_changes: boolean;
    workflow_changes: boolean;
    codeowners_changes: boolean;
    agents_policy_changes: boolean;
    dns_or_deployment_changes: boolean;
    secrets_or_env_changes: boolean;
    webflow_changes: boolean;
    cloudflare_worker_changes: boolean;
    r2_production_object_changes: boolean;
    production_data_changes: boolean;
    roadmap_status_changes: boolean;
    live_github_mutations_from_implementation_code: boolean;
    auto_merge_enabled: boolean;
    expected_files: string[];
  };
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
      evidence_paths: string[];
      runtime_or_protected_surface_effect: string;
    }[];
    tasks: {
      task_id: string;
      title: string;
      resulting_status: string;
      router_candidate_status: string;
      router_selectable: boolean;
      auto_selectable: boolean;
      owner_action_required?: boolean;
      owner_decision_packet_exists?: boolean;
      owner_decision_packet_is_actual_evidence?: boolean;
      owner_decision_packet_path?: string;
      account_sync_implementation_exists?: boolean;
      account_sync_implementation_approved?: boolean;
      disabled_route_skeleton_runtime_files_approved?: boolean;
      tb_090_owner_decision_packet_work_reselectable?: boolean;
      evidence?: string;
    }[];
  };
  open_stale_pull_requests: {
    id: string;
    number: number;
    state: string;
    stale: boolean;
    resulting_status: string;
    router_selectable: boolean;
    auto_selectable: boolean;
    auto_mergeable: boolean;
    owner_decision_required: boolean;
    owner_action_required: boolean;
    mergeable_state: string;
  }[];
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
    mergeable_state: string;
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
      required_before_unblock: string[];
    };
  };
  protected_surfaces: {
    id: string;
    blocked: boolean;
    implementation_allowed: boolean;
    examples: string[];
  }[];
  evidence_policy: {
    unknown_evidence_is_ready: boolean;
    stale_evidence_is_ready: boolean;
    stale_pr_is_ready: boolean;
    stale_pr_is_auto_mergeable: boolean;
    requires_actual_artifacts: boolean;
    tb_090_owner_decision_packet_actual_evidence_path: string;
    unknown_or_stale_evidence_result: string;
  };
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
  post_merge_next_action_summary: {
    after_this_packet_merges: string[];
    do_not_do: string[];
  };
  safety_confirmation: Record<string, boolean>;
};

type Tb090OwnerDecisionPacket = {
  schema_version: string;
  kind: string;
  packet_scope: {
    satisfies_previous_factory_output: boolean;
    implementation_authorization: string;
    router_reselectable: boolean;
    auto_selectable: boolean;
  };
  claims: {
    actual_account_sync_exists: boolean;
    disabled_route_skeleton_files_exist: boolean;
    api_route_handlers_exist: boolean;
    account_sync_implementation_approved: boolean;
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
const TB_090_PACKET_PATH = [
  "docs",
  "factory",
  "tb-090-owner-decision-packet.v1.json"
];

function readJson<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(join(process.cwd(), ...parts), "utf8")) as T;
}

function readQueue(): OwnerMinimalInterventionQueue {
  return readJson(...QUEUE_JSON_PATH);
}

function readTb090Packet(): Tb090OwnerDecisionPacket {
  return readJson(...TB_090_PACKET_PATH);
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

function blockedDecisionById(
  queue: OwnerMinimalInterventionQueue,
  id: string
) {
  const decision = queue.blocked_human_decisions.find(
    (candidate) => candidate.id === id
  );

  if (!decision) {
    throw new Error(`Missing blocked-human decision ${id}`);
  }

  return decision;
}

function deterministicQueueOutput(queue: OwnerMinimalInterventionQueue) {
  return {
    latestMergedPrs: [...queue.latest_merged_factory_state.merged_factory_prs]
      .sort((left, right) => left.number - right.number)
      .map((pr) => ({
        number: pr.number,
        state: pr.state,
        merged: pr.merged
      })),
    stalePrs: [
      ...queue.open_stale_pull_requests,
      ...queue.closed_stale_pull_requests
    ]
      .sort((left, right) => left.number - right.number)
      .map((pr) => ({
        number: pr.number,
        state: pr.state,
        stale: pr.stale,
        auto_selectable: pr.auto_selectable,
        auto_mergeable: pr.auto_mergeable
      })),
    nextOutputs: [...queue.recommended_next_outputs]
      .sort((left, right) => {
        const byRank = left.rank - right.rank;

        return byRank === 0 ? left.id.localeCompare(right.id) : byRank;
      })
      .map((output) => ({
        rank: output.rank,
        id: output.id,
        auto_selectable: output.auto_selectable,
        implementation_allowed: output.implementation_allowed,
        live_mutation_allowed: output.live_mutation_allowed
      })),
    blockedHumanIds: [...queue.blocked_human_decisions]
      .map((decision) => decision.id)
      .sort()
  };
}

test.describe("owner minimal-intervention queue", () => {
  test("artifact files exist and summarize the post-PR #146 state", () => {
    const queue = readQueue();
    const markdown = readFileSync(join(process.cwd(), ...QUEUE_MD_PATH), "utf8");
    const pr146 = queue.latest_merged_factory_state.merged_factory_prs.find(
      (pr) => pr.number === 146
    );

    expect(existsSync(join(process.cwd(), ...QUEUE_JSON_PATH))).toBe(true);
    expect(existsSync(join(process.cwd(), ...QUEUE_MD_PATH))).toBe(true);
    expect(queue).toMatchObject({
      schema_version: "1.0.0",
      kind: "owner_minimal_intervention_queue",
      repository: "chachathecat/visual-lexicon-app"
    });
    expect(queue.this_pr).toMatchObject({
      docs_tests_only: true,
      runtime_ui_changes: false,
      account_sync_implementation: false,
      api_routes_added: false,
      live_github_mutations_from_implementation_code: false,
      auto_merge_enabled: false
    });
    expect(pr146).toMatchObject({
      number: 146,
      state: "merged",
      merged: true,
      runtime_or_protected_surface_effect: "none"
    });
    expect(markdown).toContain("# Owner Minimal-Intervention Queue");
    expect(markdown).toContain("PR #146 is merged.");
    expect(markdown).toContain("PR #121 has been manually closed");
    expect(markdown).toContain("TB-090 remains `partial_verified`");
  });

  test("PR #121 is listed as closed stale superseded and not reselected", () => {
    const queue = readQueue();
    const pr121 = queue.closed_stale_pull_requests.find(
      (pr) => pr.number === 121
    );
    const outputIds = queue.recommended_next_outputs.map((output) => output.id);

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
    expect(outputIds).not.toContain("PR-121-STALE-SUPERSEDED-OWNER-DECISION");
    expect(queue.router_contract.stale_prs_are_auto_mergeable).toBe(false);
    expect(queue.evidence_policy.stale_pr_is_auto_mergeable).toBe(false);
  });

  test("TB-090 and TB-090 owner-decision-packet work are not reselected", () => {
    const queue = readQueue();
    const tb090 = taskById(queue, "TB-090");
    const tb090Packet = readTb090Packet();
    const outputText = queue.recommended_next_outputs
      .map((output) => `${output.id} ${output.title} ${output.recommendation}`)
      .join("\n");

    expect(tb090).toMatchObject({
      resulting_status: "partial_verified",
      router_candidate_status: "blocked_human",
      router_selectable: false,
      auto_selectable: false,
      owner_action_required: true,
      owner_decision_packet_exists: true,
      owner_decision_packet_is_actual_evidence: true,
      account_sync_implementation_exists: false,
      account_sync_implementation_approved: false,
      disabled_route_skeleton_runtime_files_approved: false,
      tb_090_owner_decision_packet_work_reselectable: false
    });
    expect(tb090Packet).toMatchObject({
      schema_version: "1.0.0",
      kind: "tb_090_owner_decision_packet",
      packet_scope: {
        satisfies_previous_factory_output: true,
        implementation_authorization: "none",
        router_reselectable: false,
        auto_selectable: false
      },
      claims: {
        actual_account_sync_exists: false,
        disabled_route_skeleton_files_exist: false,
        api_route_handlers_exist: false,
        account_sync_implementation_approved: false
      }
    });
    expect(queue.selection_result.tb_090_selected).toBe(false);
    expect(queue.selection_result.tb_090_owner_decision_packet_work_selected).toBe(
      false
    );
    expect(
      queue.recommended_next_outputs.some((output) => output.task_id === "TB-090")
    ).toBe(false);
    expect(outputText).not.toMatch(/TB-090 owner[- ]decision packet/i);
    expect(outputText).not.toMatch(/route skeleton implementation/i);
  });

  test("account sync implementation is not selected", () => {
    const queue = readQueue();
    const selectedText = [
      queue.next_safe_task.id,
      ...queue.recommended_next_outputs.map((output) => output.id)
    ].join("\n");

    expect(queue.selection_result).toMatchObject({
      selected_implementation: null,
      selected_runtime_task: null,
      account_sync_implementation_selected: false
    });
    expect(queue.this_pr.account_sync_implementation).toBe(false);
    expect(queue.this_pr.api_routes_added).toBe(false);
    expect(selectedText).not.toMatch(/ACCOUNT-SYNC-IMPLEMENTATION/i);
    expect(selectedText).not.toMatch(/ROUTE-SKELETON/i);
  });

  test("public paid beta remains blocked and private manual beta remains gated", () => {
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
    expect(queue.selection_result.public_paid_beta_selected).toBe(false);
    expect(queue.selection_result.private_manual_beta_launch_selected).toBe(
      false
    );
  });

  test("protected surfaces remain blocked", () => {
    const queue = readQueue();
    const protectedSurfaceIds = queue.protected_surfaces.map(
      (surface) => surface.id
    );

    expect(queue.router_contract.protected_surfaces_block_implementation).toBe(
      true
    );
    expect(protectedSurfaceIds).toEqual(
      expect.arrayContaining([
        "runtime_ui",
        "account_sync",
        "auth_session_middleware",
        "database_account_data",
        "entitlements_payment_billing",
        "ops_and_production_surfaces"
      ])
    );

    for (const surface of queue.protected_surfaces) {
      expect(surface.blocked, surface.id).toBe(true);
      expect(surface.implementation_allowed, surface.id).toBe(false);
    }

    expect(queue.this_pr).toMatchObject({
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
      roadmap_status_changes: false
    });
  });

  test("owner approval is required for blocked-human items", () => {
    const queue = readQueue();

    expect(queue.router_contract.owner_approval_required_for_blocked_human).toBe(
      true
    );

    expect(queue.blocked_human_decisions.some((item) => item.id === "PR-121")).toBe(
      false
    );

    for (const id of [
      "TB-090",
      "TB-110",
      "PUBLIC-PAID-BETA",
      "PRIVATE-MANUAL-BETA"
    ]) {
      expect(blockedDecisionById(queue, id)).toMatchObject({
        status: "blocked_human",
        owner_approval_required: true,
        owner_action_required: true,
        auto_selectable: false,
        implementation_allowed: false
      });
    }
  });

  test("next outputs are ordered deterministically after PR #146 and PR #121 closure", () => {
    const queue = readQueue();

    expect(queue.next_safe_task).toMatchObject({
      rank: 1,
      id: "TB-110-PRIVATE-BETA-OWNER-ACTION-PACKET",
      task_id: "TB-110",
      router_selectable: false,
      auto_selectable: false,
      auto_mergeable: false,
      implementation_allowed: false,
      live_mutation_allowed: false,
      owner_decision_required: true
    });
    expect(queue.recommended_next_outputs.map((output) => output.id)).toEqual([
      "TB-110-PRIVATE-BETA-OWNER-ACTION-PACKET",
      "POST-MERGE-HANDOFF-GENERATOR"
    ]);
    expect(queue.recommended_next_outputs.map((output) => output.rank)).toEqual([
      1,
      2
    ]);
    expect(queue.selection_result.tb_110_owner_action_packet_selected).toBe(true);
    expect(
      queue.recommended_next_outputs.every(
        (output) =>
          !output.router_selectable &&
          !output.auto_selectable &&
          !output.auto_mergeable &&
          !output.implementation_allowed &&
          !output.live_mutation_allowed
      )
    ).toBe(true);
  });

  test("unknown or stale evidence is not treated as ready", () => {
    const queue = readQueue();

    expect(queue.router_contract).toMatchObject({
      unknown_evidence_ready: false,
      stale_evidence_ready: false
    });
    expect(queue.evidence_policy).toMatchObject({
      unknown_evidence_is_ready: false,
      stale_evidence_is_ready: false,
      stale_pr_is_ready: false,
      unknown_or_stale_evidence_result: "blocked_human"
    });
    expect(queue.safety_confirmation.unknown_or_stale_evidence_is_not_ready).toBe(
      true
    );
  });

  test("required validation, Codex prompt, and merge recommendation stay safe", () => {
    const queue = readQueue();
    const promptText = queue.codex_prompt_draft.prompt_lines.join("\n");

    expect(queue.required_validation.before_finish).toEqual([
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- --workers=1"
    ]);
    expect(queue.required_validation.targeted).toEqual([
      "npm.cmd run test -- tests/factory-owner-minimal-intervention-queue.spec.ts --workers=1"
    ]);
    expect(queue.codex_prompt_draft).toMatchObject({
      title: "TB-110 private beta owner action packet",
      allowed_files: [
        "docs/factory/tb-110-private-beta-owner-action-packet.v1.json",
        "docs/factory/tb-110-private-beta-owner-action-packet.md",
        "tests/factory-tb-110-private-beta-owner-action-packet.spec.ts",
        "docs/factory/owner-minimal-intervention-queue.v1.json",
        "docs/factory/owner-minimal-intervention-queue.md",
        "tests/factory-owner-minimal-intervention-queue.spec.ts"
      ]
    });
    expect(promptText).toContain("docs/tests-only");
    expect(promptText).toContain("PR #121 remains closed as stale/superseded");
    expect(promptText).toContain("Do not launch private/manual beta");
    expect(promptText).toContain("Public paid beta remains blocked");
    expect(queue.merge_recommendation).toMatchObject({
      for_this_docs_tests_packet: "merge_after_required_validation_passes",
      auto_merge_enabled: false,
      live_mutations_enabled: false
    });
    expect(queue.merge_recommendation.no_merge_recommendations).toEqual(
      expect.arrayContaining([
        "Do not merge PR #121 automatically.",
        "Do not merge any packet that touches protected surfaces."
      ])
    );
    expect(queue.safety_confirmation).toMatchObject({
      pr_121_closed_stale_superseded_not_reselected: true,
      tb_110_owner_action_packet_is_next_safe_output: true
    });
  });

  test("identical input produces identical queue output", () => {
    const queue = readQueue();

    expect(deterministicQueueOutput(queue)).toEqual(
      deterministicQueueOutput(queue)
    );
    expect(JSON.stringify(deterministicQueueOutput(queue))).toBe(
      JSON.stringify(deterministicQueueOutput(queue))
    );
  });
});
