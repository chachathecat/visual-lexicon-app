import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

type OwnerActionOption = {
  id: string;
  label: string;
  resulting_tb_110_status: string;
  private_manual_beta_launched?: boolean;
  private_manual_beta_launched_by_this_packet?: boolean;
  beta_participants_invited?: boolean;
  users_charged?: boolean;
  entitlements_granted?: boolean;
  public_paid_beta_unblocked: boolean;
  owner_approval_required?: boolean;
  explicit_owner_approval_required?: boolean;
  all_prerequisites_required_before_future_action?: boolean;
};

type Tb110Packet = {
  schema_version: string;
  kind: string;
  repository: string;
  task: {
    task_id: string;
    title: string;
    status: string;
    router_candidate_status: string;
    router_selectable: boolean;
    auto_selectable: boolean;
    owner_action_required: boolean;
    owner_approval_required: boolean;
    implementation_allowed: boolean;
    runtime_launch_allowed: boolean;
  };
  packet_scope: {
    docs_tests_only: boolean;
    owner_action_packet: boolean;
    defines_owner_options: boolean;
    defines_required_gates: boolean;
    launches_private_manual_beta: boolean;
    launches_public_paid_beta: boolean;
    runtime_ui_changes: boolean;
    production_or_live_mutation_changes: boolean;
  };
  source_documents: string[];
  source_prs: { number: number; status: string }[];
  owner_action_options: OwnerActionOption[];
  required_prerequisites_before_future_private_manual_beta_action: string[];
  non_actions: Record<string, boolean>;
  pull_request_121: {
    number: number;
    state: string;
    stale: boolean;
    superseded: boolean;
    resulting_status: string;
    router_selectable: boolean;
    auto_selectable: boolean;
    auto_mergeable: boolean;
    implementation_ready: boolean;
    reselected_by_this_packet: boolean;
    live_mutation_performed_by_this_packet: boolean;
  };
  release_gates: {
    private_manual_beta: {
      status: string;
      resulting_status: string;
      owner_action_required: boolean;
      owner_approval_required: boolean;
      manual_only: boolean;
      launched_by_this_packet: boolean;
      participants_invited_by_this_packet: boolean;
      charges_enabled_by_this_packet: boolean;
      entitlements_granted_by_this_packet: boolean;
      required_before_future_action: string[];
    };
    public_paid_beta: {
      status: string;
      resulting_status: string;
      owner_action_required: boolean;
      owner_approval_required: boolean;
      unblocked_by_this_packet: boolean;
      launch_allowed: boolean;
      required_before_unblock: string[];
    };
  };
  invariants: {
    tb_090: {
      status: string;
      router_candidate_status: string;
      router_selectable: boolean;
      auto_selectable: boolean;
      owner_action_required: boolean;
      owner_decision_packet_existing_evidence_only: boolean;
      actual_account_sync_exists: boolean;
      disabled_route_skeleton_runtime_files_approved: boolean;
      route_skeleton_implementation_approved: boolean;
    };
    tb_100: {
      status: string;
      evidence: string;
      router_selectable: boolean;
      auto_selectable: boolean;
    };
    tb_110: {
      status: string;
      router_candidate_status: string;
      owner_action_required: boolean;
      owner_approval_required: boolean;
      router_selectable: boolean;
      auto_selectable: boolean;
      private_manual_beta_launched: boolean;
      public_paid_beta_unblocked: boolean;
    };
  };
  protected_surfaces: Record<string, boolean>;
  deterministic_queue_order: {
    input_state: string;
    sort_keys: string[];
    next_safe_outputs: {
      rank: number;
      id: string;
      task_id?: string;
      title: string;
      auto_selectable: boolean;
      implementation_allowed: boolean;
      live_mutation_allowed: boolean;
    }[];
    excluded_outputs: { id: string; reason: string }[];
  };
  required_validation: { targeted: string[]; before_finish: string[] };
  safety_confirmation: Record<string, boolean>;
};

type OwnerQueue = {
  latest_merged_factory_state: {
    state_label: string;
    tasks: {
      task_id: string;
      resulting_status: string;
      router_candidate_status: string;
      router_selectable: boolean;
      auto_selectable: boolean;
      owner_action_required?: boolean;
      owner_approval_required?: boolean;
    }[];
  };
  open_stale_pull_requests: { number: number }[];
  closed_stale_pull_requests: {
    number: number;
    state: string;
    stale: boolean;
    superseded: boolean;
    resulting_status: string;
    auto_selectable: boolean;
    auto_mergeable: boolean;
    closed_manually_by_owner: boolean;
  }[];
  selection_result: {
    pr_121_selected: boolean;
    tb_090_selected: boolean;
    tb_090_owner_decision_packet_work_selected: boolean;
    public_paid_beta_selected: boolean;
    private_manual_beta_launch_selected: boolean;
    tb_110_owner_action_packet_selected: boolean;
  };
  next_safe_task: { rank: number; id: string; task_id?: string };
  recommended_next_outputs: {
    rank: number;
    id: string;
    task_id?: string;
    auto_selectable: boolean;
    implementation_allowed: boolean;
    live_mutation_allowed: boolean;
  }[];
};

const PACKET_JSON_PATH = [
  "docs",
  "factory",
  "tb-110-private-beta-owner-action-packet.v1.json"
];
const PACKET_MD_PATH = [
  "docs",
  "factory",
  "tb-110-private-beta-owner-action-packet.md"
];
const QUEUE_JSON_PATH = [
  "docs",
  "factory",
  "owner-minimal-intervention-queue.v1.json"
];

const REQUIRED_PREREQUISITES = [
  "current_manual_qa_execution_report",
  "owner_approved_participant_list",
  "participant_disclosure_localStorage_manual_beta_limits",
  "support_privacy_refund_cancellation_note",
  "monitoring_issue_log",
  "pause_criteria",
  "rollback_criteria",
  "manual_entitlement_policy_if_any",
  "explicit_owner_approval",
  "public_paid_beta_remains_blocked"
];

function readJson<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(join(process.cwd(), ...parts), "utf8")) as T;
}

function readPacket() {
  return readJson<Tb110Packet>(...PACKET_JSON_PATH);
}

function readQueue() {
  return readJson<OwnerQueue>(...QUEUE_JSON_PATH);
}

function queueTaskById(queue: OwnerQueue, taskId: string) {
  const task = queue.latest_merged_factory_state.tasks.find(
    (candidate) => candidate.task_id === taskId
  );

  if (!task) {
    throw new Error(`Missing queue task ${taskId}`);
  }

  return task;
}

test.describe("TB-110 private beta owner action packet", () => {
  test("artifact JSON and markdown exist", () => {
    const packet = readPacket();
    const markdown = readFileSync(join(process.cwd(), ...PACKET_MD_PATH), "utf8");

    expect(existsSync(join(process.cwd(), ...PACKET_JSON_PATH))).toBe(true);
    expect(existsSync(join(process.cwd(), ...PACKET_MD_PATH))).toBe(true);
    expect(packet).toMatchObject({
      schema_version: "1.0.0",
      kind: "tb_110_private_beta_owner_action_packet",
      repository: "chachathecat/visual-lexicon-app"
    });
    expect(packet.source_documents).toEqual(
      expect.arrayContaining([
        "docs/factory/owner-minimal-intervention-queue.v1.json",
        "docs/factory/pr-121-stale-superseded-owner-decision.v1.json",
        "docs/PRIVATE_BETA_GATE_PREP.md"
      ])
    );
    expect(markdown).toContain("# TB-110 Private Beta Owner Action Packet");
    expect(markdown).toContain("This packet is docs/tests-only.");
  });

  test("TB-110 remains blocked-human owner-action-required and owner-approval-required", () => {
    const packet = readPacket();

    expect(packet.task).toMatchObject({
      task_id: "TB-110",
      title: "Private Beta Gate",
      status: "blocked_human",
      router_candidate_status: "blocked_human",
      router_selectable: false,
      auto_selectable: false,
      owner_action_required: true,
      owner_approval_required: true,
      implementation_allowed: false,
      runtime_launch_allowed: false
    });
    expect(packet.safety_confirmation).toMatchObject({
      tb_110_remains_blocked_human: true,
      tb_110_owner_action_required: true,
      tb_110_owner_approval_required: true
    });
  });

  test("no private or public beta launch is performed", () => {
    const packet = readPacket();

    expect(packet.packet_scope).toMatchObject({
      docs_tests_only: true,
      launches_private_manual_beta: false,
      launches_public_paid_beta: false,
      runtime_ui_changes: false,
      production_or_live_mutation_changes: false
    });
    expect(packet.release_gates.private_manual_beta).toMatchObject({
      status: "gated",
      resulting_status: "blocked_human",
      launched_by_this_packet: false,
      participants_invited_by_this_packet: false
    });
    expect(packet.release_gates.public_paid_beta).toMatchObject({
      status: "blocked",
      resulting_status: "blocked_human",
      unblocked_by_this_packet: false,
      launch_allowed: false
    });
    expect(packet.safety_confirmation).toMatchObject({
      private_manual_beta_not_launched: true,
      private_manual_beta_remains_gated: true,
      public_paid_beta_not_unblocked: true,
      public_paid_beta_remains_blocked: true
    });
  });

  test("no invite charge entitlement grant payment billing or data mutation is performed", () => {
    const packet = readPacket();

    expect(packet.non_actions).toMatchObject({
      manual_beta_invites_sent: false,
      beta_participants_invited: false,
      users_charged: false,
      entitlements_granted: false,
      payment_or_billing_enabled: false,
      account_data_modified: false,
      auth_or_session_behavior_modified: false,
      database_schema_rls_migrations_modified: false
    });
    expect(packet.release_gates.private_manual_beta).toMatchObject({
      charges_enabled_by_this_packet: false,
      entitlements_granted_by_this_packet: false
    });
    expect(packet.safety_confirmation).toMatchObject({
      no_invites: true,
      no_charges: true,
      no_entitlement_grants: true,
      no_payment_or_billing_enablement: true
    });
  });

  test("owner action options stay non-launching", () => {
    const packet = readPacket();

    expect(packet.owner_action_options.map((option) => option.id)).toEqual([
      "keep_tb_110_blocked_no_private_beta_action",
      "approve_limited_private_manual_beta_readiness_packet",
      "approve_future_limited_private_manual_beta_after_prerequisites"
    ]);

    for (const option of packet.owner_action_options) {
      expect(option.resulting_tb_110_status, option.id).toBe("blocked_human");
      expect(option.public_paid_beta_unblocked, option.id).toBe(false);
      expect(
        option.private_manual_beta_launched ??
          option.private_manual_beta_launched_by_this_packet,
        option.id
      ).toBe(false);
    }
  });

  test("future private manual beta prerequisites are explicit", () => {
    const packet = readPacket();

    expect(
      packet.required_prerequisites_before_future_private_manual_beta_action
    ).toEqual(REQUIRED_PREREQUISITES);
    expect(packet.release_gates.private_manual_beta.required_before_future_action).toEqual(
      REQUIRED_PREREQUISITES
    );
  });

  test("protected surfaces remain untouched", () => {
    const packet = readPacket();
    const protectedSurfaceNames = Object.keys(packet.protected_surfaces);

    expect(protectedSurfaceNames).toEqual(
      expect.arrayContaining([
        "runtime_ui_changes",
        "account_sync_implementation",
        "auth_or_session_behavior_changes",
        "database_schema_rls_migration_or_account_data_changes",
        "entitlement_mutation_changes",
        "payment_or_billing_changes",
        "workflow_changes",
        "codeowners_changes",
        "agents_policy_changes",
        "dns_or_deployment_changes",
        "secrets_or_env_changes",
        "webflow_changes",
        "cloudflare_worker_changes",
        "r2_production_object_changes",
        "production_data_changes",
        "live_github_mutations_from_implementation_code",
        "auto_merge_enabled"
      ])
    );

    for (const [surface, changed] of Object.entries(packet.protected_surfaces)) {
      expect(changed, surface).toBe(false);
    }

    for (const surface of [
      "runtime_ui_touched",
      "production_data_touched",
      "webflow_touched",
      "cloudflare_workers_touched",
      "r2_production_objects_touched",
      "dns_touched",
      "deployment_touched",
      "secrets_touched",
      "workflows_touched",
      "codeowners_touched",
      "agents_md_touched",
      "live_github_mutations_performed",
      "auto_merge_enabled"
    ]) {
      expect(packet.non_actions[surface], surface).toBe(false);
    }
  });

  test("PR #121 is closed stale superseded and not reselected", () => {
    const packet = readPacket();
    const queue = readQueue();
    const pr121 = queue.closed_stale_pull_requests.find(
      (candidate) => candidate.number === 121
    );
    const outputIds = queue.recommended_next_outputs.map((output) => output.id);

    expect(packet.pull_request_121).toMatchObject({
      number: 121,
      state: "closed",
      stale: true,
      superseded: true,
      resulting_status: "stale_not_selectable",
      router_selectable: false,
      auto_selectable: false,
      auto_mergeable: false,
      implementation_ready: false,
      reselected_by_this_packet: false,
      live_mutation_performed_by_this_packet: false
    });
    expect(pr121).toMatchObject({
      number: 121,
      state: "closed",
      stale: true,
      superseded: true,
      resulting_status: "stale_not_selectable",
      auto_selectable: false,
      auto_mergeable: false,
      closed_manually_by_owner: true
    });
    expect(queue.open_stale_pull_requests).toEqual([]);
    expect(queue.selection_result.pr_121_selected).toBe(false);
    expect(outputIds).not.toContain("PR-121-STALE-SUPERSEDED-OWNER-DECISION");
  });

  test("TB-090 TB-100 and TB-110 invariants remain intact", () => {
    const packet = readPacket();
    const queue = readQueue();

    expect(packet.invariants.tb_090).toMatchObject({
      status: "partial_verified",
      router_candidate_status: "blocked_human",
      router_selectable: false,
      auto_selectable: false,
      owner_action_required: true,
      owner_decision_packet_existing_evidence_only: true,
      actual_account_sync_exists: false,
      disabled_route_skeleton_runtime_files_approved: false,
      route_skeleton_implementation_approved: false
    });
    expect(packet.invariants.tb_100).toMatchObject({
      status: "verified",
      evidence: "PR #82",
      router_selectable: false,
      auto_selectable: false
    });
    expect(packet.invariants.tb_110).toMatchObject({
      status: "blocked_human",
      router_candidate_status: "blocked_human",
      owner_action_required: true,
      owner_approval_required: true,
      router_selectable: false,
      auto_selectable: false,
      private_manual_beta_launched: false,
      public_paid_beta_unblocked: false
    });
    expect(queueTaskById(queue, "TB-090")).toMatchObject({
      resulting_status: "partial_verified",
      router_candidate_status: "blocked_human",
      router_selectable: false,
      auto_selectable: false
    });
    expect(queueTaskById(queue, "TB-100")).toMatchObject({
      resulting_status: "verified",
      router_selectable: false,
      auto_selectable: false
    });
    expect(queueTaskById(queue, "TB-110")).toMatchObject({
      resulting_status: "blocked_human",
      router_candidate_status: "blocked_human",
      router_selectable: false,
      auto_selectable: false,
      owner_action_required: true,
      owner_approval_required: true
    });
    expect(queue.selection_result.tb_090_selected).toBe(false);
    expect(queue.selection_result.tb_090_owner_decision_packet_work_selected).toBe(
      false
    );
  });

  test("next safe output ordering is deterministic", () => {
    const packet = readPacket();
    const queue = readQueue();

    expect(packet.deterministic_queue_order).toMatchObject({
      input_state: "post_pr_146_pr_121_closed_stale_superseded",
      sort_keys: ["rank", "id"]
    });
    expect(packet.deterministic_queue_order.next_safe_outputs.map((output) => output.id)).toEqual([
      "TB-110-PRIVATE-BETA-OWNER-ACTION-PACKET",
      "POST-MERGE-HANDOFF-GENERATOR"
    ]);
    expect(queue.next_safe_task).toMatchObject({
      rank: 1,
      id: "TB-110-PRIVATE-BETA-OWNER-ACTION-PACKET",
      task_id: "TB-110"
    });
    expect(queue.recommended_next_outputs.map((output) => output.id)).toEqual([
      "TB-110-PRIVATE-BETA-OWNER-ACTION-PACKET",
      "POST-MERGE-HANDOFF-GENERATOR"
    ]);
    expect(queue.recommended_next_outputs.map((output) => output.rank)).toEqual([
      1,
      2
    ]);
    expect(
      queue.recommended_next_outputs.every(
        (output) =>
          !output.auto_selectable &&
          !output.implementation_allowed &&
          !output.live_mutation_allowed
      )
    ).toBe(true);
    expect(JSON.stringify(packet.deterministic_queue_order.next_safe_outputs)).toBe(
      JSON.stringify([...packet.deterministic_queue_order.next_safe_outputs])
    );
  });

  test("required validation records targeted and full checks", () => {
    const packet = readPacket();

    expect(packet.required_validation.targeted).toEqual([
      "npm.cmd run test -- tests/factory-tb-110-private-beta-owner-action-packet.spec.ts --workers=1",
      "npm.cmd run test -- tests/factory-owner-minimal-intervention-queue.spec.ts --workers=1"
    ]);
    expect(packet.required_validation.before_finish).toEqual([
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- --workers=1"
    ]);
  });
});
