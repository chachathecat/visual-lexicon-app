import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  ACCOUNT_SYNC_AUTH_ADAPTER_BOUNDARY,
  ACCOUNT_SYNC_AUTH_PROVIDER_CANDIDATES,
  ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD,
  ACCOUNT_SYNC_AUTH_PROVIDER_SAFETY_SCOPE,
  ACCOUNT_SYNC_ROUTE_AUTH_REQUIREMENTS,
  ACCOUNT_SYNC_SERVER_SESSION_BOUNDARY,
  decideAccountSyncAuthProviderAccess,
  getAccountSyncAuthProviderCandidate,
  getAccountSyncRouteAuthRequirement,
  type AccountSyncAuthAdapterBoundary,
  type AccountSyncAuthProviderCandidate,
  type AccountSyncAuthProviderDecisionRecord,
  type AccountSyncAuthProviderDecisionVersion,
  type AccountSyncAuthProviderImplementationGate,
  type AccountSyncAuthProviderManualQARequirement,
  type AccountSyncAuthProviderNextStep,
  type AccountSyncAuthProviderNonGoal,
  type AccountSyncAuthProviderRisk,
  type AccountSyncAuthProviderKind,
  type AccountSyncAuthProviderDecisionStatus,
  type AccountSyncNormalizedAuthPrincipal,
  type AccountSyncSelectedAuthStrategy,
  type AccountSyncServerSessionBoundary,
} from '../src/lib/account-persistence/auth-provider-decision/auth-provider-decision';
import {
  ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
  ACCOUNT_SYNC_AUTH_PROVIDER_AMBIGUOUS_PRINCIPAL,
  ACCOUNT_SYNC_AUTH_PROVIDER_BLOCKED_PRINCIPAL,
  ACCOUNT_SYNC_AUTH_PROVIDER_DELETED_PRINCIPAL,
  ACCOUNT_SYNC_AUTH_PROVIDER_EXPECTED_CANDIDATES,
  ACCOUNT_SYNC_AUTH_PROVIDER_EXPECTED_MANUAL_QA_IDS,
  ACCOUNT_SYNC_AUTH_PROVIDER_EXPECTED_REJECTED_STATES,
  ACCOUNT_SYNC_AUTH_PROVIDER_EXPECTED_STRATEGIES,
  ACCOUNT_SYNC_AUTH_PROVIDER_EXPIRED_PRINCIPAL,
  ACCOUNT_SYNC_AUTH_PROVIDER_FORBIDDEN_ACTUAL_ROUTE_PATHS,
  ACCOUNT_SYNC_AUTH_PROVIDER_FORBIDDEN_PRINCIPAL_FIELDS,
  ACCOUNT_SYNC_AUTH_PROVIDER_MISSING_PRINCIPAL,
  ACCOUNT_SYNC_AUTH_PROVIDER_MODULE_FILES,
  ACCOUNT_SYNC_AUTH_PROVIDER_NOW,
  ACCOUNT_SYNC_AUTH_PROVIDER_OTHER_ACCOUNT_ID,
  ACCOUNT_SYNC_AUTH_PROVIDER_OWNER_ACCOUNT_ID,
  ACCOUNT_SYNC_AUTH_PROVIDER_REVOKED_PRINCIPAL,
  ACCOUNT_SYNC_AUTH_PROVIDER_UNSUPPORTED_PRINCIPAL,
} from '../src/lib/account-persistence/auth-provider-decision/fixtures';
import type { VlxAccountSyncRouteId } from '../src/lib/account-persistence/api-route-design/route-contracts';

const workspaceRoot = process.cwd();
const plannedRoutes = ['preview', 'apply', 'digest', 'audit'] as const satisfies readonly VlxAccountSyncRouteId[];

type RequiredAuthProviderDecisionTypeSurface = {
  version: AccountSyncAuthProviderDecisionVersion;
  candidate: AccountSyncAuthProviderCandidate;
  status: AccountSyncAuthProviderDecisionStatus;
  strategy: AccountSyncSelectedAuthStrategy;
  kind: AccountSyncAuthProviderKind;
  principal: AccountSyncNormalizedAuthPrincipal;
  serverSessionBoundary: AccountSyncServerSessionBoundary;
  adapterBoundary: AccountSyncAuthAdapterBoundary;
  record: AccountSyncAuthProviderDecisionRecord;
  risk: AccountSyncAuthProviderRisk;
  nonGoal: AccountSyncAuthProviderNonGoal;
  gate: AccountSyncAuthProviderImplementationGate;
  manualQA: AccountSyncAuthProviderManualQARequirement;
  nextStep: AccountSyncAuthProviderNextStep;
};

const exportedTypeSmoke: RequiredAuthProviderDecisionTypeSurface = {
  version: ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD.accountSyncAuthProviderDecisionVersion,
  candidate: ACCOUNT_SYNC_AUTH_PROVIDER_CANDIDATES[0],
  status: ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD.decisionStatus,
  strategy: ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD.selectedStrategies[0],
  kind: ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD.selectedProviderKind,
  principal: ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
  serverSessionBoundary: ACCOUNT_SYNC_SERVER_SESSION_BOUNDARY,
  adapterBoundary: ACCOUNT_SYNC_AUTH_ADAPTER_BOUNDARY,
  record: ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD,
  risk: ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD.risks[0],
  nonGoal: ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD.nonGoals[0],
  gate: ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD.implementationGates[0],
  manualQA: ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD.manualQARequirements[0],
  nextStep: ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD.nextStep,
};

function candidateKinds() {
  return ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD.candidates.map(
    (candidate) => candidate.kind
  );
}

function manualQAIds() {
  return ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD.manualQARequirements.map(
    (requirement) => requirement.id
  );
}

function accessDecision(
  routeId: VlxAccountSyncRouteId,
  principal?: AccountSyncNormalizedAuthPrincipal
) {
  const normalizedPrincipal =
    arguments.length > 1 ? principal : ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL;

  return decideAccountSyncAuthProviderAccess({
    routeId,
    principal: normalizedPrincipal,
    nowIso: ACCOUNT_SYNC_AUTH_PROVIDER_NOW,
    targetAccountId: ACCOUNT_SYNC_AUTH_PROVIDER_OWNER_ACCOUNT_ID,
    revalidatedImmediatelyBeforeMutation: routeId === 'apply',
    boundedOwnerOnlyRead: routeId === 'digest' || routeId === 'audit',
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
        throw new Error('auth provider decision must not call network helpers');
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

test.describe('account sync auth provider decision', () => {
  test('exports the required auth provider decision type surface through static values', () => {
    expect(exportedTypeSmoke).toMatchObject({
      version: 1,
      status: 'design_only_not_implementation_ready',
      strategy: 'existing_account_session_boundary_first',
      kind: 'existing_account_session_boundary',
    });
  });

  test('selects the existing account/session boundary first', () => {
    expect(ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD).toMatchObject({
      selectedProviderKind: 'existing_account_session_boundary',
      selectedStrategies: ACCOUNT_SYNC_AUTH_PROVIDER_EXPECTED_STRATEGIES,
      finalVerdict: 'design_only',
      implementationReady: false,
    });

    expect(getAccountSyncAuthProviderCandidate('existing_account_session_boundary')).toMatchObject({
      decisionStatus: 'selected',
      reusesExistingAppSessionBoundary: true,
    });
    expect(candidateKinds()).toEqual(ACCOUNT_SYNC_AUTH_PROVIDER_EXPECTED_CANDIDATES);
  });

  test('keeps account sync core provider-neutral and forbids provider SDK imports', () => {
    expect(ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD).toMatchObject({
      accountSyncCoreProviderNeutral: true,
      providerSdkImportedInThisPr: false,
    });
    expect(ACCOUNT_SYNC_AUTH_ADAPTER_BOUNDARY).toMatchObject({
      accountSyncCoreProviderNeutral: true,
      providerSpecificCodeAllowedAtAdapterEdge: true,
      providerSpecificCodeAllowedInSyncCore: false,
      providerSdkImportedInThisPr: false,
    });

    for (const candidate of ACCOUNT_SYNC_AUTH_PROVIDER_CANDIDATES) {
      expect(candidate).toMatchObject({
        providerNeutralAdapterRequired: true,
        accountSyncCoreCanImportProviderSdk: false,
        canBeIntroducedInThisPr: false,
      });
    }
  });

  test('normalized principal derives owner from authenticated server session only', () => {
    const principalKeys = Object.keys(ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL);

    expect(ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL).toMatchObject({
      authenticatedAccountId: ACCOUNT_SYNC_AUTH_PROVIDER_OWNER_ACCOUNT_ID,
      ownershipSource: 'authenticated_server_session',
      derivedFromAuthenticatedServerSession: true,
      clientProvidedAccountIdTrustedAsOwnershipProof: false,
      planContextReadonly: {
        readonly: true,
        canGrantPaidEntitlement: false,
      },
    });

    for (const forbiddenField of ACCOUNT_SYNC_AUTH_PROVIDER_FORBIDDEN_PRINCIPAL_FIELDS) {
      expect(principalKeys).not.toContain(forbiddenField);
    }
  });

  test('client-provided accountId is never ownership proof', () => {
    const decision = decideAccountSyncAuthProviderAccess({
      routeId: 'preview',
      principal: ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
      nowIso: ACCOUNT_SYNC_AUTH_PROVIDER_NOW,
      targetAccountId: ACCOUNT_SYNC_AUTH_PROVIDER_OWNER_ACCOUNT_ID,
      clientProvidedAccountId: ACCOUNT_SYNC_AUTH_PROVIDER_OWNER_ACCOUNT_ID,
    });

    expect(decision.ok).toBe(false);
    expect(decision.failureReasons).toContain('client_account_id_not_trusted');
    expect(decision.clientProvidedAccountIdTrustedAsOwnershipProof).toBe(false);
  });

  test('anonymous, missing, expired, revoked, ambiguous, unsupported, deleted, and blocked states are rejected', () => {
    expect(ACCOUNT_SYNC_SERVER_SESSION_BOUNDARY.rejectedAuthStates).toEqual(
      ACCOUNT_SYNC_AUTH_PROVIDER_EXPECTED_REJECTED_STATES
    );

    const rejectedStates = [
      { principal: undefined, reason: 'anonymous' },
      { principal: ACCOUNT_SYNC_AUTH_PROVIDER_MISSING_PRINCIPAL, reason: 'missing' },
      { principal: ACCOUNT_SYNC_AUTH_PROVIDER_EXPIRED_PRINCIPAL, reason: 'expired' },
      { principal: ACCOUNT_SYNC_AUTH_PROVIDER_REVOKED_PRINCIPAL, reason: 'revoked' },
      { principal: ACCOUNT_SYNC_AUTH_PROVIDER_AMBIGUOUS_PRINCIPAL, reason: 'ambiguous' },
      { principal: ACCOUNT_SYNC_AUTH_PROVIDER_UNSUPPORTED_PRINCIPAL, reason: 'unsupported' },
      { principal: ACCOUNT_SYNC_AUTH_PROVIDER_DELETED_PRINCIPAL, reason: 'deleted' },
      { principal: ACCOUNT_SYNC_AUTH_PROVIDER_BLOCKED_PRINCIPAL, reason: 'blocked' },
    ] as const;

    for (const rejectedState of rejectedStates) {
      const decision = accessDecision('preview', rejectedState.principal);

      expect(decision.ok).toBe(false);
      expect(decision.failureReasons).toContain(rejectedState.reason);
      expect(decision.grantsPaidEntitlement).toBe(false);
      expect(decision.acceptsFakeMastery).toBe(false);
    }
  });

  test('cross-account target is rejected', () => {
    const decision = decideAccountSyncAuthProviderAccess({
      routeId: 'preview',
      principal: ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
      nowIso: ACCOUNT_SYNC_AUTH_PROVIDER_NOW,
      targetAccountId: ACCOUNT_SYNC_AUTH_PROVIDER_OTHER_ACCOUNT_ID,
    });

    expect(decision.ok).toBe(false);
    expect(decision.failureReasons).toContain('cross_account_target');
    expect(decision.authenticatedAccountId).toBe(
      ACCOUNT_SYNC_AUTH_PROVIDER_OWNER_ACCOUNT_ID
    );
  });

  test('apply requires strict revalidation before mutation', () => {
    const applyRequirement = getAccountSyncRouteAuthRequirement('apply');
    const missingRevalidation = decideAccountSyncAuthProviderAccess({
      routeId: 'apply',
      principal: ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
      nowIso: ACCOUNT_SYNC_AUTH_PROVIDER_NOW,
      targetAccountId: ACCOUNT_SYNC_AUTH_PROVIDER_OWNER_ACCOUNT_ID,
    });
    const withRevalidation = accessDecision('apply');

    expect(applyRequirement).toMatchObject({
      requiresImmediateRevalidationBeforeMutation: true,
      canGrantPaidEntitlement: false,
      fakeMasteryAllowed: false,
    });
    expect(missingRevalidation.ok).toBe(false);
    expect(missingRevalidation.failureReasons).toContain(
      'mutation_revalidation_required'
    );
    expect(withRevalidation.ok).toBe(true);
  });

  test('digest and audit require owner-only bounded access', () => {
    for (const routeId of ['digest', 'audit'] as const) {
      const requirement = getAccountSyncRouteAuthRequirement(routeId);
      const missingBoundedRead = decideAccountSyncAuthProviderAccess({
        routeId,
        principal: ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
        nowIso: ACCOUNT_SYNC_AUTH_PROVIDER_NOW,
        targetAccountId: ACCOUNT_SYNC_AUTH_PROVIDER_OWNER_ACCOUNT_ID,
      });
      const accepted = accessDecision(routeId);

      expect(requirement).toMatchObject({
        ownerOnly: true,
        requiresOwnerOnlyBoundedRead: true,
      });
      expect(missingBoundedRead.ok).toBe(false);
      expect(missingBoundedRead.failureReasons).toContain(
        'owner_only_bounded_access_required'
      );
      expect(accepted.ok).toBe(true);
    }
  });

  test('plan metadata is read-only and cannot grant paid entitlement', () => {
    const decision = decideAccountSyncAuthProviderAccess({
      routeId: 'preview',
      principal: ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
      nowIso: ACCOUNT_SYNC_AUTH_PROVIDER_NOW,
      targetAccountId: ACCOUNT_SYNC_AUTH_PROVIDER_OWNER_ACCOUNT_ID,
      requestIncludesPaidEntitlementGrant: true,
    });

    expect(ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL.planContextReadonly).toMatchObject({
      planState: 'paid',
      readonly: true,
      canGrantPaidEntitlement: false,
    });
    expect(decision.ok).toBe(false);
    expect(decision.failureReasons).toContain('paid_entitlement_outside_sync');
    expect(decision.grantsPaidEntitlement).toBe(false);
  });

  test('billing, payment, checkout, and subscription remain outside sync', () => {
    const decision = decideAccountSyncAuthProviderAccess({
      routeId: 'preview',
      principal: ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
      nowIso: ACCOUNT_SYNC_AUTH_PROVIDER_NOW,
      targetAccountId: ACCOUNT_SYNC_AUTH_PROVIDER_OWNER_ACCOUNT_ID,
      requestIncludesBillingPaymentState: true,
    });

    expect(decision.ok).toBe(false);
    expect(decision.failureReasons).toContain('billing_payment_outside_sync');
    expect(decision.billingPaymentOutsideSync).toBe(true);
    expect(ACCOUNT_SYNC_AUTH_PROVIDER_SAFETY_SCOPE.billingPaymentAllowed).toBe(false);
  });

  test('fake mastery remains blocked and review events remain the SRS source of truth', () => {
    const decision = decideAccountSyncAuthProviderAccess({
      routeId: 'apply',
      principal: ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
      nowIso: ACCOUNT_SYNC_AUTH_PROVIDER_NOW,
      targetAccountId: ACCOUNT_SYNC_AUTH_PROVIDER_OWNER_ACCOUNT_ID,
      revalidatedImmediatelyBeforeMutation: true,
      requestContainsFakeMasteryWithoutDelayedRecallEvidence: true,
    });

    expect(decision.ok).toBe(false);
    expect(decision.failureReasons).toContain('fake_mastery_not_accepted');
    expect(decision.acceptsFakeMastery).toBe(false);
    expect(decision.reviewEventsRemainSourceOfTruth).toBe(true);
  });

  test('route auth requirements cover preview, apply, digest, and audit', () => {
    expect(ACCOUNT_SYNC_ROUTE_AUTH_REQUIREMENTS.map((requirement) => requirement.routeId)).toEqual(
      plannedRoutes
    );

    for (const requirement of ACCOUNT_SYNC_ROUTE_AUTH_REQUIREMENTS) {
      expect(requirement).toMatchObject({
        requiredPrincipal: 'normalized_authenticated_server_principal',
        ownerOnly: true,
        requiresServerDerivedOwner: true,
        rejectsClientProvidedAccountIdAsOwnershipProof: true,
        rejectsCrossAccountTarget: true,
        canGrantPaidEntitlement: false,
        billingPaymentOutsideSync: true,
        reviewEventsRemainSrsSourceOfTruth: true,
        fakeMasteryAllowed: false,
      });
    }
  });

  test('implementation gates and manual QA keep final verdict design_only', () => {
    expect(ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD).toMatchObject({
      decisionStatus: 'design_only_not_implementation_ready',
      finalVerdict: 'design_only',
      implementationReady: false,
      nextStep: {
        prNumber: 66,
        title: 'Database persistence provider decision and table design',
        realApiRouteImplementationRecommended: false,
      },
    });

    for (const gate of ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD.implementationGates) {
      expect(gate).toMatchObject({
        requiredBeforeRealRoutes: true,
        blocksRealApiRouteImplementation: true,
      });
    }

    expect(manualQAIds()).toEqual(ACCOUNT_SYNC_AUTH_PROVIDER_EXPECTED_MANUAL_QA_IDS);
  });

  test('no actual API routes, route handlers, or middleware are created', () => {
    for (const relativePath of ACCOUNT_SYNC_AUTH_PROVIDER_FORBIDDEN_ACTUAL_ROUTE_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }
  });

  test('auth provider decision module files contain no route handlers or forbidden integrations', () => {
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

    for (const relativePath of ACCOUNT_SYNC_AUTH_PROVIDER_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test('auth provider decision contract is pure static data and deterministic logic', () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      candidateCount: ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD.candidates.length,
      routeRequirementCount:
        ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD.routeAuthRequirements.length,
      decisionStatus: ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD.decisionStatus,
      providerSdkAllowed: ACCOUNT_SYNC_AUTH_PROVIDER_SAFETY_SCOPE.providerSdkAllowed,
      accessOk: accessDecision('preview').ok,
    }));

    expect(value).toEqual({
      candidateCount: ACCOUNT_SYNC_AUTH_PROVIDER_EXPECTED_CANDIDATES.length,
      routeRequirementCount: plannedRoutes.length,
      decisionStatus: 'design_only_not_implementation_ready',
      providerSdkAllowed: false,
      accessOk: true,
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });

  test('README and auth provider decision docs are linked and explicit', () => {
    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8');
    const doc = readFileSync(
      join(workspaceRoot, 'docs', 'ACCOUNT_SYNC_AUTH_PROVIDER_DECISION.md'),
      'utf8'
    );

    expect(readme).toContain(
      '[Account Sync Auth Provider Decision](docs/ACCOUNT_SYNC_AUTH_PROVIDER_DECISION.md)'
    );
    expect(doc).toContain('Final verdict: `design_only`, not implementation-ready.');
    expect(doc).toContain('Client-provided `accountId` values are never ownership proof.');
    expect(doc).toContain('#66 Database persistence provider decision and table design');
    expect(doc).toContain('#64 recommended #65 as an auth provider final decision');
  });
});
