"use client";

import { ReceiptText, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Panel } from "@/components/app-shell";
import type { PurchaseReceipt } from "@/lib/types";

export function PurchaseReceiptCard({
  receipt,
  onClose,
}: {
  receipt?: PurchaseReceipt;
  onClose: () => void;
}) {
  const t = useTranslations("purchaseReceipt");

  if (!receipt) {
    return null;
  }

  return (
    <Panel className="border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(249,184,78,0.18),transparent_32%),rgba(23,27,39,0.88)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-gold/20 bg-gold/10 p-3 text-gold">
            <ReceiptText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gold/70">{t("title")}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{receipt.title}</h3>
            <p className="mt-1 text-sm text-white/55">{receipt.createdAt} · {t("minesAdded", { count: receipt.minesAdded })}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/65 transition hover:bg-white/10"
        >
          {t("dismiss")}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs text-white/45">{t("pickaxeTier")}</p>
          <p className="mt-2 text-sm font-medium capitalize text-white">{receipt.tier}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs text-white/45">{t("paymentAmount")}</p>
          <p className="mt-2 text-sm font-medium text-white">{receipt.price}</p>
          <p className="mt-1 text-xs text-white/45">{t("paymentMethod")} {receipt.paymentSymbol}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-gold">
        <Sparkles className="h-4 w-4" />
        {t("receiptNote")}
      </div>
    </Panel>
  );
}
