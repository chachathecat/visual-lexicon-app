export const trackBAppShellV2Contract = {
  version: 1,
  branch: "release/track-b-app-shell-v2",
  pullRequest: "#73 Track B design tokens / app shell v2",
  northStarMetric: "Weekly Reviewed Words",
  productDirection: [
    "Today",
    "Review",
    "Weak",
    "Packs",
    "Saved",
    "Progress"
  ],
  learningLoop: [
    "Visual metaphor",
    "Active recall",
    "Mistake record",
    "Spaced review",
    "Mastery status",
    "Paid habit"
  ],
  preparesPrs: [
    "#74 Dashboard v2: Today's Memory Mission",
    "#75 Review Session v2",
    "#76 Saved Library v2",
    "#77 Packs v2",
    "#78 Pricing / Paywall v2"
  ],
  safetyBoundaries: {
    routeIntegrationInThisPr: false,
    apiRoutesAllowed: false,
    routeHandlersAllowed: false,
    middlewareAllowed: false,
    authBillingPaymentChangesAllowed: false,
    providerSdkAllowed: false,
    productionDataMutationAllowed: false,
    fakeMasteryAllowed: false,
    fakePaidAccessAllowed: false
  }
} as const;
