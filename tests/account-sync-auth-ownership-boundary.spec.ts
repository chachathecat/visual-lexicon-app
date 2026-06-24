import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  ACCOUNT_SYNC_ROUTE_OWNERSHIP_POLICIES,
  ACCOUNT_SYNC_SUPPORTED_AUTH_PROVIDER_KINDS,
  decideAccountSyncOwnership,
  getAccountSyncRouteOwnershipPolicy,
  type AccountSyncAuthContext,
  type AccountSyncOwnershipFailureReason,
} from '../src/lib/account-persistence/auth-ownership/auth-ownership-boundary';
import {
  ACCOUNT_SYNC_AUTH_OWNERSHIP_ANONYMOUS_CONTEXT,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_AMBIGUOUS_SUBJECT_CONTEXT,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_BILLING_TARGET,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_CLIENT_ONLY_TARGET,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_CROSS_ACCOUNT_TARGET,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_EXPIRED_SESSION_CONTEXT,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_FAKE_MASTERY_TARGET,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_FORBIDDEN_ACTUAL_ROUTE_PATHS,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_MISSING_ACCOUNT_CONTEXT,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_MISSING_SESSION_CONTEXT,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_PAID_ENTITLEMENT_TARGET,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_PRIVACY_CONTEXT,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_RAW_AUDIT_TARGET,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_REVOKED_SESSION_CONTEXT,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_SAME_ACCOUNT_TARGET,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_STRICT_CONTEXT,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_UNSUPPORTED_PROVIDER_CONTEXT,
  ACCOUNT_SYNC_AUTH_OWNERSHIP_UNVERIFIED_CONTEXT,
} from '../src/lib/account-persistence/auth-ownership/fixtures';
import type { VlxAccountSyncRouteId } from '../src/lib/account-persistence/api-route-design/route-contracts';

const workspaceRoot = process.cwd();
const plannedRoutes = ['preview', 'apply', 'digest', 'audit'] as const satisfies readonly VlxAccountSyncRouteId[];

function decisionFor(routeId: VlxAccountSyncRouteId, authContext: AccountSyncAuthContext) {
  return decideAccountSyncOwnership({
    routeId,
    authContext,
    targetAccount: ACCOUNT_SYNC_AUTH_OWNERSHIP_SAME_ACCOUNT_TARGET,
  });
}

function expectRejectedFor(
  authContext: AccountSyncAuthContext,
  failureReason: AccountSyncOwnershipFailureReason
) {
  const decision = decisionFor('preview', authContext);

  expect(decision.ok).toBe(false);
  expect(decision.failureReasons).toContain(failureReason);
  expect(decision.grantsPaidEntitlement).toBe(false);
  expect(decision.acceptsFakeMastery).toBe(false);
  expect(decision.clientAccountIdTrustedAsOwner).toBe(false);
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
        throw new Error('auth ownership boundary must not call network helpers');
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

test.describe('account sync auth ownership boundary', () => {
  test('defines ownership policies for all planned account sync routes', () => {
    expect(
      ACCOUNT_SYNC_ROUTE_OWNERSHIP_POLICIES.map((policy) => ({
        routeId: policy.routeId,
        method: policy.method,
        path: policy.path,
      }))
    ).toEqual([
      {
        routeId: 'preview',
        method: 'POST',
        path: '/api/account/sync/preview',
      },
      {
        routeId: 'apply',
        method: 'POST',
        path: '/api/account/sync/apply',
      },
      {
        routeId: 'digest',
        method: 'GET',
        path: '/api/account/sync/digest',
      },
      {
        routeId: 'audit',
        method: 'GET',
        path: '/api/account/sync/audit',
      },
    ]);

    for (const policy of ACCOUNT_SYNC_ROUTE_OWNERSHIP_POLICIES) {
      expect(policy).toMatchObject({
        requiresAuthenticatedServerSession: true,
        requiresServerDerivedOwner: true,
        requiresTargetAccount: true,
        requiresOwnerTargetMatch: true,
        allowsClientProvidedAccountIdAsOwnershipProof: false,
        rejectsAnonymous: true,
        rejectsCrossAccountAccess: true,
        canGrantPaidEntitlement: false,
        billingPaymentOutsideSync: true,
        acceptsFakeLocalMastery: false,
      });
    }
  });

  test('anonymous context is rejected for all planned sync routes', () => {
    for (const routeId of plannedRoutes) {
      const decision = decisionFor(routeId, ACCOUNT_SYNC_AUTH_OWNERSHIP_ANONYMOUS_CONTEXT);

      expect(decision.ok).toBe(false);
      expect(decision.failureReasons).toContain('anonymous');
      expect(decision.clientAccountIdTrustedAsOwner).toBe(false);
    }
  });

  test('missing, expired, revoked, unsupported, ambiguous, and unverified contexts are rejected', () => {
    expectRejectedFor(ACCOUNT_SYNC_AUTH_OWNERSHIP_MISSING_ACCOUNT_CONTEXT, 'missing_account');
    expectRejectedFor(ACCOUNT_SYNC_AUTH_OWNERSHIP_MISSING_SESSION_CONTEXT, 'missing_session');
    expectRejectedFor(ACCOUNT_SYNC_AUTH_OWNERSHIP_EXPIRED_SESSION_CONTEXT, 'expired_session');
    expectRejectedFor(ACCOUNT_SYNC_AUTH_OWNERSHIP_REVOKED_SESSION_CONTEXT, 'revoked_session');
    expectRejectedFor(
      ACCOUNT_SYNC_AUTH_OWNERSHIP_UNSUPPORTED_PROVIDER_CONTEXT,
      'unsupported_provider'
    );
    expectRejectedFor(
      ACCOUNT_SYNC_AUTH_OWNERSHIP_AMBIGUOUS_SUBJECT_CONTEXT,
      'ambiguous_subject'
    );
    expectRejectedFor(ACCOUNT_SYNC_AUTH_OWNERSHIP_UNVERIFIED_CONTEXT, 'ownership_not_verified');
  });

  test('cross-account targets and client-only account ids are rejected', () => {
    const crossAccount = decideAccountSyncOwnership({
      routeId: 'preview',
      authContext: ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT,
      targetAccount: ACCOUNT_SYNC_AUTH_OWNERSHIP_CROSS_ACCOUNT_TARGET,
    });
    const clientOnly = decideAccountSyncOwnership({
      routeId: 'preview',
      authContext: ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT,
      targetAccount: ACCOUNT_SYNC_AUTH_OWNERSHIP_CLIENT_ONLY_TARGET,
    });

    expect(crossAccount.ok).toBe(false);
    expect(crossAccount.failureReasons).toContain('cross_account_access');
    expect(clientOnly.ok).toBe(false);
    expect(clientOnly.failureReasons).toContain('missing_target_account');
    expect(clientOnly.failureReasons).toContain('client_account_id_not_trusted');
    expect(clientOnly.clientAccountIdTrustedAsOwner).toBe(false);
  });

  test('same-account context is accepted only when route policy requirements are met', () => {
    const preview = decisionFor('preview', ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT);
    const applyWithPreviewPolicy = decisionFor(
      'apply',
      ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT
    );
    const digestWithPreviewPolicy = decisionFor(
      'digest',
      ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT
    );
    const digestWithPrivacyPolicy = decisionFor(
      'digest',
      ACCOUNT_SYNC_AUTH_OWNERSHIP_PRIVACY_CONTEXT
    );
    const applyWithStrictPolicy = decisionFor(
      'apply',
      ACCOUNT_SYNC_AUTH_OWNERSHIP_STRICT_CONTEXT
    );

    expect(preview.ok).toBe(true);
    expect(applyWithPreviewPolicy.ok).toBe(false);
    expect(applyWithPreviewPolicy.failureReasons).toContain('insufficient_route_policy');
    expect(digestWithPreviewPolicy.ok).toBe(false);
    expect(digestWithPreviewPolicy.failureReasons).toContain('insufficient_route_policy');
    expect(digestWithPrivacyPolicy.ok).toBe(true);
    expect(applyWithStrictPolicy.ok).toBe(true);
  });

  test('apply has a stricter ownership policy than preview', () => {
    const preview = getAccountSyncRouteOwnershipPolicy('preview');
    const apply = getAccountSyncRouteOwnershipPolicy('apply');

    expect(preview).toBeDefined();
    expect(apply).toBeDefined();

    if (!preview || !apply) {
      throw new Error('Missing route ownership policy fixture.');
    }

    expect(apply.policyRank).toBeGreaterThan(preview.policyRank);
    expect(apply.requiredOwnershipLevel).toBe('strict_mutation_owner');
    expect(apply.applyRequiresStrictestPolicy).toBe(true);
  });

  test('digest and audit require privacy-safe ownership policy and bounded responses', () => {
    for (const routeId of ['digest', 'audit'] as const) {
      const policy = getAccountSyncRouteOwnershipPolicy(routeId);
      const accepted = decisionFor(routeId, ACCOUNT_SYNC_AUTH_OWNERSHIP_PRIVACY_CONTEXT);
      const rawPayload = decideAccountSyncOwnership({
        routeId,
        authContext: ACCOUNT_SYNC_AUTH_OWNERSHIP_PRIVACY_CONTEXT,
        targetAccount: ACCOUNT_SYNC_AUTH_OWNERSHIP_RAW_AUDIT_TARGET,
      });

      expect(policy).toMatchObject({
        requiresPrivacySafeBoundedResponse: true,
        allowsRawGuestSnapshots: false,
        exposesSensitivePayloads: false,
      });
      expect(accepted.ok).toBe(true);
      expect(rawPayload.ok).toBe(false);
      expect(rawPayload.failureReasons).toContain('privacy_response_not_bounded');
    }
  });

  test('ownership decisions never grant paid entitlement or accept fake mastery', () => {
    const acceptedPaidPlan = decisionFor(
      'preview',
      ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT
    );
    const entitlementRequest = decideAccountSyncOwnership({
      routeId: 'preview',
      authContext: ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT,
      targetAccount: ACCOUNT_SYNC_AUTH_OWNERSHIP_PAID_ENTITLEMENT_TARGET,
    });
    const fakeMastery = decideAccountSyncOwnership({
      routeId: 'apply',
      authContext: ACCOUNT_SYNC_AUTH_OWNERSHIP_STRICT_CONTEXT,
      targetAccount: ACCOUNT_SYNC_AUTH_OWNERSHIP_FAKE_MASTERY_TARGET,
    });

    expect(acceptedPaidPlan.ok).toBe(true);
    expect(acceptedPaidPlan.grantsPaidEntitlement).toBe(false);
    expect(entitlementRequest.ok).toBe(false);
    expect(entitlementRequest.failureReasons).toContain('paid_entitlement_outside_sync');
    expect(entitlementRequest.grantsPaidEntitlement).toBe(false);
    expect(fakeMastery.ok).toBe(false);
    expect(fakeMastery.failureReasons).toContain('fake_mastery_not_accepted');
    expect(fakeMastery.acceptsFakeMastery).toBe(false);
    expect(fakeMastery.reviewEventsRemainSourceOfTruth).toBe(true);
  });

  test('billing and payment boundary remains outside account sync', () => {
    const decision = decideAccountSyncOwnership({
      routeId: 'preview',
      authContext: ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT,
      targetAccount: ACCOUNT_SYNC_AUTH_OWNERSHIP_BILLING_TARGET,
    });

    expect(decision.ok).toBe(false);
    expect(decision.failureReasons).toContain('billing_payment_outside_sync');
    expect(decision.billingPaymentOutsideSync).toBe(true);
  });

  test('auth ownership module is pure static data and deterministic logic', () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => {
      const decision = decisionFor('preview', ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT);

      return {
        routeCount: ACCOUNT_SYNC_ROUTE_OWNERSHIP_POLICIES.length,
        supportedProviders: ACCOUNT_SYNC_SUPPORTED_AUTH_PROVIDER_KINDS,
        decisionOk: decision.ok,
        designOnly: decision.designOnly,
      };
    });

    expect(value).toEqual({
      routeCount: 4,
      supportedProviders: ['mock_contract_session'],
      decisionOk: true,
      designOnly: true,
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });

  test('no actual route file paths, route handlers, or middleware are created', () => {
    const forbiddenPaths = [
      ...ACCOUNT_SYNC_AUTH_OWNERSHIP_FORBIDDEN_ACTUAL_ROUTE_PATHS,
      'app/api',
      'pages/api',
      'src/app/api/account',
      'src/pages/api',
      'middleware.ts',
    ];

    for (const relativePath of forbiddenPaths) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }
  });

  test('auth ownership module contains no forbidden SDK imports or runtime access', () => {
    const authOwnershipModuleFiles = [
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'auth-ownership',
        'auth-ownership-boundary.ts'
      ),
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'auth-ownership',
        'fixtures.ts'
      ),
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'auth-ownership',
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
    ];

    for (const filePath of authOwnershipModuleFiles) {
      const fileText = readFileSync(filePath, 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${filePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test('README and account sync auth ownership docs are linked and explicit', () => {
    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8');
    const doc = readFileSync(
      join(workspaceRoot, 'docs', 'ACCOUNT_SYNC_AUTH_OWNERSHIP_BOUNDARY.md'),
      'utf8'
    );

    expect(readme).toContain(
      '[Account Sync Auth Ownership Boundary](docs/ACCOUNT_SYNC_AUTH_OWNERSHIP_BOUNDARY.md)'
    );
    expect(doc).toContain('Final verdict: **design_only, not implementation-ready**.');
    expect(doc).toContain('Client-provided `accountId` values are never ownership proof.');
    expect(doc).toContain('#60 Account sync durable idempotency and persistence storage design');
  });
});
