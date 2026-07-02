import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

type Outcome = {
  schema_version: string;
  kind: string;
  repository: string;
  merged_pull_request: {
    number: number;
    state: string;
    merged: boolean;
    merge_commit: string;
    runtime_or_protected_surface_effect: string;
  };
  evidence: {
    tb_110_owner_action_packet_exists: boolean;
    tb_110_owner_action_packet_is_actual_evidence: boolean;
    tb_110_owner_action_packet_path: string;
    tb_110_owner_action_packet_markdown_path: string;
    tb_110_owner_action_packet_test_path: string;
  };
  queue_reconciliation: {
    tb_110_owner_action_packet_work_reselectable: boolean;
    tb_110_owner_action_packet_selected: boolean;
    next_safe_task_id: string;
    recommended_next_outputs_rank_1: string;
  };
  invariants: {
    tb_110: {
      status: string;
      router_candidate_status: string;
      owner_action_required: boolean;
      owner_approval_required: boolean;
      auto_selectable: boolean;
      private_manual_beta_launched: boolean;
      public_paid_beta_unblocked: boolean;
    };
    tb_090: {
      status: string;
      router_candidate_status: string;
      auto_selectable: boolean;
      account_sync_implementation_selected: boolean;
    };
    tb_100: {
      status: string;
      evidence: string;
      auto_selectable: boolean;
    };
    pull_request_121: {
      state: string;
      stale: boolean;
      superseded: boolean;
      reselected: boolean;
      auto_mergeable: boolean;
    };
  };
  release_gates: {
    private_manual_beta: {
      status: string;
      launched_by_this_outcome: boolean;
      participants_invited_by_this_outcome: boolean;
      charges_enabled_by_this_outcome: boolean;
      entitlements_granted_by_this_outcome: boolean;
    };
    public_paid_beta: {
      status: string;
      unblocked_by_this_outcome: boolean;
      launch_allowed: boolean;
    };
  };
  protected_surfaces: Record<string, boolean>;
  non_actions: Record<string, boolean>;
  safety_confirmation: Record<string, boolean>;
};

type Queue = {
  latest_merged_factory_state: {
    merged_factory_prs: {
      number: number;
      state: string;
      merged: boolean;
      merge_commit?: string;
      evidence_paths: string[];
    }[];
    tasks: {
      task_id: string;
      resulting_status: string;
      router_candidate_status: string;
      auto_selectable: boolean;
      owner_action_required?: boolean;
      owner_approval_required?: boolean;
      owner_action_packet_exists?: boolean;
      owner_action_packet_is_actual_evidence?: boolean;
      owner_action_packet_path?: string;
      owner_action_packet_markdown_path?: string;
      tb_110_owner_action_packet_work_reselectable?: boolean;
    }[];
  };
  selection_result: {
    pr_121_selected: boolean;
    tb_090_selected: boolean;
    tb_090_owner_decision_packet_work_selected: boolean;
    tb_110_owner_action_packet_selected: boolean;
    post_merge_handoff_generator_selected?: boolean;
    public_paid_beta_selected: boolean;
    private_manual_beta_launch_selected: boolean;
  };
  next_safe_task: {
    rank: number;
    id: string;
  };
  recommended_next_outputs: {
    rank: number;
    id: string;
    auto_selectable: boolean;
    implementation_allowed: boolean;
    live_mutation_allowed: boolean;
  }[];
  release_gates: {
    private_manual_beta: {
      status: string;
      launched_by_this_queue: boolean;
    };
    public_paid_beta: {
      status: string;
      unblocked_by_this_queue: boolean;
    };
  };
  protected_surfaces: {
    id: string;
    blocked: boolean;
    implementation_allowed: boolean;
  }[];
  router_contract: {
    live_github_mutations_from_implementation_code: boolean;
    auto_merge_enabled: boolean;
  };
  safety_confirmation: Record<string, boolean>;
};

const OUTCOME_JSON_PATH = [
  "docs",
  "factory",
  "tb-110-owner-action-packet-outcome.v1.json"
];
const OUTCOME_MD_PATH = [
  "docs",
  "factory",
  "tb-110-owner-action-packet-outcome.md"
];
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

function readJson<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(join(process.cwd(), ...parts), "utf8")) as T;
}

function readOutcome() {
  return readJson<Outcome>(...OUTCOME_JSON_PATH);
}

function readQueue() {
  return readJson<Queue>(...QUEUE_JSON_PATH);
}

function queueTaskById(queue: Queue, taskId: string) {
  const task = queue.latest_merged_factory_state.tasks.find(
    (candidate) => candidate.task_id === taskId
  );

  if (!task) {
    throw new Error(`Missing queue task ${taskId}`);
  }

  return task;
}

test.describe("TB-110 owner action packet outcome", () => {
  test("PR #147 is represented as merged evidence", () => {
    const outcome = readOutcome();
    const queue = readQueue();
    const markdown = readFileSync(join(process.cwd(), ...OUTCOME_MD_PATH), "utf8");
    const pr147 = queue.latest_merged_factory_state.merged_factory_prs.find(
      (candidate) => candidate.number === 147
    );

    expect(existsSync(join(process.cwd(), ...OUTCOME_JSON_PATH))).toBe(true);
    expect(existsSync(join(process.cwd(), ...OUTCOME_MD_PATH))).toBe(true);
    expect(outcome).toMatchObject({
      schema_version: "1.0.0",
      kind: "tb_110_owner_action_packet_outcome",
      repository: "chachathecat/visual-lexicon-app",
      merged_pull_request: {
        number: 147,
        state: "merged",
        merged: true,
        merge_commit: "b4dd352f8ece4a660d983365ae60169b4c83566d",
        runtime_or_protected_surface_effect: "none"
      }
    });
    expect(pr147).toMatchObject({
      number: 147,
      state: "merged",
      merged: true,
      merge_commit: "b4dd352f8ece4a660d983365ae60169b4c83566d"
    });
    expect(markdown).toContain("PR #147 is merged");
    expect(markdown).toContain("b4dd352f8ece4a660d983365ae60169b4c83566d");
  });

  test("TB-110 owner action packet exists as actual evidence", () => {
    const outcome = readOutcome();
    const packet = readJson<{
      kind: string;
      task: {
        task_id: string;
        status: string;
        owner_action_required: boolean;
        owner_approval_required: boolean;
      };
    }>(...PACKET_JSON_PATH);

    expect(existsSync(join(process.cwd(), ...PACKET_JSON_PATH))).toBe(true);
    expect(existsSync(join(process.cwd(), ...PACKET_MD_PATH))).toBe(true);
    expect(outcome.evidence).toMatchObject({
      tb_110_owner_action_packet_exists: true,
      tb_110_owner_action_packet_is_actual_evidence: true,
      tb_110_owner_action_packet_path:
        "docs/factory/tb-110-private-beta-owner-action-packet.v1.json",
      tb_110_owner_action_packet_markdown_path:
        "docs/factory/tb-110-private-beta-owner-action-packet.md",
      tb_110_owner_action_packet_test_path:
        "tests/factory-tb-110-private-beta-owner-action-packet.spec.ts"
    });
    expect(packet).toMatchObject({
      kind: "tb_110_private_beta_owner_action_packet",
      task: {
        task_id: "TB-110",
        status: "blocked_human",
        owner_action_required: true,
        owner_approval_required: true
      }
    });
  });

  test("TB-110 owner action packet work is not selected again", () => {
    const outcome = readOutcome();
    const queue = readQueue();
    const tb110 = queueTaskById(queue, "TB-110");

    expect(outcome.queue_reconciliation).toMatchObject({
      tb_110_owner_action_packet_work_reselectable: false,
      tb_110_owner_action_packet_selected: false,
      next_safe_task_id: "POST-MERGE-HANDOFF-GENERATOR",
      recommended_next_outputs_rank_1: "POST-MERGE-HANDOFF-GENERATOR"
    });
    expect(tb110).toMatchObject({
      resulting_status: "blocked_human",
      router_candidate_status: "blocked_human",
      auto_selectable: false,
      owner_action_required: true,
      owner_approval_required: true,
      owner_action_packet_exists: true,
      owner_action_packet_is_actual_evidence: true,
      owner_action_packet_path:
        "docs/factory/tb-110-private-beta-owner-action-packet.v1.json",
      owner_action_packet_markdown_path:
        "docs/factory/tb-110-private-beta-owner-action-packet.md",
      tb_110_owner_action_packet_work_reselectable: false
    });
    expect(queue.selection_result.tb_110_owner_action_packet_selected).toBe(
      false
    );
    expect(queue.next_safe_task).toMatchObject({
      rank: 1,
      id: "OWNER-AUDIT-REQUIRED",
      resulting_status: "audit_required"
    });
    expect(queue.recommended_next_outputs[0]).toMatchObject({
      rank: 1,
      id: "OWNER-AUDIT-REQUIRED",
      auto_selectable: false,
      implementation_allowed: false,
      live_mutation_allowed: false
    });
    expect(queue.recommended_next_outputs.map((output) => output.id)).not.toContain(
      "TB-110-PRIVATE-BETA-OWNER-ACTION-PACKET"
    );
    expect(queue.recommended_next_outputs.map((output) => output.id)).not.toContain(
      "POST-MERGE-HANDOFF-GENERATOR"
    );
    expect(queue.recommended_next_outputs.map((output) => output.id)).not.toContain(
      "OWNER-QUEUE-POST-HANDOFF-AUDIT"
    );
    expect(queue.selection_result.post_merge_handoff_generator_selected).toBe(
      false
    );
  });

  test("release gates and task invariants remain blocked", () => {
    const outcome = readOutcome();
    const queue = readQueue();

    expect(outcome.invariants).toMatchObject({
      tb_110: {
        status: "blocked_human",
        router_candidate_status: "blocked_human",
        owner_action_required: true,
        owner_approval_required: true,
        auto_selectable: false,
        private_manual_beta_launched: false,
        public_paid_beta_unblocked: false
      },
      tb_090: {
        status: "partial_verified",
        router_candidate_status: "blocked_human",
        auto_selectable: false,
        account_sync_implementation_selected: false
      },
      tb_100: {
        status: "verified",
        evidence: "PR #82",
        auto_selectable: false
      },
      pull_request_121: {
        state: "closed",
        stale: true,
        superseded: true,
        reselected: false,
        auto_mergeable: false
      }
    });
    expect(outcome.release_gates.private_manual_beta).toMatchObject({
      status: "gated",
      launched_by_this_outcome: false,
      participants_invited_by_this_outcome: false,
      charges_enabled_by_this_outcome: false,
      entitlements_granted_by_this_outcome: false
    });
    expect(outcome.release_gates.public_paid_beta).toMatchObject({
      status: "blocked",
      unblocked_by_this_outcome: false,
      launch_allowed: false
    });
    expect(queue.release_gates.private_manual_beta).toMatchObject({
      status: "gated",
      launched_by_this_queue: false
    });
    expect(queue.release_gates.public_paid_beta).toMatchObject({
      status: "blocked",
      unblocked_by_this_queue: false
    });
    expect(queue.selection_result).toMatchObject({
      pr_121_selected: false,
      tb_090_selected: false,
      tb_090_owner_decision_packet_work_selected: false,
      public_paid_beta_selected: false,
      private_manual_beta_launch_selected: false
    });
  });

  test("protected surfaces remain untouched and live mutations stay disabled", () => {
    const outcome = readOutcome();
    const queue = readQueue();

    for (const [surface, changed] of Object.entries(outcome.protected_surfaces)) {
      expect(changed, surface).toBe(false);
    }

    for (const [action, performed] of Object.entries(outcome.non_actions)) {
      expect(performed, action).toBe(false);
    }

    for (const surface of queue.protected_surfaces) {
      expect(surface.blocked, surface.id).toBe(true);
      expect(surface.implementation_allowed, surface.id).toBe(false);
    }

    expect(queue.router_contract).toMatchObject({
      live_github_mutations_from_implementation_code: false,
      auto_merge_enabled: false
    });
    expect(outcome.safety_confirmation).toMatchObject({
      protected_surfaces_untouched: true,
      no_live_github_mutations: true,
      auto_merge_remains_disabled: true,
      private_manual_beta_not_launched: true,
      public_paid_beta_not_unblocked: true,
      no_invites: true,
      no_charges: true,
      no_entitlement_grants: true
    });
    expect(queue.safety_confirmation).toMatchObject({
      live_mutations_remain_disabled: true,
      auto_merge_remains_disabled: true,
      post_merge_handoff_generator_not_reselected: true,
      owner_queue_post_handoff_audit_not_reselected: true,
      owner_audit_required_is_next_safe_output: true
    });
  });
});
