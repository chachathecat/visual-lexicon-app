export const OWNER_COMMAND_CENTER_VERSION = 1 as const;

export type OwnerCommandCenterVersion =
  typeof OWNER_COMMAND_CENTER_VERSION;

export type OwnerCommandTaskRisk = "low" | "medium" | "high";

export type OwnerCommandTaskStatus =
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

export type OwnerCommandEvidenceStatus =
  | "passed"
  | "failed"
  | "missing"
  | "skipped"
  | "unknown";

export type OwnerCommandRoadmapLike = {
  release_gates?:
    | readonly {
        id?: string | null;
        required_tasks?: readonly string[] | null;
      }[]
    | null;
  tasks?: readonly OwnerCommandRoadmapTaskLike[] | null;
};

export type OwnerCommandRoadmapTaskLike = {
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

export type OwnerCommandPrSummaryLike = {
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

export type OwnerCommandEvidenceLike = {
  name?: string | null;
  status?: string | null;
  evidence?: string | null;
  completedAt?: string | null;
  commitSha?: string | null;
  isNoOp?: boolean | null;
};

export type OwnerCommandRiskClassificationLike = {
  risk?: string | null;
  taskSurface?: string | null;
  changedFiles?: readonly string[] | null;
  protectedPaths?: readonly string[] | null;
  requiresOwnerApproval?: boolean | null;
  evidence?: string | null;
};

export type OwnerCommandOwnerApprovalLike = {
  approved?: boolean | null;
  evidence?: string | null;
  approvedAt?: string | null;
  approver?: string | null;
};

export type OwnerCommandCenterInput = {
  roadmap?: OwnerCommandRoadmapLike | null;
  openPullRequests?: readonly OwnerCommandPrSummaryLike[] | null;
  mergedPullRequests?: readonly OwnerCommandPrSummaryLike[] | null;
  ciChecks?: readonly OwnerCommandEvidenceLike[] | null;
  validationResults?: readonly OwnerCommandEvidenceLike[] | null;
  releaseEvidence?: readonly OwnerCommandEvidenceLike[] | null;
  changedFiles?: readonly string[] | null;
  riskClassification?: OwnerCommandRiskClassificationLike | null;
  ownerApproval?: OwnerCommandOwnerApprovalLike | null;
  options?: {
    dryRun?: boolean | null;
    liveGitHubMutations?: boolean | null;
    autoMerge?: boolean | null;
    now?: string | null;
    evidenceMaxAgeHours?: number | null;
  } | null;
};

export type OwnerCommandFactoryGateStatus = {
  gateId: "G0_FACTORY_READY";
  status: "complete" | "pending_verification_sync" | "blocked";
  requiredTaskIds: string[];
  verifiedRequiredTaskIds: string[];
  pendingVerificationTaskIds: string[];
  missingVerifiedTaskIds: string[];
  summary: string;
};

export type OwnerCommandDecisionItem = {
  taskId: string;
  title: string;
  status: string;
  reason: string;
  recommendation: string;
  implementableNow: false;
};

export type OwnerCommandRiskSummary = {
  level: OwnerCommandTaskRisk;
  taskSurface: string;
  requiresOwnerApproval: boolean;
  changedFiles: string[];
  protectedChangedFiles: string[];
  forbiddenChangedFiles: string[];
  highRiskTaskIds: string[];
  evidence: string[];
};

export type OwnerCommandCiStatusSummary = {
  requiredChecks: string[];
  passedChecks: string[];
  failedChecks: string[];
  missingChecks: string[];
  unknownChecks: string[];
  noOpChecks: string[];
  acceptedEvidence: string[];
  rejectedEvidence: string[];
};

export type OwnerCommandCenterPacket = {
  version: OwnerCommandCenterVersion;
  status: "pass" | "fail";
  dryRun: true;
  liveGitHubMutations: false;
  autoMergeEnabled: false;
  factoryGateStatus: OwnerCommandFactoryGateStatus;
  verifiedFactoryTaskIds: string[];
  deferredTaskIds: string[];
  blockedHumanTaskIds: string[];
  readyTaskIds: string[];
  nextRecommendedActions: string[];
  ownerDecisionRequired: OwnerCommandDecisionItem[];
  riskSummary: OwnerCommandRiskSummary;
  changedFileScopeWarnings: string[];
  ciStatusSummary: OwnerCommandCiStatusSummary;
  mergeReadinessRecommendation: string;
  verificationSyncRecommendation: string;
  ownerApprovalCommentDraft: string;
  codexPromptDraft: string;
  worktreeBranchPlan: string;
  stopReasons: string[];
  safetyNotes: string[];
};

type NormalizedTask = {
  id: string;
  phase: string;
  title: string;
  status: string | null;
  risk: OwnerCommandTaskRisk | null;
  rawRisk: string | null;
  dependsOn: string[];
  deliverables: string[];
  acceptance: string[];
  validation: string[];
  humanGate: boolean;
  autoMergeEligible: boolean;
  evidence: string[];
};

type NormalizedPr = {
  number: number | null;
  title: string | null;
  labels: string[];
  taskId: string | null;
  state: string | null;
  rawState: string | null;
  isDraft: boolean | null;
  merged: boolean | null;
  mergedAt: string | null;
  mergeCommitSha: string | null;
  branchName: string | null;
};

type NormalizedEvidence = {
  name: string;
  status: OwnerCommandEvidenceStatus | null;
  rawStatus: string | null;
  evidence: string | null;
  completedAt: string | null;
  commitSha: string | null;
  isNoOp: boolean;
};

type EvidenceSummary = {
  stopReasons: string[];
  acceptedEvidence: string[];
  rejectedEvidence: string[];
};

type RequiredEvidenceSummary = EvidenceSummary & {
  passed: string[];
  failed: string[];
  missing: string[];
  unknown: string[];
  noOp: string[];
};

type MergedPrEvidenceSummary = EvidenceSummary & {
  validTaskIds: string[];
  pendingVerificationTaskIds: string[];
  prNumbersByTaskId: ReadonlyMap<string, number>;
};

type ScopeSummary = {
  stopReasons: string[];
  warnings: string[];
  riskSummary: OwnerCommandRiskSummary;
};

const G0_GATE_ID = "G0_FACTORY_READY";
const FCT_070_TASK_ID = "FCT-070";
const ACC_010_TASK_ID = "ACC-010";
const DEFAULT_EVIDENCE_MAX_AGE_HOURS = 48;

const DEFAULT_G0_REQUIRED_TASK_IDS = [
  "FCT-010",
  "FCT-020",
  "FCT-030",
  "FCT-040",
  "FCT-050",
  "FCT-060"
];

const KNOWN_TASK_STATUSES: readonly OwnerCommandTaskStatus[] = [
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

const REQUIRED_VALIDATION_RESULTS = [
  "owner_command_center_contract",
  "factory_regression_contract"
];

const NO_OP_WORKFLOW_NAMES = new Set([
  "ci_repair",
  "codex_quality_gate",
  "risk_gate",
  "limited_auto_merge"
]);

const TASK_SURFACES = new Set([
  "docs_only",
  "tests_only",
  "fixtures_only",
  "non_behavioral_refactor",
  "product_ui",
  "app_server_logic",
  "auth_session",
  "database_rls",
  "account_sync",
  "entitlement_grant",
  "usage_ledger",
  "billing_webhook_refund",
  "private_asset_download",
  "ai_provider",
  "secrets_env",
  "github_workflows",
  "codeowners",
  "agents_policy",
  "deployment_dns_production_data",
  "canonical_monetization",
  "roadmap_release_control_plane",
  "factory_control_plane"
]);

const TASK_SURFACE_ALIASES: Record<string, string> = {
  docs: "docs_only",
  documentation: "docs_only",
  tests: "tests_only",
  test: "tests_only",
  factory: "factory_control_plane",
  control_plane: "factory_control_plane",
  roadmap: "roadmap_release_control_plane",
  deployment: "deployment_dns_production_data",
  dns: "deployment_dns_production_data"
};

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
    id: "account_schema_rls_migration",
    match: (path) =>
      path.startsWith("supabase/") ||
      path.includes("migration") ||
      path.includes("migrations") ||
      path.includes("rls") ||
      path.includes("schema")
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

export function planOwnerCommandCenter(
  input: OwnerCommandCenterInput
): OwnerCommandCenterPacket {
  const stopReasons: string[] = [];
  const safetyNotes: string[] = [
    "Planner/mock-only output; implementation code performs no live GitHub mutations.",
    "dryRun is forced true, liveGitHubMutations is forced false, and autoMergeEnabled is forced false.",
    "FCT-070 remains deferred and is not planned for implementation or auto-merge.",
    "ACC-010 remains an owner decision item and is not implemented by this planner."
  ];
  const options = input.options ?? null;
  const tasks = normalizeTasks(input.roadmap?.tasks);
  const taskById = firstTaskById(tasks);
  const changedFiles = normalizeChangedFiles(input.changedFiles);
  const g0RequiredTaskIds = getG0RequiredTaskIds(input.roadmap);
  const evidenceMaxAgeHours = normalizeEvidenceMaxAgeHours(
    options?.evidenceMaxAgeHours
  );
  const now = normalizeNullableString(options?.now);

  if (!input.roadmap) {
    stopReasons.push("missing_roadmap");
  }

  if (!Array.isArray(input.roadmap?.tasks) || input.roadmap?.tasks.length === 0) {
    stopReasons.push("missing_roadmap_tasks");
  }

  if (!hasG0ReleaseGate(input.roadmap)) {
    stopReasons.push(`missing_factory_gate:${G0_GATE_ID}`);
  }

  if (options?.dryRun === false) {
    stopReasons.push("dry_run_false_not_supported_v1");
  }

  if (options?.liveGitHubMutations === true) {
    stopReasons.push("live_github_mutation_request_not_supported_v1");
  }

  if (options?.autoMerge === true) {
    stopReasons.push("auto_merge_request_not_supported_v1");
  }

  if (evidenceMaxAgeHours < 1) {
    stopReasons.push(
      `invalid_evidence_max_age_hours:${evidenceMaxAgeHours}`
    );
  }

  stopReasons.push(...validateTaskGraph(tasks, taskById));

  const mergedPrSummary = summarizeMergedPrEvidence({
    tasks,
    taskById,
    requiredTaskIds: g0RequiredTaskIds,
    mergedPullRequests: input.mergedPullRequests ?? []
  });
  const openPrSummary = summarizeOpenPullRequests(
    input.openPullRequests ?? []
  );
  const ciSummary = summarizeRequiredEvidence({
    kind: "ci_check",
    requiredNames: REQUIRED_CI_CHECKS,
    evidence: input.ciChecks ?? [],
    now,
    evidenceMaxAgeHours
  });
  const validationSummary = summarizeRequiredEvidence({
    kind: "validation",
    requiredNames: REQUIRED_VALIDATION_RESULTS,
    evidence: input.validationResults ?? [],
    now,
    evidenceMaxAgeHours
  });
  const releaseSummary = summarizeReleaseEvidence({
    releaseEvidence: input.releaseEvidence ?? [],
    now,
    evidenceMaxAgeHours
  });
  const scopeSummary = summarizeScope({
    changedFiles,
    riskClassification: input.riskClassification ?? null,
    tasks
  });

  stopReasons.push(...mergedPrSummary.stopReasons);
  stopReasons.push(...openPrSummary.stopReasons);
  stopReasons.push(...ciSummary.stopReasons);
  stopReasons.push(...validationSummary.stopReasons);
  stopReasons.push(...releaseSummary.stopReasons);
  stopReasons.push(...scopeSummary.stopReasons);

  const requiresOwnerApproval =
    scopeSummary.riskSummary.requiresOwnerApproval ||
    hasHighRiskReadyTask(tasks) ||
    scopeSummary.riskSummary.protectedChangedFiles.length > 0;
  const ownerApprovalSummary = summarizeOwnerApproval({
    requiresOwnerApproval,
    ownerApproval: input.ownerApproval ?? null
  });

  if (!hasApprovedOwnerApproval(input.ownerApproval ?? null)) {
    for (const path of scopeSummary.riskSummary.protectedChangedFiles) {
      stopReasons.push(`protected_changed_file_requires_owner_approval:${path}`);
    }
  }

  stopReasons.push(...ownerApprovalSummary.stopReasons);

  const factoryGateStatus = buildFactoryGateStatus({
    requiredTaskIds: g0RequiredTaskIds,
    taskById,
    validEvidenceTaskIds: mergedPrSummary.validTaskIds,
    pendingVerificationTaskIds: mergedPrSummary.pendingVerificationTaskIds
  });

  if (factoryGateStatus.status === "blocked") {
    stopReasons.push(...factoryGateStatus.missingVerifiedTaskIds.map(
      (taskId) => {
        const task = taskById.get(taskId);

        return `missing_verified_factory_task:${taskId}:${
          task?.status ?? "missing"
        }`;
      }
    ));
  }

  const fct070 = taskById.get(FCT_070_TASK_ID);

  if (!fct070) {
    stopReasons.push(`missing_task:${FCT_070_TASK_ID}`);
  } else if (fct070.status !== "deferred") {
    stopReasons.push(
      `fct_070_must_remain_deferred:${fct070.status ?? "missing"}`
    );
  }

  const acc010 = taskById.get(ACC_010_TASK_ID);

  if (!acc010) {
    stopReasons.push(`missing_task:${ACC_010_TASK_ID}`);
  } else if (acc010.status !== "blocked_human") {
    stopReasons.push(
      `acc_010_must_remain_blocked_human:${acc010.status ?? "missing"}`
    );
  }

  const verifiedFactoryTaskIds = tasks
    .filter((task) => task.id.startsWith("FCT-") && task.status === "verified")
    .map((task) => task.id)
    .sort(compareStrings);
  const deferredTaskIds = tasks
    .filter((task) => task.status === "deferred")
    .map((task) => task.id)
    .sort(compareStrings);
  const blockedHumanTaskIds = tasks
    .filter((task) => task.status === "blocked_human")
    .map((task) => task.id)
    .sort(compareStrings);
  const readyTaskIds = getSafeReadyTaskIds(tasks, taskById);
  const ownerDecisionRequired = buildOwnerDecisionItems(tasks);
  const nextRecommendedActions = buildNextRecommendedActions({
    factoryGateStatus,
    readyTaskIds,
    ownerDecisionRequired
  });
  const uniqueStopReasons = uniquePreserveOrder(stopReasons);
  const status = uniqueStopReasons.length === 0 ? "pass" : "fail";
  const verificationSyncRecommendation = buildVerificationSyncRecommendation({
    status,
    factoryGateStatus,
    prNumbersByTaskId: mergedPrSummary.prNumbersByTaskId
  });
  const mergeReadinessRecommendation =
    status === "pass"
      ? "Do not auto-merge. Owner review remains required before any high-risk or control-plane merge."
      : "Do not merge. Resolve stopReasons and rerun the planner before owner review.";

  return {
    version: OWNER_COMMAND_CENTER_VERSION,
    status,
    dryRun: true,
    liveGitHubMutations: false,
    autoMergeEnabled: false,
    factoryGateStatus,
    verifiedFactoryTaskIds,
    deferredTaskIds,
    blockedHumanTaskIds,
    readyTaskIds,
    nextRecommendedActions,
    ownerDecisionRequired,
    riskSummary: {
      ...scopeSummary.riskSummary,
      requiresOwnerApproval
    },
    changedFileScopeWarnings: scopeSummary.warnings,
    ciStatusSummary: {
      requiredChecks: [...REQUIRED_CI_CHECKS],
      passedChecks: ciSummary.passed,
      failedChecks: ciSummary.failed,
      missingChecks: ciSummary.missing,
      unknownChecks: ciSummary.unknown,
      noOpChecks: ciSummary.noOp,
      acceptedEvidence: uniqueSorted([
        ...ciSummary.acceptedEvidence,
        ...validationSummary.acceptedEvidence,
        ...releaseSummary.acceptedEvidence,
        ...ownerApprovalSummary.acceptedEvidence
      ]),
      rejectedEvidence: uniqueSorted([
        ...ciSummary.rejectedEvidence,
        ...validationSummary.rejectedEvidence,
        ...releaseSummary.rejectedEvidence,
        ...ownerApprovalSummary.rejectedEvidence,
        ...mergedPrSummary.rejectedEvidence
      ])
    },
    mergeReadinessRecommendation,
    verificationSyncRecommendation,
    ownerApprovalCommentDraft: buildOwnerApprovalCommentDraft({
      status,
      factoryGateStatus,
      readyTaskIds,
      blockedHumanTaskIds,
      stopReasons: uniqueStopReasons
    }),
    codexPromptDraft: buildCodexPromptDraft(factoryGateStatus),
    worktreeBranchPlan: buildWorktreeBranchPlan(readyTaskIds),
    stopReasons: uniqueStopReasons,
    safetyNotes
  };
}

function normalizeTasks(
  tasks?: readonly OwnerCommandRoadmapTaskLike[] | null
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
        autoMergeEligible: task.auto_merge_eligible === true,
        evidence: normalizeStringList(task.evidence)
      };
    })
    .sort(compareTasksById);
}

function getG0RequiredTaskIds(roadmap?: OwnerCommandRoadmapLike | null) {
  const gate = roadmap?.release_gates?.find(
    (candidate) => normalizeTaskId(candidate.id) === G0_GATE_ID
  );
  const requiredTaskIds = normalizeTaskIds(gate?.required_tasks);

  return requiredTaskIds.length > 0
    ? requiredTaskIds
    : [...DEFAULT_G0_REQUIRED_TASK_IDS];
}

function hasG0ReleaseGate(roadmap?: OwnerCommandRoadmapLike | null) {
  return (
    roadmap?.release_gates?.some(
      (candidate) => normalizeTaskId(candidate.id) === G0_GATE_ID
    ) === true
  );
}

function validateTaskGraph(
  tasks: readonly NormalizedTask[],
  taskById: ReadonlyMap<string, NormalizedTask>
) {
  const stopReasons: string[] = [];
  const duplicateTaskIds = findDuplicateValues(
    tasks.map((task) => task.id).filter(Boolean)
  );

  for (const task of tasks) {
    if (!task.id) {
      stopReasons.push("missing_task_id");
    }

    if (!task.status) {
      stopReasons.push(`missing_task_status:${task.id || "missing_id"}`);
    } else if (!isKnownTaskStatus(task.status)) {
      stopReasons.push(`unknown_task_status:${task.id}:${task.status}`);
    }

    if (!task.risk) {
      stopReasons.push(
        `unknown_task_risk:${task.id}:${task.rawRisk ?? "missing"}`
      );
    }

    if (task.id === FCT_070_TASK_ID && task.autoMergeEligible) {
      stopReasons.push("fct_070_auto_merge_eligible_not_supported");
    }
  }

  for (const duplicateTaskId of duplicateTaskIds) {
    stopReasons.push(`duplicate_task_id:${duplicateTaskId}`);
  }

  stopReasons.push(...findUnresolvedDependencyReferences(tasks, taskById));

  const dependencyCycle = findDependencyCycle(tasks, taskById);

  if (dependencyCycle) {
    stopReasons.push(`dependency_cycle:${dependencyCycle.join("->")}`);
  }

  return uniqueSorted(stopReasons);
}

function summarizeMergedPrEvidence({
  tasks,
  taskById,
  requiredTaskIds,
  mergedPullRequests
}: {
  tasks: readonly NormalizedTask[];
  taskById: ReadonlyMap<string, NormalizedTask>;
  requiredTaskIds: readonly string[];
  mergedPullRequests: readonly OwnerCommandPrSummaryLike[];
}): MergedPrEvidenceSummary {
  const stopReasons: string[] = [];
  const acceptedEvidence: string[] = [];
  const rejectedEvidence: string[] = [];
  const validTaskIds: string[] = [];
  const pendingVerificationTaskIds: string[] = [];
  const prNumbersByTaskId = new Map<string, number>();
  const prs = normalizePullRequests(mergedPullRequests);

  stopReasons.push(...validatePrStates(prs, "merged_pr"));

  for (const taskId of requiredTaskIds) {
    const task = taskById.get(taskId);

    if (!task) {
      stopReasons.push(`missing_factory_task:${taskId}`);
      continue;
    }

    const taskNeedsEvidence =
      task.status === "verified" || task.status === "ready";

    if (!taskNeedsEvidence) {
      continue;
    }

    const matchingPrs = prs.filter((pr) => prMatchesTask(pr, taskId));

    if (matchingPrs.length === 0) {
      stopReasons.push(`missing_merged_pr_evidence:${taskId}`);
      rejectedEvidence.push(`merged_pr:${taskId}:missing`);
      continue;
    }

    if (matchingPrs.length > 1) {
      stopReasons.push(`ambiguous_merged_pr_evidence:${taskId}`);
      rejectedEvidence.push(`merged_pr:${taskId}:ambiguous`);
      continue;
    }

    const pr = matchingPrs[0];
    const taskEvidenceStopReasons = validateMergedPrForTask(task, pr);

    stopReasons.push(...taskEvidenceStopReasons);

    if (taskEvidenceStopReasons.length === 0) {
      validTaskIds.push(taskId);

      if (typeof pr.number === "number") {
        prNumbersByTaskId.set(taskId, pr.number);
      }

      if (task.status === "ready") {
        pendingVerificationTaskIds.push(taskId);
      }

      acceptedEvidence.push(
        `merged_pr:${taskId}:#${pr.number}:merge_commit:${pr.mergeCommitSha}`
      );
    }
  }

  for (const pr of prs) {
    const matchedTask = tasks.some((task) => prMatchesTask(pr, task.id));

    if (!matchedTask) {
      stopReasons.push(
        `unknown_merged_pr_task:#${pr.number ?? "missing"}:${
          pr.taskId ?? "missing"
        }`
      );
    }
  }

  return {
    stopReasons: uniqueSorted(stopReasons),
    acceptedEvidence: uniqueSorted(acceptedEvidence),
    rejectedEvidence: uniqueSorted(rejectedEvidence),
    validTaskIds: uniqueSorted(validTaskIds),
    pendingVerificationTaskIds: uniqueSorted(pendingVerificationTaskIds),
    prNumbersByTaskId
  };
}

function validateMergedPrForTask(task: NormalizedTask, pr: NormalizedPr) {
  const stopReasons: string[] = [];

  if (pr.number === null) {
    stopReasons.push(`missing_pr_number:${task.id}`);
  }

  if (pr.isDraft === null) {
    stopReasons.push(`missing_pr_draft_state:${task.id}`);
  } else if (pr.isDraft) {
    stopReasons.push(`merged_pr_is_draft:${task.id}:#${pr.number ?? "missing"}`);
  }

  const merged = pr.merged === true || pr.state === "merged";

  if (!merged) {
    stopReasons.push(`pr_not_merged:${task.id}:#${pr.number ?? "missing"}`);
  }

  if (!pr.mergeCommitSha) {
    stopReasons.push(
      `missing_pr_merge_commit:${task.id}:#${pr.number ?? "missing"}`
    );
  }

  if (task.status === "verified") {
    const prEvidence = `PR #${pr.number}`;
    const mergeEvidence = `merge commit ${pr.mergeCommitSha}`;

    if (!task.evidence.includes(prEvidence)) {
      stopReasons.push(`missing_roadmap_pr_evidence:${task.id}:${prEvidence}`);
    }

    if (!pr.mergeCommitSha || !task.evidence.includes(mergeEvidence)) {
      stopReasons.push(
        `missing_roadmap_merge_evidence:${task.id}:${mergeEvidence}`
      );
    }
  }

  return stopReasons;
}

function summarizeOpenPullRequests(
  openPullRequests: readonly OwnerCommandPrSummaryLike[]
): EvidenceSummary {
  const prs = normalizePullRequests(openPullRequests);

  return {
    stopReasons: validatePrStates(prs, "open_pr"),
    acceptedEvidence: [],
    rejectedEvidence: []
  };
}

function validatePrStates(prs: readonly NormalizedPr[], prefix: string) {
  const stopReasons: string[] = [];

  for (const pr of prs) {
    if (!pr.state) {
      stopReasons.push(`${prefix}_missing_state:#${pr.number ?? "missing"}`);
    } else if (!KNOWN_PR_STATES.has(pr.state)) {
      stopReasons.push(
        `${prefix}_unknown_state:#${pr.number ?? "missing"}:${
          pr.rawState ?? "unknown"
        }`
      );
    }
  }

  return stopReasons;
}

function summarizeRequiredEvidence({
  kind,
  requiredNames,
  evidence,
  now,
  evidenceMaxAgeHours
}: {
  kind: "ci_check" | "validation";
  requiredNames: readonly string[];
  evidence: readonly OwnerCommandEvidenceLike[];
  now: string | null;
  evidenceMaxAgeHours: number;
}): RequiredEvidenceSummary {
  const stopReasons: string[] = [];
  const acceptedEvidence: string[] = [];
  const rejectedEvidence: string[] = [];
  const passed: string[] = [];
  const failed: string[] = [];
  const missing: string[] = [];
  const unknown: string[] = [];
  const noOp: string[] = [];
  const normalizedEvidence = normalizeEvidenceList(evidence);

  for (const item of normalizedEvidence) {
    if (item.isNoOp || NO_OP_WORKFLOW_NAMES.has(item.name)) {
      stopReasons.push(`no_op_${kind}_not_release_evidence:${item.name}`);
      rejectedEvidence.push(`${kind}:${item.name}:no_op`);
      noOp.push(item.name);
    }

    if (!item.status) {
      stopReasons.push(
        `unknown_${kind}_state:${item.name}:${item.rawStatus ?? "missing"}`
      );
      unknown.push(item.name);
    } else if (item.status === "unknown") {
      stopReasons.push(
        `unknown_${kind}_state:${item.name}:${item.rawStatus ?? "unknown"}`
      );
      unknown.push(item.name);
    } else if (item.status === "failed" || item.status === "skipped") {
      failed.push(item.name);
    }
  }

  for (const requiredName of requiredNames) {
    const matches = normalizedEvidence.filter(
      (item) => item.name === requiredName && !item.isNoOp
    );

    if (matches.length === 0) {
      stopReasons.push(`missing_required_${kind}:${requiredName}`);
      missing.push(requiredName);
      continue;
    }

    if (matches.length > 1) {
      stopReasons.push(`ambiguous_${kind}_evidence:${requiredName}`);
      continue;
    }

    const item = matches[0];

    if (NO_OP_WORKFLOW_NAMES.has(item.name)) {
      missing.push(requiredName);
      continue;
    }

    if (item.status !== "passed") {
      stopReasons.push(
        `${kind}_not_passed:${requiredName}:${item.status ?? "unknown"}`
      );
      rejectedEvidence.push(
        `${kind}:${requiredName}:${item.status ?? "unknown"}`
      );
      continue;
    }

    if (!item.evidence) {
      stopReasons.push(`missing_${kind}_evidence_detail:${requiredName}`);
      continue;
    }

    stopReasons.push(
      ...validateEvidenceTimestamp({
        kind,
        name: requiredName,
        completedAt: item.completedAt,
        now,
        evidenceMaxAgeHours
      })
    );

    passed.push(requiredName);
    acceptedEvidence.push(`${kind}:${requiredName}:${item.evidence}`);
  }

  return {
    stopReasons: uniqueSorted(stopReasons),
    acceptedEvidence: uniqueSorted(acceptedEvidence),
    rejectedEvidence: uniqueSorted(rejectedEvidence),
    passed: uniqueSorted(passed),
    failed: uniqueSorted(failed),
    missing: uniqueSorted(missing),
    unknown: uniqueSorted(unknown),
    noOp: uniqueSorted(noOp)
  };
}

function summarizeReleaseEvidence({
  releaseEvidence,
  now,
  evidenceMaxAgeHours
}: {
  releaseEvidence: readonly OwnerCommandEvidenceLike[];
  now: string | null;
  evidenceMaxAgeHours: number;
}): EvidenceSummary {
  const stopReasons: string[] = [];
  const acceptedEvidence: string[] = [];
  const rejectedEvidence: string[] = [];
  const normalizedEvidence = normalizeEvidenceList(releaseEvidence);
  const nonNoOpEvidence = normalizedEvidence.filter(
    (item) => !item.isNoOp && !NO_OP_WORKFLOW_NAMES.has(item.name)
  );

  if (normalizedEvidence.length === 0) {
    stopReasons.push("missing_release_evidence");
  }

  if (normalizedEvidence.length > 0 && nonNoOpEvidence.length === 0) {
    stopReasons.push("no_op_only_release_evidence");
  }

  for (const item of normalizedEvidence) {
    if (item.isNoOp || NO_OP_WORKFLOW_NAMES.has(item.name)) {
      stopReasons.push(`no_op_release_evidence:${item.name}`);
      rejectedEvidence.push(`release_evidence:${item.name}:no_op`);
      continue;
    }

    if (!item.status) {
      stopReasons.push(
        `unknown_release_evidence_state:${item.name}:${
          item.rawStatus ?? "missing"
        }`
      );
      continue;
    }

    if (item.status === "unknown") {
      stopReasons.push(
        `unknown_release_evidence_state:${item.name}:${
          item.rawStatus ?? "unknown"
        }`
      );
      rejectedEvidence.push(`release_evidence:${item.name}:unknown`);
      continue;
    }

    if (item.status !== "passed") {
      stopReasons.push(`release_evidence_not_passed:${item.name}:${item.status}`);
      rejectedEvidence.push(`release_evidence:${item.name}:${item.status}`);
      continue;
    }

    if (!item.evidence) {
      stopReasons.push(`missing_release_evidence_detail:${item.name}`);
      continue;
    }

    stopReasons.push(
      ...validateEvidenceTimestamp({
        kind: "release_evidence",
        name: item.name,
        completedAt: item.completedAt,
        now,
        evidenceMaxAgeHours
      })
    );

    acceptedEvidence.push(`release_evidence:${item.name}:${item.evidence}`);
  }

  return {
    stopReasons: uniqueSorted(stopReasons),
    acceptedEvidence: uniqueSorted(acceptedEvidence),
    rejectedEvidence: uniqueSorted(rejectedEvidence)
  };
}

function summarizeScope({
  changedFiles,
  riskClassification,
  tasks
}: {
  changedFiles: readonly string[];
  riskClassification: OwnerCommandRiskClassificationLike | null;
  tasks: readonly NormalizedTask[];
}): ScopeSummary {
  const stopReasons: string[] = [];
  const warnings: string[] = [];
  const forbiddenChangedFiles: string[] = [];
  const protectedChangedFiles = uniqueSorted([
    ...changedFiles.filter(isProtectedPath),
    ...normalizeChangedFiles(riskClassification?.protectedPaths)
  ]);
  const risk = normalizeRisk(normalizeNullableString(riskClassification?.risk));
  const taskSurface = normalizeTaskSurface(riskClassification?.taskSurface);
  const highRiskTaskIds = tasks
    .filter((task) => task.risk === "high")
    .map((task) => task.id)
    .filter(Boolean)
    .sort(compareStrings);

  if (changedFiles.length === 0) {
    stopReasons.push("missing_changed_files");
  }

  if (!riskClassification) {
    stopReasons.push("missing_risk_classification");
  }

  if (!riskClassification?.risk) {
    stopReasons.push("missing_risk_classification_risk");
  } else if (!risk) {
    stopReasons.push(
      `unknown_risk_classification:${normalizeIdentifier(
        riskClassification.risk
      )}`
    );
  }

  if (!riskClassification?.taskSurface) {
    stopReasons.push("missing_task_surface");
  } else if (!taskSurface) {
    stopReasons.push(
      `unknown_task_surface:${normalizeIdentifier(
        riskClassification.taskSurface
      )}`
    );
  }

  if (riskClassification?.changedFiles) {
    const classifiedChangedFiles = normalizeChangedFiles(
      riskClassification.changedFiles
    );

    if (!stringListsEqual(classifiedChangedFiles, changedFiles)) {
      stopReasons.push("risk_classification_changed_files_mismatch");
    }
  }

  for (const path of changedFiles) {
    const forbiddenRule = findHardForbiddenPathRule(path);

    if (forbiddenRule) {
      forbiddenChangedFiles.push(path);
      stopReasons.push(`forbidden_changed_file:${path}:${forbiddenRule}`);
      warnings.push(`forbidden_changed_file:${path}:${forbiddenRule}`);
      continue;
    }

    if (isProtectedPath(path)) {
      warnings.push(`protected_changed_file:${path}`);
    }
  }

  const effectiveRisk = risk ?? "high";
  const effectiveTaskSurface = taskSurface ?? "unknown";
  const requiresOwnerApproval =
    effectiveRisk === "high" ||
    effectiveTaskSurface === "factory_control_plane" ||
    effectiveTaskSurface === "roadmap_release_control_plane" ||
    protectedChangedFiles.length > 0 ||
    riskClassification?.requiresOwnerApproval === true;

  if (
    effectiveRisk === "high" &&
    riskClassification?.requiresOwnerApproval === false
  ) {
    stopReasons.push("high_risk_owner_approval_not_required");
  }

  return {
    stopReasons: uniqueSorted(stopReasons),
    warnings: uniqueSorted(warnings),
    riskSummary: {
      level: effectiveRisk,
      taskSurface: effectiveTaskSurface,
      requiresOwnerApproval,
      changedFiles: [...changedFiles],
      protectedChangedFiles,
      forbiddenChangedFiles: uniqueSorted(forbiddenChangedFiles),
      highRiskTaskIds,
      evidence: normalizeStringList(
        riskClassification?.evidence ? [riskClassification.evidence] : []
      )
    }
  };
}

function summarizeOwnerApproval({
  requiresOwnerApproval,
  ownerApproval
}: {
  requiresOwnerApproval: boolean;
  ownerApproval: OwnerCommandOwnerApprovalLike | null;
}): EvidenceSummary {
  if (!requiresOwnerApproval) {
    return {
      stopReasons: [],
      acceptedEvidence: [],
      rejectedEvidence: []
    };
  }

  const evidence = normalizeNullableString(ownerApproval?.evidence);

  if (!ownerApproval) {
    return {
      stopReasons: ["owner_approval_required", "missing_owner_approval"],
      acceptedEvidence: [],
      rejectedEvidence: ["owner_approval:missing"]
    };
  }

  if (ownerApproval.approved !== true) {
    return {
      stopReasons: ["owner_approval_required", "owner_approval_not_approved"],
      acceptedEvidence: [],
      rejectedEvidence: evidence
        ? [`owner_approval:${evidence}:not_approved`]
        : ["owner_approval:missing_evidence:not_approved"]
    };
  }

  if (!evidence) {
    return {
      stopReasons: [
        "owner_approval_required",
        "missing_owner_approval_evidence"
      ],
      acceptedEvidence: [],
      rejectedEvidence: ["owner_approval:missing_evidence"]
    };
  }

  return {
    stopReasons: [],
    acceptedEvidence: [`owner_approval:${evidence}`],
    rejectedEvidence: []
  };
}

function hasApprovedOwnerApproval(
  ownerApproval: OwnerCommandOwnerApprovalLike | null
) {
  return (
    ownerApproval?.approved === true &&
    normalizeNullableString(ownerApproval.evidence) !== null
  );
}

function buildFactoryGateStatus({
  requiredTaskIds,
  taskById,
  validEvidenceTaskIds,
  pendingVerificationTaskIds
}: {
  requiredTaskIds: readonly string[];
  taskById: ReadonlyMap<string, NormalizedTask>;
  validEvidenceTaskIds: readonly string[];
  pendingVerificationTaskIds: readonly string[];
}): OwnerCommandFactoryGateStatus {
  const verifiedRequiredTaskIds = requiredTaskIds
    .filter((taskId) => taskById.get(taskId)?.status === "verified")
    .sort(compareStrings);
  const validEvidenceTaskIdSet = new Set(validEvidenceTaskIds);
  const pendingVerificationTaskIdSet = new Set(pendingVerificationTaskIds);
  const missingVerifiedTaskIds = requiredTaskIds.filter((taskId) => {
    const task = taskById.get(taskId);

    if (!task) {
      return true;
    }

    if (task.status === "verified") {
      return !validEvidenceTaskIdSet.has(taskId);
    }

    if (task.status === "ready") {
      return !pendingVerificationTaskIdSet.has(taskId);
    }

    return true;
  });
  const pendingIds = requiredTaskIds
    .filter((taskId) => pendingVerificationTaskIdSet.has(taskId))
    .sort(compareStrings);
  const status =
    missingVerifiedTaskIds.length > 0
      ? "blocked"
      : pendingIds.length > 0
        ? "pending_verification_sync"
        : "complete";
  const summary =
    status === "complete"
      ? "G0 factory bootstrap is complete: FCT-010 through FCT-060 are verified with merge evidence."
      : status === "pending_verification_sync"
        ? `G0 factory bootstrap is pending verification sync for ${pendingIds.join(
            ", "
          )}.`
        : `G0 factory bootstrap is blocked by ${missingVerifiedTaskIds.join(
            ", "
          )}.`;

  return {
    gateId: G0_GATE_ID,
    status,
    requiredTaskIds: [...requiredTaskIds],
    verifiedRequiredTaskIds,
    pendingVerificationTaskIds: pendingIds,
    missingVerifiedTaskIds: uniqueSorted(missingVerifiedTaskIds),
    summary
  };
}

function getSafeReadyTaskIds(
  tasks: readonly NormalizedTask[],
  taskById: ReadonlyMap<string, NormalizedTask>
) {
  return tasks
    .filter((task) => task.status === "ready")
    .filter((task) => task.id !== FCT_070_TASK_ID)
    .filter((task) =>
      task.dependsOn.every(
        (dependencyId) => taskById.get(dependencyId)?.status === "verified"
      )
    )
    .map((task) => task.id)
    .sort(compareStrings);
}

function buildOwnerDecisionItems(
  tasks: readonly NormalizedTask[]
): OwnerCommandDecisionItem[] {
  return tasks
    .filter((task) => task.status === "blocked_human")
    .map((task) => ({
      taskId: task.id,
      title: task.title,
      status: task.status ?? "missing",
      reason:
        task.id === ACC_010_TASK_ID
          ? "Account schema, indexes, migrations, and RLS require an explicit owner decision before implementation."
          : "Roadmap marks this task blocked_human, so the planner cannot turn it into implementation work.",
      recommendation:
        task.id === ACC_010_TASK_ID
          ? "Keep ACC-010 blocked_human until the owner chooses the account/RLS direction."
          : "Keep blocked_human until the owner records a decision for this track.",
      implementableNow: false as const
    }))
    .sort((left, right) => compareStrings(left.taskId, right.taskId));
}

function buildNextRecommendedActions({
  factoryGateStatus,
  readyTaskIds,
  ownerDecisionRequired
}: {
  factoryGateStatus: OwnerCommandFactoryGateStatus;
  readyTaskIds: readonly string[];
  ownerDecisionRequired: readonly OwnerCommandDecisionItem[];
}) {
  const actions: string[] = [];

  if (factoryGateStatus.status === "complete") {
    actions.push("g0_factory_bootstrap_complete");
  } else if (factoryGateStatus.status === "pending_verification_sync") {
    actions.push("prepare_owner_review_for_verification_sync");
  } else {
    actions.push("resolve_factory_gate_stop_reasons");
  }

  if (readyTaskIds.length === 0) {
    actions.push("owner_directed_next_track_selection_required");
  } else {
    actions.push(`review_ready_tasks:${readyTaskIds.join(",")}`);
  }

  if (
    ownerDecisionRequired.some((decision) => decision.taskId === ACC_010_TASK_ID)
  ) {
    actions.push("owner_decision_required:ACC-010");
  }

  actions.push("keep_auto_merge_disabled");
  actions.push("do_not_implement_fct_070_or_acc_010_without_owner_decision");

  return actions;
}

function buildVerificationSyncRecommendation({
  status,
  factoryGateStatus,
  prNumbersByTaskId
}: {
  status: "pass" | "fail";
  factoryGateStatus: OwnerCommandFactoryGateStatus;
  prNumbersByTaskId: ReadonlyMap<string, number>;
}) {
  if (
    status === "pass" &&
    factoryGateStatus.status === "pending_verification_sync" &&
    factoryGateStatus.pendingVerificationTaskIds.length > 0
  ) {
    return factoryGateStatus.pendingVerificationTaskIds
      .map((taskId) => {
        const prNumber = prNumbersByTaskId.get(taskId);

        return `Prepare release-guard verification sync for ${taskId} from PR #${prNumber}; this planner does not mutate roadmap status.`;
      })
      .join("\n");
  }

  return "No verification sync recommendation: no merged implementation PR with valid pending evidence.";
}

function buildOwnerApprovalCommentDraft({
  status,
  factoryGateStatus,
  readyTaskIds,
  blockedHumanTaskIds,
  stopReasons
}: {
  status: "pass" | "fail";
  factoryGateStatus: OwnerCommandFactoryGateStatus;
  readyTaskIds: readonly string[];
  blockedHumanTaskIds: readonly string[];
  stopReasons: readonly string[];
}) {
  return [
    "Owner Command Center packet v1",
    `Status: ${status}`,
    `Factory gate: ${factoryGateStatus.gateId} ${factoryGateStatus.status}`,
    `Verified required tasks: ${factoryGateStatus.verifiedRequiredTaskIds.join(
      ", "
    ) || "none"}`,
    `Deferred tasks: ${FCT_070_TASK_ID}`,
    `Ready tasks: ${readyTaskIds.join(", ") || "none"}`,
    `Blocked human tasks: ${blockedHumanTaskIds.join(", ") || "none"}`,
    `Stop reasons: ${stopReasons.join(", ") || "none"}`,
    "Safety: dry-run only; no live GitHub mutations; auto-merge disabled; FCT-070 and ACC-010 are not implemented."
  ].join("\n");
}

function buildCodexPromptDraft(factoryGateStatus: OwnerCommandFactoryGateStatus) {
  return [
    "Use this owner-review packet as planning input only.",
    `Factory gate ${factoryGateStatus.gateId} is ${factoryGateStatus.status}.`,
    "Do not implement FCT-070, ACC-010, auto-merge, billing, payments, DNS, deployment, secrets, production data, Webflow, Cloudflare Workers, R2, or provider settings.",
    "Wait for the owner to choose the next track before creating implementation work."
  ].join("\n");
}

function buildWorktreeBranchPlan(readyTaskIds: readonly string[]) {
  if (readyTaskIds.length === 0) {
    return "No branch is created by this planner. After owner selection, prepare a separate owner-approved branch for the selected task.";
  }

  return `No branch is created by this planner. Candidate branch text after owner selection: factory/${readyTaskIds[0].toLowerCase()}-owner-selected-task.`;
}

function normalizePullRequests(
  pullRequests: readonly OwnerCommandPrSummaryLike[]
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
      state: normalizePrState(pr.state),
      rawState: normalizeIdentifierOrNull(pr.state),
      isDraft: typeof pr.isDraft === "boolean" ? pr.isDraft : null,
      merged: typeof pr.merged === "boolean" ? pr.merged : null,
      mergedAt: normalizeNullableString(pr.mergedAt),
      mergeCommitSha: normalizeCommitSha(pr.mergeCommitSha),
      branchName: normalizeBranchName(pr.branchName)
    }))
    .sort(comparePullRequests);
}

function normalizeEvidenceList(
  evidence: readonly OwnerCommandEvidenceLike[]
): NormalizedEvidence[] {
  return [...evidence]
    .map((item) => ({
      name: normalizeIdentifierOrNull(item.name) ?? "missing_name",
      status: normalizeEvidenceStatus(item.status),
      rawStatus: normalizeIdentifierOrNull(item.status),
      evidence: normalizeNullableString(item.evidence),
      completedAt: normalizeNullableString(item.completedAt),
      commitSha: normalizeCommitSha(item.commitSha),
      isNoOp: item.isNoOp === true
    }))
    .sort(compareEvidence);
}

function validateEvidenceTimestamp({
  kind,
  name,
  completedAt,
  now,
  evidenceMaxAgeHours
}: {
  kind: string;
  name: string;
  completedAt: string | null;
  now: string | null;
  evidenceMaxAgeHours: number;
}) {
  const stopReasons: string[] = [];

  if (!completedAt) {
    stopReasons.push(`missing_${kind}_completed_at:${name}`);
    return stopReasons;
  }

  if (!now) {
    return stopReasons;
  }

  const completedAtMs = Date.parse(completedAt);
  const nowMs = Date.parse(now);

  if (!Number.isFinite(completedAtMs)) {
    stopReasons.push(`invalid_${kind}_completed_at:${name}`);
    return stopReasons;
  }

  if (!Number.isFinite(nowMs)) {
    stopReasons.push("invalid_now_timestamp");
    return stopReasons;
  }

  if (completedAtMs > nowMs) {
    stopReasons.push(`future_${kind}_evidence:${name}`);
    return stopReasons;
  }

  const ageHours = Math.floor((nowMs - completedAtMs) / 3_600_000);

  if (ageHours > evidenceMaxAgeHours) {
    stopReasons.push(
      `stale_${kind}_evidence:${name}:${ageHours}h>${evidenceMaxAgeHours}h`
    );
  }

  return stopReasons;
}

function prMatchesTask(pr: NormalizedPr, taskId: string) {
  if (pr.taskId === taskId) {
    return true;
  }

  if (pr.labels.some((label) => normalizeTaskLabel(label) === taskId)) {
    return true;
  }

  return pr.title?.startsWith(`[${taskId}]`) ?? false;
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
  const stopReasons: string[] = [];

  for (const task of tasks) {
    for (const dependencyId of task.dependsOn) {
      if (!taskById.has(dependencyId)) {
        stopReasons.push(`missing_dependency:${task.id}:${dependencyId}`);
      }
    }
  }

  return uniqueSorted(stopReasons);
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

function hasHighRiskReadyTask(tasks: readonly NormalizedTask[]) {
  return tasks.some((task) => task.status === "ready" && task.risk === "high");
}

function isKnownTaskStatus(value: string): value is OwnerCommandTaskStatus {
  return KNOWN_TASK_STATUSES.includes(value as OwnerCommandTaskStatus);
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

function normalizeRisk(value?: string | null): OwnerCommandTaskRisk | null {
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

function normalizeTaskSurface(value?: string | null) {
  const normalized = normalizeIdentifierOrNull(value);

  if (!normalized) {
    return null;
  }

  const aliased = TASK_SURFACE_ALIASES[normalized] ?? normalized;

  return TASK_SURFACES.has(aliased) ? aliased : null;
}

function normalizePrState(value?: string | null) {
  const normalized = normalizeIdentifierOrNull(value);

  if (!normalized) {
    return null;
  }

  if (normalized === "success") {
    return "merged";
  }

  return normalized;
}

function normalizeEvidenceStatus(
  value?: string | null
): OwnerCommandEvidenceStatus | null {
  const normalized = normalizeIdentifierOrNull(value);

  if (!normalized) {
    return null;
  }

  if (normalized === "passed" || normalized === "pass" || normalized === "success") {
    return "passed";
  }

  if (
    normalized === "failed" ||
    normalized === "fail" ||
    normalized === "failure" ||
    normalized === "cancelled"
  ) {
    return "failed";
  }

  if (normalized === "missing") {
    return "missing";
  }

  if (normalized === "skipped" || normalized === "skip") {
    return "skipped";
  }

  if (normalized === "unknown") {
    return "unknown";
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
  return normalizeNullableString(value)?.toLowerCase() ?? null;
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

function isProtectedPath(path: string) {
  return (
    findHardForbiddenPathRule(path) !== null ||
    PROTECTED_PATH_RULES.some((match) => match(path))
  );
}

function findHardForbiddenPathRule(path: string) {
  return HARD_FORBIDDEN_PATH_RULES.find((rule) => rule.match(path))?.id ?? null;
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
