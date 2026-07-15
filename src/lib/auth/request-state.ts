import { randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

export const AUTH_REQUEST_STATE_COOKIE_NAME = "auth_request_state";

const AUTH_REQUEST_STATE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const AUTH_REQUEST_STATE_MAX_AGE_SECONDS = 10 * 60;
const AUTH_REQUEST_STATE_COOKIE_PATH = "/auth";

type CookieOptions = {
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax";
  secure?: boolean;
};

export type AuthRequestStateCookieStore = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: CookieOptions): unknown;
};

function requestStateCookieOptions({ secure }: { secure: boolean }) {
  return {
    httpOnly: true,
    maxAge: AUTH_REQUEST_STATE_MAX_AGE_SECONDS,
    path: AUTH_REQUEST_STATE_COOKIE_PATH,
    sameSite: "lax" as const,
    secure,
  };
}

function expiredRequestStateCookieOptions() {
  return {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: AUTH_REQUEST_STATE_COOKIE_PATH,
    sameSite: "lax" as const,
  };
}

async function resolveCookieStore(cookieStore?: AuthRequestStateCookieStore) {
  return cookieStore ?? ((await cookies()) as AuthRequestStateCookieStore);
}

export function createMagicLinkRequestState() {
  return randomBytes(32).toString("base64url");
}

export function isValidMagicLinkRequestState(
  value: unknown
): value is string {
  return typeof value === "string" && AUTH_REQUEST_STATE_PATTERN.test(value);
}

export async function storeMagicLinkRequestState({
  cookieStore,
  secure,
  state,
}: {
  cookieStore?: AuthRequestStateCookieStore;
  secure: boolean;
  state: unknown;
}) {
  if (!isValidMagicLinkRequestState(state)) {
    return false;
  }

  const store = await resolveCookieStore(cookieStore);
  store.set(
    AUTH_REQUEST_STATE_COOKIE_NAME,
    state,
    requestStateCookieOptions({ secure })
  );

  return true;
}

function requestStatesMatch(state: unknown, storedState: unknown) {
  if (
    !isValidMagicLinkRequestState(state) ||
    !isValidMagicLinkRequestState(storedState)
  ) {
    return false;
  }

  return timingSafeEqual(Buffer.from(state), Buffer.from(storedState));
}

export async function validateMagicLinkRequestState({
  cookieStore,
  state,
}: {
  cookieStore?: AuthRequestStateCookieStore;
  state: unknown;
}) {
  const store = await resolveCookieStore(cookieStore);
  const storedState = store.get(AUTH_REQUEST_STATE_COOKIE_NAME)?.value;

  return requestStatesMatch(state, storedState);
}

export async function consumeMagicLinkRequestState({
  cookieStore,
  state,
}: {
  cookieStore?: AuthRequestStateCookieStore;
  state: unknown;
}) {
  const store = await resolveCookieStore(cookieStore);
  const storedState = store.get(AUTH_REQUEST_STATE_COOKIE_NAME)?.value;

  store.set(
    AUTH_REQUEST_STATE_COOKIE_NAME,
    "",
    expiredRequestStateCookieOptions()
  );

  return requestStatesMatch(state, storedState);
}
