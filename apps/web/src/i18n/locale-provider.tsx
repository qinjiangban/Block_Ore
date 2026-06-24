"use client";

import { type PropsWithChildren } from "react";
import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import type { Locale } from "./constants";

export function LocaleProvider({
  children,
  locale,
  messages,
}: PropsWithChildren<{
  locale: Locale;
  messages: AbstractIntlMessages;
}>) {
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
