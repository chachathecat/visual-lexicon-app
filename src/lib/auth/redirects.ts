export const AUTH_DEFAULT_REDIRECT_PATH = "/dashboard";

const AUTH_REDIRECT_BASE_URL = "https://app.visuallexicon.local";
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export function normalizeAuthRedirectTarget(
  value: unknown,
  fallback = AUTH_DEFAULT_REDIRECT_PATH
) {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }

  if (value !== value.trim()) {
    return fallback;
  }

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\") ||
    value.includes("\\") ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    return fallback;
  }

  const lowerValue = value.toLowerCase();

  if (lowerValue.startsWith("/%2f") || lowerValue.startsWith("/%5c")) {
    return fallback;
  }

  try {
    const parsed = new URL(value, AUTH_REDIRECT_BASE_URL);

    if (parsed.origin !== AUTH_REDIRECT_BASE_URL) {
      return fallback;
    }

    const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    const lowerNormalized = normalized.toLowerCase();

    if (
      !normalized.startsWith("/") ||
      normalized.startsWith("//") ||
      lowerNormalized.startsWith("/%2f") ||
      lowerNormalized.startsWith("/%5c")
    ) {
      return fallback;
    }

    return normalized;
  } catch {
    return fallback;
  }
}
export function createLoginRedirectPath({
  next,
  status,
}: {
  next?: unknown;
  status?: "error" | "sent" | "unavailable";
}) {
  const searchParams = new URLSearchParams();
  const safeNext = normalizeAuthRedirectTarget(next);

  if (status) {
    searchParams.set("status", status);
  }

  if (safeNext !== AUTH_DEFAULT_REDIRECT_PATH) {
    searchParams.set("next", safeNext);
  }

  const query = searchParams.toString();

  return query ? `/login?${query}` : "/login";
}
