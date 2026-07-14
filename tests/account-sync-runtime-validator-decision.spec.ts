import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  ACCOUNT_SYNC_RUNTIME_VALIDATION_PORT_CONTRACT,
  ACCOUNT_SYNC_RUNTIME_VALIDATION_REDACTION_POLICY,
  ACCOUNT_SYNC_RUNTIME_VALIDATION_ROUTE_POLICIES,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_ADAPTER_BOUNDARY,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_CANDIDATES,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_DEPENDENCY_POLICY,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_SAFETY_SCOPE,
  decideAccountSyncRuntimeValidation,
  getAccountSyncRuntimeValidationRoutePolicy,
  getAccountSyncRuntimeValidatorCandidate,
  type AccountSyncRuntimeValidationDecision,
  type AccountSyncRuntimeValidationFailureReason,
  type AccountSyncRuntimeValidationIssue,
  type AccountSyncRuntimeValidationPortContract,
  type AccountSyncRuntimeValidationRedactionPolicy,
  type AccountSyncRuntimeValidatorAdapterBoundary,
  type AccountSyncRuntimeValidatorCandidate,
  type AccountSyncRuntimeValidatorDecisionRecord,
  type AccountSyncRuntimeValidatorDecisionStatus,
  type AccountSyncRuntimeValidatorDecisionVersion,
  type AccountSyncRuntimeValidatorDependencyPolicy,
  type AccountSyncRuntimeValidatorImplementationGate,
  type AccountSyncRuntimeValidatorKind,
  type AccountSyncRuntimeValidatorManualQARequirement,
  type AccountSyncRuntimeValidatorNextStep,
  type AccountSyncRuntimeValidatorNonGoal,
  type AccountSyncRuntimeValidatorRisk,
  type AccountSyncSelectedRuntimeValidatorStrategy,
} from '../src/lib/account-persistence/runtime-validator-decision/runtime-validator-decision';
import {
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_CLIENT_ACCOUNT_ID_INPUT,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_EXPECTED_CANDIDATES,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_EXPECTED_MANUAL_QA_IDS,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_EXPECTED_SELECTED_STRATEGIES,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_FAKE_MASTERY_INPUT,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_FORBIDDEN_ACTUAL_ROUTE_PATHS,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_FORBIDDEN_DIRECT_DEPENDENCIES,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_FORBIDDEN_SENSITIVE_INPUT,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_MALFORMED_APPLY_INPUT,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_MISSING_IDEMPOTENCY_INPUT,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_MISSING_SAFE_INTENT_INPUT,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_MODULE_FILES,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_OVERSIZED_APPLY_INPUT,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_OVERSIZED_AUDIT_INPUT,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_OVERSIZED_DIGEST_INPUT,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_PACK_AUDIT_ONLY_INPUT,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_UPGRADE_INTEREST_INPUT,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_APPLY_INPUT,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_PREVIEW_INPUT,
} from '../src/lib/account-persistence/runtime-validator-decision/fixtures';
import type { VlxAccountSyncRouteId } from '../src/lib/account-persistence/api-route-design/route-contracts';

const workspaceRoot = process.cwd();
const plannedRoutes = ['preview', 'apply', 'digest', 'audit'] as const satisfies readonly VlxAccountSyncRouteId[];

type RequiredRuntimeValidatorDecisionTypeSurface = {
  version: AccountSyncRuntimeValidatorDecisionVersion;
  candidate: AccountSyncRuntimeValidatorCandidate;
  status: AccountSyncRuntimeValidatorDecisionStatus;
  strategy: AccountSyncSelectedRuntimeValidatorStrategy;
  kind: AccountSyncRuntimeValidatorKind;
  adapterBoundary: AccountSyncRuntimeValidatorAdapterBoundary;
  portContract: AccountSyncRuntimeValidationPortContract;
  failureReason: AccountSyncRuntimeValidationFailureReason;
  decision: AccountSyncRuntimeValidationDecision;
  issue: AccountSyncRuntimeValidationIssue;
  redactionPolicy: AccountSyncRuntimeValidationRedactionPolicy;
  dependencyPolicy: AccountSyncRuntimeValidatorDependencyPolicy;
  record: AccountSyncRuntimeValidatorDecisionRecord;
  risk: AccountSyncRuntimeValidatorRisk;
  nonGoal: AccountSyncRuntimeValidatorNonGoal;
  gate: AccountSyncRuntimeValidatorImplementationGate;
  manualQA: AccountSyncRuntimeValidatorManualQARequirement;
  nextStep: AccountSyncRuntimeValidatorNextStep;
};

const exportedTypeSmokeDecision = decideAccountSyncRuntimeValidation(
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_MALFORMED_APPLY_INPUT
);

const exportedTypeSmoke: RequiredRuntimeValidatorDecisionTypeSurface = {
  version:
    ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD
      .accountSyncRuntimeValidatorDecisionVersion,
  candidate: ACCOUNT_SYNC_RUNTIME_VALIDATOR_CANDIDATES[0],
  status: ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD.decisionStatus,
  strategy: ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD.selectedStrategies[0],
  kind: ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD.preferredFutureValidatorKind,
  adapterBoundary: ACCOUNT_SYNC_RUNTIME_VALIDATOR_ADAPTER_BOUNDARY,
  portContract: ACCOUNT_SYNC_RUNTIME_VALIDATION_PORT_CONTRACT,
  failureReason: exportedTypeSmokeDecision.failureReasons[0],
  decision: exportedTypeSmokeDecision,
  issue: exportedTypeSmokeDecision.issues[0],
  redactionPolicy: ACCOUNT_SYNC_RUNTIME_VALIDATION_REDACTION_POLICY,
  dependencyPolicy: ACCOUNT_SYNC_RUNTIME_VALIDATOR_DEPENDENCY_POLICY,
  record: ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD,
  risk: ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD.risks[0],
  nonGoal: ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD.nonGoals[0],
  gate: ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD.implementationGates[0],
  manualQA: ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD.manualQARequirements[0],
  nextStep: ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD.nextStep,
};

function candidateKinds() {
  return ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD.candidates.map(
    (candidate) => candidate.kind
  );
}

function manualQAIds() {
  return ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD.manualQARequirements.map(
    (requirement) => requirement.id
  );
}

function expectRoutePolicy(routeId: VlxAccountSyncRouteId) {
  const policy = getAccountSyncRuntimeValidationRoutePolicy(routeId);

  expect(policy, `${routeId} runtime validation policy`).toBeDefined();

  if (!policy) {
    throw new Error(`Missing runtime validation policy: ${routeId}`);
  }

  return policy;
}

function readRootPackageDependencies(fileName: 'package.json' | 'package-lock.json') {
  const parsed = JSON.parse(readFileSync(join(workspaceRoot, fileName), 'utf8')) as {
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
  };
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
        throw new Error('runtime validator decision must not call network helpers');
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

test.describe('account sync runtime validator decision', () => {
  test('exports the required runtime validator decision type surface through static values', () => {
    expect(exportedTypeSmoke).toMatchObject({
      version: 1,
      status: 'design_only_not_implementation_ready',
      strategy: 'zod_compatible_future_adapter',
      kind: 'zod',
      failureReason: 'malformed_payload',
    });
  });

  test('selects a Zod-compatible future adapter while adding no dependency', () => {
    expect(ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD).toMatchObject({
      selectedRuntimeValidatorStrategy: 'zod_compatible_future_adapter',
      preferredFutureValidatorKind: 'zod',
      selectedStrategies: ACCOUNT_SYNC_RUNTIME_VALIDATOR_EXPECTED_SELECTED_STRATEGIES,
      finalVerdict: 'design_only',
      implementationReady: false,
      accountSyncCoreValidatorNeutral: true,
      validatorDependencyAddedInThisPr: false,
      validatorDependencyImportedInThisPr: false,
    });
    expect(getAccountSyncRuntimeValidatorCandidate('zod')).toMatchObject({
      decisionStatus: 'preferred_future_adapter',
      preferredFutureOption: true,
      canProduceTypedStructuredFailures: true,
      validatorNeutralAdapterRequired: true,
      accountSyncCoreCanImportValidatorLibrary: false,
      dependencyAddedInThisPr: false,
      requiresSeparateOwnerApprovedDependencyPr: true,
    });
    expect(candidateKinds()).toEqual(ACCOUNT_SYNC_RUNTIME_VALIDATOR_EXPECTED_CANDIDATES);
  });

  test('keeps account sync core validator-neutral behind a normalized port', () => {
    expect(ACCOUNT_SYNC_RUNTIME_VALIDATOR_ADAPTER_BOUNDARY).toMatchObject({
      selectedStrategy: 'zod_compatible_future_adapter',
      preferredFutureValidatorKind: 'zod',
      validatorSpecificCodeAllowedAtAdapterEdge: true,
      validatorSpecificCodeAllowedInSyncCore: false,
      accountSyncCoreValidatorNeutral: true,
      validatorDependencyImportedInThisPr: false,
      validatorDependencyAddedInThisPr: false,
      separateOwnerApprovedDependencyPrRequired: true,
      routeHandlerCreatedInThisPr: false,
      middlewareCreatedInThisPr: false,
      runtimeRouteIntegrationCreatedInThisPr: false,
    });
    expect(ACCOUNT_SYNC_RUNTIME_VALIDATION_PORT_CONTRACT).toMatchObject({
      input: 'unknown_request_body_or_query_or_response_summary',
      output: 'typed_structured_redacted_validation_decision',
      validatorSpecificIssuesNormalizedBeforeSyncCore: true,
      accountSyncCoreReceivesOnlyNormalizedDecision: true,
      accountSyncCoreValidatorNeutral: true,
      validatorLibraryImportsAllowedInSyncCore: false,
      validatorDependencyImportedInThisPr: false,
    });

    for (const candidate of ACCOUNT_SYNC_RUNTIME_VALIDATOR_CANDIDATES) {
      expect(candidate).toMatchObject({
        validatorNeutralAdapterRequired: true,
        accountSyncCoreCanImportValidatorLibrary: false,
        dependencyAddedInThisPr: false,
        canBeIntroducedInThisPr: false,
      });
    }
  });

  test('does not add direct validator dependencies to root package files', () => {
    for (const fileName of ['package.json', 'package-lock.json'] as const) {
      const rootDependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of ACCOUNT_SYNC_RUNTIME_VALIDATOR_FORBIDDEN_DIRECT_DEPENDENCIES) {
        if (dependencyName === 'zod') {
          continue;
        }

        expect(rootDependencies, `${fileName} should not add ${dependencyName}`).not.toHaveProperty(
          dependencyName
        );
      }
    }

    expect(ACCOUNT_SYNC_RUNTIME_VALIDATOR_DEPENDENCY_POLICY).toMatchObject({
      directValidatorDependenciesAddedInThisPr: false,
      packageJsonChangesAllowedInThisPr: false,
      packageLockChangesAllowedInThisPr: false,
      validatorDependencyImportsAllowedInThisPr: false,
      validatorLibraryImportsAllowedInSyncCore: false,
      separateOwnerApprovedDependencyPrRequired: true,
      preExistingToolTransitiveDependenciesDoNotSelectValidator: true,
    });
  });

  test('defines validation ordering for preview, apply, digest, and audit', () => {
    expect(
      ACCOUNT_SYNC_RUNTIME_VALIDATION_ROUTE_POLICIES.map((policy) => policy.routeId)
    ).toEqual(plannedRoutes);

    expect(expectRoutePolicy('preview')).toMatchObject({
      validatesBeforeConflictResolution: true,
      validatesBeforeIdempotencyRecord: false,
      validatesBeforeLearningStateWrite: true,
      requiresPayloadSizeBeforeDeepValidation: true,
    });
    expect(expectRoutePolicy('apply')).toMatchObject({
      requiresIdempotencyKey: true,
      requiresSafeApplyIntent: true,
      validatesBeforeConflictResolution: true,
      validatesBeforeIdempotencyRecord: true,
      validatesBeforeLearningStateWrite: true,
      malformedCanCreateIdempotencyRecord: false,
      malformedCanCreatePartialLearningState: false,
    });
    expect(expectRoutePolicy('digest')).toMatchObject({
      requiresBoundedQueryValidation: true,
      requiresBoundedResponseValidation: true,
    });
    expect(expectRoutePolicy('audit')).toMatchObject({
      requiresBoundedQueryValidation: true,
      requiresBoundedResponseValidation: true,
    });

    for (const routePolicy of ACCOUNT_SYNC_RUNTIME_VALIDATION_ROUTE_POLICIES) {
      expect(routePolicy.validationOrder[0]).toBe('payload_size_ceiling');
      expect(routePolicy).toMatchObject({
        requiresRuntimeValidation: true,
        actualRuntimeValidationImplemented: false,
        validationDependencyIntegrated: false,
        designOnly: true,
      });
    }
  });

  test('preview and apply validation gate conflict resolution, idempotency, and learning writes', () => {
    const preview = decideAccountSyncRuntimeValidation(
      ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_PREVIEW_INPUT
    );
    const apply = decideAccountSyncRuntimeValidation(
      ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_APPLY_INPUT
    );
    const malformedApply = decideAccountSyncRuntimeValidation(
      ACCOUNT_SYNC_RUNTIME_VALIDATOR_MALFORMED_APPLY_INPUT
    );

    expect(preview).toMatchObject({
      ok: true,
      routeId: 'preview',
      conflictResolutionAllowed: true,
      idempotencyRecordCreationAllowed: false,
      learningStateWriteAllowed: false,
    });
    expect(apply).toMatchObject({
      ok: true,
      routeId: 'apply',
      conflictResolutionAllowed: true,
      idempotencyRecordCreationAllowed: true,
      learningStateWriteAllowed: true,
    });
    expect(malformedApply).toMatchObject({
      ok: false,
      conflictResolutionAllowed: false,
      idempotencyRecordCreationAllowed: false,
      learningStateWriteAllowed: false,
      malformedApplyCanCreateIdempotencyRecord: false,
      malformedApplyCanCreatePartialLearningState: false,
    });
  });

  test('apply requires idempotencyKey and safe apply confirmation', () => {
    const missingIdempotency = decideAccountSyncRuntimeValidation(
      ACCOUNT_SYNC_RUNTIME_VALIDATOR_MISSING_IDEMPOTENCY_INPUT
    );
    const missingSafeIntent = decideAccountSyncRuntimeValidation(
      ACCOUNT_SYNC_RUNTIME_VALIDATOR_MISSING_SAFE_INTENT_INPUT
    );

    expect(missingIdempotency.failureReasons).toContain('missing_idempotency_key');
    expect(missingIdempotency.idempotencyRecordCreationAllowed).toBe(false);
    expect(missingIdempotency.learningStateWriteAllowed).toBe(false);
    expect(missingSafeIntent.failureReasons).toContain('missing_safe_apply_intent');
    expect(missingSafeIntent.idempotencyRecordCreationAllowed).toBe(false);
    expect(missingSafeIntent.learningStateWriteAllowed).toBe(false);
  });

  test('digest and audit validate bounded query and response contracts', () => {
    const digest = decideAccountSyncRuntimeValidation({ routeId: 'digest' });
    const audit = decideAccountSyncRuntimeValidation({ routeId: 'audit' });
    const oversizedDigest = decideAccountSyncRuntimeValidation(
      ACCOUNT_SYNC_RUNTIME_VALIDATOR_OVERSIZED_DIGEST_INPUT
    );
    const oversizedAudit = decideAccountSyncRuntimeValidation(
      ACCOUNT_SYNC_RUNTIME_VALIDATOR_OVERSIZED_AUDIT_INPUT
    );

    expect(digest).toMatchObject({
      ok: true,
      boundedQueryValidated: true,
      boundedResponseValidated: true,
      learningStateWriteAllowed: false,
    });
    expect(audit).toMatchObject({
      ok: true,
      boundedQueryValidated: true,
      boundedResponseValidated: true,
      learningStateWriteAllowed: false,
    });
    expect(oversizedDigest.failureReasons).toEqual([
      'query_or_cursor_too_large',
      'response_summary_too_large',
    ]);
    expect(oversizedAudit.failureReasons).toEqual([
      'query_or_cursor_too_large',
      'response_summary_too_large',
    ]);
  });

  test('payload size ceilings are enforced before deep validation', () => {
    const oversized = decideAccountSyncRuntimeValidation(
      ACCOUNT_SYNC_RUNTIME_VALIDATOR_OVERSIZED_APPLY_INPUT
    );

    expect(oversized).toMatchObject({
      ok: false,
      sizeCeilingCheckedBeforeDeepValidation: true,
      deepValidationAllowed: false,
      conflictResolutionAllowed: false,
      idempotencyRecordCreationAllowed: false,
      learningStateWriteAllowed: false,
    });
    expect(oversized.failureReasons).toEqual([
      'payload_too_large',
      'review_event_count_too_large',
      'saved_word_count_too_large',
      'pack_progress_count_too_large',
      'upgrade_interest_count_too_large',
    ]);
    expect(oversized.failureReasons).not.toContain('malformed_payload');
    expect(oversized.failureReasons).not.toContain('missing_idempotency_key');
  });

  test('validation failure issues are redacted and do not echo raw payloads', () => {
    const decision = decideAccountSyncRuntimeValidation(
      ACCOUNT_SYNC_RUNTIME_VALIDATOR_FORBIDDEN_SENSITIVE_INPUT
    );
    const serializedIssues = JSON.stringify(decision.issues);

    expect(ACCOUNT_SYNC_RUNTIME_VALIDATION_REDACTION_POLICY).toMatchObject({
      allowedIssueFields: ['path', 'code', 'expectedKind', 'sizeClass'],
      rawPayloadEchoAllowed: false,
      rawFieldValueEchoAllowed: false,
      rawProviderPayloadEchoAllowed: false,
      productionSecretEchoAllowed: false,
      billingPaymentPayloadEchoAllowed: false,
      failureMessagesAreGeneric: true,
    });
    expect(decision.ok).toBe(false);
    expect(decision.rawPayloadEchoed).toBe(false);
    expect(decision.failureReasons).toEqual([
      'provider_tokens_forbidden',
      'production_secrets_forbidden',
      'billing_payment_payload_forbidden',
      'paid_entitlement_payload_forbidden',
      'raw_sensitive_payload_forbidden',
    ]);

    for (const issue of decision.issues) {
      expect(issue).toMatchObject({
        rawValueIncluded: false,
        rawPayloadEchoed: false,
        safeForClient: true,
        safeForAudit: true,
      });
    }

    expect(serializedIssues).not.toContain('secret-value');
    expect(serializedIssues).not.toContain('provider-token-value');
    expect(serializedIssues).not.toContain('card');
  });

  test('client account id, fake mastery, paid entitlement, and billing/payment payloads are blocked', () => {
    const clientAccountId = decideAccountSyncRuntimeValidation(
      ACCOUNT_SYNC_RUNTIME_VALIDATOR_CLIENT_ACCOUNT_ID_INPUT
    );
    const fakeMastery = decideAccountSyncRuntimeValidation(
      ACCOUNT_SYNC_RUNTIME_VALIDATOR_FAKE_MASTERY_INPUT
    );
    const forbiddenSensitive = decideAccountSyncRuntimeValidation(
      ACCOUNT_SYNC_RUNTIME_VALIDATOR_FORBIDDEN_SENSITIVE_INPUT
    );

    expect(clientAccountId).toMatchObject({
      ok: false,
      clientAccountIdTrustedAsOwnershipProof: false,
    });
    expect(clientAccountId.failureReasons).toContain(
      'client_account_id_not_trusted'
    );
    expect(fakeMastery).toMatchObject({
      ok: false,
      fakeServerMasteryAccepted: false,
      reviewEventsRemainSourceOfTruth: true,
    });
    expect(fakeMastery.failureReasons).toContain('fake_server_mastery_claim');
    expect(forbiddenSensitive).toMatchObject({
      paidEntitlementGranted: false,
      billingPaymentAccepted: false,
      providerTokensAccepted: false,
      productionSecretsAccepted: false,
    });
  });

  test('review events remain source of truth and weak progress signals stay bounded', () => {
    const packProgress = decideAccountSyncRuntimeValidation(
      ACCOUNT_SYNC_RUNTIME_VALIDATOR_PACK_AUDIT_ONLY_INPUT
    );
    const upgradeInterest = decideAccountSyncRuntimeValidation(
      ACCOUNT_SYNC_RUNTIME_VALIDATOR_UPGRADE_INTEREST_INPUT
    );

    expect(packProgress).toMatchObject({
      ok: true,
      reviewEventsRemainSourceOfTruth: true,
      packProgressWithoutReviewEventsAuditOnly: true,
      paidEntitlementGranted: false,
    });
    expect(upgradeInterest).toMatchObject({
      ok: true,
      upgradeInterestAttributionOnly: true,
      paidEntitlementGranted: false,
    });
  });

  test('final verdict remains design_only and points to PR 68 mock-gated planning next', () => {
    expect(ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD).toMatchObject({
      decisionStatus: 'design_only_not_implementation_ready',
      finalVerdict: 'design_only',
      implementationReady: false,
      nextStep: {
        prNumber: 68,
        title: 'Disabled/mock-gated account sync implementation spike plan',
        docsContractsTestsOnly: true,
        realApiRouteImplementationRecommended: false,
      },
    });
    expect(manualQAIds()).toEqual(ACCOUNT_SYNC_RUNTIME_VALIDATOR_EXPECTED_MANUAL_QA_IDS);

    for (const gate of ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD.implementationGates) {
      expect(gate).toMatchObject({
        requiredBeforeRealRoutes: true,
        blocksRealApiRouteImplementation: true,
      });
    }
  });

  test('no actual API routes, route handlers, or middleware are created', () => {
    for (const relativePath of ACCOUNT_SYNC_RUNTIME_VALIDATOR_FORBIDDEN_ACTUAL_ROUTE_PATHS.flatMap(
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

  test('runtime validator decision module files contain no forbidden integrations or runtime access', () => {
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

    for (const relativePath of ACCOUNT_SYNC_RUNTIME_VALIDATOR_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test('runtime validator decision contract is pure static data and deterministic logic', () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => {
      const decision = decideAccountSyncRuntimeValidation(
        ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_APPLY_INPUT
      );

      return {
        candidateCount: ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD.candidates.length,
        routePolicyCount:
          ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD.routePolicies.length,
        decisionOk: decision.ok,
        validatorDependencyAllowed:
          ACCOUNT_SYNC_RUNTIME_VALIDATOR_SAFETY_SCOPE.validatorDependencyAllowed,
        verdict: ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD.finalVerdict,
      };
    });

    expect(value).toEqual({
      candidateCount: ACCOUNT_SYNC_RUNTIME_VALIDATOR_EXPECTED_CANDIDATES.length,
      routePolicyCount: plannedRoutes.length,
      decisionOk: true,
      validatorDependencyAllowed: false,
      verdict: 'design_only',
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });

  test('README and runtime validator decision docs are linked and explicit', () => {
    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8');
    const doc = readFileSync(
      join(workspaceRoot, 'docs', 'ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION.md'),
      'utf8'
    );

    expect(readme).toContain(
      '[Account Sync Runtime Validator Decision](docs/ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION.md)'
    );
    expect(doc).toContain('Final verdict: `design_only`, not implementation-ready.');
    expect(doc).toContain('Zod-compatible future adapter');
    expect(doc).toContain('no validator dependency');
    expect(doc).toContain('#68 Disabled/mock-gated account sync implementation spike plan');
  });
});
