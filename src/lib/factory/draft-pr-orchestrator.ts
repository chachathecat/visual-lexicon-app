export const DRAFT_PR_ORCHESTRATOR_VERSION = 1 as const;

export type DraftPrOrchestratorVersion =
  typeof DRAFT_PR_ORCHESTRATOR_VERSION;

export type DraftPrTaskRisk = "low" | "medium" | "high";

export type DraftPrTaskStatus =
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

export type DraftPrAction = "create" | "update" | "skip" | "block";

export type DraftPrRole =
  | "planner"
  | "explorer"
  | "implementer"
  | "tester"
  | "security_reviewer"
  | "release_guard";

export type DraftPrRoadmapLike = {
  tasks?: readonly DraftPrRoadmapTaskLike[] | null;
};

export type DraftPrRoadmapTaskLike = {
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

export type ExistingDraftPrBranchLike = {
  name?: string | null;
  taskId?: string | null;
  idempotencyKey?: string | null;
  state?: "active" | "deleted" | null;
};

export type ExistingDraftPrLike = {
  title?: string | null;
  body?: string | null;
  labels?: readonly string[] | null;
  taskId?: string | null;
  idempotencyKey?: string | null;
  branchName?: string | null;
  isDraft?: boolean | null;
  state?: "open" | "closed" | null;
  autoMergeEnabled?: boolean | null;
};

export type DraftPrIssueContextLike = {
  readyTaskIds?: readonly string[] | null;
  issuePlans?:
    | readonly {
        taskId?: string | null;
        action?: string | null;
        idempotencyKey?: string | null;
        title?: string | null;
      }[]
    | null;
};

export type DraftPrOrchestrationInput = {
  roadmap?: DraftPrRoadmapLike | null;
  requestedTaskId?: string | null;
  existingBranches?: readonly ExistingDraftPrBranchLike[] | null;
  existingDraftPrs?: readonly ExistingDraftPrLike[] | null;
  issueContext?: DraftPrIssueContextLike | null;
  options?: {
    dryRun?: boolean | null;
    liveGitHubMutations?: boolean | null;
    autoMerge?: boolean | null;
  } | null;
};

export type DraftPrRoleHandoff = {
  role: DraftPrRole;
  codexAgent: string;
  sandboxMode: "read-only" | "workspace-write";
  responsibility: string;
};

export type DraftPrPlan = {
  taskId: string;
  branchName: string;
  title: string;
  body: string;
  labels: string[];
  idempotencyKey: string;
  action: DraftPrAction;
  roleHandoffs: DraftPrRoleHandoff[];
  safetyNotes: string[];
  validationPlan: string[];
  rollbackPlan: string[];
};

export type DraftPrOrchestrationResult = {
  version: DraftPrOrchestratorVersion;
  status: "pass" | "fail";
  dryRun: true;
  liveGitHubMutations: false;
  autoMergeEnabled: false;
  readyTaskIds: string[];
  skippedTaskIds: string[];
  blockedTaskIds: string[];
  reasons: string[];
  duplicateProtections: string[];
  requiresOwnerApproval: boolean;
  draftPrPlans: DraftPrPlan[];
};

type NormalizedTask = {
  id: string;
  phase: string;
  title: string;
  status: string | null;
  risk: DraftPrTaskRisk | null;
  rawRisk: string | null;
  dependsOn: string[];
  deliverables: string[];
  acceptance: string[];
  validation: string[];
  humanGate: boolean;
  autoMergeEligible: boolean;
};

type NormalizedBranch = {
  name: string;
  taskId: string | null;
  idempotencyKey: string | null;
  state: "active" | "deleted";
};

type NormalizedDraftPr = {
  title: string | null;
  body: string | null;
  labels: string[];
  taskId: string | null;
  idempotencyKey: string | null;
  branchName: string | null;
  isDraft: boolean;
  state: "open" | "closed";
  autoMergeEnabled: boolean;
};

type ExistingBranchMatch = {
  branch: NormalizedBranch;
  reason: "name" | "task_id" | "idempotency_key";
};

type ExistingDraftPrMatch = {
  draftPr: NormalizedDraftPr;
  reason:
    | "task_id"
    | "idempotency_key"
    | "branch_name"
    | "task_label"
    | "title";
};

const KNOWN_TASK_STATUSES: readonly DraftPrTaskStatus[] = [
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

const ROLE_HANDOFFS: readonly DraftPrRoleHandoff[] = [
  {
    role: "planner",
    codexAgent: "planner",
    sandboxMode: "read-only",
    responsibility:
      "Convert roadmap acceptance, dependencies, and scope boundaries into an implementation plan."
  },
  {
    role: "explorer",
    codexAgent: "explorer",
    sandboxMode: "read-only",
    responsibility:
      "Survey existing code, tests, coupling, and protected surfaces before implementation."
  },
  {
    role: "implementer",
    codexAgent: "implementer",
    sandboxMode: "workspace-write",
    responsibility:
      "Apply the scoped code and test changes after owner-approved planning."
  },
  {
    role: "tester",
    codexAgent: "tester",
    sandboxMode: "workspace-write",
    responsibility:
      "Add or run targeted and full validation without weakening tests."
  },
  {
    role: "security_reviewer",
    codexAgent: "security-reviewer",
    sandboxMode: "read-only",
    responsibility:
      "Review auth, data, billing, asset, secret, abuse, and production-boundary risk."
  },
  {
    role: "release_guard",
    codexAgent: "release-guard",
    sandboxMode: "read-only",
    responsibility:
      "Evaluate risk, evidence, rollback, owner approval, and merge eligibility."
  }
];

const BASE_VALIDATION_COMMANDS = [
  "npm.cmd run typecheck",
  "npm.cmd run lint",
  "npm.cmd run build",
  "npm.cmd run test -- --workers=1"
];

export function planDraftPrOrchestration(
  input: DraftPrOrchestrationInput
): DraftPrOrchestrationResult {
  const reasons: string[] = [];
  const duplicateProtections: string[] = [];
  const tasks = normalizeTasks(input.roadmap?.tasks);
  const taskById = firstTaskById(tasks);
  const taskIds = tasks.map((task) => task.id).filter(Boolean);
  const duplicateTaskIds = findDuplicateValues(taskIds);
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
  const existingBranches = normalizeExistingBranches(
    input.existingBranches ?? []
  );
  const existingDraftPrs = normalizeExistingDraftPrs(
    input.existingDraftPrs ?? []
  );
  const requestedTaskId = normalizeTaskId(input.requestedTaskId);
  const selectedTaskId = requestedTaskId || selectCurrentReadyFactoryTask(tasks);

  if (!input.roadmap) {
    reasons.push("missing_roadmap");
  }

  if (!Array.isArray(input.roadmap?.tasks) || input.roadmap?.tasks.length === 0) {
    reasons.push("missing_tasks");
  }

  if (input.options?.dryRun === false) {
    reasons.push("dry_run_false_not_supported_v1");
  }

  if (input.options?.liveGitHubMutations === true) {
    reasons.push("live_github_mutation_request_not_supported_v1");
  }

  if (input.options?.autoMerge === true) {
    reasons.push("auto_merge_request_not_supported_v1");
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

  for (const duplicateIdempotencyKey of findDuplicateExistingIdempotencyKeys(
    existingBranches,
    existingDraftPrs
  )) {
    reasons.push(`ambiguous_existing_idempotency_key:${duplicateIdempotencyKey}`);
  }

  if (!selectedTaskId) {
    reasons.push("missing_ready_factory_task");
  }

  if (selectedTaskId && isLaterFactoryTask(selectedTaskId)) {
    reasons.push(`later_factory_task_out_of_scope:${selectedTaskId}`);
  }

  const selectedTask = selectedTaskId ? taskById.get(selectedTaskId) : null;

  if (selectedTaskId && !selectedTask) {
    reasons.push(`requested_task_missing:${selectedTaskId}`);
  }

  if (selectedTask) {
    reasons.push(...validateSelectedTask(selectedTask, taskById));
  }

  const issueContextReasons = summarizeIssueContext(
    selectedTaskId,
    input.issueContext
  );

  const baseReasons = uniquePreserveOrder([
    ...reasons,
    ...issueContextReasons,
    "dry_run_forced_v1",
    "live_github_mutations_disabled_v1",
    "auto_merge_disabled_v1"
  ]);
  const structurallyValid = reasons.length === 0;
  const draftPrPlans =
    structurallyValid && selectedTask
      ? [
          buildDraftPrPlan({
            task: selectedTask,
            existingBranches,
            existingDraftPrs,
            duplicateProtections
          })
        ]
      : [];
  const blockedPlans = draftPrPlans.filter((plan) => plan.action === "block");
  const requiresOwnerApproval =
    selectedTask?.risk === "high" ||
    selectedTask?.humanGate === true ||
    blockedPlans.length > 0 ||
    !structurallyValid;
  const status =
    structurallyValid && blockedPlans.length === 0 && draftPrPlans.length > 0
      ? "pass"
      : "fail";

  return {
    version: DRAFT_PR_ORCHESTRATOR_VERSION,
    status,
    dryRun: true,
    liveGitHubMutations: false,
    autoMergeEnabled: false,
    readyTaskIds,
    skippedTaskIds,
    blockedTaskIds,
    reasons: baseReasons,
    duplicateProtections: uniqueSorted([
      ...duplicateProtections,
      ...blockedPlans.map((plan) => `blocked_plan:${plan.taskId}`)
    ]),
    requiresOwnerApproval,
    draftPrPlans
  };
}

function normalizeTasks(
  tasks?: readonly DraftPrRoadmapTaskLike[] | null
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

function normalizeExistingBranches(
  branches: readonly ExistingDraftPrBranchLike[]
): NormalizedBranch[] {
  return [...branches]
    .map((branch) => {
      const state: NormalizedBranch["state"] =
        branch.state === "deleted" ? "deleted" : "active";

      return {
        name: normalizeBranchName(branch.name),
        taskId: normalizeTaskId(branch.taskId) || null,
        idempotencyKey: normalizeNullableString(branch.idempotencyKey),
        state
      };
    })
    .filter((branch) => branch.name.length > 0)
    .sort(compareBranches);
}

function normalizeExistingDraftPrs(
  draftPrs: readonly ExistingDraftPrLike[]
): NormalizedDraftPr[] {
  return [...draftPrs]
    .map((draftPr) => {
      const state: NormalizedDraftPr["state"] =
        draftPr.state === "closed" ? "closed" : "open";

      return {
        title: normalizeIssueBody(draftPr.title),
        body: normalizeIssueBody(draftPr.body),
        labels: normalizeStringList(draftPr.labels),
        taskId: normalizeTaskId(draftPr.taskId) || null,
        idempotencyKey: normalizeNullableString(draftPr.idempotencyKey),
        branchName: normalizeBranchName(draftPr.branchName) || null,
        isDraft: draftPr.isDraft !== false,
        state,
        autoMergeEnabled: draftPr.autoMergeEnabled === true
      };
    })
    .sort(compareDraftPrs);
}

function selectCurrentReadyFactoryTask(tasks: readonly NormalizedTask[]) {
  const readyFactoryTaskIds = tasks
    .filter((task) => task.status === "ready" && isFactoryTask(task.id))
    .map((task) => task.id)
    .sort(compareStrings);

  return readyFactoryTaskIds.length === 1 ? readyFactoryTaskIds[0] : "";
}

function validateSelectedTask(
  task: NormalizedTask,
  taskById: ReadonlyMap<string, NormalizedTask>
) {
  const reasons: string[] = [];

  if (task.status !== "ready") {
    reasons.push(`selected_task_not_ready:${task.id}:${task.status ?? "missing"}`);
  }

  if (isLaterFactoryTask(task.id)) {
    reasons.push(`later_factory_task_out_of_scope:${task.id}`);
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

function buildDraftPrPlan({
  task,
  existingBranches,
  existingDraftPrs,
  duplicateProtections
}: {
  task: NormalizedTask;
  existingBranches: readonly NormalizedBranch[];
  existingDraftPrs: readonly NormalizedDraftPr[];
  duplicateProtections: string[];
}): DraftPrPlan {
  const idempotencyKey = `vlx-draft-pr:${task.id}:v1`;
  const branchName = buildBranchName(task);
  const title = `[${task.id}] ${task.title}`;
  const labels = buildLabels(task);
  const validationPlan = buildValidationPlan(task);
  const safetyNotes = buildSafetyNotes(task);
  const rollbackPlan = buildRollbackPlan();
  const roleHandoffs = ROLE_HANDOFFS.map((handoff) => ({ ...handoff }));
  const body = buildDraftPrBody({
    task,
    branchName,
    title,
    idempotencyKey,
    labels,
    validationPlan,
    safetyNotes,
    rollbackPlan,
    roleHandoffs
  });
  const branchMatch = findExistingBranchMatch(
    { task, branchName, idempotencyKey },
    existingBranches
  );
  const draftPrMatch = findExistingDraftPrMatch(
    { task, branchName, title, idempotencyKey },
    existingDraftPrs
  );
  const branchConflict = branchMatch
    ? branchMatchConflicts(branchMatch.branch, task, branchName, idempotencyKey)
    : null;
  const draftPrConflict = draftPrMatch
    ? draftPrMatchConflicts(
        draftPrMatch.draftPr,
        draftPrMatch.reason,
        task,
        branchName,
        title,
        idempotencyKey
      )
    : null;

  if (branchMatch) {
    duplicateProtections.push(
      `existing_branch_${branchMatch.reason}:${task.id}:${branchMatch.branch.state}`
    );
  }

  if (draftPrMatch) {
    duplicateProtections.push(
      `existing_draft_pr_${draftPrMatch.reason}:${task.id}:${draftPrMatch.draftPr.state}`
    );
  }

  const action = determineAction({
    expected: {
      title,
      body,
      labels
    },
    branchMatch,
    draftPrMatch,
    branchConflict,
    draftPrConflict
  });

  if (branchConflict) {
    duplicateProtections.push(`conflicting_existing_branch:${task.id}:${branchConflict}`);
  }

  if (draftPrConflict) {
    duplicateProtections.push(`conflicting_existing_draft_pr:${task.id}:${draftPrConflict}`);
  }

  return {
    taskId: task.id,
    branchName,
    title,
    body,
    labels,
    idempotencyKey,
    action,
    roleHandoffs,
    safetyNotes,
    validationPlan,
    rollbackPlan
  };
}

function buildBranchName(task: NormalizedTask) {
  const taskSlug = task.id.toLowerCase();
  const titleSlug = buildShortSlug(task.title);

  return `factory/${taskSlug}-${titleSlug}`;
}

function buildShortSlug(title: string) {
  const genericWords = new Set([
    "add",
    "bounded",
    "create",
    "define",
    "enforce",
    "extend",
    "implement",
    "launch",
    "migrate",
    "move",
    "pass",
    "record",
    "run",
    "switch"
  ]);
  const words = slugify(title)
    .split("-")
    .filter((word) => word && !genericWords.has(word));
  const selectedWords = words.length > 0 ? words : ["task"];

  return selectedWords.slice(0, 5).join("-");
}

function buildLabels(task: NormalizedTask) {
  const labels = [
    "factory",
    "draft-pr",
    "roadmap-task",
    `task:${task.id}`,
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

function buildValidationPlan(task: NormalizedTask) {
  return uniquePreserveOrder([...task.validation, ...BASE_VALIDATION_COMMANDS]);
}

function buildSafetyNotes(task: NormalizedTask) {
  const notes = [
    "Dry-run planner only; no real GitHub branch or draft PR is created.",
    "liveGitHubMutations is forced false.",
    "autoMergeEnabled is forced false.",
    "No external systems or production data are mutated.",
    "No later factory task implementation or status promotion is included."
  ];

  if (taskRequiresOwnerApproval(task)) {
    notes.push("Owner approval is required before merge or follow-on automation.");
  }

  return notes;
}

function buildRollbackPlan() {
  return [
    "Ignore the dry-run plan; it has no live GitHub branch or PR side effects.",
    "Revert the implementing PR if the planner contract is wrong.",
    "Leave roadmap statuses unchanged until a separate verified evidence sync."
  ];
}

function buildDraftPrBody({
  task,
  branchName,
  title,
  idempotencyKey,
  labels,
  validationPlan,
  safetyNotes,
  rollbackPlan,
  roleHandoffs
}: {
  task: NormalizedTask;
  branchName: string;
  title: string;
  idempotencyKey: string;
  labels: readonly string[];
  validationPlan: readonly string[];
  safetyNotes: readonly string[];
  rollbackPlan: readonly string[];
  roleHandoffs: readonly DraftPrRoleHandoff[];
}) {
  return [
    `# ${title}`,
    "",
    "## Goal",
    `Create a bounded dry-run draft PR plan for roadmap task ${task.id}.`,
    "",
    "## Scope",
    "- One roadmap task maps to one scoped draft PR plan.",
    "- The planner returns deterministic metadata only.",
    "- No live GitHub, deployment, billing, or production mutation is performed.",
    "",
    "## Roadmap task",
    `- Task ID: ${task.id}`,
    `- Title: ${task.title}`,
    `- Phase: ${task.phase}`,
    `- Risk: ${task.risk ?? "unknown"}`,
    `- Dependencies: ${task.dependsOn.length > 0 ? task.dependsOn.join(", ") : "None"}`,
    `- Branch: ${branchName}`,
    `- Idempotency key: ${idempotencyKey}`,
    `- Labels: ${labels.join(", ")}`,
    "",
    "## Acceptance criteria",
    ...formatList(task.acceptance),
    "",
    "## Validation plan",
    ...formatList(validationPlan),
    "",
    "## Role handoff plan",
    ...roleHandoffs.map(
      (handoff) =>
        `- ${handoff.role} (${handoff.codexAgent}, ${handoff.sandboxMode}): ${handoff.responsibility}`
    ),
    "",
    "## Risk",
    `- Initial risk: ${task.risk ?? "unknown"}`,
    `- Owner approval required: ${taskRequiresOwnerApproval(task) ? "yes" : "no"}`,
    "- High-risk PRs never merge automatically.",
    "",
    "## Safety boundaries",
    ...formatList(safetyNotes),
    "",
    "## Rollback",
    ...formatList(rollbackPlan),
    "",
    "## Human decision / owner approval",
    `- Human gate: ${task.humanGate ? "required" : "not required"}`,
    `- Owner approval: ${taskRequiresOwnerApproval(task) ? "required" : "not required"}`,
    "- Merge remains human-gated.",
    "",
    "## Auto-merge eligibility",
    "- Roadmap eligibility: false",
    "- Auto-merge enabled: false",
    "- Auto-merge is out of scope for this planner."
  ].join("\n");
}

function determineAction({
  expected,
  branchMatch,
  draftPrMatch,
  branchConflict,
  draftPrConflict
}: {
  expected: {
    title: string;
    body: string;
    labels: readonly string[];
  };
  branchMatch: ExistingBranchMatch | null;
  draftPrMatch: ExistingDraftPrMatch | null;
  branchConflict: string | null;
  draftPrConflict: string | null;
}): DraftPrAction {
  if (branchConflict || draftPrConflict) {
    return "block";
  }

  if (!branchMatch && !draftPrMatch) {
    return "create";
  }

  if (!draftPrMatch) {
    return "create";
  }

  const draftPr = draftPrMatch.draftPr;

  if (
    draftPr.title === expected.title &&
    draftPr.body === expected.body &&
    comparableStringListsEqual(draftPr.labels, expected.labels)
  ) {
    return "skip";
  }

  return "update";
}

function findExistingBranchMatch(
  expected: {
    task: NormalizedTask;
    branchName: string;
    idempotencyKey: string;
  },
  branches: readonly NormalizedBranch[]
): ExistingBranchMatch | null {
  for (const branch of branches) {
    if (branch.name === expected.branchName) {
      return { branch, reason: "name" };
    }
  }

  for (const branch of branches) {
    if (branch.taskId && branch.taskId === expected.task.id) {
      return { branch, reason: "task_id" };
    }
  }

  for (const branch of branches) {
    if (branch.idempotencyKey && branch.idempotencyKey === expected.idempotencyKey) {
      return { branch, reason: "idempotency_key" };
    }
  }

  return null;
}

function findExistingDraftPrMatch(
  expected: {
    task: NormalizedTask;
    branchName: string;
    title: string;
    idempotencyKey: string;
  },
  draftPrs: readonly NormalizedDraftPr[]
): ExistingDraftPrMatch | null {
  for (const draftPr of draftPrs) {
    if (draftPr.taskId && draftPr.taskId === expected.task.id) {
      return { draftPr, reason: "task_id" };
    }
  }

  for (const draftPr of draftPrs) {
    if (draftPr.idempotencyKey && draftPr.idempotencyKey === expected.idempotencyKey) {
      return { draftPr, reason: "idempotency_key" };
    }
  }

  for (const draftPr of draftPrs) {
    if (draftPr.branchName && draftPr.branchName === expected.branchName) {
      return { draftPr, reason: "branch_name" };
    }
  }

  for (const draftPr of draftPrs) {
    if (hasTaskLabel(draftPr.labels, expected.task.id)) {
      return { draftPr, reason: "task_label" };
    }
  }

  for (const draftPr of draftPrs) {
    if (draftPr.title === expected.title) {
      return { draftPr, reason: "title" };
    }
  }

  return null;
}

function branchMatchConflicts(
  branch: NormalizedBranch,
  task: NormalizedTask,
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

  if (branch.idempotencyKey && branch.idempotencyKey !== idempotencyKey) {
    return "idempotency_key_mismatch";
  }

  return null;
}

function draftPrMatchConflicts(
  draftPr: NormalizedDraftPr,
  matchReason: ExistingDraftPrMatch["reason"],
  task: NormalizedTask,
  branchName: string,
  title: string,
  idempotencyKey: string
) {
  if (draftPr.state !== "open") {
    return "draft_pr_not_open";
  }

  if (!draftPr.isDraft) {
    return "pr_is_not_draft";
  }

  if (draftPr.autoMergeEnabled) {
    return "auto_merge_enabled";
  }

  if (draftPr.taskId && draftPr.taskId !== task.id) {
    return "task_id_mismatch";
  }

  if (draftPr.idempotencyKey && draftPr.idempotencyKey !== idempotencyKey) {
    return "idempotency_key_mismatch";
  }

  if (draftPr.branchName && draftPr.branchName !== branchName) {
    return "branch_name_mismatch";
  }

  if (
    matchReason !== "task_label" &&
    draftPr.title &&
    draftPr.title !== title
  ) {
    return "title_mismatch";
  }

  return null;
}

function hasTaskLabel(labels: readonly string[], taskId: string) {
  const taskLabel = normalizeComparable(`task:${taskId}`);

  return labels.some((label) => normalizeComparable(label) === taskLabel);
}

function summarizeIssueContext(
  selectedTaskId: string,
  issueContext?: DraftPrIssueContextLike | null
) {
  if (!issueContext || !selectedTaskId) {
    return [];
  }

  const issuePlan = issueContext.issuePlans?.find(
    (plan) => normalizeTaskId(plan.taskId) === selectedTaskId
  );

  if (!issuePlan) {
    return [];
  }

  return [
    `issue_context:${selectedTaskId}:${
      normalizeNullableString(issuePlan.action) ?? "unknown"
    }`
  ];
}

function findDuplicateExistingIdempotencyKeys(
  branches: readonly NormalizedBranch[],
  draftPrs: readonly NormalizedDraftPr[]
) {
  return uniqueSorted([
    ...findDuplicateValues(
      branches.map((branch) => branch.idempotencyKey).filter(isString)
    ),
    ...findDuplicateValues(
      draftPrs.map((draftPr) => draftPr.idempotencyKey).filter(isString)
    )
  ]);
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

function taskRequiresOwnerApproval(task: NormalizedTask) {
  return task.risk === "high" || task.humanGate;
}

function isKnownTaskStatus(value: string): value is DraftPrTaskStatus {
  return KNOWN_TASK_STATUSES.includes(value as DraftPrTaskStatus);
}

function isFactoryTask(taskId: string) {
  return /^FCT-\d{3}$/.test(taskId);
}

function isLaterFactoryTask(taskId: string) {
  const match = /^FCT-(\d{3})$/.exec(taskId);

  return match ? Number(match[1]) >= 50 : false;
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

function normalizeRisk(value?: string | null): DraftPrTaskRisk | null {
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

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
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

function normalizeComparable(value: string) {
  return normalizeWhitespace(value).toLowerCase();
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

function compareDraftPrs(left: NormalizedDraftPr, right: NormalizedDraftPr) {
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

  const byBranchName = compareStrings(left.branchName ?? "", right.branchName ?? "");

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
