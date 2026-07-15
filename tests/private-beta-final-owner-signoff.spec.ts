import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import { basename, join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_VERDICTS,
  PRIVATE_BETA_FINAL_OWNER_SAFETY_POLICY,
  PRIVATE_BETA_FINAL_OWNER_SIGNOFF,
  PRIVATE_BETA_FINAL_OWNER_SIGNOFF_VERDICT,
  PUBLIC_BETA_FINAL_OWNER_SIGNOFF_VERDICT,
  VISUAL_LEXICON_PRIVATE_BETA_FINAL_OWNER_SIGNOFF_VERSION,
  getFinalDecisionTable,
  getLaunchAllowedConditions,
  getNextFinalSignoffPRSequence,
  getNoLaunchConditions,
  getOperationalConfirmations,
  getOwnerFinalSignoffChecklist,
  getOwnerSignoffVerdict,
  getPauseRollbackConditions,
  getPrivateBetaFinalOwnerSignoff,
  getPublicBetaBlockers,
  getPublicBetaVerdict,
  getRequiredPriorGates,
  type PrivateBetaFinalOwnerChecklistItem,
  type PrivateBetaFinalOwnerCondition,
  type PrivateBetaFinalOwnerDecisionTableItem,
  type PrivateBetaFinalOwnerNextPr,
  type PrivateBetaFinalOwnerNoLaunchCondition,
  type PrivateBetaFinalOwnerOperationalConfirmation,
  type PrivateBetaFinalOwnerPauseRollbackCondition,
  type PrivateBetaFinalOwnerPublicBetaBlocker,
  type PrivateBetaFinalOwnerRequiredPriorGate,
  type PrivateBetaFinalOwnerSeverity,
  type PrivateBetaFinalOwnerSignoff,
  type PrivateBetaFinalOwnerSignoffVerdict,
  type PrivateBetaFinalOwnerSignoffVersion
} from "../src/lib/private-beta-final-owner-signoff/private-beta-final-owner-signoff";
import {
  PRIVATE_BETA_FINAL_OWNER_DOC_FILES,
  PRIVATE_BETA_FINAL_OWNER_FORBIDDEN_ACTUAL_PATHS,
  PRIVATE_BETA_FINAL_OWNER_FORBIDDEN_DIRECT_DEPENDENCIES,
  PRIVATE_BETA_FINAL_OWNER_MODULE_FILES,
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_CONFIRMATION_CATEGORIES,
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_DECISIONS,
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_DOC_SECTIONS,
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_LAUNCH_ALLOWED_IDS,
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_NEXT_PR_NUMBERS,
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_NEXT_PR_TITLES,
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_NO_LAUNCH_IDS,
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_OPERATIONAL_CONFIRMATION_IDS,
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_PAUSE_ROLLBACK_IDS,
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_PRIOR_GATE_NUMBERS,
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_PRIOR_GATE_TITLES,
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_PUBLIC_BETA_BLOCKER_IDS,
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_SAFETY_FIELDS,
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_SIGNOFF_IDS,
  PRIVATE_BETA_FINAL_OWNER_RUNTIME_SCAN_DIRS,
  PRIVATE_BETA_FINAL_OWNER_SEVERITIES
} from "../src/lib/private-beta-final-owner-signoff/fixtures";

const workspaceRoot = process.cwd();

type PrivateBetaFinalOwnerTypeSurface = {
  version: PrivateBetaFinalOwnerSignoffVersion;
  report: PrivateBetaFinalOwnerSignoff;
  verdict: PrivateBetaFinalOwnerSignoffVerdict;
  priorGate: PrivateBetaFinalOwnerRequiredPriorGate;
  checklistItem: PrivateBetaFinalOwnerChecklistItem;
  operationalConfirmation: PrivateBetaFinalOwnerOperationalConfirmation;
  launchAllowedCondition: PrivateBetaFinalOwnerCondition;
  noLaunchCondition: PrivateBetaFinalOwnerNoLaunchCondition;
  pauseRollbackCondition: PrivateBetaFinalOwnerPauseRollbackCondition;
  decision: PrivateBetaFinalOwnerDecisionTableItem;
  publicBetaBlocker: PrivateBetaFinalOwnerPublicBetaBlocker;
  nextPr: PrivateBetaFinalOwnerNextPr;
  severity: PrivateBetaFinalOwnerSeverity;
};

const typeSmoke: PrivateBetaFinalOwnerTypeSurface = {
  version: VISUAL_LEXICON_PRIVATE_BETA_FINAL_OWNER_SIGNOFF_VERSION,
  report: PRIVATE_BETA_FINAL_OWNER_SIGNOFF,
  verdict: PRIVATE_BETA_FINAL_OWNER_SIGNOFF_VERDICT,
  priorGate: PRIVATE_BETA_FINAL_OWNER_SIGNOFF.requiredPriorGates[0],
  checklistItem:
    PRIVATE_BETA_FINAL_OWNER_SIGNOFF.ownerFinalSignoffChecklist[0],
  operationalConfirmation:
    PRIVATE_BETA_FINAL_OWNER_SIGNOFF.operationalConfirmations[0],
  launchAllowedCondition:
    PRIVATE_BETA_FINAL_OWNER_SIGNOFF.launchAllowedConditions[0],
  noLaunchCondition: PRIVATE_BETA_FINAL_OWNER_SIGNOFF.noLaunchConditions[0],
  pauseRollbackCondition:
    PRIVATE_BETA_FINAL_OWNER_SIGNOFF.pauseRollbackConditions[0],
  decision: PRIVATE_BETA_FINAL_OWNER_SIGNOFF.finalDecisionTable[0],
  publicBetaBlocker: PRIVATE_BETA_FINAL_OWNER_SIGNOFF.publicBetaBlockers[0],
  nextPr: PRIVATE_BETA_FINAL_OWNER_SIGNOFF.nextFinalSignoffPRSequence[0],
  severity: PRIVATE_BETA_FINAL_OWNER_SEVERITIES[0]
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

test.describe("private beta final owner signoff", () => {
  test("exports the required typed final signoff surface", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      report: {
        branch: "release/private-beta-final-owner-signoff",
        pullRequest: "#88 Private beta final owner signoff",
        reportDateKst: "2026-06-16"
      },
      verdict: "Conditional / Manual-only",
      priorGate: {
        prNumber: 79
      },
      severity: "P0",
      nextPr: {
        prNumber: 89,
        title: "Private beta dry-run smoke evidence"
      }
    });
  });

  test("sets private beta verdict to Conditional / Manual-only and public beta to No-Go", () => {
    expect(getPrivateBetaFinalOwnerSignoff()).toBe(
      PRIVATE_BETA_FINAL_OWNER_SIGNOFF
    );
    expect(getOwnerSignoffVerdict()).toBe("Conditional / Manual-only");
    expect(getPublicBetaVerdict()).toBe("No-Go");
    expect(PRIVATE_BETA_FINAL_OWNER_SIGNOFF_VERDICT).toBe(
      "Conditional / Manual-only"
    );
    expect(PUBLIC_BETA_FINAL_OWNER_SIGNOFF_VERDICT).toBe("No-Go");
    expect(PRIVATE_BETA_FINAL_OWNER_SIGNOFF.currentVerdicts).toEqual({
      ownerControlledPrivateBeta: "Conditional / Manual-only",
      publicPaidBeta: "No-Go"
    });
  });

  test("required verdicts block checkout entitlement account sync and public signup", () => {
    expect(PRIVATE_BETA_FINAL_OWNER_REQUIRED_VERDICTS).toEqual({
      ownerControlledPrivateBeta: "Conditional / Manual-only",
      publicPaidBeta: "No-Go",
      realCheckout: "Blocked",
      automaticEntitlement: "Blocked",
      realAccountSync: "Blocked",
      publicSignup: "Blocked",
      ownerInvitation: "Allowed only after signoff checklist is complete"
    });
  });

  test("required prior gates include #79 through #87", () => {
    expect(getRequiredPriorGates().map((item) => item.prNumber)).toEqual([
      ...PRIVATE_BETA_FINAL_OWNER_REQUIRED_PRIOR_GATE_NUMBERS
    ]);
    expect(getRequiredPriorGates().map((item) => item.title)).toEqual([
      ...PRIVATE_BETA_FINAL_OWNER_REQUIRED_PRIOR_GATE_TITLES
    ]);

    for (const gate of getRequiredPriorGates()) {
      expect(gate.requiredBeforeInvites, gate.title).toBe(true);
      expect(gate.docPath, gate.title).toMatch(/^docs\//);
      expect(gate.contractPath.length, gate.title).toBeGreaterThan(0);
      expect(gate.signoffContribution.length, gate.title).toBeGreaterThan(0);
    }
  });

  test("owner final signoff checklist exists and blocks invitations until complete", () => {
    expect(ids(getOwnerFinalSignoffChecklist())).toEqual([
      ...PRIVATE_BETA_FINAL_OWNER_REQUIRED_SIGNOFF_IDS
    ]);
    expect(
      getOwnerFinalSignoffChecklist().map((item) => item.confirmationCategory)
    ).toEqual([...PRIVATE_BETA_FINAL_OWNER_REQUIRED_CONFIRMATION_CATEGORIES]);

    for (const item of getOwnerFinalSignoffChecklist()) {
      expect(item.requiredBeforeInvites, item.id).toBe(true);
      expect(item.blocksOwnerInvitationIfIncomplete, item.id).toBe(true);
      expect(item.ownerEvidenceRequired.length, item.id).toBeGreaterThan(0);
    }

    expect(PRIVATE_BETA_FINAL_OWNER_SIGNOFF.inviteOnlyConfirmation).toMatchObject({
      ownerInvitationStatus:
        "Allowed only after signoff checklist is complete",
      allowedBeforeChecklistComplete: false,
      allowedAfterChecklistComplete: true
    });
  });

  test("launch allowed conditions exist", () => {
    expect(ids(getLaunchAllowedConditions())).toEqual([
      ...PRIVATE_BETA_FINAL_OWNER_REQUIRED_LAUNCH_ALLOWED_IDS
    ]);

    for (const condition of getLaunchAllowedConditions()) {
      expect(condition.requiredBeforeInvites, condition.id).toBe(true);
      expect(condition.ownerEvidenceRequired.length, condition.id).toBeGreaterThan(
        0
      );
    }
  });

  test("no-launch conditions exist", () => {
    expect(ids(getNoLaunchConditions())).toEqual([
      ...PRIVATE_BETA_FINAL_OWNER_REQUIRED_NO_LAUNCH_IDS
    ]);

    for (const condition of getNoLaunchConditions()) {
      expect(condition.launchBlocked, condition.id).toBe(true);
      expect(condition.requiredOwnerAction.length, condition.id).toBeGreaterThan(
        0
      );
    }
  });

  test("pause rollback conditions exist", () => {
    expect(ids(getPauseRollbackConditions())).toEqual([
      ...PRIVATE_BETA_FINAL_OWNER_REQUIRED_PAUSE_ROLLBACK_IDS
    ]);

    expect(getPauseRollbackConditions()[0]).toMatchObject({
      id: "pause_on_broken_save_review_or_srs_loop",
      severity: "P0",
      pauseInvites: true,
      pausePaymentRequests: true
    });

    for (const condition of getPauseRollbackConditions()) {
      expect(condition.rollbackOrResumeAction.length, condition.id).toBeGreaterThan(
        0
      );
      expect(
        condition.evidenceRequiredBeforeResume.length,
        condition.id
      ).toBeGreaterThan(0);
    }
  });

  test("public beta blockers exist", () => {
    expect(ids(getPublicBetaBlockers())).toEqual([
      ...PRIVATE_BETA_FINAL_OWNER_REQUIRED_PUBLIC_BETA_BLOCKER_IDS
    ]);

    for (const blocker of getPublicBetaBlockers()) {
      expect(blocker.status, blocker.id).toBe("Blocked");
      expect(blocker.blocksPublicPaidBeta, blocker.id).toBe(true);
      expect(blocker.requiredBeforePublicBeta.length, blocker.id).toBeGreaterThan(
        0
      );
    }
  });

  test("manual payment and no automatic entitlement confirmations exist", () => {
    const confirmationIds = ids(getOperationalConfirmations());

    expect(confirmationIds).toEqual([
      ...PRIVATE_BETA_FINAL_OWNER_REQUIRED_OPERATIONAL_CONFIRMATION_IDS
    ]);

    const payment = getOperationalConfirmations().find(
      (item) => item.id === "confirmation_manual_payment_payment_link_only"
    );
    const entitlement = getOperationalConfirmations().find(
      (item) => item.id === "confirmation_no_automatic_entitlement"
    );

    expect(payment).toMatchObject({
      requiredBeforeInvites: true,
      requiredBeforePaymentRequest: true,
      confirmedByOwnerSignoff: false
    });
    expect(payment?.confirmation).toContain("manual or payment-link-only");
    expect(entitlement).toMatchObject({
      requiredBeforeInvites: true,
      requiredBeforePaymentRequest: true,
      confirmedByOwnerSignoff: false
    });
    expect(entitlement?.confirmation).toContain("does not automatically grant");
  });

  test("local-state and account-sync limitation confirmation exists", () => {
    const localState = getOperationalConfirmations().find(
      (item) =>
        item.id === "confirmation_local_state_account_sync_limitation"
    );

    expect(localState).toMatchObject({
      category: "local_state_account_sync_limitation",
      requiredBeforeInvites: true,
      requiredBeforePaymentRequest: true
    });
    expect(localState?.confirmation).toContain("browser profile");
    expect(localState?.confirmation).toContain("real account sync is blocked");
  });

  test("support refund privacy confirmations exist", () => {
    const confirmationIds = ids(getOperationalConfirmations());

    expect(confirmationIds).toEqual(
      expect.arrayContaining([
        "confirmation_support_contact",
        "confirmation_refund_cancellation_copy",
        "confirmation_privacy_local_storage_disclosure"
      ])
    );

    expect(
      getOperationalConfirmations().find(
        (item) => item.id === "confirmation_support_contact"
      )?.confirmation
    ).toContain("monitored support contact");
    expect(
      getOperationalConfirmations().find(
        (item) => item.id === "confirmation_refund_cancellation_copy"
      )?.confirmation
    ).toContain("Refund and cancellation copy");
    expect(
      getOperationalConfirmations().find(
        (item) => item.id === "confirmation_privacy_local_storage_disclosure"
      )?.confirmation
    ).toContain("raw localStorage dumps");
  });

  test("issue log smoke 24-hour and 7-day review confirmations exist", () => {
    expect(ids(getOperationalConfirmations())).toEqual(
      expect.arrayContaining([
        "confirmation_issue_log_readiness",
        "confirmation_smoke_test_readiness",
        "confirmation_first_24_hour_review",
        "confirmation_first_7_day_review"
      ])
    );

    expect(
      getOperationalConfirmations().find(
        (item) => item.id === "confirmation_issue_log_readiness"
      )?.confirmation
    ).toContain("Owner can log route");
    expect(
      getOperationalConfirmations().find(
        (item) => item.id === "confirmation_smoke_test_readiness"
      )?.confirmation
    ).toContain("dry-run smoke evidence");
    expect(
      getOperationalConfirmations().find(
        (item) => item.id === "confirmation_first_24_hour_review"
      )?.confirmation
    ).toContain("within the first 24 hours");
    expect(
      getOperationalConfirmations().find(
        (item) => item.id === "confirmation_first_7_day_review"
      )?.confirmation
    ).toContain("first 7 days");
  });

  test("final decision table covers proceed delay and stop", () => {
    expect(getFinalDecisionTable().map((item) => item.decision)).toEqual([
      ...PRIVATE_BETA_FINAL_OWNER_REQUIRED_DECISIONS
    ]);
    expect(getFinalDecisionTable()[0]).toMatchObject({
      decision: "proceed_with_owner_controlled_private_beta",
      ownerControlledPrivateBetaAllowed: true,
      publicPaidBetaAllowed: false
    });
    expect(getFinalDecisionTable()[1]).toMatchObject({
      decision: "delay_and_fix_p0_p1",
      ownerControlledPrivateBetaAllowed: false,
      publicPaidBetaAllowed: false
    });
    expect(getFinalDecisionTable()[2]).toMatchObject({
      decision: "stop_and_keep_beta_closed",
      ownerControlledPrivateBetaAllowed: false,
      publicPaidBetaAllowed: false
    });
  });

  test("participant cap and invite-only confirmations exist", () => {
    expect(PRIVATE_BETA_FINAL_OWNER_SIGNOFF.participantCapConfirmation).toEqual({
      id: "participant_cap_5_to_20_owner_selected",
      minimum: 5,
      maximum: 20,
      hardCapBeforeReapproval: 20,
      ownerSelectedParticipantsOnly: true,
      manualRosterRequired: true,
      publicWaitlistOrSignupAllowed: false,
      confirmedBeforeInvites: true
    });
    expect(PRIVATE_BETA_FINAL_OWNER_SIGNOFF.inviteOnlyConfirmation).toMatchObject({
      publicSignupAllowed: false,
      selfServeInvitesAllowed: false,
      publicCheckoutAllowed: false,
      manualOwnerApprovalRequired: true
    });
  });

  test("next final signoff PR sequence starts with #89 dry-run smoke evidence", () => {
    expect(getNextFinalSignoffPRSequence().map((item) => item.prNumber)).toEqual([
      ...PRIVATE_BETA_FINAL_OWNER_REQUIRED_NEXT_PR_NUMBERS
    ]);
    expect(getNextFinalSignoffPRSequence().map((item) => item.title)).toEqual([
      ...PRIVATE_BETA_FINAL_OWNER_REQUIRED_NEXT_PR_TITLES
    ]);
    expect(getNextFinalSignoffPRSequence()[0]).toMatchObject({
      prNumber: 89,
      title: "Private beta dry-run smoke evidence",
      docsContractsTestsOnlyRecommended: true,
      realCheckoutAllowed: false,
      automaticEntitlementAllowed: false,
      realAccountSyncAllowed: false,
      publicSignupAllowed: false
    });
  });

  test("safety policy keeps docs contracts tests scope closed", () => {
    expect(PRIVATE_BETA_FINAL_OWNER_SAFETY_POLICY.docsContractsTestsOnly).toBe(
      true
    );

    for (const field of PRIVATE_BETA_FINAL_OWNER_REQUIRED_SAFETY_FIELDS) {
      expect(PRIVATE_BETA_FINAL_OWNER_SAFETY_POLICY[field], field).toBe(false);
    }
  });

  test("forbidden integrations are not introduced", () => {
    for (const relativePath of PRIVATE_BETA_FINAL_OWNER_FORBIDDEN_ACTUAL_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(
        false
      );
    }

    const appRouteHandlers = collectFiles("src/app").filter(
      (relativePath) => basename(relativePath) === "route.ts"
    );

    expect(appRouteHandlers.map((path) => path.split("\\").join("/"))).toEqual([
      "src/app/api/account/sync/apply/route.ts",
      "src/app/api/account/sync/digest/route.ts",
      "src/app/api/account/sync/hydrate/route.ts",
      "src/app/api/account/sync/preview/route.ts",
      "src/app/api/me/entitlements/route.ts",
      "src/app/auth/confirm/route.ts"
    ]);

    for (const fileName of ["package.json", "package-lock.json"] as const) {
      const dependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of PRIVATE_BETA_FINAL_OWNER_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(
          dependencies,
          `${fileName} should not add ${dependencyName}`
        ).not.toHaveProperty(dependencyName);
      }
    }
  });

  test("final owner signoff module files contain no runtime integration patterns", () => {
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

    for (const relativePath of PRIVATE_BETA_FINAL_OWNER_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test("runtime app routes and components do not import final owner signoff", () => {
    for (const scanDir of PRIVATE_BETA_FINAL_OWNER_RUNTIME_SCAN_DIRS) {
      for (const relativePath of collectFiles(scanDir)) {
        if (!/\.(ts|tsx)$/.test(relativePath)) {
          continue;
        }

        const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

        expect(fileText, relativePath).not.toContain(
          "private-beta-final-owner-signoff"
        );
        expect(fileText, relativePath).not.toContain(
          "PRIVATE_BETA_FINAL_OWNER_SIGNOFF"
        );
      }
    }
  });

  test("helpers are pure static reads", () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      privateVerdict: getOwnerSignoffVerdict(),
      publicVerdict: getPublicBetaVerdict(),
      priorGateNumbers: getRequiredPriorGates().map((item) => item.prNumber),
      signoffIds: ids(getOwnerFinalSignoffChecklist()),
      launchAllowedIds: ids(getLaunchAllowedConditions()),
      noLaunchIds: ids(getNoLaunchConditions()),
      pauseRollbackIds: ids(getPauseRollbackConditions()),
      blockerIds: ids(getPublicBetaBlockers()),
      nextPrNumbers: getNextFinalSignoffPRSequence().map(
        (item) => item.prNumber
      )
    }));

    expect(value).toEqual({
      privateVerdict: "Conditional / Manual-only",
      publicVerdict: "No-Go",
      priorGateNumbers: [
        ...PRIVATE_BETA_FINAL_OWNER_REQUIRED_PRIOR_GATE_NUMBERS
      ],
      signoffIds: [...PRIVATE_BETA_FINAL_OWNER_REQUIRED_SIGNOFF_IDS],
      launchAllowedIds: [
        ...PRIVATE_BETA_FINAL_OWNER_REQUIRED_LAUNCH_ALLOWED_IDS
      ],
      noLaunchIds: [...PRIVATE_BETA_FINAL_OWNER_REQUIRED_NO_LAUNCH_IDS],
      pauseRollbackIds: [
        ...PRIVATE_BETA_FINAL_OWNER_REQUIRED_PAUSE_ROLLBACK_IDS
      ],
      blockerIds: [
        ...PRIVATE_BETA_FINAL_OWNER_REQUIRED_PUBLIC_BETA_BLOCKER_IDS
      ],
      nextPrNumbers: [...PRIVATE_BETA_FINAL_OWNER_REQUIRED_NEXT_PR_NUMBERS]
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
      join(workspaceRoot, "docs", "PRIVATE_BETA_FINAL_OWNER_SIGNOFF.md"),
      "utf8"
    );
    const moduleReadme = readFileSync(
      join(
        workspaceRoot,
        "src",
        "lib",
        "private-beta-final-owner-signoff",
        "README.md"
      ),
      "utf8"
    );

    for (const relativePath of PRIVATE_BETA_FINAL_OWNER_DOC_FILES) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(
        true
      );
    }

    expect(readme).toContain(
      "[Private Beta Final Owner Signoff](docs/PRIVATE_BETA_FINAL_OWNER_SIGNOFF.md)"
    );

    for (const section of PRIVATE_BETA_FINAL_OWNER_REQUIRED_DOC_SECTIONS) {
      expect(doc, section).toContain(section);
    }

    expect(doc).toContain(
      "Owner-controlled private beta: **Conditional / Manual-only**"
    );
    expect(doc).toContain("Public paid beta: **No-Go**");
    expect(doc).toContain("Real checkout: **Blocked**");
    expect(doc).toContain("Automatic entitlement: **Blocked**");
    expect(doc).toContain("Real account sync: **Blocked**");
    expect(doc).toContain("Public signup: **Blocked**");
    expect(doc).toContain(
      "Owner invitation: **Allowed only after signoff checklist is complete**"
    );
    expect(doc).toContain(
      "Recommended next PR: **#89 Private beta dry-run smoke evidence**"
    );
    expect(moduleReadme).toContain("pure static TypeScript data");
    expect(moduleReadme).toContain("does not implement runtime");
  });
});
