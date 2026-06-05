export const DEFAULT_REVIEW_ROUTE_LIMIT = 5;
export const MAX_REVIEW_ROUTE_LIMIT = 20;

export type VlxReviewRouteMode =
  | "mixed"
  | "saved"
  | "due"
  | "weak"
  | "word"
  | "hub";

export type VlxReviewRouteSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type VlxReviewRouteContract = {
  mode: VlxReviewRouteMode;
  slug?: string;
  hub?: string;
  limit: number;
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeToken(value?: string) {
  const normalized = value?.trim().toLowerCase();

  return normalized || undefined;
}

function normalizeLimit(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_REVIEW_ROUTE_LIMIT;
  }

  return Math.min(MAX_REVIEW_ROUTE_LIMIT, Math.max(1, parsed));
}

export function parseReviewRouteContract(
  searchParams: VlxReviewRouteSearchParams = {}
): VlxReviewRouteContract {
  const requestedMode = normalizeToken(firstParam(searchParams.mode));
  const limit = normalizeLimit(firstParam(searchParams.limit));

  if (requestedMode === "saved") {
    return { mode: "saved", limit };
  }

  if (requestedMode === "due") {
    return { mode: "due", limit };
  }

  if (requestedMode === "weak") {
    return { mode: "weak", limit };
  }

  if (requestedMode === "word") {
    return {
      mode: "word",
      slug: normalizeToken(firstParam(searchParams.slug)),
      limit
    };
  }

  if (requestedMode === "hub") {
    return {
      mode: "hub",
      hub: normalizeToken(firstParam(searchParams.hub)),
      limit
    };
  }

  return { mode: "mixed", limit };
}
