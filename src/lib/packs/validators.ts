import type {
  VlxCefrLevel,
  VlxExamPack,
  VlxExamPackManifest,
  VlxPackFilePayload,
  VlxPackSource,
  VlxPriceTier,
  VlxQuizPack,
  VlxQuizPackManifest,
  VlxQuizPackMode,
  VlxQuizWord,
  VlxSearchLiteIndex,
  VlxStaticPackPath,
  VlxTargetExam,
  VlxWordDifficulty
} from "@/lib/packs/types";

export type VlxValidationResult<T> =
  | {
      ok: true;
      value: T;
      errors: [];
    }
  | {
      ok: false;
      errors: string[];
    };

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const DIFFICULTIES = [
  "beginner",
  "intermediate",
  "advanced",
  "exam",
  "expert"
] as const;
const PACK_SOURCES = ["mock", "r2", "webflow_export", "manual"] as const;
const PACK_MODES = ["home", "core", "hub", "word", "exam", "language_pair"] as const;
const PRICE_TIERS = ["free", "lite", "pro", "one_time"] as const;
const TARGET_EXAMS = [
  "academic",
  "ielts",
  "gre",
  "toefl",
  "sat",
  "essay",
  "custom"
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isIsoDateString(value: unknown): value is string {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function isOneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T
): value is T[number] {
  return typeof value === "string" && allowed.includes(value);
}

function pushStringError(
  errors: string[],
  value: unknown,
  fieldPath: string
) {
  if (!isNonEmptyString(value)) {
    errors.push(`${fieldPath} must be a non-empty string.`);
  }
}

function pushStringArrayError(
  errors: string[],
  value: unknown,
  fieldPath: string
) {
  if (!isStringArray(value)) {
    errors.push(`${fieldPath} must be an array of non-empty strings.`);
  }
}

function pushDateError(errors: string[], value: unknown, fieldPath: string) {
  if (!isIsoDateString(value)) {
    errors.push(`${fieldPath} must be an ISO-compatible date string.`);
  }
}

function success<T>(value: T): VlxValidationResult<T> {
  return {
    ok: true,
    value,
    errors: []
  };
}

function failure<T>(errors: string[]): VlxValidationResult<T> {
  return {
    ok: false,
    errors
  };
}

export function isVlxStaticPackPath(
  value: string
): value is VlxStaticPackPath {
  return (
    value === "/quiz-pack/manifest.json" ||
    value === "/quiz-pack/core-v1.json" ||
    value === "/quiz-pack/home-v1.json" ||
    value === "/exam-packs/manifest.json" ||
    value === "/search/search-lite-v1.json" ||
    /^\/quiz-pack\/hubs\/[a-z0-9-]+\.json$/.test(value) ||
    /^\/quiz-pack\/words\/[a-z0-9-]+\.json$/.test(value) ||
    /^\/exam-packs\/[a-z0-9-]+\.json$/.test(value)
  );
}

export function validateStaticPackPath(
  value: unknown,
  fieldPath = "path"
): VlxValidationResult<VlxStaticPackPath> {
  if (typeof value === "string" && isVlxStaticPackPath(value)) {
    return success(value);
  }

  return failure([`${fieldPath} is not a supported Visual Lexicon pack path.`]);
}

export function validateQuizWord(
  value: unknown,
  fieldPath = "word"
): VlxValidationResult<VlxQuizWord> {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return failure([`${fieldPath} must be an object.`]);
  }

  pushStringError(errors, value.slug, `${fieldPath}.slug`);
  pushStringError(errors, value.word, `${fieldPath}.word`);
  pushStringError(errors, value.url, `${fieldPath}.url`);
  pushStringError(errors, value.image, `${fieldPath}.image`);
  pushStringError(errors, value.definition, `${fieldPath}.definition`);
  pushStringError(errors, value.example, `${fieldPath}.example`);
  pushStringError(errors, value.memoryHook, `${fieldPath}.memoryHook`);
  pushStringError(errors, value.hub, `${fieldPath}.hub`);
  pushStringError(errors, value.partOfSpeech, `${fieldPath}.partOfSpeech`);
  pushStringArrayError(errors, value.hubs, `${fieldPath}.hubs`);
  pushStringArrayError(errors, value.relatedWords, `${fieldPath}.relatedWords`);
  pushStringArrayError(
    errors,
    value.confusableWords,
    `${fieldPath}.confusableWords`
  );
  pushStringArrayError(errors, value.distractors, `${fieldPath}.distractors`);
  pushDateError(errors, value.updatedAt, `${fieldPath}.updatedAt`);

  if (!isOneOf(value.cefr, CEFR_LEVELS)) {
    errors.push(`${fieldPath}.cefr must be one of ${CEFR_LEVELS.join(", ")}.`);
  }

  if (!isOneOf(value.difficulty, DIFFICULTIES)) {
    errors.push(
      `${fieldPath}.difficulty must be one of ${DIFFICULTIES.join(", ")}.`
    );
  }

  return errors.length ? failure(errors) : success(value as VlxQuizWord);
}

function validateRecordOfPaths(
  value: unknown,
  fieldPath: string,
  errors: string[]
) {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    errors.push(`${fieldPath} must be a record of pack paths.`);
    return;
  }

  for (const [key, path] of Object.entries(value)) {
    if (!isNonEmptyString(key)) {
      errors.push(`${fieldPath} contains an empty key.`);
    }

    const result = validateStaticPackPath(path, `${fieldPath}.${key}`);
    if (!result.ok) {
      errors.push(...result.errors);
    }
  }
}

export function validateQuizPackManifest(
  value: unknown,
  fieldPath = "manifest"
): VlxValidationResult<VlxQuizPackManifest> {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return failure([`${fieldPath} must be an object.`]);
  }

  pushStringError(errors, value.version, `${fieldPath}.version`);
  pushStringError(errors, value.buildId, `${fieldPath}.buildId`);
  pushDateError(errors, value.builtAt, `${fieldPath}.builtAt`);

  if (!isOneOf(value.source, PACK_SOURCES)) {
    errors.push(`${fieldPath}.source must be one of ${PACK_SOURCES.join(", ")}.`);
  }

  if (!isNonNegativeInteger(value.wordCount)) {
    errors.push(`${fieldPath}.wordCount must be a non-negative integer.`);
  }

  if (!isNonNegativeInteger(value.hubCount)) {
    errors.push(`${fieldPath}.hubCount must be a non-negative integer.`);
  }

  if (!isRecord(value.packs)) {
    errors.push(`${fieldPath}.packs must be an object.`);
  } else {
    for (const directKey of ["core", "home", "searchLite"] as const) {
      const directPath = value.packs[directKey];
      if (directPath !== undefined) {
        const result = validateStaticPackPath(
          directPath,
          `${fieldPath}.packs.${directKey}`
        );
        if (!result.ok) {
          errors.push(...result.errors);
        }
      }
    }

    validateRecordOfPaths(value.packs.hubs, `${fieldPath}.packs.hubs`, errors);
    validateRecordOfPaths(value.packs.words, `${fieldPath}.packs.words`, errors);
    validateRecordOfPaths(
      value.packs.examPacks,
      `${fieldPath}.packs.examPacks`,
      errors
    );
  }

  return errors.length
    ? failure(errors)
    : success(value as VlxQuizPackManifest);
}

export function validateQuizPack(
  value: unknown,
  fieldPath = "pack"
): VlxValidationResult<VlxQuizPack> {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return failure([`${fieldPath} must be an object.`]);
  }

  pushStringError(errors, value.packId, `${fieldPath}.packId`);
  pushStringError(errors, value.title, `${fieldPath}.title`);
  pushStringError(errors, value.description, `${fieldPath}.description`);
  pushDateError(errors, value.updatedAt, `${fieldPath}.updatedAt`);

  if (!isOneOf(value.mode, PACK_MODES)) {
    errors.push(`${fieldPath}.mode must be one of ${PACK_MODES.join(", ")}.`);
  }

  if (value.hub !== undefined) {
    pushStringError(errors, value.hub, `${fieldPath}.hub`);
  }

  if (!Array.isArray(value.words)) {
    errors.push(`${fieldPath}.words must be an array.`);
  } else {
    value.words.forEach((word, index) => {
      const result = validateQuizWord(word, `${fieldPath}.words.${index}`);
      if (!result.ok) {
        errors.push(...result.errors);
      }
    });
  }

  return errors.length ? failure(errors) : success(value as VlxQuizPack);
}

export function validateExamPackManifest(
  value: unknown,
  fieldPath = "examManifest"
): VlxValidationResult<VlxExamPackManifest> {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return failure([`${fieldPath} must be an object.`]);
  }

  pushStringError(errors, value.version, `${fieldPath}.version`);
  pushStringError(errors, value.buildId, `${fieldPath}.buildId`);
  pushDateError(errors, value.builtAt, `${fieldPath}.builtAt`);

  if (!isOneOf(value.source, PACK_SOURCES)) {
    errors.push(`${fieldPath}.source must be one of ${PACK_SOURCES.join(", ")}.`);
  }

  if (!isNonNegativeInteger(value.packCount)) {
    errors.push(`${fieldPath}.packCount must be a non-negative integer.`);
  }

  validateRecordOfPaths(value.packs, `${fieldPath}.packs`, errors);

  return errors.length
    ? failure(errors)
    : success(value as VlxExamPackManifest);
}

export function validateExamPack(
  value: unknown,
  fieldPath = "examPack"
): VlxValidationResult<VlxExamPack> {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return failure([`${fieldPath} must be an object.`]);
  }

  pushStringError(errors, value.packId, `${fieldPath}.packId`);
  pushStringError(errors, value.title, `${fieldPath}.title`);
  pushStringError(errors, value.description, `${fieldPath}.description`);
  pushDateError(errors, value.updatedAt, `${fieldPath}.updatedAt`);

  if (value.subtitle !== undefined) {
    pushStringError(errors, value.subtitle, `${fieldPath}.subtitle`);
  }

  if (value.targetExam !== undefined && !isOneOf(value.targetExam, TARGET_EXAMS)) {
    errors.push(
      `${fieldPath}.targetExam must be one of ${TARGET_EXAMS.join(", ")}.`
    );
  }

  if (!isOneOf(value.priceTier, PRICE_TIERS)) {
    errors.push(
      `${fieldPath}.priceTier must be one of ${PRICE_TIERS.join(", ")}.`
    );
  }

  if (!isNonNegativeInteger(value.freePreviewCount)) {
    errors.push(`${fieldPath}.freePreviewCount must be a non-negative integer.`);
  }

  if (!isNonNegativeInteger(value.wordCount)) {
    errors.push(`${fieldPath}.wordCount must be a non-negative integer.`);
  }

  if (value.days !== undefined && !isNonNegativeInteger(value.days)) {
    errors.push(`${fieldPath}.days must be a non-negative integer.`);
  }

  if (!Array.isArray(value.words)) {
    errors.push(`${fieldPath}.words must be an array.`);
  } else {
    value.words.forEach((word, index) => {
      const result = validateQuizWord(word, `${fieldPath}.words.${index}`);
      if (!result.ok) {
        errors.push(...result.errors);
      }
    });

    if (
      typeof value.wordCount === "number" &&
      value.wordCount !== value.words.length
    ) {
      errors.push(`${fieldPath}.wordCount must match words.length.`);
    }
  }

  if (value.reviewSchedule !== undefined) {
    if (!Array.isArray(value.reviewSchedule)) {
      errors.push(`${fieldPath}.reviewSchedule must be an array.`);
    } else {
      value.reviewSchedule.forEach((day, index) => {
        if (!isRecord(day)) {
          errors.push(`${fieldPath}.reviewSchedule.${index} must be an object.`);
          return;
        }

        if (
          typeof day.day !== "number" ||
          !Number.isInteger(day.day) ||
          day.day < 1
        ) {
          errors.push(
            `${fieldPath}.reviewSchedule.${index}.day must be a positive integer.`
          );
        }

        pushStringError(
          errors,
          day.title,
          `${fieldPath}.reviewSchedule.${index}.title`
        );
        pushStringArrayError(
          errors,
          day.newWords,
          `${fieldPath}.reviewSchedule.${index}.newWords`
        );

        if (day.reviewWords !== undefined) {
          pushStringArrayError(
            errors,
            day.reviewWords,
            `${fieldPath}.reviewSchedule.${index}.reviewWords`
          );
        }
      });
    }
  }

  return errors.length ? failure(errors) : success(value as VlxExamPack);
}

export function validateSearchLiteIndex(
  value: unknown,
  fieldPath = "searchLite"
): VlxValidationResult<VlxSearchLiteIndex> {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return failure([`${fieldPath} must be an object.`]);
  }

  pushStringError(errors, value.version, `${fieldPath}.version`);
  pushStringError(errors, value.buildId, `${fieldPath}.buildId`);
  pushDateError(errors, value.builtAt, `${fieldPath}.builtAt`);

  if (!isOneOf(value.source, PACK_SOURCES)) {
    errors.push(`${fieldPath}.source must be one of ${PACK_SOURCES.join(", ")}.`);
  }

  if (!isNonNegativeInteger(value.wordCount)) {
    errors.push(`${fieldPath}.wordCount must be a non-negative integer.`);
  }

  if (!Array.isArray(value.words)) {
    errors.push(`${fieldPath}.words must be an array.`);
  } else {
    value.words.forEach((word, index) => {
      const wordPath = `${fieldPath}.words.${index}`;

      if (!isRecord(word)) {
        errors.push(`${wordPath} must be an object.`);
        return;
      }

      pushStringError(errors, word.slug, `${wordPath}.slug`);
      pushStringError(errors, word.word, `${wordPath}.word`);
      pushStringError(errors, word.definition, `${wordPath}.definition`);
      pushStringError(errors, word.hub, `${wordPath}.hub`);
      pushStringArrayError(errors, word.hubs, `${wordPath}.hubs`);
      pushStringError(errors, word.image, `${wordPath}.image`);
      pushStringError(errors, word.url, `${wordPath}.url`);
      pushDateError(errors, word.updatedAt, `${wordPath}.updatedAt`);

      if (!isOneOf(word.difficulty, DIFFICULTIES)) {
        errors.push(
          `${wordPath}.difficulty must be one of ${DIFFICULTIES.join(", ")}.`
        );
      }
    });

    if (
      typeof value.wordCount === "number" &&
      value.wordCount !== value.words.length
    ) {
      errors.push(`${fieldPath}.wordCount must match words.length.`);
    }
  }

  return errors.length
    ? failure(errors)
    : success(value as VlxSearchLiteIndex);
}

export function validatePackFilePayload(
  path: string,
  payload: unknown
): VlxValidationResult<VlxPackFilePayload> {
  const pathResult = validateStaticPackPath(path);

  if (!pathResult.ok) {
    return failure(pathResult.errors);
  }

  if (path === "/quiz-pack/manifest.json") {
    return validateQuizPackManifest(payload);
  }

  if (path === "/exam-packs/manifest.json") {
    return validateExamPackManifest(payload);
  }

  if (path === "/search/search-lite-v1.json") {
    return validateSearchLiteIndex(payload);
  }

  if (path.startsWith("/quiz-pack/words/")) {
    return validateQuizWord(payload);
  }

  if (path.startsWith("/exam-packs/")) {
    return validateExamPack(payload);
  }

  return validateQuizPack(payload);
}

export function assertValidPackFilePayload(
  path: string,
  payload: unknown
): VlxPackFilePayload {
  const result = validatePackFilePayload(path, payload);

  if (!result.ok) {
    throw new Error(result.errors.join("\n"));
  }

  return result.value;
}

export const vlxPackContractEnums = {
  cefrLevels: CEFR_LEVELS satisfies readonly VlxCefrLevel[],
  difficulties: DIFFICULTIES satisfies readonly VlxWordDifficulty[],
  packSources: PACK_SOURCES satisfies readonly VlxPackSource[],
  packModes: PACK_MODES satisfies readonly VlxQuizPackMode[],
  priceTiers: PRICE_TIERS satisfies readonly VlxPriceTier[],
  targetExams: TARGET_EXAMS satisfies readonly VlxTargetExam[]
};
