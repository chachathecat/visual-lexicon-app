export const VISUAL_LEXICON_PRIVATE_BETA_INVITE_PACKET_VERSION = 1 as const;

export type PrivateBetaInvitePacketVersion =
  typeof VISUAL_LEXICON_PRIVATE_BETA_INVITE_PACKET_VERSION;

export type PrivateBetaInviteVerdict =
  | "Conditional / Manual-only"
  | "No-Go";

export type PrivateBetaInviteSeverity = "P0" | "P1" | "P2";

export type PrivateBetaInviteTemplateChannel =
  | "email"
  | "dm"
  | "follow_up_24h"
  | "follow_up_7d"
  | "closeout_or_continuation";

export type PrivateBetaInviteTemplate = {
  id: string;
  channel: PrivateBetaInviteTemplateChannel;
  title: string;
  subject?: string;
  body: string;
  requiredBeforeSending: true;
  ownerApprovalRequiredBeforeSending: true;
  supportContactPlaceholderRequired: boolean;
  refundCancellationPlaceholderRequired: boolean;
  privacyPlaceholderRequired: boolean;
  noPublicSignupNoteIncluded: true;
  publicPaidBetaNoGoNoteIncluded: true;
};

export type PrivateBetaInviteRequirement = {
  id: string;
  label: string;
  severity: PrivateBetaInviteSeverity;
  requiredBeforeInvite: true;
  participantFacing: true;
  copy: string;
};

export type PrivateBetaConsentChecklistItem = {
  id: string;
  label: string;
  requiredBeforeInvite: true;
  consentEvidenceRequired: string;
};

export type PrivateBetaInstructionItem = {
  id: string;
  label: string;
  participantInstruction: string;
};

export type PrivateBetaKnownLimitation = {
  id: string;
  label: string;
  requiredParticipantDisclosure: true;
  requiredBeforeInvite: true;
  requiredBeforePaymentRequest: boolean;
  copy: string;
};

export type PrivateBetaDisclosure = {
  id: string;
  label: string;
  requiredBeforeInvite: true;
  requiredBeforePaymentRequest: boolean;
  participantCopy: string;
  ownerEvidenceRequired: string;
};

export type PrivateBetaSupportRefundPrivacyRequirement = {
  id: string;
  label: string;
  severity: PrivateBetaInviteSeverity;
  requiredBeforeInvite: true;
  requiredBeforePaymentRequest: boolean;
  placeholderRequired: string;
  ownerEvidenceRequired: string;
};

export type PrivateBetaIssueReportingInstructions = {
  id: "issue_reporting_instructions";
  requiredBeforeInvite: true;
  supportContactPlaceholderRequired: true;
  requiredFields: readonly (
    | "route"
    | "device"
    | "browser"
    | "steps"
    | "expected_behavior"
    | "actual_behavior"
    | "screenshot_or_video_when_possible"
  )[];
  urgentIssueTypes: readonly string[];
  participantCopy: string;
};

export type PrivateBetaFollowUpTemplates = {
  first24Hour: PrivateBetaInviteTemplate;
  sevenDay: PrivateBetaInviteTemplate;
  closeoutContinuation: PrivateBetaInviteTemplate;
};

export type PrivateBetaOwnerApprovalRequirement = {
  id: "owner_approval_before_sending";
  requiredBeforeSending: true;
  ownerApprovalRequired: true;
  blocksSendingIfMissing: true;
  requiredApprovalItems: readonly string[];
};

export type PrivateBetaInviteNextPr = {
  prNumber: 87 | 88 | 89 | 90;
  title: string;
  purpose: string;
  docsContractsTestsOnlyRecommended: true;
  realCheckoutAllowed: false;
  automaticEntitlementAllowed: false;
  realAccountSyncAllowed: false;
  monitoringSdkAllowed: false;
  emailProviderAllowed: false;
};

export type PrivateBetaInviteSafetyPolicy = {
  docsContractsTestsOnly: true;
  runtimeUiChangesAllowed: false;
  emailsSentAllowed: false;
  emailProviderIntegrationAllowed: false;
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
};

export type PrivateBetaInvitePacket = {
  version: PrivateBetaInvitePacketVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/private-beta-invite-packet";
  pullRequest: "#86 Private beta invite packet / participant instructions";
  reportDateKst: "2026-06-16";
  scope: "Track B private beta invite packet and participant instructions";
  ownerControlledPrivateBetaVerdict: "Conditional / Manual-only";
  publicPaidBetaVerdict: "No-Go";
  currentVerdicts: {
    ownerControlledPrivateBeta: "Conditional / Manual-only";
    publicPaidBeta: "No-Go";
  };
  executiveSummary: readonly string[];
  participantEligibility: readonly PrivateBetaInviteRequirement[];
  participantExclusions: readonly PrivateBetaInviteRequirement[];
  invitationEmailTemplate: PrivateBetaInviteTemplate;
  dmInvitationTemplate: PrivateBetaInviteTemplate;
  participantConsentChecklist: readonly PrivateBetaConsentChecklistItem[];
  onboardingInstructions: readonly PrivateBetaInstructionItem[];
  firstSessionInstructions: readonly PrivateBetaInstructionItem[];
  whatToTest: readonly PrivateBetaInstructionItem[];
  whatNotToExpect: readonly PrivateBetaInstructionItem[];
  knownLimitations: readonly PrivateBetaKnownLimitation[];
  localStateAccountSyncDisclosure: PrivateBetaDisclosure;
  manualPaymentNoAutomaticEntitlementDisclosure: PrivateBetaDisclosure;
  supportRefundPrivacyRequirements:
    readonly PrivateBetaSupportRefundPrivacyRequirement[];
  issueReportingInstructions: PrivateBetaIssueReportingInstructions;
  screenshotVideoEvidenceGuidance: readonly PrivateBetaInstructionItem[];
  followUpTemplates: PrivateBetaFollowUpTemplates;
  noPublicSharingPolicy: PrivateBetaDisclosure;
  ownerApprovalRequirement: PrivateBetaOwnerApprovalRequirement;
  nextInvitePacketPRSequence: readonly PrivateBetaInviteNextPr[];
  safetyPolicy: PrivateBetaInviteSafetyPolicy;
};

export const PRIVATE_BETA_INVITE_VERDICT =
  "Conditional / Manual-only" as const satisfies PrivateBetaInviteVerdict;

export const PUBLIC_BETA_VERDICT =
  "No-Go" as const satisfies PrivateBetaInviteVerdict;

export const PRIVATE_BETA_INVITE_EXECUTIVE_SUMMARY = [
  "This packet is the participant-facing communication package for inviting 5 to 20 manually selected Visual Lexicon Track B private beta users.",
  "The owner-controlled private beta is Conditional / Manual-only, and public paid beta remains No-Go.",
  "Owner approval is required before sending invitations or payment requests."
] as const;

export const PRIVATE_BETA_PARTICIPANT_ELIGIBILITY = [
  {
    id: "eligibility_owner_selected",
    label: "Owner-selected participant",
    severity: "P0",
    requiredBeforeInvite: true,
    participantFacing: true,
    copy:
      "Participant is manually selected by the owner for a 5 to 20 person private beta cohort."
  },
  {
    id: "eligibility_accepts_manual_private_beta",
    label: "Accepts manual private beta status",
    severity: "P0",
    requiredBeforeInvite: true,
    participantFacing: true,
    copy:
      "Participant understands this is a small owner-controlled private beta, not public signup or public paid beta."
  },
  {
    id: "eligibility_tests_learning_loop",
    label: "Can test learning loop",
    severity: "P1",
    requiredBeforeInvite: true,
    participantFacing: true,
    copy:
      "Participant can test save, review, due words, weak words, saved library, and packs in one browser profile."
  },
  {
    id: "eligibility_accepts_local_state_limit",
    label: "Accepts local-state/account-sync limit",
    severity: "P0",
    requiredBeforeInvite: true,
    participantFacing: true,
    copy:
      "Participant accepts that learning state may be local/browser-specific until real account sync is implemented."
  },
  {
    id: "eligibility_can_report_issues",
    label: "Can report issues with evidence",
    severity: "P1",
    requiredBeforeInvite: true,
    participantFacing: true,
    copy:
      "Participant can report route, device, browser, steps, and screenshots or video when possible."
  }
] as const satisfies readonly PrivateBetaInviteRequirement[];

export const PRIVATE_BETA_PARTICIPANT_EXCLUSIONS = [
  {
    id: "exclusion_needs_public_signup",
    label: "Needs public signup",
    severity: "P0",
    requiredBeforeInvite: true,
    participantFacing: true,
    copy:
      "Do not invite participants who require public signup, self-serve signup, or public beta access."
  },
  {
    id: "exclusion_needs_auto_entitlement",
    label: "Needs automatic entitlement",
    severity: "P0",
    requiredBeforeInvite: true,
    participantFacing: true,
    copy:
      "Do not invite participants who require automatic entitlement after payment."
  },
  {
    id: "exclusion_needs_real_account_sync",
    label: "Needs real account sync",
    severity: "P0",
    requiredBeforeInvite: true,
    participantFacing: true,
    copy:
      "Do not invite participants who require real account sync, guaranteed cross-device progress, backup, restore, or durable account state."
  },
  {
    id: "exclusion_needs_public_payment_infrastructure",
    label: "Needs public payment infrastructure",
    severity: "P0",
    requiredBeforeInvite: true,
    participantFacing: true,
    copy:
      "Do not invite participants who require checkout, subscription, invoice, billing portal, or automatic renewal."
  },
  {
    id: "exclusion_needs_public_sharing",
    label: "Needs public sharing rights",
    severity: "P1",
    requiredBeforeInvite: true,
    participantFacing: true,
    copy:
      "Do not invite participants who need to publicly share invite links, screenshots, videos, payment links, or access details without owner approval."
  }
] as const satisfies readonly PrivateBetaInviteRequirement[];

export const PRIVATE_BETA_INVITATION_EMAIL_TEMPLATE = {
  id: "invitation_email_template",
  channel: "email",
  title: "Private beta invitation email",
  subject: "Visual Lexicon private beta invite",
  body: `Hi [participant_name],

I am inviting a small group of manually selected users to try the Visual Lexicon Track B private beta.

Current status:
- Owner-controlled private beta: Conditional / Manual-only
- Public paid beta: No-Go

This is not a public launch. Public signup is not open, public paid beta is not open, and access is manually invited. Please do not forward this invite or share beta access details publicly.

What to expect:
- You can test saving words, reviewing due words, practicing weak words, and using packs as part of the learning loop.
- Learning state may be local/browser-specific until real account sync is implemented.
- Please do not rely on beta data as permanent production data.

Payment, if any:
- Payment is manual/payment-link-only: [payment_link_if_any]
- The app does not automatically grant entitlement after payment.
- Support, refund/cancellation, and privacy instructions are below and must be clear before any payment request.

Support and privacy:
- Support contact: [support_contact]
- Expected response window: [support_response_window]
- Refund/cancellation wording: [refund_cancellation_terms]
- Privacy/localStorage note: [privacy_local_storage_note]

How to start:
1. Use [access_instructions].
2. Use the same browser profile during the beta when possible.
3. Start with the dashboard, save at least one word, then complete a short review session.
4. Report issues with the route, device, browser, steps, and screenshots or video when possible.

Please reply "I understand and want to join" only if these limitations are acceptable.

Thanks,
[owner_name]`,
  requiredBeforeSending: true,
  ownerApprovalRequiredBeforeSending: true,
  supportContactPlaceholderRequired: true,
  refundCancellationPlaceholderRequired: true,
  privacyPlaceholderRequired: true,
  noPublicSignupNoteIncluded: true,
  publicPaidBetaNoGoNoteIncluded: true
} as const satisfies PrivateBetaInviteTemplate;

export const PRIVATE_BETA_DM_INVITATION_TEMPLATE = {
  id: "short_dm_invitation_template",
  channel: "dm",
  title: "Short DM invitation",
  body: `Hi [participant_name] - I am inviting a small owner-controlled group to try the Visual Lexicon Track B private beta.

Status: Owner-controlled private beta is Conditional / Manual-only. Public paid beta is No-Go. Public signup is not open.

Access is manual: [access_instructions]

Limitations: payment, if any, is manual/payment-link-only; the app does not grant automatic entitlement; learning state may be local/browser-specific until real account sync exists; beta data should not be treated as permanent production data.

Before any payment request, you must have support, refund/cancellation, and privacy details:
- Support: [support_contact]
- Refund/cancellation: [refund_cancellation_terms]
- Privacy/localStorage: [privacy_local_storage_note]

Please do not share invite details publicly. If you join, report issues with route, device, browser, steps, and screenshots/video when possible.`,
  requiredBeforeSending: true,
  ownerApprovalRequiredBeforeSending: true,
  supportContactPlaceholderRequired: true,
  refundCancellationPlaceholderRequired: true,
  privacyPlaceholderRequired: true,
  noPublicSignupNoteIncluded: true,
  publicPaidBetaNoGoNoteIncluded: true
} as const satisfies PrivateBetaInviteTemplate;

export const PRIVATE_BETA_PARTICIPANT_CONSENT_CHECKLIST = [
  {
    id: "consent_small_owner_controlled_private_beta",
    label: "Participant understands this is a small owner-controlled private beta.",
    requiredBeforeInvite: true,
    consentEvidenceRequired: "Participant acceptance or owner note confirms understanding."
  },
  {
    id: "consent_manual_invite_only",
    label: "Participant understands access is manually invited.",
    requiredBeforeInvite: true,
    consentEvidenceRequired:
      "Participant copy states access is manual and invite-only."
  },
  {
    id: "consent_no_public_signup",
    label: "Participant understands public signup is not open.",
    requiredBeforeInvite: true,
    consentEvidenceRequired:
      "Invite copy states public signup is not open."
  },
  {
    id: "consent_no_public_paid_beta",
    label: "Participant understands public paid beta is not open.",
    requiredBeforeInvite: true,
    consentEvidenceRequired:
      "Invite copy states public paid beta is No-Go."
  },
  {
    id: "consent_manual_payment_no_auto_entitlement",
    label:
      "Participant understands manual/payment-link-only payment and no automatic entitlement.",
    requiredBeforeInvite: true,
    consentEvidenceRequired:
      "Invite or payment copy states app code grants no automatic entitlement."
  },
  {
    id: "consent_local_state_browser_specific",
    label:
      "Participant understands learning state may be local/browser-specific.",
    requiredBeforeInvite: true,
    consentEvidenceRequired:
      "Invite copy says real account sync is not implemented."
  },
  {
    id: "consent_beta_data_not_permanent",
    label:
      "Participant understands beta data is not permanent production data.",
    requiredBeforeInvite: true,
    consentEvidenceRequired:
      "Participant copy warns not to rely on beta data as permanent production data."
  },
  {
    id: "consent_support_refund_privacy_received",
    label:
      "Participant receives support, refund/cancellation, and privacy instructions.",
    requiredBeforeInvite: true,
    consentEvidenceRequired:
      "Owner-filled support, refund/cancellation, and privacy copy is sent before any payment request."
  },
  {
    id: "consent_issue_reporting_context",
    label: "Participant knows how to report issues.",
    requiredBeforeInvite: true,
    consentEvidenceRequired:
      "Invite copy asks for route, device, browser, steps, and screenshots/video when possible."
  },
  {
    id: "consent_no_public_sharing",
    label: "Participant accepts no public sharing without owner approval.",
    requiredBeforeInvite: true,
    consentEvidenceRequired:
      "Invite copy states not to publicly share invite links, screenshots, videos, payment links, or access details."
  }
] as const satisfies readonly PrivateBetaConsentChecklistItem[];

export const PRIVATE_BETA_ONBOARDING_INSTRUCTIONS = [
  {
    id: "onboarding_confirm_consent",
    label: "Confirm consent checklist",
    participantInstruction:
      "Reply with acceptance only after reading the private beta limitations, support, refund/cancellation, and privacy instructions."
  },
  {
    id: "onboarding_use_owner_access",
    label: "Use owner-approved access instructions",
    participantInstruction:
      "Open the app only through owner-provided access instructions; public signup is not open."
  },
  {
    id: "onboarding_use_same_browser",
    label: "Use the same browser profile",
    participantInstruction:
      "Use one browser profile when possible because learning state may be local/browser-specific."
  },
  {
    id: "onboarding_do_not_clear_site_data",
    label: "Avoid clearing site data",
    participantInstruction:
      "Do not clear site data during normal testing unless intentionally checking state-loss behavior."
  },
  {
    id: "onboarding_start_dashboard",
    label: "Start from dashboard",
    participantInstruction:
      "Start at /dashboard, save a word, and complete a short review session."
  }
] as const satisfies readonly PrivateBetaInstructionItem[];

export const PRIVATE_BETA_FIRST_SESSION_INSTRUCTIONS = [
  {
    id: "first_session_open_dashboard",
    label: "Open dashboard",
    participantInstruction:
      "Open the app and visit /dashboard with the owner-provided access instructions."
  },
  {
    id: "first_session_save_word",
    label: "Save one word",
    participantInstruction:
      "Save one word from a word detail page or approved save entry point."
  },
  {
    id: "first_session_answer_review",
    label: "Answer one review prompt",
    participantInstruction:
      "Start /review or /review/due and answer at least one active-recall prompt."
  },
  {
    id: "first_session_check_saved",
    label: "Check saved library",
    participantInstruction: "Visit /saved and confirm the saved word is visible."
  },
  {
    id: "first_session_report_breakage",
    label: "Report breakage",
    participantInstruction:
      "Report any issue with route, device, browser, steps, expected behavior, actual behavior, and screenshot/video when possible."
  }
] as const satisfies readonly PrivateBetaInstructionItem[];

export const PRIVATE_BETA_WHAT_TO_TEST = [
  {
    id: "test_dashboard_memory_mission",
    label: "Dashboard Today Memory Mission",
    participantInstruction:
      "Check whether the dashboard helps you start or continue review."
  },
  {
    id: "test_save_to_review",
    label: "Save-to-review loop",
    participantInstruction:
      "Save a word and confirm it becomes reviewable rather than just stored."
  },
  {
    id: "test_review_due_weak",
    label: "Review, Due, and Weak routes",
    participantInstruction:
      "Try active recall, due review, and weak review when weak words exist."
  },
  {
    id: "test_saved_and_packs",
    label: "Saved library and packs",
    participantInstruction:
      "Check saved words, pack list, and at least one pack detail route."
  },
  {
    id: "test_pricing_copy",
    label: "Pricing and beta copy",
    participantInstruction:
      "Check whether pricing and beta copy clearly avoid public checkout and automatic entitlement claims."
  },
  {
    id: "test_mobile_keyboard_layout",
    label: "Mobile, keyboard, and layout issues",
    participantInstruction:
      "Report mobile, keyboard, console, hydration, or visible layout problems with screenshots or video when possible."
  }
] as const satisfies readonly PrivateBetaInstructionItem[];

export const PRIVATE_BETA_WHAT_NOT_TO_EXPECT = [
  {
    id: "not_expect_public_signup",
    label: "No public signup",
    participantInstruction: "Do not expect public signup or self-serve access."
  },
  {
    id: "not_expect_public_paid_beta",
    label: "No public paid beta",
    participantInstruction: "Do not expect public paid beta access."
  },
  {
    id: "not_expect_checkout",
    label: "No checkout or subscription",
    participantInstruction:
      "Do not expect checkout, subscription, invoice, billing portal, or automatic renewal."
  },
  {
    id: "not_expect_auto_entitlement",
    label: "No automatic entitlement",
    participantInstruction:
      "Do not expect app code to grant access automatically after payment."
  },
  {
    id: "not_expect_real_account_sync",
    label: "No real account sync",
    participantInstruction:
      "Do not expect cross-device progress, backup, restore, or permanent account state."
  },
  {
    id: "not_expect_ai_tutor",
    label: "No AI Tutor",
    participantInstruction:
      "Do not expect AI Tutor functionality during this private beta packet."
  }
] as const satisfies readonly PrivateBetaInstructionItem[];

export const PRIVATE_BETA_KNOWN_LIMITATIONS = [
  {
    id: "limitation_small_owner_controlled_private_beta",
    label: "Small owner-controlled private beta",
    requiredParticipantDisclosure: true,
    requiredBeforeInvite: true,
    requiredBeforePaymentRequest: true,
    copy:
      "This is a small owner-controlled private beta for 5 to 20 manually selected participants."
  },
  {
    id: "limitation_manual_invite_access",
    label: "Access is manually invited",
    requiredParticipantDisclosure: true,
    requiredBeforeInvite: true,
    requiredBeforePaymentRequest: true,
    copy: "Access is manually invited and manually controlled by the owner."
  },
  {
    id: "limitation_no_public_signup",
    label: "Public signup is not open",
    requiredParticipantDisclosure: true,
    requiredBeforeInvite: true,
    requiredBeforePaymentRequest: true,
    copy: "Public signup is not open."
  },
  {
    id: "limitation_no_public_paid_beta",
    label: "Public paid beta is not open",
    requiredParticipantDisclosure: true,
    requiredBeforeInvite: true,
    requiredBeforePaymentRequest: true,
    copy: "Public paid beta is not open."
  },
  {
    id: "limitation_manual_payment_only",
    label: "Manual/payment-link-only payment",
    requiredParticipantDisclosure: true,
    requiredBeforeInvite: true,
    requiredBeforePaymentRequest: true,
    copy: "Payment, if any, is manual/payment-link-only."
  },
  {
    id: "limitation_no_automatic_entitlement",
    label: "No automatic entitlement",
    requiredParticipantDisclosure: true,
    requiredBeforeInvite: true,
    requiredBeforePaymentRequest: true,
    copy: "No automatic entitlement is granted by app code."
  },
  {
    id: "limitation_local_state_account_sync",
    label: "Local-state/account-sync limitation",
    requiredParticipantDisclosure: true,
    requiredBeforeInvite: true,
    requiredBeforePaymentRequest: true,
    copy:
      "Learning state may be local/browser-specific until real account sync is implemented."
  },
  {
    id: "limitation_beta_data_not_permanent",
    label: "Beta data is not permanent production data",
    requiredParticipantDisclosure: true,
    requiredBeforeInvite: true,
    requiredBeforePaymentRequest: false,
    copy:
      "Users should not rely on beta data as permanent production data."
  },
  {
    id: "limitation_support_refund_privacy_before_payment",
    label: "Support/refund/privacy before payment",
    requiredParticipantDisclosure: true,
    requiredBeforeInvite: true,
    requiredBeforePaymentRequest: true,
    copy:
      "Support, refund/cancellation, and privacy instructions must be provided before any payment request."
  },
  {
    id: "limitation_issue_reporting_context",
    label: "Issue reports need context",
    requiredParticipantDisclosure: true,
    requiredBeforeInvite: true,
    requiredBeforePaymentRequest: false,
    copy:
      "Users should report issues with route, device, browser, steps, and screenshots or videos when possible."
  }
] as const satisfies readonly PrivateBetaKnownLimitation[];

export const PRIVATE_BETA_LOCAL_STATE_ACCOUNT_SYNC_DISCLOSURE = {
  id: "local_state_account_sync_limitation_disclosure",
  label: "Local-state/account-sync limitation disclosure",
  requiredBeforeInvite: true,
  requiredBeforePaymentRequest: true,
  participantCopy:
    "Saved words, review state, review events, daily stats, and related learning state may live in local browser storage during this beta. During this beta, real account sync is not implemented. Progress may not follow participants across devices, browsers, accounts, cleared site data, or browser profile changes. Participants should not rely on this beta data as permanent production data.",
  ownerEvidenceRequired:
    "Invite copy includes browser-local state, no real account sync, no cross-device progress guarantee, and no permanent production data guarantee."
} as const satisfies PrivateBetaDisclosure;

export const PRIVATE_BETA_MANUAL_PAYMENT_NO_ENTITLEMENT_DISCLOSURE = {
  id: "manual_payment_no_automatic_entitlement_disclosure",
  label: "Manual payment and no automatic entitlement disclosure",
  requiredBeforeInvite: true,
  requiredBeforePaymentRequest: true,
  participantCopy:
    "Payment, if any, is manual/payment-link-only. The app does not include checkout, subscription, invoice, billing portal, payment SDK, or automatic entitlement granting. Clicking or completing a payment link does not automatically grant access in app code; the owner must manually confirm access through an off-app manual record.",
  ownerEvidenceRequired:
    "Payment copy states manual/payment-link-only, no checkout, no payment SDK, no automatic entitlement, and owner manual confirmation."
} as const satisfies PrivateBetaDisclosure;

export const PRIVATE_BETA_SUPPORT_REFUND_PRIVACY_REQUIREMENTS = [
  {
    id: "support_contact_placeholder_required",
    label: "Support contact placeholder must be filled",
    severity: "P0",
    requiredBeforeInvite: true,
    requiredBeforePaymentRequest: true,
    placeholderRequired: "[support_contact]",
    ownerEvidenceRequired:
      "Every invite and payment request includes a filled, monitored support contact."
  },
  {
    id: "support_response_window_placeholder_required",
    label: "Support response window placeholder must be filled",
    severity: "P1",
    requiredBeforeInvite: true,
    requiredBeforePaymentRequest: true,
    placeholderRequired: "[support_response_window]",
    ownerEvidenceRequired:
      "Participant copy states the expected private beta support response window."
  },
  {
    id: "refund_cancellation_wording_placeholder_required",
    label: "Refund/cancellation wording placeholder must be filled",
    severity: "P0",
    requiredBeforeInvite: true,
    requiredBeforePaymentRequest: true,
    placeholderRequired: "[refund_cancellation_terms]",
    ownerEvidenceRequired:
      "Payment request copy explains refund and cancellation handling before any payment request."
  },
  {
    id: "privacy_local_storage_note_placeholder_required",
    label: "Privacy/localStorage placeholder must be filled",
    severity: "P0",
    requiredBeforeInvite: true,
    requiredBeforePaymentRequest: true,
    placeholderRequired: "[privacy_local_storage_note]",
    ownerEvidenceRequired:
      "Participant copy explains local learning data, support messages, external payment boundaries, and no raw localStorage values."
  }
] as const satisfies readonly PrivateBetaSupportRefundPrivacyRequirement[];

export const PRIVATE_BETA_ISSUE_REPORTING_INSTRUCTIONS = {
  id: "issue_reporting_instructions",
  requiredBeforeInvite: true,
  supportContactPlaceholderRequired: true,
  requiredFields: [
    "route",
    "device",
    "browser",
    "steps",
    "expected_behavior",
    "actual_behavior",
    "screenshot_or_video_when_possible"
  ],
  urgentIssueTypes: [
    "broken save",
    "broken review",
    "lost local state",
    "payment or entitlement confusion",
    "privacy concern",
    "refund/cancellation confusion",
    "unreachable support"
  ],
  participantCopy:
    "Report issues with route or screen, device, browser, steps to reproduce, expected behavior, actual behavior, and screenshot or video when possible. Do not send secrets, payment details, private account content, raw localStorage values, or unrelated page content."
} as const satisfies PrivateBetaIssueReportingInstructions;

export const PRIVATE_BETA_SCREENSHOT_VIDEO_GUIDANCE = [
  {
    id: "evidence_screenshot_or_video_useful",
    label: "Screenshots/videos are useful for visible issues",
    participantInstruction:
      "Screenshots or videos are useful when they show route failures, visible layout breakage, wrong copy, state loss symptoms, console/hydration errors, mobile issues, or keyboard traps."
  },
  {
    id: "evidence_redact_sensitive_material",
    label: "Redact sensitive material",
    participantInstruction:
      "Avoid including secrets, payment details, private account content, raw localStorage values, or unrelated page content."
  }
] as const satisfies readonly PrivateBetaInstructionItem[];

export const PRIVATE_BETA_FOLLOW_UP_TEMPLATES = {
  first24Hour: {
    id: "first_24_hour_follow_up_template",
    channel: "follow_up_24h",
    title: "First 24-hour follow-up",
    body: `Hi [participant_name] - quick 24-hour check-in on the Visual Lexicon private beta.

Could you reply with:
1. Were you able to open the app and reach /dashboard?
2. Did saving a word and starting review work?
3. Did anything feel broken, confusing, or risky?
4. If there was an issue, please include route, device, browser, steps, and a screenshot/video when possible.

Reminder: public signup and public paid beta are not open. Learning state may be local/browser-specific, and payment, if any, remains manual/payment-link-only with no automatic entitlement.`,
    requiredBeforeSending: true,
    ownerApprovalRequiredBeforeSending: true,
    supportContactPlaceholderRequired: false,
    refundCancellationPlaceholderRequired: false,
    privacyPlaceholderRequired: false,
    noPublicSignupNoteIncluded: true,
    publicPaidBetaNoGoNoteIncluded: true
  },
  sevenDay: {
    id: "seven_day_follow_up_template",
    channel: "follow_up_7d",
    title: "7-day follow-up",
    body: `Hi [participant_name] - checking in after the first week of the Visual Lexicon private beta.

Could you reply with:
1. Did you save words and return to review during the week?
2. Did Due or Weak review feel useful?
3. Did you notice any lost state, confusing copy, mobile/keyboard issue, or support/payment/privacy concern?
4. What would make you more likely to review words again next week?

Please include route, device, browser, steps, and screenshots/video for any issue when possible.`,
    requiredBeforeSending: true,
    ownerApprovalRequiredBeforeSending: true,
    supportContactPlaceholderRequired: false,
    refundCancellationPlaceholderRequired: false,
    privacyPlaceholderRequired: false,
    noPublicSignupNoteIncluded: true,
    publicPaidBetaNoGoNoteIncluded: true
  },
  closeoutContinuation: {
    id: "beta_closeout_continuation_template",
    channel: "closeout_or_continuation",
    title: "Beta closeout / continuation",
    body: `Hi [participant_name] - thank you for joining the Visual Lexicon private beta.

The owner is reviewing whether to continue, pause, or close this beta cohort. Public signup and public paid beta are still not open unless you receive a separate owner-approved update.

Please reply with any final issues or feedback, especially around save, review, weak words, local state, support, payment, refund/cancellation, privacy, mobile, or keyboard behavior. Include route, device, browser, steps, and screenshots or video when possible.

If the beta continues, access remains owner-controlled and manual.`,
    requiredBeforeSending: true,
    ownerApprovalRequiredBeforeSending: true,
    supportContactPlaceholderRequired: false,
    refundCancellationPlaceholderRequired: false,
    privacyPlaceholderRequired: false,
    noPublicSignupNoteIncluded: true,
    publicPaidBetaNoGoNoteIncluded: true
  }
} as const satisfies PrivateBetaFollowUpTemplates;

export const PRIVATE_BETA_NO_PUBLIC_SHARING_POLICY = {
  id: "no_public_sharing_no_public_signup_policy",
  label: "No public sharing / no public signup",
  requiredBeforeInvite: true,
  requiredBeforePaymentRequest: true,
  participantCopy:
    "Participants must not publicly share invite links, screenshots, videos, payment links, or access instructions unless the owner explicitly approves. Public signup is not open, and public paid beta is not open.",
  ownerEvidenceRequired:
    "Invite and DM copy both state no public sharing, public signup is not open, and public paid beta is not open."
} as const satisfies PrivateBetaDisclosure;

export const PRIVATE_BETA_OWNER_APPROVAL_REQUIREMENT = {
  id: "owner_approval_before_sending",
  requiredBeforeSending: true,
  ownerApprovalRequired: true,
  blocksSendingIfMissing: true,
  requiredApprovalItems: [
    "current verdicts",
    "participant roster and 5 to 20 person cap",
    "invitation email and DM copy",
    "support contact and response window",
    "refund/cancellation wording",
    "privacy/localStorage disclosure",
    "manual payment/payment-link-only wording",
    "no automatic entitlement wording",
    "issue reporting instructions",
    "no public sharing and no public signup wording"
  ]
} as const satisfies PrivateBetaOwnerApprovalRequirement;

export const PRIVATE_BETA_INVITE_NEXT_PR_SEQUENCE = [
  {
    prNumber: 87,
    title: "Private beta issue log template",
    purpose:
      "Create the owner-run issue log template for participant reports, severity, route, reproduction, device/browser, redaction, status, and owner decisions.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    monitoringSdkAllowed: false,
    emailProviderAllowed: false
  },
  {
    prNumber: 88,
    title: "Private beta final owner signoff",
    purpose:
      "Record owner approval after invite packet, issue log, participant roster, support/refund/privacy copy, and safety checks are ready.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    monitoringSdkAllowed: false,
    emailProviderAllowed: false
  },
  {
    prNumber: 89,
    title: "Private beta dry-run smoke evidence",
    purpose:
      "Record a no-participant dry run of owner smoke checks, route coverage, console/hydration counts, and local-state notes.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    monitoringSdkAllowed: false,
    emailProviderAllowed: false
  },
  {
    prNumber: 90,
    title: "Owner-run private beta launch decision",
    purpose:
      "Record final launch, pause, or no-launch decision for the owner-controlled private beta cohort.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    monitoringSdkAllowed: false,
    emailProviderAllowed: false
  }
] as const satisfies readonly PrivateBetaInviteNextPr[];

export const PRIVATE_BETA_INVITE_SAFETY_POLICY = {
  docsContractsTestsOnly: true,
  runtimeUiChangesAllowed: false,
  emailsSentAllowed: false,
  emailProviderIntegrationAllowed: false,
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
  npmAuditFixAllowed: false
} as const satisfies PrivateBetaInviteSafetyPolicy;

export const PRIVATE_BETA_INVITE_PACKET = {
  version: VISUAL_LEXICON_PRIVATE_BETA_INVITE_PACKET_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/private-beta-invite-packet",
  pullRequest: "#86 Private beta invite packet / participant instructions",
  reportDateKst: "2026-06-16",
  scope: "Track B private beta invite packet and participant instructions",
  ownerControlledPrivateBetaVerdict: PRIVATE_BETA_INVITE_VERDICT,
  publicPaidBetaVerdict: PUBLIC_BETA_VERDICT,
  currentVerdicts: {
    ownerControlledPrivateBeta: PRIVATE_BETA_INVITE_VERDICT,
    publicPaidBeta: PUBLIC_BETA_VERDICT
  },
  executiveSummary: PRIVATE_BETA_INVITE_EXECUTIVE_SUMMARY,
  participantEligibility: PRIVATE_BETA_PARTICIPANT_ELIGIBILITY,
  participantExclusions: PRIVATE_BETA_PARTICIPANT_EXCLUSIONS,
  invitationEmailTemplate: PRIVATE_BETA_INVITATION_EMAIL_TEMPLATE,
  dmInvitationTemplate: PRIVATE_BETA_DM_INVITATION_TEMPLATE,
  participantConsentChecklist: PRIVATE_BETA_PARTICIPANT_CONSENT_CHECKLIST,
  onboardingInstructions: PRIVATE_BETA_ONBOARDING_INSTRUCTIONS,
  firstSessionInstructions: PRIVATE_BETA_FIRST_SESSION_INSTRUCTIONS,
  whatToTest: PRIVATE_BETA_WHAT_TO_TEST,
  whatNotToExpect: PRIVATE_BETA_WHAT_NOT_TO_EXPECT,
  knownLimitations: PRIVATE_BETA_KNOWN_LIMITATIONS,
  localStateAccountSyncDisclosure:
    PRIVATE_BETA_LOCAL_STATE_ACCOUNT_SYNC_DISCLOSURE,
  manualPaymentNoAutomaticEntitlementDisclosure:
    PRIVATE_BETA_MANUAL_PAYMENT_NO_ENTITLEMENT_DISCLOSURE,
  supportRefundPrivacyRequirements:
    PRIVATE_BETA_SUPPORT_REFUND_PRIVACY_REQUIREMENTS,
  issueReportingInstructions: PRIVATE_BETA_ISSUE_REPORTING_INSTRUCTIONS,
  screenshotVideoEvidenceGuidance: PRIVATE_BETA_SCREENSHOT_VIDEO_GUIDANCE,
  followUpTemplates: PRIVATE_BETA_FOLLOW_UP_TEMPLATES,
  noPublicSharingPolicy: PRIVATE_BETA_NO_PUBLIC_SHARING_POLICY,
  ownerApprovalRequirement: PRIVATE_BETA_OWNER_APPROVAL_REQUIREMENT,
  nextInvitePacketPRSequence: PRIVATE_BETA_INVITE_NEXT_PR_SEQUENCE,
  safetyPolicy: PRIVATE_BETA_INVITE_SAFETY_POLICY
} as const satisfies PrivateBetaInvitePacket;

export function getPrivateBetaInvitePacket() {
  return PRIVATE_BETA_INVITE_PACKET;
}

export function getPrivateBetaInviteVerdict() {
  return PRIVATE_BETA_INVITE_PACKET.ownerControlledPrivateBetaVerdict;
}

export function getPublicBetaVerdict() {
  return PRIVATE_BETA_INVITE_PACKET.publicPaidBetaVerdict;
}

export function getInvitationEmailTemplate() {
  return PRIVATE_BETA_INVITE_PACKET.invitationEmailTemplate;
}

export function getDmInvitationTemplate() {
  return PRIVATE_BETA_INVITE_PACKET.dmInvitationTemplate;
}

export function getParticipantConsentChecklist() {
  return PRIVATE_BETA_INVITE_PACKET.participantConsentChecklist;
}

export function getOnboardingInstructions() {
  return PRIVATE_BETA_INVITE_PACKET.onboardingInstructions;
}

export function getKnownLimitations() {
  return PRIVATE_BETA_INVITE_PACKET.knownLimitations;
}

export function getIssueReportingInstructions() {
  return PRIVATE_BETA_INVITE_PACKET.issueReportingInstructions;
}

export function getFollowUpTemplates() {
  return PRIVATE_BETA_INVITE_PACKET.followUpTemplates;
}

export function getNextInvitePacketPRSequence() {
  return PRIVATE_BETA_INVITE_PACKET.nextInvitePacketPRSequence;
}
