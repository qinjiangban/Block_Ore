"use client";

import { useEffect, useMemo, useState } from "react";
import { Gem, ShieldCheck, Sparkles } from "lucide-react";
import { usePublicClient, useWalletClient } from "wagmi";
import { useTranslations } from "next-intl";

import { AchievementList } from "@/components/achievement-list";
import { AppShell, MetaBadge } from "@/components/app-shell";
import { useWalletMode } from "@/components/providers/app-providers";
import { OreInventoryGrid } from "@/components/ore-inventory-grid";
import { ShareBattleCard } from "@/components/share-battle-card";
import { createOnchainBlockOreAdapter, isBlockOreConfigured } from "@/lib/adapters/onchain-block-ore-adapter";
import { achievementsFromStats } from "@/lib/game-data";
import type { Achievement, OwnedNftAsset, UserStats } from "@/lib/types";
import { activeChain } from "@/lib/web3/chains";
import { useGameContext } from "@/store/game-context";

export default function InventoryPage() {
  const t = useTranslations("inventory");
  const { configured } = useWalletMode();
  const { currentWallet, currentChainId, stats: storeStats, achievements: storeAchievements, setStats } = useGameContext();
  const publicClient = usePublicClient({ chainId: currentChainId ?? activeChain.id });
  const { data: walletClient } = useWalletClient({ chainId: currentChainId ?? activeChain.id });
  const [stats, setLocalStats] = useState<UserStats | undefined>(storeStats);
  const [achievements, setAchievements] = useState<Achievement[]>(storeAchievements);
  const [nftAssets, setNftAssets] = useState<OwnedNftAsset[]>([]);

  const adapter = useMemo(() => {
    if (!configured || !currentWallet || !currentChainId || !publicClient) {
      return undefined;
    }

    return createOnchainBlockOreAdapter({
      chainId: currentChainId,
      publicClient,
      walletAddress: currentWallet,
      walletClient,
    });
  }, [configured, currentChainId, currentWallet, publicClient, walletClient]);

  const resolvedStats = adapter ? stats : storeStats;
  const resolvedAchievements = adapter ? achievements : storeAchievements;
  const resolvedNftAssets = adapter ? nftAssets : [];

  useEffect(() => {
    if (!adapter || !currentWallet || !currentChainId || !isBlockOreConfigured(currentChainId)) {
      return;
    }

    let cancelled = false;

    const syncInventory = async () => {
      const [nextStats, nextNfts] = await Promise.all([
        adapter.getUserStats(currentWallet),
        adapter.getOwnedNfts(currentWallet),
      ]);
      if (cancelled) {
        return;
      }
      setLocalStats(nextStats);
      setStats(nextStats);
      setAchievements(achievementsFromStats(nextStats));
      setNftAssets(nextNfts);
    };

    void syncInventory();

    return () => {
      cancelled = true;
    };
  }, [adapter, currentChainId, currentWallet, setStats]);

  return (
    <AppShell
      aside={
        <div className="grid grid-cols-3 gap-3">
          <MetaBadge icon={<Gem className="h-4 w-4" />} label={t("oreTypes")} value="6 类" />
          <MetaBadge icon={<ShieldCheck className="h-4 w-4" />} label={t("nftCount")} value={`${resolvedNftAssets.length}`} />
          <MetaBadge icon={<Sparkles className="h-4 w-4" />} label={t("achievements")} value={`${resolvedAchievements.filter((item) => item.unlocked).length} / ${resolvedAchievements.length || 5}`} />
        </div>
      }
    >
      <OreInventoryGrid nftAssets={resolvedNftAssets} stats={resolvedStats} />
      <AchievementList achievements={resolvedAchievements} />
      <ShareBattleCard stats={resolvedStats} />
    </AppShell>
  );
}
