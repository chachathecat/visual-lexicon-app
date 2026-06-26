export const FACTORY_RISK_CLASSIFIER_VERSION = 1 as const;

export type FactoryRiskClassifierVersion =
  typeof FACTORY_RISK_CLASSIFIER_VERSION;

export type FactoryRisk = "low" | "medium" | "high";

export type FactoryTaskSurface =
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

export type FactoryRiskClassifierInput = {
  changedFiles?: readonly string[] | null;
  taskSurface?: string | null;
};

export type FactoryRiskClassification = {
  version: FactoryRiskClassifierVersion;
  risk: FactoryRisk;
  reasons: string[];
  protectedPaths: string[];
  requiresOwnerApproval: boolean;
  autoMergeEligible: boolean;
  changedFiles: string[];
};

type PathRiskRule = {
  id: string;
  risk: FactoryRisk;
  match: (path: string) => boolean;
};

type PathClassification = {
  path: string;
  risk: FactoryRisk;
  ruleId: string;
};

const RISK_WEIGHT: Record<FactoryRisk, number> = {
  low: 0,
  medium: 1,
  high: 2
};

const TASK_SURFACE_RISK: Record<FactoryTaskSurface, FactoryRisk> = {
  docs_only: "low",
  tests_only: "low",
  fixtures_only: "low",
  non_behavioral_refactor: "low",
  product_ui: "medium",
  app_server_logic: "medium",
  auth_session: "high",
  database_rls: "high",
  account_sync: "high",
  entitlement_grant: "high",
  usage_ledger: "high",
  billing_webhook_refund: "high",
  private_asset_download: "high",
  ai_provider: "high",
  secrets_env: "high",
  github_workflows: "high",
  codeowners: "high",
  agents_policy: "high",
  deployment_dns_production_data: "high",
  canonical_monetization: "high",
  roadmap_release_control_plane: "high",
  factory_control_plane: "high"
};

const TASK_SURFACE_ALIASES: Record<string, FactoryTaskSurface> = {
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
  factory: "factory_control_plane"
};

const HARD_PROTECTED_PATH_RULES: readonly PathRiskRule[] = [
  {
    id: "secrets_env",
    risk: "high",
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
    id: "github_workflows",
    risk: "high",
    match: (path) => path.startsWith(".github/workflows/")
  },
  {
    id: "codeowners",
    risk: "high",
    match: (path) => path === ".github/codeowners" || path === "codeowners"
  },
  {
    id: "agents_policy",
    risk: "high",
    match: (path) =>
      path === "agents.md" ||
      path.startsWith(".agents/") ||
      path.startsWith(".codex/") ||
      path === "docs/autonomous_delivery_policy.md" ||
      path === "docs/human_decision_boundaries.md" ||
      path === "docs/security_and_permissions.md" ||
      path.endsWith("_policy.md") ||
      path.includes("/policy/")
  },
  {
    id: "canonical_monetization",
    risk: "high",
    match: (path) =>
      path.startsWith("docs/monetization/") ||
      path.includes("vlx-plan-entitlements") ||
      path.includes("plan-catalog")
  },
  {
    id: "roadmap_release_control_plane",
    risk: "high",
    match: (path) =>
      path === "plans.md" ||
      path === "roadmap.md" ||
      path.startsWith("docs/roadmap/") ||
      path.startsWith("src/lib/factory/") ||
      path.startsWith("src/lib/beta-ops-gate/") ||
      path.startsWith("src/lib/product-ui-readiness/") ||
      path === ".github/pull_request_template.md" ||
      path.startsWith(".github/issue_template/") ||
      path.includes("release") ||
      path.includes("finish_line") ||
      path.includes("factory") ||
      path.includes("gate")
  },
  {
    id: "deployment_dns_production_data",
    risk: "high",
    match: (path) =>
      path === "vercel.json" ||
      path === "wrangler.toml" ||
      path === "next.config.mjs" ||
      path.startsWith(".vercel/") ||
      path.startsWith("cloudflare/") ||
      path.startsWith("workers/") ||
      path.startsWith("infra/") ||
      path.startsWith("terraform/") ||
      path.startsWith("r2/") ||
      path.startsWith("data/production/") ||
      path.endsWith(".tf") ||
      path.includes("dns") ||
      path.includes("production-data")
  }
];

const LOW_PATH_RULES: readonly PathRiskRule[] = [
  {
    id: "tests_only",
    risk: "low",
    match: (path) => path.startsWith("tests/") || path.startsWith("evals/")
  },
  {
    id: "fixtures_only",
    risk: "low",
    match: (path) =>
      path.includes("/fixtures/") ||
      path.endsWith("/fixtures.ts") ||
      path.endsWith("/fixtures.tsx") ||
      path.includes(".fixture.")
  },
  {
    id: "docs_only",
    risk: "low",
    match: (path) =>
      path === "readme.md" ||
      (path.startsWith("docs/") &&
        (path.endsWith(".md") ||
          path.endsWith(".mdx") ||
          path.endsWith(".txt")))
  }
];

const HIGH_RUNTIME_PATH_RULES: readonly PathRiskRule[] = [
  {
    id: "auth_session",
    risk: "high",
    match: (path) =>
      path === "src/middleware.ts" ||
      path.endsWith("/middleware.ts") ||
      path.startsWith("src/lib/auth/") ||
      path.startsWith("src/lib/account-runtime/") ||
      path.startsWith("src/lib/supabase/") ||
      path.startsWith("src/app/auth/") ||
      path.startsWith("src/app/login/")
  },
  {
    id: "database_rls",
    risk: "high",
    match: (path) =>
      path.endsWith(".sql") ||
      path.startsWith("supabase/") ||
      path.startsWith("migrations/") ||
      path.startsWith("db/") ||
      path.startsWith("database/") ||
      path.startsWith("prisma/") ||
      path.startsWith("drizzle/") ||
      path.includes("/migrations/") ||
      path.includes("/rls/") ||
      path.includes("database") ||
      path.includes("migration") ||
      path.includes("rls")
  },
  {
    id: "account_sync",
    risk: "high",
    match: (path) =>
      path.startsWith("src/lib/account-persistence/") ||
      path.startsWith("src/lib/server-srs-sync/") ||
      path.includes("account-sync") ||
      path.includes("guest-to-account")
  },
  {
    id: "entitlement_grant",
    risk: "high",
    match: (path) =>
      path.startsWith("src/lib/billing-entitlements/") ||
      path.startsWith("src/lib/manual-payment-entitlement/") ||
      path.startsWith("src/app/api/me/entitlements/") ||
      path.includes("entitlement") ||
      path.includes("grant")
  },
  {
    id: "usage_ledger",
    risk: "high",
    match: (path) =>
      path.startsWith("src/lib/usage/") ||
      path.startsWith("src/lib/usage-ledger/") ||
      path.startsWith("src/app/api/me/usage/") ||
      path.includes("usage-ledger") ||
      path.includes("usage_ledger")
  },
  {
    id: "billing_webhook_refund",
    risk: "high",
    match: (path) =>
      path.startsWith("src/lib/billing/") ||
      path.startsWith("src/app/api/billing/") ||
      path.startsWith("src/app/api/checkout/") ||
      path.startsWith("src/app/api/webhooks/") ||
      path.includes("billing") ||
      path.includes("payment") ||
      path.includes("checkout") ||
      path.includes("subscription") ||
      path.includes("invoice") ||
      path.includes("webhook") ||
      path.includes("refund") ||
      path.includes("chargeback") ||
      path.includes("stripe") ||
      path.includes("paddle")
  },
  {
    id: "private_asset_download",
    risk: "high",
    match: (path) =>
      path.startsWith("src/app/api/downloads/") ||
      path.startsWith("src/lib/assets/") ||
      path.startsWith("src/lib/private-assets/") ||
      path.startsWith("src/lib/downloads/") ||
      path.includes("private-asset") ||
      path.includes("clean-asset") ||
      path.includes("asset-rights") ||
      path.includes("download-gateway")
  },
  {
    id: "ai_provider",
    risk: "high",
    match: (path) =>
      path.startsWith("src/lib/ai/") ||
      path.startsWith("src/app/api/ai/") ||
      path.includes("ai-provider") ||
      path.includes("openai") ||
      path.includes("llm") ||
      path.includes("prompt-contract")
  }
];

const MEDIUM_PATH_RULES: readonly PathRiskRule[] = [
  {
    id: "product_ui",
    risk: "medium",
    match: (path) =>
      path === "src/app/globals.css" ||
      path.startsWith("src/components/") ||
      (path.startsWith("src/app/") &&
        !path.startsWith("src/app/api/") &&
        (path.endsWith(".tsx") ||
          path.endsWith(".ts") ||
          path.endsWith(".css")))
  },
  {
    id: "app_server_logic",
    risk: "medium",
    match: (path) =>
      path === "src/lib/mock-data.ts" ||
      path === "src/lib/word-visuals.ts" ||
      path.startsWith("src/lib/analytics/") ||
      path.startsWith("src/lib/extension/") ||
      path.startsWith("src/lib/multilingual/") ||
      path.startsWith("src/lib/packs/") ||
      path.startsWith("src/lib/paywall/") ||
      path.startsWith("src/lib/production-analytics/") ||
      path.startsWith("src/lib/review/") ||
      path.startsWith("src/lib/srs/") ||
      path.startsWith("src/lib/upgrade/")
  }
];

export function classifyFactoryRisk(
  input: FactoryRiskClassifierInput = {}
): FactoryRiskClassification {
  const changedFiles = normalizeChangedFiles(input.changedFiles);
  const taskSurface = normalizeTaskSurface(input.taskSurface);
  const taskSurfaceRisk = taskSurface
    ? TASK_SURFACE_RISK[taskSurface] ?? null
    : null;
  const unknownTaskSurface =
    input.taskSurface != null && input.taskSurface.trim().length > 0 && !taskSurface;
  const classifications = changedFiles.map((path) =>
    classifyChangedFilePath(path, taskSurface)
  );
  const reasons: string[] = [];

  if (changedFiles.length === 0) {
    reasons.push("empty_change_set");
  }

  if (unknownTaskSurface) {
    reasons.push(
      `unknown_task_surface:${normalizeReasonValue(input.taskSurface ?? "")}`
    );
  } else if (taskSurface && taskSurfaceRisk) {
    reasons.push(`task_surface:${taskSurface}:${taskSurfaceRisk}`);
  }

  for (const classification of classifications) {
    reasons.push(
      `${classification.risk}_path:${classification.path}:${classification.ruleId}`
    );
  }

  let risk: FactoryRisk = changedFiles.length === 0 ? "high" : "low";

  if (unknownTaskSurface) {
    risk = "high";
  }

  if (taskSurfaceRisk) {
    risk = maxRisk(risk, taskSurfaceRisk);
  }

  for (const classification of classifications) {
    risk = maxRisk(risk, classification.risk);
  }

  if (risk === "high") {
    reasons.push("high_risk_requires_owner_approval");
  }

  reasons.push("auto_merge_disabled_v1");

  return {
    version: FACTORY_RISK_CLASSIFIER_VERSION,
    risk,
    reasons,
    protectedPaths: classifications
      .filter((classification) => classification.risk === "high")
      .map((classification) => classification.path),
    requiresOwnerApproval: risk === "high",
    autoMergeEligible: false,
    changedFiles
  };
}

export function classifyChangedFilePathForFactoryRisk(
  changedFile: string,
  taskSurface?: string | null
): PathClassification {
  return classifyChangedFilePath(
    normalizeChangedFile(changedFile),
    normalizeTaskSurface(taskSurface)
  );
}

function classifyChangedFilePath(
  path: string,
  taskSurface: FactoryTaskSurface | null
): PathClassification {
  const hardProtectedRule = findMatchingRule(path, HARD_PROTECTED_PATH_RULES);

  if (hardProtectedRule) {
    return {
      path,
      risk: hardProtectedRule.risk,
      ruleId: hardProtectedRule.id
    };
  }

  const lowRule = findMatchingRule(path, LOW_PATH_RULES);

  if (lowRule) {
    return {
      path,
      risk: lowRule.risk,
      ruleId: lowRule.id
    };
  }

  const highRule = findMatchingRule(path, HIGH_RUNTIME_PATH_RULES);

  if (highRule) {
    return {
      path,
      risk: highRule.risk,
      ruleId: highRule.id
    };
  }

  const mediumRule = findMatchingRule(path, MEDIUM_PATH_RULES);

  if (mediumRule) {
    if (taskSurface === "non_behavioral_refactor") {
      return {
        path,
        risk: "low",
        ruleId: "known_safe_non_behavioral_refactor"
      };
    }

    return {
      path,
      risk: mediumRule.risk,
      ruleId: mediumRule.id
    };
  }

  return {
    path,
    risk: "high",
    ruleId: "unknown_path"
  };
}

function findMatchingRule(
  path: string,
  rules: readonly PathRiskRule[]
): PathRiskRule | null {
  return rules.find((rule) => rule.match(path)) ?? null;
}

function normalizeChangedFiles(changedFiles?: readonly string[] | null) {
  if (!changedFiles) {
    return [];
  }

  return [...new Set(changedFiles.map(normalizeChangedFile))].sort(comparePaths);
}

function normalizeChangedFile(changedFile: string) {
  return changedFile
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\.\//, "")
    .toLowerCase();
}

function normalizeTaskSurface(
  taskSurface?: string | null
): FactoryTaskSurface | null {
  if (!taskSurface) {
    return null;
  }

  const normalized = taskSurface.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (isFactoryTaskSurface(normalized)) {
    return normalized;
  }

  return TASK_SURFACE_ALIASES[normalized] ?? null;
}

function isFactoryTaskSurface(
  value: string
): value is FactoryTaskSurface {
  return Object.prototype.hasOwnProperty.call(TASK_SURFACE_RISK, value);
}

function maxRisk(left: FactoryRisk, right: FactoryRisk): FactoryRisk {
  return RISK_WEIGHT[right] > RISK_WEIGHT[left] ? right : left;
}

function comparePaths(left: string, right: string) {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function normalizeReasonValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}
