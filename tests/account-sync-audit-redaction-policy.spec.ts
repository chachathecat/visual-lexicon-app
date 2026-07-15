import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  ACCOUNT_SYNC_AUDIT_READ_POLICY,
  ACCOUNT_SYNC_AUDIT_REDACTION_CONTRACT,
  ACCOUNT_SYNC_AUDIT_REDACTION_POLICY,
  ACCOUNT_SYNC_AUDIT_SUMMARY_SHAPE,
  ACCOUNT_SYNC_AUDIT_VISIBILITY_POLICY,
  ACCOUNT_SYNC_AUDIT_WRITE_POLICIES,
  ACCOUNT_SYNC_DIGEST_VISIBILITY_POLICY,
  ACCOUNT_SYNC_OWNER_ONLY_ACCESS_POLICY,
  decideAccountSyncAuditWrite,
  decideAccountSyncRedaction,
} from '../src/lib/account-persistence/audit-redaction/audit-redaction-policy';
import {
  ACCOUNT_SYNC_AUDIT_REDACTION_APPLY_EVENT_INPUTS,
  ACCOUNT_SYNC_AUDIT_REDACTION_BILLING_DECISION,
  ACCOUNT_SYNC_AUDIT_REDACTION_CROSS_ACCOUNT_DECISION,
  ACCOUNT_SYNC_AUDIT_REDACTION_EXPECTED_EVENT_TYPES,
  ACCOUNT_SYNC_AUDIT_REDACTION_EXPECTED_FORBIDDEN_FIELDS,
  ACCOUNT_SYNC_AUDIT_REDACTION_FAKE_MASTERY_DECISION,
  ACCOUNT_SYNC_AUDIT_REDACTION_FORBIDDEN_ACTUAL_ROUTE_PATHS,
  ACCOUNT_SYNC_AUDIT_REDACTION_FORBIDDEN_FIELD_DECISIONS,
  ACCOUNT_SYNC_AUDIT_REDACTION_FULL_STATE_DECISION,
  ACCOUNT_SYNC_AUDIT_REDACTION_IDEMPOTENCY_CONFLICT_DECISION,
  ACCOUNT_SYNC_AUDIT_REDACTION_MALFORMED_DECISION,
  ACCOUNT_SYNC_AUDIT_REDACTION_PACK_AUDIT_ONLY_DECISION,
  ACCOUNT_SYNC_AUDIT_REDACTION_PREVIEW_DECISION,
  ACCOUNT_SYNC_AUDIT_REDACTION_PROVIDER_TOKEN_DECISION,
  ACCOUNT_SYNC_AUDIT_REDACTION_RAW_GUEST_DECISION,
  ACCOUNT_SYNC_AUDIT_REDACTION_RAW_SERVER_DECISION,
  ACCOUNT_SYNC_AUDIT_REDACTION_SECRET_DECISION,
  ACCOUNT_SYNC_AUDIT_REDACTION_UPGRADE_INTEREST_DECISION,
} from '../src/lib/account-persistence/audit-redaction/fixtures';

const workspaceRoot = process.cwd();

function expectRedactedSummaryOnly(
  decision: ReturnType<typeof decideAccountSyncAuditWrite>
) {
  expect(decision).toMatchObject({
    summaryRedacted: true,
    storesRawGuestSnapshot: false,
    storesRawServerPayload: false,
    storesFullReviewEventBodies: false,
    storesProviderTokens: false,
    storesProductionSecrets: false,
    storesBillingPaymentPayloads: false,
    grantsPaidEntitlement: false,
    loggingProviderIntegrated: false,
    implementationStatus: 'design_only',
  });
}

function expectForbiddenField(fieldName: string) {
  const decision = decideAccountSyncRedaction(fieldName);

  expect(decision, fieldName).toMatchObject({
    classification: 'forbidden',
    allowedInAuditSummary: false,
    storeMode: 'reject_field',
    storesRawValue: false,
    forbidden: true,
    redactionRequired: true,
  });
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
        throw new Error('audit redaction policy must not call network helpers');
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

test.describe('account sync audit redaction policy', () => {
  test('defines all required audit event types', () => {
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_CONTRACT.eventTypes).toEqual(
      ACCOUNT_SYNC_AUDIT_REDACTION_EXPECTED_EVENT_TYPES
    );
    expect(
      ACCOUNT_SYNC_AUDIT_REDACTION_CONTRACT.eventTaxonomy.map((event) => event.eventType)
    ).toEqual(ACCOUNT_SYNC_AUDIT_REDACTION_EXPECTED_EVENT_TYPES);

    for (const event of ACCOUNT_SYNC_AUDIT_REDACTION_CONTRACT.eventTaxonomy) {
      expect(event).toMatchObject({
        ownerScoped: true,
        summaryShape: 'owner_scoped_redacted_audit_summary',
        redactedSummaryOnly: true,
      });
    }
  });

  test('apply accepted, replayed, blocked, rejected, and conflict events have redacted audit shapes', () => {
    for (const input of ACCOUNT_SYNC_AUDIT_REDACTION_APPLY_EVENT_INPUTS) {
      const decision = decideAccountSyncAuditWrite(input);

      expect(decision.routeId).toBe('apply');
      expect(decision.writePolicyId).toBe('apply_redacted_audit_summary');
      expect(decision.durableAuditWriteAllowed).toBe(true);
      expect(decision.responseLocalOnly).toBe(false);
      expect(decision.failureReasons).toEqual([]);
      expectRedactedSummaryOnly(decision);
    }
  });

  test('preview is response-local audit only unless separately approved', () => {
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_PREVIEW_DECISION).toMatchObject({
      routeId: 'preview',
      writePolicyId: 'preview_response_local_audit',
      durableAuditWriteAllowed: false,
      responseLocalOnly: true,
      failureReasons: ['preview_durable_audit_requires_separate_approval'],
    });

    const previewPolicy = ACCOUNT_SYNC_AUDIT_WRITE_POLICIES.find(
      (policy) => policy.id === 'preview_response_local_audit'
    );

    expect(previewPolicy).toMatchObject({
      durableAuditWriteAllowedByDefault: false,
      responseLocalOnlyByDefault: true,
      requiresSeparateApprovalForPreviewDurableLogs: true,
      writesRedactedSummaryOnly: true,
    });
  });

  test('digest and audit are owner-only and bounded', () => {
    expect(ACCOUNT_SYNC_DIGEST_VISIBILITY_POLICY).toMatchObject({
      routeId: 'digest',
      ownerOnly: true,
      boundedMetadataOnly: true,
      maxResponseBytes: 32_768,
      returnsRawGuestSnapshots: false,
      returnsRawServerPayloads: false,
      returnsFullReviewEvents: false,
      returnsFullAccountState: false,
      returnsRawUpgradeInterestRecords: false,
    });
    expect(ACCOUNT_SYNC_AUDIT_VISIBILITY_POLICY).toMatchObject({
      routeId: 'audit',
      ownerOnly: true,
      boundedSummariesOnly: true,
      maxResponseBytes: 65_536,
      returnsRawGuestSnapshots: false,
      returnsRawServerPayloads: false,
      returnsFullReviewEvents: false,
      returnsFullAccountState: false,
      supportOrOperatorVisibilityGranted: false,
    });
    expect(ACCOUNT_SYNC_AUDIT_READ_POLICY).toMatchObject({
      requiresOwnerOnlyAccess: true,
      requiresBoundedQuery: true,
      requiresBoundedResponse: true,
      redactedSummariesOnly: true,
      rawPayloadAccessAllowed: false,
      crossAccountReadsAllowed: false,
    });
    expect(ACCOUNT_SYNC_OWNER_ONLY_ACCESS_POLICY).toMatchObject({
      requiresAuthenticatedServerSession: true,
      requiresServerDerivedOwner: true,
      clientAccountIdTrustedAsOwner: false,
      rejectsCrossAccountAccess: true,
      exposesTargetAccountPayloadOnReject: false,
    });
  });

  test('raw snapshots, raw payloads, review bodies, and full state are forbidden', () => {
    expect(ACCOUNT_SYNC_AUDIT_SUMMARY_SHAPE.forbiddenFields).toEqual(
      expect.arrayContaining(
        Array.from(ACCOUNT_SYNC_AUDIT_REDACTION_EXPECTED_FORBIDDEN_FIELDS)
      )
    );
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_RAW_GUEST_DECISION.forbidden).toBe(true);
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_RAW_SERVER_DECISION.forbidden).toBe(true);
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_FULL_STATE_DECISION.forbidden).toBe(true);
    expectForbiddenField('rawReviewEvents');
    expectForbiddenField('rawSavedWords');
    expect(ACCOUNT_SYNC_AUDIT_SUMMARY_SHAPE).toMatchObject({
      storesRawGuestSnapshot: false,
      storesRawServerPayload: false,
      storesFullReviewEventBodies: false,
      storesFullAccountState: false,
    });
  });

  test('provider tokens, production secrets, and billing payloads are forbidden', () => {
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_PROVIDER_TOKEN_DECISION.forbidden).toBe(true);
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_SECRET_DECISION.forbidden).toBe(true);
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_BILLING_DECISION.forbidden).toBe(true);

    for (const fieldName of [
      'sessionToken',
      'refreshToken',
      'apiKey',
      'secret',
      'env',
      'paymentMethod',
      'subscriptionPayload',
      'billingPortalPayload',
      'invoicePayload',
    ]) {
      expectForbiddenField(fieldName);
    }

    expect(ACCOUNT_SYNC_AUDIT_REDACTION_POLICY).toMatchObject({
      providerTokensAllowed: false,
      productionSecretsAllowed: false,
      billingPaymentPayloadsAllowed: false,
      paidEntitlementGrantAllowed: false,
    });
  });

  test('all required forbidden field decisions reject raw storage', () => {
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_FORBIDDEN_FIELD_DECISIONS).toHaveLength(
      ACCOUNT_SYNC_AUDIT_REDACTION_EXPECTED_FORBIDDEN_FIELDS.length
    );

    for (const decision of ACCOUNT_SYNC_AUDIT_REDACTION_FORBIDDEN_FIELD_DECISIONS) {
      expect(decision).toMatchObject({
        classification: 'forbidden',
        allowedInAuditSummary: false,
        storesRawValue: false,
        forbidden: true,
      });
    }
  });

  test('fake mastery is logged only as blocked or client-claim evidence', () => {
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_FAKE_MASTERY_DECISION).toMatchObject({
      eventType: 'fake_mastery_blocked',
      fakeMasteryOutcome: 'blocked_or_client_claim_only',
      grantsPaidEntitlement: false,
    });
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_CONTRACT.sourceOfTruthPolicy).toMatchObject({
      reviewEventsRemainSourceOfTruth: true,
      fakeLocalMasteryCanBecomeServerMastery: false,
      fakeMasteryLoggedAsBlockedOrClientClaimOnly: true,
    });
  });

  test('paid entitlement cannot be granted and upgrade interest remains attribution-only', () => {
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_UPGRADE_INTEREST_DECISION).toMatchObject({
      eventType: 'paid_entitlement_ignored',
      upgradeInterestMode: 'attribution_only',
      grantsPaidEntitlement: false,
    });
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_CONTRACT.sourceOfTruthPolicy).toMatchObject({
      upgradeInterestAttributionOnly: true,
    });
  });

  test('pack progress without review event evidence remains audit-only', () => {
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_PACK_AUDIT_ONLY_DECISION).toMatchObject({
      packProgressMode: 'audit_only_without_review_event_evidence',
      grantsPaidEntitlement: false,
    });
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_CONTRACT.sourceOfTruthPolicy).toMatchObject({
      packProgressWithoutReviewEventsAuditOnly: true,
    });
  });

  test('cross-account attempts do not expose target payload data', () => {
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_CROSS_ACCOUNT_DECISION).toMatchObject({
      eventType: 'ownership_rejected',
      exposesTargetAccountPayloadOnCrossAccountAttempt: false,
      storesRawServerPayload: false,
      storesRawGuestSnapshot: false,
      ownerOnlyAccessRequired: true,
    });
  });

  test('rejected malformed payloads do not store raw payloads', () => {
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_MALFORMED_DECISION).toMatchObject({
      eventType: 'schema_rejected',
      malformedPayloadRawStored: false,
      storesRawGuestSnapshot: false,
      storesRawServerPayload: false,
      storesFullReviewEventBodies: false,
    });
    expectRedactedSummaryOnly(ACCOUNT_SYNC_AUDIT_REDACTION_MALFORMED_DECISION);
  });

  test('same-key different-fingerprint conflicts do not store raw payloads', () => {
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_IDEMPOTENCY_CONFLICT_DECISION).toMatchObject({
      eventType: 'idempotency_conflict',
      sameKeyDifferentFingerprintRawPayloadStored: false,
      storesRawServerPayload: false,
      storesRawGuestSnapshot: false,
    });
    expectRedactedSummaryOnly(
      ACCOUNT_SYNC_AUDIT_REDACTION_IDEMPOTENCY_CONFLICT_DECISION
    );
  });

  test('final verdict remains design only with no real implementation', () => {
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_CONTRACT.finalVerdict).toEqual({
      verdict: 'design_only',
      implementationReady: false,
      realApiRouteRecommended: false,
      nextRecommendedPr: {
        number: 63,
        title: 'Account sync monitoring, rollout, rollback, and kill-switch gate',
        docsContractsTestsOnly: true,
      },
    });
    expect(ACCOUNT_SYNC_AUDIT_REDACTION_CONTRACT.implementationScope).toEqual({
      docsContractsTestsOnly: true,
      actualApiRouteImplementation: false,
      routeHandlersAllowed: false,
      middlewareAllowed: false,
      runtimeIntegrationAllowed: false,
      realAuthAllowed: false,
      databasePersistenceAllowed: false,
      validationDependencyAllowed: false,
      authProviderSdkAllowed: false,
      databaseProviderSdkAllowed: false,
      paymentProviderSdkAllowed: false,
      loggingProviderSdkAllowed: false,
      browserNetworkHelpersAllowed: false,
      browserStorageAllowed: false,
      environmentReadsAllowed: false,
    });
  });

  test('no actual API route files, route handlers, or middleware are created', () => {
    for (const relativePath of ACCOUNT_SYNC_AUDIT_REDACTION_FORBIDDEN_ACTUAL_ROUTE_PATHS.flatMap(
      (path) =>
        path === 'src/app/api/account/sync'
          ? ['src/app/api/account/sync/audit']
          : [path]
    )) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }
  });

  test('audit redaction module contains no forbidden SDK imports or runtime access', () => {
    const moduleFiles = [
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'audit-redaction',
        'audit-redaction-policy.ts'
      ),
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'audit-redaction',
        'fixtures.ts'
      ),
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'audit-redaction',
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

    for (const filePath of moduleFiles) {
      const fileText = readFileSync(filePath, 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${filePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test('audit redaction contract is pure static data and deterministic logic', () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => {
      const decision = decideAccountSyncAuditWrite({
        eventType: 'apply_accepted',
        ownerScoped: true,
        ownerAccessVerified: true,
        schemaValidated: true,
        payloadWithinLimit: true,
        idempotencyValidated: true,
      });

      return {
        eventCount: ACCOUNT_SYNC_AUDIT_REDACTION_CONTRACT.eventTypes.length,
        forbiddenFieldCount: ACCOUNT_SYNC_AUDIT_SUMMARY_SHAPE.forbiddenFields.length,
        decisionDurable: decision.durableAuditWriteAllowed,
        verdict: ACCOUNT_SYNC_AUDIT_REDACTION_CONTRACT.finalVerdict.verdict,
      };
    });

    expect(value).toEqual({
      eventCount: 19,
      forbiddenFieldCount: 17,
      decisionDurable: true,
      verdict: 'design_only',
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });

  test('README and account sync audit redaction docs are linked and explicit', () => {
    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8');
    const doc = readFileSync(
      join(workspaceRoot, 'docs', 'ACCOUNT_SYNC_AUDIT_REDACTION_POLICY.md'),
      'utf8'
    );

    expect(readme).toContain(
      '[Account Sync Audit Redaction Policy](docs/ACCOUNT_SYNC_AUDIT_REDACTION_POLICY.md)'
    );
    expect(doc).toContain('Final verdict: **design_only, not implementation-ready**.');
    expect(doc).toContain('PR #58 concluded that real account sync routes are No-Go');
    expect(doc).toContain('PR #59 defined the auth ownership boundary');
    expect(doc).toContain('PR #60 defined durable idempotency');
    expect(doc).toContain('PR #61 defined schema validation and payload size limits');
    expect(doc).toContain('#63 Account sync monitoring, rollout, rollback, and kill-switch gate');
  });
});
