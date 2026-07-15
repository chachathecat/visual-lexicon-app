"use client";

import { useRef, useState } from "react";

import {
  VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT,
  VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD,
  VLX_ACCOUNT_LEARNING_GOLDEN_SEED_SESSION_KEY,
  VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE,
  VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_RESPONSE_MAX_BYTES,
  type VlxAccountLearningApplyInput,
} from "@/lib/account-persistence/staging-vertical-slice/contracts";
import {
  VlxAccountLearningBrowserHydrationError,
  hydrateAccountLearningBrowserState,
} from "@/lib/account-persistence/staging-vertical-slice/browser-hydration";
import { VLX_STORAGE_KEYS } from "@/lib/srs/types";

type ProofAction = "apply" | "replay" | "conflict" | "fake_mastery";

type ProofFixture = {
  idempotencyKey: string;
  input: VlxAccountLearningApplyInput;
};

type ProofStatus = {
  tone: "neutral" | "success" | "error";
  title: string;
  detail: string;
};

const GOLDEN_RUN_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HYDRATION_STORAGE_KEYS = [
  VLX_STORAGE_KEYS.savedWords,
  VLX_STORAGE_KEYS.reviewState,
  VLX_STORAGE_KEYS.reviewEvents,
  VLX_STORAGE_KEYS.dailyStats,
] as const;

function readGoldenSeed() {
  try {
    const raw = window.sessionStorage.getItem(
      VLX_ACCOUNT_LEARNING_GOLDEN_SEED_SESSION_KEY
    );
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Golden seed is malformed.");
    }

    const keys = Object.keys(parsed).sort();
    const seed = parsed as { runId?: unknown; savedAt?: unknown };
    if (
      keys.length !== 2 ||
      keys[0] !== "runId" ||
      keys[1] !== "savedAt" ||
      typeof seed.runId !== "string" ||
      !GOLDEN_RUN_ID_PATTERN.test(seed.runId) ||
      typeof seed.savedAt !== "string" ||
      new Date(seed.savedAt).toISOString() !== seed.savedAt
    ) {
      throw new Error("Golden seed is invalid.");
    }

    return { runId: seed.runId, savedAt: seed.savedAt };
  } catch (error) {
    if (error instanceof RangeError || error instanceof SyntaxError) {
      throw new Error("Golden seed is invalid.");
    }
    throw error;
  }
}

function createProofFixture(): ProofFixture {
  const goldenSeed = readGoldenSeed();
  const nonce = goldenSeed?.runId ?? crypto.randomUUID();
  const savedAt = goldenSeed ? new Date(goldenSeed.savedAt) : new Date();
  const createdAt = new Date(savedAt.getTime() + 1_000);

  return {
    idempotencyKey: `pr-c-${nonce}`,
    input: {
      schemaVersion: 1,
      fixture: VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE,
      savedWord: {
        ...VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD,
        savedAt: savedAt.toISOString(),
      },
      reviewEvent: {
        eventId: `pr-c-event-${nonce}`,
        sessionId: `pr-c-browser-${nonce}`,
        ...VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT,
        responseMs: 3_000,
        createdAt: createdAt.toISOString(),
      },
    },
  };
}

async function readBoundedResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type")?.toLowerCase();

  if (!contentType?.startsWith("application/json")) {
    throw new Error("Response was not JSON.");
  }

  const raw = await response.text();

  if (
    new TextEncoder().encode(raw).byteLength >
    VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_RESPONSE_MAX_BYTES
  ) {
    throw new Error("Response boundary exceeded.");
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Response was not valid JSON.");
  }
}

function hasCleanHydrationBaseline(storage: Storage) {
  const expectedEmptyValues = {
    [VLX_STORAGE_KEYS.savedWords]: {},
    [VLX_STORAGE_KEYS.reviewState]: {},
    [VLX_STORAGE_KEYS.reviewEvents]: [],
    [VLX_STORAGE_KEYS.dailyStats]: {},
  } as const;

  try {
    return Object.entries(expectedEmptyValues).every(([key, expected]) => {
      const raw = storage.getItem(key);
      if (raw === null) return true;
      const parsed = JSON.parse(raw) as unknown;
      return JSON.stringify(parsed) === JSON.stringify(expected);
    });
  } catch {
    return false;
  }
}

function readHydrationStorageSnapshot(storage: Storage) {
  return HYDRATION_STORAGE_KEYS.map((key) => storage.getItem(key));
}

function hydrationSnapshotsMatch(
  left: readonly (string | null)[],
  right: readonly (string | null)[]
) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function readErrorCode(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const error = (value as Record<string, unknown>).error;
  if (!error || typeof error !== "object" || Array.isArray(error)) return null;
  const code = (error as Record<string, unknown>).code;
  return typeof code === "string" && /^[A-Z_]{1,64}$/.test(code) ? code : null;
}

function readApplyStatus(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const status = (value as Record<string, unknown>).status;
  return status === "committed" || status === "replayed" ? status : null;
}

function proofRequestBody(fixture: ProofFixture, action: ProofAction): unknown {
  if (action === "conflict") {
    return {
      ...fixture.input,
      reviewEvent: {
        ...fixture.input.reviewEvent,
        responseMs: fixture.input.reviewEvent.responseMs + 1,
      },
    };
  }

  if (action === "fake_mastery") {
    return {
      ...fixture.input,
      reviewState: { dissonance: { mastery: "Mastered", box: 5 } },
    };
  }

  return fixture.input;
}

export function StagingAccountLearningBridge({
  applyEnabled,
}: {
  applyEnabled: boolean;
}) {
  const fixture = useRef<ProofFixture | null>(null);
  const hydratedSnapshot = useRef<readonly (string | null)[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<ProofStatus>({
    tone: "neutral",
    title: "Ready",
    detail: applyEnabled
      ? "Apply is armed for this exact Preview SHA."
      : "The write kill switch is off; bounded hydration remains available.",
  });

  async function runApplyProof(action: ProofAction) {
    setBusy(true);

    try {
      fixture.current ??= createProofFixture();
      const response = await fetch("/api/account/sync/apply", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": fixture.current.idempotencyKey,
        },
        body: JSON.stringify(proofRequestBody(fixture.current, action)),
      });
      const body = await readBoundedResponse(response);
      const responseStatus = readApplyStatus(body);
      const errorCode = readErrorCode(body);

      if (response.ok && responseStatus) {
        setStatus({
          tone: "success",
          title: responseStatus === "committed" ? "Committed once" : "Replay no-op",
          detail:
            responseStatus === "committed"
              ? "One saved word, one synthetic review event, and one receipt were accepted."
              : "The same key and fingerprint produced no additional learning mutation.",
        });
        return;
      }

      setStatus({
        tone:
          (action === "conflict" && response.status === 409) ||
          (action === "fake_mastery" && response.status === 422)
            ? "success"
            : "error",
        title: errorCode ?? `HTTP ${response.status}`,
        detail:
          action === "conflict" && response.status === 409
            ? "Same key with a different fingerprint was rejected."
            : action === "fake_mastery" && response.status === 422
              ? "Caller-supplied mastery was rejected before persistence."
              : "The staging proof request did not reach its expected state.",
      });
    } catch {
      setStatus({
        tone: "error",
        title: "Request unavailable",
        detail: "No raw URL, account identifier, token, or provider payload was retained.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function hydrateThisBrowser() {
    setBusy(true);

    try {
      const currentSnapshot = readHydrationStorageSnapshot(window.localStorage);
      const isControlledReplay = hydratedSnapshot.current !== null;
      const baselineAccepted = isControlledReplay
        ? hydrationSnapshotsMatch(currentSnapshot, hydratedSnapshot.current ?? [])
        : hasCleanHydrationBaseline(window.localStorage);

      if (!baselineAccepted) {
        setStatus({
          tone: "error",
          title: isControlledReplay
            ? "HYDRATION_BASELINE_CHANGED"
            : "HYDRATION_BASELINE_NOT_EMPTY",
          detail:
            "Use the unchanged clean second-browser flow; existing learning evidence was left unchanged.",
        });
        return;
      }

      const response = await fetch("/api/account/sync/hydrate", {
        credentials: "same-origin",
      });
      const body = await readBoundedResponse(response);

      if (!response.ok) {
        const errorCode = readErrorCode(body);
        setStatus({
          tone: "error",
          title: errorCode ?? `HTTP ${response.status}`,
          detail: "Hydration did not change browser learning state.",
        });
        return;
      }

      const result = hydrateAccountLearningBrowserState(body, {
        storage: window.localStorage,
        requireCleanBaseline: !isControlledReplay,
      });
      hydratedSnapshot.current = readHydrationStorageSnapshot(
        window.localStorage
      );
      setStatus({
        tone: "success",
        title: result.status === "committed" ? "Browser hydrated" : "Hydration no-op",
        detail: `${result.counts.savedWords} saved word and ${result.counts.reviewEvents} review event are present; SRS state was replay-derived.`,
      });
    } catch (error) {
      const code =
        error instanceof VlxAccountLearningBrowserHydrationError
          ? error.code
          : "HYDRATION_UNAVAILABLE";
      const rollbackFailed =
        error instanceof VlxAccountLearningBrowserHydrationError && error.fatal;
      setStatus({
        tone: "error",
        title: code,
        detail: rollbackFailed
          ? "Browser storage rollback failed; stop and inspect the four learning keys before any retry."
          : "The four learning keys were left unchanged or restored exactly.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="settings-panel" aria-labelledby="staging-proof-title">
      <div className="settings-panel__topline">
        <div>
          <h2 className="section-title" id="staging-proof-title">
            Golden-flow controls
          </h2>
          <p className="settings-panel__body">
            No owner identifier, auth material, billing, entitlement, or pack progress is accepted or shown.
          </p>
        </div>
        <span className="account-status-pill account-status-pill--signed_in">
          Preview only
        </span>
      </div>

      <div className="auth-status auth-status--neutral" role="status" aria-live="polite">
        <strong>{status.title}</strong>
        <span>{status.detail}</span>
      </div>

      <div className="pack-actions" aria-label="PR C staging proof actions">
        {applyEnabled ? (
          <>
            <button
              className="track-b-button"
              disabled={busy}
              onClick={() => void runApplyProof("apply")}
              type="button"
            >
              Apply canonical pair
            </button>
            <button
              className="track-b-button track-b-button--quiet"
              disabled={busy || fixture.current === null}
              onClick={() => void runApplyProof("replay")}
              type="button"
            >
              Prove replay
            </button>
            <button
              className="track-b-button track-b-button--quiet"
              disabled={busy || fixture.current === null}
              onClick={() => void runApplyProof("conflict")}
              type="button"
            >
              Prove 409 conflict
            </button>
            <button
              className="track-b-button track-b-button--quiet"
              disabled={busy || fixture.current === null}
              onClick={() => void runApplyProof("fake_mastery")}
              type="button"
            >
              Reject fake mastery
            </button>
          </>
        ) : null}

        <button
          className="track-b-button"
          disabled={busy}
          onClick={() => void hydrateThisBrowser()}
          type="button"
        >
          Hydrate this browser
        </button>
      </div>
    </section>
  );
}
