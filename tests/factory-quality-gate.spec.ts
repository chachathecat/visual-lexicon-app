import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import {
  FACTORY_QUALITY_GATE_VERSION,
  evaluateFactoryQualityGate,
  type FactoryQualityGateCheckName,
  type FactoryQualityGateInput,
  type FactoryQualityGateResult,
  type FactoryQualityGateVersion
} from "../src/lib/factory/quality-gate";

type FactoryQualityGateTypeSurface = {
  version: FactoryQualityGateVersion;
  result: FactoryQualityGateResult;
};

const TARGETED_TEST_EVIDENCE =
  "npm.cmd run test -- tests/factory-quality-gate.spec.ts --workers=1 passed";
const FULL_TEST_EVIDENCE = "npm.cmd run test -- --workers=1 passed";

const typeSmoke: FactoryQualityGateTypeSurface = {
  version: FACTORY_QUALITY_GATE_VERSION,
  result: evaluateFactoryQualityGate({
    taskId: "TYPE-SMOKE",
    risk: "low",
    taskSurface: "tests_only",
    changedFiles: ["tests/factory-quality-gate.spec.ts"],
    reportedChecks: [passedCheck("targeted_tests")]
  })
};

function gate(overrides: Partial<FactoryQualityGateInput> = {}) {
  return evaluateFactoryQualityGate({
    taskId: "FCT-020",
    risk: "medium",
    taskSurface: "app_server_logic",
    changedFiles: ["src/lib/srs/engine.ts"],
    reportedChecks: [],
    ...overrides
  });
}

function passedCheck(
  name: FactoryQualityGateCheckName | string,
  evidence = evidenceForCheck(name)
) {
  return {
    name,
    status: "passed" as const,
    evidence
  };
}

function failedCheck(
  name: FactoryQualityGateCheckName | string,
  evidence = `${name} failed`
) {
  return {
    name,
    status: "failed" as const,
    evidence
  };
}

function skippedCheck(name: FactoryQualityGateCheckName | string) {
  return {
    name,
    status: "skipped" as const,
    evidence: `${name} skipped`
  };
}

function unknownCheck(name: FactoryQualityGateCheckName | string) {
  return {
    name,
    status: "unknown" as const,
    evidence: `${name} unknown`
  };
}

function mediumRequiredChecks() {
  return [
    passedCheck("typecheck"),
    passedCheck("lint"),
    passedCheck("build"),
    passedCheck("targeted_tests")
  ];
}

function highRequiredChecks() {
  return [
    passedCheck("typecheck"),
    passedCheck("lint"),
    passedCheck("build"),
    passedCheck("full_test_suite"),
    passedCheck("targeted_tests")
  ];
}

function ownerApproval() {
  return {
    approved: true,
    evidence: "owner approval for high-risk FCT-020 draft PR"
  };
}

function evidenceForCheck(name: FactoryQualityGateCheckName | string) {
  const evidenceByName: Record<string, string> = {
    typecheck: "npm.cmd run typecheck passed",
    lint: "npm.cmd run lint passed",
    build: "npm.cmd run build passed",
    full_test_suite: FULL_TEST_EVIDENCE,
    targeted_tests: TARGETED_TEST_EVIDENCE,
    roadmap_json_parse:
      "node -e JSON.parse(readFileSync(roadmap)) passed",
    roadmap_structural_check:
      "roadmap structural validation passed",
    owner_approval: "owner approval evidence present"
  };

  return evidenceByName[name] ?? `${name} passed`;
}

function readRoadmapTask(taskId: string) {
  const roadmapPath = join(
    process.cwd(),
    "docs",
    "roadmap",
    "vlx-autonomous-factory-roadmap.v1.json"
  );
  const roadmap = JSON.parse(readFileSync(roadmapPath, "utf8")) as {
    tasks: Array<{
      id: string;
      status: string;
      evidence?: string[];
      depends_on?: string[];
    }>;
  };
  const task = roadmap.tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    throw new Error(`Missing roadmap task ${taskId}`);
  }

  return task;
}

test.describe("factory quality gate", () => {
  test("exports the required versioned output contract", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      result: {
        version: 1,
        status: "pass",
        requiredChecks: ["targeted_tests"],
        missingChecks: [],
        failedChecks: [],
        requiresOwnerApproval: false,
        releaseEvidenceEligible: true
      }
    });
  });

  test("empty changedFiles fails closed", () => {
    const result = gate({
      risk: "low",
      taskSurface: "docs_only",
      changedFiles: [],
      reportedChecks: []
    });

    expect(result).toMatchObject({
      status: "fail",
      requiredChecks: [
        "typecheck",
        "lint",
        "build",
        "full_test_suite",
        "targeted_tests",
        "owner_approval"
      ],
      missingChecks: [
        "typecheck",
        "lint",
        "build",
        "full_test_suite",
        "targeted_tests",
        "owner_approval"
      ],
      requiresOwnerApproval: true,
      releaseEvidenceEligible: false
    });
    expect(result.reasons).toEqual([
      "empty_change_set",
      "risk:low",
      "task_surface:docs_only",
      "required_checks:typecheck,lint,build,full_test_suite,targeted_tests,owner_approval",
      "missing_required_check:typecheck",
      "missing_required_check:lint",
      "missing_required_check:build",
      "missing_required_check:full_test_suite",
      "missing_required_check:targeted_tests",
      "owner_approval_required",
      "missing_owner_approval",
      "auto_merge_out_of_scope_v1"
    ]);
  });

  test("unknown risk fails closed", () => {
    const result = gate({
      risk: "critical",
      taskSurface: "app_server_logic",
      reportedChecks: mediumRequiredChecks()
    });

    expect(result.status).toBe("fail");
    expect(result.requiredChecks).toEqual([
      "typecheck",
      "lint",
      "build",
      "full_test_suite",
      "targeted_tests",
      "owner_approval"
    ]);
    expect(result.missingChecks).toEqual([
      "full_test_suite",
      "owner_approval"
    ]);
    expect(result.reasons).toContain("unknown_risk:critical");
    expect(result.requiresOwnerApproval).toBe(true);
  });

  test("unknown task surface fails closed", () => {
    const result = gate({
      risk: "low",
      taskSurface: "mystery surface",
      reportedChecks: [passedCheck("targeted_tests")]
    });

    expect(result.status).toBe("fail");
    expect(result.reasons).toContain(
      "unknown_task_surface:mystery_surface"
    );
    expect(result.requiresOwnerApproval).toBe(true);
    expect(result.missingChecks).toEqual([
      "typecheck",
      "lint",
      "build",
      "full_test_suite",
      "owner_approval"
    ]);
  });

  test("missing required check fails", () => {
    const result = gate({
      reportedChecks: [
        passedCheck("typecheck"),
        passedCheck("lint"),
        passedCheck("targeted_tests")
      ]
    });

    expect(result.status).toBe("fail");
    expect(result.requiredChecks).toEqual([
      "typecheck",
      "lint",
      "build",
      "targeted_tests"
    ]);
    expect(result.missingChecks).toEqual(["build"]);
    expect(result.failedChecks).toEqual([]);
    expect(result.reasons).toContain("missing_required_check:build");
  });

  test("failed required check fails", () => {
    const result = gate({
      reportedChecks: [
        failedCheck("typecheck"),
        passedCheck("lint"),
        passedCheck("build"),
        passedCheck("targeted_tests")
      ]
    });

    expect(result.status).toBe("fail");
    expect(result.failedChecks).toEqual(["typecheck"]);
    expect(result.missingChecks).toEqual([]);
    expect(result.reasons).toContain("failed_required_check:typecheck");
  });

  test("skipped required check fails", () => {
    const result = gate({
      reportedChecks: [
        passedCheck("typecheck"),
        skippedCheck("lint"),
        passedCheck("build"),
        passedCheck("targeted_tests")
      ]
    });

    expect(result.status).toBe("fail");
    expect(result.missingChecks).toEqual(["lint"]);
    expect(result.failedChecks).toEqual([]);
    expect(result.reasons).toContain("skipped_required_check:lint");
    expect(result.rejectedEvidence).toContain("check:lint:skipped");
  });

  test("unknown required check status fails", () => {
    const result = gate({
      reportedChecks: [
        passedCheck("typecheck"),
        passedCheck("lint"),
        unknownCheck("build"),
        passedCheck("targeted_tests")
      ]
    });

    expect(result.status).toBe("fail");
    expect(result.missingChecks).toEqual(["build"]);
    expect(result.reasons).toContain("unknown_required_check_status:build");
    expect(result.rejectedEvidence).toContain("check:build:unknown_status");
  });

  test("no-op workflow success is rejected", () => {
    const result = gate({
      reportedChecks: mediumRequiredChecks(),
      reportedWorkflowRuns: [
        {
          name: "codex-quality-gate",
          status: "success",
          isNoOp: true,
          evidence: "green manual workflow"
        }
      ]
    });

    expect(result.status).toBe("pass");
    expect(result.rejectedEvidence).toContain(
      "workflow:codex_quality_gate:no_op"
    );
    expect(result.acceptedEvidence).not.toContain(
      "workflow:codex_quality_gate:green manual workflow"
    );
    expect(result.reasons).toContain(
      "rejected_no_op_workflow:codex_quality_gate"
    );
  });

  test("no-op workflow success alone fails", () => {
    const result = gate({
      reportedChecks: [],
      reportedWorkflowRuns: [
        {
          name: "risk-gate",
          status: "success",
          isNoOp: true,
          evidence: "green manual workflow"
        }
      ]
    });

    expect(result.status).toBe("fail");
    expect(result.missingChecks).toEqual([
      "typecheck",
      "lint",
      "build",
      "targeted_tests"
    ]);
    expect(result.rejectedEvidence).toContain("workflow:risk_gate:no_op");
  });

  test("low docs-only roadmap sync requires roadmap JSON and structural checks", () => {
    const result = gate({
      risk: "low",
      taskSurface: "docs_only",
      changedFiles: [
        "docs/roadmap/vlx-autonomous-factory-roadmap.v1.json"
      ],
      reportedChecks: [
        passedCheck("roadmap_json_parse"),
        passedCheck("roadmap_structural_check")
      ]
    });

    expect(result).toMatchObject({
      status: "pass",
      requiredChecks: [
        "roadmap_json_parse",
        "roadmap_structural_check"
      ],
      missingChecks: [],
      failedChecks: [],
      requiresOwnerApproval: false
    });
  });

  test("low tests-only requires targeted tests", () => {
    const missingResult = gate({
      risk: "low",
      taskSurface: "tests_only",
      changedFiles: ["tests/factory-quality-gate.spec.ts"],
      reportedChecks: []
    });
    const passingResult = gate({
      risk: "low",
      taskSurface: "tests_only",
      changedFiles: ["tests/factory-quality-gate.spec.ts"],
      reportedChecks: [passedCheck("targeted_tests")]
    });

    expect(missingResult.status).toBe("fail");
    expect(missingResult.requiredChecks).toEqual(["targeted_tests"]);
    expect(missingResult.missingChecks).toEqual(["targeted_tests"]);
    expect(passingResult.status).toBe("pass");
  });

  test("low docs-only and tests-only behavior remains unchanged", () => {
    const docsResult = gate({
      risk: "low",
      taskSurface: "docs_only",
      changedFiles: [
        "docs/roadmap/vlx-autonomous-factory-roadmap.v1.json"
      ],
      reportedChecks: [
        passedCheck("roadmap_json_parse"),
        passedCheck("roadmap_structural_check")
      ]
    });
    const testsResult = gate({
      risk: "low",
      taskSurface: "tests_only",
      changedFiles: ["tests/factory-quality-gate.spec.ts"],
      reportedChecks: [passedCheck("targeted_tests")]
    });

    expect(docsResult.requiredChecks).toEqual([
      "roadmap_json_parse",
      "roadmap_structural_check"
    ]);
    expect(docsResult.status).toBe("pass");
    expect(testsResult.requiredChecks).toEqual(["targeted_tests"]);
    expect(testsResult.status).toBe("pass");
  });

  test("low non-behavioral runtime refactor requires typecheck lint build and targeted tests", () => {
    const result = gate({
      risk: "low",
      taskSurface: "non_behavioral_refactor",
      changedFiles: ["src/lib/srs/selectors.ts"],
      reportedChecks: []
    });

    expect(result.status).toBe("fail");
    expect(result.requiredChecks).toEqual([
      "typecheck",
      "lint",
      "build",
      "targeted_tests"
    ]);
    expect(result.missingChecks).toEqual([
      "typecheck",
      "lint",
      "build",
      "targeted_tests"
    ]);
    expect(result.requiresOwnerApproval).toBe(false);
  });

  test("low non-behavioral runtime refactor fails when typecheck lint or build is missing", () => {
    const cases = [
      {
        missing: "typecheck",
        checks: [
          passedCheck("lint"),
          passedCheck("build"),
          passedCheck("targeted_tests")
        ]
      },
      {
        missing: "lint",
        checks: [
          passedCheck("typecheck"),
          passedCheck("build"),
          passedCheck("targeted_tests")
        ]
      },
      {
        missing: "build",
        checks: [
          passedCheck("typecheck"),
          passedCheck("lint"),
          passedCheck("targeted_tests")
        ]
      }
    ] as const;

    for (const { missing, checks } of cases) {
      const result = gate({
        risk: "low",
        taskSurface: "non_behavioral_refactor",
        changedFiles: ["src/components/views/dashboard-view.tsx"],
        reportedChecks: checks
      });

      expect(result.status, missing).toBe("fail");
      expect(result.missingChecks, missing).toEqual([missing]);
      expect(result.reasons, missing).toContain(
        `missing_required_check:${missing}`
      );
    }
  });

  test("low non-behavioral runtime refactor passes with all four explicit checks", () => {
    const result = gate({
      risk: "low",
      taskSurface: "non_behavioral_refactor",
      changedFiles: ["src/lib/srs/selectors.ts"],
      reportedChecks: mediumRequiredChecks()
    });

    expect(result).toMatchObject({
      status: "pass",
      requiredChecks: [
        "typecheck",
        "lint",
        "build",
        "targeted_tests"
      ],
      missingChecks: [],
      failedChecks: [],
      requiresOwnerApproval: false
    });
  });

  test("medium app logic requires typecheck lint build and targeted tests", () => {
    const result = gate({
      risk: "medium",
      taskSurface: "app_server_logic",
      reportedChecks: mediumRequiredChecks()
    });

    expect(result).toMatchObject({
      status: "pass",
      requiredChecks: [
        "typecheck",
        "lint",
        "build",
        "targeted_tests"
      ],
      missingChecks: [],
      failedChecks: [],
      requiresOwnerApproval: false
    });
  });

  test("high risk requires typecheck lint build full suite targeted tests and owner approval", () => {
    const result = gate({
      risk: "high",
      taskSurface: "factory_control_plane",
      changedFiles: ["src/lib/factory/quality-gate.ts"],
      reportedChecks: []
    });

    expect(result.status).toBe("fail");
    expect(result.requiredChecks).toEqual([
      "typecheck",
      "lint",
      "build",
      "full_test_suite",
      "targeted_tests",
      "owner_approval"
    ]);
    expect(result.missingChecks).toEqual([
      "typecheck",
      "lint",
      "build",
      "full_test_suite",
      "targeted_tests",
      "owner_approval"
    ]);
    expect(result.requiresOwnerApproval).toBe(true);
    expect(result.releaseEvidenceEligible).toBe(false);
  });

  test("high risk without owner approval fails", () => {
    const result = gate({
      risk: "high",
      taskSurface: "factory_control_plane",
      changedFiles: ["src/lib/factory/quality-gate.ts"],
      reportedChecks: highRequiredChecks()
    });

    expect(result.status).toBe("fail");
    expect(result.missingChecks).toEqual(["owner_approval"]);
    expect(result.failedChecks).toEqual([]);
    expect(result.reasons).toContain("owner_approval_required");
    expect(result.reasons).toContain("missing_owner_approval");
    expect(result.releaseEvidenceEligible).toBe(false);
  });

  test("high risk with required checks and owner approval passes", () => {
    const result = gate({
      risk: "high",
      taskSurface: "factory_control_plane",
      changedFiles: ["src/lib/factory/quality-gate.ts"],
      reportedChecks: highRequiredChecks(),
      ownerApproval: ownerApproval()
    });

    expect(result).toMatchObject({
      status: "pass",
      missingChecks: [],
      failedChecks: [],
      requiresOwnerApproval: true,
      releaseEvidenceEligible: true
    });
    expect(result.acceptedEvidence).toContain(
      "owner_approval:owner approval for high-risk FCT-020 draft PR"
    );
  });

  test("acceptedEvidence includes only real explicit checks", () => {
    const result = gate({
      reportedChecks: [
        ...mediumRequiredChecks(),
        passedCheck("codex-quality-gate", "manual no-op workflow"),
        passedCheck("unit tests", "uncanonical check name"),
        { name: "full_test_suite", status: "passed" as const }
      ],
      reportedWorkflowRuns: [
        {
          name: "codex-quality-gate",
          status: "success",
          isNoOp: true,
          evidence: "manual no-op"
        }
      ]
    });

    expect(result.acceptedEvidence).toEqual([
      "check:build:npm.cmd run build passed",
      "check:lint:npm.cmd run lint passed",
      `check:targeted_tests:${TARGETED_TEST_EVIDENCE}`,
      "check:typecheck:npm.cmd run typecheck passed"
    ]);
    expect(result.rejectedEvidence).toEqual(
      expect.arrayContaining([
        "check:codex_quality_gate:no_op_placeholder",
        "check:unit_tests:unknown_check",
        "check:full_test_suite:missing_evidence",
        "workflow:codex_quality_gate:no_op"
      ])
    );
  });

  test("rejectedEvidence includes no-op workflow names", () => {
    const result = gate({
      reportedChecks: mediumRequiredChecks(),
      reportedWorkflowRuns: [
        { name: "ci-repair", status: "success", evidence: "green" },
        { name: "codex-quality-gate", status: "success", evidence: "green" },
        { name: "risk-gate", status: "success", evidence: "green" },
        {
          name: "limited-auto-merge",
          status: "success",
          evidence: "green"
        }
      ],
      releaseEvidence: [
        {
          kind: "workflow",
          name: "limited-auto-merge",
          status: "success",
          evidence: "green"
        }
      ]
    });

    expect(result.rejectedEvidence).toEqual(
      expect.arrayContaining([
        "workflow:ci_repair:no_op",
        "workflow:codex_quality_gate:no_op",
        "workflow:risk_gate:no_op",
        "workflow:limited_auto_merge:no_op",
        "release:workflow:limited_auto_merge:no_op"
      ])
    );
  });

  test("output order is deterministic", () => {
    const first = gate({
      risk: "medium",
      taskSurface: "app_server_logic",
      changedFiles: [
        "src/lib/srs/engine.ts",
        "src/lib/srs/engine.ts",
        ".\\tests\\factory-quality-gate.spec.ts"
      ],
      reportedChecks: [
        passedCheck("targeted_tests"),
        passedCheck("build"),
        passedCheck("lint"),
        passedCheck("typecheck")
      ],
      reportedWorkflowRuns: [
        { name: "risk-gate", status: "success", evidence: "green" },
        {
          name: "real-ci",
          status: "success",
          evidence: "run 123"
        }
      ]
    });
    const second = gate({
      risk: "medium",
      taskSurface: "app_server_logic",
      changedFiles: [
        "./src/lib/srs/engine.ts",
        "tests/factory-quality-gate.spec.ts"
      ],
      reportedChecks: [
        passedCheck("typecheck"),
        passedCheck("lint"),
        passedCheck("build"),
        passedCheck("targeted_tests")
      ],
      reportedWorkflowRuns: [
        {
          name: "real ci",
          status: "success",
          evidence: "run 123"
        },
        { name: "risk gate", status: "success", evidence: "green" }
      ]
    });

    expect(first).toEqual(second);
  });

  test("FCT-020 self-evaluation is high control-plane", () => {
    const result = gate({
      taskId: "FCT-020",
      risk: "high",
      taskSurface: "factory_control_plane",
      changedFiles: [
        "src/lib/factory/quality-gate.ts",
        "tests/factory-quality-gate.spec.ts"
      ],
      reportedChecks: highRequiredChecks()
    });

    expect(result.status).toBe("fail");
    expect(result.requiresOwnerApproval).toBe(true);
    expect(result.requiredChecks).toEqual([
      "typecheck",
      "lint",
      "build",
      "full_test_suite",
      "targeted_tests",
      "owner_approval"
    ]);
    expect(result.missingChecks).toEqual(["owner_approval"]);
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "risk:high",
        "task_surface:factory_control_plane",
        "owner_approval_required",
        "missing_owner_approval"
      ])
    );
  });

  test("FCT-020 verification sync unblocks FCT-030 without implementing later tasks", () => {
    const fct020 = readRoadmapTask("FCT-020");
    const fct030 = readRoadmapTask("FCT-030");

    expect(fct020.status).toBe("verified");
    expect(fct020.evidence).toEqual(
      expect.arrayContaining([
        "PR #126",
        "merge commit 4b3d7526448371539ca5c0694dfc2622019402c2"
      ])
    );
    expect(fct030.status).toBe("ready");
    expect(fct030.depends_on).toEqual(
      expect.arrayContaining(["FCT-010", "FCT-020"])
    );
    expect(readRoadmapTask("FCT-040").status).toBe("blocked_dependency");
  });
});
