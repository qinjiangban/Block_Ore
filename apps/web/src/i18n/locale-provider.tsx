"use client";

import { useEffect, useState, type PropsWithChildren } from "react";
import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { useLocaleStore } from "./locale-store";
import type { Locale } from "./constants";

// 静态导入所有翻译，打包嵌入 bundle，无异步无网络请求
// 服务端和客户端始终使用同一份数据，根除 hydration 不匹配
import en from "../../messages/en.json";
import zhCN from "../../messages/zh-Hans.json";
import zhTW from "../../messages/zh-Hant.json";
import ja from "../../messages/ja.json";
import ko from "../../messages/ko.json";
import fr from "../../messages/fr.json";
import es from "../../messages/es.json";

const allMessages: Record<Locale, AbstractIntlMessages> = {
  en,
  "zh-Hans": zhCN,
  "zh-Hant": zhTW,
  ja,
  ko,
  fr,
  es,
};

export function LocaleProvider({
  children,
  initialLocale,
}: PropsWithChildren<{
  initialLocale: Locale;
}>) {
  const storeLocale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  // 首次客户端渲染时，用服务端 locale 覆盖 store（防止 localStorage 持久化的旧值干扰）
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    if (!synced && initialLocale !== storeLocale) {
      setLocale(initialLocale);
    }
    setSynced(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // SSR/首次渲染用服务端 locale；hydrate 完成后用 store locale（与用户设置联动）
  const locale = !synced ? initialLocale : storeLocale;
  const messages = allMessages[locale];

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      onError={() => { }}
      getMessageFallback={({ key }) => key}
    >
      {children}
    </NextIntlClientProvider>
  );
}
