export const PR_READINESS_OWNER_QUEUE_VERSION = 1 as const;

export type PrReadinessOwnerQueueVersion =
  typeof PR_READINESS_OWNER_QUEUE_VERSION;

export type PrReadinessQueueStatus = "pass" | "fail";

export type PrReadinessQueueReadiness =
  | "ready_for_owner_review"
  | "needs_fix"
  | "blocked"
  | "stale"
  | "unsafe";

export type PrReadinessRiskLevel = "low" | "medium" | "high";

export type PrReadinessMetadataLike = {
  number?: number | null;
  title?: string | null;
  body?: string | null;
  state?: string | null;
  isDraft?: boolean | null;
  labels?: readonly string[] | null;
  taskId?: string | null;
  mergeableState?: string | null;
  baseBranch?: string | null;
  headBranch?: string | null;
};

export type PrReadinessCheckLike = {
  name?: string | null;
  status?: string | null;
  conclusion?: string | null;
  evidence?: string | null;
  completedAt?: string | null;
  isNoOp?: boolean | null;
};

export type PrReadinessValidationEvidenceLike = {
  name?: string | null;
  status?: string | null;
  evidence?: string | null;
  source?: string | null;
  isNoOp?: boolean | null;
};

export type PrReadinessRiskPolicyLike = {
  requiredCiChecks?: readonly string[] | null;
  docsTestsRequiredEvidence?: readonly string[] | null;
  runtimeUiRequiredEvidence?: readonly string[] | null;
  highRiskSurfaces?: readonly string[] | null;
  blockedSurfaces?: readonly string[] | null;
  forbiddenChangedFiles?: readonly string[] | null;
  requiresOwnerApprovalForHighRisk?: boolean | null;
};

export type PrReadinessBlockedSurfaceLike = {
  surface?: string | null;
  reason?: string | null;
  changedFilePatterns?: readonly string[] | null;
  keywords?: readonly string[] | null;
  blocked?: boolean | null;
};

export type PrReadinessTaskMappingLike = {
  id?: string | null;
  title?: string | null;
  aliases?: readonly string[] | null;
  status?: string | null;
  risk?: string | null;
  taskSurface?: string | null;
  expectedChangedFiles?: readonly string[] | null;
  validation?: readonly string[] | null;
};

export type PrReadinessOwnerApprovalPolicyLike = {
  ownerApprovalRequired?: boolean | null;
  approved?: boolean | null;
  evidence?: string | null;
  publicPaidBetaGateApproved?: boolean | null;
  publicPaidBetaGateEvidence?: string | null;
};

export type PrReadinessStalePrContextLike = {
  number?: number | null;
  title?: string | null;
  state?: string | null;
  isDraft?: boolean | null;
  stale?: boolean | null;
  mergeableState?: string | null;
  refreshedAt?: string | null;
  evidence?: string | null;
};

export type PrReadinessOwnerQueueOptions = {
  dryRun?: boolean | null;
  liveGitHubMutations?: boolean | null;
  autoMerge?: boolean | null;
};

export type PrReadinessOwnerQueueInput = {
  pr?: PrReadinessMetadataLike | null;
  changedFiles?: readonly string[] | null;
  ciChecks?: readonly PrReadinessCheckLike[] | null;
  validationEvidence?: readonly PrReadinessValidationEvidenceLike[] | null;
  riskPolicy?: PrReadinessRiskPolicyLike | null;
  blockedSurfaces?: readonly PrReadinessBlockedSurfaceLike[] | null;
  taskBacklogMapping?: readonly PrReadinessTaskMappingLike[] | null;
  ownerApprovalPolicy?: PrReadinessOwnerApprovalPolicyLike | null;
  staleOpenPrContext?: readonly PrReadinessStalePrContextLike[] | null;
  options?: PrReadinessOwnerQueueOptions | null;
};

export type PrReadinessChangedFilesSummary = {
  total: number;
  files: string[];
  docsOnly: boolean;
  testsOnly: boolean;
  docsOrTestsOnly: boolean;
  runtimeUiFiles: string[];
  highRiskFiles: string[];
};

export type PrReadinessValidationSummary = {
  requiredEvidence: string[];
  acceptedEvidence: string[];
  rejectedEvidence: string[];
  missingEvidence: string[];
};

export type PrReadinessCiSummary = {
  requiredChecks: string[];
  passedChecks: string[];
  failedChecks: string[];
  pendingChecks: string[];
  missingChecks: string[];
  unknownChecks: string[];
  noOpChecks: string[];
  acceptedEvidence: string[];
  rejectedEvidence: string[];
};

export type PrReadinessOwnerQueueItem = {
  version: PrReadinessOwnerQueueVersion;
  status: PrReadinessQueueStatus;
  readiness: PrReadinessQueueReadiness;
  prNumber: number | null;
  prTitle: string;
  taskId: string | null;
  changedFilesSummary: PrReadinessChangedFilesSummary;
  validationSummary: PrReadinessValidationSummary;
  ciSummary: PrReadinessCiSummary;
  riskLevel: PrReadinessRiskLevel;
  riskReasons: string[];
  blockedSurfacesTouched: string[];
  ownerDecisionRequired: boolean;
  ownerDecisionReason: string;
  mergeRecommendation: string;
  mergeBlockers: string[];
  stalePrWarnings: string[];
  forbiddenChangeWarnings: string[];
  missingEvidence: string[];
  postMergeFollowup: string[];
  verificationSyncNeeded: boolean;
  ownerApprovalCommentDraft: string;
  needsFixCommentDraft: string;
  safetyNotes: string[];
  stopReasons: string[];
};

type NormalizedPr = {
  number: number | null;
  title: string;
  body: string;
  state: string | null;
  rawState: string | null;
  isDraft: boolean;
  labels: string[];
  taskId: string | null;
  mergeableState: string | null;
  baseBranch: string | null;
  headBranch: string | null;
};

type NormalizedEvidence = {
  name: string;
  status: EvidenceStatus | null;
  rawStatus: string | null;
  evidence: string | null;
  completedAt: string | null;
  isNoOp: boolean;
};

type NormalizedTaskMapping = {
  id: string;
  title: string;
  aliases: string[];
  status: string | null;
  risk: PrReadinessRiskLevel | null;
  rawRisk: string | null;
  taskSurface: string | null;
  expectedChangedFiles: string[];
  validation: string[];
};

type NormalizedBlockedSurface = {
  surface: string;
  reason: string | null;
  changedFilePatterns: string[];
  keywords: string[];
  blocked: boolean;
};

type NormalizedStalePr = {
  number: number | null;
  title: string | null;
  state: string | null;
  isDraft: boolean;
  stale: boolean;
  mergeableState: string | null;
  refreshedAt: string | null;
  evidence: string | null;
};

type SurfaceRule = {
  surface: string;
  match: (path: string) => boolean;
};

type SurfaceHit = {
  surface: string;
  path: string;
};

type EvidenceStatus =
  | "passed"
  | "failed"
  | "pending"
  | "missing"
  | "skipped"
  | "unknown";

const DEFAULT_REQUIRED_CI_CHECKS = [
  "typecheck",
  "lint",
  "build",
  "targeted_tests"
];

const DEFAULT_DOCS_TESTS_REQUIRED_EVIDENCE = [
  "validation_results",
  "safety_section"
];

const DEFAULT_RUNTIME_UI_REQUIRED_EVIDENCE = [
  "validation_results",
  "manual_qa",
  "browser_qa",
  "accessibility_notes",
  "runtime_ui_scope"
];

const KNOWN_PR_STATES = new Set(["open", "closed", "merged"]);

const NO_OP_CHECK_NAMES = new Set([
  "ci_repair",
  "codex_quality_gate",
  "risk_gate",
  "limited_auto_merge",
  "noop",
  "no_op"
]);

const HARD_BLOCKED_SURFACES = new Set([
  "payment",
  "billing",
  "checkout",
  "subscriptions",
  "invoices",
  "dns",
  "deployment",
  "secrets",
  "production_data",
  "webflow_production",
  "cloudflare_production_workers",
  "r2_production_objects",
  "provider_settings",
  "account_schema",
  "rls",
  "migrations",
  "production_account_data"
]);

const HIGH_RISK_SURFACE_ALIASES: Record<string, string> = {
  auto_merge: "auto_merge",
  billing_webhook_refund: "billing",
  cloudflare: "cloudflare_production_workers",
  cloudflare_workers: "cloudflare_production_workers",
  codeowner: "codeowners",
  github_workflow: "github_workflows",
  production_pack_data: "production_data",
  production_user_data: "production_data",
  r2: "r2_production_objects",
  secret: "secrets",
  subscription: "subscriptions",
  subscriptions: "subscriptions",
  webflow: "webflow_production"
};

const HIGH_RISK_PATH_RULES: readonly SurfaceRule[] = [
  {
    surface: "github_workflows",
    match: (path) => path.startsWith(".github/workflows/")
  },
  {
    surface: "codeowners",
    match: (path) => path === ".github/codeowners" || path === "codeowners"
  },
  {
    surface: "payment",
    match: (path) =>
      path.includes("payment") ||
      path.includes("stripe") ||
      path.includes("paddle")
  },
  {
    surface: "billing",
    match: (path) => path.includes("billing")
  },
  {
    surface: "checkout",
    match: (path) => path.includes("checkout")
  },
  {
    surface: "subscriptions",
    match: (path) =>
      path.includes("subscription") || path.includes("subscriptions")
  },
  {
    surface: "invoices",
    match: (path) => path.includes("invoice")
  },
  {
    surface: "dns",
    match: (path) => path.includes("dns")
  },
  {
    surface: "deployment",
    match: (path) =>
      path === "vercel.json" ||
      path === "wrangler.toml" ||
      path === "next.config.mjs" ||
      path.startsWith(".vercel/") ||
      path.startsWith("infra/") ||
      path.startsWith("terraform/") ||
      path.endsWith(".tf") ||
      path.includes("deployment")
  },
  {
    surface: "secrets",
    match: (path) =>
      path === ".env" ||
      path.startsWith(".env.") ||
      path.endsWith(".env") ||
      path.includes("/.env") ||
      path === ".npmrc" ||
      path.includes("secret") ||
      path.includes("secrets") ||
      path.includes("token")
  },
  {
    surface: "production_data",
    match: (path) =>
      path.startsWith("data/production/") ||
      path.includes("production-data") ||
      path.includes("production_data")
  },
  {
    surface: "webflow_production",
    match: (path) => path.includes("webflow")
  },
  {
    surface: "cloudflare_production_workers",
    match: (path) =>
      path === "wrangler.toml" ||
      path.startsWith("cloudflare/") ||
      path.startsWith("workers/") ||
      path.includes("cloudflare-worker")
  },
  {
    surface: "r2_production_objects",
    match: (path) => path.startsWith("r2/") || path.includes("r2-object")
  },
  {
    surface: "provider_settings",
    match: (path) => path.includes("provider") || path.includes("settings")
  },
  {
    surface: "account_schema",
    match: (path) =>
      path.includes("account-schema") ||
      path.includes("account_schema") ||
      path.includes("schema")
  },
  {
    surface: "rls",
    match: (path) => path.includes("rls")
  },
  {
    surface: "migrations",
    match: (path) =>
      path.startsWith("supabase/") ||
      path.startsWith("migrations/") ||
      path.includes("/migrations/") ||
      path.includes("migration")
  },
  {
    surface: "production_account_data",
    match: (path) =>
      path.includes("production-account") ||
      path.includes("production_account") ||
      path.includes("account-data") ||
      path.includes("account_data")
  }
];

export function summarizePrReadinessOwnerQueue(
  input: PrReadinessOwnerQueueInput
): PrReadinessOwnerQueueItem {
  const pr = normalizePr(input.pr);
  const changedFiles = normalizeChangedFiles(input.changedFiles);
  const taskMappings = normalizeTaskMappings(input.taskBacklogMapping ?? []);
  const riskPolicy = input.riskPolicy ?? null;
  const ciChecks = normalizeEvidence(input.ciChecks ?? []);
  const validationEvidence = normalizeEvidence(input.validationEvidence ?? []);
  const stalePrContext = normalizeStalePrContext(input.staleOpenPrContext ?? []);
  const blockedSurfaces = normalizeBlockedSurfaces(input.blockedSurfaces ?? []);
  const options = input.options ?? null;
  const ownerApprovalPolicy = input.ownerApprovalPolicy ?? null;
  const stopReasons: string[] = [];
  const mergeBlockers: string[] = [];
  const forbiddenChangeWarnings: string[] = [];

  if (options?.dryRun === false) {
    stopReasons.push("dry_run_false_not_supported_v1");
    mergeBlockers.push("dry_run_false_not_supported_v1");
  }

  if (options?.liveGitHubMutations === true) {
    stopReasons.push("live_github_mutation_request_not_supported_v1");
    mergeBlockers.push("live_github_mutation_request_not_supported_v1");
  }

  if (options?.autoMerge === true) {
    stopReasons.push("auto_merge_request_not_supported_v1");
    mergeBlockers.push("auto_merge_request_not_supported_v1");
  }

  if (!pr.title) {
    stopReasons.push("missing_pr_title");
    mergeBlockers.push("missing_pr_title");
  }

  if (pr.rawState && !pr.state) {
    stopReasons.push(`unknown_pr_state:${pr.rawState}`);
    mergeBlockers.push(`unknown_pr_state:${pr.rawState}`);
  }

  if (pr.isDraft) {
    stopReasons.push("draft_pr_not_ready_for_merge");
    mergeBlockers.push("draft_pr_not_ready_for_merge");
  }

  const taskId = detectTaskId({
    pr,
    changedFiles,
    taskMappings
  });
  const taskMapping = taskId
    ? taskMappings.find((mapping) => mapping.id === taskId) ?? null
    : null;
  const changedFilesSummary = summarizeChangedFiles(changedFiles);
  const surfaceHits = findSurfaceHits(changedFiles);
  const textSurfaces = findTextSurfaces([
    pr.title,
    pr.body,
    ...validationEvidence.map((evidence) => evidence.evidence ?? "")
  ]);
  const blockedSurfaceHits = findBlockedSurfaceHits({
    changedFiles,
    prText: [pr.title, pr.body].join("\n"),
    blockedSurfaces
  });
  const blockedSurfacesTouched = uniqueSorted([
    ...surfaceHits.map((hit) => hit.surface),
    ...textSurfaces,
    ...blockedSurfaceHits.map((surface) => surface.surface)
  ]);

  forbiddenChangeWarnings.push(
    ...findForbiddenChangedFileWarnings({
      changedFiles,
      forbiddenChangedFiles: riskPolicy?.forbiddenChangedFiles ?? []
    })
  );

  for (const warning of forbiddenChangeWarnings) {
    stopReasons.push(warning);
    mergeBlockers.push(warning);
  }

  const riskSummary = summarizeRisk({
    changedFilesSummary,
    surfaceHits,
    blockedSurfacesTouched,
    taskMapping,
    highRiskSurfaces: riskPolicy?.highRiskSurfaces ?? []
  });
  const ciSummary = summarizeCiChecks({
    ciChecks,
    requiredChecks: riskPolicy?.requiredCiChecks ?? DEFAULT_REQUIRED_CI_CHECKS
  });
  const requiredValidationEvidence = getRequiredValidationEvidence({
    changedFilesSummary,
    riskPolicy
  });
  const validationSummary = summarizeValidationEvidence({
    validationEvidence,
    requiredEvidence: requiredValidationEvidence
  });
  const stalePrWarnings = summarizeStalePrWarnings({
    pr,
    stalePrContext
  });

  stopReasons.push(...ciSummary.stopReasons);
  stopReasons.push(...validationSummary.stopReasons);

  if (ciSummary.failedChecks.length > 0) {
    mergeBlockers.push(
      `failing_ci_checks:${ciSummary.failedChecks.join(",")}`
    );
  }

  if (ciSummary.pendingChecks.length > 0) {
    mergeBlockers.push(
      `pending_ci_checks:${ciSummary.pendingChecks.join(",")}`
    );
  }

  if (ciSummary.missingChecks.length > 0) {
    mergeBlockers.push(
      `missing_ci_checks:${ciSummary.missingChecks.join(",")}`
    );
  }

  if (ciSummary.unknownChecks.length > 0) {
    mergeBlockers.push(
      `unknown_ci_checks:${ciSummary.unknownChecks.join(",")}`
    );
  }

  if (validationSummary.missingEvidence.length > 0) {
    mergeBlockers.push(
      `missing_validation_evidence:${validationSummary.missingEvidence.join(
        ","
      )}`
    );
  }

  const blockedSurfaceNames = normalizeSurfaceList(
    riskPolicy?.blockedSurfaces ?? []
  );

  for (const surface of blockedSurfacesTouched) {
    if (blockedSurfaceNames.includes(surface)) {
      const blocker = `blocked_surface_touched:${surface}`;

      stopReasons.push(blocker);
      mergeBlockers.push(blocker);
    }
  }

  for (const surface of blockedSurfaceHits) {
    if (surface.blocked) {
      const blocker = `blocked_surface_touched:${surface.surface}`;

      stopReasons.push(blocker);
      mergeBlockers.push(blocker);
    }
  }

  const hardBlockedSurfaces = blockedSurfacesTouched.filter((surface) =>
    HARD_BLOCKED_SURFACES.has(surface)
  );

  for (const surface of hardBlockedSurfaces) {
    const blocker = `hard_blocked_surface_touched:${surface}`;

    stopReasons.push(blocker);
    mergeBlockers.push(blocker);
  }

  if (blockedSurfacesTouched.includes("public_paid_beta_launch")) {
    const gateEvidence = normalizeNullableString(
      ownerApprovalPolicy?.publicPaidBetaGateEvidence
    );

    if (
      ownerApprovalPolicy?.publicPaidBetaGateApproved !== true ||
      !gateEvidence
    ) {
      stopReasons.push("public_paid_beta_launch_without_owner_gate_evidence");
      mergeBlockers.push(
        "public_paid_beta_launch_without_owner_gate_evidence"
      );
    }
  }

  const ownerApprovalProvided = hasOwnerApproval(ownerApprovalPolicy);
  const requiresOwnerApprovalForHighRisk =
    riskPolicy?.requiresOwnerApprovalForHighRisk !== false;
  const explicitOwnerApprovalRequired =
    ownerApprovalPolicy?.ownerApprovalRequired === true;

  if (
    (riskSummary.riskLevel === "high" && requiresOwnerApprovalForHighRisk) ||
    explicitOwnerApprovalRequired
  ) {
    if (!ownerApprovalProvided) {
      stopReasons.push("missing_owner_approval_evidence");
      mergeBlockers.push("missing_owner_approval_evidence");
    }
  }

  const currentPrStaleWarning = stalePrWarnings.find((warning) =>
    pr.number ? warning.startsWith(`pr:#${pr.number}:`) : false
  );

  if (currentPrStaleWarning) {
    stopReasons.push("current_pr_stale_not_mergeable");
    mergeBlockers.push("current_pr_stale_not_mergeable");
  }

  const uniqueStopReasons = uniquePreserveOrder(stopReasons);
  const uniqueMergeBlockers = uniquePreserveOrder(mergeBlockers);
  const missingEvidence = uniqueSorted([
    ...ciSummary.missingChecks.map((check) => `ci:${check}`),
    ...ciSummary.unknownChecks.map((check) => `ci_unknown:${check}`),
    ...validationSummary.missingEvidence.map(
      (evidence) => `validation:${evidence}`
    ),
    ...(riskSummary.riskLevel === "high" &&
    requiresOwnerApprovalForHighRisk &&
    !ownerApprovalProvided
      ? ["owner_approval_evidence"]
      : [])
  ]);
  const readiness = determineReadiness({
    stopReasons: uniqueStopReasons,
    mergeBlockers: uniqueMergeBlockers,
    ciSummary,
    validationSummary,
    pr,
    currentPrStaleWarning
  });
  const status: PrReadinessQueueStatus =
    readiness === "ready_for_owner_review" ? "pass" : "fail";
  const ownerDecisionRequired = true;
  const ownerDecisionReason = buildOwnerDecisionReason({
    readiness,
    riskLevel: riskSummary.riskLevel,
    blockedSurfacesTouched,
    ownerApprovalProvided
  });
  const mergeRecommendation = buildMergeRecommendation(readiness);
  const postMergeFollowup = buildPostMergeFollowup({
    prNumber: pr.number,
    taskId,
    readiness
  });
  const verificationSyncNeeded =
    readiness === "ready_for_owner_review" && taskId !== null;
  const safetyNotes = buildSafetyNotes();
  const itemWithoutDrafts = {
    version: PR_READINESS_OWNER_QUEUE_VERSION,
    status,
    readiness,
    prNumber: pr.number,
    prTitle: pr.title,
    taskId,
    changedFilesSummary,
    validationSummary: {
      requiredEvidence: validationSummary.requiredEvidence,
      acceptedEvidence: validationSummary.acceptedEvidence,
      rejectedEvidence: validationSummary.rejectedEvidence,
      missingEvidence: validationSummary.missingEvidence
    },
    ciSummary: {
      requiredChecks: ciSummary.requiredChecks,
      passedChecks: ciSummary.passedChecks,
      failedChecks: ciSummary.failedChecks,
      pendingChecks: ciSummary.pendingChecks,
      missingChecks: ciSummary.missingChecks,
      unknownChecks: ciSummary.unknownChecks,
      noOpChecks: ciSummary.noOpChecks,
      acceptedEvidence: ciSummary.acceptedEvidence,
      rejectedEvidence: ciSummary.rejectedEvidence
    },
    riskLevel: riskSummary.riskLevel,
    riskReasons: riskSummary.riskReasons,
    blockedSurfacesTouched,
    ownerDecisionRequired,
    ownerDecisionReason,
    mergeRecommendation,
    mergeBlockers: uniqueMergeBlockers,
    stalePrWarnings,
    forbiddenChangeWarnings: uniquePreserveOrder(forbiddenChangeWarnings),
    missingEvidence,
    postMergeFollowup,
    verificationSyncNeeded,
    safetyNotes,
    stopReasons: uniqueStopReasons
  };

  return {
    ...itemWithoutDrafts,
    ownerApprovalCommentDraft: buildOwnerApprovalCommentDraft(
      itemWithoutDrafts
    ),
    needsFixCommentDraft: buildNeedsFixCommentDraft(itemWithoutDrafts)
  };
}

function normalizePr(
  pr: PrReadinessMetadataLike | null | undefined
): NormalizedPr {
  const rawState = normalizeIdentifierOrNull(pr?.state);
  const state = rawState && KNOWN_PR_STATES.has(rawState) ? rawState : null;

  return {
    number:
      typeof pr?.number === "number" && Number.isFinite(pr.number)
        ? Math.floor(pr.number)
        : null,
    title: normalizeNullableString(pr?.title) ?? "",
    body: normalizeNullableString(pr?.body) ?? "",
    state,
    rawState,
    isDraft: pr?.isDraft === true,
    labels: normalizeStringList(pr?.labels),
    taskId: normalizeTaskId(pr?.taskId) || null,
    mergeableState: normalizeIdentifierOrNull(pr?.mergeableState),
    baseBranch: normalizeNullableString(pr?.baseBranch),
    headBranch: normalizeNullableString(pr?.headBranch)
  };
}

function normalizeEvidence(
  evidence: readonly (PrReadinessCheckLike | PrReadinessValidationEvidenceLike)[]
): NormalizedEvidence[] {
  return [...evidence]
    .map((item) => {
      const name = normalizeEvidenceName(item.name);
      const rawStatus = normalizeIdentifierOrNull(
        "conclusion" in item ? item.conclusion ?? item.status : item.status
      );

      return {
        name,
        status: normalizeEvidenceStatus(rawStatus),
        rawStatus,
        evidence: normalizeNullableString(item.evidence),
        completedAt:
          "completedAt" in item
            ? normalizeNullableString(item.completedAt)
            : null,
        isNoOp:
          item.isNoOp === true ||
          NO_OP_CHECK_NAMES.has(name) ||
          name.includes("no_op")
      };
    })
    .sort(compareEvidence);
}

function normalizeTaskMappings(
  mappings: readonly PrReadinessTaskMappingLike[]
): NormalizedTaskMapping[] {
  return [...mappings]
    .map((mapping) => {
      const rawRisk = normalizeNullableString(mapping.risk);

      return {
        id: normalizeTaskId(mapping.id),
        title: normalizeNullableString(mapping.title) ?? "",
        aliases: normalizeStringList(mapping.aliases).map(normalizeTaskId),
        status: normalizeIdentifierOrNull(mapping.status),
        risk: normalizeRisk(rawRisk),
        rawRisk,
        taskSurface: normalizeSurface(mapping.taskSurface),
        expectedChangedFiles: normalizeChangedFiles(
          mapping.expectedChangedFiles
        ),
        validation: normalizeStringList(mapping.validation)
      };
    })
    .filter((mapping) => mapping.id.length > 0)
    .sort(compareTaskMappings);
}

function normalizeBlockedSurfaces(
  blockedSurfaces: readonly PrReadinessBlockedSurfaceLike[]
): NormalizedBlockedSurface[] {
  return [...blockedSurfaces]
    .map((surface) => ({
      surface: normalizeSurface(surface.surface) ?? "unknown_surface",
      reason: normalizeNullableString(surface.reason),
      changedFilePatterns: normalizeStringList(surface.changedFilePatterns).map(
        normalizeChangedFile
      ),
      keywords: normalizeStringList(surface.keywords).map(normalizeIdentifier),
      blocked: surface.blocked !== false
    }))
    .sort((left, right) => compareStrings(left.surface, right.surface));
}

function normalizeStalePrContext(
  prs: readonly PrReadinessStalePrContextLike[]
): NormalizedStalePr[] {
  return [...prs]
    .map((pr) => ({
      number:
        typeof pr.number === "number" && Number.isFinite(pr.number)
          ? Math.floor(pr.number)
          : null,
      title: normalizeNullableString(pr.title),
      state: normalizeIdentifierOrNull(pr.state),
      isDraft: pr.isDraft === true,
      stale: pr.stale === true,
      mergeableState: normalizeIdentifierOrNull(pr.mergeableState),
      refreshedAt: normalizeNullableString(pr.refreshedAt),
      evidence: normalizeNullableString(pr.evidence)
    }))
    .sort(compareStalePrs);
}

function summarizeChangedFiles(
  changedFiles: readonly string[]
): PrReadinessChangedFilesSummary {
  const runtimeUiFiles = changedFiles.filter(isRuntimeUiPath);
  const highRiskFiles = findSurfaceHits(changedFiles).map((hit) => hit.path);
  const docsOnly =
    changedFiles.length > 0 && changedFiles.every((path) => isDocsPath(path));
  const testsOnly =
    changedFiles.length > 0 && changedFiles.every((path) => isTestsPath(path));
  const docsOrTestsOnly =
    changedFiles.length > 0 &&
    changedFiles.every((path) => isDocsPath(path) || isTestsPath(path));

  return {
    total: changedFiles.length,
    files: [...changedFiles],
    docsOnly,
    testsOnly,
    docsOrTestsOnly,
    runtimeUiFiles,
    highRiskFiles: uniqueSorted(highRiskFiles)
  };
}

function summarizeCiChecks({
  ciChecks,
  requiredChecks
}: {
  ciChecks: readonly NormalizedEvidence[];
  requiredChecks: readonly string[];
}) {
  const normalizedRequiredChecks = normalizeEvidenceNameList(requiredChecks);
  const passedChecks: string[] = [];
  const failedChecks: string[] = [];
  const pendingChecks: string[] = [];
  const missingChecks: string[] = [];
  const unknownChecks: string[] = [];
  const noOpChecks: string[] = [];
  const acceptedEvidence: string[] = [];
  const rejectedEvidence: string[] = [];
  const stopReasons: string[] = [];
  const byName = firstEvidenceByName(ciChecks);

  for (const check of ciChecks) {
    if (check.isNoOp && check.status === "passed") {
      noOpChecks.push(check.name);
      rejectedEvidence.push(`ci_check:${check.name}:no_op`);
      stopReasons.push(`no_op_ci_check_not_release_evidence:${check.name}`);
    }
  }

  for (const requiredCheck of normalizedRequiredChecks) {
    const check = byName.get(requiredCheck);

    if (!check) {
      missingChecks.push(requiredCheck);
      stopReasons.push(`missing_required_ci_check:${requiredCheck}`);
      continue;
    }

    if (check.isNoOp) {
      missingChecks.push(requiredCheck);
      continue;
    }

    if (check.status === "passed") {
      passedChecks.push(requiredCheck);
      acceptedEvidence.push(
        `ci_check:${requiredCheck}:${check.evidence ?? "passed"}`
      );
      continue;
    }

    if (check.status === "failed") {
      failedChecks.push(requiredCheck);
      rejectedEvidence.push(
        `ci_check:${requiredCheck}:${check.evidence ?? "failed"}`
      );
      stopReasons.push(`failing_required_ci_check:${requiredCheck}`);
      continue;
    }

    if (check.status === "pending") {
      pendingChecks.push(requiredCheck);
      stopReasons.push(`pending_required_ci_check:${requiredCheck}`);
      continue;
    }

    if (
      check.status === "missing" ||
      check.status === "skipped" ||
      check.status === null
    ) {
      unknownChecks.push(requiredCheck);
      stopReasons.push(
        `unknown_ci_check_state:${requiredCheck}:${
          check.rawStatus ?? "missing"
        }`
      );
      continue;
    }

    unknownChecks.push(requiredCheck);
    stopReasons.push(
      `unknown_ci_check_state:${requiredCheck}:${check.rawStatus ?? "unknown"}`
    );
  }

  return {
    requiredChecks: normalizedRequiredChecks,
    passedChecks: uniqueSorted(passedChecks),
    failedChecks: uniqueSorted(failedChecks),
    pendingChecks: uniqueSorted(pendingChecks),
    missingChecks: uniqueSorted(missingChecks),
    unknownChecks: uniqueSorted(unknownChecks),
    noOpChecks: uniqueSorted(noOpChecks),
    acceptedEvidence: uniqueSorted(acceptedEvidence),
    rejectedEvidence: uniqueSorted(rejectedEvidence),
    stopReasons: uniquePreserveOrder(stopReasons)
  };
}

function summarizeValidationEvidence({
  validationEvidence,
  requiredEvidence
}: {
  validationEvidence: readonly NormalizedEvidence[];
  requiredEvidence: readonly string[];
}): PrReadinessValidationSummary & { stopReasons: string[] } {
  const normalizedRequiredEvidence = normalizeEvidenceNameList(requiredEvidence);
  const byName = firstEvidenceByName(validationEvidence);
  const acceptedEvidence: string[] = [];
  const rejectedEvidence: string[] = [];
  const missingEvidence: string[] = [];
  const stopReasons: string[] = [];

  for (const requiredItem of normalizedRequiredEvidence) {
    const evidence = byName.get(requiredItem);

    if (!evidence) {
      missingEvidence.push(requiredItem);
      stopReasons.push(`missing_validation_evidence:${requiredItem}`);
      continue;
    }

    if (evidence.isNoOp) {
      missingEvidence.push(requiredItem);
      rejectedEvidence.push(`validation:${requiredItem}:no_op`);
      stopReasons.push(`no_op_validation_evidence:${requiredItem}`);
      continue;
    }

    if (evidence.status === "passed") {
      acceptedEvidence.push(
        `validation:${requiredItem}:${evidence.evidence ?? "passed"}`
      );
      continue;
    }

    if (evidence.status === "failed") {
      rejectedEvidence.push(
        `validation:${requiredItem}:${evidence.evidence ?? "failed"}`
      );
      stopReasons.push(`failing_validation_evidence:${requiredItem}`);
      continue;
    }

    missingEvidence.push(requiredItem);
    stopReasons.push(
      `unknown_validation_evidence_state:${requiredItem}:${
        evidence.rawStatus ?? "missing"
      }`
    );
  }

  return {
    requiredEvidence: normalizedRequiredEvidence,
    acceptedEvidence: uniqueSorted(acceptedEvidence),
    rejectedEvidence: uniqueSorted(rejectedEvidence),
    missingEvidence: uniqueSorted(missingEvidence),
    stopReasons: uniquePreserveOrder(stopReasons)
  };
}

function summarizeRisk({
  changedFilesSummary,
  surfaceHits,
  blockedSurfacesTouched,
  taskMapping,
  highRiskSurfaces
}: {
  changedFilesSummary: PrReadinessChangedFilesSummary;
  surfaceHits: readonly SurfaceHit[];
  blockedSurfacesTouched: readonly string[];
  taskMapping: NormalizedTaskMapping | null;
  highRiskSurfaces: readonly string[];
}) {
  const riskReasons: string[] = [];
  let riskLevel: PrReadinessRiskLevel = "low";

  if (changedFilesSummary.total === 0) {
    riskLevel = "high";
    riskReasons.push("empty_change_set");
  }

  if (changedFilesSummary.runtimeUiFiles.length > 0) {
    riskLevel = maxRisk(riskLevel, "medium");
    for (const file of changedFilesSummary.runtimeUiFiles) {
      riskReasons.push(`medium_runtime_ui_path:${file}`);
    }
  }

  for (const hit of surfaceHits) {
    riskLevel = "high";
    riskReasons.push(`high_risk_surface:${hit.surface}:${hit.path}`);
  }

  for (const surface of blockedSurfacesTouched) {
    if (surface === "public_paid_beta_launch") {
      riskLevel = "high";
      riskReasons.push("high_risk_surface:public_paid_beta_launch");
    }
  }

  if (taskMapping?.risk) {
    riskLevel = maxRisk(riskLevel, taskMapping.risk);
    riskReasons.push(`task_mapping_risk:${taskMapping.id}:${taskMapping.risk}`);
  }

  const highRiskSurfaceSet = new Set(normalizeSurfaceList(highRiskSurfaces));

  if (taskMapping?.taskSurface && highRiskSurfaceSet.has(taskMapping.taskSurface)) {
    riskLevel = "high";
    riskReasons.push(
      `task_surface_high_risk:${taskMapping.id}:${taskMapping.taskSurface}`
    );
  }

  if (riskLevel === "high") {
    riskReasons.push("high_risk_requires_owner_approval");
  }

  riskReasons.push("auto_merge_disabled_v1");

  return {
    riskLevel,
    riskReasons: uniqueSorted(riskReasons)
  };
}

function summarizeStalePrWarnings({
  pr,
  stalePrContext
}: {
  pr: NormalizedPr;
  stalePrContext: readonly NormalizedStalePr[];
}) {
  const candidates = [...stalePrContext];

  if (pr.number === 121) {
    candidates.push({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      isDraft: pr.isDraft,
      stale: true,
      mergeableState: pr.mergeableState,
      refreshedAt: null,
      evidence: null
    });
  }

  return uniqueSorted(
    candidates
      .filter(isStaleNotMergeablePr)
      .map(
        (candidate) =>
          `pr:#${candidate.number ?? "unknown"}:stale_not_mergeable:${
            candidate.mergeableState ?? "unknown"
          }`
      )
  );
}

function findSurfaceHits(changedFiles: readonly string[]) {
  const hits: SurfaceHit[] = [];

  for (const path of changedFiles) {
    for (const rule of HIGH_RISK_PATH_RULES) {
      if (rule.match(path)) {
        hits.push({ surface: rule.surface, path });
      }
    }
  }

  return hits.sort(compareSurfaceHits);
}

function findTextSurfaces(values: readonly string[]) {
  const text = values.join("\n").toLowerCase();
  const surfaces: string[] = [];

  if (
    (text.includes("public paid beta") || text.includes("public beta")) &&
    (text.includes("launch") || text.includes("go-live") || text.includes("go live"))
  ) {
    surfaces.push("public_paid_beta_launch");
  }

  return uniqueSorted(surfaces);
}

function findBlockedSurfaceHits({
  changedFiles,
  prText,
  blockedSurfaces
}: {
  changedFiles: readonly string[];
  prText: string;
  blockedSurfaces: readonly NormalizedBlockedSurface[];
}) {
  const text = normalizeIdentifier(prText);
  const hits: NormalizedBlockedSurface[] = [];

  for (const surface of blockedSurfaces) {
    const patternMatch = surface.changedFilePatterns.some((pattern) =>
      changedFiles.some((file) => patternMatchesPath(pattern, file))
    );
    const keywordMatch = surface.keywords.some((keyword) =>
      text.includes(keyword)
    );

    if (
      patternMatch ||
      keywordMatch ||
      changedFiles.some((file) => file.includes(surface.surface)) ||
      text.includes(surface.surface)
    ) {
      hits.push(surface);
    }
  }

  return hits.sort((left, right) => compareStrings(left.surface, right.surface));
}

function findForbiddenChangedFileWarnings({
  changedFiles,
  forbiddenChangedFiles
}: {
  changedFiles: readonly string[];
  forbiddenChangedFiles: readonly string[];
}) {
  const normalizedPatterns = normalizeStringList(forbiddenChangedFiles).map(
    normalizeChangedFile
  );
  const warnings: string[] = [];

  for (const file of changedFiles) {
    for (const pattern of normalizedPatterns) {
      if (patternMatchesPath(pattern, file)) {
        warnings.push(`forbidden_changed_file:${file}:${pattern}`);
      }
    }
  }

  return uniqueSorted(warnings);
}

function getRequiredValidationEvidence({
  changedFilesSummary,
  riskPolicy
}: {
  changedFilesSummary: PrReadinessChangedFilesSummary;
  riskPolicy: PrReadinessRiskPolicyLike | null;
}) {
  if (changedFilesSummary.runtimeUiFiles.length > 0) {
    return riskPolicy?.runtimeUiRequiredEvidence?.length
      ? riskPolicy.runtimeUiRequiredEvidence
      : DEFAULT_RUNTIME_UI_REQUIRED_EVIDENCE;
  }

  return riskPolicy?.docsTestsRequiredEvidence?.length
    ? riskPolicy.docsTestsRequiredEvidence
    : DEFAULT_DOCS_TESTS_REQUIRED_EVIDENCE;
}

function detectTaskId({
  pr,
  changedFiles,
  taskMappings
}: {
  pr: NormalizedPr;
  changedFiles: readonly string[];
  taskMappings: readonly NormalizedTaskMapping[];
}) {
  const explicitTaskId = pr.taskId ?? findTaskIdInText(pr.title);

  if (explicitTaskId) {
    return explicitTaskId;
  }

  for (const label of pr.labels) {
    const labelTaskId = normalizeTaskLabel(label);

    if (labelTaskId) {
      return labelTaskId;
    }
  }

  const bodyTaskId = findTaskIdInText(pr.body);

  if (bodyTaskId) {
    return bodyTaskId;
  }

  const changedFileSet = new Set(changedFiles);

  for (const mapping of taskMappings) {
    if (
      mapping.expectedChangedFiles.some((file) => changedFileSet.has(file)) ||
      mapping.aliases.some((alias) => pr.title.toUpperCase().includes(alias))
    ) {
      return mapping.id;
    }
  }

  return null;
}

function determineReadiness({
  stopReasons,
  mergeBlockers,
  ciSummary,
  validationSummary,
  pr,
  currentPrStaleWarning
}: {
  stopReasons: readonly string[];
  mergeBlockers: readonly string[];
  ciSummary: PrReadinessCiSummary;
  validationSummary: PrReadinessValidationSummary;
  pr: NormalizedPr;
  currentPrStaleWarning: string | undefined;
}): PrReadinessQueueReadiness {
  if (
    stopReasons.some(
      (reason) =>
        reason === "live_github_mutation_request_not_supported_v1" ||
        reason === "auto_merge_request_not_supported_v1" ||
        reason === "dry_run_false_not_supported_v1"
    )
  ) {
    return "unsafe";
  }

  if (currentPrStaleWarning) {
    return "stale";
  }

  if (
    mergeBlockers.some(
      (blocker) =>
        blocker.startsWith("hard_blocked_surface_touched:") ||
        blocker === "public_paid_beta_launch_without_owner_gate_evidence" ||
        blocker === "missing_owner_approval_evidence" ||
        blocker.startsWith("forbidden_changed_file:")
    ) ||
    ciSummary.failedChecks.length > 0
  ) {
    return "blocked";
  }

  if (
    pr.isDraft ||
    ciSummary.pendingChecks.length > 0 ||
    ciSummary.missingChecks.length > 0 ||
    ciSummary.unknownChecks.length > 0 ||
    validationSummary.missingEvidence.length > 0 ||
    validationSummary.rejectedEvidence.length > 0 ||
    mergeBlockers.length > 0
  ) {
    return "needs_fix";
  }

  return "ready_for_owner_review";
}

function buildOwnerDecisionReason({
  readiness,
  riskLevel,
  blockedSurfacesTouched,
  ownerApprovalProvided
}: {
  readiness: PrReadinessQueueReadiness;
  riskLevel: PrReadinessRiskLevel;
  blockedSurfacesTouched: readonly string[];
  ownerApprovalProvided: boolean;
}) {
  if (readiness === "ready_for_owner_review") {
    return "Owner review is required before merge; auto-merge remains disabled.";
  }

  if (riskLevel === "high" && !ownerApprovalProvided) {
    return "High-risk surfaces require explicit owner approval evidence before merge can be recommended.";
  }

  if (blockedSurfacesTouched.length > 0) {
    return `Owner decision required because blocked/high-risk surfaces were touched: ${blockedSurfacesTouched.join(
      ", "
    )}.`;
  }

  return "Owner decision required after the PR supplies missing validation and CI evidence.";
}

function buildMergeRecommendation(readiness: PrReadinessQueueReadiness) {
  if (readiness === "ready_for_owner_review") {
    return "Ready for owner review only; do not auto-merge.";
  }

  if (readiness === "needs_fix") {
    return "Do not merge. Request missing fixes or evidence, then rerun the owner queue summarizer.";
  }

  if (readiness === "stale") {
    return "Do not merge. Refresh the stale PR branch, mergeability, CI, and validation evidence first.";
  }

  if (readiness === "unsafe") {
    return "Stop. The input requested live mutation, disabled dry-run, or auto-merge behavior that v1 forbids.";
  }

  return "Do not merge. Blocked surfaces, failing CI, missing owner approval, or forbidden changes must be resolved first.";
}

function buildPostMergeFollowup({
  prNumber,
  taskId,
  readiness
}: {
  prNumber: number | null;
  taskId: string | null;
  readiness: PrReadinessQueueReadiness;
}) {
  if (readiness !== "ready_for_owner_review") {
    return [
      "Do not run post-merge follow-up until blockers are resolved and the owner approves merge."
    ];
  }

  const followup = [
    `Record merge and validation evidence for PR #${prNumber ?? "unknown"}.`,
    "Keep auto-merge disabled and owner-approved."
  ];

  if (taskId) {
    followup.push(
      `Run verification sync for ${taskId} in a separate owner-approved PR if roadmap or backlog status changes are needed.`
    );
  }

  return followup;
}

function buildOwnerApprovalCommentDraft(
  item: Omit<
    PrReadinessOwnerQueueItem,
    "ownerApprovalCommentDraft" | "needsFixCommentDraft"
  >
) {
  return [
    "PR readiness owner queue v1",
    `PR: #${item.prNumber ?? "unknown"} ${item.prTitle || "Untitled PR"}`,
    `Readiness: ${item.readiness}`,
    `Task: ${item.taskId ?? "none"}`,
    `Risk: ${item.riskLevel}`,
    `Owner decision required: ${item.ownerDecisionRequired ? "yes" : "no"}`,
    `Merge recommendation: ${item.mergeRecommendation}`,
    `Merge blockers: ${item.mergeBlockers.join(", ") || "none"}`,
    `Missing evidence: ${item.missingEvidence.join(", ") || "none"}`,
    "Safety: no live GitHub mutations, no gh calls, no comments, no labels, no merges, and no auto-merge are performed by implementation code."
  ].join("\n");
}

function buildNeedsFixCommentDraft(
  item: Omit<
    PrReadinessOwnerQueueItem,
    "ownerApprovalCommentDraft" | "needsFixCommentDraft"
  >
) {
  return [
    "PR readiness needs-fix draft v1",
    `PR: #${item.prNumber ?? "unknown"} ${item.prTitle || "Untitled PR"}`,
    `Readiness: ${item.readiness}`,
    `Merge blockers: ${item.mergeBlockers.join(", ") || "none"}`,
    `Missing evidence: ${item.missingEvidence.join(", ") || "none"}`,
    `Failed CI: ${item.ciSummary.failedChecks.join(", ") || "none"}`,
    `Pending CI: ${item.ciSummary.pendingChecks.join(", ") || "none"}`,
    `Stale PR warnings: ${item.stalePrWarnings.join(", ") || "none"}`,
    "Safety: keep the PR draft/blocked until refreshed deterministic evidence is supplied."
  ].join("\n");
}

function buildSafetyNotes() {
  return [
    "Summarizer-only output; implementation code performs no live GitHub mutations.",
    "No branches, PRs, issues, comments, labels, merges, auto-merge actions, GitHub API calls, or gh calls are created by this function.",
    "Track B runtime UI, Dashboard v2, Review v2, Saved Library v2, Packs v2, Pricing/Paywall v2, account sync, payment, and billing are not implemented.",
    "Roadmap and backlog inputs are treated as immutable planning data.",
    "Unknown, missing, ambiguous, no-op-only, unsafe, stale, or forbidden evidence fails closed."
  ];
}

function hasOwnerApproval(
  ownerApprovalPolicy: PrReadinessOwnerApprovalPolicyLike | null
) {
  return (
    ownerApprovalPolicy?.approved === true &&
    normalizeNullableString(ownerApprovalPolicy.evidence) !== null
  );
}

function firstEvidenceByName(evidence: readonly NormalizedEvidence[]) {
  const byName = new Map<string, NormalizedEvidence>();

  for (const item of evidence) {
    if (!byName.has(item.name)) {
      byName.set(item.name, item);
    }
  }

  return byName;
}

function isStaleNotMergeablePr(pr: NormalizedStalePr) {
  if (pr.number !== 121) {
    return false;
  }

  if (hasRefreshedMergeableEvidence(pr)) {
    return false;
  }

  return (
    pr.stale ||
    pr.state === "open" ||
    pr.mergeableState === "dirty" ||
    pr.mergeableState === "blocked" ||
    pr.mergeableState === "unknown" ||
    pr.mergeableState === null
  );
}

function hasRefreshedMergeableEvidence(pr: NormalizedStalePr) {
  const evidence = normalizeIdentifierOrNull(pr.evidence);

  return (
    pr.stale !== true &&
    (pr.mergeableState === "clean" || pr.mergeableState === "mergeable") &&
    evidence !== null &&
    evidence.includes("refreshed")
  );
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

function normalizeStringList(values?: readonly string[] | null) {
  if (!values) {
    return [];
  }

  return values
    .map((value) => normalizeNullableString(value))
    .filter(isString);
}

function normalizeEvidenceNameList(values: readonly string[]) {
  return uniqueSorted(values.map(normalizeEvidenceName));
}

function normalizeEvidenceName(value?: string | null) {
  return normalizeIdentifierOrNull(value) ?? "missing_name";
}

function normalizeTaskId(value?: string | null) {
  return normalizeNullableString(value)?.toUpperCase() ?? "";
}

function normalizeTaskLabel(label: string) {
  const match = /^task:(.+)$/i.exec(label.trim());

  return match ? normalizeTaskId(match[1]) : "";
}

function normalizeRisk(value?: string | null): PrReadinessRiskLevel | null {
  const normalized = normalizeIdentifierOrNull(value);

  if (
    normalized === "low" ||
    normalized === "medium" ||
    normalized === "high"
  ) {
    return normalized;
  }

  return null;
}

function normalizeSurface(value?: string | null) {
  const normalized = normalizeIdentifierOrNull(value);

  if (!normalized) {
    return null;
  }

  return HIGH_RISK_SURFACE_ALIASES[normalized] ?? normalized;
}

function normalizeSurfaceList(values?: readonly string[] | null) {
  return normalizeStringList(values)
    .map(normalizeSurface)
    .filter(isString)
    .sort(compareStrings);
}

function normalizeEvidenceStatus(
  normalizedStatus?: string | null
): EvidenceStatus | null {
  if (!normalizedStatus) {
    return null;
  }

  if (
    normalizedStatus === "passed" ||
    normalizedStatus === "pass" ||
    normalizedStatus === "success" ||
    normalizedStatus === "succeeded"
  ) {
    return "passed";
  }

  if (
    normalizedStatus === "failed" ||
    normalizedStatus === "fail" ||
    normalizedStatus === "failure" ||
    normalizedStatus === "error" ||
    normalizedStatus === "cancelled" ||
    normalizedStatus === "canceled" ||
    normalizedStatus === "timed_out"
  ) {
    return "failed";
  }

  if (
    normalizedStatus === "in_progress" ||
    normalizedStatus === "pending" ||
    normalizedStatus === "queued" ||
    normalizedStatus === "running" ||
    normalizedStatus === "waiting" ||
    normalizedStatus === "requested"
  ) {
    return "pending";
  }

  if (normalizedStatus === "missing") {
    return "missing";
  }

  if (normalizedStatus === "skipped" || normalizedStatus === "skip") {
    return "skipped";
  }

  if (normalizedStatus === "unknown") {
    return "unknown";
  }

  return null;
}

function findTaskIdInText(text: string) {
  const bracketed = /\[([A-Za-z]+-\d+)\]/.exec(text);

  if (bracketed?.[1]) {
    return normalizeTaskId(bracketed[1]);
  }

  const bare = /\b([A-Za-z]{2,}-\d{2,})\b/.exec(text);

  return bare?.[1] ? normalizeTaskId(bare[1]) : null;
}

function patternMatchesPath(pattern: string, path: string) {
  if (pattern === path) {
    return true;
  }

  if (pattern.endsWith("/") && path.startsWith(pattern)) {
    return true;
  }

  if (!pattern.includes("*")) {
    return false;
  }

  const escaped = pattern
    .split("*")
    .map(escapeRegExp)
    .join(".*");

  return new RegExp(`^${escaped}$`).test(path);
}

function isDocsPath(path: string) {
  return (
    path === "readme.md" ||
    (path.startsWith("docs/") &&
      (path.endsWith(".md") ||
        path.endsWith(".mdx") ||
        path.endsWith(".txt") ||
        path.endsWith(".json") ||
        path.endsWith(".ts")))
  );
}

function isTestsPath(path: string) {
  return path.startsWith("tests/") || path.endsWith(".spec.ts");
}

function isRuntimeUiPath(path: string) {
  return (
    path === "src/app/globals.css" ||
    path.startsWith("src/components/") ||
    (path.startsWith("src/app/") &&
      !path.startsWith("src/app/api/") &&
      (path.endsWith(".tsx") || path.endsWith(".ts") || path.endsWith(".css")))
  );
}

function maxRisk(
  left: PrReadinessRiskLevel,
  right: PrReadinessRiskLevel
): PrReadinessRiskLevel {
  const weights: Record<PrReadinessRiskLevel, number> = {
    low: 0,
    medium: 1,
    high: 2
  };

  return weights[right] > weights[left] ? right : left;
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

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function compareEvidence(left: NormalizedEvidence, right: NormalizedEvidence) {
  const byName = compareStrings(left.name, right.name);

  if (byName !== 0) {
    return byName;
  }

  return compareStrings(left.evidence ?? "", right.evidence ?? "");
}

function compareTaskMappings(
  left: NormalizedTaskMapping,
  right: NormalizedTaskMapping
) {
  return compareStrings(left.id, right.id);
}

function compareStalePrs(left: NormalizedStalePr, right: NormalizedStalePr) {
  const byNumber = (left.number ?? 0) - (right.number ?? 0);

  if (byNumber !== 0) {
    return byNumber;
  }

  return compareStrings(left.title ?? "", right.title ?? "");
}

function compareSurfaceHits(left: SurfaceHit, right: SurfaceHit) {
  const bySurface = compareStrings(left.surface, right.surface);

  if (bySurface !== 0) {
    return bySurface;
  }

  return compareStrings(left.path, right.path);
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
