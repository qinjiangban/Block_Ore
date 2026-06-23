import type { Metadata } from "next";
import { Manrope, Oxanium, Geist } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { LocaleProvider } from "@/i18n/locale-provider";
import "./globals.css";
import { cn } from "@/lib/utils";
import { getLocale } from "next-intl/server";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const display = Oxanium({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Block Ore",
  description: "Block Ore - A lightweight mining mini-game",
  other: {
    'base:app_id': '6a0c45691c1db8c69c491b18',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const locale = await getLocale();
  return (
    <html lang={locale} className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`}>

        <LocaleProvider>
          <AppProviders>
            {children}
          </AppProviders>
        </LocaleProvider>
      </body>
    </html>
  );
}
