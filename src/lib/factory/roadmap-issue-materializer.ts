export const ROADMAP_ISSUE_MATERIALIZER_VERSION = 1 as const;

export type RoadmapIssueMaterializerVersion =
  typeof ROADMAP_ISSUE_MATERIALIZER_VERSION;

export type RoadmapIssueTaskRisk = "low" | "medium" | "high";

export type RoadmapIssueTaskStatus =
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

export type RoadmapLike = {
  status_values?: readonly string[] | null;
  release_gates?:
    | readonly {
        id?: string | null;
        required_tasks?: readonly string[] | null;
      }[]
    | null;
  tasks?: readonly RoadmapTaskLike[] | null;
};

export type RoadmapTaskLike = {
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

export type ExistingRoadmapIssueLike = {
  title: string;
  body?: string;
  labels?: string[];
  taskId?: string;
  idempotencyKey?: string;
  state?: "open" | "closed";
};

export type RoadmapIssueMaterializerInput = {
  roadmap: RoadmapLike;
  existingIssues?: readonly ExistingRoadmapIssueLike[];
  options?: {
    dryRun?: boolean;
    includeBlocked?: false;
  };
};

export type RoadmapIssuePlan = {
  taskId: string;
  title: string;
  body: string;
  labels: string[];
  idempotencyKey: string;
  action: "create" | "update" | "skip";
};

export type RoadmapIssueMaterializerResult = {
  version: RoadmapIssueMaterializerVersion;
  status: "pass" | "fail";
  reasons: string[];
  readyTaskIds: string[];
  blockedTaskIds: string[];
  skippedTaskIds: string[];
  issuePlans: RoadmapIssuePlan[];
  duplicateProtections: string[];
  requiresOwnerApproval: boolean;
  dryRun: true;
};

type NormalizedTask = {
  id: string;
  phase: string;
  title: string;
  status: string | null;
  risk: RoadmapIssueTaskRisk | null;
  rawRisk: string | null;
  dependsOn: string[];
  deliverables: string[];
  acceptance: string[];
  validation: string[];
  humanGate: boolean;
  autoMergeEligible: boolean;
};

type NormalizedExistingIssue = {
  title: string;
  body: string | null;
  labels: string[];
  normalizedLabels: string[];
  taskId: string | null;
  idempotencyKey: string | null;
  state: "open" | "closed";
};

type ExistingIssueMatch = {
  issue: NormalizedExistingIssue;
  reason: "task_id" | "idempotency_key" | "label" | "title";
};

const KNOWN_TASK_STATUSES: readonly RoadmapIssueTaskStatus[] = [
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

const SKIPPED_NON_BLOCKED_STATUSES = new Set([
  "done",
  "verified",
  "in_review",
  "in_progress",
  "pr_open",
  "failed",
  "deferred"
]);

export function materializeRoadmapIssues(
  input: RoadmapIssueMaterializerInput
): RoadmapIssueMaterializerResult {
  const reasons: string[] = [];
  const duplicateProtections: string[] = [];
  const tasks = normalizeTasks(input.roadmap.tasks);
  const taskIds = tasks.map((task) => task.id).filter(Boolean);
  const taskById = firstTaskById(tasks);
  const duplicateTaskIds = findDuplicateValues(taskIds);
  const readyTasks = tasks
    .filter((task) => task.status === "ready")
    .sort(compareTasksById);
  const readyTaskIds = readyTasks.map((task) => task.id);
  const blockedTaskIds = tasks
    .filter((task) => task.status && BLOCKED_STATUSES.has(task.status))
    .map((task) => task.id)
    .sort(compareStrings);
  const skippedTaskIds = tasks
    .filter(
      (task) =>
        !task.status ||
        task.status !== "ready" ||
        !isKnownTaskStatus(task.status)
    )
    .filter(
      (task) =>
        !task.status ||
        !BLOCKED_STATUSES.has(task.status) ||
        !isKnownTaskStatus(task.status)
    )
    .map((task) => task.id)
    .filter(Boolean)
    .sort(compareStrings);
  const unsafeOptions = input.options as
    | { includeBlocked?: unknown }
    | undefined;

  if (unsafeOptions?.includeBlocked === true) {
    reasons.push("include_blocked_not_supported_v1");
  }

  if (!Array.isArray(input.roadmap.tasks) || input.roadmap.tasks.length === 0) {
    reasons.push("missing_roadmap_tasks");
  }

  for (const task of tasks) {
    if (!task.id) {
      reasons.push("missing_task_id");
    }

    if (!task.status) {
      reasons.push(`missing_task_status:${task.id || "missing_id"}`);
      continue;
    }

    if (!isKnownTaskStatus(task.status)) {
      reasons.push(`unknown_task_status:${task.id}:${task.status}`);
    }
  }

  for (const duplicateTaskId of duplicateTaskIds) {
    reasons.push(`duplicate_task_id:${duplicateTaskId}`);
  }

  reasons.push(...findUnresolvedReleaseGateReferences(input.roadmap, taskById));
  reasons.push(...findUnresolvedDependencyReferences(tasks, taskById));

  const dependencyCycle = findDependencyCycle(tasks, taskById);

  if (dependencyCycle) {
    reasons.push(`dependency_cycle:${dependencyCycle.join("->")}`);
  }

  for (const task of readyTasks) {
    if (!task.title) {
      reasons.push(`missing_task_title:${task.id}`);
    }

    if (!task.risk) {
      reasons.push(
        `unknown_task_risk:${task.id}:${task.rawRisk ?? "missing"}`
      );
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
  }

  const baseReasons = uniquePreserveOrder([
    ...reasons,
    "dry_run_forced_v1",
    "auto_merge_disabled_v1"
  ]);
  const structurallyValid = reasons.length === 0;
  const existingIssues = normalizeExistingIssues(input.existingIssues ?? []);
  const issuePlans = structurallyValid
    ? readyTasks.map((task) => {
        const issuePlan = buildIssuePlan(task);
        const existingIssue = findExistingIssue(issuePlan, existingIssues);

        if (!existingIssue) {
          return issuePlan;
        }

        duplicateProtections.push(
          `existing_issue_${existingIssue.reason}:${task.id}:${existingIssue.issue.state}`
        );

        const action: RoadmapIssuePlan["action"] = shouldSkipExistingIssue(
          issuePlan,
          existingIssue.issue
        )
          ? "skip"
          : "update";

        return {
          ...issuePlan,
          action
        };
      })
    : [];
  const requiresOwnerApproval =
    !structurallyValid ||
    readyTasks.some((task) => taskRequiresOwnerApproval(task));

  return {
    version: ROADMAP_ISSUE_MATERIALIZER_VERSION,
    status: structurallyValid ? "pass" : "fail",
    reasons: baseReasons,
    readyTaskIds,
    blockedTaskIds,
    skippedTaskIds,
    issuePlans,
    duplicateProtections: uniqueSorted(duplicateProtections),
    requiresOwnerApproval,
    dryRun: true
  };
}

function normalizeTasks(
  tasks?: readonly RoadmapTaskLike[] | null
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

function normalizeExistingIssues(
  issues: readonly ExistingRoadmapIssueLike[]
): NormalizedExistingIssue[] {
  return [...issues]
    .map((issue) => {
      const labels = normalizeStringList(issue.labels);
      const state: NormalizedExistingIssue["state"] =
        issue.state === "closed" ? "closed" : "open";

      return {
        title: normalizeWhitespace(issue.title),
        body: normalizeIssueBody(issue.body),
        labels,
        normalizedLabels: labels.map(normalizeComparable).sort(compareStrings),
        taskId: normalizeTaskId(issue.taskId) || null,
        idempotencyKey: normalizeNullableString(issue.idempotencyKey),
        state
      };
    })
    .sort(compareExistingIssues);
}

function buildIssuePlan(task: NormalizedTask): RoadmapIssuePlan {
  const labels = buildIssueLabels(task);
  const idempotencyKey = `vlx-roadmap-task:${task.id}:v1`;

  return {
    taskId: task.id,
    title: `[${task.id}] ${task.title}`,
    body: buildIssueBody(task, idempotencyKey),
    labels,
    idempotencyKey,
    action: "create"
  };
}

function buildIssueLabels(task: NormalizedTask) {
  const labels = [
    "factory",
    "roadmap-task",
    `task:${task.id}`,
    `risk:${task.risk ?? "high"}`
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

function buildIssueBody(task: NormalizedTask, idempotencyKey: string) {
  const dependencies =
    task.dependsOn.length > 0 ? task.dependsOn.join(", ") : "None";
  const ownerApproval = taskRequiresOwnerApproval(task)
    ? "required"
    : "not required";
  const highRiskSafetyNote =
    task.risk === "high"
      ? [
          "",
          "High-risk safety note: This is high-risk roadmap/control-plane work. Owner approval is required before merge or any follow-on automation."
        ]
      : [];

  return [
    `# ${task.id} - ${task.title}`,
    "",
    "## Roadmap Task",
    `- Task ID: ${task.id}`,
    `- Title: ${task.title}`,
    `- Phase: ${task.phase}`,
    `- Risk: ${task.risk ?? "unknown"}`,
    `- Dependencies: ${dependencies}`,
    `- Idempotency key: ${idempotencyKey}`,
    "",
    "## Deliverables",
    ...formatList(task.deliverables),
    "",
    "## Acceptance Criteria",
    ...formatList(task.acceptance),
    "",
    "## Validation",
    ...formatList(task.validation),
    "",
    "## Human Gate",
    `- Human gate: ${task.humanGate ? "required" : "not required"}`,
    `- Owner approval: ${ownerApproval}`,
    "",
    "## Auto-Merge Eligibility",
    `- Roadmap eligibility: ${task.autoMergeEligible ? "true" : "false"}`,
    "- Auto-merge eligibility: disabled in v1",
    "",
    "## Rollback / Safety",
    "- This materializer is dry-run only and creates no real GitHub issues.",
    "- Rollback is to close or ignore the generated issue plan and revert the implementing PR if needed.",
    "- Blocked, verified, in-review, and unknown-status tasks must not be materialized.",
    ...highRiskSafetyNote
  ].join("\n");
}

function formatList(values: readonly string[]) {
  if (values.length === 0) {
    return ["- None"];
  }

  return values.map((value) => `- ${value}`);
}

function taskRequiresOwnerApproval(task: NormalizedTask) {
  return task.risk === "high" || task.humanGate;
}

function findExistingIssue(
  issuePlan: RoadmapIssuePlan,
  existingIssues: readonly NormalizedExistingIssue[]
): ExistingIssueMatch | null {
  const comparableTaskLabel = normalizeComparable(`task:${issuePlan.taskId}`);
  const comparableTitleTaskId = normalizeComparable(`[${issuePlan.taskId}]`);
  const comparableIdempotencyKey = normalizeComparable(
    issuePlan.idempotencyKey
  );

  for (const issue of existingIssues) {
    if (
      issue.taskId &&
      normalizeComparable(issue.taskId) ===
        normalizeComparable(issuePlan.taskId)
    ) {
      return { issue, reason: "task_id" };
    }
  }

  for (const issue of existingIssues) {
    if (
      issue.idempotencyKey &&
      normalizeComparable(issue.idempotencyKey) === comparableIdempotencyKey
    ) {
      return { issue, reason: "idempotency_key" };
    }
  }

  for (const issue of existingIssues) {
    if (issue.normalizedLabels.includes(comparableTaskLabel)) {
      return { issue, reason: "label" };
    }
  }

  for (const issue of existingIssues) {
    if (normalizeComparable(issue.title).startsWith(comparableTitleTaskId)) {
      return { issue, reason: "title" };
    }
  }

  return null;
}

function shouldSkipExistingIssue(
  issuePlan: RoadmapIssuePlan,
  existingIssue: NormalizedExistingIssue
) {
  if (existingIssue.state === "closed") {
    return true;
  }

  return (
    existingIssue.title === issuePlan.title &&
    existingIssue.body === issuePlan.body &&
    comparableStringListsEqual(existingIssue.labels, issuePlan.labels)
  );
}

function findUnresolvedReleaseGateReferences(
  roadmap: RoadmapLike,
  taskById: ReadonlyMap<string, NormalizedTask>
) {
  const reasons: string[] = [];
  const releaseGates = [...(roadmap.release_gates ?? [])].sort((left, right) =>
    compareStrings(
      normalizeNullableString(left.id) ?? "",
      normalizeNullableString(right.id) ?? ""
    )
  );

  for (const releaseGate of releaseGates) {
    const releaseGateId = normalizeNullableString(releaseGate.id) ?? "missing";
    const requiredTaskIds = normalizeTaskIds(releaseGate.required_tasks);

    for (const taskId of requiredTaskIds) {
      if (!taskById.has(taskId)) {
        reasons.push(
          `unresolved_release_gate_task:${releaseGateId}:${taskId}`
        );
      }
    }
  }

  return uniqueSorted(reasons);
}

function findUnresolvedDependencyReferences(
  tasks: readonly NormalizedTask[],
  taskById: ReadonlyMap<string, NormalizedTask>
) {
  const reasons: string[] = [];

  for (const task of tasks) {
    for (const dependencyId of task.dependsOn) {
      if (!taskById.has(dependencyId)) {
        reasons.push(`unresolved_dependency:${task.id}:${dependencyId}`);
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
  return normalizeNullableString(value) ?? "";
}

function normalizeStringList(values?: readonly string[] | null) {
  if (!values) {
    return [];
  }

  return values
    .map((value) => normalizeNullableString(value))
    .filter((value): value is string => value !== null);
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

function normalizeRisk(value?: string | null): RoadmapIssueTaskRisk | null {
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

function isKnownTaskStatus(value: string): value is RoadmapIssueTaskStatus {
  return KNOWN_TASK_STATUSES.includes(value as RoadmapIssueTaskStatus);
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

function compareTasksById(left: NormalizedTask, right: NormalizedTask) {
  return compareStrings(left.id, right.id);
}

function compareExistingIssues(
  left: NormalizedExistingIssue,
  right: NormalizedExistingIssue
) {
  const byState = compareNumbers(
    existingIssueStateWeight(left.state),
    existingIssueStateWeight(right.state)
  );

  if (byState !== 0) {
    return byState;
  }

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

  return compareStrings(left.title, right.title);
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

function compareNumbers(left: number, right: number) {
  return left - right;
}

function existingIssueStateWeight(state: NormalizedExistingIssue["state"]) {
  return state === "open" ? 0 : 1;
}
