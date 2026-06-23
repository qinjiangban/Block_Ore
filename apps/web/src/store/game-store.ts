"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  achievementsFromStats,
  createReward,
  miningProbabilities,
} from "@/lib/game-data";
import type {
  Achievement,
  ActivityFeedItem,
  LeaderboardEntry,
  LeaderboardTab,
  MineSession,
  OreType,
  PickaxeTier,
  PurchaseReceipt,
  RevealReward,
  ToastMessage,
  UserStats,
} from "@/lib/types";

type PendingReward = {
  reward: RevealReward;
};

type GameStore = {
  currentWallet?: `0x${string}`;
  currentChainId?: number;
  currentChainName?: string;
  stats?: UserStats;
  achievements: Achievement[];
  latestMine?: MineSession;
  lastReward?: RevealReward;
  latestReceipt?: PurchaseReceipt;
  pendingReward?: PendingReward;
  currentBlock: number;
  activity: ActivityFeedItem[];
  toasts: ToastMessage[];
  selectedLeaderboardTab: LeaderboardTab;
  inventoryModalOpen: boolean;
  shopOpen: boolean;
  connectWallet: () => void;
  disconnectWallet: () => void;
  startMining: () => { ok: boolean; reason?: string };
  setMineWaiting: () => void;
  tickMineBlock: () => void;
  revealLatestMine: () => void;
  buyPickaxe: (tier: PickaxeTier) => void;
  selectLeaderboardTab: (tab: LeaderboardTab) => void;
  setInventoryOpen: (open: boolean) => void;
  setShopOpen: (open: boolean) => void;
  setStats: (stats?: UserStats) => void;
  setLatestMineSession: (mine?: MineSession) => void;
  setLastReward: (reward?: RevealReward) => void;
  setLatestReceipt: (receipt?: PurchaseReceipt) => void;
  setCurrentBlock: (block: number) => void;
  prependActivity: (item: ActivityFeedItem) => void;
  pushToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;
  clearLatestReceipt: () => void;
  syncWalletSession: (session: {
    wallet?: `0x${string}`;
    chainId?: number;
    chainName?: string;
  }) => void;
  leaderboard: () => LeaderboardEntry[];
};

const offerMineMap: Record<PickaxeTier, number> = {
  basic: 10,
  advanced: 50,
  diamond: 100,
};

const pickOre = (): OreType => {
  const total = miningProbabilities.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.floor(Math.random() * total);

  for (const item of miningProbabilities) {
    cursor -= item.weight;
    if (cursor < 0) {
      return item.oreType;
    }
  }

  return "STONE";
};

const buildAchievements = (stats?: UserStats) =>
  stats ? achievementsFromStats(stats) : [];

const createToast = (
  title: string,
  description: string,
  tone: ToastMessage["tone"],
): ToastMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title,
  description,
  tone,
});

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      currentWallet: undefined,
      currentChainId: undefined,
      currentChainName: undefined,
      stats: undefined,
      achievements: [],
      latestMine: undefined,
      lastReward: undefined,
      latestReceipt: undefined,
      pendingReward: undefined,
      currentBlock: 0,
      activity: [],
      toasts: [],
      selectedLeaderboardTab: "TOP_10",
      inventoryModalOpen: false,
      shopOpen: false,
      connectWallet: () => {
        const wallet = get().currentWallet;
        if (!wallet) return;

        set({
          currentWallet: wallet,
          currentChainId: get().currentChainId,
          currentChainName: get().currentChainName,
          toasts: [
            createToast(
              "Wallet Connected",
              "Ready to start on-chain mining.",
              "success",
            ),
            ...get().toasts,
          ].slice(0, 3),
        });
      },
      disconnectWallet: () =>
        set({
          currentWallet: undefined,
          currentChainId: undefined,
          currentChainName: undefined,
          latestMine: undefined,
          lastReward: undefined,
          latestReceipt: undefined,
          pendingReward: undefined,
          toasts: [
            createToast("钱包已断开", "已退出当前矿工会话。", "info"),
            ...get().toasts,
          ].slice(0, 3),
        }),
      startMining: () => {
        const state = get();
        if (!state.currentWallet || !state.stats) {
          set({
            toasts: [
              createToast("尚未连接钱包", "先连接钱包再发起挖矿。", "warning"),
              ...state.toasts,
            ].slice(0, 3),
          });
          return { ok: false, reason: "Connect your wallet first" };
        }

        if (
          state.latestMine &&
          ["pending", "waiting", "revealable", "revealing"].includes(
            state.latestMine.status,
          )
        ) {
          set({
            toasts: [
              createToast(
                "In Progress",
                "Current mining round hasn't finished.",
                "warning",
              ),
              ...state.toasts,
            ].slice(0, 3),
          });
          return { ok: false, reason: "Current mining flow is not complete" };
        }

        if (
          state.stats.remainingFreeMines + state.stats.remainingPaidMines <=
          0
        ) {
          set({
            toasts: [
              createToast("今日次数已满", "去商店补充矿镐后继续。", "warning"),
              ...state.toasts,
            ].slice(0, 3),
          });
          return { ok: false, reason: "今日次数已满" };
        }

        const oreType = pickOre();
        const reward = createReward(oreType);
        const requestBlock = state.currentBlock + 1;

        const updatedStats: UserStats = {
          ...state.stats,
          remainingFreeMines:
            state.stats.remainingFreeMines > 0
              ? state.stats.remainingFreeMines - 1
              : state.stats.remainingFreeMines,
          remainingPaidMines:
            state.stats.remainingFreeMines > 0
              ? state.stats.remainingPaidMines
              : Math.max(state.stats.remainingPaidMines - 1, 0),
        };

        set({
          currentBlock: requestBlock,
          latestMine: {
            nonce: state.stats.totalMines + 1,
            requestBlock,
            waitBlocksRemaining: 3,
            status: "pending",
            txHash: `0x${"0".repeat(64)}`,
          },
          pendingReward: { reward },
          lastReward: undefined,
          stats: updatedStats,
          achievements: buildAchievements(updatedStats),
          toasts: [
            createToast(
              "Mining Request Submitted",
              `Request block #{requestBlock}, waiting for 3 blocks.`,
              "info",
            ),
            ...state.toasts,
          ].slice(0, 3),
        });

        return { ok: true };
      },
      setMineWaiting: () => {
        const latestMine = get().latestMine;
        if (!latestMine || latestMine.status !== "pending") {
          return;
        }

        set({
          latestMine: {
            ...latestMine,
            status: "waiting",
          },
        });
      },
      tickMineBlock: () => {
        const state = get();
        if (!state.latestMine || state.latestMine.status !== "waiting") {
          return;
        }

        const waitBlocksRemaining = Math.max(
          state.latestMine.waitBlocksRemaining - 1,
          0,
        );
        set({
          currentBlock: state.currentBlock + 1,
          latestMine: {
            ...state.latestMine,
            waitBlocksRemaining,
            status: waitBlocksRemaining === 0 ? "revealable" : "waiting",
          },
        });
      },
      revealLatestMine: () => {
        const state = get();
        if (
          !state.stats ||
          !state.latestMine ||
          !state.pendingReward ||
          state.latestMine.status !== "revealable"
        ) {
          return;
        }

        const reward = state.pendingReward.reward;
        const updatedStats: UserStats = {
          ...state.stats,
          points: state.stats.points + reward.pointsAwarded,
          totalMines: state.stats.totalMines + 1,
          oreCounts: {
            ...state.stats.oreCounts,
            [reward.oreType]: state.stats.oreCounts[reward.oreType] + 1,
          },
          unlockedNfts:
            reward.mintedNft &&
            !state.stats.unlockedNfts.includes(reward.oreType)
              ? [...state.stats.unlockedNfts, reward.oreType]
              : state.stats.unlockedNfts,
        };

        const nextActivity: ActivityFeedItem = {
          id: `${Date.now()}`,
          wallet: state.currentWallet ?? state.stats.wallet,
          oreType: reward.oreType,
          pointsAwarded: reward.pointsAwarded,
          createdAt: "just now",
        };

        set({
          stats: updatedStats,
          achievements: buildAchievements(updatedStats),
          pendingReward: undefined,
          lastReward: reward,
          latestMine: {
            ...state.latestMine,
            waitBlocksRemaining: 0,
            status: "done",
          },
          activity: [nextActivity, ...state.activity].slice(0, 8),
          toasts: [
            createToast(
              reward.mintedNft ? "Rare Reward Unlocked" : "Reveal Complete",
              reward.mintedNft
                ? `${reward.title} — NFT earned!`
                : `${reward.title} — points credited.`,
              "success",
            ),
            ...state.toasts,
          ].slice(0, 3),
        });
      },
      buyPickaxe: (tier) => {
        const state = get();
        if (!state.currentWallet || !state.stats) {
          set({
            toasts: [
              createToast(
                "Connect Wallet",
                "Connect before purchasing.",
                "warning",
              ),
              ...state.toasts,
            ].slice(0, 3),
          });
          return;
        }

        const purchased = Math.min(
          100 - state.stats.remainingPaidMines,
          offerMineMap[tier],
        );
        if (purchased <= 0) {
          set({
            toasts: [
              createToast(
                "Paid Mines Full",
                "Max 100 paid mines per day.",
                "warning",
              ),
              ...state.toasts,
            ].slice(0, 3),
          });
          return;
        }

        const updatedStats = {
          ...state.stats,
          remainingPaidMines:
            state.stats.remainingPaidMines + Math.max(purchased, 0),
        };

        set({
          stats: updatedStats,
          achievements: buildAchievements(updatedStats),
          latestReceipt: {
            id: `${Date.now()}`,
            tier,
            title:
              tier === "basic"
                ? "普通矿镐到账"
                : tier === "advanced"
                  ? "高级矿镐到账"
                  : "钻石矿镐到账",
            price:
              tier === "basic"
                ? "1.99 USDC"
                : tier === "advanced"
                  ? "8.99 USDC"
                  : "16.99 USDC",
            paymentSymbol: "USDC",
            minesAdded: purchased,
            createdAt: "刚刚",
          },
          toasts: [
            createToast(
              "Pickaxe Purchased",
              `Added ${purchased} paid mining uses.`,
              "success",
            ),
            ...state.toasts,
          ].slice(0, 3),
        });
      },
      selectLeaderboardTab: (tab) => set({ selectedLeaderboardTab: tab }),
      setInventoryOpen: (open) => set({ inventoryModalOpen: open }),
      setShopOpen: (open) => set({ shopOpen: open }),
      setStats: (stats) =>
        set({ stats, achievements: buildAchievements(stats) }),
      setLatestMineSession: (latestMine) => set({ latestMine }),
      setLastReward: (lastReward) => set({ lastReward }),
      setLatestReceipt: (latestReceipt) => set({ latestReceipt }),
      setCurrentBlock: (currentBlock) => set({ currentBlock }),
      prependActivity: (item) =>
        set((state) => ({ activity: [item, ...state.activity].slice(0, 8) })),
      pushToast: (toast) =>
        set((state) => ({
          toasts: [
            createToast(toast.title, toast.description, toast.tone),
            ...state.toasts,
          ].slice(0, 3),
        })),
      dismissToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((item) => item.id !== id),
        })),
      clearLatestReceipt: () => set({ latestReceipt: undefined }),
      syncWalletSession: ({ wallet, chainId, chainName }) =>
        set({
          currentWallet: wallet,
          currentChainId: chainId,
          currentChainName: chainName,
        }),
      leaderboard: () => {
        const state = get();
        if (!state.stats) return [];

        return [
          {
            wallet: state.stats.wallet,
            points: state.stats.points,
            totalMines: state.stats.totalMines,
            diamondCount: state.stats.oreCounts.DIAMOND,
            genesisCount: state.stats.oreCounts.GENESIS,
            rank: 1,
            highlight: true,
          },
        ];
      },
    }),
    {
      name: "block-ore-store",
      partialize: (state) => ({
        currentWallet: state.currentWallet,
        currentChainId: state.currentChainId,
        currentChainName: state.currentChainName,
        stats: state.stats,
        achievements: state.achievements,
        currentBlock: state.currentBlock,
        activity: state.activity,
        selectedLeaderboardTab: state.selectedLeaderboardTab,
        latestReceipt: state.latestReceipt,
      }),
    },
  ),
);
