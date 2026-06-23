"use client";

import { Gem, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Panel } from "@/components/app-shell";
import { oreMeta } from "@/lib/game-data";
import type { OwnedNftAsset, UserStats } from "@/lib/types";

export function OreInventoryGrid({
  nftAssets = [],
  stats,
}: {
  nftAssets?: OwnedNftAsset[];
  stats?: UserStats;
}) {
  const t = useTranslations("inventory");
  const entries = Object.entries(oreMeta);
  const diamondNfts = nftAssets.filter((item) => item.oreType === "DIAMOND");
  const genesisNfts = nftAssets.filter((item) => item.oreType === "GENESIS");

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-cobalt/70">{t("oreVault")}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{t("myOres")}</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/65">
          {t("total")} {stats ? Object.values(stats.oreCounts).reduce((sum, value) => sum + value, 0) : "--"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-start justify-between">
              <div className="rounded-xl border border-white/10 bg-black/20 p-2 text-cobalt">
                <Gem className="h-4 w-4" />
              </div>
              <span className={`text-sm font-medium ${value.accent}`}>{value.label}</span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">{stats ? stats.oreCounts[key as keyof UserStats["oreCounts"]] : "--"}</p>
            <p className="mt-1 text-xs text-white/45">
              {value.points} 积分 / {value.chance}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-diamond/20 bg-diamond/10 p-4">
          <div className="inline-flex rounded-xl bg-diamond/20 p-2 text-diamond">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <p className="mt-3 text-sm font-medium text-white">{t("diamondNft")}</p>
          <p className="mt-1 text-xs text-white/55">
            {diamondNfts.length > 0
              ? `${t("owned")} ${diamondNfts.length} 枚 · ${diamondNfts.map((item) => `#${item.tokenId}`).join(" / ")}`
              : t("waitingFirstDiamond")}
          </p>
        </div>
        <div className="rounded-2xl border border-genesis/20 bg-genesis/10 p-4">
          <div className="inline-flex rounded-xl bg-genesis/20 p-2 text-genesis">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <p className="mt-3 text-sm font-medium text-white">{t("genesisNft")}</p>
          <p className="mt-1 text-xs text-white/55">
            {genesisNfts.length > 0
              ? `${t("owned")} ${genesisNfts.length} 枚 · ${genesisNfts.map((item) => `#${item.tokenId}`).join(" / ")}`
              : t("waitingGenesisStrike")}
          </p>
        </div>
      </div>
    </Panel>
  );
}
