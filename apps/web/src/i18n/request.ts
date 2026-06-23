import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import type { Locale } from "./constants";
import { defaultLocale } from "./constants";
import { detectLocaleFromHeaders } from "./detect";

const legacyMap: Record<string, Locale> = {
  "zh-CN": "zh-Hans",
  "zh-TW": "zh-Hant",
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("locale")?.value as Locale | undefined;

  const locale: Locale = rawLocale
    ? ((legacyMap[rawLocale] ?? rawLocale) as Locale)
    : detectLocaleFromHeaders((await headers()).get("accept-language"));

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
