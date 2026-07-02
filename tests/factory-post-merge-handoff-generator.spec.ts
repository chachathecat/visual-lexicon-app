import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

type MergedEvidence = {
  sequence: number;
  number: number;
  state: string;
  merged: boolean;
  merge_commit: string;
  represented: boolean;
  evidence_paths: string[];
  runtime_or_protected_surface_effect: string;
  tb_110_owner_action_packet_selected_after_merge?: boolean;
  screenshot_baseline_updated?: boolean;
  runtime_ui_changed?: boolean;
};

type PostMergeHandoffPacket = {
  schema_version: string;
  kind: string;
  repository: string;
  created_at: string;
  source_documents: string[];
  this_packet: Record<string, boolean | string>;
  merged_evidence: MergedEvidence[];
  selection_result: {
    selected_output: {
      rank: number;
      id: string;
      output_type: string;
      surface: string;
      handoff_documentation_only: boolean;
      auto_selectable: boolean;
      auto_mergeable: boolean;
      implementation_allowed: boolean;
      live_mutation_allowed: boolean;
      owner_action_required: boolean;
      owner_approval_required: boolean;
    };
    selected_implementation_task: null;
    selected_runtime_task: null;
    implementation_task_selected: boolean;
    runtime_task_selected: boolean;
    no_implementation_task_selected: boolean;
    tb_090_selected: boolean;
    tb_090_owner_decision_packet_work_selected: boolean;
    tb_110_owner_action_packet_selected: boolean;
    tb_110_owner_action_packet_work_reselectable: boolean;
    public_paid_beta_selected: boolean;
    private_manual_beta_launch_selected: boolean;
  };
  queue_state_after_pr_148: {
    tb_110_owner_action_packet_selected: boolean;
    next_safe_task_id: string;
    recommended_next_outputs_rank_1: string;
    public_paid_beta_status: string;
    private_manual_beta_status: string;
    owner_approval_required_for_blocked_human_tasks: boolean;
  };
  release_gates: {
    public_paid_beta: {
      status: string;
      unblocked_by_this_packet: boolean;
      launch_allowed: boolean;
      owner_approval_required: boolean;
    };
    private_manual_beta: {
      status: string;
      launched_by_this_packet: boolean;
      participants_invited_by_this_packet: boolean;
      charges_enabled_by_this_packet: boolean;
      entitlements_granted_by_this_packet: boolean;
      owner_approval_required: boolean;
    };
  };
  github_mutation_policy: Record<string, boolean>;
  auto_merge_policy: Record<string, boolean>;
  protected_surface_changes: Record<string, boolean>;
  blocked_surfaces: {
    id: string;
    blocked: boolean;
    implementation_allowed: boolean;
  }[];
  non_actions: Record<string, boolean>;
  determinism: {
    same_input_produces_identical_output: boolean;
    fixed_created_at: string;
    merge_evidence_order: string[];
    sort_keys: string[];
    ranked_output_order: string[];
  };
  safety_confirmation: Record<string, boolean>;
};

type OwnerQueue = {
  selection_result: {
    selected_implementation: null;
    selected_runtime_task: null;
    tb_110_owner_action_packet_selected: boolean;
    post_merge_handoff_generator_selected: boolean;
  };
  next_safe_task: {
    rank: number;
    id: string;
    implementation_allowed: boolean;
    live_mutation_allowed: boolean;
    auto_mergeable: boolean;
  };
  recommended_next_outputs: {
    rank: number;
    id: string;
    implementation_allowed: boolean;
    live_mutation_allowed: boolean;
    auto_mergeable: boolean;
  }[];
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
  router_contract: {
    live_github_mutations_from_implementation_code: boolean;
    auto_merge_enabled: boolean;
  };
};

const PACKET_JSON_PATH = [
  "docs",
  "factory",
  "post-merge-handoff-generator.v1.json"
];
const PACKET_MD_PATH = [
  "docs",
  "factory",
  "post-merge-handoff-generator.md"
];
const QUEUE_JSON_PATH = [
  "docs",
  "factory",
  "owner-minimal-intervention-queue.v1.json"
];

function readJson<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(join(process.cwd(), ...parts), "utf8")) as T;
}

function readPacket() {
  return readJson<PostMergeHandoffPacket>(...PACKET_JSON_PATH);
}

function readQueue() {
  return readJson<OwnerQueue>(...QUEUE_JSON_PATH);
}

function evidenceByPr(packet: PostMergeHandoffPacket, number: number) {
  const evidence = packet.merged_evidence.find(
    (candidate) => candidate.number === number
  );

  if (!evidence) {
    throw new Error(`Missing PR #${number} evidence`);
  }

  return evidence;
}

test.describe("post-merge handoff generator packet", () => {
  test("packet files are valid and deterministic", () => {
    const packet = readPacket();
    const markdown = readFileSync(join(process.cwd(), ...PACKET_MD_PATH), "utf8");

    expect(existsSync(join(process.cwd(), ...PACKET_JSON_PATH))).toBe(true);
    expect(existsSync(join(process.cwd(), ...PACKET_MD_PATH))).toBe(true);
    expect(packet).toMatchObject({
      schema_version: "1.0.0",
      kind: "post_merge_handoff_generator_packet",
      repository: "chachathecat/visual-lexicon-app",
      created_at: "2026-07-01"
    });
    expect(packet.determinism).toMatchObject({
      same_input_produces_identical_output: true,
      fixed_created_at: "2026-07-01",
      merge_evidence_order: ["PR-147", "PR-149", "PR-148"],
      sort_keys: ["sequence", "number"],
      ranked_output_order: ["POST-MERGE-HANDOFF-GENERATOR"]
    });
    expect(packet.merged_evidence.map((evidence) => evidence.sequence)).toEqual([
      1,
      2,
      3
    ]);
    expect(new Set(packet.merged_evidence.map((evidence) => evidence.number)).size).toBe(
      packet.merged_evidence.length
    );
    expect(readPacket()).toEqual(packet);
    expect(markdown).toContain("# Post-Merge Handoff Generator Packet");
    expect(markdown).toContain("PR #147");
    expect(markdown).toContain("PR #149");
    expect(markdown).toContain("PR #148");
  });

  test("required merged PR evidence and SHAs are represented", () => {
    const packet = readPacket();
    const pr147 = evidenceByPr(packet, 147);
    const pr149 = evidenceByPr(packet, 149);
    const pr148 = evidenceByPr(packet, 148);

    expect(pr147).toMatchObject({
      sequence: 1,
      number: 147,
      state: "merged",
      merged: true,
      merge_commit: "b4dd352f8ece4a660d983365ae60169b4c83566d",
      represented: true,
      runtime_or_protected_surface_effect: "none"
    });
    expect(pr147.evidence_paths).toEqual(
      expect.arrayContaining([
        "docs/factory/tb-110-private-beta-owner-action-packet.v1.json",
        "docs/factory/tb-110-private-beta-owner-action-packet.md"
      ])
    );
    expect(pr149).toMatchObject({
      sequence: 2,
      number: 149,
      state: "merged",
      merged: true,
      merge_commit: "fcdd91f7b5cec444d25d35be3a6bdcc38519bcf6",
      represented: true,
      screenshot_baseline_updated: false,
      runtime_ui_changed: false,
      runtime_or_protected_surface_effect: "none"
    });
    expect(pr148).toMatchObject({
      sequence: 3,
      number: 148,
      state: "merged",
      merged: true,
      merge_commit: "4560e556ff682f3813983f4bc4f07c7868255ad9",
      represented: true,
      tb_110_owner_action_packet_selected_after_merge: false,
      runtime_or_protected_surface_effect: "none"
    });
  });

  test("packet selected the generator historically and the current queue moved on", () => {
    const packet = readPacket();
    const queue = readQueue();

    expect(packet.selection_result.selected_output).toMatchObject({
      rank: 1,
      id: "POST-MERGE-HANDOFF-GENERATOR",
      output_type: "handoff_generator_packet",
      surface: "docs_tests_only",
      handoff_documentation_only: true,
      auto_selectable: false,
      auto_mergeable: false,
      implementation_allowed: false,
      live_mutation_allowed: false,
      owner_action_required: true,
      owner_approval_required: true
    });
    expect(packet.selection_result).toMatchObject({
      selected_implementation_task: null,
      selected_runtime_task: null,
      implementation_task_selected: false,
      runtime_task_selected: false,
      no_implementation_task_selected: true,
      tb_090_selected: false,
      tb_090_owner_decision_packet_work_selected: false,
      tb_110_owner_action_packet_selected: false,
      tb_110_owner_action_packet_work_reselectable: false,
      public_paid_beta_selected: false,
      private_manual_beta_launch_selected: false
    });
    expect(queue.next_safe_task).toMatchObject({
      rank: 1,
      id: "OWNER-AUDIT-REQUIRED",
      resulting_status: "audit_required",
      implementation_allowed: false,
      live_mutation_allowed: false,
      auto_mergeable: false
    });
    expect(queue.recommended_next_outputs.map((output) => output.id)).toEqual([
      "OWNER-AUDIT-REQUIRED"
    ]);
    expect(queue.recommended_next_outputs.map((output) => output.id)).not.toContain(
      "POST-MERGE-HANDOFF-GENERATOR"
    );
    expect(queue.recommended_next_outputs.map((output) => output.id)).not.toContain(
      "OWNER-QUEUE-POST-HANDOFF-AUDIT"
    );
    expect(queue.selection_result).toMatchObject({
      selected_implementation: null,
      selected_runtime_task: null,
      tb_110_owner_action_packet_selected: false,
      post_merge_handoff_generator_selected: false
    });
  });

  test("release gates remain blocked or gated", () => {
    const packet = readPacket();
    const queue = readQueue();

    expect(packet.queue_state_after_pr_148).toMatchObject({
      tb_110_owner_action_packet_selected: false,
      next_safe_task_id: "POST-MERGE-HANDOFF-GENERATOR",
      recommended_next_outputs_rank_1: "POST-MERGE-HANDOFF-GENERATOR",
      public_paid_beta_status: "blocked",
      private_manual_beta_status: "gated",
      owner_approval_required_for_blocked_human_tasks: true
    });
    expect(packet.release_gates.public_paid_beta).toMatchObject({
      status: "blocked",
      unblocked_by_this_packet: false,
      launch_allowed: false,
      owner_approval_required: true
    });
    expect(packet.release_gates.private_manual_beta).toMatchObject({
      status: "gated",
      launched_by_this_packet: false,
      participants_invited_by_this_packet: false,
      charges_enabled_by_this_packet: false,
      entitlements_granted_by_this_packet: false,
      owner_approval_required: true
    });
    expect(queue.release_gates.public_paid_beta).toMatchObject({
      status: "blocked",
      unblocked_by_this_queue: false
    });
    expect(queue.release_gates.private_manual_beta).toMatchObject({
      status: "gated",
      launched_by_this_queue: false
    });
  });

  test("protected surfaces remain false or blocked", () => {
    const packet = readPacket();

    for (const [surface, changed] of Object.entries(
      packet.protected_surface_changes
    )) {
      expect(changed, surface).toBe(false);
    }

    for (const surface of packet.blocked_surfaces) {
      expect(surface.blocked, surface.id).toBe(true);
      expect(surface.implementation_allowed, surface.id).toBe(false);
    }

    expect(packet.this_packet).toMatchObject({
      docs_tests_only: true,
      handoff_documentation_only: true,
      runtime_ui_changes: false,
      app_route_changes: false,
      asset_changes: false,
      font_changes: false,
      auth_changes: false,
      billing_changes: false,
      database_changes: false,
      api_changes: false,
      middleware_changes: false,
      workflow_changes: false,
      codeowners_changes: false,
      agents_policy_changes: false,
      dns_or_deployment_changes: false,
      secrets_changes: false,
      webflow_changes: false,
      cloudflare_worker_changes: false,
      r2_production_object_changes: false,
      production_data_changes: false,
      roadmap_status_changes: false
    });
  });

  test("live mutation and auto-merge fields are disabled", () => {
    const packet = readPacket();
    const queue = readQueue();

    for (const [field, enabled] of Object.entries(packet.github_mutation_policy)) {
      expect(enabled, field).toBe(false);
    }

    for (const [field, enabled] of Object.entries(packet.auto_merge_policy)) {
      expect(enabled, field).toBe(false);
    }

    for (const [action, performed] of Object.entries(packet.non_actions)) {
      expect(performed, action).toBe(false);
    }

    expect(queue.router_contract).toMatchObject({
      live_github_mutations_from_implementation_code: false,
      auto_merge_enabled: false
    });
    expect(packet.safety_confirmation).toMatchObject({
      docs_tests_only: true,
      pr_147_merged_evidence_represented: true,
      pr_149_merged_ci_stabilization_evidence_represented: true,
      pr_148_merged_owner_queue_outcome_evidence_represented: true,
      tb_110_owner_action_packet_not_reselected: true,
      post_merge_handoff_generator_is_current_rank_1_safe_output: true,
      handoff_documentation_only: true,
      no_implementation_task_selected: true,
      no_live_github_mutation_allowed: true,
      auto_merge_remains_disabled: true,
      public_paid_beta_remains_blocked: true,
      private_manual_beta_remains_gated: true,
      owner_approval_required_for_blocked_human_tasks: true,
      protected_surfaces_unchanged: true
    });
  });
});
