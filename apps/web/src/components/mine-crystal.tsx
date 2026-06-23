"use client";

import { motion } from "framer-motion";
import { Pickaxe } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type MineCrystalProps = {
  mining: boolean;
  disabled?: boolean;
  onMine: () => void;
};

export function MineCrystal({ mining, disabled, onMine }: MineCrystalProps) {
  const t = useTranslations("mine");

  return (
    <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(77,168,255,0.2),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(255,255,255,0.25)_1px,transparent_1px)] [background-size:24px_24px]" />
      <motion.button
        type="button"
        onClick={onMine}
        disabled={disabled}
        animate={
          mining
            ? { scale: [1, 1.08, 0.92, 1.04, 1], rotate: [0, -6, 5, -3, 0] }
            : { scale: [1, 1.03, 1], y: [0, -8, 0] }
        }
        transition={mining ? { duration: 2, ease: "easeInOut" } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "relative h-52 w-52 rounded-[34%] border border-white/20 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.95),rgba(117,165,255,0.55)_22%,rgba(71,93,183,0.5)_46%,rgba(24,30,56,0.94)_80%)] shadow-[0_0_60px_rgba(77,168,255,0.35)] transition",
          disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:scale-[1.02]",
        )}
      >
        <span className="absolute inset-4 rounded-[30%] border border-white/10" />
        <span className="absolute left-8 top-10 h-14 w-14 rounded-full bg-white/55 blur-xl" />
        <span className="absolute bottom-8 right-7 h-16 w-16 rounded-full bg-cobalt/40 blur-2xl" />
        <span className="absolute inset-x-6 bottom-6 h-4 rounded-full bg-white/20 blur-md" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="rounded-full border border-white/10 bg-black/20 p-4 text-white/95 shadow-glow">
            <Pickaxe className="h-8 w-8" />
          </span>
        </span>
      </motion.button>

      <div className="absolute bottom-6 flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium text-white">{mining ? t("crystalMining") : t("crystalClick")}</p>
        <p className="text-xs text-white/45">{mining ? t("crystalDescActive") : t("crystalDesc")}</p>
      </div>
    </div>
  );
}
