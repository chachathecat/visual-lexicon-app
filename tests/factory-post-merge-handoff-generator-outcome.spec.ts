import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

type Outcome = {
  schema_version: string;
  kind: string;
  repository: string;
  created_at: string;
  source_documents: string[];
  this_packet: Record<string, boolean | string>;
  merged_pull_request: {
    number: number;
    state: string;
    merged: boolean;
    merge_commit: string;
    runtime_or_protected_surface_effect: string;
  };
  evidence: {
    post_merge_handoff_generator_exists: boolean;
    post_merge_handoff_generator_is_actual_evidence: boolean;
    post_merge_handoff_generator_path: string;
    post_merge_handoff_generator_markdown_path: string;
    post_merge_handoff_generator_test_path: string;
    ci_failure_triage_seed_exists: boolean;
    ci_failure_triage_seed_is_actual_evidence: boolean;
    ci_failure_triage_seed_path: string;
    ci_failure_triage_seed_markdown_path: string;
    ci_failure_triage_seed_test_path: string;
  };
  queue_reconciliation: {
    post_merge_handoff_generator_work_reselectable: boolean;
    post_merge_handoff_generator_selected: boolean;
    selected_implementation_task: null;
    selected_runtime_task: null;
    implementation_task_selected: boolean;
    runtime_task_selected: boolean;
    no_implementation_task_selected: boolean;
    live_mutation_allowed: boolean;
    auto_merge_enabled: boolean;
    next_safe_task_id: string;
    recommended_next_outputs_rank_1: string;
  };
  release_gates: {
    public_paid_beta: {
      status: string;
      unblocked_by_this_outcome: boolean;
      launch_allowed: boolean;
      owner_approval_required: boolean;
    };
    private_manual_beta: {
      status: string;
      launched_by_this_outcome: boolean;
      participants_invited_by_this_outcome: boolean;
      charges_enabled_by_this_outcome: boolean;
      entitlements_granted_by_this_outcome: boolean;
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
    actual_evidence_order: string[];
    sort_keys: string[];
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
      evidence_paths: string[];
      runtime_or_protected_surface_effect: string;
    }[];
  };
  selection_result: {
    selected_implementation: null;
    selected_runtime_task: null;
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
    owner_approval_required_for_blocked_human: boolean;
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
  "post-merge-handoff-generator-outcome.v1.json"
];
const OUTCOME_MD_PATH = [
  "docs",
  "factory",
  "post-merge-handoff-generator-outcome.md"
];
const GENERATOR_JSON_PATH = [
  "docs",
  "factory",
  "post-merge-handoff-generator.v1.json"
];
const GENERATOR_MD_PATH = [
  "docs",
  "factory",
  "post-merge-handoff-generator.md"
];
const CI_SEED_JSON_PATH = [
  "docs",
  "factory",
  "ci-failure-triage-seed.v1.json"
];
const CI_SEED_MD_PATH = ["docs", "factory", "ci-failure-triage-seed.md"];
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

test.describe("post-merge handoff generator outcome", () => {
  test("PR #150 merged evidence and actual artifacts are represented", () => {
    const outcome = readOutcome();
    const queue = readQueue();
    const markdown = readFileSync(
      join(process.cwd(), ...OUTCOME_MD_PATH),
      "utf8"
    );
    const pr150 = queue.latest_merged_factory_state.merged_factory_prs.find(
      (candidate) => candidate.number === 150
    );

    expect(existsSync(join(process.cwd(), ...OUTCOME_JSON_PATH))).toBe(true);
    expect(existsSync(join(process.cwd(), ...OUTCOME_MD_PATH))).toBe(true);
    expect(existsSync(join(process.cwd(), ...GENERATOR_JSON_PATH))).toBe(true);
    expect(existsSync(join(process.cwd(), ...GENERATOR_MD_PATH))).toBe(true);
    expect(existsSync(join(process.cwd(), ...CI_SEED_JSON_PATH))).toBe(true);
    expect(existsSync(join(process.cwd(), ...CI_SEED_MD_PATH))).toBe(true);
    expect(outcome).toMatchObject({
      schema_version: "1.0.0",
      kind: "post_merge_handoff_generator_outcome",
      repository: "chachathecat/visual-lexicon-app",
      created_at: "2026-07-02",
      merged_pull_request: {
        number: 150,
        state: "merged",
        merged: true,
        merge_commit: "96d53a7bd3f054aaa9b2af43f04feab43b97304c",
        runtime_or_protected_surface_effect: "none"
      }
    });
    expect(pr150).toMatchObject({
      number: 150,
      state: "merged",
      merged: true,
      merge_commit: "96d53a7bd3f054aaa9b2af43f04feab43b97304c",
      runtime_or_protected_surface_effect: "none"
    });
    expect(markdown).toContain("PR #150 merged");
    expect(markdown).toContain("96d53a7bd3f054aaa9b2af43f04feab43b97304c");
  });

  test("post-merge handoff generator and CI seed are actual evidence", () => {
    const outcome = readOutcome();

    expect(outcome.evidence).toMatchObject({
      post_merge_handoff_generator_exists: true,
      post_merge_handoff_generator_is_actual_evidence: true,
      post_merge_handoff_generator_path:
        "docs/factory/post-merge-handoff-generator.v1.json",
      post_merge_handoff_generator_markdown_path:
        "docs/factory/post-merge-handoff-generator.md",
      post_merge_handoff_generator_test_path:
        "tests/factory-post-merge-handoff-generator.spec.ts",
      ci_failure_triage_seed_exists: true,
      ci_failure_triage_seed_is_actual_evidence: true,
      ci_failure_triage_seed_path:
        "docs/factory/ci-failure-triage-seed.v1.json",
      ci_failure_triage_seed_markdown_path:
        "docs/factory/ci-failure-triage-seed.md",
      ci_failure_triage_seed_test_path:
        "tests/factory-ci-failure-triage-seed.spec.ts"
    });
    expect(outcome.source_documents).toEqual(
      expect.arrayContaining([
        "docs/factory/post-merge-handoff-generator.v1.json",
        "docs/factory/post-merge-handoff-generator.md",
        "docs/factory/ci-failure-triage-seed.v1.json",
        "docs/factory/ci-failure-triage-seed.md"
      ])
    );
  });

  test("queue does not reselect generator or implementation work", () => {
    const outcome = readOutcome();
    const queue = readQueue();

    expect(outcome.queue_reconciliation).toMatchObject({
      post_merge_handoff_generator_work_reselectable: false,
      post_merge_handoff_generator_selected: false,
      selected_implementation_task: null,
      selected_runtime_task: null,
      implementation_task_selected: false,
      runtime_task_selected: false,
      no_implementation_task_selected: true,
      live_mutation_allowed: false,
      auto_merge_enabled: false,
      next_safe_task_id: "OWNER-QUEUE-POST-HANDOFF-AUDIT",
      recommended_next_outputs_rank_1: "OWNER-QUEUE-POST-HANDOFF-AUDIT"
    });
    expect(queue.selection_result).toMatchObject({
      selected_implementation: null,
      selected_runtime_task: null,
      post_merge_handoff_generator_selected: false
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
  });

  test("mutation, auto-merge, release gates, and protected surfaces remain closed", () => {
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

    for (const surface of outcome.blocked_surfaces) {
      expect(surface.blocked, surface.id).toBe(true);
      expect(surface.implementation_allowed, surface.id).toBe(false);
    }

    for (const surface of queue.protected_surfaces) {
      expect(surface.blocked, surface.id).toBe(true);
      expect(surface.implementation_allowed, surface.id).toBe(false);
    }

    expect(outcome.release_gates.public_paid_beta).toMatchObject({
      status: "blocked",
      unblocked_by_this_outcome: false,
      launch_allowed: false,
      owner_approval_required: true
    });
    expect(outcome.release_gates.private_manual_beta).toMatchObject({
      status: "gated",
      launched_by_this_outcome: false,
      participants_invited_by_this_outcome: false,
      charges_enabled_by_this_outcome: false,
      entitlements_granted_by_this_outcome: false,
      owner_approval_required: true
    });
    expect(queue.router_contract).toMatchObject({
      live_github_mutations_from_implementation_code: false,
      auto_merge_enabled: false,
      owner_approval_required_for_blocked_human: true
    });
  });

  test("required validation commands and safety confirmations are documented", () => {
    const outcome = readOutcome();
    const markdown = readFileSync(
      join(process.cwd(), ...OUTCOME_MD_PATH),
      "utf8"
    );

    expect(outcome.required_validation.targeted).toEqual([
      "npm.cmd run test -- tests/factory-post-merge-handoff-generator-outcome.spec.ts tests/factory-owner-minimal-intervention-queue.spec.ts --workers=1",
      "npm.cmd run test -- tests/factory-post-merge-handoff-generator.spec.ts tests/factory-ci-failure-triage-seed.spec.ts tests/factory-post-merge-handoff-generator-outcome.spec.ts --workers=1"
    ]);
    expect(outcome.required_validation.before_finish).toEqual([
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- --workers=1"
    ]);
    expect(outcome.safety_confirmation).toMatchObject({
      docs_tests_only: true,
      pr_150_merged_evidence_recorded: true,
      post_merge_handoff_generator_exists_as_actual_evidence: true,
      ci_failure_triage_seed_exists_as_actual_evidence: true,
      post_merge_handoff_generator_not_reselected: true,
      no_implementation_task_selected: true,
      no_live_github_mutation_allowed: true,
      auto_merge_remains_disabled: true,
      public_paid_beta_remains_blocked: true,
      private_manual_beta_remains_gated: true,
      owner_approval_required_for_blocked_human_tasks: true,
      protected_surfaces_unchanged: true
    });
    expect(outcome.determinism).toMatchObject({
      same_input_produces_identical_output: true,
      fixed_created_at: "2026-07-02",
      merge_evidence_order: ["PR-150"],
      actual_evidence_order: [
        "post-merge-handoff-generator",
        "ci-failure-triage-seed"
      ],
      ranked_output_order: ["OWNER-QUEUE-POST-HANDOFF-AUDIT"]
    });
    expect(markdown).toContain("npm.cmd run typecheck");
    expect(markdown).toContain("npm.cmd run lint");
    expect(markdown).toContain("npm.cmd run build");
    expect(markdown).toContain("npm.cmd run test -- --workers=1");
  });
});
