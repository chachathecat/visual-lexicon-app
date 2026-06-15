import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import { basename, join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  PRIVATE_BETA_GATE,
  PRIVATE_BETA_GATE_POLICIES,
  PRIVATE_BETA_GATE_PRIVATE_VERDICT,
  PRIVATE_BETA_GATE_PUBLIC_VERDICT,
  PRIVATE_BETA_GATE_SAFETY_POLICY,
  VISUAL_LEXICON_PRIVATE_BETA_GATE_VERSION,
  getNextPrivateBetaPRSequence,
  getOwnerChecklist,
  getPrivateBetaAllowedConditions,
  getPrivateBetaBlockedConditions,
  getPrivateBetaGate,
  getPrivateBetaGatePolicy,
  getPrivateBetaVerdict,
  getPublicBetaP0Blockers,
  getPublicBetaVerdict,
  getRollbackCriteria,
  type PrivateBetaGate,
  type PrivateBetaGateBlocker,
  type PrivateBetaGateChecklistItem,
  type PrivateBetaGateCondition,
  type PrivateBetaGateMonitoringItem,
  type PrivateBetaGateNextPr,
  type PrivateBetaGatePolicy,
  type PrivateBetaGateQaEvidenceRequirement,
  type PrivateBetaGateRollbackCriterion,
  type PrivateBetaGateSeverity,
  type PrivateBetaGateSupportPrivacyItem,
  type PrivateBetaGateVerdict,
  type VisualLexiconPrivateBetaGateVersion
} from "../src/lib/private-beta-gate/private-beta-gate";
import {
  PRIVATE_BETA_GATE_DOC_FILES,
  PRIVATE_BETA_GATE_FORBIDDEN_ACTUAL_PATHS,
  PRIVATE_BETA_GATE_FORBIDDEN_DIRECT_DEPENDENCIES,
  PRIVATE_BETA_GATE_MODULE_FILES,
  PRIVATE_BETA_GATE_REQUIRED_ALLOWED_CONDITION_IDS,
  PRIVATE_BETA_GATE_REQUIRED_BLOCKED_CONDITION_IDS,
  PRIVATE_BETA_GATE_REQUIRED_DOC_SECTIONS,
  PRIVATE_BETA_GATE_REQUIRED_NEXT_PR_NUMBERS,
  PRIVATE_BETA_GATE_REQUIRED_NEXT_PR_TITLES,
  PRIVATE_BETA_GATE_REQUIRED_P1_IDS,
  PRIVATE_BETA_GATE_REQUIRED_P2_IDS,
  PRIVATE_BETA_GATE_REQUIRED_POLICY_IDS,
  PRIVATE_BETA_GATE_REQUIRED_PUBLIC_P0_IDS,
  PRIVATE_BETA_GATE_REQUIRED_SAFETY_FIELDS,
  PRIVATE_BETA_GATE_RUNTIME_SCAN_DIRS,
  PRIVATE_BETA_GATE_SEVERITIES
} from "../src/lib/private-beta-gate/fixtures";

const workspaceRoot = process.cwd();

type PrivateBetaGateTypeSurface = {
  version: VisualLexiconPrivateBetaGateVersion;
  gate: PrivateBetaGate;
  verdict: PrivateBetaGateVerdict;
  policy: PrivateBetaGatePolicy;
  condition: PrivateBetaGateCondition;
  blocker: PrivateBetaGateBlocker;
  checklistItem: PrivateBetaGateChecklistItem;
  qaRequirement: PrivateBetaGateQaEvidenceRequirement;
  monitoringItem: PrivateBetaGateMonitoringItem;
  supportPrivacyItem: PrivateBetaGateSupportPrivacyItem;
  rollbackCriterion: PrivateBetaGateRollbackCriterion;
  nextPr: PrivateBetaGateNextPr;
  severity: PrivateBetaGateSeverity;
};

const typeSmoke: PrivateBetaGateTypeSurface = {
  version: VISUAL_LEXICON_PRIVATE_BETA_GATE_VERSION,
  gate: PRIVATE_BETA_GATE,
  verdict: PRIVATE_BETA_GATE_PRIVATE_VERDICT,
  policy: PRIVATE_BETA_GATE_POLICIES[0],
  condition: PRIVATE_BETA_GATE.launchAllowedConditions[0],
  blocker: PRIVATE_BETA_GATE.publicBetaP0Blockers[0],
  checklistItem: PRIVATE_BETA_GATE.ownerChecklist[0],
  qaRequirement: PRIVATE_BETA_GATE.manualQaEvidenceRequirements[0],
  monitoringItem: PRIVATE_BETA_GATE.monitoringChecklist[0],
  supportPrivacyItem: PRIVATE_BETA_GATE.supportRefundPrivacyChecklist[0],
  rollbackCriterion: PRIVATE_BETA_GATE.rollbackCriteria[0],
  nextPr: PRIVATE_BETA_GATE.nextPrivateBetaPrSequence[0],
  severity: PRIVATE_BETA_GATE_SEVERITIES[0]
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

function withNoRuntimeSurfaceAccess<TValue>(callback: () => TValue) {
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

test.describe("private beta gate prep", () => {
  test("exports the required typed private beta gate surface", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      gate: {
        branch: "release/private-beta-gate-prep",
        pullRequest: "#80 Private beta gate prep",
        betaType: "owner-controlled private beta"
      },
      verdict: "Conditional / Manual-only",
      policy: {
        id: "owner_invited_only"
      },
      severity: "P0"
    });
  });

  test("sets private beta verdict to Conditional / Manual-only and public beta to No-Go", () => {
    expect(getPrivateBetaGate()).toBe(PRIVATE_BETA_GATE);
    expect(getPrivateBetaVerdict()).toBe("Conditional / Manual-only");
    expect(getPublicBetaVerdict()).toBe("No-Go");
    expect(PRIVATE_BETA_GATE_PRIVATE_VERDICT).toBe("Conditional / Manual-only");
    expect(PRIVATE_BETA_GATE_PUBLIC_VERDICT).toBe("No-Go");
    expect(PRIVATE_BETA_GATE.currentVerdicts).toEqual({
      privatePaidBeta: "Conditional / Manual-only",
      publicPaidBeta: "No-Go"
    });
  });

  test("cohort cap is present and conservative", () => {
    expect(PRIVATE_BETA_GATE.cohortCap).toEqual({
      recommendedInitialMin: 5,
      recommendedInitialMax: 20,
      hardCapBeforeReapproval: 20,
      recommendation: "5 to 20 users",
      ownerControlled: true,
      conservative: true
    });
    expect(PRIVATE_BETA_GATE.cohortCap.recommendedInitialMax).toBeLessThanOrEqual(
      20
    );
    expect(PRIVATE_BETA_GATE.participantProfile.allowed.length).toBeGreaterThan(0);
    expect(PRIVATE_BETA_GATE.participantProfile.excluded.length).toBeGreaterThan(0);
  });

  test("required private beta policies exist and stay non-implementation contracts", () => {
    expect(ids(PRIVATE_BETA_GATE_POLICIES)).toEqual([
      ...PRIVATE_BETA_GATE_REQUIRED_POLICY_IDS
    ]);

    for (const policyId of PRIVATE_BETA_GATE_REQUIRED_POLICY_IDS) {
      const policy = getPrivateBetaGatePolicy(policyId);

      expect(policy, policyId).toBeDefined();
      expect(policy).toMatchObject({
        implementationAllowedInThisPr: false,
        requiredBeforePublicBeta: true
      });
    }
  });

  test("manual invite policy exists", () => {
    expect(getPrivateBetaGatePolicy("owner_invited_only")).toMatchObject({
      status: "required",
      requiredBeforePrivateBeta: true,
      summary: expect.stringContaining("directly invited by the owner")
    });
    expect(PRIVATE_BETA_GATE.manualInviteProcess.length).toBeGreaterThanOrEqual(5);
    expect(PRIVATE_BETA_GATE.manualInviteProcess.join(" ")).toContain(
      "does not rely on app entitlement mutation"
    );
  });

  test("manual payment or payment-link-only policy exists", () => {
    expect(getPrivateBetaGatePolicy("manual_or_payment_link_only")).toMatchObject({
      status: "allowed_with_owner_control",
      requiredBeforePrivateBeta: true,
      summary: expect.stringContaining("payment link")
    });
    expect(PRIVATE_BETA_GATE.safetyPolicy.paymentBillingCheckoutAllowed).toBe(false);
  });

  test("manual entitlement policy forbids automatic access and app mutation", () => {
    expect(getPrivateBetaGatePolicy("manual_entitlement_no_mutation")).toMatchObject({
      status: "required",
      requiredBeforePrivateBeta: true,
      summary: expect.stringContaining("must not mutate app entitlement state")
    });
    expect(getPrivateBetaGatePolicy("no_automatic_paid_access")).toMatchObject({
      status: "blocked",
      summary: expect.stringContaining("automatically grant paid access")
    });
    expect(PRIVATE_BETA_GATE.safetyPolicy.entitlementMutationAllowed).toBe(false);
  });

  test("no public signup public paid beta or real checkout policy is allowed", () => {
    expect(getPrivateBetaGatePolicy("no_public_signup")).toMatchObject({
      status: "blocked"
    });
    expect(getPrivateBetaGatePolicy("public_paid_beta_no_go")).toMatchObject({
      status: "blocked",
      summary: expect.stringContaining("Public paid beta cannot launch")
    });
    expect(getPrivateBetaGatePolicy("no_real_checkout")).toMatchObject({
      status: "blocked",
      summary: expect.stringContaining("checkout")
    });
  });

  test("account sync and single-browser local-state limitation disclosures exist", () => {
    expect(getPrivateBetaGatePolicy("account_sync_limitation_disclosure")).toMatchObject({
      status: "disclosure_required",
      summary: expect.stringContaining("account sync is not implemented")
    });
    expect(getPrivateBetaGatePolicy("single_browser_local_state_limitation")).toMatchObject({
      status: "disclosure_required",
      summary: expect.stringContaining("one browser profile")
    });
  });

  test("support refund cancellation privacy and monitoring requirements exist", () => {
    expect(getPrivateBetaGatePolicy("support_contact_required")).toMatchObject({
      status: "required"
    });
    expect(getPrivateBetaGatePolicy("refund_cancellation_copy_required")).toMatchObject({
      status: "required"
    });
    expect(getPrivateBetaGatePolicy("privacy_copy_required")).toMatchObject({
      status: "required"
    });
    expect(getPrivateBetaGatePolicy("monitoring_minimum_required")).toMatchObject({
      status: "required"
    });
    expect(PRIVATE_BETA_GATE.supportRefundPrivacyChecklist.length).toBeGreaterThan(0);
    expect(PRIVATE_BETA_GATE.monitoringChecklist.length).toBeGreaterThan(0);
  });

  test("allowed and blocked launch condition helpers return the expected gate lists", () => {
    expect(ids(getPrivateBetaAllowedConditions())).toEqual([
      ...PRIVATE_BETA_GATE_REQUIRED_ALLOWED_CONDITION_IDS
    ]);
    expect(ids(getPrivateBetaBlockedConditions())).toEqual([
      ...PRIVATE_BETA_GATE_REQUIRED_BLOCKED_CONDITION_IDS
    ]);

    for (const blocker of getPrivateBetaBlockedConditions()) {
      expect(blocker.blocksPrivateBeta, blocker.id).toBe(true);
    }
  });

  test("public beta P0 blockers remain explicit", () => {
    expect(ids(getPublicBetaP0Blockers())).toEqual([
      ...PRIVATE_BETA_GATE_REQUIRED_PUBLIC_P0_IDS
    ]);

    for (const blocker of getPublicBetaP0Blockers()) {
      expect(blocker).toMatchObject({
        severity: "P0",
        blocksPublicBeta: true
      });
    }
  });

  test("P1 private-beta requirements and P2 polish are classified", () => {
    expect(ids(PRIVATE_BETA_GATE.privateBetaP1Requirements)).toEqual([
      ...PRIVATE_BETA_GATE_REQUIRED_P1_IDS
    ]);
    expect(ids(PRIVATE_BETA_GATE.p2Polish)).toEqual([
      ...PRIVATE_BETA_GATE_REQUIRED_P2_IDS
    ]);
  });

  test("owner checklist manual QA evidence monitoring and support checklists exist", () => {
    expect(getOwnerChecklist().length).toBeGreaterThanOrEqual(7);
    expect(PRIVATE_BETA_GATE.manualQaEvidenceRequirements.length).toBeGreaterThanOrEqual(
      6
    );
    expect(PRIVATE_BETA_GATE.monitoringChecklist.length).toBeGreaterThanOrEqual(4);
    expect(PRIVATE_BETA_GATE.supportRefundPrivacyChecklist.length).toBeGreaterThanOrEqual(
      4
    );

    for (const item of getOwnerChecklist()) {
      expect(item.requiredBeforeInvites, item.id).toBe(true);
      expect(item.evidenceRequired.length, item.id).toBeGreaterThan(0);
    }
  });

  test("rollback criteria and issue reporting process exist", () => {
    expect(ids(getRollbackCriteria())).toEqual([
      ...ids(PRIVATE_BETA_GATE.rollbackCriteria)
    ]);
    expect(getRollbackCriteria().length).toBeGreaterThanOrEqual(5);
    expect(PRIVATE_BETA_GATE.rollbackPlan).toContain(
      "Pause new invites immediately."
    );
    expect(PRIVATE_BETA_GATE.issueReportingProcess.length).toBeGreaterThanOrEqual(
      4
    );
  });

  test("next PR sequence exists and starts with #81 manual payment entitlement policy", () => {
    expect(getNextPrivateBetaPRSequence().map((item) => item.prNumber)).toEqual([
      ...PRIVATE_BETA_GATE_REQUIRED_NEXT_PR_NUMBERS
    ]);
    expect(getNextPrivateBetaPRSequence().map((item) => item.title)).toEqual([
      ...PRIVATE_BETA_GATE_REQUIRED_NEXT_PR_TITLES
    ]);
    expect(getNextPrivateBetaPRSequence()[0]).toMatchObject({
      prNumber: 81,
      title: "Manual payment / entitlement policy",
      realPaymentImplementationAllowed: false,
      realAccountSyncImplementationAllowed: false
    });
  });

  test("safety policy keeps docs contracts tests scope closed", () => {
    expect(PRIVATE_BETA_GATE_SAFETY_POLICY.docsContractsTestsOnly).toBe(true);

    for (const field of PRIVATE_BETA_GATE_REQUIRED_SAFETY_FIELDS) {
      expect(PRIVATE_BETA_GATE_SAFETY_POLICY[field], field).toBe(false);
    }
  });

  test("no forbidden API routes middleware provider directories or payment route paths are created", () => {
    for (const relativePath of PRIVATE_BETA_GATE_FORBIDDEN_ACTUAL_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }

    const appRouteHandlers = collectFiles("src/app").filter(
      (relativePath) => basename(relativePath) === "route.ts"
    );

    expect(appRouteHandlers).toEqual([]);
  });

  test("no forbidden provider SDKs auth database payment logging or worker dependencies are added", () => {
    for (const fileName of ["package.json", "package-lock.json"] as const) {
      const dependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of PRIVATE_BETA_GATE_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(
          dependencies,
          `${fileName} should not add ${dependencyName}`
        ).not.toHaveProperty(dependencyName);
      }
    }
  });

  test("private beta gate module files contain no runtime integration patterns", () => {
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\s*\(/,
      /\bwindow\b/,
      /\bprocess\.env\b/,
      /\blocalStorage\b/,
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
      /\bcreateRouteHandler\b/
    ];

    for (const relativePath of PRIVATE_BETA_GATE_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test("runtime app routes and components do not import the private beta gate", () => {
    for (const scanDir of PRIVATE_BETA_GATE_RUNTIME_SCAN_DIRS) {
      for (const relativePath of collectFiles(scanDir)) {
        if (!/\.(ts|tsx)$/.test(relativePath)) {
          continue;
        }

        const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

        expect(fileText, relativePath).not.toContain("private-beta-gate");
        expect(fileText, relativePath).not.toContain("PRIVATE_BETA_GATE");
      }
    }
  });

  test("gate helpers are pure static reads", () => {
    const { sideEffects, value } = withNoRuntimeSurfaceAccess(() => ({
      privateVerdict: getPrivateBetaVerdict(),
      publicVerdict: getPublicBetaVerdict(),
      allowedIds: ids(getPrivateBetaAllowedConditions()),
      blockedIds: ids(getPrivateBetaBlockedConditions()),
      publicP0Ids: ids(getPublicBetaP0Blockers()),
      rollbackIds: ids(getRollbackCriteria()),
      nextPrNumbers: getNextPrivateBetaPRSequence().map((item) => item.prNumber)
    }));

    expect(value).toEqual({
      privateVerdict: "Conditional / Manual-only",
      publicVerdict: "No-Go",
      allowedIds: [...PRIVATE_BETA_GATE_REQUIRED_ALLOWED_CONDITION_IDS],
      blockedIds: [...PRIVATE_BETA_GATE_REQUIRED_BLOCKED_CONDITION_IDS],
      publicP0Ids: [...PRIVATE_BETA_GATE_REQUIRED_PUBLIC_P0_IDS],
      rollbackIds: ids(PRIVATE_BETA_GATE.rollbackCriteria),
      nextPrNumbers: [...PRIVATE_BETA_GATE_REQUIRED_NEXT_PR_NUMBERS]
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      windowAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false
    });
  });

  test("README and private beta gate docs are linked and explicit", () => {
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(
      join(workspaceRoot, "docs", "PRIVATE_BETA_GATE_PREP.md"),
      "utf8"
    );
    const moduleReadme = readFileSync(
      join(workspaceRoot, "src", "lib", "private-beta-gate", "README.md"),
      "utf8"
    );

    expect(PRIVATE_BETA_GATE_DOC_FILES).toEqual([
      "docs/PRIVATE_BETA_GATE_PREP.md",
      "README.md"
    ]);
    expect(readme).toContain("docs/PRIVATE_BETA_GATE_PREP.md");

    for (const section of PRIVATE_BETA_GATE_REQUIRED_DOC_SECTIONS) {
      expect(doc, section).toContain(section);
    }

    expect(doc).toContain("Private paid beta: **Conditional / Manual-only**");
    expect(doc).toContain("Public paid beta: **No-Go**");
    expect(doc).toContain("Recommended next PR: **#81 Manual payment / entitlement policy**");
    expect(doc).toContain("5 to 20 owner-invited users");
    expect(doc).toContain("No public signup");
    expect(doc).toContain("No automatic paid access");
    expect(moduleReadme).toContain("pure static TypeScript data");
    expect(moduleReadme).toContain("does not execute browser probes");
  });
});
