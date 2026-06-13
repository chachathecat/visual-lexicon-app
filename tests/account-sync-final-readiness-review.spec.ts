import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  ACCOUNT_SYNC_FINAL_IMPLEMENTATION_PHASE,
  ACCOUNT_SYNC_FINAL_READINESS_REVIEW,
  ACCOUNT_SYNC_FINAL_READINESS_VERDICT,
  ACCOUNT_SYNC_REAL_ROUTE_IMPLEMENTATION_POLICY,
  getAccountSyncFinalReadinessGate,
  getAccountSyncOutstandingBlocker,
  type AccountSyncFinalReadinessReview,
  type AccountSyncImplementationRecommendation,
  type AccountSyncImplementationPhase,
  type AccountSyncNextPrRecommendation,
  type AccountSyncOutstandingBlocker,
  type AccountSyncReadinessGateId,
  type AccountSyncReadinessGateSeverity,
  type AccountSyncReadinessGateStatus,
  type AccountSyncRealRouteImplementationPolicy,
} from '../src/lib/account-persistence/final-readiness/final-readiness-review';
import {
  ACCOUNT_SYNC_FINAL_READINESS_EXPECTED_BLOCKER_IDS,
  ACCOUNT_SYNC_FINAL_READINESS_EXPECTED_GATE_IDS,
  ACCOUNT_SYNC_FINAL_READINESS_EXPECTED_SAFETY_BOUNDARY_IDS,
  ACCOUNT_SYNC_FINAL_READINESS_FORBIDDEN_ACTUAL_ROUTE_PATHS,
  ACCOUNT_SYNC_FINAL_READINESS_MODULE_FILES,
} from '../src/lib/account-persistence/final-readiness/fixtures';

const workspaceRoot = process.cwd();

type RequiredFinalReadinessTypeSurface = {
  review: AccountSyncFinalReadinessReview;
  recommendation: AccountSyncImplementationRecommendation;
  phase: AccountSyncImplementationPhase;
  nextPr: AccountSyncNextPrRecommendation;
  blocker: AccountSyncOutstandingBlocker;
  policy: AccountSyncRealRouteImplementationPolicy;
  gateId: AccountSyncReadinessGateId;
  status: AccountSyncReadinessGateStatus;
  severity: AccountSyncReadinessGateSeverity;
};

const exportedTypeSmoke: RequiredFinalReadinessTypeSurface = {
  review: ACCOUNT_SYNC_FINAL_READINESS_REVIEW,
  recommendation: ACCOUNT_SYNC_FINAL_READINESS_REVIEW.implementationRecommendation,
  phase: ACCOUNT_SYNC_FINAL_IMPLEMENTATION_PHASE,
  nextPr: ACCOUNT_SYNC_FINAL_READINESS_REVIEW.implementationRecommendation.nextPr,
  blocker: ACCOUNT_SYNC_FINAL_READINESS_REVIEW.outstandingBlockers[0],
  policy: ACCOUNT_SYNC_REAL_ROUTE_IMPLEMENTATION_POLICY,
  gateId: ACCOUNT_SYNC_FINAL_READINESS_REVIEW.gateMatrix[0].id,
  status: ACCOUNT_SYNC_FINAL_READINESS_REVIEW.gateMatrix[0].status,
  severity: ACCOUNT_SYNC_FINAL_READINESS_REVIEW.gateMatrix[0].severity,
};

function gateIds() {
  return ACCOUNT_SYNC_FINAL_READINESS_REVIEW.gateMatrix.map((gate) => gate.id);
}

function blockerIds() {
  return ACCOUNT_SYNC_FINAL_READINESS_REVIEW.outstandingBlockers.map(
    (blocker) => blocker.id
  );
}

function safetyBoundaryIds() {
  return ACCOUNT_SYNC_FINAL_READINESS_REVIEW.safetyBoundaries.map(
    (boundary) => boundary.id
  );
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
        throw new Error('final readiness review must not call network helpers');
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

test.describe('account sync final readiness review', () => {
  test('exports the required final readiness type surface through static contract values', () => {
    expect(exportedTypeSmoke).toMatchObject({
      phase: 'design_only',
      gateId: 'route_readiness',
      status: 'completed_design_contract',
      severity: 'P0',
    });
  });

  test('includes all consolidated gate groups from PRs #58 through #63', () => {
    expect(gateIds()).toEqual(ACCOUNT_SYNC_FINAL_READINESS_EXPECTED_GATE_IDS);
    expect(ACCOUNT_SYNC_FINAL_READINESS_REVIEW.sourcePrs).toEqual([
      58,
      59,
      60,
      61,
      62,
      63,
    ]);

    for (const gateId of ACCOUNT_SYNC_FINAL_READINESS_EXPECTED_GATE_IDS) {
      const gate = getAccountSyncFinalReadinessGate(gateId);

      expect(gate, gateId).toBeDefined();
      expect(gate).toMatchObject({
        requiredBeforeRealRoutes: true,
        blocksRealApiRouteImplementation: true,
        implementationComplete: false,
      });
    }
  });

  test('final verdict is No-Go and implementation phase remains design_only', () => {
    expect(ACCOUNT_SYNC_FINAL_READINESS_VERDICT).toBe('no_go_for_real_api_routes');
    expect(ACCOUNT_SYNC_FINAL_IMPLEMENTATION_PHASE).toBe('design_only');
    expect(ACCOUNT_SYNC_FINAL_READINESS_REVIEW).toMatchObject({
      implementationPhase: 'design_only',
      finalVerdict: 'no_go_for_real_api_routes',
    });
  });

  test('real API route implementation is not recommended yet', () => {
    expect(ACCOUNT_SYNC_FINAL_READINESS_REVIEW.implementationRecommendation).toMatchObject({
      implementationPhase: 'design_only',
      verdict: 'no_go_for_real_api_routes',
      recommendation: 'do_not_begin_real_api_route_implementation',
      realApiRouteImplementationRecommended: false,
      realApiRouteImplementationBlocked: true,
      nextPr: {
        number: 65,
        recommendedOption: 'Auth provider final decision and mock integration boundary',
        realApiRouteImplementationRecommended: false,
        docsContractsTestsOnly: true,
      },
    });
  });

  test('all prior safety boundaries are preserved', () => {
    expect(safetyBoundaryIds()).toEqual(
      ACCOUNT_SYNC_FINAL_READINESS_EXPECTED_SAFETY_BOUNDARY_IDS
    );

    for (const boundary of ACCOUNT_SYNC_FINAL_READINESS_REVIEW.safetyBoundaries) {
      expect(boundary).toMatchObject({
        preserved: true,
        allowsViolation: false,
        requiredBeforeRealRoutes: true,
      });
    }

    expect(ACCOUNT_SYNC_REAL_ROUTE_IMPLEMENTATION_POLICY).toMatchObject({
      billingPaymentIntegrationAllowed: false,
      paidEntitlementGrantAllowed: false,
      rawPayloadExposureAllowed: false,
    });
  });

  test('required implementation blockers remain outstanding', () => {
    expect(blockerIds()).toEqual(ACCOUNT_SYNC_FINAL_READINESS_EXPECTED_BLOCKER_IDS);

    for (const blockerId of ACCOUNT_SYNC_FINAL_READINESS_EXPECTED_BLOCKER_IDS) {
      const blocker = getAccountSyncOutstandingBlocker(blockerId);

      expect(blocker, blockerId).toBeDefined();
      expect(blocker).toMatchObject({
        severity: 'P0',
        status: 'open',
        separatePrRequired: true,
        requiredBefore: 'real_api_route_implementation',
        blocksRealApiRouteImplementation: true,
      });
    }
  });

  test('provider, database, schema validation, rate limit, monitoring, deployment, and QA blockers are explicit', () => {
    expect(getAccountSyncOutstandingBlocker('auth_provider_decision_outstanding')).toMatchObject({
      gateId: 'provider_decision',
      ownerDecisionRequired: true,
    });
    expect(
      getAccountSyncOutstandingBlocker('database_persistence_decision_outstanding')
    ).toMatchObject({
      gateId: 'database_decision',
      ownerDecisionRequired: true,
    });
    expect(
      getAccountSyncOutstandingBlocker(
        'runtime_schema_validation_implementation_outstanding'
      )
    ).toMatchObject({
      gateId: 'schema_validation',
    });
    expect(
      getAccountSyncOutstandingBlocker(
        'production_rate_limiting_implementation_outstanding'
      )
    ).toMatchObject({
      gateId: 'route_readiness',
    });
    expect(
      getAccountSyncOutstandingBlocker('monitoring_alerting_provider_outstanding')
    ).toMatchObject({
      gateId: 'monitoring_alerting',
    });
    expect(
      getAccountSyncOutstandingBlocker('deployment_rollback_mechanism_outstanding')
    ).toMatchObject({
      gateId: 'deployment_decision',
    });
    expect(getAccountSyncOutstandingBlocker('manual_authenticated_qa_outstanding')).toMatchObject({
      gateId: 'manual_qa',
    });
  });

  test('real route implementation policy blocks route files, handlers, middleware, providers, validation dependencies, and runtime access', () => {
    expect(ACCOUNT_SYNC_REAL_ROUTE_IMPLEMENTATION_POLICY).toEqual({
      plannedRouteIds: ['preview', 'apply', 'digest', 'audit'],
      realApiRouteImplementationAllowed: false,
      apiRouteFilesAllowed: false,
      routeHandlersAllowed: false,
      middlewareAllowed: false,
      runtimeRouteIntegrationAllowed: false,
      authProviderSdkAllowed: false,
      databaseProviderSdkAllowed: false,
      loggingProviderSdkAllowed: false,
      validationDependencyAllowed: false,
      networkCallsAllowed: false,
      browserStorageAccessAllowed: false,
      environmentReadsAllowed: false,
      billingPaymentIntegrationAllowed: false,
      paidEntitlementGrantAllowed: false,
      rawPayloadExposureAllowed: false,
      blockedUntilAllOutstandingBlockersClose: true,
    });
  });

  test('no actual API routes, route handlers, or middleware are created', () => {
    for (const relativePath of ACCOUNT_SYNC_FINAL_READINESS_FORBIDDEN_ACTUAL_ROUTE_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }
  });

  test('final readiness module files contain no route handlers or forbidden integrations', () => {
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
      /from ['"]ajv/,
      /from ['"]@supabase\//,
      /from ['"]@clerk\//,
      /from ['"]@auth\//,
      /from ['"]next-auth/,
      /from ['"]better-auth/,
      /from ['"]firebase/,
      /from ['"]lucia/,
      /from ['"]passport/,
      /from ['"]prisma/,
      /from ['"]drizzle/,
      /from ['"]mongoose/,
      /from ['"]pg/,
      /from ['"]mysql/,
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

    for (const relativePath of ACCOUNT_SYNC_FINAL_READINESS_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test('final readiness review is pure static data and does not access runtime surfaces', () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      gateCount: ACCOUNT_SYNC_FINAL_READINESS_REVIEW.gateMatrix.length,
      blockerCount: ACCOUNT_SYNC_FINAL_READINESS_REVIEW.outstandingBlockers.length,
      verdict: ACCOUNT_SYNC_FINAL_READINESS_REVIEW.finalVerdict,
      phase: ACCOUNT_SYNC_FINAL_READINESS_REVIEW.implementationPhase,
      routeImplementationAllowed:
        ACCOUNT_SYNC_FINAL_READINESS_REVIEW.realRouteImplementationPolicy
          .realApiRouteImplementationAllowed,
    }));

    expect(value).toEqual({
      gateCount: ACCOUNT_SYNC_FINAL_READINESS_EXPECTED_GATE_IDS.length,
      blockerCount: ACCOUNT_SYNC_FINAL_READINESS_EXPECTED_BLOCKER_IDS.length,
      verdict: 'no_go_for_real_api_routes',
      phase: 'design_only',
      routeImplementationAllowed: false,
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });

  test('README and final readiness review docs are linked and explicit', () => {
    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8');
    const doc = readFileSync(
      join(workspaceRoot, 'docs', 'ACCOUNT_SYNC_FINAL_READINESS_REVIEW.md'),
      'utf8'
    );

    expect(readme).toContain(
      '[Account Sync Final Readiness Review](docs/ACCOUNT_SYNC_FINAL_READINESS_REVIEW.md)'
    );
    expect(doc).toContain('Final verdict: **no_go_for_real_api_routes**.');
    expect(doc).toContain('Real API route implementation remains blocked.');
    expect(doc).toContain('Do not implement real account sync routes until the owner approves');
    expect(doc).toContain('#65 Auth provider final decision and mock integration boundary');
  });
});
