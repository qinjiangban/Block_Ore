"use client";

import { Gem, Orbit, Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { Panel } from "@/components/app-shell";
import { oreMeta } from "@/lib/game-data";
import type { RevealReward } from "@/lib/types";

export function OreResultCard({ reward }: { reward?: RevealReward }) {
  const t = useTranslations("oreResult");

  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-cobalt/70">{t("lastReveal")}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{reward ? reward.title : t("pendingResult")}</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 p-3 text-gold">
          {reward?.oreType === "GENESIS" ? <Orbit className="h-5 w-5" /> : reward?.mintedNft ? <Star className="h-5 w-5" /> : <Gem className="h-5 w-5" />}
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
        {reward ? (
          <>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className={`text-2xl font-semibold ${oreMeta[reward.oreType].accent}`}>{oreMeta[reward.oreType].label}</p>
                <p className="mt-2 text-sm text-white/55">{reward.quote}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/45">{t("pointsAwarded")}</p>
                <p className="text-2xl font-semibold text-gold">+{reward.pointsAwarded}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/45">{t("nftQualification")}</p>
                <p className="mt-1 text-sm text-white">{reward.mintedNft ? t("nftTriggered") : t("noNft")}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/45">{t("rarityChance")}</p>
                <p className="mt-1 text-sm text-white">{oreMeta[reward.oreType].chance}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/45">
            {t("placeholder")}
          </div>
        )}
      </div>
    </Panel>
  );
}
