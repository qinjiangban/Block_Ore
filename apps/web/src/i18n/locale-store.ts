import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "./constants";
import { defaultLocale } from "./constants";
import { detectLocale } from "./detect";

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return defaultLocale;

  // Try navigator.languages first (preferred order), then navigator.language
  const langs = navigator.languages ?? [navigator.language];
  for (const lang of langs) {
    const mapped = detectLocale(lang);
    if (mapped !== defaultLocale) return mapped;
  }
  // Fall back to mapping the first language (may return defaultLocale)
  return detectLocale(langs[0] ?? "");
}

type LocaleStore = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const initialState: Pick<LocaleStore, "locale"> = {
  locale: detectBrowserLocale(),
};

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      ...initialState,
      setLocale: (locale: Locale) => {
        document.cookie = `locale=${locale};path=/;max-age=31536000;SameSite=Lax`;
        set({ locale });
      },
    }),
    {
      name: "block-ore-locale",
      partialize: (state) => ({ locale: state.locale }),
    },
  ),
);
