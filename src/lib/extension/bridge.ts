export const VLX_EXTENSION_SOURCE = "extension" as const;

export type VlxExtensionSource = typeof VLX_EXTENSION_SOURCE;
export type VlxExtensionReviewMode = "saved" | "due" | "word" | "hub";

export type VlxExtensionReviewUrlInput = {
  mode: VlxExtensionReviewMode;
  slug?: string;
  hub?: string;
  limit?: number;
};

function normalizeToken(value?: string) {
  const normalized = value?.trim().toLowerCase();

  return normalized || undefined;
}

function normalizeLimit(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(1, Math.floor(value));
}

export function normalizeExtensionSource(
  source?: string | null
): VlxExtensionSource | undefined {
  const normalized = normalizeToken(source ?? undefined);

  return normalized === VLX_EXTENSION_SOURCE ? VLX_EXTENSION_SOURCE : undefined;
}

export function isExtensionSource(source?: string | null) {
  return normalizeExtensionSource(source) === VLX_EXTENSION_SOURCE;
}

export function buildExtensionSaveUrl(slug: string) {
  const params = new URLSearchParams();
  const normalizedSlug = normalizeToken(slug);

  if (normalizedSlug) {
    params.set("slug", normalizedSlug);
  }

  params.set("source", VLX_EXTENSION_SOURCE);

  return `/save?${params.toString()}`;
}

export function buildExtensionReviewUrl({
  mode,
  slug,
  hub,
  limit
}: VlxExtensionReviewUrlInput) {
  const params = new URLSearchParams();
  const normalizedSlug = normalizeToken(slug);
  const normalizedHub = normalizeToken(hub);
  const normalizedLimit = normalizeLimit(limit);

  params.set("mode", mode);

  if (mode === "word" && normalizedSlug) {
    params.set("slug", normalizedSlug);
  }

  if (mode === "hub" && normalizedHub) {
    params.set("hub", normalizedHub);
  }

  if (typeof normalizedLimit === "number") {
    params.set("limit", String(normalizedLimit));
  }

  params.set("source", VLX_EXTENSION_SOURCE);

  return `/review?${params.toString()}`;
}
