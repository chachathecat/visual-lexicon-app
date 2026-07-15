import { cookies } from "next/headers";

import { normalizeAuthRedirectTarget } from "./redirects";
import {
  consumeMagicLinkRequestState,
  isValidMagicLinkRequestState,
} from "./request-state";
import { isValidAuthCode, isValidAuthTokenHash } from "./session-flow";

const PENDING_CODE_COOKIE = "auth_pending_code";
const PENDING_TOKEN_COOKIE = "auth_pending_token_hash";
const PENDING_TYPE_COOKIE = "auth_pending_type";
const PENDING_NEXT_COOKIE = "auth_pending_next";
const PENDING_STATE_COOKIE = "auth_pending_request_state";
const PENDING_COOKIE_PATH = "/auth";
const PENDING_COOKIE_MAX_AGE_SECONDS = 10 * 60;
const PENDING_NEXT_COOKIE_MAX_UTF8_BYTES = 1_024;

type CookieOptions = {
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax";
  secure?: boolean;
};

export type PendingConfirmationCookieStore = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: CookieOptions): unknown;
};

export type PendingMagicLinkConfirmation =
  | {
      code: string;
      next: string;
    }
  | {
      next: string;
      tokenHash: string;
      type: "email";
    };

type StagedMagicLinkConfirmation = PendingMagicLinkConfirmation & {
  state: string;
};

function pendingCookieOptions({ secure }: { secure: boolean }): CookieOptions {
  return {
    httpOnly: true,
    maxAge: PENDING_COOKIE_MAX_AGE_SECONDS,
    path: PENDING_COOKIE_PATH,
    sameSite: "lax",
    secure,
  };
}

function expiredPendingCookieOptions(): CookieOptions {
  return {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: PENDING_COOKIE_PATH,
    sameSite: "lax",
  };
}

function utf8ByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function encodeNext(value: unknown) {
  const normalized = normalizeAuthRedirectTarget(value);
  const encoded = encodeURIComponent(normalized);

  if (utf8ByteLength(encoded) > PENDING_NEXT_COOKIE_MAX_UTF8_BYTES) {
    return encodeURIComponent(normalizeAuthRedirectTarget(null));
  }

  return encoded;
}

function decodeNext(value: string | undefined) {
  if (
    !value ||
    utf8ByteLength(value) > PENDING_NEXT_COOKIE_MAX_UTF8_BYTES
  ) {
    return null;
  }

  try {
    const normalized = normalizeAuthRedirectTarget(decodeURIComponent(value));

    if (
      utf8ByteLength(encodeURIComponent(normalized)) >
      PENDING_NEXT_COOKIE_MAX_UTF8_BYTES
    ) {
      return null;
    }

    return normalized;
  } catch {
    return null;
  }
}

async function resolveCookieStore(cookieStore?: PendingConfirmationCookieStore) {
  return cookieStore ?? ((await cookies()) as PendingConfirmationCookieStore);
}

export async function stagePendingMagicLinkConfirmation({
  code,
  cookieStore,
  next,
  secure,
  state,
  tokenHash,
  type,
}: {
  code?: unknown;
  cookieStore?: PendingConfirmationCookieStore;
  next?: unknown;
  secure: boolean;
  state: unknown;
  tokenHash?: unknown;
  type?: unknown;
}) {
  const codeWasProvided = code !== null && code !== undefined;
  const tokenHashWasProvided = tokenHash !== null && tokenHash !== undefined;
  const isPkceConfirmation =
    codeWasProvided &&
    !tokenHashWasProvided &&
    isValidAuthCode(code);
  const isTokenHashConfirmation =
    !codeWasProvided &&
    tokenHashWasProvided &&
    isValidAuthTokenHash(tokenHash) &&
    type === "email";

  if (
    !isValidMagicLinkRequestState(state) ||
    (!isPkceConfirmation && !isTokenHashConfirmation)
  ) {
    return false;
  }

  const store = await resolveCookieStore(cookieStore);
  const options = pendingCookieOptions({ secure });
  const expiredOptions = expiredPendingCookieOptions();

  if (isPkceConfirmation) {
    store.set(PENDING_CODE_COOKIE, code, options);
    store.set(PENDING_TOKEN_COOKIE, "", expiredOptions);
    store.set(PENDING_TYPE_COOKIE, "", expiredOptions);
  } else {
    store.set(PENDING_CODE_COOKIE, "", expiredOptions);
    store.set(PENDING_TOKEN_COOKIE, tokenHash as string, options);
    store.set(PENDING_TYPE_COOKIE, "email", options);
  }

  store.set(PENDING_NEXT_COOKIE, encodeNext(next), options);
  store.set(PENDING_STATE_COOKIE, state, options);

  return true;
}

async function readStagedMagicLinkConfirmation({
  cookieStore,
}: {
  cookieStore?: PendingConfirmationCookieStore;
} = {}): Promise<StagedMagicLinkConfirmation | null> {
  const store = await resolveCookieStore(cookieStore);
  const code = store.get(PENDING_CODE_COOKIE)?.value;
  const tokenHash = store.get(PENDING_TOKEN_COOKIE)?.value;
  const type = store.get(PENDING_TYPE_COOKIE)?.value;
  const next = decodeNext(store.get(PENDING_NEXT_COOKIE)?.value);
  const state = store.get(PENDING_STATE_COOKIE)?.value;

  if (!next || !isValidMagicLinkRequestState(state)) {
    return null;
  }

  if (
    isValidAuthCode(code) &&
    tokenHash === undefined &&
    type === undefined
  ) {
    return { code, next, state };
  }

  if (
    code === undefined &&
    isValidAuthTokenHash(tokenHash) &&
    type === "email"
  ) {
    return { next, state, tokenHash, type };
  }

  return null;
}

export async function readPendingMagicLinkConfirmation({
  cookieStore,
}: {
  cookieStore?: PendingConfirmationCookieStore;
} = {}): Promise<PendingMagicLinkConfirmation | null> {
  const staged = await readStagedMagicLinkConfirmation({ cookieStore });

  if (!staged) {
    return null;
  }

  if ("code" in staged) {
    return { code: staged.code, next: staged.next };
  }

  return { next: staged.next, tokenHash: staged.tokenHash, type: staged.type };
}

export async function takePendingMagicLinkConfirmation({
  cookieStore,
}: {
  cookieStore?: PendingConfirmationCookieStore;
} = {}) {
  const store = await resolveCookieStore(cookieStore);
  const staged = await readStagedMagicLinkConfirmation({
    cookieStore: store,
  });
  const expiredOptions = expiredPendingCookieOptions();

  store.set(PENDING_CODE_COOKIE, "", expiredOptions);
  store.set(PENDING_TOKEN_COOKIE, "", expiredOptions);
  store.set(PENDING_TYPE_COOKIE, "", expiredOptions);
  store.set(PENDING_NEXT_COOKIE, "", expiredOptions);
  store.set(PENDING_STATE_COOKIE, "", expiredOptions);

  if (!staged) {
    return null;
  }

  const requestStateAccepted = await consumeMagicLinkRequestState({
    cookieStore: store,
    state: staged.state,
  });

  if (!requestStateAccepted) {
    return null;
  }

  if ("code" in staged) {
    return { code: staged.code, next: staged.next };
  }

  return { next: staged.next, tokenHash: staged.tokenHash, type: staged.type };
}
