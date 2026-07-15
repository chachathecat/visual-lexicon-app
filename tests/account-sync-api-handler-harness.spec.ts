import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  handleAccountSyncApplyMock,
  handleAccountSyncAuditMock,
  handleAccountSyncDigestMock,
  handleAccountSyncPreviewMock,
  VLX_ACCOUNT_SYNC_MOCK_HANDLER_REGISTRY,
} from '../src/lib/account-persistence/api-handler-harness/mock-handlers';
import {
  ACCOUNT_SYNC_API_HANDLER_APPLY_REQUEST_FIXTURE,
  ACCOUNT_SYNC_API_HANDLER_AUDIT_REQUEST_FIXTURE,
  ACCOUNT_SYNC_API_HANDLER_DIGEST_REQUEST_FIXTURE,
  ACCOUNT_SYNC_API_HANDLER_DIGEST_SERVER_STATE,
  ACCOUNT_SYNC_API_HANDLER_FAKE_MASTERY_APPLY_REQUEST_FIXTURE,
  ACCOUNT_SYNC_API_HANDLER_HARNESS_IDEMPOTENCY_KEY,
  ACCOUNT_SYNC_API_HANDLER_HARNESS_UPGRADE_IDEMPOTENCY_KEY,
  ACCOUNT_SYNC_API_HANDLER_PREVIEW_REQUEST_FIXTURE,
  ACCOUNT_SYNC_API_HANDLER_UPGRADE_APPLY_REQUEST_FIXTURE,
  createAccountSyncApiHandlerAuditServerState,
  createAccountSyncApiHandlerMockContext,
} from '../src/lib/account-persistence/api-handler-harness/fixtures';
import type {
  VlxAccountSyncMockHandlerResponse,
  VlxAccountSyncMockRequest,
  VlxAccountSyncMockResponseBody,
} from '../src/lib/account-persistence/api-handler-harness/handler-contracts';

const workspaceRoot = process.cwd();

function collectFiles(root: string, relativeRoot = ''): string[] {
  if (!existsSync(root)) return [];

  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = join(relativeRoot, entry.name);
    const absolutePath = join(root, entry.name);
    return entry.isDirectory()
      ? collectFiles(absolutePath, relativePath)
      : [relativePath.replaceAll('\\', '/')];
  });
}

function expectOk<TBody extends VlxAccountSyncMockResponseBody>(
  response: VlxAccountSyncMockHandlerResponse<TBody>
) {
  expect(response.ok).toBe(true);

  if (!response.ok) {
    throw new Error(response.error.message);
  }

  return response.body;
}

function expectError(response: VlxAccountSyncMockHandlerResponse) {
  expect(response.ok).toBe(false);

  if (response.ok) {
    throw new Error('Expected mock handler error response.');
  }

  return response.error;
}

function snapshotState(value: unknown) {
  return JSON.stringify(value);
}

function withNoExternalSideEffects(callback: () => void) {
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
        throw new Error('network helper must not be called by handler harness');
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
    callback();
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

  return {
    fetchAccessed,
    localStorageAccessed,
    processEnvAccessed,
    providerSurfaceAccessed,
  };
}

test.describe('account sync API handler harness', () => {
  test('mock handler registry exposes preview, apply, digest, and audit handlers only', () => {
    expect(Object.keys(VLX_ACCOUNT_SYNC_MOCK_HANDLER_REGISTRY).sort()).toEqual([
      'apply',
      'audit',
      'digest',
      'preview',
    ]);
  });

  test('preview mock handler returns success and does not mutate supplied state', () => {
    const initialServerState = ACCOUNT_SYNC_API_HANDLER_DIGEST_SERVER_STATE;
    const before = snapshotState(initialServerState);
    const response = handleAccountSyncPreviewMock(
      ACCOUNT_SYNC_API_HANDLER_PREVIEW_REQUEST_FIXTURE,
      createAccountSyncApiHandlerMockContext({ initialServerState })
    );
    const body = expectOk(response);

    expect(response.status).toBe(200);
    expect(response.noNetwork).toBe(true);
    expect(response.noRuntime).toBe(true);
    expect(body.route).toBe('preview');
    expect(body.harnessStatus).toBe('disabled_mock_only');
    expect(body.mutatedServerState).toBe(false);
    expect(body.preview.mutatesOnPreview).toBe(false);
    expect(body.safety.neverGrantsPaidEntitlement).toBe(true);
    expect(snapshotState(initialServerState)).toBe(before);
  });

  test('apply mock handler returns counts, digest, and audit-safe response shape', () => {
    const response = handleAccountSyncApplyMock(
      ACCOUNT_SYNC_API_HANDLER_APPLY_REQUEST_FIXTURE,
      createAccountSyncApiHandlerMockContext()
    );
    const body = expectOk(response);

    expect(response.status).toBe(200);
    expect(response.counts).toEqual({
      accepted: 1,
      skipped: 0,
      rejected: 0,
      audit: 0,
    });
    expect(body.digest.savedWordSlugs).toEqual(['dissonance']);
    expect(body.applicationStatus).toBe('accepted');
    expect(body.noPaidEntitlementGranted).toBe(true);
    expect(body.safety.neverGrantsPaidEntitlement).toBe(true);
    expect(body.auditSummaries.every((summary) => !summary.containsRawSensitivePayload)).toBe(
      true
    );
  });

  test('apply mock handler is idempotent for the same key and same payload', () => {
    const context = createAccountSyncApiHandlerMockContext();
    const first = handleAccountSyncApplyMock(
      ACCOUNT_SYNC_API_HANDLER_APPLY_REQUEST_FIXTURE,
      context
    );
    const firstBody = expectOk(first);
    const second = handleAccountSyncApplyMock(
      {
        ...ACCOUNT_SYNC_API_HANDLER_APPLY_REQUEST_FIXTURE,
        requestId: 'account-sync-api-handler-harness-apply-retry-1',
      },
      createAccountSyncApiHandlerMockContext({
        mockIdempotencyLedger: first.nextMockIdempotencyLedger,
      })
    );
    const secondBody = expectOk(second);

    expect(first.nextMockIdempotencyLedger).toBeDefined();
    expect(secondBody.idempotency).toEqual({
      key: ACCOUNT_SYNC_API_HANDLER_HARNESS_IDEMPOTENCY_KEY,
      outcome: 'replayed',
      samePayloadReplay: true,
    });
    expect(secondBody.counts).toEqual(firstBody.counts);
    expect(secondBody.digest).toEqual(firstBody.digest);
  });

  test('apply mock handler rejects missing idempotencyKey', () => {
    const response = handleAccountSyncApplyMock(
      {
        ...ACCOUNT_SYNC_API_HANDLER_APPLY_REQUEST_FIXTURE,
        idempotencyKey: '',
        body: {
          ...ACCOUNT_SYNC_API_HANDLER_APPLY_REQUEST_FIXTURE.body,
          idempotencyKey: '',
        },
      },
      createAccountSyncApiHandlerMockContext()
    );
    const error = expectError(response);

    expect(response.status).toBe(400);
    expect(error.code).toBe('missing_idempotency_key');
  });

  test('apply mock handler rejects idempotency payload conflict and blocked plan', () => {
    const first = handleAccountSyncApplyMock(
      ACCOUNT_SYNC_API_HANDLER_APPLY_REQUEST_FIXTURE,
      createAccountSyncApiHandlerMockContext()
    );
    expectOk(first);

    const conflict = handleAccountSyncApplyMock(
      {
        ...ACCOUNT_SYNC_API_HANDLER_UPGRADE_APPLY_REQUEST_FIXTURE,
        idempotencyKey: ACCOUNT_SYNC_API_HANDLER_HARNESS_IDEMPOTENCY_KEY,
        body: {
          ...ACCOUNT_SYNC_API_HANDLER_UPGRADE_APPLY_REQUEST_FIXTURE.body,
          idempotencyKey: ACCOUNT_SYNC_API_HANDLER_HARNESS_IDEMPOTENCY_KEY,
        },
      },
      createAccountSyncApiHandlerMockContext({
        mockIdempotencyLedger: first.nextMockIdempotencyLedger,
      })
    );
    const conflictError = expectError(conflict);
    const blocked = handleAccountSyncApplyMock(
      ACCOUNT_SYNC_API_HANDLER_FAKE_MASTERY_APPLY_REQUEST_FIXTURE,
      createAccountSyncApiHandlerMockContext()
    );
    const blockedError = expectError(blocked);

    expect(conflict.status).toBe(409);
    expect(conflictError.code).toBe('idempotency_payload_conflict');
    expect(blocked.status).toBe(409);
    expect(blockedError.code).toBe('blocked_plan');
    expect(blocked.accountDigest?.reviewStateSlugs).toEqual([]);
  });

  test('preview and apply reject missing accountSyncPayloadVersion', () => {
    const preview = handleAccountSyncPreviewMock(
      {
        ...ACCOUNT_SYNC_API_HANDLER_PREVIEW_REQUEST_FIXTURE,
        accountSyncPayloadVersion: undefined,
        body: {
          ...ACCOUNT_SYNC_API_HANDLER_PREVIEW_REQUEST_FIXTURE.body,
          accountSyncPayloadVersion: undefined,
        },
      },
      createAccountSyncApiHandlerMockContext()
    );
    const apply = handleAccountSyncApplyMock(
      {
        ...ACCOUNT_SYNC_API_HANDLER_APPLY_REQUEST_FIXTURE,
        accountSyncPayloadVersion: undefined,
        body: {
          ...ACCOUNT_SYNC_API_HANDLER_APPLY_REQUEST_FIXTURE.body,
          accountSyncPayloadVersion: undefined,
        },
      },
      createAccountSyncApiHandlerMockContext()
    );

    expect(expectError(preview).code).toBe('invalid_payload_version');
    expect(expectError(apply).code).toBe('invalid_payload_version');
  });

  test('preview, apply, digest, and audit require mock auth without implementing real auth', () => {
    const contextWithoutAuth = createAccountSyncApiHandlerMockContext({
      mockAuthState: undefined,
    });
    const responses = [
      handleAccountSyncPreviewMock(
        ACCOUNT_SYNC_API_HANDLER_PREVIEW_REQUEST_FIXTURE,
        contextWithoutAuth
      ),
      handleAccountSyncApplyMock(
        ACCOUNT_SYNC_API_HANDLER_APPLY_REQUEST_FIXTURE,
        contextWithoutAuth
      ),
      handleAccountSyncDigestMock(
        ACCOUNT_SYNC_API_HANDLER_DIGEST_REQUEST_FIXTURE,
        contextWithoutAuth
      ),
      handleAccountSyncAuditMock(
        ACCOUNT_SYNC_API_HANDLER_AUDIT_REQUEST_FIXTURE,
        contextWithoutAuth
      ),
    ];

    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(response.safety.implementsAuth).toBe(false);
      expect(expectError(response).code).toBe('auth_required_future_boundary');
    }
  });

  test('digest mock handler returns digest only, not full sensitive state', () => {
    const response = handleAccountSyncDigestMock(
      ACCOUNT_SYNC_API_HANDLER_DIGEST_REQUEST_FIXTURE,
      createAccountSyncApiHandlerMockContext({
        initialServerState: ACCOUNT_SYNC_API_HANDLER_DIGEST_SERVER_STATE,
      })
    );
    const body = expectOk(response);

    expect(body.digestOnly).toBe(true);
    expect(body.containsFullSensitiveState).toBe(false);
    expect(body.digest.savedWordSlugs).toEqual(['dissonance']);
    expect(body).not.toHaveProperty('savedWords');
    expect(body).not.toHaveProperty('reviewState');
    expect(body).not.toHaveProperty('reviewEvents');
    expect(body).not.toHaveProperty('upgradeInterest');
  });

  test('audit mock handler returns bounded summaries only', () => {
    const response = handleAccountSyncAuditMock(
      {
        ...ACCOUNT_SYNC_API_HANDLER_AUDIT_REQUEST_FIXTURE,
        query: {
          limit: 25,
        },
      },
      createAccountSyncApiHandlerMockContext({
        initialServerState: createAccountSyncApiHandlerAuditServerState(25),
      })
    );
    const body = expectOk(response);

    expect(body.bounded).toBe(true);
    expect(body.maxSummaries).toBe(20);
    expect(body.auditSummaries).toHaveLength(20);
    expect(
      body.auditSummaries.every(
        (summary) =>
          !summary.containsRawSensitivePayload &&
          !summary.grantsPaidEntitlement &&
          !summary.callsNetwork
      )
    ).toBe(true);
    expect(JSON.stringify(body)).not.toContain('rawGuestSnapshot');
    expect(JSON.stringify(body)).not.toContain('providerToken');
  });

  test('fake local Mastered state is blocked and does not create Mastered', () => {
    const response = handleAccountSyncApplyMock(
      ACCOUNT_SYNC_API_HANDLER_FAKE_MASTERY_APPLY_REQUEST_FIXTURE,
      createAccountSyncApiHandlerMockContext()
    );
    const error = expectError(response);

    expect(response.status).toBe(409);
    expect(error.code).toBe('blocked_plan');
    expect(response.accountDigest?.reviewStateSlugs).toEqual([]);
    expect(JSON.stringify(response)).not.toContain('"mastery":"Mastered"');
  });

  test('upgrade interest remains attribution-only and never grants paid entitlement', () => {
    const response = handleAccountSyncApplyMock(
      ACCOUNT_SYNC_API_HANDLER_UPGRADE_APPLY_REQUEST_FIXTURE,
      createAccountSyncApiHandlerMockContext()
    );
    const body = expectOk(response);

    expect(body.idempotency.key).toBe(
      ACCOUNT_SYNC_API_HANDLER_HARNESS_UPGRADE_IDEMPOTENCY_KEY
    );
    expect(body.digest.upgradeInterestIds).toHaveLength(1);
    expect(body.noPaidEntitlementGranted).toBe(true);
    expect(body.safety.upgradeInterestAttributionOnly).toBe(true);
    expect(body.safety.neverGrantsPaidEntitlement).toBe(true);
    expect(body.application?.accepted.every((record) => record.status === 'accepted')).toBe(
      true
    );
  });

  test('unsupported method, unknown route, and malformed request return structured errors', () => {
    const unsupportedMethod = handleAccountSyncPreviewMock(
      {
        ...ACCOUNT_SYNC_API_HANDLER_PREVIEW_REQUEST_FIXTURE,
        method: 'GET',
      },
      createAccountSyncApiHandlerMockContext()
    );
    const unknownRoute = handleAccountSyncPreviewMock(
      {
        ...ACCOUNT_SYNC_API_HANDLER_PREVIEW_REQUEST_FIXTURE,
        path: '/api/account/sync/missing',
      },
      createAccountSyncApiHandlerMockContext()
    );
    const malformed = handleAccountSyncPreviewMock(
      {
        ...ACCOUNT_SYNC_API_HANDLER_PREVIEW_REQUEST_FIXTURE,
        body: {
          accountSyncPayloadVersion:
            ACCOUNT_SYNC_API_HANDLER_PREVIEW_REQUEST_FIXTURE.accountSyncPayloadVersion,
          previewOnly: true,
        },
      } as VlxAccountSyncMockRequest,
      createAccountSyncApiHandlerMockContext()
    );

    expect(unsupportedMethod.status).toBe(405);
    expect(expectError(unsupportedMethod).code).toBe('method_not_allowed');
    expect(unknownRoute.status).toBe(404);
    expect(expectError(unknownRoute).code).toBe('route_not_found');
    expect(malformed.status).toBe(400);
    expect(expectError(malformed).code).toBe('invalid_request');
  });

  test('the real staging route surface is exact while the mock harness remains route-free', () => {
    const accountSyncRoot = join(
      workspaceRoot,
      'src',
      'app',
      'api',
      'account',
      'sync'
    );
    expect(collectFiles(accountSyncRoot).sort()).toEqual([
      'apply/route.ts',
      'digest/route.ts',
      'hydrate/route.ts',
      'preview/route.ts',
    ]);

    const forbiddenRoutePaths = [
      join(workspaceRoot, 'app', 'api', 'account', 'sync'),
      join(workspaceRoot, 'pages', 'api', 'account', 'sync'),
      join(workspaceRoot, 'src', 'pages', 'api', 'account', 'sync'),
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'api-handler-harness',
        'route.ts'
      ),
    ];

    for (const forbiddenPath of forbiddenRoutePaths) {
      expect(existsSync(forbiddenPath), forbiddenPath).toBe(false);
    }
  });

  test('handler harness files do not contain framework handlers or forbidden integrations', () => {
    const handlerFiles = [
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'api-handler-harness',
        'handler-contracts.ts'
      ),
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'api-handler-harness',
        'mock-handlers.ts'
      ),
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'api-handler-harness',
        'fixtures.ts'
      ),
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'api-handler-harness',
        'README.md'
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

    for (const filePath of handlerFiles) {
      const fileText = readFileSync(filePath, 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${filePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test('handler harness never accesses runtime, provider, deployment, or production surfaces', () => {
    let responseCount = 0;
    const sideEffects = withNoExternalSideEffects(() => {
      const preview = handleAccountSyncPreviewMock(
        ACCOUNT_SYNC_API_HANDLER_PREVIEW_REQUEST_FIXTURE,
        createAccountSyncApiHandlerMockContext()
      );
      const apply = handleAccountSyncApplyMock(
        ACCOUNT_SYNC_API_HANDLER_APPLY_REQUEST_FIXTURE,
        createAccountSyncApiHandlerMockContext()
      );
      const digest = handleAccountSyncDigestMock(
        ACCOUNT_SYNC_API_HANDLER_DIGEST_REQUEST_FIXTURE,
        createAccountSyncApiHandlerMockContext({
          initialServerState: ACCOUNT_SYNC_API_HANDLER_DIGEST_SERVER_STATE,
        })
      );
      const audit = handleAccountSyncAuditMock(
        ACCOUNT_SYNC_API_HANDLER_AUDIT_REQUEST_FIXTURE,
        createAccountSyncApiHandlerMockContext({
          initialServerState: createAccountSyncApiHandlerAuditServerState(2),
        })
      );

      responseCount = [preview, apply, digest, audit].filter(
        (response) => response.ok
      ).length;
    });

    expect(responseCount).toBe(4);
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });
});
