import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

type DecisionOption = {
  id: string;
  rank: number;
  label: string;
  selected_by_this_packet: boolean;
  effect: string;
  account_sync_implementation_approved: boolean;
  disabled_route_skeleton_approved: boolean;
  future_runtime_route_skeleton_implementation_approved: boolean;
};

type OwnerDecisionPacket = {
  schema_version: string;
  kind: string;
  repository: string;
  task: {
    task_id: string;
    current_resulting_status: string;
    current_router_candidate_status: string;
    router_selectable: boolean;
    owner_action_required: boolean;
    not_selectable_for_automatic_implementation: boolean;
  };
  packet_scope: {
    satisfies_previous_factory_output: boolean;
    previous_factory_output: string;
    satisfies_only_previous_factory_output: boolean;
    implementation_authorization: string;
    selected_decision_option_id: string;
    router_reselectable: boolean;
    auto_selectable: boolean;
  };
  decision_options: DecisionOption[];
  claims: {
    actual_account_sync_exists: boolean;
    disabled_route_skeleton_files_exist: boolean;
    api_route_handlers_exist: boolean;
    future_runtime_route_skeleton_implementation_approved: boolean;
    account_sync_implementation_approved: boolean;
    public_paid_beta_unblocked: boolean;
    private_manual_beta_launched: boolean;
  };
  actual_route_skeleton_files: {
    path: string;
    exists: boolean;
    created_by_this_packet: boolean;
    approved_by_this_packet: boolean;
  }[];
  status_effects: {
    tb_090_resulting_status: string;
    tb_090_router_candidate_status: string;
    tb_090_owner_action_required: boolean;
    tb_090_auto_selectable: boolean;
    tb_100_status: string;
    tb_100_evidence: string;
    tb_110_resulting_status: string;
    tb_110_owner_action_required: boolean;
    pr_121_status: string;
    public_paid_beta_status: string;
    private_manual_beta_status: string;
  };
  protected_surfaces: Record<string, boolean>;
  release_gates: {
    public_paid_beta: {
      status: string;
      unblocked_by_this_packet: boolean;
      owner_decision_required: boolean;
    };
    private_manual_beta: {
      status: string;
      launched_by_this_packet: boolean;
      owner_approval_required: boolean;
      manual_only: boolean;
    };
  };
  evidence: {
    markdown_summary: string;
    json_artifact: string;
    verification_artifact: string;
    status_overlay: string;
  };
  safety_confirmation: Record<string, boolean>;
};

type StatusOverlay = {
  source_documents: string[];
  this_pr: {
    expected_files: string[];
    runtime_ui_changes: boolean;
    account_sync_implementation: boolean;
    payment_or_billing_changes: boolean;
    roadmap_status_changes: boolean;
    workflow_changes: boolean;
    dns_or_deployment_changes: boolean;
    production_data_changes: boolean;
  };
  task_statuses: {
    task_id: string;
    resulting_status: string;
    router_candidate_status: string;
    router_selectable: boolean;
    owner_action_required?: boolean;
    not_selectable_for_automatic_implementation?: boolean;
    owner_decision_packet?: {
      exists: boolean;
      status: string;
      artifact_present_in_this_pr: boolean;
      artifact_source: string;
      artifact_markdown: string;
      outcome: string;
      satisfies_previous_factory_output: boolean;
      selected_decision_option_id: string;
      router_reselectable: boolean;
      claims_actual_account_sync_exists: boolean;
      claims_disabled_route_skeleton_files_exist: boolean;
      claims_api_route_handlers_exist: boolean;
      approves_account_sync_implementation: boolean;
      creates_disabled_route_skeleton_files: boolean;
      approves_future_runtime_route_skeleton_implementation: boolean;
    };
  }[];
  owner_decision_packets: {
    id: string;
    task_id: string;
    status: string;
    artifact_present_in_this_pr: boolean;
    artifact_source: string;
    artifact_markdown: string;
    merged: boolean;
    merge_status: string;
    satisfies_previous_factory_output: boolean;
    selected_decision_option_id: string;
    router_selectable: boolean;
    auto_selectable: boolean;
    reselect_for_factory_output: boolean;
    claims_actual_account_sync_exists: boolean;
    claims_disabled_route_skeleton_files_exist: boolean;
    claims_api_route_handlers_exist: boolean;
    approves_account_sync_implementation: boolean;
    creates_disabled_route_skeleton_files: boolean;
    approves_future_runtime_route_skeleton_implementation: boolean;
    public_paid_beta_effect: string;
    private_manual_beta_effect: string;
  }[];
  stale_open_pull_requests: {
    number: number;
    state: string;
    stale: boolean;
    auto_selectable: boolean;
    auto_mergeable: boolean;
  }[];
  release_gates: {
    public_paid_beta: {
      status: string;
      router_selectable: boolean;
      owner_decision_required: boolean;
    };
    private_manual_beta: {
      status: string;
      manual_only: boolean;
      router_selectable: boolean;
      owner_decision_required: boolean;
    };
  };
  next_safe_factory_outputs: {
    id: string;
    title: string;
    recommendation: string;
    router_selectable: boolean;
    auto_selectable: boolean;
  }[];
};

const PACKET_JSON_PATH = [
  "docs",
  "factory",
  "tb-090-owner-decision-packet.v1.json"
];
const PACKET_MD_PATH = [
  "docs",
  "factory",
  "tb-090-owner-decision-packet.md"
];
const PACKET_JSON_SLASH = "docs/factory/tb-090-owner-decision-packet.v1.json";
const PACKET_MD_SLASH = "docs/factory/tb-090-owner-decision-packet.md";

function readJson<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(join(process.cwd(), ...parts), "utf8")) as T;
}

function readPacket(): OwnerDecisionPacket {
  return readJson(...PACKET_JSON_PATH);
}

function readOverlay(): StatusOverlay {
  return readJson("docs", "factory", "track-b-product-backlog-status.v1.json");
}

function taskStatusById(overlay: StatusOverlay, taskId: string) {
  const task = overlay.task_statuses.find(
    (candidate) => candidate.task_id === taskId
  );

  if (!task) {
    throw new Error(`Missing task status ${taskId}`);
  }

  return task;
}

test.describe("TB-090 owner decision packet", () => {
  test("artifact files exist and describe TB-090", () => {
    const packet = readPacket();
    const markdown = readFileSync(join(process.cwd(), ...PACKET_MD_PATH), "utf8");

    expect(existsSync(join(process.cwd(), ...PACKET_JSON_PATH))).toBe(true);
    expect(existsSync(join(process.cwd(), ...PACKET_MD_PATH))).toBe(true);
    expect(packet).toMatchObject({
      schema_version: "1.0.0",
      kind: "tb_090_owner_decision_packet",
      repository: "chachathecat/visual-lexicon-app"
    });
    expect(packet.task).toMatchObject({
      task_id: "TB-090",
      current_resulting_status: "partial_verified",
      current_router_candidate_status: "blocked_human",
      router_selectable: false,
      owner_action_required: true,
      not_selectable_for_automatic_implementation: true
    });
    expect(markdown).toContain("# TB-090 Owner Decision Packet");
    expect(markdown).toContain(
      "The packet satisfies only the prior owner-decision-packet factory output."
    );
  });

  test("packet satisfies only the previous owner decision packet output", () => {
    const packet = readPacket();
    const selected = packet.decision_options.find(
      (option) => option.selected_by_this_packet
    );

    expect(packet.packet_scope).toMatchObject({
      satisfies_previous_factory_output: true,
      previous_factory_output: "produce_tb_090_owner_decision_packet",
      satisfies_only_previous_factory_output: true,
      implementation_authorization: "none",
      selected_decision_option_id:
        "keep_tb_090_blocked_no_runtime_route_skeleton",
      router_reselectable: false,
      auto_selectable: false
    });
    expect(packet.decision_options.map((option) => option.id)).toEqual([
      "keep_tb_090_blocked_no_runtime_route_skeleton",
      "approve_future_disabled_route_skeleton_pr",
      "reject_route_skeleton_work_keep_account_sync_deferred"
    ]);
    expect(selected).toMatchObject({
      id: "keep_tb_090_blocked_no_runtime_route_skeleton",
      account_sync_implementation_approved: false,
      disabled_route_skeleton_approved: false,
      future_runtime_route_skeleton_implementation_approved: false
    });
  });

  test("packet does not claim account sync routes or future runtime approval", () => {
    const packet = readPacket();

    expect(packet.claims).toMatchObject({
      actual_account_sync_exists: false,
      disabled_route_skeleton_files_exist: false,
      api_route_handlers_exist: false,
      future_runtime_route_skeleton_implementation_approved: false,
      account_sync_implementation_approved: false,
      public_paid_beta_unblocked: false,
      private_manual_beta_launched: false
    });

    for (const routeFile of packet.actual_route_skeleton_files) {
      expect(routeFile).toMatchObject({
        exists: false,
        created_by_this_packet: false,
        approved_by_this_packet: false
      });
      expect(existsSync(join(process.cwd(), routeFile.path)), routeFile.path).toBe(
        false
      );
    }

    expect(packet.protected_surfaces).toMatchObject({
      runtime_ui_changes: false,
      account_sync_implementation: false,
      disabled_route_skeleton_files_created: false,
      api_route_handlers_added: false,
      auth_or_session_behavior_changes: false,
      middleware_changes: false,
      database_schema_rls_migration_or_account_data_changes: false,
      entitlement_mutation_changes: false,
      payment_or_billing_changes: false,
      workflow_changes: false,
      dns_or_deployment_changes: false,
      secrets_or_env_changes: false,
      webflow_changes: false,
      cloudflare_worker_changes: false,
      r2_production_object_changes: false,
      production_data_changes: false,
      roadmap_status_changes: false
    });
  });

  test("status overlay cites the packet artifact as TB-090 evidence", () => {
    const overlay = readOverlay();
    const tb090 = taskStatusById(overlay, "TB-090");
    const packet = overlay.owner_decision_packets.find(
      (candidate) => candidate.id === "TB-090-OWNER-DECISION-PACKET"
    );

    expect(overlay.source_documents).toEqual(
      expect.arrayContaining([PACKET_MD_SLASH, PACKET_JSON_SLASH])
    );
    expect(overlay.this_pr.expected_files).toEqual(
      expect.arrayContaining([
        PACKET_JSON_SLASH,
        PACKET_MD_SLASH,
        "tests/factory-tb-090-owner-decision-packet.spec.ts"
      ])
    );
    expect(tb090.owner_decision_packet).toMatchObject({
      exists: true,
      status: "artifact_exists",
      artifact_present_in_this_pr: true,
      artifact_source: PACKET_JSON_SLASH,
      artifact_markdown: PACKET_MD_SLASH,
      outcome: "packet_satisfies_previous_factory_output_only",
      satisfies_previous_factory_output: true,
      selected_decision_option_id:
        "keep_tb_090_blocked_no_runtime_route_skeleton",
      router_reselectable: false,
      claims_actual_account_sync_exists: false,
      claims_disabled_route_skeleton_files_exist: false,
      claims_api_route_handlers_exist: false,
      approves_account_sync_implementation: false,
      creates_disabled_route_skeleton_files: false,
      approves_future_runtime_route_skeleton_implementation: false
    });
    expect(packet).toMatchObject({
      task_id: "TB-090",
      status: "artifact_exists",
      artifact_present_in_this_pr: true,
      artifact_source: PACKET_JSON_SLASH,
      artifact_markdown: PACKET_MD_SLASH,
      merged: false,
      merge_status: "pending_pr_144_merge",
      satisfies_previous_factory_output: true,
      reselect_for_factory_output: false,
      router_selectable: false,
      auto_selectable: false
    });
  });

  test("TB-090 owner decision packet work is not reselected", () => {
    const overlay = readOverlay();
    const outputText = overlay.next_safe_factory_outputs
      .map((output) => `${output.id} ${output.title} ${output.recommendation}`)
      .join("\n");

    expect(overlay.next_safe_factory_outputs.map((output) => output.id)).toEqual(
      [
        "OWNER-MINIMAL-INTERVENTION-QUEUE-PACKET",
        "PR-121-STALE-SUPERSEDED-OWNER-DECISION",
        "TB-110-PRIVATE-BETA-OWNER-ACTION-PACKET"
      ]
    );
    expect(outputText).not.toMatch(/produce an owner[- ]decision packet/i);
    expect(outputText).not.toMatch(/TB-090 owner[- ]decision packet/i);
    expect(
      overlay.next_safe_factory_outputs.some(
        (output) => output.id === "TB-090-OWNER-DECISION-PACKET"
      )
    ).toBe(false);
    expect(
      overlay.next_safe_factory_outputs.every(
        (output) => !output.router_selectable && !output.auto_selectable
      )
    ).toBe(true);
  });

  test("release and backlog status effects remain blocked or gated", () => {
    const packet = readPacket();
    const overlay = readOverlay();
    const tb110 = taskStatusById(overlay, "TB-110");
    const pr121 = overlay.stale_open_pull_requests.find(
      (candidate) => candidate.number === 121
    );

    expect(packet.status_effects).toMatchObject({
      tb_090_resulting_status: "partial_verified",
      tb_090_router_candidate_status: "blocked_human",
      tb_090_owner_action_required: true,
      tb_090_auto_selectable: false,
      tb_100_status: "verified",
      tb_100_evidence: "PR #82",
      tb_110_resulting_status: "blocked_human",
      tb_110_owner_action_required: true,
      pr_121_status: "stale_open_not_auto_selectable",
      public_paid_beta_status: "blocked",
      private_manual_beta_status: "gated"
    });
    expect(tb110).toMatchObject({
      resulting_status: "blocked_human",
      router_candidate_status: "blocked_human",
      router_selectable: false,
      owner_action_required: true
    });
    expect(pr121).toMatchObject({
      state: "open",
      stale: true,
      auto_selectable: false,
      auto_mergeable: false
    });
    expect(overlay.release_gates.public_paid_beta).toMatchObject({
      status: "blocked",
      router_selectable: false,
      owner_decision_required: true
    });
    expect(overlay.release_gates.private_manual_beta).toMatchObject({
      status: "blocked_human",
      manual_only: true,
      router_selectable: false,
      owner_decision_required: true
    });
    expect(packet.release_gates.public_paid_beta).toMatchObject({
      status: "blocked",
      unblocked_by_this_packet: false,
      owner_decision_required: true
    });
  });
});
