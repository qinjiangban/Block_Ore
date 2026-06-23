import type { Locale } from "./constants";
import { defaultLocale } from "./constants";

const localeMap: Record<string, Locale> = {
  en: "en",
  "en-US": "en",
  "en-GB": "en",
  "en-AU": "en",
  zh: "zh-Hans",
  "zh-CN": "zh-Hans",
  "zh-SG": "zh-Hans",
  "zh-Hans": "zh-Hans",
  "zh-TW": "zh-Hant",
  "zh-HK": "zh-Hant",
  "zh-MO": "zh-Hant",
  "zh-Hant": "zh-Hant",
  ja: "ja",
  "ja-JP": "ja",
  ko: "ko",
  "ko-KR": "ko",
  fr: "fr",
  "fr-FR": "fr",
  "fr-CA": "fr",
  "fr-BE": "fr",
  es: "es",
  "es-ES": "es",
  "es-MX": "es",
};

/** Map a browser language tag to a supported locale. Falls back to defaultLocale. */
export function detectLocale(lang: string): Locale {
  // Try exact match first
  if (localeMap[lang]) return localeMap[lang];

  // Try matching the primary language subtag (e.g. "zh" from "zh-CN")
  const primary = lang.split("-")[0];
  if (localeMap[primary]) return localeMap[primary];

  return defaultLocale;
}

/** Parse Accept-Language header and return the first supported locale. */
export function detectLocaleFromHeaders(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  // accept-language format: "en-US,en;q=0.9,zh-CN;q=0.8"
  const tags = acceptLanguage
    .split(",")
    .map((entry) => {
      const [tag] = entry.trim().split(";");
      return tag.trim();
    })
    .filter(Boolean);

  for (const tag of tags) {
    const mapped = detectLocale(tag);
    if (mapped !== defaultLocale) return mapped;
  }

  // If no supported locale found among high-quality matches,
  // check if any tag maps at all (including to en)
  for (const tag of tags) {
    const mapped = detectLocale(tag);
    if (mapped) return mapped;
  }

  return defaultLocale;
}
