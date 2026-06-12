import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  ACCOUNT_SYNC_MALFORMED_PAYLOAD_POLICY,
  ACCOUNT_SYNC_PAYLOAD_LIMIT_POLICIES,
  ACCOUNT_SYNC_ROUTE_SCHEMA_POLICIES,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_CONTRACT,
  ACCOUNT_SYNC_SENSITIVE_FIELD_POLICY,
  decideAccountSyncValidation,
  getAccountSyncPayloadLimitPolicy,
  getAccountSyncRouteSchemaPolicy,
} from '../src/lib/account-persistence/schema-payload/schema-payload-contract';
import {
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_CLIENT_ACCOUNT_ID_INPUT,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_EXPECTED_LIMITS,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_EXPECTED_ROUTES,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_FAKE_SERVER_MASTERY_INPUT,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_FORBIDDEN_ACTUAL_ROUTE_PATHS,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_FORBIDDEN_SENSITIVE_INPUT,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_LOCAL_MASTERED_CLAIM_INPUT,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_MALFORMED_APPLY_INPUT,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_MISSING_CONFIRMATION_INPUT,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_MISSING_IDEMPOTENCY_INPUT,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_OVERSIZED_APPLY_INPUT,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_OVERSIZED_AUDIT_INPUT,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_OVERSIZED_DIGEST_INPUT,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_PACK_AUDIT_ONLY_INPUT,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_UPGRADE_INTEREST_INPUT,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_APPLY_INPUT,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_PREVIEW_INPUT,
} from '../src/lib/account-persistence/schema-payload/fixtures';
import type { VlxAccountSyncRouteId } from '../src/lib/account-persistence/api-route-design/route-contracts';

const workspaceRoot = process.cwd();
const plannedRoutes = ['preview', 'apply', 'digest', 'audit'] as const satisfies readonly VlxAccountSyncRouteId[];

function expectPolicy(routeId: VlxAccountSyncRouteId) {
  const policy = getAccountSyncRouteSchemaPolicy(routeId);

  expect(policy, `${routeId} schema policy`).toBeDefined();

  if (!policy) {
    throw new Error(`Missing schema policy: ${routeId}`);
  }

  return policy;
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
        throw new Error('schema payload contract must not call network helpers');
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

test.describe('account sync schema payload contract', () => {
  test('defines schema policies for all four planned routes', () => {
    expect(
      ACCOUNT_SYNC_ROUTE_SCHEMA_POLICIES.map((policy) => ({
        routeId: policy.routeId,
        method: policy.method,
        path: policy.path,
      }))
    ).toEqual(ACCOUNT_SYNC_SCHEMA_PAYLOAD_EXPECTED_ROUTES);

    for (const routeId of plannedRoutes) {
      expect(expectPolicy(routeId)).toMatchObject({
        requiresSchemaValidation: true,
        requiresPayloadSizeLimit: true,
        trustsClientProvidedAccountIdAsOwnershipProof: false,
        designOnly: true,
        implementsRuntimeValidation: false,
        validationDependencyIntegrated: false,
      });
    }
  });

  test('preview has schema validation, payload limit, and no mutation policy', () => {
    expect(expectPolicy('preview')).toMatchObject({
      method: 'POST',
      path: '/api/account/sync/preview',
      payloadShape: 'preview_request_body',
      mutating: false,
      noMutationPolicy: true,
      rejectsMalformedBeforeConflictResolution: true,
      requiresIdempotencyKey: false,
      requiresClientConfirmationOrSafeApplyIntent: false,
    });

    const decision = decideAccountSyncValidation(
      ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_PREVIEW_INPUT
    );

    expect(decision).toMatchObject({
      ok: true,
      routeId: 'preview',
      conflictResolutionAllowed: true,
      futureLearningStateWriteEligible: false,
      actualLearningStateWriteImplemented: false,
    });
  });

  test('apply has validation, size, idempotency, confirmation, and pre-write rejection policy', () => {
    expect(expectPolicy('apply')).toMatchObject({
      method: 'POST',
      path: '/api/account/sync/apply',
      payloadShape: 'apply_request_body',
      mutating: true,
      requiresIdempotencyKey: true,
      requiresClientConfirmationOrSafeApplyIntent: true,
      rejectsMalformedBeforeConflictResolution: true,
      rejectsMalformedBeforeIdempotencyRecord: true,
      rejectsMalformedBeforeLearningStateWrite: true,
    });

    expect(decideAccountSyncValidation(ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_APPLY_INPUT)).toMatchObject({
      ok: true,
      routeId: 'apply',
      futureIdempotencyRecordEligible: true,
      futureLearningStateWriteEligible: true,
      actualLearningStateWriteImplemented: false,
    });
    expect(
      decideAccountSyncValidation(ACCOUNT_SYNC_SCHEMA_PAYLOAD_MISSING_IDEMPOTENCY_INPUT)
        .failureReasons
    ).toContain('missing_idempotency_key');
    expect(
      decideAccountSyncValidation(ACCOUNT_SYNC_SCHEMA_PAYLOAD_MISSING_CONFIRMATION_INPUT)
        .failureReasons
    ).toContain('missing_client_confirmation');
  });

  test('digest and audit have bounded query and bounded response policy', () => {
    expect(expectPolicy('digest')).toMatchObject({
      method: 'GET',
      path: '/api/account/sync/digest',
      requiresBoundedQuery: true,
      requiresBoundedResponse: true,
      noMutationPolicy: true,
    });
    expect(expectPolicy('audit')).toMatchObject({
      method: 'GET',
      path: '/api/account/sync/audit',
      requiresBoundedQuery: true,
      requiresBoundedResponse: true,
      noMutationPolicy: true,
    });

    expect(decideAccountSyncValidation(ACCOUNT_SYNC_SCHEMA_PAYLOAD_OVERSIZED_DIGEST_INPUT).failureReasons).toEqual([
      'query_or_cursor_too_large',
      'response_summary_too_large',
    ]);
    expect(decideAccountSyncValidation(ACCOUNT_SYNC_SCHEMA_PAYLOAD_OVERSIZED_AUDIT_INPUT).failureReasons).toEqual([
      'query_or_cursor_too_large',
      'response_summary_too_large',
    ]);
  });

  test('payload size limits are conservative explicit design-only ceilings', () => {
    expect(
      Object.fromEntries(
        ACCOUNT_SYNC_PAYLOAD_LIMIT_POLICIES.map((policy) => [policy.id, policy.ceiling])
      )
    ).toEqual(ACCOUNT_SYNC_SCHEMA_PAYLOAD_EXPECTED_LIMITS);

    for (const policy of ACCOUNT_SYNC_PAYLOAD_LIMIT_POLICIES) {
      expect(policy).toMatchObject({
        designOnlyCeiling: true,
        unlimited: false,
        requiredBeforeRealRoutes: true,
      });
      expect(policy.ceiling).toBeGreaterThan(0);
    }

    expect(
      decideAccountSyncValidation(ACCOUNT_SYNC_SCHEMA_PAYLOAD_OVERSIZED_APPLY_INPUT)
        .failureReasons
    ).toEqual([
      'payload_too_large',
      'review_event_count_too_large',
      'saved_word_count_too_large',
      'pack_progress_count_too_large',
      'upgrade_interest_count_too_large',
    ]);
    expect(getAccountSyncPayloadLimitPolicy('apply_request_body')?.ceiling).toBe(163_840);
  });

  test('client-provided accountId is not trusted as ownership proof', () => {
    const decision = decideAccountSyncValidation(
      ACCOUNT_SYNC_SCHEMA_PAYLOAD_CLIENT_ACCOUNT_ID_INPUT
    );

    expect(decision.ok).toBe(false);
    expect(decision.failureReasons).toContain('client_account_id_not_trusted');
    expect(decision.clientAccountIdTrustedAsOwnershipProof).toBe(false);
  });

  test('fake mastery fields are rejected or downgraded to client claim only', () => {
    const fakeServerMastery = decideAccountSyncValidation(
      ACCOUNT_SYNC_SCHEMA_PAYLOAD_FAKE_SERVER_MASTERY_INPUT
    );
    const localMasteredClaim = decideAccountSyncValidation(
      ACCOUNT_SYNC_SCHEMA_PAYLOAD_LOCAL_MASTERED_CLAIM_INPUT
    );

    expect(fakeServerMastery.ok).toBe(false);
    expect(fakeServerMastery.failureReasons).toContain('fake_server_mastery_claim');
    expect(fakeServerMastery.fakeServerMasteryAccepted).toBe(false);
    expect(localMasteredClaim.ok).toBe(true);
    expect(localMasteredClaim.localMasteredTreatedAsClientClaimOnly).toBe(true);
    expect(localMasteredClaim.reviewEventEvidenceRequiredForServerMastery).toBe(true);
  });

  test('sensitive, entitlement, billing, payment, and provider material are forbidden', () => {
    const decision = decideAccountSyncValidation(
      ACCOUNT_SYNC_SCHEMA_PAYLOAD_FORBIDDEN_SENSITIVE_INPUT
    );

    expect(ACCOUNT_SYNC_SENSITIVE_FIELD_POLICY).toMatchObject({
      providerTokensAllowed: false,
      productionCredentialsAllowed: false,
      billingPaymentCheckoutSubscriptionAllowed: false,
      paidEntitlementGrantAllowed: false,
      fakeServerMasteryClaimsAllowed: false,
    });
    expect(decision.ok).toBe(false);
    expect(decision.failureReasons).toEqual([
      'provider_tokens_forbidden',
      'production_credentials_forbidden',
      'billing_payment_payload_forbidden',
      'paid_entitlement_payload_forbidden',
      'raw_sensitive_payload_forbidden',
    ]);
    expect(decision.paidEntitlementGranted).toBe(false);
    expect(decision.billingPaymentAccepted).toBe(false);
    expect(decision.sensitivePayloadAccepted).toBe(false);
  });

  test('malformed apply payloads cannot create idempotency records or partial learning state', () => {
    const decision = decideAccountSyncValidation(
      ACCOUNT_SYNC_SCHEMA_PAYLOAD_MALFORMED_APPLY_INPUT
    );

    expect(ACCOUNT_SYNC_MALFORMED_PAYLOAD_POLICY).toMatchObject({
      applyRejectsMalformedBeforeConflictResolution: true,
      applyRejectsMalformedBeforeIdempotencyRecord: true,
      applyRejectsMalformedBeforeLearningStateWrite: true,
      malformedApplyCanCreateIdempotencyRecord: false,
      malformedApplyCanCreatePartialLearningState: false,
    });
    expect(decision.ok).toBe(false);
    expect(decision.failureReasons).toContain('malformed_payload');
    expect(decision.conflictResolutionAllowed).toBe(false);
    expect(decision.futureIdempotencyRecordEligible).toBe(false);
    expect(decision.futureLearningStateWriteEligible).toBe(false);
    expect(decision.actualLearningStateWriteImplemented).toBe(false);
  });

  test('review event evidence, pack progress, and upgrade interest retain safety boundaries', () => {
    const packDecision = decideAccountSyncValidation(
      ACCOUNT_SYNC_SCHEMA_PAYLOAD_PACK_AUDIT_ONLY_INPUT
    );
    const upgradeDecision = decideAccountSyncValidation(
      ACCOUNT_SYNC_SCHEMA_PAYLOAD_UPGRADE_INTEREST_INPUT
    );

    expect(ACCOUNT_SYNC_SCHEMA_PAYLOAD_CONTRACT.sourceOfTruthPolicy).toEqual({
      reviewEventsRemainSourceOfTruth: true,
      reviewStateRecomputedFromEventEvidence: true,
      fakeLocalMasteryCanBecomeServerMastery: false,
      packProgressWithoutReviewEventsAuditOnly: true,
      upgradeInterestAttributionOnly: true,
    });
    expect(packDecision.serverSrsRecomputedOnlyFromReviewEvents).toBe(true);
    expect(packDecision.packProgressWithoutReviewEventsAuditOnly).toBe(true);
    expect(upgradeDecision.upgradeInterestAttributionOnly).toBe(true);
    expect(upgradeDecision.paidEntitlementGranted).toBe(false);
  });

  test('final verdict remains design only with no real implementation', () => {
    expect(ACCOUNT_SYNC_SCHEMA_PAYLOAD_CONTRACT.finalVerdict).toEqual({
      verdict: 'design_only',
      implementationReady: false,
      realApiRouteRecommended: false,
      nextRecommendedPr: {
        number: 62,
        title: 'Account sync audit logging and privacy redaction policy',
        docsContractsTestsOnly: true,
      },
    });
    expect(ACCOUNT_SYNC_SCHEMA_PAYLOAD_CONTRACT.implementationScope).toEqual({
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
      browserNetworkHelpersAllowed: false,
      browserStorageAllowed: false,
      environmentReadsAllowed: false,
    });
  });

  test('no actual API route files, route handlers, or middleware are created', () => {
    for (const relativePath of ACCOUNT_SYNC_SCHEMA_PAYLOAD_FORBIDDEN_ACTUAL_ROUTE_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }
  });

  test('schema payload module contains no forbidden dependencies or runtime access', () => {
    const moduleFiles = [
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'schema-payload',
        'schema-payload-contract.ts'
      ),
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'schema-payload',
        'fixtures.ts'
      ),
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'schema-payload',
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

  test('schema payload contract is pure static data and deterministic logic', () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => {
      const decision = decideAccountSyncValidation(
        ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_APPLY_INPUT
      );

      return {
        routeCount: ACCOUNT_SYNC_SCHEMA_PAYLOAD_CONTRACT.routePolicies.length,
        limitCount: ACCOUNT_SYNC_SCHEMA_PAYLOAD_CONTRACT.payloadLimitPolicies.length,
        decisionOk: decision.ok,
        verdict: ACCOUNT_SYNC_SCHEMA_PAYLOAD_CONTRACT.finalVerdict.verdict,
      };
    });

    expect(value).toEqual({
      routeCount: 4,
      limitCount: 10,
      decisionOk: true,
      verdict: 'design_only',
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });

  test('README and account sync schema payload docs are linked and explicit', () => {
    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8');
    const doc = readFileSync(
      join(workspaceRoot, 'docs', 'ACCOUNT_SYNC_SCHEMA_PAYLOAD_CONTRACT.md'),
      'utf8'
    );

    expect(readme).toContain(
      '[Account Sync Schema Payload Contract](docs/ACCOUNT_SYNC_SCHEMA_PAYLOAD_CONTRACT.md)'
    );
    expect(doc).toContain('Final verdict: **design_only, not implementation-ready**.');
    expect(doc).toContain('Client-provided `accountId` values are never ownership proof.');
    expect(doc).toContain('Review events remain the source of truth.');
    expect(doc).toContain('#62 Account sync audit logging and privacy redaction policy');
  });
});
