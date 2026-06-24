import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import type { Locale } from "./constants";
import { defaultLocale } from "./constants";

const legacyMap: Record<string, Locale> = {
  "zh-CN": "zh-Hans",
  "zh-TW": "zh-Hant",
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;

  const locale: Locale = rawLocale
    ? ((legacyMap[rawLocale] ?? rawLocale) as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
