import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  ACCOUNT_SYNC_CURRENT_ROLLOUT_PHASE,
  ACCOUNT_SYNC_KILL_SWITCH_POLICY,
  ACCOUNT_SYNC_ROLLBACK_POLICY,
  ACCOUNT_SYNC_ROLLOUT_FINAL_DECISION,
  ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT,
  ACCOUNT_SYNC_ROLLOUT_SAFETY_SCOPE,
  type AccountSyncAlertPolicy,
  type AccountSyncApplyDisableMode,
  type AccountSyncIncidentSeverity,
  type AccountSyncKillSwitchPolicy,
  type AccountSyncManualQARequirement,
  type AccountSyncMonitoringMetric,
  type AccountSyncOperationalRisk,
  type AccountSyncProductionEnablementGate,
  type AccountSyncRecoveryRunbookStep,
  type AccountSyncRollbackPolicy,
  type AccountSyncRolloutDecision,
  type AccountSyncRolloutGateVersion,
  type AccountSyncRolloutPhase,
} from '../src/lib/account-persistence/rollout-gate/rollout-gate-contract';
import {
  ACCOUNT_SYNC_ROLLOUT_EXPECTED_APPLY_DISABLE_MODES,
  ACCOUNT_SYNC_ROLLOUT_EXPECTED_MANUAL_QA_IDS,
  ACCOUNT_SYNC_ROLLOUT_EXPECTED_METRICS,
  ACCOUNT_SYNC_ROLLOUT_EXPECTED_PHASES,
  ACCOUNT_SYNC_ROLLOUT_FORBIDDEN_ACTUAL_ROUTE_PATHS,
  ACCOUNT_SYNC_ROLLOUT_MODULE_FILES,
} from '../src/lib/account-persistence/rollout-gate/fixtures';

const workspaceRoot = process.cwd();

type RequiredRolloutContractExports = {
  version: AccountSyncRolloutGateVersion;
  phase: AccountSyncRolloutPhase;
  decision: AccountSyncRolloutDecision;
  killSwitch: AccountSyncKillSwitchPolicy;
  metric: AccountSyncMonitoringMetric;
  alert: AccountSyncAlertPolicy;
  severity: AccountSyncIncidentSeverity;
  rollback: AccountSyncRollbackPolicy;
  runbookStep: AccountSyncRecoveryRunbookStep;
  manualQA: AccountSyncManualQARequirement;
  productionGate: AccountSyncProductionEnablementGate;
  disableMode: AccountSyncApplyDisableMode;
  risk: AccountSyncOperationalRisk;
};

const exportedTypeSmoke: RequiredRolloutContractExports = {
  version: ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.accountSyncRolloutGateVersion,
  phase: ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.currentPhase,
  decision: ACCOUNT_SYNC_ROLLOUT_FINAL_DECISION,
  killSwitch: ACCOUNT_SYNC_KILL_SWITCH_POLICY,
  metric: ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.monitoringMetrics[0],
  alert: ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.alertPolicies[0],
  severity: ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.alertPolicies[0].severity,
  rollback: ACCOUNT_SYNC_ROLLBACK_POLICY,
  runbookStep: ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.recoveryRunbook[0],
  manualQA: ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.manualQARequirements[0],
  productionGate: ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.productionEnablementGates[0],
  disableMode: ACCOUNT_SYNC_KILL_SWITCH_POLICY.allowedDisableModes[0],
  risk: ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.operationalRisks[0],
};

function metricNames() {
  return ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.monitoringMetrics.map(
    (metric) => metric.name
  );
}

function manualQAIds() {
  return ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.manualQARequirements.map(
    (requirement) => requirement.id
  );
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
        throw new Error('rollout gate must not call network helpers');
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

test.describe('account sync rollout gate', () => {
  test('exports the required rollout gate type surface through static contract values', () => {
    expect(exportedTypeSmoke).toMatchObject({
      version: 1,
      phase: 'design_only',
      severity: expect.stringMatching(/^SEV[0-3]$/),
      disableMode: 'apply_route_not_created',
    });
  });

  test('current rollout phase remains design_only', () => {
    expect(ACCOUNT_SYNC_CURRENT_ROLLOUT_PHASE).toBe('design_only');
    expect(ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.currentPhase).toBe('design_only');
    expect(ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.phases.map((phase) => phase.phase)).toEqual(
      ACCOUNT_SYNC_ROLLOUT_EXPECTED_PHASES
    );
  });

  test('production enablement is blocked until every P0 gate is satisfied', () => {
    expect(ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.productionEnablementGates).toHaveLength(10);

    for (const gate of ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.productionEnablementGates) {
      expect(gate).toMatchObject({
        severity: 'P0',
        satisfied: false,
        blocksProductionEnablement: true,
        blocksRealApiRouteImplementation: true,
      });
    }

    expect(
      ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.productionEnablementGates.map(
        (gate) => gate.sourcePr
      )
    ).toEqual([58, 59, 60, 61, 62, 63, 63, 63, 63, 63]);
  });

  test('apply cannot be enabled without the kill switch policy', () => {
    const limitedApply = ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.phases.find(
      (phase) => phase.phase === 'limited_apply_enabled'
    );
    const production = ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.phases.find(
      (phase) => phase.phase === 'production_enabled'
    );
    const killSwitchGate = ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.productionEnablementGates.find(
      (gate) => gate.id === 'kill_switch'
    );

    expect(limitedApply).toMatchObject({
      mutatingApplyAllowed: true,
      requiresAllP0GatesSatisfied: true,
    });
    expect(production).toMatchObject({
      mutatingApplyAllowed: true,
      requiresAllP0GatesSatisfied: true,
      productionTrafficAllowed: true,
    });
    expect(killSwitchGate).toMatchObject({
      satisfied: false,
      blocksProductionEnablement: true,
      blocksRealApiRouteImplementation: true,
    });
    expect(ACCOUNT_SYNC_KILL_SWITCH_POLICY).toMatchObject({
      requiredBeforeProduction: true,
      emergencyDisableRequiredBeforeApply: true,
      actualRuntimeSwitchImplemented: false,
    });
  });

  test('kill switch can disable mutating apply while preserving safe diagnostics', () => {
    expect(ACCOUNT_SYNC_KILL_SWITCH_POLICY.allowedDisableModes).toEqual(
      ACCOUNT_SYNC_ROLLOUT_EXPECTED_APPLY_DISABLE_MODES
    );
    expect(ACCOUNT_SYNC_KILL_SWITCH_POLICY).toMatchObject({
      disablesMutatingApply: true,
      canDisableApplyWithoutDisablingApp: true,
      preservesSafeReadOnlyDiagnostics: true,
      readOnlyDiagnosticsPolicy: {
        ownerOnly: true,
        bounded: true,
        redactedSummariesOnly: true,
        rawPayloadAccessAllowed: false,
        crossAccountReadsAllowed: false,
        productionSecretsVisible: false,
        providerTokensVisible: false,
      },
    });
  });

  test('shadow mode cannot mutate learning state', () => {
    const shadowMode = ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.phases.find(
      (phase) => phase.phase === 'limited_apply_shadow_mode'
    );

    expect(shadowMode).toMatchObject({
      shadowModeOnly: true,
      mutatingApplyAllowed: false,
      productionTrafficAllowed: false,
    });
  });

  test('rollback preserves idempotency, audit summaries, and production learning evidence', () => {
    expect(ACCOUNT_SYNC_ROLLBACK_POLICY).toMatchObject({
      firstAction: 'activate_apply_kill_switch',
      disablesMutatingApply: true,
      preservesIdempotencyRecords: true,
      preservesAuditSummaries: true,
      deletesProductionUserLearningEvidence: false,
      rollbackDeletesReviewEvents: false,
      rollbackDeletesReviewState: false,
      implementationStatus: 'design_only',
    });
  });

  test('replay after rollback cannot advance SRS twice', () => {
    expect(ACCOUNT_SYNC_ROLLBACK_POLICY).toMatchObject({
      duplicateReplayAfterRollbackCanAdvanceSrsTwice: false,
      replayUsesStoredIdempotencyOutcome: true,
      rollbackRequiresReplayProcedure: true,
    });

    expect(
      ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.recoveryRunbook.find(
        (step) => step.id === 'replay_idempotency_without_mutation'
      )
    ).toMatchObject({
      mutatesLearningState: false,
      deletesProductionUserData: false,
    });
  });

  test('monitoring metrics cover preview, apply, digest, audit, rejection categories, latency, error rate, and kill switch', () => {
    expect(metricNames()).toEqual(ACCOUNT_SYNC_ROLLOUT_EXPECTED_METRICS);

    for (const metric of ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.monitoringMetrics) {
      expect(metric).toMatchObject({
        requiredBeforeProduction: true,
        ownerScoped: true,
        containsRawPayload: false,
        providerIntegratedInThisPr: false,
        implementationStatus: 'design_only',
      });
    }

    expect(metricNames()).toEqual(
      expect.arrayContaining([
        'account_sync_preview_rejected',
        'account_sync_apply_rejected',
        'account_sync_schema_rejected',
        'account_sync_payload_too_large',
        'account_sync_ownership_rejected',
        'account_sync_idempotency_conflict',
        'account_sync_fake_mastery_blocked',
        'account_sync_paid_entitlement_ignored',
        'account_sync_billing_payload_rejected',
        'account_sync_digest_rejected',
        'account_sync_audit_rejected',
        'account_sync_latency_p95',
        'account_sync_error_rate',
        'account_sync_kill_switch_active',
      ])
    );
  });

  test('alert policy defines severity and owner escalation', () => {
    expect(ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.alertPolicies.length).toBeGreaterThanOrEqual(3);

    for (const alertPolicy of ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.alertPolicies) {
      expect(alertPolicy.severity).toMatch(/^SEV[0-3]$/);
      expect(alertPolicy.ownerEscalation).toEqual({
        primaryOwner: 'product_engineering',
        secondaryOwner: 'founder_operator',
        escalationRequired: true,
      });
      expect(alertPolicy).toMatchObject({
        requiresIncidentRecord: true,
        providerIntegratedInThisPr: false,
        implementationStatus: 'design_only',
      });
    }

    expect(
      ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.alertPolicies.find(
        (policy) => policy.id === 'account_sync_integrity_or_privacy_incident'
      )
    ).toMatchObject({
      severity: 'SEV0',
      activatesKillSwitch: true,
    });
  });

  test('manual QA requirements cover all required rollout, safety, and privacy flows', () => {
    expect(manualQAIds()).toEqual(ACCOUNT_SYNC_ROLLOUT_EXPECTED_MANUAL_QA_IDS);

    for (const requirement of ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.manualQARequirements) {
      expect(requirement).toMatchObject({
        requiredBeforeProduction: true,
      });
    }

    expect(
      ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.manualQARequirements.find(
        (requirement) => requirement.id === 'kill_switch'
      )
    ).toMatchObject({
      requiresNoMutationEvidence: true,
      requiresRedactionEvidence: true,
    });
    expect(
      ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.manualQARequirements.find(
        (requirement) => requirement.id === 'paid_entitlement_boundary'
      )
    ).toMatchObject({
      requiresNoMutationEvidence: true,
      requiresRedactionEvidence: true,
    });
  });

  test('final verdict remains design_only and not implementation-ready', () => {
    expect(ACCOUNT_SYNC_ROLLOUT_FINAL_DECISION).toMatchObject({
      currentPhase: 'design_only',
      decision: 'blocked_from_implementation',
      productionEnablementAllowed: false,
      realApiRouteImplementationAllowed: false,
      mutatingApplyAllowed: false,
      readOnlyPreviewAllowedInProduction: false,
      nextRecommendedPr: {
        number: 64,
        title: 'Account sync final implementation readiness review',
        realApiRouteImplementationRecommended: false,
      },
    });
  });

  test('no actual API routes, route handlers, or middleware are created', () => {
    for (const relativePath of ACCOUNT_SYNC_ROLLOUT_FORBIDDEN_ACTUAL_ROUTE_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }
  });

  test('rollout gate module files do not contain route handlers or forbidden integrations', () => {
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
      /from ['"]@sentry\//,
      /from ['"]@vercel\/analytics/,
      /from ['"]zod/,
      /from ['"]yup/,
      /from ['"]valibot/,
    ];

    for (const relativePath of ACCOUNT_SYNC_ROLLOUT_MODULE_FILES) {
      const filePath = join(workspaceRoot, relativePath);
      const fileText = readFileSync(filePath, 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test('rollout gate contract is static data and does not access runtime surfaces', () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      phase: ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.currentPhase,
      metricCount: ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.monitoringMetrics.length,
      gateCount: ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT.productionEnablementGates.length,
      routeFilesAllowed: ACCOUNT_SYNC_ROLLOUT_SAFETY_SCOPE.actualApiRouteFilesAllowed,
      paidEntitlementAllowed:
        ACCOUNT_SYNC_ROLLOUT_SAFETY_SCOPE.paidEntitlementGrantAllowed,
    }));

    expect(value).toEqual({
      phase: 'design_only',
      metricCount: ACCOUNT_SYNC_ROLLOUT_EXPECTED_METRICS.length,
      gateCount: 10,
      routeFilesAllowed: false,
      paidEntitlementAllowed: false,
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });

  test('documentation and README links are present', () => {
    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8');
    const doc = readFileSync(
      join(workspaceRoot, 'docs', 'ACCOUNT_SYNC_ROLLOUT_GATE.md'),
      'utf8'
    );

    expect(readme).toContain(
      '[Account Sync Rollout Gate](docs/ACCOUNT_SYNC_ROLLOUT_GATE.md)'
    );
    expect(doc).toContain('Current rollout phase: `design_only`.');
    expect(doc).toContain('Final verdict: `design_only`, not implementation-ready.');
    expect(doc).toContain(
      'PR #64 should be Account sync final implementation readiness review'
    );
  });
});
