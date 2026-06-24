"use client";

import { useEffect } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useGameContext } from "@/store/game-context";

const toneStyles = {
  info: "border-cobalt/25 bg-cobalt/10 text-cobalt",
  success: "border-gold/25 bg-gold/10 text-gold",
  warning: "border-alert/25 bg-alert/10 text-alert",
} as const;

const toneIcons = {
  info: Info,
  success: CheckCircle2,
  warning: CircleAlert,
} as const;

export function ToastStack() {
  const t = useTranslations("wallet");
  const { toasts, dismissToast } = useGameContext();

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      dismissToast(toasts[0].id);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [dismissToast, toasts]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto flex w-full max-w-[430px] flex-col gap-2 px-4">
      {toasts.map((toast) => {
        const Icon = toneIcons[toast.tone];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-black/75 p-3 shadow-panel backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <div className={cn("mt-0.5 rounded-xl border p-2", toneStyles[toast.tone])}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{toast.title}</p>
                <p className="mt-1 text-xs text-white/55">{toast.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-full p-1 text-white/45 transition hover:bg-white/10 hover:text-white"
              aria-label={t("closeNotification")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
