"use client";

import { useState } from "react";
import { Copy, Share2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Panel } from "@/components/app-shell";
import type { UserStats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export function ShareBattleCard({ stats }: { stats?: UserStats }) {
  const t = useTranslations("shareBattle");
  const [copied, setCopied] = useState(false);

  const shareText = stats
    ? t("shareTemplate", {
        points: formatNumber(stats.points),
        mines: stats.totalMines,
        gold: stats.oreCounts.GOLD,
        diamond: stats.oreCounts.DIAMOND,
      })
    : t("placeholder");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-cobalt/70">{t("title")}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{t("shareBattle")}</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 p-2 text-cobalt">
          <Share2 className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(77,168,255,0.18),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/45">Block Ore</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
              {stats ? formatNumber(stats.points) : "--"}
            </p>
            <p className="text-xs text-white/45">{t("currentPoints")}</p>
          </div>
          <div className="rounded-2xl border border-gold/25 bg-gold/10 p-3 text-gold">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-white/45">{t("mining")}</p>
            <p className="mt-2 text-lg font-semibold text-white">{stats?.totalMines ?? "--"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-white/45">{t("gold")}</p>
            <p className="mt-2 text-lg font-semibold text-gold">{stats?.oreCounts.GOLD ?? "--"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-white/45">{t("diamond")}</p>
            <p className="mt-2 text-lg font-semibold text-diamond">{stats?.oreCounts.DIAMOND ?? "--"}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-white/70">{shareText}</p>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cobalt/35 bg-cobalt/15 px-4 py-3 text-sm font-medium text-cobalt transition hover:bg-cobalt/20"
      >
        <Copy className="h-4 w-4" />
        {copied ? t("copied") : t("copyText")}
      </button>
    </Panel>
  );
}
