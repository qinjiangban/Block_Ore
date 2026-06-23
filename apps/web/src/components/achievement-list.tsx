"use client";

import { CheckCircle2, CircleDashed } from "lucide-react";
import { useTranslations } from "next-intl";

import { Panel } from "@/components/app-shell";
import type { Achievement } from "@/lib/types";

export function AchievementList({ achievements }: { achievements: Achievement[] }) {
  const t = useTranslations("achievements");

  return (
    <Panel>
      <p className="text-xs text-cobalt/70">{t("title")}</p>
      <h3 className="mt-2 text-lg font-semibold text-white">{t("system")}</h3>

      <div className="mt-4 space-y-3">
        {achievements.map((achievement) => {
          const progress = Math.min((achievement.current / achievement.target) * 100, 100);
          return (
            <div key={achievement.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{achievement.title}</p>
                  <p className="mt-1 text-xs text-white/45">{achievement.description}</p>
                </div>
                <div className={achievement.unlocked ? "text-gold" : "text-white/35"}>
                  {achievement.unlocked ? <CheckCircle2 className="h-5 w-5" /> : <CircleDashed className="h-5 w-5" />}
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-gradient-to-r from-cobalt via-gold to-gold" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-white/45">
                {achievement.current} / {achievement.target}
              </p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
