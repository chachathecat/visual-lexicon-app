import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

type Packet = {
  schema_version: string;
  kind: string;
  repository: string;
  source_documents: string[];
  source_prs: { number: number; status: string }[];
  target_pull_request: {
    number: number;
    state: string;
    stale: boolean;
    superseded: boolean;
    resulting_status: string;
    router_selectable: boolean;
    auto_selectable: boolean;
    auto_mergeable: boolean;
    implementation_ready: boolean;
    owner_decision_required: boolean;
    owner_action_required: boolean;
    manual_action_only: boolean;
    live_mutation_performed_by_this_packet: boolean;
  };
  decision: {
    id: string;
    does_not_auto_close: boolean;
    does_not_auto_merge: boolean;
    does_not_comment_or_label: boolean;
    does_not_perform_live_github_mutation: boolean;
    does_not_treat_pr_121_as_implementation_ready: boolean;
  };
  invariants: {
    public_paid_beta_status: string;
    private_manual_beta_status: string;
    tb_090: {
      status: string;
      router_candidate_status: string;
      router_selectable: boolean;
      auto_selectable: boolean;
      actual_account_sync_exists: boolean;
      disabled_route_skeleton_runtime_files_approved: boolean;
      future_runtime_route_skeleton_approval: boolean;
    };
    tb_100: { status: string; evidence: string; router_selectable: boolean };
    tb_110: {
      status: string;
      owner_action_required: boolean;
      router_selectable: boolean;
      auto_selectable: boolean;
    };
  };
  protected_surfaces: Record<string, boolean>;
  required_validation: { targeted: string[]; before_finish: string[] };
  post_merge_next_action_summary: { after_this_packet_merges: string[]; do_not_do: string[] };
};

const JSON_PATH = ["docs", "factory", "pr-121-stale-superseded-owner-decision.v1.json"];
const MD_PATH = ["docs", "factory", "pr-121-stale-superseded-owner-decision.md"];

function readPacket(): Packet {
  return JSON.parse(readFileSync(join(process.cwd(), ...JSON_PATH), "utf8")) as Packet;
}

test.describe("PR #121 owner decision packet", () => {
  test("artifact files exist", () => {
    const packet = readPacket();
    const markdown = readFileSync(join(process.cwd(), ...MD_PATH), "utf8");

    expect(existsSync(join(process.cwd(), ...JSON_PATH))).toBe(true);
    expect(existsSync(join(process.cwd(), ...MD_PATH))).toBe(true);
    expect(packet).toMatchObject({
      schema_version: "1.0.0",
      kind: "pr_121_stale_superseded_owner_decision_packet",
      repository: "chachathecat/visual-lexicon-app"
    });
    expect(markdown).toContain("# PR #121 Stale/Superseded Owner Decision Packet");
  });

  test("PR #121 remains stale open and not selectable", () => {
    const packet = readPacket();

    expect(packet.target_pull_request).toMatchObject({
      number: 121,
      state: "open",
      stale: true,
      superseded: true,
      resulting_status: "stale_not_selectable",
      router_selectable: false,
      auto_selectable: false,
      auto_mergeable: false,
      implementation_ready: false,
      owner_decision_required: true,
      owner_action_required: true,
      manual_action_only: true,
      live_mutation_performed_by_this_packet: false
    });
  });

  test("decision remains manual and non-mutating", () => {
    const packet = readPacket();

    expect(packet.decision).toMatchObject({
      id: "PR-121-STALE-SUPERSEDED-OWNER-DECISION",
      does_not_auto_close: true,
      does_not_auto_merge: true,
      does_not_comment_or_label: true,
      does_not_perform_live_github_mutation: true,
      does_not_treat_pr_121_as_implementation_ready: true
    });
  });

  test("superseding evidence covers PRs 137 through 145", () => {
    const packet = readPacket();

    expect(packet.source_prs.map((pr) => pr.number)).toEqual([
      137,
      138,
      139,
      140,
      141,
      142,
      143,
      144,
      145
    ]);
    expect(packet.source_prs.every((pr) => pr.status === "merged")).toBe(true);
    expect(packet.source_documents).toEqual(
      expect.arrayContaining([
        "docs/factory/owner-minimal-intervention-queue.v1.json",
        "docs/factory/tb-090-owner-decision-packet.v1.json"
      ])
    );
  });

  test("beta gates and TB invariants are preserved", () => {
    const packet = readPacket();

    expect(packet.invariants.public_paid_beta_status).toBe("blocked");
    expect(packet.invariants.private_manual_beta_status).toBe("gated");
    expect(packet.invariants.tb_090).toMatchObject({
      status: "partial_verified",
      router_candidate_status: "blocked_human",
      router_selectable: false,
      auto_selectable: false,
      actual_account_sync_exists: false,
      disabled_route_skeleton_runtime_files_approved: false,
      future_runtime_route_skeleton_approval: false
    });
    expect(packet.invariants.tb_100).toMatchObject({
      status: "verified",
      evidence: "PR #82",
      router_selectable: false
    });
    expect(packet.invariants.tb_110).toMatchObject({
      status: "blocked_human",
      owner_action_required: true,
      router_selectable: false,
      auto_selectable: false
    });
  });

  test("protected surfaces and validation remain safe", () => {
    const packet = readPacket();

    expect(packet.protected_surfaces).toMatchObject({
      docs_tests_only: true,
      runtime_ui_changes: false,
      account_sync_implementation: false,
      api_routes_added: false,
      payment_or_billing_changes: false,
      live_github_mutations_from_implementation_code: false,
      auto_merge_enabled: false
    });
    expect(packet.required_validation.targeted).toEqual([
      "npm.cmd run test -- tests/factory-pr-121-stale-superseded-owner-decision.spec.ts --workers=1"
    ]);
    expect(packet.required_validation.before_finish).toEqual([
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- --workers=1"
    ]);
  });

  test("post-merge sequence is deterministic", () => {
    const packet = readPacket();

    expect(packet.post_merge_next_action_summary.after_this_packet_merges).toEqual([
      "Owner may manually close PR #121 as stale/superseded.",
      "Then prepare the TB-110 private beta owner action packet.",
      "Then prepare the post-merge handoff generator."
    ]);
    expect(JSON.stringify(packet)).toBe(JSON.stringify(readPacket()));
  });
});
