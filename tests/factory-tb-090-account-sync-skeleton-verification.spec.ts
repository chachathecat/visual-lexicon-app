import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

type VerificationResult =
  | "verified_by_existing_decision_only"
  | "partial_verified"
  | "needs_owner_decision"
  | "blocked_dependency"
  | "blocked_human"
  | "still_needs_disabled_route_skeleton";

type VerificationArtifact = {
  schema_version: string;
  kind: string;
  repository: string;
  this_pr: {
    type: string;
    runtime_ui_changes: boolean;
    account_sync_implementation: boolean;
    actual_disabled_route_skeleton_created: boolean;
    database_schema_rls_or_migration_changes: boolean;
    auth_or_session_mutation_changes: boolean;
    entitlement_mutation_changes: boolean;
    payment_or_billing_changes: boolean;
    middleware_changes: boolean;
    srs_algorithm_changes: boolean;
    local_storage_contract_changes: boolean;
    roadmap_status_changes: boolean;
    workflow_changes: boolean;
    codeowners_changes: boolean;
    agents_policy_changes: boolean;
    dns_or_deployment_changes: boolean;
    secrets_or_env_changes: boolean;
    production_data_changes: boolean;
    live_github_mutations_from_implementation_code: boolean;
    expected_changed_files: string[];
  };
  task: {
    task_id: string;
    title: string;
    current_overlay_status: string;
    current_router_candidate_status: string;
    router_selectable: boolean;
    owner_decision_required_in_seed: boolean;
  };
  determination: {
    result: VerificationResult;
    allowed_results: VerificationResult[];
    decision_evidence_status: VerificationResult;
    preview_digest_evidence_status: string;
    actual_disabled_route_skeleton_status: VerificationResult;
    runtime_account_sync_status: string;
    missing_route_skeleton_evidence_fails_closed: boolean;
    owner_decision_needed_for_this_verification_artifact: boolean;
    owner_decision_required_before_route_files: boolean;
    public_paid_beta_effect: string;
    private_manual_beta_effect: string;
  };
  evidence_mapping: {
    category: string;
    source_pr: number | null;
    task_scope: string;
    evidence_summary: string;
    files_inspected: string[];
    verified: string[];
    not_verified: string[];
  }[];
  actual_route_skeleton_files: {
    path: string;
    source: string;
    exists: boolean;
    runtime_route_file: boolean;
    owner_approval_required_before_creation: boolean;
  }[];
  acceptance_mapping: {
    id: string;
    status: string;
    evidence: string;
  }[];
  owner_decision_packet: {
    required_for_this_verification_pr: boolean;
    required_before_any_route_file_creation: boolean;
    minimum_future_packet_fields: string[];
  };
  release_gates: {
    public_paid_beta: {
      status: string;
      owner_decision_required: boolean;
      unblocked_by_tb_090_verification: boolean;
    };
    private_manual_beta: {
      status: string;
      owner_approval_required: boolean;
      manual_only: boolean;
      launched_by_tb_090_verification: boolean;
    };
  };
  stale_open_pull_requests: {
    id: string;
    number: number;
    state: string;
    stale: boolean;
    resulting_status: string;
    router_selectable: boolean;
    auto_selectable: boolean;
    auto_mergeable: boolean;
    owner_decision_required: boolean;
  }[];
  stop_reasons: string[];
  protected_files_must_remain_unchanged: string[];
  determinism: {
    sort_keys: string[];
    same_input_produces_identical_verification_summary: boolean;
    live_github_mutations_from_implementation_code: boolean;
    auto_merge_enabled: boolean;
  };
  safety_confirmation: Record<string, boolean>;
};

type StatusOverlay = {
  task_statuses: {
    task_id: string;
    resulting_status: string;
    router_candidate_status: string;
    router_selectable: boolean;
    owner_decision_required?: boolean;
    owner_action_required?: boolean;
    not_selectable_for_automatic_implementation?: boolean;
    needs_verification_reason?: string;
    partial_verification_reason?: string;
    blocked_reason?: string;
    satisfied_by?: {
      merged_pr_number: number;
      evidence_source: string;
    }[];
  }[];
  stale_open_pull_requests: {
    id: string;
    number: number;
    state: string;
    stale: boolean;
    resulting_status: string;
    router_selectable: boolean;
    auto_selectable: boolean;
    auto_mergeable: boolean;
    owner_decision_required: boolean;
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
      owner_decision_required: boolean;
      router_selectable: boolean;
    };
  };
};

const EXPECTED_CHANGED_FILES = [
  "docs/factory/tb-090-account-sync-skeleton-verification.md",
  "docs/factory/tb-090-account-sync-skeleton-verification.v1.json",
  "tests/factory-tb-090-account-sync-skeleton-verification.spec.ts"
];

const CURRENT_OWNER_APPROVED_STAGING_ROUTE_FILES = new Set([
  "src/app/api/account/sync/apply/route.ts",
  "src/app/api/account/sync/digest/route.ts",
  "src/app/api/account/sync/hydrate/route.ts",
  "src/app/api/account/sync/preview/route.ts"
]);

const PROTECTED_PATH_PARTS = [
  ".github/",
  "codeowners",
  "agents.md",
  "src/app/api/account-sync",
  "src/app/api/account/sync",
  "middleware.ts",
  "supabase/",
  "migrations/",
  ".env",
  "vercel.json",
  "wrangler.toml",
  "webflow",
  "cloudflare",
  "r2/",
  "payment",
  "billing",
  "checkout",
  "subscription",
  "invoice",
  "stripe",
  "paddle"
];

function readJson<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(join(process.cwd(), ...parts), "utf8")) as T;
}

function readVerification(): VerificationArtifact {
  return readJson(
    "docs",
    "factory",
    "tb-090-account-sync-skeleton-verification.v1.json"
  );
}

function readStatusOverlay(): StatusOverlay {
  return readJson(
    "docs",
    "factory",
    "track-b-product-backlog-status.v1.json"
  );
}

function taskStatusById(overlay: StatusOverlay, taskId: string) {
  const status = overlay.task_statuses.find(
    (candidate) => candidate.task_id === taskId
  );

  if (!status) {
    throw new Error(`Missing status overlay task ${taskId}`);
  }

  return status;
}

function evidenceByCategory(
  artifact: VerificationArtifact,
  category: string
) {
  const evidence = artifact.evidence_mapping.find(
    (candidate) => candidate.category === category
  );

  if (!evidence) {
    throw new Error(`Missing verification evidence category ${category}`);
  }

  return evidence;
}

function normalizedPath(path: string) {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/").toLowerCase();
}

function buildVerificationSummary(artifact: VerificationArtifact) {
  return {
    task: artifact.task.task_id,
    result: artifact.determination.result,
    decisionEvidenceStatus: artifact.determination.decision_evidence_status,
    actualRouteSkeletonStatus:
      artifact.determination.actual_disabled_route_skeleton_status,
    publicPaidBeta: artifact.release_gates.public_paid_beta.status,
    privateManualBeta: artifact.release_gates.private_manual_beta.status,
    pr121: artifact.stale_open_pull_requests.map((pr) => ({
      id: pr.id,
      resulting_status: pr.resulting_status,
      auto_selectable: pr.auto_selectable,
      auto_mergeable: pr.auto_mergeable
    })),
    evidence: [...artifact.evidence_mapping]
      .sort((left, right) => left.category.localeCompare(right.category))
      .map((evidence) => ({
        category: evidence.category,
        source_pr: evidence.source_pr,
        task_scope: evidence.task_scope
      })),
    routeFiles: [...artifact.actual_route_skeleton_files]
      .sort((left, right) => left.path.localeCompare(right.path))
      .map((file) => ({
        path: file.path,
        exists: file.exists,
        ownerApprovalRequired: file.owner_approval_required_before_creation
      })),
    stopReasons: [...artifact.stop_reasons].sort()
  };
}

test.describe("TB-090 account sync skeleton verification", () => {
  test("artifact records TB-090 as partial verification and overlay applies owner action", () => {
    const artifact = readVerification();
    const overlay = readStatusOverlay();
    const tb090 = taskStatusById(overlay, "TB-090");

    expect(artifact).toMatchObject({
      schema_version: "1.0.0",
      kind: "tb_090_account_sync_skeleton_verification",
      repository: "chachathecat/visual-lexicon-app"
    });
    expect(artifact.task).toMatchObject({
      task_id: "TB-090",
      title: "Disabled Account Sync Route Skeleton",
      current_overlay_status: "needs_verification",
      current_router_candidate_status: "blocked_dependency",
      router_selectable: false,
      owner_decision_required_in_seed: true
    });
    expect(artifact.determination.allowed_results).toEqual([
      "verified_by_existing_decision_only",
      "partial_verified",
      "needs_owner_decision",
      "blocked_dependency",
      "blocked_human",
      "still_needs_disabled_route_skeleton"
    ]);
    expect(artifact.determination).toMatchObject({
      result: "partial_verified",
      decision_evidence_status: "verified_by_existing_decision_only",
      actual_disabled_route_skeleton_status:
        "still_needs_disabled_route_skeleton",
      runtime_account_sync_status: "not_implemented"
    });
    expect(tb090).toMatchObject({
      resulting_status: "partial_verified",
      router_candidate_status: "blocked_human",
      router_selectable: false,
      owner_decision_required: true,
      owner_action_required: true,
      not_selectable_for_automatic_implementation: true
    });
    expect(tb090.satisfied_by).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          merged_pr_number: 142,
          evidence_source:
            "docs/factory/tb-090-account-sync-skeleton-verification.v1.json"
        })
      ])
    );
    expect(tb090.partial_verification_reason).toContain(
      "does not verify actual disabled route files"
    );
    expect(tb090.blocked_reason).toContain(
      "Owner decision is required before any disabled account sync route skeleton files"
    );
  });

  test("TB-090 does not become real account sync implementation", () => {
    const artifact = readVerification();

    expect(artifact.this_pr).toMatchObject({
      runtime_ui_changes: false,
      account_sync_implementation: false,
      actual_disabled_route_skeleton_created: false,
      database_schema_rls_or_migration_changes: false,
      auth_or_session_mutation_changes: false,
      entitlement_mutation_changes: false,
      payment_or_billing_changes: false,
      middleware_changes: false,
      srs_algorithm_changes: false,
      local_storage_contract_changes: false
    });
    expect(artifact.safety_confirmation).toMatchObject({
      account_sync_not_implemented: true,
      disabled_route_skeleton_not_created: true,
      no_database_tables: true,
      no_schema_rls_or_migrations: true,
      no_auth_or_session_mutation: true,
      no_entitlement_mutation: true,
      no_payment_or_billing: true,
      no_runtime_ui_changes: true
    });
    expect(
      artifact.acceptance_mapping.find(
        (item) => item.id === "tb_090_does_not_become_real_account_sync"
      )
    ).toMatchObject({
      status: "pass"
    });
  });

  test("decision-only evidence is not confused with runtime route implementation", () => {
    const artifact = readVerification();
    const decision = evidenceByCategory(
      artifact,
      "design_docs_contracts_tests"
    );
    const decisionDoc = readFileSync(
      join(process.cwd(), "docs", "ACCOUNT_SYNC_ROUTE_SKELETON_DECISION.md"),
      "utf8"
    );
    const decisionModule = readFileSync(
      join(
        process.cwd(),
        "src",
        "lib",
        "account-persistence",
        "route-skeleton-decision",
        "route-skeleton-decision.ts"
      ),
      "utf8"
    );

    expect(decision).toMatchObject({
      source_pr: 69,
      task_scope: "TB-090 decision-only evidence"
    });
    expect(decision.verified.join("\n")).toContain(
      "Decision-only account sync route skeleton policy exists"
    );
    expect(decision.not_verified.join("\n")).toContain(
      "Actual runtime route skeleton files do not exist"
    );
    expect(decisionDoc).toContain(
      "Final verdict: `design_only`, no route skeleton created."
    );
    expect(decisionModule).toContain(
      'actualRouteFilesCreatedInThisPr: false'
    );
    expect(decisionModule).toContain('futureSkeletonAllowedNow: false');
  });

  test("preview digest mock evidence is not confused with disabled route skeleton", () => {
    const artifact = readVerification();
    const previewDigest = evidenceByCategory(
      artifact,
      "preview_digest_mock_evidence"
    );
    const previewDigestDoc = readFileSync(
      join(process.cwd(), "docs", "ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK.md"),
      "utf8"
    );

    expect(previewDigest).toMatchObject({
      source_pr: 82,
      task_scope: "TB-100 preview and digest mock"
    });
    expect(previewDigest.not_verified.join("\n")).toContain(
      "Preview/digest mock evidence is not disabled route skeleton evidence"
    );
    expect(artifact.determination.preview_digest_evidence_status).toBe(
      "verified_for_tb_100_only"
    );
    expect(previewDigestDoc).toContain("No API routes.");
    expect(previewDigestDoc).toContain("No route handlers.");
    expect(previewDigestDoc).toContain("No account sync implementation.");
  });

  test("missing route skeleton evidence fails closed", () => {
    const artifact = readVerification();
    const actualFiles = evidenceByCategory(
      artifact,
      "actual_disabled_route_skeleton_files"
    );

    expect(artifact.determination.missing_route_skeleton_evidence_fails_closed).toBe(
      true
    );
    expect(actualFiles.not_verified.join("\n")).toContain(
      "A disabled-by-default account sync route skeleton is not present"
    );
    expect(actualFiles.verified.join("\n")).toContain(
      "no account-sync middleware was added or changed"
    );

    for (const routeFile of artifact.actual_route_skeleton_files) {
      expect(routeFile).toMatchObject({
        exists: false,
        runtime_route_file: true,
        owner_approval_required_before_creation: true
      });

      // This artifact records PR #142. Later owner approvals do not rewrite it.
      if (!CURRENT_OWNER_APPROVED_STAGING_ROUTE_FILES.has(routeFile.path)) {
        expect(
          existsSync(join(process.cwd(), routeFile.path)),
          routeFile.path
        ).toBe(false);
      }
    }
  });

  test("owner approval is required before account sync route skeleton files are added", () => {
    const artifact = readVerification();

    expect(artifact.owner_decision_packet).toMatchObject({
      required_for_this_verification_pr: false,
      required_before_any_route_file_creation: true
    });
    expect(artifact.owner_decision_packet.minimum_future_packet_fields).toEqual(
      expect.arrayContaining([
        "explicit_owner_approval_text",
        "approved_route_file_scope",
        "disabled_by_default_policy",
        "mock_gate_policy",
        "statement_public_paid_beta_remains_blocked"
      ])
    );
    expect(artifact.stop_reasons).toContain(
      "actual_route_skeleton_creation_requires_explicit_owner_approval"
    );
    expect(artifact.determination.owner_decision_required_before_route_files).toBe(
      true
    );
  });

  test("protected files remain outside expected changed files", () => {
    const artifact = readVerification();

    expect(artifact.this_pr.expected_changed_files).toEqual(
      EXPECTED_CHANGED_FILES
    );
    expect(artifact.this_pr).toMatchObject({
      roadmap_status_changes: false,
      workflow_changes: false,
      codeowners_changes: false,
      agents_policy_changes: false,
      dns_or_deployment_changes: false,
      secrets_or_env_changes: false,
      production_data_changes: false,
      live_github_mutations_from_implementation_code: false
    });

    for (const expectedFile of artifact.this_pr.expected_changed_files) {
      const normalized = normalizedPath(expectedFile);

      expect(
        PROTECTED_PATH_PARTS.some((part) => normalized.includes(part)),
        `${expectedFile} must not be a protected runtime or production file`
      ).toBe(false);
    }

    expect(artifact.protected_files_must_remain_unchanged).toEqual(
      expect.arrayContaining([
        "src/app/api/account-sync/route.ts",
        "src/app/api/account/sync/preview/route.ts",
        "middleware.ts",
        ".github/workflows/*",
        "AGENTS.md"
      ])
    );
  });

  test("PR #121 remains stale and not selectable", () => {
    const artifact = readVerification();
    const overlay = readStatusOverlay();
    const artifactPr121 = artifact.stale_open_pull_requests.find(
      (pr) => pr.number === 121
    );
    const overlayPr121 = overlay.stale_open_pull_requests.find(
      (pr) => pr.number === 121
    );

    expect(artifactPr121).toMatchObject({
      id: "PR-121",
      state: "open",
      stale: true,
      resulting_status: "stale_not_selectable",
      router_selectable: false,
      auto_selectable: false,
      auto_mergeable: false,
      owner_decision_required: true
    });
    expect(overlayPr121).toMatchObject({
      id: "PR-121",
      stale: true,
      resulting_status: "stale_not_selectable",
      auto_selectable: false,
      auto_mergeable: false
    });
  });

  test("public paid beta remains blocked and private manual beta remains gated", () => {
    const artifact = readVerification();
    const overlay = readStatusOverlay();

    expect(artifact.release_gates.public_paid_beta).toMatchObject({
      status: "blocked",
      owner_decision_required: true,
      unblocked_by_tb_090_verification: false
    });
    expect(artifact.release_gates.private_manual_beta).toMatchObject({
      status: "gated",
      owner_approval_required: true,
      manual_only: true,
      launched_by_tb_090_verification: false
    });
    expect(artifact.determination).toMatchObject({
      public_paid_beta_effect: "no_unblock",
      private_manual_beta_effect: "no_launch"
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
  });

  test("markdown artifact states the required safety boundaries", () => {
    const doc = readFileSync(
      join(
        process.cwd(),
        "docs",
        "factory",
        "tb-090-account-sync-skeleton-verification.md"
      ),
      "utf8"
    );

    expect(doc).toContain("Overall result: `partial_verified`.");
    expect(doc).toContain("No actual disabled account sync route skeleton exists.");
    expect(doc).toContain("Account sync is not implemented.");
    expect(doc).toContain("Payment and billing are not implemented.");
    expect(doc).toContain("Public paid beta remains blocked.");
    expect(doc).toContain(
      "Private/manual beta remains owner-approved, manual-only, and gated."
    );
    expect(doc).toContain("PR #121 remains stale/open/not auto-selectable.");
    expect(doc).toContain("database tables, schema, RLS, migrations");
    expect(doc).toContain("workflows, CODEOWNERS, AGENTS.md changes");
  });

  test("deterministic output ordering is independent of evidence input order", () => {
    const artifact = readVerification();
    const reversedArtifact: VerificationArtifact = {
      ...artifact,
      evidence_mapping: [...artifact.evidence_mapping].reverse(),
      actual_route_skeleton_files: [
        ...artifact.actual_route_skeleton_files
      ].reverse(),
      stop_reasons: [...artifact.stop_reasons].reverse()
    };

    expect(artifact.determinism).toMatchObject({
      same_input_produces_identical_verification_summary: true,
      live_github_mutations_from_implementation_code: false,
      auto_merge_enabled: false
    });
    expect(buildVerificationSummary(reversedArtifact)).toEqual(
      buildVerificationSummary(artifact)
    );
  });

  test("same input produces identical verification summary", () => {
    const artifact = readVerification();

    expect(buildVerificationSummary(artifact)).toEqual(
      buildVerificationSummary(artifact)
    );
    expect(JSON.stringify(buildVerificationSummary(artifact))).toBe(
      JSON.stringify(buildVerificationSummary(artifact))
    );
  });
});
