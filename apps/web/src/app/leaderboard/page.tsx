"use client";

import { useEffect, useMemo, useState } from "react";
import { Crown, Radar, Trophy } from "lucide-react";
import { usePublicClient } from "wagmi";
import { useTranslations } from "next-intl";

import { AppShell, MetaBadge } from "@/components/app-shell";
import { LeaderboardTabs } from "@/components/leaderboard-tabs";
import { createOnchainBlockOreAdapter, isBlockOreConfigured } from "@/lib/adapters/onchain-block-ore-adapter";
import type { LeaderboardEntry } from "@/lib/types";
import { activeChain } from "@/lib/web3/chains";
import { useGameStore } from "@/store/game-store";

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const tab = useGameStore((state) => state.selectedLeaderboardTab);
  const selectLeaderboardTab = useGameStore((state) => state.selectLeaderboardTab);
  const currentWallet = useGameStore((state) => state.currentWallet);
  const currentChainId = useGameStore((state) => state.currentChainId);
  const publicClient = usePublicClient({ chainId: currentChainId ?? activeChain.id });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const adapter = useMemo(() => {
    if (!currentChainId || !publicClient || !isBlockOreConfigured(currentChainId)) {
      return undefined;
    }

    return createOnchainBlockOreAdapter({
      chainId: currentChainId,
      publicClient,
      walletAddress: currentWallet,
    });
  }, [currentChainId, currentWallet, publicClient]);

  const resolvedLeaderboard = adapter ? leaderboard : [];

  useEffect(() => {
    if (!adapter) {
      return;
    }

    let cancelled = false;
    const limit = tab === "TOP_10" ? 10 : tab === "TOP_100" ? 100 : 1000;

    const loadLeaderboard = async () => {
      const entries = await adapter.getLeaderboardEntries(limit);
      if (!cancelled) {
        setLeaderboard(entries);
      }
    };

    void loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [adapter, tab]);

  return (
    <AppShell
      aside={
        <div className="grid grid-cols-3 gap-3">
          <MetaBadge icon={<Trophy className="h-4 w-4" />} label={t("tier")} value="Top 10 / 100 / 1000" />
          <MetaBadge icon={<Radar className="h-4 w-4" />} label={t("dataSource")} value={adapter ? "Onchain" : "Disconnected"} />
          <MetaBadge icon={<Crown className="h-4 w-4" />} label={t("sortBy")} value={t("pointsFirst")} />
        </div>
      }
    >
      <LeaderboardTabs tab={tab} onTabChange={selectLeaderboardTab} entries={resolvedLeaderboard} />
    </AppShell>
  );
}
