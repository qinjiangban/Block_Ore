"use client";

import { ChevronRight, Hammer } from "lucide-react";
import { useTranslations } from "next-intl";

import { Panel } from "@/components/app-shell";
import { pickaxeOffers } from "@/lib/game-data";
import type { PickaxeTier, UserStats } from "@/lib/types";

export function PickaxeShop({
  actionLabels,
  disabled = false,
  stats,
  onBuy,
}: {
  actionLabels?: Partial<Record<PickaxeTier, string>>;
  disabled?: boolean;
  stats?: UserStats;
  onBuy: (tier: PickaxeTier) => void;
}) {
  const t = useTranslations("shop");

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-cobalt/70">{t("pickaxeShop")}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{t("pickaxeShopSub")}</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
          {t("paidRemaining", { count: stats?.remainingPaidMines ?? 0 })}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {pickaxeOffers.map((offer) => (
          <button
            key={offer.id}
            type="button"
            disabled={disabled}
            onClick={() => onBuy(offer.id)}
            className={`w-full rounded-[26px] border border-white/10 bg-gradient-to-br ${offer.accent} p-4 text-left transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-2 text-white">
                  <Hammer className="h-4 w-4" />
                </div>
                <p className="mt-3 text-lg font-semibold text-white">{offer.name}</p>
                <p className="mt-1 text-sm text-white/75">{offer.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/70" />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
              <div>
                <p className="text-xs text-white/45">{t("price")}</p>
                <p className="text-sm font-medium text-white">{offer.price}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/45">{actionLabels?.[offer.id] ? t("currentAction") : t("addMines")}</p>
                <p className="text-sm font-medium text-white">
                  {actionLabels?.[offer.id] ?? `+${offer.mines}`}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}
