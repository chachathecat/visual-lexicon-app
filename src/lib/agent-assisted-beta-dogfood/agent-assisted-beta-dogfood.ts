export const VISUAL_LEXICON_AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD_VERSION =
  1 as const;

export type AgentAssistedPrivateBetaDogfoodVersion =
  typeof VISUAL_LEXICON_AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD_VERSION;

export type AgentAssistedDogfoodVerdict = "Completed" | "Ready to Run";

export type AgentAssistedDogfoodOwnerVerdict =
  "Proceed / Conditional Manual Launch";

export type AgentAssistedDogfoodPublicBetaVerdict = "No-Go";

export type AgentAssistedDogfoodRealUserValidationStatus = "Not Started";

export type AgentAssistedDogfoodSeverity = "P0" | "P1" | "P2";

export type AgentAssistedDogfoodCheckStatus =
  | "agent_pass"
  | "watch"
  | "ready_for_owner_smoke"
  | "blocked_for_public_beta";

export type AgentAssistedDogfoodCurrentVerdicts = {
  ownerControlledPrivateBeta: AgentAssistedDogfoodOwnerVerdict;
  publicPaidBeta: AgentAssistedDogfoodPublicBetaVerdict;
  realParticipantValidation: AgentAssistedDogfoodRealUserValidationStatus;
  agentAssistedDogfood: AgentAssistedDogfoodVerdict;
};

export type AgentAssistedDogfoodZeroUserMetrics = {
  invitedParticipantCount: 0;
  acceptedParticipantCount: 0;
  paymentConfirmedCount: 0;
  manualEntitlementRecordedCount: 0;
  realInvitationsSent: false;
  realParticipantValidationStarted: false;
  retentionClaimed: false;
  paymentIntentClaimed: false;
  realUserComprehensionClaimed: false;
  privateBetaExecutionStarted: false;
  realUserValidationEvidence: "none - dogfood simulation only";
};

export const AGENT_ASSISTED_DOGFOOD_PERSONA_LABELS = [
  "Korean academic vocabulary learner",
  "IELTS/GRE vocabulary learner",
  "casual user from public word page",
  "returning saved-word learner"
] as const;

export type AgentAssistedDogfoodPersonaLabel =
  (typeof AGENT_ASSISTED_DOGFOOD_PERSONA_LABELS)[number];

export type AgentAssistedDogfoodPersona = {
  id: string;
  label: AgentAssistedDogfoodPersonaLabel;
  startingIntent: string;
  successSignalToValidateWithRealUsersLater: string;
  cannotClaimFromDogfood: readonly string[];
};

export const AGENT_ASSISTED_DOGFOOD_JOURNEY_PATHS = [
  "/",
  "/dashboard",
  "/save?slug=dissonance&source=word_page",
  "/review",
  "/review/due",
  "/review/weak",
  "/review/weak-sprint",
  "/saved",
  "/packs",
  "/packs/academic-vocabulary",
  "/pricing"
] as const;

export type AgentAssistedDogfoodJourneyPath =
  (typeof AGENT_ASSISTED_DOGFOOD_JOURNEY_PATHS)[number];

export type AgentAssistedDogfoodJourneyCheck = {
  id: string;
  label: string;
  path: AgentAssistedDogfoodJourneyPath;
  personaFit: readonly AgentAssistedDogfoodPersonaLabel[];
  expectedUserQuestion: string;
  learningLoopExpectation: string;
  dogfoodResult: AgentAssistedDogfoodCheckStatus;
  evidenceBoundary: string;
  mustNotClaim: readonly string[];
};

export type AgentAssistedDogfoodComprehensionCheck = {
  id: string;
  question: string;
  expectedAnswer: string;
  dogfoodResult: AgentAssistedDogfoodCheckStatus;
  realUserEvidenceRequiredLater: true;
};

export type AgentAssistedDogfoodMonetizationCheck = {
  id: string;
  label: string;
  expectedOutcome: string;
  dogfoodResult: AgentAssistedDogfoodCheckStatus;
  noFakeCheckout: boolean;
  noFakePaidAccess: boolean;
};

export const AGENT_ASSISTED_DOGFOOD_STORAGE_KEYS = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pending_home_quiz"
] as const;

export type AgentAssistedDogfoodStorageKey =
  (typeof AGENT_ASSISTED_DOGFOOD_STORAGE_KEYS)[number];

export type AgentAssistedDogfoodLocalStorageProbe = {
  key: AgentAssistedDogfoodStorageKey;
  expectedUse: string;
  redactedOnly: true;
  rawValueCaptured: false;
  grantsPaidAccess: false;
  storesSecrets: false;
  probeQuestion: string;
};

export type AgentAssistedDogfoodConsoleHydrationChecklist = {
  status: "Ready to Run";
  expectedConsoleErrorCount: 0;
  expectedHydrationWarningCount: 0;
  actualCountsRecorded: false;
  routesToSmoke: readonly [
    "/dashboard",
    "/review",
    "/saved",
    "/packs",
    "/pricing"
  ];
  ownerRunRequirement: string;
};

export type AgentAssistedDogfoodFinding = {
  id: string;
  severity: AgentAssistedDogfoodSeverity;
  title: string;
  status: "open" | "watch" | "accepted_for_manual_private_beta";
  blocksRealBatch1Invite: boolean;
  blocksPublicPaidBeta: boolean;
  evidence: string;
  recommendation: string;
};

export type AgentAssistedDogfoodRecommendation = {
  decision: "Proceed to real Batch 1 invite";
  rationale: string;
  requiredBeforeInvite: readonly string[];
  recommendedNextPr: "#93 Owner-run invite batch 1 execution log";
};

export type AgentAssistedDogfoodNextPr = {
  prNumber: 93 | 94 | 95 | 96;
  title: string;
  purpose: string;
  docsContractsTestsOnlyRecommended: boolean;
  realCheckoutAllowed: false;
  automaticEntitlementAllowed: false;
  realAccountSyncAllowed: false;
  productionDeploymentChangesAllowed: false;
};

export type AgentAssistedDogfoodSafetyPolicy = {
  docsContractsTestsOnly: true;
  runtimeUiChangesAllowed: false;
  apiRoutesAllowed: false;
  routeHandlersAllowed: false;
  middlewareAllowed: false;
  authIntegrationAllowed: false;
  databaseProviderAllowed: false;
  providerSdkAllowed: false;
  paymentBillingCheckoutAllowed: false;
  entitlementMutationAllowed: false;
  automaticEntitlementAllowed: false;
  accountSyncAllowed: false;
  realAccountSyncAllowed: false;
  monitoringSdkAllowed: false;
  analyticsSdkAllowed: false;
  aiCallsAllowed: false;
  environmentVariableChangesAllowed: false;
  deploymentChangesAllowed: false;
  webflowCloudflareVercelDnsChangesAllowed: false;
  secretsTouchedAllowed: false;
  productionDataMutationAllowed: false;
  networkCallsAllowed: false;
  browserStorageMutationAllowed: false;
  npmAuditFixAllowed: false;
  invitationSendingAllowed: false;
  emailSendingAllowed: false;
  emailProviderIntegrationAllowed: false;
};

export type AgentAssistedPrivateBetaDogfood = {
  version: AgentAssistedPrivateBetaDogfoodVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/agent-assisted-private-beta-dogfood";
  pullRequest: "#92 Agent-assisted private beta dogfood report";
  reportDateKst: "2026-06-17";
  scope: "Track B zero-user agent-assisted private beta dogfood";
  executiveSummary: string;
  warning: string;
  currentVerdicts: AgentAssistedDogfoodCurrentVerdicts;
  dogfoodVerdict: AgentAssistedDogfoodVerdict;
  publicPaidBetaVerdict: AgentAssistedDogfoodPublicBetaVerdict;
  realUserValidationStatus: AgentAssistedDogfoodRealUserValidationStatus;
  zeroUserMetrics: AgentAssistedDogfoodZeroUserMetrics;
  testedPersonas: readonly AgentAssistedDogfoodPersona[];
  journeyChecks: readonly AgentAssistedDogfoodJourneyCheck[];
  comprehensionChecks: readonly AgentAssistedDogfoodComprehensionCheck[];
  monetizationChecks: readonly AgentAssistedDogfoodMonetizationCheck[];
  localStorageProbeChecklist: readonly AgentAssistedDogfoodLocalStorageProbe[];
  consoleHydrationSmokeChecklist: AgentAssistedDogfoodConsoleHydrationChecklist;
  issueLogEntries: readonly AgentAssistedDogfoodFinding[];
  findings: readonly AgentAssistedDogfoodFinding[];
  recommendation: AgentAssistedDogfoodRecommendation;
  nextDogfoodPRSequence: readonly AgentAssistedDogfoodNextPr[];
  safetyPolicy: AgentAssistedDogfoodSafetyPolicy;
};

export const AGENT_ASSISTED_DOGFOOD_OWNER_VERDICT =
  "Proceed / Conditional Manual Launch" as const satisfies AgentAssistedDogfoodOwnerVerdict;

export const AGENT_ASSISTED_DOGFOOD_PUBLIC_VERDICT =
  "No-Go" as const satisfies AgentAssistedDogfoodPublicBetaVerdict;

export const AGENT_ASSISTED_DOGFOOD_VERDICT =
  "Completed" as const satisfies AgentAssistedDogfoodVerdict;

export const AGENT_ASSISTED_DOGFOOD_REAL_USER_VALIDATION_STATUS =
  "Not Started" as const satisfies AgentAssistedDogfoodRealUserValidationStatus;

export const AGENT_ASSISTED_DOGFOOD_ZERO_USER_METRICS = {
  invitedParticipantCount: 0,
  acceptedParticipantCount: 0,
  paymentConfirmedCount: 0,
  manualEntitlementRecordedCount: 0,
  realInvitationsSent: false,
  realParticipantValidationStarted: false,
  retentionClaimed: false,
  paymentIntentClaimed: false,
  realUserComprehensionClaimed: false,
  privateBetaExecutionStarted: false,
  realUserValidationEvidence: "none - dogfood simulation only"
} as const satisfies AgentAssistedDogfoodZeroUserMetrics;

export const AGENT_ASSISTED_DOGFOOD_PERSONAS = [
  {
    id: "persona_korean_academic_vocab",
    label: "Korean academic vocabulary learner",
    startingIntent:
      "Needs hard English academic words to become remembered, not just translated.",
    successSignalToValidateWithRealUsersLater:
      "real user can save a word, start review, and explain why the visual memory card helps recall.",
    cannotClaimFromDogfood: [
      "real comprehension",
      "retention",
      "weekly review habit"
    ]
  },
  {
    id: "persona_ielts_gre_vocab",
    label: "IELTS/GRE vocabulary learner",
    startingIntent:
      "Wants exam-relevant vocabulary practice that separates weak words from known words.",
    successSignalToValidateWithRealUsersLater:
      "real user understands Due and Weak routes as exam practice loops tied to mistakes.",
    cannotClaimFromDogfood: [
      "score improvement",
      "payment intent",
      "exam readiness"
    ]
  },
  {
    id: "persona_casual_public_word_page",
    label: "casual user from public word page",
    startingIntent:
      "Arrives from a word page and needs the save CTA to lead naturally into review.",
    successSignalToValidateWithRealUsersLater:
      "real user can predict that saved words become review cards before leaving the save flow.",
    cannotClaimFromDogfood: [
      "public acquisition conversion",
      "real onboarding comprehension"
    ]
  },
  {
    id: "persona_returning_saved_word_learner",
    label: "returning saved-word learner",
    startingIntent:
      "Returns to keep studying previously saved words and recover weak cards.",
    successSignalToValidateWithRealUsersLater:
      "real user chooses Start Review, Due, Weak, or Saved without confusing saved lists with mastery.",
    cannotClaimFromDogfood: [
      "return behavior",
      "retention",
      "streak truth"
    ]
  }
] as const satisfies readonly AgentAssistedDogfoodPersona[];

export const AGENT_ASSISTED_DOGFOOD_JOURNEY_CHECKS = [
  {
    id: "public_entry_expectation",
    label: "public entry expectation",
    path: "/",
    personaFit: [
      "casual user from public word page",
      "Korean academic vocabulary learner"
    ],
    expectedUserQuestion:
      "Can I understand that this app turns words into reviewable memory cards?",
    learningLoopExpectation:
      "The entry should point toward saving and reviewing words without implying public beta access.",
    dogfoodResult: "agent_pass",
    evidenceBoundary:
      "Agent/owner dry-run only; no public user acquisition or comprehension evidence.",
    mustNotClaim: ["real traffic conversion", "real comprehension"]
  },
  {
    id: "dashboard",
    label: "/dashboard",
    path: "/dashboard",
    personaFit: [
      "returning saved-word learner",
      "IELTS/GRE vocabulary learner"
    ],
    expectedUserQuestion:
      "What should I study today and why is it due or weak?",
    learningLoopExpectation:
      "Today Memory Mission should prioritize review, weak words, and deck continuation from real state.",
    dogfoodResult: "agent_pass",
    evidenceBoundary:
      "Static route journey check; real dashboard comprehension still requires Batch 1 observation.",
    mustNotClaim: ["fake dashboard metrics", "fake streaks"]
  },
  {
    id: "save_dissonance_from_word_page",
    label: "/save?slug=dissonance&source=word_page",
    path: "/save?slug=dissonance&source=word_page",
    personaFit: ["casual user from public word page"],
    expectedUserQuestion:
      "Did saving dissonance make a review card I can practice?",
    learningLoopExpectation:
      "Save should create or preserve review state and route the learner toward active recall.",
    dogfoodResult: "agent_pass",
    evidenceBoundary:
      "Dogfood checks expected contract only; no real participant save event is claimed.",
    mustNotClaim: ["real save conversion", "fake mastery"]
  },
  {
    id: "review",
    label: "/review",
    path: "/review",
    personaFit: [
      "Korean academic vocabulary learner",
      "returning saved-word learner"
    ],
    expectedUserQuestion:
      "Am I being asked to recall the word, not just recognize easy distractors?",
    learningLoopExpectation:
      "Review should feel like active recall and write review events plus memory state.",
    dogfoodResult: "agent_pass",
    evidenceBoundary:
      "Agent can inspect intended flow only; real answer behavior is unstarted.",
    mustNotClaim: ["retention", "real answer correctness"]
  },
  {
    id: "review_due",
    label: "/review/due",
    path: "/review/due",
    personaFit: ["returning saved-word learner"],
    expectedUserQuestion:
      "Why is this word due today?",
    learningLoopExpectation:
      "Due should derive from nextDueAt and not from a fake queue.",
    dogfoodResult: "agent_pass",
    evidenceBoundary:
      "Checklist validates the expected due-state story, not real delayed recall.",
    mustNotClaim: ["delayed recall passed", "fake due queue"]
  },
  {
    id: "review_weak",
    label: "/review/weak",
    path: "/review/weak",
    personaFit: [
      "IELTS/GRE vocabulary learner",
      "returning saved-word learner"
    ],
    expectedUserQuestion:
      "Can I focus on words I missed or struggled with?",
    learningLoopExpectation:
      "Weak should derive from weakScore, mistakes, and review state.",
    dogfoodResult: "agent_pass",
    evidenceBoundary:
      "Dogfood checks route meaning; real weak-word recovery needs participant review sessions.",
    mustNotClaim: ["real weak-word improvement", "fake mistakes"]
  },
  {
    id: "review_weak_sprint",
    label: "/review/weak-sprint",
    path: "/review/weak-sprint",
    personaFit: ["IELTS/GRE vocabulary learner"],
    expectedUserQuestion:
      "Can I quickly recover my weakest cards?",
    learningLoopExpectation:
      "Weak sprint should share the same review state and event contracts.",
    dogfoodResult: "agent_pass",
    evidenceBoundary:
      "Agent dry-run only; no sprint completion or learning lift is claimed.",
    mustNotClaim: ["separate fake sprint state", "completion rate"]
  },
  {
    id: "saved",
    label: "/saved",
    path: "/saved",
    personaFit: [
      "casual user from public word page",
      "returning saved-word learner"
    ],
    expectedUserQuestion:
      "Are saved words a queue for review rather than a static bookmark list?",
    learningLoopExpectation:
      "Saved should support the review loop and show memory status without fabricating mastery.",
    dogfoodResult: "agent_pass",
    evidenceBoundary:
      "Agent dry-run cannot prove real users understand Saved as a review queue.",
    mustNotClaim: ["real library comprehension", "fake mastery"]
  },
  {
    id: "packs",
    label: "/packs",
    path: "/packs",
    personaFit: [
      "Korean academic vocabulary learner",
      "IELTS/GRE vocabulary learner"
    ],
    expectedUserQuestion:
      "Can I choose a guided learning plan?",
    learningLoopExpectation:
      "Packs should feel like guided plans that feed save and review behavior.",
    dogfoodResult: "agent_pass",
    evidenceBoundary:
      "Agent dogfood claims no real pack engagement, completion, or paid upgrade intent.",
    mustNotClaim: ["fake pack completion", "paid access"]
  },
  {
    id: "academic_vocabulary_pack",
    label: "/packs/academic-vocabulary",
    path: "/packs/academic-vocabulary",
    personaFit: [
      "Korean academic vocabulary learner",
      "IELTS/GRE vocabulary learner"
    ],
    expectedUserQuestion:
      "Does this academic vocabulary pack help me study a coherent set?",
    learningLoopExpectation:
      "Pack detail should set expectations for guided vocabulary learning without fake progress.",
    dogfoodResult: "agent_pass",
    evidenceBoundary:
      "Agent review only; real guided-plan comprehension remains unvalidated.",
    mustNotClaim: ["real progress", "real exam outcome"]
  },
  {
    id: "pricing",
    label: "/pricing",
    path: "/pricing",
    personaFit: [
      "IELTS/GRE vocabulary learner",
      "returning saved-word learner"
    ],
    expectedUserQuestion:
      "What outcome would I pay for, and is checkout real?",
    learningLoopExpectation:
      "Pricing should sell learning outcomes while staying honest that no fake checkout or paid access exists.",
    dogfoodResult: "agent_pass",
    evidenceBoundary:
      "Agent dogfood cannot claim willingness to pay or payment intent.",
    mustNotClaim: ["real payment intent", "fake paid access"]
  }
] as const satisfies readonly AgentAssistedDogfoodJourneyCheck[];

export const AGENT_ASSISTED_DOGFOOD_COMPREHENSION_CHECKS = [
  {
    id: "primary_cta_makes_sense",
    question: "Does the primary CTA make sense?",
    expectedAnswer:
      "The CTA should lead the learner toward saving or starting review, not passive browsing.",
    dogfoodResult: "agent_pass",
    realUserEvidenceRequiredLater: true
  },
  {
    id: "saved_words_become_review_cards",
    question: "Does the user understand saved words become review cards?",
    expectedAnswer:
      "The save flow should make the Save -> Review relationship explicit.",
    dogfoodResult: "agent_pass",
    realUserEvidenceRequiredLater: true
  },
  {
    id: "review_feels_active_recall",
    question: "Does review feel like active recall?",
    expectedAnswer:
      "Review should ask the learner to recall meaning and should not rely on random easy distractors.",
    dogfoodResult: "agent_pass",
    realUserEvidenceRequiredLater: true
  },
  {
    id: "feedback_explains_memory_state",
    question: "Does feedback explain memory-state consequences?",
    expectedAnswer:
      "Feedback should explain what correct, wrong, slow, or weak answers do to memory state.",
    dogfoodResult: "watch",
    realUserEvidenceRequiredLater: true
  },
  {
    id: "saved_feels_like_review_queue",
    question: "Does Saved feel like a review queue?",
    expectedAnswer:
      "Saved should support returning to review, weak words, due cards, and memory state.",
    dogfoodResult: "agent_pass",
    realUserEvidenceRequiredLater: true
  },
  {
    id: "packs_feel_guided_learning_plans",
    question: "Do Packs feel like guided learning plans?",
    expectedAnswer:
      "Packs should feel like curated study plans rather than disconnected word lists.",
    dogfoodResult: "agent_pass",
    realUserEvidenceRequiredLater: true
  },
  {
    id: "pricing_sells_outcomes",
    question: "Does Pricing sell outcomes rather than quotas?",
    expectedAnswer:
      "Pricing should emphasize habit, weak-word recovery, and exam learning outcomes more than raw quotas.",
    dogfoodResult: "watch",
    realUserEvidenceRequiredLater: true
  }
] as const satisfies readonly AgentAssistedDogfoodComprehensionCheck[];

export const AGENT_ASSISTED_DOGFOOD_MONETIZATION_CHECKS = [
  {
    id: "free_value_clarity",
    label: "Free value clarity",
    expectedOutcome:
      "Free should communicate useful save/review learning value without pretending paid features are active.",
    dogfoodResult: "agent_pass",
    noFakeCheckout: true,
    noFakePaidAccess: true
  },
  {
    id: "lite_habit_value_clarity",
    label: "Lite habit value clarity",
    expectedOutcome:
      "Lite should read as habit support for recurring review and Weekly Reviewed Words.",
    dogfoodResult: "agent_pass",
    noFakeCheckout: true,
    noFakePaidAccess: true
  },
  {
    id: "pro_exam_weak_word_value_clarity",
    label: "Pro exam/weak-word value clarity",
    expectedOutcome:
      "Pro should read as exam and weak-word recovery value, not as a fake entitlement.",
    dogfoodResult: "agent_pass",
    noFakeCheckout: true,
    noFakePaidAccess: true
  },
  {
    id: "no_watermark_export_supporting_value",
    label: "no-watermark/export as supporting value",
    expectedOutcome:
      "No-watermark/export should support the learning outcome and not dominate the paid story.",
    dogfoodResult: "watch",
    noFakeCheckout: true,
    noFakePaidAccess: true
  },
  {
    id: "no_fake_checkout",
    label: "no fake checkout",
    expectedOutcome:
      "Pricing must not create checkout, billing portal, invoice, subscription, or payment SDK behavior.",
    dogfoodResult: "agent_pass",
    noFakeCheckout: true,
    noFakePaidAccess: true
  },
  {
    id: "no_fake_paid_access",
    label: "no fake paid access",
    expectedOutcome:
      "The app must not grant fake paid access, automatic entitlement, or subscription state.",
    dogfoodResult: "agent_pass",
    noFakeCheckout: true,
    noFakePaidAccess: true
  }
] as const satisfies readonly AgentAssistedDogfoodMonetizationCheck[];

export const AGENT_ASSISTED_DOGFOOD_LOCAL_STORAGE_PROBES = [
  {
    key: "vlx_saved_words_v1",
    expectedUse: "Saved word records by slug for the local MVP.",
    redactedOnly: true,
    rawValueCaptured: false,
    grantsPaidAccess: false,
    storesSecrets: false,
    probeQuestion:
      "Does saving dissonance create or preserve a saved word without raw storage dumps?"
  },
  {
    key: "vlx_review_state_v1",
    expectedUse: "SRS memory state for saved and reviewed words.",
    redactedOnly: true,
    rawValueCaptured: false,
    grantsPaidAccess: false,
    storesSecrets: false,
    probeQuestion:
      "Do Due, Weak, and Mastered derive from review state instead of fake UI labels?"
  },
  {
    key: "vlx_review_events_v1",
    expectedUse: "Review answer event records.",
    redactedOnly: true,
    rawValueCaptured: false,
    grantsPaidAccess: false,
    storesSecrets: false,
    probeQuestion:
      "Does answering review create a redacted event shape without payment or identity data?"
  },
  {
    key: "vlx_daily_stats_v1",
    expectedUse: "Local daily review activity counters.",
    redactedOnly: true,
    rawValueCaptured: false,
    grantsPaidAccess: false,
    storesSecrets: false,
    probeQuestion:
      "Do daily stats represent real review actions rather than fabricated streaks?"
  },
  {
    key: "vlx_pending_home_quiz",
    expectedUse: "Optional transition key only.",
    redactedOnly: true,
    rawValueCaptured: false,
    grantsPaidAccess: false,
    storesSecrets: false,
    probeQuestion:
      "Does the transition key avoid replacing SRS state or granting paid access?"
  }
] as const satisfies readonly AgentAssistedDogfoodLocalStorageProbe[];

export const AGENT_ASSISTED_DOGFOOD_CONSOLE_HYDRATION_CHECKLIST = {
  status: "Ready to Run",
  expectedConsoleErrorCount: 0,
  expectedHydrationWarningCount: 0,
  actualCountsRecorded: false,
  routesToSmoke: [
    "/dashboard",
    "/review",
    "/saved",
    "/packs",
    "/pricing"
  ],
  ownerRunRequirement:
    "Run fresh browser smoke on a clean local port immediately before real Batch 1 invitations."
} as const satisfies AgentAssistedDogfoodConsoleHydrationChecklist;

export const AGENT_ASSISTED_DOGFOOD_FINDINGS = [
  {
    id: "p0_public_paid_beta_remains_no_go",
    severity: "P0",
    title: "Public paid beta remains No-Go.",
    status: "accepted_for_manual_private_beta",
    blocksRealBatch1Invite: false,
    blocksPublicPaidBeta: true,
    evidence:
      "Dogfood does not add real checkout, automatic entitlement, account sync, deployment readiness, or real user validation.",
    recommendation:
      "Keep the public paid beta blocked while proceeding only with controlled manual Batch 1 validation."
  },
  {
    id: "p0_real_user_validation_not_started",
    severity: "P0",
    title: "Real participant validation is Not Started.",
    status: "accepted_for_manual_private_beta",
    blocksRealBatch1Invite: false,
    blocksPublicPaidBeta: true,
    evidence:
      "invitedParticipantCount, acceptedParticipantCount, paymentConfirmedCount, and manualEntitlementRecordedCount remain zero.",
    recommendation:
      "Use PR #93 to begin owner-run Batch 1 evidence without backfilling dogfood as user proof."
  },
  {
    id: "p1_pre_invite_browser_smoke_ready_to_run",
    severity: "P1",
    title: "Fresh console/hydration smoke should run immediately before the first invite.",
    status: "watch",
    blocksRealBatch1Invite: false,
    blocksPublicPaidBeta: true,
    evidence:
      "This report records the checklist but does not claim a fresh browser run.",
    recommendation:
      "Run local smoke on /dashboard, /review, /saved, /packs, and /pricing before sending real invites."
  },
  {
    id: "p1_comprehension_requires_real_people",
    severity: "P1",
    title: "Comprehension checks still require real people.",
    status: "watch",
    blocksRealBatch1Invite: false,
    blocksPublicPaidBeta: true,
    evidence:
      "Agent dogfood can evaluate clarity but cannot claim real user comprehension, retention, or payment intent.",
    recommendation:
      "Capture real participant confusion and learning-loop notes during Batch 1."
  },
  {
    id: "p2_pricing_outcome_copy_watch",
    severity: "P2",
    title: "Pricing outcome language should be watched in Batch 1.",
    status: "watch",
    blocksRealBatch1Invite: false,
    blocksPublicPaidBeta: false,
    evidence:
      "Agent dogfood reads pricing as outcome-oriented, but real payment intent is not claimed.",
    recommendation:
      "Ask Batch 1 participants whether Lite and Pro value maps to habit, exam, and weak-word outcomes."
  }
] as const satisfies readonly AgentAssistedDogfoodFinding[];

export const AGENT_ASSISTED_DOGFOOD_RECOMMENDATION = {
  decision: "Proceed to real Batch 1 invite",
  rationale:
    "The agent-assisted dry-run found no new blocker to a controlled owner-run Batch 1, while public paid beta remains blocked.",
  requiredBeforeInvite: [
    "Keep invitedParticipantCount, acceptedParticipantCount, paymentConfirmedCount, and manualEntitlementRecordedCount at zero until real evidence exists.",
    "Run a fresh owner browser smoke before the first real invite.",
    "Use redacted issue notes and do not store raw participant, payment, or support data in the repo."
  ],
  recommendedNextPr: "#93 Owner-run invite batch 1 execution log"
} as const satisfies AgentAssistedDogfoodRecommendation;

export const AGENT_ASSISTED_DOGFOOD_NEXT_PR_SEQUENCE = [
  {
    prNumber: 93,
    title: "Owner-run invite batch 1 execution log",
    purpose:
      "Record real owner-sent invite, response, payment, and entitlement counts only after evidence exists.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    productionDeploymentChangesAllowed: false
  },
  {
    prNumber: 94,
    title: "24-hour private beta review",
    purpose:
      "Review first-day real participant evidence, issue severity, and continue/pause decision.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    productionDeploymentChangesAllowed: false
  },
  {
    prNumber: 95,
    title: "7-day private beta review",
    purpose:
      "Review Weekly Reviewed Words, SRS quality, weak-word recovery, and Batch 1 learning-loop evidence.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    productionDeploymentChangesAllowed: false
  },
  {
    prNumber: 96,
    title: "Private beta P0/P1 stabilization, if needed",
    purpose:
      "Fix real Batch 1 blockers before any broader private beta expansion.",
    docsContractsTestsOnlyRecommended: false,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    productionDeploymentChangesAllowed: false
  }
] as const satisfies readonly AgentAssistedDogfoodNextPr[];

export const AGENT_ASSISTED_DOGFOOD_SAFETY_POLICY = {
  docsContractsTestsOnly: true,
  runtimeUiChangesAllowed: false,
  apiRoutesAllowed: false,
  routeHandlersAllowed: false,
  middlewareAllowed: false,
  authIntegrationAllowed: false,
  databaseProviderAllowed: false,
  providerSdkAllowed: false,
  paymentBillingCheckoutAllowed: false,
  entitlementMutationAllowed: false,
  automaticEntitlementAllowed: false,
  accountSyncAllowed: false,
  realAccountSyncAllowed: false,
  monitoringSdkAllowed: false,
  analyticsSdkAllowed: false,
  aiCallsAllowed: false,
  environmentVariableChangesAllowed: false,
  deploymentChangesAllowed: false,
  webflowCloudflareVercelDnsChangesAllowed: false,
  secretsTouchedAllowed: false,
  productionDataMutationAllowed: false,
  networkCallsAllowed: false,
  browserStorageMutationAllowed: false,
  npmAuditFixAllowed: false,
  invitationSendingAllowed: false,
  emailSendingAllowed: false,
  emailProviderIntegrationAllowed: false
} as const satisfies AgentAssistedDogfoodSafetyPolicy;

export const AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD = {
  version: VISUAL_LEXICON_AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/agent-assisted-private-beta-dogfood",
  pullRequest: "#92 Agent-assisted private beta dogfood report",
  reportDateKst: "2026-06-17",
  scope: "Track B zero-user agent-assisted private beta dogfood",
  executiveSummary:
    "Agent-assisted dogfood completed a zero-user simulation of the Track B save, review, weak-word, saved library, packs, and pricing journey. It supports proceeding to controlled owner-run Batch 1 while keeping public paid beta No-Go.",
  warning:
    "Agent dogfood does not replace real user beta validation and must not be counted as invitations, acceptances, retention, payment intent, or real user comprehension.",
  currentVerdicts: {
    ownerControlledPrivateBeta: AGENT_ASSISTED_DOGFOOD_OWNER_VERDICT,
    publicPaidBeta: AGENT_ASSISTED_DOGFOOD_PUBLIC_VERDICT,
    realParticipantValidation:
      AGENT_ASSISTED_DOGFOOD_REAL_USER_VALIDATION_STATUS,
    agentAssistedDogfood: AGENT_ASSISTED_DOGFOOD_VERDICT
  },
  dogfoodVerdict: AGENT_ASSISTED_DOGFOOD_VERDICT,
  publicPaidBetaVerdict: AGENT_ASSISTED_DOGFOOD_PUBLIC_VERDICT,
  realUserValidationStatus:
    AGENT_ASSISTED_DOGFOOD_REAL_USER_VALIDATION_STATUS,
  zeroUserMetrics: AGENT_ASSISTED_DOGFOOD_ZERO_USER_METRICS,
  testedPersonas: AGENT_ASSISTED_DOGFOOD_PERSONAS,
  journeyChecks: AGENT_ASSISTED_DOGFOOD_JOURNEY_CHECKS,
  comprehensionChecks: AGENT_ASSISTED_DOGFOOD_COMPREHENSION_CHECKS,
  monetizationChecks: AGENT_ASSISTED_DOGFOOD_MONETIZATION_CHECKS,
  localStorageProbeChecklist: AGENT_ASSISTED_DOGFOOD_LOCAL_STORAGE_PROBES,
  consoleHydrationSmokeChecklist:
    AGENT_ASSISTED_DOGFOOD_CONSOLE_HYDRATION_CHECKLIST,
  issueLogEntries: AGENT_ASSISTED_DOGFOOD_FINDINGS,
  findings: AGENT_ASSISTED_DOGFOOD_FINDINGS,
  recommendation: AGENT_ASSISTED_DOGFOOD_RECOMMENDATION,
  nextDogfoodPRSequence: AGENT_ASSISTED_DOGFOOD_NEXT_PR_SEQUENCE,
  safetyPolicy: AGENT_ASSISTED_DOGFOOD_SAFETY_POLICY
} as const satisfies AgentAssistedPrivateBetaDogfood;

export function getAgentAssistedPrivateBetaDogfood() {
  return AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD;
}

export function getDogfoodVerdict() {
  return AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD.dogfoodVerdict;
}

export function getPublicBetaVerdict() {
  return AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD.publicPaidBetaVerdict;
}

export function getRealUserValidationStatus() {
  return AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD.realUserValidationStatus;
}

export function getDogfoodPersonas() {
  return AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD.testedPersonas;
}

export function getDogfoodJourneyChecks() {
  return AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD.journeyChecks;
}

export function getDogfoodComprehensionChecks() {
  return AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD.comprehensionChecks;
}

export function getDogfoodMonetizationChecks() {
  return AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD.monetizationChecks;
}

export function getDogfoodFindings() {
  return AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD.findings;
}

export function getNextDogfoodPRSequence() {
  return AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD.nextDogfoodPRSequence;
}
