import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
  VLX_ACCOUNT_SYNC_ROUTE_DEFINITIONS,
  VLX_ACCOUNT_SYNC_ROUTE_SAFETY_POLICY,
  getVlxAccountSyncRouteDefinition,
} from '../src/lib/account-persistence/api-route-design/route-contracts';
import {
  ACCOUNT_SYNC_APPLY_ROUTE_REQUEST_FIXTURE,
  ACCOUNT_SYNC_APPLY_ROUTE_RESPONSE_FIXTURE,
  ACCOUNT_SYNC_AUDIT_ROUTE_RESPONSE_FIXTURE,
  ACCOUNT_SYNC_DIGEST_ROUTE_RESPONSE_FIXTURE,
  ACCOUNT_SYNC_PREVIEW_ROUTE_REQUEST_FIXTURE,
} from '../src/lib/account-persistence/api-route-design/fixtures';

const workspaceRoot = process.cwd();

function routePath(routeId: 'preview' | 'apply' | 'digest' | 'audit') {
  return join(workspaceRoot, 'src', 'lib', 'account-persistence', 'api-route-design', routeId);
}

function withNoExternalSideEffects<TValue>(
  callback: () => Promise<TValue> | TValue
) {
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
        throw new Error('fetch must not be called by route design contracts');
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

  const restore = () => {
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
  };

  return Promise.resolve()
    .then(callback)
    .then((value) => {
      restore();
      return {
        value,
        sideEffects: {
          fetchAccessed,
          localStorageAccessed,
          processEnvAccessed,
          providerSurfaceAccessed,
        },
      };
    })
    .catch((error) => {
      restore();
      throw error;
    });
}

test.describe('account sync API route design contracts', () => {
  test('reads route design contracts and fixtures without external side effects', async () => {
    const { sideEffects, value } = await withNoExternalSideEffects(() => {
      return {
        routeCount: VLX_ACCOUNT_SYNC_ROUTE_DEFINITIONS.length,
        previewOnly: ACCOUNT_SYNC_PREVIEW_ROUTE_REQUEST_FIXTURE.previewOnly,
      };
    });

    expect(value).toEqual({
      routeCount: 4,
      previewOnly: true,
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });

  test('route registry includes exactly the planned preview, apply, digest, and audit routes', async () => {
    expect(
      VLX_ACCOUNT_SYNC_ROUTE_DEFINITIONS.map((definition) => ({
        method: definition.method,
        path: definition.path,
      }))
    ).toEqual([
      {
        method: 'POST',
        path: '/api/account/sync/preview',
      },
      {
        method: 'POST',
        path: '/api/account/sync/apply',
      },
      {
        method: 'GET',
        path: '/api/account/sync/digest',
      },
      {
        method: 'GET',
        path: '/api/account/sync/audit',
      },
    ]);
  });

  test('preview is non-mutating, apply is mutating but blocked from implementation, and digest/audit are read-only', async () => {
    const preview = getVlxAccountSyncRouteDefinition('preview');
    const apply = getVlxAccountSyncRouteDefinition('apply');
    const digest = getVlxAccountSyncRouteDefinition('digest');
    const audit = getVlxAccountSyncRouteDefinition('audit');

    expect(preview).toMatchObject({
      mutating: false,
      readOnly: true,
      routeHandlerFileAllowed: false,
      runtimeIntegrationAllowed: false,
    });
    expect(apply).toMatchObject({
      mutating: true,
      readOnly: false,
      blockedFromImplementationInThisPr: true,
      implementationStatus: 'design_only_blocked_from_runtime',
      routeHandlerFileAllowed: false,
      requiresIdempotencyKey: true,
      futureTransactionLikeCommitRequired: true,
      rejectsBlockedPlans: true,
    });
    expect(digest).toMatchObject({
      mutating: false,
      readOnly: true,
      returnsFullSensitiveState: false,
    });
    expect(audit).toMatchObject({
      mutating: false,
      readOnly: true,
      returnsFullSensitiveState: false,
    });
  });

  test('preview and apply request fixtures require the account sync payload version', async () => {
    expect(ACCOUNT_SYNC_PREVIEW_ROUTE_REQUEST_FIXTURE).toMatchObject({
      accountSyncPayloadVersion: VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
      previewOnly: true,
    });
    expect(ACCOUNT_SYNC_PREVIEW_ROUTE_REQUEST_FIXTURE.localSnapshot).toMatchObject({
      schemaVersion: VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
    });
    expect(ACCOUNT_SYNC_APPLY_ROUTE_REQUEST_FIXTURE).toMatchObject({
      accountSyncPayloadVersion: VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
      idempotencyKey: expect.stringMatching(/^idem-/),
    });
  });

  test('apply response contract includes counts and digest', async () => {
    expect(ACCOUNT_SYNC_APPLY_ROUTE_RESPONSE_FIXTURE).toMatchObject({
      ok: true,
      route: 'apply',
      applicationStatus: 'accepted',
      counts: {
        accepted: 1,
        skipped: 0,
        rejected: 0,
        audit: 0,
      },
      digest: {
        savedWordSlugs: ['dissonance'],
        syncCursor: 'account-sync-api-route-design-cursor-1',
      },
      transactionPolicy: 'future_transaction_like_commit_required',
    });
  });

  test('route safety policy keeps paid entitlement and billing outside sync while requiring future auth and limits', async () => {
    expect(VLX_ACCOUNT_SYNC_ROUTE_SAFETY_POLICY).toMatchObject({
      designOnly: true,
      neverGrantsPaidEntitlement: true,
      billingPaymentSubscriptionCheckoutOutsideSync: true,
      requiresFutureAuthBoundary: true,
      requiresFutureRateLimit: true,
      requiresFuturePayloadSizeLimit: true,
      requiresFutureSchemaValidation: true,
      requiresFutureAuditLogging: true,
      requiresFutureCsrfSessionProtection: true,
      implementsAuth: false,
      implementsDatabasePersistence: false,
      implementsBilling: false,
    });
  });

  test('route safety policy preserves SRS evidence and conflict-resolution boundaries', async () => {
    expect(VLX_ACCOUNT_SYNC_ROUTE_SAFETY_POLICY).toMatchObject({
      previewIsReadOnly: true,
      applyRequiresIdempotencyKey: true,
      applyRejectsBlockedPlans: true,
      sameIdempotencyKeyDifferentPayloadRejected: true,
      reviewEventsSourceOfTruth: true,
      reviewStateRecomputedFromEventEvidence: true,
      duplicateSavesPreserveReviewState: true,
      duplicateReviewEventsDoNotAdvanceSrs: true,
      packProgressWithoutEventEvidenceAuditOnly: true,
      upgradeInterestAttributionOnly: true,
      blocksFakeMastery: true,
    });
  });

  test('digest and audit responses avoid full sensitive state and raw payloads', async () => {
    expect(ACCOUNT_SYNC_DIGEST_ROUTE_RESPONSE_FIXTURE).toMatchObject({
      route: 'digest',
      containsFullSensitiveState: false,
      ownerOnlyAfterAuth: true,
    });
    expect(ACCOUNT_SYNC_AUDIT_ROUTE_RESPONSE_FIXTURE).toMatchObject({
      route: 'audit',
      containsRawSensitivePayloads: false,
      ownerOnlyAfterAuth: true,
    });
    expect(
      ACCOUNT_SYNC_AUDIT_ROUTE_RESPONSE_FIXTURE.auditSummaries.every(
        (summary) =>
          !summary.grantsPaidEntitlement &&
          !summary.callsNetwork &&
          !summary.containsRawSensitivePayload
      )
    ).toBe(true);
  });

  test('no real route file paths are created for this design-only PR', () => {
    const forbiddenRoutePaths = [
      join(workspaceRoot, 'app', 'api', 'account', 'sync'),
      join(workspaceRoot, 'pages', 'api', 'account', 'sync'),
      join(workspaceRoot, 'src', 'app', 'api', 'account', 'sync'),
      join(workspaceRoot, 'src', 'pages', 'api', 'account', 'sync'),
      join(workspaceRoot, 'src', 'lib', 'account-persistence', 'api-route-design', 'route.ts'),
      routePath('preview'),
      routePath('apply'),
      routePath('digest'),
      routePath('audit'),
    ];

    for (const forbiddenPath of forbiddenRoutePaths) {
      expect(existsSync(forbiddenPath), forbiddenPath).toBe(false);
    }
  });

  test('contract files do not contain route handlers, network calls, storage access, env reads, or provider SDK imports', () => {
    const contractFiles = [
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'api-route-design',
        'route-contracts.ts'
      ),
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'api-route-design',
        'fixtures.ts'
      ),
    ];
    const forbiddenPatterns = [
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bfetch\s*\(/,
      /\blocalStorage\./,
      /\bprocess\.env\b/,
      /from ['"]@supabase\//,
      /from ['"]@clerk\//,
      /from ['"]next-auth/,
      /from ['"]firebase/,
      /from ['"]stripe/,
      /from ['"]paddle/,
    ];

    for (const filePath of contractFiles) {
      const fileText = readFileSync(filePath, 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${filePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });
});
