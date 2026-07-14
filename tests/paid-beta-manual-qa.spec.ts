import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import { basename, join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  PAID_BETA_MANUAL_QA_CONSOLE_PROBES,
  PAID_BETA_MANUAL_QA_CONTRACT,
  PAID_BETA_MANUAL_QA_NEXT_STEP,
  PAID_BETA_MANUAL_QA_PRIVATE_VERDICT,
  PAID_BETA_MANUAL_QA_PUBLIC_VERDICT,
  PAID_BETA_MANUAL_QA_ROUTE_TARGETS,
  PAID_BETA_MANUAL_QA_SCENARIOS,
  PAID_BETA_MANUAL_QA_STOP_CONDITIONS,
  PAID_BETA_MANUAL_QA_STORAGE_PROBES,
  VISUAL_LEXICON_PAID_BETA_MANUAL_QA_VERSION,
  getPaidBetaManualQaConsoleProbe,
  getPaidBetaManualQaRouteTarget,
  getPaidBetaManualQaScenario,
  getPaidBetaManualQaStopCondition,
  getPaidBetaManualQaStorageProbe,
  type PaidBetaManualQaBrowserProfile,
  type PaidBetaManualQaConsoleProbe,
  type PaidBetaManualQaDeviceProfile,
  type PaidBetaManualQaEvidence,
  type PaidBetaManualQaExpectedResult,
  type PaidBetaManualQaNextStep,
  type PaidBetaManualQaPhase,
  type PaidBetaManualQaResultStatus,
  type PaidBetaManualQaRouteTarget,
  type PaidBetaManualQaScenario,
  type PaidBetaManualQaSeverity,
  type PaidBetaManualQaStep,
  type PaidBetaManualQaStopCondition,
  type PaidBetaManualQaStorageProbe,
  type PaidBetaManualQaVerdict,
  type PaidBetaManualQaVersion
} from "../src/lib/paid-beta-manual-qa/paid-beta-manual-qa";
import {
  PAID_BETA_MANUAL_QA_DOC_FILES,
  PAID_BETA_MANUAL_QA_FORBIDDEN_ACTUAL_PATHS,
  PAID_BETA_MANUAL_QA_FORBIDDEN_DIRECT_DEPENDENCIES,
  PAID_BETA_MANUAL_QA_MODULE_FILES,
  PAID_BETA_MANUAL_QA_REQUIRED_CONSOLE_PROBE_IDS,
  PAID_BETA_MANUAL_QA_REQUIRED_P0_STOP_CONDITION_IDS,
  PAID_BETA_MANUAL_QA_REQUIRED_P1_STOP_CONDITION_IDS,
  PAID_BETA_MANUAL_QA_REQUIRED_P2_STOP_CONDITION_IDS,
  PAID_BETA_MANUAL_QA_REQUIRED_ROUTES,
  PAID_BETA_MANUAL_QA_REQUIRED_SCENARIO_IDS,
  PAID_BETA_MANUAL_QA_REQUIRED_STORAGE_KEYS,
  PAID_BETA_MANUAL_QA_RUNTIME_INTEGRATION_SCAN_DIRS
} from "../src/lib/paid-beta-manual-qa/fixtures";

const workspaceRoot = process.cwd();

type RequiredPaidBetaManualQaTypeSurface = {
  version: PaidBetaManualQaVersion;
  phase: PaidBetaManualQaPhase;
  scenario: PaidBetaManualQaScenario;
  step: PaidBetaManualQaStep;
  expectedResult: PaidBetaManualQaExpectedResult;
  evidence: PaidBetaManualQaEvidence;
  severity: PaidBetaManualQaSeverity;
  stopCondition: PaidBetaManualQaStopCondition;
  routeTarget: PaidBetaManualQaRouteTarget;
  storageProbe: PaidBetaManualQaStorageProbe;
  consoleProbe: PaidBetaManualQaConsoleProbe;
  deviceProfile: PaidBetaManualQaDeviceProfile;
  browserProfile: PaidBetaManualQaBrowserProfile;
  resultStatus: PaidBetaManualQaResultStatus;
  verdict: PaidBetaManualQaVerdict;
  nextStep: PaidBetaManualQaNextStep;
};

const exportedTypeSmoke: RequiredPaidBetaManualQaTypeSurface = {
  version: VISUAL_LEXICON_PAID_BETA_MANUAL_QA_VERSION,
  phase: PAID_BETA_MANUAL_QA_CONTRACT.phases[0],
  scenario: PAID_BETA_MANUAL_QA_SCENARIOS[0],
  step: PAID_BETA_MANUAL_QA_SCENARIOS[0].steps[0],
  expectedResult: PAID_BETA_MANUAL_QA_SCENARIOS[0].expectedResults[0],
  evidence: PAID_BETA_MANUAL_QA_SCENARIOS[0].evidence[0],
  severity: PAID_BETA_MANUAL_QA_SCENARIOS[0].severity,
  stopCondition: PAID_BETA_MANUAL_QA_STOP_CONDITIONS[0],
  routeTarget: PAID_BETA_MANUAL_QA_ROUTE_TARGETS[0],
  storageProbe: PAID_BETA_MANUAL_QA_STORAGE_PROBES[0],
  consoleProbe: PAID_BETA_MANUAL_QA_CONSOLE_PROBES[0],
  deviceProfile: PAID_BETA_MANUAL_QA_CONTRACT.deviceProfiles[0],
  browserProfile: PAID_BETA_MANUAL_QA_CONTRACT.browserProfiles[0],
  resultStatus: "not_run",
  verdict: PAID_BETA_MANUAL_QA_PRIVATE_VERDICT,
  nextStep: PAID_BETA_MANUAL_QA_NEXT_STEP
};

function scenarioIds() {
  return PAID_BETA_MANUAL_QA_SCENARIOS.map((scenario) => scenario.id);
}

function routePaths() {
  return PAID_BETA_MANUAL_QA_ROUTE_TARGETS.map((routeTarget) => routeTarget.path);
}

function storageKeys() {
  return PAID_BETA_MANUAL_QA_STORAGE_PROBES.map((probe) => probe.key);
}

function consoleProbeIds() {
  return PAID_BETA_MANUAL_QA_CONSOLE_PROBES.map((probe) => probe.id);
}

function stopConditionIdsBySeverity(severity: PaidBetaManualQaSeverity) {
  return PAID_BETA_MANUAL_QA_STOP_CONDITIONS
    .filter((condition) => condition.severity === severity)
    .map((condition) => condition.id);
}

function readJsonFile<TValue>(relativePath: string): TValue {
  return JSON.parse(
    readFileSync(join(workspaceRoot, relativePath), "utf8")
  ) as TValue;
}

function readRootPackageDependencies(fileName: "package.json" | "package-lock.json") {
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
  const rootPackage = fileName === "package-lock.json" ? parsed.packages?.[""] : parsed;

  return {
    ...rootPackage?.dependencies,
    ...rootPackage?.devDependencies,
    ...rootPackage?.optionalDependencies,
    ...rootPackage?.peerDependencies
  };
}

function collectFiles(relativeDir: string): string[] {
  const absoluteDir = join(workspaceRoot, relativeDir);

  if (!existsSync(absoluteDir)) {
    return [];
  }

  return readdirSync(absoluteDir).flatMap((entry) => {
    const absolutePath = join(absoluteDir, entry);
    const relativePath = join(relativeDir, entry);

    if (statSync(absolutePath).isDirectory()) {
      return collectFiles(relativePath);
    }

    return [relativePath];
  });
}

function withNoExternalSideEffects<TValue>(callback: () => TValue) {
  const originalFetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage"
  );
  const originalProcessEnvDescriptor = Object.getOwnPropertyDescriptor(process, "env");
  const guardedGlobals = [
    "__vlxAuthProviderSdk",
    "__vlxDatabaseSdk",
    "__vlxPaymentSdk",
    "__vlxLoggingProviderSdk",
    "__vlxObservabilitySdk",
    "__vlxValidationDependency",
    "__vlxWebflowCms",
    "__vlxCloudflareWorkers",
    "__vlxVercelSettings",
    "__vlxDnsProvider",
    "__vlxProductionData"
  ] as const;
  const originalGuardedDescriptors = new Map<string, PropertyDescriptor | undefined>();
  let fetchAccessed = false;
  let localStorageAccessed = false;
  let processEnvAccessed = false;
  let providerSurfaceAccessed = false;

  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    get() {
      fetchAccessed = true;
      return () => {
        throw new Error("paid beta manual QA must not call network helpers");
      };
    }
  });

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      localStorageAccessed = true;
      return undefined;
    }
  });

  if (originalProcessEnvDescriptor?.configurable) {
    Object.defineProperty(process, "env", {
      configurable: true,
      get() {
        processEnvAccessed = true;
        return originalProcessEnvDescriptor.value;
      }
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
      }
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
        providerSurfaceAccessed
      }
    };
  } finally {
    if (originalFetchDescriptor) {
      Object.defineProperty(globalThis, "fetch", originalFetchDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "fetch");
    }

    if (originalLocalStorageDescriptor) {
      Object.defineProperty(globalThis, "localStorage", originalLocalStorageDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }

    if (originalProcessEnvDescriptor?.configurable) {
      Object.defineProperty(process, "env", originalProcessEnvDescriptor);
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

test.describe("Visual Lexicon paid beta manual QA checklist contract", () => {
  test("exports the required manual QA type surface through static values", () => {
    expect(exportedTypeSmoke).toMatchObject({
      version: 1,
      phase: "setup",
      scenario: {
        id: "clean_guest_first_visit",
        route: "/",
        severity: "P0"
      },
      resultStatus: "not_run",
      verdict: "conditional_go_for_private_paid_beta_owner_run_only",
      nextStep: {
        prNumber: 72,
        docsContractsTestsOnly: true,
        realApiRouteImplementationRecommended: false
      }
    });
  });

  test("includes every required owner-run QA scenario", () => {
    expect(scenarioIds()).toEqual(PAID_BETA_MANUAL_QA_REQUIRED_SCENARIO_IDS);

    for (const scenarioId of PAID_BETA_MANUAL_QA_REQUIRED_SCENARIO_IDS) {
      expect(getPaidBetaManualQaScenario(scenarioId), scenarioId).toBeDefined();
    }
  });

  test("every scenario has route, steps, expected results, evidence, severity, and stop conditions", () => {
    const routeTargetIds = new Set(
      PAID_BETA_MANUAL_QA_ROUTE_TARGETS.map((routeTarget) => routeTarget.id)
    );
    const storageProbeKeys = new Set(storageKeys());
    const knownConsoleProbeIds = new Set(consoleProbeIds());
    const stopConditionIds = new Set(
      PAID_BETA_MANUAL_QA_STOP_CONDITIONS.map((condition) => condition.id)
    );

    for (const scenario of PAID_BETA_MANUAL_QA_SCENARIOS) {
      const expectedResultIds = new Set(
        scenario.expectedResults.map((result) => result.id)
      );
      const evidenceIds = new Set(scenario.evidence.map((evidence) => evidence.id));

      expect(scenario.route, scenario.id).toBeTruthy();
      expect(routeTargetIds.has(scenario.routeTargetId), scenario.id).toBe(true);
      expect(["P0", "P1", "P2"]).toContain(scenario.severity);
      expect(scenario.steps.length, scenario.id).toBeGreaterThan(0);
      expect(scenario.expectedResults.length, scenario.id).toBeGreaterThan(0);
      expect(scenario.evidence.length, scenario.id).toBeGreaterThan(0);
      expect(scenario.stopConditionIds.length, scenario.id).toBeGreaterThan(0);

      for (const step of scenario.steps) {
        expect(step.order, scenario.id).toBeGreaterThan(0);
        expect(step.action, scenario.id).toBeTruthy();
        expect(step.expectedResultIds.length, scenario.id).toBeGreaterThan(0);
        expect(step.evidenceIds.length, scenario.id).toBeGreaterThan(0);

        for (const expectedResultId of step.expectedResultIds) {
          expect(expectedResultIds.has(expectedResultId), scenario.id).toBe(true);
        }

        for (const evidenceId of step.evidenceIds) {
          expect(evidenceIds.has(evidenceId), scenario.id).toBe(true);
        }
      }

      for (const result of scenario.expectedResults) {
        expect(result.text, scenario.id).toBeTruthy();
        expect(result.mustRecordEvidence, scenario.id).toBe(true);

        for (const stopConditionId of result.linkedStopConditionIds) {
          expect(stopConditionIds.has(stopConditionId), scenario.id).toBe(true);
        }
      }

      for (const evidence of scenario.evidence) {
        expect(evidence.label, scenario.id).toBeTruthy();
        expect(evidence.format, scenario.id).toBeTruthy();
        expect(evidence.required, scenario.id).toBe(true);
      }

      for (const stopConditionId of scenario.stopConditionIds) {
        expect(stopConditionIds.has(stopConditionId), scenario.id).toBe(true);
      }

      for (const storageKey of scenario.storageProbeKeys) {
        expect(storageProbeKeys.has(storageKey), scenario.id).toBe(true);
      }

      for (const consoleProbeId of scenario.consoleProbeIds) {
        expect(knownConsoleProbeIds.has(consoleProbeId), scenario.id).toBe(true);
      }
    }
  });

  test("route inventory includes every required manual target and no production requirements", () => {
    expect(routePaths()).toEqual(
      expect.arrayContaining([...PAID_BETA_MANUAL_QA_REQUIRED_ROUTES])
    );

    for (const route of PAID_BETA_MANUAL_QA_REQUIRED_ROUTES) {
      const item = getPaidBetaManualQaRouteTarget(route);

      expect(item, route).toBeDefined();
      expect(item).toMatchObject({
        manualOnly: true,
        requiresAuth: false,
        requiresPayment: false,
        requiresProductionData: false
      });
    }
  });

  test("storage probes include required VLX keys and grant no entitlement", () => {
    expect(storageKeys()).toEqual(
      expect.arrayContaining([...PAID_BETA_MANUAL_QA_REQUIRED_STORAGE_KEYS])
    );

    for (const key of PAID_BETA_MANUAL_QA_REQUIRED_STORAGE_KEYS) {
      const probe = getPaidBetaManualQaStorageProbe(key);

      expect(probe, key).toBeDefined();
      expect(probe).toMatchObject({
        productionSourceOfTruth: false,
        grantsPaidEntitlement: false
      });
      expect(probe?.mustNotContain).toEqual(
        expect.arrayContaining([
          "secrets",
          "provider tokens",
          "payment data",
          "raw private payloads"
        ])
      );
    }
  });

  test("console probe snippets are inert strings and cover required manual checks", () => {
    expect(consoleProbeIds()).toEqual(
      PAID_BETA_MANUAL_QA_REQUIRED_CONSOLE_PROBE_IDS
    );

    for (const probeId of PAID_BETA_MANUAL_QA_REQUIRED_CONSOLE_PROBE_IDS) {
      const probe = getPaidBetaManualQaConsoleProbe(probeId);

      expect(probe, probeId).toBeDefined();
      expect(typeof probe?.snippet, probeId).toBe("string");
      expect(probe?.snippet, probeId).toContain("localStorage");
      expect(probe).toMatchObject({
        safeToPasteInDevtools: true,
        executesInModule: false
      });

      for (const value of Object.values(probe ?? {})) {
        expect(typeof value, probeId).not.toBe("function");
      }
    }
  });

  test("P0 stop conditions include save review state fake mastery entitlement payment privacy mobile accessibility failures", () => {
    expect(stopConditionIdsBySeverity("P0")).toEqual(
      expect.arrayContaining([...PAID_BETA_MANUAL_QA_REQUIRED_P0_STOP_CONDITION_IDS])
    );

    for (const conditionId of PAID_BETA_MANUAL_QA_REQUIRED_P0_STOP_CONDITION_IDS) {
      expect(getPaidBetaManualQaStopCondition(conditionId), conditionId).toMatchObject({
        severity: "P0",
        blocksPrivateBeta: true,
        blocksPublicBeta: true
      });
    }

    expect(getPaidBetaManualQaStopCondition("save_missing_review_item")?.title).toContain(
      "Save does not create review item"
    );
    expect(
      getPaidBetaManualQaStopCondition("review_answer_missing_event")?.title
    ).toContain("Review answer does not write review event");
    expect(
      getPaidBetaManualQaStopCondition("review_answer_missing_state_update")?.title
    ).toContain("Review answer does not update review state");
    expect(getPaidBetaManualQaStopCondition("save_only_word_mastered")?.title).toContain(
      "Save-only word appears Mastered"
    );
    expect(
      getPaidBetaManualQaStopCondition("upgrade_interest_grants_paid_entitlement")
        ?.title
    ).toContain("Upgrade interest grants paid entitlement");
    expect(
      getPaidBetaManualQaStopCondition("pricing_implies_real_checkout")?.title
    ).toContain("Pricing implies real checkout");
    expect(
      getPaidBetaManualQaStopCondition("local_storage_private_or_secret_payload")
        ?.title
    ).toContain("LocalStorage stores secrets");
    expect(getPaidBetaManualQaStopCondition("mobile_review_unusable")?.title).toContain(
      "Mobile review flow is unusable"
    );
    expect(
      getPaidBetaManualQaStopCondition("keyboard_navigation_blocks_core_flow")?.title
    ).toContain("Accessibility keyboard navigation blocks core save/review flow");
  });

  test("P1 and P2 findings match the manual QA blocker model", () => {
    expect(stopConditionIdsBySeverity("P1")).toEqual(
      expect.arrayContaining([...PAID_BETA_MANUAL_QA_REQUIRED_P1_STOP_CONDITION_IDS])
    );
    expect(stopConditionIdsBySeverity("P2")).toEqual(
      expect.arrayContaining([...PAID_BETA_MANUAL_QA_REQUIRED_P2_STOP_CONDITION_IDS])
    );

    for (const conditionId of PAID_BETA_MANUAL_QA_REQUIRED_P1_STOP_CONDITION_IDS) {
      expect(getPaidBetaManualQaStopCondition(conditionId), conditionId).toMatchObject({
        severity: "P1",
        blocksPrivateBeta: false,
        blocksPublicBeta: true
      });
    }

    for (const conditionId of PAID_BETA_MANUAL_QA_REQUIRED_P2_STOP_CONDITION_IDS) {
      expect(getPaidBetaManualQaStopCondition(conditionId), conditionId).toMatchObject({
        severity: "P2",
        blocksPrivateBeta: false,
        blocksPublicBeta: false
      });
    }
  });

  test("private beta stays conditional owner-run only and public paid beta remains No-Go", () => {
    expect(PAID_BETA_MANUAL_QA_PRIVATE_VERDICT).toBe(
      "conditional_go_for_private_paid_beta_owner_run_only"
    );
    expect(PAID_BETA_MANUAL_QA_PUBLIC_VERDICT).toBe(
      "no_go_for_public_paid_beta"
    );
    expect(PAID_BETA_MANUAL_QA_CONTRACT).toMatchObject({
      privateBetaVerdict: "conditional_go_for_private_paid_beta_owner_run_only",
      publicBetaVerdict: "no_go_for_public_paid_beta"
    });
    expect(PAID_BETA_MANUAL_QA_CONTRACT.privateBetaProtocol).toContain(
      "owner-run"
    );
    expect(PAID_BETA_MANUAL_QA_CONTRACT.publicBetaWarning).toContain(
      "Public paid beta remains No-Go"
    );
  });

  test("next PR remains Product UI readiness or execution report template, not API implementation", () => {
    expect(PAID_BETA_MANUAL_QA_NEXT_STEP).toEqual({
      prNumber: 72,
      title: "Product/UI readiness audit or Manual QA execution report template",
      docsContractsTestsOnly: true,
      realApiRouteImplementationRecommended: false,
      paymentImplementationRecommended: false,
      accountSyncImplementationRecommended: false,
      reason:
        "The next PR should add a Product/UI readiness audit or an owner-run manual QA execution report template, not real API route implementation."
    });
  });

  test("only #187 read-only routes exist; mutating, payment, and schema paths stay absent", () => {
    for (const relativePath of PAID_BETA_MANUAL_QA_FORBIDDEN_ACTUAL_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }

    const appRouteHandlers = collectFiles("src/app").filter(
      (relativePath) => basename(relativePath) === "route.ts"
    );

    expect(appRouteHandlers.map((path) => path.split("\\").join("/"))).toEqual([
      "src/app/api/account/sync/digest/route.ts",
      "src/app/api/account/sync/preview/route.ts",
      "src/app/api/me/entitlements/route.ts",
      "src/app/auth/confirm/route.ts"
    ]);
  });

  test("no runtime route or component integration imports the manual QA contract", () => {
    for (const scanDir of PAID_BETA_MANUAL_QA_RUNTIME_INTEGRATION_SCAN_DIRS) {
      for (const relativePath of collectFiles(scanDir)) {
        if (!/\.(ts|tsx)$/.test(relativePath)) {
          continue;
        }

        const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

        expect(fileText, relativePath).not.toContain("paid-beta-manual-qa");
        expect(fileText, relativePath).not.toContain("PAID_BETA_MANUAL_QA");
      }
    }
  });

  test("no forbidden provider SDKs, payment SDKs, DB SDKs, validation deps, or logging SDKs are added", () => {
    for (const fileName of ["package.json", "package-lock.json"] as const) {
      const rootDependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of PAID_BETA_MANUAL_QA_FORBIDDEN_DIRECT_DEPENDENCIES) {
        if (dependencyName === "zod") {
          continue;
        }

        expect(rootDependencies, `${fileName} should not add ${dependencyName}`).not.toHaveProperty(
          dependencyName
        );
      }
    }
  });

  test("manual QA module files contain no route handlers or forbidden integrations", () => {
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\s*\(/,
      /\bprocess\.env\b/,
      /from ["']zod/,
      /from ["']yup/,
      /from ["']valibot/,
      /from ["']ajv/,
      /from ["']@supabase\//,
      /from ["']@neondatabase\//,
      /from ["']@vercel\/postgres/,
      /from ["']firebase/,
      /from ["']@firebase\//,
      /from ["']prisma/,
      /from ["']@prisma\//,
      /from ["']drizzle/,
      /from ["']drizzle-orm/,
      /from ["']pg/,
      /from ["']postgres/,
      /from ["']mysql/,
      /from ["']sqlite/,
      /from ["']@cloudflare\/d1/,
      /from ["']@clerk\//,
      /from ["']@auth\//,
      /from ["']next-auth/,
      /from ["']better-auth/,
      /from ["']stripe/,
      /from ["']paddle/,
      /from ["']@sentry\//,
      /from ["']posthog/,
      /from ["']@datadog\//,
      /from ["']newrelic/,
      /from ["']winston/,
      /from ["']pino/,
      /\bcreateRouteHandler\b/
    ];

    for (const relativePath of PAID_BETA_MANUAL_QA_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test("manual QA contract is pure static data and does not access runtime surfaces", () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      version: PAID_BETA_MANUAL_QA_CONTRACT.visualLexiconPaidBetaManualQaVersion,
      privateVerdict: PAID_BETA_MANUAL_QA_CONTRACT.privateBetaVerdict,
      publicVerdict: PAID_BETA_MANUAL_QA_CONTRACT.publicBetaVerdict,
      scenarioCount: PAID_BETA_MANUAL_QA_CONTRACT.scenarios.length,
      routeCount: PAID_BETA_MANUAL_QA_CONTRACT.routeTargets.length,
      consoleProbeCount: PAID_BETA_MANUAL_QA_CONTRACT.consoleProbes.length,
      consoleSnippetsExecuteInModule:
        PAID_BETA_MANUAL_QA_CONTRACT.consoleProbes.some(
          (probe) => probe.executesInModule
        )
    }));

    expect(value).toEqual({
      version: 1,
      privateVerdict: "conditional_go_for_private_paid_beta_owner_run_only",
      publicVerdict: "no_go_for_public_paid_beta",
      scenarioCount: PAID_BETA_MANUAL_QA_REQUIRED_SCENARIO_IDS.length,
      routeCount: PAID_BETA_MANUAL_QA_ROUTE_TARGETS.length,
      consoleProbeCount: PAID_BETA_MANUAL_QA_REQUIRED_CONSOLE_PROBE_IDS.length,
      consoleSnippetsExecuteInModule: false
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false
    });
  });

  test("README and paid beta manual QA docs are linked and explicit", () => {
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(
      join(workspaceRoot, "docs", "PAID_BETA_MANUAL_QA_CHECKLIST.md"),
      "utf8"
    );
    const moduleReadme = readFileSync(
      join(workspaceRoot, "src", "lib", "paid-beta-manual-qa", "README.md"),
      "utf8"
    );

    expect(PAID_BETA_MANUAL_QA_DOC_FILES).toEqual([
      "docs/PAID_BETA_MANUAL_QA_CHECKLIST.md",
      "README.md"
    ]);
    expect(readme).toContain("docs/PAID_BETA_MANUAL_QA_CHECKLIST.md");
    expect(doc).toContain("Relationship To #70");
    expect(doc).toContain("Private paid beta can only be conditional");
    expect(doc).toContain("Public paid beta remains **No-Go**");
    expect(doc).toContain("Save does not create review item.");
    expect(doc).toContain("Upgrade interest grants paid entitlement.");
    expect(doc).toContain(
      "#72 Product/UI readiness audit or Manual QA execution report template"
    );
    expect(doc).toContain("Do not recommend real API route implementation yet.");
    expect(moduleReadme).toContain("strings only");
    expect(moduleReadme).toContain("does not execute them");
  });
});
