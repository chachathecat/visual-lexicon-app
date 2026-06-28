export const CI_REPAIR_LOOP_VERSION = 1 as const;

export type CiRepairLoopVersion = typeof CI_REPAIR_LOOP_VERSION;

export type CiRepairTaskRisk = "low" | "medium" | "high";

export type CiRepairTaskStatus =
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

export type CiRepairRunStatus =
  | "completed"
  | "queued"
  | "in_progress"
  | "requested"
  | "waiting"
  | "pending"
  | "unknown";

export type CiRepairCheckConclusion =
  | "success"
  | "failure"
  | "cancelled"
  | "timed_out"
  | "skipped"
  | "neutral"
  | "action_required"
  | "unknown";

export type CiRepairFailureClass =
  | "typecheck"
  | "lint"
  | "build"
  | "test"
  | "unit_test"
  | "e2e_test"
  | "unknown";

export type CiRepairAttemptStatus =
  | "planned"
  | "applied"
  | "failed"
  | "blocked"
  | "succeeded";

export type CiRepairPlanAction = "create" | "update" | "skip" | "block";

export type CiRepairRoadmapLike = {
  tasks?: readonly CiRepairRoadmapTaskLike[] | null;
};

export type CiRepairRoadmapTaskLike = {
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
};

export type CiRepairCheckRunLike = {
  name?: string | null;
  status?: CiRepairRunStatus | (string & {}) | null;
  conclusion?: CiRepairCheckConclusion | (string & {}) | null;
  completedAt?: string | null;
  evidence?: string | null;
  isNoOp?: boolean | null;
};

export type CiRepairRunLike = {
  name?: string | null;
  status?: CiRepairRunStatus | (string & {}) | null;
  conclusion?: CiRepairCheckConclusion | (string & {}) | null;
  completedAt?: string | null;
  evidence?: string | null;
  isNoOp?: boolean | null;
  checkRuns?: readonly CiRepairCheckRunLike[] | null;
};

export type CiRepairFailedJobSummaryLike = {
  checkName?: string | null;
  jobName?: string | null;
  failureClass?: CiRepairFailureClass | (string & {}) | null;
  failureSignature?: string | null;
  summary?: string | null;
  rerunCommand?: string | null;
};

export type CiRepairAttemptLike = {
  taskId?: string | null;
  attemptNumber?: number | null;
  status?: CiRepairAttemptStatus | (string & {}) | null;
  idempotencyKey?: string | null;
};

export type ExistingCiRepairBranchLike = {
  name?: string | null;
  taskId?: string | null;
  repairAttempt?: number | null;
  idempotencyKey?: string | null;
  state?: "active" | "deleted" | null;
};

export type ExistingCiRepairPrLike = {
  title?: string | null;
  body?: string | null;
  labels?: readonly string[] | null;
  taskId?: string | null;
  repairAttempt?: number | null;
  idempotencyKey?: string | null;
  branchName?: string | null;
  isDraft?: boolean | null;
  state?: "open" | "closed" | null;
  autoMergeEnabled?: boolean | null;
};

export type CiRepairPlannerInput = {
  roadmap?: CiRepairRoadmapLike | null;
  requestedTaskId?: string | null;
  ciRun?: CiRepairRunLike | null;
  failedJobs?: readonly CiRepairFailedJobSummaryLike[] | null;
  attemptHistory?: readonly CiRepairAttemptLike[] | null;
  existingBranches?: readonly ExistingCiRepairBranchLike[] | null;
  existingRepairPrs?: readonly ExistingCiRepairPrLike[] | null;
  affectedTaskIds?: readonly string[] | null;
  options?: {
    dryRun?: boolean | null;
    liveGitHubMutations?: boolean | null;
    autoMerge?: boolean | null;
    now?: string | null;
    maxRepairAttempts?: number | null;
    evidenceMaxAgeHours?: number | null;
  } | null;
};

export type CiRepairFailureTarget = {
  checkName: string;
  jobName: string;
  failureClass: Exclude<CiRepairFailureClass, "unknown">;
  failureSignature: string;
  summary: string;
  rerunCommand: string;
};

export type CiRepairPlan = {
  taskId: string;
  repairAttempt: number;
  branchName: string;
  title: string;
  body: string;
  labels: string[];
  idempotencyKey: string;
  action: CiRepairPlanAction;
  failureTarget: CiRepairFailureTarget;
  allowedActions: string[];
  forbiddenActions: string[];
  validationPlan: string[];
  safetyNotes: string[];
  rollbackPlan: string[];
  ownerApprovalRequired: boolean;
};

export type CiRepairPlannerResult = {
  version: CiRepairLoopVersion;
  status: "pass" | "fail";
  dryRun: true;
  liveGitHubMutations: false;
  autoMergeEnabled: false;
  readyTaskIds: string[];
  skippedTaskIds: string[];
  blockedTaskIds: string[];
  reasons: string[];
  acceptedEvidence: string[];
  rejectedEvidence: string[];
  duplicateProtections: string[];
  requiresOwnerApproval: boolean;
  repairAttemptLimit: number;
  nextRepairAttempt: number | null;
  repairPlans: CiRepairPlan[];
};

type NormalizedTask = {
  id: string;
  phase: string;
  title: string;
  status: string | null;
  risk: CiRepairTaskRisk | null;
  rawRisk: string | null;
  dependsOn: string[];
  deliverables: string[];
  acceptance: string[];
  validation: string[];
  humanGate: boolean;
  autoMergeEligible: boolean;
};

type NormalizedCheckRun = {
  name: string;
  status: string | null;
  conclusion: string | null;
  completedAt: string | null;
  evidence: string | null;
  isNoOp: boolean;
};

type NormalizedFailedJob = {
  checkName: string;
  jobName: string;
  failureClass: string | null;
  failureSignature: string | null;
  summary: string | null;
  rerunCommand: string | null;
};

type NormalizedAttempt = {
  taskId: string;
  attemptNumber: number | null;
  status: string | null;
  idempotencyKey: string | null;
};

type NormalizedBranch = {
  name: string;
  taskId: string | null;
  repairAttempt: number | null;
  idempotencyKey: string | null;
  state: "active" | "deleted";
};

type NormalizedRepairPr = {
  title: string | null;
  body: string | null;
  labels: string[];
  taskId: string | null;
  repairAttempt: number | null;
  idempotencyKey: string | null;
  branchName: string | null;
  isDraft: boolean;
  state: "open" | "closed";
  autoMergeEnabled: boolean;
};

type BranchMatch = {
  branch: NormalizedBranch;
  reason: "name" | "task_id_attempt" | "idempotency_key";
};

type RepairPrMatch = {
  repairPr: NormalizedRepairPr;
  reason:
    | "task_id_attempt"
    | "idempotency_key"
    | "branch_name"
    | "task_label"
    | "title";
};

type CiEvidenceSummary = {
  reasons: string[];
  acceptedEvidence: string[];
  rejectedEvidence: string[];
  failureTarget: CiRepairFailureTarget | null;
};

const TARGET_TASK_ID = "FCT-050";
const BLOCKED_FOLLOW_ON_TASK_ID = "FCT-060";
const DEFAULT_REPAIR_ATTEMPT_LIMIT = 3;
const DEFAULT_EVIDENCE_MAX_AGE_HOURS = 24;

const KNOWN_TASK_STATUSES: readonly CiRepairTaskStatus[] = [
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

const BLOCKED_STATUSES = new Set(["blocked_dependency", "blocked_human"]);

const KNOWN_RUN_STATUSES = new Set([
  "completed",
  "queued",
  "in_progress",
  "requested",
  "waiting",
  "pending",
  "unknown"
]);

const KNOWN_CHECK_CONCLUSIONS = new Set([
  "success",
  "failure",
  "cancelled",
  "timed_out",
  "skipped",
  "neutral",
  "action_required",
  "unknown"
]);

const KNOWN_ATTEMPT_STATUSES = new Set([
  "planned",
  "applied",
  "failed",
  "blocked",
  "succeeded"
]);

const SUPPORTED_FAILURE_CLASSES = new Set([
  "typecheck",
  "lint",
  "build",
  "test",
  "unit_test",
  "e2e_test"
]);

const NO_OP_WORKFLOW_NAMES = new Set([
  "ci_repair",
  "codex_quality_gate",
  "risk_gate",
  "limited_auto_merge"
]);

const BASE_VALIDATION_COMMANDS = [
  "npm.cmd run typecheck",
  "npm.cmd run lint",
  "npm.cmd run build",
  "npm.cmd run test -- --workers=1"
];

const ALLOWED_REPAIR_ACTIONS = [
  "Reproduce the exact failing check from the provided CI evidence.",
  "Classify the root cause before editing.",
  "Apply the smallest source or test fix that preserves assertions.",
  "Rerun the failed check, then the full required suite.",
  "Record the diff, validation results, residual risk, and escalation state."
];

const FORBIDDEN_REPAIR_ACTIONS = [
  "Do not delete, skip, weaken, or silence tests.",
  "Do not weaken assertions to create a passing result.",
  "Do not disable lint, typecheck, build, security, or review checks.",
  "Do not edit workflows, CODEOWNERS, AGENTS.md, secrets, billing, DNS, deployment, production data, Webflow, Cloudflare Workers, or R2 production objects.",
  "Do not create real branches, PRs, issues, merges, auto-merge actions, GitHub API calls, or gh calls from the implementation."
];

export function planCiRepairLoop(
  input: CiRepairPlannerInput
): CiRepairPlannerResult {
  const reasons: string[] = [];
  const duplicateProtections: string[] = [];
  const rejectedEvidence: string[] = [];
  const tasks = normalizeTasks(input.roadmap?.tasks);
  const taskById = firstTaskById(tasks);
  const duplicateTaskIds = findDuplicateValues(
    tasks.map((task) => task.id).filter(Boolean)
  );
  const readyTaskIds = tasks
    .filter((task) => task.status === "ready")
    .map((task) => task.id)
    .sort(compareStrings);
  const blockedTaskIds = tasks
    .filter((task) => task.status && BLOCKED_STATUSES.has(task.status))
    .map((task) => task.id)
    .sort(compareStrings);
  const skippedTaskIds = tasks
    .filter(
      (task) =>
        task.status !== "ready" &&
        (!task.status || !BLOCKED_STATUSES.has(task.status))
    )
    .map((task) => task.id)
    .filter(Boolean)
    .sort(compareStrings);
  const options = input.options ?? null;
  const repairAttemptLimit = normalizeRepairAttemptLimit(
    options?.maxRepairAttempts
  );
  const evidenceMaxAgeHours = normalizeEvidenceMaxAgeHours(
    options?.evidenceMaxAgeHours
  );
  const requestedTaskId = normalizeTaskId(input.requestedTaskId);
  const selectedTaskId = requestedTaskId || TARGET_TASK_ID;
  const selectedTask = taskById.get(selectedTaskId) ?? null;
  const affectedTaskIds = normalizeTaskIds(input.affectedTaskIds);
  const attempts = normalizeAttempts(input.attemptHistory ?? []);
  const selectedTaskAttempts = attempts.filter(
    (attempt) => attempt.taskId === TARGET_TASK_ID
  );
  const nextRepairAttempt =
    selectedTaskAttempts.length < repairAttemptLimit
      ? nextAttemptNumber(selectedTaskAttempts)
      : null;
  const existingBranches = normalizeExistingBranches(
    input.existingBranches ?? []
  );
  const existingRepairPrs = normalizeExistingRepairPrs(
    input.existingRepairPrs ?? []
  );

  if (!input.roadmap) {
    reasons.push("missing_roadmap");
  }

  if (!Array.isArray(input.roadmap?.tasks) || input.roadmap?.tasks.length === 0) {
    reasons.push("missing_tasks");
  }

  if (options?.dryRun === false) {
    reasons.push("dry_run_false_not_supported_v1");
  }

  if (options?.liveGitHubMutations === true) {
    reasons.push("live_github_mutation_request_not_supported_v1");
  }

  if (options?.autoMerge === true) {
    reasons.push("auto_merge_request_not_supported_v1");
  }

  if (repairAttemptLimit < 1) {
    reasons.push(`invalid_repair_attempt_limit:${repairAttemptLimit}`);
  }

  if (evidenceMaxAgeHours < 1) {
    reasons.push(`invalid_evidence_max_age_hours:${evidenceMaxAgeHours}`);
  }

  for (const task of tasks) {
    if (!task.id) {
      reasons.push("missing_task_id");
    }

    if (!task.status) {
      reasons.push(`missing_task_status:${task.id || "missing_id"}`);
    } else if (!isKnownTaskStatus(task.status)) {
      reasons.push(`unknown_task_status:${task.id}:${task.status}`);
    }

    if (!task.risk) {
      reasons.push(`unknown_task_risk:${task.id}:${task.rawRisk ?? "missing"}`);
    }
  }

  for (const duplicateTaskId of duplicateTaskIds) {
    reasons.push(`duplicate_task_id:${duplicateTaskId}`);
  }

  reasons.push(...findUnresolvedDependencyReferences(tasks, taskById));

  const dependencyCycle = findDependencyCycle(tasks, taskById);

  if (dependencyCycle) {
    reasons.push(`dependency_cycle:${dependencyCycle.join("->")}`);
  }

  if (selectedTaskId !== TARGET_TASK_ID) {
    reasons.push(`unsupported_repair_task:${selectedTaskId}`);
  }

  if (selectedTaskId === BLOCKED_FOLLOW_ON_TASK_ID) {
    reasons.push(`fct_060_out_of_scope:${BLOCKED_FOLLOW_ON_TASK_ID}`);
  }

  if (!selectedTask) {
    reasons.push(`requested_task_missing:${selectedTaskId}`);
  } else {
    reasons.push(...validateSelectedTask(selectedTask, taskById));
  }

  const fct060 = taskById.get(BLOCKED_FOLLOW_ON_TASK_ID);

  if (!fct060) {
    reasons.push(`missing_task:${BLOCKED_FOLLOW_ON_TASK_ID}`);
  } else if (fct060.status !== "blocked_dependency") {
    reasons.push(
      `fct_060_not_blocked_dependency:${
        fct060.status ?? "missing"
      }`
    );
  }

  for (const affectedTaskId of affectedTaskIds) {
    if (affectedTaskId !== TARGET_TASK_ID) {
      reasons.push(`affected_task_out_of_scope:${affectedTaskId}`);
    }

    if (affectedTaskId === BLOCKED_FOLLOW_ON_TASK_ID) {
      reasons.push(`fct_060_would_be_affected:${affectedTaskId}`);
    }
  }

  for (const attempt of attempts) {
    if (!attempt.status) {
      reasons.push(`missing_attempt_status:${attempt.taskId || "missing_task"}`);
    } else if (!KNOWN_ATTEMPT_STATUSES.has(attempt.status)) {
      reasons.push(
        `unknown_attempt_status:${attempt.taskId}:${attempt.status}`
      );
    }
  }

  if (selectedTaskAttempts.length >= repairAttemptLimit) {
    reasons.push(
      `repair_attempt_limit_exceeded:${TARGET_TASK_ID}:` +
        `${selectedTaskAttempts.length}/${repairAttemptLimit}`
    );
  }

  for (const duplicateIdempotencyKey of findDuplicateExistingIdempotencyKeys(
    existingBranches,
    existingRepairPrs
  )) {
    reasons.push(`ambiguous_existing_idempotency_key:${duplicateIdempotencyKey}`);
  }

  const ciSummary = summarizeCiEvidence({
    ciRun: input.ciRun,
    failedJobs: input.failedJobs ?? [],
    now: options?.now ?? null,
    evidenceMaxAgeHours
  });

  reasons.push(...ciSummary.reasons);
  rejectedEvidence.push(...ciSummary.rejectedEvidence);

  const baseReasons = uniquePreserveOrder([
    ...reasons,
    "dry_run_forced_v1",
    "live_github_mutations_disabled_v1",
    "auto_merge_disabled_v1",
    "fct_050_status_preserved_ready_v1",
    "fct_060_blocked_dependency_preserved_v1"
  ]);
  const structurallyValid = reasons.length === 0;
  const repairPlans =
    structurallyValid &&
    selectedTask &&
    ciSummary.failureTarget &&
    nextRepairAttempt
      ? [
          buildRepairPlan({
            task: selectedTask,
            repairAttempt: nextRepairAttempt,
            failureTarget: ciSummary.failureTarget,
            existingBranches,
            existingRepairPrs,
            duplicateProtections
          })
        ]
      : [];
  const blockedPlans = repairPlans.filter((plan) => plan.action === "block");
  const status =
    structurallyValid && repairPlans.length > 0 && blockedPlans.length === 0
      ? "pass"
      : "fail";
  const requiresOwnerApproval =
    !structurallyValid ||
    selectedTask?.risk === "high" ||
    selectedTask?.humanGate === true ||
    repairPlans.some((plan) => plan.ownerApprovalRequired) ||
    blockedPlans.length > 0;

  return {
    version: CI_REPAIR_LOOP_VERSION,
    status,
    dryRun: true,
    liveGitHubMutations: false,
    autoMergeEnabled: false,
    readyTaskIds,
    skippedTaskIds,
    blockedTaskIds,
    reasons: baseReasons,
    acceptedEvidence: uniqueSorted(ciSummary.acceptedEvidence),
    rejectedEvidence: uniqueSorted(rejectedEvidence),
    duplicateProtections: uniqueSorted([
      ...duplicateProtections,
      ...blockedPlans.map((plan) => `blocked_plan:${plan.taskId}`)
    ]),
    requiresOwnerApproval,
    repairAttemptLimit,
    nextRepairAttempt,
    repairPlans
  };
}

function normalizeTasks(
  tasks?: readonly CiRepairRoadmapTaskLike[] | null
): NormalizedTask[] {
  if (!tasks) {
    return [];
  }

  return tasks
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

function normalizeAttempts(
  attempts: readonly CiRepairAttemptLike[]
): NormalizedAttempt[] {
  return [...attempts]
    .map((attempt) => ({
      taskId: normalizeTaskId(attempt.taskId),
      attemptNumber:
        typeof attempt.attemptNumber === "number"
          ? attempt.attemptNumber
          : null,
      status: normalizeIdentifierOrNull(attempt.status),
      idempotencyKey: normalizeNullableString(attempt.idempotencyKey)
    }))
    .sort(compareAttempts);
}

function normalizeExistingBranches(
  branches: readonly ExistingCiRepairBranchLike[]
): NormalizedBranch[] {
  return [...branches]
    .map((branch) => {
      const state: NormalizedBranch["state"] =
        branch.state === "deleted" ? "deleted" : "active";

      return {
        name: normalizeBranchName(branch.name),
        taskId: normalizeTaskId(branch.taskId) || null,
        repairAttempt:
          typeof branch.repairAttempt === "number"
            ? branch.repairAttempt
            : null,
        idempotencyKey: normalizeNullableString(branch.idempotencyKey),
        state
      };
    })
    .filter((branch) => branch.name.length > 0)
    .sort(compareBranches);
}

function normalizeExistingRepairPrs(
  repairPrs: readonly ExistingCiRepairPrLike[]
): NormalizedRepairPr[] {
  return [...repairPrs]
    .map((repairPr) => {
      const state: NormalizedRepairPr["state"] =
        repairPr.state === "closed" ? "closed" : "open";

      return {
        title: normalizeIssueBody(repairPr.title),
        body: normalizeIssueBody(repairPr.body),
        labels: normalizeStringList(repairPr.labels),
        taskId: normalizeTaskId(repairPr.taskId) || null,
        repairAttempt:
          typeof repairPr.repairAttempt === "number"
            ? repairPr.repairAttempt
            : null,
        idempotencyKey: normalizeNullableString(repairPr.idempotencyKey),
        branchName: normalizeBranchName(repairPr.branchName) || null,
        isDraft: repairPr.isDraft !== false,
        state,
        autoMergeEnabled: repairPr.autoMergeEnabled === true
      };
    })
    .sort(compareRepairPrs);
}

function validateSelectedTask(
  task: NormalizedTask,
  taskById: ReadonlyMap<string, NormalizedTask>
) {
  const reasons: string[] = [];

  if (task.status !== "ready") {
    reasons.push(`selected_task_not_ready:${task.id}:${task.status ?? "missing"}`);
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

  if (task.dependsOn.length === 0) {
    reasons.push(`missing_dependency_state:${task.id}`);
  }

  if (task.risk === "high" && task.autoMergeEligible) {
    reasons.push(`high_risk_auto_merge_eligible_not_supported:${task.id}`);
  }

  return reasons;
}

function summarizeCiEvidence({
  ciRun,
  failedJobs,
  now,
  evidenceMaxAgeHours
}: {
  ciRun?: CiRepairRunLike | null;
  failedJobs: readonly CiRepairFailedJobSummaryLike[];
  now: string | null;
  evidenceMaxAgeHours: number;
}): CiEvidenceSummary {
  const reasons: string[] = [];
  const acceptedEvidence: string[] = [];
  const rejectedEvidence: string[] = [];

  if (!ciRun) {
    return {
      reasons: ["missing_ci_run_evidence"],
      acceptedEvidence,
      rejectedEvidence,
      failureTarget: null
    };
  }

  const runName = normalizeIdentifier(ciRun.name ?? "missing");
  const runStatus = normalizeIdentifierOrNull(ciRun.status);
  const runConclusion = normalizeIdentifierOrNull(ciRun.conclusion);
  const runEvidence = normalizeNullableString(ciRun.evidence);
  const checkRuns = normalizeCheckRuns(ciRun.checkRuns ?? []);
  const normalizedFailedJobs = normalizeFailedJobs(failedJobs);

  if (ciRun.isNoOp === true || NO_OP_WORKFLOW_NAMES.has(runName)) {
    reasons.push(`no_op_workflow_not_repair_evidence:${runName}`);
    rejectedEvidence.push(`workflow:${runName}:no_op`);
  }

  if (!runStatus) {
    reasons.push(`missing_ci_run_status:${runName}`);
  } else if (!KNOWN_RUN_STATUSES.has(runStatus)) {
    reasons.push(`unknown_ci_run_status:${runName}:${runStatus}`);
  } else if (runStatus !== "completed") {
    reasons.push(`ci_run_not_completed:${runName}:${runStatus}`);
  }

  if (!runConclusion) {
    reasons.push(`missing_ci_run_conclusion:${runName}`);
  } else if (!KNOWN_CHECK_CONCLUSIONS.has(runConclusion)) {
    reasons.push(`unknown_ci_run_conclusion:${runName}:${runConclusion}`);
  } else if (runConclusion === "success") {
    reasons.push(`ci_run_not_failed:${runName}:success`);
  } else if (runConclusion !== "failure") {
    reasons.push(`ci_run_conclusion_not_repairable:${runName}:${runConclusion}`);
  }

  reasons.push(
    ...validateCiTimestamp({
      completedAt: ciRun.completedAt,
      now,
      evidenceMaxAgeHours,
      evidenceName: `ci_run:${runName}`
    })
  );

  if (checkRuns.length === 0) {
    reasons.push("missing_ci_check_runs");
  }

  for (const checkRun of checkRuns) {
    if (checkRun.isNoOp || NO_OP_WORKFLOW_NAMES.has(checkRun.name)) {
      reasons.push(`no_op_check_not_repair_evidence:${checkRun.name}`);
      rejectedEvidence.push(`check:${checkRun.name}:no_op`);
    }

    if (!checkRun.status) {
      reasons.push(`missing_check_status:${checkRun.name}`);
    } else if (!KNOWN_RUN_STATUSES.has(checkRun.status)) {
      reasons.push(
        `unknown_check_status:${checkRun.name}:${checkRun.status}`
      );
    } else if (checkRun.status !== "completed") {
      reasons.push(`check_not_completed:${checkRun.name}:${checkRun.status}`);
    }

    if (!checkRun.conclusion) {
      reasons.push(`missing_check_conclusion:${checkRun.name}`);
    } else if (!KNOWN_CHECK_CONCLUSIONS.has(checkRun.conclusion)) {
      reasons.push(
        `unknown_check_conclusion:${checkRun.name}:${checkRun.conclusion}`
      );
    }

    if (checkRun.conclusion && checkRun.conclusion !== "success") {
      rejectedEvidence.push(`check:${checkRun.name}:${checkRun.conclusion}`);
    }
  }

  const failedChecks = checkRuns.filter(
    (checkRun) => checkRun.conclusion === "failure"
  );

  if (failedChecks.length === 0) {
    reasons.push("missing_failed_check");
  } else if (failedChecks.length > 1) {
    reasons.push(
      `ambiguous_failed_checks:${failedChecks
        .map((checkRun) => checkRun.name)
        .join(",")}`
    );
  }

  if (normalizedFailedJobs.length === 0) {
    reasons.push("missing_failed_job_summary");
  } else if (normalizedFailedJobs.length > 1) {
    reasons.push(
      `ambiguous_failed_jobs:${normalizedFailedJobs
        .map((job) => job.jobName)
        .join(",")}`
    );
  }

  const failedCheck = failedChecks.length === 1 ? failedChecks[0] : null;
  const failedJob =
    normalizedFailedJobs.length === 1 ? normalizedFailedJobs[0] : null;

  if (failedCheck && failedJob && failedJob.checkName !== failedCheck.name) {
    reasons.push(
      `failed_job_check_mismatch:${failedJob.checkName}:${failedCheck.name}`
    );
  }

  if (failedJob) {
    if (!failedJob.failureClass) {
      reasons.push(`missing_failure_class:${failedJob.jobName}`);
    } else if (!SUPPORTED_FAILURE_CLASSES.has(failedJob.failureClass)) {
      reasons.push(
        `unsupported_failure_class:${failedJob.jobName}:${failedJob.failureClass}`
      );
    }

    if (!failedJob.failureSignature) {
      reasons.push(`missing_failure_signature:${failedJob.jobName}`);
    }

    if (!failedJob.summary) {
      reasons.push(`missing_failure_summary:${failedJob.jobName}`);
    }

    if (!failedJob.rerunCommand) {
      reasons.push(`missing_rerun_command:${failedJob.jobName}`);
    }
  }

  if (runEvidence && runConclusion === "failure") {
    acceptedEvidence.push(`ci_run:${runName}:${runEvidence}`);
  }

  if (failedCheck?.evidence) {
    acceptedEvidence.push(`check:${failedCheck.name}:${failedCheck.evidence}`);
  }

  const failureTarget =
    reasons.length === 0 && failedCheck && failedJob
      ? {
          checkName: failedCheck.name,
          jobName: failedJob.jobName,
          failureClass:
            failedJob.failureClass as Exclude<CiRepairFailureClass, "unknown">,
          failureSignature: failedJob.failureSignature ?? "",
          summary: failedJob.summary ?? "",
          rerunCommand: failedJob.rerunCommand ?? ""
        }
      : null;

  return {
    reasons,
    acceptedEvidence,
    rejectedEvidence,
    failureTarget
  };
}

function normalizeCheckRuns(
  checkRuns: readonly CiRepairCheckRunLike[]
): NormalizedCheckRun[] {
  return [...checkRuns]
    .map((checkRun) => ({
      name: normalizeIdentifier(checkRun.name ?? "missing"),
      status: normalizeIdentifierOrNull(checkRun.status),
      conclusion: normalizeIdentifierOrNull(checkRun.conclusion),
      completedAt: normalizeNullableString(checkRun.completedAt),
      evidence: normalizeNullableString(checkRun.evidence),
      isNoOp: checkRun.isNoOp === true
    }))
    .sort(compareCheckRuns);
}

function normalizeFailedJobs(
  failedJobs: readonly CiRepairFailedJobSummaryLike[]
): NormalizedFailedJob[] {
  return [...failedJobs]
    .map((failedJob) => ({
      checkName: normalizeIdentifier(failedJob.checkName ?? "missing"),
      jobName: normalizeIdentifier(failedJob.jobName ?? "missing"),
      failureClass: normalizeIdentifierOrNull(failedJob.failureClass),
      failureSignature: normalizeNullableString(failedJob.failureSignature),
      summary: normalizeNullableString(failedJob.summary),
      rerunCommand: normalizeNullableString(failedJob.rerunCommand)
    }))
    .sort(compareFailedJobs);
}

function validateCiTimestamp({
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
    reasons.push("missing_ci_evidence_now");
    return reasons;
  }

  const nowMs = Date.parse(now);

  if (!Number.isFinite(nowMs)) {
    reasons.push(`invalid_ci_evidence_now:${now}`);
    return reasons;
  }

  if (!completedAt) {
    reasons.push(`missing_ci_completed_at:${evidenceName}`);
    return reasons;
  }

  const completedAtMs = Date.parse(completedAt);

  if (!Number.isFinite(completedAtMs)) {
    reasons.push(`invalid_ci_completed_at:${evidenceName}`);
    return reasons;
  }

  if (completedAtMs > nowMs) {
    reasons.push(`ci_evidence_in_future:${evidenceName}`);
    return reasons;
  }

  const ageHours = Math.floor((nowMs - completedAtMs) / 3600000);

  if (ageHours > evidenceMaxAgeHours) {
    reasons.push(
      `stale_ci_evidence:${evidenceName}:${ageHours}h>${evidenceMaxAgeHours}h`
    );
  }

  return reasons;
}

function buildRepairPlan({
  task,
  repairAttempt,
  failureTarget,
  existingBranches,
  existingRepairPrs,
  duplicateProtections
}: {
  task: NormalizedTask;
  repairAttempt: number;
  failureTarget: CiRepairFailureTarget;
  existingBranches: readonly NormalizedBranch[];
  existingRepairPrs: readonly NormalizedRepairPr[];
  duplicateProtections: string[];
}): CiRepairPlan {
  const idempotencyKey = `vlx-ci-repair:${task.id}:attempt-${repairAttempt}:v1`;
  const branchName = `factory/${task.id.toLowerCase()}-ci-repair-attempt-${repairAttempt}`;
  const title = `[${task.id}] CI repair attempt ${repairAttempt}: ${failureTarget.checkName}`;
  const labels = buildLabels(task, repairAttempt);
  const allowedActions = [...ALLOWED_REPAIR_ACTIONS];
  const forbiddenActions = [...FORBIDDEN_REPAIR_ACTIONS];
  const validationPlan = buildValidationPlan(task, failureTarget);
  const safetyNotes = buildSafetyNotes(task);
  const rollbackPlan = buildRollbackPlan();
  const body = buildRepairBody({
    task,
    repairAttempt,
    branchName,
    title,
    idempotencyKey,
    labels,
    failureTarget,
    allowedActions,
    forbiddenActions,
    validationPlan,
    safetyNotes,
    rollbackPlan
  });
  const branchMatch = findExistingBranchMatch(
    { task, repairAttempt, branchName, idempotencyKey },
    existingBranches
  );
  const repairPrMatch = findExistingRepairPrMatch(
    { task, repairAttempt, branchName, title, idempotencyKey },
    existingRepairPrs
  );
  const branchConflict = branchMatch
    ? branchMatchConflicts(
        branchMatch.branch,
        task,
        repairAttempt,
        branchName,
        idempotencyKey
      )
    : null;
  const repairPrConflict = repairPrMatch
    ? repairPrMatchConflicts(
        repairPrMatch.repairPr,
        repairPrMatch.reason,
        task,
        repairAttempt,
        branchName,
        title,
        idempotencyKey
      )
    : null;

  if (branchMatch) {
    duplicateProtections.push(
      `existing_branch_${branchMatch.reason}:${task.id}:attempt-${repairAttempt}:${branchMatch.branch.state}`
    );
  }

  if (repairPrMatch) {
    duplicateProtections.push(
      `existing_repair_pr_${repairPrMatch.reason}:${task.id}:attempt-${repairAttempt}:${repairPrMatch.repairPr.state}`
    );
  }

  if (branchConflict) {
    duplicateProtections.push(
      `conflicting_existing_branch:${task.id}:attempt-${repairAttempt}:${branchConflict}`
    );
  }

  if (repairPrConflict) {
    duplicateProtections.push(
      `conflicting_existing_repair_pr:${task.id}:attempt-${repairAttempt}:${repairPrConflict}`
    );
  }

  return {
    taskId: task.id,
    repairAttempt,
    branchName,
    title,
    body,
    labels,
    idempotencyKey,
    action: determineAction({
      expected: { title, body, labels },
      branchMatch,
      repairPrMatch,
      branchConflict,
      repairPrConflict
    }),
    failureTarget,
    allowedActions,
    forbiddenActions,
    validationPlan,
    safetyNotes,
    rollbackPlan,
    ownerApprovalRequired: taskRequiresOwnerApproval(task)
  };
}

function buildLabels(task: NormalizedTask, repairAttempt: number) {
  const labels = [
    "factory",
    "ci-repair",
    "roadmap-task",
    `task:${task.id}`,
    `repair-attempt:${repairAttempt}`,
    `risk:${task.risk ?? "high"}`,
    "dry-run"
  ];

  if (task.humanGate) {
    labels.push("human-gate");
  }

  if (taskRequiresOwnerApproval(task)) {
    labels.push("owner-approval-required");
  }

  labels.push("auto-merge-disabled");

  return labels;
}

function buildValidationPlan(
  task: NormalizedTask,
  failureTarget: CiRepairFailureTarget
) {
  return uniquePreserveOrder([
    failureTarget.rerunCommand,
    ...task.validation,
    ...BASE_VALIDATION_COMMANDS
  ]);
}

function buildSafetyNotes(task: NormalizedTask) {
  const notes = [
    "Dry-run planner only; no real GitHub branch, PR, issue, merge, API call, or gh call is performed.",
    "liveGitHubMutations is forced false.",
    "autoMergeEnabled is forced false.",
    "FCT-050 remains ready until a separate verified evidence sync.",
    "FCT-060 remains blocked_dependency and is not planned.",
    "No external systems, production data, provider settings, workflows, CODEOWNERS, AGENTS.md, billing, DNS, deployment, Webflow, Cloudflare Workers, or R2 production objects are mutated."
  ];

  if (taskRequiresOwnerApproval(task)) {
    notes.push("Owner approval is required before merge or follow-on automation.");
  }

  return notes;
}

function buildRollbackPlan() {
  return [
    "Ignore the dry-run plan; it has no live side effects.",
    "Revert the implementing PR if the planner contract is wrong.",
    "Escalate to a human after the bounded attempt limit is reached."
  ];
}

function buildRepairBody({
  task,
  repairAttempt,
  branchName,
  title,
  idempotencyKey,
  labels,
  failureTarget,
  allowedActions,
  forbiddenActions,
  validationPlan,
  safetyNotes,
  rollbackPlan
}: {
  task: NormalizedTask;
  repairAttempt: number;
  branchName: string;
  title: string;
  idempotencyKey: string;
  labels: readonly string[];
  failureTarget: CiRepairFailureTarget;
  allowedActions: readonly string[];
  forbiddenActions: readonly string[];
  validationPlan: readonly string[];
  safetyNotes: readonly string[];
  rollbackPlan: readonly string[];
}) {
  return [
    `# ${title}`,
    "",
    "## Goal",
    `Plan bounded CI repair attempt ${repairAttempt} for roadmap task ${task.id}.`,
    "",
    "## Scope",
    "- The planner returns deterministic metadata only.",
    "- No live GitHub, deployment, billing, provider, or production mutation is performed.",
    "- FCT-060 release guard and evidence sync remains out of scope.",
    "",
    "## Roadmap task",
    `- Task ID: ${task.id}`,
    `- Title: ${task.title}`,
    `- Phase: ${task.phase}`,
    `- Risk: ${task.risk ?? "unknown"}`,
    `- Dependencies: ${task.dependsOn.join(", ") || "None"}`,
    `- Branch: ${branchName}`,
    `- Idempotency key: ${idempotencyKey}`,
    `- Labels: ${labels.join(", ")}`,
    "",
    "## Failure target",
    `- Check: ${failureTarget.checkName}`,
    `- Job: ${failureTarget.jobName}`,
    `- Class: ${failureTarget.failureClass}`,
    `- Signature: ${failureTarget.failureSignature}`,
    `- Summary: ${failureTarget.summary}`,
    "",
    "## Allowed repair actions",
    ...formatList(allowedActions),
    "",
    "## Forbidden repair actions",
    ...formatList(forbiddenActions),
    "",
    "## Validation plan",
    ...formatList(validationPlan),
    "",
    "## Safety boundaries",
    ...formatList(safetyNotes),
    "",
    "## Rollback",
    ...formatList(rollbackPlan),
    "",
    "## Owner approval",
    `- Owner approval required: ${taskRequiresOwnerApproval(task) ? "yes" : "no"}`,
    "- High-risk/control-plane repair actions require owner approval.",
    "",
    "## Auto-merge eligibility",
    "- Auto-merge enabled: false",
    "- Auto-merge is out of scope for this planner."
  ].join("\n");
}

function determineAction({
  expected,
  branchMatch,
  repairPrMatch,
  branchConflict,
  repairPrConflict
}: {
  expected: {
    title: string;
    body: string;
    labels: readonly string[];
  };
  branchMatch: BranchMatch | null;
  repairPrMatch: RepairPrMatch | null;
  branchConflict: string | null;
  repairPrConflict: string | null;
}): CiRepairPlanAction {
  if (branchConflict || repairPrConflict) {
    return "block";
  }

  if (!branchMatch && !repairPrMatch) {
    return "create";
  }

  if (!repairPrMatch) {
    return "create";
  }

  const repairPr = repairPrMatch.repairPr;

  if (
    repairPr.title === expected.title &&
    repairPr.body === expected.body &&
    comparableStringListsEqual(repairPr.labels, expected.labels)
  ) {
    return "skip";
  }

  return "update";
}

function findExistingBranchMatch(
  expected: {
    task: NormalizedTask;
    repairAttempt: number;
    branchName: string;
    idempotencyKey: string;
  },
  branches: readonly NormalizedBranch[]
): BranchMatch | null {
  for (const branch of branches) {
    if (branch.name === expected.branchName) {
      return { branch, reason: "name" };
    }
  }

  for (const branch of branches) {
    if (
      branch.taskId === expected.task.id &&
      branch.repairAttempt === expected.repairAttempt
    ) {
      return { branch, reason: "task_id_attempt" };
    }
  }

  for (const branch of branches) {
    if (branch.idempotencyKey === expected.idempotencyKey) {
      return { branch, reason: "idempotency_key" };
    }
  }

  return null;
}

function findExistingRepairPrMatch(
  expected: {
    task: NormalizedTask;
    repairAttempt: number;
    branchName: string;
    title: string;
    idempotencyKey: string;
  },
  repairPrs: readonly NormalizedRepairPr[]
): RepairPrMatch | null {
  for (const repairPr of repairPrs) {
    if (
      repairPr.taskId === expected.task.id &&
      repairPr.repairAttempt === expected.repairAttempt
    ) {
      return { repairPr, reason: "task_id_attempt" };
    }
  }

  for (const repairPr of repairPrs) {
    if (repairPr.idempotencyKey === expected.idempotencyKey) {
      return { repairPr, reason: "idempotency_key" };
    }
  }

  for (const repairPr of repairPrs) {
    if (repairPr.branchName === expected.branchName) {
      return { repairPr, reason: "branch_name" };
    }
  }

  for (const repairPr of repairPrs) {
    if (hasTaskLabel(repairPr.labels, expected.task.id)) {
      return { repairPr, reason: "task_label" };
    }
  }

  for (const repairPr of repairPrs) {
    if (repairPr.title === expected.title) {
      return { repairPr, reason: "title" };
    }
  }

  return null;
}

function branchMatchConflicts(
  branch: NormalizedBranch,
  task: NormalizedTask,
  repairAttempt: number,
  branchName: string,
  idempotencyKey: string
) {
  if (branch.state !== "active") {
    return "branch_not_active";
  }

  if (branch.name !== branchName) {
    return "branch_name_mismatch";
  }

  if (branch.taskId && branch.taskId !== task.id) {
    return "task_id_mismatch";
  }

  if (
    branch.repairAttempt !== null &&
    branch.repairAttempt !== repairAttempt
  ) {
    return "repair_attempt_mismatch";
  }

  if (branch.idempotencyKey && branch.idempotencyKey !== idempotencyKey) {
    return "idempotency_key_mismatch";
  }

  return null;
}

function repairPrMatchConflicts(
  repairPr: NormalizedRepairPr,
  matchReason: RepairPrMatch["reason"],
  task: NormalizedTask,
  repairAttempt: number,
  branchName: string,
  title: string,
  idempotencyKey: string
) {
  if (repairPr.state !== "open") {
    return "repair_pr_not_open";
  }

  if (!repairPr.isDraft) {
    return "pr_is_not_draft";
  }

  if (repairPr.autoMergeEnabled) {
    return "auto_merge_enabled";
  }

  if (repairPr.taskId && repairPr.taskId !== task.id) {
    return "task_id_mismatch";
  }

  if (
    repairPr.repairAttempt !== null &&
    repairPr.repairAttempt !== repairAttempt
  ) {
    return "repair_attempt_mismatch";
  }

  if (repairPr.idempotencyKey && repairPr.idempotencyKey !== idempotencyKey) {
    return "idempotency_key_mismatch";
  }

  if (repairPr.branchName && repairPr.branchName !== branchName) {
    return "branch_name_mismatch";
  }

  if (
    matchReason !== "task_label" &&
    repairPr.title &&
    repairPr.title !== title
  ) {
    return "title_mismatch";
  }

  return null;
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

function findDuplicateExistingIdempotencyKeys(
  branches: readonly NormalizedBranch[],
  repairPrs: readonly NormalizedRepairPr[]
) {
  return uniqueSorted([
    ...findDuplicateValues(
      branches.map((branch) => branch.idempotencyKey).filter(isString)
    ),
    ...findDuplicateValues(
      repairPrs.map((repairPr) => repairPr.idempotencyKey).filter(isString)
    )
  ]);
}

function nextAttemptNumber(attempts: readonly NormalizedAttempt[]) {
  const attemptNumbers = attempts
    .map((attempt) => attempt.attemptNumber)
    .filter(isNumber);
  const maxAttemptNumber =
    attemptNumbers.length > 0 ? Math.max(...attemptNumbers) : attempts.length;

  return maxAttemptNumber + 1;
}

function normalizeRepairAttemptLimit(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_REPAIR_ATTEMPT_LIMIT;
  }

  return Math.floor(value);
}

function normalizeEvidenceMaxAgeHours(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_EVIDENCE_MAX_AGE_HOURS;
  }

  return Math.floor(value);
}

function taskRequiresOwnerApproval(task: NormalizedTask) {
  return task.risk === "high" || task.humanGate;
}

function isKnownTaskStatus(value: string): value is CiRepairTaskStatus {
  return KNOWN_TASK_STATUSES.includes(value as CiRepairTaskStatus);
}

function hasTaskLabel(labels: readonly string[], taskId: string) {
  const taskLabel = normalizeComparable(`task:${taskId}`);

  return labels.some((label) => normalizeComparable(label) === taskLabel);
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

function normalizeNullableString(value?: string | null) {
  const normalized = normalizeWhitespace(value ?? "");

  return normalized.length > 0 ? normalized : null;
}

function normalizeIdentifierOrNull(value?: string | null) {
  const normalized = normalizeNullableString(value);

  return normalized ? normalizeIdentifier(normalized) : null;
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeIssueBody(value?: string | null) {
  const normalized = value?.trim() ?? "";

  return normalized.length > 0 ? normalized : null;
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeTaskStatus(value?: string | null) {
  return normalizeNullableString(value)?.toLowerCase() ?? null;
}

function normalizeRisk(value?: string | null): CiRepairTaskRisk | null {
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

function normalizeBranchName(value?: string | null) {
  return normalizeWhitespace(value ?? "").replace(/\\/g, "/").toLowerCase();
}

function normalizeComparable(value: string) {
  return normalizeWhitespace(value).toLowerCase();
}

function formatList(values: readonly string[]) {
  if (values.length === 0) {
    return ["- None"];
  }

  return values.map((value) => `- ${value}`);
}

function comparableStringListsEqual(
  left: readonly string[],
  right: readonly string[]
) {
  const comparableLeft = left.map(normalizeComparable).sort(compareStrings);
  const comparableRight = right.map(normalizeComparable).sort(compareStrings);

  return (
    comparableLeft.length === comparableRight.length &&
    comparableLeft.every((value, index) => value === comparableRight[index])
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

function isNumber(value: number | null): value is number {
  return value !== null;
}

function compareTasksById(left: NormalizedTask, right: NormalizedTask) {
  return compareStrings(left.id, right.id);
}

function compareCheckRuns(
  left: NormalizedCheckRun,
  right: NormalizedCheckRun
) {
  const byName = compareStrings(left.name, right.name);

  if (byName !== 0) {
    return byName;
  }

  return compareStrings(left.conclusion ?? "", right.conclusion ?? "");
}

function compareFailedJobs(
  left: NormalizedFailedJob,
  right: NormalizedFailedJob
) {
  const byCheck = compareStrings(left.checkName, right.checkName);

  if (byCheck !== 0) {
    return byCheck;
  }

  return compareStrings(left.jobName, right.jobName);
}

function compareAttempts(left: NormalizedAttempt, right: NormalizedAttempt) {
  const byTask = compareStrings(left.taskId, right.taskId);

  if (byTask !== 0) {
    return byTask;
  }

  return (left.attemptNumber ?? 0) - (right.attemptNumber ?? 0);
}

function compareBranches(left: NormalizedBranch, right: NormalizedBranch) {
  const byName = compareStrings(left.name, right.name);

  if (byName !== 0) {
    return byName;
  }

  const byTaskId = compareStrings(left.taskId ?? "", right.taskId ?? "");

  if (byTaskId !== 0) {
    return byTaskId;
  }

  return compareStrings(left.idempotencyKey ?? "", right.idempotencyKey ?? "");
}

function compareRepairPrs(left: NormalizedRepairPr, right: NormalizedRepairPr) {
  const byTaskId = compareStrings(left.taskId ?? "", right.taskId ?? "");

  if (byTaskId !== 0) {
    return byTaskId;
  }

  const byIdempotencyKey = compareStrings(
    left.idempotencyKey ?? "",
    right.idempotencyKey ?? ""
  );

  if (byIdempotencyKey !== 0) {
    return byIdempotencyKey;
  }

  const byBranchName = compareStrings(
    left.branchName ?? "",
    right.branchName ?? ""
  );

  if (byBranchName !== 0) {
    return byBranchName;
  }

  return compareStrings(left.title ?? "", right.title ?? "");
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
