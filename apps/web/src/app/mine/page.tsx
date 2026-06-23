"use client";

import { useEffect, useMemo, useState } from "react";
import { Blocks, CircleAlert, Pickaxe } from "lucide-react";
import { usePublicClient, useWalletClient } from "wagmi";
import { useTranslations } from "next-intl";

import { AppShell, MetaBadge, Panel } from "@/components/app-shell";
import { useWalletMode } from "@/components/providers/app-providers";
import { MineCrystal } from "@/components/mine-crystal";
import { OreResultCard } from "@/components/ore-result-card";
import { RevealTimeline } from "@/components/reveal-timeline";
import {
  BLOCK_ORE_REVEAL_DELAY_BLOCKS,
  createOnchainBlockOreAdapter,
  getOnchainMineStatus,
  getWaitBlocksRemaining,
  isBlockOreConfigured,
} from "@/lib/adapters/onchain-block-ore-adapter";
import type { MineSession, RevealReward, UserStats } from "@/lib/types";
import { activeChain } from "@/lib/web3/chains";
import { useGameStore } from "@/store/game-store";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes("User rejected")) {
      return "You cancelled the wallet signature.";
    }

    return error.message;
  }

  return "Onchain request failed, please try again later.";
};

function MinePageView({
  currentBlock,
  currentWallet,
  lastReward,
  latestMine,
  mining,
  onMine,
  onReveal,
  stats,
  toast,
}: {
  currentBlock: number;
  currentWallet?: string;
  lastReward?: RevealReward;
  latestMine?: MineSession;
  mining: boolean;
  onMine: () => void;
  onReveal: () => void;
  stats?: UserStats;
  toast: string;
}) {
  const t = useTranslations("mine");
  const statusText = useMemo(() => {
    if (!latestMine) {
      return t("waitingToStart");
    }
    if (latestMine.status === "pending") {
      return t("confirmingTx");
    }
    if (latestMine.status === "waiting") {
      return t("waitingBlocks", { blocks: latestMine.waitBlocksRemaining });
    }
    if (latestMine.status === "revealable") {
      return t("canReveal");
    }
    if (latestMine.status === "revealing") {
      return t("revealing");
    }
    if (latestMine.status === "done") {
      return t("completed");
    }
    return latestMine.status;
  }, [latestMine, t]);

  return (
    <AppShell
      aside={
        <div className="grid grid-cols-3 gap-3">
          <MetaBadge
            icon={<Pickaxe className="h-4 w-4" />}
            label={t("remainingMines")}
            value={`${stats ? stats.remainingFreeMines + stats.remainingPaidMines : "--"}`}
          />
          <MetaBadge icon={<Blocks className="h-4 w-4" />} label={t("chainBlock")} value={`#${currentBlock}`} />
          <MetaBadge icon={<CircleAlert className="h-4 w-4" />} label={t("status")} value={statusText} />
        </div>
      }
    >
      <MineCrystal
        mining={mining}
        disabled={Boolean(mining || (latestMine && ["pending", "waiting", "revealable", "revealing"].includes(latestMine.status)))}
        onMine={onMine}
      />

      <RevealTimeline latestMine={latestMine} wallet={currentWallet} onReveal={onReveal} />
      <OreResultCard reward={lastReward} />

      <Panel>
        <p className="text-xs text-cobalt/70">{t("statusFeed")}</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{t("txFeedback")}</h3>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white">{toast}</p>
          {latestMine ? (
            <div className="mt-3 space-y-2 text-xs text-white/45">
              <p>{t("requestBlock")}：#{latestMine.requestBlock}</p>
              <p>Nonce：{latestMine.nonce}</p>
              <p className="break-all">{t("txHash")}：{latestMine.txHash}</p>
            </div>
          ) : null}
        </div>
      </Panel>
    </AppShell>
  );
}

function MockMinePage() {
  const currentWallet = useGameStore((state) => state.currentWallet);
  const currentBlock = useGameStore((state) => state.currentBlock);
  const latestMine = useGameStore((state) => state.latestMine);
  const lastReward = useGameStore((state) => state.lastReward);
  const stats = useGameStore((state) => state.stats);
  const connectWallet = useGameStore((state) => state.connectWallet);
  const startMining = useGameStore((state) => state.startMining);
  const setMineWaiting = useGameStore((state) => state.setMineWaiting);
  const tickMineBlock = useGameStore((state) => state.tickMineBlock);
  const revealLatestMine = useGameStore((state) => state.revealLatestMine);
  const [mining, setMining] = useState(false);
  const [toast, setToast] = useState<string>("Tap the crystal to start today's mining cycle.");

  useEffect(() => {
    if (latestMine?.status !== "waiting") {
      return;
    }

    const timer = window.setInterval(() => {
      tickMineBlock();
    }, 1000);

    return () => window.clearInterval(timer);
  }, [latestMine?.status, tickMineBlock]);

  const handleMine = () => {
    if (!currentWallet) {
      connectWallet();
      setToast("Wallet connected. Tap the crystal again to start mining.");
      return;
    }

    const result = startMining();
    if (!result.ok) {
      setToast(result.reason ?? "Cannot start mining");
      return;
    }

    setMining(true);
    setToast("Rock is breaking, resolving blocks in 2 seconds...");

    window.setTimeout(() => {
      setMineWaiting();
      setMining(false);
      setToast("Resolving blocks...");
    }, 2000);
  };

  const handleReveal = () => {
    revealLatestMine();
    setToast("Reveal complete! Rewards credited to this round.");
  };

  return (
    <MinePageView
      currentBlock={currentBlock}
      currentWallet={currentWallet}
      lastReward={lastReward}
      latestMine={latestMine}
      mining={mining}
      onMine={handleMine}
      onReveal={handleReveal}
      stats={stats}
      toast={toast}
    />
  );
}

function RealMinePage() {
  const currentWallet = useGameStore((state) => state.currentWallet);
  const currentChainId = useGameStore((state) => state.currentChainId);
  const currentBlock = useGameStore((state) => state.currentBlock);
  const latestMine = useGameStore((state) => state.latestMine);
  const lastReward = useGameStore((state) => state.lastReward);
  const stats = useGameStore((state) => state.stats);
  const setStats = useGameStore((state) => state.setStats);
  const setLatestMineSession = useGameStore((state) => state.setLatestMineSession);
  const setLastReward = useGameStore((state) => state.setLastReward);
  const setCurrentBlock = useGameStore((state) => state.setCurrentBlock);
  const prependActivity = useGameStore((state) => state.prependActivity);
  const pushToast = useGameStore((state) => state.pushToast);
  const publicClient = usePublicClient({ chainId: currentChainId ?? activeChain.id });
  const { data: walletClient } = useWalletClient({ chainId: currentChainId ?? activeChain.id });
  const [mining, setMining] = useState(false);
  const [toast, setToast] = useState<string>("Connect wallet to start on-chain mining.");

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

  const contractReady = Boolean(currentChainId && isBlockOreConfigured(currentChainId));

  useEffect(() => {
    if (!adapter || !currentWallet) {
      return;
    }

    let cancelled = false;

    const syncFromChain = async () => {
      try {
        const [nextStats, nextMine, blockNumber] = await Promise.all([
          adapter.getUserStats(currentWallet),
          adapter.getLatestMine(currentWallet),
          adapter.getCurrentBlock(),
        ]);

        if (cancelled) {
          return;
        }

        setStats(nextStats);
        setCurrentBlock(blockNumber);
        if (nextMine || useGameStore.getState().latestMine?.status !== "done") {
          setLatestMineSession(nextMine);
        }
      } catch (error) {
        if (!cancelled) {
          setToast(getErrorMessage(error));
        }
      }
    };

    void syncFromChain();

    return () => {
      cancelled = true;
    };
  }, [adapter, currentWallet, setCurrentBlock, setLatestMineSession, setStats]);

  useEffect(() => {
    if (!adapter) {
      return;
    }

    let cancelled = false;

    const syncBlock = async () => {
      try {
        const blockNumber = await adapter.getCurrentBlock();
        if (cancelled) {
          return;
        }

        setCurrentBlock(blockNumber);

        const snapshot = useGameStore.getState().latestMine;
        if (!snapshot || !["waiting", "revealable"].includes(snapshot.status)) {
          return;
        }

        setLatestMineSession({
          ...snapshot,
          waitBlocksRemaining: getWaitBlocksRemaining(snapshot.requestBlock, blockNumber),
          status: getOnchainMineStatus(snapshot.requestBlock, blockNumber),
        });
      } catch {
        // 区块轮询失败不阻塞页面交互，下次轮询继续同步。
      }
    };

    void syncBlock();
    const timer = window.setInterval(() => {
      void syncBlock();
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [adapter, setCurrentBlock, setLatestMineSession]);

  const handleMine = async () => {
    if (!currentWallet) {
      const message = "Please connect your wallet first to mine.";
      setToast(message);
      pushToast({ title: "Wallet Required", description: message, tone: "warning" });
      return;
    }

    if (!adapter || !contractReady) {
      const message = "This network's mining zone is not open yet. Switch to a deployed network.";
      setToast(message);
      pushToast({ title: "Mining Unavailable", description: message, tone: "warning" });
      return;
    }

    if (latestMine && ["pending", "waiting", "revealable", "revealing"].includes(latestMine.status)) {
      const message = "The current on-chain mining round hasn't finished yet.";
      setToast(message);
      pushToast({ title: "In Progress", description: message, tone: "warning" });
      return;
    }

    setMining(true);
    setToast("Please confirm the mining transaction in your wallet.");

    try {
      const mined = await adapter.mine();
      const [nextStats, blockNumber] = await Promise.all([adapter.getUserStats(currentWallet), adapter.getCurrentBlock()]);

      setStats(nextStats);
      setLastReward(undefined);
      setCurrentBlock(blockNumber);
      setLatestMineSession({
        nonce: mined.nonce,
        requestBlock: mined.requestBlock,
        waitBlocksRemaining: getWaitBlocksRemaining(mined.requestBlock, blockNumber),
        status: getOnchainMineStatus(mined.requestBlock, blockNumber),
        txHash: mined.txHash,
      });

      const message = `Request on-chain, waiting ${BLOCK_ORE_REVEAL_DELAY_BLOCKS} blocks before Reveal.`;
      setToast(message);
      pushToast({
        title: "Mining Request Sent",
        description: `Nonce #${mined.nonce} submitted, waiting for blocks.`,
        tone: "info",
      });
    } catch (error) {
      const message = getErrorMessage(error);
      setToast(message);
      pushToast({ title: "Mining Failed", description: message, tone: "warning" });
    } finally {
      setMining(false);
    }
  };

  const handleReveal = async () => {
    if (!currentWallet || !adapter || !latestMine) {
      return;
    }

    setLatestMineSession({
      ...latestMine,
      status: "revealing",
    });
    setToast("请在钱包中确认 Reveal 交易。");

    try {
      const { reward, txHash } = await adapter.reveal(latestMine.nonce);
      const [nextStats, blockNumber] = await Promise.all([adapter.getUserStats(currentWallet), adapter.getCurrentBlock()]);

      setStats(nextStats);
      setCurrentBlock(blockNumber);
      setLastReward(reward);
      setLatestMineSession({
        ...latestMine,
        waitBlocksRemaining: 0,
        status: "done",
        txHash,
      });
      prependActivity({
        id: `${Date.now()}`,
        wallet: currentWallet,
        oreType: reward.oreType,
        pointsAwarded: reward.pointsAwarded,
        createdAt: "刚刚",
      });

      const message = reward.mintedNft ? `${reward.title} — Rare NFT triggered!` : `${reward.title} — Points credited on-chain.`;
      setToast(message);
      pushToast({
        title: reward.mintedNft ? "Rare Reward Unlocked" : "Reveal Complete",
        description: message,
        tone: "success",
      });
    } catch (error) {
      const blockNumber = adapter ? await adapter.getCurrentBlock().catch(() => currentBlock) : currentBlock;
      setLatestMineSession({
        ...latestMine,
        waitBlocksRemaining: getWaitBlocksRemaining(latestMine.requestBlock, blockNumber),
        status: getOnchainMineStatus(latestMine.requestBlock, blockNumber),
      });

      const message = getErrorMessage(error);
      setToast(message);
      pushToast({ title: "Reveal 失败", description: message, tone: "warning" });
    }
  };

  return (
    <MinePageView
      currentBlock={currentBlock}
      currentWallet={currentWallet}
      lastReward={lastReward}
      latestMine={latestMine}
      mining={mining}
      onMine={() => {
        void handleMine();
      }}
      onReveal={() => {
        void handleReveal();
      }}
      stats={stats}
      toast={contractReady ? toast : "Current network not configured for Block Ore contract."}
    />
  );
}

export default function MinePage() {
  const { configured } = useWalletMode();

  return configured ? <RealMinePage /> : <MockMinePage />;
}
