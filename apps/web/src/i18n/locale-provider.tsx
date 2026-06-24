"use client";

import { useEffect, useState, type PropsWithChildren } from "react";
import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { useLocaleStore } from "./locale-store";
import type { Locale } from "./constants";

const messageCache = new Map<Locale, AbstractIntlMessages>();

function loadMessages(locale: Locale): Promise<AbstractIntlMessages> {
  const cached = messageCache.get(locale);
  if (cached) return Promise.resolve(cached);

  return import(`../../messages/${locale}.json`).then((mod) => {
    const messages = mod.default as AbstractIntlMessages;
    messageCache.set(locale, messages);
    return messages;
  });
}

export function LocaleProvider({
  children,
  initialLocale,
  initialMessages,
}: PropsWithChildren<{
  initialLocale?: Locale;
  initialMessages?: AbstractIntlMessages;
}>) {
  const locale = useLocaleStore((s) => s.locale);
  const [messages, setMessages] = useState<AbstractIntlMessages | null>(
    initialMessages ?? null,
  );

  useEffect(() => {
    loadMessages(locale).then(setMessages);
  }, [locale]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages ?? {}}
      onError={() => {}}
      getMessageFallback={({ key }) => key}
    >
      {children}
    </NextIntlClientProvider>
  );
}
