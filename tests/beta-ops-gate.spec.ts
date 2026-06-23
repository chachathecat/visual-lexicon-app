import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import { basename, join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  BETA_OPS_GATE,
  BETA_OPS_PRIVATE_VERDICT,
  BETA_OPS_PUBLIC_VERDICT,
  BETA_OPS_SAFETY_POLICY,
  VISUAL_LEXICON_BETA_OPS_GATE_VERSION,
  getBetaOpsGate,
  getBetaParticipantConsentChecklist,
  getBlockedBetaOpsIntegrations,
  getBrowserSmokeRequirements,
  getConsoleHydrationCaptureRequirements,
  getIncidentLogRequirements,
  getIssueReportingProcess,
  getMonitoringMinimumRequirements,
  getNextBetaOpsPRSequence,
  getOperationalRisks,
  getOwnerBetaOpsChecklist,
  getPauseRollbackCriteria,
  getPrivateBetaOpsVerdict,
  getPublicBetaOpsVerdict,
  getSupportPrivacyRequirements,
  type BetaOpsBlockedIntegration,
  type BetaOpsConsoleHydrationCaptureRequirement,
  type BetaOpsGate,
  type BetaOpsGateSeverity,
  type BetaOpsIncidentLogEntry,
  type BetaOpsIncidentLogRequirements,
  type BetaOpsMonitoringRequirement,
  type BetaOpsNextPR,
  type BetaOpsOperationalRisk,
  type BetaOpsOwnerChecklistItem,
  type BetaOpsParticipantConsentChecklistItem,
  type BetaOpsPauseRollbackCriterion,
  type BetaOpsPrivateVerdict,
  type BetaOpsPublicVerdict,
  type BetaOpsRouteSmokeRequirement,
  type BetaOpsSupportPrivacyRequirement,
  type VisualLexiconBetaOpsGateVersion
} from "../src/lib/beta-ops-gate/beta-ops-gate";
import {
  BETA_OPS_DOC_FILES,
  BETA_OPS_FORBIDDEN_ACTUAL_PATHS,
  BETA_OPS_FORBIDDEN_DIRECT_DEPENDENCIES,
  BETA_OPS_INCIDENT_LOG_ENTRY_FIXTURE,
  BETA_OPS_MODULE_FILES,
  BETA_OPS_REQUIRED_BLOCKED_INTEGRATION_IDS,
  BETA_OPS_REQUIRED_CONSOLE_HYDRATION_CAPTURE_IDS,
  BETA_OPS_REQUIRED_DOC_SECTIONS,
  BETA_OPS_REQUIRED_INCIDENT_LOG_FIELD_KEYS,
  BETA_OPS_REQUIRED_MONITORING_REQUIREMENT_IDS,
  BETA_OPS_REQUIRED_NEXT_PR_NUMBERS,
  BETA_OPS_REQUIRED_NEXT_PR_TITLES,
  BETA_OPS_REQUIRED_OWNER_CHECKLIST_IDS,
  BETA_OPS_REQUIRED_PARTICIPANT_CONSENT_IDS,
  BETA_OPS_REQUIRED_PAUSE_ROLLBACK_IDS,
  BETA_OPS_REQUIRED_ROUTE_SMOKE_PATHS,
  BETA_OPS_REQUIRED_SAFETY_FIELDS,
  BETA_OPS_REQUIRED_SUPPORT_PRIVACY_REQUIREMENT_IDS,
  BETA_OPS_RUNTIME_SCAN_DIRS,
  BETA_OPS_SEVERITIES
} from "../src/lib/beta-ops-gate/fixtures";

const workspaceRoot = process.cwd();

type BetaOpsTypeSurface = {
  version: VisualLexiconBetaOpsGateVersion;
  gate: BetaOpsGate;
  privateVerdict: BetaOpsPrivateVerdict;
  publicVerdict: BetaOpsPublicVerdict;
  monitoringRequirement: BetaOpsMonitoringRequirement;
  routeSmokeRequirement: BetaOpsRouteSmokeRequirement;
  consoleHydrationRequirement: BetaOpsConsoleHydrationCaptureRequirement;
  incidentRequirements: BetaOpsIncidentLogRequirements;
  incidentEntry: BetaOpsIncidentLogEntry;
  supportPrivacyRequirement: BetaOpsSupportPrivacyRequirement;
  participantConsent: BetaOpsParticipantConsentChecklistItem;
  ownerChecklistItem: BetaOpsOwnerChecklistItem;
  pauseRollbackCriterion: BetaOpsPauseRollbackCriterion;
  operationalRisk: BetaOpsOperationalRisk;
  blockedIntegration: BetaOpsBlockedIntegration;
  nextPr: BetaOpsNextPR;
  severity: BetaOpsGateSeverity;
};

const typeSmoke: BetaOpsTypeSurface = {
  version: VISUAL_LEXICON_BETA_OPS_GATE_VERSION,
  gate: BETA_OPS_GATE,
  privateVerdict: BETA_OPS_PRIVATE_VERDICT,
  publicVerdict: BETA_OPS_PUBLIC_VERDICT,
  monitoringRequirement: BETA_OPS_GATE.monitoringMinimumRequirements[0],
  routeSmokeRequirement: BETA_OPS_GATE.browserSmokeRequirements[0],
  consoleHydrationRequirement:
    BETA_OPS_GATE.consoleHydrationCaptureRequirements[0],
  incidentRequirements: BETA_OPS_GATE.incidentLogRequirements,
  incidentEntry: BETA_OPS_INCIDENT_LOG_ENTRY_FIXTURE,
  supportPrivacyRequirement: BETA_OPS_GATE.supportPrivacyRequirements[0],
  participantConsent: BETA_OPS_GATE.betaParticipantConsentChecklist[0],
  ownerChecklistItem: BETA_OPS_GATE.ownerApprovalChecklist[0],
  pauseRollbackCriterion: BETA_OPS_GATE.pauseRollbackCriteria[0],
  operationalRisk: BETA_OPS_GATE.operationalRisks[0],
  blockedIntegration: BETA_OPS_GATE.blockedIntegrations[0],
  nextPr: BETA_OPS_GATE.nextPRSequence[0],
  severity: BETA_OPS_SEVERITIES[0]
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
  const guardedGlobals = [
    "__vlxMonitoringSdk",
    "__vlxAnalyticsSdk",
    "__vlxAuthProviderSdk",
    "__vlxDatabaseSdk",
    "__vlxPaymentSdk",
    "__vlxAiProvider",
    "__vlxWebflowCms",
    "__vlxCloudflareWorkers",
    "__vlxVercelSettings",
    "__vlxDnsProvider",
    "__vlxProductionData"
  ] as const;
  const originalGuardedDescriptors = new Map<string, PropertyDescriptor | undefined>();
  let fetchAccessed = false;
  let windowAccessed = false;
  let localStorageAccessed = false;
  let processEnvAccessed = false;
  let providerSurfaceAccessed = false;

  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    get() {
      fetchAccessed = true;
      return () => {
        throw new Error("beta ops gate must not call network helpers");
      };
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

  for (const name of guardedGlobals) {
    originalGuardedDescriptors.set(
      name,
      Object.getOwnPropertyDescriptor(globalThis, name)
    );
    Object.defineProperty(globalThis, name, {
      configurable: true,
      get() {
        providerSurfaceAccessed = true;
        return undefined;
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
        processEnvAccessed,
        providerSurfaceAccessed
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
      Object.defineProperty(globalThis, "localStorage", originalLocalStorageDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }

    if (originalProcessEnvDescriptor?.configurable) {
      Object.defineProperty(process, "env", originalProcessEnvDescriptor);
    }

    for (const name of guardedGlobals) {
      const descriptor = originalGuardedDescriptors.get(name);

      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, name);
      }
    }
  }
}

test.describe("monitoring support privacy beta ops gate", () => {
  test("exports the required typed beta ops gate surface", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      gate: {
        branch: "release/monitoring-support-privacy-beta-gate",
        pullRequest: "#83 Monitoring, support, privacy beta gate",
        scope: "Track B monitoring support privacy beta operations gate"
      },
      privateVerdict: "Conditional / Manual-only",
      publicVerdict: "No-Go",
      monitoringRequirement: {
        id: "manual_monitoring_only"
      },
      severity: "P0"
    });
  });

  test("keeps private beta Conditional / Manual-only and public beta No-Go", () => {
    expect(getBetaOpsGate()).toBe(BETA_OPS_GATE);
    expect(getPrivateBetaOpsVerdict()).toBe("Conditional / Manual-only");
    expect(getPublicBetaOpsVerdict()).toBe("No-Go");
    expect(BETA_OPS_GATE.privateBetaOperationalReadinessVerdict).toBe(
      "Conditional / Manual-only"
    );
    expect(BETA_OPS_GATE.publicBetaOperationalReadinessVerdict).toBe("No-Go");
    expect(BETA_OPS_GATE.verdicts).toEqual({
      privatePaidBeta: "Conditional / Manual-only",
      publicPaidBeta: "No-Go",
      realMonitoringSdkIntegration: "Blocked in this PR",
      realAnalyticsSdkIntegration: "Blocked in this PR",
      realPaymentIntegration: "Blocked",
      realAccountSync: "Blocked",
      ownerControlledManualBetaOps: "Allowed when checklist is complete"
    });
  });

  test("blocks monitoring SDK analytics SDK payment and real account sync integrations", () => {
    expect(ids(getBlockedBetaOpsIntegrations())).toEqual([
      ...BETA_OPS_REQUIRED_BLOCKED_INTEGRATION_IDS
    ]);

    const blockedById = new Map(
      getBlockedBetaOpsIntegrations().map((entry) => [entry.id, entry])
    );

    expect(blockedById.get("real_monitoring_sdk")).toMatchObject({
      verdict: "Blocked in this PR",
      implementationAllowedInThisPr: false
    });
    expect(blockedById.get("real_analytics_sdk")).toMatchObject({
      verdict: "Blocked in this PR",
      implementationAllowedInThisPr: false
    });
    expect(blockedById.get("real_payment_integration")).toMatchObject({
      verdict: "Blocked",
      implementationAllowedInThisPr: false
    });
    expect(blockedById.get("real_account_sync")).toMatchObject({
      verdict: "Blocked",
      implementationAllowedInThisPr: false
    });
  });

  test("manual monitoring requirements and route smoke checklist exist", () => {
    expect(ids(getMonitoringMinimumRequirements())).toEqual([
      ...BETA_OPS_REQUIRED_MONITORING_REQUIREMENT_IDS
    ]);

    for (const requirement of getMonitoringMinimumRequirements()) {
      expect(requirement).toMatchObject({
        status: "required",
        manualOnly: true,
        requiredBeforeInvites: true,
        blocksPrivateBetaIfMissing: true
      });
    }

    expect(getBrowserSmokeRequirements().map((item) => item.route)).toEqual([
      ...BETA_OPS_REQUIRED_ROUTE_SMOKE_PATHS
    ]);

    for (const smoke of getBrowserSmokeRequirements()) {
      expect(smoke.recordConsoleErrorCount, smoke.route).toBe(true);
      expect(smoke.recordHydrationWarningCount, smoke.route).toBe(true);
    }
  });

  test("console hydration capture and stale dev server mitigation are required", () => {
    expect(ids(getConsoleHydrationCaptureRequirements())).toEqual([
      ...BETA_OPS_REQUIRED_CONSOLE_HYDRATION_CAPTURE_IDS
    ]);

    expect(getConsoleHydrationCaptureRequirements()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "console_error_count",
          recordForEachSmokeRoute: true
        }),
        expect.objectContaining({
          id: "hydration_warning_count",
          recordForEachSmokeRoute: true
        }),
        expect.objectContaining({
          id: "stale_dev_server_mitigation",
          evidenceRequired: expect.stringContaining("restart")
        })
      ])
    );
  });

  test("support refund cancellation privacy local-state and account-sync requirements exist", () => {
    expect(ids(getSupportPrivacyRequirements())).toEqual([
      ...BETA_OPS_REQUIRED_SUPPORT_PRIVACY_REQUIREMENT_IDS
    ]);

    const requirements = new Map(
      getSupportPrivacyRequirements().map((item) => [item.id, item])
    );

    expect(requirements.get("support_contact_defined")).toMatchObject({
      requiredBeforeInvites: true,
      requiredBeforePaymentRequest: true,
      requirement: expect.stringContaining("support contact")
    });
    expect(requirements.get("support_response_expectation_defined")).toMatchObject({
      requirement: expect.stringContaining("response window")
    });
    expect(requirements.get("refund_cancellation_copy_ready")).toMatchObject({
      requiredBeforePaymentRequest: true,
      requirement: expect.stringContaining("Refund and cancellation")
    });
    expect(requirements.get("privacy_copy_ready")).toMatchObject({
      requirement: expect.stringContaining("privacy copy")
    });
    expect(requirements.get("local_state_disclosure_ready")).toMatchObject({
      requirement: expect.stringContaining("stored locally")
    });
    expect(requirements.get("account_sync_limitation_disclosure_ready")).toMatchObject({
      requirement: expect.stringContaining("real account sync is not implemented")
    });
    expect(requirements.get("manual_payment_disclosure_ready")).toMatchObject({
      requiredBeforePaymentRequest: true,
      requirement: expect.stringContaining("manual")
    });
    expect(requirements.get("no_automatic_entitlement_disclosure_ready")).toMatchObject({
      requirement: expect.stringContaining("automatically grants paid access")
    });
    expect(requirements.get("no_raw_payment_data_collected_in_app")).toMatchObject({
      status: "blocked"
    });
    expect(requirements.get("no_provider_tokens_or_secrets_stored")).toMatchObject({
      status: "blocked"
    });
    expect(requirements.get("public_signup_and_public_paid_beta_blocked")).toMatchObject({
      status: "blocked"
    });
  });

  test("incident log required fields and redaction rules exist", () => {
    const incidentRequirements = getIncidentLogRequirements();

    expect(incidentRequirements.manualLogRequired).toBe(true);
    expect(incidentRequirements.requiredBeforeInvites).toBe(true);
    expect(incidentRequirements.requiredFields.map((field) => field.key)).toEqual([
      ...BETA_OPS_REQUIRED_INCIDENT_LOG_FIELD_KEYS
    ]);
    expect(incidentRequirements.localStorageRedaction).toEqual({
      recordKeyNamesOnly: true,
      redactValues: true,
      rawLocalStorageDumpsForbidden: true
    });

    for (const key of BETA_OPS_REQUIRED_INCIDENT_LOG_FIELD_KEYS) {
      expect(Object.prototype.hasOwnProperty.call(BETA_OPS_INCIDENT_LOG_ENTRY_FIXTURE, key)).toBe(
        true
      );
    }

    expect(BETA_OPS_INCIDENT_LOG_ENTRY_FIXTURE.localStorageKeysInvolvedRedacted).toEqual([
      "vlx_review_state_v1",
      "vlx_review_events_v1"
    ]);
    expect(JSON.stringify(BETA_OPS_INCIDENT_LOG_ENTRY_FIXTURE)).not.toContain(
      "providerToken"
    );
  });

  test("issue reporting process and participant consent checklist exist", () => {
    expect(getIssueReportingProcess().length).toBeGreaterThanOrEqual(4);
    expect(ids(getBetaParticipantConsentChecklist())).toEqual([
      ...BETA_OPS_REQUIRED_PARTICIPANT_CONSENT_IDS
    ]);

    for (const item of getBetaParticipantConsentChecklist()) {
      expect(item.requiredBeforeInvites, item.id).toBe(true);
      expect(item.consentEvidenceRequired.length, item.id).toBeGreaterThan(0);
    }
  });

  test("owner checklist exists and all items are required before invites", () => {
    expect(ids(getOwnerBetaOpsChecklist())).toEqual([
      ...BETA_OPS_REQUIRED_OWNER_CHECKLIST_IDS
    ]);

    for (const item of getOwnerBetaOpsChecklist()) {
      expect(item.requiredBeforeInvites, item.id).toBe(true);
      expect(item.evidenceRequired.length, item.id).toBeGreaterThan(0);
    }
  });

  test("pause rollback criteria and P0 P1 P2 operational risks exist", () => {
    expect(ids(getPauseRollbackCriteria())).toEqual([
      ...BETA_OPS_REQUIRED_PAUSE_ROLLBACK_IDS
    ]);

    for (const criterion of getPauseRollbackCriteria()) {
      expect(criterion.blocksNewInvites, criterion.id).toBe(true);
    }

    expect(getOperationalRisks().map((risk) => risk.severity)).toEqual(
      expect.arrayContaining(["P0", "P1", "P2"])
    );
    expect(
      getOperationalRisks().filter((risk) => risk.publicBetaBlocker)
    ).toHaveLength(3);
  });

  test("next PR sequence is deterministic and recommends #84 then #85", () => {
    expect(getNextBetaOpsPRSequence().map((item) => item.prNumber)).toEqual([
      ...BETA_OPS_REQUIRED_NEXT_PR_NUMBERS
    ]);
    expect(getNextBetaOpsPRSequence().map((item) => item.title)).toEqual([
      ...BETA_OPS_REQUIRED_NEXT_PR_TITLES
    ]);
    expect(getNextBetaOpsPRSequence()[0]).toMatchObject({
      prNumber: 84,
      title: "Private beta readiness rerun",
      docsContractsTestsOnlyRecommended: true,
      realMonitoringSdkImplementationAllowed: false,
      realPaymentImplementationAllowed: false,
      realAccountSyncImplementationAllowed: false
    });
  });

  test("safety policy keeps docs contracts tests scope closed", () => {
    expect(BETA_OPS_SAFETY_POLICY.docsContractsTestsOnly).toBe(true);

    for (const field of BETA_OPS_REQUIRED_SAFETY_FIELDS) {
      expect(BETA_OPS_SAFETY_POLICY[field], field).toBe(false);
    }
  });

  test("forbidden integrations route handlers middleware paths and dependencies are absent", () => {
    for (const relativePath of BETA_OPS_FORBIDDEN_ACTUAL_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }

    const appRouteHandlers = collectFiles("src/app").filter(
      (relativePath) => basename(relativePath) === "route.ts"
    );

    expect(appRouteHandlers.map((path) => path.split("\\").join("/"))).toEqual([
      "src/app/auth/confirm/route.ts"
    ]);

    for (const fileName of ["package.json", "package-lock.json"] as const) {
      const dependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of BETA_OPS_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(
          dependencies,
          `${fileName} should not add ${dependencyName}`
        ).not.toHaveProperty(dependencyName);
      }
    }
  });

  test("beta ops gate module files contain no runtime integration patterns", () => {
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\s*\(/,
      /\bwindow\.localStorage\b/,
      /\blocalStorage\.getItem\b/,
      /\blocalStorage\.setItem\b/,
      /\bprocess\.env\b/,
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

    for (const relativePath of BETA_OPS_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test("runtime app routes and components do not import the beta ops gate", () => {
    for (const scanDir of BETA_OPS_RUNTIME_SCAN_DIRS) {
      for (const relativePath of collectFiles(scanDir)) {
        if (!/\.(ts|tsx)$/.test(relativePath)) {
          continue;
        }

        const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

        expect(fileText, relativePath).not.toContain("beta-ops-gate");
        expect(fileText, relativePath).not.toContain("BETA_OPS_GATE");
      }
    }
  });

  test("gate helpers are pure static reads", () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      privateVerdict: getPrivateBetaOpsVerdict(),
      publicVerdict: getPublicBetaOpsVerdict(),
      routePaths: getBrowserSmokeRequirements().map((item) => item.route),
      incidentFields: getIncidentLogRequirements().requiredFields.map(
        (field) => field.key
      ),
      supportIds: ids(getSupportPrivacyRequirements()),
      pauseIds: ids(getPauseRollbackCriteria()),
      nextPrNumbers: getNextBetaOpsPRSequence().map((item) => item.prNumber)
    }));

    expect(value).toEqual({
      privateVerdict: "Conditional / Manual-only",
      publicVerdict: "No-Go",
      routePaths: [...BETA_OPS_REQUIRED_ROUTE_SMOKE_PATHS],
      incidentFields: [...BETA_OPS_REQUIRED_INCIDENT_LOG_FIELD_KEYS],
      supportIds: [...BETA_OPS_REQUIRED_SUPPORT_PRIVACY_REQUIREMENT_IDS],
      pauseIds: [...BETA_OPS_REQUIRED_PAUSE_ROLLBACK_IDS],
      nextPrNumbers: [...BETA_OPS_REQUIRED_NEXT_PR_NUMBERS]
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      windowAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false
    });
  });

  test("README and docs links exist and contain required beta ops gate text", () => {
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(
      join(workspaceRoot, "docs", "MONITORING_SUPPORT_PRIVACY_BETA_GATE.md"),
      "utf8"
    );
    const moduleReadme = readFileSync(
      join(workspaceRoot, "src", "lib", "beta-ops-gate", "README.md"),
      "utf8"
    );

    for (const relativePath of BETA_OPS_DOC_FILES) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(true);
    }

    expect(readme).toContain(
      "[Monitoring, Support, Privacy Beta Gate](docs/MONITORING_SUPPORT_PRIVACY_BETA_GATE.md)"
    );

    for (const section of BETA_OPS_REQUIRED_DOC_SECTIONS) {
      expect(doc, section).toContain(section);
    }

    expect(doc).toContain("Private paid beta: **Conditional / Manual-only**");
    expect(doc).toContain("Public paid beta: **No-Go**");
    expect(doc).toContain(
      "Real monitoring SDK integration: **Blocked in this PR**"
    );
    expect(doc).toContain("Real payment integration: **Blocked**");
    expect(doc).toContain("Real account sync: **Blocked**");
    expect(doc).toContain(
      "Recommended next PR: **#84 Private beta readiness rerun**"
    );
    expect(doc).toContain("/save?slug=dissonance&source=word_page");
    expect(doc).toContain("localStorage keys involved, redacted");
    expect(doc).toContain("No raw payment data should be collected in app");
    expect(moduleReadme).toContain("pure static TypeScript data");
    expect(moduleReadme).toContain("does not execute browser probes");
  });
});
