import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  ACCOUNT_SYNC_ROUTE_SKELETON_ALLOWED_FUTURE_ROUTES,
  ACCOUNT_SYNC_ROUTE_SKELETON_APPROVAL_REQUIREMENTS,
  ACCOUNT_SYNC_ROUTE_SKELETON_DECISION,
  ACCOUNT_SYNC_ROUTE_SKELETON_DECISION_RECORD,
  ACCOUNT_SYNC_ROUTE_SKELETON_DISABLE_POLICY,
  ACCOUNT_SYNC_ROUTE_SKELETON_FORBIDDEN_PATHS,
  ACCOUNT_SYNC_ROUTE_SKELETON_FUTURE_FILE_PLANS,
  ACCOUNT_SYNC_ROUTE_SKELETON_MOCK_GATE_POLICY,
  ACCOUNT_SYNC_ROUTE_SKELETON_NEXT_STEP,
  ACCOUNT_SYNC_ROUTE_SKELETON_STOP_CONDITIONS,
  ACCOUNT_SYNC_ROUTE_SKELETON_VALIDATION_REQUIREMENTS,
  getAccountSyncRouteSkeletonAllowedFutureRoute,
  getAccountSyncRouteSkeletonApprovalRequirement,
  getAccountSyncRouteSkeletonFutureFilePlan,
  getAccountSyncRouteSkeletonStopCondition,
  getAccountSyncRouteSkeletonValidationRequirement,
  type AccountSyncRouteSkeletonAllowedFutureRoute,
  type AccountSyncRouteSkeletonApprovalRequirement,
  type AccountSyncRouteSkeletonCurrentPhase,
  type AccountSyncRouteSkeletonDecision,
  type AccountSyncRouteSkeletonDecisionRecord,
  type AccountSyncRouteSkeletonDecisionStatus,
  type AccountSyncRouteSkeletonDecisionVersion,
  type AccountSyncRouteSkeletonDisablePolicy,
  type AccountSyncRouteSkeletonForbiddenPath,
  type AccountSyncRouteSkeletonFutureFilePlan,
  type AccountSyncRouteSkeletonMockGatePolicy,
  type AccountSyncRouteSkeletonNextStep,
  type AccountSyncRouteSkeletonNonGoal,
  type AccountSyncRouteSkeletonStopCondition,
  type AccountSyncRouteSkeletonValidationRequirement,
} from '../src/lib/account-persistence/route-skeleton-decision/route-skeleton-decision';
import {
  ACCOUNT_SYNC_ROUTE_SKELETON_DOC_FILES,
  ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_APPROVAL_REQUIREMENT_IDS,
  ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_FILE_PATHS,
  ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_ROUTE_IDS,
  ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_ROUTE_PATHS,
  ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_STOP_CONDITION_IDS,
  ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_VALIDATION_REQUIREMENT_IDS,
  ACCOUNT_SYNC_ROUTE_SKELETON_FORBIDDEN_DIRECT_DEPENDENCIES,
  ACCOUNT_SYNC_ROUTE_SKELETON_MODULE_FILES,
} from '../src/lib/account-persistence/route-skeleton-decision/fixtures';
import type { VlxAccountSyncRouteId } from '../src/lib/account-persistence/api-route-design/route-contracts';

const workspaceRoot = process.cwd();

type RequiredRouteSkeletonDecisionTypeSurface = {
  version: AccountSyncRouteSkeletonDecisionVersion;
  status: AccountSyncRouteSkeletonDecisionStatus;
  phase: AccountSyncRouteSkeletonCurrentPhase;
  decision: AccountSyncRouteSkeletonDecision;
  filePlan: AccountSyncRouteSkeletonFutureFilePlan;
  allowedRoute: AccountSyncRouteSkeletonAllowedFutureRoute;
  forbiddenPath: AccountSyncRouteSkeletonForbiddenPath;
  approvalRequirement: AccountSyncRouteSkeletonApprovalRequirement;
  disablePolicy: AccountSyncRouteSkeletonDisablePolicy;
  mockGatePolicy: AccountSyncRouteSkeletonMockGatePolicy;
  nonGoal: AccountSyncRouteSkeletonNonGoal;
  stopCondition: AccountSyncRouteSkeletonStopCondition;
  validationRequirement: AccountSyncRouteSkeletonValidationRequirement;
  nextStep: AccountSyncRouteSkeletonNextStep;
  record: AccountSyncRouteSkeletonDecisionRecord;
};

const exportedTypeSmoke: RequiredRouteSkeletonDecisionTypeSurface = {
  version:
    ACCOUNT_SYNC_ROUTE_SKELETON_DECISION
      .accountSyncRouteSkeletonDecisionVersion,
  status: ACCOUNT_SYNC_ROUTE_SKELETON_DECISION.status,
  phase: ACCOUNT_SYNC_ROUTE_SKELETON_DECISION.currentPhase,
  decision: ACCOUNT_SYNC_ROUTE_SKELETON_DECISION,
  filePlan: ACCOUNT_SYNC_ROUTE_SKELETON_FUTURE_FILE_PLANS[0],
  allowedRoute: ACCOUNT_SYNC_ROUTE_SKELETON_ALLOWED_FUTURE_ROUTES[0],
  forbiddenPath: ACCOUNT_SYNC_ROUTE_SKELETON_FORBIDDEN_PATHS[0],
  approvalRequirement: ACCOUNT_SYNC_ROUTE_SKELETON_APPROVAL_REQUIREMENTS[0],
  disablePolicy: ACCOUNT_SYNC_ROUTE_SKELETON_DISABLE_POLICY,
  mockGatePolicy: ACCOUNT_SYNC_ROUTE_SKELETON_MOCK_GATE_POLICY,
  nonGoal: ACCOUNT_SYNC_ROUTE_SKELETON_DECISION_RECORD.nonGoals[0],
  stopCondition: ACCOUNT_SYNC_ROUTE_SKELETON_STOP_CONDITIONS[0],
  validationRequirement: ACCOUNT_SYNC_ROUTE_SKELETON_VALIDATION_REQUIREMENTS[0],
  nextStep: ACCOUNT_SYNC_ROUTE_SKELETON_NEXT_STEP,
  record: ACCOUNT_SYNC_ROUTE_SKELETON_DECISION_RECORD,
};

function routeIds() {
  return ACCOUNT_SYNC_ROUTE_SKELETON_FUTURE_FILE_PLANS.map(
    (filePlan) => filePlan.routeId
  );
}

function routePaths() {
  return ACCOUNT_SYNC_ROUTE_SKELETON_FUTURE_FILE_PLANS.map(
    (filePlan) => filePlan.routePath
  );
}

function filePaths() {
  return ACCOUNT_SYNC_ROUTE_SKELETON_FUTURE_FILE_PLANS.map(
    (filePlan) => filePlan.filePath
  );
}

function approvalRequirementIds() {
  return ACCOUNT_SYNC_ROUTE_SKELETON_APPROVAL_REQUIREMENTS.map(
    (requirement) => requirement.id
  );
}

function stopConditionIds() {
  return ACCOUNT_SYNC_ROUTE_SKELETON_STOP_CONDITIONS.map(
    (stopCondition) => stopCondition.id
  );
}

function validationRequirementIds() {
  return ACCOUNT_SYNC_ROUTE_SKELETON_VALIDATION_REQUIREMENTS.map(
    (requirement) => requirement.id
  );
}

function expectAllowedFutureRoute(routeId: VlxAccountSyncRouteId) {
  const route = getAccountSyncRouteSkeletonAllowedFutureRoute(routeId);

  expect(route, `${routeId} allowed future route`).toBeDefined();

  if (!route) {
    throw new Error(`Missing route skeleton decision route: ${routeId}`);
  }

  return route;
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
        throw new Error('route skeleton decision must not call network helpers');
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

test.describe('account sync route skeleton decision', () => {
  test('exports the required route skeleton decision type surface through static values', () => {
    expect(exportedTypeSmoke).toMatchObject({
      version: 1,
      status: 'design_only_no_route_skeleton_created',
      phase: 'design_only',
      decision: {
        appliesToPr: 69,
        finalVerdict: 'design_only_no_actual_route_skeleton_in_this_pr',
      },
      filePlan: {
        routeId: 'preview',
      },
      nextStep: {
        prNumber: 70,
      },
    });
  });

  test('current phase is design_only and no route skeleton is allowed by this PR', () => {
    expect(ACCOUNT_SYNC_ROUTE_SKELETON_DECISION).toMatchObject({
      appliesToPr: 69,
      currentPhase: 'design_only',
      actualRouteFilesCreatedInThisPr: false,
      routeHandlersCreatedInThisPr: false,
      middlewareCreatedInThisPr: false,
      runtimeIntegrationCreatedInThisPr: false,
      futureSkeletonAllowedNow: false,
      futureSkeletonMayBeProposedOnlyInSeparatePr: true,
      explicitOwnerApprovalRequiredBeforeRouteFiles: true,
      futureSkeletonMustBeDisabledByDefault: true,
      futureSkeletonMustBeMockGated: true,
      futureSkeletonMustNotBeProductionEnabled: true,
      finalVerdict: 'design_only_no_actual_route_skeleton_in_this_pr',
    });
    expect(ACCOUNT_SYNC_ROUTE_SKELETON_DECISION.relationshipPrs).toEqual([
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
      68,
    ]);
  });

  test('future planned route paths are listed only as design data', () => {
    expect(routeIds()).toEqual(ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_ROUTE_IDS);
    expect(routePaths()).toEqual(ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_ROUTE_PATHS);
    expect(filePaths()).toEqual(ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_FILE_PATHS);

    for (const filePlan of ACCOUNT_SYNC_ROUTE_SKELETON_FUTURE_FILE_PLANS) {
      expect(filePlan).toMatchObject({
        futureOnly: true,
        designDataOnly: true,
        createdInThisPr: false,
        routeHandlerCreatedInThisPr: false,
        middlewareCreatedInThisPr: false,
        runtimeIntegrationCreatedInThisPr: false,
        allowedInThisPr: false,
        mayBeProposedInSeparatePr: true,
        explicitOwnerApprovalRequiredBeforeCreation: true,
        disabledByDefaultRequired: true,
        mockGateRequired: true,
        productionEnabled: false,
      });
      expect(existsSync(join(workspaceRoot, filePlan.filePath)), filePlan.filePath).toBe(
        false
      );
    }

    expect(getAccountSyncRouteSkeletonFutureFilePlan('apply')).toMatchObject({
      filePath: 'src/app/api/account/sync/apply/route.ts',
      createdInThisPr: false,
    });
  });

  test('forbidden route paths do not exist', () => {
    for (const forbiddenPath of ACCOUNT_SYNC_ROUTE_SKELETON_FORBIDDEN_PATHS) {
      expect(forbiddenPath).toMatchObject({
        mustNotExistInThisPr: true,
        blocksThisPrIfPresent: true,
      });
      expect(existsSync(join(workspaceRoot, forbiddenPath.path)), forbiddenPath.path).toBe(
        false
      );
    }
  });

  test('future skeleton requires separate PR and explicit owner approval', () => {
    expect(approvalRequirementIds()).toEqual(
      ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_APPROVAL_REQUIREMENT_IDS
    );

    expect(
      getAccountSyncRouteSkeletonApprovalRequirement(
        'explicit_owner_approval_required'
      )
    ).toMatchObject({
      requiredBeforeFutureRouteFiles: true,
      satisfiedByThisPr: false,
      ownerApprovalRequired: true,
      futureSeparatePrRequired: true,
    });
    expect(
      getAccountSyncRouteSkeletonApprovalRequirement(
        'owner_approval_in_pr_body_required'
      )
    ).toMatchObject({
      ownerApprovalRequired: true,
      evidenceRequired: expect.stringContaining('future PR body'),
    });
    expect(
      getAccountSyncRouteSkeletonApprovalRequirement(
        'no_go_gate_preserved_until_owner_changes_it'
      )
    ).toMatchObject({
      ownerApprovalRequired: true,
      satisfiedByThisPr: false,
    });
  });

  test('future route skeleton must be disabled by default and mock-gated', () => {
    expect(ACCOUNT_SYNC_ROUTE_SKELETON_DISABLE_POLICY).toMatchObject({
      disabledByDefaultRequired: true,
      disabledStatusRequiredInFutureSkeleton: true,
      productionEnabledByThisPr: false,
      productionEnablementAllowedInFutureSkeletonPr: false,
      defaultConfigurationMayEnableRoutes: false,
      runtimeRouteIntegrationAllowedInThisPr: false,
      routeHandlersAllowedInThisPr: false,
      applyHardDisabledUntilAllGatesSatisfied: true,
      previewMustRemainReadOnly: true,
      digestAuditMustRemainOwnerOnlyBoundedRedacted: true,
    });
    expect(ACCOUNT_SYNC_ROUTE_SKELETON_MOCK_GATE_POLICY).toMatchObject({
      mockGateRequired: true,
      mockOnlyBeforeProviderIntegration: true,
      realAuthAllowedInThisPr: false,
      databasePersistenceAllowedInThisPr: false,
      authProviderSdkImportsAllowed: false,
      dbProviderSdkImportsAllowed: false,
      validationDependencyImportsAllowed: false,
      loggingProviderSdkImportsAllowed: false,
      paymentProviderSdkImportsAllowed: false,
      networkCallsAllowed: false,
      browserStorageAccessAllowed: false,
      environmentReadsAllowed: false,
      productionDataAccessAllowed: false,
      productionDataMutationAllowed: false,
    });
  });

  test('future apply skeleton remains hard-disabled and preview is read-only', () => {
    const preview = expectAllowedFutureRoute('preview');
    const apply = expectAllowedFutureRoute('apply');

    expect(preview).toMatchObject({
      method: 'POST',
      routePath: '/api/account/sync/preview',
      allowedByThisPr: false,
      readOnlyRequired: true,
      mutatingRoute: false,
      previewReadOnly: true,
      productionEnablementAllowed: false,
    });
    expect(apply).toMatchObject({
      method: 'POST',
      routePath: '/api/account/sync/apply',
      allowedByThisPr: false,
      readOnlyRequired: false,
      mutatingRoute: true,
      applyHardDisabled: true,
      requiresAuthGate: true,
      requiresValidatorGate: true,
      requiresDbGate: true,
      requiresIdempotencyGate: true,
      requiresAuditGate: true,
      requiresMonitoringGate: true,
      requiresRollbackGate: true,
      requiresKillSwitchGate: true,
      requiresManualQaBeforeProduction: true,
      productionDataAccessAllowed: false,
    });
  });

  test('future digest and audit skeletons are bounded owner-only and redacted', () => {
    for (const routeId of ['digest', 'audit'] as const) {
      const route = expectAllowedFutureRoute(routeId);

      expect(route).toMatchObject({
        method: 'GET',
        readOnlyRequired: true,
        mutatingRoute: false,
        digestAuditOwnerOnlyBoundedRedacted: true,
        requiresAuthGate: true,
        requiresValidatorGate: true,
        requiresAuditGate: true,
        requiresMonitoringGate: true,
        requiresManualQaBeforeProduction: true,
        clientAccountIdTrustedAsOwnershipProof: false,
        productionEnablementAllowed: false,
      });
    }
  });

  test('provider DB validator logging network production and package boundaries remain blocked', () => {
    expect(ACCOUNT_SYNC_ROUTE_SKELETON_MOCK_GATE_POLICY).toMatchObject({
      authProviderSdkImportsAllowed: false,
      dbProviderSdkImportsAllowed: false,
      validationDependencyImportsAllowed: false,
      loggingProviderSdkImportsAllowed: false,
      paymentProviderSdkImportsAllowed: false,
      networkCallsAllowed: false,
      browserStorageAccessAllowed: false,
      environmentReadsAllowed: false,
      productionDataAccessAllowed: false,
      providerSpecificCodeAllowedInSyncCore: false,
    });

    for (const fileName of ['package.json', 'package-lock.json'] as const) {
      const rootDependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of ACCOUNT_SYNC_ROUTE_SKELETON_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(rootDependencies, `${fileName} should not add ${dependencyName}`).not.toHaveProperty(
          dependencyName
        );
      }
    }
  });

  test('learning safety boundaries block paid entitlement billing fake mastery and client account ownership proof', () => {
    for (const route of ACCOUNT_SYNC_ROUTE_SKELETON_ALLOWED_FUTURE_ROUTES) {
      expect(route).toMatchObject({
        clientAccountIdTrustedAsOwnershipProof: false,
        fakeMasteryAllowed: false,
        paidEntitlementGrantAllowed: false,
        billingPaymentAllowed: false,
        productionDataAccessAllowed: false,
      });
    }

    expect(ACCOUNT_SYNC_ROUTE_SKELETON_DECISION.safetySummary).toEqual({
      docsContractsTestsOnly: true,
      noRuntimeBehaviorChange: true,
      noProductionDataAccess: true,
      noPaidEntitlementGrant: true,
      noBillingPaymentBehavior: true,
      fakeMasteryBlocked: true,
      clientAccountIdIsNeverOwnershipProof: true,
    });
  });

  test('stop conditions cover P0 owner approval route and safety failures', () => {
    expect(stopConditionIds()).toEqual(
      ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_STOP_CONDITION_IDS
    );

    for (const stopConditionId of ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_STOP_CONDITION_IDS) {
      const stopCondition =
        getAccountSyncRouteSkeletonStopCondition(stopConditionId);

      expect(stopCondition, stopConditionId).toBeDefined();
      expect(stopCondition).toMatchObject({
        severity: 'P0',
        blocksRouteSkeletonCreation: true,
        requiresOwnerDecisionToResume: true,
      });
    }

    expect(getAccountSyncRouteSkeletonStopCondition('apply_can_mutate')).toMatchObject({
      routeIds: ['apply'],
      stopAction: 'disable_apply_and_return_to_design',
    });
    expect(
      getAccountSyncRouteSkeletonStopCondition(
        'route_file_created_without_owner_approval'
      )
    ).toMatchObject({
      stopAction: 'stop_this_pr',
    });
  });

  test('validation requirements include every requested route skeleton decision check', () => {
    expect(validationRequirementIds()).toEqual(
      ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_VALIDATION_REQUIREMENT_IDS
    );

    for (const requirementId of ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_VALIDATION_REQUIREMENT_IDS) {
      const requirement =
        getAccountSyncRouteSkeletonValidationRequirement(requirementId);

      expect(requirement, requirementId).toBeDefined();
      expect(requirement).toMatchObject({
        requiredInThisPr: true,
        status: 'design_contract_only',
      });
    }
  });

  test('route skeleton module files contain no route handlers or forbidden integrations', () => {
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

    for (const relativePath of ACCOUNT_SYNC_ROUTE_SKELETON_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test('route skeleton decision is pure static data and does not access runtime surfaces', () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      filePlanCount: ACCOUNT_SYNC_ROUTE_SKELETON_DECISION_RECORD.futureFilePlans.length,
      routeCount:
        ACCOUNT_SYNC_ROUTE_SKELETON_DECISION_RECORD.allowedFutureRoutes.length,
      stopConditionCount:
        ACCOUNT_SYNC_ROUTE_SKELETON_DECISION_RECORD.stopConditions.length,
      currentPhase:
        ACCOUNT_SYNC_ROUTE_SKELETON_DECISION_RECORD.decision.currentPhase,
      futureSkeletonAllowedNow:
        ACCOUNT_SYNC_ROUTE_SKELETON_DECISION_RECORD.decision
          .futureSkeletonAllowedNow,
      productionEnabled:
        ACCOUNT_SYNC_ROUTE_SKELETON_DECISION_RECORD.decision
          .futureSkeletonMustNotBeProductionEnabled,
    }));

    expect(value).toEqual({
      filePlanCount: ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_FILE_PATHS.length,
      routeCount: ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_ROUTE_IDS.length,
      stopConditionCount:
        ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_STOP_CONDITION_IDS.length,
      currentPhase: 'design_only',
      futureSkeletonAllowedNow: false,
      productionEnabled: true,
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });

  test('README and route skeleton decision docs are linked and explicit', () => {
    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8');
    const doc = readFileSync(
      join(workspaceRoot, 'docs', 'ACCOUNT_SYNC_ROUTE_SKELETON_DECISION.md'),
      'utf8'
    );

    expect(ACCOUNT_SYNC_ROUTE_SKELETON_DOC_FILES).toEqual([
      'docs/ACCOUNT_SYNC_ROUTE_SKELETON_DECISION.md',
      'README.md',
    ]);
    expect(readme).toContain(
      '[Account Sync Route Skeleton Decision](docs/ACCOUNT_SYNC_ROUTE_SKELETON_DECISION.md)'
    );
    expect(doc).toContain('Final verdict: `design_only`, no route skeleton created.');
    expect(doc).toContain('PR #69');
    expect(doc).toContain('src/app/api/account/sync/preview/route.ts');
    expect(doc).toContain('src/app/api/account/sync/apply/route.ts');
    expect(doc).toContain('src/app/api/account/sync/digest/route.ts');
    expect(doc).toContain('src/app/api/account/sync/audit/route.ts');
    expect(doc).toContain('#70 Account sync disabled route skeleton PR only if owner explicitly approves');
  });
});
