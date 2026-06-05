import {
  getConfiguredPackBaseUrl,
  resolvePackFileUrl
} from "@/lib/packs/config";
import {
  mockPackFiles,
  mockQuizWords
} from "@/lib/packs/mock-data";
import type {
  VlxExamPack,
  VlxExamPackManifest,
  VlxQuizPack,
  VlxQuizPackManifest,
  VlxQuizWord,
  VlxSearchLiteIndex,
  VlxStaticPackPath
} from "@/lib/packs/types";
import { VLX_PACK_PATHS } from "@/lib/packs/types";
import {
  isVlxStaticPackPath,
  validateExamPack,
  validateExamPackManifest,
  validateQuizPack,
  validateQuizPackManifest,
  validateQuizWord,
  validateSearchLiteIndex,
  type VlxValidationResult
} from "@/lib/packs/validators";

type PackValidator<T> = (value: unknown) => VlxValidationResult<T>;
const mockPackFilesByPath: Record<string, unknown> = mockPackFiles;

export type VlxPackReaderIssue = {
  path: VlxStaticPackPath | string;
  url?: string;
  message: string;
  validationErrors?: string[];
};

export type VlxPackReaderOptions = {
  baseUrl?: string | null;
  fetcher?: typeof fetch;
  onIssue?: (issue: VlxPackReaderIssue) => void;
};

function getBaseUrl(options?: VlxPackReaderOptions) {
  return options?.baseUrl === undefined
    ? getConfiguredPackBaseUrl()
    : options.baseUrl;
}

function getFetch(options?: VlxPackReaderOptions) {
  if (options?.fetcher) {
    return options.fetcher;
  }

  return typeof fetch === "undefined" ? null : fetch;
}

function isDevelopment() {
  return typeof process !== "undefined" && process.env?.NODE_ENV !== "production";
}

function reportIssue(
  issue: VlxPackReaderIssue,
  options?: VlxPackReaderOptions
) {
  options?.onIssue?.(issue);

  if (isDevelopment()) {
    console.warn("[vlx-pack-reader]", issue.message, issue);
  }
}

function messageFromUnknown(error: unknown) {
  return error instanceof Error ? error.message : "Unknown pack reader error.";
}

function toStaticPackPath(
  path: string,
  options?: VlxPackReaderOptions
): VlxStaticPackPath | null {
  if (isVlxStaticPackPath(path)) {
    return path;
  }

  reportIssue(
    {
      path,
      message: "Pack path is not part of the approved static pack contract."
    },
    options
  );

  return null;
}

function getMockHubPack(path: VlxStaticPackPath) {
  const match = path.match(/^\/quiz-pack\/hubs\/([a-z0-9-]+)\.json$/);

  if (!match) {
    return undefined;
  }

  const hub = match[1];
  const words = mockQuizWords.filter((word) => word.hubs.includes(hub));

  if (!words.length) {
    return undefined;
  }

  return {
    packId: `hub-${hub}`,
    title: words[0].hub === hub ? words[0].hub : hub,
    description: `Mock ${hub} vocabulary for static pack fallback.`,
    mode: "hub",
    hub,
    words,
    updatedAt: "2026-06-05T09:00:00.000Z"
  } satisfies VlxQuizPack;
}

function getMockPackFile(path: VlxStaticPackPath) {
  return mockPackFilesByPath[path] ?? getMockHubPack(path);
}

function readMockPackFile<T>(
  path: VlxStaticPackPath,
  validator: PackValidator<T>,
  options?: VlxPackReaderOptions
) {
  const payload = getMockPackFile(path);

  if (payload === undefined) {
    reportIssue(
      {
        path,
        message: "No mock fallback exists for this pack path."
      },
      options
    );
    return null;
  }

  const result = validator(payload);

  if (result.ok) {
    return result.value;
  }

  reportIssue(
    {
      path,
      message: "Mock pack fallback failed validation.",
      validationErrors: result.errors
    },
    options
  );

  return null;
}

async function fetchRemoteJson(
  path: VlxStaticPackPath,
  options?: VlxPackReaderOptions
) {
  const url = resolvePackFileUrl(path, getBaseUrl(options));

  if (!url) {
    return null;
  }

  const fetchImpl = getFetch(options);

  if (!fetchImpl) {
    reportIssue(
      {
        path,
        url,
        message: "No fetch implementation is available for remote pack loading."
      },
      options
    );
    return null;
  }

  try {
    const response = await fetchImpl(url, {
      cache: "force-cache",
      credentials: "omit",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      reportIssue(
        {
          path,
          url,
          message: `Remote pack request failed with HTTP ${response.status}.`
        },
        options
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    reportIssue(
      {
        path,
        url,
        message: messageFromUnknown(error)
      },
      options
    );
    return null;
  }
}

async function readPackFile<T>(
  path: VlxStaticPackPath,
  validator: PackValidator<T>,
  options?: VlxPackReaderOptions
) {
  const remotePayload = await fetchRemoteJson(path, options);

  if (remotePayload !== null) {
    const result = validator(remotePayload);

    if (result.ok) {
      return result.value;
    }

    reportIssue(
      {
        path,
        url: resolvePackFileUrl(path, getBaseUrl(options)) ?? undefined,
        message: "Remote pack payload failed validation.",
        validationErrors: result.errors
      },
      options
    );
  }

  return readMockPackFile(path, validator, options);
}

async function getQuizManifestPath<K extends keyof VlxQuizPackManifest["packs"]>(
  key: K,
  fallbackPath: VlxStaticPackPath,
  options?: VlxPackReaderOptions
) {
  const manifest = await getQuizManifest(options);
  const path = manifest?.packs[key];

  return typeof path === "string" ? path : fallbackPath;
}

function buildPackPath(
  path: string,
  options?: VlxPackReaderOptions
): VlxStaticPackPath | null {
  return toStaticPackPath(path, options);
}

export async function getQuizManifest(options?: VlxPackReaderOptions) {
  return readPackFile<VlxQuizPackManifest>(
    VLX_PACK_PATHS.quizManifest,
    validateQuizPackManifest,
    options
  );
}

export async function getCorePack(options?: VlxPackReaderOptions) {
  const path = await getQuizManifestPath("core", VLX_PACK_PATHS.core, options);

  return readPackFile<VlxQuizPack>(path, validateQuizPack, options);
}

export async function getHomePack(options?: VlxPackReaderOptions) {
  const path = await getQuizManifestPath("home", VLX_PACK_PATHS.home, options);

  return readPackFile<VlxQuizPack>(path, validateQuizPack, options);
}

export async function getHubPack(
  hub: string,
  options?: VlxPackReaderOptions
) {
  const manifest = await getQuizManifest(options);
  const fallbackPath = buildPackPath(`/quiz-pack/hubs/${hub}.json`, options);
  const path = manifest?.packs.hubs?.[hub] ?? fallbackPath;

  return path ? readPackFile<VlxQuizPack>(path, validateQuizPack, options) : null;
}

export async function getWordPack(
  slug: string,
  options?: VlxPackReaderOptions
) {
  const manifest = await getQuizManifest(options);
  const fallbackPath = buildPackPath(`/quiz-pack/words/${slug}.json`, options);
  const path = manifest?.packs.words?.[slug] ?? fallbackPath;

  return path ? readPackFile<VlxQuizWord>(path, validateQuizWord, options) : null;
}

export async function getExamPackManifest(options?: VlxPackReaderOptions) {
  return readPackFile<VlxExamPackManifest>(
    VLX_PACK_PATHS.examManifest,
    validateExamPackManifest,
    options
  );
}

export async function getExamPack(
  packId: string,
  options?: VlxPackReaderOptions
) {
  const manifest = await getExamPackManifest(options);
  const fallbackPath = buildPackPath(`/exam-packs/${packId}.json`, options);
  const path = manifest?.packs[packId] ?? fallbackPath;

  return path ? readPackFile<VlxExamPack>(path, validateExamPack, options) : null;
}

export async function getSearchLite(options?: VlxPackReaderOptions) {
  const path = await getQuizManifestPath(
    "searchLite",
    VLX_PACK_PATHS.searchLite,
    options
  );

  return readPackFile<VlxSearchLiteIndex>(path, validateSearchLiteIndex, options);
}
