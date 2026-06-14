import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_DECISION,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_GATES,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MANUAL_QA_PLAN,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MOCK_BOUNDARY,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_NEXT_STEP,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROLLBACK_PLAN,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROUTE_PLANS,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_SCOPE,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_SEQUENCE,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_STOP_CONDITIONS,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_VALIDATION_PLAN,
  getAccountSyncImplementationSpikeGate,
  getAccountSyncImplementationSpikeRoutePlan,
  getAccountSyncImplementationSpikeStopCondition,
  type AccountSyncImplementationSpikeDecision,
  type AccountSyncImplementationSpikeGate,
  type AccountSyncImplementationSpikeManualQAPlan,
  type AccountSyncImplementationSpikeMockBoundary,
  type AccountSyncImplementationSpikeNextStep,
  type AccountSyncImplementationSpikeNonGoal,
  type AccountSyncImplementationSpikePhase,
  type AccountSyncImplementationSpikePlan,
  type AccountSyncImplementationSpikePlanVersion,
  type AccountSyncImplementationSpikeRollbackPlan,
  type AccountSyncImplementationSpikeRoutePlan,
  type AccountSyncImplementationSpikeScope,
  type AccountSyncImplementationSpikeStopCondition,
  type AccountSyncImplementationSpikeValidationPlan,
} from '../src/lib/account-persistence/implementation-spike-plan/implementation-spike-plan';
import {
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_GATE_IDS,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_MANUAL_QA_FLOW_IDS,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_PACKAGE_MANIFEST,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_ROUTE_IDS,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_ROUTE_PATHS,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_SEQUENCE_IDS,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_STOP_CONDITION_IDS,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_FORBIDDEN_ACTUAL_ROUTE_PATHS,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_FORBIDDEN_DIRECT_DEPENDENCIES,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MODULE_FILES,
} from '../src/lib/account-persistence/implementation-spike-plan/fixtures';
import type { VlxAccountSyncRouteId } from '../src/lib/account-persistence/api-route-design/route-contracts';

const workspaceRoot = process.cwd();

type RequiredImplementationSpikeTypeSurface = {
  version: AccountSyncImplementationSpikePlanVersion;
  phase: AccountSyncImplementationSpikePhase;
  decision: AccountSyncImplementationSpikeDecision;
  gate: AccountSyncImplementationSpikeGate;
  stopCondition: AccountSyncImplementationSpikeStopCondition;
  scope: AccountSyncImplementationSpikeScope;
  nonGoal: AccountSyncImplementationSpikeNonGoal;
  mockBoundary: AccountSyncImplementationSpikeMockBoundary;
  routePlan: AccountSyncImplementationSpikeRoutePlan;
  validationPlan: AccountSyncImplementationSpikeValidationPlan;
  rollbackPlan: AccountSyncImplementationSpikeRollbackPlan;
  manualQAPlan: AccountSyncImplementationSpikeManualQAPlan;
  nextStep: AccountSyncImplementationSpikeNextStep;
  plan: AccountSyncImplementationSpikePlan;
};

const exportedTypeSmoke: RequiredImplementationSpikeTypeSurface = {
  version:
    ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_DECISION
      .accountSyncImplementationSpikePlanVersion,
  phase: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_DECISION.currentPhase,
  decision: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_DECISION,
  gate: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_GATES[0],
  stopCondition: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_STOP_CONDITIONS[0],
  scope: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_SCOPE,
  nonGoal: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN.nonGoals[0],
  mockBoundary: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MOCK_BOUNDARY,
  routePlan: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROUTE_PLANS[0],
  validationPlan: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_VALIDATION_PLAN,
  rollbackPlan: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROLLBACK_PLAN,
  manualQAPlan: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MANUAL_QA_PLAN,
  nextStep: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_NEXT_STEP,
  plan: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN,
};

function routeIds() {
  return ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROUTE_PLANS.map(
    (routePlan) => routePlan.routeId
  );
}

function routePaths() {
  return ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROUTE_PLANS.map(
    (routePlan) => routePlan.path
  );
}

function gateIds() {
  return ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_GATES.map((gate) => gate.id);
}

function stopConditionIds() {
  return ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_STOP_CONDITIONS.map(
    (stopCondition) => stopCondition.id
  );
}

function sequenceIds() {
  return ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_SEQUENCE.map((step) => step.id);
}

function manualQAFlowIds() {
  return ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MANUAL_QA_PLAN.flows.map(
    (flow) => flow.id
  );
}

function expectRoutePlan(routeId: VlxAccountSyncRouteId) {
  const routePlan = getAccountSyncImplementationSpikeRoutePlan(routeId);

  expect(routePlan, `${routeId} implementation spike route plan`).toBeDefined();

  if (!routePlan) {
    throw new Error(`Missing implementation spike route plan: ${routeId}`);
  }

  return routePlan;
}

function readJsonFile<TValue>(relativePath: string): TValue {
  return JSON.parse(readFileSync(join(workspaceRoot, relativePath), 'utf8')) as TValue;
}

function readRootPackageDependencies(fileName: 'package.json' | 'package-lock.json') {
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
  const rootPackage = fileName === 'package-lock.json' ? parsed.packages?.[''] : parsed;

  return {
    ...rootPackage?.dependencies,
    ...rootPackage?.devDependencies,
    ...rootPackage?.optionalDependencies,
    ...rootPackage?.peerDependencies,
  };
}

function withNoExternalSideEffects<TValue>(callback: () => TValue) {
  const originalFetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage'
  );
  const originalProcessEnvDescriptor = Object.getOwnPropertyDescriptor(process, 'env');
  const guardedGlobals = [
    '__vlxAuthProviderSdk',
    '__vlxDatabaseSdk',
    '__vlxPaymentSdk',
    '__vlxLoggingProviderSdk',
    '__vlxObservabilitySdk',
    '__vlxValidationDependency',
    '__vlxWebflowCms',
    '__vlxCloudflareWorkers',
    '__vlxVercelSettings',
    '__vlxDnsProvider',
    '__vlxProductionData',
  ] as const;
  const originalGuardedDescriptors = new Map<string, PropertyDescriptor | undefined>();
  let fetchAccessed = false;
  let localStorageAccessed = false;
  let processEnvAccessed = false;
  let providerSurfaceAccessed = false;

  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    get() {
      fetchAccessed = true;
      return () => {
        throw new Error('implementation spike plan must not call network helpers');
      };
    },
  });

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      localStorageAccessed = true;
      return undefined;
    },
  });

  if (originalProcessEnvDescriptor?.configurable) {
    Object.defineProperty(process, 'env', {
      configurable: true,
      get() {
        processEnvAccessed = true;
        return originalProcessEnvDescriptor.value;
      },
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
      },
    });
  }

  try {
    const value = callback();

    return {
      value,
      sideEffects: {
        fetchAccessed,
        localStorageAccessed,
        processEnvAccessed,
        providerSurfaceAccessed,
      },
    };
  } finally {
    if (originalFetchDescriptor) {
      Object.defineProperty(globalThis, 'fetch', originalFetchDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, 'fetch');
    }

    if (originalLocalStorageDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorageDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }

    if (originalProcessEnvDescriptor?.configurable) {
      Object.defineProperty(process, 'env', originalProcessEnvDescriptor);
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

test.describe('account sync implementation spike plan', () => {
  test('exports the required implementation spike type surface through static values', () => {
    expect(exportedTypeSmoke).toMatchObject({
      version: 1,
      phase: 'design_only',
      decision: {
        appliesToPr: 68,
        finalVerdict: 'design_only_real_routes_still_blocked',
      },
      routePlan: {
        routeId: 'preview',
      },
      nextStep: {
        prNumber: 69,
      },
    });
  });

  test('current phase is design_only with implementation and production disabled', () => {
    expect(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_DECISION).toMatchObject({
      currentPhase: 'design_only',
      implementationAllowed: false,
      realRoutesAllowed: false,
      productionEnabled: false,
      docsContractsTestsOnly: true,
      noRuntimeBehaviorChange: true,
      routeFilesCreatedInThisPr: false,
      routeHandlersCreatedInThisPr: false,
      middlewareCreatedInThisPr: false,
      runtimeIntegrationCreatedInThisPr: false,
    });
    expect(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_DECISION.relationshipPrs).toEqual([
      58,
      59,
      60,
      61,
      62,
      63,
      64,
      65,
      66,
      67,
    ]);
  });

  test('scope is docs contracts tests only and blocks runtime implementation work', () => {
    expect(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_SCOPE).toEqual({
      docsContractsTestsOnly: true,
      apiRouteFilesAllowed: false,
      routeHandlersAllowed: false,
      middlewareAllowed: false,
      runtimeRouteIntegrationAllowed: false,
      realAuthAllowed: false,
      databasePersistenceAllowed: false,
      authProviderSdkAllowed: false,
      dbProviderSdkAllowed: false,
      validationDependencyAllowed: false,
      loggingProviderSdkAllowed: false,
      paymentProviderSdkAllowed: false,
      networkCallsAllowed: false,
      browserStorageAccessAllowed: false,
      environmentReadsAllowed: false,
      packageJsonChangesAllowed: false,
      packageLockChangesAllowed: false,
      migrationsAllowed: false,
      executableSchemasAllowed: false,
      productionDataAccessAllowed: false,
      productionDataMutationAllowed: false,
      webflowChangesAllowed: false,
      cloudflareWorkerChangesAllowed: false,
      vercelSettingsChangesAllowed: false,
      dnsChangesAllowed: false,
      paidEntitlementGrantAllowed: false,
      billingPaymentAllowed: false,
      fakeMasteryAllowed: false,
    });
  });

  test('future routes are listed but disabled and blocked from this PR', () => {
    expect(routeIds()).toEqual(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_ROUTE_IDS);
    expect(routePaths()).toEqual(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_ROUTE_PATHS);

    for (const routePlan of ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROUTE_PLANS) {
      expect(routePlan).toMatchObject({
        futureOnly: true,
        disabledByDefaultRequired: true,
        mockGatedBeforeProviderIntegration: true,
        realRouteAllowedInThisPr: false,
        routeFileCreatedInThisPr: false,
        routeHandlerCreatedInThisPr: false,
        runtimeIntegrationCreatedInThisPr: false,
        productionEnabled: false,
        ownerOnlyRequired: true,
        requiresAuthGate: true,
        requiresValidatorGate: true,
        requiresAuditRedactionGate: true,
        requiresMonitoringGate: true,
        grantsPaidEntitlement: false,
        billingPaymentOutsideSync: true,
        productionDataAccessAllowedInThisPr: false,
      });
    }
  });

  test('apply is explicitly disabled and preview is read-only', () => {
    const preview = expectRoutePlan('preview');
    const apply = expectRoutePlan('apply');

    expect(preview).toMatchObject({
      method: 'POST',
      path: '/api/account/sync/preview',
      readOnly: true,
      mutatingFutureRoute: false,
      applyDisabled: false,
      requiresKillSwitchBeforeMutation: false,
    });
    expect(apply).toMatchObject({
      method: 'POST',
      path: '/api/account/sync/apply',
      readOnly: false,
      mutatingFutureRoute: true,
      applyDisabled: true,
      requiresIdempotencyGate: true,
      requiresRollbackGate: true,
      requiresKillSwitchBeforeMutation: true,
    });
    expect(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_VALIDATION_PLAN).toMatchObject({
      previewMustBeReadOnly: true,
      applyMustRemainDisabledUntilAllGatesSatisfied: true,
    });
  });

  test('digest and audit remain owner-only bounded and redacted', () => {
    for (const routeId of ['digest', 'audit'] as const) {
      const routePlan = expectRoutePlan(routeId);

      expect(routePlan).toMatchObject({
        method: 'GET',
        readOnly: true,
        ownerOnlyRequired: true,
        boundedResponseRequired: true,
        redactedResponseRequired: true,
        productionEnabled: false,
      });
    }

    expect(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_VALIDATION_PLAN).toMatchObject({
      digestAuditMustBeOwnerOnlyBoundedAndRedacted: true,
    });
  });

  test('mock boundary is required before provider integration and core stays provider-neutral', () => {
    expect(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MOCK_BOUNDARY).toMatchObject({
      requiredBeforeProviderIntegration: true,
      mockOnlyInterfacesRequired: true,
      disabledByDefaultRequired: true,
      realProviderIntegrationAllowed: false,
      productionDataAccessAllowed: false,
      authProviderSpecificCodeAllowedInSyncCore: false,
      dbProviderSpecificCodeAllowedInSyncCore: false,
      validatorSpecificCodeAllowedInSyncCore: false,
      routeHandlerCreatedInThisPr: false,
      middlewareCreatedInThisPr: false,
      runtimeIntegrationCreatedInThisPr: false,
    });
    expect(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_VALIDATION_PLAN).toMatchObject({
      mockBoundaryRequiredBeforeProviderIntegration: true,
      providerSpecificCodeMustRemainOutsideSyncCore: true,
    });
  });

  test('implementation sequence matches the future PR order and keeps every step out of PR 68', () => {
    expect(sequenceIds()).toEqual(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_SEQUENCE_IDS);
    expect(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_SEQUENCE.map((step) => step.order)).toEqual([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
    ]);

    for (const step of ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_SEQUENCE) {
      expect(step).toMatchObject({
        allowedInThisPr: false,
        futureSeparatePrRequired: true,
        routeFilesMayBeCreatedInThisPr: false,
        productionMutationAllowed: false,
      });
    }
  });

  test('hard gates include kill switch rollback manual QA and production data safety', () => {
    expect(gateIds()).toEqual(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_GATE_IDS);

    for (const gateId of ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_GATE_IDS) {
      const gate = getAccountSyncImplementationSpikeGate(gateId);

      expect(gate, gateId).toBeDefined();
      expect(gate).toMatchObject({
        requiredBeforeProductionEnablement: true,
        blocksRealRouteImplementation: true,
      });
    }

    expect(getAccountSyncImplementationSpikeGate('kill_switch')).toMatchObject({
      requiredBeforeApplyEnablement: true,
    });
    expect(getAccountSyncImplementationSpikeGate('rollback')).toMatchObject({
      requiredBeforeApplyEnablement: true,
    });
    expect(getAccountSyncImplementationSpikeGate('manual_qa')).toMatchObject({
      status: 'not_started',
      requiredBeforeProductionEnablement: true,
    });
    expect(getAccountSyncImplementationSpikeGate('production_data_safety')).toMatchObject({
      status: 'requires_owner_approval',
      requiredBeforeAnyRealRoute: true,
    });
  });

  test('manual QA is required before production enablement and shadow mode cannot mutate', () => {
    expect(manualQAFlowIds()).toEqual(
      ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_MANUAL_QA_FLOW_IDS
    );
    expect(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MANUAL_QA_PLAN).toMatchObject({
      requiredBeforeProductionEnablement: true,
      requiredBeforeApplyEnablement: true,
      requiresRealAuthenticatedSessions: true,
      internalStaffOnlyBeforePreview: true,
    });

    for (const flow of ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MANUAL_QA_PLAN.flows) {
      expect(flow).toMatchObject({
        requiresRealAuthenticatedSession: true,
        requiredBeforeProductionEnablement: true,
      });
    }

    expect(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_VALIDATION_PLAN).toMatchObject({
      shadowModeCanMutateLearningState: false,
      manualQaWithRealAuthenticatedSessionsRequiredBeforeProduction: true,
    });
  });

  test('rollback and kill switch are required before apply', () => {
    expect(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROLLBACK_PLAN).toMatchObject({
      requiredBeforeApplyEnablement: true,
      killSwitchRequiredBeforeAnyRealMutation: true,
      monitoringRequiredBeforeAnyEnablement: true,
      firstActionOnIncident: 'disable_mutating_apply',
      preservesIdempotencyRecords: true,
      preservesAuditSummaries: true,
      preservesReviewEvents: true,
      preservesReviewState: true,
      preservesSavedWords: true,
      preservesDailyStats: true,
      preservesPackEvidence: true,
      deletesProductionLearningEvidence: false,
      duplicateReplayAfterRollbackCanAdvanceSrsTwice: false,
      rollbackRequiresOwnerApproval: true,
      missingRollbackIsStopCondition: true,
    });
  });

  test('learning safety boundaries preserve SRS source of truth and reject unsafe inputs', () => {
    expect(ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_VALIDATION_PLAN).toMatchObject({
      productionDataAccessAllowed: false,
      paidEntitlementGrantAllowed: false,
      billingPaymentMutationAllowed: false,
      fakeMasteryAccepted: false,
      reviewEventsRemainSrsSourceOfTruth: true,
      duplicateReplayCanAdvanceSrsTwice: false,
      sameKeyDifferentFingerprintAccepted: false,
      packProgressWithoutReviewEventsAuditOnly: true,
    });
    expect(getAccountSyncImplementationSpikeGate('srs_event_source_of_truth')).toMatchObject({
      evidenceRequired: expect.stringContaining('Duplicate review event replay'),
    });
    expect(getAccountSyncImplementationSpikeGate('fake_mastery_block')).toMatchObject({
      requiredBeforeAnyRealRoute: true,
    });
    expect(getAccountSyncImplementationSpikeGate('paid_entitlement_boundary')).toMatchObject({
      requiredBeforeAnyRealRoute: true,
    });
    expect(getAccountSyncImplementationSpikeGate('billing_payment_boundary')).toMatchObject({
      requiredBeforeAnyRealRoute: true,
    });
  });

  test('stop conditions include all requested P0 stop cases', () => {
    expect(stopConditionIds()).toEqual(
      ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_STOP_CONDITION_IDS
    );

    for (const stopConditionId of ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_STOP_CONDITION_IDS) {
      const stopCondition =
        getAccountSyncImplementationSpikeStopCondition(stopConditionId);

      expect(stopCondition, stopConditionId).toBeDefined();
      expect(stopCondition).toMatchObject({
        severity: 'P0',
        blocksRealRoutes: true,
        requiresOwnerDecisionToResume: true,
      });
    }

    expect(getAccountSyncImplementationSpikeStopCondition('idempotency_conflict')).toMatchObject({
      routeIds: ['apply'],
      stopAction: 'stop_before_apply_enablement',
    });
    expect(getAccountSyncImplementationSpikeStopCondition('production_data_access')).toMatchObject({
      stopAction: 'stop_before_route_pr',
    });
  });

  test('no actual API routes route handlers or middleware are created', () => {
    for (const relativePath of ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_FORBIDDEN_ACTUAL_ROUTE_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }
  });

  test('implementation spike module files contain no forbidden integrations or runtime access', () => {
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\b/,
      /\blocalStorage\b/,
      /\bprocess\.env\b/,
      /from ['"]zod/,
      /from ['"]yup/,
      /from ['"]valibot/,
      /from ['"]arktype/,
      /from ['"]ajv/,
      /from ['"]superstruct/,
      /from ['"]joi/,
      /from ['"]io-ts/,
      /from ['"]runtypes/,
      /from ['"]class-validator/,
      /from ['"]@supabase\//,
      /from ['"]@neondatabase\//,
      /from ['"]@vercel\/postgres/,
      /from ['"]firebase/,
      /from ['"]@firebase\//,
      /from ['"]prisma/,
      /from ['"]@prisma\//,
      /from ['"]drizzle/,
      /from ['"]drizzle-orm/,
      /from ['"]pg/,
      /from ['"]postgres/,
      /from ['"]mysql/,
      /from ['"]sqlite/,
      /from ['"]@clerk\//,
      /from ['"]@auth\//,
      /from ['"]next-auth/,
      /from ['"]better-auth/,
      /from ['"]stripe/,
      /from ['"]paddle/,
      /from ['"]@sentry\//,
      /from ['"]posthog/,
      /from ['"]@datadog\//,
      /from ['"]newrelic/,
      /from ['"]winston/,
      /from ['"]pino/,
      /\bcreateRouteHandler\b/,
    ];

    for (const relativePath of ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test('no provider SDK or validation dependencies are added to root package files', () => {
    for (const fileName of ['package.json', 'package-lock.json'] as const) {
      const rootDependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(rootDependencies, `${fileName} should not add ${dependencyName}`).not.toHaveProperty(
          dependencyName
        );
      }
    }
  });

  test('package root manifests remain unchanged for this docs contracts tests PR', () => {
    const packageJson = readJsonFile<{
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    }>('package.json');
    const packageLock = readJsonFile<{
      packages: Record<
        string,
        {
          dependencies: Record<string, string>;
          devDependencies: Record<string, string>;
        }
      >;
    }>('package-lock.json');

    expect(packageJson.scripts).toEqual(
      ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_PACKAGE_MANIFEST.scripts
    );
    expect(packageJson.dependencies).toEqual(
      ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_PACKAGE_MANIFEST.dependencies
    );
    expect(packageJson.devDependencies).toEqual(
      ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_PACKAGE_MANIFEST.devDependencies
    );
    expect(packageLock.packages[''].dependencies).toEqual(
      ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_PACKAGE_MANIFEST.dependencies
    );
    expect(packageLock.packages[''].devDependencies).toEqual(
      ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_PACKAGE_MANIFEST.devDependencies
    );
  });

  test('implementation spike plan is pure static data and does not access runtime surfaces', () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      routeCount: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN.routePlans.length,
      gateCount: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN.gates.length,
      stopConditionCount:
        ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN.stopConditions.length,
      currentPhase: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN.decision.currentPhase,
      realRoutesAllowed:
        ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN.decision.realRoutesAllowed,
      productionEnabled:
        ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN.decision.productionEnabled,
    }));

    expect(value).toEqual({
      routeCount: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_ROUTE_IDS.length,
      gateCount: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_GATE_IDS.length,
      stopConditionCount:
        ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_STOP_CONDITION_IDS.length,
      currentPhase: 'design_only',
      realRoutesAllowed: false,
      productionEnabled: false,
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });

  test('README and implementation spike plan docs are linked and explicit', () => {
    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8');
    const doc = readFileSync(
      join(workspaceRoot, 'docs', 'ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN.md'),
      'utf8'
    );

    expect(readme).toContain(
      '[Account Sync Implementation Spike Plan](docs/ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN.md)'
    );
    expect(doc).toContain('Final verdict: `design_only`; real routes still blocked.');
    expect(doc).toContain('PR #68');
    expect(doc).toContain('#69 Account sync route skeleton decision');
    expect(doc).toContain('Do not implement real API route files in #68.');
  });
});
