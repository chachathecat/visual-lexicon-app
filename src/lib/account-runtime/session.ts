import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createVlxSupabaseServerClient,
  type SupabaseServerEnv,
} from "@/lib/supabase/server";

import type {
  AccountPrincipalRejectedStatus,
  AccountPrincipalResult,
} from "./types";

export type AccountPrincipalEvidence =
  | {
      status: "verified";
      provider: string;
      subject: unknown;
      isAnonymous?: boolean;
    }
  | {
      status: AccountPrincipalRejectedStatus;
    };

export type AccountPrincipalVerifier = () => Promise<AccountPrincipalEvidence>;

export type ReadAccountPrincipalOptions = {
  env?: SupabaseServerEnv;
  verifier?: AccountPrincipalVerifier;
};

type SupabaseClaimsShape = {
  sub?: unknown;
  is_anonymous?: unknown;
};

const REJECTED_RESULTS: Record<
  AccountPrincipalRejectedStatus,
  AccountPrincipalResult
> = {
  anonymous: {
    status: "anonymous",
    principal: null,
  },
  invalid: {
    status: "invalid",
    principal: null,
  },
  expired: {
    status: "expired",
    principal: null,
  },
  revoked: {
    status: "revoked",
    principal: null,
  },
  ambiguous: {
    status: "ambiguous",
    principal: null,
  },
  unsupported: {
    status: "unsupported",
    principal: null,
  },
  unconfigured: {
    status: "unconfigured",
    principal: null,
  },
};

export async function readAccountPrincipal({
  env,
  verifier,
}: ReadAccountPrincipalOptions = {}): Promise<AccountPrincipalResult> {
  const evidence = verifier
    ? await verifier()
    : await verifySupabaseAccountPrincipal({ env });

  return normalizeAccountPrincipalEvidence(evidence);
}

export async function verifySupabaseAccountPrincipal({
  env,
  supabase,
}: {
  env?: SupabaseServerEnv;
  supabase?: SupabaseClient;
} = {}): Promise<AccountPrincipalEvidence> {
  const supabaseClient =
    supabase ?? (await createVlxSupabaseServerClient({ env })).client;

  if (!supabaseClient) {
    return {
      status: "unconfigured",
    };
  }

  const { data, error } = await supabaseClient.auth.getClaims();

  if (error) {
    return {
      status: mapSupabaseAuthErrorToPrincipalStatus(error),
    };
  }

  if (!data) {
    return {
      status: "anonymous",
    };
  }

  return createSupabasePrincipalEvidenceFromClaims(data.claims);
}

export function createSupabasePrincipalEvidenceFromClaims(
  claims: unknown
): AccountPrincipalEvidence {
  if (!claims || typeof claims !== "object" || Array.isArray(claims)) {
    return {
      status: "invalid",
    };
  }

  const { sub, is_anonymous: isAnonymous } = claims as SupabaseClaimsShape;

  if (Array.isArray(sub)) {
    return {
      status: "ambiguous",
    };
  }

  if (typeof sub !== "string" || sub.trim() !== sub || sub.length === 0) {
    return {
      status: "invalid",
    };
  }

  if (isAnonymous === true) {
    return {
      status: "anonymous",
    };
  }

  return {
    status: "verified",
    provider: "supabase",
    subject: sub,
    isAnonymous: false,
  };
}

export function normalizeAccountPrincipalEvidence(
  evidence: AccountPrincipalEvidence
): AccountPrincipalResult {
  if (evidence.status !== "verified") {
    return REJECTED_RESULTS[evidence.status];
  }

  if (evidence.provider !== "supabase") {
    return REJECTED_RESULTS.unsupported;
  }

  if (evidence.isAnonymous === true) {
    return REJECTED_RESULTS.anonymous;
  }

  if (Array.isArray(evidence.subject)) {
    return REJECTED_RESULTS.ambiguous;
  }

  if (
    typeof evidence.subject !== "string" ||
    evidence.subject.trim() !== evidence.subject ||
    evidence.subject.length === 0
  ) {
    return REJECTED_RESULTS.invalid;
  }

  return {
    status: "authenticated",
    principal: {
      accountId: evidence.subject,
      provider: "supabase",
    },
  };
}

export function mapSupabaseAuthErrorToPrincipalStatus(
  error: unknown
): AccountPrincipalRejectedStatus {
  const name = readErrorString(error, "name").toLowerCase();
  const code = readErrorString(error, "code").toLowerCase();
  const message = readErrorString(error, "message").toLowerCase();
  const evidence = `${code} ${name} ${message}`;

  if (name === "authsessionmissingerror") {
    return "anonymous";
  }

  if (
    evidence.includes("token_expired") ||
    evidence.includes("jwt_expired") ||
    evidence.includes("expired")
  ) {
    return "expired";
  }

  if (
    evidence.includes("session_revoked") ||
    evidence.includes("token_revoked") ||
    evidence.includes("revoked")
  ) {
    return "revoked";
  }

  return "invalid";
}

function readErrorString(error: unknown, key: "code" | "message" | "name") {
  if (!error || typeof error !== "object") {
    return "";
  }

  const value = (error as Partial<Record<typeof key, unknown>>)[key];

  return typeof value === "string" ? value : "";
}
