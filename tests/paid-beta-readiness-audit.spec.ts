import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  PAID_BETA_NEXT_STEP,
  PAID_BETA_PRIVATE_VERDICT,
  PAID_BETA_PUBLIC_VERDICT,
  PAID_BETA_READINESS_AUDIT,
  PAID_BETA_READINESS_AREA_IDS,
  PAID_BETA_READINESS_SAFETY_POLICY,
  VISUAL_LEXICON_PAID_BETA_READINESS_VERSION,
  getPaidBetaBlocker,
  getPaidBetaFunnelCheckpoint,
  getPaidBetaLaunchGate,
  getPaidBetaLocalStorageKeyInventoryItem,
  getPaidBetaReadinessArea,
  getPaidBetaRouteInventoryItem,
  type PaidBetaBlocker,
  type PaidBetaFunnelCheckpoint,
  type PaidBetaLaunchGate,
  type PaidBetaLocalStorageKeyInventoryItem,
  type PaidBetaManualQARequirement,
  type PaidBetaNextStep,
  type PaidBetaReadinessArea,
  type PaidBetaReadinessAudit,
  type PaidBetaReadinessSeverity,
  type PaidBetaReadinessStatus,
  type PaidBetaReadinessVerdict,
  type PaidBetaRisk,
  type PaidBetaRouteInventoryItem,
  type PaidBetaTestInventoryItem,
  type VisualLexiconPaidBetaReadinessVersion,
} from '../src/lib/paid-beta-readiness/paid-beta-readiness-audit';
import {
  PAID_BETA_READINESS_DOC_FILES,
  PAID_BETA_READINESS_EXPECTED_AREA_IDS,
  PAID_BETA_READINESS_FORBIDDEN_ACTUAL_PATHS,
  PAID_BETA_READINESS_FORBIDDEN_DIRECT_DEPENDENCIES,
  PAID_BETA_READINESS_MODULE_FILES,
  PAID_BETA_READINESS_REQUIRED_FUNNEL_CHECKPOINT_IDS,
  PAID_BETA_READINESS_REQUIRED_LOCAL_STORAGE_KEYS,
  PAID_BETA_READINESS_REQUIRED_P0_BLOCKER_IDS,
  PAID_BETA_READINESS_REQUIRED_P1_BLOCKER_IDS,
  PAID_BETA_READINESS_REQUIRED_P2_BLOCKER_IDS,
  PAID_BETA_READINESS_REQUIRED_ROUTES,
} from '../src/lib/paid-beta-readiness/fixtures';

const workspaceRoot = process.cwd();

type RequiredPaidBetaReadinessTypeSurface = {
  version: VisualLexiconPaidBetaReadinessVersion;
  verdict: PaidBetaReadinessVerdict;
  area: PaidBetaReadinessArea;
  status: PaidBetaReadinessStatus;
  severity: PaidBetaReadinessSeverity;
  route: PaidBetaRouteInventoryItem;
  storage: PaidBetaLocalStorageKeyInventoryItem;
  testInventory: PaidBetaTestInventoryItem;
  manualQa: PaidBetaManualQARequirement;
  funnel: PaidBetaFunnelCheckpoint;
  risk: PaidBetaRisk;
  blocker: PaidBetaBlocker;
  gate: PaidBetaLaunchGate;
  nextStep: PaidBetaNextStep;
  audit: PaidBetaReadinessAudit;
};

const exportedTypeSmoke: RequiredPaidBetaReadinessTypeSurface = {
  version: VISUAL_LEXICON_PAID_BETA_READINESS_VERSION,
  verdict: PAID_BETA_PRIVATE_VERDICT,
  area: PAID_BETA_READINESS_AREA_IDS[0],
  status: PAID_BETA_READINESS_AUDIT.areaAssessments[0].status,
  severity: PAID_BETA_READINESS_AUDIT.areaAssessments[0].severity,
  route: PAID_BETA_READINESS_AUDIT.routeInventory[0],
  storage: PAID_BETA_READINESS_AUDIT.localStorageKeyInventory[0],
  testInventory: PAID_BETA_READINESS_AUDIT.testInventory[0],
  manualQa: PAID_BETA_READINESS_AUDIT.manualQaRequirements[0],
  funnel: PAID_BETA_READINESS_AUDIT.funnelCheckpoints[0],
  risk: PAID_BETA_READINESS_AUDIT.risks[0],
  blocker: PAID_BETA_READINESS_AUDIT.blockers[0],
  gate: PAID_BETA_READINESS_AUDIT.launchGates[0],
  nextStep: PAID_BETA_NEXT_STEP,
  audit: PAID_BETA_READINESS_AUDIT,
};

function routePaths() {
  return PAID_BETA_READINESS_AUDIT.routeInventory.map((item) => item.route);
}

function localStorageKeys() {
  return PAID_BETA_READINESS_AUDIT.localStorageKeyInventory.map(
    (item) => item.key
  );
}

function funnelCheckpointIds() {
  return PAID_BETA_READINESS_AUDIT.funnelCheckpoints.map((item) => item.id);
}

function blockerIdsBySeverity(severity: PaidBetaReadinessSeverity) {
  return PAID_BETA_READINESS_AUDIT.blockers
    .filter((blocker) => blocker.severity === severity)
    .map((blocker) => blocker.id);
}

function readJsonFile<TValue>(relativePath: string): TValue {
  return JSON.parse(readFileSync(join(workspaceRoot, relativePath), 'utf8')) as TValue;
}

function readRootPackageDependencies(fileName: 'package.json' | 'package-lock.json') {
  const parsed = readJsonFile<{
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
  }>(fileName);
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
        throw new Error('paid beta readiness must not call network helpers');
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

test.describe('Visual Lexicon paid beta readiness audit', () => {
  test('exports the required readiness type surface through static values', () => {
    expect(exportedTypeSmoke).toMatchObject({
      version: 1,
      verdict: 'conditional_go_for_private_paid_beta_only',
      area: 'save_to_review_loop',
      status: 'private_beta_ready',
      severity: 'P0',
      nextStep: {
        prNumber: 71,
        docsContractsTestsOnly: true,
        realApiRouteImplementationRecommended: false,
      },
    });
  });

  test('includes every required readiness area', () => {
    expect(PAID_BETA_READINESS_AREA_IDS).toEqual(
      PAID_BETA_READINESS_EXPECTED_AREA_IDS
    );

    for (const areaId of PAID_BETA_READINESS_EXPECTED_AREA_IDS) {
      expect(getPaidBetaReadinessArea(areaId), areaId).toBeDefined();
    }
  });

  test('final verdict is conditional private beta only and public beta No-Go', () => {
    expect(PAID_BETA_PRIVATE_VERDICT).toBe(
      'conditional_go_for_private_paid_beta_only'
    );
    expect(PAID_BETA_PUBLIC_VERDICT).toBe('no_go_for_public_paid_beta');
    expect(PAID_BETA_READINESS_AUDIT).toMatchObject({
      privateBetaVerdict: 'conditional_go_for_private_paid_beta_only',
      publicBetaVerdict: 'no_go_for_public_paid_beta',
    });

    expect(getPaidBetaLaunchGate('private_owner_run_manual_beta')).toMatchObject({
      status: 'conditional_private_beta_ready',
      privateBetaAllowed: true,
      publicBetaAllowed: false,
    });
    expect(getPaidBetaLaunchGate('public_paid_beta_no_go')).toMatchObject({
      status: 'blocked',
      privateBetaAllowed: false,
      publicBetaAllowed: false,
    });
  });

  test('route inventory includes all required Track B surfaces', () => {
    expect(routePaths()).toEqual(
      expect.arrayContaining([...PAID_BETA_READINESS_REQUIRED_ROUTES])
    );

    for (const route of PAID_BETA_READINESS_REQUIRED_ROUTES) {
      const item = getPaidBetaRouteInventoryItem(route);

      expect(item, route).toBeDefined();
      expect(item).toMatchObject({
        fakeProgressAllowed: false,
        publicBetaReady: false,
      });
    }
  });

  test('local storage inventory includes all required stores and grants no entitlement', () => {
    expect(localStorageKeys()).toEqual(
      expect.arrayContaining([...PAID_BETA_READINESS_REQUIRED_LOCAL_STORAGE_KEYS])
    );

    for (const key of PAID_BETA_READINESS_REQUIRED_LOCAL_STORAGE_KEYS) {
      const item = getPaidBetaLocalStorageKeyInventoryItem(key);

      expect(item, key).toBeDefined();
      expect(item).toMatchObject({
        productionSourceOfTruth: false,
        grantsPaidEntitlement: false,
      });
    }

    expect(getPaidBetaLocalStorageKeyInventoryItem('vlx_review_state_v1')).toMatchObject({
      severity: 'P0',
      migrationOrBackupRequiredBeforePublicBeta: true,
    });
    expect(getPaidBetaLocalStorageKeyInventoryItem('vlx_upgrade_interest_v1')).toMatchObject({
      attributionOnly: true,
      grantsPaidEntitlement: false,
    });
    expect(getPaidBetaLocalStorageKeyInventoryItem('vlx_plan_state_v1')).toMatchObject({
      grantsPaidEntitlement: false,
      productionSourceOfTruth: false,
    });
  });

  test('Save to Review to SRS readiness is private-beta-ready with real state', () => {
    expect(getPaidBetaReadinessArea('save_to_review_loop')).toMatchObject({
      status: 'private_beta_ready',
      privateBetaAllowed: true,
      mustUseRealState: true,
      fakeMasteryAllowed: false,
    });
    expect(getPaidBetaReadinessArea('local_srs_state_events')).toMatchObject({
      status: 'private_beta_ready',
      privateBetaAllowed: true,
      mustUseRealState: true,
      fakeMasteryAllowed: false,
    });
  });

  test('Due Weak Mastered readiness requires real state and forbids fake mastery', () => {
    expect(getPaidBetaReadinessArea('due_weak_mastered')).toMatchObject({
      status: 'private_beta_ready',
      severity: 'P0',
      mustUseRealState: true,
      fakeMasteryAllowed: false,
    });
    expect(getPaidBetaFunnelCheckpoint('due_weak_mastered_real_state')).toMatchObject({
      status: 'private_beta_ready',
      passCondition: expect.stringContaining('No fake mastery'),
    });
    expect(PAID_BETA_READINESS_SAFETY_POLICY.fakeMasteryAllowed).toBe(false);
  });

  test('paid entitlement payment path and account sync remain blocked for public beta', () => {
    expect(getPaidBetaReadinessArea('payment_path')).toMatchObject({
      status: 'blocked',
      severity: 'P0',
      publicBetaAllowed: false,
    });
    expect(getPaidBetaReadinessArea('account_sync')).toMatchObject({
      status: 'blocked',
      severity: 'P0',
      publicBetaAllowed: false,
    });
    expect(getPaidBetaBlocker('no_production_entitlement_system')).toMatchObject({
      severity: 'P0',
      blocksPublicBeta: true,
    });
    expect(PAID_BETA_READINESS_SAFETY_POLICY).toMatchObject({
      billingPaymentCheckoutAllowed: false,
      paidEntitlementGrantAllowed: false,
      realAuthAllowed: false,
      databasePersistenceAllowed: false,
    });
  });

  test('manual QA accessibility and production monitoring are not marked complete without evidence', () => {
    expect(getPaidBetaReadinessArea('manual_qa')).toMatchObject({
      status: 'blocked',
      severity: 'P0',
      privateBetaAllowed: false,
      publicBetaAllowed: false,
    });
    expect(getPaidBetaReadinessArea('accessibility')).toMatchObject({
      status: 'blocked',
      severity: 'P0',
      privateBetaAllowed: false,
      publicBetaAllowed: false,
    });
    expect(getPaidBetaReadinessArea('production_monitoring')).toMatchObject({
      status: 'blocked',
      severity: 'P0',
      publicBetaAllowed: false,
    });
  });

  test('analytics events are privacy-safe and do not imply production monitoring approval', () => {
    expect(getPaidBetaReadinessArea('analytics_events')).toMatchObject({
      status: 'private_beta_ready',
      privateBetaAllowed: true,
      publicBetaAllowed: false,
    });
    expect(getPaidBetaFunnelCheckpoint('analytics_privacy_safe')).toMatchObject({
      privacySafe: true,
      passCondition: expect.stringContaining('do not imply production monitoring approval'),
    });
    expect(getPaidBetaBlocker('analytics_taxonomy_launch_dashboard_mapping_needed')).toMatchObject({
      severity: 'P1',
      blocksPublicBeta: true,
    });
  });

  test('upgrade interest remains attribution-only and cannot grant paid access', () => {
    expect(getPaidBetaFunnelCheckpoint('upgrade_interest_attribution_only')).toMatchObject({
      status: 'private_beta_ready',
      privacySafe: true,
    });
    expect(getPaidBetaLocalStorageKeyInventoryItem('vlx_upgrade_interest_v1')).toMatchObject({
      attributionOnly: true,
      grantsPaidEntitlement: false,
      productionSourceOfTruth: false,
    });
    expect(getPaidBetaFunnelCheckpoint('no_paid_entitlement_granted')).toMatchObject({
      status: 'blocked',
      severity: 'P0',
    });
  });

  test('private beta is allowed only with owner-run manual process and public beta remains No-Go', () => {
    expect(PAID_BETA_READINESS_AUDIT.privateBetaRecommendation).toContain(
      'owner-run/private'
    );
    expect(PAID_BETA_READINESS_AUDIT.publicBetaRecommendation).toContain('No-Go');
    expect(getPaidBetaLaunchGate('private_owner_run_manual_beta')).toMatchObject({
      title: 'Private paid beta is conditional/manual-only.',
      privateBetaAllowed: true,
      publicBetaAllowed: false,
    });
  });

  test('P0 P1 and P2 blockers include required launch gaps', () => {
    expect(blockerIdsBySeverity('P0')).toEqual(
      expect.arrayContaining([...PAID_BETA_READINESS_REQUIRED_P0_BLOCKER_IDS])
    );
    expect(blockerIdsBySeverity('P1')).toEqual(
      expect.arrayContaining([...PAID_BETA_READINESS_REQUIRED_P1_BLOCKER_IDS])
    );
    expect(blockerIdsBySeverity('P2')).toEqual(
      expect.arrayContaining([...PAID_BETA_READINESS_REQUIRED_P2_BLOCKER_IDS])
    );

    for (const blockerId of PAID_BETA_READINESS_REQUIRED_P0_BLOCKER_IDS) {
      expect(getPaidBetaBlocker(blockerId), blockerId).toMatchObject({
        severity: 'P0',
        status: 'open',
        blocksPublicBeta: true,
      });
    }
  });

  test('paid beta funnel checklist includes every required checkpoint', () => {
    expect(funnelCheckpointIds()).toEqual(
      PAID_BETA_READINESS_REQUIRED_FUNNEL_CHECKPOINT_IDS
    );

    for (const checkpointId of PAID_BETA_READINESS_REQUIRED_FUNNEL_CHECKPOINT_IDS) {
      const checkpoint = getPaidBetaFunnelCheckpoint(checkpointId);

      expect(checkpoint, checkpointId).toBeDefined();
      expect(checkpoint).toMatchObject({
        privateBetaRequired: true,
        publicBetaRequired: true,
      });
    }
  });

  test('next PR stays focused on manual QA or Product UI readiness', () => {
    expect(PAID_BETA_NEXT_STEP).toEqual({
      prNumber: 71,
      title: 'Paid beta manual QA checklist runner or Product/UI readiness audit',
      docsContractsTestsOnly: true,
      realApiRouteImplementationRecommended: false,
      paymentImplementationRecommended: false,
      accountSyncImplementationRecommended: false,
      reason:
        'The next PR should record manual QA or product/UI readiness evidence, not real API route, account sync, payment, or entitlement implementation.',
    });
  });

  test('no actual API routes, route handlers, middleware, or payment route directories are created', () => {
    for (const relativePath of PAID_BETA_READINESS_FORBIDDEN_ACTUAL_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }
  });

  test('no forbidden provider SDKs, payment SDKs, logging SDKs, or validation dependencies are added', () => {
    for (const fileName of ['package.json', 'package-lock.json'] as const) {
      const rootDependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of PAID_BETA_READINESS_FORBIDDEN_DIRECT_DEPENDENCIES) {
        if (dependencyName === 'zod') {
          continue;
        }

        expect(rootDependencies, `${fileName} should not add ${dependencyName}`).not.toHaveProperty(
          dependencyName
        );
      }
    }
  });

  test('readiness module files contain no route handlers or forbidden integrations', () => {
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

    for (const relativePath of PAID_BETA_READINESS_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test('readiness audit is pure static data and does not access runtime surfaces', () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      version: PAID_BETA_READINESS_AUDIT.visualLexiconPaidBetaReadinessVersion,
      privateVerdict: PAID_BETA_READINESS_AUDIT.privateBetaVerdict,
      publicVerdict: PAID_BETA_READINESS_AUDIT.publicBetaVerdict,
      routeCount: PAID_BETA_READINESS_AUDIT.routeInventory.length,
      blockerCount: PAID_BETA_READINESS_AUDIT.blockers.length,
      apiRoutesAllowed: PAID_BETA_READINESS_AUDIT.safetyPolicy.apiRoutesAllowed,
      paidEntitlementGrantAllowed:
        PAID_BETA_READINESS_AUDIT.safetyPolicy.paidEntitlementGrantAllowed,
    }));

    expect(value).toEqual({
      version: 1,
      privateVerdict: 'conditional_go_for_private_paid_beta_only',
      publicVerdict: 'no_go_for_public_paid_beta',
      routeCount: PAID_BETA_READINESS_AUDIT.routeInventory.length,
      blockerCount: PAID_BETA_READINESS_AUDIT.blockers.length,
      apiRoutesAllowed: false,
      paidEntitlementGrantAllowed: false,
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });

  test('README and paid beta readiness docs are linked and explicit', () => {
    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8');
    const doc = readFileSync(
      join(workspaceRoot, 'docs', 'PAID_BETA_READINESS_AUDIT.md'),
      'utf8'
    );

    expect(PAID_BETA_READINESS_DOC_FILES).toEqual([
      'docs/PAID_BETA_READINESS_AUDIT.md',
      'README.md',
    ]);
    expect(readme).toContain('docs/PAID_BETA_READINESS_AUDIT.md');
    expect(doc).toContain('conditional_go_for_private_paid_beta_only');
    expect(doc).toContain('no_go_for_public_paid_beta');
    expect(doc).toContain('No real account/server sync enabled.');
    expect(doc).toContain('No real payment/checkout/subscription path.');
    expect(doc).toContain('#71 Paid beta manual QA checklist runner or Product/UI readiness audit');
    expect(doc).toContain('Do not recommend real API route implementation yet.');
  });
});
