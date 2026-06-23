"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren, ReactNode } from "react";
import {
  Crown,
  Gem,
  Hammer,
  Home,
  Pickaxe,
  Trophy,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ToastStack } from "@/components/toast-stack";
import { WalletSessionCard } from "@/components/wallet-session-card";
import { SettingsPanel } from "@/i18n/settings-panel";
import { useTranslations } from "next-intl";

const useNavItems = () => {
  const t = useTranslations("nav");
  return [
    { href: "/", label: t("home"), icon: Home },
    { href: "/mine", label: t("mine"), icon: Pickaxe },
    { href: "/inventory", label: t("inventory"), icon: Gem },
    { href: "/leaderboard", label: t("leaderboard"), icon: Trophy },
    { href: "/shop", label: t("shop"), icon: Hammer },
  ];
};

type AppShellProps = PropsWithChildren<{
  aside?: ReactNode;
}>;

export function AppShell({
  aside,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const navItems = useNavItems();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060b14] text-[#f0f4f8]">
      <ToastStack />

      {/* 背景层 */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,212,255,0.14),transparent_40%),radial-gradient(circle_at_85%_10%,rgba(255,184,78,0.10),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:32px_32px]" />

      {/* 右上角 - 设置 + 钱包 */}
      <div className="fixed right-4 top-4 z-30 flex items-center gap-2">
        <SettingsPanel />
        <WalletSessionCard />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pb-28 pt-16">
        {aside ? <div className="mb-4">{aside}</div> : null}

        <section className="flex-1 space-y-4">{children}</section>

        {/* 底部导航 */}
        <nav className="fixed bottom-4 left-1/2 z-20 flex w-[calc(100%-24px)] max-w-[398px] -translate-x-1/2 items-center justify-between rounded-full border border-white/[0.08] bg-black/50 px-3 py-3 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-[62px] flex-col items-center gap-1 rounded-full px-3 py-2 text-[11px] transition",
                  active
                    ? "bg-[#00D4FF]/15 text-[#00D4FF]"
                    : "text-white/50 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}

export function Panel({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MetaBadge({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.05] px-2.5 py-2.5">
      <div className="mb-1 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-[#00D4FF]">
        {icon}
      </div>
      <p className="text-[10px] text-white/45">{label}</p>
      <p className="mt-0.5 text-xs font-medium text-white">{value}</p>
    </div>
  );
}

export function BrandChip() {
  const t = useTranslations("home");
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#FFB800]/25 bg-[#FFB800]/10 px-3 py-1.5 text-xs text-[#FFB800]">
      <Crown className="h-3.5 w-3.5" />
      {t("brandChip")}
    </div>
  );
}
