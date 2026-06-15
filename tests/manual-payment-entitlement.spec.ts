import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  getBlockedPaymentIntegrations,
  getManualEntitlementRequirements,
  getManualPaymentEntitlementPolicy,
  getNextManualPaymentPRSequence,
  getOwnerApprovalChecklist,
  getPrivateBetaPaymentPolicy,
  getRefundCancellationPolicy
} from "../src/lib/manual-payment-entitlement/manual-payment-entitlement";
import {
  MANUAL_PAYMENT_DOC_FILES,
  MANUAL_PAYMENT_ENTITLEMENT_RECORD_FIXTURE,
  MANUAL_PAYMENT_FORBIDDEN_ACTUAL_PATHS,
  MANUAL_PAYMENT_FORBIDDEN_DIRECT_DEPENDENCIES,
  MANUAL_PAYMENT_MODULE_FILES,
  MANUAL_PAYMENT_PROHIBITED_RECORD_FIELDS,
  MANUAL_PAYMENT_REVIEW_REQUIRED_POLICY_FIELDS,
  MANUAL_PAYMENT_REQUIRED_NEXT_STEPS
} from "../src/lib/manual-payment-entitlement/fixtures";

const workspaceRoot = process.cwd();

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
    ...rootPackage?.dependencies,
    ...rootPackage?.devDependencies,
    ...rootPackage?.optionalDependencies,
    ...rootPackage?.peerDependencies
  };
}

function withNoExternalSideEffects<TValue>(callback: () => TValue) {
  const originalFetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage"
  );
  const originalProcessEnvDescriptor = Object.getOwnPropertyDescriptor(process, "env");
  const guardedGlobals = [
    "__vlxAuthProviderSdk",
    "__vlxDatabaseSdk",
    "__vlxPaymentSdk",
    "__vlxLoggingProviderSdk",
    "__vlxObservabilitySdk",
    "__vlxWebflowCms",
    "__vlxCloudflareWorkers",
    "__vlxVercelSettings",
    "__vlxDnsProvider",
    "__vlxProductionData"
  ] as const;
  const originalGuardedDescriptors = new Map<string, PropertyDescriptor | undefined>();
  let fetchAccessed = false;
  let localStorageAccessed = false;
  let processEnvAccessed = false;
  let providerSurfaceAccessed = false;

  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    get() {
      fetchAccessed = true;
      return () => {
        throw new Error("manual payment policy must not call network helpers");
      };
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
      sideEffects: {
        fetchAccessed,
        localStorageAccessed,
        processEnvAccessed,
        providerSurfaceAccessed
      },
      value
    };
  } finally {
    if (originalFetchDescriptor) {
      Object.defineProperty(globalThis, "fetch", originalFetchDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "fetch");
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

test.describe("manual payment entitlement policy contract", () => {
  test("private beta is manual/payment-link-only and has no public checkout", () => {
    const policy = getManualPaymentEntitlementPolicy();
    const privatePolicy = getPrivateBetaPaymentPolicy();

    expect(policy.privateBetaVerdict).toBe("conditional_manual_only");
    expect(policy.privateBetaPaymentMode).toBe("manual_only");
    expect(policy.paymentLinkOnlyAllowed).toBe(true);
    expect(policy.noPublicCheckout).toBe(true);
    expect(policy.noAutomaticRecurringBilling).toBe(true);
    expect(policy.entitlementGrant.automaticEntitlementByAppCodeBlocked).toBe(true);
    expect(privatePolicy).toEqual({
      mode: "manual_only",
      ownerApprovalRequired: true,
      paymentLinkAllowed: true,
      checkoutBlocked: true,
      recurringBillingBlocked: true,
      paymentModeDescription:
        "Owner-only manual grant workflow with optional payment-link evidence capture."
    });
  });

  test("public paid beta remains No-Go and payment integrations are blocked", () => {
    const policy = getManualPaymentEntitlementPolicy();
    const blocked = getBlockedPaymentIntegrations();

    expect(policy.publicBetaVerdict).toBe("no_go");
    expect(policy.noPublicCheckout).toBe(true);
    expect(getManualPaymentEntitlementPolicy().manualPayment.providerSdkBlocked).toBe(true);
    expect(blocked).toEqual(expect.arrayContaining(["stripe", "paddle", "paypal"]));
  });

  test("manual entitlement is explicitly owner-gated and not automatic", () => {
    const policy = getManualPaymentEntitlementPolicy();

    expect(policy.entitlementGrant.automaticEntitlementByAppCodeBlocked).toBe(true);
    expect(policy.entitlementGrant.manualGrantRequired).toBe(true);
    expect(policy.entitlementGrant.productionUserDataMutationBlocked).toBe(true);
    expect(policy.entitlementGrant.reviewOnlyAgainstManualRecord).toBe(true);
    expect(policy.entitlementGrant.localPlanStateIsNotEntitlement).toBe(true);
    expect(policy.auditTrail.recordsMustExcludeSensitivePaymentPayloads).toBe(true);
  });

  test("manual entitlement record includes all required fields", () => {
    const requirements = getManualEntitlementRequirements();
    const fixture = MANUAL_PAYMENT_ENTITLEMENT_RECORD_FIXTURE;
    const requiredKeys = new Set(MANUAL_PAYMENT_REVIEW_REQUIRED_POLICY_FIELDS);

    expect(requirements.requiredFields.map((field) => field.key)).toEqual(
      MANUAL_PAYMENT_REVIEW_REQUIRED_POLICY_FIELDS
    );
    for (const requiredField of MANUAL_PAYMENT_REVIEW_REQUIRED_POLICY_FIELDS) {
      expect(fixture).toHaveProperty(requiredField);
      expect(requiredKeys.has(requiredField)).toBe(true);
    }
  });

  test("manual entitlement records forbid raw card/payment payload fields", () => {
    const evidencePolicy = getManualEntitlementRequirements();
    const fixture = MANUAL_PAYMENT_ENTITLEMENT_RECORD_FIXTURE;

    expect(evidencePolicy.prohibitedFields).toEqual(MANUAL_PAYMENT_PROHIBITED_RECORD_FIELDS);
    for (const prohibited of MANUAL_PAYMENT_PROHIBITED_RECORD_FIELDS) {
      expect(Object.prototype.hasOwnProperty.call(fixture, prohibited)).toBe(false);
    }
  });

  test("refund and cancellation requirements are present and preserve learning state", () => {
    const policy = getRefundCancellationPolicy();

    expect(policy.supportsRefundTracking).toBe(true);
    expect(policy.supportsCancellationTracking).toBe(true);
    expect(policy.preserveLearningState).toBe(true);
    expect(policy.accessRevocationModes).toEqual(["immediate", "period_end"]);
    expect(policy.disputeHandling).toContain("Disputes pause access");
    expect(policy.evidenceRequiredForManualRestore).toBe(true);
  });

  test("support contact and escalation requirements exist", () => {
    const policy = getManualPaymentEntitlementPolicy();

    expect(policy.support.supportEmail).toBe("support@visuallexicon.org");
    expect(policy.support.supportSla).toContain("two_business_days");
    expect(policy.support.mustEscalatePaymentDisputes).toBe(true);
    expect(policy.support.mustEscalateRefundOrCancelCases).toBe(true);
    expect(policy.support.requiredDisputeEvidence).toEqual(
      expect.arrayContaining([
        "evidence_reference",
        "participant_statement",
        "support_contact_log",
        "owner_decision_id"
      ])
    );
  });

  test("owner approval checklist exists and is required before access", () => {
    const checklist = getOwnerApprovalChecklist();

    expect(checklist.required).toBe(true);
    expect(checklist.minimumEvidenceForApproval).toBeGreaterThanOrEqual(2);
    expect(checklist.steps).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(checklist.requiredReviewerRoles).toEqual(["owner", "admin"]);
  });

  test("audit trail is required and immutable", () => {
    const policy = getManualPaymentEntitlementPolicy();

    expect(policy.auditTrail.required).toBe(true);
    expect(policy.auditTrail.immutableRecordRequired).toBe(true);
    expect(policy.auditTrail.recordsMustExcludeProviderTokens).toBe(true);
    expect(policy.auditTrail.recordsMustExcludeRawCardData).toBe(true);
    expect(policy.auditTrail.recordsMustExcludeSensitivePaymentPayloads).toBe(true);
    expect(policy.auditTrail.events.length).toBeGreaterThan(0);
  });

  test("public beta remains no-go with blocked runtime implementation scope", () => {
    const policy = getManualPaymentEntitlementPolicy();

    expect(policy.publicBetaVerdict).toBe("no_go");
    expect(policy.implementationScope.noRuntimeBehaviorChange).toBe(true);
    expect(policy.implementationScope.noRouteHandlers).toBe(true);
    expect(policy.implementationScope.noApiRoutes).toBe(true);
    expect(policy.implementationScope.noPaymentProviderSdk).toBe(true);
  });

  test("forbidden integrations are not introduced in dependencies", () => {
    for (const fileName of ["package.json", "package-lock.json"] as const) {
      const dependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of MANUAL_PAYMENT_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(
          dependencies,
          `${dependencyName} should not be present in ${fileName}`
        ).not.toHaveProperty(dependencyName);
      }
    }
  });

  test("forbidden files and module files contain no runtime integrations", () => {
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\s*\(/,
      /\blocalStorage\b/,
      /\bprocess\.env\b/,
      /from ["']zod/,
      /from ["']yup/,
      /from ["']valibot/,
      /from ["']ajv/,
      /from ["']@supabase\//,
      /from ["']@neondatabase\//,
      /from ["']@vercel\/postgres/,
      /from ["']firebase/,
      /from ["']@firebase\//,
      /from ["']prisma/,
      /from ["']@prisma\//,
      /from ["']drizzle/,
      /from ["']pg/,
      /from ["']postgres/,
      /from ["']mysql/,
      /from ["']sqlite/,
      /from ["']@clerk\//,
      /from ["']@auth\//,
      /from ["']next-auth/,
      /from ["']better-auth/,
      /from ["']stripe/,
      /from ["']paddle/,
      /from ["']paypal/,
      /from ["']braintree/,
      /from ["']@paypal\//,
      /\bcreateRouteHandler\b/
    ];

    for (const relativePath of [
      ...MANUAL_PAYMENT_FORBIDDEN_ACTUAL_PATHS.map((path) => path),
      ...MANUAL_PAYMENT_MODULE_FILES
    ]) {
      if (!existsSync(join(workspaceRoot, relativePath))) {
        continue;
      }

      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test("next manual payment PR sequence is deterministic and starts with #82", () => {
    const sequence = getNextManualPaymentPRSequence();

    expect(sequence).toEqual(MANUAL_PAYMENT_REQUIRED_NEXT_STEPS);
    expect(sequence[0]).toMatchObject({
      prNumber: 82,
      title: "Account sync preview/digest mock",
      docsContractsTestsOnly: true,
      realPaymentImplementationRecommended: false
    });
    expect(sequence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ prNumber: 82 }),
        expect.objectContaining({ prNumber: 83 }),
        expect.objectContaining({ prNumber: 84 }),
        expect.objectContaining({ prNumber: 85 })
      ])
    );
  });

  test("manual payment docs and README links exist and include policy requirements", () => {
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const policyDoc = readFileSync(
      join(workspaceRoot, "docs", "MANUAL_PAYMENT_ENTITLEMENT_POLICY.md"),
      "utf8"
    );

    expect(MANUAL_PAYMENT_DOC_FILES).toEqual([
      "docs/MANUAL_PAYMENT_ENTITLEMENT_POLICY.md",
      "README.md"
    ]);
    expect(readme).toContain(
      "[Manual Payment / Entitlement Policy](docs/MANUAL_PAYMENT_ENTITLEMENT_POLICY.md)"
    );
    expect(policyDoc).toContain("Private paid beta: **conditional / manual-only**");
    expect(policyDoc).toContain("Public paid beta: **No-Go**");
    expect(policyDoc).toContain("Real checkout: **blocked**");
    expect(policyDoc).toContain("Automatic entitlement: **blocked**");
    expect(policyDoc).toContain("Payment provider SDK: **blocked**");
  });

  test("policy access helpers are pure static data", () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => {
      const policy = getManualPaymentEntitlementPolicy();
      return {
        version: policy.version,
        privateBetaVerdict: policy.privateBetaVerdict,
        publicBetaVerdict: policy.publicBetaVerdict,
        privateMode: getPrivateBetaPaymentPolicy().mode,
        blockedCount: getBlockedPaymentIntegrations().length,
        ownerApprovalRequired: getOwnerApprovalChecklist().required
      };
    });

    expect(value).toEqual({
      version: 1,
      privateBetaVerdict: "conditional_manual_only",
      publicBetaVerdict: "no_go",
      privateMode: "manual_only",
      blockedCount: 3,
      ownerApprovalRequired: true
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false
    });
  });
});
