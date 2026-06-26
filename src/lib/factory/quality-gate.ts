export const FACTORY_QUALITY_GATE_VERSION = 1 as const;

export type FactoryQualityGateVersion =
  typeof FACTORY_QUALITY_GATE_VERSION;

export type FactoryQualityGateRisk = "low" | "medium" | "high";

export type FactoryQualityGateCheckStatus =
  | "passed"
  | "failed"
  | "missing"
  | "skipped"
  | "unknown";

export type FactoryQualityGateWorkflowStatus =
  | "success"
  | "failure"
  | "cancelled"
  | "skipped"
  | "unknown";

export type FactoryQualityGateCheckName =
  | "typecheck"
  | "lint"
  | "build"
  | "full_test_suite"
  | "targeted_tests"
  | "roadmap_json_parse"
  | "roadmap_structural_check"
  | "owner_approval";

export type FactoryQualityGateTaskSurface =
  | "docs_only"
  | "tests_only"
  | "fixtures_only"
  | "non_behavioral_refactor"
  | "product_ui"
  | "app_server_logic"
  | "auth_session"
  | "database_rls"
  | "account_sync"
  | "entitlement_grant"
  | "usage_ledger"
  | "billing_webhook_refund"
  | "private_asset_download"
  | "ai_provider"
  | "secrets_env"
  | "github_workflows"
  | "codeowners"
  | "agents_policy"
  | "deployment_dns_production_data"
  | "canonical_monetization"
  | "roadmap_release_control_plane"
  | "factory_control_plane";

export type FactoryQualityGateInput = {
  taskId?: string;
  risk?: FactoryQualityGateRisk | (string & {});
  taskSurface?: string | null;
  changedFiles: readonly string[];
  reportedChecks: readonly {
    name: string;
    status: FactoryQualityGateCheckStatus;
    evidence?: string;
  }[];
  reportedWorkflowRuns?: readonly {
    name: string;
    status: FactoryQualityGateWorkflowStatus;
    isNoOp?: boolean;
    evidence?: string;
  }[];
  releaseEvidence?: readonly {
    kind: string;
    name: string;
    status: string;
    evidence?: string;
  }[];
  ownerApproval?: {
    approved: boolean;
    evidence?: string;
  };
};

export type FactoryQualityGateResult = {
  version: FactoryQualityGateVersion;
  status: "pass" | "fail";
  reasons: string[];
  requiredChecks: FactoryQualityGateCheckName[];
  missingChecks: FactoryQualityGateCheckName[];
  failedChecks: FactoryQualityGateCheckName[];
  acceptedEvidence: string[];
  rejectedEvidence: string[];
  requiresOwnerApproval: boolean;
  releaseEvidenceEligible: boolean;
};

type NormalizedCheck = {
  name: string;
  status: FactoryQualityGateCheckStatus;
  evidence: string | null;
};

type NormalizedWorkflowRun = {
  name: string;
  status: FactoryQualityGateWorkflowStatus;
  isNoOp: boolean;
  evidence: string | null;
};

type NormalizedReleaseEvidence = {
  kind: string;
  name: string;
  status: string;
  evidence: string | null;
};

const CANONICAL_CHECK_NAMES: readonly FactoryQualityGateCheckName[] = [
  "typecheck",
  "lint",
  "build",
  "full_test_suite",
  "targeted_tests",
  "roadmap_json_parse",
  "roadmap_structural_check",
  "owner_approval"
];

const MEDIUM_REQUIRED_CHECKS: readonly FactoryQualityGateCheckName[] = [
  "typecheck",
  "lint",
  "build",
  "targeted_tests"
];

const HIGH_REQUIRED_CHECKS: readonly FactoryQualityGateCheckName[] = [
  "typecheck",
  "lint",
  "build",
  "full_test_suite",
  "targeted_tests",
  "owner_approval"
];

const ROADMAP_JSON_PATH =
  "docs/roadmap/vlx-autonomous-factory-roadmap.v1.json";

const TASK_SURFACES: readonly FactoryQualityGateTaskSurface[] = [
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
];

const TASK_SURFACE_ALIASES: Record<string, FactoryQualityGateTaskSurface> = {
  docs: "docs_only",
  documentation: "docs_only",
  tests: "tests_only",
  test: "tests_only",
  fixtures: "fixtures_only",
  fixture: "fixtures_only",
  refactor: "non_behavioral_refactor",
  non_behavioral: "non_behavioral_refactor",
  ui: "product_ui",
  product: "product_ui",
  server_logic: "app_server_logic",
  logic: "app_server_logic",
  factory: "factory_control_plane",
  control_plane: "factory_control_plane"
};

const NO_OP_WORKFLOW_NAMES = new Set([
  "ci_repair",
  "codex_quality_gate",
  "risk_gate",
  "limited_auto_merge"
]);

export function evaluateFactoryQualityGate(
  input: FactoryQualityGateInput
): FactoryQualityGateResult {
  const changedFiles = normalizeChangedFiles(input.changedFiles);
  const risk = normalizeRisk(input.risk);
  const taskSurface = normalizeTaskSurface(input.taskSurface);
  const unknownRisk = risk === null;
  const unknownTaskSurface = taskSurface === null;
  const failClosedAsHigh =
    changedFiles.length === 0 || unknownRisk || unknownTaskSurface;
  const effectiveRisk: FactoryQualityGateRisk = failClosedAsHigh
    ? "high"
    : risk;
  const requiredChecks = getRequiredChecks(
    effectiveRisk,
    taskSurface,
    changedFiles
  );
  const reportedChecks = normalizeReportedChecks(input.reportedChecks);
  const reportedWorkflowRuns = normalizeReportedWorkflowRuns(
    input.reportedWorkflowRuns ?? []
  );
  const releaseEvidence = normalizeReleaseEvidence(
    input.releaseEvidence ?? []
  );
  const requiresOwnerApproval =
    failClosedAsHigh || effectiveRisk === "high";
  const checkSummary = summarizeRequiredChecks(requiredChecks, reportedChecks);
  const ownerSummary = summarizeOwnerApproval(
    requiresOwnerApproval,
    input.ownerApproval
  );
  const acceptedEvidence = uniqueSorted([
    ...acceptedCheckEvidence(reportedChecks),
    ...acceptedWorkflowEvidence(reportedWorkflowRuns),
    ...acceptedReleaseEvidence(releaseEvidence),
    ...ownerSummary.acceptedEvidence
  ]);
  const rejectedEvidence = uniqueSorted([
    ...rejectedCheckEvidence(reportedChecks),
    ...rejectedWorkflowEvidence(reportedWorkflowRuns),
    ...rejectedReleaseEvidence(releaseEvidence),
    ...ownerSummary.rejectedEvidence
  ]);
  const missingChecks = uniqueRequiredCheckOrder([
    ...checkSummary.missingChecks,
    ...ownerSummary.missingChecks
  ]);
  const failedChecks = uniqueRequiredCheckOrder([
    ...checkSummary.failedChecks,
    ...ownerSummary.failedChecks
  ]);
  const reasons = buildReasons({
    changedFiles,
    risk,
    rawRisk: input.risk,
    taskSurface,
    rawTaskSurface: input.taskSurface,
    requiredChecks,
    checkSummary,
    ownerSummary,
    reportedWorkflowRuns,
    releaseEvidence,
    rejectedEvidence
  });
  const status =
    changedFiles.length > 0 &&
    !unknownRisk &&
    !unknownTaskSurface &&
    missingChecks.length === 0 &&
    failedChecks.length === 0
      ? "pass"
      : "fail";

  return {
    version: FACTORY_QUALITY_GATE_VERSION,
    status,
    reasons,
    requiredChecks,
    missingChecks,
    failedChecks,
    acceptedEvidence,
    rejectedEvidence,
    requiresOwnerApproval,
    releaseEvidenceEligible:
      status === "pass" &&
      (!requiresOwnerApproval || ownerSummary.hasApprovalEvidence)
  };
}

function getRequiredChecks(
  risk: FactoryQualityGateRisk,
  taskSurface: FactoryQualityGateTaskSurface | null,
  changedFiles: readonly string[]
): FactoryQualityGateCheckName[] {
  if (risk === "high") {
    return [...HIGH_REQUIRED_CHECKS];
  }

  if (risk === "medium") {
    return [...MEDIUM_REQUIRED_CHECKS];
  }

  if (taskSurface === "docs_only") {
    const requiredChecks: FactoryQualityGateCheckName[] = [];

    if (hasRoadmapJsonChange(changedFiles)) {
      requiredChecks.push("roadmap_json_parse", "roadmap_structural_check");
    } else {
      requiredChecks.push("targeted_tests");
    }

    if (hasTestChange(changedFiles)) {
      requiredChecks.push("targeted_tests");
    }

    return uniqueRequiredCheckOrder(requiredChecks);
  }

  return ["targeted_tests"];
}

function summarizeRequiredChecks(
  requiredChecks: readonly FactoryQualityGateCheckName[],
  reportedChecks: readonly NormalizedCheck[]
) {
  const missingChecks: FactoryQualityGateCheckName[] = [];
  const failedChecks: FactoryQualityGateCheckName[] = [];
  const skippedChecks: FactoryQualityGateCheckName[] = [];
  const unknownStatusChecks: FactoryQualityGateCheckName[] = [];

  for (const requiredCheck of requiredChecks) {
    if (requiredCheck === "owner_approval") {
      continue;
    }

    const matchingChecks = reportedChecks.filter(
      (check) => check.name === requiredCheck
    );
    const hasFailedCheck = matchingChecks.some(
      (check) => check.status === "failed"
    );
    const hasPassedEvidence = matchingChecks.some(
      (check) => check.status === "passed" && check.evidence
    );

    if (
      matchingChecks.some((check) => check.status === "skipped")
    ) {
      skippedChecks.push(requiredCheck);
    }

    if (
      matchingChecks.some((check) => check.status === "unknown")
    ) {
      unknownStatusChecks.push(requiredCheck);
    }

    if (hasFailedCheck) {
      failedChecks.push(requiredCheck);
      continue;
    }

    if (!hasPassedEvidence) {
      missingChecks.push(requiredCheck);
    }
  }

  return {
    missingChecks: uniqueRequiredCheckOrder(missingChecks),
    failedChecks: uniqueRequiredCheckOrder(failedChecks),
    skippedChecks: uniqueRequiredCheckOrder(skippedChecks),
    unknownStatusChecks: uniqueRequiredCheckOrder(unknownStatusChecks)
  };
}

function summarizeOwnerApproval(
  requiresOwnerApproval: boolean,
  ownerApproval: FactoryQualityGateInput["ownerApproval"]
) {
  if (!requiresOwnerApproval) {
    return {
      hasApprovalEvidence: false,
      missingChecks: [] as FactoryQualityGateCheckName[],
      failedChecks: [] as FactoryQualityGateCheckName[],
      acceptedEvidence: [] as string[],
      rejectedEvidence: [] as string[],
      reasons: [] as string[]
    };
  }

  const evidence = normalizeEvidence(ownerApproval?.evidence);

  if (!ownerApproval) {
    return {
      hasApprovalEvidence: false,
      missingChecks: ["owner_approval"] as FactoryQualityGateCheckName[],
      failedChecks: [] as FactoryQualityGateCheckName[],
      acceptedEvidence: [],
      rejectedEvidence: [],
      reasons: ["owner_approval_required", "missing_owner_approval"]
    };
  }

  if (!ownerApproval.approved) {
    return {
      hasApprovalEvidence: false,
      missingChecks: [] as FactoryQualityGateCheckName[],
      failedChecks: ["owner_approval"] as FactoryQualityGateCheckName[],
      acceptedEvidence: [],
      rejectedEvidence: evidence
        ? [`owner_approval:${evidence}:not_approved`]
        : ["owner_approval:missing_evidence:not_approved"],
      reasons: ["owner_approval_required", "owner_approval_not_approved"]
    };
  }

  if (!evidence) {
    return {
      hasApprovalEvidence: false,
      missingChecks: ["owner_approval"] as FactoryQualityGateCheckName[],
      failedChecks: [] as FactoryQualityGateCheckName[],
      acceptedEvidence: [],
      rejectedEvidence: ["owner_approval:missing_evidence"],
      reasons: [
        "owner_approval_required",
        "missing_owner_approval_evidence"
      ]
    };
  }

  return {
    hasApprovalEvidence: true,
    missingChecks: [] as FactoryQualityGateCheckName[],
    failedChecks: [] as FactoryQualityGateCheckName[],
    acceptedEvidence: [`owner_approval:${evidence}`],
    rejectedEvidence: [],
    reasons: ["owner_approval_required"]
  };
}

function acceptedCheckEvidence(reportedChecks: readonly NormalizedCheck[]) {
  return reportedChecks
    .filter(
      (check) =>
        isFactoryQualityGateCheckName(check.name) &&
        !isNoOpEvidenceName(check.name) &&
        check.status === "passed" &&
        check.evidence
    )
    .map((check) => `check:${check.name}:${check.evidence}`);
}

function rejectedCheckEvidence(reportedChecks: readonly NormalizedCheck[]) {
  const rejectedEvidence: string[] = [];

  for (const check of reportedChecks) {
    if (isNoOpEvidenceName(check.name)) {
      rejectedEvidence.push(`check:${check.name}:no_op_placeholder`);
      continue;
    }

    if (!isFactoryQualityGateCheckName(check.name)) {
      rejectedEvidence.push(`check:${check.name}:unknown_check`);
      continue;
    }

    if (check.status === "passed" && !check.evidence) {
      rejectedEvidence.push(`check:${check.name}:missing_evidence`);
    }

    if (check.status === "skipped") {
      rejectedEvidence.push(`check:${check.name}:skipped`);
    }

    if (check.status === "unknown") {
      rejectedEvidence.push(`check:${check.name}:unknown_status`);
    }

    if (check.status === "missing") {
      rejectedEvidence.push(`check:${check.name}:reported_missing`);
    }
  }

  return rejectedEvidence;
}

function acceptedWorkflowEvidence(
  reportedWorkflowRuns: readonly NormalizedWorkflowRun[]
) {
  return reportedWorkflowRuns
    .filter(
      (workflowRun) =>
        !workflowRun.isNoOp &&
        !isNoOpEvidenceName(workflowRun.name) &&
        workflowRun.status === "success" &&
        workflowRun.evidence
    )
    .map(
      (workflowRun) =>
        `workflow:${workflowRun.name}:${workflowRun.evidence}`
    );
}

function rejectedWorkflowEvidence(
  reportedWorkflowRuns: readonly NormalizedWorkflowRun[]
) {
  return reportedWorkflowRuns
    .filter(
      (workflowRun) =>
        workflowRun.isNoOp || isNoOpEvidenceName(workflowRun.name)
    )
    .map((workflowRun) => `workflow:${workflowRun.name}:no_op`);
}

function acceptedReleaseEvidence(
  releaseEvidence: readonly NormalizedReleaseEvidence[]
) {
  return releaseEvidence
    .filter(
      (evidence) =>
        !isNoOpEvidenceName(evidence.name) &&
        isPassingReleaseStatus(evidence.status) &&
        evidence.evidence
    )
    .map(
      (evidence) =>
        `release:${evidence.kind}:${evidence.name}:${evidence.evidence}`
    );
}

function rejectedReleaseEvidence(
  releaseEvidence: readonly NormalizedReleaseEvidence[]
) {
  const rejectedEvidence: string[] = [];

  for (const evidence of releaseEvidence) {
    if (isNoOpEvidenceName(evidence.name)) {
      rejectedEvidence.push(`release:${evidence.kind}:${evidence.name}:no_op`);
      continue;
    }

    if (isPassingReleaseStatus(evidence.status) && !evidence.evidence) {
      rejectedEvidence.push(
        `release:${evidence.kind}:${evidence.name}:missing_evidence`
      );
    }
  }

  return rejectedEvidence;
}

function buildReasons({
  changedFiles,
  risk,
  rawRisk,
  taskSurface,
  rawTaskSurface,
  requiredChecks,
  checkSummary,
  ownerSummary,
  reportedWorkflowRuns,
  releaseEvidence,
  rejectedEvidence
}: {
  changedFiles: readonly string[];
  risk: FactoryQualityGateRisk | null;
  rawRisk: FactoryQualityGateInput["risk"];
  taskSurface: FactoryQualityGateTaskSurface | null;
  rawTaskSurface: FactoryQualityGateInput["taskSurface"];
  requiredChecks: readonly FactoryQualityGateCheckName[];
  checkSummary: ReturnType<typeof summarizeRequiredChecks>;
  ownerSummary: ReturnType<typeof summarizeOwnerApproval>;
  reportedWorkflowRuns: readonly NormalizedWorkflowRun[];
  releaseEvidence: readonly NormalizedReleaseEvidence[];
  rejectedEvidence: readonly string[];
}) {
  const reasons: string[] = [];

  if (changedFiles.length === 0) {
    reasons.push("empty_change_set");
  }

  if (risk) {
    reasons.push(`risk:${risk}`);
  } else {
    reasons.push(`unknown_risk:${normalizeReasonValue(rawRisk ?? "missing")}`);
  }

  if (taskSurface) {
    reasons.push(`task_surface:${taskSurface}`);
  } else {
    reasons.push(
      `unknown_task_surface:${normalizeReasonValue(
        rawTaskSurface ?? "missing"
      )}`
    );
  }

  reasons.push(`required_checks:${requiredChecks.join(",")}`);

  for (const workflowRun of reportedWorkflowRuns) {
    if (workflowRun.isNoOp || isNoOpEvidenceName(workflowRun.name)) {
      reasons.push(`rejected_no_op_workflow:${workflowRun.name}`);
    }
  }

  for (const evidence of releaseEvidence) {
    if (isNoOpEvidenceName(evidence.name)) {
      reasons.push(`rejected_no_op_release_evidence:${evidence.name}`);
    }
  }

  for (const rejected of rejectedEvidence) {
    if (rejected.includes(":missing_evidence")) {
      reasons.push(`rejected_missing_evidence:${rejected}`);
    }
  }

  for (const check of checkSummary.skippedChecks) {
    reasons.push(`skipped_required_check:${check}`);
  }

  for (const check of checkSummary.unknownStatusChecks) {
    reasons.push(`unknown_required_check_status:${check}`);
  }

  for (const check of checkSummary.failedChecks) {
    reasons.push(`failed_required_check:${check}`);
  }

  for (const check of checkSummary.missingChecks) {
    reasons.push(`missing_required_check:${check}`);
  }

  reasons.push(...ownerSummary.reasons);
  reasons.push("auto_merge_out_of_scope_v1");

  return uniquePreserveOrder(reasons);
}

function normalizeReportedChecks(
  reportedChecks: FactoryQualityGateInput["reportedChecks"]
): NormalizedCheck[] {
  return [...(reportedChecks ?? [])]
    .map((check) => ({
      name: normalizeIdentifier(check.name),
      status: check.status,
      evidence: normalizeEvidence(check.evidence)
    }))
    .sort(compareNamedStatusEvidence);
}

function normalizeReportedWorkflowRuns(
  reportedWorkflowRuns: NonNullable<
    FactoryQualityGateInput["reportedWorkflowRuns"]
  >
): NormalizedWorkflowRun[] {
  return [...reportedWorkflowRuns]
    .map((workflowRun) => ({
      name: normalizeIdentifier(workflowRun.name),
      status: workflowRun.status,
      isNoOp: workflowRun.isNoOp === true,
      evidence: normalizeEvidence(workflowRun.evidence)
    }))
    .sort(compareNamedStatusEvidence);
}

function normalizeReleaseEvidence(
  releaseEvidence: NonNullable<FactoryQualityGateInput["releaseEvidence"]>
): NormalizedReleaseEvidence[] {
  return [...releaseEvidence]
    .map((evidence) => ({
      kind: normalizeIdentifier(evidence.kind),
      name: normalizeIdentifier(evidence.name),
      status: normalizeIdentifier(evidence.status),
      evidence: normalizeEvidence(evidence.evidence)
    }))
    .sort((left, right) => {
      const byKind = compareStrings(left.kind, right.kind);

      if (byKind !== 0) {
        return byKind;
      }

      return compareNamedStatusEvidence(left, right);
    });
}

function normalizeRisk(
  risk: FactoryQualityGateInput["risk"]
): FactoryQualityGateRisk | null {
  if (!risk) {
    return null;
  }

  const normalized = normalizeIdentifier(risk);

  if (
    normalized === "low" ||
    normalized === "medium" ||
    normalized === "high"
  ) {
    return normalized;
  }

  return null;
}

function normalizeTaskSurface(
  taskSurface?: string | null
): FactoryQualityGateTaskSurface | null {
  if (!taskSurface) {
    return null;
  }

  const normalized = normalizeIdentifier(taskSurface);

  if (isFactoryQualityGateTaskSurface(normalized)) {
    return normalized;
  }

  return TASK_SURFACE_ALIASES[normalized] ?? null;
}

function normalizeChangedFiles(changedFiles: readonly string[]) {
  return [...new Set((changedFiles ?? []).map(normalizeChangedFile))]
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

function normalizeEvidence(evidence?: string) {
  const normalized = evidence?.trim().replace(/\s+/g, " ") ?? "";

  return normalized.length > 0 ? normalized : null;
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeReasonValue(value: string) {
  return normalizeIdentifier(value || "missing");
}

function hasRoadmapJsonChange(changedFiles: readonly string[]) {
  return changedFiles.some(
    (path) =>
      path === ROADMAP_JSON_PATH ||
      (path.startsWith("docs/roadmap/") && path.endsWith(".json"))
  );
}

function hasTestChange(changedFiles: readonly string[]) {
  return changedFiles.some(
    (path) =>
      path.startsWith("tests/") ||
      path.endsWith(".spec.ts") ||
      path.endsWith(".spec.tsx") ||
      path.endsWith(".test.ts") ||
      path.endsWith(".test.tsx")
  );
}

function isFactoryQualityGateCheckName(
  value: string
): value is FactoryQualityGateCheckName {
  return CANONICAL_CHECK_NAMES.includes(value as FactoryQualityGateCheckName);
}

function isFactoryQualityGateTaskSurface(
  value: string
): value is FactoryQualityGateTaskSurface {
  return TASK_SURFACES.includes(value as FactoryQualityGateTaskSurface);
}

function isNoOpEvidenceName(name: string) {
  return NO_OP_WORKFLOW_NAMES.has(name);
}

function isPassingReleaseStatus(status: string) {
  return status === "passed" || status === "success";
}

function uniqueRequiredCheckOrder(
  checks: readonly FactoryQualityGateCheckName[]
) {
  const checkSet = new Set(checks);

  return CANONICAL_CHECK_NAMES.filter((check) => checkSet.has(check));
}

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values)].sort(compareStrings);
}

function uniquePreserveOrder(values: readonly string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function compareNamedStatusEvidence<
  T extends { name: string; status: string; evidence: string | null }
>(left: T, right: T) {
  const byName = compareStrings(left.name, right.name);

  if (byName !== 0) {
    return byName;
  }

  const byStatus = compareStrings(left.status, right.status);

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
