import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import { basename, join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  OWNER_BETA_LAUNCH_CHECKLIST,
  OWNER_BETA_LAUNCH_SAFETY_POLICY,
  OWNER_BETA_LAUNCH_VERDICT,
  PUBLIC_BETA_LAUNCH_VERDICT,
  VISUAL_LEXICON_OWNER_BETA_LAUNCH_CHECKLIST_VERSION,
  getContinuationStopDecisionChecklist,
  getFirst24HourReviewChecklist,
  getFirst7DayReviewChecklist,
  getIncidentRollbackChecklist,
  getLaunchPreconditions,
  getLocalStorageProbeChecklist,
  getNextOwnerBetaPRSequence,
  getNoLaunchConditions,
  getOwnerBetaLaunchChecklist,
  getOwnerBetaLaunchVerdict,
  getOwnerFinalSignoffChecklist,
  getParticipantCommunicationChecklist,
  getParticipantSelectionChecklist,
  getPostInviteMonitoringChecklist,
  getPublicBetaVerdict,
  getSmokeTestChecklist,
  type OwnerBetaChecklistItem,
  type OwnerBetaContinuationDecisionItem,
  type OwnerBetaIncidentRollbackItem,
  type OwnerBetaLaunchChecklist,
  type OwnerBetaLaunchChecklistVersion,
  type OwnerBetaLaunchPrecondition,
  type OwnerBetaLaunchSeverity,
  type OwnerBetaLaunchSourceGate,
  type OwnerBetaLaunchVerdict,
  type OwnerBetaLocalStorageProbeItem,
  type OwnerBetaNextPr,
  type OwnerBetaNoLaunchCondition,
  type OwnerBetaParticipantCommunicationItem,
  type OwnerBetaPostInviteMonitoringItem,
  type OwnerBetaSmokeTestItem
} from "../src/lib/owner-beta-launch-checklist/owner-beta-launch-checklist";
import {
  OWNER_BETA_DOC_FILES,
  OWNER_BETA_FORBIDDEN_ACTUAL_PATHS,
  OWNER_BETA_FORBIDDEN_DIRECT_DEPENDENCIES,
  OWNER_BETA_MODULE_FILES,
  OWNER_BETA_REQUIRED_COMMUNICATION_IDS,
  OWNER_BETA_REQUIRED_CONTINUATION_DECISION_IDS,
  OWNER_BETA_REQUIRED_DOC_SECTIONS,
  OWNER_BETA_REQUIRED_FIRST_24_HOUR_IDS,
  OWNER_BETA_REQUIRED_FIRST_7_DAY_IDS,
  OWNER_BETA_REQUIRED_INCIDENT_ROLLBACK_IDS,
  OWNER_BETA_REQUIRED_LOCAL_STORAGE_KEYS,
  OWNER_BETA_REQUIRED_LOCAL_STORAGE_PROBE_IDS,
  OWNER_BETA_REQUIRED_NEXT_PR_NUMBERS,
  OWNER_BETA_REQUIRED_NEXT_PR_TITLES,
  OWNER_BETA_REQUIRED_NO_LAUNCH_IDS,
  OWNER_BETA_REQUIRED_OWNER_SIGNOFF_IDS,
  OWNER_BETA_REQUIRED_POST_INVITE_MONITORING_IDS,
  OWNER_BETA_REQUIRED_PRECONDITION_IDS,
  OWNER_BETA_REQUIRED_SAFETY_FIELDS,
  OWNER_BETA_REQUIRED_SELECTION_IDS,
  OWNER_BETA_REQUIRED_SMOKE_IDS,
  OWNER_BETA_REQUIRED_SOURCE_PR_LABELS,
  OWNER_BETA_REQUIRED_SOURCE_PR_NUMBERS,
  OWNER_BETA_RUNTIME_SCAN_DIRS,
  OWNER_BETA_SEVERITIES
} from "../src/lib/owner-beta-launch-checklist/fixtures";

const workspaceRoot = process.cwd();

type OwnerBetaLaunchTypeSurface = {
  version: OwnerBetaLaunchChecklistVersion;
  report: OwnerBetaLaunchChecklist;
  verdict: OwnerBetaLaunchVerdict;
  sourceGate: OwnerBetaLaunchSourceGate;
  precondition: OwnerBetaLaunchPrecondition;
  noLaunchCondition: OwnerBetaNoLaunchCondition;
  checklistItem: OwnerBetaChecklistItem;
  communicationItem: OwnerBetaParticipantCommunicationItem;
  smokeItem: OwnerBetaSmokeTestItem;
  localStorageProbeItem: OwnerBetaLocalStorageProbeItem;
  incidentRollbackItem: OwnerBetaIncidentRollbackItem;
  postInviteItem: OwnerBetaPostInviteMonitoringItem;
  continuationDecision: OwnerBetaContinuationDecisionItem;
  nextPr: OwnerBetaNextPr;
  severity: OwnerBetaLaunchSeverity;
};

const typeSmoke: OwnerBetaLaunchTypeSurface = {
  version: VISUAL_LEXICON_OWNER_BETA_LAUNCH_CHECKLIST_VERSION,
  report: OWNER_BETA_LAUNCH_CHECKLIST,
  verdict: OWNER_BETA_LAUNCH_VERDICT,
  sourceGate: OWNER_BETA_LAUNCH_CHECKLIST.sourceGates[0],
  precondition: OWNER_BETA_LAUNCH_CHECKLIST.launchPreconditions[0],
  noLaunchCondition: OWNER_BETA_LAUNCH_CHECKLIST.noLaunchConditions[0],
  checklistItem: OWNER_BETA_LAUNCH_CHECKLIST.ownerFinalSignoffChecklist[0],
  communicationItem:
    OWNER_BETA_LAUNCH_CHECKLIST.participantCommunicationChecklist[0],
  smokeItem: OWNER_BETA_LAUNCH_CHECKLIST.smokeTestChecklist[0],
  localStorageProbeItem:
    OWNER_BETA_LAUNCH_CHECKLIST.localStorageProbeChecklist[0],
  incidentRollbackItem:
    OWNER_BETA_LAUNCH_CHECKLIST.incidentRollbackChecklist[0],
  postInviteItem:
    OWNER_BETA_LAUNCH_CHECKLIST.postInviteMonitoringChecklist[0],
  continuationDecision:
    OWNER_BETA_LAUNCH_CHECKLIST.continuationStopDecisionChecklist[0],
  nextPr: OWNER_BETA_LAUNCH_CHECKLIST.nextOwnerBetaPRSequence[0],
  severity: OWNER_BETA_SEVERITIES[0]
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
      Object.defineProperty(globalThis, "localStorage", originalLocalStorageDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }

    if (originalProcessEnvDescriptor?.configurable) {
      Object.defineProperty(process, "env", originalProcessEnvDescriptor);
    }
  }
}

test.describe("owner beta launch checklist", () => {
  test("exports the required typed checklist surface", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      report: {
        branch: "release/owner-run-private-beta-launch-checklist",
        pullRequest: "#85 Owner-run private beta launch checklist",
        reportDateKst: "2026-06-16"
      },
      verdict: "Conditional / Manual-only",
      sourceGate: {
        prNumber: 79
      },
      severity: "P0"
    });
  });

  test("sets private beta verdict to Conditional / Manual-only and public beta to No-Go", () => {
    expect(getOwnerBetaLaunchChecklist()).toBe(OWNER_BETA_LAUNCH_CHECKLIST);
    expect(getOwnerBetaLaunchVerdict()).toBe("Conditional / Manual-only");
    expect(getPublicBetaVerdict()).toBe("No-Go");
    expect(OWNER_BETA_LAUNCH_VERDICT).toBe("Conditional / Manual-only");
    expect(PUBLIC_BETA_LAUNCH_VERDICT).toBe("No-Go");
    expect(OWNER_BETA_LAUNCH_CHECKLIST.currentVerdicts).toEqual({
      ownerControlledPrivateBeta: "Conditional / Manual-only",
      publicPaidBeta: "No-Go"
    });
  });

  test("5 to 20 participant cap and owner invite-only policy exist", () => {
    expect(OWNER_BETA_LAUNCH_CHECKLIST.participantCap).toEqual({
      minimum: 5,
      maximum: 20,
      hardCapBeforeReapproval: 20,
      recommendation: "5 to 20 manually selected participants",
      manualEnforcementRequired: true,
      publicWaitlistOrSignupAllowed: false
    });
    expect(OWNER_BETA_LAUNCH_CHECKLIST.inviteOnlyPolicy).toMatchObject({
      publicSignupAllowed: false,
      publicCheckoutAllowed: false,
      selfServeInvitesAllowed: false,
      ownerSelectedParticipantsOnly: true,
      participantCap: "5 to 20",
      manualRosterRequired: true
    });
    expect(ids(getParticipantSelectionChecklist())).toEqual([
      ...OWNER_BETA_REQUIRED_SELECTION_IDS
    ]);
  });

  test("launch preconditions include #79 through #84 source gates", () => {
    expect(
      OWNER_BETA_LAUNCH_CHECKLIST.sourceGates.map((item) => item.prNumber)
    ).toEqual([...OWNER_BETA_REQUIRED_SOURCE_PR_NUMBERS]);
    expect(ids(getLaunchPreconditions())).toEqual([
      ...OWNER_BETA_REQUIRED_PRECONDITION_IDS
    ]);

    for (const sourceLabel of OWNER_BETA_REQUIRED_SOURCE_PR_LABELS) {
      expect(getLaunchPreconditions().some((item) => item.source === sourceLabel)).toBe(
        true
      );
    }

    for (const precondition of getLaunchPreconditions()) {
      expect(precondition.requiredBeforeInvites, precondition.id).toBe(true);
      expect(precondition.blocksLaunchIfMissing, precondition.id).toBe(true);
      expect(precondition.ownerEvidenceRequired.length, precondition.id).toBeGreaterThan(
        0
      );
    }
  });

  test("no-launch conditions exist for critical blockers", () => {
    expect(ids(getNoLaunchConditions())).toEqual([
      ...OWNER_BETA_REQUIRED_NO_LAUNCH_IDS
    ]);

    for (const condition of getNoLaunchConditions()) {
      expect(condition.launchBlocked, condition.id).toBe(true);
      expect(condition.requiredOwnerAction.length, condition.id).toBeGreaterThan(
        0
      );
    }

    const labels = getNoLaunchConditions().map((item) => item.label).join(" ");

    expect(labels).toContain("Public checkout is active");
    expect(labels).toContain("Automatic entitlement is active");
    expect(labels).toContain("Real account sync is assumed");
    expect(labels).toContain("Support/refund/privacy copy is missing");
    expect(labels).toContain("Monitoring/incident log is missing");
    expect(labels).toContain("Route smoke fails");
    expect(labels).toContain("Console/hydration errors are unresolved");
    expect(labels).toContain("Owner has not approved launch");
    expect(labels).toContain("Participant communication is incomplete");
  });

  test("owner final signoff is required", () => {
    expect(ids(getOwnerFinalSignoffChecklist())).toEqual([
      ...OWNER_BETA_REQUIRED_OWNER_SIGNOFF_IDS
    ]);

    for (const item of getOwnerFinalSignoffChecklist()) {
      expect(item.requiredBeforeInvites, item.id).toBe(true);
      expect(item.ownerEvidenceRequired.length, item.id).toBeGreaterThan(0);
    }
  });

  test("support refund privacy checklist exists", () => {
    const communicationIds = ids(getParticipantCommunicationChecklist());

    expect(communicationIds).toEqual([...OWNER_BETA_REQUIRED_COMMUNICATION_IDS]);
    expect(communicationIds).toEqual(
      expect.arrayContaining([
        "communication_support_contact",
        "communication_refund_cancellation",
        "communication_privacy_copy"
      ])
    );

    for (const item of getParticipantCommunicationChecklist()) {
      expect(item.requiredBeforeInvites, item.id).toBe(true);
      expect(item.copyRequirement.length, item.id).toBeGreaterThan(0);
    }
  });

  test("local-state and account-sync limitation disclosure exists", () => {
    const disclosure = getParticipantCommunicationChecklist().find(
      (item) => item.id === "communication_local_state_account_sync_limitation"
    );

    expect(disclosure).toMatchObject({
      type: "local_state_account_sync",
      requiredBeforeInvites: true,
      requiredBeforePaymentRequest: true
    });
    expect(disclosure?.copyRequirement).toContain("real account sync is not implemented");
    expect(disclosure?.copyRequirement).toContain("one browser profile");
  });

  test("manual payment and no automatic entitlement disclosures exist", () => {
    const payment = getParticipantCommunicationChecklist().find(
      (item) => item.id === "communication_manual_payment_payment_link_only"
    );
    const entitlement = getParticipantCommunicationChecklist().find(
      (item) => item.id === "communication_no_automatic_entitlement"
    );

    expect(payment).toMatchObject({
      type: "manual_payment",
      requiredBeforePaymentRequest: true
    });
    expect(payment?.copyRequirement).toContain("manual or payment-link-only");
    expect(entitlement).toMatchObject({
      type: "no_automatic_entitlement",
      requiredBeforePaymentRequest: true
    });
    expect(entitlement?.copyRequirement).toContain("do not automatically grant");
  });

  test("smoke localStorage and console checklist exists", () => {
    expect(ids(getSmokeTestChecklist())).toEqual([
      ...OWNER_BETA_REQUIRED_SMOKE_IDS
    ]);
    expect(ids(getLocalStorageProbeChecklist())).toEqual([
      ...OWNER_BETA_REQUIRED_LOCAL_STORAGE_PROBE_IDS
    ]);
    expect(
      getLocalStorageProbeChecklist().map((item) => item.storageKey)
    ).toEqual([...OWNER_BETA_REQUIRED_LOCAL_STORAGE_KEYS]);

    for (const probe of getLocalStorageProbeChecklist()) {
      expect(probe.recordKeyPresenceOnly, probe.id).toBe(true);
      expect(probe.rawValueLoggingAllowed, probe.id).toBe(false);
    }

    const smokeLabels = getSmokeTestChecklist().map((item) => item.label).join(" ");

    expect(smokeLabels).toContain("Console/hydration error checklist");
    expect(smokeLabels).toContain("localStorage probe checklist");
  });

  test("incident and rollback checklist exists", () => {
    expect(ids(getIncidentRollbackChecklist())).toEqual([
      ...OWNER_BETA_REQUIRED_INCIDENT_ROLLBACK_IDS
    ]);

    for (const item of getIncidentRollbackChecklist()) {
      expect(item.blocksNewInvites, item.id).toBe(true);
      expect(item.ownerAction.length, item.id).toBeGreaterThan(0);
    }
  });

  test("post-invite first 24-hour and first 7-day review checklists exist", () => {
    expect(ids(getPostInviteMonitoringChecklist())).toEqual([
      ...OWNER_BETA_REQUIRED_POST_INVITE_MONITORING_IDS
    ]);
    expect(ids(getFirst24HourReviewChecklist())).toEqual([
      ...OWNER_BETA_REQUIRED_FIRST_24_HOUR_IDS
    ]);
    expect(ids(getFirst7DayReviewChecklist())).toEqual([
      ...OWNER_BETA_REQUIRED_FIRST_7_DAY_IDS
    ]);
    expect(ids(getContinuationStopDecisionChecklist())).toEqual([
      ...OWNER_BETA_REQUIRED_CONTINUATION_DECISION_IDS
    ]);
  });

  test("next owner beta PR sequence starts with #86 invite packet", () => {
    expect(getNextOwnerBetaPRSequence().map((item) => item.prNumber)).toEqual([
      ...OWNER_BETA_REQUIRED_NEXT_PR_NUMBERS
    ]);
    expect(getNextOwnerBetaPRSequence().map((item) => item.title)).toEqual([
      ...OWNER_BETA_REQUIRED_NEXT_PR_TITLES
    ]);
    expect(getNextOwnerBetaPRSequence()[0]).toMatchObject({
      prNumber: 86,
      title: "Private beta invite packet / participant instructions",
      docsContractsTestsOnlyRecommended: true,
      realCheckoutAllowed: false,
      automaticEntitlementAllowed: false,
      realAccountSyncAllowed: false,
      monitoringSdkAllowed: false
    });
  });

  test("safety policy keeps docs contracts tests scope closed", () => {
    expect(OWNER_BETA_LAUNCH_SAFETY_POLICY.docsContractsTestsOnly).toBe(true);

    for (const field of OWNER_BETA_REQUIRED_SAFETY_FIELDS) {
      expect(OWNER_BETA_LAUNCH_SAFETY_POLICY[field], field).toBe(false);
    }
  });

  test("forbidden integrations are not introduced", () => {
    for (const relativePath of OWNER_BETA_FORBIDDEN_ACTUAL_PATHS) {
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

      for (const dependencyName of OWNER_BETA_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(
          dependencies,
          `${fileName} should not add ${dependencyName}`
        ).not.toHaveProperty(dependencyName);
      }
    }
  });

  test("owner beta launch module files contain no runtime integration patterns", () => {
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

    for (const relativePath of OWNER_BETA_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test("runtime app routes and components do not import the launch checklist", () => {
    for (const scanDir of OWNER_BETA_RUNTIME_SCAN_DIRS) {
      for (const relativePath of collectFiles(scanDir)) {
        if (!/\.(ts|tsx)$/.test(relativePath)) {
          continue;
        }

        const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

        expect(fileText, relativePath).not.toContain(
          "owner-beta-launch-checklist"
        );
        expect(fileText, relativePath).not.toContain(
          "OWNER_BETA_LAUNCH_CHECKLIST"
        );
      }
    }
  });

  test("helpers are pure static reads", () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      privateVerdict: getOwnerBetaLaunchVerdict(),
      publicVerdict: getPublicBetaVerdict(),
      preconditionIds: ids(getLaunchPreconditions()),
      noLaunchIds: ids(getNoLaunchConditions()),
      communicationIds: ids(getParticipantCommunicationChecklist()),
      smokeIds: ids(getSmokeTestChecklist()),
      rollbackIds: ids(getIncidentRollbackChecklist()),
      nextPrNumbers: getNextOwnerBetaPRSequence().map((item) => item.prNumber)
    }));

    expect(value).toEqual({
      privateVerdict: "Conditional / Manual-only",
      publicVerdict: "No-Go",
      preconditionIds: [...OWNER_BETA_REQUIRED_PRECONDITION_IDS],
      noLaunchIds: [...OWNER_BETA_REQUIRED_NO_LAUNCH_IDS],
      communicationIds: [...OWNER_BETA_REQUIRED_COMMUNICATION_IDS],
      smokeIds: [...OWNER_BETA_REQUIRED_SMOKE_IDS],
      rollbackIds: [...OWNER_BETA_REQUIRED_INCIDENT_ROLLBACK_IDS],
      nextPrNumbers: [...OWNER_BETA_REQUIRED_NEXT_PR_NUMBERS]
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
      join(workspaceRoot, "docs", "OWNER_RUN_PRIVATE_BETA_LAUNCH_CHECKLIST.md"),
      "utf8"
    );
    const moduleReadme = readFileSync(
      join(
        workspaceRoot,
        "src",
        "lib",
        "owner-beta-launch-checklist",
        "README.md"
      ),
      "utf8"
    );

    for (const relativePath of OWNER_BETA_DOC_FILES) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(true);
    }

    expect(readme).toContain(
      "[Owner-Run Private Beta Launch Checklist](docs/OWNER_RUN_PRIVATE_BETA_LAUNCH_CHECKLIST.md)"
    );

    for (const section of OWNER_BETA_REQUIRED_DOC_SECTIONS) {
      expect(doc, section).toContain(section);
    }

    expect(doc).toContain(
      "Owner-controlled private beta: **Conditional / Manual-only**"
    );
    expect(doc).toContain("Public paid beta: **No-Go**");
    expect(doc).toContain("public checkout");
    expect(doc).toContain("automatic entitlement");
    expect(doc).toContain("real account sync");
    expect(doc).toContain(
      "Recommended next PR: **#86 Private beta invite packet / participant instructions**"
    );
    expect(moduleReadme).toContain("pure static TypeScript data");
    expect(moduleReadme).toContain("does not execute browser");
  });
});
