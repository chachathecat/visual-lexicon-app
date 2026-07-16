import { expect, test } from "@playwright/test";

import {
  VlxAccountLearningBrowserHydrationError,
  hydrateAccountLearningBrowserState,
  type VlxAccountLearningHydrationStorage,
} from "../src/lib/account-persistence/staging-vertical-slice/browser-hydration";
import type { VlxAccountLearningHydrateResponse } from "../src/lib/account-persistence/staging-vertical-slice/contracts";
import { VLX_STORAGE_KEYS } from "../src/lib/srs/types";

const SAVED_AT = "2026-07-15T08:00:00.000Z";
const REVIEWED_AT = "2026-07-15T08:05:00.000Z";

const FOUR_SRS_KEYS = [
  VLX_STORAGE_KEYS.savedWords,
  VLX_STORAGE_KEYS.reviewState,
  VLX_STORAGE_KEYS.reviewEvents,
  VLX_STORAGE_KEYS.dailyStats,
] as const;

class MemoryStorage implements VlxAccountLearningHydrationStorage {
  private readonly values = new Map<string, string>();
  private setAttempts = 0;
  private failSetAttempt: number | null = null;

  constructor(initial: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(initial)) {
      this.values.set(key, value);
    }
  }

  failOnceOnSetAttempt(attempt: number) {
    this.setAttempts = 0;
    this.failSetAttempt = attempt;
  }

  get setItemAttempts() {
    return this.setAttempts;
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.setAttempts += 1;

    if (this.setAttempts === this.failSetAttempt) {
      this.failSetAttempt = null;
      throw new Error(`Synthetic write failure for ${key}`);
    }

    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  readJson<T>(key: string): T | null {
    const value = this.getItem(key);
    return value === null ? null : (JSON.parse(value) as T);
  }

  snapshot(keys: readonly string[] = FOUR_SRS_KEYS) {
    return Object.fromEntries(keys.map((key) => [key, this.getItem(key)]));
  }
}

function createHydrationPayload(): VlxAccountLearningHydrateResponse {
  return {
    schemaVersion: "vlx.account-learning.hydrate.v1",
    route: "hydrate",
    ownerSource: "supabase_server_session",
    target: "isolated_staging",
    fixture: "dissonance_saved_review_v1",
    readOnly: true,
    bounded: true,
    items: {
      savedWords: [
        {
          slug: "dissonance",
          word: "Dissonance",
          image: "https://cdn.visuallexicon.org/images/dissonance.webp",
          definition: "A clash between sounds, ideas, or feelings.",
          hub: "academic-vocabulary",
          source: "word_page",
          savedAt: SAVED_AT,
        },
      ],
      reviewEvents: [
        {
          eventId: "evt_prc_dissonance_1",
          sessionId: "session_prc_browser_a",
          slug: "dissonance",
          word: "Dissonance",
          hub: "academic-vocabulary",
          questionType: "saved_review",
          selected: "Dissonance",
          answer: "Dissonance",
          result: "correct",
          responseMs: 1_200,
          usedHint: false,
          confidence: "knew",
          createdAt: REVIEWED_AT,
          boxBefore: 0,
          boxAfter: 1,
          weakScoreBefore: 0,
          weakScoreAfter: 0,
        },
      ],
    },
    counts: {
      savedWords: 1,
      reviewEvents: 1,
    },
    complete: {
      savedWords: true,
      reviewEvents: true,
    },
    mutatesServer: false,
    mutatesBrowser: false,
    grantsPaidEntitlement: false,
    touchesBilling: false,
    touchesPackProgress: false,
  };
}

function expectHydrationError(
  callback: () => unknown,
  code: VlxAccountLearningBrowserHydrationError["code"]
) {
  try {
    callback();
  } catch (error) {
    expect(error).toBeInstanceOf(VlxAccountLearningBrowserHydrationError);
    expect((error as VlxAccountLearningBrowserHydrationError).code).toBe(code);
    return;
  }

  throw new Error(`Expected hydration error ${code}.`);
}

test.describe("Track B staging browser hydration", () => {
  test("empty Browser B hydrates dissonance and derives Learning box 1 from one event", () => {
    const storage = new MemoryStorage({
      vlx_pack_progress_v1: JSON.stringify({ sentinel: "untouched" }),
    });
    const result = hydrateAccountLearningBrowserState(createHydrationPayload(), {
      storage,
    });
    const savedWords = storage.readJson<
      Record<string, { slug: string; savedAt: string }>
    >(VLX_STORAGE_KEYS.savedWords);
    const reviewEvents = storage.readJson<Array<{ eventId: string }>>(
      VLX_STORAGE_KEYS.reviewEvents
    );
    const reviewState = storage.readJson<
      Record<string, { box: number; mastery: string; correct: number; wrong: number }>
    >(VLX_STORAGE_KEYS.reviewState);
    const dailyStats = storage.readJson<
      Record<string, { reviewed: number; correct: number; sessions: number }>
    >(VLX_STORAGE_KEYS.dailyStats);

    expect(result).toEqual({
      status: "committed",
      wroteBrowserStorage: true,
      derivedOnlyFromReviewEvents: true,
      importedMastery: false,
      importedPackProgress: false,
      importedBillingOrEntitlement: false,
      counts: {
        savedWords: 1,
        reviewEvents: 1,
        reviewStateItems: 1,
        dailyStatDays: 1,
      },
    });
    expect(savedWords?.dissonance).toMatchObject({
      slug: "dissonance",
      savedAt: SAVED_AT,
    });
    expect(reviewEvents?.map((event) => event.eventId)).toEqual([
      "evt_prc_dissonance_1",
    ]);
    expect(reviewState?.dissonance).toMatchObject({
      box: 1,
      mastery: "Learning",
      correct: 1,
      wrong: 0,
    });
    expect(dailyStats?.["2026-07-15"]).toMatchObject({
      reviewed: 1,
      correct: 1,
      sessions: 1,
    });
    expect(storage.readJson("vlx_pack_progress_v1")).toEqual({
      sentinel: "untouched",
    });
  });

  test("repeated hydration is a zero-write no-op with stable IDs", () => {
    const storage = new MemoryStorage();
    const payload = createHydrationPayload();

    hydrateAccountLearningBrowserState(payload, { storage });
    const before = storage.snapshot();
    const attemptsBeforeReplay = storage.setItemAttempts;
    const replay = hydrateAccountLearningBrowserState(payload, { storage });

    expect(replay.status).toBe("no_op");
    expect(replay.wroteBrowserStorage).toBe(false);
    expect(storage.setItemAttempts).toBe(attemptsBeforeReplay);
    expect(storage.snapshot()).toEqual(before);
    expect(
      storage.readJson<Array<{ eventId: string }>>(VLX_STORAGE_KEYS.reviewEvents)
    ).toHaveLength(1);
  });

  test("the live Browser B mode rejects any non-empty learning baseline", () => {
    const storage = new MemoryStorage({
      [VLX_STORAGE_KEYS.savedWords]: JSON.stringify({
        existing: {
          slug: "existing",
          word: "Existing",
          savedAt: "2026-07-15T07:00:00.000Z",
        },
      }),
      [VLX_STORAGE_KEYS.reviewState]: "{}",
      [VLX_STORAGE_KEYS.reviewEvents]: "[]",
      [VLX_STORAGE_KEYS.dailyStats]: "{}",
    });
    const before = storage.snapshot();

    expectHydrationError(
      () =>
        hydrateAccountLearningBrowserState(createHydrationPayload(), {
          storage,
          requireCleanBaseline: true,
        }),
      "BASELINE_NOT_CLEAN"
    );

    expect(storage.setItemAttempts).toBe(0);
    expect(storage.snapshot()).toEqual(before);
  });

  test("fake local Mastered and inflated stats are overwritten by event replay", () => {
    const storage = new MemoryStorage({
      [VLX_STORAGE_KEYS.savedWords]: "{}",
      [VLX_STORAGE_KEYS.reviewState]: JSON.stringify({
        dissonance: {
          slug: "dissonance",
          box: 5,
          mastery: "Mastered",
          correct: 999,
          wrong: 0,
        },
      }),
      [VLX_STORAGE_KEYS.reviewEvents]: "[]",
      [VLX_STORAGE_KEYS.dailyStats]: JSON.stringify({
        "2026-07-15": {
          reviewed: 999,
          correct: 999,
          mastered: 999,
          sessions: 999,
        },
      }),
    });

    hydrateAccountLearningBrowserState(createHydrationPayload(), { storage });

    expect(
      storage.readJson<Record<string, { box: number; mastery: string; correct: number }>>(
        VLX_STORAGE_KEYS.reviewState
      )?.dissonance
    ).toMatchObject({
      box: 1,
      mastery: "Learning",
      correct: 1,
    });
    expect(
      storage.readJson<Record<string, { reviewed: number; mastered: number }>>(
        VLX_STORAGE_KEYS.dailyStats
      )?.["2026-07-15"]
    ).toMatchObject({
      reviewed: 1,
      mastered: 0,
    });
  });

  test("same event ID with a different payload is rejected without writes", () => {
    const payload = createHydrationPayload();
    const conflictingEvent = {
      ...payload.items.reviewEvents[0],
      responseMs: 1_300,
    };
    const storage = new MemoryStorage({
      [VLX_STORAGE_KEYS.savedWords]: "{}",
      [VLX_STORAGE_KEYS.reviewState]: JSON.stringify({ sentinel: "state" }),
      [VLX_STORAGE_KEYS.reviewEvents]: JSON.stringify([conflictingEvent]),
      [VLX_STORAGE_KEYS.dailyStats]: JSON.stringify({ sentinel: "stats" }),
    });
    const before = storage.snapshot();

    expectHydrationError(
      () => hydrateAccountLearningBrowserState(payload, { storage }),
      "DUPLICATE_EVENT_CONFLICT"
    );

    expect(storage.setItemAttempts).toBe(0);
    expect(storage.snapshot()).toEqual(before);
  });

  test("provider transition and out-of-scope fields fail the strict payload boundary", () => {
    const storage = new MemoryStorage();
    const invalidTransition = createHydrationPayload() as unknown as Record<
      string,
      unknown
    >;
    const items = invalidTransition.items as {
      reviewEvents: Array<Record<string, unknown>>;
    };
    items.reviewEvents[0].boxAfter = 5;
    invalidTransition.reviewState = {
      dissonance: { mastery: "Mastered" },
    };

    expectHydrationError(
      () => hydrateAccountLearningBrowserState(invalidTransition, { storage }),
      "PAYLOAD_INVALID"
    );
    expect(storage.snapshot()).toEqual({
      [VLX_STORAGE_KEYS.savedWords]: null,
      [VLX_STORAGE_KEYS.reviewState]: null,
      [VLX_STORAGE_KEYS.reviewEvents]: null,
      [VLX_STORAGE_KEYS.dailyStats]: null,
    });
  });

  test("provider box fields that disagree with merged event replay are rejected", () => {
    const payload = createHydrationPayload();
    const priorLocalEvent = {
      ...payload.items.reviewEvents[0],
      eventId: "evt_prc_local_prior",
      sessionId: "session_prc_local_prior",
      createdAt: "2026-07-15T08:04:00.000Z",
    };
    const storage = new MemoryStorage({
      [VLX_STORAGE_KEYS.savedWords]: "{}",
      [VLX_STORAGE_KEYS.reviewState]: JSON.stringify({ sentinel: "state" }),
      [VLX_STORAGE_KEYS.reviewEvents]: JSON.stringify([priorLocalEvent]),
      [VLX_STORAGE_KEYS.dailyStats]: JSON.stringify({ sentinel: "stats" }),
    });
    const before = storage.snapshot();

    expectHydrationError(
      () => hydrateAccountLearningBrowserState(payload, { storage }),
      "EVENT_TRANSITION_INVALID"
    );

    expect(storage.setItemAttempts).toBe(0);
    expect(storage.snapshot()).toEqual(before);
  });

  test("a mid-write failure restores the exact four-key snapshot", () => {
    const storage = new MemoryStorage({
      [VLX_STORAGE_KEYS.savedWords]: "{}",
      [VLX_STORAGE_KEYS.reviewState]: JSON.stringify({ sentinel: "state" }),
      [VLX_STORAGE_KEYS.reviewEvents]: "[]",
      [VLX_STORAGE_KEYS.dailyStats]: JSON.stringify({ sentinel: "stats" }),
    });
    const before = storage.snapshot();
    storage.failOnceOnSetAttempt(2);

    expectHydrationError(
      () =>
        hydrateAccountLearningBrowserState(createHydrationPayload(), {
          storage,
        }),
      "STORAGE_WRITE_FAILED"
    );

    expect(storage.snapshot()).toEqual(before);
  });
});
