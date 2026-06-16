import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import { basename, join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  PRIVATE_BETA_INVITE_PACKET,
  PRIVATE_BETA_INVITE_SAFETY_POLICY,
  PRIVATE_BETA_INVITE_VERDICT,
  PUBLIC_BETA_VERDICT,
  VISUAL_LEXICON_PRIVATE_BETA_INVITE_PACKET_VERSION,
  getDmInvitationTemplate,
  getFollowUpTemplates,
  getInvitationEmailTemplate,
  getIssueReportingInstructions,
  getKnownLimitations,
  getNextInvitePacketPRSequence,
  getOnboardingInstructions,
  getParticipantConsentChecklist,
  getPrivateBetaInvitePacket,
  getPrivateBetaInviteVerdict,
  getPublicBetaVerdict,
  type PrivateBetaConsentChecklistItem,
  type PrivateBetaDisclosure,
  type PrivateBetaInviteNextPr,
  type PrivateBetaInvitePacket,
  type PrivateBetaInvitePacketVersion,
  type PrivateBetaInviteRequirement,
  type PrivateBetaInviteSeverity,
  type PrivateBetaInviteTemplate,
  type PrivateBetaInviteVerdict,
  type PrivateBetaIssueReportingInstructions,
  type PrivateBetaKnownLimitation,
  type PrivateBetaSupportRefundPrivacyRequirement
} from "../src/lib/private-beta-invite-packet/private-beta-invite-packet";
import {
  PRIVATE_BETA_DOC_FILES,
  PRIVATE_BETA_FORBIDDEN_ACTUAL_PATHS,
  PRIVATE_BETA_FORBIDDEN_DIRECT_DEPENDENCIES,
  PRIVATE_BETA_MODULE_FILES,
  PRIVATE_BETA_REQUIRED_CONSENT_IDS,
  PRIVATE_BETA_REQUIRED_DOC_SECTIONS,
  PRIVATE_BETA_REQUIRED_ELIGIBILITY_IDS,
  PRIVATE_BETA_REQUIRED_EXCLUSION_IDS,
  PRIVATE_BETA_REQUIRED_ISSUE_FIELDS,
  PRIVATE_BETA_REQUIRED_LIMITATION_IDS,
  PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS,
  PRIVATE_BETA_REQUIRED_NEXT_PR_TITLES,
  PRIVATE_BETA_REQUIRED_ONBOARDING_IDS,
  PRIVATE_BETA_REQUIRED_SAFETY_FIELDS,
  PRIVATE_BETA_REQUIRED_SUPPORT_REFUND_PRIVACY_IDS,
  PRIVATE_BETA_RUNTIME_SCAN_DIRS,
  PRIVATE_BETA_INVITE_SEVERITIES
} from "../src/lib/private-beta-invite-packet/fixtures";

const workspaceRoot = process.cwd();

type PrivateBetaInviteTypeSurface = {
  version: PrivateBetaInvitePacketVersion;
  packet: PrivateBetaInvitePacket;
  verdict: PrivateBetaInviteVerdict;
  template: PrivateBetaInviteTemplate;
  requirement: PrivateBetaInviteRequirement;
  consentItem: PrivateBetaConsentChecklistItem;
  limitation: PrivateBetaKnownLimitation;
  disclosure: PrivateBetaDisclosure;
  supportRequirement: PrivateBetaSupportRefundPrivacyRequirement;
  issueReporting: PrivateBetaIssueReportingInstructions;
  nextPr: PrivateBetaInviteNextPr;
  severity: PrivateBetaInviteSeverity;
};

const typeSmoke: PrivateBetaInviteTypeSurface = {
  version: VISUAL_LEXICON_PRIVATE_BETA_INVITE_PACKET_VERSION,
  packet: PRIVATE_BETA_INVITE_PACKET,
  verdict: PRIVATE_BETA_INVITE_VERDICT,
  template: PRIVATE_BETA_INVITE_PACKET.invitationEmailTemplate,
  requirement: PRIVATE_BETA_INVITE_PACKET.participantEligibility[0],
  consentItem: PRIVATE_BETA_INVITE_PACKET.participantConsentChecklist[0],
  limitation: PRIVATE_BETA_INVITE_PACKET.knownLimitations[0],
  disclosure: PRIVATE_BETA_INVITE_PACKET.localStateAccountSyncDisclosure,
  supportRequirement:
    PRIVATE_BETA_INVITE_PACKET.supportRefundPrivacyRequirements[0],
  issueReporting: PRIVATE_BETA_INVITE_PACKET.issueReportingInstructions,
  nextPr: PRIVATE_BETA_INVITE_PACKET.nextInvitePacketPRSequence[0],
  severity: PRIVATE_BETA_INVITE_SEVERITIES[0]
};

function ids<TItem extends { id: string }>(items: readonly TItem[]) {
  return items.map((item) => item.id);
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
  const originalFetchDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "fetch"
  );
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "window"
  );
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage"
  );
  const originalProcessEnvDescriptor = Object.getOwnPropertyDescriptor(
    process,
    "env"
  );
  let fetchAccessed = false;
  let windowAccessed = false;
  let localStorageAccessed = false;
  let processEnvAccessed = false;

  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    get() {
      fetchAccessed = true;
      return undefined;
    }
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    get() {
      windowAccessed = true;
      return undefined;
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

  try {
    const value = callback();

    return {
      value,
      sideEffects: {
        fetchAccessed,
        windowAccessed,
        localStorageAccessed,
        processEnvAccessed
      }
    };
  } finally {
    if (originalFetchDescriptor) {
      Object.defineProperty(globalThis, "fetch", originalFetchDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "fetch");
    }

    if (originalWindowDescriptor) {
      Object.defineProperty(globalThis, "window", originalWindowDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }

    if (originalLocalStorageDescriptor) {
      Object.defineProperty(
        globalThis,
        "localStorage",
        originalLocalStorageDescriptor
      );
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }

    if (originalProcessEnvDescriptor?.configurable) {
      Object.defineProperty(process, "env", originalProcessEnvDescriptor);
    }
  }
}

test.describe("private beta invite packet", () => {
  test("exports the required typed invite packet surface", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      packet: {
        branch: "release/private-beta-invite-packet",
        pullRequest: "#86 Private beta invite packet / participant instructions",
        reportDateKst: "2026-06-16"
      },
      verdict: "Conditional / Manual-only",
      template: {
        id: "invitation_email_template",
        channel: "email"
      },
      severity: "P0"
    });
  });

  test("sets private beta verdict to Conditional / Manual-only and public beta to No-Go", () => {
    expect(getPrivateBetaInvitePacket()).toBe(PRIVATE_BETA_INVITE_PACKET);
    expect(getPrivateBetaInviteVerdict()).toBe("Conditional / Manual-only");
    expect(getPublicBetaVerdict()).toBe("No-Go");
    expect(PRIVATE_BETA_INVITE_VERDICT).toBe("Conditional / Manual-only");
    expect(PUBLIC_BETA_VERDICT).toBe("No-Go");
    expect(PRIVATE_BETA_INVITE_PACKET.currentVerdicts).toEqual({
      ownerControlledPrivateBeta: "Conditional / Manual-only",
      publicPaidBeta: "No-Go"
    });
  });

  test("participant eligibility and exclusions exist", () => {
    expect(ids(PRIVATE_BETA_INVITE_PACKET.participantEligibility)).toEqual([
      ...PRIVATE_BETA_REQUIRED_ELIGIBILITY_IDS
    ]);
    expect(ids(PRIVATE_BETA_INVITE_PACKET.participantExclusions)).toEqual([
      ...PRIVATE_BETA_REQUIRED_EXCLUSION_IDS
    ]);

    const eligibilityCopy = PRIVATE_BETA_INVITE_PACKET.participantEligibility
      .map((item) => item.copy)
      .join(" ");
    const exclusionCopy = PRIVATE_BETA_INVITE_PACKET.participantExclusions
      .map((item) => item.copy)
      .join(" ");

    expect(eligibilityCopy).toContain("5 to 20");
    expect(eligibilityCopy).toContain("local/browser-specific");
    expect(exclusionCopy).toContain("public signup");
    expect(exclusionCopy).toContain("automatic entitlement");
    expect(exclusionCopy).toContain("real account sync");
  });

  test("invitation email template exists with required participant-facing limits", () => {
    const template = getInvitationEmailTemplate();

    expect(template).toMatchObject({
      id: "invitation_email_template",
      channel: "email",
      subject: "Visual Lexicon private beta invite",
      requiredBeforeSending: true,
      ownerApprovalRequiredBeforeSending: true,
      supportContactPlaceholderRequired: true,
      refundCancellationPlaceholderRequired: true,
      privacyPlaceholderRequired: true,
      noPublicSignupNoteIncluded: true,
      publicPaidBetaNoGoNoteIncluded: true
    });
    expect(template.body).toContain("Owner-controlled private beta: Conditional / Manual-only");
    expect(template.body).toContain("Public paid beta: No-Go");
    expect(template.body).toContain("Public signup is not open");
    expect(template.body).toContain("public paid beta is not open");
    expect(template.body).toContain("manual/payment-link-only");
    expect(template.body).toContain("does not automatically grant entitlement");
    expect(template.body).toContain("local/browser-specific");
    expect(template.body).toContain("permanent production data");
    expect(template.body).toContain("route, device, browser, steps");
  });

  test("DM template exists with no-public-signup and no-public-sharing copy", () => {
    const template = getDmInvitationTemplate();

    expect(template).toMatchObject({
      id: "short_dm_invitation_template",
      channel: "dm",
      requiredBeforeSending: true,
      ownerApprovalRequiredBeforeSending: true
    });
    expect(template.body).toContain("Public signup is not open");
    expect(template.body).toContain("manual/payment-link-only");
    expect(template.body).toContain("does not grant automatic entitlement");
    expect(template.body).toContain("Please do not share invite details publicly");
  });

  test("participant consent checklist exists", () => {
    expect(ids(getParticipantConsentChecklist())).toEqual([
      ...PRIVATE_BETA_REQUIRED_CONSENT_IDS
    ]);

    for (const item of getParticipantConsentChecklist()) {
      expect(item.requiredBeforeInvite, item.id).toBe(true);
      expect(item.consentEvidenceRequired.length, item.id).toBeGreaterThan(0);
    }
  });

  test("onboarding instructions exist", () => {
    expect(ids(getOnboardingInstructions())).toEqual([
      ...PRIVATE_BETA_REQUIRED_ONBOARDING_IDS
    ]);

    const onboardingCopy = getOnboardingInstructions()
      .map((item) => item.participantInstruction)
      .join(" ");

    expect(onboardingCopy).toContain("owner-provided access instructions");
    expect(onboardingCopy).toContain("one browser profile");
    expect(onboardingCopy).toContain("/dashboard");
  });

  test("local-state/account-sync limitation disclosure exists", () => {
    const limitations = getKnownLimitations();
    const limitationIds = ids(limitations);

    expect(limitationIds).toEqual([...PRIVATE_BETA_REQUIRED_LIMITATION_IDS]);
    expect(limitationIds).toContain("limitation_local_state_account_sync");
    expect(
      PRIVATE_BETA_INVITE_PACKET.localStateAccountSyncDisclosure
    ).toMatchObject({
      id: "local_state_account_sync_limitation_disclosure",
      requiredBeforeInvite: true,
      requiredBeforePaymentRequest: true
    });
    expect(
      PRIVATE_BETA_INVITE_PACKET.localStateAccountSyncDisclosure.participantCopy
    ).toContain("real account sync is not implemented");
    expect(
      PRIVATE_BETA_INVITE_PACKET.localStateAccountSyncDisclosure.participantCopy
    ).toContain("local browser storage");
    expect(
      PRIVATE_BETA_INVITE_PACKET.localStateAccountSyncDisclosure.participantCopy
    ).toContain("permanent production data");
  });

  test("manual payment and no automatic entitlement disclosure exists", () => {
    const disclosure =
      PRIVATE_BETA_INVITE_PACKET.manualPaymentNoAutomaticEntitlementDisclosure;

    expect(disclosure).toMatchObject({
      id: "manual_payment_no_automatic_entitlement_disclosure",
      requiredBeforeInvite: true,
      requiredBeforePaymentRequest: true
    });
    expect(disclosure.participantCopy).toContain("manual/payment-link-only");
    expect(disclosure.participantCopy).toContain("does not include checkout");
    expect(disclosure.participantCopy).toContain("automatic entitlement");
    expect(disclosure.participantCopy).toContain("manually confirm access");
  });

  test("support refund and privacy requirements exist", () => {
    expect(
      ids(PRIVATE_BETA_INVITE_PACKET.supportRefundPrivacyRequirements)
    ).toEqual([...PRIVATE_BETA_REQUIRED_SUPPORT_REFUND_PRIVACY_IDS]);

    for (const item of PRIVATE_BETA_INVITE_PACKET.supportRefundPrivacyRequirements) {
      expect(item.requiredBeforeInvite, item.id).toBe(true);
      expect(item.ownerEvidenceRequired.length, item.id).toBeGreaterThan(0);
    }

    const placeholders = PRIVATE_BETA_INVITE_PACKET.supportRefundPrivacyRequirements
      .map((item) => item.placeholderRequired)
      .join(" ");

    expect(placeholders).toContain("[support_contact]");
    expect(placeholders).toContain("[refund_cancellation_terms]");
    expect(placeholders).toContain("[privacy_local_storage_note]");
  });

  test("issue reporting instructions exist", () => {
    const instructions = getIssueReportingInstructions();

    expect(instructions).toMatchObject({
      id: "issue_reporting_instructions",
      requiredBeforeInvite: true,
      supportContactPlaceholderRequired: true
    });
    expect(instructions.requiredFields).toEqual([
      ...PRIVATE_BETA_REQUIRED_ISSUE_FIELDS
    ]);
    expect(instructions.participantCopy).toContain("route or screen");
    expect(instructions.participantCopy).toContain("device");
    expect(instructions.participantCopy).toContain("browser");
    expect(instructions.participantCopy).toContain("steps to reproduce");
    expect(instructions.participantCopy).toContain("screenshot or video");
  });

  test("24-hour 7-day and closeout follow-up templates exist", () => {
    const followUps = getFollowUpTemplates();

    expect(followUps.first24Hour).toMatchObject({
      id: "first_24_hour_follow_up_template",
      channel: "follow_up_24h",
      requiredBeforeSending: true,
      ownerApprovalRequiredBeforeSending: true
    });
    expect(followUps.sevenDay).toMatchObject({
      id: "seven_day_follow_up_template",
      channel: "follow_up_7d",
      requiredBeforeSending: true,
      ownerApprovalRequiredBeforeSending: true
    });
    expect(followUps.closeoutContinuation).toMatchObject({
      id: "beta_closeout_continuation_template",
      channel: "closeout_or_continuation",
      requiredBeforeSending: true,
      ownerApprovalRequiredBeforeSending: true
    });
    expect(followUps.first24Hour.body).toContain("24-hour check-in");
    expect(followUps.sevenDay.body).toContain("first week");
    expect(followUps.closeoutContinuation.body).toContain("continue, pause, or close");
  });

  test("no public signup public beta and no public sharing notes exist", () => {
    const limitationsCopy = getKnownLimitations().map((item) => item.copy).join(" ");
    const noPublicSharing =
      PRIVATE_BETA_INVITE_PACKET.noPublicSharingPolicy.participantCopy;

    expect(limitationsCopy).toContain("Public signup is not open");
    expect(limitationsCopy).toContain("Public paid beta is not open");
    expect(noPublicSharing).toContain("must not publicly share");
    expect(noPublicSharing).toContain("Public signup is not open");
    expect(noPublicSharing).toContain("public paid beta is not open");
  });

  test("owner approval is required before sending", () => {
    expect(PRIVATE_BETA_INVITE_PACKET.ownerApprovalRequirement).toMatchObject({
      id: "owner_approval_before_sending",
      requiredBeforeSending: true,
      ownerApprovalRequired: true,
      blocksSendingIfMissing: true
    });
    expect(
      PRIVATE_BETA_INVITE_PACKET.ownerApprovalRequirement.requiredApprovalItems
    ).toEqual(
      expect.arrayContaining([
        "current verdicts",
        "participant roster and 5 to 20 person cap",
        "support contact and response window",
        "refund/cancellation wording",
        "privacy/localStorage disclosure",
        "no automatic entitlement wording"
      ])
    );
  });

  test("next invite packet PR sequence starts with #87 issue log", () => {
    expect(getNextInvitePacketPRSequence().map((item) => item.prNumber)).toEqual(
      [...PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS]
    );
    expect(getNextInvitePacketPRSequence().map((item) => item.title)).toEqual([
      ...PRIVATE_BETA_REQUIRED_NEXT_PR_TITLES
    ]);
    expect(getNextInvitePacketPRSequence()[0]).toMatchObject({
      prNumber: 87,
      title: "Private beta issue log template",
      docsContractsTestsOnlyRecommended: true,
      realCheckoutAllowed: false,
      automaticEntitlementAllowed: false,
      realAccountSyncAllowed: false,
      monitoringSdkAllowed: false,
      emailProviderAllowed: false
    });
  });

  test("safety policy keeps docs contracts tests scope closed", () => {
    expect(PRIVATE_BETA_INVITE_SAFETY_POLICY.docsContractsTestsOnly).toBe(true);

    for (const field of PRIVATE_BETA_REQUIRED_SAFETY_FIELDS) {
      expect(PRIVATE_BETA_INVITE_SAFETY_POLICY[field], field).toBe(false);
    }
  });

  test("forbidden integrations are not introduced", () => {
    for (const relativePath of PRIVATE_BETA_FORBIDDEN_ACTUAL_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }

    const appRouteHandlers = collectFiles("src/app").filter(
      (relativePath) => basename(relativePath) === "route.ts"
    );

    expect(appRouteHandlers).toEqual([]);

    for (const fileName of ["package.json", "package-lock.json"] as const) {
      const dependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of PRIVATE_BETA_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(
          dependencies,
          `${fileName} should not add ${dependencyName}`
        ).not.toHaveProperty(dependencyName);
      }
    }
  });

  test("private beta invite packet module files contain no runtime integration patterns", () => {
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\s*\(/,
      /\bwindow\.localStorage\b/,
      /\blocalStorage\.getItem\b/,
      /\blocalStorage\.setItem\b/,
      /\bprocess\.env\b/,
      /from ["']@sendgrid\//,
      /from ["']@mailchimp\//,
      /from ["']mailgun\.js/,
      /from ["']nodemailer/,
      /from ["']resend/,
      /from ["']@sentry\//,
      /from ["']posthog-js/,
      /from ["']@datadog\//,
      /from ["']newrelic/,
      /from ["']winston/,
      /from ["']pino/,
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
      /from ["']openai/,
      /from ["']@ai-sdk\/openai/,
      /\bcreateRouteHandler\b/
    ];

    for (const relativePath of PRIVATE_BETA_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test("runtime app routes and components do not import the invite packet", () => {
    for (const scanDir of PRIVATE_BETA_RUNTIME_SCAN_DIRS) {
      for (const relativePath of collectFiles(scanDir)) {
        if (!/\.(ts|tsx)$/.test(relativePath)) {
          continue;
        }

        const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

        expect(fileText, relativePath).not.toContain(
          "private-beta-invite-packet"
        );
        expect(fileText, relativePath).not.toContain(
          "PRIVATE_BETA_INVITE_PACKET"
        );
      }
    }
  });

  test("helpers are pure static reads", () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      privateVerdict: getPrivateBetaInviteVerdict(),
      publicVerdict: getPublicBetaVerdict(),
      emailId: getInvitationEmailTemplate().id,
      dmId: getDmInvitationTemplate().id,
      consentIds: ids(getParticipantConsentChecklist()),
      onboardingIds: ids(getOnboardingInstructions()),
      limitationIds: ids(getKnownLimitations()),
      issueFields: getIssueReportingInstructions().requiredFields,
      followUpIds: Object.values(getFollowUpTemplates()).map((item) => item.id),
      nextPrNumbers: getNextInvitePacketPRSequence().map((item) => item.prNumber)
    }));

    expect(value).toEqual({
      privateVerdict: "Conditional / Manual-only",
      publicVerdict: "No-Go",
      emailId: "invitation_email_template",
      dmId: "short_dm_invitation_template",
      consentIds: [...PRIVATE_BETA_REQUIRED_CONSENT_IDS],
      onboardingIds: [...PRIVATE_BETA_REQUIRED_ONBOARDING_IDS],
      limitationIds: [...PRIVATE_BETA_REQUIRED_LIMITATION_IDS],
      issueFields: [...PRIVATE_BETA_REQUIRED_ISSUE_FIELDS],
      followUpIds: [
        "first_24_hour_follow_up_template",
        "seven_day_follow_up_template",
        "beta_closeout_continuation_template"
      ],
      nextPrNumbers: [...PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS]
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      windowAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false
    });
  });

  test("README and docs links exist", () => {
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(
      join(workspaceRoot, "docs", "PRIVATE_BETA_INVITE_PACKET.md"),
      "utf8"
    );
    const normalizedDoc = doc.replace(/\s+/g, " ");
    const moduleReadme = readFileSync(
      join(
        workspaceRoot,
        "src",
        "lib",
        "private-beta-invite-packet",
        "README.md"
      ),
      "utf8"
    );

    for (const relativePath of PRIVATE_BETA_DOC_FILES) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(true);
    }

    expect(readme).toContain(
      "[Private Beta Invite Packet](docs/PRIVATE_BETA_INVITE_PACKET.md)"
    );

    for (const section of PRIVATE_BETA_REQUIRED_DOC_SECTIONS) {
      expect(doc, section).toContain(section);
    }

    expect(doc).toContain(
      "Owner-controlled private beta: **Conditional / Manual-only**"
    );
    expect(doc).toContain("Public paid beta: **No-Go**");
    expect(doc).toContain("Public signup is not open");
    expect(doc).toContain("public paid beta is not open");
    expect(doc).toContain("manual/payment-link-only");
    expect(doc).toContain("No automatic entitlement");
    expect(normalizedDoc).toContain("real account sync is not implemented");
    expect(doc).toContain("Recommended next PR: **#87 Private beta issue log template**");
    expect(moduleReadme).toContain("pure static TypeScript data");
    expect(moduleReadme).toContain("does not send emails");
  });
});
