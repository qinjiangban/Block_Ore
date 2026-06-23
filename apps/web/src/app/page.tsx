"use client";

import Link from "next/link";
import { ArrowUpRight, Gem, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { AppShell, BrandChip, Panel } from "@/components/app-shell";
import { PlayerStatsCard } from "@/components/player-stats-card";
import { oreMeta } from "@/lib/game-data";
import { useBlockOreAdapter } from "@/lib/adapters/provider";
import type { ActivityFeedItem } from "@/lib/types";

const truncateWallet = (wallet: string) =>
  `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

export default function HomePage() {
  const t = useTranslations("home");
  const { adapter } = useBlockOreAdapter();
  const [activity, setActivity] = useState<ActivityFeedItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const items = await adapter?.getRecentActivity(20) ?? [];
      if (!cancelled) {
        setActivity(items);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [adapter]);

  return (
    <AppShell>
      <PlayerStatsCard />

      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-cobalt/70">{t("quickEntry")}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{t("coreEntry")}</h3>
          </div>
          <BrandChip />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link href="/inventory" className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cobalt/35 hover:bg-cobalt/10">
            <Gem className="h-5 w-5 text-cobalt" />
            <p className="mt-4 text-sm font-medium text-white">{t("myOres")}</p>
            <p className="mt-1 text-xs text-white/45">{t("viewInventory")}</p>
          </Link>
          <Link href="/leaderboard" className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-gold/35 hover:bg-gold/10">
            <Trophy className="h-5 w-5 text-gold" />
            <p className="mt-4 text-sm font-medium text-white">{t("leaderboard")}</p>
            <p className="mt-1 text-xs text-white/45">{t("leaderboardDesc")}</p>
          </Link>
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-cobalt/70">{t("todayIntel")}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{t("veinIntel")}</h3>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-1 text-xs text-cobalt">
            {t("goToShop")}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {Object.entries(oreMeta).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className={`text-sm font-medium ${value.accent}`}>{value.label}</p>
              <p className="mt-2 text-xl font-semibold text-white">{value.chance}</p>
              <p className="text-xs text-white/45">{value.points} {t("points")}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <p className="text-xs text-cobalt/70">{t("liveFeed")}</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{t("recentOnchainBattles")}</h3>

        {activity.length === 0 && (
          <p className="mt-4 text-sm text-white/35">{t("noActivity")}</p>
        )}

        <div className="mt-4 space-y-3">
          {activity.map((item) => {
            const meta = oreMeta[item.oreType as keyof typeof oreMeta];
            return (
              <Link
                key={item.id}
                href={`/player/${item.wallet}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {truncateWallet(item.wallet)}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {t("mined")} <span className={meta?.accent ?? "text-white/60"}>{item.oreType}</span> · +{item.pointsAwarded}
                  </p>
                </div>
                <span className="text-xs text-white/35">{item.createdAt}</span>
              </Link>
            );
          })}
        </div>
      </Panel>
    </AppShell>
  );
}
