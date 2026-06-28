export const FACTORY_RELEASE_EVIDENCE_GUARD_VERSION = 1 as const;

export type FactoryReleaseEvidenceGuardVersion =
  typeof FACTORY_RELEASE_EVIDENCE_GUARD_VERSION;

export type ReleaseGuardTaskRisk = "low" | "medium" | "high";

export type ReleaseGuardTaskStatus =
  | "done"
  | "verified"
  | "in_review"
  | "ready"
  | "blocked_dependency"
  | "blocked_human"
  | "in_progress"
  | "pr_open"
  | "failed"
  | "deferred";

export type ReleaseGuardEvidenceStatus =
  | "passed"
  | "failed"
  | "missing"
  | "skipped"
  | "unknown";

export type ReleaseGuardRoadmapLike = {
  tasks?: readonly ReleaseGuardRoadmapTaskLike[] | null;
};

export type ReleaseGuardRoadmapTaskLike = {
  id?: string | null;
  phase?: string | null;
  title?: string | null;
  status?: string | null;
  risk?: string | null;
  depends_on?: readonly string[] | null;
  deliverables?: readonly string[] | null;
  acceptance?: readonly string[] | null;
  validation?: readonly string[] | null;
  human_gate?: boolean | null;
  auto_merge_eligible?: boolean | null;
  evidence?: readonly string[] | null;
};

export type ReleaseGuardPrLike = {
  number?: number | null;
  title?: string | null;
  labels?: readonly string[] | null;
  taskId?: string | null;
  state?: string | null;
  isDraft?: boolean | null;
  merged?: boolean | null;
  mergedAt?: string | null;
  mergeCommitSha?: string | null;
  branchName?: string | null;
};

export type ReleaseGuardMergeCommitLike = {
  sha?: string | null;
  prNumber?: number | null;
  committedAt?: string | null;
  message?: string | null;
};

export type ReleaseGuardEvidenceLike = {
  name?: string | null;
  status?: string | null;
  evidence?: string | null;
  completedAt?: string | null;
  commitSha?: string | null;
  isNoOp?: boolean | null;
};

export type ReleaseGuardRollbackEvidenceLike = {
  status?: string | null;
  evidence?: string | null;
  completedAt?: string | null;
  commitSha?: string | null;
};

export type ReleaseGuardOwnerApprovalLike = {
  approved?: boolean | null;
  evidence?: string | null;
  approvedAt?: string | null;
  approver?: string | null;
};

export type ReleaseGuardRiskClassificationLike = {
  risk?: string | null;
  taskSurface?: string | null;
  protectedPaths?: readonly string[] | null;
  requiresOwnerApproval?: boolean | null;
  changedFiles?: readonly string[] | null;
};

export type ReleaseGuardProtectedPathEvidenceLike = {
  path?: string | null;
  status?: string | null;
  evidence?: string | null;
};

export type ReleaseGuardPlannerInput = {
  roadmap?: ReleaseGuardRoadmapLike | null;
  targetTaskId?: string | null;
  pullRequests?: readonly ReleaseGuardPrLike[] | null;
  mergeCommit?: ReleaseGuardMergeCommitLike | null;
  ciChecks?: readonly ReleaseGuardEvidenceLike[] | null;
  validationResults?: readonly ReleaseGuardEvidenceLike[] | null;
  rollbackEvidence?: ReleaseGuardRollbackEvidenceLike | null;
  ownerApproval?: ReleaseGuardOwnerApprovalLike | null;
  changedFiles?: readonly string[] | null;
  riskClassification?: ReleaseGuardRiskClassificationLike | null;
  protectedPathEvidence?:
    | readonly ReleaseGuardProtectedPathEvidenceLike[]
    | null;
  options?: {
    dryRun?: boolean | null;
    liveGitHubMutations?: boolean | null;
    autoMerge?: boolean | null;
    now?: string | null;
    evidenceMaxAgeHours?: number | null;
  } | null;
};

export type ReleaseGuardVerificationProposal = {
  taskId: string;
  fromStatus: "ready";
  toStatus: "verified";
  apply: false;
  prNumber: number;
  mergeCommitSha: string;
  idempotencyKey: string;
  evidence: string[];
  ownerApprovalRequired: boolean;
};

export type ReleaseGuardNextTaskUnlockProposal = {
  taskId: string;
  fromStatus: "blocked_dependency";
  toStatus: "ready";
  apply: false;
  dependencySatisfiedBy: string;
};

export type ReleaseGuardPlannerResult = {
  version: FactoryReleaseEvidenceGuardVersion;
  status: "pass" | "fail";
  dryRun: true;
  liveGitHubMutations: false;
  autoMergeEnabled: false;
  targetTaskId: string;
  reasons: string[];
  acceptedEvidence: string[];
  rejectedEvidence: string[];
  requiredCiChecks: string[];
  requiredValidations: string[];
  missingEvidence: string[];
  protectedPaths: string[];
  requiresOwnerApproval: boolean;
  verificationProposals: ReleaseGuardVerificationProposal[];
  nextTaskUnlockProposals: ReleaseGuardNextTaskUnlockProposal[];
};

type NormalizedTask = {
  id: string;
  phase: string;
  title: string;
  status: string | null;
  risk: ReleaseGuardTaskRisk | null;
  rawRisk: string | null;
  dependsOn: string[];
  deliverables: string[];
  acceptance: string[];
  validation: string[];
  humanGate: boolean;
  autoMergeEligible: boolean;
};

type NormalizedPr = {
  number: number | null;
  title: string | null;
  labels: string[];
  taskId: string | null;
  state: string | null;
  isDraft: boolean | null;
  merged: boolean | null;
  mergedAt: string | null;
  mergeCommitSha: string | null;
  branchName: string | null;
};

type NormalizedMergeCommit = {
  sha: string | null;
  prNumber: number | null;
  committedAt: string | null;
  message: string | null;
};

type NormalizedEvidence = {
  name: string;
  status: ReleaseGuardEvidenceStatus | null;
  rawStatus: string | null;
  evidence: string | null;
  completedAt: string | null;
  commitSha: string | null;
  isNoOp: boolean;
};

type EvidenceSummary = {
  blockingReasons: string[];
  acceptedEvidence: string[];
  rejectedEvidence: string[];
  missingEvidence: string[];
};

type PrEvidenceSummary = EvidenceSummary & {
  prNumber: number | null;
  mergeCommitSha: string | null;
};

type OwnerApprovalSummary = EvidenceSummary & {
  nonBlockingReasons: string[];
};

const TARGET_TASK_ID = "FCT-060";
const DEFAULT_EVIDENCE_MAX_AGE_HOURS = 24;

const KNOWN_TASK_STATUSES: readonly ReleaseGuardTaskStatus[] = [
  "done",
  "verified",
  "in_review",
  "ready",
  "blocked_dependency",
  "blocked_human",
  "in_progress",
  "pr_open",
  "failed",
  "deferred"
];

const KNOWN_PR_STATES = new Set(["open", "closed", "merged"]);

const REQUIRED_CI_CHECKS = [
  "typecheck",
  "lint",
  "build",
  "full_test_suite",
  "targeted_tests"
];

const NO_OP_WORKFLOW_NAMES = new Set([
  "ci_repair",
  "codex_quality_gate",
  "risk_gate",
  "limited_auto_merge"
]);

const HARD_FORBIDDEN_PATH_RULES: readonly {
  id: string;
  match: (path: string) => boolean;
}[] = [
  {
    id: "github_workflows",
    match: (path) => path.startsWith(".github/workflows/")
  },
  {
    id: "codeowners",
    match: (path) => path === ".github/codeowners" || path === "codeowners"
  },
  {
    id: "agents_policy",
    match: (path) => path === "agents.md"
  },
  {
    id: "secrets_env",
    match: (path) =>
      path === ".env" ||
      path.startsWith(".env.") ||
      path.endsWith(".env") ||
      path.includes("/.env") ||
      path === ".npmrc" ||
      path.includes("secret") ||
      path.includes("secrets")
  },
  {
    id: "billing_payment_subscription",
    match: (path) =>
      path.includes("billing") ||
      path.includes("payment") ||
      path.includes("checkout") ||
      path.includes("subscription") ||
      path.includes("invoice") ||
      path.includes("stripe") ||
      path.includes("paddle")
  },
  {
    id: "deployment_dns_provider",
    match: (path) =>
      path === "vercel.json" ||
      path === "wrangler.toml" ||
      path.startsWith(".vercel/") ||
      path.startsWith("cloudflare/") ||
      path.startsWith("workers/") ||
      path.startsWith("infra/") ||
      path.startsWith("terraform/") ||
      path.endsWith(".tf") ||
      path.includes("dns") ||
      path.includes("provider")
  },
  {
    id: "production_data",
    match: (path) =>
      path.startsWith("r2/") ||
      path.startsWith("data/production/") ||
      path.includes("production-data")
  },
  {
    id: "webflow",
    match: (path) => path.includes("webflow")
  }
];

const PROTECTED_PATH_RULES: readonly ((path: string) => boolean)[] = [
  (path) => path.startsWith("src/lib/factory/"),
  (path) => path.startsWith("docs/roadmap/"),
  (path) => path === "plans.md",
  (path) => path === "roadmap.md",
  (path) => path === "docs/autonomous_delivery_policy.md",
  (path) => path === "docs/human_decision_boundaries.md",
  (path) => path === "docs/security_and_permissions.md",
  (path) => path === "docs/product_quality_rubric.md",
  (path) => path === "docs/release_checklist.md",
  (path) => path === "docs/track_b_release_blockers.md",
  (path) => path === "docs/vlx_revenue_autonomous_factory_master_plan_v1.md"
];

export function planFactoryReleaseEvidenceGuard(
  input: ReleaseGuardPlannerInput
): ReleaseGuardPlannerResult {
  const blockingReasons: string[] = [];
  const rejectedEvidence: string[] = [];
  const acceptedEvidence: string[] = [];
  const missingEvidence: string[] = [];
  const targetTaskId = normalizeTaskId(input.targetTaskId) || TARGET_TASK_ID;
  const tasks = normalizeTasks(input.roadmap?.tasks);
  const taskById = firstTaskById(tasks);
  const duplicateTaskIds = findDuplicateValues(
    tasks.map((task) => task.id).filter(Boolean)
  );
  const options = input.options ?? null;
  const evidenceMaxAgeHours = normalizeEvidenceMaxAgeHours(
    options?.evidenceMaxAgeHours
  );
  const changedFiles = normalizeChangedFiles(input.changedFiles);
  const riskSummary = summarizeRiskClassification(
    input.riskClassification,
    changedFiles
  );
  const pathSummary = summarizeProtectedPathEvidence({
    changedFiles,
    riskProtectedPaths: riskSummary.protectedPaths,
    protectedPathEvidence: input.protectedPathEvidence ?? []
  });

  if (!input.roadmap) {
    blockingReasons.push("missing_roadmap");
  }

  if (!Array.isArray(input.roadmap?.tasks) || input.roadmap?.tasks.length === 0) {
    blockingReasons.push("missing_tasks");
  }

  if (options?.dryRun === false) {
    blockingReasons.push("dry_run_false_not_supported_v1");
  }

  if (options?.liveGitHubMutations === true) {
    blockingReasons.push("live_github_mutation_request_not_supported_v1");
  }

  if (options?.autoMerge === true) {
    blockingReasons.push("auto_merge_request_not_supported_v1");
  }

  if (evidenceMaxAgeHours < 1) {
    blockingReasons.push(
      `invalid_evidence_max_age_hours:${evidenceMaxAgeHours}`
    );
  }

  for (const task of tasks) {
    if (!task.id) {
      blockingReasons.push("missing_task_id");
    }

    if (!task.status) {
      blockingReasons.push(`missing_task_status:${task.id || "missing_id"}`);
    } else if (!isKnownTaskStatus(task.status)) {
      blockingReasons.push(`unknown_task_status:${task.id}:${task.status}`);
    }

    if (!task.risk) {
      blockingReasons.push(
        `unknown_task_risk:${task.id}:${task.rawRisk ?? "missing"}`
      );
    }
  }

  for (const duplicateTaskId of duplicateTaskIds) {
    blockingReasons.push(`duplicate_task_id:${duplicateTaskId}`);
  }

  blockingReasons.push(...findUnresolvedDependencyReferences(tasks, taskById));

  const dependencyCycle = findDependencyCycle(tasks, taskById);

  if (dependencyCycle) {
    blockingReasons.push(`dependency_cycle:${dependencyCycle.join("->")}`);
  }

  const targetTask = taskById.get(targetTaskId) ?? null;

  if (!targetTask) {
    blockingReasons.push(`target_task_missing:${targetTaskId}`);
  } else {
    blockingReasons.push(...validateTargetTask(targetTask, taskById));
  }

  blockingReasons.push(...riskSummary.blockingReasons);
  blockingReasons.push(...pathSummary.blockingReasons);
  rejectedEvidence.push(...riskSummary.rejectedEvidence);
  rejectedEvidence.push(...pathSummary.rejectedEvidence);
  acceptedEvidence.push(...pathSummary.acceptedEvidence);
  missingEvidence.push(...pathSummary.missingEvidence);

  const requiredValidations = targetTask
    ? uniqueSorted(targetTask.validation.map(normalizeIdentifier))
    : [];
  const requiresOwnerApproval =
    targetTask?.risk === "high" ||
    targetTask?.humanGate === true ||
    riskSummary.requiresOwnerApproval ||
    pathSummary.protectedPaths.length > 0;

  const prSummary = summarizePrAndMergeEvidence({
    targetTaskId,
    pullRequests: input.pullRequests ?? [],
    mergeCommit: input.mergeCommit ?? null
  });
  const ciSummary = summarizeNamedEvidence({
    kind: "ci_check",
    requiredNames: REQUIRED_CI_CHECKS,
    evidence: input.ciChecks ?? [],
    mergeCommitSha: prSummary.mergeCommitSha,
    now: options?.now ?? null,
    evidenceMaxAgeHours
  });
  const validationSummary = summarizeNamedEvidence({
    kind: "validation",
    requiredNames: requiredValidations,
    evidence: input.validationResults ?? [],
    mergeCommitSha: prSummary.mergeCommitSha,
    now: options?.now ?? null,
    evidenceMaxAgeHours
  });
  const rollbackSummary = summarizeRollbackEvidence({
    rollbackEvidence: input.rollbackEvidence ?? null,
    mergeCommitSha: prSummary.mergeCommitSha,
    now: options?.now ?? null,
    evidenceMaxAgeHours
  });
  const ownerSummary = summarizeOwnerApproval(
    requiresOwnerApproval,
    input.ownerApproval ?? null
  );

  for (const summary of [
    prSummary,
    ciSummary,
    validationSummary,
    rollbackSummary,
    ownerSummary
  ]) {
    blockingReasons.push(...summary.blockingReasons);
    acceptedEvidence.push(...summary.acceptedEvidence);
    rejectedEvidence.push(...summary.rejectedEvidence);
    missingEvidence.push(...summary.missingEvidence);
  }

  const uniqueBlockingReasons = uniquePreserveOrder(blockingReasons);
  const normalizedAcceptedEvidence = uniqueSorted(acceptedEvidence);
  const status = uniqueBlockingReasons.length === 0 ? "pass" : "fail";
  const verificationProposals =
    status === "pass" &&
    targetTask &&
    prSummary.prNumber !== null &&
    prSummary.mergeCommitSha
      ? [
          buildVerificationProposal({
            task: targetTask,
            prNumber: prSummary.prNumber,
            mergeCommitSha: prSummary.mergeCommitSha,
            acceptedEvidence: normalizedAcceptedEvidence,
            requiresOwnerApproval
          })
        ]
      : [];
  const nextTaskUnlockProposals =
    status === "pass" && targetTask
      ? buildNextTaskUnlockProposals(tasks, targetTask.id)
      : [];
  const reasons = uniquePreserveOrder([
    ...uniqueBlockingReasons,
    ...ownerSummary.nonBlockingReasons,
    "dry_run_forced_v1",
    "live_github_mutations_disabled_v1",
    "auto_merge_disabled_v1",
    "roadmap_status_transition_proposal_only_v1",
    "fct_060_status_preserved_ready_v1"
  ]);

  return {
    version: FACTORY_RELEASE_EVIDENCE_GUARD_VERSION,
    status,
    dryRun: true,
    liveGitHubMutations: false,
    autoMergeEnabled: false,
    targetTaskId,
    reasons,
    acceptedEvidence: normalizedAcceptedEvidence,
    rejectedEvidence: uniqueSorted(rejectedEvidence),
    requiredCiChecks: [...REQUIRED_CI_CHECKS],
    requiredValidations,
    missingEvidence: uniqueSorted(missingEvidence),
    protectedPaths: pathSummary.protectedPaths,
    requiresOwnerApproval,
    verificationProposals,
    nextTaskUnlockProposals
  };
}

function normalizeTasks(
  tasks?: readonly ReleaseGuardRoadmapTaskLike[] | null
): NormalizedTask[] {
  if (!tasks) {
    return [];
  }

  return [...tasks]
    .map((task) => {
      const rawRisk = normalizeNullableString(task.risk);

      return {
        id: normalizeTaskId(task.id),
        phase: normalizeNullableString(task.phase) ?? "unknown",
        title: normalizeNullableString(task.title) ?? "",
        status: normalizeTaskStatus(task.status),
        risk: normalizeRisk(rawRisk),
        rawRisk,
        dependsOn: normalizeTaskIds(task.depends_on),
        deliverables: normalizeStringList(task.deliverables),
        acceptance: normalizeStringList(task.acceptance),
        validation: normalizeStringList(task.validation),
        humanGate: task.human_gate === true,
        autoMergeEligible: task.auto_merge_eligible === true
      };
    })
    .sort(compareTasksById);
}

function validateTargetTask(
  task: NormalizedTask,
  taskById: ReadonlyMap<string, NormalizedTask>
) {
  const reasons: string[] = [];

  if (task.status !== "ready") {
    reasons.push(`target_task_not_ready:${task.id}:${task.status ?? "missing"}`);
  }

  if (!task.title) {
    reasons.push(`missing_task_title:${task.id}`);
  }

  if (!task.risk) {
    reasons.push(`unknown_task_risk:${task.id}:${task.rawRisk ?? "missing"}`);
  }

  if (task.deliverables.length === 0) {
    reasons.push(`missing_task_deliverables:${task.id}`);
  }

  if (task.acceptance.length === 0) {
    reasons.push(`missing_task_acceptance:${task.id}`);
  }

  if (task.validation.length === 0) {
    reasons.push(`missing_task_validation:${task.id}`);
  }

  for (const dependencyId of task.dependsOn) {
    const dependency = taskById.get(dependencyId);

    if (!dependency) {
      continue;
    }

    if (dependency.status !== "verified") {
      reasons.push(
        `dependency_not_verified:${task.id}:${dependencyId}:${
          dependency.status ?? "missing"
        }`
      );
    }
  }

  if (task.risk === "high" && task.autoMergeEligible) {
    reasons.push(`high_risk_auto_merge_eligible_not_supported:${task.id}`);
  }

  return reasons;
}

function summarizePrAndMergeEvidence({
  targetTaskId,
  pullRequests,
  mergeCommit
}: {
  targetTaskId: string;
  pullRequests: readonly ReleaseGuardPrLike[];
  mergeCommit: ReleaseGuardMergeCommitLike | null;
}): PrEvidenceSummary {
  const blockingReasons: string[] = [];
  const acceptedEvidence: string[] = [];
  const rejectedEvidence: string[] = [];
  const missingEvidence: string[] = [];
  const prs = normalizePullRequests(pullRequests);
  const matchingPrs = prs.filter((pr) => prMatchesTask(pr, targetTaskId));

  if (matchingPrs.length === 0) {
    blockingReasons.push(`missing_pr_metadata:${targetTaskId}`);
    missingEvidence.push(`pr:${targetTaskId}`);
  } else if (matchingPrs.length > 1) {
    blockingReasons.push(`ambiguous_pr_metadata:${targetTaskId}`);
  }

  const pr = matchingPrs.length === 1 ? matchingPrs[0] : null;
  const normalizedMergeCommit = normalizeMergeCommit(mergeCommit);

  if (pr) {
    if (pr.number === null) {
      blockingReasons.push(`missing_pr_number:${targetTaskId}`);
    }

    if (!pr.state) {
      blockingReasons.push(`missing_pr_state:${targetTaskId}`);
    } else if (!KNOWN_PR_STATES.has(pr.state)) {
      blockingReasons.push(`unknown_pr_state:${targetTaskId}:${pr.state}`);
    }

    if (pr.isDraft === null) {
      blockingReasons.push(`missing_pr_draft_state:${targetTaskId}`);
    } else if (pr.isDraft) {
      blockingReasons.push(`pr_is_draft:${targetTaskId}:#${pr.number ?? "missing"}`);
    }

    const merged =
      pr.merged === true || pr.state === "merged";

    if (!merged) {
      blockingReasons.push(
        `pr_not_merged:${targetTaskId}:#${pr.number ?? "missing"}`
      );
    }

    if (!pr.mergeCommitSha) {
      blockingReasons.push(
        `missing_pr_merge_commit:${targetTaskId}:#${pr.number ?? "missing"}`
      );
    }
  }

  if (!mergeCommit) {
    blockingReasons.push(`missing_merge_commit_metadata:${targetTaskId}`);
    missingEvidence.push(`merge_commit:${targetTaskId}`);
  } else if (!normalizedMergeCommit.sha) {
    blockingReasons.push(`missing_merge_commit_sha:${targetTaskId}`);
  }

  if (
    pr?.number !== null &&
    pr?.number !== undefined &&
    normalizedMergeCommit.prNumber !== null &&
    normalizedMergeCommit.prNumber !== pr.number
  ) {
    blockingReasons.push(
      `merge_commit_pr_mismatch:${targetTaskId}:#${normalizedMergeCommit.prNumber}:#${pr.number}`
    );
  }

  if (
    pr?.mergeCommitSha &&
    normalizedMergeCommit.sha &&
    pr.mergeCommitSha !== normalizedMergeCommit.sha
  ) {
    blockingReasons.push(
      `merge_commit_sha_mismatch:${targetTaskId}:${normalizedMergeCommit.sha}:${pr.mergeCommitSha}`
    );
  }

  if (pr?.number !== null && pr?.number !== undefined && pr.merged === true) {
    acceptedEvidence.push(`pr:#${pr.number}:merged`);
  }

  if (normalizedMergeCommit.sha) {
    acceptedEvidence.push(`merge_commit:${normalizedMergeCommit.sha}`);
  }

  return {
    blockingReasons,
    acceptedEvidence,
    rejectedEvidence,
    missingEvidence,
    prNumber: pr?.number ?? null,
    mergeCommitSha: normalizedMergeCommit.sha
  };
}

function summarizeNamedEvidence({
  kind,
  requiredNames,
  evidence,
  mergeCommitSha,
  now,
  evidenceMaxAgeHours
}: {
  kind: "ci_check" | "validation";
  requiredNames: readonly string[];
  evidence: readonly ReleaseGuardEvidenceLike[];
  mergeCommitSha: string | null;
  now: string | null;
  evidenceMaxAgeHours: number;
}): EvidenceSummary {
  const blockingReasons: string[] = [];
  const acceptedEvidence: string[] = [];
  const rejectedEvidence: string[] = [];
  const missingEvidence: string[] = [];
  const normalizedEvidence = normalizeEvidenceList(evidence);

  if (normalizedEvidence.length === 0 && requiredNames.length > 0) {
    blockingReasons.push(`missing_${kind}_evidence`);
  }

  for (const item of normalizedEvidence) {
    if (item.isNoOp || NO_OP_WORKFLOW_NAMES.has(item.name)) {
      blockingReasons.push(`no_op_${kind}_not_release_evidence:${item.name}`);
      rejectedEvidence.push(`${kind}:${item.name}:no_op`);
    }

    if (!item.status) {
      blockingReasons.push(`missing_${kind}_status:${item.name}`);
    } else if (item.status === "unknown") {
      blockingReasons.push(
        `unknown_${kind}_status:${item.name}:${item.rawStatus ?? "unknown"}`
      );
    }
  }

  for (const requiredName of requiredNames) {
    const matchingEvidence = normalizedEvidence.filter(
      (item) => item.name === requiredName && !item.isNoOp
    );

    if (matchingEvidence.length === 0) {
      blockingReasons.push(`missing_required_${kind}:${requiredName}`);
      missingEvidence.push(`${kind}:${requiredName}`);
      continue;
    }

    if (matchingEvidence.length > 1) {
      blockingReasons.push(`ambiguous_${kind}_evidence:${requiredName}`);
      continue;
    }

    const item = matchingEvidence[0];

    if (NO_OP_WORKFLOW_NAMES.has(item.name)) {
      continue;
    }

    if (item.status !== "passed") {
      blockingReasons.push(
        `${kind}_not_passed:${item.name}:${item.status ?? "missing"}`
      );
      rejectedEvidence.push(`${kind}:${item.name}:${item.status ?? "missing"}`);
      continue;
    }

    if (!item.evidence) {
      blockingReasons.push(`missing_${kind}_evidence_detail:${item.name}`);
      missingEvidence.push(`${kind}:${item.name}:evidence`);
    }

    if (!mergeCommitSha) {
      blockingReasons.push(`missing_${kind}_merge_commit:${item.name}`);
    } else if (!item.commitSha) {
      blockingReasons.push(`missing_${kind}_commit:${item.name}`);
    } else if (item.commitSha !== mergeCommitSha) {
      blockingReasons.push(
        `${kind}_commit_mismatch:${item.name}:${item.commitSha}:${mergeCommitSha}`
      );
    }

    blockingReasons.push(
      ...validateEvidenceTimestamp({
        completedAt: item.completedAt,
        now,
        evidenceMaxAgeHours,
        evidenceName: `${kind}:${item.name}`
      })
    );

    if (
      item.evidence &&
      mergeCommitSha &&
      item.commitSha === mergeCommitSha
    ) {
      acceptedEvidence.push(`${kind}:${item.name}:${item.evidence}`);
    }
  }

  return {
    blockingReasons,
    acceptedEvidence,
    rejectedEvidence,
    missingEvidence
  };
}

function summarizeRollbackEvidence({
  rollbackEvidence,
  mergeCommitSha,
  now,
  evidenceMaxAgeHours
}: {
  rollbackEvidence: ReleaseGuardRollbackEvidenceLike | null;
  mergeCommitSha: string | null;
  now: string | null;
  evidenceMaxAgeHours: number;
}): EvidenceSummary {
  const blockingReasons: string[] = [];
  const acceptedEvidence: string[] = [];
  const rejectedEvidence: string[] = [];
  const missingEvidence: string[] = [];

  if (!rollbackEvidence) {
    return {
      blockingReasons: ["missing_rollback_evidence"],
      acceptedEvidence,
      rejectedEvidence,
      missingEvidence: ["rollback"]
    };
  }

  const status = normalizeEvidenceStatus(rollbackEvidence.status);
  const rawStatus = normalizeIdentifierOrNull(rollbackEvidence.status);
  const evidence = normalizeNullableString(rollbackEvidence.evidence);
  const commitSha = normalizeCommitSha(rollbackEvidence.commitSha);

  if (!status) {
    blockingReasons.push("missing_rollback_status");
  } else if (status === "unknown") {
    blockingReasons.push(
      `unknown_rollback_status:${rawStatus ?? "unknown"}`
    );
  } else if (status !== "passed") {
    blockingReasons.push(`rollback_not_passed:${status}`);
    rejectedEvidence.push(`rollback:${status}`);
  }

  if (!evidence) {
    blockingReasons.push("missing_rollback_evidence_detail");
    missingEvidence.push("rollback:evidence");
  }

  if (!mergeCommitSha) {
    blockingReasons.push("missing_rollback_merge_commit");
  } else if (!commitSha) {
    blockingReasons.push("missing_rollback_commit");
  } else if (commitSha !== mergeCommitSha) {
    blockingReasons.push(
      `rollback_commit_mismatch:${commitSha}:${mergeCommitSha}`
    );
  }

  blockingReasons.push(
    ...validateEvidenceTimestamp({
      completedAt: rollbackEvidence.completedAt,
      now,
      evidenceMaxAgeHours,
      evidenceName: "rollback"
    })
  );

  if (status === "passed" && evidence && commitSha === mergeCommitSha) {
    acceptedEvidence.push(`rollback:${evidence}`);
  }

  return {
    blockingReasons,
    acceptedEvidence,
    rejectedEvidence,
    missingEvidence
  };
}

function summarizeOwnerApproval(
  requiresOwnerApproval: boolean,
  ownerApproval: ReleaseGuardOwnerApprovalLike | null
): OwnerApprovalSummary {
  if (!requiresOwnerApproval) {
    return {
      blockingReasons: [],
      acceptedEvidence: [],
      rejectedEvidence: [],
      missingEvidence: [],
      nonBlockingReasons: []
    };
  }

  const evidence = normalizeNullableString(ownerApproval?.evidence);

  if (!ownerApproval) {
    return {
      blockingReasons: ["missing_owner_approval"],
      acceptedEvidence: [],
      rejectedEvidence: [],
      missingEvidence: ["owner_approval"],
      nonBlockingReasons: ["owner_approval_required"]
    };
  }

  if (ownerApproval.approved !== true) {
    return {
      blockingReasons: ["owner_approval_not_approved"],
      acceptedEvidence: [],
      rejectedEvidence: evidence
        ? [`owner_approval:${evidence}:not_approved`]
        : ["owner_approval:missing_evidence:not_approved"],
      missingEvidence: evidence ? [] : ["owner_approval:evidence"],
      nonBlockingReasons: ["owner_approval_required"]
    };
  }

  if (!evidence) {
    return {
      blockingReasons: ["missing_owner_approval_evidence"],
      acceptedEvidence: [],
      rejectedEvidence: ["owner_approval:missing_evidence"],
      missingEvidence: ["owner_approval:evidence"],
      nonBlockingReasons: ["owner_approval_required"]
    };
  }

  return {
    blockingReasons: [],
    acceptedEvidence: [`owner_approval:${evidence}`],
    rejectedEvidence: [],
    missingEvidence: [],
    nonBlockingReasons: ["owner_approval_required"]
  };
}

function summarizeRiskClassification(
  riskClassification: ReleaseGuardRiskClassificationLike | null | undefined,
  changedFiles: readonly string[]
) {
  const blockingReasons: string[] = [];
  const rejectedEvidence: string[] = [];
  const protectedPaths = normalizeChangedFiles(
    riskClassification?.protectedPaths ?? []
  );

  if (!riskClassification) {
    blockingReasons.push("missing_risk_classification");
  }

  if (changedFiles.length === 0) {
    blockingReasons.push("missing_changed_files");
  }

  const risk = normalizeRisk(normalizeNullableString(riskClassification?.risk));

  if (!riskClassification?.risk) {
    blockingReasons.push("missing_risk_classification_risk");
  } else if (!risk) {
    blockingReasons.push(
      `unknown_risk_classification:${normalizeIdentifier(
        riskClassification.risk
      )}`
    );
  }

  if (
    risk === "high" &&
    riskClassification?.requiresOwnerApproval === false
  ) {
    blockingReasons.push("high_risk_owner_approval_not_required");
  }

  if (riskClassification?.changedFiles) {
    const riskChangedFiles = normalizeChangedFiles(
      riskClassification.changedFiles
    );

    if (!stringListsEqual(riskChangedFiles, changedFiles)) {
      blockingReasons.push("risk_classification_changed_files_mismatch");
      rejectedEvidence.push("risk_classification:changed_files_mismatch");
    }
  }

  return {
    blockingReasons,
    rejectedEvidence,
    protectedPaths,
    requiresOwnerApproval:
      risk === "high" ||
      riskClassification?.requiresOwnerApproval === true ||
      protectedPaths.length > 0
  };
}

function summarizeProtectedPathEvidence({
  changedFiles,
  riskProtectedPaths,
  protectedPathEvidence
}: {
  changedFiles: readonly string[];
  riskProtectedPaths: readonly string[];
  protectedPathEvidence: readonly ReleaseGuardProtectedPathEvidenceLike[];
}) {
  const blockingReasons: string[] = [];
  const acceptedEvidence: string[] = [];
  const rejectedEvidence: string[] = [];
  const missingEvidence: string[] = [];
  const hardForbiddenPaths: string[] = [];
  const protectedPaths = uniqueSorted([
    ...riskProtectedPaths,
    ...changedFiles.filter(isProtectedPath)
  ]);
  const normalizedPathEvidence = normalizeProtectedPathEvidence(
    protectedPathEvidence
  );

  for (const path of changedFiles) {
    const forbiddenRule = findHardForbiddenPathRule(path);

    if (forbiddenRule) {
      hardForbiddenPaths.push(path);
      blockingReasons.push(`forbidden_changed_file:${path}:${forbiddenRule}`);
      rejectedEvidence.push(`changed_file:${path}:${forbiddenRule}`);
    }
  }

  for (const path of protectedPaths) {
    if (hardForbiddenPaths.includes(path)) {
      continue;
    }

    const evidence = normalizedPathEvidence.find(
      (candidate) => candidate.path === path
    );

    if (!evidence) {
      blockingReasons.push(`missing_protected_path_evidence:${path}`);
      missingEvidence.push(`protected_path:${path}`);
      continue;
    }

    if (!isAllowedProtectedPathStatus(evidence.status)) {
      blockingReasons.push(
        `protected_path_not_allowed:${path}:${evidence.status ?? "missing"}`
      );
      rejectedEvidence.push(
        `protected_path:${path}:${evidence.status ?? "missing"}`
      );
      continue;
    }

    if (!evidence.evidence) {
      blockingReasons.push(`missing_protected_path_evidence_detail:${path}`);
      missingEvidence.push(`protected_path:${path}:evidence`);
      continue;
    }

    acceptedEvidence.push(`protected_path:${path}:${evidence.evidence}`);
  }

  return {
    blockingReasons,
    acceptedEvidence,
    rejectedEvidence,
    missingEvidence,
    protectedPaths
  };
}

function normalizePullRequests(
  pullRequests: readonly ReleaseGuardPrLike[]
): NormalizedPr[] {
  return [...pullRequests]
    .map((pr) => ({
      number:
        typeof pr.number === "number" && Number.isFinite(pr.number)
          ? Math.floor(pr.number)
          : null,
      title: normalizeNullableString(pr.title),
      labels: normalizeStringList(pr.labels),
      taskId: normalizeTaskId(pr.taskId) || null,
      state: normalizeIdentifierOrNull(pr.state),
      isDraft: typeof pr.isDraft === "boolean" ? pr.isDraft : null,
      merged: typeof pr.merged === "boolean" ? pr.merged : null,
      mergedAt: normalizeNullableString(pr.mergedAt),
      mergeCommitSha: normalizeCommitSha(pr.mergeCommitSha),
      branchName: normalizeBranchName(pr.branchName)
    }))
    .sort(comparePullRequests);
}

function normalizeMergeCommit(
  mergeCommit: ReleaseGuardMergeCommitLike | null
): NormalizedMergeCommit {
  return {
    sha: normalizeCommitSha(mergeCommit?.sha),
    prNumber:
      typeof mergeCommit?.prNumber === "number" &&
      Number.isFinite(mergeCommit.prNumber)
        ? Math.floor(mergeCommit.prNumber)
        : null,
    committedAt: normalizeNullableString(mergeCommit?.committedAt),
    message: normalizeNullableString(mergeCommit?.message)
  };
}

function normalizeEvidenceList(
  evidence: readonly ReleaseGuardEvidenceLike[]
): NormalizedEvidence[] {
  return [...evidence]
    .map((item) => ({
      name: normalizeIdentifier(item.name ?? "missing"),
      status: normalizeEvidenceStatus(item.status),
      rawStatus: normalizeIdentifierOrNull(item.status),
      evidence: normalizeNullableString(item.evidence),
      completedAt: normalizeNullableString(item.completedAt),
      commitSha: normalizeCommitSha(item.commitSha),
      isNoOp: item.isNoOp === true
    }))
    .sort(compareEvidence);
}

function normalizeEvidenceStatus(
  status?: string | null
): ReleaseGuardEvidenceStatus | null {
  const normalized = normalizeIdentifierOrNull(status);

  if (!normalized) {
    return null;
  }

  if (normalized === "passed" || normalized === "success") {
    return "passed";
  }

  if (normalized === "failed" || normalized === "failure") {
    return "failed";
  }

  if (
    normalized === "missing" ||
    normalized === "skipped" ||
    normalized === "unknown"
  ) {
    return normalized;
  }

  return "unknown";
}

function normalizeProtectedPathEvidence(
  evidence: readonly ReleaseGuardProtectedPathEvidenceLike[]
) {
  return [...evidence]
    .map((item) => ({
      path: normalizeChangedFile(item.path ?? ""),
      status: normalizeIdentifierOrNull(item.status),
      evidence: normalizeNullableString(item.evidence)
    }))
    .filter((item) => item.path.length > 0)
    .sort((left, right) => compareStrings(left.path, right.path));
}

function validateEvidenceTimestamp({
  completedAt,
  now,
  evidenceMaxAgeHours,
  evidenceName
}: {
  completedAt?: string | null;
  now: string | null;
  evidenceMaxAgeHours: number;
  evidenceName: string;
}) {
  const reasons: string[] = [];

  if (!now) {
    reasons.push("missing_evidence_now");
    return reasons;
  }

  const nowMs = Date.parse(now);

  if (!Number.isFinite(nowMs)) {
    reasons.push(`invalid_evidence_now:${now}`);
    return reasons;
  }

  if (!completedAt) {
    reasons.push(`missing_evidence_completed_at:${evidenceName}`);
    return reasons;
  }

  const completedAtMs = Date.parse(completedAt);

  if (!Number.isFinite(completedAtMs)) {
    reasons.push(`invalid_evidence_completed_at:${evidenceName}`);
    return reasons;
  }

  if (completedAtMs > nowMs) {
    reasons.push(`evidence_in_future:${evidenceName}`);
    return reasons;
  }

  const ageHours = Math.floor((nowMs - completedAtMs) / 3600000);

  if (ageHours > evidenceMaxAgeHours) {
    reasons.push(
      `stale_evidence:${evidenceName}:${ageHours}h>${evidenceMaxAgeHours}h`
    );
  }

  return reasons;
}

function buildVerificationProposal({
  task,
  prNumber,
  mergeCommitSha,
  acceptedEvidence,
  requiresOwnerApproval
}: {
  task: NormalizedTask;
  prNumber: number;
  mergeCommitSha: string;
  acceptedEvidence: readonly string[];
  requiresOwnerApproval: boolean;
}): ReleaseGuardVerificationProposal {
  return {
    taskId: task.id,
    fromStatus: "ready",
    toStatus: "verified",
    apply: false,
    prNumber,
    mergeCommitSha,
    idempotencyKey: `vlx-release-guard:${task.id}:pr-${prNumber}:${mergeCommitSha}:v1`,
    evidence: [
      `PR #${prNumber}`,
      `merge commit ${mergeCommitSha}`,
      ...acceptedEvidence
    ],
    ownerApprovalRequired: requiresOwnerApproval
  };
}

function buildNextTaskUnlockProposals(
  tasks: readonly NormalizedTask[],
  verifiedTaskId: string
): ReleaseGuardNextTaskUnlockProposal[] {
  return tasks
    .filter((task) => task.status === "blocked_dependency")
    .filter((task) => task.dependsOn.includes(verifiedTaskId))
    .filter((task) =>
      task.dependsOn.every((dependencyId) => {
        if (dependencyId === verifiedTaskId) {
          return true;
        }

        return tasks.some(
          (candidate) =>
            candidate.id === dependencyId && candidate.status === "verified"
        );
      })
    )
    .sort(compareTasksById)
    .map((task) => ({
      taskId: task.id,
      fromStatus: "blocked_dependency" as const,
      toStatus: "ready" as const,
      apply: false as const,
      dependencySatisfiedBy: verifiedTaskId
    }));
}

function prMatchesTask(pr: NormalizedPr, targetTaskId: string) {
  if (pr.taskId === targetTaskId) {
    return true;
  }

  if (pr.labels.some((label) => normalizeTaskLabel(label) === targetTaskId)) {
    return true;
  }

  return pr.title?.startsWith(`[${targetTaskId}]`) ?? false;
}

function normalizeTaskLabel(label: string) {
  const normalized = normalizeNullableString(label) ?? "";
  const match = /^task:(.+)$/i.exec(normalized);

  return match ? normalizeTaskId(match[1]) : "";
}

function findUnresolvedDependencyReferences(
  tasks: readonly NormalizedTask[],
  taskById: ReadonlyMap<string, NormalizedTask>
) {
  const reasons: string[] = [];

  for (const task of tasks) {
    for (const dependencyId of task.dependsOn) {
      if (!taskById.has(dependencyId)) {
        reasons.push(`missing_dependency:${task.id}:${dependencyId}`);
      }
    }
  }

  return uniqueSorted(reasons);
}

function findDependencyCycle(
  tasks: readonly NormalizedTask[],
  taskById: ReadonlyMap<string, NormalizedTask>
) {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  function visit(taskId: string): string[] | null {
    if (visiting.has(taskId)) {
      const cycleStartIndex = stack.indexOf(taskId);

      return [...stack.slice(cycleStartIndex), taskId];
    }

    if (visited.has(taskId)) {
      return null;
    }

    const task = taskById.get(taskId);

    if (!task) {
      return null;
    }

    visiting.add(taskId);
    stack.push(taskId);

    for (const dependencyId of [...task.dependsOn].sort(compareStrings)) {
      const cycle = visit(dependencyId);

      if (cycle) {
        return cycle;
      }
    }

    stack.pop();
    visiting.delete(taskId);
    visited.add(taskId);

    return null;
  }

  for (const task of tasks) {
    const cycle = visit(task.id);

    if (cycle) {
      return cycle;
    }
  }

  return null;
}

function firstTaskById(tasks: readonly NormalizedTask[]) {
  const taskById = new Map<string, NormalizedTask>();

  for (const task of tasks) {
    if (!task.id || taskById.has(task.id)) {
      continue;
    }

    taskById.set(task.id, task);
  }

  return taskById;
}

function findDuplicateValues(values: readonly string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
      continue;
    }

    seen.add(value);
  }

  return [...duplicates].sort(compareStrings);
}

function normalizeTaskIds(values?: readonly string[] | null) {
  return normalizeStringList(values).map(normalizeTaskId).sort(compareStrings);
}

function normalizeTaskId(value?: string | null) {
  return normalizeNullableString(value)?.toUpperCase() ?? "";
}

function normalizeStringList(values?: readonly string[] | null) {
  if (!values) {
    return [];
  }

  return values
    .map((value) => normalizeNullableString(value))
    .filter(isString);
}

function normalizeChangedFiles(changedFiles?: readonly string[] | null) {
  if (!changedFiles) {
    return [];
  }

  return [...new Set(changedFiles.map(normalizeChangedFile))]
    .filter(Boolean)
    .sort(compareStrings);
}

function normalizeChangedFile(changedFile: string) {
  return changedFile
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\.\//, "")
    .toLowerCase();
}

function normalizeNullableString(value?: string | null) {
  const normalized = normalizeWhitespace(value ?? "");

  return normalized.length > 0 ? normalized : null;
}

function normalizeTaskStatus(value?: string | null) {
  return normalizeNullableString(value)?.toLowerCase() ?? null;
}

function normalizeRisk(value?: string | null): ReleaseGuardTaskRisk | null {
  const normalized = value?.toLowerCase() ?? null;

  if (
    normalized === "low" ||
    normalized === "medium" ||
    normalized === "high"
  ) {
    return normalized;
  }

  return null;
}

function normalizeIdentifierOrNull(value?: string | null) {
  const normalized = normalizeNullableString(value);

  return normalized ? normalizeIdentifier(normalized) : null;
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeBranchName(value?: string | null) {
  const normalized = normalizeWhitespace(value ?? "")
    .replace(/\\/g, "/")
    .toLowerCase();

  return normalized.length > 0 ? normalized : null;
}

function normalizeCommitSha(value?: string | null) {
  const normalized = normalizeNullableString(value)?.toLowerCase() ?? null;

  return normalized;
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeEvidenceMaxAgeHours(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_EVIDENCE_MAX_AGE_HOURS;
  }

  return Math.floor(value);
}

function isKnownTaskStatus(value: string): value is ReleaseGuardTaskStatus {
  return KNOWN_TASK_STATUSES.includes(value as ReleaseGuardTaskStatus);
}

function isProtectedPath(path: string) {
  return (
    findHardForbiddenPathRule(path) !== null ||
    PROTECTED_PATH_RULES.some((match) => match(path))
  );
}

function findHardForbiddenPathRule(path: string) {
  return HARD_FORBIDDEN_PATH_RULES.find((rule) => rule.match(path))?.id ?? null;
}

function isAllowedProtectedPathStatus(status: string | null) {
  return (
    status === "approved_safe" ||
    status === "allowed" ||
    status === "passed" ||
    status === "verified"
  );
}

function stringListsEqual(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values)].sort(compareStrings);
}

function uniquePreserveOrder(values: readonly string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function isString(value: string | null): value is string {
  return value !== null;
}

function compareTasksById(left: NormalizedTask, right: NormalizedTask) {
  return compareStrings(left.id, right.id);
}

function comparePullRequests(left: NormalizedPr, right: NormalizedPr) {
  const byNumber = (left.number ?? 0) - (right.number ?? 0);

  if (byNumber !== 0) {
    return byNumber;
  }

  const byTaskId = compareStrings(left.taskId ?? "", right.taskId ?? "");

  if (byTaskId !== 0) {
    return byTaskId;
  }

  return compareStrings(left.title ?? "", right.title ?? "");
}

function compareEvidence(left: NormalizedEvidence, right: NormalizedEvidence) {
  const byName = compareStrings(left.name, right.name);

  if (byName !== 0) {
    return byName;
  }

  const byStatus = compareStrings(left.status ?? "", right.status ?? "");

  if (byStatus !== 0) {
    return byStatus;
  }

  return compareStrings(left.evidence ?? "", right.evidence ?? "");
}

function compareStrings(left: string, right: string) {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}
