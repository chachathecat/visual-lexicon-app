import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

type CiFailureTriageSeed = {
  schema_version: string;
  kind: string;
  repository: string;
  created_at: string;
  source_documents: string[];
  incident: {
    id: string;
    status: string;
    blocked_pull_request: {
      number: number;
      state: string;
      blocked_by_ci: boolean;
      merge_commit: string;
      checks_rerun_and_passed_before_merge: boolean;
    };
    blocking_check: {
      name: string;
      failure_step: string;
      failure_class: string;
      setup_or_install_failure: boolean;
      timeout_failure: boolean;
      network_install_failure: boolean;
      observed_not_setup_install_timeout: boolean;
      requires_artifact_trace_diff_triage: boolean;
    };
    local_evidence: {
      local_parity_tests_passed: boolean;
      local_ci_mode_parity_tests_passed: boolean;
      commands: string[];
    };
    negative_findings: {
      screenshot_baseline_update_justified: boolean;
      runtime_ui_change_justified: boolean;
      setup_install_timeout_root_cause: boolean;
      blind_snapshot_update_allowed: boolean;
    };
    resolution: {
      resolved_by_pull_request: {
        number: number;
        state: string;
        merge_commit: string;
        method: string;
        screenshot_baseline_updated: boolean;
        runtime_ui_changed: boolean;
      };
      classification: string;
      pr_148_checks_rerun_and_passed_before_merge: boolean;
    };
  };
  future_visual_parity_policy: {
    blind_screenshot_updates_allowed: boolean;
    artifact_trace_diff_triage_required_before_snapshot_update: boolean;
    snapshot_update_requires_owner_review_when_visual_change_is_real: boolean;
    runtime_ui_change_requires_separate_product_justification: boolean;
    setup_install_timeout_must_be_supported_by_observed_evidence: boolean;
    required_triage_order: string[];
  };
  protected_surface_changes: Record<string, boolean>;
  mutation_policy: Record<string, boolean>;
  determinism: {
    same_input_produces_identical_output: boolean;
    fixed_created_at: string;
    incident_order: string[];
    sort_keys: string[];
  };
  safety_confirmation: Record<string, boolean>;
};

const SEED_JSON_PATH = [
  "docs",
  "factory",
  "ci-failure-triage-seed.v1.json"
];
const SEED_MD_PATH = ["docs", "factory", "ci-failure-triage-seed.md"];

function readJson<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(join(process.cwd(), ...parts), "utf8")) as T;
}

function readSeed() {
  return readJson<CiFailureTriageSeed>(...SEED_JSON_PATH);
}

test.describe("CI failure triage seed", () => {
  test("seed files are valid and deterministic", () => {
    const seed = readSeed();
    const markdown = readFileSync(join(process.cwd(), ...SEED_MD_PATH), "utf8");

    expect(existsSync(join(process.cwd(), ...SEED_JSON_PATH))).toBe(true);
    expect(existsSync(join(process.cwd(), ...SEED_MD_PATH))).toBe(true);
    expect(seed).toMatchObject({
      schema_version: "1.0.0",
      kind: "ci_failure_triage_seed",
      repository: "chachathecat/visual-lexicon-app",
      created_at: "2026-07-01"
    });
    expect(seed.determinism).toMatchObject({
      same_input_produces_identical_output: true,
      fixed_created_at: "2026-07-01",
      incident_order: ["PR-148", "PR-149"],
      sort_keys: [
        "incident.id",
        "future_visual_parity_policy.required_triage_order"
      ]
    });
    expect(readSeed()).toEqual(seed);
    expect(markdown).toContain("# CI Failure Triage Seed");
    expect(markdown).toContain("PR #148");
    expect(markdown).toContain("PR #149");
    expect(markdown).toContain("Visual Screenshot Parity");
  });

  test("records PR #148 Visual Screenshot Parity failure evidence", () => {
    const seed = readSeed();

    expect(seed.incident).toMatchObject({
      id: "pr_148_visual_screenshot_parity",
      status: "resolved",
      blocked_pull_request: {
        number: 148,
        state: "merged_after_rerun_passed",
        blocked_by_ci: true,
        merge_commit: "4560e556ff682f3813983f4bc4f07c7868255ad9",
        checks_rerun_and_passed_before_merge: true
      },
      blocking_check: {
        name: "Visual Screenshot Parity",
        failure_step: "Run Figma parity screenshots",
        failure_class: "visual_parity",
        setup_or_install_failure: false,
        timeout_failure: false,
        network_install_failure: false,
        observed_not_setup_install_timeout: true,
        requires_artifact_trace_diff_triage: true
      }
    });
    expect(seed.safety_confirmation).toMatchObject({
      pr_148_blocked_by_visual_screenshot_parity_recorded: true,
      failure_step_run_figma_parity_screenshots_recorded: true,
      failure_not_setup_install_timeout_based_on_observed_ci: true
    });
  });

  test("records local and local CI-mode parity passing", () => {
    const seed = readSeed();

    expect(seed.incident.local_evidence).toMatchObject({
      local_parity_tests_passed: true,
      local_ci_mode_parity_tests_passed: true
    });
    expect(seed.incident.local_evidence.commands).toEqual([
      "npm.cmd run test -- tests/figma-parity-screenshots.spec.ts --workers=1",
      "$env:CI='true'; npm.cmd run test -- tests/figma-parity-screenshots.spec.ts --workers=1"
    ]);
    expect(seed.safety_confirmation.local_and_local_ci_mode_parity_passed).toBe(
      true
    );
  });

  test("classifies #148 as resolved by #149 deterministic stabilization", () => {
    const seed = readSeed();

    expect(seed.incident.resolution).toMatchObject({
      resolved_by_pull_request: {
        number: 149,
        state: "merged",
        merge_commit: "fcdd91f7b5cec444d25d35be3a6bdcc38519bcf6",
        method: "deterministic_test_context_changes_only",
        screenshot_baseline_updated: false,
        runtime_ui_changed: false
      },
      classification:
        "resolved_by_pr_149_deterministic_test_context_stabilization",
      pr_148_checks_rerun_and_passed_before_merge: true
    });
    expect(seed.safety_confirmation).toMatchObject({
      pr_149_stabilized_by_deterministic_test_context_only: true,
      pr_148_checks_rerun_passed_before_merge: true
    });
  });

  test("forbids blind screenshot updates", () => {
    const seed = readSeed();

    expect(seed.incident.negative_findings).toMatchObject({
      screenshot_baseline_update_justified: false,
      runtime_ui_change_justified: false,
      setup_install_timeout_root_cause: false,
      blind_snapshot_update_allowed: false
    });
    expect(seed.future_visual_parity_policy).toMatchObject({
      blind_screenshot_updates_allowed: false,
      artifact_trace_diff_triage_required_before_snapshot_update: true,
      snapshot_update_requires_owner_review_when_visual_change_is_real: true,
      runtime_ui_change_requires_separate_product_justification: true,
      setup_install_timeout_must_be_supported_by_observed_evidence: true
    });
    expect(seed.future_visual_parity_policy.required_triage_order).toEqual([
      "collect_ci_artifacts",
      "inspect_trace",
      "inspect_visual_diff",
      "compare_local_and_ci_mode_results",
      "classify_root_cause",
      "only_then_consider_snapshot_update"
    ]);
    expect(seed.safety_confirmation).toMatchObject({
      no_screenshot_baseline_update_justified: true,
      no_runtime_ui_change_justified: true,
      future_failures_require_artifact_trace_diff_triage_before_snapshot_update:
        true,
      blind_screenshot_updates_forbidden: true
    });
  });

  test("protected surfaces, live mutation, and auto-merge remain disabled", () => {
    const seed = readSeed();

    for (const [surface, changed] of Object.entries(
      seed.protected_surface_changes
    )) {
      expect(changed, surface).toBe(false);
    }

    for (const [field, enabled] of Object.entries(seed.mutation_policy)) {
      expect(enabled, field).toBe(false);
    }

    expect(seed.safety_confirmation).toMatchObject({
      docs_tests_only: true,
      protected_surfaces_unchanged: true,
      no_live_github_mutation_allowed: true,
      auto_merge_remains_disabled: true
    });
  });
});
