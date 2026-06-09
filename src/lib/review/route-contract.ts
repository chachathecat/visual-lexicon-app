export const DEFAULT_REVIEW_ROUTE_LIMIT = 5;
export const MAX_REVIEW_ROUTE_LIMIT = 20;

export type VlxReviewRouteMode =
  | "mixed"
  | "saved"
  | "due"
  | "weak"
  | "weak-sprint"
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
  packId?: string;
  source?: string;
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
  const routeMetadata = {
    packId: normalizeToken(firstParam(searchParams.packId)),
    source: normalizeToken(firstParam(searchParams.source))
  };

  if (requestedMode === "saved") {
    return { mode: "saved", limit, ...routeMetadata };
  }

  if (requestedMode === "due") {
    return { mode: "due", limit, ...routeMetadata };
  }

  if (requestedMode === "weak") {
    return { mode: "weak", limit, ...routeMetadata };
  }

  if (requestedMode === "weak-sprint") {
    return { mode: "weak-sprint", limit, ...routeMetadata };
  }

  if (requestedMode === "word") {
    return {
      mode: "word",
      slug: normalizeToken(firstParam(searchParams.slug)),
      limit,
      ...routeMetadata
    };
  }

  if (requestedMode === "hub") {
    return {
      mode: "hub",
      hub: normalizeToken(firstParam(searchParams.hub)),
      limit,
      ...routeMetadata
    };
  }

  return { mode: "mixed", limit, ...routeMetadata };
}
