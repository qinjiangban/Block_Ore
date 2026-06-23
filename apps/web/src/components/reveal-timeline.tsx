"use client";

import { CheckCircle2, LoaderCircle, Radar, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import type { MineSession } from "@/lib/types";
import { Panel } from "@/components/app-shell";
import { shortenAddress } from "@/lib/utils";

type RevealTimelineProps = {
  latestMine?: MineSession;
  wallet?: string;
  onReveal: () => void;
};

export function RevealTimeline({ latestMine, wallet, onReveal }: RevealTimelineProps) {
  const t = useTranslations("revealTimeline");
  const status = latestMine?.status ?? "idle";

  const steps = [
    {
      title: t("submitRequest"),
      description: latestMine ? `区块 #${latestMine.requestBlock}` : t("submitDesc"),
      done: ["waiting", "revealable", "revealing", "done"].includes(status),
      active: status === "pending",
      icon: LoaderCircle,
    },
    {
      title: t("waitingBlock"),
      description: latestMine ? `剩余 ${latestMine.waitBlocksRemaining} 个区块` : t("waitDesc"),
      done: ["revealable", "revealing", "done"].includes(status),
      active: status === "waiting",
      icon: Radar,
    },
    {
      title: t("executeReveal"),
      description: status === "revealable" ? t("revealReady") : t("revealWait"),
      done: status === "done",
      active: ["revealable", "revealing"].includes(status),
      icon: Sparkles,
    },
  ];

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-cobalt/70">{t("title")}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{t("title")}</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
          {shortenAddress(wallet)}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {steps.map((step) => {
          const Icon = step.done ? CheckCircle2 : step.icon;
          return (
            <div key={step.title} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 p-3">
              <div className="mt-0.5 rounded-xl border border-white/10 bg-black/25 p-2 text-cobalt">
                <Icon className={`h-4 w-4 ${step.active ? "animate-spin" : ""}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{step.title}</p>
                <p className="mt-1 text-xs text-white/45">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onReveal}
        disabled={status !== "revealable"}
        className="mt-4 w-full rounded-2xl border border-gold/30 bg-gold/90 px-4 py-3 text-sm font-semibold text-abyss transition disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/8 disabled:text-white/35"
      >
        {status === "revealable" ? t("btnReveal") : t("btnWaiting")}
      </button>
    </Panel>
  );
}
