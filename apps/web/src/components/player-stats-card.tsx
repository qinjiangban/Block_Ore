"use client";

import { ArrowUpRight, Pickaxe, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Panel } from "@/components/app-shell";
import { useGameStore } from "@/store/game-store";
import { formatNumber } from "@/lib/utils";

export function PlayerStatsCard() {
  const t = useTranslations("playerStats");
  const stats = useGameStore((state) => state.stats);

  return (
    <Panel className="overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(77,168,255,0.24),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-cobalt/80">{t("playerCore")}</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[28px] font-semibold tracking-[0.06em]">
            {stats ? formatNumber(stats.points) : "--"}
          </h2>
          <p className="mt-1 text-sm text-white/55">{t("currentPoints")}</p>
        </div>
        <div className="rounded-full border border-cobalt/30 bg-cobalt/10 px-3 py-2 text-xs text-cobalt">
          {t("todayLimit")}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <Zap className="h-4 w-4 text-gold" />
          <p className="mt-4 text-xl font-semibold text-white">{stats ? stats.remainingFreeMines + stats.remainingPaidMines : "--"}</p>
          <p className="text-xs text-white/45">{t("todayRemaining")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <Pickaxe className="h-4 w-4 text-cobalt" />
          <p className="mt-4 text-xl font-semibold text-white">{stats ? formatNumber(stats.totalMines) : "--"}</p>
          <p className="text-xs text-white/45">{t("totalMines")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <Sparkles className="h-4 w-4 text-diamond" />
          <p className="mt-4 text-xl font-semibold text-white">
            {stats ? stats.oreCounts.DIAMOND + stats.oreCounts.GENESIS : "--"}
          </p>
          <p className="text-xs text-white/45">{t("rareOres")}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3">
        <Link
          href="/mine"
          className="group inline-flex items-center justify-between rounded-2xl border border-cobalt/35 bg-cobalt px-4 py-4 text-sm font-semibold text-abyss transition hover:scale-[0.99]"
        >
          <span>{t("startMining")}</span>
          <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </Panel>
  );
}
