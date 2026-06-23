"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";
import { CreditCard, Hammer, Shield, Wallet } from "lucide-react";
import { usePublicClient, useWalletClient } from "wagmi";
import { useTranslations } from "next-intl";

import { AppShell, MetaBadge, Panel } from "@/components/app-shell";
import { PickaxeShop } from "@/components/pickaxe-shop";
import { useWalletMode } from "@/components/providers/app-providers";
import { PurchaseReceiptCard } from "@/components/purchase-receipt-card";
import {
  createOnchainBlockOreAdapter,
  isBlockOreConfigured,
  isPaymentTokenConfigured,
  PICKAXE_TIER_CONFIG,
} from "@/lib/adapters/onchain-block-ore-adapter";
import type { PickaxeTier, PurchaseReceipt, UserStats } from "@/lib/types";
import { activeChain } from "@/lib/web3/chains";
import { useGameStore } from "@/store/game-store";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes("User rejected")) {
      return "You cancelled the wallet signature.";
    }

    return error.message;
  }

  return "Purchase failed, please try again later.";
};

const formatUsdc = (value: bigint) => `${formatUnits(value, 6)} USDC`;

function ShopPageView({
  actionLabels,
  canOpenAdmin,
  currentWallet,
  latestReceipt,
  onBuy,
  onCloseReceipt,
  stats,
  buying,
  notice,
}: {
  actionLabels?: Partial<Record<PickaxeTier, string>>;
  canOpenAdmin?: boolean;
  currentWallet?: string;
  latestReceipt?: PurchaseReceipt;
  onBuy: (tier: PickaxeTier) => void;
  onCloseReceipt: () => void;
  stats?: UserStats;
  buying: boolean;
  notice: string;
}) {
  const t = useTranslations("shop");

  return (
    <AppShell
      aside={
        <div className="grid grid-cols-3 gap-3">
          <MetaBadge icon={<Hammer className="h-4 w-4" />} label={t("items")} value="3 档矿镐" />
          <MetaBadge icon={<CreditCard className="h-4 w-4" />} label={t("payment")} value="USDC" />
          <MetaBadge icon={<Wallet className="h-4 w-4" />} label={t("wallet")} value={currentWallet ? t("connected") : t("disconnected")} />
        </div>
      }
    >
      <PurchaseReceiptCard receipt={latestReceipt} onClose={onCloseReceipt} />
      <PickaxeShop actionLabels={actionLabels} disabled={buying} stats={stats} onBuy={onBuy} />

      <Panel>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-cobalt/70">{t("purchaseNotice")}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{t("purchaseNoticeSub")}</h3>
          </div>
          {canOpenAdmin ? (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-cobalt/20 bg-cobalt/10 px-3 py-2 text-xs text-cobalt transition hover:bg-cobalt/15"
            >
              <Shield className="h-4 w-4" />
              {t("adminEntry")}
            </Link>
          ) : null}
        </div>
        <div className="mt-4 space-y-3 text-sm text-white/70">
          <p>{t("freeReset")}</p>
          <p>{t("paidCap")}</p>
          <p>{t("usdcLimit")}</p>
          <p>{notice}</p>
        </div>
      </Panel>
    </AppShell>
  );
}

function MockShopPage() {
  const t = useTranslations("shop");
  const stats = useGameStore((state) => state.stats);
  const currentWallet = useGameStore((state) => state.currentWallet);
  const latestReceipt = useGameStore((state) => state.latestReceipt);
  const connectWallet = useGameStore((state) => state.connectWallet);
  const buyPickaxe = useGameStore((state) => state.buyPickaxe);
  const clearLatestReceipt = useGameStore((state) => state.clearLatestReceipt);

  const handleBuy = (tier: "basic" | "advanced" | "diamond") => {
    if (!currentWallet) {
      connectWallet();
    }
    buyPickaxe(tier);
  };

  return (
    <ShopPageView
      actionLabels={{
        basic: "Local Demo",
        advanced: "Local Demo",
        diamond: "Local Demo",
      }}
      canOpenAdmin
      buying={false}
      currentWallet={currentWallet}
      latestReceipt={latestReceipt}
      notice={t("mockNotice")}
      onBuy={handleBuy}
      onCloseReceipt={clearLatestReceipt}
      stats={stats}
    />
  );
}

function RealShopPage() {
  const t = useTranslations("shop");
  const currentWallet = useGameStore((state) => state.currentWallet);
  const currentChainId = useGameStore((state) => state.currentChainId);
  const latestReceipt = useGameStore((state) => state.latestReceipt);
  const stats = useGameStore((state) => state.stats);
  const clearLatestReceipt = useGameStore((state) => state.clearLatestReceipt);
  const setStats = useGameStore((state) => state.setStats);
  const setLatestReceipt = useGameStore((state) => state.setLatestReceipt);
  const pushToast = useGameStore((state) => state.pushToast);
  const publicClient = usePublicClient({ chainId: currentChainId ?? activeChain.id });
  const { data: walletClient } = useWalletClient({ chainId: currentChainId ?? activeChain.id });
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [buyingTier, setBuyingTier] = useState<PickaxeTier | undefined>();
  const [approvingTier, setApprovingTier] = useState<PickaxeTier | undefined>();
  const [isOwner, setIsOwner] = useState(false);
  const [notice, setNotice] = useState(t("realNotice"));

  const adapter = useMemo(() => {
    if (!currentWallet || !currentChainId || !publicClient) {
      return undefined;
    }

    return createOnchainBlockOreAdapter({
      chainId: currentChainId,
      publicClient,
      walletAddress: currentWallet,
      walletClient,
    });
  }, [currentChainId, currentWallet, publicClient, walletClient]);

  const contractReady = Boolean(
    currentChainId && isBlockOreConfigured(currentChainId) && isPaymentTokenConfigured(currentChainId),
  );

  const actionLabels = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(PICKAXE_TIER_CONFIG).map(([tier, config]) => {
          const typedTier = tier as PickaxeTier;
          if (approvingTier === typedTier) {
            return [typedTier, t("authorizing")];
          }
          if (buyingTier === typedTier) {
            return [typedTier, t("paying")];
          }
          return [
            typedTier,
            allowance < config.price ? t("authorize", { amount: formatUsdc(config.price) }) : t("pay", { amount: formatUsdc(config.price) }),
          ];
        }),
      ) as Partial<Record<PickaxeTier, string>>,
    [allowance, approvingTier, buyingTier, t],
  );

  useEffect(() => {
    if (!adapter || !currentWallet) {
      return;
    }

    let cancelled = false;

    const syncStats = async () => {
      try {
        const [nextStats, nextAllowance, owner] = await Promise.all([
          adapter.getUserStats(currentWallet),
          adapter.getUsdcAllowance(currentWallet),
          adapter.getOwner(),
        ]);
        if (!cancelled) {
          setStats(nextStats);
          setAllowance(nextAllowance);
          setIsOwner(owner.toLowerCase() === currentWallet.toLowerCase());
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(getErrorMessage(error));
        }
      }
    };

    void syncStats();

    return () => {
      cancelled = true;
    };
  }, [adapter, currentWallet, setStats]);

  const handleBuy = async (tier: PickaxeTier) => {
    if (!currentWallet) {
      const message = "Please connect your wallet first before buying a pickaxe.";
      setNotice(message);
      pushToast({ title: "Wallet Required", description: message, tone: "warning" });
      return;
    }

    if (!adapter || !contractReady) {
      const message = "This network's mining zone is not open yet. Switch to a deployed network.";
      setNotice(message);
      pushToast({ title: "Mining Unavailable", description: message, tone: "warning" });
      return;
    }

    try {
      const config = PICKAXE_TIER_CONFIG[tier];
      const currentAllowance = await adapter.getUsdcAllowance(currentWallet);
      setAllowance(currentAllowance);

      if (currentAllowance < config.price) {
        setApprovingTier(tier);
        setNotice(`Please authorize ${formatUsdc(config.price)} for this tier.`);
        await adapter.approveUsdc(tier);
        const nextAllowance = await adapter.getUsdcAllowance(currentWallet);
        setAllowance(nextAllowance);
        setNotice(`Authorization complete: ${formatUsdc(config.price)}. Click the tier again to purchase.`);
        pushToast({
          title: "USDC Authorized",
          description: `Authorized ${formatUsdc(config.price)} for this tier.`,
          tone: "success",
        });
        return;
      }

      setBuyingTier(tier);
      setNotice("Please confirm the USDC purchase in your wallet.");
      const { receipt } = await adapter.buyMiningPass(tier);
      const [nextStats, nextAllowance] = await Promise.all([
        adapter.getUserStats(currentWallet),
        adapter.getUsdcAllowance(currentWallet),
      ]);

      setStats(nextStats);
      setAllowance(nextAllowance);
      setLatestReceipt(receipt);
      setNotice(`${receipt.title} — added ${receipt.minesAdded} paid mining uses.`);
      pushToast({
        title: "Pickaxe Purchased",
        description: `Used ${receipt.price} to complete purchase, added ${receipt.minesAdded} paid mining uses.`,
        tone: "success",
      });
    } catch (error) {
      const message = getErrorMessage(error);
      setNotice(message);
      pushToast({ title: "Purchase Failed", description: message, tone: "warning" });
    } finally {
      setApprovingTier(undefined);
      setBuyingTier(undefined);
    }
  };

  return (
    <ShopPageView
      actionLabels={actionLabels}
      canOpenAdmin={isOwner}
      buying={Boolean(approvingTier || buyingTier)}
      currentWallet={currentWallet}
      latestReceipt={latestReceipt}
      notice={contractReady ? notice : t("contractNotReady")}
      onBuy={(tier) => {
        void handleBuy(tier);
      }}
      onCloseReceipt={clearLatestReceipt}
      stats={stats}
    />
  );
}

export default function ShopPage() {
  const { configured } = useWalletMode();

  return configured ? <RealShopPage /> : <MockShopPage />;
}
