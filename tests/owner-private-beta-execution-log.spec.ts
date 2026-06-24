import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  OWNER_PRIVATE_BETA_EXECUTION_OWNER_VERDICT,
  OWNER_PRIVATE_BETA_EXECUTION_PUBLIC_VERDICT,
  OWNER_RUN_PRIVATE_BETA_EXECUTION_LOG,
  VISUAL_LEXICON_OWNER_PRIVATE_BETA_EXECUTION_LOG_VERSION,
  getBatchMetadata,
  getExecutionPauseRollbackTriggers,
  getExecutionState,
  getFirst24HourReviewPlan,
  getFirst7DayReviewPlan,
  getInviteExecutionChecklist,
  getIssueLogReference,
  getLocalStateAccountSyncLimitationConfirmation,
  getManualPaymentNoAutomaticEntitlementConfirmation,
  getNextExecutionLogPRSequence,
  getOwnerControlledPrivateBetaVerdict,
  getOwnerDecisionNotes,
  getOwnerRunPrivateBetaExecutionLog,
  getParticipantCommunicationConfirmations,
  getParticipantRedactionRules,
  getPrivateBetaSuccessMetrics,
  getPublicBetaVerdict,
  getSmokeCheckConfirmationBeforeInvite,
  getSupportPrivacyPaymentConfirmations,
  type OwnerPrivateBetaBatchMetadata,
  type OwnerPrivateBetaExecutionLog,
  type OwnerPrivateBetaExecutionLogVersion,
  type OwnerPrivateBetaExecutionState
} from "../src/lib/owner-private-beta-execution-log/owner-private-beta-execution-log";
import {
  OWNER_PRIVATE_BETA_ALLOWED_ZERO_COUNT_STATES,
  OWNER_PRIVATE_BETA_BATCH_ZERO_COUNT_KEYS,
  OWNER_PRIVATE_BETA_DOC_LINK_TEXTS,
  OWNER_PRIVATE_BETA_FORBIDDEN_ACTUAL_PATHS,
  OWNER_PRIVATE_BETA_FORBIDDEN_DIRECT_DEPENDENCIES,
  OWNER_PRIVATE_BETA_FORBIDDEN_RAW_DATA_KEYS,
  OWNER_PRIVATE_BETA_FORBIDDEN_SECRET_VALUE_PATTERNS,
  OWNER_PRIVATE_BETA_MODULE_FILES,
  OWNER_PRIVATE_BETA_REQUIRED_COMMUNICATION_CONFIRMATION_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_DOC_FILES,
  OWNER_PRIVATE_BETA_REQUIRED_DOC_SECTIONS,
  OWNER_PRIVATE_BETA_REQUIRED_EXECUTION_STATE,
  OWNER_PRIVATE_BETA_REQUIRED_EXECUTION_STATES,
  OWNER_PRIVATE_BETA_REQUIRED_INVITE_CHECKLIST_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS,
  OWNER_PRIVATE_BETA_REQUIRED_NEXT_PR_TITLES,
  OWNER_PRIVATE_BETA_REQUIRED_PARTICIPANT_CAP,
  OWNER_PRIVATE_BETA_REQUIRED_PAUSE_ROLLBACK_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_REDACTION_RULE_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_REVIEW_24H_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_REVIEW_7D_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_RUNTIME_SCAN_DIRS,
  OWNER_PRIVATE_BETA_REQUIRED_SAFETY_FIELDS,
  OWNER_PRIVATE_BETA_REQUIRED_SUCCESS_METRIC_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_SUCCESS_METRIC_LABELS,
  OWNER_PRIVATE_BETA_REQUIRED_SUPPORT_PRIVACY_PAYMENT_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_VALIDATION_COMMANDS,
  OWNER_PRIVATE_BETA_REQUIRED_VERDICTS
} from "../src/lib/owner-private-beta-execution-log/fixtures";

const workspaceRoot = process.cwd();

type OwnerPrivateBetaExecutionLogTypeSurface = {
  version: OwnerPrivateBetaExecutionLogVersion;
  log: OwnerPrivateBetaExecutionLog;
  state: OwnerPrivateBetaExecutionState;
  batch: OwnerPrivateBetaBatchMetadata;
};

const typeSmoke: OwnerPrivateBetaExecutionLogTypeSurface = {
  version: VISUAL_LEXICON_OWNER_PRIVATE_BETA_EXECUTION_LOG_VERSION,
  log: OWNER_RUN_PRIVATE_BETA_EXECUTION_LOG,
  state: getExecutionState(),
  batch: getBatchMetadata()
};

function ids<TItem extends { id: string }>(items: readonly TItem[]) {
  return items.map((item) => item.id);
}

function readJsonFile<TValue>(relativePath: string): TValue {
  return JSON.parse(readFileSync(join(workspaceRoot, relativePath), "utf8")) as TValue;
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
    ...(rootPackage?.dependencies ?? {}),
    ...(rootPackage?.devDependencies ?? {}),
    ...(rootPackage?.optionalDependencies ?? {}),
    ...(rootPackage?.peerDependencies ?? {})
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

function collectObjectKeys(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectObjectKeys(item));
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [
      key,
      ...collectObjectKeys(child)
    ]);
  }

  return [];
}

function withNoExternalSideEffects<TValue>(callback: () => TValue) {
  const originalFetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage"
  );
  const originalProcessEnvDescriptor = Object.getOwnPropertyDescriptor(process, "env");

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
      sideEffects: {
        fetchAccessed,
        windowAccessed,
        localStorageAccessed,
        processEnvAccessed
      },
      value
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
      Object.defineProperty(globalThis, "localStorage", originalLocalStorageDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }

    if (originalProcessEnvDescriptor?.configurable) {
      Object.defineProperty(process, "env", originalProcessEnvDescriptor);
    }
  }
}

test.describe("owner-run private beta execution log", () => {
  test("exports the required typed execution log surface", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      log: {
        branch: "release/owner-run-private-beta-execution-log",
        pullRequest: "#91 Owner-run private beta execution log",
        reportDateKst: "2026-06-17",
        executionState: "Ready to Execute"
      },
      state: "Ready to Execute",
      batch: {
        batchId: "batch-0",
        plannedParticipantCap: 10
      }
    });
  });

  test("owner-controlled private beta verdict remains proceed/manual and public paid beta remains no-go", () => {
    const log = getOwnerRunPrivateBetaExecutionLog();

    expect(log.currentVerdicts).toEqual(OWNER_PRIVATE_BETA_REQUIRED_VERDICTS);
    expect(log.ownerControlledPrivateBetaVerdict).toBe(OWNER_PRIVATE_BETA_EXECUTION_OWNER_VERDICT);
    expect(log.publicPaidBetaVerdict).toBe(OWNER_PRIVATE_BETA_EXECUTION_PUBLIC_VERDICT);
    expect(getOwnerControlledPrivateBetaVerdict()).toBe(
      "Proceed / Conditional Manual Launch"
    );
    expect(getPublicBetaVerdict()).toBe("No-Go");
    expect(log.currentVerdicts.publicSignup).toBe("Blocked");
    expect(log.currentVerdicts.publicCheckout).toBe("Blocked");
    expect(log.currentVerdicts.automaticEntitlement).toBe("Blocked");
    expect(log.currentVerdicts.realAccountSync).toBe("Blocked");
  });

  test("execution state exists and is honest for Batch 0", () => {
    const log = getOwnerRunPrivateBetaExecutionLog();
    const batch = getBatchMetadata();

    expect(log.executionStates.map((item) => item.state)).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_EXECUTION_STATES
    ]);
    expect(getExecutionState()).toBe(OWNER_PRIVATE_BETA_REQUIRED_EXECUTION_STATE);
    expect(log.executionStateRationale).toContain("has not sent invites");
    expect(batch.batchId).toBe("batch-0");
    expect(batch.realInvitationsSent).toBe(false);
    expect(batch.invitationEvidenceRecorded).toBe(false);
    expect(batch.participantAcceptanceEvidenceRecorded).toBe(false);
    expect(batch.paymentEvidenceRecorded).toBe(false);
    expect(batch.entitlementEvidenceRecorded).toBe(false);

    if (OWNER_PRIVATE_BETA_ALLOWED_ZERO_COUNT_STATES.includes(log.executionState)) {
      for (const countKey of OWNER_PRIVATE_BETA_BATCH_ZERO_COUNT_KEYS) {
        expect(batch[countKey], countKey).toBe(0);
      }
    }
  });

  test("batch metadata exists and participant cap is 5 to 20", () => {
    const batch = getBatchMetadata();

    expect(batch.plannedParticipantCap).toBeGreaterThanOrEqual(
      OWNER_PRIVATE_BETA_REQUIRED_PARTICIPANT_CAP.minimum
    );
    expect(batch.plannedParticipantCap).toBeLessThanOrEqual(
      OWNER_PRIVATE_BETA_REQUIRED_PARTICIPANT_CAP.maximum
    );
    expect(batch.invitedParticipantCount).toBe(0);
    expect(batch.acceptedParticipantCount).toBe(0);
    expect(batch.paymentConfirmedCount).toBe(0);
    expect(batch.manualEntitlementRecordedCount).toBe(0);
  });

  test("participant redaction rules and invite execution checklist exist", () => {
    expect(ids(getParticipantRedactionRules())).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_REDACTION_RULE_IDS
    ]);
    for (const rule of getParticipantRedactionRules()) {
      expect(rule.rawPersonalDataAllowed).toBe(false);
      expect(rule.rawContactAllowed).toBe(false);
      expect(rule.rawPaymentPayloadAllowed).toBe(false);
      expect(rule.providerCredentialAllowed).toBe(false);
    }

    expect(ids(getInviteExecutionChecklist())).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_INVITE_CHECKLIST_IDS
    ]);
    for (const item of getInviteExecutionChecklist()) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.evidenceRequirement.length).toBeGreaterThan(0);
    }
    expect(
      getInviteExecutionChecklist().filter((item) => item.requiredBeforeFirstInvite)
        .length
    ).toBeGreaterThan(0);
  });

  test("participant communication confirmations exist", () => {
    const confirmations = getParticipantCommunicationConfirmations();

    expect(ids(confirmations)).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_COMMUNICATION_CONFIRMATION_IDS
    ]);
    for (const confirmation of confirmations) {
      expect(confirmation.requiredBeforeFirstInvite).toBe(true);
      expect(["not_sent", "ready_to_send"]).toContain(confirmation.deliveryState);
      expect(confirmation.confirmation.length).toBeGreaterThan(0);
    }
    expect(confirmations.map((item) => item.label).join(" ")).toContain(
      "Local-state"
    );
    expect(confirmations.map((item) => item.label).join(" ")).toContain(
      "Manual payment"
    );
  });

  test("support, refund, privacy, local-state, and manual-payment confirmations exist", () => {
    const confirmations = getSupportPrivacyPaymentConfirmations();

    expect(ids(confirmations)).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_SUPPORT_PRIVACY_PAYMENT_IDS
    ]);
    expect(confirmations.map((item) => item.category)).toEqual([
      "support",
      "refund",
      "privacy",
      "local_state_account_sync",
      "manual_payment_no_automatic_entitlement"
    ]);

    for (const confirmation of confirmations) {
      expect(confirmation.requiredBeforeFirstInvite).toBe(true);
      expect(confirmation.confirmation.length).toBeGreaterThan(0);
      expect(confirmation.ownerEvidenceRequired.length).toBeGreaterThan(0);
    }

    expect(getLocalStateAccountSyncLimitationConfirmation()).toMatchObject({
      category: "local_state_account_sync",
      status: "ready"
    });
    expect(getManualPaymentNoAutomaticEntitlementConfirmation()).toMatchObject({
      category: "manual_payment_no_automatic_entitlement",
      status: "ready"
    });
  });

  test("smoke check, issue log, review plans, and pause/rollback triggers exist", () => {
    expect(getSmokeCheckConfirmationBeforeInvite()).toMatchObject({
      requiredBeforeFirstInvite: true,
      sourceDocPath: "docs/PRIVATE_BETA_DRY_RUN_SMOKE_EVIDENCE.md"
    });
    expect(getIssueLogReference()).toMatchObject({
      docPath: "docs/PRIVATE_BETA_ISSUE_LOG_TEMPLATE.md",
      activeIssueCount: 0,
      p0IssueCount: 0,
      p1IssueCount: 0,
      externalIssueTrackerIntegrationAllowed: false
    });

    expect(ids(getFirst24HourReviewPlan())).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_REVIEW_24H_IDS
    ]);
    expect(ids(getFirst7DayReviewPlan())).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_REVIEW_7D_IDS
    ]);
    expect(ids(getExecutionPauseRollbackTriggers())).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_PAUSE_ROLLBACK_IDS
    ]);

    for (const trigger of getExecutionPauseRollbackTriggers()) {
      expect(trigger.pauseInvites).toBe(true);
      expect(trigger.trigger.length).toBeGreaterThan(0);
      expect(trigger.rollbackAction.length).toBeGreaterThan(0);
    }
  });

  test("success metrics include Weekly Reviewed Words", () => {
    const successMetrics = getPrivateBetaSuccessMetrics();

    expect(successMetrics.map((metric) => metric.id)).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_SUCCESS_METRIC_IDS
    ]);
    expect(successMetrics.map((metric) => metric.label)).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_SUCCESS_METRIC_LABELS
    ]);
    expect(successMetrics.map((metric) => metric.label)).toContain(
      "Weekly Reviewed Words"
    );
    for (const metric of successMetrics) {
      expect(metric.preparedForBatch0).toBe(true);
      expect(metric.evidenceRequirement).toContain("real");
    }
  });

  test("owner decision notes and next PR sequence are present", () => {
    expect(getOwnerDecisionNotes().map((item) => item.recordsExecutionEvidence)).toEqual([
      false,
      false,
      false
    ]);

    const sequence = getNextExecutionLogPRSequence();
    expect(sequence.map((item) => item.prNumber)).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS
    ]);
    expect(sequence.map((item) => item.title)).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_NEXT_PR_TITLES
    ]);
    expect(sequence[0]).toMatchObject({
      prNumber: 92,
      title: "24-hour private beta review",
      docsContractsTestsOnlyRecommended: true,
      realCheckoutAllowed: false,
      automaticEntitlementAllowed: false,
      realAccountSyncAllowed: false,
      productionDeploymentChangesAllowed: false
    });
  });

  test("no raw participant, payment, provider, or secret fields are allowed", () => {
    const log = getOwnerRunPrivateBetaExecutionLog();
    const allKeys = collectObjectKeys(log);
    const serializedLog = JSON.stringify(log);

    for (const forbiddenKey of OWNER_PRIVATE_BETA_FORBIDDEN_RAW_DATA_KEYS) {
      expect(allKeys, forbiddenKey).not.toContain(forbiddenKey);
    }

    for (const patternText of OWNER_PRIVATE_BETA_FORBIDDEN_SECRET_VALUE_PATTERNS) {
      expect(serializedLog, patternText).not.toMatch(new RegExp(patternText, "i"));
    }

    expect(serializedLog).not.toMatch(/\b\d{13,19}\b/);
    expect(getBatchMetadata().paymentConfirmedCount).toBe(0);
    expect(getBatchMetadata().manualEntitlementRecordedCount).toBe(0);
  });

  test("forbidden integrations are not introduced", () => {
    for (const relativePath of OWNER_PRIVATE_BETA_FORBIDDEN_ACTUAL_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }

    const appRouteHandlers = collectFiles("src/app").filter(
      (relativePath) => basename(relativePath) === "route.ts"
    );
    expect(appRouteHandlers.map((path) => path.split("\\").join("/"))).toEqual([
      "src/app/api/me/entitlements/route.ts",
      "src/app/auth/confirm/route.ts"
    ]);

    for (const fileName of ["package.json", "package-lock.json"] as const) {
      const dependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of OWNER_PRIVATE_BETA_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(
          dependencies,
          `${fileName} should not include ${dependencyName}`
        ).not.toHaveProperty(dependencyName);
      }
    }

    for (const scanDir of OWNER_PRIVATE_BETA_REQUIRED_RUNTIME_SCAN_DIRS) {
      for (const relativePath of collectFiles(scanDir)) {
        if (!/\.(ts|tsx)$/.test(relativePath)) {
          continue;
        }

        const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");
        expect(fileText, relativePath).not.toContain(
          "owner-private-beta-execution-log"
        );
        expect(fileText, relativePath).not.toContain(
          "OWNER_RUN_PRIVATE_BETA_EXECUTION_LOG"
        );
      }
    }
  });

  test("module files contain no runtime integration patterns", () => {
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\s*\(/,
      /\bwindow\.localStorage\b/,
      /\blocalStorage\.getItem\b/,
      /\blocalStorage\.setItem\b/,
      /\bprocess\.env\b/
    ];

    for (const relativePath of OWNER_PRIVATE_BETA_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const pattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  test("helpers are pure static reads", () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      state: getExecutionState(),
      publicVerdict: getPublicBetaVerdict(),
      ownerVerdict: getOwnerControlledPrivateBetaVerdict(),
      batchId: getBatchMetadata().batchId,
      checklistIds: getInviteExecutionChecklist().map((item) => item.id),
      communicationIds: getParticipantCommunicationConfirmations().map(
        (item) => item.id
      ),
      confirmationIds: getSupportPrivacyPaymentConfirmations().map((item) => item.id),
      triggerIds: getExecutionPauseRollbackTriggers().map((item) => item.id),
      metricLabels: getPrivateBetaSuccessMetrics().map((item) => item.label),
      nextPrs: getNextExecutionLogPRSequence().map((item) => item.prNumber)
    }));

    expect(value).toEqual({
      state: "Ready to Execute",
      publicVerdict: "No-Go",
      ownerVerdict: "Proceed / Conditional Manual Launch",
      batchId: "batch-0",
      checklistIds: [...OWNER_PRIVATE_BETA_REQUIRED_INVITE_CHECKLIST_IDS],
      communicationIds: [
        ...OWNER_PRIVATE_BETA_REQUIRED_COMMUNICATION_CONFIRMATION_IDS
      ],
      confirmationIds: [
        ...OWNER_PRIVATE_BETA_REQUIRED_SUPPORT_PRIVACY_PAYMENT_IDS
      ],
      triggerIds: [...OWNER_PRIVATE_BETA_REQUIRED_PAUSE_ROLLBACK_IDS],
      metricLabels: [...OWNER_PRIVATE_BETA_REQUIRED_SUCCESS_METRIC_LABELS],
      nextPrs: [...OWNER_PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS]
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
      join(workspaceRoot, "docs", "OWNER_RUN_PRIVATE_BETA_EXECUTION_LOG.md"),
      "utf8"
    );
    const moduleReadme = readFileSync(
      join(workspaceRoot, "src", "lib", "owner-private-beta-execution-log", "README.md"),
      "utf8"
    );

    for (const relativePath of OWNER_PRIVATE_BETA_REQUIRED_DOC_FILES) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(true);
    }

    for (const linkText of OWNER_PRIVATE_BETA_DOC_LINK_TEXTS) {
      expect(readme).toContain(linkText);
    }

    for (const section of OWNER_PRIVATE_BETA_REQUIRED_DOC_SECTIONS) {
      expect(doc, `missing section ${section}`).toContain(section);
    }

    expect(doc).toContain("Owner-controlled private beta: **Proceed / Conditional Manual Launch**");
    expect(doc).toContain("Public paid beta: **No-Go**");
    expect(doc).toContain("Execution state: **Ready to Execute**");
    expect(doc).toContain("invitedParticipantCount | `0`");
    expect(doc).toContain("paymentConfirmedCount | `0`");
    expect(doc).toContain("manualEntitlementRecordedCount | `0`");
    expect(doc).toContain("Weekly Reviewed Words");
    expect(doc).toContain("#92 24-hour private beta review");
    expect(moduleReadme).toContain("pure static TypeScript");
  });

  test("validation commands are documented", () => {
    expect(OWNER_PRIVATE_BETA_REQUIRED_VALIDATION_COMMANDS).toEqual([
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- --workers=1",
      "git diff --check"
    ]);
  });

  test("safety policy keeps scope strictly closed", () => {
    const safetyPolicy = getOwnerRunPrivateBetaExecutionLog().safetyPolicy;

    expect(safetyPolicy.docsContractsTestsOnly).toBe(true);
    for (const field of OWNER_PRIVATE_BETA_REQUIRED_SAFETY_FIELDS) {
      expect(safetyPolicy[field], field).toBe(false);
    }
  });
});
