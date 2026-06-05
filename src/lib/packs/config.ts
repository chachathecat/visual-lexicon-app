import type { VlxStaticPackPath } from "@/lib/packs/types";

const WEBFLOW_CMS_HOSTS = new Set(["api.webflow.com"]);

function readEnvValue(key: string) {
  if (typeof process === "undefined") {
    return undefined;
  }

  return process.env?.[key];
}

function isWebflowCmsUrl(url: URL) {
  return WEBFLOW_CMS_HOSTS.has(url.hostname.toLowerCase());
}

export function normalizePackBaseUrl(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("/")) {
    return trimmed.replace(/\/+$/, "");
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    if (isWebflowCmsUrl(url)) {
      return null;
    }

    return url.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function getConfiguredPackBaseUrl() {
  return normalizePackBaseUrl(
    readEnvValue("NEXT_PUBLIC_VLX_PACK_BASE_URL") ??
      readEnvValue("VLX_PACK_BASE_URL")
  );
}

export function resolvePackFileUrl(
  path: VlxStaticPackPath,
  baseUrl = getConfiguredPackBaseUrl()
) {
  const normalizedBaseUrl = normalizePackBaseUrl(baseUrl);

  if (!normalizedBaseUrl) {
    return null;
  }

  const normalizedPath = path.replace(/^\/+/, "");

  if (normalizedBaseUrl.startsWith("/")) {
    return `${normalizedBaseUrl}/${normalizedPath}`;
  }

  return new URL(normalizedPath, `${normalizedBaseUrl}/`).toString();
}
