const localWordVisuals: Record<string, string> = {
  abundance: "/vlx-word-visuals/abundance.png",
  dissonance: "/vlx-word-visuals/dissonance.png",
  lucid: "/vlx-word-visuals/lucid.png",
  obfuscate: "/vlx-word-visuals/obfuscate.png",
  resilient: "/vlx-word-visuals/resilient.png"
};

function normalizeSlug(slug: string) {
  return slug.trim().toLocaleLowerCase();
}

export function getWordVisualImage(slug: string) {
  return localWordVisuals[normalizeSlug(slug)];
}

export function getWordVisualFallbackClass(slug: string) {
  const normalizedSlug = normalizeSlug(slug);

  return localWordVisuals[normalizedSlug]
    ? ` word-card__visual--${normalizedSlug}`
    : "";
}
