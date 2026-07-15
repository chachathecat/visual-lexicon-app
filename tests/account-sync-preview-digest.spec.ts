import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  ACCOUNT_SYNC_PREVIEW_BLOCKED_FIELDS,
  ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK,
  ACCOUNT_SYNC_PREVIEW_PAYLOAD_LIMIT_POLICY,
  buildAccountSyncDigest,
  buildAccountSyncPreviewPayload,
  getAccountSyncPreviewAllowedKeys,
  getAccountSyncPreviewBlockedFields,
  getAccountSyncPreviewDigestMock,
  getAccountSyncPreviewNextPRSequence,
  getAccountSyncPreviewP0Blockers,
  redactAccountSyncPreviewPayload,
  validateAccountSyncPreviewPayloadInput,
} from '../src/lib/account-sync-preview-digest/account-sync-preview-digest';
import {
  ACCOUNT_SYNC_PREVIEW_DIGEST_DOC_FILES,
  ACCOUNT_SYNC_PREVIEW_DIGEST_FIXTURE_CREATED_AT,
  ACCOUNT_SYNC_PREVIEW_DIGEST_FORBIDDEN_ACTUAL_PATHS,
  ACCOUNT_SYNC_PREVIEW_DIGEST_FORBIDDEN_DIRECT_DEPENDENCIES,
  ACCOUNT_SYNC_PREVIEW_DIGEST_MALFORMED_INPUT,
  ACCOUNT_SYNC_PREVIEW_DIGEST_MODULE_FILES,
  ACCOUNT_SYNC_PREVIEW_DIGEST_NOT_PREVIEW_ONLY_INPUT,
  ACCOUNT_SYNC_PREVIEW_DIGEST_OVERSIZED_INPUT,
  ACCOUNT_SYNC_PREVIEW_DIGEST_SENSITIVE_INPUT,
  ACCOUNT_SYNC_PREVIEW_DIGEST_UNKNOWN_KEY_INPUT,
  ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_DIGEST,
  ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_INPUT,
  ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_PREVIEW,
} from '../src/lib/account-sync-preview-digest/fixtures';

const workspaceRoot = process.cwd();

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
    '__vlxAiProvider',
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
        throw new Error('preview digest mock must not call network helpers');
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

test.describe('account sync preview digest mock', () => {
  test('allows only the documented local storage keys', () => {
    expect(getAccountSyncPreviewAllowedKeys()).toEqual([
      'vlx_saved_words_v1',
      'vlx_review_state_v1',
      'vlx_review_events_v1',
      'vlx_daily_stats_v1',
      'vlx_pack_progress_v1',
      'vlx_upgrade_interest_v1',
    ]);
    expect(
      ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK.allowedLocalStateCategories.map(
        (category) => category.key
      )
    ).toEqual(getAccountSyncPreviewAllowedKeys());

    const unknownDecision = validateAccountSyncPreviewPayloadInput(
      ACCOUNT_SYNC_PREVIEW_DIGEST_UNKNOWN_KEY_INPUT
    );

    expect(unknownDecision.ok).toBe(false);
    expect(unknownDecision.failureReasons).toContain('unknown_storage_key');
    expect(unknownDecision.unknownKeys).toEqual(['vlx_plan_state_v1']);
  });

  test('blocks sensitive fields, payment data, tokens, secrets, and entitlement grants', () => {
    expect(getAccountSyncPreviewBlockedFields()).toEqual(
      ACCOUNT_SYNC_PREVIEW_BLOCKED_FIELDS
    );
    expect(
      ACCOUNT_SYNC_PREVIEW_BLOCKED_FIELDS.map((field) => field.fieldName)
    ).toEqual(
      expect.arrayContaining([
        'providerToken',
        'accessToken',
        'refreshToken',
        'sessionToken',
        'apiKey',
        'secret',
        'paymentMethod',
        'checkoutSession',
        'subscription',
        'invoice',
        'billingState',
        'rawPaymentPayload',
        'entitlementGrant',
        'paidEntitlement',
      ])
    );

    const decision = validateAccountSyncPreviewPayloadInput(
      ACCOUNT_SYNC_PREVIEW_DIGEST_SENSITIVE_INPUT
    );

    expect(decision.ok).toBe(false);
    expect(decision.failureReasons).toContain('blocked_sensitive_field');
    expect(decision.blockedFieldMatches).toEqual([
      {
        path: 'vlx_saved_words_v1.tokenized.providerToken',
        fieldName: 'providerToken',
        blockedCategory: 'provider_token',
      },
    ]);
  });

  test('builds the accepted preview payload shape without applying sync', () => {
    expect(ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_PREVIEW).toMatchObject({
      shape: 'account_sync_preview_payload',
      ok: true,
      status: 'accepted',
      previewOnly: true,
      requestedAt: '2026-06-15T09:00:00.000Z',
      clientProvidedAccountIdTrustedAsOwner: false,
      ownerBoundaryAssumption: 'future_server_derived_owner_required',
      payloadLimitBytes: 98_304,
      mutatesRuntimeStorage: false,
      callsNetwork: false,
      appliesAccountSync: false,
      grantsPaidEntitlement: false,
    });

    if (!ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_PREVIEW.ok) {
      throw new Error('fixture preview should be accepted');
    }

    expect(ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_PREVIEW.localState).toHaveLength(6);
    expect(
      ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_PREVIEW.localState.map((entry) => ({
        key: entry.key,
        present: entry.present,
        itemCount: entry.itemCount,
      }))
    ).toEqual([
      { key: 'vlx_saved_words_v1', present: true, itemCount: 2 },
      { key: 'vlx_review_state_v1', present: true, itemCount: 2 },
      { key: 'vlx_review_events_v1', present: true, itemCount: 2 },
      { key: 'vlx_daily_stats_v1', present: true, itemCount: 1 },
      { key: 'vlx_pack_progress_v1', present: true, itemCount: 1 },
      { key: 'vlx_upgrade_interest_v1', present: true, itemCount: 1 },
    ]);
    expect(ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_PREVIEW.previewId).toContain(
      'preview_mock-fnv1a-'
    );
  });

  test('builds redacted digest shape and removes raw local state', () => {
    expect(ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_DIGEST).toMatchObject({
      shape: 'account_sync_redacted_digest',
      sourcePreviewStatus: 'accepted',
      sourcePreviewAccepted: true,
      counts: {
        presentStorageKeys: 6,
        savedWords: 2,
        reviewStateItems: 2,
        reviewEvents: 2,
        dailyStatDays: 1,
        packProgressEntries: 1,
        upgradeInterestRecords: 1,
      },
      containsRawLocalState: false,
      containsRawReviewEvents: false,
      containsRawPaymentData: false,
      containsProviderTokens: false,
      containsSecrets: false,
      grantsPaidEntitlement: false,
      mutatesRuntimeStorage: false,
      appliesAccountSync: false,
    });

    expect(
      ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_DIGEST.storageSummaries.every(
        (summary) => summary.redaction === 'raw_value_removed'
      )
    ).toBe(true);
    expect(JSON.stringify(ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_DIGEST)).not.toContain(
      'previewValue'
    );
    expect(JSON.stringify(ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_DIGEST)).not.toContain(
      'Dissonance'
    );
  });

  test('rejects malformed payloads before conflict detection or apply', () => {
    const malformed = buildAccountSyncPreviewPayload(
      ACCOUNT_SYNC_PREVIEW_DIGEST_MALFORMED_INPUT
    );
    const notPreviewOnly = buildAccountSyncPreviewPayload(
      ACCOUNT_SYNC_PREVIEW_DIGEST_NOT_PREVIEW_ONLY_INPUT
    );

    expect(malformed).toMatchObject({
      ok: false,
      status: 'rejected',
      failureReasons: ['malformed_payload'],
      localState: [],
      mutatesRuntimeStorage: false,
      appliesAccountSync: false,
      grantsPaidEntitlement: false,
    });
    expect(notPreviewOnly).toMatchObject({
      ok: false,
      status: 'rejected',
      failureReasons: ['preview_only_required'],
      localState: [],
    });
  });

  test('enforces payload size and collection limit policy', () => {
    const oversized = buildAccountSyncPreviewPayload(
      ACCOUNT_SYNC_PREVIEW_DIGEST_OVERSIZED_INPUT
    );

    expect(ACCOUNT_SYNC_PREVIEW_PAYLOAD_LIMIT_POLICY).toMatchObject({
      previewPayloadMaxBytes: 98_304,
      redactedDigestMaxBytes: 32_768,
      maxReviewEvents: 100,
      maxSavedWords: 200,
      maxPackProgressEntries: 50,
      maxUpgradeInterestRecords: 10,
      unlimitedPayloadAllowed: false,
      oversizedPayloadAccepted: false,
    });
    expect(oversized.ok).toBe(false);

    if (oversized.ok) {
      throw new Error('oversized preview should be rejected');
    }

    expect(oversized.failureReasons).toContain('review_event_count_too_large');
    expect(oversized.appliesAccountSync).toBe(false);
  });

  test('defines idempotency key policy for future apply while this mock has no apply/write operation', () => {
    const contract = getAccountSyncPreviewDigestMock();

    expect(contract.idempotencyKeyStrategy).toEqual({
      futureApplyRequiresIdempotencyKey: true,
      previewRequiresIdempotencyKey: false,
      keySource: 'future_client_generated_opaque_key',
      scope: 'authenticated_account_owner_plus_apply_route',
      sameKeySameFingerprint: 'replay_original_redacted_outcome_without_mutation',
      sameKeyDifferentFingerprint: 'reject_as_conflict_before_write',
      rawKeyStoredInAudit: false,
      implementedInThisMock: false,
    });
    expect(contract.verdicts.applyWriteOperation).toBe('blocked');
    expect(contract.previewPayloadShape.appliesAccountSync).toBe(false);
  });

  test('keeps real account sync blocked and beta verdicts unchanged', () => {
    expect(ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK.verdicts).toEqual({
      realAccountSync: 'blocked',
      previewDigestMock: 'allowed',
      applyWriteOperation: 'blocked',
      publicPaidBeta: 'no_go',
      privatePaidBeta: 'conditional_manual_only',
    });
    expect(getAccountSyncPreviewP0Blockers()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'real_account_sync_not_implemented',
          blocksRealAccountSync: true,
          blocksPublicPaidBeta: true,
        }),
        expect.objectContaining({
          id: 'apply_write_operation_not_implemented',
          blocksRealAccountSync: true,
        }),
      ])
    );
    expect(getAccountSyncPreviewNextPRSequence()).toEqual([
      {
        prNumber: 83,
        title: 'Monitoring, support, privacy beta gate',
        docsContractsTestsOnly: true,
        realAccountSyncImplementationRecommended: false,
      },
      {
        prNumber: 84,
        title: 'Private beta readiness rerun',
        docsContractsTestsOnly: true,
        realAccountSyncImplementationRecommended: false,
      },
      {
        prNumber: 85,
        title: 'Owner-run private beta launch checklist',
        docsContractsTestsOnly: true,
        realAccountSyncImplementationRecommended: false,
      },
    ]);
  });

  test('redaction helper and digest builder are deterministic', () => {
    const preview = buildAccountSyncPreviewPayload(
      ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_INPUT
    );
    const digest = buildAccountSyncDigest({
      preview,
      createdAt: ACCOUNT_SYNC_PREVIEW_DIGEST_FIXTURE_CREATED_AT,
    });
    const redacted = redactAccountSyncPreviewPayload(
      preview,
      ACCOUNT_SYNC_PREVIEW_DIGEST_FIXTURE_CREATED_AT
    );

    expect(preview).toEqual(ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_PREVIEW);
    expect(digest).toEqual(ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_DIGEST);
    expect(redacted).toEqual(digest);
  });

  test('forbidden integrations, route handlers, middleware, and dependencies are not introduced', () => {
    for (const relativePath of ACCOUNT_SYNC_PREVIEW_DIGEST_FORBIDDEN_ACTUAL_PATHS.flatMap(
      (path) =>
        path === 'src/app/api/account/sync'
          ? ['src/app/api/account/sync/audit']
          : [path]
    )) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }

    const packageJson = JSON.parse(
      readFileSync(join(workspaceRoot, 'package.json'), 'utf8')
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    for (const dependency of ACCOUNT_SYNC_PREVIEW_DIGEST_FORBIDDEN_DIRECT_DEPENDENCIES) {
      expect(dependencies, dependency).not.toHaveProperty(dependency);
    }

    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\s*\(/,
      /\bwindow\.localStorage\b/,
      /\blocalStorage\.setItem\b/,
      /\blocalStorage\.getItem\b/,
      /\bprocess\.env\b/,
      /from ['"]@supabase\//,
      /from ['"]@clerk\//,
      /from ['"]next-auth/,
      /from ['"]better-auth/,
      /from ['"]prisma/,
      /from ['"]@prisma\/client/,
      /from ['"]drizzle-orm/,
      /from ['"]pg/,
      /from ['"]stripe/,
      /from ['"]paddle/,
      /from ['"]openai/,
      /from ['"]@ai-sdk\/openai/,
      /\bcreateRouteHandler\b/,
    ];

    for (const relativePath of ACCOUNT_SYNC_PREVIEW_DIGEST_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test('contract helpers are pure and do not touch external surfaces', () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => {
      const preview = buildAccountSyncPreviewPayload(
        ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_INPUT
      );
      const digest = redactAccountSyncPreviewPayload(
        preview,
        ACCOUNT_SYNC_PREVIEW_DIGEST_FIXTURE_CREATED_AT
      );

      return {
        previewOk: preview.ok,
        digestShape: digest.shape,
        allowedKeys: getAccountSyncPreviewAllowedKeys().length,
        verdict: getAccountSyncPreviewDigestMock().verdicts.previewDigestMock,
      };
    });

    expect(value).toEqual({
      previewOk: true,
      digestShape: 'account_sync_redacted_digest',
      allowedKeys: 6,
      verdict: 'allowed',
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });

  test('README and docs links exist and contain required account sync preview text', () => {
    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8');
    const doc = readFileSync(
      join(workspaceRoot, 'docs', 'ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK.md'),
      'utf8'
    );

    for (const relativePath of ACCOUNT_SYNC_PREVIEW_DIGEST_DOC_FILES) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(true);
    }

    expect(readme).toContain(
      '[Account Sync Preview Digest Mock](docs/ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK.md)'
    );
    expect(doc).toContain('Real account sync: **Blocked**');
    expect(doc).toContain('Preview/digest mock: **Allowed**');
    expect(doc).toContain('Apply/write operation: **Blocked**');
    expect(doc).toContain('Public paid beta: **No-Go**');
    expect(doc).toContain('Private paid beta: **Conditional / Manual-only**');
    expect(doc).toContain(
      'Recommended next PR: **#83 Monitoring, support, privacy beta gate**'
    );
  });
});
