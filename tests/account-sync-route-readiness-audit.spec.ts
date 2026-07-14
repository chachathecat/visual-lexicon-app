import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  VLX_ACCOUNT_SYNC_ROUTE_READINESS_AUDIT,
  VLX_ACCOUNT_SYNC_ROUTE_READINESS_GATE_GROUPS,
  VLX_ACCOUNT_SYNC_ROUTE_READINESS_STATUS_VALUES,
  VLX_ACCOUNT_SYNC_ROUTE_READINESS_VERDICT_VALUES,
  getVlxAccountSyncRouteReadiness,
  type VlxAccountSyncRouteImplementationGateId,
  type VlxAccountSyncRouteReadinessInventoryItem,
} from '../src/lib/account-persistence/route-readiness/readiness-gates';
import {
  ACCOUNT_SYNC_ROUTE_READINESS_EXPECTED_GATE_IDS,
  ACCOUNT_SYNC_ROUTE_READINESS_EXPECTED_P0_BLOCKER_IDS,
  ACCOUNT_SYNC_ROUTE_READINESS_EXPECTED_ROUTES,
  ACCOUNT_SYNC_ROUTE_READINESS_FORBIDDEN_ACTUAL_ROUTE_PATHS,
} from '../src/lib/account-persistence/route-readiness/fixtures';
import type { VlxAccountSyncRouteId } from '../src/lib/account-persistence/api-route-design/route-contracts';

const workspaceRoot = process.cwd();

function getRoute(routeId: VlxAccountSyncRouteId) {
  const route = getVlxAccountSyncRouteReadiness(routeId);

  expect(route, `${routeId} readiness route`).toBeDefined();

  if (!route) {
    throw new Error(`Missing readiness route: ${routeId}`);
  }

  return route;
}

function gateIds(route: VlxAccountSyncRouteReadinessInventoryItem) {
  return route.requiredGates.map((gate) => gate.id);
}

function expectBlockedGates(
  routeId: VlxAccountSyncRouteId,
  requiredGateIds: readonly VlxAccountSyncRouteImplementationGateId[]
) {
  const route = getRoute(routeId);

  for (const gateId of requiredGateIds) {
    const requirement = route.requiredGates.find((gate) => gate.id === gateId);

    expect(requirement, `${routeId} missing ${gateId}`).toBeDefined();

    if (!requirement) {
      throw new Error(`${routeId} missing gate ${gateId}`);
    }

    expect(requirement.approvedForRealImplementation).toBe(false);
    expect(requirement.blocksRealApiImplementation).toBe(true);
    expect(requirement.status).not.toBe('ready');
  }
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
        throw new Error('readiness audit must not call network helpers');
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

test.describe('account sync route readiness audit', () => {
  test('defines the gate groups, status values, and verdict values', () => {
    expect(VLX_ACCOUNT_SYNC_ROUTE_READINESS_GATE_GROUPS).toEqual([
      'auth_ownership_gate',
      'schema_validation_gate',
      'payload_size_gate',
      'csrf_session_gate',
      'rate_limit_gate',
      'durable_idempotency_gate',
      'database_transaction_gate',
      'persistence_adapter_gate',
      'audit_logging_gate',
      'privacy_redaction_gate',
      'srs_integrity_gate',
      'fake_mastery_block_gate',
      'paid_entitlement_boundary_gate',
      'billing_payment_boundary_gate',
      'deployment_rollback_gate',
      'monitoring_alerting_gate',
      'production_data_safety_gate',
    ]);
    expect(VLX_ACCOUNT_SYNC_ROUTE_READINESS_STATUS_VALUES).toEqual([
      'ready',
      'blocked',
      'not_started',
      'design_only',
      'requires_separate_pr',
      'requires_owner_approval',
    ]);
    expect(VLX_ACCOUNT_SYNC_ROUTE_READINESS_VERDICT_VALUES).toEqual([
      'no_go',
      'conditional_go',
      'go',
    ]);
  });

  test('readiness audit contains all four planned routes', () => {
    expect(
      VLX_ACCOUNT_SYNC_ROUTE_READINESS_AUDIT.routes.map((route) => ({
        routeId: route.routeId,
        method: route.method,
        path: route.path,
      }))
    ).toEqual(ACCOUNT_SYNC_ROUTE_READINESS_EXPECTED_ROUTES);
  });

  test('every planned route requires an auth ownership gate', () => {
    for (const route of VLX_ACCOUNT_SYNC_ROUTE_READINESS_AUDIT.routes) {
      expect(gateIds(route)).toContain('auth_ownership_check');
      expect(route.requiredGates.find((gate) => gate.id === 'auth_ownership_check')).toMatchObject({
        group: 'auth_ownership_gate',
        approvedForRealImplementation: false,
        blocksRealApiImplementation: true,
      });
    }
  });

  test('route gate inventories match the preview, apply, digest, and audit prerequisites', () => {
    for (const route of VLX_ACCOUNT_SYNC_ROUTE_READINESS_AUDIT.routes) {
      expect(gateIds(route)).toEqual(
        ACCOUNT_SYNC_ROUTE_READINESS_EXPECTED_GATE_IDS[route.routeId]
      );
      expect(route.implementationAllowedInThisPr).toBe(false);
    }
  });

  test('preview is blocked until schema, payload, rate limit, and non-mutation gates are approved', () => {
    expectBlockedGates('preview', [
      'schema_validation',
      'payload_size_limit',
      'rate_limit',
      'no_mutation_guarantee',
    ]);
    expect(getRoute('preview')).toMatchObject({
      mutating: false,
      implementationAllowedInThisPr: false,
    });
  });

  test('apply is blocked until mutating route P0 implementation gates are approved', () => {
    expectBlockedGates('apply', [
      'auth_ownership_check',
      'schema_validation',
      'payload_size_limit',
      'rate_limit',
      'csrf_session_protection',
      'durable_idempotency_storage',
      'transaction_like_commit',
      'audit_logging',
      'rollback_strategy',
    ]);
    expect(getRoute('apply')).toMatchObject({
      mutating: true,
      implementationAllowedInThisPr: false,
    });
  });

  test('digest and audit are blocked until privacy and bounded-response gates are approved', () => {
    expectBlockedGates('digest', [
      'auth_ownership_check',
      'bounded_response',
      'privacy_redaction_policy',
      'sensitive_payload_exclusion',
    ]);
    expectBlockedGates('audit', [
      'auth_ownership_check',
      'bounded_response',
      'privacy_redaction_policy',
      'sensitive_payload_exclusion',
      'no_raw_guest_snapshots',
      'no_raw_server_payloads',
    ]);
  });

  test('explicit blockers remain open and block real API route implementation', () => {
    expect(
      VLX_ACCOUNT_SYNC_ROUTE_READINESS_AUDIT.blockers.map((blocker) => blocker.id)
    ).toEqual(ACCOUNT_SYNC_ROUTE_READINESS_EXPECTED_P0_BLOCKER_IDS);

    for (const blocker of VLX_ACCOUNT_SYNC_ROUTE_READINESS_AUDIT.blockers) {
      expect(blocker).toMatchObject({
        severity: 'P0',
        status: 'open',
        blocksRealApiImplementation: true,
        requiredBefore: 'real_api_route_implementation',
      });
    }
  });

  test('final verdict is No-Go and the next PR is not real production API implementation', () => {
    expect(VLX_ACCOUNT_SYNC_ROUTE_READINESS_AUDIT.finalVerdict).toMatchObject({
      verdict: 'no_go',
      apiRouteImplementationAllowed: false,
      nextRecommendedPr: {
        number: 59,
        realProductionApiImplementationRecommended: false,
        requiresAllP0GatesSatisfiedBeforeRealRoutes: true,
      },
    });
  });

  test('no route implementation is allowed by this PR', () => {
    expect(VLX_ACCOUNT_SYNC_ROUTE_READINESS_AUDIT.implementationScope).toEqual({
      docsContractsTestsOnly: true,
      actualApiRouteFilesAllowed: false,
      routeHandlersAllowed: false,
      middlewareAllowed: false,
      runtimeIntegrationAllowed: false,
      realAuthAllowed: false,
      databasePersistenceAllowed: false,
      providerSdkAllowed: false,
      paymentBillingAllowed: false,
      productionDataAccessAllowed: false,
      deploymentChangesAllowed: false,
    });
  });

  test('no actual route file paths are created', () => {
    for (const relativePath of ACCOUNT_SYNC_ROUTE_READINESS_FORBIDDEN_ACTUAL_ROUTE_PATHS.flatMap(
      (path) =>
        path === 'src/app/api/account/sync'
          ? [
              'src/app/api/account/sync/apply',
              'src/app/api/account/sync/audit',
            ]
          : [path]
    )) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }
  });

  test('readiness module files do not contain route handlers or forbidden integrations', () => {
    const readinessModuleFiles = [
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'route-readiness',
        'readiness-gates.ts'
      ),
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'route-readiness',
        'fixtures.ts'
      ),
    ];
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\b/,
      /\blocalStorage\b/,
      /\bprocess\.env\b/,
      /from ['"]@supabase\//,
      /from ['"]@clerk\//,
      /from ['"]next-auth/,
      /from ['"]firebase/,
      /from ['"]stripe/,
      /from ['"]paddle/,
    ];

    for (const filePath of readinessModuleFiles) {
      const fileText = readFileSync(filePath, 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${filePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test('readiness audit is pure static data and does not access runtime surfaces', () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      routeCount: VLX_ACCOUNT_SYNC_ROUTE_READINESS_AUDIT.routes.length,
      verdict: VLX_ACCOUNT_SYNC_ROUTE_READINESS_AUDIT.finalVerdict.verdict,
      blockerCount: VLX_ACCOUNT_SYNC_ROUTE_READINESS_AUDIT.blockers.length,
    }));

    expect(value).toEqual({
      routeCount: 4,
      verdict: 'no_go',
      blockerCount: 10,
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });

  test('safety policy blocks paid entitlement, fake mastery, billing, and SRS shortcuts', () => {
    expect(VLX_ACCOUNT_SYNC_ROUTE_READINESS_AUDIT.safetyPolicy).toEqual({
      accountSyncRoutesCanGrantPaidEntitlement: false,
      paidEntitlementGrantImpossibleFromSyncRoutes: true,
      billingPaymentCheckoutSubscriptionOutsideSync: true,
      fakeLocalMasteryCanBecomeServerMastery: false,
      fakeMasteryBlocked: true,
      reviewEventsRemainSourceOfTruth: true,
      reviewStateRecomputedFromEventEvidence: true,
      duplicateReviewEventsCanAdvanceSrsTwice: false,
      sameIdempotencyKeyDifferentPayloadRejected: true,
      packProgressWithoutReviewEventEvidenceAuditOnly: true,
      digestAuditExposeFullSensitiveState: false,
      digestAuditExposeRawPayloads: false,
      previewCanMutateServerState: false,
      applyRejectsBlockedPlans: true,
    });
  });
});
