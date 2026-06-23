"use client";

import { Medal, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";

import { Panel } from "@/components/app-shell";
import type { LeaderboardEntry, LeaderboardTab } from "@/lib/types";
import { cn, formatNumber, shortenAddress } from "@/lib/utils";

const tabs: Array<{ key: LeaderboardTab; label: string; count: number }> = [
  { key: "TOP_10", label: "Top 10", count: 10 },
  { key: "TOP_100", label: "Top 100", count: 100 },
  { key: "TOP_1000", label: "Top 1000", count: 1000 },
];

export function LeaderboardTabs({
  tab,
  onTabChange,
  entries,
}: {
  tab: LeaderboardTab;
  onTabChange: (tab: LeaderboardTab) => void;
  entries: LeaderboardEntry[];
}) {
  const t = useTranslations("leaderboard");
  const selectedCount = tabs.find((item) => item.key === tab)?.count ?? 10;
  const visibleEntries = entries.slice(0, Math.min(entries.length, selectedCount));
  const podium = visibleEntries.slice(0, 3);
  const rest = visibleEntries.slice(3);
  const currentUser = visibleEntries.find((entry) => entry.highlight);

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-cobalt/70">{t("leaderboard")}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{t("pointsRanking")}</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">{t("sortedByPoints")}</div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1.5">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onTabChange(item.key)}
            className={cn(
              "rounded-xl px-3 py-2 text-xs font-medium transition",
              tab === item.key ? "bg-cobalt text-abyss" : "text-white/55 hover:bg-white/5 hover:text-white",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {podium.map((entry) => (
          <div
            key={entry.wallet}
            className={cn(
              "rounded-2xl border p-3 text-center",
              entry.rank === 1 ? "border-gold/40 bg-gold/10" : "border-white/10 bg-white/5",
            )}
          >
            <div className="mx-auto inline-flex rounded-full border border-white/10 bg-black/20 p-2 text-gold">
              <Medal className="h-4 w-4" />
            </div>
            <p className="mt-3 text-xs text-white/45">#{entry.rank}</p>
            <p className="mt-1 text-sm font-medium text-white">{shortenAddress(entry.wallet)}</p>
            <p className="mt-2 text-lg font-semibold text-white">{formatNumber(entry.points)}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {rest.map((entry) => (
          <div
            key={entry.wallet}
            className={cn(
              "flex items-center justify-between rounded-2xl border p-3",
              entry.highlight ? "border-cobalt/35 bg-cobalt/10" : "border-white/10 bg-white/5",
            )}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-2 text-white/70">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{shortenAddress(entry.wallet)}</p>
                <p className="text-xs text-white/45">
                  {entry.totalMines} {t("mines")} · {t("digDiamond", { diamond: entry.diamondCount })} · {t("digGenesis", { genesis: entry.genesisCount })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/45">#{entry.rank}</p>
              <p className="text-sm font-medium text-white">{formatNumber(entry.points)}</p>
            </div>
          </div>
        ))}
      </div>

      {currentUser ? (
        <div className="mt-4 rounded-2xl border border-cobalt/35 bg-cobalt/10 p-4">
          <p className="text-xs text-cobalt/70">{t("myRank")}</p>
          <p className="mt-2 text-sm text-white">{t("currentRank", { rank: currentUser.rank })}</p>
        </div>
      ) : null}
    </Panel>
  );
}
