import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import { basename, join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  PRIVATE_BETA_ISSUE_LOG_SAFETY_POLICY,
  PRIVATE_BETA_ISSUE_LOG_TEMPLATE,
  PRIVATE_BETA_ISSUE_LOG_VERDICT,
  PUBLIC_BETA_ISSUE_LOG_VERDICT,
  VISUAL_LEXICON_PRIVATE_BETA_ISSUE_LOG_VERSION,
  getIssueFeatureAreaClassifications,
  getIssueIntakeFields,
  getIssueRedactionRules,
  getIssueRouteTaxonomy,
  getIssueSeverityLevels,
  getIssueStatusLifecycle,
  getNextIssueLogPRSequence,
  getOwnerTriageChecklist,
  getPrivateBetaIssueLogTemplate,
  getPrivateBetaIssueLogVerdict,
  getPublicBetaVerdict,
  getRollbackPauseTriggerMapping,
  type PrivateBetaIssueFeatureClassification,
  type PrivateBetaIssueIntakeField,
  type PrivateBetaIssueLogNextPr,
  type PrivateBetaIssueLogTemplate,
  type PrivateBetaIssueLogVerdict,
  type PrivateBetaIssueLogVersion,
  type PrivateBetaIssueRecord,
  type PrivateBetaIssueRouteTaxonomyItem,
  type PrivateBetaIssueSeverity,
  type PrivateBetaIssueSeverityLevel,
  type PrivateBetaIssueStatus,
  type PrivateBetaIssueStatusLifecycleItem,
  type PrivateBetaOwnerTriageChecklistItem,
  type PrivateBetaRedactionRule,
  type PrivateBetaRollbackPauseTrigger
} from "../src/lib/private-beta-issue-log/private-beta-issue-log";
import {
  PRIVATE_BETA_DOC_FILES,
  PRIVATE_BETA_FORBIDDEN_ACTUAL_PATHS,
  PRIVATE_BETA_FORBIDDEN_DIRECT_DEPENDENCIES,
  PRIVATE_BETA_ISSUE_SEVERITIES,
  PRIVATE_BETA_ISSUE_STATUSES,
  PRIVATE_BETA_MODULE_FILES,
  PRIVATE_BETA_REQUIRED_CLOSEOUT_IDS,
  PRIVATE_BETA_REQUIRED_DOC_SECTIONS,
  PRIVATE_BETA_REQUIRED_DUPLICATE_IDS,
  PRIVATE_BETA_REQUIRED_ESCALATION_IDS,
  PRIVATE_BETA_REQUIRED_FEATURE_AREAS,
  PRIVATE_BETA_REQUIRED_ISSUE_FIELD_KEYS,
  PRIVATE_BETA_REQUIRED_LOCAL_STORAGE_KEYS,
  PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS,
  PRIVATE_BETA_REQUIRED_NEXT_PR_TITLES,
  PRIVATE_BETA_REQUIRED_REDACTION_BLOCKS,
  PRIVATE_BETA_REQUIRED_ROLLBACK_TRIGGER_IDS,
  PRIVATE_BETA_REQUIRED_ROUTE_VALUES,
  PRIVATE_BETA_REQUIRED_SAFETY_FIELDS,
  PRIVATE_BETA_REQUIRED_TRIAGE_IDS,
  PRIVATE_BETA_RUNTIME_SCAN_DIRS
} from "../src/lib/private-beta-issue-log/fixtures";

const workspaceRoot = process.cwd();

type PrivateBetaIssueLogTypeSurface = {
  version: PrivateBetaIssueLogVersion;
  template: PrivateBetaIssueLogTemplate;
  verdict: PrivateBetaIssueLogVerdict;
  intakeField: PrivateBetaIssueIntakeField;
  severityLevel: PrivateBetaIssueSeverityLevel;
  statusItem: PrivateBetaIssueStatusLifecycleItem;
  routeTaxonomyItem: PrivateBetaIssueRouteTaxonomyItem;
  redactionRule: PrivateBetaRedactionRule;
  classification: PrivateBetaIssueFeatureClassification;
  triageItem: PrivateBetaOwnerTriageChecklistItem;
  rollbackTrigger: PrivateBetaRollbackPauseTrigger;
  issueRecord: PrivateBetaIssueRecord;
  nextPr: PrivateBetaIssueLogNextPr;
  severity: PrivateBetaIssueSeverity;
  status: PrivateBetaIssueStatus;
};

const typeSmoke: PrivateBetaIssueLogTypeSurface = {
  version: VISUAL_LEXICON_PRIVATE_BETA_ISSUE_LOG_VERSION,
  template: PRIVATE_BETA_ISSUE_LOG_TEMPLATE,
  verdict: PRIVATE_BETA_ISSUE_LOG_VERDICT,
  intakeField: PRIVATE_BETA_ISSUE_LOG_TEMPLATE.issueIntakeFields[0],
  severityLevel: PRIVATE_BETA_ISSUE_LOG_TEMPLATE.severityLevels[0],
  statusItem: PRIVATE_BETA_ISSUE_LOG_TEMPLATE.statusLifecycle[0],
  routeTaxonomyItem: PRIVATE_BETA_ISSUE_LOG_TEMPLATE.routeTaxonomy[0],
  redactionRule: PRIVATE_BETA_ISSUE_LOG_TEMPLATE.redactionRules[0],
  classification:
    PRIVATE_BETA_ISSUE_LOG_TEMPLATE.featureAreaClassifications[0],
  triageItem: PRIVATE_BETA_ISSUE_LOG_TEMPLATE.ownerTriageChecklist[0],
  rollbackTrigger:
    PRIVATE_BETA_ISSUE_LOG_TEMPLATE.rollbackPauseTriggerMapping[0],
  issueRecord: PRIVATE_BETA_ISSUE_LOG_TEMPLATE.emptyIssueRecord,
  nextPr: PRIVATE_BETA_ISSUE_LOG_TEMPLATE.nextIssueLogPRSequence[0],
  severity: PRIVATE_BETA_ISSUE_SEVERITIES[0],
  status: PRIVATE_BETA_ISSUE_STATUSES[0]
};

function ids<TItem extends { id: string }>(items: readonly TItem[]) {
  return items.map((item) => item.id);
}

function readJsonFile<TValue>(relativePath: string): TValue {
  return JSON.parse(
    readFileSync(join(workspaceRoot, relativePath), "utf8")
  ) as TValue;
}

function readRootPackageDependencies(fileName: "package.json" | "package-lock.json") {
  const parsed = readJsonFile<{
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    packages?: Record<
      string,
      {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        optionalDependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
      }
    >;
  }>(fileName);
  const rootPackage = fileName === "package-lock.json" ? parsed.packages?.[""] : parsed;

  return {
    ...rootPackage?.dependencies,
    ...rootPackage?.devDependencies,
    ...rootPackage?.optionalDependencies,
    ...rootPackage?.peerDependencies
  };
}

function collectFiles(relativeDir: string): string[] {
  const absoluteDir = join(workspaceRoot, relativeDir);

  if (!existsSync(absoluteDir)) {
    return [];
  }

  return readdirSync(absoluteDir).flatMap((entry) => {
    const absolutePath = join(absoluteDir, entry);
    const relativePath = join(relativeDir, entry);

    if (statSync(absolutePath).isDirectory()) {
      return collectFiles(relativePath);
    }

    return [relativePath];
  });
}

function withNoExternalSideEffects<TValue>(callback: () => TValue) {
  const originalFetchDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "fetch"
  );
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "window"
  );
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage"
  );
  const originalProcessEnvDescriptor = Object.getOwnPropertyDescriptor(
    process,
    "env"
  );
  let fetchAccessed = false;
  let windowAccessed = false;
  let localStorageAccessed = false;
  let processEnvAccessed = false;

  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    get() {
      fetchAccessed = true;
      return undefined;
    }
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    get() {
      windowAccessed = true;
      return undefined;
    }
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      localStorageAccessed = true;
      return undefined;
    }
  });

  if (originalProcessEnvDescriptor?.configurable) {
    Object.defineProperty(process, "env", {
      configurable: true,
      get() {
        processEnvAccessed = true;
        return originalProcessEnvDescriptor.value;
      }
    });
  }

  try {
    const value = callback();

    return {
      value,
      sideEffects: {
        fetchAccessed,
        windowAccessed,
        localStorageAccessed,
        processEnvAccessed
      }
    };
  } finally {
    if (originalFetchDescriptor) {
      Object.defineProperty(globalThis, "fetch", originalFetchDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "fetch");
    }

    if (originalWindowDescriptor) {
      Object.defineProperty(globalThis, "window", originalWindowDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }

    if (originalLocalStorageDescriptor) {
      Object.defineProperty(
        globalThis,
        "localStorage",
        originalLocalStorageDescriptor
      );
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }

    if (originalProcessEnvDescriptor?.configurable) {
      Object.defineProperty(process, "env", originalProcessEnvDescriptor);
    }
  }
}

test.describe("private beta issue log", () => {
  test("exports the required typed issue log surface", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      template: {
        branch: "release/private-beta-issue-log-template",
        pullRequest: "#87 Private beta issue log template",
        reportDateKst: "2026-06-16"
      },
      verdict: "Conditional / Manual-only",
      severity: "P0",
      status: "new",
      nextPr: {
        prNumber: 88,
        title: "Private beta final owner signoff"
      }
    });
  });

  test("sets private beta verdict to Conditional / Manual-only and public beta to No-Go", () => {
    expect(getPrivateBetaIssueLogTemplate()).toBe(PRIVATE_BETA_ISSUE_LOG_TEMPLATE);
    expect(getPrivateBetaIssueLogVerdict()).toBe("Conditional / Manual-only");
    expect(getPublicBetaVerdict()).toBe("No-Go");
    expect(PRIVATE_BETA_ISSUE_LOG_VERDICT).toBe("Conditional / Manual-only");
    expect(PUBLIC_BETA_ISSUE_LOG_VERDICT).toBe("No-Go");
    expect(PRIVATE_BETA_ISSUE_LOG_TEMPLATE.currentVerdicts).toEqual({
      ownerControlledPrivateBeta: "Conditional / Manual-only",
      publicPaidBeta: "No-Go"
    });
  });

  test("all required issue fields exist on intake fields and the record template", () => {
    expect(PRIVATE_BETA_ISSUE_LOG_TEMPLATE.requiredIssueFields).toEqual([
      ...PRIVATE_BETA_REQUIRED_ISSUE_FIELD_KEYS
    ]);
    expect(getIssueIntakeFields().map((field) => field.key)).toEqual([
      ...PRIVATE_BETA_REQUIRED_ISSUE_FIELD_KEYS
    ]);

    for (const field of getIssueIntakeFields()) {
      expect(field.required, field.key).toBe(true);
      expect(field.description.length, field.key).toBeGreaterThan(0);
    }

    for (const fieldKey of PRIVATE_BETA_REQUIRED_ISSUE_FIELD_KEYS) {
      expect(
        PRIVATE_BETA_ISSUE_LOG_TEMPLATE.emptyIssueRecord,
        fieldKey
      ).toHaveProperty(fieldKey);
    }
  });

  test("severity levels include P0 P1 and P2 with launch impact", () => {
    expect(getIssueSeverityLevels().map((item) => item.severity)).toEqual([
      ...PRIVATE_BETA_ISSUE_SEVERITIES
    ]);

    const p0 = getIssueSeverityLevels().find((item) => item.severity === "P0");
    const p1 = getIssueSeverityLevels().find((item) => item.severity === "P1");
    const p2 = getIssueSeverityLevels().find((item) => item.severity === "P2");

    expect(p0).toMatchObject({ blocksLaunchIfUnresolved: true });
    expect(p0?.description).toContain("payment/entitlement confusion");
    expect(p0?.description).toContain("cannot review/save");
    expect(p1).toMatchObject({ blocksLaunchIfUnresolved: true });
    expect(p1?.description).toContain("Major learning loop break");
    expect(p2).toMatchObject({ blocksLaunchIfUnresolved: false });
    expect(p2?.description).toContain("Polish");
  });

  test("status lifecycle exists", () => {
    expect(getIssueStatusLifecycle().map((item) => item.status)).toEqual([
      ...PRIVATE_BETA_ISSUE_STATUSES
    ]);

    expect(
      getIssueStatusLifecycle().find((item) => item.status === "beta-blocker")
    ).toMatchObject({
      betaBlocking: true,
      terminal: false
    });
    expect(
      getIssueStatusLifecycle().find(
        (item) => item.status === "wont-fix-for-beta"
      )
    ).toMatchObject({
      terminal: true,
      betaBlocking: false
    });
  });

  test("route taxonomy reproduction browser device localStorage and evidence fields exist", () => {
    expect(getIssueRouteTaxonomy().map((item) => item.route)).toEqual([
      ...PRIVATE_BETA_REQUIRED_ROUTE_VALUES
    ]);
    expect(
      PRIVATE_BETA_ISSUE_LOG_TEMPLATE.reproductionStepsTemplate.map(
        (item) => item.id
      )
    ).toEqual([
      "repro_starting_context",
      "repro_actions",
      "repro_expected",
      "repro_actual",
      "repro_repeatability"
    ]);
    expect(
      PRIVATE_BETA_ISSUE_LOG_TEMPLATE.browserDeviceFields.map((item) => item.key)
    ).toEqual(["browser", "device", "viewport"]);
    expect(
      PRIVATE_BETA_ISSUE_LOG_TEMPLATE.localStorageProbeFields.map(
        (item) => item.storageKey
      )
    ).toEqual([...PRIVATE_BETA_REQUIRED_LOCAL_STORAGE_KEYS]);

    for (const probe of PRIVATE_BETA_ISSUE_LOG_TEMPLATE.localStorageProbeFields) {
      expect(probe.rawValueLoggingAllowed, probe.storageKey).toBe(false);
      expect(probe.participantValueCaptureAllowed, probe.storageKey).toBe(false);
      expect(probe.redactionRequired, probe.storageKey).toBe(true);
    }

    expect(
      PRIVATE_BETA_ISSUE_LOG_TEMPLATE.screenshotVideoEvidenceFields[0]
    ).toMatchObject({
      key: "screenshotOrVideoReference",
      required: true,
      redactionRequired: true,
      rawPersonalOrPaymentDataAllowed: false
    });
  });

  test("redaction rules block raw payment provider secrets and localStorage dumps", () => {
    const blockedDataTypes = getIssueRedactionRules().flatMap(
      (rule) => rule.blockedDataTypes
    );

    expect(blockedDataTypes).toEqual(
      expect.arrayContaining([...PRIVATE_BETA_REQUIRED_REDACTION_BLOCKS])
    );

    for (const rule of getIssueRedactionRules()) {
      expect(rule.publicDocsAllowed, rule.id).toBe(false);
      expect(rule.requiredReplacement.length, rule.id).toBeGreaterThan(0);
      expect(rule.ownerAction.length, rule.id).toBeGreaterThan(0);
    }
  });

  test("feature-area classifications exist", () => {
    expect(getIssueFeatureAreaClassifications().map((item) => item.id)).toEqual([
      ...PRIVATE_BETA_REQUIRED_FEATURE_AREAS
    ]);

    expect(
      getIssueFeatureAreaClassifications().find(
        (item) => item.id === "payment_entitlement"
      )
    ).toMatchObject({
      defaultSeverity: "P0",
      flags: {
        paymentRelated: true,
        entitlementRelated: true,
        accountSyncRelated: false
      }
    });
    expect(
      getIssueFeatureAreaClassifications().find(
        (item) => item.id === "account_sync_local_state"
      )
    ).toMatchObject({
      defaultSeverity: "P0",
      flags: {
        accountSyncRelated: true,
        dataLossRisk: true
      }
    });
    expect(
      getIssueFeatureAreaClassifications().find(
        (item) => item.id === "review_srs"
      )?.examples.join(" ")
    ).toContain("review answers do not create events");
    expect(
      getIssueFeatureAreaClassifications().find(
        (item) => item.id === "pack_pricing_paywall"
      )?.examples.join(" ")
    ).toContain("pricing copy implies public paid beta");
    expect(
      getIssueFeatureAreaClassifications().find(
        (item) => item.id === "support_refund_privacy"
      )?.examples.join(" ")
    ).toContain("privacy/localStorage disclosure is missing");
  });

  test("owner triage checklist rollback mapping duplicate escalation and closeout exist", () => {
    expect(ids(getOwnerTriageChecklist())).toEqual([
      ...PRIVATE_BETA_REQUIRED_TRIAGE_IDS
    ]);
    expect(ids(getRollbackPauseTriggerMapping())).toEqual([
      ...PRIVATE_BETA_REQUIRED_ROLLBACK_TRIGGER_IDS
    ]);
    expect(ids(PRIVATE_BETA_ISSUE_LOG_TEMPLATE.duplicateIssueHandling)).toEqual([
      ...PRIVATE_BETA_REQUIRED_DUPLICATE_IDS
    ]);
    expect(ids(PRIVATE_BETA_ISSUE_LOG_TEMPLATE.unresolvedIssueEscalation)).toEqual([
      ...PRIVATE_BETA_REQUIRED_ESCALATION_IDS
    ]);
    expect(ids(PRIVATE_BETA_ISSUE_LOG_TEMPLATE.closeoutCriteria)).toEqual([
      ...PRIVATE_BETA_REQUIRED_CLOSEOUT_IDS
    ]);

    for (const item of getOwnerTriageChecklist()) {
      expect(item.requiredForNewIssue, item.id).toBe(true);
      expect(item.blocksCloseoutIfMissing, item.id).toBe(true);
    }

    expect(getRollbackPauseTriggerMapping()[0]).toMatchObject({
      id: "pause_on_broken_save_or_review",
      severity: "P0",
      pauseInvites: true,
      pausePaymentRequests: true,
      markBetaBlocker: true
    });
  });

  test("first 24-hour and 7-day review usage exists", () => {
    expect(PRIVATE_BETA_ISSUE_LOG_TEMPLATE.first24HourReviewUsage).toMatchObject({
      id: "first_24_hour_issue_log_review",
      cadence: "first_24_hours",
      required: true
    });
    expect(PRIVATE_BETA_ISSUE_LOG_TEMPLATE.sevenDayReviewUsage).toMatchObject({
      id: "seven_day_issue_log_review",
      cadence: "first_7_days",
      required: true
    });
    expect(
      PRIVATE_BETA_ISSUE_LOG_TEMPLATE.first24HourReviewUsage.ownerAction
    ).toContain("continue, pause, or stop");
    expect(
      PRIVATE_BETA_ISSUE_LOG_TEMPLATE.sevenDayReviewUsage.ownerAction
    ).toContain("Weekly Reviewed Words");
  });

  test("next issue log PR sequence starts with #88 final owner signoff", () => {
    expect(getNextIssueLogPRSequence().map((item) => item.prNumber)).toEqual([
      ...PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS
    ]);
    expect(getNextIssueLogPRSequence().map((item) => item.title)).toEqual([
      ...PRIVATE_BETA_REQUIRED_NEXT_PR_TITLES
    ]);
    expect(getNextIssueLogPRSequence()[0]).toMatchObject({
      prNumber: 88,
      title: "Private beta final owner signoff",
      docsContractsTestsOnlyRecommended: true,
      realCheckoutAllowed: false,
      automaticEntitlementAllowed: false,
      realAccountSyncAllowed: false,
      monitoringSdkAllowed: false,
      issueTrackerIntegrationAllowed: false
    });
  });

  test("safety policy keeps docs contracts tests scope closed", () => {
    expect(PRIVATE_BETA_ISSUE_LOG_SAFETY_POLICY.docsContractsTestsOnly).toBe(true);

    for (const field of PRIVATE_BETA_REQUIRED_SAFETY_FIELDS) {
      expect(PRIVATE_BETA_ISSUE_LOG_SAFETY_POLICY[field], field).toBe(false);
    }
  });

  test("no automatic GitHub issue creation or issue tracker integration is introduced", () => {
    expect(PRIVATE_BETA_ISSUE_LOG_SAFETY_POLICY.githubIssueCreationAllowed).toBe(
      false
    );
    expect(PRIVATE_BETA_ISSUE_LOG_SAFETY_POLICY.githubApiUsageAllowed).toBe(false);
    expect(
      PRIVATE_BETA_ISSUE_LOG_SAFETY_POLICY.issueTrackerIntegrationAllowed
    ).toBe(false);

    const contractText = readFileSync(
      join(
        workspaceRoot,
        "src",
        "lib",
        "private-beta-issue-log",
        "private-beta-issue-log.ts"
      ),
      "utf8"
    );

    expect(contractText).not.toMatch(/\bcreateGitHubIssue\b/);
    expect(contractText).not.toMatch(/\bcreateIssue\b/);
    expect(contractText).not.toMatch(/\bissues\.create\b/);
    expect(contractText).not.toMatch(/\bgithub\.rest\.issues\b/i);
    expect(contractText).not.toMatch(/from ["']@octokit\//);
    expect(contractText).not.toMatch(/from ["']octokit/);
  });

  test("forbidden integrations are not introduced", () => {
    for (const relativePath of PRIVATE_BETA_FORBIDDEN_ACTUAL_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }

    const appRouteHandlers = collectFiles("src/app").filter(
      (relativePath) => basename(relativePath) === "route.ts"
    );

    expect(appRouteHandlers.map((path) => path.split("\\").join("/"))).toEqual([
      "src/app/api/account/sync/digest/route.ts",
      "src/app/api/account/sync/preview/route.ts",
      "src/app/api/me/entitlements/route.ts",
      "src/app/auth/confirm/route.ts"
    ]);

    for (const fileName of ["package.json", "package-lock.json"] as const) {
      const dependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of PRIVATE_BETA_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(
          dependencies,
          `${fileName} should not add ${dependencyName}`
        ).not.toHaveProperty(dependencyName);
      }
    }
  });

  test("private beta issue log module files contain no runtime integration patterns", () => {
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\s*\(/,
      /\bwindow\.localStorage\b/,
      /\blocalStorage\.getItem\b/,
      /\blocalStorage\.setItem\b/,
      /\bprocess\.env\b/,
      /from ["']@octokit\//,
      /from ["']octokit/,
      /from ["']@sendgrid\//,
      /from ["']@mailchimp\//,
      /from ["']mailgun\.js/,
      /from ["']nodemailer/,
      /from ["']resend/,
      /from ["']@slack\//,
      /from ["']discord\.js/,
      /from ["']@discordjs\//,
      /from ["']@sentry\//,
      /from ["']posthog-js/,
      /from ["']@datadog\//,
      /from ["']newrelic/,
      /from ["']winston/,
      /from ["']pino/,
      /from ["']@supabase\//,
      /from ["']@neondatabase\//,
      /from ["']@vercel\/postgres/,
      /from ["']firebase/,
      /from ["']@firebase\//,
      /from ["']prisma/,
      /from ["']@prisma\//,
      /from ["']drizzle/,
      /from ["']drizzle-orm/,
      /from ["']pg/,
      /from ["']postgres/,
      /from ["']mysql/,
      /from ["']sqlite/,
      /from ["']@cloudflare\/d1/,
      /from ["']@clerk\//,
      /from ["']@auth\//,
      /from ["']next-auth/,
      /from ["']better-auth/,
      /from ["']stripe/,
      /from ["']paddle/,
      /from ["']openai/,
      /from ["']@ai-sdk\/openai/,
      /\bcreateRouteHandler\b/
    ];

    for (const relativePath of PRIVATE_BETA_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test("runtime app routes and components do not import the issue log", () => {
    for (const scanDir of PRIVATE_BETA_RUNTIME_SCAN_DIRS) {
      for (const relativePath of collectFiles(scanDir)) {
        if (!/\.(ts|tsx)$/.test(relativePath)) {
          continue;
        }

        const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

        expect(fileText, relativePath).not.toContain("private-beta-issue-log");
        expect(fileText, relativePath).not.toContain(
          "PRIVATE_BETA_ISSUE_LOG_TEMPLATE"
        );
      }
    }
  });

  test("helpers are pure static reads", () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      privateVerdict: getPrivateBetaIssueLogVerdict(),
      publicVerdict: getPublicBetaVerdict(),
      intakeFieldKeys: getIssueIntakeFields().map((item) => item.key),
      severityIds: getIssueSeverityLevels().map((item) => item.severity),
      statuses: getIssueStatusLifecycle().map((item) => item.status),
      routeValues: getIssueRouteTaxonomy().map((item) => item.route),
      redactionRuleIds: getIssueRedactionRules().map((item) => item.id),
      classificationIds: getIssueFeatureAreaClassifications().map(
        (item) => item.id
      ),
      triageIds: ids(getOwnerTriageChecklist()),
      rollbackIds: ids(getRollbackPauseTriggerMapping()),
      nextPrNumbers: getNextIssueLogPRSequence().map((item) => item.prNumber)
    }));

    expect(value).toEqual({
      privateVerdict: "Conditional / Manual-only",
      publicVerdict: "No-Go",
      intakeFieldKeys: [...PRIVATE_BETA_REQUIRED_ISSUE_FIELD_KEYS],
      severityIds: [...PRIVATE_BETA_ISSUE_SEVERITIES],
      statuses: [...PRIVATE_BETA_ISSUE_STATUSES],
      routeValues: [...PRIVATE_BETA_REQUIRED_ROUTE_VALUES],
      redactionRuleIds: [
        "redact_raw_payment_data",
        "redact_provider_tokens",
        "redact_secrets",
        "redact_raw_email_address",
        "redact_raw_local_storage_dump",
        "redact_personal_screenshot_or_video"
      ],
      classificationIds: [...PRIVATE_BETA_REQUIRED_FEATURE_AREAS],
      triageIds: [...PRIVATE_BETA_REQUIRED_TRIAGE_IDS],
      rollbackIds: [...PRIVATE_BETA_REQUIRED_ROLLBACK_TRIGGER_IDS],
      nextPrNumbers: [...PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS]
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      windowAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false
    });
  });

  test("README and docs links exist", () => {
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(
      join(workspaceRoot, "docs", "PRIVATE_BETA_ISSUE_LOG_TEMPLATE.md"),
      "utf8"
    );
    const moduleReadme = readFileSync(
      join(workspaceRoot, "src", "lib", "private-beta-issue-log", "README.md"),
      "utf8"
    );

    for (const relativePath of PRIVATE_BETA_DOC_FILES) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(true);
    }

    expect(readme).toContain(
      "[Private Beta Issue Log Template](docs/PRIVATE_BETA_ISSUE_LOG_TEMPLATE.md)"
    );

    for (const section of PRIVATE_BETA_REQUIRED_DOC_SECTIONS) {
      expect(doc, section).toContain(section);
    }

    expect(doc).toContain(
      "Owner-controlled private beta: **Conditional / Manual-only**"
    );
    expect(doc).toContain("Public paid beta: **No-Go**");
    expect(doc).toContain("raw payment data");
    expect(doc).toContain("provider tokens");
    expect(doc).toContain("secrets");
    expect(doc).toContain("raw localStorage dumps");
    expect(doc).toContain("manual/payment-link-only");
    expect(doc).toContain("no automatic entitlement");
    expect(doc).toContain("real account sync");
    expect(doc).toContain(
      "Recommended next PR: **#88 Private beta final owner signoff**"
    );
    expect(moduleReadme).toContain("pure static TypeScript data");
    expect(moduleReadme).toContain("does not create GitHub issues");
  });
});
