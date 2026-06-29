export const NEXT_TASK_RUN_PACKET_VERSION = 1 as const;

export type NextTaskRunPacketVersion =
  typeof NEXT_TASK_RUN_PACKET_VERSION;

export type NextTaskRisk = "low" | "medium" | "high";

export type NextTaskStatus =
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

export type NextTaskEvidenceStatus =
  | "passed"
  | "failed"
  | "missing"
  | "skipped"
  | "unknown";

export type NextTaskRoadmapLike = {
  risk_policy?: unknown;
  release_gates?:
    | readonly {
        id?: string | null;
        required_tasks?: readonly string[] | null;
      }[]
    | null;
  tasks?: readonly NextTaskRoadmapTaskLike[] | null;
};

export type NextTaskRoadmapTaskLike = {
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

export type NextTaskOwnerPacketLike = {
  status?: string | null;
  factoryGateStatus?: {
    gateId?: string | null;
    status?: string | null;
    requiredTaskIds?: readonly string[] | null;
    verifiedRequiredTaskIds?: readonly string[] | null;
    missingVerifiedTaskIds?: readonly string[] | null;
  } | null;
  verifiedFactoryTaskIds?: readonly string[] | null;
  deferredTaskIds?: readonly string[] | null;
  blockedHumanTaskIds?: readonly string[] | null;
  ownerDecisionRequired?:
    | readonly {
        taskId?: string | null;
        title?: string | null;
        status?: string | null;
        reason?: string | null;
        recommendation?: string | null;
      }[]
    | null;
  stopReasons?: readonly string[] | null;
};

export type NextTaskBacklogCandidateLike = {
  id?: string | null;
  taskId?: string | null;
  title?: string | null;
  phase?: string | null;
  status?: string | null;
  risk?: string | null;
  taskSurface?: string | null;
  source?: string | null;
  priority?: number | null;
  depends_on?: readonly string[] | null;
  deliverables?: readonly string[] | null;
  acceptance?: readonly string[] | null;
  validation?: readonly string[] | null;
  expectedChangedFiles?: readonly string[] | null;
  forbiddenChangedFiles?: readonly string[] | null;
  requiresOwnerApproval?: boolean | null;
  ownerApprovalEvidence?: string | null;
};

export type NextTaskPrSummaryLike = {
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
  mergeableState?: string | null;
  stale?: boolean | null;
  refreshedAt?: string | null;
  evidence?: string | null;
};

export type NextTaskCiCheckLike = {
  name?: string | null;
  status?: string | null;
  evidence?: string | null;
  completedAt?: string | null;
  isNoOp?: boolean | null;
};

export type NextTaskBlockedSurfaceLike = {
  id?: string | null;
  surface?: string | null;
  reason?: string | null;
  taskIds?: readonly string[] | null;
};

export type NextTaskRiskPolicyLike = {
  highRiskSurfaces?: readonly string[] | null;
  mediumRiskSurfaces?: readonly string[] | null;
  blockedSurfaces?: readonly string[] | null;
  forbiddenChangedFiles?: readonly string[] | null;
  requiresOwnerApprovalForHighRisk?: boolean | null;
};

export type NextTaskOwnerDecisionLike = {
  taskId?: string | null;
  approved?: boolean | null;
  evidence?: string | null;
};

export type NextTaskRunPacketInput = {
  roadmap?: NextTaskRoadmapLike | null;
  ownerCommandCenterPacket?: NextTaskOwnerPacketLike | null;
  backlogCandidates?: readonly NextTaskBacklogCandidateLike[] | null;
  recentMergedPrSummaries?: readonly NextTaskPrSummaryLike[] | null;
  openPrSummaries?: readonly NextTaskPrSummaryLike[] | null;
  ciCheckSummaries?: readonly NextTaskCiCheckLike[] | null;
  blockedSurfaces?: readonly NextTaskBlockedSurfaceLike[] | null;
  riskPolicy?: NextTaskRiskPolicyLike | null;
  ownerDecisions?: readonly NextTaskOwnerDecisionLike[] | null;
  options?: {
    dryRun?: boolean | null;
    liveGitHubMutations?: boolean | null;
    autoMerge?: boolean | null;
    now?: string | null;
    evidenceMaxAgeHours?: number | null;
  } | null;
};

export type NextTaskSelectedTask = {
  id: string;
  title: string;
  source: string;
  phase: string;
  risk: NextTaskRisk;
  taskSurface: string;
  expectedChangedFiles: string[];
  validation: string[];
  ownerApprovalRequired: boolean;
};

export type NextTaskDecisionItem = {
  taskId: string;
  title: string;
  status: string;
  reason: string;
  recommendation: string;
  implementableNow: false;
};

export type NextTaskRejectedTask = {
  taskId: string;
  title: string;
  reason: string;
  recommendation: string;
};

export type NextTaskBlockedTask = {
  taskId: string;
  title: string;
  reason: string;
  recommendation: string;
  implementableNow: false;
};

export type NextTaskRiskSummary = {
  level: NextTaskRisk;
  taskSurface: string;
  requiresOwnerApproval: boolean;
  blockedSurfaces: string[];
  acceptedEvidence: string[];
  rejectedEvidence: string[];
};

export type NextTaskRunPacket = {
  version: NextTaskRunPacketVersion;
  status: "pass" | "fail";
  dryRun: true;
  liveGitHubMutations: false;
  autoMergeEnabled: false;
  selectedTask: NextTaskSelectedTask | null;
  rejectedTasks: NextTaskRejectedTask[];
  blockedTasks: NextTaskBlockedTask[];
  noSafeTaskReason: string | null;
  riskSummary: NextTaskRiskSummary;
  ownerDecisionRequired: NextTaskDecisionItem[];
  worktreePlan: string;
  branchPlan: string;
  codexPromptDraft: string;
  validationCommands: string[];
  expectedChangedFiles: string[];
  forbiddenChangedFiles: string[];
  prTitle: string;
  prBodyDraft: string;
  ownerApprovalCommentDraft: string;
  postMergeFollowup: string[];
  verificationSyncNeeded: boolean;
  stopReasons: string[];
  safetyNotes: string[];
};

type NormalizedTask = {
  id: string;
  phase: string;
  title: string;
  status: string | null;
  risk: NextTaskRisk | null;
  rawRisk: string | null;
  dependsOn: string[];
  deliverables: string[];
  acceptance: string[];
  validation: string[];
  humanGate: boolean;
  autoMergeEligible: boolean;
  evidence: string[];
};

type NormalizedCandidate = {
  id: string;
  title: string;
  phase: string;
  status: string | null;
  risk: NextTaskRisk | null;
  rawRisk: string | null;
  taskSurface: string | null;
  rawTaskSurface: string | null;
  source: string;
  priority: number;
  dependsOn: string[];
  deliverables: string[];
  acceptance: string[];
  validation: string[];
  expectedChangedFiles: string[];
  forbiddenChangedFiles: string[];
  requiresOwnerApproval: boolean;
  ownerApprovalEvidence: string | null;
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
  mergeableState: string | null;
  rawMergeableState: string | null;
  stale: boolean;
  refreshedAt: string | null;
  evidence: string | null;
};

type NormalizedEvidence = {
  name: string;
  status: NextTaskEvidenceStatus | null;
  rawStatus: string | null;
  evidence: string | null;
  completedAt: string | null;
  isNoOp: boolean;
};

type CandidateEvaluation = {
  candidate: NormalizedCandidate;
  selectedTask: NextTaskSelectedTask | null;
  rejectedTask: NextTaskRejectedTask | null;
  blockedTask: NextTaskBlockedTask | null;
  stopReasons: string[];
  forbiddenChangedFiles: string[];
  acceptedEvidence: string[];
  rejectedEvidence: string[];
};

const G0_GATE_ID = "G0_FACTORY_READY";
const FCT_070_TASK_ID = "FCT-070";
const ACC_010_TASK_ID = "ACC-010";
const PR_121_NUMBER = 121;
const PR_137_NUMBER = 137;
const DEFAULT_EVIDENCE_MAX_AGE_HOURS = 72;

const G0_REQUIRED_TASK_IDS = [
  "FCT-010",
  "FCT-020",
  "FCT-030",
  "FCT-040",
  "FCT-050",
  "FCT-060"
];

const KNOWN_TASK_STATUSES: readonly NextTaskStatus[] = [
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

const REQUIRED_CI_CHECKS = [
  "typecheck",
  "lint",
  "build",
  "targeted_tests"
];

const BASE_VALIDATION_COMMANDS = [
  "npm.cmd run typecheck",
  "npm.cmd run lint",
  "npm.cmd run build",
  "npm.cmd run test -- --workers=1"
];

const NO_OP_WORKFLOW_NAMES = new Set([
  "ci_repair",
  "codex_quality_gate",
  "risk_gate",
  "limited_auto_merge"
]);

const SUPPORTED_TASK_SURFACES = new Set([
  "docs_only",
  "tests_only",
  "fixtures_only",
  "non_behavioral_refactor",
  "product_ui",
  "app_server_logic",
  "factory_control_plane"
]);

const TASK_SURFACE_ALIASES: Record<string, string> = {
  docs: "docs_only",
  documentation: "docs_only",
  test: "tests_only",
  tests: "tests_only",
  fixture: "fixtures_only",
  fixtures: "fixtures_only",
  refactor: "non_behavioral_refactor",
  product: "product_ui",
  ui: "product_ui",
  app_logic: "app_server_logic",
  server_logic: "app_server_logic",
  factory: "factory_control_plane",
  control_plane: "factory_control_plane"
};

const HIGH_RISK_SURFACES = new Set([
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
  },
  {
    id: "account_schema_rls_migration",
    match: (path) =>
      path.startsWith("supabase/") ||
      path.includes("migration") ||
      path.includes("migrations") ||
      path.includes("rls") ||
      path.includes("schema")
  }
];

export function planNextTaskRunPacket(
  input: NextTaskRunPacketInput
): NextTaskRunPacket {
  const stopReasons: string[] = [];
  const safetyNotes = [
    "Planner-only output; implementation code performs no live GitHub mutations.",
    "dryRun is forced true, liveGitHubMutations is forced false, and autoMergeEnabled is forced false.",
    "FCT-070 remains deferred and is never selected by this router.",
    "ACC-010 remains blocked_human and is not implemented by this router.",
    "Worktree and branch plans are text only; this function creates no branches, PRs, issues, comments, labels, merges, status checks, GitHub API calls, or gh calls."
  ];
  const options = input.options ?? null;
  const evidenceMaxAgeHours = normalizeEvidenceMaxAgeHours(
    options?.evidenceMaxAgeHours
  );
  const now = normalizeNullableString(options?.now);
  const roadmapTasks = normalizeTasks(input.roadmap?.tasks);
  const taskById = firstTaskById(roadmapTasks);
  const candidates = normalizeCandidates(input.backlogCandidates ?? []);
  const recentMergedPrs = normalizePullRequests(
    input.recentMergedPrSummaries ?? []
  );
  const openPrs = normalizePullRequests(input.openPrSummaries ?? []);
  const ciChecks = normalizeEvidence(input.ciCheckSummaries ?? []);
  const blockedSurfaces = normalizeBlockedSurfaces(input.blockedSurfaces ?? []);
  const riskPolicy = normalizeRiskPolicy(
    input.riskPolicy ?? riskPolicyFromRoadmap(input.roadmap)
  );
  const ownerDecisions = normalizeOwnerDecisions(input.ownerDecisions ?? []);

  if (!input.roadmap) {
    stopReasons.push("missing_roadmap");
  }

  if (!Array.isArray(input.roadmap?.tasks) || input.roadmap?.tasks.length === 0) {
    stopReasons.push("missing_roadmap_tasks");
  }

  if (!input.ownerCommandCenterPacket) {
    stopReasons.push("missing_owner_command_center_packet");
  }

  if (!Array.isArray(input.backlogCandidates)) {
    stopReasons.push("missing_backlog_candidates");
  }

  if (!riskPolicy.hasPolicy) {
    stopReasons.push("missing_risk_policy");
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

  stopReasons.push(...validateRoadmap(roadmapTasks, input.roadmap, taskById));
  stopReasons.push(
    ...validateOwnerCommandCenterPacket(input.ownerCommandCenterPacket)
  );

  const factoryReady = isFactoryReady({
    taskById,
    ownerPacket: input.ownerCommandCenterPacket
  });

  if (!factoryReady.ready) {
    stopReasons.push(...factoryReady.stopReasons);
  }

  const prSummary = summarizePullRequests(openPrs, recentMergedPrs);
  const ciSummary = summarizeCiChecks({
    ciChecks,
    now,
    evidenceMaxAgeHours
  });

  stopReasons.push(...prSummary.stopReasons);
  stopReasons.push(...ciSummary.stopReasons);

  const ownerDecisionRequired = buildOwnerDecisionItems({
    tasks: roadmapTasks,
    candidates,
    ownerDecisions,
    blockedPrs: prSummary.blockedPrTasks
  });
  const candidateEvaluations = candidates.map((candidate) =>
    evaluateCandidate({
      candidate,
      taskById,
      factoryReady: factoryReady.ready,
      hasProductReadinessAudit: prSummary.hasProductReadinessAudit,
      blockedSurfaces,
      riskPolicy,
      ownerDecisions
    })
  );
  const candidateSelectedTask =
    candidateEvaluations.find((evaluation) => evaluation.selectedTask)
      ?.selectedTask ?? null;
  const candidateRejectedTasks = candidateEvaluations
    .map((evaluation) => evaluation.rejectedTask)
    .filter(isRejectedTask)
    .sort(compareRejectedTasks);
  const candidateBlockedTasks = candidateEvaluations
    .map((evaluation) => evaluation.blockedTask)
    .filter(isBlockedTask)
    .sort(compareBlockedTasks);
  const blockedTasks = uniqueBlockedTasks([
    ...buildRoadmapBlockedTasks(roadmapTasks),
    ...prSummary.blockedPrTasks,
    ...candidateBlockedTasks
  ]);
  const rejectedTasks = uniqueRejectedTasks(candidateRejectedTasks);
  const forbiddenChangedFiles = uniqueSorted(
    candidateEvaluations.flatMap((evaluation) => evaluation.forbiddenChangedFiles)
  );
  const acceptedEvidence = uniqueSorted([
    ...ciSummary.acceptedEvidence,
    ...prSummary.acceptedEvidence,
    ...candidateEvaluations.flatMap((evaluation) => evaluation.acceptedEvidence)
  ]);
  const rejectedEvidence = uniqueSorted([
    ...ciSummary.rejectedEvidence,
    ...prSummary.rejectedEvidence,
    ...candidateEvaluations.flatMap((evaluation) => evaluation.rejectedEvidence)
  ]);

  stopReasons.push(
    ...candidateEvaluations.flatMap((evaluation) => evaluation.stopReasons)
  );

  const uniqueStopReasons = uniquePreserveOrder(stopReasons);
  const status = uniqueStopReasons.length === 0 ? "pass" : "fail";
  const selectedTask = status === "pass" ? candidateSelectedTask : null;
  const noSafeTaskReason =
    selectedTask
      ? null
      : status === "fail"
        ? "No safe task selected because fail-closed stop reasons are present."
        : "No safe implementation task met deterministic evidence gates; recommend an owner-directed docs/audit/readiness task instead of guessing.";
  const selectedOrFallbackTask = selectedTask ?? buildFallbackSelectedTask();
  const validationCommands = buildValidationCommands(selectedTask);
  const expectedChangedFiles = selectedTask?.expectedChangedFiles ?? [];
  const riskSummary = buildRiskSummary({
    selectedTask,
    blockedSurfaces,
    acceptedEvidence,
    rejectedEvidence
  });
  const verificationSyncNeeded =
    normalizeIdentifierOrNull(
      input.ownerCommandCenterPacket?.factoryGateStatus?.status
    ) === "pending_verification_sync";

  return {
    version: NEXT_TASK_RUN_PACKET_VERSION,
    status,
    dryRun: true,
    liveGitHubMutations: false,
    autoMergeEnabled: false,
    selectedTask,
    rejectedTasks,
    blockedTasks,
    noSafeTaskReason,
    riskSummary,
    ownerDecisionRequired,
    worktreePlan: buildWorktreePlan(selectedTask),
    branchPlan: buildBranchPlan(selectedTask),
    codexPromptDraft: buildCodexPromptDraft({
      selectedTask,
      noSafeTaskReason,
      status,
      stopReasons: uniqueStopReasons
    }),
    validationCommands,
    expectedChangedFiles,
    forbiddenChangedFiles,
    prTitle: buildPrTitle(selectedOrFallbackTask, selectedTask === null),
    prBodyDraft: buildPrBodyDraft({
      task: selectedOrFallbackTask,
      selectedTask,
      noSafeTaskReason,
      validationCommands,
      expectedChangedFiles,
      forbiddenChangedFiles,
      stopReasons: uniqueStopReasons,
      status
    }),
    ownerApprovalCommentDraft: buildOwnerApprovalCommentDraft({
      status,
      selectedTask,
      ownerDecisionRequired,
      blockedTasks,
      stopReasons: uniqueStopReasons
    }),
    postMergeFollowup: buildPostMergeFollowup(selectedTask),
    verificationSyncNeeded,
    stopReasons: uniqueStopReasons,
    safetyNotes
  };
}

function normalizeTasks(
  tasks?: readonly NextTaskRoadmapTaskLike[] | null
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

function normalizeCandidates(
  candidates: readonly NextTaskBacklogCandidateLike[]
): NormalizedCandidate[] {
  return [...candidates]
    .map((candidate, index) => {
      const rawRisk = normalizeNullableString(candidate.risk);
      const rawTaskSurface = normalizeNullableString(candidate.taskSurface);

      return {
        id: normalizeTaskId(candidate.taskId ?? candidate.id),
        title: normalizeNullableString(candidate.title) ?? "",
        phase: normalizeNullableString(candidate.phase) ?? "unknown",
        status: normalizeTaskStatus(candidate.status),
        risk: normalizeRisk(rawRisk),
        rawRisk,
        taskSurface: normalizeTaskSurface(rawTaskSurface),
        rawTaskSurface,
        source: normalizeNullableString(candidate.source) ?? "backlog",
        priority: normalizePriority(candidate.priority, index),
        dependsOn: normalizeTaskIds(candidate.depends_on),
        deliverables: normalizeStringList(candidate.deliverables),
        acceptance: normalizeStringList(candidate.acceptance),
        validation: normalizeStringList(candidate.validation),
        expectedChangedFiles: normalizeChangedFiles(
          candidate.expectedChangedFiles
        ),
        forbiddenChangedFiles: normalizeChangedFiles(
          candidate.forbiddenChangedFiles
        ),
        requiresOwnerApproval: candidate.requiresOwnerApproval === true,
        ownerApprovalEvidence: normalizeNullableString(
          candidate.ownerApprovalEvidence
        )
      };
    })
    .sort(compareCandidates);
}

function normalizePullRequests(
  pullRequests: readonly NextTaskPrSummaryLike[]
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
      mergeCommitSha: normalizeNullableString(pr.mergeCommitSha)?.toLowerCase() ?? null,
      branchName: normalizeBranchName(pr.branchName),
      mergeableState: normalizeMergeableState(pr.mergeableState),
      rawMergeableState: normalizeIdentifierOrNull(pr.mergeableState),
      stale: pr.stale === true,
      refreshedAt: normalizeNullableString(pr.refreshedAt),
      evidence: normalizeNullableString(pr.evidence)
    }))
    .sort(comparePullRequests);
}

function normalizeEvidence(
  evidence: readonly NextTaskCiCheckLike[]
): NormalizedEvidence[] {
  return [...evidence]
    .map((item) => ({
      name: normalizeIdentifierOrNull(item.name) ?? "missing_name",
      status: normalizeEvidenceStatus(item.status),
      rawStatus: normalizeIdentifierOrNull(item.status),
      evidence: normalizeNullableString(item.evidence),
      completedAt: normalizeNullableString(item.completedAt),
      isNoOp: item.isNoOp === true
    }))
    .sort(compareEvidence);
}

function normalizeBlockedSurfaces(
  blockedSurfaces: readonly NextTaskBlockedSurfaceLike[]
) {
  return [...blockedSurfaces]
    .map((surface) => ({
      id: normalizeIdentifierOrNull(surface.id) ?? "blocked_surface",
      surface: normalizeTaskSurface(surface.surface) ?? normalizeIdentifierOrNull(surface.surface) ?? "unknown",
      reason: normalizeNullableString(surface.reason) ?? "Blocked surface",
      taskIds: normalizeTaskIds(surface.taskIds)
    }))
    .sort((left, right) => compareStrings(left.surface, right.surface));
}

function normalizeRiskPolicy(riskPolicy: NextTaskRiskPolicyLike | null) {
  const highRiskSurfaces = normalizeSurfaceList(riskPolicy?.highRiskSurfaces);
  const mediumRiskSurfaces = normalizeSurfaceList(riskPolicy?.mediumRiskSurfaces);
  const blockedSurfaces = normalizeSurfaceList(riskPolicy?.blockedSurfaces);

  return {
    hasPolicy: riskPolicy !== null,
    highRiskSurfaces,
    mediumRiskSurfaces,
    blockedSurfaces,
    forbiddenChangedFiles: normalizeChangedFiles(
      riskPolicy?.forbiddenChangedFiles
    ),
    requiresOwnerApprovalForHighRisk:
      riskPolicy?.requiresOwnerApprovalForHighRisk !== false
  };
}

function normalizeOwnerDecisions(
  ownerDecisions: readonly NextTaskOwnerDecisionLike[]
) {
  return [...ownerDecisions]
    .map((decision) => ({
      taskId: normalizeTaskId(decision.taskId),
      approved: decision.approved === true,
      evidence: normalizeNullableString(decision.evidence)
    }))
    .filter((decision) => decision.taskId.length > 0)
    .sort((left, right) => compareStrings(left.taskId, right.taskId));
}

function validateRoadmap(
  tasks: readonly NormalizedTask[],
  roadmap: NextTaskRoadmapLike | null | undefined,
  taskById: ReadonlyMap<string, NormalizedTask>
) {
  const stopReasons: string[] = [];

  if (!hasG0ReleaseGate(roadmap)) {
    stopReasons.push(`missing_factory_gate:${G0_GATE_ID}`);
  }

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
  }

  for (const duplicateTaskId of findDuplicateValues(
    tasks.map((task) => task.id).filter(Boolean)
  )) {
    stopReasons.push(`duplicate_task_id:${duplicateTaskId}`);
  }

  stopReasons.push(...findUnresolvedDependencyReferences(tasks, taskById));

  const dependencyCycle = findDependencyCycle(tasks, taskById);

  if (dependencyCycle) {
    stopReasons.push(`dependency_cycle:${dependencyCycle.join("->")}`);
  }

  return stopReasons;
}

function validateOwnerCommandCenterPacket(
  ownerPacket: NextTaskOwnerPacketLike | null | undefined
) {
  if (!ownerPacket) {
    return [];
  }

  const stopReasons: string[] = [];
  const status = normalizeIdentifierOrNull(ownerPacket.status);
  const factoryGateStatus = normalizeIdentifierOrNull(
    ownerPacket.factoryGateStatus?.status
  );

  if (status !== "pass") {
    stopReasons.push(`owner_command_center_not_pass:${status ?? "missing"}`);
  }

  if (factoryGateStatus !== "complete") {
    stopReasons.push(
      `owner_command_center_factory_gate_not_complete:${
        factoryGateStatus ?? "missing"
      }`
    );
  }

  for (const reason of normalizeStringList(ownerPacket.stopReasons)) {
    stopReasons.push(`owner_command_center_stop_reason:${reason}`);
  }

  return stopReasons;
}

function isFactoryReady({
  taskById,
  ownerPacket
}: {
  taskById: ReadonlyMap<string, NormalizedTask>;
  ownerPacket: NextTaskOwnerPacketLike | null | undefined;
}) {
  const stopReasons: string[] = [];

  for (const taskId of G0_REQUIRED_TASK_IDS) {
    const task = taskById.get(taskId);

    if (!task || task.status !== "verified") {
      stopReasons.push(
        `missing_verified_factory_task:${taskId}:${
          task?.status ?? "missing"
        }`
      );
    }
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

  const ownerVerifiedTaskIds = normalizeTaskIds(
    ownerPacket?.factoryGateStatus?.verifiedRequiredTaskIds ??
      ownerPacket?.verifiedFactoryTaskIds
  );

  for (const taskId of G0_REQUIRED_TASK_IDS) {
    if (
      ownerVerifiedTaskIds.length > 0 &&
      !ownerVerifiedTaskIds.includes(taskId)
    ) {
      stopReasons.push(`owner_packet_missing_verified_factory_task:${taskId}`);
    }
  }

  return {
    ready: stopReasons.length === 0,
    stopReasons
  };
}

function summarizePullRequests(
  openPrs: readonly NormalizedPr[],
  mergedPrs: readonly NormalizedPr[]
) {
  const stopReasons: string[] = [];
  const acceptedEvidence: string[] = [];
  const rejectedEvidence: string[] = [];
  const blockedPrTasks: NextTaskBlockedTask[] = [];

  for (const pr of [...openPrs, ...mergedPrs]) {
    if (pr.number === null) {
      stopReasons.push("missing_pr_number");
    }

    if (!pr.state) {
      stopReasons.push(`missing_pr_state:#${pr.number ?? "missing"}`);
    } else if (!["open", "closed", "merged"].includes(pr.state)) {
      stopReasons.push(
        `unknown_pr_state:#${pr.number ?? "missing"}:${pr.rawState ?? "unknown"}`
      );
    }
  }

  const pr121s = openPrs.filter((pr) => pr.number === PR_121_NUMBER);

  if (pr121s.length > 1) {
    stopReasons.push(`ambiguous_open_pr:${PR_121_NUMBER}`);
  }

  for (const pr of pr121s) {
    if (!pr.mergeableState) {
      stopReasons.push(`missing_open_pr_mergeable_state:#${PR_121_NUMBER}`);
    } else if (
      !["mergeable", "clean", "dirty", "blocked", "unknown"].includes(
        pr.mergeableState
      )
    ) {
      stopReasons.push(
        `unknown_open_pr_mergeable_state:#${PR_121_NUMBER}:${
          pr.rawMergeableState ?? "unknown"
        }`
      );
    }

    const explicitlyRefreshed =
      pr.refreshedAt !== null &&
      pr.evidence !== null &&
      ["mergeable", "clean"].includes(pr.mergeableState ?? "");

    if (!explicitlyRefreshed) {
      const reason = pr.stale
        ? "blocked_stale_not_mergeable_pr"
        : "blocked_not_mergeable_pr";

      blockedPrTasks.push({
        taskId: `PR-${PR_121_NUMBER}`,
        title: pr.title ?? "Open PR #121",
        reason: `${reason}:#${PR_121_NUMBER}`,
        recommendation:
          "Do not merge or modify PR #121 from this router; require refreshed mergeability evidence in a separate owner-directed action.",
        implementableNow: false
      });
      rejectedEvidence.push(`pr:#${PR_121_NUMBER}:${reason}`);
    } else {
      acceptedEvidence.push(`pr:#${PR_121_NUMBER}:${pr.evidence}`);
    }
  }

  const merged137s = mergedPrs.filter((pr) => pr.number === PR_137_NUMBER);
  const hasProductReadinessAudit = merged137s.some(
    (pr) =>
      (pr.merged === true || pr.state === "merged" || pr.state === "closed") &&
      pr.mergeCommitSha !== null
  );

  if (hasProductReadinessAudit) {
    acceptedEvidence.push("pr:#137:merged_product_ui_readiness_audit");
  }

  for (const pr of merged137s) {
    if (!pr.mergeCommitSha) {
      stopReasons.push(`missing_pr_merge_commit:#${PR_137_NUMBER}`);
    }
  }

  return {
    stopReasons,
    acceptedEvidence,
    rejectedEvidence,
    blockedPrTasks,
    hasProductReadinessAudit
  };
}

function summarizeCiChecks({
  ciChecks,
  now,
  evidenceMaxAgeHours
}: {
  ciChecks: readonly NormalizedEvidence[];
  now: string | null;
  evidenceMaxAgeHours: number;
}) {
  const stopReasons: string[] = [];
  const acceptedEvidence: string[] = [];
  const rejectedEvidence: string[] = [];

  if (ciChecks.length === 0) {
    stopReasons.push("missing_ci_check_summaries");
  }

  for (const check of ciChecks) {
    if (check.isNoOp || NO_OP_WORKFLOW_NAMES.has(check.name)) {
      stopReasons.push(`no_op_ci_check_not_release_evidence:${check.name}`);
      rejectedEvidence.push(`ci_check:${check.name}:no_op`);
      continue;
    }

    if (!check.status) {
      stopReasons.push(
        `unknown_ci_check_state:${check.name}:${check.rawStatus ?? "missing"}`
      );
      rejectedEvidence.push(`ci_check:${check.name}:unknown_state`);
      continue;
    }

    if (check.status !== "passed") {
      stopReasons.push(`ci_check_not_passed:${check.name}:${check.status}`);
      rejectedEvidence.push(`ci_check:${check.name}:${check.status}`);
      continue;
    }

    if (!check.evidence) {
      stopReasons.push(`missing_ci_check_evidence:${check.name}`);
      rejectedEvidence.push(`ci_check:${check.name}:missing_evidence`);
      continue;
    }

    stopReasons.push(
      ...validateEvidenceTimestamp({
        kind: "ci_check",
        name: check.name,
        completedAt: check.completedAt,
        now,
        evidenceMaxAgeHours
      })
    );

    acceptedEvidence.push(`ci_check:${check.name}:${check.evidence}`);
  }

  for (const requiredCheck of REQUIRED_CI_CHECKS) {
    const matchingChecks = ciChecks.filter(
      (check) => check.name === requiredCheck
    );

    if (
      !matchingChecks.some(
        (check) =>
          check.status === "passed" && check.evidence !== null && !check.isNoOp
      )
    ) {
      stopReasons.push(`missing_required_ci_check:${requiredCheck}`);
    }
  }

  if (
    ciChecks.length > 0 &&
    acceptedEvidence.length === 0 &&
    ciChecks.every((check) => check.isNoOp || NO_OP_WORKFLOW_NAMES.has(check.name))
  ) {
    stopReasons.push("no_op_only_ci_evidence");
  }

  return {
    stopReasons,
    acceptedEvidence,
    rejectedEvidence
  };
}

function evaluateCandidate({
  candidate,
  taskById,
  factoryReady,
  hasProductReadinessAudit,
  blockedSurfaces,
  riskPolicy,
  ownerDecisions
}: {
  candidate: NormalizedCandidate;
  taskById: ReadonlyMap<string, NormalizedTask>;
  factoryReady: boolean;
  hasProductReadinessAudit: boolean;
  blockedSurfaces: ReturnType<typeof normalizeBlockedSurfaces>;
  riskPolicy: ReturnType<typeof normalizeRiskPolicy>;
  ownerDecisions: ReturnType<typeof normalizeOwnerDecisions>;
}): CandidateEvaluation {
  const rejectedReasons: string[] = [];
  const blockedReasons: string[] = [];
  const stopReasons: string[] = [];
  const forbiddenChangedFiles: string[] = [];
  const acceptedEvidence: string[] = [];
  const rejectedEvidence: string[] = [];

  if (!candidate.id) {
    stopReasons.push("candidate_missing_task_id");
    rejectedReasons.push("candidate_missing_task_id");
  }

  if (!candidate.title) {
    stopReasons.push(`candidate_missing_title:${candidate.id || "missing_id"}`);
    rejectedReasons.push("candidate_missing_title");
  }

  if (!candidate.status) {
    stopReasons.push(`candidate_missing_status:${candidate.id || "missing_id"}`);
    rejectedReasons.push("candidate_missing_status");
  } else if (!["ready", "proposed"].includes(candidate.status)) {
    rejectedReasons.push(`candidate_not_ready:${candidate.status}`);
  }

  if (!candidate.risk) {
    stopReasons.push(
      `candidate_unknown_risk:${candidate.id || "missing_id"}:${
        candidate.rawRisk ?? "missing"
      }`
    );
    rejectedReasons.push("candidate_unknown_risk");
  }

  if (!candidate.taskSurface) {
    stopReasons.push(
      `candidate_unknown_task_surface:${candidate.id || "missing_id"}:${
        candidate.rawTaskSurface ?? "missing"
      }`
    );
    rejectedReasons.push("candidate_unknown_task_surface");
  } else if (!SUPPORTED_TASK_SURFACES.has(candidate.taskSurface)) {
    rejectedReasons.push(`unsupported_task_surface:${candidate.taskSurface}`);
  }

  if (!factoryReady) {
    rejectedReasons.push("factory_bootstrap_not_ready");
  }

  if (candidate.id === FCT_070_TASK_ID) {
    rejectedReasons.push("fct_070_deferred_not_selectable");
  }

  if (candidate.id === ACC_010_TASK_ID) {
    rejectedReasons.push("acc_010_blocked_human_not_selectable");
  }

  for (const dependencyId of candidate.dependsOn) {
    const dependency = taskById.get(dependencyId);

    if (!dependency) {
      stopReasons.push(`candidate_missing_dependency:${candidate.id}:${dependencyId}`);
      rejectedReasons.push(`missing_dependency:${dependencyId}`);
      continue;
    }

    if (dependency.status !== "verified") {
      rejectedReasons.push(
        `dependency_not_verified:${dependencyId}:${
          dependency.status ?? "missing"
        }`
      );
    }
  }

  if (candidate.expectedChangedFiles.length === 0) {
    stopReasons.push(`candidate_missing_expected_changed_files:${candidate.id}`);
    rejectedReasons.push("candidate_missing_expected_changed_files");
  }

  const explicitlyForbiddenChangedFiles = candidate.expectedChangedFiles.filter(
    (path) => candidate.forbiddenChangedFiles.includes(path)
  );

  for (const path of explicitlyForbiddenChangedFiles) {
    forbiddenChangedFiles.push(path);
    rejectedReasons.push(`candidate_declared_forbidden_changed_file:${path}`);
  }

  for (const path of candidate.expectedChangedFiles) {
    const forbiddenRule = findHardForbiddenPathRule(path);

    if (forbiddenRule) {
      forbiddenChangedFiles.push(path);
      stopReasons.push(`forbidden_changed_file:${path}:${forbiddenRule}`);
      rejectedReasons.push(`forbidden_changed_file:${path}:${forbiddenRule}`);
    }
  }

  for (const policyForbiddenPath of riskPolicy.forbiddenChangedFiles) {
    if (candidate.expectedChangedFiles.includes(policyForbiddenPath)) {
      forbiddenChangedFiles.push(policyForbiddenPath);
      stopReasons.push(`risk_policy_forbidden_changed_file:${policyForbiddenPath}`);
      rejectedReasons.push(`risk_policy_forbidden_changed_file:${policyForbiddenPath}`);
    }
  }

  if (
    candidate.taskSurface &&
    (riskPolicy.blockedSurfaces.includes(candidate.taskSurface) ||
      blockedSurfaces.some((surface) => surface.surface === candidate.taskSurface))
  ) {
    blockedReasons.push(`blocked_surface:${candidate.taskSurface}`);
  }

  for (const blockedSurface of blockedSurfaces) {
    if (
      blockedSurface.taskIds.includes(candidate.id) ||
      blockedSurface.surface === candidate.taskSurface
    ) {
      blockedReasons.push(
        `blocked_surface:${blockedSurface.surface}:${blockedSurface.id}`
      );
    }
  }

  if (
    candidate.taskSurface === "product_ui" &&
    !hasProductReadinessAudit
  ) {
    rejectedReasons.push("missing_product_readiness_audit_pr_137");
  }

  if (
    candidate.risk === "high" ||
    candidate.requiresOwnerApproval ||
    (candidate.taskSurface &&
      (HIGH_RISK_SURFACES.has(candidate.taskSurface) ||
        riskPolicy.highRiskSurfaces.includes(candidate.taskSurface)))
  ) {
    const ownerDecision = ownerDecisions.find(
      (decision) => decision.taskId === candidate.id
    );
    const hasOwnerApproval =
      ownerDecision?.approved === true &&
      ownerDecision.evidence !== null &&
      candidate.ownerApprovalEvidence !== null;

    if (!hasOwnerApproval) {
      rejectedReasons.push("owner_approval_required_for_high_risk_candidate");
      rejectedEvidence.push(`owner_approval:${candidate.id}:missing`);
    } else {
      acceptedEvidence.push(`owner_approval:${candidate.id}:${ownerDecision.evidence}`);
    }
  }

  if (blockedReasons.length > 0) {
    return {
      candidate,
      selectedTask: null,
      rejectedTask: null,
      blockedTask: {
        taskId: candidate.id,
        title: candidate.title,
        reason: uniqueSorted(blockedReasons).join(","),
        recommendation:
          "Keep this candidate blocked until the owner clears the blocked surface.",
        implementableNow: false
      },
      stopReasons,
      forbiddenChangedFiles: uniqueSorted(forbiddenChangedFiles),
      acceptedEvidence,
      rejectedEvidence
    };
  }

  if (rejectedReasons.length > 0) {
    return {
      candidate,
      selectedTask: null,
      rejectedTask: {
        taskId: candidate.id,
        title: candidate.title,
        reason: uniqueSorted(rejectedReasons).join(","),
        recommendation:
          "Do not select this task without explicit fresh evidence and owner approval where required."
      },
      blockedTask: null,
      stopReasons,
      forbiddenChangedFiles: uniqueSorted(forbiddenChangedFiles),
      acceptedEvidence,
      rejectedEvidence
    };
  }

  return {
    candidate,
    selectedTask: {
      id: candidate.id,
      title: candidate.title,
      source: candidate.source,
      phase: candidate.phase,
      risk: candidate.risk ?? "high",
      taskSurface: candidate.taskSurface ?? "unknown",
      expectedChangedFiles: candidate.expectedChangedFiles,
      validation: uniquePreserveOrder([
        ...candidate.validation,
        ...BASE_VALIDATION_COMMANDS
      ]),
      ownerApprovalRequired:
        candidate.requiresOwnerApproval ||
        candidate.risk === "high" ||
        candidate.taskSurface === "factory_control_plane"
    },
    rejectedTask: null,
    blockedTask: null,
    stopReasons,
    forbiddenChangedFiles: uniqueSorted(forbiddenChangedFiles),
    acceptedEvidence,
    rejectedEvidence
  };
}

function buildOwnerDecisionItems({
  tasks,
  candidates,
  ownerDecisions,
  blockedPrs
}: {
  tasks: readonly NormalizedTask[];
  candidates: readonly NormalizedCandidate[];
  ownerDecisions: ReturnType<typeof normalizeOwnerDecisions>;
  blockedPrs: readonly NextTaskBlockedTask[];
}): NextTaskDecisionItem[] {
  const decisionItems: NextTaskDecisionItem[] = [];

  for (const task of tasks.filter((candidate) => candidate.status === "blocked_human")) {
    decisionItems.push({
      taskId: task.id,
      title: task.title,
      status: task.status ?? "missing",
      reason:
        task.id === ACC_010_TASK_ID
          ? "ACC-010 is blocked_human and account schema/RLS work requires explicit owner direction."
          : "Roadmap marks this task blocked_human.",
      recommendation:
        task.id === ACC_010_TASK_ID
          ? "Keep ACC-010 blocked_human; do not select it as implementation work in this router."
          : "Keep blocked_human until an owner decision is recorded.",
      implementableNow: false
    });
  }

  for (const candidate of candidates) {
    if (
      candidate.risk === "high" ||
      candidate.requiresOwnerApproval ||
      candidate.taskSurface === "factory_control_plane"
    ) {
      const ownerDecision = ownerDecisions.find(
        (decision) => decision.taskId === candidate.id
      );

      if (ownerDecision?.approved === true && ownerDecision.evidence) {
        continue;
      }

      decisionItems.push({
        taskId: candidate.id,
        title: candidate.title,
        status: candidate.status ?? "missing",
        reason: "High-risk or control-plane recommendations require owner approval.",
        recommendation:
          "Record explicit owner approval before treating this as implementable work.",
        implementableNow: false
      });
    }
  }

  for (const blockedPr of blockedPrs) {
    decisionItems.push({
      taskId: blockedPr.taskId,
      title: blockedPr.title,
      status: "blocked",
      reason: blockedPr.reason,
      recommendation: blockedPr.recommendation,
      implementableNow: false
    });
  }

  return uniqueDecisionItems(decisionItems);
}

function buildRoadmapBlockedTasks(
  tasks: readonly NormalizedTask[]
): NextTaskBlockedTask[] {
  return tasks
    .filter(
      (task) =>
        task.status === "blocked_human" || task.status === "blocked_dependency"
    )
    .map((task) => ({
      taskId: task.id,
      title: task.title,
      reason: `roadmap_status:${task.status ?? "missing"}`,
      recommendation:
        task.status === "blocked_human"
          ? "Require owner decision before implementation."
          : "Wait for verified dependencies before implementation.",
      implementableNow: false as const
    }))
    .sort(compareBlockedTasks);
}

function buildRiskSummary({
  selectedTask,
  blockedSurfaces,
  acceptedEvidence,
  rejectedEvidence
}: {
  selectedTask: NextTaskSelectedTask | null;
  blockedSurfaces: ReturnType<typeof normalizeBlockedSurfaces>;
  acceptedEvidence: readonly string[];
  rejectedEvidence: readonly string[];
}): NextTaskRiskSummary {
  return {
    level: selectedTask?.risk ?? "high",
    taskSurface: selectedTask?.taskSurface ?? "none",
    requiresOwnerApproval: selectedTask?.ownerApprovalRequired ?? true,
    blockedSurfaces: blockedSurfaces.map((surface) => surface.surface),
    acceptedEvidence: [...acceptedEvidence],
    rejectedEvidence: [...rejectedEvidence]
  };
}

function buildValidationCommands(selectedTask: NextTaskSelectedTask | null) {
  if (!selectedTask) {
    return [
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- tests/factory-next-task-run-packet.spec.ts --workers=1"
    ];
  }

  return uniquePreserveOrder([
    ...selectedTask.validation,
    "npm.cmd run test -- tests/factory-next-task-run-packet.spec.ts --workers=1"
  ]);
}

function buildWorktreePlan(selectedTask: NextTaskSelectedTask | null) {
  if (!selectedTask) {
    return "Text only: no worktree is created. Ask the owner to choose a docs/audit/readiness task before starting implementation.";
  }

  return `Text only: keep the existing worktree, confirm it is based on origin/main, and scope edits to ${selectedTask.expectedChangedFiles.join(", ")}.`;
}

function buildBranchPlan(selectedTask: NextTaskSelectedTask | null) {
  if (!selectedTask) {
    return "Text only: no branch is created by this planner.";
  }

  return `Text only: candidate branch name after owner approval is ${buildBranchName(selectedTask)}.`;
}

function buildCodexPromptDraft({
  selectedTask,
  noSafeTaskReason,
  status,
  stopReasons
}: {
  selectedTask: NextTaskSelectedTask | null;
  noSafeTaskReason: string | null;
  status: "pass" | "fail";
  stopReasons: readonly string[];
}) {
  const lines = [
    "Use this next-task router packet as planning input only.",
    `Router status: ${status}.`,
    "Do not implement FCT-070, ACC-010, auto-merge, billing, payments, DNS, deployment, secrets, production data, Webflow, Cloudflare Workers, R2, provider settings, workflows, CODEOWNERS, or AGENTS.md."
  ];

  if (selectedTask) {
    lines.push(`Selected task: ${selectedTask.id} - ${selectedTask.title}.`);
    lines.push(`Expected changed files: ${selectedTask.expectedChangedFiles.join(", ")}.`);
    lines.push(`Validation commands: ${buildValidationCommands(selectedTask).join(" | ")}.`);
  } else {
    lines.push(noSafeTaskReason ?? "No task selected.");
  }

  lines.push(`Stop reasons: ${stopReasons.join(", ") || "none"}.`);

  return lines.join("\n");
}

function buildPrTitle(
  selectedOrFallbackTask: NextTaskSelectedTask,
  isFallback: boolean
) {
  if (isFallback) {
    return "[Factory] Owner-directed next-task readiness packet";
  }

  return `[${selectedOrFallbackTask.id}] ${selectedOrFallbackTask.title}`;
}

function buildPrBodyDraft({
  task,
  selectedTask,
  noSafeTaskReason,
  validationCommands,
  expectedChangedFiles,
  forbiddenChangedFiles,
  stopReasons,
  status
}: {
  task: NextTaskSelectedTask;
  selectedTask: NextTaskSelectedTask | null;
  noSafeTaskReason: string | null;
  validationCommands: readonly string[];
  expectedChangedFiles: readonly string[];
  forbiddenChangedFiles: readonly string[];
  stopReasons: readonly string[];
  status: "pass" | "fail";
}) {
  return [
    "## Goal",
    selectedTask
      ? `Generate an owner/Codex run packet for ${task.id}: ${task.title}.`
      : "Generate an owner-directed docs/audit/readiness packet because no safe implementation task was selected.",
    "",
    "## Scope",
    "- Pure deterministic factory router output only.",
    "- No Track B runtime UI changes.",
    "- No live GitHub mutations from implementation code.",
    "",
    "## Changed files",
    ...formatList(expectedChangedFiles),
    "",
    "## Acceptance mapping",
    selectedTask
      ? `- Selected task: ${task.id}`
      : `- No safe task reason: ${noSafeTaskReason ?? "none"}`,
    `- Router status: ${status}`,
    `- Stop reasons: ${stopReasons.join(", ") || "none"}`,
    "",
    "## Validation results",
    ...formatList(validationCommands),
    "",
    "## Safety section",
    "- No live GitHub branches, PRs, issues, comments, labels, merges, auto-merge actions, GitHub API calls, or gh calls are used by implementation code.",
    "- FCT-070 is not implemented.",
    "- ACC-010 is not implemented.",
    "- Track B runtime UI changes are not implemented.",
    "- Auto-merge is not enabled.",
    "- Roadmap statuses were not changed.",
    "- Workflows, CODEOWNERS, AGENTS.md, billing/payment/subscription settings, DNS, deployment, secrets, production data, Webflow production state, Cloudflare production Workers, R2 production objects, provider settings, account schema, RLS, migrations, and production account data were not touched.",
    "",
    "## Example selected next task",
    selectedTask
      ? `- ${task.id}: ${task.title}`
      : "- Owner-directed docs/audit/readiness task",
    "",
    "## Forbidden changed files",
    ...formatList(forbiddenChangedFiles)
  ].join("\n");
}

function buildOwnerApprovalCommentDraft({
  status,
  selectedTask,
  ownerDecisionRequired,
  blockedTasks,
  stopReasons
}: {
  status: "pass" | "fail";
  selectedTask: NextTaskSelectedTask | null;
  ownerDecisionRequired: readonly NextTaskDecisionItem[];
  blockedTasks: readonly NextTaskBlockedTask[];
  stopReasons: readonly string[];
}) {
  return [
    "Next-task run packet v1",
    `Status: ${status}`,
    `Selected task: ${
      selectedTask ? `${selectedTask.id} ${selectedTask.title}` : "none"
    }`,
    `Owner decision required: ${
      ownerDecisionRequired.map((item) => item.taskId).join(", ") || "none"
    }`,
    `Blocked tasks: ${
      blockedTasks.map((item) => item.taskId).join(", ") || "none"
    }`,
    `Stop reasons: ${stopReasons.join(", ") || "none"}`,
    "Safety: dry-run only; no live GitHub mutations; auto-merge disabled; FCT-070 and ACC-010 are not implemented."
  ].join("\n");
}

function buildPostMergeFollowup(selectedTask: NextTaskSelectedTask | null) {
  if (!selectedTask) {
    return [
      "Owner chooses the next docs/audit/readiness task.",
      "Rerun the router with refreshed explicit inputs.",
      "Keep PR #121 blocked unless refreshed mergeability evidence is provided."
    ];
  }

  return [
    `After merge, gather validation evidence for ${selectedTask.id}.`,
    "Run release/owner evidence sync in a separate PR if roadmap status changes are needed.",
    "Keep FCT-070 deferred, ACC-010 blocked_human, and auto-merge disabled."
  ];
}

function buildFallbackSelectedTask(): NextTaskSelectedTask {
  return {
    id: "OWNER-DOCS-AUDIT",
    title: "Owner-directed docs/audit/readiness task",
    source: "router_fallback",
    phase: "factory_control_plane",
    risk: "low",
    taskSurface: "docs_only",
    expectedChangedFiles: [],
    validation: [
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- tests/factory-next-task-run-packet.spec.ts --workers=1"
    ],
    ownerApprovalRequired: false
  };
}

function buildBranchName(task: NextTaskSelectedTask) {
  return `factory/${task.id.toLowerCase()}-${slugify(task.title)
    .split("-")
    .slice(0, 5)
    .join("-")}`;
}

function hasG0ReleaseGate(roadmap: NextTaskRoadmapLike | null | undefined) {
  return (
    roadmap?.release_gates?.some(
      (gate) => normalizeTaskId(gate.id) === G0_GATE_ID
    ) ?? false
  );
}

function riskPolicyFromRoadmap(
  roadmap: NextTaskRoadmapLike | null | undefined
): NextTaskRiskPolicyLike | null {
  return roadmap?.risk_policy ? {} : null;
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

function findHardForbiddenPathRule(path: string) {
  return HARD_FORBIDDEN_PATH_RULES.find((rule) => rule.match(path))?.id ?? null;
}

function isKnownTaskStatus(value: string): value is NextTaskStatus {
  return KNOWN_TASK_STATUSES.includes(value as NextTaskStatus);
}

function normalizeTaskIds(values?: readonly string[] | null) {
  return normalizeStringList(values).map(normalizeTaskId).sort(compareStrings);
}

function normalizeSurfaceList(values?: readonly string[] | null) {
  return normalizeStringList(values)
    .map((value) => normalizeTaskSurface(value) ?? normalizeIdentifier(value))
    .sort(compareStrings);
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

function normalizeRisk(value?: string | null): NextTaskRisk | null {
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

  return TASK_SURFACE_ALIASES[normalized] ?? normalized;
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

function normalizeMergeableState(value?: string | null) {
  const normalized = normalizeIdentifierOrNull(value);

  if (!normalized) {
    return null;
  }

  return normalized;
}

function normalizeEvidenceStatus(
  value?: string | null
): NextTaskEvidenceStatus | null {
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

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizePriority(value: number | null | undefined, index: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value);
  }

  return 1000 + index;
}

function normalizeEvidenceMaxAgeHours(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_EVIDENCE_MAX_AGE_HOURS;
  }

  return Math.floor(value);
}

function formatList(values: readonly string[]) {
  if (values.length === 0) {
    return ["- None"];
  }

  return values.map((value) => `- ${value}`);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values)].sort(compareStrings);
}

function uniquePreserveOrder(values: readonly string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function uniqueDecisionItems(items: readonly NextTaskDecisionItem[]) {
  const byTaskId = new Map<string, NextTaskDecisionItem>();

  for (const item of [...items].sort(compareDecisionItems)) {
    if (!byTaskId.has(item.taskId)) {
      byTaskId.set(item.taskId, item);
    }
  }

  return [...byTaskId.values()].sort(compareDecisionItems);
}

function uniqueBlockedTasks(tasks: readonly NextTaskBlockedTask[]) {
  const byTaskId = new Map<string, NextTaskBlockedTask>();

  for (const task of [...tasks].sort(compareBlockedTasks)) {
    if (!byTaskId.has(task.taskId)) {
      byTaskId.set(task.taskId, task);
    }
  }

  return [...byTaskId.values()].sort(compareBlockedTasks);
}

function uniqueRejectedTasks(tasks: readonly NextTaskRejectedTask[]) {
  const byTaskId = new Map<string, NextTaskRejectedTask>();

  for (const task of [...tasks].sort(compareRejectedTasks)) {
    if (!byTaskId.has(task.taskId)) {
      byTaskId.set(task.taskId, task);
    }
  }

  return [...byTaskId.values()].sort(compareRejectedTasks);
}

function isString(value: string | null): value is string {
  return value !== null;
}

function isRejectedTask(
  value: NextTaskRejectedTask | null
): value is NextTaskRejectedTask {
  return value !== null;
}

function isBlockedTask(
  value: NextTaskBlockedTask | null
): value is NextTaskBlockedTask {
  return value !== null;
}

function compareTasksById(left: NormalizedTask, right: NormalizedTask) {
  return compareStrings(left.id, right.id);
}

function compareCandidates(
  left: NormalizedCandidate,
  right: NormalizedCandidate
) {
  const byPriority = left.priority - right.priority;

  if (byPriority !== 0) {
    return byPriority;
  }

  return compareStrings(left.id, right.id);
}

function comparePullRequests(left: NormalizedPr, right: NormalizedPr) {
  const byNumber = (left.number ?? 0) - (right.number ?? 0);

  if (byNumber !== 0) {
    return byNumber;
  }

  return compareStrings(left.title ?? "", right.title ?? "");
}

function compareEvidence(left: NormalizedEvidence, right: NormalizedEvidence) {
  const byName = compareStrings(left.name, right.name);

  if (byName !== 0) {
    return byName;
  }

  return compareStrings(left.evidence ?? "", right.evidence ?? "");
}

function compareDecisionItems(
  left: NextTaskDecisionItem,
  right: NextTaskDecisionItem
) {
  return compareStrings(left.taskId, right.taskId);
}

function compareBlockedTasks(
  left: NextTaskBlockedTask,
  right: NextTaskBlockedTask
) {
  return compareStrings(left.taskId, right.taskId);
}

function compareRejectedTasks(
  left: NextTaskRejectedTask,
  right: NextTaskRejectedTask
) {
  return compareStrings(left.taskId, right.taskId);
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
